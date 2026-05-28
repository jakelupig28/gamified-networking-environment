import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    let users = JSON.parse(fileData);

    let updated = false;
    users = users.map((u: any) => {
      if (u.email === email) {
        updated = true;
        return { ...u, password: newPassword, isFirstLogin: false };
      }
      return u;
    });

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
