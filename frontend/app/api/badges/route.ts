import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BADGES_FILE = path.join(process.cwd(), 'data', 'badges.json');

function readBadges() {
  if (!fs.existsSync(BADGES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(BADGES_FILE, 'utf8');
  return JSON.parse(data);
}

function writeBadges(badges: any[]) {
  fs.writeFileSync(BADGES_FILE, JSON.stringify(badges, null, 2));
}

// GET all badges
export async function GET() {
  try {
    const badges = readBadges();
    return NextResponse.json({ success: true, badges });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load badges' }, { status: 500 });
  }
}

// POST — create a new custom badge
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const criteria = formData.get('criteria') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name || !description) {
      return NextResponse.json({ success: false, message: 'Name and description are required' }, { status: 400 });
    }

    let imagePath = '/badges/default-custom.png';

    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split('.').pop() || 'png';
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const filename = `custom-${slug}-${Date.now()}.${ext}`;
      const publicDir = path.join(process.cwd(), 'public', 'badges');

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(path.join(publicDir, filename), buffer);
      imagePath = `/badges/${filename}`;
    }

    const badges = readBadges();
    const newBadge = {
      id: `badge-custom-${Date.now()}`,
      name,
      description,
      criteria: criteria || '',
      imagePath,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    badges.push(newBadge);
    writeBadges(badges);

    return NextResponse.json({ success: true, badge: newBadge });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json({ success: false, message: 'Failed to create badge' }, { status: 500 });
  }
}

// DELETE — remove a custom badge (prevent deleting defaults)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get('id');

    if (!badgeId) {
      return NextResponse.json({ success: false, message: 'Badge ID is required' }, { status: 400 });
    }

    const badges = readBadges();
    const badge = badges.find((b: any) => b.id === badgeId);

    if (!badge) {
      return NextResponse.json({ success: false, message: 'Badge not found' }, { status: 404 });
    }

    if (badge.isDefault) {
      return NextResponse.json({ success: false, message: 'Cannot delete default badges' }, { status: 403 });
    }

    // Remove the uploaded image file if it exists
    if (badge.imagePath && badge.imagePath.startsWith('/badges/custom-')) {
      const imgPath = path.join(process.cwd(), 'public', badge.imagePath);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    const updated = badges.filter((b: any) => b.id !== badgeId);
    writeBadges(updated);

    // Also remove this badge from all students' earnedBadges
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      let changed = false;
      users.forEach((u: any) => {
        if (u.earnedBadges && Array.isArray(u.earnedBadges)) {
          const before = u.earnedBadges.length;
          u.earnedBadges = u.earnedBadges.filter((eb: any) => eb.badgeId !== badgeId);
          if (u.earnedBadges.length !== before) changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      }
    }

    return NextResponse.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete badge' }, { status: 500 });
  }
}
