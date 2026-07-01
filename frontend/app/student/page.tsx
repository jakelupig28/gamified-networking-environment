"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CertificateModal from "@/components/CertificateModal";
import { COMPETENCIES_CONFIG, calculateCompetencyScore, getLevelInfo, MODULE_TOPICS_MAP } from "@/utils/competencies";
type MaterialType = "text" | "video" | "image" | "file";

type Material = {
  id: number;
  type: MaterialType;
  title: string;
  content: string;
};

type Subtopic = {
  id: number;
  title?: string;
  materials?: Material[];
};

type Topic = {
  id: number;
  title?: string;
  materials?: Material[];
  subtopics?: Subtopic[];
};

type Module = {
  id: number;
  title: string;
  topics: Topic[];
  pretest?: unknown[];
};

type UserProfile = {
  name: string;
  email: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  section?: string;
  admittedSubject?: string;
  admittedTerm?: string;
  status?: string;
  rejectMessage?: string;
  completedTopics?: Record<string, boolean>;
  pretestScores?: Record<string, number>;
  interactiveScores?: Record<string, Record<string, number>>;
  labSubmissions?: Record<string, { score: number }>;
  streakDates?: string[];
  watchedVideos?: Record<string, boolean>;
  completedPretests?: Record<string, boolean>;
  earnedBadges?: { badgeId: string; awardedAt: string; awardedBy: string }[];
  xp?: number;
};

export default function StudentDashboard() {
  const [userName, setUserName] = useState("Student");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedTopics, setCompletedTopics] = useState<Record<number, boolean>>({});
  const [watchedVideos, setWatchedVideos] = useState<Record<number, boolean>>({});
  const [completedPretests, setCompletedPretests] = useState<Record<number, boolean>>({});
  const [pretestScores, setPretestScores] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  interface BadgeConfig {
    id: string;
    name: string;
    description?: string;
    criteria?: string;
    imagePath?: string;
  }
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeConfig | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const getModuleIndex = (moduleId: number): number => {
    const ids = [
      1782134355228, // Introduction to Networking
      1782182808093, // Communicating Over The InternetPart 1
      1782181968596, // Communicating Over The Internet Part 2
      1782184909611, // Addressing IPv4
      1782185665993, // Ethernet Part 1
      1782186311891, // Ethernet Part 2
      1782186928370, // Network Configuration
      1782197552474, // Basic Router Configuration
      1782198533015, // Routing Protocol Concepts
      1782199846377, // Static Routing Part 1
      1782200580841, // Static Routing Part 2
      1782203599448  // Advance Static Routing
    ];
    const idx = ids.indexOf(moduleId);
    return idx !== -1 ? idx : 0;
  };

  const ensureInteractiveActivity = (mods: Module[]): Module[] => {
    if (mods.length === 0) return mods;
    return mods.map((mod) => {
      const idx = getModuleIndex(mod.id);
      const newTopics = mod.topics.filter(t => 
        (t.id < 88888800 || t.id > 99999999) &&
        t.title !== "Module Discussion Forum" &&
        t.title !== "Interactive Subnetting Activity" &&
        t.title !== "Interactive Activity"
      );
      newTopics.push({
        id: 88888800 + idx,
        title: "Module Discussion Forum",
        materials: [
          {
            id: 88888810 + idx,
            type: "text",
            title: "Module Discussion",
            content: "discussion-forum-placeholder"
          }
        ],
        subtopics: []
      });
      newTopics.push({
        id: 99999900 + idx,
        title: "Interactive Activity",
        materials: [
          {
            id: 99999910 + idx,
            type: "text",
            title: "Hands-on Exercises",
            content: "interactive-activity-placeholder"
          }
        ],
        subtopics: []
      });
      return {
        ...mod,
        topics: newTopics
      };
    });
  };

  const checkBadgeEligibility = async (
    profile: UserProfile,
    mods: Module[],
    doneTopics: Record<number, boolean>,
    donePretests: Record<number, boolean>
  ) => {
    if (!profile) return;
    const email = profile.email;
    const alreadyEarnedIds = new Set((profile.earnedBadges || []).map((b: { badgeId: string }) => b.badgeId));

    const totalTopicsCount = mods.reduce((acc, mod) => acc + mod.topics.length, 0);
    let sum = 0;
    mods.forEach((mod) => {
      mod.topics.forEach((topic) => {
        if (doneTopics[topic.id]) {
          sum += 100;
        }
      });
    });
    const overallProgress = totalTopicsCount > 0 ? Math.round(sum / totalTopicsCount) : 0;

    const simLabs = ["1782184909611", "1782186928370", "1782197552474", "1782199846377"];
    const finishedSimCount = simLabs.filter(mId => (profile?.interactiveScores?.[mId]?.["simulationLab"] ?? 0) >= 80).length;
    const isSimMaster = finishedSimCount === 4;

    const subnettingComp = COMPETENCIES_CONFIG.find(c => c.name === "Subnetting & IPv4 Addressing");
    const vlanComp = COMPETENCIES_CONFIG.find(c => c.name === "Ethernet & Switching (VLANs)");
    const routingComp = COMPETENCIES_CONFIG.find(c => c.name === "Routing Protocols & Static Routing");

    const subnettingScore = subnettingComp ? calculateCompetencyScore(subnettingComp, profile, mods as any) : 0;
    const vlanScore = vlanComp ? calculateCompetencyScore(vlanComp, profile, mods as any) : 0;
    const routingScore = routingComp ? calculateCompetencyScore(routingComp, profile, mods as any) : 0;

    let badgesList: BadgeConfig[] = [];
    try {
      const bRes = await fetch("/api/badges");
      const bData = await bRes.json();
      if (bData.success) {
        badgesList = bData.badges;
      }
    } catch (e) {
      console.error(e);
    }

    if (badgesList.length === 0) return;

    for (const badge of badgesList) {
      if (alreadyEarnedIds.has(badge.id)) continue;

      let meetsCriteria = false;
      if (badge.id === "badge-default-competency" && overallProgress >= 80) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-simulation-master" && isSimMaster) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-consistent-learner" && overallProgress >= 50) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-top-3" && overallProgress >= 85) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-top-2" && overallProgress >= 90) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-top-1" && overallProgress >= 95) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-subnetting-expert" && subnettingScore >= 80) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-vlan-expert" && vlanScore >= 80) {
        meetsCriteria = true;
      } else if (badge.id === "badge-default-routing-expert" && routingScore >= 80) {
        meetsCriteria = true;
      }

      if (meetsCriteria) {
        setUnlockedBadge(badge);
        break; 
      }
    }
  };

  const handleClaimBadge = async () => {
    if (!unlockedBadge) return;
    const email = localStorage.getItem("userEmail") || "";
    if (!email) return;

    try {
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      if (uData.success) {
        const profile = uData.users.find((u: UserProfile) => u.email.toLowerCase() === email.toLowerCase());
        if (profile) {
          const currentEarned = profile.earnedBadges || [];
          const newEarnedBadge = {
            badgeId: unlockedBadge.id,
            awardedAt: new Date().toISOString(),
            awardedBy: "System Auto-Grader"
          };
          
          const updatedEarned = [...currentEarned, newEarnedBadge];
          
          await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              updates: {
                earnedBadges: updatedEarned
              }
            })
          });
          
          alert(`Congratulations! You earned the "${unlockedBadge.name}" Badge!`);
          setUnlockedBadge(null);
          // Refresh page details
          window.location.reload();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (userProfile && modules.length > 0 && Object.keys(completedTopics).length > 0) {
      Promise.resolve().then(() => {
        checkBadgeEligibility(userProfile, modules, completedTopics, completedPretests);
      });
    }
  }, [completedTopics, completedPretests, userProfile, modules]);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail") || "";
    const savedNameFull = localStorage.getItem("userName") || "Student";

    Promise.resolve().then(() => {
      if (savedName) {
        setUserName(savedName.split(" ")[0]);
      }

      const storedCompleted = localStorage.getItem(`completed_topics_${savedNameFull}`);
      if (storedCompleted) {
        try {
          setCompletedTopics(JSON.parse(storedCompleted));
        } catch (e) {
          console.error(e);
        }
      }
      const storedWatched = localStorage.getItem(`watched_videos_${savedNameFull}`);
      if (storedWatched) {
        try {
          setWatchedVideos(JSON.parse(storedWatched));
        } catch (e) {
          console.error(e);
        }
      }
      const storedPretests = localStorage.getItem(`completed_pretests_${savedNameFull}`);
      if (storedPretests) {
        try {
          setCompletedPretests(JSON.parse(storedPretests));
        } catch (e) {
          console.error(e);
        }
      }
      const storedScores = localStorage.getItem(`pretest_scores_${savedNameFull}`);
      if (storedScores) {
        try {
          setPretestScores(JSON.parse(storedScores));
        } catch (e) {
          console.error(e);
        }
      }
    });

    const fetchData = async () => {
      try {
        // Fetch users to get profile details
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          const profile = usersData.users.find(
            (u: UserProfile) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (profile) {
            setUserProfile(profile);
            
            // Load streak dates
            if (profile.streakDates) {
              setStreakDates(profile.streakDates);
            }

            // Sync server-side scores/progress back to localStorage
            if (profile.completedTopics) {
              localStorage.setItem(`completed_topics_${savedNameFull}`, JSON.stringify(profile.completedTopics));
              setCompletedTopics(profile.completedTopics);
            }
            if (profile.watchedVideos) {
              localStorage.setItem(`watched_videos_${savedNameFull}`, JSON.stringify(profile.watchedVideos));
              setWatchedVideos(profile.watchedVideos);
            }
            if (profile.completedPretests) {
              localStorage.setItem(`completed_pretests_${savedNameFull}`, JSON.stringify(profile.completedPretests));
              setCompletedPretests(profile.completedPretests);
            }
            if (profile.pretestScores) {
              localStorage.setItem(`pretest_scores_${savedNameFull}`, JSON.stringify(profile.pretestScores));
              setPretestScores(profile.pretestScores);
            }
            if (profile.interactiveScores) {
              Object.entries(profile.interactiveScores).forEach(([mId, scores]) => {
                localStorage.setItem(`interactive_scores_${savedNameFull}_${mId}`, JSON.stringify(scores));
              });
            }
          }
        }

        // Fetch modules
        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();
        if (modulesData.success && modulesData.modules) {
          const processed = ensureInteractiveActivity(modulesData.modules);
          setModules(processed);
        }
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const isTopicUnlocked = (mod: Module, topicIdx: number): boolean => {
    if (mod.pretest && mod.pretest.length > 0) {
      if (!completedPretests[mod.id]) {
        return false;
      }
    }
    if (topicIdx === 0) return true;
    const prevTopic = mod.topics[topicIdx - 1];
    return !!completedTopics[prevTopic.id];
  };

  const getModuleProgress = (mod: Module): number => {
    if (mod.topics.length === 0) return 0;
    let sum = 0;
    mod.topics.forEach((topic, idx) => {
      const isUnlocked = isTopicUnlocked(mod, idx);
      if (isUnlocked && completedTopics[topic.id]) {
        sum += 100;
      } else if (isUnlocked) {
        const videoMat = topic.materials?.find(m => m.type === "video") || 
                         topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "video");
        if (videoMat && watchedVideos[videoMat.id]) {
          sum += 50;
        }
      }
    });
    return Math.round(sum / mod.topics.length);
  };

  const getModuleTopicsCounts = (mod: Module) => {
    const total = mod.topics.length;
    const completed = mod.topics.filter((t, idx) => isTopicUnlocked(mod, idx) && completedTopics[t.id]).length;
    return { total, completed };
  };

  // Overall stats
  const totalTopicsCount = modules.reduce((acc, mod) => acc + mod.topics.length, 0);

  const completedTopicsCount = modules.reduce((acc, mod) => {
    return acc + mod.topics.filter((t, idx) => isTopicUnlocked(mod, idx) && completedTopics[t.id]).length;
  }, 0);

  const overallProgress = (() => {
    if (totalTopicsCount === 0) return 0;
    let sum = 0;
    modules.forEach((mod) => {
      mod.topics.forEach((topic, idx) => {
        const isUnlocked = isTopicUnlocked(mod, idx);
        if (isUnlocked && completedTopics[topic.id]) {
          sum += 100;
        } else if (isUnlocked) {
          const videoMat = topic.materials?.find(m => m.type === "video") || 
                           topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "video");
          if (videoMat && watchedVideos[videoMat.id]) {
            sum += 50;
          }
        }
      });
    });
    return Math.round(sum / totalTopicsCount);
  })();

  // Fire Streak Calculation
  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse(); // newest first
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Streak must include today or yesterday
    if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

    let streak = 1;
    let current = new Date(sorted[0] + "T00:00:00");
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i] + "T00:00:00");
      const diff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        current = prev;
      } else if (diff > 1) {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(streakDates);

  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return "Start learning today to begin your streak!";
    if (streak === 1) return "Great start! Come back tomorrow to keep it going.";
    if (streak <= 3) return "Building momentum — keep it up!";
    if (streak <= 7) return "You're on fire! Impressive consistency.";
    if (streak <= 14) return "Incredible dedication! You're unstoppable.";
    return "Legendary streak! You're a true scholar.";
  };

  // Get gamified level details
  const { level, currentLevelXp, xpNeededForNextLevel, progressPercentage } = getLevelInfo(userProfile?.xp || 0);

  // Get last 7 days for heatmap
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
      days.push({ date: dateStr, label: dayLabel, active: streakDates.includes(dateStr) });
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Certificate eligibility criteria calculations
  const completedModulesCount = modules.filter((mod) =>
    mod.topics.every((t) => userProfile?.completedTopics?.[t.id] === true)
  ).length;
  const isAllTopicsCompleted = totalModulesCount > 0 && completedModulesCount === totalModulesCount;

  const pretestModules = modules.filter((mod) => mod.pretest && mod.pretest.length > 0);
  const totalPretestsCount = pretestModules.length;
  const completedPretestsCount = pretestModules.filter((mod) =>
    userProfile?.pretestScores?.[mod.id] !== undefined
  ).length;
  const isAllPretestsCompleted = totalPretestsCount > 0 && completedPretestsCount === totalPretestsCount;

  const simLabModuleIds = [1782184909611, 1782186928370, 1782197552474, 1782199846377];
  const totalSimLabsCount = simLabModuleIds.length;
  const completedSimLabsCount = simLabModuleIds.filter((mId) => {
    const score = userProfile?.interactiveScores?.[mId]?.["simulationLab"];
    return score !== undefined && score >= 80;
  }).length;
  const isAllSimLabsCompleted = completedSimLabsCount === totalSimLabsCount;

  const packetTracerIds = ["pt-lab-1", "pt-lab-2", "pt-lab-3", "pt-lab-4"];
  const totalPTLabsCount = packetTracerIds.length;
  const completedPTLabsCount = packetTracerIds.filter((labId) =>
    userProfile?.labSubmissions?.[labId] !== undefined
  ).length;
  const isAllPTLabsCompleted = completedPTLabsCount === totalPTLabsCount;

  const totalQuizzesCount = modules.length;
  const completedQuizzesCount = modules.filter((mod) =>
    userProfile?.quizScores?.[mod.id] !== undefined
  ).length;
  const isAllQuizzesCompleted = totalQuizzesCount > 0 && completedQuizzesCount === totalQuizzesCount;

  const isCertificateEligible =
    isAllTopicsCompleted &&
    isAllPretestsCompleted &&
    isAllSimLabsCompleted &&
    isAllPTLabsCompleted &&
    isAllQuizzesCompleted;

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/student/dashboard" />
      
      <main className="p-10 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        <header className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-2">Student Portal</div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Welcome back, {userName}.</h1>
          <p className="text-brand-muted text-sm max-w-xl leading-relaxed">
            {isLoading
              ? "Loading your dashboard..."
              : userProfile?.status !== "admitted"
                ? "Your registration is currently being verified. Please review your status details below."
                : overallProgress >= 100
                  ? "Congratulations! You have completed all course modules in your syllabus. Excellent work!"
                  : `You have completed ${overallProgress}% of the course materials. Keep studying to reach your goals.`}
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : userProfile && userProfile.status !== "admitted" ? (
          <div className="flex flex-col gap-8 animate-all duration-300">
            {userProfile.status === "rejected" ? (
              <div className="bg-brand-card border border-red-500/30 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 max-w-3xl">
                <div className="flex items-center gap-4 border-b border-red-500/10 pb-4">
                  <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Registration Status</span>
                    <h2 className="text-xl font-bold text-red-500 mt-0.5">Registration Rejected</h2>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-brand-text">Your student registration was rejected by the professor.</p>
                  {userProfile.rejectMessage && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-2">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Feedback from Professor:</div>
                      <p className="text-xs text-brand-text font-medium leading-relaxed italic">&quot;{userProfile.rejectMessage}&quot;</p>
                    </div>
                  )}
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                    Please review your profile details and update them in Settings. Correcting your details and saving will resubmit your registration to the professor for review.
                  </p>
                </div>

                <div className="flex pt-2">
                  <Link href="/student/settings" className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    Edit Profile Settings
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl flex flex-col gap-6 max-w-3xl">
                <div className="flex items-center gap-4 border-b border-brand-border/40 pb-4">
                  <div className="p-3.5 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Registration Status</span>
                    <h2 className="text-xl font-bold mt-0.5">Awaiting Approval</h2>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-brand-text">Your student profile is currently pending validation by your professor.</p>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Once your professor verifies your registration details, you will be granted access to the course syllabus, subjects, pre-tests, and network topology labs.
                  </p>
                </div>

                <div className="bg-brand-bg/50 border border-brand-border/30 rounded-xl p-5 mt-2">
                  <h4 className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider mb-3">Submitted Registration Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider">Student ID</span>
                      <p className="text-xs font-mono font-semibold">{userProfile.studentId || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider">Section</span>
                      <p className="text-xs font-semibold">{userProfile.section || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider">Course / Program</span>
                      <p className="text-xs font-semibold">{userProfile.course || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider">Full Name</span>
                      <p className="text-xs font-semibold">{userProfile.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Link href="/student/settings" className="bg-brand-bg hover:bg-brand-bg/80 border border-brand-border text-brand-text font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-wider">
                    Modify Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {isCertificateEligible ? (
              <div className="bg-gradient-to-r from-yellow-500/10 via-brand-card-light to-brand-card border border-yellow-500/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(234,179,8,0.08)] animate-scaleIn">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-brand-text">
                      Official Certificate of Completion Earned!
                    </h2>
                    <p className="text-brand-muted text-xs mt-1 max-w-xl leading-relaxed">
                      Outstanding work! You have completed all 12 modules, pre-tests, simulation sandboxes, lab uploads, and quizzes. You are now officially certified in Advanced Computer Networking.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-brand-bg font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  View & Download Certificate
                </button>
              </div>
            ) : (
              overallProgress >= 80 && (
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-8 shadow-lg animate-scaleIn">
                  <div className="space-y-3 max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center text-sm shadow-inner shrink-0">
                        🔒
                      </span>
                      <h2 className="text-sm font-extrabold text-brand-text">
                        Certificate of Completion
                      </h2>
                    </div>
                    <p className="text-brand-muted text-xs leading-relaxed">
                      Complete all curriculum components to unlock your official Certificate of Completion. Track your progress below to see what remains.
                    </p>
                  </div>
                  <div className="flex-1 max-w-md w-full grid grid-cols-2 sm:grid-cols-3 gap-3 self-center">
                    <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">Modules</span>
                      <span className={`text-base font-extrabold mt-1 ${isAllTopicsCompleted ? "text-green-400" : "text-brand-cyan"}`}>
                        {completedModulesCount}/{totalModulesCount}
                      </span>
                    </div>
                    <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">Pre-tests</span>
                      <span className={`text-base font-extrabold mt-1 ${isAllPretestsCompleted ? "text-green-400" : "text-brand-cyan"}`}>
                        {completedPretestsCount}/{totalPretestsCount}
                      </span>
                    </div>
                    <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">Sim Labs</span>
                      <span className={`text-base font-extrabold mt-1 ${isAllSimLabsCompleted ? "text-green-400" : "text-brand-cyan"}`}>
                        {completedSimLabsCount}/{totalSimLabsCount}
                      </span>
                    </div>
                    <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">PT Labs</span>
                      <span className={`text-base font-extrabold mt-1 ${isAllPTLabsCompleted ? "text-green-400" : "text-brand-cyan"}`}>
                        {completedPTLabsCount}/{totalPTLabsCount}
                      </span>
                    </div>
                    <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-3 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">Quizzes</span>
                      <span className={`text-base font-extrabold mt-1 ${isAllQuizzesCompleted ? "text-green-400" : "text-brand-cyan"}`}>
                        {completedQuizzesCount}/{totalQuizzesCount}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Profile and Active Modules */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Profile Card */}
              {userProfile && (
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2">
                    Academic Profile
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Student ID</div>
                      <div className="text-sm font-semibold font-mono">{userProfile.studentId || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Course & Section</div>
                      <div className="text-sm font-semibold">{userProfile.course || "N/A"} - {userProfile.section || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Year Level</div>
                      <div className="text-sm font-semibold">{userProfile.yearLevel || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Active Subject</div>
                      <div className="text-sm font-semibold">{userProfile.admittedSubject || "Networking 1"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Academic Term</div>
                      <div className="text-sm font-semibold">{userProfile.admittedTerm || "1st Semester"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Institutional Email</div>
                      <div className="text-sm font-semibold text-brand-cyan truncate" title={userProfile.email}>{userProfile.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Modules */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col gap-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan border-b border-brand-border/40 pb-2">
                  Active Modules
                </h2>

                {modules.length === 0 ? (
                  <div className="text-center py-12 text-brand-muted text-sm">
                    No active modules assigned to your curriculum yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {modules.map((mod) => {
                      const progress = getModuleProgress(mod);
                      const { total, completed } = getModuleTopicsCounts(mod);

                      return (
                        <div key={mod.id} className="bg-brand-bg/40 border border-brand-border rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-border-hover transition-colors">
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-cyan">Module</span>
                            <h3 className="text-md font-bold truncate mt-0.5 mb-2">{mod.title}</h3>
                            <div className="text-xs text-brand-muted flex items-center gap-3">
                              <span>{mod.topics.length} topics</span>
                              <span>•</span>
                              <span>{completed} / {total} topics completed</span>
                            </div>
                          </div>

                          <div className="w-full md:w-1/3 flex flex-col gap-1.5 shrink-0">
                            <div className="flex justify-between items-center text-[10px] font-mono text-brand-muted">
                              <span>Module Progress</span>
                              <span className="font-bold text-brand-text">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                              <div 
                                className="h-full bg-brand-cyan transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Overall Progress & Actions */}
            <div className="flex flex-col gap-8">

              {/* Level & XP Mastery Card */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-brand-card to-brand-border/10">
                {/* Decorative glowing backplate */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2 flex justify-between items-center">
                  <span>Student Mastery Level</span>
                  <span className="text-[10px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
                    {userProfile?.xp || 0} XP Total
                  </span>
                </h2>

                <div className="flex items-center gap-5 mb-5">
                  {/* Huge Circular Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-brand-cyan/20 border border-brand-cyan/30 text-white shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">LVL</span>
                    <span className="text-2xl font-black leading-none">{level}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-extrabold text-brand-text">Level Progress</span>
                      <span className="text-[10px] font-mono font-bold text-brand-muted">
                        {currentLevelXp} / {xpNeededForNextLevel} XP
                      </span>
                    </div>

                    {/* Styled progress bar */}
                    <div className="w-full h-2.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border/30 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-cyan to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,188,212,0.4)]"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    
                    <p className="text-[10px] text-brand-muted mt-2">
                      Earn <span className="font-bold text-brand-cyan">{xpNeededForNextLevel - currentLevelXp} XP</span> more to reach Level {level + 1}!
                    </p>
                  </div>
                </div>

                {/* Quick breakdown of XP sources */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-brand-muted">
                    <span className="text-brand-cyan">✓</span> Pretests: <span className="font-bold text-brand-text">+{Object.keys(userProfile?.pretestScores || {}).length * 100}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-muted">
                    <span className="text-brand-cyan">✓</span> Labs: <span className="font-bold text-brand-text">+{Object.keys(userProfile?.labSubmissions || {}).length * 200}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-muted">
                    <span className="text-brand-cyan">✓</span> Exercises: <span className="font-bold text-brand-text">+{Object.keys(userProfile?.completedTopics || {}).filter(k => k.startsWith("999999")).length * 150}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-muted">
                    <span className="text-brand-cyan">✓</span> Modules: <span className="font-bold text-brand-text">+{MODULE_TOPICS_MAP.filter(m => m.topics.every(tid => userProfile?.completedTopics?.[String(tid)] === true || userProfile?.completedTopics?.[Number(tid)] === true)).length * 300}</span>
                  </div>
                </div>
              </div>

              {/* Fire Streak Card */}
              <div className={`bg-brand-card border rounded-2xl p-6 shadow-lg ${currentStreak > 0 ? 'border-orange-500/30 streak-card-glow' : 'border-brand-border'}`}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2">
                  Learning Streak
                </h2>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-4xl ${currentStreak > 0 ? 'streak-fire' : 'opacity-30 grayscale'}`}>
                    🔥
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-extrabold ${currentStreak > 0 ? 'text-orange-400' : 'text-brand-muted'}`}>
                        {currentStreak}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                        {currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                      {getStreakMessage(currentStreak)}
                    </p>
                  </div>
                </div>

                {/* 7-Day Activity Heatmap */}
                <div className="bg-brand-bg/50 border border-brand-border/30 rounded-xl p-3.5 mt-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-brand-muted mb-2.5">Last 7 Days</div>
                  <div className="flex justify-between gap-1.5">
                    {last7Days.map((day) => (
                      <div key={day.date} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                            day.active
                              ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/20'
                              : 'bg-brand-border/20 text-brand-muted/50'
                          }`}
                        >
                          {day.active ? '✓' : '·'}
                        </div>
                        <span className={`text-[9px] font-bold ${day.active ? 'text-orange-400' : 'text-brand-muted/40'}`}>
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Overall Progress Card */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-6 border-b border-brand-border/40 pb-2 w-full text-left">
                  Overall Progress
                </h2>

                {/* Circular indicator style display */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                  {/* Outer circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      fill="transparent" 
                      className="text-brand-bg"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallProgress / 100)}`}
                      className="text-brand-cyan transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-brand-text">{overallProgress}%</span>
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Completed</span>
                  </div>
                </div>

                <div className="text-xs text-brand-muted mb-6">
                  {completedTopicsCount} of {totalTopicsCount} topics completed
                </div>

                <Link 
                  href="/student/curriculum"
                  className="w-full bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Go to Curriculum
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </div>

              {/* Competencies Mastery Card */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col gap-4 text-left">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-2 border-b border-brand-border/40 pb-2">
                  Competency Mastery
                </h2>
                <div className="flex flex-col gap-4">
                  {COMPETENCIES_CONFIG.map((comp) => {
                    const score = userProfile ? calculateCompetencyScore(comp, userProfile, modules as any) : 0;
                    return (
                      <div key={comp.name} className="flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center font-semibold">
                          <span className="truncate max-w-[170px]" title={comp.name}>
                            {comp.icon} {comp.name}
                          </span>
                          <span className="font-mono text-brand-cyan font-bold">{score}%</span>
                        </div>
                        <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                          <div 
                            className="h-full bg-brand-cyan transition-all duration-500"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation Card */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2">
                  Quick Actions
                </h2>
                <div className="flex flex-col gap-3">
                  <Link 
                    href="/student/curriculum" 
                    className="p-3 bg-brand-bg/40 hover:bg-brand-bg/80 border border-brand-border rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold">Access Curriculum Materials</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                  <Link 
                    href="/student/settings" 
                    className="p-3 bg-brand-bg/40 hover:bg-brand-bg/80 border border-brand-border rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-semibold">Edit Student Profile Settings</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>

            </div>

            </div>
          </div>
        )}
      </main>

      {unlockedBadge && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-brand-cyan/40 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-5 shadow-2xl shadow-brand-cyan/20 select-none animate-scaleIn">
            <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest animate-pulse">New Achievement Unlocked!</span>
            
            <div className="w-32 h-32 rounded-full bg-brand-cyan/5 border-2 border-brand-cyan/30 flex items-center justify-center p-4 shadow-lg shadow-brand-cyan/10 relative">
              <img
                src={unlockedBadge.imagePath}
                alt={unlockedBadge.name}
                className="w-24 h-24 object-contain z-10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-brand-cyan absolute">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-brand-text">{unlockedBadge.name}</h3>
              <p className="text-[11px] text-brand-muted mt-2 leading-relaxed px-2">{unlockedBadge.description}</p>
              <div className="mt-3.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider block">Award Criteria Reached</span>
                <span className="text-[10px] text-brand-text/90 font-semibold leading-normal mt-0.5 block">{unlockedBadge.criteria}</span>
              </div>
            </div>

            <button
              onClick={handleClaimBadge}
              className="mt-2 w-full bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-xs font-black py-3 rounded-2xl cursor-pointer uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
            >
              Accept Digital Badge
            </button>
          </div>
        </div>
      )}

      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        studentName={userProfile?.name || userName}
        studentEmail={userProfile?.email || ""}
      />
    </div>
  );
}