import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LABS_FILE = path.join(process.cwd(), 'data', 'packetTracerLabs.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readLabs() {
  if (!fs.existsSync(LABS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(LABS_FILE, 'utf8');
  return JSON.parse(data);
}

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
}

interface LabConfig {
  id: string;
  title: string;
  description: string;
  moduleId: number;
  competency: string;
  templateFile: string;
  difficulty: string;
  rubrics?: { id: string; label: string }[];
}

function writeLabs(labs: LabConfig[]) {
  fs.writeFileSync(LABS_FILE, JSON.stringify(labs, null, 2));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const labs: LabConfig[] = readLabs();

    if (!email) {
      // General list (e.g. for configuration/setup)
      return NextResponse.json({ success: true, labs });
    }

    // Merge student submission state
    const users: StudentUser[] = readUsers();
    const student = users.find((u: StudentUser) => u.email.toLowerCase() === email.toLowerCase());

    const submissions = student?.labSubmissions || {};
    const mergedLabs = labs.map((lab: LabConfig) => {
      const submission = submissions[lab.id];
      return {
        ...lab,
        submitted: !!submission,
        submissionDetails: submission || null
      };
    });

    return NextResponse.json({ success: true, labs: mergedLabs });
  } catch (error) {
    console.error('Error fetching labs:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch Packet Tracer labs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, moduleId, competency, difficulty, rubrics } = body;

    if (!title || !description || !moduleId || !competency || !difficulty) {
      return NextResponse.json({ success: false, message: 'Missing quest configuration parameters' }, { status: 400 });
    }

    const labs = readLabs();
    const newLab: LabConfig = {
      id: `pt-lab-${Date.now()}`,
      title,
      description,
      moduleId: Number(moduleId),
      competency,
      difficulty,
      templateFile: `/labs/custom-quest-${Date.now()}.pka`,
      rubrics: rubrics || []
    };

    labs.push(newLab);
    writeLabs(labs);

    return NextResponse.json({ success: true, message: 'Quest created successfully!', lab: newLab });
  } catch (error) {
    console.error('Error creating lab quest:', error);
    return NextResponse.json({ success: false, message: 'Failed to create quest' }, { status: 500 });
  }
}
