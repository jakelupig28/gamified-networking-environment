import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);
    
    // Omit passwords for security
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      isFirstLogin: u.isFirstLogin
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, role, firstName, lastName } = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    const exists = users.find((u: any) => u.email === email);
    if (exists) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const newUser = {
      id: Date.now(),
      email,
      password,
      role,
      name: `${firstName} ${lastName}`,
      isFirstLogin: true // Force password change on first login
    };

    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, message: 'User created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
