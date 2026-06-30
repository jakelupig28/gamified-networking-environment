export interface Module {
  id: number;
  title: string;
  topics: { id: number; title: string }[];
  pretest?: unknown[];
}

export interface StudentProfile {
  completedTopics?: Record<string, boolean>;
  pretestScores?: Record<string, number>;
  interactiveScores?: Record<string, Record<string, number>>;
  labSubmissions?: Record<string, { score: number }>;
  quizScores?: Record<string, number>;
  cheatingLogs?: { assessmentType: string; moduleId: number; timestamp: string; reason: string }[];
  email: string;
  name: string;
  earnedBadges?: { badgeId: string; awardedAt: string; awardedBy: string }[];
  xp?: number;
}

export interface CompetencyConfig {
  name: string;
  description: string;
  icon: string;
  themeColor: string;
  moduleIds: number[];
  labIds: string[];
}

export const COMPETENCIES_CONFIG: CompetencyConfig[] = [
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

export function calculateCompetencyScore(comp: CompetencyConfig, studentProfile: StudentProfile, modules: Module[]): number {
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
  const pretestRatio = totalPretestPossible > 0 ? studentPretestScore / totalPretestPossible : topicProgressRatio;

  // 3. Hands-on Activities (40% Weight)
  let activitiesCount = 0;
  let totalActivitiesScore = 0;

  compModules.forEach(mod => {
    const scores = interactiveScores[mod.id] || {};
    Object.entries(scores).forEach(([taskKey, scoreVal]) => {
      if (taskKey !== "packetTracer") {
        activitiesCount++;
        const score = Number(scoreVal) || 0;
        if (taskKey === "simulationLab") {
          totalActivitiesScore += score;
        } else {
          totalActivitiesScore += (score / 4) * 100;
        }
      }
    });
  });

  comp.labIds.forEach(labId => {
    const sub = labSubmissions[labId];
    activitiesCount++;
    if (sub && sub.score !== undefined) {
      totalActivitiesScore += sub.score;
    }
  });

  const activitiesRatio = activitiesCount > 0 ? (totalActivitiesScore / activitiesCount) / 100 : topicProgressRatio;

  const finalMastery = (topicProgressRatio * 40) + (pretestRatio * 20) + (activitiesRatio * 40);
  return Math.min(100, Math.max(0, Math.round(finalMastery)));
}

export const MODULE_TOPICS_MAP = [
  {
    "id": 1782134355228,
    "topics": [1782134355229, 1782134356229, 1782134357229, 1782134358229, 1782134359229, 1782134360229]
  },
  {
    "id": 1782182808093,
    "topics": [1782182808094, 1782182809094, 1782182810094, 1782182811094, 1782182812094]
  },
  {
    "id": 1782181968596,
    "topics": [1782181968597, 1782181969597, 1782181970597, 1782181971597]
  },
  {
    "id": 1782184909611,
    "topics": [1782184909612, 1782184910612, 1782184911612, 1782184912612, 1782184913612, 1782184914612, 1782184915612]
  },
  {
    "id": 1782185665993,
    "topics": [1782185665994, 1782185666994, 1782185667994, 1782185668994]
  },
  {
    "id": 1782186311891,
    "topics": [1782186311892, 1782186312892, 1782186313892, 1782186314892]
  },
  {
    "id": 1782186928370,
    "topics": [1782186928371, 1782186929371, 1782186930371, 1782186931371]
  },
  {
    "id": 1782197552474,
    "topics": [1782197552475, 1782197553475, 1782197554475, 1782197555475]
  },
  {
    "id": 1782198533015,
    "topics": [1782198533016, 1782198534016, 1782198535016, 1782198536016, 1782198537016]
  },
  {
    "id": 1782199846377,
    "topics": [1782199846378, 1782199848378, 1782199847378, 1782199849378, 1782199850378]
  },
  {
    "id": 1782200580841,
    "topics": [1782200580842, 1782200581842, 1782200582842, 1782200583842]
  },
  {
    "id": 1782203599448,
    "topics": [1782203599449, 1782203600449, 1782203601449, 1782203602449, 1782203603449]
  }
];

export function calculateXp(
  profile: StudentProfile,
  discussionsCount: number
): number {
  let xp = 0;

  // 1. Taking pre-test: +100 XP each
  const pretestScores = profile.pretestScores || {};
  const pretestCount = Object.keys(pretestScores).length;
  xp += pretestCount * 100;

  // 2. Participating in discussion forum: +50 XP each post/reply
  xp += discussionsCount * 50;

  // 3. Taking interactive activities: +150 XP each
  const interactiveScores = profile.interactiveScores || {};
  let interactiveCount = 0;
  Object.values(interactiveScores).forEach((tasks) => {
    const taskRecord = tasks as Record<string, number>;
    if (taskRecord && Object.keys(taskRecord).length > 0) {
      interactiveCount++;
    }
  });
  xp += interactiveCount * 150;

  // 4. Finishing modules: +300 XP each
  const completedTopics = profile.completedTopics || {};
  MODULE_TOPICS_MAP.forEach(mod => {
    const finished = mod.topics.every(tid => completedTopics[String(tid)] === true || completedTopics[Number(tid)] === true);
    if (finished) {
      xp += 300;
    }
  });

  // 5. Submitting lab activity packet tracer files: +200 XP each
  const labSubmissions = profile.labSubmissions || {};
  const labCount = Object.keys(labSubmissions).length;
  xp += labCount * 200;

  return xp;
}

export function getLevelInfo(xp: number) {
  const xpPerLevel = 500;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const xpNeededForNextLevel = xpPerLevel;
  const progressPercentage = (currentLevelXp / xpNeededForNextLevel) * 100;
  return { level, currentLevelXp, xpNeededForNextLevel, progressPercentage };
}
