import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);
    
    // Omit passwords for security
    const safeUsers = users.map((u: any) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role, firstName, lastName, ...rest } = body;
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    const exists = users.find((u: any) => u.email === email);
    if (exists) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const newUser = {
      ...rest,
      id: Date.now(),
      email,
      password: password || 'changeme123', // default password if not provided
      role: role || 'Student',
      name: `${firstName || ''} ${lastName || ''}`.trim() || email,
      isFirstLogin: true,
      status: rest.status || 'pending'
    };

    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, message: 'User created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
