"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { QUIZZES_CONFIG, QuizConfig } from "@/data/quizzes";
import { COMPETENCIES_CONFIG, calculateCompetencyScore, StudentProfile, Module } from "@/utils/competencies";

interface CliState {
  hostname: string;
  mode: "user" | "privileged" | "config" | "interface" | "rip";
  interfaceName: string;
  ip: string;
  mask: string;
  duplex: string;
  vlan: number;
  vlanMode: string;
  enableSecret: string;
  description: string;
  routingProtocol: string;
  routeSubnet: string;
  routeMask: string;
  routeHop: string;
  routeExit: string;
  routeAd: number;
  linkState: "down" | "up";
  showConfig: boolean;
  dns: string;
  history: string[];
  outputLog: string[];
}

export default function QuizzesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Quiz execution states
  const [activeQuiz, setActiveQuiz] = useState<QuizConfig | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: MCQ, 2: Matching, 3: CLI Sim
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<number, number>>({});
  const [currentMcqIndex, setCurrentMcqIndex] = useState<number>(0);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  
  // CLI Simulation States
  const [cliInput, setCliInput] = useState("");
  const [cliState, setCliState] = useState<CliState>({
    hostname: "Router",
    mode: "user",
    interfaceName: "",
    ip: "",
    mask: "",
    duplex: "auto",
    vlan: 1,
    vlanMode: "none",
    enableSecret: "",
    description: "",
    routingProtocol: "",
    routeSubnet: "",
    routeMask: "",
    routeHop: "",
    routeExit: "",
    routeAd: 1,
    linkState: "down",
    showConfig: false,
    dns: "",
    history: [],
    outputLog: ["System boot complete. Console line active.\n"]
  });

  const cliBottomRef = useRef<HTMLDivElement>(null);

  // Security Assessment Enforcement
  const [quizStarted, setQuizStarted] = useState(false);
  const [warningsLeft, setWarningsLeft] = useState(3);
  const [quizLocked, setQuizLocked] = useState(false);

  // Quiz Report States
  const [quizReport, setQuizReport] = useState<{
    score: number;
    passed: boolean;
    mcqCorrectCount: number;
    matchingScore: number;
    cliPassed: boolean;
  } | null>(null);

  // Load modules & profile details
  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "Student";
    const email = localStorage.getItem("userEmail") || "";

    Promise.resolve().then(() => {
      setUserName(savedName.split(" ")[0]);
      setUserEmail(email);
    });

    const fetchData = async () => {
      try {
        const [modsRes, usersRes] = await Promise.all([
          fetch("/api/modules"),
          fetch("/api/users")
        ]);

        const modsData = await modsRes.json();
        const usersData = await usersRes.json();

        if (modsData.success) {
          setModules(modsData.modules || []);
        }

        if (usersData.success && usersData.users) {
          const profile = usersData.users.find(
            (u: StudentProfile) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (profile) {
            setStudentProfile(profile);
          }
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync scroll to bottom of CLI simulation terminal log
  useEffect(() => {
    if (cliBottomRef.current) {
      cliBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cliState.outputLog]);

  // Secure Fullscreen handlers
  const handleQuizLockSubmit = useCallback(async (reason: string) => {
    setQuizLocked(true);
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Save failing score of 0
    if (activeQuiz && userEmail) {
      try {
        const uRes = await fetch("/api/users");
        const uData = await uRes.json();
        if (uData.success) {
          const profile = uData.users.find((u: StudentProfile) => u.email.toLowerCase() === userEmail.toLowerCase());
          if (profile) {
            const currentScores = profile.quizScores || {};
            currentScores[String(activeQuiz.moduleId)] = 0;

            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: userEmail,
                quizScores: currentScores
              })
            });

            // Log cheat attempt
            const cheatingLogs = profile.cheatingLogs || [];
            cheatingLogs.push({
              assessmentType: "quiz",
              moduleId: activeQuiz.moduleId,
              timestamp: new Date().toISOString(),
              reason: `Quiz locked: ${reason}`
            });
            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: userEmail, cheatingLogs })
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeQuiz, userEmail]);

  useEffect(() => {
    if (!quizStarted || quizReport || quizLocked) return;

    const handleFsChange = () => {
      const doc = document as unknown as Record<string, unknown>;
      const isFs = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFs) {
        setWarningsLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            handleQuizLockSubmit("Exited fullscreen mode limit");
          }
          return next;
        });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setWarningsLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            handleQuizLockSubmit("Tab switched/shifted focus");
          }
          return next;
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [quizStarted, quizReport, quizLocked, handleQuizLockSubmit]);

  const requestFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen!();
      }
      setQuizStarted(true);
    } catch (e) {
      console.warn("Fullscreen request blocked", e);
      setQuizStarted(true);
    }
  };

  const handleStartQuiz = (quiz: QuizConfig) => {
    setActiveQuiz(quiz);
    setCurrentStep(1);
    setSelectedMcqAnswers({});
    setCurrentMcqIndex(0);
    setMatchingAnswers({});
    setQuizLocked(false);
    setWarningsLeft(3);
    setQuizReport(null);
    
    // Initialize CLI state based on quiz configuration
    setCliState({
      hostname: (quiz.cliSim.initialConfig.hostname || "Router") as any,
      mode: (quiz.cliSim.initialConfig.mode || "user") as any,
      interfaceName: "",
      ip: "",
      mask: "",
      duplex: "auto",
      vlan: 1,
      vlanMode: "none",
      enableSecret: "",
      description: "",
      routingProtocol: "",
      routeSubnet: "",
      routeMask: "",
      routeHop: "",
      routeExit: "",
      routeAd: 1,
      linkState: "down",
      showConfig: false,
      dns: "",
      history: [],
      outputLog: [`System boot complete. Device: ${quiz.cliSim.initialConfig.hostname || "Router"}. Console line active.\n`]
    });

    // Request fullscreen
    requestFullscreen();
  };

  // Cisco CLI execution engine
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const cmd = cliInput.trim();
    const cleanCmd = cmd.toLowerCase().replace(/\s+/g, " ");
    const tokens = cleanCmd.split(" ");
    const originalTokens = cmd.split(/\s+/);
    
    let stdout = "";
    let nextMode = cliState.mode;
    let nextHost = cliState.hostname;
    let nextInterface = cliState.interfaceName;
    let nextIp = cliState.ip;
    let nextMask = cliState.mask;
    let nextDuplex = cliState.duplex;
    let nextVlan = cliState.vlan;
    let nextVlanMode = cliState.vlanMode;
    let nextEnableSecret = cliState.enableSecret;
    let nextDescription = cliState.description;
    let nextRoutingProtocol = cliState.routingProtocol;
    let nextRouteSubnet = cliState.routeSubnet;
    let nextRouteMask = cliState.routeMask;
    let nextRouteHop = cliState.routeHop;
    let nextRouteExit = cliState.routeExit;
    let nextRouteAd = cliState.routeAd;
    let nextLinkState = cliState.linkState;
    let nextShowConfig = cliState.showConfig;
    let nextDns = cliState.dns;

    // Log the input
    const currentPrompt = getPrompt(cliState);
    const cmdEcho = `${currentPrompt}${cmd}`;

    if (tokens[0] === "enable" || tokens[0] === "en") {
      if (cliState.mode === "user") {
        nextMode = "privileged";
      } else {
        stdout = "Already in privileged mode.";
      }
    } else if (tokens[0] === "configure" && (tokens[1] === "terminal" || tokens[1] === "t") || tokens[0] === "config" && tokens[1] === "t" || tokens[0] === "conf" && tokens[1] === "t") {
      if (cliState.mode === "privileged") {
        nextMode = "config";
        stdout = "Enter configuration commands, one per line. End with CNTL/Z.";
      } else {
        stdout = "% Group of commands only authorized in Privileged EXEC mode.";
      }
    } else if (tokens[0] === "hostname" || tokens[0] === "host") {
      if (cliState.mode === "config") {
        if (originalTokens[1]) {
          nextHost = originalTokens[1];
        } else {
          stdout = "% Incomplete command.";
        }
      } else {
        stdout = "% Command hostname rejected: not in global configuration mode.";
      }
    } else if (tokens[0] === "interface" || tokens[0] === "int") {
      if (cliState.mode === "config") {
        if (tokens[1]) {
          nextMode = "interface";
          nextInterface = tokens[1];
        } else {
          stdout = "% Incomplete command.";
        }
      } else {
        stdout = "% Command interface rejected: not in configuration mode.";
      }
    } else if (tokens[0] === "ip" && tokens[1] === "address" || tokens[0] === "ip" && tokens[1] === "addr") {
      if (cliState.mode === "interface") {
        const ip = tokens[2] || "";
        const mask = tokens[3] || "";
        if (ip && mask) {
          nextIp = ip;
          nextMask = mask;
        } else {
          stdout = "% Incomplete command.";
        }
      } else {
        stdout = "% Command rejected: not in interface configuration submode.";
      }
    } else if (tokens[0] === "no" && (tokens[1] === "shutdown" || tokens[1] === "shut")) {
      if (cliState.mode === "interface") {
        nextLinkState = "up";
        stdout = `\n%LINK-5-CHANGED: Interface ${cliState.interfaceName || "GigabitEthernet0/0"}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${cliState.interfaceName || "GigabitEthernet0/0"}, changed state to up`;
      } else {
        stdout = "% Command rejected: not in interface configuration submode.";
      }
    } else if (tokens[0] === "duplex") {
      if (cliState.mode === "interface") {
        if (tokens[1]) {
          nextDuplex = tokens[1];
        } else {
          stdout = "% Incomplete command.";
        }
      } else {
        stdout = "% Command rejected: not in interface submode.";
      }
    } else if (tokens[0] === "switchport" && tokens[1] === "mode" && tokens[2] === "access") {
      if (cliState.mode === "interface") {
        nextVlanMode = "access";
      } else {
        stdout = "% Command rejected: not in interface submode.";
      }
    } else if (tokens[0] === "switchport" && tokens[1] === "access" && tokens[2] === "vlan" && tokens[3]) {
      if (cliState.mode === "interface") {
        const vId = parseInt(tokens[3]);
        if (!isNaN(vId)) {
          nextVlan = vId;
        } else {
          stdout = "% Invalid VLAN ID.";
        }
      } else {
        stdout = "% Command rejected.";
      }
    } else if (tokens[0] === "enable" && tokens[1] === "secret" && tokens[2]) {
      if (cliState.mode === "config") {
        nextEnableSecret = originalTokens[2];
      } else {
        stdout = "% Command rejected: not in configuration mode.";
      }
    } else if (tokens[0] === "description" || tokens[0] === "desc") {
      if (cliState.mode === "interface") {
        nextDescription = originalTokens.slice(1).join(" ");
      } else {
        stdout = "% Command rejected: not in interface submode.";
      }
    } else if (tokens[0] === "router" && tokens[1] === "rip") {
      if (cliState.mode === "config") {
        nextMode = "rip";
        nextRoutingProtocol = "rip";
      } else {
        stdout = "% Command rejected.";
      }
    } else if (tokens[0] === "ip" && tokens[1] === "name-server" && tokens[2]) {
      if (cliState.mode === "config") {
        nextDns = tokens[2];
      } else {
        stdout = "% Command rejected.";
      }
    } else if (tokens[0] === "ip" && tokens[1] === "route" && tokens[2]) {
      if (cliState.mode === "config") {
        const routeSubnet = tokens[2];
        const routeMask = tokens[3] || "";
        const routeHopOrExit = tokens[4] || "";
        const routeAdVal = tokens[5] ? parseInt(tokens[5]) : 1;
        if (routeSubnet && routeMask && routeHopOrExit) {
          nextRouteSubnet = routeSubnet;
          nextRouteMask = routeMask;
          nextRouteAd = routeAdVal;
          if (routeHopOrExit.includes(".")) {
            nextRouteHop = routeHopOrExit;
            nextRouteExit = "";
          } else {
            nextRouteExit = routeHopOrExit;
            nextRouteHop = "";
          }
        } else {
          stdout = "% Incomplete static route parameter.";
        }
      } else {
        stdout = "% Command rejected: not in config mode.";
      }
    } else if ((tokens[0] === "show" && (tokens[1] === "running-config" || tokens[1] === "run")) || (tokens[0] === "sh" && tokens[1] === "run")) {
      if (cliState.mode === "privileged") {
        nextShowConfig = true;
        stdout = `Building configuration...\n\nCurrent configuration:\n!\nversion 15.1\nhostname ${nextHost}\n!\nenable secret 5 ${nextEnableSecret || "not-configured"}\n!\ninterface ${nextInterface || "GigabitEthernet0/0"}\n ip address ${nextIp || "unassigned"} ${nextMask || "unassigned"}\n duplex ${nextDuplex || "auto"}\n description ${nextDescription || "none"}\n vlan ${nextVlanMode === "access" ? nextVlan : "none"}\n!\nrouter rip\n!\nend`;
      } else {
        stdout = "% Command show running-config rejected: not in privileged mode.";
      }
    } else if (tokens[0] === "exit") {
      if (cliState.mode === "interface" || cliState.mode === "rip") {
        nextMode = "config";
      } else if (cliState.mode === "config") {
        nextMode = "privileged";
      } else if (cliState.mode === "privileged") {
        nextMode = "user";
      } else {
        stdout = "Console session ended. Type 'enable' to resume.";
      }
    } else {
      stdout = `% Invalid input detected or command not supported in simulation.`;
    }

    setCliState((prev) => {
      const log = [...prev.outputLog, cmdEcho];
      if (stdout) log.push(stdout);
      return {
        ...prev,
        mode: nextMode,
        hostname: nextHost,
        interfaceName: nextInterface,
        ip: nextIp,
        mask: nextMask,
        duplex: nextDuplex,
        vlan: nextVlan,
        vlanMode: nextVlanMode,
        enableSecret: nextEnableSecret,
        description: nextDescription,
        routingProtocol: nextRoutingProtocol,
        routeSubnet: nextRouteSubnet,
        routeMask: nextRouteMask,
        routeHop: nextRouteHop,
        routeExit: nextRouteExit,
        routeAd: nextRouteAd,
        linkState: nextLinkState,
        showConfig: nextShowConfig,
        dns: nextDns,
        history: [...prev.history, cmd],
        outputLog: log
      };
    });

    setCliInput("");
  };

  const getPrompt = (state: CliState): string => {
    const name = state.hostname;
    if (state.mode === "user") return `${name}>`;
    if (state.mode === "privileged") return `${name}#`;
    if (state.mode === "config") return `${name}(config)#`;
    if (state.mode === "interface") return `${name}(config-if)#`;
    if (state.mode === "rip") return `${name}(config-router)#`;
    return `${name}>`;
  };

  // Evaluate CLI simulation command targets
  const checkCliSimPassed = (): boolean => {
    if (!activeQuiz) return false;
    const moduleId = activeQuiz.moduleId;

    switch (moduleId) {
      case 1782134355228: // Intro Topology
        return cliState.hostname === "SW-Core";
      case 1782182808093: // Comm 1
        return cliState.showConfig === true;
      case 1782181968596: // Comm 2 (DNS)
        return cliState.dns === "8.8.8.8";
      case 1782184909611: // Addressing
        return cliState.ip === "192.168.10.1" && cliState.mask === "255.255.255.0" && cliState.linkState === "up";
      case 1782185665993: // Ethernet 1
        return cliState.duplex === "full";
      case 1782186311891: // Ethernet 2 (VLANs)
        return cliState.vlanMode === "access" && cliState.vlan === 20;
      case 1782186928370: // Net Config
        return cliState.enableSecret === "cisco123";
      case 1782197552474: // Basic Router
        return cliState.description === "Link to WAN";
      case 1782198533015: // Routing Concepts
        return cliState.routingProtocol === "rip";
      case 1782199846377: // Static 1
        return cliState.routeSubnet === "192.168.20.0" && cliState.routeMask === "255.255.255.0" && cliState.routeHop === "10.0.0.2";
      case 1782200580841: // Static 2
        return cliState.routeSubnet === "10.0.5.0" && cliState.routeMask === "255.255.255.0" && (cliState.routeExit.toLowerCase() === "gigabitethernet0/0" || cliState.routeExit.toLowerCase() === "g0/0");
      case 1782203599448: // Advance Static
        return cliState.routeSubnet === "0.0.0.0" && cliState.routeMask === "0.0.0.0" && cliState.routeHop === "203.0.113.2" && cliState.routeAd === 150;
      default:
        return false;
    }
  };

  // Submit Quiz Grade assessment
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // 1. Evaluate MCQ (50 Items)
    let mcqCorrectCount = 0;
    activeQuiz.mcqs.forEach((q, idx) => {
      if (selectedMcqAnswers[idx] === q.correctIndex) {
        mcqCorrectCount++;
      }
    });
    const mcqPassed = mcqCorrectCount >= 40; // 80% threshold (40/50)

    // 2. Evaluate Matching
    let correctMatches = 0;
    Object.entries(activeQuiz.matching.correctAnswers).forEach(([rowId, expectedVal]) => {
      if (matchingAnswers[rowId] === expectedVal) {
        correctMatches++;
      }
    });

    // 3. Evaluate CLI Sim
    const cliPassed = checkCliSimPassed();

    // Compute final scores
    let finalScore = 0;
    if (mcqPassed) finalScore += 1;
    if (correctMatches === Object.keys(activeQuiz.matching.correctAnswers).length) finalScore += 1;
    if (cliPassed) finalScore += 1;

    const passed = finalScore >= 2; // Pass threshold 2/3 (>=66.6%)

    setQuizReport({
      score: finalScore,
      passed,
      mcqCorrectCount,
      matchingScore: correctMatches,
      cliPassed
    });

    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Save to user profile via PUT
    if (userEmail) {
      try {
        const uRes = await fetch("/api/users");
        const uData = await uRes.json();
        if (uData.success) {
          const profile = uData.users.find((u: StudentProfile) => u.email.toLowerCase() === userEmail.toLowerCase());
          if (profile) {
            const currentScores = profile.quizScores || {};
            
            // Set highest score
            const prevScore = currentScores[String(activeQuiz.moduleId)] || 0;
            currentScores[String(activeQuiz.moduleId)] = Math.max(prevScore, finalScore);

            const res = await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: userEmail,
                quizScores: currentScores
              })
            });
            const data = await res.json();
            if (data.success) {
              // Reload local profiles
              setStudentProfile((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  quizScores: currentScores
                };
              });
            }
          }
        }
      } catch (e) {
        console.error("Error saving quiz score:", e);
      }
    }
  };

  const getModuleQuizScore = (moduleId: number): number | null => {
    if (!studentProfile) return null;
    const scores = studentProfile.quizScores || {};
    const sc = scores[String(moduleId)];
    return sc !== undefined ? sc : null;
  };

  const getIsModuleFinished = (moduleId: number): boolean => {
    if (!studentProfile) return false;
    const completedTopics = studentProfile.completedTopics || {};
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule) return false;
    if (!targetModule.topics || targetModule.topics.length === 0) return false;
    return targetModule.topics.every(t => completedTopics[String(t.id)] === true || completedTopics[Number(t.id)] === true);
  };

  // Learning recommendations mapper based on weak areas
  const getWeakRecommendations = () => {
    if (!studentProfile || modules.length === 0) return [];
    
    return COMPETENCIES_CONFIG.map((comp) => {
      const score = calculateCompetencyScore(comp, studentProfile, modules);
      if (score < 80) {
        // Recommend this competency domain configuration
        return {
          competency: comp.name,
          score,
          icon: comp.icon,
          theme: comp.themeColor,
          recommendedModules: modules.filter((m) => comp.moduleIds.includes(m.id))
        };
      }
      return null;
    }).filter(Boolean);
  };

  const recommendationsList = getWeakRecommendations();

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/student/quizzes" />

      <main className="p-10 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        
        {/* QUIZ TAKING ACTIVE ASSESSMENT INTERFACE */}
        {activeQuiz && !quizReport && !quizLocked ? (
          <div className="flex-grow flex flex-col animate-scaleIn bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl relative">
            
            {/* Header Area */}
            <div className="border-b border-brand-border/40 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div>
                <span className="text-[10px] text-brand-cyan uppercase tracking-widest font-extrabold font-mono">
                  Module Quiz Assessment ({currentStep} of 3)
                </span>
                <h1 className="text-xl font-bold mt-1 text-brand-text">{activeQuiz.moduleTitle} Quiz</h1>
                <p className="text-[11px] text-brand-muted mt-1">Domain: {activeQuiz.competencyDomain}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg select-none">
                  ⚠️ Warnings: {warningsLeft} / 3
                </span>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel the quiz? Your attempt will be lost.")) {
                      setActiveQuiz(null);
                      if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                      }
                    }
                  }}
                  className="px-4 py-2 border border-brand-border/60 hover:border-red-500/50 hover:text-red-400 text-brand-muted text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel Quiz
                </button>
              </div>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="mb-8 grid grid-cols-3 gap-2 text-center text-xs select-none">
              <button
                disabled={currentStep < 1}
                onClick={() => setCurrentStep(1)}
                className={`py-3 rounded-xl border font-bold transition-all ${
                  currentStep === 1
                    ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-sm"
                    : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:border-brand-cyan/25"
                }`}
              >
                1. Multiple Choice
              </button>
              <button
                disabled={currentStep < 2}
                onClick={() => setCurrentStep(2)}
                className={`py-3 rounded-xl border font-bold transition-all ${
                  currentStep === 2
                    ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-sm"
                    : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:border-brand-cyan/25"
                }`}
              >
                2. Term Matching
              </button>
              <button
                disabled={currentStep < 3}
                onClick={() => setCurrentStep(3)}
                className={`py-3 rounded-xl border font-bold transition-all ${
                  currentStep === 3
                    ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-sm"
                    : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:border-brand-cyan/25"
                }`}
              >
                3. CLI Config Simulator
              </button>
            </div>

            {/* STEP 1: MULTIPLE CHOICE (50 Items) */}
            {currentStep === 1 && (
              <div className="flex-grow flex flex-col gap-6 animate-scaleIn select-none">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Grid Navigation (50 questions) */}
                  <div className="md:w-64 bg-brand-bg/25 border border-brand-border/30 rounded-xl p-4 flex flex-col shrink-0">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-brand-text mb-3 border-b border-brand-border/20 pb-1.5 flex justify-between items-center">
                      <span>Questions Grid</span>
                      <span className="font-mono text-brand-cyan">
                        {Object.keys(selectedMcqAnswers).length} / 50 Done
                      </span>
                    </h4>
                    
                    <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {activeQuiz.mcqs.map((_, idx) => {
                        const isCurrent = currentMcqIndex === idx;
                        const isAnswered = selectedMcqAnswers[idx] !== undefined;
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentMcqIndex(idx)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                              isCurrent
                                ? "bg-brand-cyan text-white shadow shadow-brand-cyan/40 scale-105"
                                : isAnswered
                                ? "bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan"
                                : "bg-brand-card border border-brand-border/45 text-brand-muted hover:border-brand-cyan/35"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-brand-border/20 flex flex-col gap-1.5 text-[9px] text-brand-muted">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-brand-cyan"></span>
                        <span>Current Question</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-brand-cyan/20 border border-brand-cyan/40"></span>
                        <span>Answered Question</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-brand-card border border-brand-border/45"></span>
                        <span>Unanswered Question</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Question Content */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
                      <div className="flex justify-between items-center text-[10px] text-brand-cyan font-bold uppercase tracking-wider mb-2">
                        <span>Question {currentMcqIndex + 1} of 50</span>
                        <span>Module Quiz Assessment</span>
                      </div>
                      <p className="text-sm font-semibold text-brand-text leading-relaxed">
                        {activeQuiz.mcqs[currentMcqIndex]?.question}
                      </p>
                    </div>

                    <div className="grid gap-3 w-full">
                      {activeQuiz.mcqs[currentMcqIndex]?.options.map((opt, oIdx) => {
                        const isSelected = selectedMcqAnswers[currentMcqIndex] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setSelectedMcqAnswers(prev => ({ ...prev, [currentMcqIndex]: oIdx }))}
                            className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-sm"
                                : "bg-brand-bg/40 border-brand-border/45 text-brand-text/90 hover:border-brand-cyan/35 hover:bg-brand-bg/60"
                            }`}
                          >
                            <span className="font-bold text-brand-cyan mr-3">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Question navigation footer */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-border/10">
                      <button
                        disabled={currentMcqIndex === 0}
                        onClick={() => setCurrentMcqIndex(prev => prev - 1)}
                        className="px-4 py-2 rounded-lg bg-brand-bg/40 border border-brand-border/30 text-xs font-bold text-brand-text disabled:opacity-30 disabled:pointer-events-none hover:bg-brand-bg/60 cursor-pointer"
                      >
                        ← Previous
                      </button>
                      
                      <button
                        disabled={currentMcqIndex === 49}
                        onClick={() => setCurrentMcqIndex(prev => prev + 1)}
                        className="px-4 py-2 rounded-lg bg-brand-cyan text-white text-xs font-bold shadow hover:bg-brand-cyan/90 cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TERM MATCHING */}
            {currentStep === 2 && (
              <div className="flex-grow flex flex-col gap-6 animate-scaleIn select-none">
                <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-brand-cyan mb-1">Question 2: Term Matching</h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    {activeQuiz.matching.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left items and their selections */}
                  <div className="space-y-4">
                    {activeQuiz.matching.items.map((item) => (
                      <div key={item.id} className="bg-brand-bg/30 border border-brand-border/30 rounded-xl p-4 flex flex-col gap-3">
                        <span className="text-xs font-bold text-brand-text">{item.label}</span>
                        <div className="flex flex-wrap gap-2">
                          {activeQuiz.matching.options.map((opt) => {
                            const isSelected = matchingAnswers[item.id] === opt.val;
                            return (
                              <button
                                key={opt.val}
                                onClick={() => setMatchingAnswers(prev => ({ ...prev, [item.id]: opt.val }))}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow"
                                    : "bg-brand-card border-brand-border/40 text-brand-muted hover:border-brand-cyan/30"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-brand-bg/25 border border-brand-border/30 rounded-xl p-5 text-xs text-brand-muted leading-relaxed">
                    <h4 className="font-bold text-brand-text mb-2 uppercase tracking-wide text-[10px]">Matching Target Glossary</h4>
                    <ul className="space-y-2">
                      {activeQuiz.matching.options.map(opt => (
                        <li key={opt.val} className="flex items-start gap-2">
                          <span className="text-brand-cyan">•</span>
                          <span><strong>{opt.label}:</strong> matches corresponding category.</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CLI SIMULATOR */}
            {currentStep === 3 && (
              <div className="flex-grow flex grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scaleIn select-none">
                
                {/* Console instructions & checks */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-brand-cyan mb-2">Question 3: Cisco CLI Sim</h3>
                    <p className="text-[11px] text-brand-muted leading-relaxed">
                      {activeQuiz.cliSim.scenario}
                    </p>
                  </div>

                  <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-4">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-brand-text mb-3">Tasks Checklist</h4>
                    <ul className="space-y-3">
                      {activeQuiz.cliSim.instructions.map((ins, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 text-xs font-semibold leading-relaxed">
                          <span className="mt-0.5 shrink-0">
                            {cliState.history.some(h => h.toLowerCase().includes(ins.split("'")[1] || "___")) ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-brand-muted/40">•</span>
                            )}
                          </span>
                          <span className={cliState.history.some(h => h.toLowerCase().includes(ins.split("'")[1] || "___")) ? "text-green-400 line-through opacity-70" : "text-brand-muted"}>
                            {ins}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Virtual CLI Terminal */}
                <div className="lg:col-span-2 flex flex-col bg-black border border-brand-border rounded-xl overflow-hidden font-mono shadow-2xl h-[380px]">
                  
                  {/* Console Header */}
                  <div className="bg-brand-card/85 px-4 py-2 border-b border-brand-border/40 flex items-center justify-between text-[11px] text-brand-muted">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span>CLI Console (Interactive)</span>
                    </span>
                    <span className="font-mono text-[9px]">{cliState.hostname} connected</span>
                  </div>

                  {/* Terminal Log */}
                  <div className="flex-1 overflow-y-auto p-4 text-xs space-y-1.5 scrollbar-thin text-green-400">
                    {cliState.outputLog.map((logLine, lIdx) => (
                      <div key={lIdx} className="whitespace-pre-wrap break-all leading-normal">
                        {logLine}
                      </div>
                    ))}
                    <div ref={cliBottomRef} />
                  </div>

                  {/* Terminal Input Form */}
                  <form onSubmit={handleCliSubmit} className="bg-slate-950 px-4 py-2.5 border-t border-brand-border/45 flex items-center gap-2 text-xs">
                    <span className="text-green-400 shrink-0 select-none font-mono">
                      {getPrompt(cliState)}
                    </span>
                    <input
                      type="text"
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      placeholder="Type Cisco IOS commands..."
                      className="flex-1 bg-transparent text-green-400 outline-none border-none font-mono text-xs focus:ring-0 focus:outline-none placeholder-green-800"
                      autoFocus
                    />
                  </form>
                </div>
              </div>
            )}

            {/* Footer Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-brand-border/40 flex justify-between items-center select-none">
              <button
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(prev => prev - 1);
                }}
                disabled={currentStep === 1}
                className="px-5 py-2.5 bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous Step
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-6 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer animate-pulse"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedMcqAnswers).length < activeQuiz.mcqs.length || Object.keys(matchingAnswers).length < activeQuiz.matching.items.length}
                  className="px-7 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Submit Quiz
                </button>
              )}
            </div>

          </div>
        ) : quizLocked ? (
          
          /* LOCK SCREEN (Academic Security violation) */
          <div className="max-w-xl mx-auto bg-brand-card border border-brand-border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-6 shadow-2xl select-none my-12 animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-red-500 mb-2">Quiz Session Locked</h1>
              <p className="text-xs text-brand-muted leading-relaxed">
                This quiz attempt has been auto-submitted and locked due to security parameters violations (switching focus tabs or exiting fullscreen).
              </p>
            </div>
            <div className="bg-red-500/15 border border-red-500/20 px-6 py-3.5 rounded-xl w-full flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Attempt Grade</span>
              <span className="text-base font-mono font-black text-red-400">0 / 3</span>
            </div>
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizLocked(false);
                setQuizReport(null);
              }}
              className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Return to Quizzes
            </button>
          </div>

        ) : quizReport && activeQuiz ? (
          
          /* QUIZ REPORT DETAILS PANEL (IMMEDIATE FEEDBACK) */
          <div className="animate-scaleIn bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl flex flex-col gap-8">
            
            {/* Header Report */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-border/40 pb-6">
              <div>
                <span className="text-[10px] text-brand-cyan uppercase tracking-widest font-mono font-bold">
                  Assessment Report Card
                </span>
                <h1 className="text-2xl font-black mt-1">{activeQuiz.moduleTitle} Quiz</h1>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Competency domain mapping: <strong className="text-brand-text">{activeQuiz.competencyDomain}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-brand-muted uppercase tracking-widest font-bold font-mono">Final Score</div>
                  <div className={`text-2xl font-black font-mono ${quizReport.passed ? "text-green-400" : "text-red-400"}`}>
                    {quizReport.score} / 3
                  </div>
                </div>
                <div className={`px-4 py-2.5 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wider shadow-sm border ${
                  quizReport.passed 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {quizReport.passed ? "✓ Passed" : "✗ Failed"}
                </div>
              </div>
            </div>

            {/* Detailed Itemized Question Feedback */}
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan border-b border-brand-border/30 pb-2">
                Itemized Feedback Breakdown
              </h2>

              {/* 1. MCQ Feedback */}
              <div className="bg-brand-bg/30 border border-brand-border/20 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-xs text-brand-text">Question 1: Multiple Choice</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    quizReport.mcqCorrectCount >= 40 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {quizReport.mcqCorrectCount} / 50 Correct ({Math.round(quizReport.mcqCorrectCount / 50 * 100)}%)
                  </span>
                </div>
                <p className="text-xs text-brand-muted font-medium mt-1 leading-relaxed">
                  You scored <strong className={quizReport.mcqCorrectCount >= 40 ? "text-green-400" : "text-red-400"}>{quizReport.mcqCorrectCount} out of 50</strong> correct answers on the Multiple Choice assessment. A minimum score of 40/50 (80%) is required to earn the MCQ credit.
                </p>
                {quizReport.mcqCorrectCount < 50 && (
                  <div className="text-[10px] text-brand-muted mt-2 max-h-[220px] overflow-y-auto bg-brand-bg/50 border border-brand-border/30 rounded-lg p-3 space-y-3">
                    <h4 className="font-bold text-brand-text mb-1 uppercase tracking-wider">Review incorrect answers:</h4>
                    {activeQuiz.mcqs.map((q, idx) => {
                      const userAns = selectedMcqAnswers[idx];
                      const isCorrect = userAns === q.correctIndex;
                      if (!isCorrect) {
                        return (
                          <div key={idx} className="border-b border-brand-border/20 pb-3 mb-3 last:border-b-0 last:pb-0">
                            <div className="font-bold text-brand-text">Q{idx + 1}: {q.question}</div>
                            <div className="text-red-400 mt-1">Your Answer: {userAns !== undefined ? q.options[userAns] : "No answer"}</div>
                            <div className="text-green-400">Correct Answer: {q.options[q.correctIndex]}</div>
                            <div className="text-brand-cyan/85 mt-1 text-[9px] leading-relaxed">💡 Explanation: {q.explanation}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* 2. Matching Feedback */}
              <div className="bg-brand-bg/30 border border-brand-border/20 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-xs text-brand-text">Question 2: Term Matching</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    quizReport.matchingScore === Object.keys(activeQuiz.matching.correctAnswers).length 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {quizReport.matchingScore} / {Object.keys(activeQuiz.matching.correctAnswers).length} Matches Correct
                  </span>
                </div>
                <div className="grid gap-2 mt-2">
                  {activeQuiz.matching.items.map(item => {
                    const userMatch = matchingAnswers[item.id];
                    const correctMatch = activeQuiz.matching.correctAnswers[item.id];
                    const isItemCorrect = userMatch === correctMatch;
                    
                    const userLabel = activeQuiz.matching.options.find(o => o.val === userMatch)?.label || "Unmatched";
                    const correctLabel = activeQuiz.matching.options.find(o => o.val === correctMatch)?.label;

                    return (
                      <div key={item.id} className="flex justify-between items-center text-[11px] border-b border-brand-border/20 py-2">
                        <span className="text-brand-text/90 font-medium">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className={isItemCorrect ? "text-green-400" : "text-red-400"}>
                            {userLabel}
                          </span>
                          {!isItemCorrect && (
                            <span className="text-green-400 font-bold">
                              (Correct: {correctLabel})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/15 rounded-lg p-3 mt-2 leading-relaxed">
                  💡 <strong>Explanation:</strong> {activeQuiz.matching.explanation}
                </p>
              </div>

              {/* 3. CLI Sim Feedback */}
              <div className="bg-brand-bg/30 border border-brand-border/20 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-xs text-brand-text">Question 3: Cisco CLI Simulator</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    quizReport.cliPassed ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {quizReport.cliPassed ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="text-xs text-brand-muted leading-relaxed mt-1">
                  <strong>Expected CLI sequence configuration steps:</strong>
                  <ul className="list-disc pl-5 mt-1 text-[11px] space-y-1">
                    {activeQuiz.cliSim.instructions.map((ins, iIdx) => (
                      <li key={iIdx}>{ins}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/15 rounded-lg p-3 mt-2 leading-relaxed">
                  💡 <strong>Explanation:</strong> {activeQuiz.cliSim.explanation}
                </p>
              </div>
            </div>

            {/* Recommendations Pathway (Learning Path Recommendation) */}
            {!quizReport.passed && (
              <div className="bg-yellow-500/5 border border-yellow-500/25 rounded-2xl p-6 shadow">
                <h3 className="font-black text-sm text-yellow-500 flex items-center gap-2 mb-2">
                  🛡️ Learning Path Recommendation
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Since your score falls below the 80% passing threshold, we recommend refreshing your knowledge of this competency domain. Take a look at these recommended study materials:
                </p>
                <div className="mt-4 grid gap-3">
                  {modules
                    .filter((m) => {
                      const quizComp = QUIZZES_CONFIG.find(q => q.moduleId === activeQuiz.moduleId);
                      const targetComp = COMPETENCIES_CONFIG.find(c => c.name === quizComp?.competencyDomain);
                      return targetComp?.moduleIds.includes(m.id);
                    })
                    .map((recMod) => (
                      <Link
                        key={recMod.id}
                        href={`/student/curriculum?moduleId=${recMod.id}`}
                        className="bg-brand-bg/50 border border-brand-border/40 hover:border-brand-cyan/50 p-4 rounded-xl flex justify-between items-center transition-all group"
                      >
                        <div>
                          <div className="text-[10px] text-brand-cyan uppercase tracking-widest font-bold">Recommended Subject Study</div>
                          <div className="text-xs font-bold text-brand-text group-hover:text-brand-cyan mt-1">{recMod.title}</div>
                        </div>
                        <span className="text-[11px] text-brand-cyan group-hover:translate-x-1 transition-transform">
                          Go to Curriculum →
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-brand-border/40 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizReport(null);
                }}
                className="px-6 py-2.5 bg-brand-bg hover:bg-brand-bg/80 border border-brand-border text-brand-text text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>

              <button
                onClick={() => handleStartQuiz(activeQuiz)}
                className="px-6 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Retake Quiz
              </button>
            </div>

          </div>
        ) : (
          
          /* MAIN QUIZZES GRID & RECOMMENDATIONS PANEL */
          <>
            <header className="mb-10 select-none">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-cyan mb-2">
                Student Assessment Dashboard
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">
                Welcome back, {userName}!
              </h1>
              <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
                Test your networking configuration mastery and theoretical expertise. Quizzes are secure, auto-graded, and provide immediate diagnostic feedback logs and customized learning paths.
              </p>
            </header>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT & CENTER COLUMN: Quizzes List Grid */}
                <div className="lg:col-span-2 flex flex-col gap-6 select-none">
                  <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan border-b border-brand-border/30 pb-2">
                    Available Module Quizzes
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUIZZES_CONFIG.map((quiz) => {
                      const score = getModuleQuizScore(quiz.moduleId);
                      const isAttempted = score !== null;
                      const hasPassed = isAttempted && score >= 2;
                      const isModuleFinished = getIsModuleFinished(quiz.moduleId);

                      return (
                        <div
                          key={quiz.moduleId}
                          className={`bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-md group ${
                            !isModuleFinished ? "opacity-60" : "hover:border-brand-cyan/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[9px] font-mono font-extrabold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                {quiz.competencyDomain}
                              </span>

                              {!isModuleFinished ? (
                                <span className="text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                  🔒 Locked
                                </span>
                              ) : isAttempted ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  hasPassed 
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  Score: {score}/3 ({hasPassed ? "Passed" : "Failed"})
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono bg-brand-bg border border-brand-border text-brand-muted px-2 py-0.5 rounded uppercase">
                                  Not Attempted
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-sm text-brand-text group-hover:text-brand-cyan transition-colors mt-3">
                              {quiz.moduleTitle} Quiz
                            </h3>
                            <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">
                              Evaluates MCQ parsing, terminology categorization, and virtual Cisco IOS configuration commands.
                            </p>
                            {!isModuleFinished && (
                              <p className="text-[10px] text-red-400/90 font-semibold mt-2">
                                * Complete all module learning topics to unlock this quiz.
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              if (isModuleFinished) {
                                handleStartQuiz(quiz);
                              }
                            }}
                            disabled={!isModuleFinished}
                            className={`w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all text-center ${
                              isModuleFinished 
                                ? "bg-brand-bg hover:bg-brand-cyan hover:text-brand-bg border border-brand-border hover:border-transparent text-brand-cyan cursor-pointer"
                                : "bg-brand-bg/40 border border-brand-border/30 text-brand-muted cursor-not-allowed"
                            }`}
                          >
                            {!isModuleFinished ? "Locked (Complete Study)" : isAttempted ? "Retake Assessment" : "Start Assessment"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: Learning Recommendations Panel (Learning Path Recommendation) */}
                <div className="lg:col-span-1 flex flex-col gap-6 select-none">
                  <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan border-b border-brand-border/30 pb-2">
                    Learning Path Guide
                  </h2>

                  {recommendationsList.length === 0 ? (
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center shadow-md">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-4">
                        ✓
                      </div>
                      <h3 className="text-xs font-bold text-brand-text uppercase tracking-wide">All Competencies Solid</h3>
                      <p className="text-[11px] text-brand-muted mt-2 leading-relaxed">
                        Fantastic job! All your calculated networking competency scores are at 80% or above. Keep taking quiz assessments to practice!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-brand-card border border-brand-border/40 rounded-2xl p-4 text-[11px] text-brand-muted leading-relaxed">
                        ⚠️ <strong>Identified Competency Weaknesses:</strong> The list below outlines competencies with mastery scores below <strong>80%</strong>. Follow the custom paths to study:
                      </div>

                      {recommendationsList.map((rec, rIdx) => {
                        if (!rec) return null;
                        return (
                          <div
                            key={rIdx}
                            className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{rec.icon}</span>
                                <h3 className="font-extrabold text-xs text-brand-text max-w-[150px] leading-tight">
                                  {rec.competency}
                                </h3>
                              </div>
                              <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                                {rec.score}%
                              </span>
                            </div>

                            <div className="border-t border-brand-border/30 pt-3">
                              <div className="text-[9px] uppercase tracking-wider text-brand-cyan font-bold mb-2">
                                Recommended Study Path
                              </div>
                              <div className="space-y-2">
                                {rec.recommendedModules.map((m) => (
                                  <Link
                                    key={m.id}
                                    href={`/student/curriculum?moduleId=${m.id}`}
                                    className="block p-2.5 rounded-lg bg-brand-bg/50 border border-brand-border/30 hover:border-brand-cyan/40 text-[11px] font-semibold text-brand-muted hover:text-brand-cyan transition-colors"
                                  >
                                    📘 {m.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
