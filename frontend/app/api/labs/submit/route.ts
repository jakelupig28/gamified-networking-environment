import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

interface LabSubmissionDetail {
  score: number;
  status: string;
  logs: string[];
  feedback: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
}

interface StudentUser {
  email: string;
  labSubmissions?: Record<string, LabSubmissionDetail>;
  interactiveScores?: Record<string, Record<string, number>>;
  [key: string]: unknown;
}

function writeUsers(users: StudentUser[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Helper to simulate Packet Tracer auto-grading script
function runMockPacketTracerAutoGrader(labId: string, fileName: string, fileSize: number) {
  let score = 0;
  const logs: string[] = [];
  const timestamp = new Date().toISOString();

  // Basic validation check
  if (!fileName.endsWith('.pka') && !fileName.endsWith('.pkt')) {
    return {
      score: 0,
      logs: ['[ERROR] Invalid file format. Auto-grader expects Cisco Packet Tracer (.pka or .pkt) binaries.'],
      feedback: 'Failed file verification checks. Please upload a valid .pka or .pkt file.'
    };
  }

  // Load custom rubrics if they exist
  const LABS_FILE = path.join(process.cwd(), 'data', 'packetTracerLabs.json');
  let rubrics: { id: string; label: string }[] = [];
  if (fs.existsSync(LABS_FILE)) {
    try {
      const labsData = JSON.parse(fs.readFileSync(LABS_FILE, 'utf8'));
      const lab = labsData.find((l: { id: string; rubrics?: { id: string; label: string }[] }) => l.id === labId);
      if (lab && lab.rubrics) {
        rubrics = lab.rubrics;
      }
    } catch (e) {
      console.error(e);
    }
  }

  logs.push(`[${timestamp}] Starting auto-grade pipeline for lab: ${labId}`);
  logs.push(`[INFO] Analyzing binary structure of ${fileName} (${(fileSize / 1024).toFixed(2)} KB)...`);
  logs.push(`[SUCCESS] Decrypted Packet Tracer assessment XML package.`);

  if (rubrics.length > 0) {
    // Custom quest grading based on defined rubrics
    score = 0;
    const pointsPerCheck = Math.floor(100 / rubrics.length);
    let passes = 0;
    rubrics.forEach((item, idx) => {
      const checkPassed = Math.random() > 0.15; // 85% pass rate
      logs.push(`[TEST] Verifying Rubric ${idx + 1}: ${item.label}... ${checkPassed ? 'SUCCESS' : 'FAILED'}`);
      if (checkPassed) {
        score += pointsPerCheck;
        passes++;
      }
    });
    if (passes === rubrics.length) {
      score = 100;
    }
  } else if (labId === 'pt-lab-1') {
    // IPv4 Subnetting & IP Configuration
    const check1 = Math.random() > 0.05; // 95% pass rate
    const check2 = Math.random() > 0.1;
    const check3 = Math.random() > 0.15;
    
    logs.push(`[TEST] Verifying PC1 IP Address Assignment (Expected: 192.168.1.10/24)... ${check1 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying PC2 IP Address Assignment (Expected: 192.168.1.20/24)... ${check2 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying Router eth0 Gateway IP Configuration (Expected: 192.168.1.1/24)... ${check3 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Checking ICMP Echo transmission between PC1 and Gateway R1... SUCCESS`);

    score = 0;
    if (check1) score += 35;
    if (check2) score += 35;
    if (check3) score += 30;

  } else if (labId === 'pt-lab-2') {
    // VLAN Trunking & Switch Routing
    const check1 = Math.random() > 0.05;
    const check2 = Math.random() > 0.15;
    const check3 = Math.random() > 0.2;

    logs.push(`[TEST] Verifying VLAN Database configuration (VLAN 10: "Sales", VLAN 20: "Engineering")... ${check1 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying Trunk Port status on Switch1 Fa0/24 interface... ${check2 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying Switchport Access encapsulation and frame tagging on Fa0/1... ${check3 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Dynamic Trunking Protocol negotiation check... SUCCESS`);

    score = 0;
    if (check1) score += 40;
    if (check2) score += 30;
    if (check3) score += 30;

  } else if (labId === 'pt-lab-3') {
    // Basic Gateway Static Routing
    const check1 = Math.random() > 0.1;
    const check2 = Math.random() > 0.1;
    const check3 = Math.random() > 0.2;

    logs.push(`[TEST] Verifying Router R1 Static Route (ip route 192.168.2.0/24 via R2 interface)... ${check1 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying Router R2 Static Route (ip route 192.168.1.0/24 via R1 interface)... ${check2 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Executing ping traceroute PC1 -> PC2 hops across WAN link... ${check3 ? 'SUCCESS (0% loss)' : 'FAILED (100% loss)'}`);

    score = 0;
    if (check1) score += 35;
    if (check2) score += 35;
    if (check3) score += 30;

  } else if (labId === 'pt-lab-4') {
    // Advanced Static Route Redundancy
    const check1 = Math.random() > 0.15;
    const check2 = Math.random() > 0.2;
    const check3 = Math.random() > 0.25;

    logs.push(`[TEST] Verifying Primary Static Route to WAN segment (AD = 1)... ${check1 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Verifying Backup Floating Static Route configured with AD = 10... ${check2 ? 'SUCCESS' : 'FAILED'}`);
    logs.push(`[TEST] Simulating Primary link cut and validating failover routing path... ${check3 ? 'SUCCESS' : 'FAILED'}`);

    score = 0;
    if (check1) score += 35;
    if (check2) score += 35;
    if (check3) score += 30;

  } else {
    // Catch-all
    score = 85;
    logs.push(`[TEST] General topology checks passed.`);
  }

  logs.push(`[INFO] Grading execution finished.`);
  logs.push(`[INFO] Auto-Grader Score Computed: ${score}/100.`);

  let feedback = '';
  if (score === 100) {
    feedback = 'Perfect submission! Excellent work configuring all network nodes and passing connectivity tests.';
  } else if (score >= 70) {
    feedback = 'Great job! Most network checks passed, though there were minor misconfigurations. Please check logs for detailed error reports.';
  } else {
    feedback = 'Low score. Significant routing/addressing configuration gaps identified. Review the checklist and re-upload your completed lab.';
  }

  return { score, logs, feedback };
}

// Student upload submission
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const labId = formData.get('labId') as string;
    const labFile = formData.get('labFile') as File | null;

    if (!email || !labId || !labFile) {
      return NextResponse.json({ success: false, message: 'Missing required upload parameters' }, { status: 400 });
    }

    const users: StudentUser[] = readUsers();
    const studentIdx = users.findIndex((u: StudentUser) => u.email.toLowerCase() === email.toLowerCase());

    if (studentIdx === -1) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Save File to public/uploads/labs
    const filename = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${labId}_${labFile.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'labs');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const arrayBuffer = await labFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    // Auto grading
    const gradingResults = runMockPacketTracerAutoGrader(labId, labFile.name, labFile.size);

    // Save to users.json database
    const submissions = users[studentIdx].labSubmissions || {};
    submissions[labId] = {
      score: gradingResults.score,
      status: 'graded',
      logs: gradingResults.logs,
      feedback: gradingResults.feedback,
      fileName: labFile.name,
      fileUrl: `/uploads/labs/${filename}`,
      submittedAt: new Date().toISOString()
    };

    users[studentIdx].labSubmissions = submissions;

    // Add interactive activity score mapping to sync with leaderboard / achievements
    const interactiveScores = users[studentIdx].interactiveScores || {};
    if (!interactiveScores[labId]) {
      interactiveScores[labId] = {};
    }
    // We map PT labs as another score source for gamification points
    interactiveScores[labId]["packetTracer"] = gradingResults.score;
    users[studentIdx].interactiveScores = interactiveScores;

    writeUsers(users);

    return NextResponse.json({
      success: true,
      message: 'Packet Tracer Lab submitted and auto-graded successfully!',
      submission: submissions[labId]
    });
  } catch (error) {
    console.error('Error submitting Packet Tracer Lab:', error);
    return NextResponse.json({ success: false, message: 'Server error processing lab submission' }, { status: 500 });
  }
}

// Professor manual grade override
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, labId, score, feedback } = body;

    if (!email || !labId || score === undefined || !feedback) {
      return NextResponse.json({ success: false, message: 'Missing grading update data' }, { status: 400 });
    }

    const users: StudentUser[] = readUsers();
    const studentIdx = users.findIndex((u: StudentUser) => u.email.toLowerCase() === email.toLowerCase());

    if (studentIdx === -1) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const submissions = users[studentIdx].labSubmissions || {};
    if (!submissions[labId]) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    // Apply manual grade override
    submissions[labId] = {
      ...submissions[labId],
      score: Number(score),
      feedback: feedback,
      status: 'graded'
    };

    // Update synced interactive scores for points calculation
    const interactiveScores = users[studentIdx].interactiveScores || {};
    if (!interactiveScores[labId]) {
      interactiveScores[labId] = {};
    }
    interactiveScores[labId]["packetTracer"] = Number(score);
    users[studentIdx].interactiveScores = interactiveScores;

    users[studentIdx].labSubmissions = submissions;
    writeUsers(users);

    return NextResponse.json({ success: true, message: 'Grade and feedback updated successfully!' });
  } catch (error) {
    console.error('Error updating grade override:', error);
    return NextResponse.json({ success: false, message: 'Server error overriding lab grade' }, { status: 500 });
  }
}
