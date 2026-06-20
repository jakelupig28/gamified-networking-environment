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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, newEmail, ...updateFields } = body;
    
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required to update profile' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: 'Data file not found' }, { status: 404 });
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    const userIdx = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (userIdx === -1) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Merge fields
    users[userIdx] = {
      ...users[userIdx],
      ...updateFields
    };

    // Reset status to pending and clear rejectMessage if user was rejected and profile details are updated
    const profileUpdateKeys = ['firstName', 'lastName', 'middleName', 'studentId', 'course', 'section', 'birthdate', 'age', 'gender', 'address'];
    const isProfileUpdate = Object.keys(updateFields).some(key => profileUpdateKeys.includes(key));
    if (users[userIdx].status === 'rejected' && isProfileUpdate) {
      users[userIdx].status = 'pending';
      users[userIdx].rejectMessage = '';
    }

    // If newEmail is provided, check for conflicts and update
    if (newEmail && newEmail.toLowerCase() !== email.toLowerCase()) {
      const emailExists = users.some((u: any, idx: number) => idx !== userIdx && u.email.toLowerCase() === newEmail.toLowerCase());
      if (emailExists) {
        return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 400 });
      }
      users[userIdx].email = newEmail;
    }

    // Rebuild name if name parts change
    if (updateFields.firstName || updateFields.lastName || updateFields.middleName !== undefined || updateFields.title !== undefined) {
      const title = updateFields.title !== undefined ? updateFields.title : (users[userIdx].title || '');
      const fName = updateFields.firstName !== undefined ? updateFields.firstName : (users[userIdx].firstName || '');
      const mName = updateFields.middleName !== undefined ? updateFields.middleName : (users[userIdx].middleName || '');
      const lName = updateFields.lastName !== undefined ? updateFields.lastName : (users[userIdx].lastName || '');
      
      const titlePart = title ? title.trim() + ' ' : '';
      const middlePart = mName ? mName.trim() + ' ' : '';
      users[userIdx].name = `${titlePart}${fName.trim()} ${middlePart}${lName.trim()}`.trim() || users[userIdx].name;
    }

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, message: 'Profile updated successfully', user: users[userIdx] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error updating profile' }, { status: 500 });
  }
}
