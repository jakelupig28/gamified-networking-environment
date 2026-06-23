"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

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
  const saveScore = (taskKey: string, score: number) => {
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
    <div className="flex-grow flex flex-col gap-6 select-none animate-fadeIn" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}>
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
                    className="w-full bg-brand-card border border-brand-border/40 text-xs text-brand-text px-2 py-2 rounded-lg focus:outline-none focus:border-brand-cyan/70 cursor-pointer"
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

const DEFAULT_MODULES: Module[] = [];

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
// Helper to filter out References topics in Student Preview
const getPreviewTopics = (topicsList: Topic[]): Topic[] => {
  return (topicsList || []).filter(t => {
    const titleUpper = t.title.toUpperCase().trim();
    return titleUpper !== 'REFERENCES' && titleUpper !== 'BIBLIOGRAPHY' && !/^REFERENCE\b/.test(titleUpper);
  });
};

export default function ProfessorModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drag and Drop state for modules
  const [draggedModuleId, setDraggedModuleId] = useState<number | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<number | null>(null);
  
  // Search and selection
  const [searchTerm, setSearchTerm] = useState("");
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);

  // Student Preview States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null);
  const [previewSubtopic, setPreviewSubtopic] = useState<Subtopic | null>(null);
  const [previewSpecialItem, setPreviewSpecialItem] = useState<"announcements" | "self-introduction" | "subject-guide" | "pretest" | null>(null);
  const [previewExpandedTopics, setPreviewExpandedTopics] = useState<Record<number, boolean>>({});
  const [expandedSubjectOverview, setExpandedSubjectOverview] = useState(true);
  const [previewExpandedModules, setPreviewExpandedModules] = useState<Record<number, boolean>>({});

  // Simulated Interactive preview comments/forum states
  const [previewSelfIntroPosts, setPreviewSelfIntroPosts] = useState<any[]>([
    {
      id: 1,
      name: "Alex Mercer",
      message: "Hey everyone! Excited to learn about subnetting in this class. BSIT 3rd Year here.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 2,
      name: "Sophia Rodriguez",
      message: "Hi class! Looking forward to the hands-on lab activities.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  ]);
  const [previewSelfIntroMsg, setPreviewSelfIntroMsg] = useState("");

  const [previewForumPosts, setPreviewForumPosts] = useState<any[]>([
    {
      id: 1,
      name: "Alex Mercer",
      role: "Student",
      message: "Can someone explain why the network boundary for a /26 mask is 64? I'm trying to do Task 2.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      name: "Prof. Jake (Simulated)",
      role: "Professor",
      message: "Hi Alex! A /26 mask has 26 network bits, meaning the last octet has 2 subnet bits (128 + 64 = 192). This splits the last octet into sizes of 64. So the boundaries are at multiples of 64: 0, 64, 128, 192.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]);
  const [previewForumMsg, setPreviewForumMsg] = useState("");

  // Input states for creation
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [subtopicTitles, setSubtopicTitles] = useState<Record<number, string>>({});

  // Adding materials state
  const [addingMaterialTo, setAddingMaterialTo] = useState<{
    type: "topic" | "subtopic";
    topicId: number;
    subtopicId?: number;
    materialType: MaterialType;
  } | null>(null);

  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");
  const [matFileName, setMatFileName] = useState("");
  const [matFileSize, setMatFileSize] = useState("");
  const [matTextStyle, setMatTextStyle] = useState<"normal" | "bold" | "italic" | "heading" | "quote" | "code">("normal");
  const [matImageAlign, setMatImageAlign] = useState<"left" | "center" | "right">("center");

  // Editing states
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");

  const [editingSubtopicId, setEditingSubtopicId] = useState<number | null>(null);
  const [editingSubtopicTitle, setEditingSubtopicTitle] = useState("");

  // Editing material states
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingMaterialTitle, setEditingMaterialTitle] = useState("");
  const [editingMaterialContent, setEditingMaterialContent] = useState("");
  const [editingMaterialTextStyle, setEditingMaterialTextStyle] = useState<"normal" | "bold" | "italic" | "heading" | "quote" | "code">("normal");
  const [editingMaterialImageAlign, setEditingMaterialImageAlign] = useState<"left" | "center" | "right">("center");
  const [editingMaterialFileName, setEditingMaterialFileName] = useState("");
  const [editingMaterialFileSize, setEditingMaterialFileSize] = useState("");
  const [editingMaterialType, setEditingMaterialType] = useState<MaterialType>("text");

  // Drag and drop material states
  const [draggedMatInfo, setDraggedMatInfo] = useState<{ topicId: number; subtopicId?: number; index: number } | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ topicId: number; subtopicId?: number; index: number } | null>(null);

  // Rich text visual editor state
  const [isVisualMode, setIsVisualMode] = useState(true);

  // Editing topic/subtopic video states
  const [editingTopicVideoUrl, setEditingTopicVideoUrl] = useState("");
  const [editingSubtopicVideoUrl, setEditingSubtopicVideoUrl] = useState("");

  // Collapsible topics state
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<number, boolean>>({});

  // Import from file states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedModule, setParsedModule] = useState<Module | null>(null);
  const [importError, setImportError] = useState("");

  // Pre-test states
  const [pastedPretestText, setPastedPretestText] = useState("");
  const [isPastingPretest, setIsPastingPretest] = useState(false);
  const [isPretestLoading, setIsPretestLoading] = useState(false);

  // Custom modal dialog states
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  // Initial load
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        const data = await res.json();
        if (data.success && data.modules) {
          const processed = ensureInteractiveActivity(data.modules);
          setModules(processed);
          if (processed.length > 0) {
            setCurrentModuleId(processed[0].id);
          }
          try {
            localStorage.setItem("professor_course_modules", JSON.stringify(processed));
          } catch (err) {
            console.warn("Storage quota exceeded, could not write to localStorage:", err);
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
          const parsed = JSON.parse(stored);
          const processed = ensureInteractiveActivity(parsed);
          setModules(processed);
          if (processed.length > 0) {
            setCurrentModuleId(processed[0].id);
          }
        } catch (e) {
          setModules(DEFAULT_MODULES);
          setCurrentModuleId(DEFAULT_MODULES[0]?.id || null);
        }
      } else {
        setModules(DEFAULT_MODULES);
        try {
          localStorage.setItem("professor_course_modules", JSON.stringify(DEFAULT_MODULES));
        } catch (err) {
          console.warn("Storage quota exceeded, could not write to localStorage:", err);
        }
        setCurrentModuleId(DEFAULT_MODULES[0]?.id || null);
      }
    };

    fetchModules();
  }, []);

  // Sync selected topic/subtopic for Student Preview mode when enabled
  useEffect(() => {
    if (isPreviewMode && currentModuleId) {
      const activeModule = modules.find(m => m.id === currentModuleId);
      if (activeModule) {
        const previewableTopics = getPreviewTopics(activeModule.topics);
        if (previewableTopics.length > 0) {
          setPreviewTopic(previewableTopics[0]);
        } else {
          setPreviewTopic(null);
        }
        setPreviewSubtopic(null);
        setPreviewSpecialItem(null);
      } else {
        setPreviewTopic(null);
        setPreviewSubtopic(null);
        setPreviewSpecialItem(null);
      }
    }
  }, [isPreviewMode, currentModuleId, modules]);

  // Drag & drop drop handler for modules
  const handleDropModule = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedModuleId === null || draggedModuleId === targetId) return;

    const draggedIdx = modules.findIndex(m => m.id === draggedModuleId);
    const targetIdx = modules.findIndex(m => m.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const updated = [...modules];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    setDraggedModuleId(null);
    setDragOverModuleId(null);
    await updateAndPersistModules(updated);
  };

  // Helper to persist modules state
  const updateAndPersistModules = async (updated: Module[]) => {
    setModules(updated);
    try {
      localStorage.setItem("professor_course_modules", JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage quota exceeded, could not write to localStorage:", err);
    }

    const strippedForBackend = updated.map((mod, idx) => {
      if (idx === 0) {
        return {
          ...mod,
          topics: mod.topics.filter(t => t.id !== 888888 && t.id !== 999999)
        };
      }
      return mod;
    });

    try {
      await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: strippedForBackend })
      });
    } catch (error) {
      console.error("Error saving modules via API:", error);
    }
  };

  // Helper to parse YouTube embed URLs
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  // --- Module Handlers ---
  const createModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: Module = {
      id: Date.now(),
      title: newModuleTitle.trim(),
      topics: []
    };
    const updated = [newModule, ...modules];
    updateAndPersistModules(updated);
    setNewModuleTitle("");
    setCurrentModuleId(newModule.id);
  };

  const handlePretestUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPretestLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pretest/import", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success && data.questions) {
        await savePretestQuestions(moduleId, data.questions);
      } else {
        showAlert("Parse Failed", data.message || "Failed to scan pre-test questions.");
      }
    } catch (error: any) {
      console.error("Error uploading pretest:", error);
      showAlert("Upload Error", "Error parsing pre-test: " + error.message);
    } finally {
      setIsPretestLoading(false);
      e.target.value = "";
    }
  };

  const handlePretestTextSubmit = async (moduleId: number) => {
    if (!pastedPretestText.trim()) return;

    setIsPretestLoading(true);
    try {
      const res = await fetch("/api/pretest/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedPretestText })
      });

      const data = await res.json();
      if (data.success && data.questions) {
        await savePretestQuestions(moduleId, data.questions);
        setPastedPretestText("");
        setIsPastingPretest(false);
      } else {
        showAlert("Parse Failed", data.message || "Failed to parse pasted pre-test text.");
      }
    } catch (error: any) {
      console.error("Error submitting pasted pretest:", error);
      showAlert("Error", "Error parsing pre-test: " + error.message);
    } finally {
      setIsPretestLoading(false);
    }
  };

  const savePretestQuestions = async (moduleId: number, questions: any[]) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      showAlert("Save Failed", "Invalid questions array.");
      return;
    }
    
    try {
      questions.forEach((q: any, index: number) => {
        if (!q.question || typeof q.question !== "string") {
          throw new Error(`Item ${index + 1} is missing a valid 'question' string.`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Item ${index + 1} must have an 'options' array with exactly 4 strings.`);
        }
        q.options.forEach((opt: any, oIdx: number) => {
          if (typeof opt !== "string") {
            throw new Error(`Item ${index + 1} option ${oIdx + 1} must be a string.`);
          }
        });
        if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`Item ${index + 1} 'correctAnswer' must be a number between 0 and 3.`);
        }
      });
    } catch (err: any) {
      showAlert("Validation Error", err.message);
      return;
    }

    const performSave = async () => {
      const updated = modules.map(m =>
        m.id === moduleId ? { ...m, pretest: questions } : m
      );
      await updateAndPersistModules(updated);
      showAlert("Pre-test Saved", "Pre-test saved successfully!");
    };

    await performSave();
  };

  const removePretest = (moduleId: number) => {
    showConfirm(
      "Remove Pre-test",
      "Are you sure you want to remove the pre-test from this module?",
      () => {
        const updated = modules.map(m => {
          if (m.id === moduleId) {
            const { pretest, ...rest } = m;
            return rest as Module;
          }
          return m;
        });
        updateAndPersistModules(updated);
        showAlert("Success", "Pre-test removed successfully.");
      }
    );
  };

  const handleFileImport = async () => {
    if (!importFile) return;
    setIsParsing(true);
    setImportError("");
    setParsedModule(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/modules/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.module) {
        const newMod: Module = {
          id: Date.now(),
          title: data.module.title || importFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          topics: (data.module.topics || []).map((t: any, tIdx: number) => ({
            id: Date.now() + tIdx * 1000 + 1,
            title: t.title || `Topic ${tIdx + 1}`,
            materials: (t.materials || []).map((m: any, mIdx: number) => ({
              id: Date.now() + tIdx * 1000 + mIdx + 100000,
              type: m.type,
              title: m.title,
              content: m.content,
              textStyle: m.textStyle,
              imageAlign: m.imageAlign
            })),
            subtopics: (t.subtopics || []).map((s: any, sIdx: number) => ({
              id: Date.now() + tIdx * 1000 + sIdx + 200000,
              title: s.title || `Subtopic ${sIdx + 1}`,
              materials: (s.materials || []).map((sm: any, smIdx: number) => ({
                id: Date.now() + tIdx * 1000 + sIdx * 100 + smIdx + 300000,
                type: sm.type,
                title: sm.title,
                content: sm.content,
                textStyle: sm.textStyle,
                imageAlign: sm.imageAlign
              }))
            }))
          }))
        };
        setParsedModule(newMod);
      } else {
        setImportError(data.message || "Failed to parse document structure.");
      }
    } catch (err) {
      console.error("File import error:", err);
      setImportError("Error occurred during document scanning. Please retry.");
    } finally {
      setIsParsing(false);
    }
  };

  const confirmImportModule = () => {
    if (!parsedModule) return;
    const updated = [parsedModule, ...modules];
    updateAndPersistModules(updated);
    setCurrentModuleId(parsedModule.id);
    setIsImportModalOpen(false);
    setParsedModule(null);
    setImportFile(null);
  };

  const deleteModule = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Delete Module",
      "Are you sure you want to delete this module and all its topics?",
      () => {
        const updated = modules.filter(m => m.id !== id);
        updateAndPersistModules(updated);
        if (currentModuleId === id) {
          setCurrentModuleId(updated.length > 0 ? updated[0].id : null);
        }
      }
    );
  };

  const startEditModule = (mod: Module, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
  };

  const saveEditModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModuleTitle.trim() || !editingModuleId) return;
    const updated = modules.map(m =>
      m.id === editingModuleId ? { ...m, title: editingModuleTitle.trim() } : m
    );
    updateAndPersistModules(updated);
    setEditingModuleId(null);
  };

  // --- Topic Handlers ---
  const addTopic = (moduleId: number) => {
    if (!newTopicTitle.trim()) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: [
              ...mod.topics,
              { id: Date.now(), title: newTopicTitle.trim(), subtopics: [], materials: [] }
            ]
          }
        : mod
    );
    updateAndPersistModules(updated);
    setNewTopicTitle("");
  };

  const deleteTopic = (moduleId: number, topicId: number) => {
    showConfirm(
      "Delete Topic",
      "Are you sure you want to delete this topic?",
      () => {
        const updated = modules.map(mod =>
          mod.id === moduleId
            ? { ...mod, topics: mod.topics.filter(t => t.id !== topicId) }
            : mod
        );
        updateAndPersistModules(updated);
      }
    );
  };

  const startEditTopic = (topicId: number, title: string) => {
    setEditingTopicId(topicId);
    setEditingTopicTitle(title);
    const topic = selectedModule?.topics.find(t => t.id === topicId);
    const existingVideo = topic?.materials?.find(m => m.type === "video");
    setEditingTopicVideoUrl(existingVideo ? existingVideo.content : "");
  };

  const saveEditTopic = (moduleId: number) => {
    if (!editingTopicTitle.trim() || !editingTopicId) return;
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== editingTopicId) return t;

          let updatedMaterials = [...(t.materials || [])];
          const videoIdx = updatedMaterials.findIndex(m => m.type === "video");
          const newVideoUrl = editingTopicVideoUrl.trim();

          if (newVideoUrl) {
            if (videoIdx >= 0) {
              updatedMaterials[videoIdx] = {
                ...updatedMaterials[videoIdx],
                content: newVideoUrl
              };
            } else {
              updatedMaterials.push({
                id: Date.now() + Math.floor(Math.random() * 1000000),
                type: "video",
                title: "Watch Explanatory Video",
                content: newVideoUrl
              });
            }
          } else {
            if (videoIdx >= 0) {
              updatedMaterials.splice(videoIdx, 1);
            }
          }

          return {
            ...t,
            title: editingTopicTitle.trim(),
            materials: updatedMaterials
          };
        })
      };
    });
    updateAndPersistModules(updated);
    setEditingTopicId(null);
    setEditingTopicVideoUrl("");
  };

  const moveTopic = (moduleId: number, index: number, direction: "up" | "down") => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const list = [...mod.topics];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = modules.map(m =>
      m.id === moduleId ? { ...m, topics: list } : m
    );
    updateAndPersistModules(updated);
  };

  // --- Subtopic Handlers ---
  const addSubtopic = (moduleId: number, topicId: number) => {
    const titleText = subtopicTitles[topicId];
    if (!titleText || !titleText.trim()) return;
    
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: mod.topics.map(t =>
              t.id === topicId
                ? {
                    ...t,
                    subtopics: [
                      ...(t.subtopics || []),
                      { id: Date.now(), title: titleText.trim(), materials: [] }
                    ]
                  }
                : t
            )
          }
        : mod
    );
    updateAndPersistModules(updated);
    setSubtopicTitles(prev => ({ ...prev, [topicId]: "" }));
    
    // Automatically make sure topic is expanded when adding a subtopic
    setExpandedTopics(prev => ({ ...prev, [topicId]: true }));
  };

  const deleteSubtopic = (moduleId: number, topicId: number, subtopicId: number) => {
    showConfirm(
      "Delete Subtopic",
      "Are you sure you want to delete this subtopic?",
      () => {
        const updated = modules.map(mod =>
          mod.id === moduleId
            ? {
                ...mod,
                topics: mod.topics.map(t =>
                  t.id === topicId
                    ? {
                        ...t,
                        subtopics: (t.subtopics || []).filter(s => s.id !== subtopicId)
                      }
                    : t
                )
              }
            : mod
        );
        updateAndPersistModules(updated);
      }
    );
  };

  const startEditSubtopic = (subtopicId: number, title: string) => {
    setEditingSubtopicId(subtopicId);
    setEditingSubtopicTitle(title);
    let existingVideo = "";
    for (const mod of modules) {
      for (const t of mod.topics) {
        const sub = t.subtopics?.find(s => s.id === subtopicId);
        if (sub) {
          const videoMat = sub.materials?.find(m => m.type === "video");
          if (videoMat) existingVideo = videoMat.content;
          break;
        }
      }
    }
    setEditingSubtopicVideoUrl(existingVideo);
  };

  const saveEditSubtopic = (moduleId: number, topicId: number) => {
    if (!editingSubtopicTitle.trim() || !editingSubtopicId) return;
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;
          return {
            ...t,
            subtopics: (t.subtopics || []).map(s => {
              if (s.id !== editingSubtopicId) return s;

              let updatedMaterials = [...(s.materials || [])];
              const videoIdx = updatedMaterials.findIndex(m => m.type === "video");
              const newVideoUrl = editingSubtopicVideoUrl.trim();

              if (newVideoUrl) {
                if (videoIdx >= 0) {
                  updatedMaterials[videoIdx] = {
                    ...updatedMaterials[videoIdx],
                    content: newVideoUrl
                  };
                } else {
                  updatedMaterials.push({
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    type: "video",
                    title: "Watch Explanatory Video",
                    content: newVideoUrl
                  });
                }
              } else {
                if (videoIdx >= 0) {
                  updatedMaterials.splice(videoIdx, 1);
                }
              }

              return {
                ...s,
                title: editingSubtopicTitle.trim(),
                materials: updatedMaterials
              };
            })
          };
        })
      };
    });
    updateAndPersistModules(updated);
    setEditingSubtopicId(null);
    setEditingSubtopicVideoUrl("");
  };

  const moveSubtopic = (moduleId: number, topicId: number, index: number, direction: "up" | "down") => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const topic = mod.topics.find(t => t.id === topicId);
    if (!topic || !topic.subtopics) return;
    const list = [...topic.subtopics];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = modules.map(m =>
      m.id === moduleId
        ? {
            ...m,
            topics: m.topics.map(t =>
              t.id === topicId ? { ...t, subtopics: list } : t
            )
          }
        : m
    );
    updateAndPersistModules(updated);
  };

  // --- Rich Material Handlers ---
  const handleMaterialFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMatFileName(file.name);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    setMatFileSize(sizeStr);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMatContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveMaterial = (moduleId: number, topicId: number, subtopicId?: number) => {
    if (!addingMaterialTo) return;
    const { materialType } = addingMaterialTo;

    let finalTitle = matTitle.trim();
    if (!finalTitle) {
      if (materialType === "text") finalTitle = "Reading Section";
      else if (materialType === "video") finalTitle = "Watch Explanatory Video";
      else if (materialType === "image") finalTitle = matFileName || "Reference Image";
      else if (materialType === "file") finalTitle = matFileName || "Study Document";
    }

    const newMaterial: Material = {
      id: Date.now(),
      type: materialType,
      title: finalTitle,
      content: matContent.trim(),
      textStyle: materialType === "text" ? matTextStyle : undefined,
      imageAlign: materialType === "image" ? matImageAlign : undefined,
      fileName: matFileName || undefined,
      fileSize: matFileSize || undefined
    };

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            // Add material to subtopic
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId) return s;
                return {
                  ...s,
                  materials: [...(s.materials || []), newMaterial]
                };
              })
            };
          } else {
            // Add material to topic
            return {
              ...t,
              materials: [...(t.materials || []), newMaterial]
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
    
    // Clear inputs & state
    setAddingMaterialTo(null);
    setMatTitle("");
    setMatContent("");
    setMatFileName("");
    setMatFileSize("");
    setMatTextStyle("normal");
    setMatImageAlign("center");
  };

  const deleteMaterial = (moduleId: number, topicId: number, subtopicId: number | undefined, materialId: number) => {
    showConfirm(
      "Delete Learning Material",
      "Are you sure you want to delete this learning material?",
      () => {
        const updated = modules.map(mod => {
          if (mod.id !== moduleId) return mod;

          return {
            ...mod,
            topics: mod.topics.map(t => {
              if (t.id !== topicId) return t;

              if (subtopicId !== undefined) {
                return {
                  ...t,
                  subtopics: (t.subtopics || []).map(s => {
                    if (s.id !== subtopicId) return s;
                    return {
                      ...s,
                      materials: (s.materials || []).filter(m => m.id !== materialId)
                    };
                  })
                };
              } else {
                return {
                  ...t,
                  materials: (t.materials || []).filter(m => m.id !== materialId)
                };
              }
            })
          };
        });

        updateAndPersistModules(updated);
      }
    );
  };

  const moveMaterial = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    index: number,
    direction: "up" | "down"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            // Move inside subtopic
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                const list = [...s.materials];
                const target = direction === "up" ? index - 1 : index + 1;
                if (target < 0 || target >= list.length) return s;
                const temp = list[index];
                list[index] = list[target];
                list[target] = temp;
                return { ...s, materials: list };
              })
            };
          } else {
            // Move inside topic
            if (!t.materials) return t;
            const list = [...t.materials];
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= list.length) return t;
            const temp = list[index];
            list[index] = list[target];
            list[target] = temp;
            return { ...t, materials: list };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const reorderMaterial = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    sourceIndex: number,
    destIndex: number
  ) => {
    if (sourceIndex === destIndex) return;
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            // Reorder inside subtopic
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                const list = [...s.materials];
                const [removed] = list.splice(sourceIndex, 1);
                list.splice(destIndex, 0, removed);
                return { ...s, materials: list };
              })
            };
          } else {
            // Reorder inside topic
            if (!t.materials) return t;
            const list = [...t.materials];
            const [removed] = list.splice(sourceIndex, 1);
            list.splice(destIndex, 0, removed);
            return { ...t, materials: list };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const updateMaterialTextStyle = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    materialId: number,
    textStyle: "normal" | "bold" | "italic" | "heading" | "quote" | "code"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                return {
                  ...s,
                  materials: s.materials.map(m =>
                    m.id === materialId ? { ...m, textStyle } : m
                  )
                };
              })
            };
          } else {
            if (!t.materials) return t;
            return {
              ...t,
              materials: t.materials.map(m =>
                m.id === materialId ? { ...m, textStyle } : m
              )
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const updateMaterialImageAlign = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    materialId: number,
    imageAlign: "left" | "center" | "right"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                return {
                  ...s,
                  materials: s.materials.map(m =>
                    m.id === materialId ? { ...m, imageAlign } : m
                  )
                };
              })
            };
          } else {
            if (!t.materials) return t;
            return {
              ...t,
              materials: t.materials.map(m =>
                m.id === materialId ? { ...m, imageAlign } : m
              )
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  // --- Material Formatting & Editing Helpers ---
  const wrapSelectionInSpan = (el: HTMLElement, styleStr: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    if (!el.contains(range.commonAncestorContainer)) return;
    
    const span = document.createElement('span');
    span.setAttribute('style', styleStr);
    
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEditorMode = (elementId: string, isEditing: boolean) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (isVisualMode) {
      const currentHtml = el.innerHTML;
      if (isEditing) {
        setEditingMaterialContent(currentHtml);
      } else {
        setMatContent(currentHtml);
      }
      setIsVisualMode(false);
    } else {
      const currentHtml = (el as HTMLTextAreaElement).value;
      if (isEditing) {
        setEditingMaterialContent(currentHtml);
      } else {
        setMatContent(currentHtml);
      }
      setIsVisualMode(true);
    }
  };

  const insertFormatTag = (textareaId: string, tagStart: string, tagEnd: string, isEditing: boolean) => {
    const el = document.getElementById(textareaId);
    if (!el) return;

    if (isVisualMode && el.getAttribute('contenteditable') === 'true') {
      el.focus();
      if (tagStart === "<strong>") {
        document.execCommand('bold', false);
      } else if (tagStart === "<em>") {
        document.execCommand('italic', false);
      } else if (tagStart === "<u>") {
        document.execCommand('underline', false);
      } else if (tagStart.includes("background-color")) {
        document.execCommand('hiliteColor', false, 'rgba(34, 211, 238, 0.25)');
      } else if (tagStart.includes("font-family")) {
        const font = tagStart.match(/font-family:\s*'([^;"]+)'/)?.[1] || tagStart.match(/font-family:\s*([^;"]+)/)?.[1];
        if (font) document.execCommand('fontName', false, font);
      } else if (tagStart.includes("font-size")) {
        const size = tagStart.match(/font-size:\s*([^;"]+)/)?.[1];
        if (size) wrapSelectionInSpan(el, `font-size: ${size};`);
      } else if (tagStart.includes("monospace")) {
        wrapSelectionInSpan(el, `font-family: monospace; background-color: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; color: #4ade80; display: inline-block;`);
      }

      const content = el.innerHTML;
      if (isEditing) {
        setEditingMaterialContent(content);
      } else {
        setMatContent(content);
      }
      return;
    }

    const textarea = el as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = tagStart + selectedText + tagEnd;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    if (isEditing) {
      setEditingMaterialContent(newContent);
    } else {
      setMatContent(newContent);
    }

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 0);
  };

  const renderFormattingToolbar = (textareaId: string, isEditing: boolean) => {
    return (
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-brand-bg/60 border border-brand-border/40 rounded-t-lg -mb-2 border-b-0 text-xs select-none">
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<strong>", "</strong>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<em>", "</em>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<u>", "</u>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text underline"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, '<mark style="background-color: rgba(34, 211, 238, 0.25); color: #22d3ee; padding: 2px 4px; border-radius: 4px;">', "</mark>", isEditing)}
          className="p-1 px-1.5 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-cyan font-semibold flex items-center gap-1"
          title="Highlight"
        >
          <span className="text-[10px]">📝</span> Highlight
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, '<code style="font-family: monospace; bg-black/40 border border-brand-border/60 px-1.5 py-0.5 rounded text-green-400 text-[11px]">', "</code>", isEditing)}
          className="p-1 px-1.5 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-green-400 font-mono text-[10px]"
          title="Code"
        >
          &lt;/&gt;
        </button>

        <div className="w-[1px] h-4 bg-brand-border/40 mx-0.5"></div>

        {/* Font Family Select Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              insertFormatTag(textareaId, `<span style="font-family: ${e.target.value};">`, "</span>", isEditing);
              e.target.value = ""; // Reset
            }
          }}
          className="bg-brand-card border border-brand-border/45 rounded p-1 text-[10px] text-brand-text focus:outline-none focus:border-brand-cyan/60"
          defaultValue=""
        >
          <option value="" disabled>Font Family</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="Tahoma, sans-serif">Tahoma</option>
          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Outfit', sans-serif">Outfit</option>
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'Roboto Mono', monospace">Roboto Mono</option>
        </select>

        {/* Font Size Select Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              insertFormatTag(textareaId, `<span style="font-size: ${e.target.value};">`, "</span>", isEditing);
              e.target.value = ""; // Reset
            }
          }}
          className="bg-brand-card border border-brand-border/45 rounded p-1 text-[10px] text-brand-text focus:outline-none focus:border-brand-cyan/60"
          defaultValue=""
        >
          <option value="" disabled>Font Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
        </select>
      </div>
    );
  };

  const startEditMaterial = (topicId: number, subtopicId: number | undefined, mat: Material) => {
    setEditingMaterialId(mat.id);
    setEditingMaterialTitle(mat.title);
    setEditingMaterialContent(mat.content);
    setEditingMaterialTextStyle(mat.textStyle || "normal");
    setEditingMaterialImageAlign(mat.imageAlign || "center");
    setEditingMaterialFileName(mat.fileName || "");
    setEditingMaterialFileSize(mat.fileSize || "");
    setEditingMaterialType(mat.type);
    
    // Close addition form if open
    setAddingMaterialTo(null);
  };

  const cancelEditMaterial = () => {
    setEditingMaterialId(null);
    setEditingMaterialTitle("");
    setEditingMaterialContent("");
    setEditingMaterialTextStyle("normal");
    setEditingMaterialImageAlign("center");
    setEditingMaterialFileName("");
    setEditingMaterialFileSize("");
  };

  const saveEditMaterial = (moduleId: number, topicId: number, subtopicId?: number) => {
    if (!editingMaterialId) return;

    let finalTitle = editingMaterialTitle.trim();
    if (!finalTitle) {
      if (editingMaterialType === "text") finalTitle = "Reading Section";
      else if (editingMaterialType === "video") finalTitle = "Watch Explanatory Video";
      else if (editingMaterialType === "image") finalTitle = editingMaterialFileName || "Reference Image";
      else if (editingMaterialType === "file") finalTitle = editingMaterialFileName || "Study Document";
    }

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId) return s;
                return {
                  ...s,
                  materials: (s.materials || []).map(m => {
                    if (m.id !== editingMaterialId) return m;
                    return {
                      ...m,
                      title: finalTitle,
                      content: editingMaterialContent.trim(),
                      textStyle: editingMaterialTextStyle,
                      imageAlign: editingMaterialImageAlign,
                      fileName: editingMaterialFileName || undefined,
                      fileSize: editingMaterialFileSize || undefined
                    };
                  })
                };
              })
            };
          } else {
            return {
              ...t,
              materials: (t.materials || []).map(m => {
                if (m.id !== editingMaterialId) return m;
                return {
                  ...m,
                  title: finalTitle,
                  content: editingMaterialContent.trim(),
                  textStyle: editingMaterialTextStyle,
                  imageAlign: editingMaterialImageAlign,
                  fileName: editingMaterialFileName || undefined,
                  fileSize: editingMaterialFileSize || undefined
                };
              })
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
    cancelEditMaterial();
  };

  const handleEditMaterialFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditingMaterialFileName(file.name);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    setEditingMaterialFileSize(sizeStr);

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingMaterialContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle topic expanded state
  const toggleTopicExpand = (topicId: number) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId]
    }));
  };

  const toggleSubtopicExpand = (subtopicId: number) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: prev[subtopicId] === undefined ? false : !prev[subtopicId]
    }));
  };

  // Filter modules by search
  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedModule = modules.find(m => m.id === currentModuleId);

  // Statistics calculations
  const totalModules = modules.length;
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const totalResources = modules.reduce(
    (sum, m) =>
      sum +
      m.topics.reduce((resSum, t) => {
        let count = (t.materials || []).length;
        count += t.subtopics?.reduce((subSum, s) => {
          return subSum + (s.materials || []).length;
        }, 0) || 0;
        return resSum + count;
      }, 0),
    0
  );
  const renderPreviewSpecialWorkspaceItem = () => {
    if (previewSpecialItem === "announcements") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-2 mb-4">
            <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">📢 General announcements</span>
            <h2 className="text-sm font-bold text-brand-text mt-0.5">Subject Announcements</h2>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[260px] pr-1.5">
            <div className="bg-brand-bg/40 border border-brand-border/30 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-brand-border/20 pb-2">
                <h4 className="font-bold text-brand-cyan text-xs">Welcome to Networking 1! 🚀</h4>
                <span className="text-[9px] text-brand-muted font-mono bg-brand-bg border border-brand-border/40 px-2 py-0.5 rounded">June 15, 2026</span>
              </div>
              <p className="text-[11px] text-brand-text/90 leading-relaxed">
                Hello class! Welcome to our gamified networking lab. To get started, please make sure you verify your registration details and then take the Module 1 Pre-test. This will unlock the study guides, lecture readings, and the interactive IP subnetting challenge! Let's master subnetting together.
              </p>
            </div>
            <div className="bg-brand-bg/40 border border-brand-border/30 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-brand-border/20 pb-2">
                <h4 className="font-bold text-brand-cyan text-xs">First Lab Exercise Available 💻</h4>
                <span className="text-[9px] text-brand-muted font-mono bg-brand-bg border border-brand-border/40 px-2 py-0.5 rounded">June 18, 2026</span>
              </div>
              <p className="text-[11px] text-brand-text/90 leading-relaxed">
                The VLSM and ANDing interactive lab tasks are now active. Remember that you must review the lecture materials in 'Subnetting in the IPv6 Era' and participate in the module discussion board before attempting the exercises. Scrolling to the bottom of the module discussion will unlock the interactive task!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (previewSpecialItem === "subject-guide") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-2 mb-4">
            <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">📄 Subject Information</span>
            <h2 className="text-sm font-bold text-brand-text mt-0.5">[MUST READ] Subject Guide</h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[260px] pr-1.5 leading-relaxed">
            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-4 flex flex-col gap-2">
              <h3 className="font-bold text-xs text-brand-cyan border-b border-brand-border/30 pb-1.5">Course Overview & Syllabus</h3>
              <p className="text-[11px] text-brand-text/90 leading-relaxed">
                This subject introduces fundamental concepts of computer networking, IP address structures, subnet masks, variable length subnet masking (VLSM), and binary ANDing logic. Students will engage in gamified interactive exercises to test their subnetting and network anatomy skills.
              </p>

              <h4 className="font-bold text-[10px] text-brand-text mt-1">Syllabus Breakdown:</h4>
              <ul className="list-disc pl-4 text-[11px] text-brand-muted flex flex-col gap-0.5">
                <li>Module 1: Introduction of Subnetting (FLSM, VLSM, Binary ANDing, IPv6 Era)</li>
                <li>Module 2: Routing Protocols & Local Area Networks</li>
              </ul>
            </div>

            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-4 flex flex-col gap-2">
              <h3 className="font-bold text-xs text-brand-cyan border-b border-brand-border/30 pb-1.5">Grading Policy</h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between border-b border-brand-border/15 pb-0.5">
                  <span className="text-brand-muted">Pre-tests:</span>
                  <span className="font-bold text-brand-text">20%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-0.5">
                  <span className="text-brand-muted">Interactive Labs:</span>
                  <span className="font-bold text-brand-text">40%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-0.5">
                  <span className="text-brand-muted">Quizzes:</span>
                  <span className="font-bold text-brand-text">30%</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/15 pb-0.5">
                  <span className="text-brand-muted">Forums Participation:</span>
                  <span className="font-bold text-brand-text">10%</span>
                </div>
              </div>
            </div>

            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-2xl p-4 flex flex-col gap-2">
              <h3 className="font-bold text-xs text-brand-cyan border-b border-brand-border/30 pb-1.5">Rules of Conduct</h3>
              <p className="text-[11px] text-brand-text/90 leading-relaxed">
                Respectful communication is strictly prohibited on all discussion boards. Cheating or distributing direct solutions to interactive tasks is prohibited. Working together to troubleshoot topologies is welcomed!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (previewSpecialItem === "self-introduction") {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-2 mb-4">
            <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">👋 Class Introductions</span>
            <h2 className="text-sm font-bold text-brand-text mt-0.5">Self-introduction Board</h2>
            <p className="text-brand-muted text-[10px] mt-0.5">Say hello to your fellow classmates! Share your name, program, and hobbies.</p>
          </div>

          {/* Chat area */}
          <div className="flex-grow overflow-y-auto max-h-[220px] border border-brand-border/40 bg-brand-bg/25 rounded-2xl p-3 flex flex-col gap-2.5 scrollbar-thin mb-3">
            {previewSelfIntroPosts.map((post) => (
              <div key={post.id} className="bg-brand-bg/50 border border-brand-border/35 rounded-xl p-2.5 flex gap-2.5 animate-scaleIn">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-gradient-to-br from-brand-cyan to-blue-600 text-brand-bg select-none">
                  {getAvatarInitials(post.name)}
                </div>
                <div className="flex-grow flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-brand-text">{post.name}</span>
                    <span className="text-[8px] text-brand-muted font-mono">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-brand-text/90 leading-relaxed whitespace-pre-wrap">{post.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!previewSelfIntroMsg.trim()) return;
              const newPost = {
                id: Date.now(),
                name: "Professor (You)",
                message: previewSelfIntroMsg.trim(),
                createdAt: new Date().toISOString()
              };
              setPreviewSelfIntroPosts([...previewSelfIntroPosts, newPost]);
              setPreviewSelfIntroMsg("");
            }}
            className="flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={previewSelfIntroMsg}
              onChange={(e) => setPreviewSelfIntroMsg(e.target.value)}
              placeholder="Type your simulated introduction message..."
              className="flex-grow bg-brand-bg/50 border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-xl px-3 py-2 text-xs text-brand-text placeholder-brand-muted/70"
            />
            <button
              type="submit"
              disabled={!previewSelfIntroMsg.trim()}
              className="px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
            >
              Post 👋
            </button>
          </form>
        </div>
      );
    }

    if (previewSpecialItem === "pretest" && selectedModule && selectedModule.pretest) {
      return (
        <div className="flex-grow flex flex-col h-full animate-scaleIn">
          <div className="border-b border-brand-border/40 pb-2 mb-4">
            <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">📝 Student Preview Simulation</span>
            <h2 className="text-sm font-bold text-brand-text mt-0.5">Module Pre-test: {selectedModule.title}</h2>
            <p className="text-brand-muted text-[10px] mt-0.5">
              This is a simulation of the pre-test questions configured for this module.
            </p>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-1.5 scrollbar-thin">
            {selectedModule.pretest.length === 0 ? (
              <p className="text-xs text-brand-muted italic">No pretest questions configured yet.</p>
            ) : (
              selectedModule.pretest.map((q, idx) => (
                <div key={idx} className="bg-brand-bg/15 border border-brand-border/20 rounded-xl p-3.5 flex flex-col gap-2.5 animate-scaleIn">
                  <h4 className="font-bold text-[10px] text-brand-cyan uppercase tracking-wider">Question {idx + 1}</h4>
                  <p className="text-xs font-semibold text-brand-text leading-snug">{q.question}</p>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center border transition-all ${
                          q.correctAnswer === oIdx
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                            : "bg-brand-card/50 border-brand-border/45 text-brand-text/90"
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                        {q.correctAnswer === oIdx && <span className="ml-auto text-[8px] uppercase font-bold text-emerald-400">Correct Answer</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/modules" />
      
      <main className="p-8 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Course Modules</h1>
            <p className="text-brand-muted text-sm">
              Create curriculum structure, arrange topics, and add rich reading, video, and document materials.
            </p>
          </div>
        </header>

        {/* Statistics Panels */}
        <section className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Modules</div>
              <div className="text-2xl font-bold mt-1">{totalModules}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Topics</div>
              <div className="text-2xl font-bold mt-1">{totalTopics}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total Materials</div>
              <div className="text-2xl font-bold mt-1">{totalResources}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT PANE: Modules Manager */}
            <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg flex flex-col gap-4 min-w-0">
              <div>
                <h3 className="font-bold text-lg text-brand-text mb-1">Create Module</h3>
                <p className="text-xs text-brand-muted">Add a new high-level chapter to your class.</p>
              </div>

              {/* Module Creation */}
              <div className="flex gap-2">
                <input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. OSPF Routing Concepts"
                  className="flex-grow bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/70 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createModule();
                  }}
                />
                <button
                  onClick={createModule}
                  disabled={!newModuleTitle.trim()}
                  className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg font-bold px-4 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
                >
                  Create
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <div className="text-center text-xs text-brand-muted my-1">— OR —</div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full bg-brand-cyan/10 hover:bg-brand-cyan/25 border border-brand-cyan/35 text-brand-cyan font-bold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Auto-Generate from PDF/DOCX
                </button>
              </div>

              <div className="border-t border-brand-border/40 my-1"></div>

              {/* Module Listing with Search */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-brand-text">Your Modules</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted border border-brand-border">
                    {filteredModules.length} found
                  </span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Filter modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/60 placeholder-brand-muted/70 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-text"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {filteredModules.length === 0 ? (
                    <div className="text-center text-xs text-brand-muted py-6">
                      No modules found. Create one above!
                    </div>
                  ) : (
                    filteredModules.map((mod) => (
                      <div
                        key={mod.id}
                        draggable={editingModuleId !== mod.id}
                        onDragStart={(e) => {
                          setDraggedModuleId(mod.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(mod.id));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedModuleId !== null && draggedModuleId !== mod.id) {
                            setDragOverModuleId(mod.id);
                          }
                        }}
                        onDragLeave={() => setDragOverModuleId(null)}
                        onDragEnd={() => {
                          setDraggedModuleId(null);
                          setDragOverModuleId(null);
                        }}
                        onDrop={(e) => handleDropModule(e, mod.id)}
                        onClick={() => {
                          setCurrentModuleId(mod.id);
                          setAddingMaterialTo(null);
                        }}
                        className={`group relative p-3 rounded-lg border cursor-grab active:cursor-grabbing flex flex-col gap-1 transition-all duration-200 ${
                          dragOverModuleId === mod.id
                            ? "border-brand-cyan bg-brand-cyan/25 scale-[1.02] shadow-lg shadow-brand-cyan/10"
                            : currentModuleId === mod.id
                              ? "bg-brand-cyan/10 border-brand-cyan text-brand-text shadow-sm"
                              : "bg-brand-card border-brand-border hover:bg-brand-bg/40 hover:border-brand-border-var"
                        }`}
                      >
                        {editingModuleId === mod.id ? (
                          <form
                            onSubmit={saveEditModule}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full mt-1"
                          >
                            <input
                              value={editingModuleTitle}
                              onChange={(e) => setEditingModuleTitle(e.target.value)}
                              className="bg-brand-bg border border-brand-cyan rounded px-2 py-1 text-xs text-brand-text flex-grow focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="text-green-500 hover:text-green-400 p-1"
                              title="Save Changes"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModuleId(null);
                              }}
                              className="text-red-500 hover:text-red-400 p-1"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start pr-12">
                              <span className="font-semibold text-sm truncate w-full">
                                {mod.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-brand-muted flex items-center gap-2 mt-1">
                              <span>{mod.topics.length} topics</span>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-brand-card via-brand-card to-transparent pl-4 py-1.5">
                              <button
                                onClick={(e) => startEditModule(mod, e)}
                                className="text-brand-muted hover:text-brand-cyan p-1 rounded transition-colors"
                                title="Rename Module"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button
                                onClick={(e) => deleteModule(mod.id, e)}
                                className="text-brand-muted hover:text-red-400 p-1 rounded transition-colors"
                                title="Delete Module"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Selected Module Detail Panel */}
            <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg min-w-0">
              {selectedModule ? (
                <div>
                  
                  {/* Workspace Header with Builder/Preview toggle */}
                  <div className="border-b border-brand-border/40 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-grow">
                      <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                        {isPreviewMode ? "Curriculum Preview Sim" : "Curriculum Builder Workspace"}
                      </span>
                      <h2 className="text-xl font-bold mt-0.5 whitespace-normal break-words">{selectedModule.title}</h2>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0 justify-end">
                      {/* Mode Toggle Button Group */}
                      <div className="flex bg-brand-bg border border-brand-border p-1 rounded-lg shrink-0">
                        <button
                          onClick={() => setIsPreviewMode(false)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${!isPreviewMode ? 'bg-brand-cyan text-brand-bg font-bold shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                          Builder
                        </button>
                        <button
                          onClick={() => setIsPreviewMode(true)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isPreviewMode ? 'bg-brand-cyan text-brand-bg font-bold shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                          Student Preview
                        </button>
                      </div>

                      <div className="text-xs text-brand-muted bg-brand-bg border border-brand-border px-3 py-1.5 rounded-lg flex items-center gap-1.5 hidden md:flex shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                        Active Module
                      </div>
                    </div>
                  </div>

                  {!isPreviewMode ? (
                    <>
                      {/* BUILDER MODE */}
                      {/* Add Topic Input */}
                      <div className="mb-6 bg-brand-bg/40 p-4 rounded-xl border border-brand-border/45">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          Add Topic
                        </h4>
                        <div className="flex gap-2">
                          <input
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            placeholder="e.g. Classless Inter-Domain Routing (CIDR)"
                            className="flex-grow bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/70"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addTopic(selectedModule.id);
                            }}
                          />
                          <button
                            onClick={() => addTopic(selectedModule.id)}
                            disabled={!newTopicTitle.trim()}
                            className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold px-4 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Add Topic
                          </button>
                        </div>
                      </div>

                      {/* Module Pre-test Section */}
                      <div className="mb-6 bg-brand-bg/40 p-4 rounded-xl border border-brand-border/45 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold flex items-center gap-1.5">
                              📋 Module Pre-test
                            </h4>
                            <p className="text-xs text-brand-muted mt-1">
                              {selectedModule.pretest && selectedModule.pretest.length > 0
                                ? `Contains ${selectedModule.pretest.length} questions`
                                : "No pre-test active. Students can access topics immediately."}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Upload Document Button */}
                            <label className="px-3 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan font-bold text-xs rounded-lg cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 select-none">
                              📁 Upload Doc (PDF/DOCX/TXT)
                              <input
                                type="file"
                                accept=".pdf,.docx,.txt"
                                className="hidden"
                                disabled={isPretestLoading}
                                onChange={(e) => handlePretestUpload(e, selectedModule.id)}
                              />
                            </label>
                            


                            {/* Paste text button */}
                            <button
                              onClick={() => setIsPastingPretest(!isPastingPretest)}
                              disabled={isPretestLoading}
                              className="px-3 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan font-bold text-xs rounded-lg transition-colors cursor-pointer select-none"
                            >
                              ✍️ Paste plain text
                            </button>

                            {selectedModule.pretest && selectedModule.pretest.length > 0 && (
                              <button
                                onClick={() => removePretest(selectedModule.id)}
                                disabled={isPretestLoading}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Remove Pre-test
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Spinner / Loader */}
                        {isPretestLoading && (
                          <div className="flex items-center justify-center py-4 bg-brand-bg/10 rounded-xl border border-brand-border/20">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-cyan mr-2.5"></div>
                            <span className="text-xs text-brand-muted">Scanning and parsing pre-test questions...</span>
                          </div>
                        )}

                        {/* Paste pretest text area */}
                        {isPastingPretest && !isPretestLoading && (
                          <div className="bg-brand-card/50 border border-brand-border/40 rounded-xl p-4 flex flex-col gap-3">
                            <div>
                              <h5 className="font-bold text-xs text-brand-cyan">Paste Pre-test Text</h5>
                              <p className="text-[10px] text-brand-muted mt-0.5">
                                Formats supported: Questions starting with "1.", options starting with "A.", correct answers marked with an asterisk (e.g. *A) or Answer: A.
                              </p>
                            </div>
                            <textarea
                              value={pastedPretestText}
                              onChange={(e) => setPastedPretestText(e.target.value)}
                              placeholder="Paste questions here...&#10;1. What is CIDR?&#10;A. Classless Inter-Domain Routing&#10;B. Classful Inter-Domain Routing&#10;*C. Computer Internet Data Receiver&#10;D. None&#10;Correct Answer: A"
                              className="w-full h-44 bg-brand-bg border border-brand-border rounded-lg p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 font-mono placeholder-brand-muted/40"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setIsPastingPretest(false);
                                  setPastedPretestText("");
                                }}
                                className="px-3.5 py-1.5 bg-brand-bg border border-brand-border text-brand-muted text-xs font-semibold rounded-lg hover:text-brand-text transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handlePretestTextSubmit(selectedModule.id)}
                                disabled={!pastedPretestText.trim()}
                                className="px-4 py-1.5 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg font-extrabold text-xs rounded-lg transition-colors whitespace-nowrap"
                              >
                                Parse and Import Quiz
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedModule.pretest && selectedModule.pretest.length > 0 && !isPastingPretest && (
                          <div className="text-xs bg-brand-card border border-brand-border/40 rounded-lg p-3 max-h-[220px] overflow-y-auto flex flex-col gap-3">
                            {selectedModule.pretest.map((q, idx) => (
                              <div key={idx} className="border-b border-brand-border/20 last:border-b-0 pb-3 last:pb-0">
                                <div className="font-bold text-brand-text mb-1">Q{idx + 1}: {q.question}</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-brand-muted pl-2 mt-1">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={`p-1 rounded ${oIdx === q.correctAnswer ? "text-brand-cyan font-bold bg-brand-cyan/5" : ""}`}>
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Topics List */}
                      <div>
                        <h3 className="font-bold text-sm text-brand-muted mb-4 uppercase tracking-wider">
                          Module Outline
                        </h3>

                        {selectedModule.topics.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mx-auto mb-3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            <p className="text-xs text-brand-muted">This module has no topics yet.</p>
                            <p className="text-[10px] text-brand-muted/70 mt-1">Create one above to begin structuring.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {selectedModule.topics.map((topic, topicIdx) => {
                              const isExpanded = expandedTopics[topic.id] !== false; // default true
                              
                              return (
                                <div
                                  key={topic.id}
                                  className="border border-brand-border/40 rounded-xl bg-brand-bg/25 overflow-hidden transition-all shadow-sm hover:border-brand-border"
                                >
                                  
                                  {/* Topic Header Card */}
                                  <div className="bg-brand-card/45 px-4 py-3 flex items-center justify-between border-b border-brand-border/20">
                                    
                                    {/* Topic Name / Edit Mode */}
                                    <div className="flex-grow mr-4">
                                      {editingTopicId === topic.id ? (
                                        <div className="flex flex-col gap-2 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-brand-cyan uppercase shrink-0 min-w-[70px]">Title:</span>
                                            <input
                                              value={editingTopicTitle}
                                              onChange={(e) => setEditingTopicTitle(e.target.value)}
                                              className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text flex-grow focus:outline-none focus:border-brand-cyan"
                                              autoFocus
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-brand-cyan uppercase shrink-0 min-w-[70px]">Video URL:</span>
                                            <input
                                              value={editingTopicVideoUrl}
                                              onChange={(e) => setEditingTopicVideoUrl(e.target.value)}
                                              placeholder="Paste YouTube Link (e.g., https://youtube.com/watch?v=...)"
                                              className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text flex-grow focus:outline-none focus:border-brand-cyan placeholder-brand-muted/40"
                                            />
                                          </div>
                                          <div className="flex justify-end gap-1.5 mt-0.5">
                                            <button
                                              onClick={() => saveEditTopic(selectedModule.id)}
                                              className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-[10px] rounded-lg transition-all font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingTopicId(null)}
                                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[10px] rounded-lg transition-all font-bold cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div
                                          onClick={() => toggleTopicExpand(topic.id)}
                                          className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                          <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded">
                                            Topic {topicIdx + 1}
                                          </span>
                                          <span className="font-bold text-sm text-brand-text hover:text-brand-cyan transition-colors">
                                            {topic.title}
                                          </span>
                                          <span className="text-brand-muted">
                                            {isExpanded ? (
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                            ) : (
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Reordering & CRUD controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Up/Down Arrow reordering */}
                                      <div className="flex items-center bg-brand-bg rounded-lg border border-brand-border/60 p-0.5">
                                        <button
                                          disabled={topicIdx === 0}
                                          onClick={() => moveTopic(selectedModule.id, topicIdx, "up")}
                                          className="p-1 text-brand-muted hover:text-brand-cyan disabled:opacity-20 disabled:hover:text-brand-muted transition-colors"
                                          title="Move Up"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                        </button>
                                        <div className="w-[1px] h-3 bg-brand-border/50"></div>
                                        <button
                                          disabled={topicIdx === selectedModule.topics.length - 1}
                                          onClick={() => moveTopic(selectedModule.id, topicIdx, "down")}
                                          className="p-1 text-brand-muted hover:text-brand-cyan disabled:opacity-20 disabled:hover:text-brand-muted transition-colors"
                                          title="Move Down"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </button>
                                      </div>

                                      <div className="w-[1px] h-4 bg-brand-border/40 mx-0.5"></div>

                                      {/* Edit / Trash */}
                                      <button
                                        onClick={() => startEditTopic(topic.id, topic.title)}
                                        className="p-1.5 text-brand-muted hover:text-brand-cyan hover:bg-brand-bg rounded transition-all"
                                        title="Edit Topic Title"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                      </button>
                                      <button
                                        onClick={() => deleteTopic(selectedModule.id, topic.id)}
                                        className="p-1.5 text-brand-muted hover:text-red-400 hover:bg-brand-bg rounded transition-all"
                                        title="Delete Topic"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expanded Topic Details */}
                                  {isExpanded && (
                                    <div className="p-4 flex flex-col gap-4 bg-brand-card/20">
                                      
                                      {/* Learning Materials Section */}
                                      <div className="border border-brand-border/40 rounded-xl p-4 bg-brand-bg/10 flex flex-col">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-brand-border/10">
                                          <h5 className="text-[11px] uppercase font-bold text-brand-muted tracking-wider">
                                            Learning Materials ({(topic.materials || []).length})
                                          </h5>
                                          
                                          {/* Add Material Menu */}
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] text-brand-muted font-medium mr-1">Add:</span>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "text" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Reading
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "video" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Video Link
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "image" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Image
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "file" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Document
                                            </button>
                                          </div>
                                        </div>

                                        {/* Adding Material Form (Topic) */}
                                        {addingMaterialTo?.type === "topic" && addingMaterialTo?.topicId === topic.id && (
                                          <div className="bg-brand-card border border-brand-cyan/30 rounded-xl p-4 mb-4 flex flex-col gap-3 shadow-md" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                                                New {addingMaterialTo.materialType} Content
                                              </span>
                                              <button
                                                onClick={() => setAddingMaterialTo(null)}
                                                className="text-[10px] text-brand-muted hover:text-red-400 font-semibold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                            
                                            <input
                                              value={matTitle}
                                              onChange={(e) => setMatTitle(e.target.value)}
                                              placeholder="Material Title (e.g. Subnetting Basics Reading, YouTube explanation)"
                                              className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                            />

                                            {addingMaterialTo.materialType === "text" && (
                                              <div className="flex flex-col animate-fadeIn">
                                                {renderFormattingToolbar(`mat-textarea-new-${topic.id}`, false)}
                                                {isVisualMode ? (
                                                  <div
                                                    id={`mat-textarea-new-${topic.id}`}
                                                    contentEditable
                                                    dangerouslySetInnerHTML={{ __html: matContent }}
                                                    onBlur={(e) => setMatContent(e.target.innerHTML)}
                                                    data-placeholder="Write your study text here..."
                                                    className="bg-brand-bg border border-brand-border rounded-b-lg p-3 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 min-h-[112px] overflow-y-auto"
                                                  />
                                                ) : (
                                                  <textarea
                                                    id={`mat-textarea-new-${topic.id}`}
                                                    value={matContent}
                                                    onChange={(e) => setMatContent(e.target.value)}
                                                    placeholder="Write your study text here..."
                                                    className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-28 resize-y font-mono"
                                                  />
                                                )}
                                                {/* STYLE selection inside text editing */}
                                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                  <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">STYLE:</span>
                                                  {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                    <button
                                                      key={style}
                                                      type="button"
                                                      onClick={() => setMatTextStyle(style)}
                                                      className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                        matTextStyle === style
                                                          ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                          : "bg-brand-bg border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                      }`}
                                                    >
                                                      {style}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {addingMaterialTo.materialType === "video" && (
                                              <input
                                                value={matContent}
                                                onChange={(e) => setMatContent(e.target.value)}
                                                placeholder="Paste Video URL (e.g. https://www.youtube.com/watch?v=...)"
                                                className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                              />
                                            )}

                                            {(addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && (
                                              <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                  <label className="text-xs font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                                    <span>Upload File</span>
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      accept={addingMaterialTo.materialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                      onChange={(e) => handleMaterialFileUpload(e, addingMaterialTo.materialType as 'image' | 'file')}
                                                    />
                                                  </label>
                                                  {matFileName ? (
                                                    <span className="text-[10px] text-brand-text truncate">
                                                      {matFileName} ({matFileSize})
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] text-brand-muted">No file chosen.</span>
                                                  )}
                                                </div>
                                                {addingMaterialTo.materialType === "image" && matContent && (
                                                  <div className="mt-2.5 w-full max-w-[480px] border border-brand-border/30 rounded-lg p-1.5 bg-brand-bg/40 shadow-md shadow-black/25 animate-fadeIn">
                                                    <img
                                                      src={matContent}
                                                      alt="Image Preview"
                                                      className="w-full max-h-[280px] rounded object-contain mx-auto"
                                                    />
                                                  </div>
                                                )}
                                                {addingMaterialTo.materialType === "image" && (
                                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">ALIGN:</span>
                                                    {(["left", "center", "right"] as const).map((align) => (
                                                      <button
                                                        key={align}
                                                        type="button"
                                                        onClick={() => setMatImageAlign(align)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                          matImageAlign === align
                                                            ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                            : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                        }`}
                                                      >
                                                        {align}
                                                      </button>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            <button
                                              onClick={() => saveMaterial(selectedModule.id, topic.id)}
                                              disabled={
                                                (addingMaterialTo.materialType === "text" && !matContent.trim()) ||
                                                (addingMaterialTo.materialType === "video" && !matContent.trim()) ||
                                                ((addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && !matContent)
                                              }
                                              className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                              Add Material
                                            </button>
                                          </div>
                                        )}

                                        {/* Render Materials List (Topic) */}
                                        {(topic.materials || []).length === 0 ? (
                                          <div className="text-center text-[10px] text-brand-muted/70 py-4 italic">
                                            No materials added to this topic yet. Add reading sheets or video links above.
                                          </div>
                                        ) : (
                                          <div className="flex flex-col gap-2">
                                            {(topic.materials || []).map((mat, matIdx) => (
                                              editingMaterialId === mat.id ? (
                                                <div key={mat.id} className="bg-brand-card border border-brand-cyan/30 rounded-xl p-4 mb-2 flex flex-col gap-3 shadow-md" onClick={(e) => e.stopPropagation()}>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                                                      Edit {editingMaterialType} Content
                                                    </span>
                                                    <button
                                                      onClick={cancelEditMaterial}
                                                      className="text-[10px] text-brand-muted hover:text-red-400 font-semibold"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                  
                                                  <input
                                                    value={editingMaterialTitle}
                                                    onChange={(e) => setEditingMaterialTitle(e.target.value)}
                                                    placeholder="Material Title"
                                                    className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                  />

                                                  {editingMaterialType === "text" && (
                                                    <div className="flex flex-col animate-fadeIn">
                                                      {renderFormattingToolbar(`mat-textarea-edit-${mat.id}`, true)}
                                                      {isVisualMode ? (
                                                        <div
                                                          id={`mat-textarea-edit-${mat.id}`}
                                                          contentEditable
                                                          dangerouslySetInnerHTML={{ __html: editingMaterialContent }}
                                                          onBlur={(e) => setEditingMaterialContent(e.target.innerHTML)}
                                                          data-placeholder="Write your study text here..."
                                                          className="bg-brand-bg border border-brand-border rounded-b-lg p-3 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 min-h-[112px] overflow-y-auto"
                                                        />
                                                      ) : (
                                                        <textarea
                                                          id={`mat-textarea-edit-${mat.id}`}
                                                          value={editingMaterialContent}
                                                          onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                          placeholder="Write your study text here..."
                                                          className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-28 resize-y font-mono"
                                                        />
                                                      )}
                                                      {/* STYLE selection inside editing */}
                                                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">STYLE:</span>
                                                        {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                          <button
                                                            key={style}
                                                            type="button"
                                                            onClick={() => setEditingMaterialTextStyle(style)}
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                              editingMaterialTextStyle === style
                                                                ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                            }`}
                                                          >
                                                            {style}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {editingMaterialType === "video" && (
                                                    <input
                                                      value={editingMaterialContent}
                                                      onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                      placeholder="Paste Video URL"
                                                      className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                    />
                                                  )}

                                                  {(editingMaterialType === "image" || editingMaterialType === "file") && (
                                                    <div className="flex flex-col gap-2">
                                                      <div className="flex items-center gap-3">
                                                        <label className="text-xs font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                                          <span>Upload New File</span>
                                                          <input
                                                            type="file"
                                                            className="hidden"
                                                            accept={editingMaterialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                            onChange={(e) => handleEditMaterialFileUpload(e, editingMaterialType as 'image' | 'file')}
                                                          />
                                                        </label>
                                                        {editingMaterialFileName ? (
                                                          <span className="text-[10px] text-brand-text truncate">
                                                            {editingMaterialFileName} ({editingMaterialFileSize})
                                                          </span>
                                                        ) : (
                                                          <span className="text-[10px] text-brand-muted font-mono max-w-[200px] truncate">
                                                            {editingMaterialContent.startsWith("data:") ? "Existing base64 resource" : editingMaterialContent}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {editingMaterialType === "image" && editingMaterialContent && (
                                                        <div className="mt-2.5 w-full max-w-[480px] border border-brand-border/30 rounded-lg p-1.5 bg-brand-bg/40 shadow-md shadow-black/25 animate-fadeIn">
                                                          <img
                                                            src={editingMaterialContent}
                                                            alt="Image Preview"
                                                            className="w-full max-h-[280px] rounded object-contain mx-auto"
                                                          />
                                                        </div>
                                                      )}
                                                      {editingMaterialType === "image" && (
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">ALIGN:</span>
                                                          {(["left", "center", "right"] as const).map((align) => (
                                                            <button
                                                              key={align}
                                                              type="button"
                                                              onClick={() => setEditingMaterialImageAlign(align)}
                                                              className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                                editingMaterialImageAlign === align
                                                                  ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                  : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                              }`}
                                                            >
                                                              {align}
                                                            </button>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  <button
                                                    onClick={() => saveEditMaterial(selectedModule.id, topic.id)}
                                                    disabled={
                                                      (editingMaterialType === "text" && !editingMaterialContent.trim()) ||
                                                      (editingMaterialType === "video" && !editingMaterialContent.trim()) ||
                                                      ((editingMaterialType === "image" || editingMaterialType === "file") && !editingMaterialContent)
                                                    }
                                                    className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold py-2 rounded-lg transition-colors"
                                                  >
                                                    Save Changes
                                                  </button>
                                                </div>
                                              ) : (
                                                <div
                                                  key={mat.id}
                                                  draggable
                                                  onDragStart={(e) => {
                                                    setDraggedMatInfo({ topicId: topic.id, index: matIdx });
                                                    e.dataTransfer.effectAllowed = "move";
                                                    e.dataTransfer.setData("text/plain", matIdx.toString());
                                                  }}
                                                  onDragEnd={() => {
                                                    setDraggedMatInfo(null);
                                                    setDragOverInfo(null);
                                                  }}
                                                  onDragOver={(e) => {
                                                    e.preventDefault();
                                                  }}
                                                  onDragEnter={() => {
                                                    if (draggedMatInfo && draggedMatInfo.topicId === topic.id && draggedMatInfo.subtopicId === undefined) {
                                                      setDragOverInfo({ topicId: topic.id, index: matIdx });
                                                    }
                                                  }}
                                                  onDrop={() => {
                                                    if (draggedMatInfo && draggedMatInfo.topicId === topic.id && draggedMatInfo.subtopicId === undefined) {
                                                      reorderMaterial(selectedModule.id, topic.id, undefined, draggedMatInfo.index, matIdx);
                                                    }
                                                    setDraggedMatInfo(null);
                                                    setDragOverInfo(null);
                                                  }}
                                                  className={`flex flex-col gap-2 bg-brand-card/40 border rounded-lg p-3 hover:border-brand-border transition-all duration-200 animate-fadeIn cursor-grab active:cursor-grabbing ${
                                                    draggedMatInfo?.topicId === topic.id && draggedMatInfo?.subtopicId === undefined && draggedMatInfo?.index === matIdx
                                                      ? "opacity-30 border-dashed border-brand-cyan/50 bg-brand-bg/50 scale-[0.98]"
                                                      : dragOverInfo?.topicId === topic.id && dragOverInfo?.subtopicId === undefined && dragOverInfo?.index === matIdx
                                                      ? "border-brand-cyan bg-brand-cyan/5 scale-[1.01] shadow-md shadow-brand-cyan/5"
                                                      : "border-brand-border/30"
                                                  }`}
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2.5 truncate mr-4">
                                                      {/* Drag Handle grip */}
                                                      <div className="text-brand-muted/50 hover:text-brand-cyan/80 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                                      </div>
                                                      {/* Material Type Icon */}
                                                      {mat.type === "text" && (
                                                        <span className="text-brand-cyan" title="Reading Sheet">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "video" && (
                                                        <span className="text-brand-cyan" title="Video Resource">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "image" && (
                                                        <span className="text-brand-cyan" title="Image Reference">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "file" && (
                                                        <span className="text-brand-cyan" title="Document File">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                                        </span>
                                                      )}

                                                      <div className="flex flex-col truncate">
                                                        <span className="text-xs font-semibold text-brand-text truncate">
                                                          {mat.title}
                                                        </span>
                                                        <span className="text-[9px] text-brand-muted truncate">
                                                          {mat.fileName ? `${mat.fileName} (${mat.fileSize})` : mat.content}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      {/* Reordering */}
                                                      <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40">
                                                        <button
                                                          disabled={matIdx === 0}
                                                          onClick={() => moveMaterial(selectedModule.id, topic.id, undefined, matIdx, "up")}
                                                          className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                        >
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                        </button>
                                                        <button
                                                          disabled={matIdx === (topic.materials || []).length - 1}
                                                          onClick={() => moveMaterial(selectedModule.id, topic.id, undefined, matIdx, "down")}
                                                          className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                        >
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        </button>
                                                      </div>

                                                      <button
                                                        onClick={() => startEditMaterial(topic.id, undefined, mat)}
                                                        className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                        title="Edit Material"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                      </button>

                                                      <button
                                                        onClick={() => deleteMaterial(selectedModule.id, topic.id, undefined, mat.id)}
                                                        className="text-brand-muted hover:text-red-400 p-0.5"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        )}

                                      </div>

                                      {/* Subtopics Listing */}
                                      <div className="pl-2 border-l border-brand-border/40 mt-1 flex flex-col gap-2">
                                        <h5 className="text-[10px] uppercase font-bold text-brand-muted tracking-wider mb-1">
                                          Subtopics ({topic.subtopics?.length || 0})
                                        </h5>

                                        {(topic.subtopics || []).map((sub, subIdx) => (
                                          <div
                                            key={sub.id}
                                            className="group/sub flex flex-col bg-brand-bg/40 border border-brand-border/30 rounded-lg p-3 hover:border-brand-border transition-all"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex-grow mr-4">
                                                {editingSubtopicId === sub.id ? (
                                                  <div className="flex flex-col gap-2 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-bold text-brand-cyan uppercase shrink-0 min-w-[70px]">Title:</span>
                                                      <input
                                                        value={editingSubtopicTitle}
                                                        onChange={(e) => setEditingSubtopicTitle(e.target.value)}
                                                        className="bg-brand-bg border border-brand-border rounded-md px-2 py-0.5 text-xs text-brand-text flex-grow focus:outline-none focus:border-brand-cyan"
                                                        autoFocus
                                                      />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-bold text-brand-cyan uppercase shrink-0 min-w-[70px]">Video URL:</span>
                                                      <input
                                                        value={editingSubtopicVideoUrl}
                                                        onChange={(e) => setEditingSubtopicVideoUrl(e.target.value)}
                                                        placeholder="Paste YouTube Link (e.g., https://youtube.com/watch?v=...)"
                                                        className="bg-brand-bg border border-brand-border rounded-md px-2 py-0.5 text-xs text-brand-text flex-grow focus:outline-none focus:border-brand-cyan placeholder-brand-muted/40"
                                                      />
                                                    </div>
                                                    <div className="flex justify-end gap-1.5 mt-0.5">
                                                      <button
                                                        onClick={() => saveEditSubtopic(selectedModule.id, topic.id)}
                                                        className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-[10px] rounded-lg transition-all font-bold flex items-center gap-1 cursor-pointer"
                                                      >
                                                        Save
                                                      </button>
                                                      <button
                                                        onClick={() => setEditingSubtopicId(null)}
                                                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[10px] rounded-lg transition-all font-bold cursor-pointer"
                                                      >
                                                        Cancel
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div
                                                    onClick={() => toggleSubtopicExpand(sub.id)}
                                                    className="flex items-center gap-2 cursor-pointer select-none group/subTitle"
                                                  >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/70"></span>
                                                    <span className="text-xs text-brand-text font-semibold hover:text-brand-cyan transition-colors">
                                                      {sub.title}
                                                    </span>
                                                    <span className="text-brand-muted hover:text-brand-cyan transition-all transform shrink-0">
                                                      {expandedSubtopics[sub.id] !== false ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                      ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                      )}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Subtopic Outlines / CRUD controls */}
                                              <div className="flex items-center gap-2 shrink-0">
                                                {/* Move Up/Down Subtopic */}
                                                <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                  <button
                                                    disabled={subIdx === 0}
                                                    onClick={() => moveSubtopic(selectedModule.id, topic.id, subIdx, "up")}
                                                    className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                    title="Move Up"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                  </button>
                                                  <button
                                                    disabled={subIdx === (topic.subtopics || []).length - 1}
                                                    onClick={() => moveSubtopic(selectedModule.id, topic.id, subIdx, "down")}
                                                    className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                    title="Move Down"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                  </button>
                                                </div>

                                                <div className="w-[1px] h-3 bg-brand-border/40"></div>

                                                <button
                                                  onClick={() => startEditSubtopic(sub.id, sub.title)}
                                                  className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                  title="Rename Subtopic"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                </button>
                                                <button
                                                  onClick={() => deleteSubtopic(selectedModule.id, topic.id, sub.id)}
                                                  className="text-brand-muted hover:text-red-400 p-0.5"
                                                  title="Delete Subtopic"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                </button>
                                              </div>
                                            </div>

                                            {/* Subtopic Materials Management Section */}
                                            {expandedSubtopics[sub.id] !== false && (
                                              <div className="mt-2.5 pt-2 border-t border-brand-border/10 flex flex-col">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] uppercase font-bold text-brand-muted">
                                                  Subtopic Materials ({(sub.materials || []).length})
                                                </span>
                                                
                                                {/* Subtopic Action Buttons */}
                                                <div className="flex items-center gap-1.5">
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "text" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Reading
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "video" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Video
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "image" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Image
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "file" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Doc
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Adding Material Form (Subtopic) */}
                                              {addingMaterialTo?.type === "subtopic" && addingMaterialTo?.subtopicId === sub.id && (
                                                <div className="bg-brand-card border border-brand-cyan/30 rounded-xl p-3.5 mb-3 flex flex-col gap-2.5 shadow-md">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                                                      New {addingMaterialTo.materialType} Material
                                                    </span>
                                                    <button
                                                      onClick={() => setAddingMaterialTo(null)}
                                                      className="text-[9px] text-brand-muted hover:text-red-400 font-semibold"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                  
                                                  <input
                                                    value={matTitle}
                                                    onChange={(e) => setMatTitle(e.target.value)}
                                                    placeholder="Material Title (e.g. CLI Tutorial, Diagram image)"
                                                    className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                  />

                                                  {addingMaterialTo.materialType === "text" && (
                                                    <div className="flex flex-col animate-fadeIn">
                                                      {renderFormattingToolbar(`mat-textarea-new-sub-${sub.id}`, false)}
                                                      {isVisualMode ? (
                                                        <div
                                                          id={`mat-textarea-new-sub-${sub.id}`}
                                                          contentEditable
                                                          dangerouslySetInnerHTML={{ __html: matContent }}
                                                          onBlur={(e) => setMatContent(e.target.innerHTML)}
                                                          data-placeholder="Write reading description..."
                                                          className="bg-brand-bg border border-brand-border rounded-b-lg p-3 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 min-h-[80px] overflow-y-auto"
                                                        />
                                                      ) : (
                                                        <textarea
                                                          id={`mat-textarea-new-sub-${sub.id}`}
                                                          value={matContent}
                                                          onChange={(e) => setMatContent(e.target.value)}
                                                          placeholder="Write reading description..."
                                                          className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-20 resize-y font-mono"
                                                        />
                                                      )}
                                                      {/* STYLE selection inside text editing */}
                                                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">STYLE:</span>
                                                        {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                          <button
                                                            key={style}
                                                            type="button"
                                                            onClick={() => setMatTextStyle(style)}
                                                            className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                              matTextStyle === style
                                                                ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                : "bg-brand-bg border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                            }`}
                                                          >
                                                            {style}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {addingMaterialTo.materialType === "video" && (
                                                    <input
                                                      value={matContent}
                                                      onChange={(e) => setMatContent(e.target.value)}
                                                      placeholder="Paste YouTube Video Link..."
                                                      className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                    />
                                                  )}

                                                  {(addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && (
                                                    <div className="flex flex-col gap-2">
                                                      <div className="flex items-center gap-2">
                                                        <label className="text-[10px] font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap">
                                                          <span>Choose File</span>
                                                          <input
                                                            type="file"
                                                            className="hidden"
                                                            accept={addingMaterialTo.materialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                            onChange={(e) => handleMaterialFileUpload(e, addingMaterialTo.materialType as 'image' | 'file')}
                                                          />
                                                        </label>
                                                        {matFileName ? (
                                                          <span className="text-[9px] text-brand-text truncate max-w-[140px]">
                                                            {matFileName}
                                                          </span>
                                                        ) : (
                                                          <span className="text-[9px] text-brand-muted">No file.</span>
                                                        )}
                                                      </div>
                                                      {addingMaterialTo.materialType === "image" && matContent && (
                                                        <div className="mt-2.5 w-full max-w-[480px] border border-brand-border/30 rounded-lg p-1.5 bg-brand-bg/40 shadow-md shadow-black/25 animate-fadeIn">
                                                          <img
                                                            src={matContent}
                                                            alt="Image Preview"
                                                            className="w-full max-h-[280px] rounded object-contain mx-auto"
                                                          />
                                                        </div>
                                                      )}
                                                      {addingMaterialTo.materialType === "image" && (
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">ALIGN:</span>
                                                          {(["left", "center", "right"] as const).map((align) => (
                                                            <button
                                                              key={align}
                                                              type="button"
                                                              onClick={() => setMatImageAlign(align)}
                                                              className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                                matImageAlign === align
                                                                  ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                  : "bg-brand-bg border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                              }`}
                                                            >
                                                              {align}
                                                            </button>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  <button
                                                    onClick={() => saveMaterial(selectedModule.id, topic.id, sub.id)}
                                                    disabled={
                                                      (addingMaterialTo.materialType === "text" && !matContent.trim()) ||
                                                      (addingMaterialTo.materialType === "video" && !matContent.trim()) ||
                                                      ((addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && !matContent)
                                                    }
                                                    className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                                  >
                                                    Save
                                                  </button>
                                                </div>
                                              )}

                                              {/* Render Materials List (Subtopic) */}
                                              {(sub.materials || []).length === 0 ? (
                                                <span className="text-[9px] text-brand-muted/70 italic py-1">
                                                  No materials.
                                                </span>
                                              ) : (
                                                <div className="flex flex-col gap-1.5 mt-1">
                                                  {(sub.materials || []).map((mat, matIdx) => (
                                                    editingMaterialId === mat.id ? (
                                                      <div key={mat.id} className="bg-brand-card border border-brand-cyan/30 rounded-xl p-3.5 mb-3 flex flex-col gap-2.5 shadow-md">
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                                                            Edit {editingMaterialType} Material
                                                          </span>
                                                          <button
                                                            onClick={cancelEditMaterial}
                                                            className="text-[9px] text-brand-muted hover:text-red-400 font-semibold"
                                                          >
                                                            Cancel
                                                          </button>
                                                        </div>
                                                        
                                                        <input
                                                          value={editingMaterialTitle}
                                                          onChange={(e) => setEditingMaterialTitle(e.target.value)}
                                                          placeholder="Material Title"
                                                          className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                        />

                                                        {editingMaterialType === "text" && (
                                                          <div className="flex flex-col animate-fadeIn">
                                                            {renderFormattingToolbar(`mat-textarea-edit-sub-${mat.id}`, true)}
                                                            {isVisualMode ? (
                                                              <div
                                                                id={`mat-textarea-edit-sub-${mat.id}`}
                                                                contentEditable
                                                                dangerouslySetInnerHTML={{ __html: editingMaterialContent }}
                                                                onBlur={(e) => setEditingMaterialContent(e.target.innerHTML)}
                                                                data-placeholder="Write reading description..."
                                                                className="bg-brand-bg border border-brand-border rounded-b-lg p-3 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 min-h-[80px] overflow-y-auto"
                                                              />
                                                            ) : (
                                                              <textarea
                                                                id={`mat-textarea-edit-sub-${mat.id}`}
                                                                value={editingMaterialContent}
                                                                onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                                placeholder="Write reading description..."
                                                                className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-20 resize-y font-mono"
                                                              />
                                                            )}
                                                            {/* STYLE selection inside editing */}
                                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                              <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">STYLE:</span>
                                                              {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                                <button
                                                                  key={style}
                                                                  type="button"
                                                                  onClick={() => setEditingMaterialTextStyle(style)}
                                                                  className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                                    editingMaterialTextStyle === style
                                                                      ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                      : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                                  }`}
                                                                >
                                                                  {style}
                                                                </button>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {editingMaterialType === "video" && (
                                                          <input
                                                            value={editingMaterialContent}
                                                            onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                            placeholder="Paste YouTube Video Link..."
                                                            className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                          />
                                                        )}

                                                        {(editingMaterialType === "image" || editingMaterialType === "file") && (
                                                          <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                              <label className="text-[10px] font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap">
                                                                <span>Upload New File</span>
                                                                <input
                                                                  type="file"
                                                                  className="hidden"
                                                                  accept={editingMaterialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                                  onChange={(e) => handleEditMaterialFileUpload(e, editingMaterialType as 'image' | 'file')}
                                                                />
                                                              </label>
                                                              {editingMaterialFileName ? (
                                                                <span className="text-[9px] text-brand-text truncate max-w-[140px]">
                                                                  {editingMaterialFileName}
                                                                </span>
                                                              ) : (
                                                                <span className="text-[9px] text-brand-muted truncate max-w-[140px]">
                                                                  {editingMaterialContent.startsWith("data:") ? "Existing base64" : editingMaterialContent}
                                                                </span>
                                                              )}
                                                            </div>
                                                            {editingMaterialType === "image" && editingMaterialContent && (
                                                              <div className="mt-2.5 w-full max-w-[480px] border border-brand-border/30 rounded-lg p-1.5 bg-brand-bg/40 shadow-md shadow-black/25 animate-fadeIn">
                                                                <img
                                                                  src={editingMaterialContent}
                                                                  alt="Image Preview"
                                                                  className="w-full max-h-[280px] rounded object-contain mx-auto"
                                                                />
                                                              </div>
                                                            )}
                                                            {editingMaterialType === "image" && (
                                                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">ALIGN:</span>
                                                                {(["left", "center", "right"] as const).map((align) => (
                                                                  <button
                                                                    key={align}
                                                                    type="button"
                                                                    onClick={() => setEditingMaterialImageAlign(align)}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] capitalize border transition-all ${
                                                                      editingMaterialImageAlign === align
                                                                        ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                                        : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                                    }`}
                                                                  >
                                                                    {align}
                                                                  </button>
                                                                ))}
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}

                                                        <button
                                                          onClick={() => saveEditMaterial(selectedModule.id, topic.id, sub.id)}
                                                          disabled={
                                                            (editingMaterialType === "text" && !editingMaterialContent.trim()) ||
                                                            (editingMaterialType === "video" && !editingMaterialContent.trim()) ||
                                                            ((editingMaterialType === "image" || editingMaterialType === "file") && !editingMaterialContent)
                                                          }
                                                          className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                                        >
                                                          Save Changes
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div
                                                        key={mat.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                          setDraggedMatInfo({ topicId: topic.id, subtopicId: sub.id, index: matIdx });
                                                          e.dataTransfer.effectAllowed = "move";
                                                          e.dataTransfer.setData("text/plain", matIdx.toString());
                                                        }}
                                                        onDragEnd={() => {
                                                          setDraggedMatInfo(null);
                                                          setDragOverInfo(null);
                                                        }}
                                                        onDragOver={(e) => {
                                                          e.preventDefault();
                                                        }}
                                                        onDragEnter={() => {
                                                          if (draggedMatInfo && draggedMatInfo.topicId === topic.id && draggedMatInfo.subtopicId === sub.id) {
                                                            setDragOverInfo({ topicId: topic.id, subtopicId: sub.id, index: matIdx });
                                                          }
                                                        }}
                                                        onDrop={() => {
                                                          if (draggedMatInfo && draggedMatInfo.topicId === topic.id && draggedMatInfo.subtopicId === sub.id) {
                                                            reorderMaterial(selectedModule.id, topic.id, sub.id, draggedMatInfo.index, matIdx);
                                                          }
                                                          setDraggedMatInfo(null);
                                                          setDragOverInfo(null);
                                                        }}
                                                        className={`flex flex-col gap-1.5 bg-brand-bg/20 border rounded p-2 hover:border-brand-border/40 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                                          draggedMatInfo?.topicId === topic.id && draggedMatInfo?.subtopicId === sub.id && draggedMatInfo?.index === matIdx
                                                            ? "opacity-30 border-dashed border-brand-cyan/50 bg-brand-bg/50 scale-[0.98]"
                                                            : dragOverInfo?.topicId === topic.id && dragOverInfo?.subtopicId === sub.id && dragOverInfo?.index === matIdx
                                                            ? "border-brand-cyan bg-brand-cyan/5 scale-[1.01] shadow-md shadow-brand-cyan/5"
                                                            : "border-brand-border/20"
                                                        }`}
                                                      >
                                                        <div className="flex items-center justify-between w-full">
                                                          <div className="flex items-center gap-2 truncate mr-3">
                                                            {/* Drag Handle grip */}
                                                            <div className="text-brand-muted/50 hover:text-brand-cyan/80 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors">
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                                            </div>
                                                            <span className="text-[11px] font-medium text-brand-text truncate">
                                                              {mat.title} <span className="text-[9px] text-brand-muted font-normal font-mono">({mat.type})</span>
                                                            </span>
                                                          </div>

                                                          <div className="flex items-center gap-1 shrink-0">
                                                            {/* Reordering */}
                                                            <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40">
                                                              <button
                                                                disabled={matIdx === 0}
                                                                onClick={() => moveMaterial(selectedModule.id, topic.id, sub.id, matIdx, "up")}
                                                                className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                              </button>
                                                              <button
                                                                disabled={matIdx === (sub.materials || []).length - 1}
                                                                onClick={() => moveMaterial(selectedModule.id, topic.id, sub.id, matIdx, "down")}
                                                                className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                              </button>
                                                            </div>

                                                            <button
                                                              onClick={() => startEditMaterial(topic.id, sub.id, mat)}
                                                              className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                              title="Edit Material"
                                                            >
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                            </button>

                                                            <button
                                                              onClick={() => deleteMaterial(selectedModule.id, topic.id, sub.id, mat.id)}
                                                              className="text-brand-muted hover:text-red-400 p-0.5"
                                                            >
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            )}

                                          </div>
                                        ))}
                                      </div>

                                      {/* Add Subtopic Outliner Input */}
                                      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          value={subtopicTitles[topic.id] || ""}
                                          onChange={(e) =>
                                            setSubtopicTitles(prev => ({
                                              ...prev,
                                              [topic.id]: e.target.value
                                            }))
                                          }
                                          placeholder="Add new subtopic outline..."
                                          className="flex-grow bg-brand-bg/40 border border-brand-border/40 rounded-lg px-2.5 py-1.5 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/60 placeholder-brand-muted/70"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") addSubtopic(selectedModule.id, topic.id);
                                          }}
                                        />
                                        <button
                                          onClick={() => addSubtopic(selectedModule.id, topic.id)}
                                          disabled={!(subtopicTitles[topic.id] || "").trim()}
                                          className="bg-brand-cyan/15 hover:bg-brand-cyan/25 disabled:opacity-20 text-brand-cyan text-[11px] font-semibold px-3 rounded-lg border border-brand-cyan/20 transition-colors whitespace-nowrap"
                                        >
                                          Add Subtopic
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* STUDENT PREVIEW MODE */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-start">
                        {/* Simulated Left Navigation Tree */}
                        <div className="lg:col-span-1 bg-brand-bg/60 border border-brand-border rounded-xl p-3 flex flex-col gap-3 shadow-inner min-w-0">
                          <span className="text-[9px] uppercase font-bold text-brand-cyan px-2.5 mb-1.5">
                            Outline Navigation
                          </span>

                          {/* Subject Overview Accordion */}
                          <div className="border border-brand-border/40 rounded-xl overflow-hidden">
                            <button
                              onClick={() => {
                                setExpandedSubjectOverview(!expandedSubjectOverview);
                                setPreviewSpecialItem("announcements");
                                setPreviewTopic(null);
                                setPreviewSubtopic(null);
                              }}
                              className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors border-b border-brand-border/20 hover:bg-brand-bg/85 ${previewSpecialItem !== null
                                  ? "bg-brand-cyan/15 text-brand-cyan font-bold border-l-2 border-l-brand-cyan"
                                  : "bg-brand-bg/50 text-brand-text"
                                }`}
                            >
                              <div className="flex-grow min-w-0 pr-2">
                                <span className={`text-[9px] uppercase tracking-wider font-semibold ${previewSpecialItem !== null ? "text-brand-cyan" : "text-brand-cyan/70"}`}>
                                  General
                                </span>
                                <h4 className="text-xs font-bold mt-0.5 whitespace-normal break-words leading-tight">Subject Overview</h4>
                              </div>
                              <span className="text-brand-muted shrink-0">
                                {expandedSubjectOverview ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                )}
                              </span>
                            </button>

                            {expandedSubjectOverview && (
                              <div className="p-1.5 flex flex-col gap-1 bg-brand-card/30">
                                {/* Announcements */}
                                <button
                                  onClick={() => {
                                    setPreviewSpecialItem("announcements");
                                    setPreviewTopic(null);
                                    setPreviewSubtopic(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${previewSpecialItem === "announcements"
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
                                    setPreviewSpecialItem("self-introduction");
                                    setPreviewTopic(null);
                                    setPreviewSubtopic(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${previewSpecialItem === "self-introduction"
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
                                    setPreviewSpecialItem("subject-guide");
                                    setPreviewTopic(null);
                                    setPreviewSubtopic(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${previewSpecialItem === "subject-guide"
                                      ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                      : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                    }`}
                                >
                                  <span>📄</span>
                                  <span>[MUST READ] Guide</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Module Topics Box container */}
                          {modules.map((mod) => {
                            const isModExpanded = previewExpandedModules[mod.id] !== false;

                            return (
                              <div key={mod.id} className="border border-brand-border/40 rounded-xl overflow-hidden mb-3 last:mb-0">
                                {/* Module Header Button */}
                                <button
                                  onClick={() => {
                                    setPreviewExpandedModules(prev => ({ ...prev, [mod.id]: !isModExpanded }));
                                    if (selectedModule?.id !== mod.id) {
                                      const matchedMod = modules.find(m => m.id === mod.id);
                                      if (matchedMod) {
                                        setCurrentModuleId(mod.id);
                                        setPreviewTopic(getPreviewTopics(matchedMod.topics)[0] || null);
                                        setPreviewSubtopic(null);
                                        setPreviewSpecialItem(null);
                                      }
                                    }
                                  }}
                                  className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors border-b border-brand-border/20 hover:bg-brand-bg/85 ${
                                    selectedModule?.id === mod.id && previewSpecialItem === null
                                      ? "bg-brand-cyan/15 text-brand-cyan font-bold border-l-2 border-l-brand-cyan"
                                      : "bg-brand-bg/50 text-brand-text"
                                  }`}
                                >
                                  <div className="flex-grow min-w-0 pr-2">
                                    <span className={`text-[8px] uppercase tracking-wider font-semibold ${selectedModule?.id === mod.id && previewSpecialItem === null ? "text-brand-cyan" : "text-brand-cyan/70"}`}>
                                      Module
                                    </span>
                                    <h4 className="text-xs font-bold mt-0.5 whitespace-normal break-words leading-tight">{mod.title}</h4>
                                  </div>
                                  <span className="text-brand-muted shrink-0">
                                    {isModExpanded ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    )}
                                  </span>
                                </button>

                                {isModExpanded && (
                                  <div className="p-1.5 flex flex-col gap-1 bg-brand-card/30">
                                    {mod.pretest && mod.pretest.length > 0 && (
                                      <button
                                        onClick={() => {
                                          setCurrentModuleId(mod.id);
                                          setPreviewSpecialItem("pretest");
                                          setPreviewTopic(null);
                                          setPreviewSubtopic(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                          previewSpecialItem === "pretest" && selectedModule?.id === mod.id
                                            ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                            : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                        }`}
                                      >
                                        <span>📝</span>
                                        <span>Module Pre-test</span>
                                      </button>
                                    )}

                                    {getPreviewTopics(mod.topics).length === 0 ? (
                                      <div className="text-[10px] text-brand-muted/70 px-2.5 py-1 italic">
                                        No topics outlined yet
                                      </div>
                                    ) : (
                                      getPreviewTopics(mod.topics).map((t) => {
                                        const isTopicSelected = previewTopic?.id === t.id && !previewSubtopic && previewSpecialItem === null && selectedModule?.id === mod.id;
                                        const hasSubtopics = t.subtopics && t.subtopics.length > 0;
                                        const isExpanded = previewExpandedTopics[t.id] === true;

                                        return (
                                          <div key={t.id} className="flex flex-col gap-1">
                                            <div
                                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                                                isTopicSelected
                                                  ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                                  : (previewTopic?.id === t.id && previewSpecialItem === null && selectedModule?.id === mod.id)
                                                    ? "bg-brand-cyan/10 text-brand-text font-semibold border border-brand-cyan/20"
                                                    : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                              }`}
                                              onClick={() => {
                                                setCurrentModuleId(mod.id);
                                                setPreviewTopic(t);
                                                setPreviewSubtopic(null);
                                                setPreviewSpecialItem(null);
                                                if (hasSubtopics) {
                                                  setPreviewExpandedTopics(prev => ({ ...prev, [t.id]: true }));
                                                }
                                              }}
                                            >
                                              <span className="text-xs truncate flex-grow">Topic: {t.title}</span>
                                              {hasSubtopics && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewExpandedTopics(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                                  }}
                                                  className={`p-0.5 shrink-0 ${isTopicSelected ? 'text-brand-bg hover:text-brand-bg/80' : 'text-brand-muted hover:text-brand-text'}`}
                                                >
                                                  {isExpanded ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                                  ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                  )}
                                                </button>
                                              )}
                                            </div>

                                            {hasSubtopics && isExpanded && (
                                              <div className="pl-3 border-l border-brand-border/40 ml-3 flex flex-col gap-1 py-0.5">
                                                {t.subtopics!.map((sub) => {
                                                  const isSubSelected = previewSubtopic?.id === sub.id && previewSpecialItem === null && selectedModule?.id === mod.id;
                                                  return (
                                                    <button
                                                      key={sub.id}
                                                      onClick={() => {
                                                        setCurrentModuleId(mod.id);
                                                        setPreviewTopic(t);
                                                        setPreviewSubtopic(sub);
                                                        setPreviewSpecialItem(null);
                                                      }}
                                                      className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] truncate transition-colors ${
                                                        isSubSelected
                                                          ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                                          : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/25"
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

                        {/* Simulated Right Content Frame */}
                        <div className="lg:col-span-2 bg-brand-bg/20 border border-brand-border rounded-xl p-4 min-h-[320px] flex flex-col shadow-sm min-w-0">
                          {previewSpecialItem !== null ? (
                            renderPreviewSpecialWorkspaceItem()
                          ) : previewTopic ? (
                            <>
                              {/* Content Header */}
                              <div className="border-b border-brand-border/20 pb-2 mb-4">
                                <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">
                                  {previewSubtopic ? "Subtopic Study Material" : "Topic Study Material"}
                                </span>
                                <h4 className="text-sm font-bold text-brand-text mt-0.5">
                                  {previewSubtopic ? previewSubtopic.title : previewTopic.title}
                                </h4>
                              </div>

                              {/* Material Frame Output */}
                              {previewTopic.id === 999999 ? (
                                <InteractiveSubnettingActivity
                                  onComplete={() => {
                                    showAlert("Preview Completed", "Simulation complete! In student mode, this marks the activity as finished.");
                                  }}
                                  isCompleted={false}
                                  handleSelectNextTopic={() => {
                                    showAlert("Navigation Check", "In student mode, this would advance to the next module/topic.");
                                  }}
                                  moduleId={selectedModule.id}
                                />
                              ) : previewTopic.id === 888888 ? (
                                // Render Simulated Discussion Forum
                                <div className="flex-grow flex flex-col h-full animate-scaleIn">
                                  <p className="text-brand-muted text-[11px] mb-2">
                                    Ask questions, share subnetting tips, and collaborate on this module's topics.
                                  </p>

                                  {/* Scrollable chat container */}
                                  <div
                                    className="flex-grow overflow-y-auto max-h-[220px] border border-brand-border/40 bg-brand-bg/25 rounded-2xl p-3 flex flex-col gap-2.5 scrollbar-thin mb-3"
                                  >
                                    {previewForumPosts.map((post) => {
                                      const isMsgWarning = post.isWarning === true;
                                      const isMsgModerator = post.role === "Professor" || post.role === "Admin";
                                      const displayAuthorName = post.name;
                                      return (
                                        <div
                                          key={post.id}
                                          className={`border rounded-xl p-2.5 flex gap-2.5 animate-scaleIn transition-all ${
                                            isMsgWarning
                                              ? "bg-amber-500/5 border-amber-500/25 border-l-4 border-l-amber-500"
                                              : "bg-brand-bg/50 border border-brand-border/35"
                                          }`}
                                        >
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-brand-bg select-none bg-gradient-to-br ${
                                            isMsgWarning
                                              ? "from-amber-500 to-yellow-600"
                                              : isMsgModerator
                                                ? "from-emerald-400 to-teal-600"
                                                : "from-brand-cyan to-blue-600"
                                          }`}>
                                            {getAvatarInitials(displayAuthorName)}
                                          </div>
                                          <div className="flex-grow flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px] font-bold text-brand-text">{displayAuthorName}</span>
                                              <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded uppercase select-none ${
                                                isMsgModerator
                                                  ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                                                  : "bg-brand-bg border border-brand-border/40 text-brand-muted"
                                              }`}>
                                                {post.role}
                                              </span>
                                              <span className="text-[8px] text-brand-muted font-mono">
                                                {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            <p className="text-[11px] whitespace-pre-wrap leading-relaxed text-brand-text/90">
                                              {post.message}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Input Form */}
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!previewForumMsg.trim()) return;
                                      const newPost = {
                                        id: Date.now(),
                                        name: "Professor (You)",
                                        role: "Professor",
                                        message: previewForumMsg.trim(),
                                        createdAt: new Date().toISOString()
                                      };
                                      setPreviewForumPosts([...previewForumPosts, newPost]);
                                      setPreviewForumMsg("");
                                    }}
                                    className="flex gap-2 shrink-0"
                                  >
                                    <input
                                      type="text"
                                      value={previewForumMsg}
                                      onChange={(e) => setPreviewForumMsg(e.target.value)}
                                      placeholder="Post a simulated message to the discussion..."
                                      className="flex-grow bg-brand-bg/50 border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-xl px-3 py-2 text-xs text-brand-text placeholder-brand-muted/70"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!previewForumMsg.trim()}
                                      className="px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                                    >
                                      Post
                                    </button>
                                  </form>
                                </div>
                              ) : ((previewSubtopic ? previewSubtopic.materials : previewTopic.materials) || []).length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-brand-border/30 rounded-xl">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>
                                  <span className="text-xs font-bold">No Materials Posted</span>
                                  <span className="text-[10px] text-brand-muted mt-0.5">Switch back to Builder mode to add study sheets, images or videos.</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  {((previewSubtopic ? previewSubtopic.materials : previewTopic.materials) || []).map((mat, idx) => {
                                    const embedUrl = mat.type === "video" ? getYouTubeEmbedUrl(mat.content) : null;
                                    
                                    return (
                                      <div key={mat.id} className="flex flex-col gap-2 pb-4 border-b border-brand-border/10 last:border-b-0 last:pb-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-mono text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.5 rounded">
                                            Material {idx + 1}
                                          </span>
                                          <span className="font-bold text-xs text-brand-text">
                                            {mat.title}
                                          </span>
                                        </div>

                                        {/* TEXT */}
                                        {mat.type === "text" && (
                                          <div
                                            className={`whitespace-pre-wrap text-xs md:text-sm leading-relaxed bg-brand-bg/30 p-4 border border-brand-border/30 rounded-xl text-brand-text/90 ${
                                              mat.textStyle === "bold" ? "font-bold text-brand-text" :
                                              mat.textStyle === "italic" ? "italic text-brand-text/85 pl-3 border-l border-brand-border/20" :
                                              mat.textStyle === "heading" ? "text-sm md:text-base font-extrabold text-brand-cyan border-b border-brand-border/20 pb-1 mt-2 mb-1" :
                                              mat.textStyle === "quote" ? "border-l-4 border-brand-cyan pl-4 py-2 italic text-brand-muted bg-brand-cyan/5 rounded-r-lg my-2" :
                                              mat.textStyle === "code" ? "font-mono bg-black/50 border border-brand-border/55 px-3 py-2 rounded-lg text-emerald-400 text-[11px] my-2 overflow-x-auto block leading-normal" :
                                              "text-brand-text/90"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: mat.content }}
                                          />
                                        )}

                                        {/* VIDEO */}
                                        {mat.type === "video" && (
                                          <div className="w-full">
                                            {embedUrl ? (
                                              <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border bg-brand-bg shadow-sm">
                                                <iframe
                                                  src={embedUrl}
                                                  allowFullScreen
                                                  className="absolute top-0 left-0 w-full h-full border-0"
                                                ></iframe>
                                              </div>
                                            ) : mat.content.startsWith('yt-search:') ? (
                                              <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mat.content.replace('yt-search:', ''))}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/15 via-red-500/5 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text text-xs hover:shadow-md transition-all group cursor-pointer"
                                              >
                                                <div className="p-2.5 bg-red-600 rounded-lg group-hover:bg-red-500 transition-colors shrink-0 shadow-sm">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                  <span className="font-semibold text-brand-text truncate">{mat.title}</span>
                                                  <span className="text-[9px] text-red-400/90 font-medium flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg>
                                                    Watch on YouTube
                                                  </span>
                                                </div>
                                              </a>
                                            ) : (
                                              <a
                                                href={mat.content}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/10 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text text-xs hover:shadow-md transition-all group"
                                              >
                                                <div className="p-2 bg-red-500/15 rounded-lg group-hover:bg-red-500/25 transition-colors shrink-0">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                  <span className="font-semibold text-brand-text truncate">{mat.title}</span>
                                                  <span className="text-[9px] text-red-400/80 font-medium">▶ Watch Video</span>
                                                </div>
                                              </a>
                                            )}
                                          </div>
                                        )}

                                        {/* IMAGE */}
                                        {mat.type === "image" && (
                                          <div className={`flex w-full ${
                                            mat.imageAlign === "left" ? "justify-start" :
                                            mat.imageAlign === "right" ? "justify-end" :
                                            "justify-center"
                                          }`}>
                                            {mat.content ? (
                                              <div className="border border-brand-border/30 bg-brand-bg/25 rounded-xl p-2.5 flex justify-center w-full">
                                                <img src={mat.content} alt={mat.title} className="w-full max-w-[800px] h-auto rounded max-h-[600px] object-contain" />
                                              </div>
                                            ) : (
                                              <div className="border border-dashed border-brand-border/50 bg-brand-bg/15 rounded-xl p-4 flex flex-col items-center gap-2 max-w-xs">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/60"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                <span className="text-[10px] text-brand-muted text-center">{mat.title}</span>
                                                <span className="text-[8px] text-brand-muted/50">Image not available from PDF import</span>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* FILE */}
                                        {mat.type === "file" && (
                                          <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 truncate">
                                              <div className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-lg border border-brand-cyan/15 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                              </div>
                                              <div className="truncate flex flex-col">
                                                <span className="text-xs font-semibold text-brand-text truncate">
                                                  {mat.fileName || "Download Document"}
                                                </span>
                                                <span className="text-[9px] text-brand-muted mt-0.5">
                                                  {mat.fileSize || "unknown"} • Document
                                                </span>
                                              </div>
                                            </div>
                                            <a
                                              href={mat.content}
                                              download={mat.fileName || "document"}
                                              className="px-3 py-1.5 bg-brand-cyan text-brand-bg text-[10px] font-bold rounded-lg whitespace-nowrap"
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
                            </>
                          ) : (
                            <div className="flex-grow flex items-center justify-center text-center p-6 border border-dashed border-brand-border/30 rounded-xl">
                              <span className="text-[10px] text-brand-muted">Select a topic from the selector outline.</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </>
                  )}

                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-brand-border/40 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  <h4 className="font-bold text-sm text-brand-text">No Module Selected</h4>
                  <p className="text-xs text-brand-muted mt-1 max-w-[280px]">
                    Choose a module from the left panel to structure topics, upload resources, and add subtopics.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border w-full max-w-3xl max-h-[90vh] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden text-brand-text">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Auto-Generate Module from Document
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Parse PDF or DOCX documents into an organized module outline.</p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedModule(null);
                  setImportFile(null);
                  setImportError("");
                }}
                className="text-brand-muted hover:text-brand-text p-1.5 hover:bg-brand-bg rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body / Steps */}
            <div className="flex-grow overflow-y-auto pr-1">
              {/* STEP 1: Upload */}
              {!isParsing && !parsedModule && (
                <div className="flex flex-col gap-5 py-4">
                  <div className="border-2 border-dashed border-brand-border/60 hover:border-brand-cyan/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-brand-bg/10 hover:bg-brand-bg/20 transition-all relative">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImportFile(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    <div className="p-4 bg-brand-cyan/10 text-brand-cyan rounded-full mb-3 border border-brand-cyan/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h1"/></svg>
                    </div>

                    <h4 className="text-sm font-bold">Select File or Drag & Drop Here</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-sm">
                      Upload standard `.docx` or `.pdf` curriculum sheets (up to 20MB).
                    </p>
                    {importFile && (
                      <div className="mt-4 px-3 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-brand-cyan text-xs font-semibold flex items-center gap-1.5">
                        <span>Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-4 flex flex-col gap-2">
                    <h5 className="text-xs font-bold text-brand-cyan">How It Works:</h5>
                    <ul className="text-[11px] text-brand-muted space-y-1.5 list-disc list-inside">
                      <li><strong>Topics & Subtopics:</strong> Auto-split based on headings and markers.</li>
                      <li><strong>Readings:</strong> Long paragraphs converted to text pages.</li>
                      <li><strong>Videos:</strong> YouTube links detected and embedded as video panels.</li>
                      <li><strong>Images:</strong> DOCX embedded pictures extracted as inline image cards.</li>
                    </ul>
                  </div>

                  {importError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs font-semibold">
                      {importError}
                    </div>
                  )}

                  <button
                    onClick={handleFileImport}
                    disabled={!importFile}
                    className="w-full bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg font-bold py-3 rounded-lg text-sm transition-colors mt-2"
                  >
                    Start Automatic Scanning
                  </button>
                </div>
              )}

              {/* STEP 2: Parsing Loading State */}
              {isParsing && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="relative w-16 h-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-cyan"></div>
                    <div className="absolute inset-2 bg-brand-card rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan animate-pulse"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text animate-pulse">Scanning Document Structure...</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-sm">
                      Our system is analyzing text blocks, headings, extraction points, and image attachments. This may take a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview Structure */}
              {parsedModule && (
                <div className="flex flex-col gap-4 py-2">
                  <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-cyan uppercase tracking-wider">Generated Module Name:</label>
                    <input
                      value={parsedModule.title}
                      onChange={(e) => setParsedModule({ ...parsedModule, title: e.target.value })}
                      placeholder="Enter module name"
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Extracted Structure Preview:</span>
                    <span className="text-[10px] text-brand-muted">
                      {parsedModule.topics.length} topics • {parsedModule.topics.reduce((s, t) => s + (t.subtopics?.length || 0), 0)} subtopics
                    </span>
                  </div>

                  {/* Render Parsed Outline */}
                  <div className="border border-brand-border/60 rounded-xl overflow-hidden bg-brand-bg/10 max-h-[340px] overflow-y-auto flex flex-col gap-3 p-4">
                    {parsedModule.topics.length === 0 ? (
                      <div className="text-center py-6 text-xs text-brand-muted italic">
                        No headings or topics could be parsed from the file content. An empty module structure will be generated.
                      </div>
                    ) : (
                      parsedModule.topics.map((topic, tIdx) => (
                        <div key={topic.id} className="border border-brand-border/30 rounded-lg p-3 bg-brand-card/30 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded">
                              Topic {tIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-brand-text">{topic.title}</span>
                          </div>

                          {/* Render materials preview inside topic */}
                          {(topic.materials || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              {(topic.materials || []).map((m) => (
                                <span key={m.id} className="text-[9px] bg-brand-bg border border-brand-border/50 text-brand-muted px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                  {m.type === 'text' && '📄 Reading'}
                                  {m.type === 'video' && '🎥 Video link'}
                                  {m.type === 'image' && '🖼️ Image'}
                                  <span>{m.title}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Subtopics outline preview */}
                          {(topic.subtopics || []).length > 0 && (
                            <div className="pl-4 flex flex-col gap-2 mt-1 border-l border-brand-border/30 ml-2">
                              {(topic.subtopics || []).map((sub, sIdx) => (
                                <div key={sub.id} className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-brand-muted font-bold">•</span>
                                    <span className="text-[11px] font-semibold text-brand-text/90">{sub.title}</span>
                                  </div>
                                  {(sub.materials || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-3">
                                      {(sub.materials || []).map((sm) => (
                                        <span key={sm.id} className="text-[8px] bg-brand-bg/60 border border-brand-border/40 text-brand-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                                          {sm.type === 'text' && '📄 Reading'}
                                          {sm.type === 'video' && '🎥 Video link'}
                                          {sm.type === 'image' && '🖼️ Image'}
                                          <span>{sm.title}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setParsedModule(null);
                        setImportFile(null);
                      }}
                      className="flex-grow bg-brand-bg hover:bg-brand-bg/75 border border-brand-border text-brand-text font-bold py-2.5 rounded-lg text-xs transition-colors"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={confirmImportModule}
                      className="flex-grow bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded-lg text-xs transition-colors"
                    >
                      Import into Class Curriculum
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      </main>

      {/* Custom Dialog Alert/Confirm Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 transform transition-all scale-100 animate-scaleIn">
            <div>
              <h3 className="font-extrabold text-sm text-brand-text flex items-center gap-2">
                {modalConfig.type === 'confirm' ? '❓' : '🔔'} {modalConfig.title}
              </h3>
              <p className="text-xs text-brand-muted mt-2 leading-relaxed whitespace-pre-line">
                {modalConfig.message}
              </p>
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              {modalConfig.type === 'confirm' && (
                <button
                  onClick={modalConfig.onCancel}
                  className="px-3.5 py-1.5 bg-brand-bg border border-brand-border text-brand-muted text-xs font-semibold rounded-lg hover:text-brand-text transition-colors cursor-pointer select-none"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={modalConfig.onConfirm}
                className="px-4 py-1.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-extrabold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none"
              >
                {modalConfig.type === 'confirm' ? 'Yes, Proceed' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
