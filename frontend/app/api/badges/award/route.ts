import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const BADGES_FILE = path.join(process.cwd(), 'data', 'badges.json');

function readUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readBadges() {
  if (!fs.existsSync(BADGES_FILE)) return [];
  const data = fs.readFileSync(BADGES_FILE, 'utf8');
  return JSON.parse(data);
}

// POST — award a badge to a student
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { badgeId, studentEmail, awardedBy } = body;

    if (!badgeId || !studentEmail) {
      return NextResponse.json({ success: false, message: 'Badge ID and student email are required' }, { status: 400 });
    }

    // Verify badge exists
    const badges = readBadges();
    const badge = badges.find((b: any) => b.id === badgeId);
    if (!badge) {
      return NextResponse.json({ success: false, message: 'Badge not found' }, { status: 404 });
    }

    const users = readUsers();
    const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === studentEmail.toLowerCase());
    if (userIdx === -1) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (users[userIdx].role !== 'Student') {
      return NextResponse.json({ success: false, message: 'Can only award badges to students' }, { status: 400 });
    }

    // Initialize earnedBadges if needed
    if (!users[userIdx].earnedBadges) {
      users[userIdx].earnedBadges = [];
    }

    // Check if already awarded
    const alreadyAwarded = users[userIdx].earnedBadges.some((eb: any) => eb.badgeId === badgeId);
    if (alreadyAwarded) {
      return NextResponse.json({ success: false, message: 'Badge already awarded to this student' }, { status: 400 });
    }

    users[userIdx].earnedBadges.push({
      badgeId,
      awardedAt: new Date().toISOString(),
      awardedBy: awardedBy || 'Professor',
    });

    writeUsers(users);

    return NextResponse.json({ success: true, message: 'Badge awarded successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to award badge' }, { status: 500 });
  }
}

// DELETE — revoke a badge from a student
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get('badgeId');
    const studentEmail = searchParams.get('studentEmail');

    if (!badgeId || !studentEmail) {
      return NextResponse.json({ success: false, message: 'Badge ID and student email are required' }, { status: 400 });
    }

    const users = readUsers();
    const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === studentEmail.toLowerCase());
    if (userIdx === -1) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (!users[userIdx].earnedBadges || !Array.isArray(users[userIdx].earnedBadges)) {
      return NextResponse.json({ success: false, message: 'Student has no badges' }, { status: 400 });
    }

    const before = users[userIdx].earnedBadges.length;
    users[userIdx].earnedBadges = users[userIdx].earnedBadges.filter((eb: any) => eb.badgeId !== badgeId);

    if (users[userIdx].earnedBadges.length === before) {
      return NextResponse.json({ success: false, message: 'Badge not found on student' }, { status: 404 });
    }

    writeUsers(users);

    return NextResponse.json({ success: true, message: 'Badge revoked successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to revoke badge' }, { status: 500 });
  }
}
