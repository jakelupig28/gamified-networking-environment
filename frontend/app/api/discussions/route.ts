import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Restricted words list
const RESTRICTED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'crap', 'bastard', 'idiot', 'stupid',
  'dumb', 'hate', 'kill', 'die', 'threat', 'scam', 'spam', 'abuse',
  'vulgar', 'malicious', 'offensive', 'hack', 'steal', 'cheat', 'cunt', 'dick'
];

function containsRestrictedWords(message: string): boolean {
  const cleanMsg = message.toLowerCase();
  for (const word of RESTRICTED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(cleanMsg)) {
      return true;
    }
  }
  return false;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleIdStr = searchParams.get('moduleId') || '0';
    const moduleId = parseInt(moduleIdStr) || 0;

    const filePath = path.join(process.cwd(), 'data', 'discussions.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileData);

    const modulePosts = posts.filter((p: any) => (p.moduleId || 0) === moduleId);
    return NextResponse.json({ success: true, posts: modulePosts });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error loading posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleId, email, name, message, isWarning } = body;
    const targetModuleId = moduleId !== undefined ? parseInt(moduleId) : 0;

    if (!email || !name || !message || !message.trim()) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    if (containsRestrictedWords(message)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Your message contains prohibited or inappropriate content and was blocked by the system moderation filter.' 
      }, { status: 400 });
    }

    // Lookup role from users.json to attach to the post
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    const role = user ? user.role : 'Student';

    const targetIsWarning = isWarning && (role === 'Professor' || role === 'Admin');

    const filePath = path.join(process.cwd(), 'data', 'discussions.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileData);

    const newPost = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      moduleId: targetModuleId,
      email,
      name: targetIsWarning ? role : name,
      role,
      message: message.trim(),
      isWarning: targetIsWarning,
      createdAt: new Date().toISOString()
    };

    posts.push(newPost);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error creating post' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdStr = searchParams.get('postId');
    const moderatorEmail = searchParams.get('email');

    if (!postIdStr || !moderatorEmail) {
      return NextResponse.json({ success: false, message: 'Missing postId or email' }, { status: 400 });
    }
    const postId = parseInt(postIdStr);

    // Verify moderator role
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const moderator = usersData.find((u: any) => u.email.toLowerCase() === moderatorEmail.toLowerCase());

    if (!moderator || (moderator.role !== 'Professor' && moderator.role !== 'Admin')) {
      return NextResponse.json({ success: false, message: 'Access denied: only moderators can delete posts' }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'data', 'discussions.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    let posts = JSON.parse(fileData);

    const index = posts.findIndex((p: any) => p.id === postId);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    posts.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error deleting post' }, { status: 500 });
  }
}
