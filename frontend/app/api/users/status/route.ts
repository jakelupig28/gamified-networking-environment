import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(req: Request) {
  try {
    const { id, ids, status, rejectMessage, subject, term } = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    if (ids && Array.isArray(ids)) {
      // Batch update status for multiple students
      let updatedCount = 0;
      ids.forEach((currId: any) => {
        const userIndex = users.findIndex((u: any) => u.id === currId);
        if (userIndex !== -1) {
          users[userIndex] = { 
            ...users[userIndex], 
            status, 
            rejectMessage: rejectMessage || "",
            ...(status === 'admitted' && subject ? { admittedSubject: subject } : {}),
            ...(status === 'admitted' && term ? { admittedTerm: term } : {})
          };
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      }
      return NextResponse.json({ success: true, message: `${updatedCount} students updated` });
    }

    // Single update
    const userIndex = users.findIndex((u: any) => u.id === id);

    if (userIndex !== -1) {
      users[userIndex] = { 
        ...users[userIndex], 
        status, 
        rejectMessage,
        ...(status === 'admitted' && subject ? { admittedSubject: subject } : {}),
        ...(status === 'admitted' && term ? { admittedTerm: term } : {})
      };
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      return NextResponse.json({ success: true, message: 'Status updated' });
    } else {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
