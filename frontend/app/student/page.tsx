"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
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
  pretest?: any[];
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

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName.split(" ")[0]);
    }

    const email = localStorage.getItem("userEmail") || "";
    const savedNameFull = localStorage.getItem("userName") || "Student";
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

    const fetchData = async () => {
      try {
        // Fetch users to get profile details
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          const profile = usersData.users.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (profile) {
            setUserProfile(profile);
            
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
      let newTopics = mod.topics.filter(t => 
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
                      <p className="text-xs text-brand-text font-medium leading-relaxed italic">"{userProfile.rejectMessage}"</p>
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
        )}
      </main>
    </div>
  );
}