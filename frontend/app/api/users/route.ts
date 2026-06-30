import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MODULE_TOPICS_MAP = [
  { "id": 1782134355228, "topics": [1782134355229, 1782134356229, 1782134357229, 1782134358229, 1782134359229, 1782134360229] },
  { "id": 1782182808093, "topics": [1782182808094, 1782182809094, 1782182810094, 1782182811094, 1782182812094] },
  { "id": 1782181968596, "topics": [1782181968597, 1782181969597, 1782181970597, 1782181971597] },
  { "id": 1782184909611, "topics": [1782184909612, 1782184910612, 1782184911612, 1782184912612, 1782184913612, 1782184914612, 1782184915612] },
  { "id": 1782185665993, "topics": [1782185665994, 1782185666994, 1782185667994, 1782185668994] },
  { "id": 1782186311891, "topics": [1782186311892, 1782186312892, 1782186313892, 1782186314892] },
  { "id": 1782186928370, "topics": [1782186928371, 1782186929371, 1782186930371, 1782186931371] },
  { "id": 1782197552474, "topics": [1782197552475, 1782197553475, 1782197554475, 1782197555475] },
  { "id": 1782198533015, "topics": [1782198533016, 1782198534016, 1782198535016, 1782198536016, 1782198537016] },
  { "id": 1782199846377, "topics": [1782199846378, 1782199848378, 1782199847378, 1782199849378, 1782199850378] },
  { "id": 1782200580841, "topics": [1782200580842, 1782200581842, 1782200582842, 1782200583842] },
  { "id": 1782203599448, "topics": [1782203599449, 1782203600449, 1782203601449, 1782203602449, 1782203603449] }
];

function calculateUserXp(user: any, discussions: any[]) {
  let xp = 0;
  
  // 1. Taking pre-test: +100 XP each
  const pretestScores = user.pretestScores || {};
  const pretestCount = Object.keys(pretestScores).length;
  xp += pretestCount * 100;

  // 2. Participating in discussion forum: +50 XP each
  const userEmail = (user.email || "").toLowerCase();
  const discCount = discussions.filter((d: any) => d.email && d.email.toLowerCase() === userEmail).length;
  xp += discCount * 50;

  // 3. Taking interactive activities: +150 XP each
  const completedTopics = user.completedTopics || {};
  const interactiveCount = Object.keys(completedTopics).filter(k => k.startsWith("999999") && completedTopics[k] === true).length;
  xp += interactiveCount * 150;

  // 4. Finishing modules: +300 XP each
  MODULE_TOPICS_MAP.forEach(mod => {
    const finished = mod.topics.every(tid => completedTopics[String(tid)] === true || completedTopics[Number(tid)] === true);
    if (finished) {
      xp += 300;
    }
  });

  // 5. Submitting lab activity packet tracer files: +200 XP each
  const labSubmissions = user.labSubmissions || {};
  const labCount = Object.keys(labSubmissions).length;
  xp += labCount * 200;

  return xp;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    // Load discussions
    const discussionsPath = path.join(process.cwd(), 'data', 'discussions.json');
    let discussions: any[] = [];
    if (fs.existsSync(discussionsPath)) {
      try {
        discussions = JSON.parse(fs.readFileSync(discussionsPath, 'utf8'));
      } catch (e) {
        console.error('Error reading discussions:', e);
      }
    }
    
    // Omit passwords for security and attach dynamic XP
    const safeUsers = users.map((u: any) => {
      const { password, ...safeUser } = u;
      if (safeUser.role === 'Student') {
        safeUser.xp = calculateUserXp(safeUser, discussions);
      }
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

    // Read discussions to return calculated user with xp
    const discussionsPath = path.join(process.cwd(), 'data', 'discussions.json');
    let discussions: any[] = [];
    if (fs.existsSync(discussionsPath)) {
      try {
        discussions = JSON.parse(fs.readFileSync(discussionsPath, 'utf8'));
      } catch (e) {
        console.error('Error reading discussions:', e);
      }
    }
    const safeUser = { ...users[userIdx] };
    delete safeUser.password;
    if (safeUser.role === 'Student') {
      safeUser.xp = calculateUserXp(safeUser, discussions);
    }

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, message: 'Profile updated successfully', user: safeUser });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error updating profile' }, { status: 500 });
  }
}
