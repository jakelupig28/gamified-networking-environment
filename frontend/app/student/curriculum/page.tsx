"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

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

interface InteractiveSubnettingActivityProps {
  onComplete: () => void;
  isCompleted: boolean;
  handleSelectNextTopic: () => void;
  moduleId: number;
}

function InteractiveSubnettingActivity({ onComplete, isCompleted, handleSelectNextTopic, moduleId }: InteractiveSubnettingActivityProps) {
  const [activeTab, setActiveTab] = useState<"vlsm" | "anding" | "ipv6">("vlsm");

  // Task 1: VLSM States
  const [vlsmPrefixes, setVlsmPrefixes] = useState<Record<string, string>>({
    Sales: "",
    IT: "",
    HR: "",
    WAN: "",
  });

  const [vlsmNetworks, setVlsmNetworks] = useState<Record<string, string>>({
    Sales: "",
    IT: "",
    HR: "",
    WAN: "",
  });

  const vlsmCorrectPrefixes: Record<string, string> = {
    Sales: "/25",
    IT: "/26",
    HR: "/27",
    WAN: "/30",
  };

  const vlsmCorrectNetworks: Record<string, string> = {
    Sales: "192.168.10.0",
    IT: "192.168.10.128",
    HR: "192.168.10.192",
    WAN: "192.168.10.224",
  };

  const isVlsmCorrect =
    Object.keys(vlsmCorrectPrefixes).every(k => vlsmPrefixes[k] === vlsmCorrectPrefixes[k]) &&
    Object.keys(vlsmCorrectNetworks).every(k => vlsmNetworks[k] === vlsmCorrectNetworks[k]);

  // Task 2: Bitwise ANDing States
  const [andingBits, setAndingBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [andingDecimalResult, setAndingDecimalResult] = useState<string>("");

  const toggleAndingBit = (idx: number) => {
    setAndingBits(prev => {
      const copy = [...prev];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return copy;
    });
  };

  const correctAndingBits = [0, 1, 0, 0, 0, 0, 0, 0];
  const correctAndingDecimal = "64";

  const isAndingCorrect =
    andingBits.every((b, idx) => b === correctAndingBits[idx]) &&
    andingDecimalResult.trim() === correctAndingDecimal;

  // Task 3: IPv6 Address Anatomy States
  const [ipv6Prefix, setIpv6Prefix] = useState<string>("");
  const [ipv6Subnet, setIpv6Subnet] = useState<string>("");
  const [ipv6Interface, setIpv6Interface] = useState<string>("");

  const isIpv6Correct =
    ipv6Prefix === "2001:0db8:acad" &&
    ipv6Subnet === "0001" &&
    ipv6Interface === "0000:0000:0000:0001";

  // Score states
  const [vlsmScore, setVlsmScore] = useState<number | null>(null);
  const [andingScore, setAndingScore] = useState<number | null>(null);
  const [ipv6Score, setIpv6Score] = useState<number | null>(null);

  // Load scores
  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "Student";
    const key = `interactive_scores_${savedName}_${moduleId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.vlsm !== undefined) setVlsmScore(parsed.vlsm);
        if (parsed.anding !== undefined) setAndingScore(parsed.anding);
        if (parsed.ipv6 !== undefined) setIpv6Score(parsed.ipv6);
      } catch (e) {
        console.error(e);
      }
    }
  }, [moduleId]);

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

    // Save to server
    const email = localStorage.getItem("userEmail") || "";
    if (email) {
      try {
        const userRes = await fetch("/api/users");
        const userData = await userRes.json();
        if (userData.success) {
          const profile = userData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (profile) {
            const updatedInteractiveScores = {
              ...(profile.interactiveScores || {}),
              [moduleId]: {
                ...(profile.interactiveScores?.[moduleId] || {}),
                [taskKey]: score
              }
            };
            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                interactiveScores: updatedInteractiveScores
              })
            });
          }
        }
      } catch (e) {
        console.error("Error saving interactive scores to server:", e);
      }
    }
  };

  const handleSubmitVlsm = () => {
    let score = 0;
    if (vlsmPrefixes.Sales === "/25") score += 1;
    if (vlsmNetworks.Sales === "192.168.10.0") score += 1;
    if (vlsmPrefixes.IT === "/26") score += 1;
    if (vlsmNetworks.IT === "192.168.10.128") score += 1;
    if (vlsmPrefixes.HR === "/27") score += 1;
    if (vlsmNetworks.HR === "192.168.10.192") score += 1;
    if (vlsmPrefixes.WAN === "/30") score += 1;
    if (vlsmNetworks.WAN === "192.168.10.224") score += 1;

    setVlsmScore(score);
    saveScore("vlsm", score);
  };

  const handleSubmitAnding = () => {
    let score = 0;
    andingBits.forEach((b, idx) => {
      if (b === correctAndingBits[idx]) score += 1;
    });
    if (andingDecimalResult.trim() === correctAndingDecimal) score += 1;

    setAndingScore(score);
    saveScore("anding", score);
  };

  const handleSubmitIpv6 = () => {
    let score = 0;
    if (ipv6Prefix === "2001:0db8:acad") score += 1;
    if (ipv6Subnet === "0001") score += 1;
    if (ipv6Interface === "0000:0000:0000:0001") score += 1;

    setIpv6Score(score);
    saveScore("ipv6", score);
  };

  // Auto-complete course topic once all sub-tasks are submitted
  useEffect(() => {
    if (vlsmScore !== null && andingScore !== null && ipv6Score !== null) {
      onComplete();
    }
  }, [vlsmScore, andingScore, ipv6Score]);

  return (
    <div className="flex-grow flex flex-col gap-6 select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}>
      {/* Tabs */}
      <div className="flex border-b border-brand-border/40">
        <button
          onClick={() => setActiveTab("vlsm")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === "vlsm"
            ? "border-brand-cyan text-brand-cyan"
            : "border-transparent text-brand-muted hover:text-brand-text"
            }`}
        >
          Task 1: VLSM Design {vlsmScore !== null ? `(${vlsmScore}/8) ✓` : ""}
        </button>
        <button
          onClick={() => setActiveTab("anding")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === "anding"
            ? "border-brand-cyan text-brand-cyan"
            : "border-transparent text-brand-muted hover:text-brand-text"
            }`}
        >
          Task 2: Bitwise ANDing {andingScore !== null ? `(${andingScore}/9) ✓` : ""}
        </button>
        <button
          onClick={() => setActiveTab("ipv6")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === "ipv6"
            ? "border-brand-cyan text-brand-cyan"
            : "border-transparent text-brand-muted hover:text-brand-text"
            }`}
        >
          Task 3: IPv6 Address Anatomy {ipv6Score !== null ? `(${ipv6Score}/3) ✓` : ""}
        </button>
      </div>

      {/* Task 1: VLSM Address Planning */}
      {activeTab === "vlsm" && (
        <div className="flex flex-col gap-4">
          <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
            <h3 className="font-bold text-sm text-brand-cyan mb-1">VLSM Design Exercise</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Your company has been allocated the base network block <strong className="text-brand-text">192.168.10.0/24</strong>. You need to assign the appropriate CIDR prefix mask and Network Address to each department to satisfy their host requirements while minimizing wastage.
              <br />
              <strong className="text-brand-text">Golden Rule:</strong> Always assign addresses to the largest subnet requirements first, then work your way down!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form */}
            <div className="flex flex-col gap-3">
              {["Sales", "IT", "HR", "WAN"].map((dept) => {
                const reqs: Record<string, string> = {
                  Sales: "120 hosts",
                  IT: "50 hosts",
                  HR: "25 hosts",
                  WAN: "2 hosts",
                };
                return (
                  <div key={dept} className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-text">{dept} Department</span>
                      <span className="text-[10px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded font-bold font-mono">
                        Requires {reqs[dept]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Prefix Select */}
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-brand-muted block mb-1 font-bold">Subnet Mask Prefix</label>
                        <select
                          value={vlsmPrefixes[dept]}
                          onChange={(e) => setVlsmPrefixes(prev => ({ ...prev, [dept]: e.target.value }))}
                          className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2.5 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
                        >
                          <option value="">Select Prefix...</option>
                          <option value="/25">/25 (128 addresses)</option>
                          <option value="/26">/26 (64 addresses)</option>
                          <option value="/27">/27 (32 addresses)</option>
                          <option value="/30">/30 (4 addresses)</option>
                        </select>
                      </div>

                      {/* Network Select */}
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-brand-muted block mb-1 font-bold">Network Address</label>
                        <select
                          value={vlsmNetworks[dept]}
                          onChange={(e) => setVlsmNetworks(prev => ({ ...prev, [dept]: e.target.value }))}
                          className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2.5 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
                        >
                          <option value="">Select Address...</option>
                          <option value="192.168.10.0">192.168.10.0</option>
                          <option value="192.168.10.128">192.168.10.128</option>
                          <option value="192.168.10.192">192.168.10.192</option>
                          <option value="192.168.10.224">192.168.10.224</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Validation Panel */}
            <div className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-5 flex flex-col gap-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-muted">Design Validation Checklist</h4>
              <div className="flex flex-col gap-3">
                {["Sales", "IT", "HR", "WAN"].map((dept) => {
                  const prefixCorrect = vlsmPrefixes[dept] === vlsmCorrectPrefixes[dept];
                  const networkCorrect = vlsmNetworks[dept] === vlsmCorrectNetworks[dept];

                  return (
                    <div key={dept} className="flex flex-col gap-1 border-b border-brand-border/10 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center text-xs font-bold text-brand-text">
                        <span>{dept} Department</span>
                        {prefixCorrect && networkCorrect ? (
                          <span className="text-green-400 font-bold">✓ Validated</span>
                        ) : (
                          <span className="text-brand-muted font-normal text-[10px]">Pending validation</span>
                        )}
                      </div>
                      <div className="flex gap-4 text-[10px] mt-1">
                        <span className={prefixCorrect ? "text-green-400" : "text-brand-muted"}>
                          {prefixCorrect ? `Prefix: ${vlsmPrefixes[dept]} (Correct)` : "Prefix: Unmatched"}
                        </span>
                        <span className={networkCorrect ? "text-green-400" : "text-brand-muted"}>
                          {networkCorrect ? `Network: ${vlsmNetworks[dept]} (Correct)` : "Network Address: Unmatched"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isVlsmCorrect ? (
                <div className="mt-auto bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-xs font-bold">
                  🎉 Task 1 Configurations Valid! Click Submit below to record your grade.
                </div>
              ) : (
                <div className="mt-auto bg-brand-bg/50 border border-brand-border/40 text-brand-muted p-4 rounded-xl text-center text-xs">
                  Match the prefix sizes and network boundaries correctly based on the VLSM Golden Rule.
                </div>
              )}
              <button
                onClick={handleSubmitVlsm}
                disabled={Object.values(vlsmPrefixes).some(v => !v) || Object.values(vlsmNetworks).some(v => !v)}
                className="w-full mt-3 px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shrink-0"
              >
                {vlsmScore !== null ? "Resubmit Task 1" : "Submit Task 1"}
              </button>
              {vlsmScore !== null && (
                <div className="bg-brand-cyan/15 border border-brand-cyan/25 px-4 py-2.5 rounded-xl flex items-center justify-between mt-2 animate-scaleIn">
                  <div className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Recorded Score</div>
                  <div className="text-sm font-mono font-extrabold text-brand-cyan">{vlsmScore} / 8</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task 2: Bitwise ANDing */}
      {activeTab === "anding" && (
        <div className="flex flex-col gap-4">
          <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
            <h3 className="font-bold text-sm text-brand-cyan mb-1">Bitwise ANDing Operations</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              When a router processes a packet, it extracts the Network ID using bitwise ANDing.
              <br />
              <strong>Exercise:</strong> Perform the AND operation on the last octet for a packet destined to <strong className="text-brand-text">192.168.1.75</strong> with a mask of <strong className="text-brand-text">255.255.255.192 (/26)</strong>.
              <br />
              Toggle the bits in the output row to calculate the result of the bitwise AND, and enter the final Network ID in decimal.
            </p>
          </div>

          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="grid grid-cols-10 items-center gap-2 font-mono text-center text-xs md:text-sm">
              {/* Header */}
              <div className="col-span-2 text-left font-sans font-bold text-brand-muted text-xs">Octet Rows</div>
              {[128, 64, 32, 16, 8, 4, 2, 1].map(v => (
                <div key={v} className="text-[10px] text-brand-muted font-bold">{v}</div>
              ))}

              {/* Row 1: Destination IP octet 75 */}
              <div className="col-span-2 text-left font-sans font-bold text-brand-text">IP (75)</div>
              {[0, 1, 0, 0, 1, 0, 1, 1].map((b, idx) => (
                <div key={idx} className="bg-brand-bg border border-brand-border/40 p-2 rounded-lg text-brand-text/80">{b}</div>
              ))}

              {/* Row 2: Subnet Mask octet 192 */}
              <div className="col-span-2 text-left font-sans font-bold text-brand-text">Mask (192)</div>
              {[1, 1, 0, 0, 0, 0, 0, 0].map((b, idx) => (
                <div key={idx} className="bg-brand-bg border border-brand-border/40 p-2 rounded-lg text-brand-text/80">{b}</div>
              ))}

              {/* Operator */}
              <div className="col-span-10 border-t border-dashed border-brand-border/40 my-1"></div>

              {/* Row 3: Output AND (Interactive) */}
              <div className="col-span-2 text-left font-sans font-bold text-brand-cyan flex items-center gap-1">
                <span>Result (AND)</span>
              </div>
              {andingBits.map((b, idx) => {
                return (
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
                );
              })}
            </div>

            {/* Decimal Input */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-brand-border/20 pt-6 mt-2">
              <div className="flex-grow">
                <label className="text-xs font-bold text-brand-text block mb-1">Resulting Network ID Address</label>
                <p className="text-[10px] text-brand-muted">
                  Type the X value for the Network ID `192.168.1.X`, where X is the decimal conversion of your AND bits.
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <span className="font-mono text-sm text-brand-text select-none">192.168.1.</span>
                <input
                  type="text"
                  value={andingDecimalResult}
                  onChange={(e) => setAndingDecimalResult(e.target.value)}
                  placeholder="X"
                  className="w-20 bg-brand-card border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-lg px-3 py-2 text-center text-sm font-mono text-brand-cyan font-bold"
                />
              </div>
            </div>

            {isAndingCorrect ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-xs font-bold mt-2">
                🎉 Correct configuration! Click Submit below to record your grade.
              </div>
            ) : (
              <div className="bg-brand-bg/30 border border-brand-border/30 text-brand-muted p-4 rounded-xl text-center text-xs mt-2">
                Perform AND on each vertical pair: 1 AND 1 = 1, any other combination = 0. Then calculate the decimal sum of the output bits.
              </div>
            )}
            <button
              onClick={handleSubmitAnding}
              disabled={!andingDecimalResult.trim()}
              className="w-full mt-4 px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shrink-0"
            >
              {andingScore !== null ? "Resubmit Task 2" : "Submit Task 2"}
            </button>
            {andingScore !== null && (
              <div className="bg-brand-cyan/15 border border-brand-cyan/25 px-4 py-2.5 rounded-xl flex items-center justify-between mt-2 animate-scaleIn">
                <div className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Recorded Score</div>
                <div className="text-sm font-mono font-extrabold text-brand-cyan">{andingScore} / 9</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task 3: IPv6 Address Anatomy */}
      {activeTab === "ipv6" && (
        <div className="flex flex-col gap-4">
          <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
            <h3 className="font-bold text-sm text-brand-cyan mb-1">IPv6 Address Structure Matching</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              IPv6 uses 128-bit addresses standardizing on a /64 local subnet boundary.
              <br />
              <strong>Exercise:</strong> Map each segment of the address <strong className="text-brand-text">2001:0db8:acad : 0001 : 0000:0000:0000:0001</strong> to its correct architectural label.
            </p>
          </div>

          <div className="bg-brand-bg/20 border border-brand-border/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="flex flex-col gap-4 items-center">
              {/* Address segments visual display */}
              <div className="flex flex-wrap gap-2 text-xs md:text-sm font-mono font-bold text-center">
                <div className={`px-3 py-2 rounded-lg border ${ipv6Prefix === "2001:0db8:acad" ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan" : "bg-brand-card border-brand-border/40 text-brand-text"}`}>
                  2001:0db8:acad
                </div>
                <span className="self-center text-brand-muted font-sans">:</span>
                <div className={`px-3 py-2 rounded-lg border ${ipv6Subnet === "0001" ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan" : "bg-brand-card border-brand-border/40 text-brand-text"}`}>
                  0001
                </div>
                <span className="self-center text-brand-muted font-sans">:</span>
                <div className={`px-3 py-2 rounded-lg border ${ipv6Interface === "0000:0000:0000:0001" ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan" : "bg-brand-card border-brand-border/40 text-brand-text"}`}>
                  0000:0000:0000:0001
                </div>
              </div>

              {/* Mappers */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Prefix Mapper */}
                <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Global Routing Prefix</span>
                  <select
                    value={ipv6Prefix}
                    onChange={(e) => setIpv6Prefix(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
                  >
                    <option value="">Select Segment...</option>
                    <option value="2001:0db8:acad">2001:0db8:acad</option>
                    <option value="0001">0001</option>
                    <option value="0000:0000:0000:0001">0000:0000:0000:0001</option>
                  </select>
                </div>

                {/* Subnet ID Mapper */}
                <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Subnet ID (16 bits)</span>
                  <select
                    value={ipv6Subnet}
                    onChange={(e) => setIpv6Subnet(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
                  >
                    <option value="">Select Segment...</option>
                    <option value="2001:0db8:acad">2001:0db8:acad</option>
                    <option value="0001">0001</option>
                    <option value="0000:0000:0000:0001">0000:0000:0000:0001</option>
                  </select>
                </div>

                {/* Interface ID Mapper */}
                <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Interface ID (64 bits)</span>
                  <select
                    value={ipv6Interface}
                    onChange={(e) => setIpv6Interface(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
                  >
                    <option value="">Select Segment...</option>
                    <option value="2001:0db8:acad">2001:0db8:acad</option>
                    <option value="0001">0001</option>
                    <option value="0000:0000:0000:0001">0000:0000:0000:0001</option>
                  </select>
                </div>
              </div>
            </div>

            {isIpv6Correct ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-xs font-bold mt-2">
                🎉 Correct configuration! Click Submit below to record your grade.
              </div>
            ) : (
              <div className="bg-brand-bg/30 border border-brand-border/30 text-brand-muted p-4 rounded-xl text-center text-xs mt-2">
                Map each block: Global prefix represents network identifier (first 3 blocks), subnet ID represents routing division (4th block), Interface ID is device address (last 4 blocks).
              </div>
            )}
            <button
              onClick={handleSubmitIpv6}
              disabled={!ipv6Prefix || !ipv6Subnet || !ipv6Interface}
              className="w-full mt-4 px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shrink-0"
            >
              {ipv6Score !== null ? "Resubmit Task 3" : "Submit Task 3"}
            </button>
            {ipv6Score !== null && (
              <div className="bg-brand-cyan/15 border border-brand-cyan/25 px-4 py-2.5 rounded-xl flex items-center justify-between mt-2 animate-scaleIn">
                <div className="text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Recorded Score</div>
                <div className="text-sm font-mono font-extrabold text-brand-cyan">{ipv6Score} / 3</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isCompleted || (vlsmScore !== null && andingScore !== null && ipv6Score !== null) ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 animate-scaleIn">
          <div>
            <h3 className="font-bold text-sm text-green-400 flex items-center gap-1.5">
              🎉 Interactive Activity Completed!
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Excellent job! You successfully submitted and auto-graded all three subnetting tasks.
            </p>
            <div className="mt-2 text-xs text-brand-text flex items-center gap-2">
              <span className="text-[10px] bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded font-mono font-bold">
                Overall Grade: {(vlsmScore || 0) + (andingScore || 0) + (ipv6Score || 0)} / 20
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
          Submit all 3 tasks (VLSM, ANDing, and IPv6 Structure) to finish this activity and record your overall grade.
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
          topic.subtopics.forEach((sub) => {
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

      const previewTopics = getPreviewTopics(mod.topics);
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
  }, [selectedTopic, selectedSubtopic, selectedModuleId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!selectedTopic || isModuleOverviewActive || selectedTopic.id === 999999) return;
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
    if (topic.id === 999999) return 0;
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

  const submitPretest = (moduleId: number, pretest: PretestQuestion[]) => {
    let score = 0;
    pretest.forEach((q, idx) => {
      if (pretestAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    setPretestScore(score);
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...completedPretests, [moduleId]: true };
    setCompletedPretests(updated);
    localStorage.setItem(`completed_pretests_${savedName}`, JSON.stringify(updated));

    const updatedScores = { ...pretestScores, [moduleId]: score };
    setPretestScores(updatedScores);
    localStorage.setItem(`pretest_scores_${savedName}`, JSON.stringify(updatedScores));

    saveProgressToServer({
      completedPretests: updated,
      pretestScores: updatedScores
    });
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

  const ensureInteractiveActivity = (mods: Module[]): Module[] => {
    if (mods.length === 0) return mods;
    return mods.map((mod, idx) => {
      if (idx === 0) {
        const baseTopics = mod.topics.filter(t => t.id !== 888888 && t.id !== 999999);
        return {
          ...mod,
          topics: [
            ...baseTopics,
            {
              id: 888888,
              title: "Module Discussion Forum",
              materials: [
                {
                  id: 8888881,
                  type: "text",
                  title: "Discussion Feed",
                  content: "module-discussion-placeholder"
                }
              ],
              subtopics: []
            },
            {
              id: 999999,
              title: "Interactive Subnetting Activity",
              materials: [
                {
                  id: 9999991,
                  type: "text",
                  title: "Hands-on Exercises",
                  content: "interactive-activity-placeholder"
                }
              ],
              subtopics: []
            }
          ]
        };
      }
      return mod;
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
    if (!moduleChatScrollRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = moduleChatScrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (!completedTopics[888888]) {
        toggleTopicCompletion(888888);
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
    if (selectedTopic?.id === 888888 && selectedModuleId) {
      fetchModuleDiscussionPosts(selectedModuleId);
    }
  }, [selectedTopic, selectedModuleId]);

  // Handle auto-complete for short discussions with no scrollbar
  useEffect(() => {
    if (selectedTopic?.id === 888888 && moduleDiscussionPosts.length > 0) {
      setTimeout(() => {
        if (moduleChatScrollRef.current) {
          const { scrollTop, clientHeight, scrollHeight } = moduleChatScrollRef.current;
          if (scrollHeight <= clientHeight + 10) {
            if (!completedTopics[888888]) {
              toggleTopicCompletion(888888);
            }
          }
        }
      }, 350);
    }
  }, [moduleDiscussionPosts, selectedTopic]);

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
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedSpecialItem === "announcements"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <span>📢</span>
                        <span>Announcements</span>
                      </button>

                      {/* Self-introduction */}
                      <button
                        onClick={() => {
                          setSelectedSpecialItem("self-introduction");
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedModuleId(null);
                          setTakingPretest(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedSpecialItem === "self-introduction"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <span>👋</span>
                        <span>Self-introduction</span>
                      </button>

                      {/* Subject Guide */}
                      <button
                        onClick={() => {
                          setSelectedSpecialItem("subject-guide");
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedModuleId(null);
                          setTakingPretest(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedSpecialItem === "subject-guide"
                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                          }`}
                      >
                        <span>📄</span>
                        <span>[MUST READ] Subject Guide</span>
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
                          {mod.pretest && mod.pretest.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedModuleId(mod.id);
                                setSelectedTopic(null);
                                setSelectedSubtopic(null);
                                setSelectedSpecialItem(null);
                                setTakingPretest(true);
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                takingPretest && selectedModuleId === mod.id && selectedTopic === null
                                  ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                  : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm font-bold min-w-0 flex-grow whitespace-normal break-words leading-tight">
                                {completedPretests && completedPretests[mod.id] ? (
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
                            </button>
                          )}

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
                                      {topic.subtopics!.map((sub) => {
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
                  ) : (
                    // Quiz questions form
                    <div className="flex-grow flex flex-col gap-6">
                      <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-4">
                        <p className="text-xs text-brand-muted leading-relaxed">
                          This pre-test contains <strong>{selectedModule.pretest.length} multiple-choice questions</strong> designed to evaluate your current knowledge level on this topic. Please answer all questions and submit. Your score will be saved, and the first topic will unlock immediately.
                        </p>
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

                            const hasVideo = materialsList.some(m => m.type === "video") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "video");
                            const hasText = materialsList.some(m => m.type === "text") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "text");
                            const hasFile = materialsList.some(m => m.type === "file") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "file");
                            const hasImage = materialsList.some(m => m.type === "image") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "image");

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
                        {selectedTopic!.id === 999999 ? (
                          <InteractiveSubnettingActivity
                            onComplete={() => {
                              if (!completedTopics[999999]) {
                                toggleTopicCompletion(999999);
                              }
                            }}
                            isCompleted={completedTopics[999999] === true}
                            handleSelectNextTopic={handleSelectNextTopic}
                            moduleId={selectedModule!.id}
                          />
                        ) : selectedTopic!.id === 888888 ? (
                          // MODULE DISCUSSION FORUM VIEW
                          <div className="flex-grow flex flex-col h-full animate-scaleIn">
                            <p className="text-brand-muted text-xs mb-3">
                              Ask questions, share subnetting tips, and collaborate on this module's topics.
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
                              {completedTopics[888888] ? (
                                <div className="bg-green-500/10 border border-green-500/25 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-scaleIn">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  <span>Module discussion completed. You are now cleared to start the <strong>Interactive Subnetting Activity</strong>!</span>
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

                      {selectedTopic && selectedTopic.id !== 999999 && activeMaterials.length > 0 && (
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
    </div>
  );
}
