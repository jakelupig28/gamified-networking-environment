"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { INTERACTIVE_ACTIVITIES_CONFIG } from "@/data/interactiveActivities";

const CircularProgress = ({ progress, size = 20, strokeWidth = 2, isSelected = false }: { progress: number, size?: number, strokeWidth?: number, isSelected?: boolean }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={isSelected ? "text-white/20" : "text-brand-border/30"}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={isSelected ? "text-white" : "text-brand-cyan"}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.35s" }}
        />
      </svg>
    </div>
  );
};

// Helper to extract clean user initials for avatars
function getAvatarInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

async function recordCheatingLogShared(email: string, moduleId: number, assessmentType: "pretest" | "interactive", reason: string) {
  if (!email) return;
  try {
    const userRes = await fetch("/api/users");
    const userData = await userRes.json();
    if (userData.success && userData.users) {
      const profile = userData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (profile) {
        const cheatingLogs = profile.cheatingLogs || [];
        cheatingLogs.push({
          assessmentType,
          moduleId,
          timestamp: new Date().toISOString(),
          reason
        });
        await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            cheatingLogs
          })
        });
      }
    }
  } catch (e) {
    console.error("Error saving cheating log:", e);
  }
}

interface SimulationLabActivityCardProps {
  moduleId: number;
  isCompleted: boolean;
  onComplete: () => void;
  handleSelectNextTopic: () => void;
}

const SIMULATION_LAB_DATA: Record<number, {
  title: string;
  labId: string;
  description: string;
  requirements: string[];
}> = {
  3: {
    title: "IPv4 Static Addressing Challenge",
    labId: "ipv4-addressing",
    description: "Configure static IP addresses for two PCs on the same subnet and verify connectivity using the ping utility.",
    requirements: [
      "Add two PCs (pc1 and pc2) to the canvas.",
      "Connect them using a crossover cable (or straight cables through a switch).",
      "Configure pc1 with IP address 192.168.1.10, subnet mask 255.255.255.0.",
      "Configure pc2 with IP address 192.168.1.20, subnet mask 255.255.255.0.",
      "Start the Kathará Lab simulation.",
      "Open pc1's console terminal and successfully ping pc2 (192.168.1.20)."
    ]
  },
  6: {
    title: "Local Host Cabling Challenge",
    labId: "host-cabling",
    description: "Cabling is the backbone of local networks. Practice physical media selection and local configuration.",
    requirements: [
      "Add a PC (pc1) and a Switch (sw1) to the canvas.",
      "Connect pc1 and sw1 using a straight-through cable link.",
      "Configure pc1's eth0 interface with IP address 10.0.0.10, subnet mask 255.255.255.0.",
      "Start the Kathará Lab simulation to boot the interfaces."
    ]
  },
  7: {
    title: "Gateway Router Configuration Challenge",
    labId: "router-config",
    description: "Routers act as gateways to outer networks. Assign interface IPs and check client-router pings.",
    requirements: [
      "Add a PC (pc1) and a Router (r1) to the canvas.",
      "Connect pc1 and r1 directly (or through a switch).",
      "Configure Router r1's eth0 interface with IP address 192.168.1.1, subnet mask 255.255.255.0.",
      "Configure PC pc1 with IP address 192.168.1.10 and gateway IP 192.168.1.1.",
      "Start the Kathará Lab, open pc1's console, and ping the gateway (192.168.1.1) successfully."
    ]
  },
  9: {
    title: "Inter-network Static Routing Challenge",
    labId: "static-routing",
    description: "Routers need static route definitions to forward packets to remote subnets. Link two local networks and check pings.",
    requirements: [
      "Connect Router r1 to Router r2 via crossover cable.",
      "Add pc1 on subnet 192.168.1.0/24 connected to r1, and pc2 on subnet 192.168.2.0/24 connected to r2.",
      "Configure a static route on Router r1 to allow host pc1 to ping host pc2 on the remote network.",
      "Start the Kathará Lab, open pc1's console, and perform a successful ping to pc2 (192.168.2.20)."
    ]
  }
};

function SimulationLabActivityCard({ moduleId, isCompleted, onComplete, handleSelectNextTopic }: SimulationLabActivityCardProps) {
  const getModuleIndexLocal = (mId: number): number => {
    const ids = [
      1782134355228, 1782182808093, 1782181968596, 1782184909611,
      1782185665993, 1782186311891, 1782186928370, 1782197552474,
      1782198533015, 1782199846377, 1782200580841, 1782203599448
    ];
    return ids.indexOf(mId);
  };

  const moduleIdx = getModuleIndexLocal(moduleId);
  const lab = SIMULATION_LAB_DATA[moduleIdx];

  if (!lab) {
    return (
      <div className="bg-brand-card/85 border border-brand-border/40 p-6 rounded-2xl text-center italic text-brand-muted text-xs">
        No simulation lab activity configured for this module.
      </div>
    );
  }

  return (
    <div className="bg-slate-950/65 backdrop-blur-md border border-brand-border/80 rounded-2xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-6 select-none max-w-2xl">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-brand-cyan text-xs font-black uppercase tracking-wider">Simulation Lab Activity</h3>
          <h4 className="text-lg font-extrabold text-brand-text mt-1">{lab.title}</h4>
          <p className="text-xs text-brand-muted mt-2 leading-relaxed">{lab.description}</p>
        </div>
        {isCompleted ? (
          <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black py-1.5 px-3 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md">
            ✓ Completed
          </span>
        ) : (
          <span className="bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-black py-1.5 px-3 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md">
            Pending Attempt
          </span>
        )}
      </div>

      <div className="border-t border-brand-border/30 pt-4">
        <h5 className="text-[10px] text-brand-cyan uppercase tracking-wider font-extrabold mb-3">Lab Requirements Checklist</h5>
        <ul className="space-y-2.5">
          {lab.requirements.map((req, rIdx) => (
            <li key={rIdx} className="flex items-start gap-2.5 text-xs text-brand-text/95 leading-relaxed font-semibold">
              <span className="text-brand-cyan text-xs mt-0.5">•</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 justify-end mt-4 border-t border-brand-border/30 pt-4">
        {isCompleted && (
          <button
            onClick={handleSelectNextTopic}
            className="bg-slate-900 hover:bg-slate-850 text-brand-muted hover:text-brand-text border border-brand-border/40 text-[10px] font-black py-2.5 px-5 rounded-xl cursor-pointer uppercase tracking-wider transition-colors shrink-0"
          >
            Next Topic
          </button>
        )}
        <a
          href={`/student/simulation?labId=${lab.labId}&moduleId=${moduleId}`}
          className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-[10px] font-black py-2.5 px-6 rounded-xl cursor-pointer uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] flex items-center gap-1.5 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          {isCompleted ? "Relaunch Simulation Lab" : "Launch Simulation Lab"}
        </a>
      </div>
    </div>
  );
}

interface InteractiveSubnettingActivityProps {
  onComplete: () => void;
  isCompleted: boolean;
  handleSelectNextTopic: () => void;
  moduleId: number;
}

function InteractiveSubnettingActivity({ onComplete, isCompleted, handleSelectNextTopic, moduleId }: InteractiveSubnettingActivityProps) {
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
  const moduleIdx = ids.indexOf(moduleId) !== -1 ? ids.indexOf(moduleId) : 0;

  // Parts (Part 1 and Part 2) modules get 2 tasks, others get 3 tasks
  const isPartModule = [1, 2, 4, 5, 9, 10].includes(moduleIdx);
  const totalTasks = isPartModule ? 2 : 3;

  const [activeTab, setActiveTab] = useState<number>(1);
  const [activeDeckCard, setActiveDeckCard] = useState<{ val: string; label: string } | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

  // Secure activity & timer states
  const [activityStarted, setActivityStarted] = useState<boolean>(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);
  const [warningsLeft, setWarningsLeft] = useState<number>(3);
  const [timerLeft, setTimerLeft] = useState<number>(720); // 12 minutes
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // User input states
  const [task1Answers, setTask1Answers] = useState<Record<string, string>>({});
  const [task2Answers, setTask2Answers] = useState<Record<string, string>>({});
  const [task3Answers, setTask3Answers] = useState<Record<string, string>>({});

  // Module 4 Task 2 states (Bitwise ANDing)
  const [andingBits, setAndingBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [andingDecimal, setAndingDecimal] = useState<string>("");

  const toggleAndingBit = (idx: number) => {
    if (isLocked) return;
    setAndingBits(prev => {
      const copy = [...prev];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return copy;
    });
  };

  // Score states
  const [task1Score, setTask1Score] = useState<number | null>(null);
  const [task2Score, setTask2Score] = useState<number | null>(null);
  const [task3Score, setTask3Score] = useState<number | null>(null);

  const isCompletedFinal = isCompleted || (task1Score !== null && task2Score !== null && (totalTasks === 2 || task3Score !== null));

  // Load scores and reset inputs when module changes
  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "Student";
    const key = `interactive_scores_${savedName}_${moduleId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTask1Score(parsed.task1 !== undefined ? parsed.task1 : null);
        setTask2Score(parsed.task2 !== undefined ? parsed.task2 : null);
        setTask3Score(parsed.task3 !== undefined ? parsed.task3 : null);
      } catch (e) {
        console.error(e);
      }
    } else {
      setTask1Score(null);
      setTask2Score(null);
      setTask3Score(null);
    }
    setActiveTab(1);
    setTask1Answers({});
    setTask2Answers({});
    setTask3Answers({});
    setAndingBits([0, 0, 0, 0, 0, 0, 0, 0]);
    setAndingDecimal("");
    setActiveDeckCard(null);
    setActivityStarted(false);
    setIsFullscreenActive(false);
    setWarningsLeft(3);
    setTimerLeft(720);
    setIsLocked(false);
  }, [moduleId]);

  // Auto-complete course topic once all sub-tasks are submitted
  useEffect(() => {
    if (task1Score !== null && task2Score !== null && (totalTasks === 2 || task3Score !== null)) {
      onComplete();
    }
  }, [task1Score, task2Score, task3Score, totalTasks, onComplete]);

  // Start Secure Fullscreen session
  const handleStartActivity = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreenActive(true);
      setActivityStarted(true);
    } catch (e) {
      console.error("Fullscreen request blocked", e);
      setIsFullscreenActive(true);
      setActivityStarted(true);
    }
  };

  // Cheat Prevention Callback
  const handleCheatSubmit = (reason: string) => {
    setIsLocked(true);
    const email = localStorage.getItem("userEmail") || "";
    recordCheatingLogShared(email, moduleId, "interactive", reason);
    if (task1Score === null) {
      setTask1Score(0);
      saveScore("task1", 0);
    }
    if (task2Score === null) {
      setTask2Score(0);
      saveScore("task2", 0);
    }
    if (totalTasks === 3 && task3Score === null) {
      setTask3Score(0);
      saveScore("task3", 0);
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  };

  // Time Out Callback
  const handleTimeOutSubmit = () => {
    setIsLocked(true);
    if (task1Score === null) {
      const s = checkCurrentTaskScore(1);
      setTask1Score(s);
      saveScore("task1", s);
    }
    if (task2Score === null) {
      const s = checkCurrentTaskScore(2);
      setTask2Score(s);
      saveScore("task2", s);
    }
    if (totalTasks === 3 && task3Score === null) {
      const s = checkCurrentTaskScore(3);
      setTask3Score(s);
      saveScore("task3", s);
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const checkCurrentTaskScore = (taskNum: number): number => {
    let score = 0;
    if (taskNum === 1) {
      switch (moduleIdx) {
        case 0:
          if (task1Answers.Router === "RouterOption") score++;
          if (task1Answers.Switch === "SwitchOption") score++;
          if (task1Answers.Host === "HostOption") score++;
          if (task1Answers.Firewall === "FirewallOption") score++;
          break;
        case 1:
          if (task1Answers.OSIApp === "TCPApp") score++;
          if (task1Answers.OSITrans === "TCPTrans") score++;
          if (task1Answers.OSINet === "TCPInternet") score++;
          if (task1Answers.OSIPhys === "TCPNetAccess") score++;
          break;
        case 2:
          if (task1Answers.DNS === "DNSOption") score++;
          if (task1Answers.HTTP === "HTTPOption") score++;
          if (task1Answers.DHCP === "DHCPOption") score++;
          if (task1Answers.SMTP === "SMTPOption") score++;
          break;
        case 3:
          if (task1Answers.ip1 === "PrivateClassA") score++;
          if (task1Answers.ip2 === "PrivateClassC") score++;
          if (task1Answers.ip3 === "PublicClassA") score++;
          if (task1Answers.ip4 === "PrivateClassB") score++;
          break;
        case 4:
          if (task1Answers.oui === "OUI") score++;
          if (task1Answers.nic === "NIC") score++;
          break;
        case 5:
          if (task1Answers.step1 === "1") score++;
          if (task1Answers.step2 === "2") score++;
          if (task1Answers.step3 === "3") score++;
          if (task1Answers.step4 === "4") score++;
          if (task1Answers.step5 === "5") score++;
          break;
        case 6:
          if (task1Answers.RouterUser === "UserEXEC") score++;
          if (task1Answers.RouterPriv === "PrivEXEC") score++;
          if (task1Answers.RouterGlobal === "GlobalConfig") score++;
          if (task1Answers.RouterInterface === "InterfaceConfig") score++;
          break;
        case 7:
          if (task1Answers.RAM === "RAMOption") score++;
          if (task1Answers.NVRAM === "NVRAMOption") score++;
          if (task1Answers.Flash === "FlashOption") score++;
          if (task1Answers.ROM === "ROMOption") score++;
          break;
        case 8:
          if (task1Answers.route === "route3") score++;
          break;
        case 9:
          if (task1Answers.exitIf === "Gig01") score++;
          if (task1Answers.nextHop === "10002") score++;
          break;
        case 10:
          if (task1Answers.allZeros === "matchesAny") score++;
          if (task1Answers.gateway === "gatewayIP") score++;
          break;
        case 11:
          if (task1Answers.summary === "1921680022") score++;
          break;
      }
    } else if (taskNum === 2) {
      switch (moduleIdx) {
        case 0:
          if (task2Answers.scenarioA === "Mesh") score++;
          if (task2Answers.scenarioB === "Star") score++;
          if (task2Answers.scenarioC === "Bus") score++;
          break;
        case 1:
          if (task2Answers.p2p === "P2P") score++;
          if (task2Answers.clientServer === "CS") score++;
          break;
        case 2:
          if (task2Answers.step1 === "Data") score++;
          if (task2Answers.step2 === "Segment") score++;
          if (task2Answers.step3 === "Packet") score++;
          if (task2Answers.step4 === "Frame") score++;
          if (task2Answers.step5 === "Bits") score++;
          break;
        case 3:
          const correctBits = [0, 1, 0, 0, 0, 0, 0, 0];
          andingBits.forEach((b, i) => {
            if (b === correctBits[i]) score++;
          });
          if (andingDecimal.trim() === "64") score++;
          break;
        case 4:
          if (task2Answers.scenA === "CSMACD") score++;
          if (task2Answers.scenB === "CSMACA") score++;
          break;
        case 5:
          if (task2Answers.action1 === "Yes") score++;
          if (task2Answers.action2 === "Yes") score++;
          if (task2Answers.action3 === "No") score++;
          break;
        case 6:
          if (task2Answers.hostname === "hostCmd") score++;
          if (task2Answers.secret === "secCmd") score++;
          if (task2Answers.save === "saveCmd") score++;
          if (task2Answers.ping === "pingCmd") score++;
          break;
        case 7:
          if (task2Answers.s1 === "1") score++;
          if (task2Answers.s2 === "2") score++;
          if (task2Answers.s3 === "3") score++;
          if (task2Answers.s4 === "4") score++;
          break;
        case 8:
          if (task2Answers.methodA === "Static") score++;
          if (task2Answers.methodB === "Dynamic") score++;
          break;
        case 9:
          if (task2Answers.prefix === "iproute") score++;
          if (task2Answers.dest === "192.168.2.0") score++;
          if (task2Answers.mask === "255.255.255.0") score++;
          if (task2Answers.hop === "10.0.0.2") score++;
          break;
        case 10:
          if (task2Answers.adChoice === "120") score++;
          break;
        case 11:
          if (task2Answers.rootCause === "interfaceDown") score++;
          break;
      }
    } else if (taskNum === 3) {
      switch (moduleIdx) {
        case 0:
          if (task3Answers.netA === "LAN") score++;
          if (task3Answers.netB === "WAN") score++;
          if (task3Answers.netC === "WLAN") score++;
          break;
        case 3:
          if (task3Answers.mask1 === "254") score++;
          if (task3Answers.mask2 === "62") score++;
          if (task3Answers.mask3 === "2") score++;
          break;
        case 6:
          if (task3Answers.ip === "192.168.1.10") score++;
          if (task3Answers.mask === "255.255.255.0") score++;
          if (task3Answers.gateway === "192.168.1.1") score++;
          break;
        case 7:
          if (task3Answers.kw === "bannermotd") score++;
          if (task3Answers.delim === "hash") score++;
          if (task3Answers.msg === "auth") score++;
          break;
        case 8:
          if (task3Answers.rip === "hops") score++;
          if (task3Answers.ospf === "cost") score++;
          break;
        case 11:
          if (task3Answers.cmd === "ipv6route") score++;
          if (task3Answers.dest === "ipv6prefix") score++;
          if (task3Answers.hop === "ipv6hop") score++;
          break;
      }
    }
    return score;
  };

  // Fullscreen & Visibility Event Listeners
  useEffect(() => {
    if (!activityStarted || isCompletedFinal || isLocked) return;

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreenActive(isFs);

      if (!isFs) {
        setWarningsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            handleCheatSubmit("Fullscreen exit limit reached");
          }
          return next;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setWarningsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            handleCheatSubmit("Tab switch limit reached");
          }
          return next;
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activityStarted, isCompletedFinal, isLocked]);

  // Session Timer Decrement
  useEffect(() => {
    if (!activityStarted || isCompletedFinal || isLocked || !isFullscreenActive) return;

    const timer = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOutSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activityStarted, isCompletedFinal, isLocked, isFullscreenActive]);

  // Save scores helper
  const saveScore = async (taskKey: string, score: number) => {
    const savedName = localStorage.getItem("userName") || "Student";
    const key = `interactive_scores_${savedName}_${moduleId}`;
    const stored = localStorage.getItem(key);
    let current: any = {};
    if (stored) {
      try {
        current = JSON.parse(stored);
      } catch (e) { }
    }
    current[taskKey] = score;
    localStorage.setItem(key, JSON.stringify(current));

    // Record streak activity on interactive activity submission
    const streakEmail = localStorage.getItem("userEmail") || "";
    if (streakEmail) {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const streakRes = await fetch("/api/users");
        const streakData = await streakRes.json();
        if (streakData.success) {
          const streakProfile = streakData.users.find((u: any) => u.email.toLowerCase() === streakEmail.toLowerCase());
          if (streakProfile) {
            const dates: string[] = streakProfile.streakDates || [];
            if (!dates.includes(today)) {
              dates.push(today);
              await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: streakEmail, streakDates: dates })
              });
            }
          }
        }
      } catch (e) {
        console.error("Error recording streak activity:", e);
      }
    }

    // Compile task mistakes
    const taskNum = taskKey === "task1" ? 1 : taskKey === "task2" ? 2 : 3;
    const tasksList = INTERACTIVE_ACTIVITIES_CONFIG[moduleIdx] || [];
    const taskConfig = tasksList[taskNum - 1];

    let taskMistakesList: any[] = [];
    if (taskConfig) {
      const answers = taskNum === 1 ? task1Answers : taskNum === 2 ? task2Answers : task3Answers;
      if (taskConfig.type === "anding") {
        const correctBits = [0, 1, 0, 0, 0, 0, 0, 0];
        andingBits.forEach((b, i) => {
          if (b !== correctBits[i]) {
            taskMistakesList.push({
              item: `Bit ${8 - i}`,
              correct: String(correctBits[i]),
              user: String(b)
            });
          }
        });
        if (andingDecimal.trim() !== "64") {
          taskMistakesList.push({
            item: "Decimal Result",
            correct: "64",
            user: andingDecimal || "No answer"
          });
        }
      } else {
        Object.keys(taskConfig.correctAnswers).forEach(itemKey => {
          const userAnswer = answers[itemKey] || "";
          const correctAnswer = taskConfig.correctAnswers[itemKey];
          if (userAnswer !== correctAnswer) {
            const row = taskConfig.rows?.find(r => r.id === itemKey);
            const rowLabel = row ? row.label : itemKey;
            const correctOpt = taskConfig.options?.find(o => o.val === correctAnswer);
            const correctLabel = correctOpt ? correctOpt.label : correctAnswer;
            const userOpt = taskConfig.options?.find(o => o.val === userAnswer);
            const userLabel = userOpt ? userOpt.label : (userAnswer || "No answer");

            taskMistakesList.push({
              item: rowLabel,
              correct: correctLabel,
              user: userLabel
            });
          }
        });
      }
    }

    // Save to database
    const email = localStorage.getItem("userEmail") || "";
    if (email) {
      try {
        const userRes = await fetch("/api/users");
        const userData = await userRes.json();
        if (userData.success && userData.users) {
          const profile = userData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (profile) {
            const updatedInteractiveScores = {
              ...(profile.interactiveScores || {}),
              [moduleId]: {
                ...(profile.interactiveScores?.[moduleId] || {}),
                [taskKey]: score
              }
            };
            const updatedInteractiveMistakes = {
              ...(profile.interactiveMistakes || {}),
              [moduleId]: {
                ...(profile.interactiveMistakes?.[moduleId] || {}),
                [taskKey]: taskMistakesList
              }
            };
            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                interactiveScores: updatedInteractiveScores,
                interactiveMistakes: updatedInteractiveMistakes
              })
            });
          }
        }
      } catch (e) {
        console.error("Error saving interactive scores to server:", e);
      }
    }
  };

  const getTaskTitle = (taskNum: number) => {
    const titles: Record<number, string[]> = {
      0: ["Device Role Matching", "Topology Selection Scenario", "Network Types Identification"],
      1: ["OSI vs TCP/IP Layer Mapping", "Network Model Classification", ""],
      2: ["Network Protocols Matching", "Data Encapsulation Sequence", ""],
      3: ["IP Address Class & Type", "Bitwise ANDing Operations", "Subnet Host Capacity"],
      4: ["MAC Address Anatomy", "CSMA Mode Selection", ""],
      5: ["ARP Resolution Flow", "Switch MAC Table Learning", ""],
      6: ["Cisco IOS CLI Modes", "Essential Commands Matching", "Host IP Configuration Scenario"],
      7: ["Router Memory Components", "Interface Configuration Sequence", "CLI Banner Setup Scenario"],
      8: ["Routing Table Path Selection", "Routing Method Comparison", "RIP vs OSPF Metrics"],
      9: ["Next-Hop IP vs Exit Interface", "Static Route Command Assembly", ""],
      10: ["Default Static Route Anatomy", "Floating Static Route Scenario", ""],
      11: ["Route Summarization Calculation", "Troubleshooting Static Routes", "IPv6 Static Route Assembly"]
    };
    return titles[moduleIdx]?.[taskNum - 1] || `Task ${taskNum}`;
  };

  const getTaskDescription = (taskNum: number) => {
    const descriptions: Record<number, string[]> = {
      0: [
        "Connect each network hardware device to its core function or description.",
        "Scenario: Choose the best topology (Mesh, Star, or Bus) based on the business requirements.",
        "Scenario: Classify each networking environment description as LAN, WAN, or WLAN."
      ],
      1: [
        "Map the OSI layers to their corresponding layer in the modern TCP/IP model.",
        "Scenario: Read the descriptions and identify whether they describe a Peer-to-Peer (P2P) or Client-Server network model."
      ],
      2: [
        "Match common Application layer protocols to their core function.",
        "Scenario: Arrange the data encapsulation steps in order, from raw application data down to physical transmission bits."
      ],
      3: [
        "Identify the address class (A, B, C) and address type (Public or Private) for the given IPv4 addresses.",
        "Perform bitwise ANDing on the last octet for a packet destined to 192.168.1.75 with a mask of 255.255.255.192 (/26).",
        "Calculate the total number of usable host IP addresses for each CIDR prefix."
      ],
      4: [
        "Identify the parts of the MAC address: the OUI and the device NIC identifier.",
        "Scenario: Select the appropriate media access control (CSMA) mechanism based on the physical media environment."
      ],
      5: [
        "Sort the chronological steps of the Address Resolution Protocol (ARP) from cache check to data forwarding.",
        "Scenario: A frame arrives at a blank switch. Predict how the MAC address table is populated and how the frame is forwarded."
      ],
      6: [
        "Match the Cisco IOS CLI configuration prompt to its correct configuration mode.",
        "Match standard Cisco IOS configuration commands to their purpose.",
        "Scenario: Select the correct IP, Subnet Mask, and Gateway configurations to connect PC1 to the local network."
      ],
      7: [
        "Match router hardware components (RAM, NVRAM, ROM, Flash) to the configurations or files they store.",
        "Arrange the commands in sequence to enter configuration mode, select GigabitEthernet0/0, assign IP 192.168.1.1/24, and enable the port.",
        "Scenario: Complete the Cisco CLI command input to set up an authorized access warning banner (MOTD)."
      ],
      8: [
        "Scenario: Examine the routing table. A packet is destined to 10.1.1.45. Select the matching route the router will use to forward the packet.",
        "Scenario: Select the best routing method (Static or Dynamic) based on the size and fault-tolerance needs of the network.",
        "Identify the metric metrics used by Routing Information Protocol (RIP) and Open Shortest Path First (OSPF)."
      ],
      9: [
        "Scenario: Examine the topology diagram description and identify R1's exit interface and next-hop IP to reach R2's LAN.",
        "Assemble the full command syntax to configure a static route on R1 to reach R2's LAN 192.168.2.0/24 via next-hop 10.0.0.2."
      ],
      10: [
        "Match the parameters in a default static route command to their function.",
        "Scenario: Configure a backup floating static route that only becomes active if the primary OSPF route (AD=110) fails."
      ],
      11: [
        "Calculate the summarized routing prefix for four contiguous Class C networks: 192.168.0.0/24 to 192.168.3.0/24.",
        "Scenario: R1 has a static route to 192.168.2.0/24 via 10.0.0.2, but cannot ping PC2. Pinging next-hop 10.0.0.2 directly also fails. Diagnose the issue.",
        "Assemble the correct IPv6 static route command prefix, destination prefix, and next-hop IPv6 address."
      ]
    };
    return descriptions[moduleIdx]?.[taskNum - 1] || "";
  };

  const checkTaskCorrect = (taskNum: number): boolean => {
    let score = 0;
    let max = 0;
    
    if (taskNum === 1) {
      switch (moduleIdx) {
        case 0:
          max = 4;
          if (task1Answers.Router === "RouterOption") score++;
          if (task1Answers.Switch === "SwitchOption") score++;
          if (task1Answers.Host === "HostOption") score++;
          if (task1Answers.Firewall === "FirewallOption") score++;
          break;
        case 1:
          max = 4;
          if (task1Answers.OSIApp === "TCPApp") score++;
          if (task1Answers.OSITrans === "TCPTrans") score++;
          if (task1Answers.OSINet === "TCPInternet") score++;
          if (task1Answers.OSIPhys === "TCPNetAccess") score++;
          break;
        case 2:
          max = 4;
          if (task1Answers.DNS === "DNSOption") score++;
          if (task1Answers.HTTP === "HTTPOption") score++;
          if (task1Answers.DHCP === "DHCPOption") score++;
          if (task1Answers.SMTP === "SMTPOption") score++;
          break;
        case 3:
          max = 4;
          if (task1Answers.ip1 === "PrivateClassA") score++;
          if (task1Answers.ip2 === "PrivateClassC") score++;
          if (task1Answers.ip3 === "PublicClassA") score++;
          if (task1Answers.ip4 === "PrivateClassB") score++;
          break;
        case 4:
          max = 2;
          if (task1Answers.oui === "OUI") score++;
          if (task1Answers.nic === "NIC") score++;
          break;
        case 5:
          max = 5;
          if (task1Answers.step1 === "1") score++;
          if (task1Answers.step2 === "2") score++;
          if (task1Answers.step3 === "3") score++;
          if (task1Answers.step4 === "4") score++;
          if (task1Answers.step5 === "5") score++;
          break;
        case 6:
          max = 4;
          if (task1Answers.RouterUser === "UserEXEC") score++;
          if (task1Answers.RouterPriv === "PrivEXEC") score++;
          if (task1Answers.RouterGlobal === "GlobalConfig") score++;
          if (task1Answers.RouterInterface === "InterfaceConfig") score++;
          break;
        case 7:
          max = 4;
          if (task1Answers.RAM === "RAMOption") score++;
          if (task1Answers.NVRAM === "NVRAMOption") score++;
          if (task1Answers.Flash === "FlashOption") score++;
          if (task1Answers.ROM === "ROMOption") score++;
          break;
        case 8:
          max = 1;
          if (task1Answers.route === "route3") score++;
          break;
        case 9:
          max = 2;
          if (task1Answers.exitIf === "Gig01") score++;
          if (task1Answers.nextHop === "10002") score++;
          break;
        case 10:
          max = 2;
          if (task1Answers.allZeros === "matchesAny") score++;
          if (task1Answers.gateway === "gatewayIP") score++;
          break;
        case 11:
          max = 1;
          if (task1Answers.summary === "1921680022") score++;
          break;
      }
      return score === max && max > 0;
    } else if (taskNum === 2) {
      switch (moduleIdx) {
        case 0:
          max = 3;
          if (task2Answers.scenarioA === "Mesh") score++;
          if (task2Answers.scenarioB === "Star") score++;
          if (task2Answers.scenarioC === "Bus") score++;
          break;
        case 1:
          max = 2;
          if (task2Answers.p2p === "P2P") score++;
          if (task2Answers.clientServer === "CS") score++;
          break;
        case 2:
          max = 5;
          if (task2Answers.step1 === "Data") score++;
          if (task2Answers.step2 === "Segment") score++;
          if (task2Answers.step3 === "Packet") score++;
          if (task2Answers.step4 === "Frame") score++;
          if (task2Answers.step5 === "Bits") score++;
          break;
        case 3:
          max = 9;
          const correctBits = [0, 1, 0, 0, 0, 0, 0, 0];
          andingBits.forEach((b, i) => {
            if (b === correctBits[i]) score++;
          });
          if (andingDecimal.trim() === "64") score++;
          break;
        case 4:
          max = 2;
          if (task2Answers.scenA === "CSMACD") score++;
          if (task2Answers.scenB === "CSMACA") score++;
          break;
        case 5:
          max = 3;
          if (task2Answers.action1 === "Yes") score++;
          if (task2Answers.action2 === "Yes") score++;
          if (task2Answers.action3 === "No") score++;
          break;
        case 6:
          max = 4;
          if (task2Answers.hostname === "hostCmd") score++;
          if (task2Answers.secret === "secCmd") score++;
          if (task2Answers.save === "saveCmd") score++;
          if (task2Answers.ping === "pingCmd") score++;
          break;
        case 7:
          max = 4;
          if (task2Answers.s1 === "1") score++;
          if (task2Answers.s2 === "2") score++;
          if (task2Answers.s3 === "3") score++;
          if (task2Answers.s4 === "4") score++;
          break;
        case 8:
          max = 2;
          if (task2Answers.methodA === "Static") score++;
          if (task2Answers.methodB === "Dynamic") score++;
          break;
        case 9:
          max = 4;
          if (task2Answers.prefix === "iproute") score++;
          if (task2Answers.dest === "192.168.2.0") score++;
          if (task2Answers.mask === "255.255.255.0") score++;
          if (task2Answers.hop === "10.0.0.2") score++;
          break;
        case 10:
          max = 1;
          if (task2Answers.adChoice === "120") score++;
          break;
        case 11:
          max = 1;
          if (task2Answers.rootCause === "interfaceDown") score++;
          break;
      }
      return score === max && max > 0;
    } else if (taskNum === 3) {
      switch (moduleIdx) {
        case 0:
          max = 3;
          if (task3Answers.netA === "LAN") score++;
          if (task3Answers.netB === "WAN") score++;
          if (task3Answers.netC === "WLAN") score++;
          break;
        case 3:
          max = 3;
          if (task3Answers.mask1 === "254") score++;
          if (task3Answers.mask2 === "62") score++;
          if (task3Answers.mask3 === "2") score++;
          break;
        case 6:
          max = 3;
          if (task3Answers.ip === "192.168.1.10") score++;
          if (task3Answers.mask === "255.255.255.0") score++;
          if (task3Answers.gateway === "192.168.1.1") score++;
          break;
        case 7:
          max = 3;
          if (task3Answers.kw === "bannermotd") score++;
          if (task3Answers.delim === "hash") score++;
          if (task3Answers.msg === "auth") score++;
          break;
        case 8:
          max = 2;
          if (task3Answers.rip === "hops") score++;
          if (task3Answers.ospf === "cost") score++;
          break;
        case 11:
          max = 3;
          if (task3Answers.cmd === "ipv6route") score++;
          if (task3Answers.dest === "ipv6prefix") score++;
          if (task3Answers.hop === "ipv6hop") score++;
          break;
      }
      return score === max && max > 0;
    }
    return false;
  };

  const handleSubmitTask = (taskNum: number) => {
    let score = 0;
    if (taskNum === 1) {
      switch (moduleIdx) {
        case 0:
          if (task1Answers.Router === "RouterOption") score++;
          if (task1Answers.Switch === "SwitchOption") score++;
          if (task1Answers.Host === "HostOption") score++;
          if (task1Answers.Firewall === "FirewallOption") score++;
          break;
        case 1:
          if (task1Answers.OSIApp === "TCPApp") score++;
          if (task1Answers.OSITrans === "TCPTrans") score++;
          if (task1Answers.OSINet === "TCPInternet") score++;
          if (task1Answers.OSIPhys === "TCPNetAccess") score++;
          break;
        case 2:
          if (task1Answers.DNS === "DNSOption") score++;
          if (task1Answers.HTTP === "HTTPOption") score++;
          if (task1Answers.DHCP === "DHCPOption") score++;
          if (task1Answers.SMTP === "SMTPOption") score++;
          break;
        case 3:
          if (task1Answers.ip1 === "PrivateClassA") score++;
          if (task1Answers.ip2 === "PrivateClassC") score++;
          if (task1Answers.ip3 === "PublicClassA") score++;
          if (task1Answers.ip4 === "PrivateClassB") score++;
          break;
        case 4:
          if (task1Answers.oui === "OUI") score++;
          if (task1Answers.nic === "NIC") score++;
          break;
        case 5:
          if (task1Answers.step1 === "1") score++;
          if (task1Answers.step2 === "2") score++;
          if (task1Answers.step3 === "3") score++;
          if (task1Answers.step4 === "4") score++;
          if (task1Answers.step5 === "5") score++;
          break;
        case 6:
          if (task1Answers.RouterUser === "UserEXEC") score++;
          if (task1Answers.RouterPriv === "PrivEXEC") score++;
          if (task1Answers.RouterGlobal === "GlobalConfig") score++;
          if (task1Answers.RouterInterface === "InterfaceConfig") score++;
          break;
        case 7:
          if (task1Answers.RAM === "RAMOption") score++;
          if (task1Answers.NVRAM === "NVRAMOption") score++;
          if (task1Answers.Flash === "FlashOption") score++;
          if (task1Answers.ROM === "ROMOption") score++;
          break;
        case 8:
          if (task1Answers.route === "route3") score++;
          break;
        case 9:
          if (task1Answers.exitIf === "Gig01") score++;
          if (task1Answers.nextHop === "10002") score++;
          break;
        case 10:
          if (task1Answers.allZeros === "matchesAny") score++;
          if (task1Answers.gateway === "gatewayIP") score++;
          break;
        case 11:
          if (task1Answers.summary === "1921680022") score++;
          break;
      }
      setTask1Score(score);
      saveScore("task1", score);
    } else if (taskNum === 2) {
      switch (moduleIdx) {
        case 0:
          if (task2Answers.scenarioA === "Mesh") score++;
          if (task2Answers.scenarioB === "Star") score++;
          if (task2Answers.scenarioC === "Bus") score++;
          break;
        case 1:
          if (task2Answers.p2p === "P2P") score++;
          if (task2Answers.clientServer === "CS") score++;
          break;
        case 2:
          if (task2Answers.step1 === "Data") score++;
          if (task2Answers.step2 === "Segment") score++;
          if (task2Answers.step3 === "Packet") score++;
          if (task2Answers.step4 === "Frame") score++;
          if (task2Answers.step5 === "Bits") score++;
          break;
        case 3:
          const correctBits = [0, 1, 0, 0, 0, 0, 0, 0];
          andingBits.forEach((b, i) => {
            if (b === correctBits[i]) score++;
          });
          if (andingDecimal.trim() === "64") score++;
          break;
        case 4:
          if (task2Answers.scenA === "CSMACD") score++;
          if (task2Answers.scenB === "CSMACA") score++;
          break;
        case 5:
          if (task2Answers.action1 === "Yes") score++;
          if (task2Answers.action2 === "Yes") score++;
          if (task2Answers.action3 === "No") score++;
          break;
        case 6:
          if (task2Answers.hostname === "hostCmd") score++;
          if (task2Answers.secret === "secCmd") score++;
          if (task2Answers.save === "saveCmd") score++;
          if (task2Answers.ping === "pingCmd") score++;
          break;
        case 7:
          if (task2Answers.s1 === "1") score++;
          if (task2Answers.s2 === "2") score++;
          if (task2Answers.s3 === "3") score++;
          if (task2Answers.s4 === "4") score++;
          break;
        case 8:
          if (task2Answers.methodA === "Static") score++;
          if (task2Answers.methodB === "Dynamic") score++;
          break;
        case 9:
          if (task2Answers.prefix === "iproute") score++;
          if (task2Answers.dest === "192.168.2.0") score++;
          if (task2Answers.mask === "255.255.255.0") score++;
          if (task2Answers.hop === "10.0.0.2") score++;
          break;
        case 10:
          if (task2Answers.adChoice === "120") score++;
          break;
        case 11:
          if (task2Answers.rootCause === "interfaceDown") score++;
          break;
      }
      setTask2Score(score);
      saveScore("task2", score);
    } else if (taskNum === 3) {
      switch (moduleIdx) {
        case 0:
          if (task3Answers.netA === "LAN") score++;
          if (task3Answers.netB === "WAN") score++;
          if (task3Answers.netC === "WLAN") score++;
          break;
        case 3:
          if (task3Answers.mask1 === "254") score++;
          if (task3Answers.mask2 === "62") score++;
          if (task3Answers.mask3 === "2") score++;
          break;
        case 6:
          if (task3Answers.ip === "192.168.1.10") score++;
          if (task3Answers.mask === "255.255.255.0") score++;
          if (task3Answers.gateway === "192.168.1.1") score++;
          break;
        case 7:
          if (task3Answers.kw === "bannermotd") score++;
          if (task3Answers.delim === "hash") score++;
          if (task3Answers.msg === "auth") score++;
          break;
        case 8:
          if (task3Answers.rip === "hops") score++;
          if (task3Answers.ospf === "cost") score++;
          break;
        case 11:
          if (task3Answers.cmd === "ipv6route") score++;
          if (task3Answers.dest === "ipv6prefix") score++;
          if (task3Answers.hop === "ipv6hop") score++;
          break;
      }
      setTask3Score(score);
      saveScore("task3", score);
    }
  };

  const getTaskMaxScore = (taskNum: number): number => {
    if (taskNum === 1) {
      switch (moduleIdx) {
        case 0: return 4;
        case 1: return 4;
        case 2: return 4;
        case 3: return 4;
        case 4: return 2;
        case 5: return 5;
        case 6: return 4;
        case 7: return 4;
        case 8: return 1;
        case 9: return 2;
        case 10: return 2;
        case 11: return 1;
        default: return 1;
      }
    } else if (taskNum === 2) {
      switch (moduleIdx) {
        case 0: return 3;
        case 1: return 2;
        case 2: return 5;
        case 3: return 9;
        case 4: return 2;
        case 5: return 3;
        case 6: return 4;
        case 7: return 4;
        case 8: return 2;
        case 9: return 4;
        case 10: return 1;
        case 11: return 1;
        default: return 1;
      }
    } else {
      switch (moduleIdx) {
        case 0: return 3;
        case 3: return 3;
        case 6: return 3;
        case 7: return 3;
        case 8: return 2;
        case 11: return 3;
        default: return 1;
      }
    }
  };

  const getModuleMaxScore = () => {
    switch (moduleIdx) {
      case 0: return 10;
      case 1: return 6;
      case 2: return 9;
      case 3: return 16;
      case 4: return 4;
      case 5: return 8;
      case 6: return 11;
      case 7: return 11;
      case 8: return 5;
      case 9: return 6;
      case 10: return 3;
      case 11: return 5;
      default: return 10;
    }
  };

  const getModuleCurrentScore = () => {
    const t1 = task1Score || 0;
    const t2 = task2Score || 0;
    const t3 = task3Score || 0;
    return totalTasks === 2 ? (t1 + t2) : (t1 + t2 + t3);
  };

  // Helper to render multiple choice chips cleanly (replacing renderDropdown for 1-question tasks)
  const renderOptionSelector = (
    answers: Record<string, string>,
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    rowId: string,
    options: { val: string; label: string }[]
  ) => {
    const currentValue = answers[rowId];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 select-none">
        {options.map(opt => {
          const isSelected = currentValue === opt.val;
          return (
            <button
              key={opt.val}
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (isLocked) return;
                setAnswers(prev => ({ ...prev, [rowId]: opt.val }));
              }}
              className={`p-4 rounded-xl border text-left text-xs font-semibold leading-relaxed transition-all cursor-pointer flex justify-between items-center ${
                isSelected
                  ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow shadow-brand-cyan/10 animate-scaleIn"
                  : "bg-brand-card/45 border-brand-border/40 text-brand-text hover:border-brand-cyan/40"
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // Helper to render inline configuration chips (PC properties / route builders)
  const renderInlineChipSelector = (
    answers: Record<string, string>,
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    key: string,
    options: { val: string; label: string }[]
  ) => {
    const currentValue = answers[key];
    return (
      <div className="flex flex-wrap gap-2 mt-2 select-none">
        {options.map(opt => {
          const isSelected = currentValue === opt.val;
          return (
            <button
              key={opt.val}
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (isLocked) return;
                setAnswers(prev => ({ ...prev, [key]: opt.val }));
              }}
              className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-sm"
                  : "bg-brand-card/50 border-brand-border/40 text-brand-muted hover:border-brand-cyan/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Helper to render drag-and-drop styled matching layout
  const renderInteractiveMatch = (
    answers: Record<string, string>,
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    rows: { id: string; label: string }[],
    options: { val: string; label: string }[]
  ) => {
    const assignedVals = Object.values(answers);
    const unassignedOptions = options.filter(opt => !assignedVals.includes(opt.val));

    const handleSelectCard = (opt: { val: string; label: string }) => {
      if (isLocked) return;
      setActiveDeckCard(activeDeckCard?.val === opt.val ? null : opt);
    };

    const handleAssignSlot = (rowId: string) => {
      if (isLocked) return;
      if (activeDeckCard) {
        setAnswers(prev => ({ ...prev, [rowId]: activeDeckCard.val }));
        setActiveDeckCard(null);
      } else {
        if (answers[rowId]) {
          setAnswers(prev => {
            const copy = { ...prev };
            delete copy[rowId];
            return copy;
          });
        }
      }
    };

    return (
      <div className="flex flex-col gap-5 select-none">
        <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4">
          <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider block mb-3">Available Match Cards (Drag or Click)</span>
          {unassignedOptions.length === 0 ? (
            <div className="text-center text-xs text-brand-muted italic py-1">All cards matched! Submit your answer.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unassignedOptions.map(opt => {
                const isSelected = activeDeckCard?.val === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    disabled={isLocked}
                    draggable={!isLocked}
                    onDragStart={(e) => {
                      if (isLocked) return;
                      e.dataTransfer.setData("text/plain", opt.val);
                    }}
                    onClick={() => handleSelectCard(opt)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow shadow-brand-cyan/15 animate-pulse"
                        : "bg-brand-card/50 border-brand-border/40 text-brand-text hover:border-brand-cyan/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {rows.map(row => {
            const assignedVal = answers[row.id];
            const assignedOpt = options.find(o => o.val === assignedVal);
            const isDragOver = dragOverRowId === row.id;

            return (
              <div key={row.id} className="bg-brand-bg/25 border border-brand-border/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <span className="text-xs text-brand-text font-medium leading-relaxed max-w-lg">{row.label}</span>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleAssignSlot(row.id)}
                  onDragOver={(e) => {
                    if (!isLocked) e.preventDefault();
                  }}
                  onDragEnter={() => {
                    if (!isLocked) setDragOverRowId(row.id);
                  }}
                  onDragLeave={() => {
                    setDragOverRowId(null);
                  }}
                  onDrop={(e) => {
                    if (isLocked) return;
                    e.preventDefault();
                    setDragOverRowId(null);
                    const droppedVal = e.dataTransfer.getData("text/plain");
                    if (droppedVal) {
                      setAnswers(prev => ({ ...prev, [row.id]: droppedVal }));
                      setActiveDeckCard(null);
                    }
                  }}
                  className={`w-full md:w-56 h-10 px-3 flex items-center justify-between border-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isDragOver
                      ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold scale-105"
                      : assignedOpt
                      ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan font-bold"
                      : activeDeckCard
                      ? "bg-brand-card/30 border-dashed border-brand-cyan/40 text-brand-muted hover:border-brand-cyan/60"
                      : "bg-brand-card/20 border-dashed border-brand-border/50 text-brand-muted hover:border-brand-border"
                  }`}
                >
                  <span className="truncate">{assignedOpt ? assignedOpt.label : "Click or drag card here..."}</span>
                  {assignedOpt && (
                    <span className="text-brand-muted text-[10px] hover:text-brand-text ml-2 shrink-0">✕</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTask1Content = () => {
    switch (moduleIdx) {
      case 0: // Device Role Matching
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "Router", label: "Connects different network segments and routes traffic between them." },
            { id: "Switch", label: "Forwards data frames within a local area network (LAN)." },
            { id: "Host", label: "Sends/receives endpoint traffic (e.g., PC, server, phone)." },
            { id: "Firewall", label: "Monitors and filters network traffic based on security rules." }
          ],
          [
            { val: "RouterOption", label: "Router" },
            { val: "SwitchOption", label: "Switch" },
            { val: "HostOption", label: "Host" },
            { val: "FirewallOption", label: "Firewall" }
          ]
        );

      case 1: // OSI to TCP/IP Layer Matching
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "OSIApp", label: "OSI Application / Presentation / Session" },
            { id: "OSITrans", label: "OSI Transport" },
            { id: "OSINet", label: "OSI Network" },
            { id: "OSIPhys", label: "OSI Data Link / Physical" }
          ],
          [
            { val: "TCPApp", label: "Application Layer" },
            { val: "TCPTrans", label: "Transport Layer" },
            { val: "TCPInternet", label: "Internet Layer" },
            { val: "TCPNetAccess", label: "Network Access Layer" }
          ]
        );

      case 2: // Protocols Match
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "DNS", label: "Resolves human-readable domain names to IP addresses." },
            { id: "HTTP", label: "Transfers webpages and media assets across the Web." },
            { id: "DHCP", label: "Dynamically assigns IP configuration to host devices." },
            { id: "SMTP", label: "Transfers electronic mail messages between mail servers." }
          ],
          [
            { val: "DNSOption", label: "DNS" },
            { val: "HTTPOption", label: "HTTP" },
            { val: "DHCPOption", label: "DHCP" },
            { val: "SMTPOption", label: "SMTP" }
          ]
        );

      case 3: // IP Class & Type
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "ip1", label: "10.0.0.50" },
            { id: "ip2", label: "192.168.1.100" },
            { id: "ip3", label: "8.8.8.8" },
            { id: "ip4", label: "172.16.5.20" }
          ],
          [
            { val: "PrivateClassA", label: "Private / Class A" },
            { val: "PrivateClassB", label: "Private / Class B" },
            { val: "PrivateClassC", label: "Private / Class C" },
            { val: "PublicClassA", label: "Public / Class A" }
          ]
        );

      case 4: // MAC Anatomy
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 flex items-center justify-center font-mono font-bold text-sm text-center mb-2">
              <span className="bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan px-2.5 py-1.5 rounded-lg">00:60:2F</span>
              <span className="mx-2">:</span>
              <span className="bg-brand-border/20 border border-brand-border text-brand-text/90 px-2.5 py-1.5 rounded-lg">3A:07:BC</span>
            </div>
            {renderInteractiveMatch(
              task1Answers,
              setTask1Answers,
              [
                { id: "oui", label: "First 3 Octets (00:60:2F)" },
                { id: "nic", label: "Last 3 Octets (3A:07:BC)" }
              ],
              [
                { val: "OUI", label: "OUI (Organizationally Unique Identifier)" },
                { val: "NIC", label: "NIC-Specific Identifier" }
              ]
            )}
          </div>
        );

      case 5: // ARP Flow
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "step1", label: "Host searches its local ARP cache for the destination IP." },
            { id: "step2", label: "Cache miss: Host broadcasts an ARP request frame on the LAN." },
            { id: "step3", label: "All devices receive the frame; non-matching devices discard it." },
            { id: "step4", label: "Destination device sends a unicast ARP reply containing its MAC." },
            { id: "step5", label: "Sender caches the MAC address and sends the queued IP packet." }
          ],
          [
            { val: "1", label: "Step 1" },
            { val: "2", label: "Step 2" },
            { val: "3", label: "Step 3" },
            { val: "4", label: "Step 4" },
            { val: "5", label: "Step 5" }
          ]
        );

      case 6: // Cisco IOS CLI Modes
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "RouterUser", label: "Router>" },
            { id: "RouterPriv", label: "Router#" },
            { id: "RouterGlobal", label: "Router(config)#" },
            { id: "RouterInterface", label: "Router(config-if)#" }
          ],
          [
            { val: "UserEXEC", label: "User EXEC Mode" },
            { val: "PrivEXEC", label: "Privileged EXEC Mode" },
            { val: "GlobalConfig", label: "Global Configuration Mode" },
            { val: "InterfaceConfig", label: "Interface Configuration Mode" }
          ]
        );

      case 7: // Router Memory
        return renderInteractiveMatch(
          task1Answers,
          setTask1Answers,
          [
            { id: "RAM", label: "Stores the currently running configuration file (running-config)." },
            { id: "NVRAM", label: "Stores the startup configuration file (startup-config)." },
            { id: "Flash", label: "Stores the Cisco IOS operating system software image." },
            { id: "ROM", label: "Stores diagnostics, power-on self-test (POST), and boot code." }
          ],
          [
            { val: "RAMOption", label: "RAM (Volatile)" },
            { val: "NVRAMOption", label: "NVRAM (Non-Volatile)" },
            { val: "FlashOption", label: "Flash Memory" },
            { val: "ROMOption", label: "ROM (Read-Only)" }
          ]
        );

      case 8: // Path Selection / Longest Prefix Match
        return renderOptionSelector(task1Answers, setTask1Answers, "route", [
          { val: "route1", label: "10.0.0.0/8 via 192.168.1.2" },
          { val: "route2", label: "10.1.1.0/24 via 192.168.2.2" },
          { val: "route3", label: "10.1.1.32/28 via 192.168.3.2" }
        ]);

      case 9: // Next-Hop vs Exit Interface
        return (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-brand-muted italic leading-normal mb-2">
              Topology Scenario: Router R1 (LAN: 192.168.1.0/24, IP: 192.168.1.1) connects to Router R2 (LAN: 192.168.2.0/24, IP: 192.168.2.1).
              The serial/WAN link between them is 10.0.0.0/30. R1's exit interface is GigabitEthernet0/1 (IP: 10.0.0.1) and R2's interface is GigabitEthernet0/1 (IP: 10.0.0.2).
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs text-brand-text font-bold block mb-2">R1's Local Exit Interface</span>
                {renderOptionSelector(task1Answers, setTask1Answers, "exitIf", [
                  { val: "Gig00", label: "GigabitEthernet0/0" },
                  { val: "Gig01", label: "GigabitEthernet0/1" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-xs text-brand-text font-bold block mb-2">R1's Next-Hop IP Address</span>
                {renderOptionSelector(task1Answers, setTask1Answers, "nextHop", [
                  { val: "10001", label: "10.0.0.1" },
                  { val: "10002", label: "10.0.0.2" },
                  { val: "19216821", label: "192.168.2.1" }
                ])}
              </div>
            </div>
          </div>
        );

      case 10: // Default Route Anatomy
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 text-center font-mono font-bold text-xs mb-2">
              R1(config)# <span className="text-brand-text">ip route </span>
              <span className="text-brand-cyan">0.0.0.0 0.0.0.0 </span>
              <span className="text-brand-text">203.0.113.1</span>
            </div>
            {renderInteractiveMatch(
              task1Answers,
              setTask1Answers,
              [
                { id: "allZeros", label: "Syntax: 0.0.0.0 0.0.0.0" },
                { id: "gateway", label: "Syntax: 203.0.113.1" }
              ],
              [
                { val: "matchesAny", label: "Matches any destination network address" },
                { val: "gatewayIP", label: "Specifies next-hop IP (gateway)" }
              ]
            )}
          </div>
        );

      case 11: // Route Summarization
        return renderOptionSelector(task1Answers, setTask1Answers, "summary", [
          { val: "1921680023", label: "192.168.0.0/23" },
          { val: "1921680022", label: "192.168.0.0/22" },
          { val: "1921680021", label: "192.168.0.0/21" }
        ]);

      default:
        return null;
    }
  };

  const renderTask2Content = () => {
    switch (moduleIdx) {
      case 0: // Topology Selection Scenario
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "scenarioA", label: "Scenario A: Critical datacenter requiring fault tolerance and backup connections between all routers." },
            { id: "scenarioB", label: "Scenario B: Small office LAN connecting all workstations to a central networking switch." },
            { id: "scenarioC", label: "Scenario C: Simple linear network layouts linking device-to-device with a primary backbone cable." }
          ],
          [
            { val: "Mesh", label: "Mesh Topology" },
            { val: "Star", label: "Star Topology" },
            { val: "Bus", label: "Bus Topology" }
          ]
        );

      case 1: // P2P vs Client-Server
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "p2p", label: "Scenario A: Two coworkers transferring design files directly between their laptops using a crossover Ethernet cable." },
            { id: "clientServer", label: "Scenario B: Hundreds of branch employees accessing customer data files from a central database host server." }
          ],
          [
            { val: "P2P", label: "Peer-to-Peer Model" },
            { val: "CS", label: "Client-Server Model" }
          ]
        );

      case 2: // Encapsulation Order
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "step1", label: "Slot 1 (Application Layer)" },
            { id: "step2", label: "Slot 2 (Transport Layer / Ports)" },
            { id: "step3", label: "Slot 3 (Network Layer / IPs)" },
            { id: "step4", label: "Slot 4 (Data Link Layer / MACs)" },
            { id: "step5", label: "Slot 5 (Physical Layer / Medium)" }
          ],
          [
            { val: "Data", label: "Data" },
            { val: "Segment", label: "Segment" },
            { val: "Packet", label: "Packet" },
            { val: "Frame", label: "Frame" },
            { val: "Bits", label: "Bits" }
          ]
        );

      case 3: // Bitwise ANDing Exercise
        return (
          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="grid grid-cols-10 items-center gap-2 font-mono text-center text-xs md:text-sm">
              <div className="col-span-2 text-left font-sans font-bold text-brand-muted text-xs">Octet Rows</div>
              {[128, 64, 32, 16, 8, 4, 2, 1].map(v => (
                <div key={v} className="text-[10px] text-brand-muted font-bold">{v}</div>
              ))}

              <div className="col-span-2 text-left font-sans font-bold text-brand-text">IP (75)</div>
              {[0, 1, 0, 0, 1, 0, 1, 1].map((b, idx) => (
                <div key={idx} className="bg-brand-bg border border-brand-border/40 p-2 rounded-lg text-brand-text/80">{b}</div>
              ))}

              <div className="col-span-2 text-left font-sans font-bold text-brand-text">Mask (192)</div>
              {[1, 1, 0, 0, 0, 0, 0, 0].map((b, idx) => (
                <div key={idx} className="bg-brand-bg border border-brand-border/40 p-2 rounded-lg text-brand-text/80">{b}</div>
              ))}

              <div className="col-span-10 border-t border-dashed border-brand-border/40 my-1"></div>

              <div className="col-span-2 text-left font-sans font-bold text-brand-cyan flex items-center gap-1">
                <span>Result (AND)</span>
              </div>
              {andingBits.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleAndingBit(idx)}
                  className={`p-2.5 rounded-lg border font-mono font-bold text-sm cursor-pointer transition-all ${b === 1
                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-sm"
                    : "bg-brand-card border-brand-border/40 text-brand-muted hover:border-brand-border"
                    }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-brand-border/20 pt-6 mt-2">
              <div className="flex-grow">
                <span className="text-xs font-bold text-brand-text block mb-1">Resulting Network ID Address</span>
                <span className="text-[10px] text-brand-muted block">
                  Type the X value for the Network ID `192.168.10.X`, where X is the decimal conversion of your AND bits.
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-mono text-sm text-brand-text">192.168.10.</span>
                <input
                  type="text"
                  value={andingDecimal}
                  onChange={(e) => setAndingDecimal(e.target.value)}
                  placeholder="X"
                  className="w-20 bg-brand-card border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-lg px-3 py-2 text-center text-sm font-mono text-brand-cyan font-bold"
                />
              </div>
            </div>
          </div>
        );

      case 4: // CSMA Mode Selection
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "scenA", label: "Scenario A: Half-duplex wired Ethernet connections connected through a legacy hub." },
            { id: "scenB", label: "Scenario B: Shared wireless network channel (802.11 Wi-Fi) with multiple devices." }
          ],
          [
            { val: "CSMACD", label: "CSMA/CD (Collision Detection)" },
            { val: "CSMACA", label: "CSMA/CA (Collision Avoidance)" }
          ]
        );

      case 5: // Switch MAC learning Scenario
        return (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-brand-muted leading-normal italic mb-2">
              Scenario: An Ethernet frame arrives at Port 1 of a switch. The source MAC is A, and destination MAC is B.
              The switch's MAC address table is currently blank. Indicate which actions are performed by the switch.
            </p>
            <div className="flex flex-col gap-5">
              {[
                { id: "action1", text: "Action 1: Switch records MAC A mapped to Port 1 in its MAC address table." },
                { id: "action2", text: "Action 2: Switch floods the frame out all ports except the incoming Port 1." },
                { id: "action3", text: "Action 3: Switch unicasts the frame directly out Port 2." }
              ].map((row) => (
                <div key={row.id} className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-xs text-brand-text font-medium">{row.text}</span>
                  {renderOptionSelector(task2Answers, setTask2Answers, row.id, [
                    { val: "Yes", label: "Yes, performed" },
                    { val: "No", label: "No, not performed" }
                  ])}
                </div>
              ))}
            </div>
          </div>
        );

      case 6: // Command Matching
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "hostname", label: "Configures a unique text name identifier for the network device." },
            { id: "secret", label: "Enables password encryption for access into Privileged EXEC mode." },
            { id: "save", label: "Saves active configuration variables from RAM to startup config NVRAM." },
            { id: "ping", label: "Sends ICMP echo request packets to verify network connectivity." }
          ],
          [
            { val: "hostCmd", label: "hostname" },
            { val: "secCmd", label: "enable secret" },
            { val: "saveCmd", label: "copy running-config startup-config" },
            { val: "pingCmd", label: "ping" }
          ]
        );

      case 7: // Interface config sequence
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "s1", label: "Step 1" },
            { id: "s2", label: "Step 2" },
            { id: "s3", label: "Step 3" },
            { id: "s4", label: "Step 4" }
          ],
          [
            { val: "1", label: "Router(config)# configure terminal" },
            { val: "2", label: "Router(config)# interface gigabitethernet 0/0" },
            { val: "3", label: "Router(config-if)# ip address 192.168.1.1 255.255.255.0" },
            { val: "4", label: "Router(config-if)# no shutdown" }
          ]
        );

      case 8: // Routing Method comparison
        return renderInteractiveMatch(
          task2Answers,
          setTask2Answers,
          [
            { id: "methodA", label: "Scenario A: A simple hub-and-spoke network with only 2 remote office routers connecting back to HQ." },
            { id: "methodB", label: "Scenario B: A massive ISP core network that needs automated routing metric updates to bypass link failures." }
          ],
          [
            { val: "Static", label: "Static Routing" },
            { val: "Dynamic", label: "Dynamic Routing" }
          ]
        );

      case 9: // Command Syntax Assembly
        const prefixVal = task2Answers.prefix || "_______";
        const destVal = task2Answers.dest || "___________";
        const maskVal = task2Answers.mask || "_______________";
        const hopVal = task2Answers.hop || "__________";
        return (
          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 font-mono text-xs leading-relaxed text-center">
              Router(config)# <span className="text-brand-cyan font-bold">{prefixVal} {destVal} {maskVal} {hopVal}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Command Prefix</span>
                {renderInlineChipSelector(task2Answers, setTask2Answers, "prefix", [
                  { val: "iproute", label: "ip route" },
                  { val: "route", label: "route" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Destination Network</span>
                {renderInlineChipSelector(task2Answers, setTask2Answers, "dest", [
                  { val: "192.168.2.0", label: "192.168.2.0" },
                  { val: "192.168.2.1", label: "192.168.2.1" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Subnet Mask</span>
                {renderInlineChipSelector(task2Answers, setTask2Answers, "mask", [
                  { val: "255.255.255.0", label: "255.255.255.0" },
                  { val: "255.255.255.255", label: "255.255.255.255" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Next-Hop IP</span>
                {renderInlineChipSelector(task2Answers, setTask2Answers, "hop", [
                  { val: "10.0.0.2", label: "10.0.0.2" },
                  { val: "10.0.0.1", label: "10.0.0.1" }
                ])}
              </div>
            </div>
          </div>
        );

      case 10: // Floating static route AD Choice
        return renderOptionSelector(task2Answers, setTask2Answers, "adChoice", [
          { val: "1", label: "1 (Standard Static AD)" },
          { val: "90", label: "90 (EIGRP AD)" },
          { val: "120", label: "120 (RIP AD - Floating Backup)" }
        ]);

      case 11: // Troubleshooting Static Routes
        return renderOptionSelector(task2Answers, setTask2Answers, "rootCause", [
          { val: "wrongSyntax", label: "Command syntax error" },
          { val: "interfaceDown", label: "Next-hop interface is down / disconnected" },
          { val: "wrongMask", label: "Incorrect mask size used" }
        ]);

      default:
        return null;
    }
  };

  const renderTask3Content = () => {
    switch (moduleIdx) {
      case 0: // Network Types
        return renderInteractiveMatch(
          task3Answers,
          setTask3Answers,
          [
            { id: "netA", label: "Scenario A: Connecting workstations inside a local business office floor." },
            { id: "netB", label: "Scenario B: Interconnecting office routers in Paris, New York, and Sydney." },
            { id: "netC", label: "Scenario C: Employees connecting laptops wirelessly inside the cafeteria." }
          ],
          [
            { val: "LAN", label: "LAN (Local Area Network)" },
            { val: "WAN", label: "WAN (Wide Area Network)" },
            { val: "WLAN", label: "WLAN (Wireless LAN)" }
          ]
        );

      case 3: // Subnet capacity
        return renderInteractiveMatch(
          task3Answers,
          setTask3Answers,
          [
            { id: "mask1", label: "/24 (255.255.255.0) Prefix" },
            { id: "mask2", label: "/26 (255.255.255.192) Prefix" },
            { id: "mask3", label: "/30 (255.255.255.252) Prefix" }
          ],
          [
            { val: "254", label: "254 usable hosts" },
            { val: "62", label: "62 usable hosts" },
            { val: "2", label: "2 usable hosts" }
          ]
        );

      case 6: // PC configuration inputs
        const pcIpVal = task3Answers.ip || "_______________";
        const pcMaskVal = task3Answers.mask || "_______________";
        const pcGatewayVal = task3Answers.gateway || "_______________";
        return (
          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 font-mono text-xs leading-relaxed max-w-sm mx-auto w-full">
              <div className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mb-2 border-b border-brand-border/30 pb-1">PC1 NIC IPv4 Configuration</div>
              <div className="flex justify-between py-1"><span>IP Address:</span> <span className="text-brand-cyan font-bold">{pcIpVal}</span></div>
              <div className="flex justify-between py-1"><span>Subnet Mask:</span> <span className="text-brand-cyan font-bold">{pcMaskVal}</span></div>
              <div className="flex justify-between py-1"><span>Default Gateway:</span> <span className="text-brand-cyan font-bold">{pcGatewayVal}</span></div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Select PC IP Address</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "ip", [
                  { val: "192.168.1.1", label: "192.168.1.1" },
                  { val: "192.168.1.10", label: "192.168.1.10" },
                  { val: "192.168.1.256", label: "192.168.1.256" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Select Subnet Mask</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "mask", [
                  { val: "255.255.0.0", label: "255.255.0.0" },
                  { val: "255.255.255.0", label: "255.255.255.0" },
                  { val: "255.255.255.252", label: "255.255.255.252" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Select Default Gateway</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "gateway", [
                  { val: "0.0.0.0", label: "0.0.0.0" },
                  { val: "192.168.1.1", label: "192.168.1.1" },
                  { val: "192.168.1.10", label: "192.168.1.10" }
                ])}
              </div>
            </div>
          </div>
        );

      case 7: // CLI Banner Setup
        const cliKwVal = task3Answers.kw || "___________";
        const cliDelimVal = task3Answers.delim === "hash" ? "#" : task3Answers.delim === "quote" ? "\"" : "__";
        const cliMsgVal = task3Answers.msg === "auth" ? "Authorized Access Only!" : task3Answers.msg === "authdelim" ? "#Authorized Access Only!" : "_________________________";
        return (
          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 font-mono text-xs leading-relaxed text-center">
              Router(config)# <span className="text-brand-cyan font-bold">{cliKwVal} {cliDelimVal}{cliMsgVal}{cliDelimVal}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Command Keyword</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "kw", [
                  { val: "bannermotd", label: "banner motd" },
                  { val: "bannermotdmsg", label: "banner motd message" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Delimiter Character</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "delim", [
                  { val: "hash", label: "#" },
                  { val: "quote", label: "\"" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Warning Message Text</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "msg", [
                  { val: "auth", label: "Authorized Access Only!" },
                  { val: "authdelim", label: "#Authorized Access Only!" }
                ])}
              </div>
            </div>
          </div>
        );

      case 8: // RIP vs OSPF Metrics
        return renderInteractiveMatch(
          task3Answers,
          setTask3Answers,
          [
            { id: "rip", label: "RIP Protocol Metric" },
            { id: "ospf", label: "OSPF Protocol Metric" }
          ],
          [
            { val: "hops", label: "Hop Count" },
            { val: "cost", label: "Cost (Bandwidth)" }
          ]
        );

      case 11: // IPv6 Static Route Assembly
        const ipv6CmdVal = task3Answers.cmd || "__________";
        const ipv6DestVal = task3Answers.dest || "_________________";
        const ipv6HopVal = task3Answers.hop || "_______________";
        return (
          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 font-mono text-xs leading-relaxed text-center">
              Router(config)# <span className="text-brand-cyan font-bold">{ipv6CmdVal} {ipv6DestVal} {ipv6HopVal}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Command Prefix</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "cmd", [
                  { val: "iproute", label: "ip route" },
                  { val: "ipv6route", label: "ipv6 route" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Destination Network / Prefix</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "dest", [
                  { val: "ipv6prefix", label: "2001:db8:2::/64" },
                  { val: "ipv6prefixno", label: "2001:db8:2::" }
                ])}
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block mb-1">Next-Hop IPv6 Address</span>
                {renderInlineChipSelector(task3Answers, setTask3Answers, "hop", [
                  { val: "ipv6hop", label: "2001:db8:1::2" },
                  { val: "ipv6hopno", label: "2001:db8:1::1" }
                ])}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTaskScore = (taskNum: number): number | null => {
    if (taskNum === 1) return task1Score;
    if (taskNum === 2) return task2Score;
    return task3Score;
  };

  const isTaskSubmitDisabled = (taskNum: number): boolean => {
    if (taskNum === 1) {
      switch (moduleIdx) {
        case 0: return !task1Answers.Router || !task1Answers.Switch || !task1Answers.Host || !task1Answers.Firewall;
        case 1: return !task1Answers.OSIApp || !task1Answers.OSITrans || !task1Answers.OSINet || !task1Answers.OSIPhys;
        case 2: return !task1Answers.DNS || !task1Answers.HTTP || !task1Answers.DHCP || !task1Answers.SMTP;
        case 3: return !task1Answers.ip1 || !task1Answers.ip2 || !task1Answers.ip3 || !task1Answers.ip4;
        case 4: return !task1Answers.oui || !task1Answers.nic;
        case 5: return !task1Answers.step1 || !task1Answers.step2 || !task1Answers.step3 || !task1Answers.step4 || !task1Answers.step5;
        case 6: return !task1Answers.RouterUser || !task1Answers.RouterPriv || !task1Answers.RouterGlobal || !task1Answers.RouterInterface;
        case 7: return !task1Answers.RAM || !task1Answers.NVRAM || !task1Answers.Flash || !task1Answers.ROM;
        case 8: return !task1Answers.route;
        case 9: return !task1Answers.exitIf || !task1Answers.nextHop;
        case 10: return !task1Answers.allZeros || !task1Answers.gateway;
        case 11: return !task1Answers.summary;
        default: return false;
      }
    } else if (taskNum === 2) {
      switch (moduleIdx) {
        case 0: return !task2Answers.scenarioA || !task2Answers.scenarioB || !task2Answers.scenarioC;
        case 1: return !task2Answers.p2p || !task2Answers.clientServer;
        case 2: return !task2Answers.step1 || !task2Answers.step2 || !task2Answers.step3 || !task2Answers.step4 || !task2Answers.step5;
        case 3: return !andingDecimal.trim();
        case 4: return !task2Answers.scenA || !task2Answers.scenB;
        case 5: return !task2Answers.action1 || !task2Answers.action2 || !task2Answers.action3;
        case 6: return !task2Answers.hostname || !task2Answers.secret || !task2Answers.save || !task2Answers.ping;
        case 7: return !task2Answers.s1 || !task2Answers.s2 || !task2Answers.s3 || !task2Answers.s4;
        case 8: return !task2Answers.methodA || !task2Answers.methodB;
        case 9: return !task2Answers.prefix || !task2Answers.dest || !task2Answers.mask || !task2Answers.hop;
        case 10: return !task2Answers.adChoice;
        case 11: return !task2Answers.rootCause;
        default: return false;
      }
    } else {
      switch (moduleIdx) {
        case 0: return !task3Answers.netA || !task3Answers.netB || !task3Answers.netC;
        case 3: return !task3Answers.mask1 || !task3Answers.mask2 || !task3Answers.mask3;
        case 6: return !task3Answers.ip || !task3Answers.mask || !task3Answers.gateway;
        case 7: return !task3Answers.kw || !task3Answers.delim || !task3Answers.msg;
        case 8: return !task3Answers.rip || !task3Answers.ospf;
        case 11: return !task3Answers.cmd || !task3Answers.dest || !task3Answers.hop;
        default: return false;
      }
    }
  };

  const renderActiveTask = () => {
    const isCorrect = checkTaskCorrect(activeTab);
    const score = getTaskScore(activeTab);
    const maxScore = getTaskMaxScore(activeTab);

    return (
      <div className="flex flex-col gap-4">
        <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
          <h3 className="font-bold text-sm text-brand-cyan mb-1">{getTaskTitle(activeTab)}</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            {getTaskDescription(activeTab)}
          </p>
        </div>

        {activeTab === 1 && renderTask1Content()}
        {activeTab === 2 && renderTask2Content()}
        {activeTab === 3 && renderTask3Content()}

        {isCorrect ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-xs font-bold mt-2">
            🎉 Correct configuration! Click Submit below to record your grade.
          </div>
        ) : (
          <div className="bg-brand-bg/30 border border-brand-border/30 text-brand-muted p-4 rounded-xl text-center text-xs mt-2">
            Select or enter the correct parameters matching the scenario rules.
          </div>
        )}

        <button
          onClick={() => handleSubmitTask(activeTab)}
          disabled={isTaskSubmitDisabled(activeTab)}
          className="w-full mt-4 px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shrink-0"
        >
          {score !== null ? `Resubmit Task ${activeTab}` : `Submit Task ${activeTab}`}
        </button>

        {score !== null && (
          <div className="bg-brand-cyan/15 border border-brand-cyan/25 px-4 py-2.5 rounded-xl flex items-center justify-between mt-2 animate-scaleIn">
            <div className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Recorded Score</div>
            <div className="text-sm font-mono font-extrabold text-brand-cyan">{score} / {maxScore}</div>
          </div>
        )}
      </div>
    );
  };

  if (!activityStarted && !isCompletedFinal) {
    return (
      <div className="bg-brand-card/40 border border-brand-border/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan flex items-center justify-center text-brand-cyan animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-brand-text mb-2">Secure Assessment Mode Required</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            To ensure academic integrity, this interactive activity runs in **Secure Fullscreen Mode**.
          </p>
        </div>
        <ul className="text-left text-xs text-brand-muted space-y-2 border-y border-brand-border/30 py-4 w-full">
          <li className="flex items-start gap-2">
            <span className="text-brand-cyan font-bold">•</span>
            <span><strong>12-Minute Time Limit:</strong> Timer auto-submits answers on expiry.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-cyan font-bold">•</span>
            <span><strong>Fullscreen Enforced:</strong> Do not exit fullscreen. Exiting counts as a warning.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-cyan font-bold">•</span>
            <span><strong>Cheat Prevention:</strong> Max 3 warnings (exiting fullscreen or shifting tabs) before the session auto-locks.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-cyan font-bold">•</span>
            <span><strong>Copy Protected:</strong> Copying, cutting, pasting, and right-clicks are disabled.</span>
          </li>
        </ul>
        <button
          onClick={handleStartActivity}
          className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-brand-cyan/20 cursor-pointer"
        >
          Begin Secure Assessment
        </button>
      </div>
    );
  }

  if (activityStarted && !isFullscreenActive && !isCompletedFinal && !isLocked) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center text-red-400 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-red-400 mb-2">Security Warning: Fullscreen Exited</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            You have exited fullscreen mode. Please re-enter immediately to continue the assessment.
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400">
          ⚠️ Warnings Left: {warningsLeft} / 3. Shifting focus or exiting again will LOCK your session.
        </div>
        <button
          onClick={handleStartActivity}
          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
        >
          Re-enter Fullscreen & Resume
        </button>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="bg-brand-card/40 border border-brand-border/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-brand-text mb-2">Session Locked</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            This interactive activity has been auto-submitted and locked due to either running out of time, exiting fullscreen repeatedly, or changing tabs.
          </p>
        </div>
        <div className="bg-brand-cyan/15 border border-brand-cyan/20 px-6 py-3.5 rounded-xl w-full flex items-center justify-between">
          <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Final Assessment Score</span>
          <span className="text-base font-mono font-black text-brand-cyan">{getModuleCurrentScore()} / {getModuleMaxScore()}</span>
        </div>
        <button
          onClick={handleSelectNextTopic}
          className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Continue to Next Topic
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col gap-6 select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}>
      {/* Session Timer & Security Stats Header */}
      {!isCompletedFinal && (
        <div className="bg-brand-card/30 border border-brand-border/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={timerLeft < 120 ? "text-red-400 animate-pulse" : "text-brand-cyan"}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Time Remaining:</span>
            <span className={`font-mono font-bold ${timerLeft < 120 ? "text-red-400 animate-pulse text-sm" : "text-brand-cyan"}`}>
              {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>Warnings Remaining:</span>
            <span className="font-bold text-red-400">{warningsLeft} / 3</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-brand-border/40">
        <button
          onClick={() => setActiveTab(1)}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 1
            ? "border-brand-cyan text-brand-cyan"
            : "border-transparent text-brand-muted hover:text-brand-text"
            }`}
        >
          Task 1: {getTaskTitle(1).slice(0, 15)}... {task1Score !== null ? `(${task1Score}/${getTaskMaxScore(1)}) ✓` : ""}
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 2
            ? "border-brand-cyan text-brand-cyan"
            : "border-transparent text-brand-muted hover:text-brand-text"
            }`}
        >
          Task 2: {getTaskTitle(2).slice(0, 15)}... {task2Score !== null ? `(${task2Score}/${getTaskMaxScore(2)}) ✓` : ""}
        </button>
        {totalTasks === 3 && (
          <button
            onClick={() => setActiveTab(3)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 3
              ? "border-brand-cyan text-brand-cyan"
              : "border-transparent text-brand-muted hover:text-brand-text"
              }`}
          >
            Task 3: {getTaskTitle(3).slice(0, 15)}... {task3Score !== null ? `(${task3Score}/${getTaskMaxScore(3)}) ✓` : ""}
          </button>
        )}
      </div>

      {renderActiveTask()}

      {/* Completion Banner */}
      {isCompletedFinal ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 animate-scaleIn">
          <div>
            <h3 className="font-bold text-sm text-green-400 flex items-center gap-1.5">
              🎉 Interactive Activity Completed!
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Excellent job! You successfully submitted and auto-graded all tasks for this module.
            </p>
            <div className="mt-2 text-xs text-brand-text flex items-center gap-2">
              <span className="text-[10px] bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded font-mono font-bold">
                Overall Grade: {getModuleCurrentScore()} / {getModuleMaxScore()}
              </span>
            </div>
          </div>
          <button
            onClick={handleSelectNextTopic}
            className="px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2 shrink-0"
          >
            <span>Finish Module</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      ) : (
        <div className="bg-brand-bg/10 border border-brand-border/40 rounded-xl p-4 text-center text-xs text-brand-muted mt-6">
          Submit all {totalTasks} tasks to finish this activity and record your overall grade.
        </div>
      )}
    </div>
  );
}

type YouTubeObserverProps = {
  videoId: string;
  onWatched: () => void;
};

function YouTubeObserver({ videoId, onWatched }: YouTubeObserverProps) {
  const containerId = `yt-player-${videoId}`;

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    let checkInterval: any;

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        player = new (window as any).YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          events: {
            onStateChange: (event: any) => {
              if (event.data === 0) {
                onWatched();
              }
            }
          }
        });
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          initPlayer();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border shadow-md bg-brand-bg">
      <div id={containerId} className="absolute top-0 left-0 w-full h-full border-0"></div>
    </div>
  );
}

type MaterialType = "text" | "video" | "image" | "file";

type Material = {
  id: number;
  type: MaterialType;
  title: string;
  content: string; // text body, video link, base64 image/file
  fileName?: string;
  fileSize?: string;
  textStyle?: "normal" | "bold" | "italic" | "heading" | "quote" | "code";
  imageAlign?: "left" | "center" | "right";
};

type Subtopic = {
  id: number;
  title: string;
  materials?: Material[];
};

type Topic = {
  id: number;
  title: string;
  subtopics?: Subtopic[];
  materials?: Material[];
};

type PretestQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

type Module = {
  id: number;
  title: string;
  topics: Topic[];
  pretest?: PretestQuestion[];
};

type ViewSelection = {
  moduleId: number;
  topic: Topic | null;
  subtopic: Subtopic | null;
};

export default function StudentCurriculum() {
  const [modules, setModules] = useState<Module[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item states
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  // Subject Overview States
  const [selectedSpecialItem, setSelectedSpecialItem] = useState<"announcements" | "self-introduction" | "subject-guide" | null>(null);
  const [expandedSubjectOverview, setExpandedSubjectOverview] = useState(true);
  const [openedGeneralItems, setOpenedGeneralItems] = useState<string[]>([]);
  const isGeneralCompleted = openedGeneralItems.includes("announcements") &&
                            openedGeneralItems.includes("self-introduction") &&
                            openedGeneralItems.includes("subject-guide");

  const markGeneralItemAsOpened = (item: "announcements" | "self-introduction" | "subject-guide") => {
    setOpenedGeneralItems((prev) => {
      if (prev.includes(item)) return prev;
      const updated = [...prev, item];
      const savedName = localStorage.getItem("userName") || "Student";
      localStorage.setItem(`opened_general_${savedName}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Embedded Discussions States
  const [selfIntroPosts, setSelfIntroPosts] = useState<any[]>([]);
  const [newSelfIntroMsg, setNewSelfIntroMsg] = useState("");
  const [selfIntroError, setSelfIntroError] = useState("");

  const [moduleDiscussionPosts, setModuleDiscussionPosts] = useState<any[]>([]);
  const [newModuleDiscussionMsg, setNewModuleDiscussionMsg] = useState("");
  const [moduleDiscussionError, setModuleDiscussionError] = useState("");

  const moduleChatScrollRef = useRef<HTMLDivElement | null>(null);

  // Expanded modules outline state
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});

  // Topic Completion progress state
  const [completedTopics, setCompletedTopics] = useState<Record<number, boolean>>({});
  const [watchedVideos, setWatchedVideos] = useState<Record<number, boolean>>({});
  const [scrollProgress, setScrollProgress] = useState<Record<number, number>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Pre-test states
  const [completedPretests, setCompletedPretests] = useState<Record<number, boolean>>({});
  const [pretestScores, setPretestScores] = useState<Record<number, number>>({});
  const [takingPretest, setTakingPretest] = useState(false);
  const [pretestAnswers, setPretestAnswers] = useState<Record<number, number>>({});
  const [pretestScore, setPretestScore] = useState<number | null>(null);
  const [pretestStarted, setPretestStarted] = useState(false);
  const [pretestFullscreenActive, setPretestFullscreenActive] = useState(false);
  const [pretestWarningsLeft, setPretestWarningsLeft] = useState(3);
  const [pretestLocked, setPretestLocked] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any | null>(null);

  const checkBadgeEligibility = async (
    profile: any,
    mods: any[],
    doneTopics: Record<number, boolean>,
    donePretests: Record<number, boolean>
  ) => {
    if (!profile) return;
    const email = profile.email;
    const alreadyEarnedIds = new Set((profile.earnedBadges || []).map((b: any) => b.badgeId));

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
    const finishedSimCount = simLabs.filter(mId => profile.interactiveScores?.[mId]?.["simulationLab"] >= 80).length;
    const isSimMaster = finishedSimCount === 4;

    let badgesList: any[] = [];
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
        const profile = uData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (profile) {
          const currentEarned = profile.earnedBadges || [];
          const newEarnedBadge = {
            badgeId: unlockedBadge.id,
            awardedAt: new Date().toISOString(),
            awardedBy: "Automatic Achievement Engine"
          };

          const updatedEarned = [...currentEarned, newEarnedBadge];
          const updateRes = await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              earnedBadges: updatedEarned
            })
          });

          const updateData = await updateRes.json();
          if (updateData.success) {
            setUnlockedBadge(null);
            window.location.reload();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (userProfile && modules.length > 0 && Object.keys(completedTopics).length > 0) {
      checkBadgeEligibility(userProfile, modules, completedTopics, completedPretests);
    }
  }, [completedTopics, completedPretests, userProfile, modules]);

  const saveProgressToServer = async (updates: any) => {
    const email = localStorage.getItem("userEmail") || "";
    if (!email) return;
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...updates
        })
      });
    } catch (e) {
      console.error("Error saving progress to server:", e);
    }
  };

  // Record today's date for fire streak tracking
  const recordStreakActivity = async () => {
    const email = localStorage.getItem("userEmail") || "";
    if (!email) return;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        const profile = data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (profile) {
          const dates: string[] = profile.streakDates || [];
          if (!dates.includes(today)) {
            dates.push(today);
            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, streakDates: dates })
            });
          }
        }
      }
    } catch (e) {
      console.error("Error recording streak activity:", e);
    }
  };

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const isModuleOverviewActive = selectedModuleId !== null && selectedTopic === null && !!selectedModule;

  const getTopicPreview = (topic: Topic): string => {
    const textMat = topic.materials?.find(m => m.type === "text") ||
      topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "text");
    if (textMat && textMat.content) {
      const clean = textMat.content
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      if (clean.length > 150) {
        return clean.slice(0, 150) + "...";
      }
      return clean || "This topic contains lecture and interactive materials.";
    }
    return "This topic contains lecture and interactive materials.";
  };

  const getSelectableSequence = (): ViewSelection[] => {
    const list: ViewSelection[] = [];
    modules.forEach((mod) => {
      list.push({
        moduleId: mod.id,
        topic: null,
        subtopic: null
      });

      getPreviewTopics(mod.topics).forEach((topic) => {
        list.push({
          moduleId: mod.id,
          topic: topic,
          subtopic: null
        });

        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub: any) => {
            list.push({
              moduleId: mod.id,
              topic: topic,
              subtopic: sub
            });
          });
        }
      });
    });
    return list;
  };

  const handleSelectNextTopic = () => {
    const sequence = getSelectableSequence();
    const currentIndex = sequence.findIndex(
      (item) =>
        item.moduleId === selectedModuleId &&
        (item.topic?.id === selectedTopic?.id || (!item.topic && !selectedTopic)) &&
        (item.subtopic?.id === selectedSubtopic?.id || (!item.subtopic && !selectedSubtopic))
    );

    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1];
      setSelectedModuleId(next.moduleId);
      setSelectedTopic(next.topic);
      setSelectedSubtopic(next.subtopic);

      setExpandedModules((prev) => ({ ...prev, [next.moduleId]: true }));
      if (next.topic) {
        setExpandedTopics((prev) => ({ ...prev, [next.topic!.id]: true }));
      }
    } else {
      alert("Congratulations! You have completed the final topic in the course!");
    }
  };

  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (!src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const downloadModulePDF = async (mod: Module) => {
    setIsDownloading(true);
    try {
      if (!(window as any).jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = () => resolve();
          script.onerror = (err) => reject(err);
          document.body.appendChild(script);
        });
      }

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const marginLeft = 18;
      const marginRight = 18;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const bottomMargin = 22;

      // Helper: ensure enough vertical space, else add page
      const ensureSpace = (needed: number) => {
        if (yPos > pageHeight - bottomMargin - needed) {
          // Draw page footer before adding page
          addPageFooter(doc.internal.getNumberOfPages());
          doc.addPage();
          yPos = 22;
        }
      };

      // Helper: add footer with page number
      const addPageFooter = (pageNum: number) => {
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Page ${pageNum}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      };

      // Helper: extract YouTube URL for display
      const getYouTubeDisplayUrl = (url: string): string => {
        if (!url) return url;
        if (url.startsWith('yt-search:')) {
          return `https://www.youtube.com/results?search_query=${encodeURIComponent(url.replace('yt-search:', ''))}`;
        }
        return url;
      };

      // Helper: get YouTube video ID from URL
      const extractYouTubeId = (url: string): string | null => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) return match[2];
        return null;
      };

      // Helper: render text content with style awareness and inline bold support
      const renderTextContent = (
        content: string,
        textStyle: string | undefined,
        xStart: number,
        maxWidth: number,
        isSubtopic: boolean
      ) => {
        const style = textStyle || "normal";

        // Parse content into segments with bold/normal runs
        // First split by <p> tags to get paragraphs
        const paragraphBlocks = content
          .split(/<\/p>/gi)
          .map(block => block.replace(/<p[^>]*>/gi, "").trim())
          .filter(block => block.length > 0);

        // For quote style, add indent
        const quoteIndent = style === "quote" ? 4 : 0;
        const codeIndent = style === "code" ? 2 : 0;
        const adjustedX = xStart + quoteIndent + codeIndent;
        const adjustedWidth = maxWidth - quoteIndent - codeIndent;

        // For headings, add visual spacing
        if (style === "heading") {
          yPos += 2;
        }

        // Track quote start for vertical bar
        const quoteStartY = style === "quote" ? yPos : 0;

        // Set base font size based on style
        let baseFontSize = 10;
        let baseTextColor: [number, number, number] = [60, 60, 60];
        let baseFontStyle = "normal";

        switch (style) {
          case "heading":
            baseFontSize = 13;
            baseTextColor = [0, 120, 110];
            baseFontStyle = "bold";
            break;
          case "bold":
            baseFontSize = 10;
            baseTextColor = [50, 50, 50];
            baseFontStyle = "bold";
            break;
          case "italic":
            baseFontSize = 10;
            baseTextColor = [80, 80, 80];
            baseFontStyle = "italic";
            break;
          case "quote":
            baseFontSize = 10;
            baseTextColor = [100, 100, 100];
            baseFontStyle = "italic";
            break;
          case "code":
            baseFontSize = 9;
            baseTextColor = [40, 120, 40];
            baseFontStyle = "normal";
            break;
          default:
            baseFontSize = 10;
            baseTextColor = [60, 60, 60];
            baseFontStyle = "normal";
            break;
        }

        const fontFamily = style === "code" ? "courier" : "helvetica";
        const lineHeight = style === "code" ? 4.5 : style === "heading" ? 6.5 : 5;

        // Helper to clean HTML entities from a text segment
        const cleanEntities = (text: string): string => {
          return text
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&#39;/g, "'")
            .replace(/&rsquo;/g, "'")
            .replace(/&lsquo;/g, "'")
            .replace(/&rdquo;/g, "\u201D")
            .replace(/&ldquo;/g, "\u201C")
            .replace(/&mdash;/g, "\u2014")
            .replace(/&ndash;/g, "\u2013")
            .replace(/&bull;/g, "\u2022")
            .replace(/&hellip;/g, "\u2026");
        };

        // Parse a paragraph's HTML into segments of {text, bold}
        const parseSegments = (html: string): { text: string; bold: boolean }[] => {
          const segments: { text: string; bold: boolean }[] = [];
          // Split by <strong> and </strong> tags
          const parts = html.split(/(<strong>|<\/strong>|<b>|<\/b>)/gi);
          let isBold = false;
          for (const part of parts) {
            const lower = part.toLowerCase();
            if (lower === "<strong>" || lower === "<b>") {
              isBold = true;
              continue;
            }
            if (lower === "</strong>" || lower === "</b>") {
              isBold = false;
              continue;
            }
            // Strip remaining HTML tags
            const cleaned = cleanEntities(part.replace(/<[^>]*>/g, ""));
            if (cleaned) {
              segments.push({ text: cleaned, bold: isBold });
            }
          }
          return segments;
        };

        // Render segments with inline bold support
        const renderParagraphSegments = (segments: { text: string; bold: boolean }[]) => {
          // Flatten all segments into one string for line-breaking, then re-apply bold
          const fullText = segments.map(s => s.text).join("");
          if (!fullText.trim()) {
            yPos += 3;
            return;
          }

          // For simple cases (single segment or all same style), use simple rendering
          const hasMixedBold = segments.some(s => s.bold) && segments.some(s => !s.bold);

          if (!hasMixedBold || style === "code") {
            // Simple rendering - all same style
            const isBold = segments.some(s => s.bold) || baseFontStyle === "bold";
            doc.setFont(fontFamily, isBold ? "bold" : baseFontStyle);
            doc.setFontSize(baseFontSize);
            doc.setTextColor(...baseTextColor);

            // Handle line breaks within the text
            const lines = fullText.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) {
                yPos += 2.5;
                continue;
              }
              const splitText = doc.splitTextToSize(trimmed, adjustedWidth);
              splitText.forEach((wrappedLine: string) => {
                ensureSpace(lineHeight + 1);
                doc.text(wrappedLine, adjustedX, yPos);
                yPos += lineHeight;
              });
            }
            yPos += 2;
            return;
          }

          // Mixed bold/normal rendering - render segment by segment with word wrapping
          // Build a flat array of words with their bold state
          type WordInfo = { word: string; bold: boolean; spaceAfter: boolean };
          const words: WordInfo[] = [];
          for (const seg of segments) {
            const segWords = seg.text.split(/(\s+)/);
            for (let i = 0; i < segWords.length; i++) {
              const w = segWords[i];
              if (!w) continue;
              if (/^\s+$/.test(w)) continue; // skip whitespace-only
              words.push({ word: w, bold: seg.bold, spaceAfter: true });
            }
          }

          let currentX = adjustedX;
          const spaceWidth = (() => {
            doc.setFont(fontFamily, "normal");
            doc.setFontSize(baseFontSize);
            return doc.getTextWidth(" ");
          })();

          ensureSpace(lineHeight + 1);

          for (let i = 0; i < words.length; i++) {
            const w = words[i];
            const fStyle = w.bold ? "bold" : baseFontStyle;
            doc.setFont(fontFamily, fStyle);
            doc.setFontSize(baseFontSize);
            doc.setTextColor(...baseTextColor);

            const wordWidth = doc.getTextWidth(w.word);

            // Check if word fits on current line
            if (currentX + wordWidth > adjustedX + adjustedWidth && currentX > adjustedX) {
              // Wrap to next line
              yPos += lineHeight;
              ensureSpace(lineHeight + 1);
              currentX = adjustedX;
            }

            doc.text(w.word, currentX, yPos);
            currentX += wordWidth + spaceWidth;
          }

          yPos += lineHeight + 2;
        };

        // Process each paragraph block
        for (let pIdx = 0; pIdx < paragraphBlocks.length; pIdx++) {
          const block = paragraphBlocks[pIdx];

          // Handle <br> within a paragraph block
          const subLines = block.split(/<br\s*\/?>/gi);
          for (const subLine of subLines) {
            const segments = parseSegments(subLine);
            if (segments.length > 0) {
              renderParagraphSegments(segments);
            }
          }

          // Add paragraph spacing
          yPos += 2;
        }

        // Draw quote vertical bar
        if (style === "quote" && quoteStartY > 0) {
          doc.setDrawColor(0, 150, 136);
          doc.setLineWidth(0.8);
          doc.line(xStart + 1, quoteStartY - 1, xStart + 1, yPos - 1);
        }

        // Spacing after heading
        if (style === "heading") {
          yPos += 2;
        }

        yPos += 2;
      };

      // Helper: convert any image (including SVG) to a canvas-based PNG data URL
      const convertToCanvasDataUrl = (img: HTMLImageElement, originalSrc: string): Promise<string> => {
        return new Promise((resolve) => {
          // If it's already a raster format, just return the original src
          if (!originalSrc.startsWith("data:image/svg")) {
            resolve(originalSrc);
            return;
          }
          // SVG needs canvas conversion
          const canvas = document.createElement("canvas");
          // Use a reasonable resolution for SVG rendering
          const scale = 2; // 2x for crisp rendering
          canvas.width = img.width * scale || 800;
          canvas.height = img.height * scale || 600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          resolve(canvas.toDataURL("image/png"));
        });
      };

      // Helper: render an image material
      const renderImage = async (
        content: string,
        title: string,
        xStart: number,
        maxImgWidth: number
      ) => {
        try {
          const img = await loadImageElement(content);

          // Convert SVG to PNG via canvas
          const imgDataUrl = await convertToCanvasDataUrl(img, content);

          // Reload as raster if it was SVG
          let finalImg = img;
          if (content.startsWith("data:image/svg")) {
            finalImg = await loadImageElement(imgDataUrl);
          }

          // Convert pixel dimensions to mm (96 DPI: 1px = 0.2646mm)
          const pxToMm = 0.2646;
          let imgWmm = finalImg.width * pxToMm;
          let imgHmm = finalImg.height * pxToMm;
          const ratio = imgWmm / imgHmm;

          const maxH = 140; // max height in mm

          // Scale down to fit content width
          if (imgWmm > maxImgWidth) {
            imgWmm = maxImgWidth;
            imgHmm = imgWmm / ratio;
          }
          // Cap height
          if (imgHmm > maxH) {
            imgHmm = maxH;
            imgWmm = imgHmm * ratio;
          }
          // Ensure minimum readable size (at least 30mm wide if original is bigger)
          if (imgWmm < 30 && finalImg.width > 100) {
            imgWmm = Math.min(60, maxImgWidth);
            imgHmm = imgWmm / ratio;
          }

          ensureSpace(imgHmm + 12);

          // Center the image within the content area
          const xPos = xStart + (maxImgWidth - imgWmm) / 2;

          // Draw a subtle border around the image
          doc.setDrawColor(210, 210, 210);
          doc.setLineWidth(0.3);
          doc.roundedRect(xPos - 1, yPos - 1, imgWmm + 2, imgHmm + 2, 1, 1);

          doc.addImage(imgDataUrl, "PNG", xPos, yPos, imgWmm, imgHmm);
          yPos += imgHmm + 3;

          // Add caption below image if title exists and is meaningful
          if (title && title !== "Reference Image" && title !== "Lecture Reading") {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(140, 140, 140);
            const captionLines = doc.splitTextToSize(title, maxImgWidth);
            captionLines.forEach((line: string) => {
              ensureSpace(5);
              doc.text(line, xStart + maxImgWidth / 2, yPos, { align: "center" });
              yPos += 4;
            });
          }

          yPos += 5;
        } catch (err) {
          console.error("Failed to load image for PDF:", err);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(200, 80, 80);
          doc.text(`[Image could not be loaded: ${title}]`, xStart, yPos);
          yPos += 6;
        }
      };

      // Helper: render a video link
      const renderVideoLink = (
        content: string,
        title: string,
        xStart: number,
        maxWidth: number
      ) => {
        ensureSpace(18);

        const displayUrl = getYouTubeDisplayUrl(content);
        const videoId = extractYouTubeId(content);

        // Draw a styled video link box
        doc.setFillColor(252, 245, 245);
        doc.setDrawColor(220, 60, 60);
        doc.setLineWidth(0.4);
        doc.roundedRect(xStart, yPos - 2, maxWidth, 14, 2, 2, "FD");

        // YouTube play icon area
        doc.setFillColor(220, 50, 50);
        doc.roundedRect(xStart + 2, yPos, 10, 10, 1.5, 1.5, "F");

        // Play triangle
        doc.setFillColor(255, 255, 255);
        doc.triangle(
          xStart + 5.5, yPos + 2.5,
          xStart + 5.5, yPos + 7.5,
          xStart + 9.5, yPos + 5,
          "F"
        );

        // Video title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const titleText = title || "Video Lecture";
        const truncTitle = titleText.length > 60 ? titleText.substring(0, 57) + "..." : titleText;
        doc.text(truncTitle, xStart + 15, yPos + 4);

        // URL link
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(0, 100, 200);
        const truncUrl = displayUrl.length > 80 ? displayUrl.substring(0, 77) + "..." : displayUrl;
        doc.textWithLink(truncUrl, xStart + 15, yPos + 9, { url: displayUrl });

        yPos += 16;
      };

      // Helper: render a file attachment note
      const renderFileAttachment = (
        title: string,
        fileName: string | undefined,
        fileSize: string | undefined,
        xStart: number,
        maxWidth: number
      ) => {
        ensureSpace(14);

        doc.setFillColor(245, 250, 255);
        doc.setDrawColor(100, 160, 220);
        doc.setLineWidth(0.3);
        doc.roundedRect(xStart, yPos - 2, maxWidth, 12, 2, 2, "FD");

        // File icon area
        doc.setFillColor(100, 160, 220);
        doc.roundedRect(xStart + 2, yPos, 8, 8, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text("FILE", xStart + 3, yPos + 5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.text(fileName || title || "Attached Document", xStart + 13, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(fileSize ? `${fileSize} • Document Attachment` : "Document Attachment", xStart + 13, yPos + 8);

        yPos += 14;
      };

      let yPos = 0;

      // ============ COVER PAGE ============
      // Background accent bar
      doc.setFillColor(0, 150, 136);
      doc.rect(0, 0, pageWidth, 60, "F");

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("COURSE MODULE", marginLeft, 28);

      // Module title
      doc.setFontSize(14);
      doc.setTextColor(200, 255, 250);
      const modTitleLines = doc.splitTextToSize(mod.title, contentWidth);
      modTitleLines.forEach((line: string, idx: number) => {
        doc.text(line, marginLeft, 40 + idx * 7);
      });

      // Decorative line
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, 52, marginLeft + 50, 52);

      // Module info section
      yPos = 72;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      const previewTopics = getPreviewTopics(mod.topics).filter(t => {
        const titleUpper = t.title.toUpperCase().trim();
        return !isDiscussionTopic(t.id) &&
               !isInteractiveTopic(t.id) &&
               !isSimulationTopic(t.id) &&
               titleUpper !== "MODULE DISCUSSION FORUM" &&
               titleUpper !== "INTERACTIVE SUBNETTING ACTIVITY" &&
               titleUpper !== "INTERACTIVE ACTIVITY" &&
               titleUpper !== "SIMULATION LAB ACTIVITY" &&
               !titleUpper.includes("DISCUSSION") &&
               !titleUpper.includes("INTERACTIVE") &&
               !titleUpper.includes("SIMULATION");
      });
      const totalMaterials = previewTopics.reduce((sum, t) => {
        let count = (t.materials || []).length;
        count += (t.subtopics || []).reduce((sSum: number, s: any) => sSum + (s.materials || []).length, 0);
        return sum + count;
      }, 0);

      doc.text(`Topics: ${previewTopics.length}`, marginLeft, yPos);
      yPos += 6;
      doc.text(`Total Materials: ${totalMaterials}`, marginLeft, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, marginLeft, yPos);
      yPos += 12;

      // Table of Contents
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 136);
      doc.text("TABLE OF CONTENTS", marginLeft, yPos);
      yPos += 2;
      doc.setDrawColor(0, 150, 136);
      doc.setLineWidth(0.6);
      doc.line(marginLeft, yPos, marginLeft + 55, yPos);
      yPos += 8;

      for (let tIdx = 0; tIdx < previewTopics.length; tIdx++) {
        const topic = previewTopics[tIdx];
        ensureSpace(8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`${tIdx + 1}.  ${topic.title}`, marginLeft + 2, yPos);
        yPos += 6;

        const subtopicsList = topic.subtopics || [];
        for (let sIdx = 0; sIdx < subtopicsList.length; sIdx++) {
          ensureSpace(6);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(110, 110, 110);
          doc.text(`   ${tIdx + 1}.${sIdx + 1}  ${subtopicsList[sIdx].title}`, marginLeft + 8, yPos);
          yPos += 5;
        }
        yPos += 2;
      }

      addPageFooter(1);

      // ============ CONTENT PAGES ============
      for (let tIdx = 0; tIdx < previewTopics.length; tIdx++) {
        const topic = previewTopics[tIdx];

        // Start each topic on a new page
        doc.addPage();
        yPos = 18;

        // Topic header bar
        doc.setFillColor(0, 150, 136);
        doc.rect(0, 0, pageWidth, 4, "F");

        // Topic number badge
        doc.setFillColor(0, 150, 136);
        doc.roundedRect(marginLeft, yPos - 2, 10, 10, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(`${tIdx + 1}`, marginLeft + 5, yPos + 5, { align: "center" });

        // Topic title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        const topicTitleLines = doc.splitTextToSize(topic.title, contentWidth - 16);
        topicTitleLines.forEach((line: string, idx: number) => {
          doc.text(line, marginLeft + 14, yPos + 2 + idx * 7);
        });
        yPos += 4 + topicTitleLines.length * 7;

        // Thin divider
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
        yPos += 8;

        // Render topic materials
        const materialsList = topic.materials || [];

        for (const mat of materialsList) {
          // Skip special placeholder content
          if (mat.content === "interactive-activity-placeholder" || mat.content === "module-discussion-placeholder") {
            continue;
          }

          ensureSpace(12);

          // Material type badge + title
          if (mat.type === "text") {
            // For text materials, show the title as a section header if it exists
            if (mat.title && mat.title.trim()) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(0, 120, 110);
              const matTitleLines = doc.splitTextToSize(mat.title, contentWidth);
              matTitleLines.forEach((line: string) => {
                ensureSpace(6);
                doc.text(line, marginLeft + 1, yPos);
                yPos += 5;
              });
              yPos += 2;
            }
            renderTextContent(mat.content, mat.textStyle, marginLeft + 1, contentWidth - 2, false);
          } else if (mat.type === "image" && mat.content) {
            await renderImage(mat.content, mat.title, marginLeft, contentWidth);
          } else if (mat.type === "video") {
            renderVideoLink(mat.content, mat.title, marginLeft, contentWidth);
          } else if (mat.type === "file") {
            renderFileAttachment(mat.title, mat.fileName, mat.fileSize, marginLeft, contentWidth);
          }
        }

        // Render subtopics
        const subtopicsList = topic.subtopics || [];
        for (let sIdx = 0; sIdx < subtopicsList.length; sIdx++) {
          const sub = subtopicsList[sIdx];

          ensureSpace(16);

          // Subtopic header
          yPos += 3;
          doc.setDrawColor(0, 150, 136);
          doc.setLineWidth(0.4);
          doc.line(marginLeft, yPos, marginLeft + 8, yPos);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(60, 60, 60);
          doc.text(`${tIdx + 1}.${sIdx + 1}  ${sub.title}`, marginLeft + 10, yPos + 1);
          yPos += 8;

          const subMaterials = sub.materials || [];
          for (const mat of subMaterials) {
            if (mat.content === "interactive-activity-placeholder" || mat.content === "module-discussion-placeholder") {
              continue;
            }

            ensureSpace(12);

            if (mat.type === "text") {
              if (mat.title && mat.title.trim()) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(0, 120, 110);
                const matTitleLines = doc.splitTextToSize(mat.title, contentWidth - 6);
                matTitleLines.forEach((line: string) => {
                  ensureSpace(6);
                  doc.text(line, marginLeft + 4, yPos);
                  yPos += 5;
                });
                yPos += 1;
              }
              renderTextContent(mat.content, mat.textStyle, marginLeft + 4, contentWidth - 8, true);
            } else if (mat.type === "image" && mat.content) {
              await renderImage(mat.content, mat.title, marginLeft + 2, contentWidth - 4);
            } else if (mat.type === "video") {
              renderVideoLink(mat.content, mat.title, marginLeft + 2, contentWidth - 4);
            } else if (mat.type === "file") {
              renderFileAttachment(mat.title, mat.fileName, mat.fileSize, marginLeft + 2, contentWidth - 4);
            }
          }
        }
      }

      // Add page footers to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `${mod.title}  •  Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      doc.save(`Module_${mod.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "Student";
    const storedGeneral = localStorage.getItem(`opened_general_${savedName}`);
    if (storedGeneral) {
      try {
        setOpenedGeneralItems(JSON.parse(storedGeneral));
      } catch (e) {
        console.error("Failed to parse opened general items:", e);
      }
    }
    const storedCompleted = localStorage.getItem(`completed_topics_${savedName}`);
    if (storedCompleted) {
      try {
        setCompletedTopics(JSON.parse(storedCompleted));
      } catch (e) {
        console.error("Failed to parse completed topics:", e);
      }
    }
    const storedWatched = localStorage.getItem(`watched_videos_${savedName}`);
    if (storedWatched) {
      try {
        setWatchedVideos(JSON.parse(storedWatched));
      } catch (e) {
        console.error("Failed to parse watched videos:", e);
      }
    }
    const storedScroll = localStorage.getItem(`scroll_progress_${savedName}`);
    if (storedScroll) {
      try {
        setScrollProgress(JSON.parse(storedScroll));
      } catch (e) {
        console.error("Failed to parse scroll progress:", e);
      }
    }
    const storedPretests = localStorage.getItem(`completed_pretests_${savedName}`);
    if (storedPretests) {
      try {
        setCompletedPretests(JSON.parse(storedPretests));
      } catch (e) {
        console.error("Failed to parse completed pretests:", e);
      }
    }
    const storedScores = localStorage.getItem(`pretest_scores_${savedName}`);
    if (storedScores) {
      try {
        setPretestScores(JSON.parse(storedScores));
      } catch (e) {
        console.error("Failed to parse pretest scores:", e);
      }
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTakingPretest(false);
    setPretestAnswers({});
    setPretestScore(null);
    setPretestStarted(false);
    setPretestFullscreenActive(false);
    setPretestWarningsLeft(3);
    setPretestLocked(false);
  }, [selectedTopic, selectedSubtopic, selectedModuleId]);

  // Pre-test Fullscreen & Visibility Event Listeners
  useEffect(() => {
    if (!takingPretest || !pretestStarted || pretestLocked || (selectedModule && completedPretests[selectedModule.id])) return;

    const handlePretestFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setPretestFullscreenActive(isFs);

      if (!isFs) {
        setPretestWarningsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            handlePretestCheatSubmit("Fullscreen exit limit reached");
          }
          return next;
        });
      }
    };

    const handlePretestVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setPretestWarningsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            handlePretestCheatSubmit("Tab switch limit reached");
          }
          return next;
        });
      }
    };

    document.addEventListener("fullscreenchange", handlePretestFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handlePretestFullscreenChange);
    document.addEventListener("visibilitychange", handlePretestVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handlePretestFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handlePretestFullscreenChange);
      document.removeEventListener("visibilitychange", handlePretestVisibilityChange);
    };
  }, [takingPretest, pretestStarted, pretestLocked, pretestAnswers, selectedModule, completedPretests]);

  useEffect(() => {
    const handleScroll = () => {
      if (!selectedTopic || isModuleOverviewActive || isInteractiveTopic(selectedTopic.id) || isSimulationTopic(selectedTopic.id)) return;
      if (!workspaceRef.current) return;

      const element = workspaceRef.current;
      const rect = element.getBoundingClientRect();

      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;
      const scrolledPast = -rect.top;
      const totalScrollable = elementHeight - viewportHeight;

      let percentage = 0;
      if (totalScrollable <= 0) {
        percentage = 100;
      } else {
        percentage = Math.min(100, Math.max(0, (scrolledPast / totalScrollable) * 100));
      }

      const roundedPercent = Math.round(percentage);

      const currentMax = scrollProgress[selectedTopic.id] || 0;
      if (roundedPercent > currentMax) {
        const savedName = localStorage.getItem("userName") || "Student";
        const updated = { ...scrollProgress, [selectedTopic.id]: roundedPercent };
        setScrollProgress(updated);
        localStorage.setItem(`scroll_progress_${savedName}`, JSON.stringify(updated));
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [selectedTopic, isModuleOverviewActive, scrollProgress]);

  const toggleTopicCompletion = (topicId: number) => {
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...completedTopics, [topicId]: !completedTopics[topicId] };
    setCompletedTopics(updated);
    localStorage.setItem(`completed_topics_${savedName}`, JSON.stringify(updated));

    saveProgressToServer({
      completedTopics: updated
    });

    // Record streak activity when marking a topic complete
    if (updated[topicId]) {
      recordStreakActivity();
    }
  };

  const markVideoAsWatched = (materialId: number) => {
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...watchedVideos, [materialId]: true };
    setWatchedVideos(updated);
    localStorage.setItem(`watched_videos_${savedName}`, JSON.stringify(updated));

    saveProgressToServer({
      watchedVideos: updated
    });
  };

  const getTopicVideoMaterial = (topic: Topic) => {
    const videoMat = topic.materials?.find(m => m.type === "video");
    if (videoMat) return videoMat;
    const subVideoMat = topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "video");
    if (subVideoMat) return subVideoMat;
    return null;
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  const getTopicProgress = (topic: Topic): number => {
    if (completedTopics[topic.id]) return 100;
    if (isInteractiveTopic(topic.id) || isSimulationTopic(topic.id)) return 0;
    const videoMat = getTopicVideoMaterial(topic);
    const isVideoWatched = videoMat ? watchedVideos[videoMat.id] === true : false;
    const scrollVal = scrollProgress[topic.id] || 0;

    if (videoMat) {
      // Split progress 50/50: 50% for reading/scrolling, 50% for watching the video
      return Math.round((scrollVal * 0.5) + (isVideoWatched ? 50 : 0));
    }

    return scrollVal;
  };

  const getModuleProgress = (mod: Module): number => {
    const previewTopics = getPreviewTopics(mod.topics);
    if (previewTopics.length === 0) return 0;
    const totalProgress = previewTopics.reduce((acc, topic) => {
      const originalIdx = mod.topics.findIndex(t => t.id === topic.id);
      const isUnlocked = isTopicUnlocked(mod, originalIdx);
      const progress = isUnlocked ? getTopicProgress(topic) : 0;
      return acc + progress;
    }, 0);
    return Math.round(totalProgress / previewTopics.length);
  };

  const submitPretest = (moduleId: number, pretest: PretestQuestion[], isCheated: boolean = false) => {
    let score = 0;
    const pretestMistakesList: any[] = [];
    if (!isCheated) {
      pretest.forEach((q, idx) => {
        if (pretestAnswers[idx] === q.correctAnswer) {
          score += 1;
        } else {
          pretestMistakesList.push({
            question: q.question,
            correctAnswer: q.options[q.correctAnswer] || String(q.correctAnswer),
            userAnswer: pretestAnswers[idx] !== undefined ? (q.options[pretestAnswers[idx]] || String(pretestAnswers[idx])) : "No answer"
          });
        }
      });
    } else {
      pretest.forEach((q, idx) => {
        pretestMistakesList.push({
          question: q.question,
          correctAnswer: q.options[q.correctAnswer] || String(q.correctAnswer),
          userAnswer: "Flagged for violation"
        });
      });
    }
    setPretestScore(score);
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...completedPretests, [moduleId]: true };
    setCompletedPretests(updated);
    localStorage.setItem(`completed_pretests_${savedName}`, JSON.stringify(updated));

    const updatedScores = { ...pretestScores, [moduleId]: score };
    setPretestScores(updatedScores);
    localStorage.setItem(`pretest_scores_${savedName}`, JSON.stringify(updatedScores));

    // Save to server with pretestMistakes
    const email = localStorage.getItem("userEmail") || "";
    if (email) {
      fetch("/api/users")
        .then(res => res.json())
        .then(async (userData) => {
          if (userData.success && userData.users) {
            const profile = userData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (profile) {
              const updatedPretestMistakes = {
                ...(profile.pretestMistakes || {}),
                [moduleId]: pretestMistakesList
              };
              saveProgressToServer({
                completedPretests: updated,
                pretestScores: updatedScores,
                pretestMistakes: updatedPretestMistakes
              });
            }
          }
        })
        .catch(err => {
          console.error("Error updating pretest mistakes:", err);
          saveProgressToServer({
            completedPretests: updated,
            pretestScores: updatedScores
          });
        });
    } else {
      saveProgressToServer({
        completedPretests: updated,
        pretestScores: updatedScores
      });
    }

    // Record streak activity on pretest completion
    recordStreakActivity();
  };

  const handleStartPretestSecure = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setPretestFullscreenActive(true);
      setPretestStarted(true);
    } catch (e) {
      console.error("Fullscreen request blocked", e);
      setPretestFullscreenActive(true);
      setPretestStarted(true);
    }
  };

  const handlePretestCheatSubmit = (reason: string) => {
    setPretestLocked(true);
    if (selectedModule && selectedModule.pretest) {
      submitPretest(selectedModule.id, selectedModule.pretest, true);
    }
    const email = localStorage.getItem("userEmail") || "";
    recordCheatingLogShared(email, selectedModule?.id || 0, "pretest", reason);
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  };

  const isTopicUnlocked = (mod: Module, topicIdx: number): boolean => {
    if (mod.pretest && mod.pretest.length > 0) {
      if (!completedPretests || !completedPretests[mod.id]) {
        return false;
      }
    }
    if (topicIdx === 0) return true;
    const prevTopic = mod.topics[topicIdx - 1];
    return !!(completedTopics && prevTopic && completedTopics[prevTopic.id]);
  };

  // Helper to filter out References topics
  const getPreviewTopics = (topicsList: any[]): any[] => {
    return (topicsList || []).filter(t => {
      const titleUpper = t.title.toUpperCase().trim();
      return titleUpper !== 'REFERENCES' && titleUpper !== 'BIBLIOGRAPHY' && !/^REFERENCE\b/.test(titleUpper);
    });
  };

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

  const isDiscussionTopic = (topicId: number): boolean => {
    return topicId >= 88888800 && topicId <= 88888899;
  };

  const isInteractiveTopic = (topicId: number): boolean => {
    return topicId >= 99999900 && topicId <= 99999999;
  };

  const isSimulationTopic = (topicId: number): boolean => {
    return topicId >= 77777700 && topicId <= 77777799;
  };

  const ensureInteractiveActivity = (mods: Module[]): Module[] => {
    if (mods.length === 0) return mods;
    return mods.map((mod) => {
      const idx = getModuleIndex(mod.id);
      const baseTopics = mod.topics.filter(t => 
        (t.id < 77777700 || t.id > 99999999) &&
        t.title !== "Module Discussion Forum" &&
        t.title !== "Interactive Subnetting Activity" &&
        t.title !== "Interactive Activity" &&
        t.title !== "Simulation Lab Activity"
      );
      return {
        ...mod,
        topics: [
          ...baseTopics,
          {
            id: 88888800 + idx,
            title: "Module Discussion Forum",
            materials: [
              {
                id: 88888810 + idx,
                type: "text",
                title: "Discussion Feed",
                content: "module-discussion-placeholder"
              }
            ],
            subtopics: []
          },
          {
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
          },
          ...((idx === 3 || idx === 6 || idx === 7 || idx === 9) ? [{
            id: 77777700 + idx,
            title: "Simulation Lab Activity",
            materials: [
              {
                id: 77777710 + idx,
                type: "text",
                title: "Simulation Lab Challenge",
                content: "simulation-lab-placeholder"
              }
            ],
            subtopics: []
          }] : [])
        ]
      };
    });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      const email = localStorage.getItem("userEmail") || "";
      try {
        if (email) {
          try {
            const usersRes = await fetch("/api/users");
            const usersData = await usersRes.json();
            if (usersData.success && usersData.users) {
              const profile = usersData.users.find(
                (u: any) => u.email.toLowerCase() === email.toLowerCase()
              );
              if (profile) {
                setUserProfile(profile);
                const savedName = localStorage.getItem("userName") || "Student";
                if (profile.completedTopics) {
                  localStorage.setItem(`completed_topics_${savedName}`, JSON.stringify(profile.completedTopics));
                  setCompletedTopics(profile.completedTopics);
                }
                if (profile.watchedVideos) {
                  localStorage.setItem(`watched_videos_${savedName}`, JSON.stringify(profile.watchedVideos));
                  setWatchedVideos(profile.watchedVideos);
                }
                if (profile.completedPretests) {
                  localStorage.setItem(`completed_pretests_${savedName}`, JSON.stringify(profile.completedPretests));
                  setCompletedPretests(profile.completedPretests);
                }
                if (profile.pretestScores) {
                  localStorage.setItem(`pretest_scores_${savedName}`, JSON.stringify(profile.pretestScores));
                  setPretestScores(profile.pretestScores);
                }
                if (profile.interactiveScores) {
                  Object.entries(profile.interactiveScores).forEach(([mId, scores]) => {
                    localStorage.setItem(`interactive_scores_${savedName}_${mId}`, JSON.stringify(scores));
                  });
                }
              }
            }
          } catch (e) {
            console.error("Error fetching user profile:", e);
          }
        }

        const res = await fetch("/api/modules");
        const data = await res.json();
        if (data.success && data.modules) {
          const processed = ensureInteractiveActivity(data.modules);
          setModules(processed);
          if (processed.length > 0) {
            setSelectedModuleId(processed[0].id);
            setExpandedModules({ [processed[0].id]: true });

            const previewableTopics = getPreviewTopics(processed[0].topics);
            if (previewableTopics.length > 0) {
              setSelectedTopic(previewableTopics[0]);
              setExpandedTopics({ [previewableTopics[0].id]: true });
            }
          }
          try {
            // Strip large base64 image data to prevent exceeding localStorage quota
            const stripped = processed.map((m: any) => ({
              ...m,
              topics: m.topics.map((t: any) => ({
                ...t,
                materials: t.materials?.map((mat: any) => 
                  mat.type === "image" ? { ...mat, content: "" } : mat
                ),
                subtopics: t.subtopics?.map((sub: any) => ({
                  ...sub,
                  materials: sub.materials?.map((mat: any) => 
                    mat.type === "image" ? { ...mat, content: "" } : mat
                  )
                }))
              }))
            }));
            localStorage.setItem("professor_course_modules", JSON.stringify(stripped));
          } catch (e) {
            console.warn("Storage quota exceeded, could not save to localStorage:", e);
          }
        } else {
          loadFromLocalStorageFallback();
        }
      } catch (error) {
        console.error("Error fetching modules from API, falling back to localStorage:", error);
        loadFromLocalStorageFallback();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorageFallback = () => {
      const stored = localStorage.getItem("professor_course_modules");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Module[];
          const processed = ensureInteractiveActivity(parsed);
          setModules(processed);
          if (processed.length > 0) {
            setSelectedModuleId(processed[0].id);
            setExpandedModules({ [processed[0].id]: true });

            const previewableTopics = getPreviewTopics(processed[0].topics);
            if (previewableTopics.length > 0) {
              setSelectedTopic(previewableTopics[0]);
              setExpandedTopics({ [previewableTopics[0].id]: true });
            }
          }
        } catch (e) {
          console.error("Failed to parse modules:", e);
        }
      }
    };

    fetchAllData();
  }, []);

  // 3. Embedded Discussion Board API Interactions

  // Fetch self-introduction posts
  const fetchSelfIntroPosts = async () => {
    try {
      const res = await fetch("/api/discussions?moduleId=999998");
      const data = await res.json();
      if (data.success && data.posts) {
        setSelfIntroPosts(data.posts);
      }
    } catch (e) {
      console.error("Error fetching self-introduction posts:", e);
    }
  };

  // Submit self-introduction post
  const handlePostSelfIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSelfIntroMsg.trim()) return;
    setSelfIntroError("");
    const email = userProfile?.email || localStorage.getItem("userEmail") || "";
    const name = userProfile?.name || localStorage.getItem("userName") || "Student";
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: 999998,
          email,
          name,
          message: newSelfIntroMsg,
          isWarning: false
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewSelfIntroMsg("");
        fetchSelfIntroPosts();
      } else {
        setSelfIntroError(data.message || "Failed to post introduction.");
      }
    } catch (err) {
      setSelfIntroError("Failed to send message.");
    }
  };

  // Fetch module discussion posts
  const fetchModuleDiscussionPosts = async (mId: number) => {
    try {
      const res = await fetch(`/api/discussions?moduleId=${mId}`);
      const data = await res.json();
      if (data.success && data.posts) {
        setModuleDiscussionPosts(data.posts);
      }
    } catch (e) {
      console.error("Error fetching module discussions:", e);
    }
  };

  // Submit module discussion post
  const handlePostModuleDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleDiscussionMsg.trim()) return;
    setModuleDiscussionError("");
    const email = userProfile?.email || localStorage.getItem("userEmail") || "";
    const name = userProfile?.name || localStorage.getItem("userName") || "Student";
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          email,
          name,
          message: newModuleDiscussionMsg,
          isWarning: false
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewModuleDiscussionMsg("");
        fetchModuleDiscussionPosts(selectedModuleId!);
        // Check for bottom scroll to unlock
        setTimeout(checkChatScrolledToBottom, 100);
      } else {
        setModuleDiscussionError(data.message || "Failed to post message.");
      }
    } catch (err) {
      setModuleDiscussionError("Failed to send message.");
    }
  };

  // Check if scrolled to bottom to unlock Interactive activity
  const checkChatScrolledToBottom = () => {
    if (!moduleChatScrollRef.current || !selectedModuleId) return;
    const { scrollTop, clientHeight, scrollHeight } = moduleChatScrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      const discId = 88888800 + getModuleIndex(selectedModuleId);
      if (!completedTopics[discId]) {
        toggleTopicCompletion(discId);
      }
    }
  };

  // Trigger self-intro fetch on selection
  useEffect(() => {
    if (selectedSpecialItem === "self-introduction") {
      fetchSelfIntroPosts();
    }
  }, [selectedSpecialItem]);

  // Trigger module-discussion fetch on selection
  useEffect(() => {
    if (selectedTopic && isDiscussionTopic(selectedTopic.id) && selectedModuleId) {
      fetchModuleDiscussionPosts(selectedModuleId);
    }
  }, [selectedTopic, selectedModuleId]);

  // Handle auto-complete for short discussions with no scrollbar
  useEffect(() => {
    if (selectedTopic && isDiscussionTopic(selectedTopic.id) && moduleDiscussionPosts.length > 0 && selectedModuleId) {
      setTimeout(() => {
        if (moduleChatScrollRef.current) {
          const { scrollTop, clientHeight, scrollHeight } = moduleChatScrollRef.current;
          if (scrollHeight <= clientHeight + 10) {
            const discId = 88888800 + getModuleIndex(selectedModuleId);
            if (!completedTopics[discId]) {
              toggleTopicCompletion(discId);
            }
          }
        }
      }, 350);
    }
  }, [moduleDiscussionPosts, selectedTopic, selectedModuleId]);

  const toggleModuleExpand = (moduleId: number) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const toggleTopicExpand = (topicId: number) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // Helper to parse YouTube IDs for iframe embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const activeMaterials = selectedSubtopic
    ? selectedSubtopic.materials || []
    : selectedTopic
      ? selectedTopic.materials || []
      : [];

  const activeTitle = selectedSubtopic
    ? selectedSubtopic.title
    : selectedTopic
      ? selectedTopic.title
      : "Select a topic to start learning";

  const renderSpecialWorkspaceItem = () => {
    if (selectedSpecialItem === "announcements") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-4 mb-6">
            <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">📢 General announcements</span>
            <h2 className="text-xl font-bold mt-0.5">Subject Announcements</h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1.5">
            <div className="bg-brand-bg/40 border border-brand-border/30 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-brand-border/20 pb-3">
                <h4 className="font-bold text-brand-cyan text-sm">Welcome to Networking 1! 🚀</h4>
                <span className="text-[10px] text-brand-muted font-mono bg-brand-bg border border-brand-border/40 px-2 py-0.5 rounded">June 15, 2026</span>
              </div>
              <p className="text-xs text-brand-text/90 leading-relaxed">
                Hello class! Welcome to our gamified networking lab. To get started, please make sure you verify your registration details and then take the Module 1 Pre-test. This will unlock the study guides, lecture readings, and the interactive IP subnetting challenge! Let's master subnetting together.
              </p>
            </div>
            <div className="bg-brand-bg/40 border border-brand-border/30 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-brand-border/20 pb-3">
                <h4 className="font-bold text-brand-cyan text-sm">First Lab Exercise Available 💻</h4>
                <span className="text-[10px] text-brand-muted font-mono bg-brand-bg border border-brand-border/40 px-2 py-0.5 rounded">June 18, 2026</span>
              </div>
              <p className="text-xs text-brand-text/90 leading-relaxed">
                The VLSM and ANDing interactive lab tasks are now active. Remember that you must review the lecture materials in 'Subnetting in the IPv6 Era' and participate in the module discussion board before attempting the exercises. Scrolling to the bottom of the module discussion will unlock the interactive task!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedSpecialItem === "subject-guide") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-4 mb-6">
            <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">📄 Subject Information</span>
            <h2 className="text-xl font-bold mt-0.5">[MUST READ] Subject Guide</h2>
          </div>
          <div className="flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-1.5 leading-relaxed">
            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-brand-cyan border-b border-brand-border/30 pb-2">Course Overview & Syllabus</h3>
              <p className="text-xs text-brand-text/90 leading-relaxed">
                This subject introduces fundamental concepts of computer networking, IP address structures, subnet masks, variable length subnet masking (VLSM), and binary ANDing logic. Students will engage in gamified interactive exercises to test their subnetting and network anatomy skills.
              </p>

              <h4 className="font-bold text-xs text-brand-text mt-2">Syllabus Breakdown:</h4>
              <ul className="list-disc pl-5 text-xs text-brand-muted flex flex-col gap-1">
                <li>Module 1: Introduction of Subnetting (FLSM, VLSM, Binary ANDing, IPv6 Era)</li>
                <li>Module 2: Routing Protocols & Local Area Networks</li>
              </ul>
            </div>

            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-brand-cyan border-b border-brand-border/30 pb-2">Grading Policy</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between border-b border-brand-border/15 pb-1">
                  <span className="text-brand-muted">Pre-tests:</span>
                  <span className="font-bold text-brand-text">20%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-1">
                  <span className="text-brand-muted">Interactive Labs:</span>
                  <span className="font-bold text-brand-text">40%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-1">
                  <span className="text-brand-muted">Quizzes:</span>
                  <span className="font-bold text-brand-text">30%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-1">
                  <span className="text-brand-muted">Forums Participation:</span>
                  <span className="font-bold text-brand-text">10%</span>
                </div>
              </div>
            </div>

            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-brand-cyan border-b border-brand-border/30 pb-2">Rules of Conduct</h3>
              <p className="text-xs text-brand-text/90 leading-relaxed">
                Respectful communication is strictly enforced on all discussion boards. Cheating or distributing direct solutions to interactive tasks is prohibited. Working together to troubleshoot topologies is welcomed!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedSpecialItem === "self-introduction") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-4 mb-6">
            <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">👋 Class Introductions</span>
            <h2 className="text-xl font-bold mt-0.5">Self-introduction Board</h2>
            <p className="text-brand-muted text-xs mt-1">Say hello to your fellow classmates! Share your name, program, and hobbies.</p>
          </div>

          {/* Chat area */}
          <div className="flex-grow overflow-y-auto max-h-[300px] border border-brand-border/40 bg-brand-bg/25 rounded-2xl p-4 flex flex-col gap-3 scrollbar-thin mb-4">
            {selfIntroPosts.length === 0 ? (
              <div className="text-center py-10 text-brand-muted italic text-xs">
                No introductions shared yet. Be the first to say hello!
              </div>
            ) : (
              selfIntroPosts.map((post) => (
                <div key={post.id} className="bg-brand-bg/50 border border-brand-border/35 rounded-xl p-3.5 flex gap-3 animate-scaleIn">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-gradient-to-br from-brand-cyan to-blue-600 text-brand-bg select-none">
                    {getAvatarInitials(post.name)}
                  </div>
                  <div className="flex-grow flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-text">{post.name}</span>
                      <span className="text-[9px] text-brand-muted font-mono">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-brand-text/90 leading-relaxed whitespace-pre-wrap">{post.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <form onSubmit={handlePostSelfIntro} className="flex flex-col gap-2 shrink-0">
            {selfIntroError && <span className="text-red-400 text-xs">{selfIntroError}</span>}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSelfIntroMsg}
                onChange={(e) => {
                  setNewSelfIntroMsg(e.target.value);
                  if (selfIntroError) setSelfIntroError("");
                }}
                placeholder="Type your introduction message (e.g. Hi I'm Jake from BSIT 3A!)..."
                className="flex-grow bg-brand-bg/50 border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-muted/70"
              />
              <button
                type="submit"
                disabled={!newSelfIntroMsg.trim()}
                className="px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              >
                Post 👋
              </button>
            </div>
          </form>
        </div>
      );
    }

    return null;
  };



  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/student/curriculum" />

      <main className="p-8 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        {/* Header */}
        <header className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Learning Center</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1 mb-2">Class Curriculum</h1>
          <p className="text-brand-muted text-sm">
            Access study guides, video lessons, and documents shared by your professor.
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl flex flex-col gap-6 max-w-3xl">
                <div className="flex items-center gap-4 border-b border-brand-border/40 pb-4">
                  <div className="p-3.5 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
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
              </div>
            )}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <h3 className="font-bold text-lg">No Curriculum Materials Available</h3>
            <p className="text-brand-muted text-sm max-w-sm mt-1 leading-relaxed">
              Your professor has not uploaded any learning modules or topics yet. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* LEFT COLUMN: Curriculum Tree Selection */}
            <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex flex-col gap-4 min-w-0">
              <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-1">
                Networking 1
              </h3>

              <div className="flex flex-col gap-3">
                {/* Subject Overview Static Section */}
                <div className="border border-brand-border/40 rounded-xl overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedSubjectOverview(!expandedSubjectOverview);
                      setSelectedSpecialItem("announcements");
                      setSelectedTopic(null);
                      setSelectedSubtopic(null);
                      setSelectedModuleId(null);
                      setTakingPretest(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-brand-border/20 hover:bg-brand-bg/85 ${selectedSpecialItem !== null
                        ? "bg-brand-cyan/15 text-brand-cyan font-bold border-l-2 border-l-brand-cyan"
                        : "bg-brand-bg/50 text-brand-text"
                      }`}
                  >
                    <div className="flex-grow min-w-0 pr-2">
                      <span className={`text-[9px] uppercase tracking-wider font-semibold ${selectedSpecialItem !== null ? "text-brand-cyan" : "text-brand-cyan/70"}`}>
                        General
                      </span>
                      <h4 className="text-sm font-bold mt-0.5 whitespace-normal break-words leading-tight">Subject Overview</h4>
                    </div>
                    <span className="text-brand-muted shrink-0">
                      {expandedSubjectOverview ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                      )}
                    </span>
                  </button>

                  {expandedSubjectOverview && (
                    <div className="p-2 flex flex-col gap-1.5 bg-brand-card/30">
                      {/* Announcements */}
                      <button
                        onClick={() => {
                          setSelectedSpecialItem("announcements");
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedModuleId(null);
                          setTakingPretest(false);
                          markGeneralItemAsOpened("announcements");
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${selectedSpecialItem === "announcements"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>📢</span>
                          <span>Announcements</span>
                        </div>
                        {openedGeneralItems.includes("announcements") && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`shrink-0 ${
                              selectedSpecialItem === "announcements"
                                ? "text-green-800"
                                : "text-green-500"
                            }`}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        )}
                      </button>

                      {/* Self-introduction */}
                      <button
                        onClick={() => {
                          setSelectedSpecialItem("self-introduction");
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedModuleId(null);
                          setTakingPretest(false);
                          markGeneralItemAsOpened("self-introduction");
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${selectedSpecialItem === "self-introduction"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>👋</span>
                          <span>Self-introduction</span>
                        </div>
                        {openedGeneralItems.includes("self-introduction") && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`shrink-0 ${
                              selectedSpecialItem === "self-introduction"
                                ? "text-green-800"
                                : "text-green-500"
                            }`}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        )}
                      </button>

                      {/* Subject Guide */}
                      <button
                        onClick={() => {
                          setSelectedSpecialItem("subject-guide");
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedModuleId(null);
                          setTakingPretest(false);
                          markGeneralItemAsOpened("subject-guide");
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${selectedSpecialItem === "subject-guide"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span>[MUST READ] Subject Guide</span>
                        </div>
                        {openedGeneralItems.includes("subject-guide") && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`shrink-0 ${
                              selectedSpecialItem === "subject-guide"
                                ? "text-green-800"
                                : "text-green-500"
                            }`}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {modules.map((mod) => {
                  const isModExpanded = expandedModules[mod.id] !== false;

                  return (
                    <div key={mod.id} className="border border-brand-border/40 rounded-xl overflow-hidden">
                      {/* Module Header Button */}
                      <button
                        onClick={() => {
                          toggleModuleExpand(mod.id);
                          if (selectedSpecialItem === null && selectedTopic === null) {
                            setSelectedModuleId(mod.id);
                            setSelectedTopic(null);
                            setSelectedSubtopic(null);
                            setSelectedSpecialItem(null);
                            setTakingPretest(false);
                          }
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-brand-border/20 hover:bg-brand-bg/85 ${selectedModuleId === mod.id && !selectedTopic
                          ? "bg-brand-cyan/15 text-brand-cyan font-bold border-l-2 border-l-brand-cyan"
                          : "bg-brand-bg/50 text-brand-text"
                          }`}
                      >
                        <div className="flex-grow min-w-0 pr-2">
                          <span className={`text-[9px] uppercase tracking-wider font-semibold ${selectedModuleId === mod.id && !selectedTopic ? "text-brand-cyan" : "text-brand-cyan/70"
                            }`}>
                            Module
                          </span>
                          <h4 className="text-sm font-bold mt-0.5 whitespace-normal break-words leading-tight">{mod.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mr-2">
                          <CircularProgress progress={getModuleProgress(mod)} size={20} strokeWidth={2} isSelected={selectedModuleId === mod.id && !selectedTopic} />
                          <span className="text-[10px] font-mono opacity-85">{getModuleProgress(mod)}%</span>
                        </div>
                        <span className="text-brand-muted shrink-0">
                          {isModExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                          )}
                        </span>
                      </button>

                      {/* Topics List within Module */}
                      {isModExpanded && (
                        <div className="p-2 flex flex-col gap-1.5 bg-brand-card/30">
                          {mod.pretest && mod.pretest.length > 0 && (() => {
                            const isPretestLocked = mod.id === 1782134355228 && !isGeneralCompleted;
                            return (
                              <button
                                disabled={isPretestLocked}
                                onClick={() => {
                                  setSelectedModuleId(mod.id);
                                  setSelectedTopic(null);
                                  setSelectedSubtopic(null);
                                  setSelectedSpecialItem(null);
                                  setTakingPretest(true);
                                }}
                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                  isPretestLocked
                                    ? "opacity-50 cursor-not-allowed text-brand-muted bg-brand-bg/10"
                                    : takingPretest && selectedModuleId === mod.id && selectedTopic === null
                                      ? "bg-brand-cyan text-brand-bg font-bold shadow-sm cursor-pointer"
                                      : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40 cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-sm font-bold min-w-0 flex-grow whitespace-normal break-words leading-tight">
                                  {isPretestLocked ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="shrink-0 text-brand-muted/70"
                                    >
                                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                  ) : completedPretests && completedPretests[mod.id] ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={`shrink-0 ${
                                        takingPretest && selectedModuleId === mod.id && selectedTopic === null
                                          ? "text-green-800"
                                          : "text-green-500"
                                      }`}
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="m9 12 2 2 4-4" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-border/40">
                                      <circle cx="12" cy="12" r="10" />
                                    </svg>
                                  )}
                                  <span>📝 Module Pre-test</span>
                                </div>
                                {isPretestLocked && (
                                  <span className="text-[8px] uppercase tracking-wider bg-brand-bg/60 text-brand-muted px-1.5 py-0.5 rounded border border-brand-border/20">
                                    Locked
                                  </span>
                                )}
                              </button>
                            );
                          })()}

                          {getPreviewTopics(mod.topics).length === 0 ? (
                            <div className="text-[10px] text-brand-muted/70 px-3 py-2 italic">
                              No topics outlined yet
                            </div>
                          ) : (
                            getPreviewTopics(mod.topics).map((topic, topicIdx) => {
                              const isUnlocked = isTopicUnlocked(mod, topicIdx);
                              const isTopicSelected = selectedTopic?.id === topic.id && !selectedSubtopic;
                              const isTopicExpanded = expandedTopics[topic.id] === true;
                              const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
                              const progress = isUnlocked ? getTopicProgress(topic) : 0;

                              return (
                                <div key={topic.id} className="flex flex-col">
                                  {/* Topic Item Button */}
                                  <div
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${!isUnlocked
                                      ? isTopicSelected
                                        ? "bg-brand-card border border-brand-border/40 text-brand-muted opacity-80"
                                        : "text-brand-muted/65 hover:bg-brand-bg/25"
                                      : isTopicSelected
                                        ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                        : selectedTopic?.id === topic.id
                                          ? "bg-brand-cyan/10 text-brand-text font-semibold border border-brand-cyan/20"
                                          : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                      }`}
                                    onClick={() => {
                                      setSelectedTopic(topic);
                                      setSelectedSubtopic(null);
                                      setSelectedModuleId(mod.id);
                                      setSelectedSpecialItem(null);
                                      setTakingPretest(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2 text-sm font-bold min-w-0 flex-grow whitespace-normal break-words leading-tight">
                                      {!isUnlocked ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className={`shrink-0 ${isTopicSelected ? "text-brand-muted" : "text-brand-muted/70"}`}
                                        >
                                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                      ) : (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className={`shrink-0 ${progress === 100
                                            ? isTopicSelected
                                              ? "text-green-800"
                                              : "text-green-500"
                                            : isTopicSelected
                                              ? "text-white/40"
                                              : "text-brand-border/40"
                                            }`}
                                        >
                                          <circle cx="12" cy="12" r="10" />
                                          {progress === 100 && <path d="m9 12 2 2 4-4" />}
                                        </svg>
                                      )}
                                      <span>{topic.title}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Horizontal Progress Bar + Percentage */}
                                      {isUnlocked && (
                                        <div className="flex flex-col items-end gap-1 w-16 shrink-0">
                                          <span className="text-[10px] font-mono opacity-80 leading-none">{progress}%</span>
                                          <div className={`w-full h-1.5 rounded-full overflow-hidden bg-brand-bg/60 border ${isTopicSelected ? "border-white/10" : "border-brand-border/20"
                                            }`}>
                                            <div
                                              className={`h-full transition-all duration-300 ${isTopicSelected ? "bg-white" : "bg-brand-cyan"
                                                }`}
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {hasSubtopics && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTopicExpand(topic.id);
                                          }}
                                          className={`p-0.5 shrink-0 ${isTopicSelected ? 'text-brand-bg hover:text-brand-bg/80' : 'text-brand-muted hover:text-brand-text'}`}
                                        >
                                          {isTopicExpanded ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Subtopics Listing */}
                                  {hasSubtopics && isTopicExpanded && (
                                    <div className="pl-4 pr-1 mt-1 flex flex-col gap-1 border-l border-brand-border/40 ml-4 py-0.5">
                                      {topic.subtopics!.map((sub: any) => {
                                        const isSubSelected = selectedSubtopic?.id === sub.id;

                                        return (
                                          <button
                                            key={sub.id}
                                            disabled={!isUnlocked}
                                            onClick={() => {
                                              setSelectedTopic(topic);
                                              setSelectedSubtopic(sub);
                                              setSelectedModuleId(mod.id);
                                              setSelectedSpecialItem(null);
                                              setTakingPretest(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] whitespace-normal break-words leading-tight transition-colors ${!isUnlocked
                                              ? "opacity-40 cursor-not-allowed text-brand-muted"
                                              : isSubSelected
                                                ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                                : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/20"
                                              }`}
                                          >
                                            • {sub.title}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* RIGHT COLUMN: Study Workspace Panel */}
            <div ref={workspaceRef} className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg min-h-[460px] flex flex-col animate-all duration-300 min-w-0">

              {selectedSpecialItem !== null ? (
                // SPECIAL WORKSPACE VIEW
                renderSpecialWorkspaceItem()
              ) : takingPretest && selectedModule && selectedModule.pretest ? (
                // PRE-TEST INTERFACE
                <div
                  className="flex-grow flex flex-col h-full select-none"
                  style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" } as React.CSSProperties}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Workspace Header */}
                  <div className="border-b border-brand-border/40 pb-4 mb-6">
                    <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                      Course Pre-test
                    </span>
                    <h2 className="text-xl font-bold mt-0.5">{selectedModule.title} — Pre-test</h2>
                  </div>

                  {pretestScore !== null || (completedPretests && completedPretests[selectedModule.id]) ? (
                    // Show Pre-test Results
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-brand-bg/25 border border-brand-border/40 rounded-2xl">
                      <div className="w-28 h-28 rounded-full border-4 border-brand-cyan flex flex-col items-center justify-center mb-6 animate-scaleIn">
                        <span className="text-3xl font-extrabold text-brand-cyan leading-none">
                          {pretestScore !== null ? pretestScore : (pretestScores && pretestScores[selectedModule.id] !== undefined ? pretestScores[selectedModule.id] : 0)}
                        </span>
                        <div className="w-10 h-[1.5px] bg-brand-cyan/30 my-1.5"></div>
                        <span className="text-sm font-bold text-brand-muted leading-none">{selectedModule.pretest.length}</span>
                      </div>
                      <h3 className="font-bold text-lg">Pre-test Completed!</h3>
                      <p className="text-sm text-brand-muted mt-2 max-w-sm leading-relaxed">
                        Thank you for taking the pre-test. The course topics for this module are now unlocked and ready for you to study!
                      </p>
                      <button
                        onClick={() => {
                          setTakingPretest(false);
                          setPretestScore(null);
                          if (selectedModule.topics.length > 0) {
                            setSelectedTopic(getPreviewTopics(selectedModule.topics)[0]);
                          }
                        }}
                        className="mt-6 px-6 py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-extrabold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Start Learning →
                      </button>
                    </div>
                  ) : !pretestStarted ? (
                    // Pre-test security screen
                    <div className="bg-brand-card/40 border border-brand-border/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
                      <div className="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan flex items-center justify-center text-brand-cyan animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-brand-text mb-2">Secure Assessment Mode Required</h3>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          To ensure academic integrity, this pre-test runs in **Secure Fullscreen Mode**.
                        </p>
                      </div>
                      <ul className="text-left text-xs text-brand-muted space-y-2 border-y border-brand-border/30 py-4 w-full">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-cyan font-bold">•</span>
                          <span><strong>Fullscreen Enforced:</strong> Do not exit fullscreen. Exiting counts as a warning.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-cyan font-bold">•</span>
                          <span><strong>Cheat Prevention:</strong> Max 3 warnings (exiting fullscreen or shifting tabs) before the session auto-locks.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-cyan font-bold">•</span>
                          <span><strong>Copy Protected:</strong> Copying, cutting, pasting, and right-clicks are disabled.</span>
                        </li>
                      </ul>
                      <button
                        onClick={handleStartPretestSecure}
                        className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-brand-cyan/20 cursor-pointer"
                      >
                        Begin Secure Pre-test
                      </button>
                    </div>
                  ) : pretestStarted && !pretestFullscreenActive && !pretestLocked ? (
                    // Warnings left page
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center text-red-400 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-red-400 mb-2">Security Warning: Fullscreen Exited</h3>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          You have exited fullscreen mode. Please re-enter immediately to continue the pre-test.
                        </p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400">
                        ⚠️ Warnings Left: {pretestWarningsLeft} / 3. Shifting focus or exiting again will LOCK your pre-test.
                      </div>
                      <button
                        onClick={handleStartPretestSecure}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                      >
                        Re-enter Fullscreen & Resume
                      </button>
                    </div>
                  ) : pretestLocked ? (
                    // Pretest locked screen
                    <div className="bg-brand-card/40 border border-brand-border/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] select-none gap-6 max-w-xl mx-auto shadow-xl">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-brand-text mb-2">Pre-test Session Locked</h3>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          This pre-test has been auto-submitted and locked due to repeatedly exiting fullscreen or changing tabs.
                        </p>
                      </div>
                      <div className="bg-brand-cyan/15 border border-brand-cyan/20 px-6 py-3.5 rounded-xl w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Final Pre-test Score</span>
                        <span className="text-base font-mono font-black text-brand-cyan">0 / {selectedModule.pretest.length}</span>
                      </div>
                      <button
                        onClick={() => {
                          setTakingPretest(false);
                          setPretestScore(null);
                          if (selectedModule.topics.length > 0) {
                            setSelectedTopic(getPreviewTopics(selectedModule.topics)[0]);
                          }
                        }}
                        className="w-full py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Continue to Topics
                      </button>
                    </div>
                  ) : (
                    // Quiz questions form
                    <div className="flex-grow flex flex-col gap-6" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}>
                      <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4 flex justify-between items-center">
                        <p className="text-xs text-brand-muted leading-relaxed">
                          This pre-test contains <strong>{selectedModule.pretest.length} multiple-choice questions</strong> designed to evaluate your current knowledge level.
                        </p>
                        <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md shrink-0 select-none">
                          ⚠️ Warnings: {pretestWarningsLeft} / 3
                        </span>
                      </div>

                      <div className="flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-2">
                        {selectedModule.pretest.map((q, idx) => (
                          <div key={idx} className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-4 flex flex-col gap-3">
                            <h4 className="font-bold text-xs text-brand-cyan uppercase tracking-wider">Question {idx + 1}</h4>
                            <p className="text-sm font-semibold text-brand-text leading-snug">{q.question}</p>
                            <div className="grid grid-cols-1 gap-2 mt-1">
                              {q.options.map((opt, oIdx) => {
                                const isSelected = pretestAnswers[idx] === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => setPretestAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${isSelected
                                      ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan font-bold"
                                      : "bg-brand-card/50 border-brand-border/45 text-brand-text/90 hover:border-brand-border-hover hover:bg-brand-bg/30"
                                      }`}
                                  >
                                    <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-6 border-t border-brand-border/40 flex justify-between items-center gap-4">
                        <button
                          onClick={() => setTakingPretest(false)}
                          className="px-5 py-2.5 bg-brand-bg hover:bg-brand-bg/80 border border-brand-border text-brand-text font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitPretest(selectedModule.id, selectedModule.pretest!)}
                          disabled={Object.keys(pretestAnswers).length < selectedModule.pretest.length}
                          className="px-6 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          Submit Pre-test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isModuleOverviewActive ? (
                // MODULE OVERVIEW PANEL
                <div className="flex-grow flex flex-col h-full">
                  {/* Workspace Header */}
                  <div className="border-b border-brand-border/40 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                        Module Overview
                      </span>
                      <h2 className="text-xl font-bold mt-0.5">{selectedModule.title}</h2>
                    </div>

                    <button
                      onClick={() => downloadModulePDF(selectedModule)}
                      disabled={isDownloading}
                      className="px-4 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer select-none"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-bg"></div>
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          <span>Download Module PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Overview Body */}
                  <div className="flex-grow flex flex-col gap-6">
                    {selectedModule.pretest && selectedModule.pretest.length > 0 && completedPretests[selectedModule.id] && (
                      <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-sm text-green-400 flex items-center gap-1.5">
                            ✓ Module Pre-test Completed
                          </h3>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                            You have successfully completed the pre-test for this module.
                          </p>
                        </div>
                        {pretestScores[selectedModule.id] !== undefined && (
                          <div className="bg-brand-cyan/15 border border-brand-cyan/20 px-4 py-2.5 rounded-xl shrink-0 text-center">
                            <div className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">Your Score</div>
                            <div className="text-lg font-mono font-bold text-brand-cyan">
                              {pretestScores[selectedModule.id]} / {selectedModule.pretest.length}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedModule.pretest && selectedModule.pretest.length > 0 && !completedPretests[selectedModule.id] && (
                      <div className="bg-yellow-500/10 border border-yellow-500/35 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="font-bold text-sm text-yellow-500 flex items-center gap-1.5 animate-pulse">
                            ⚠️ Module Pre-test Required
                          </h3>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                            This module requires you to complete a brief pre-test before you can access any of the study topics.
                          </p>
                        </div>
                        <button
                          onClick={() => setTakingPretest(true)}
                          className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-brand-bg font-extrabold text-xs rounded-xl uppercase tracking-wider transition-colors shrink-0 shadow-md cursor-pointer select-none"
                        >
                          Start Pre-test ({selectedModule.pretest.length} Items)
                        </button>
                      </div>
                    )}

                    <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-5">
                      <h3 className="font-bold text-sm text-brand-cyan mb-2">About this Module</h3>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        This module covers key network building blocks, concepts, and materials carefully compiled by your instructor. Explore the topics below to build a solid foundation. You can download the complete syllabus and course materials as a structured PDF using the download button above.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-brand-muted">Topics in this Module</h3>
                      {getPreviewTopics(selectedModule.topics).length === 0 ? (
                        <div className="text-xs text-brand-muted italic py-4">No topics in this module.</div>
                      ) : (
                        <div className="grid gap-3">
                          {getPreviewTopics(selectedModule.topics).map((topic, index) => {
                            const isUnlocked = isTopicUnlocked(selectedModule, index);
                            const progress = isUnlocked ? getTopicProgress(topic) : 0;
                            const preview = getTopicPreview(topic);
                            const materialsList = topic.materials || [];
                            const subtopicsList = topic.subtopics || [];

                            const hasVideo = materialsList.some((m: any) => m.type === "video") || subtopicsList.flatMap((s: any) => s.materials || []).some((m: any) => m.type === "video");
                            const hasText = materialsList.some((m: any) => m.type === "text") || subtopicsList.flatMap((s: any) => s.materials || []).some((m: any) => m.type === "text");
                            const hasFile = materialsList.some((m: any) => m.type === "file") || subtopicsList.flatMap((s: any) => s.materials || []).some((m: any) => m.type === "file");
                            const hasImage = materialsList.some((m: any) => m.type === "image") || subtopicsList.flatMap((s: any) => s.materials || []).some((m: any) => m.type === "image");

                            return (
                              <div
                                key={topic.id}
                                className="bg-brand-bg/25 border border-brand-border/20 hover:border-brand-cyan/35 rounded-xl p-4 transition-all flex flex-col gap-3 group"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-brand-cyan bg-brand-cyan/10 w-6 h-6 rounded-full flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <h4 className="font-bold text-sm text-brand-text group-hover:text-brand-cyan transition-colors">
                                      {topic.title}
                                    </h4>
                                  </div>
                                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full whitespace-nowrap ${!isUnlocked
                                    ? "bg-brand-muted/10 text-brand-muted border border-brand-border/40"
                                    : progress === 100
                                      ? "bg-green-500/10 text-green-400 border border-green-500/25"
                                      : progress > 0
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25"
                                        : "bg-brand-muted/10 text-brand-muted border border-brand-border/40"
                                    }`}>
                                    {!isUnlocked ? "Locked" : progress === 100 ? "Completed" : progress > 0 ? `In Progress (${progress}%)` : "Not Started"}
                                  </span>
                                </div>

                                <div className="text-[11px] text-brand-muted leading-relaxed pl-8">
                                  {preview}
                                </div>

                                <div className="flex flex-wrap gap-2 pl-8 items-center mt-1">
                                  <span className="text-[9px] text-brand-muted/70 uppercase tracking-widest mr-1 font-bold">Includes:</span>
                                  {hasText && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      📘 Reading Lecture
                                    </span>
                                  )}
                                  {hasVideo && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      🎥 Video Lesson
                                    </span>
                                  )}
                                  {hasImage && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      🖼️ Diagrams
                                    </span>
                                  )}
                                  {hasFile && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      📎 Attachments
                                    </span>
                                  )}
                                  {subtopicsList.length > 0 && (
                                    <span className="text-[10px] bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20 text-brand-cyan flex items-center gap-1">
                                      🌿 {subtopicsList.length} Subtopics
                                    </span>
                                  )}
                                </div>

                                <div className="pl-8 flex justify-start mt-1">
                                  {isTopicUnlocked(selectedModule, index) ? (
                                    <button
                                      onClick={() => {
                                        setSelectedTopic(topic);
                                        setSelectedSubtopic(null);
                                        setExpandedTopics(prev => ({ ...prev, [topic.id]: true }));
                                      }}
                                      className="text-[11px] text-brand-cyan hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      Go to topic contents →
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-brand-muted flex items-center gap-1.5 select-none">
                                      🔒 Locked (Complete Pre-test or previous topics)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-brand-border/40 flex justify-end">
                    {selectedModule.pretest && selectedModule.pretest.length > 0 && !completedPretests[selectedModule.id] ? (
                      <button
                        onClick={() => setTakingPretest(true)}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-brand-bg font-extrabold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Take Module Pre-test →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const previewableTopics = getPreviewTopics(selectedModule.topics);
                          if (previewableTopics.length > 0) {
                            setSelectedTopic(previewableTopics[0]);
                            setSelectedSubtopic(null);
                            setExpandedTopics(prev => ({ ...prev, [previewableTopics[0].id]: true }));
                          }
                        }}
                        disabled={selectedModule.topics.length === 0}
                        className="px-6 py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-extrabold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Start Learning Module →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // EXISTING TOPIC / MATERIALS PANEL
                <>
                  {!isTopicUnlocked(selectedModule!, selectedModule!.topics.findIndex(t => t.id === selectedTopic!.id)) ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-brand-border/30 rounded-2xl my-auto">
                      <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20 mb-4 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      </div>
                      <h3 className="font-bold text-lg">Topic is Locked</h3>
                      <p className="text-sm text-brand-muted mt-2 max-w-md leading-relaxed">
                        {selectedModule!.pretest && selectedModule!.pretest.length > 0 && !completedPretests[selectedModule!.id] ? (
                          <>
                            You must complete the <strong>Module Pre-test</strong> before you can access this learning material.
                            <button
                              onClick={() => {
                                setSelectedTopic(null);
                                setTakingPretest(true);
                              }}
                              className="mt-4 px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-extrabold text-xs rounded-xl uppercase tracking-wider block mx-auto transition-all shadow-md cursor-pointer"
                            >
                              Go to Module Pre-test
                            </button>
                          </>
                        ) : (
                          <>
                            Please complete the previous topics in this module sequentially to unlock this study content.
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Workspace Header */}
                      <div className="border-b border-brand-border/40 pb-4 mb-6">
                        <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                          Study Workspace
                        </span>
                        <h2 className="text-xl font-bold mt-0.5">{activeTitle}</h2>
                      </div>

                      {/* Materials Rendering */}
                      <div className="flex-grow flex flex-col gap-6">
                        {isInteractiveTopic(selectedTopic!.id) ? (
                          <InteractiveSubnettingActivity
                            onComplete={() => {
                              const interId = 99999900 + getModuleIndex(selectedModule!.id);
                              if (!completedTopics[interId]) {
                                toggleTopicCompletion(interId);
                              }
                            }}
                            isCompleted={completedTopics[99999900 + getModuleIndex(selectedModule!.id)] === true}
                            handleSelectNextTopic={handleSelectNextTopic}
                            moduleId={selectedModule!.id}
                          />
                        ) : isSimulationTopic(selectedTopic!.id) ? (
                          <SimulationLabActivityCard
                            moduleId={selectedModule!.id}
                            isCompleted={completedTopics[77777700 + getModuleIndex(selectedModule!.id)] === true}
                            onComplete={() => {
                              const labId = 77777700 + getModuleIndex(selectedModule!.id);
                              if (!completedTopics[labId]) {
                                toggleTopicCompletion(labId);
                              }
                            }}
                            handleSelectNextTopic={handleSelectNextTopic}
                          />
                        ) : isDiscussionTopic(selectedTopic!.id) ? (
                          // MODULE DISCUSSION FORUM VIEW
                          <div className="flex-grow flex flex-col h-full animate-scaleIn">
                            <p className="text-brand-muted text-xs mb-3">
                              Ask questions, share networking tips, and collaborate on this module's topics.
                              <strong> You must scroll to the bottom of the feed to proceed.</strong>
                            </p>

                            {/* Scrollable chat container */}
                            <div
                              ref={moduleChatScrollRef}
                              onScroll={checkChatScrolledToBottom}
                              className="flex-grow overflow-y-auto max-h-[300px] border border-brand-border/40 bg-brand-bg/25 rounded-2xl p-4 flex flex-col gap-3 scrollbar-thin mb-4"
                            >
                              {moduleDiscussionPosts.length === 0 ? (
                                <div className="text-center py-10 text-brand-muted italic text-xs">
                                  No messages posted yet. Start the conversation!
                                </div>
                              ) : (
                                moduleDiscussionPosts.map((post) => {
                                  const isMsgWarning = post.isWarning === true;
                                  const isMsgModerator = post.role === "Professor" || post.role === "Admin";
                                  const displayAuthorName = isMsgWarning ? post.role : post.name;
                                  return (
                                    <div
                                      key={post.id}
                                      className={`border rounded-xl p-3 flex gap-3 animate-scaleIn transition-all ${isMsgWarning
                                          ? "bg-amber-500/5 border-amber-500/25 border-l-4 border-l-amber-500"
                                          : "bg-brand-bg/50 border border-brand-border/35"
                                        }`}
                                    >
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-brand-bg select-none ${isMsgWarning
                                          ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                                          : isMsgModerator
                                            ? "bg-gradient-to-br from-emerald-400 to-teal-600"
                                            : "bg-gradient-to-br from-brand-cyan to-blue-600"
                                        }`}>
                                        {getAvatarInitials(displayAuthorName)}
                                      </div>
                                      <div className="flex-grow flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-brand-text">{displayAuthorName}</span>
                                          <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded uppercase select-none ${isMsgModerator
                                              ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                                              : "bg-brand-bg border border-brand-border/40 text-brand-muted"
                                            }`}>
                                            {post.role}
                                          </span>
                                          <span className="text-[9px] text-brand-muted font-mono">
                                            {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isMsgWarning ? "text-amber-300 italic" : "text-brand-text/90"}`}>
                                          {post.message}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Status Indicator */}
                            <div className="mb-4">
                              {completedTopics[88888800 + getModuleIndex(selectedModule!.id)] ? (
                                <div className="bg-green-500/10 border border-green-500/25 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-scaleIn">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  <span>Module discussion completed. You are now cleared to start the <strong>Interactive Activity</strong>!</span>
                                </div>
                              ) : (
                                <div className="bg-yellow-500/10 border border-yellow-500/25 text-yellow-500 p-3 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                  <span>Please scroll to the bottom of the discussion feed to unlock the next activity.</span>
                                </div>
                              )}
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handlePostModuleDiscussion} className="flex flex-col gap-2 shrink-0">
                              {moduleDiscussionError && <span className="text-red-400 text-xs">{moduleDiscussionError}</span>}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newModuleDiscussionMsg}
                                  onChange={(e) => {
                                    setNewModuleDiscussionMsg(e.target.value);
                                    if (moduleDiscussionError) setModuleDiscussionError("");
                                  }}
                                  placeholder="Post a question or comment about this module..."
                                  className="flex-grow bg-brand-bg/50 border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-muted/70"
                                />
                                <button
                                  type="submit"
                                  disabled={!newModuleDiscussionMsg.trim()}
                                  className="px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                                >
                                  Post Message
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : activeMaterials.length === 0 ? (
                          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-brand-border/30 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M6 6h10M6 10h10" /></svg>
                            <h4 className="font-bold text-sm">No Materials Available</h4>
                            <p className="text-xs text-brand-muted mt-1 max-w-[260px]">
                              This topic outlines the course syllabus, but no reading materials, videos, or attachments have been uploaded yet.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {activeMaterials.map((mat, idx) => {
                              const youtubeEmbedUrl = mat.type === "video" ? getYouTubeEmbedUrl(mat.content) : null;

                              return (
                                <div
                                  key={mat.id}
                                  className="flex flex-col gap-3 pb-6 border-b border-brand-border/20 last:border-b-0 last:pb-0"
                                >
                                  <div className="flex items-center justify-between gap-4 text-brand-text w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded shrink-0">
                                        Material {idx + 1}
                                      </span>
                                      <h3 className="font-bold text-sm text-brand-text truncate">
                                        {mat.title}
                                      </h3>
                                    </div>

                                    {/* Video watch status label */}
                                    {mat.type === "video" && youtubeEmbedUrl && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 whitespace-nowrap ${watchedVideos[mat.id]
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                        }`}>
                                        {watchedVideos[mat.id] ? (
                                          <>
                                            <span>✓</span>
                                            <span>Watched</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                            <span>Unwatched</span>
                                          </>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {/* TYPE 1: Reading Text */}
                                  {mat.type === "text" && (
                                    <div
                                      className={`whitespace-pre-wrap text-xs leading-relaxed bg-brand-bg/40 p-4 border border-brand-border/45 rounded-xl ${mat.textStyle === "bold" ? "font-bold text-brand-text" :
                                        mat.textStyle === "italic" ? "italic text-brand-text/95" :
                                          mat.textStyle === "heading" ? "text-base font-extrabold text-brand-cyan border-l-4 border-brand-cyan pl-3 py-1 bg-brand-cyan/5" :
                                            mat.textStyle === "quote" ? "border-l-4 border-brand-border pl-4 italic text-brand-muted bg-brand-bg/20 py-2" :
                                              mat.textStyle === "code" ? "font-mono bg-black/40 border border-brand-border/60 px-3.5 py-2.5 rounded-xl text-green-400 text-[11px]" :
                                                "text-brand-text/95"
                                        }`}
                                      dangerouslySetInnerHTML={{ __html: mat.content }}
                                    />
                                  )}

                                  {/* TYPE 2: Video Link */}
                                  {mat.type === "video" && (
                                    <div className="w-full">
                                      {youtubeEmbedUrl ? (
                                        (() => {
                                          const videoId = getYouTubeVideoId(mat.content);
                                          return videoId ? (
                                            <YouTubeObserver
                                              videoId={videoId}
                                              onWatched={() => markVideoAsWatched(mat.id)}
                                            />
                                          ) : (
                                            <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border shadow-md bg-brand-bg">
                                              <iframe
                                                src={youtubeEmbedUrl}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute top-0 left-0 w-full h-full border-0"
                                              ></iframe>
                                            </div>
                                          );
                                        })()
                                      ) : mat.content.startsWith('yt-search:') ? (
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mat.content.replace('yt-search:', ''))}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/15 via-red-500/5 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text hover:shadow-lg hover:shadow-red-500/10 transition-all group cursor-pointer"
                                        >
                                          <div className="p-3 bg-red-600 rounded-xl group-hover:bg-red-500 transition-colors shrink-0 shadow-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                          </div>
                                          <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-sm font-bold text-brand-text truncate">{mat.title}</span>
                                            <span className="text-[11px] text-red-400/90 font-semibold flex items-center gap-1">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" /></svg>
                                              Watch on YouTube
                                            </span>
                                          </div>
                                        </a>
                                      ) : (
                                        <a
                                          href={mat.content}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-3 p-4 bg-brand-bg/50 border border-brand-border hover:border-brand-cyan rounded-xl text-brand-cyan hover:underline transition-colors"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                          <div className="flex flex-col text-left">
                                            <span className="text-xs font-bold text-brand-text">Watch External Video Link</span>
                                            <span className="text-[10px] text-brand-muted truncate max-w-[340px] mt-0.5">{mat.content}</span>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {/* TYPE 3: Image Reference */}
                                  {mat.type === "image" && (
                                    <div className={`flex w-full ${mat.imageAlign === "left" ? "justify-start" :
                                      mat.imageAlign === "right" ? "justify-end" :
                                        "justify-center"
                                      }`}>
                                      <div className="border border-brand-border/40 bg-brand-bg/25 rounded-xl p-3.5 flex flex-col items-center gap-2 w-full">
                                        <img
                                          src={mat.content}
                                          alt={mat.title}
                                          className="w-full max-w-[800px] h-auto rounded-lg max-h-[600px] shadow-sm object-contain"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* TYPE 4: Document File Attachment */}
                                  {mat.type === "file" && (
                                    <div className="bg-brand-bg/30 border border-brand-border/40 rounded-xl p-4 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 truncate">
                                        <div className="p-2.5 bg-brand-cyan/10 text-brand-cyan rounded-lg border border-brand-cyan/15 shrink-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
                                        </div>
                                        <div className="truncate flex flex-col">
                                          <span className="text-xs font-bold text-brand-text truncate">
                                            {mat.fileName || "Download Material"}
                                          </span>
                                          <span className="text-[10px] text-brand-muted font-mono mt-0.5">
                                            {mat.fileSize || "Size Unknown"} • Document File
                                          </span>
                                        </div>
                                      </div>
                                      <a
                                        href={mat.content}
                                        download={mat.fileName || "document"}
                                        className="px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {selectedTopic && !isInteractiveTopic(selectedTopic.id) && !isSimulationTopic(selectedTopic.id) && activeMaterials.length > 0 && (
                        (() => {
                          const videoMaterial = getTopicVideoMaterial(selectedTopic);
                          const isVideoWatched = videoMaterial ? watchedVideos[videoMaterial.id] === true : true;
                          const isTopicCompleted = completedTopics[selectedTopic.id] === true;

                          return (
                            <div className="mt-8 pt-6 border-t border-brand-border/40">
                              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-brand-bg/30 border-brand-border/40">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <span className="text-xs font-bold text-brand-text">Overall Topic Completion</span>
                                  <span className="text-[11px] text-brand-muted">
                                    {!isVideoWatched
                                      ? "⚠️ Video lesson must be watched in full before marking this topic as completed."
                                      : "Mark this entire topic as completed to save your progress."}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleTopicCompletion(selectedTopic.id)}
                                    disabled={!isVideoWatched}
                                    className={`px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 select-none ${isTopicCompleted
                                      ? "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                                      : !isVideoWatched
                                        ? "bg-brand-muted/20 text-brand-muted/50 border border-brand-border/40 cursor-not-allowed"
                                        : "bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg cursor-pointer"
                                      }`}
                                  >
                                    {isTopicCompleted ? (
                                      <span className="flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        Topic Completed
                                      </span>
                                    ) : (
                                      "Mark Completed"
                                    )}
                                  </button>

                                  {isTopicCompleted && (
                                    <button
                                      onClick={handleSelectNextTopic}
                                      className="px-4 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg hover:shadow-md hover:shadow-brand-cyan/20 transition-all font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>Next Topic</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </>
                  )}
                </>
              )}

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
    </div>
  );
}
