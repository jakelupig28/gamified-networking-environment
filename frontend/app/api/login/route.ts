import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    const user = users.find((u: any) => u.email === email && u.password === password && u.role === role);

    if (user) {
      return NextResponse.json({ 
        success: true, 
        user: { email: user.email, role: user.role, isFirstLogin: user.isFirstLogin, name: user.name } 
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid credentials or role' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
