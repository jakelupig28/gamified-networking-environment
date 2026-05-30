import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'modules.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    const modules = JSON.parse(fileData);
    return NextResponse.json({ success: true, modules });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error loading modules' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modules } = body;
    if (!Array.isArray(modules)) {
      return NextResponse.json({ success: false, message: 'Invalid data format: modules must be an array' }, { status: 400 });
    }
    const filePath = path.join(process.cwd(), 'data', 'modules.json');
    fs.writeFileSync(filePath, JSON.stringify(modules, null, 2));
    return NextResponse.json({ success: true, message: 'Modules updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error saving modules' }, { status: 500 });
  }
}
