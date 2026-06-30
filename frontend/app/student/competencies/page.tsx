"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface Module {
  id: number;
  title: string;
  topics: { id: number; title: string }[];
  pretest?: unknown[];
}

interface StudentProfile {
  email: string;
  completedTopics?: Record<string, boolean>;
  pretestScores?: Record<string, number>;
  interactiveScores?: Record<string, Record<string, number>>;
  labSubmissions?: Record<string, { score: number }>;
}

interface Competency {
  name: string;
  description: string;
  icon: string;
  themeColor: string;
  moduleIds: number[];
  labIds: string[];
}

const COMPETENCIES_CONFIG: Competency[] = [
  {
    name: "Introduction to Networks & Topologies",
    description: "Understand fundamental network models (OSI/TCP-IP), physical network layouts, and general internet communications.",
    icon: "🌐",
    themeColor: "from-cyan-500 to-blue-600 border-cyan-500/20 text-cyan-400",
    moduleIds: [1782134355228, 1782182808093, 1782181968596],
    labIds: []
  },
  {
    name: "Subnetting & IPv4 Addressing",
    description: "Calculate subnet grids, binary ANDing operations, host boundary limits, and construct robust addressing schemes.",
    icon: "🔢",
    themeColor: "from-purple-500 to-indigo-600 border-purple-500/20 text-purple-400",
    moduleIds: [1782184909611],
    labIds: ["pt-lab-1"]
  },
  {
    name: "Ethernet & Switching (VLANs)",
    description: "Build local collision domains, configure switch ports, access/trunk nodes, and separate logical broadcast subnets.",
    icon: "🔌",
    themeColor: "from-emerald-500 to-teal-600 border-emerald-500/20 text-emerald-400",
    moduleIds: [1782185665993, 1782186311891],
    labIds: ["pt-lab-2"]
  },
  {
    name: "Router & Device Configuration",
    description: "Navigate CLI IOS systems, configure active interfaces, set administrative credentials, and secure terminal sessions.",
    icon: "⚙️",
    themeColor: "from-amber-500 to-orange-600 border-amber-500/20 text-amber-400",
    moduleIds: [1782186928370, 1782197552474],
    labIds: []
  },
  {
    name: "Routing Protocols & Static Routing",
    description: "Program static gateway routing hops, configure floating backup paths, and map logical routing table networks.",
    icon: "🔀",
    themeColor: "from-rose-500 to-pink-600 border-rose-500/20 text-rose-400",
    moduleIds: [1782198533015, 1782199846377, 1782200580841, 1782203599448],
    labIds: ["pt-lab-3", "pt-lab-4"]
  }
];

export default function StudentCompetencies() {
  const [modules, setModules] = useState<Module[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = localStorage.getItem("userEmail") || "";
        
        // Fetch student profile
        const uRes = await fetch("/api/users");
        const uData = await uRes.json();
        if (uData.success && uData.users) {
          const profile = uData.users.find((u: StudentProfile) => u.email.toLowerCase() === email.toLowerCase());
          setStudentProfile(profile || null);
        }

        // Fetch curriculum modules
        const mRes = await fetch("/api/modules");
        const mData = await mRes.json();
        if (mData.success) {
          setModules(mData.modules || []);
        }
      } catch (e) {
        console.error("Error fetching competency data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculation Logic for each competency
  const calculateCompetencyMastery = (comp: Competency) => {
    if (!studentProfile || modules.length === 0) return 0;

    const completedTopics = studentProfile.completedTopics || {};
    const pretestScores = studentProfile.pretestScores || {};
    const interactiveScores = studentProfile.interactiveScores || {};
    const labSubmissions = studentProfile.labSubmissions || {};

    const compModules = modules.filter(m => comp.moduleIds.includes(m.id));
    if (compModules.length === 0) return 0;

    // 1. Module Topics Completion (40% Weight)
    let totalTopics = 0;
    let completedTopicsCount = 0;
    compModules.forEach(mod => {
      mod.topics.forEach(t => {
        totalTopics++;
        if (completedTopics[t.id]) completedTopicsCount++;
      });
    });
    const topicProgressRatio = totalTopics > 0 ? completedTopicsCount / totalTopics : 0;

    // 2. Pre-test Accuracy (20% Weight)
    let totalPretestPossible = 0;
    let studentPretestScore = 0;
    compModules.forEach(mod => {
      const hasPretest = mod.pretest && mod.pretest.length > 0;
      if (hasPretest) {
        const score = pretestScores[mod.id];
        if (score !== undefined) {
          totalPretestPossible += mod.pretest!.length;
          studentPretestScore += score;
        }
      }
    });
    // If no pre-tests are taken or configured, align this score with topic progress to not penalize
    const pretestRatio = totalPretestPossible > 0 ? studentPretestScore / totalPretestPossible : topicProgressRatio;

    // 3. Hands-on Activities (40% Weight)
    // We combine browser-based simulation scores + Packet Tracer upload scores
    let activitiesCount = 0;
    let totalActivitiesScore = 0;

    // Browser simulations in these modules
    compModules.forEach(mod => {
      const scores = interactiveScores[mod.id] || {};
      Object.entries(scores).forEach(([taskKey, scoreVal]) => {
        if (taskKey !== "packetTracer") { // avoid double count
          activitiesCount++;
          // tasks usually have maxScore mapped or represent progress %
          const score = Number(scoreVal) || 0;
          // Normalise to 100 max
          if (taskKey === "simulationLab") {
            totalActivitiesScore += score; // simulationLab is usually percentage based (0-100)
          } else {
            // Task matches are 0-4 range, map to % roughly
            totalActivitiesScore += (score / 4) * 100;
          }
        }
      });
    });

    // Packet Tracer Labs in this competency
    comp.labIds.forEach(labId => {
      const sub = labSubmissions[labId];
      activitiesCount++;
      if (sub && sub.score !== undefined) {
        totalActivitiesScore += sub.score;
      }
    });

    const activitiesRatio = activitiesCount > 0 ? (totalActivitiesScore / activitiesCount) / 100 : topicProgressRatio;

    // Final Weighted Progress
    const finalMastery = (topicProgressRatio * 40) + (pretestRatio * 20) + (activitiesRatio * 40);
    return Math.min(100, Math.max(0, Math.round(finalMastery)));
  };

  const getRecommendation = (progress: number, compName: string) => {
    if (progress < 40) {
      return "⚠️ Critical Focus Required: Read the fundamental topics in your curriculum subjects and attempt the module pre-tests to begin skill building.";
    }
    if (progress < 75) {
      return `💪 Practical Exercises Needed: Complete the drag-and-drop matches or download and configuration-solve the assigned Packet Tracer labs matching ${compName}.`;
    }
    if (progress < 95) {
      return "🚀 Polish Configuration Hops: Work on solving common errors, maintain study consistency, and verify routing connections to achieve absolute mastery.";
    }
    return "⭐ Mastery Achieved! Excellent network engineering competency configuration demonstrated. Maintain consistent checkups.";
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/student/competencies" />
      <main className="p-8 flex-grow w-full max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-2">Skill Acquisition Profile</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Competency Tracking Dashboard</h1>
          <p className="text-brand-muted text-sm mt-1">
            Analyze your progress across five core networking domains mapped from lectures, quizzes, and Packet Tracer configuration labs.
          </p>
        </header>

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
            <span className="text-sm font-semibold text-brand-cyan animate-pulse">Computing Competency Scores...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Competencies Progress Layout */}
            <div className="flex flex-col gap-6">
              {COMPETENCIES_CONFIG.map((comp) => {
                const progress = calculateCompetencyMastery(comp);
                const recommendation = getRecommendation(progress, comp.name);
                const mappedModules = modules.filter(m => comp.moduleIds.includes(m.id));

                return (
                  <div key={comp.name} className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-md hover:border-brand-border-hover transition-all flex flex-col gap-5">
                    {/* Header: Title, Icon, Mastery */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/40 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl p-2 bg-brand-bg rounded-xl border border-brand-border/60 shadow-inner">
                          {comp.icon}
                        </div>
                        <div>
                          <h3 className="text-md font-bold text-brand-text">{comp.name}</h3>
                          <p className="text-xs text-brand-muted mt-0.5 leading-normal max-w-xl">
                            {comp.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-mono font-bold text-brand-muted">Domain Mastery</span>
                        <span className={`text-2xl font-black font-mono tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${comp.themeColor.split(' ')[0]}`}>
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Details */}
                    <div className="space-y-4">
                      <div className="w-full h-3 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20 shadow-inner">
                        <div 
                          className={`h-full bg-gradient-to-r transition-all duration-500 rounded-full ${comp.themeColor.split(' ')[0]}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Info and stats grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Modules mapped */}
                        <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider block mb-2">Mapped Syllabus Modules</span>
                          <ul className="space-y-1 text-brand-text/95 font-medium list-disc pl-4">
                            {mappedModules.map(m => (
                              <li key={m.id} className="truncate">{m.title}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Activities count */}
                        <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider block mb-2">Assessments & Labs</span>
                          <div className="flex flex-col gap-1.5 font-semibold text-brand-text/90">
                            <div>Pre-test Quiz status: <span className="text-brand-cyan font-mono">Completed</span></div>
                            <div>Cabling challenges: <span className="text-brand-cyan font-mono">{comp.labIds.length} assigned</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation block */}
                      <div className="bg-brand-bg/25 border border-brand-border/30 rounded-xl p-4 mt-2">
                        <div className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider mb-1">Study recommendation</div>
                        <p className="text-xs font-semibold leading-relaxed text-brand-text">
                          {recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
