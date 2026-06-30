"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const BADGES = [
  {
    id: "simulation-master",
    name: "Simulation Master",
    icon: "🎮",
    criteria: "Complete all interactive simulation activities with a score of 80% or higher.",
    description: "Awarded for exceptional performance in network simulation exercises and hands-on lab activities.",
    color: "from-cyan-500/25 to-blue-500/5 border-cyan-500/30 text-cyan-400"
  },
  {
    id: "competency-badge",
    name: "Competency Badge",
    icon: "🎓",
    criteria: "Pass all module pre-tests and complete all course topics successfully.",
    description: "Demonstrates strong competency and understanding of core networking concepts.",
    color: "from-emerald-500/25 to-teal-500/5 border-emerald-500/30 text-emerald-400"
  },
  {
    id: "consistent-learner",
    name: "Consistent Learner",
    icon: "⚡",
    criteria: "Maintain regular progress and complete learning materials consistently.",
    description: "Recognizes dedication and consistent engagement throughout the entire course.",
    color: "from-amber-500/25 to-orange-500/5 border-amber-500/30 text-amber-400"
  },
  {
    id: "subnetting-expert",
    name: "Subnetting Expert",
    icon: "🔢",
    criteria: "Achieve 80% or higher in Subnetting & IPv4 Addressing competency.",
    description: "Awarded for demonstrating advanced mastery in calculating subnets, binary ANDing, and IPv4 addressing topologies.",
    color: "from-purple-500/25 to-indigo-500/5 border-purple-500/30 text-purple-400"
  },
  {
    id: "vlan-expert",
    name: "VLAN Switching Expert",
    icon: "🔌",
    criteria: "Achieve 80% or higher in Ethernet & Switching (VLANs) competency.",
    description: "Awarded for exceptional configuration of virtual local area networks, access ports, trunks, and local broadcast segments.",
    color: "from-rose-500/25 to-pink-500/5 border-rose-500/30 text-rose-400"
  },
  {
    id: "routing-expert",
    name: "Routing Expert",
    icon: "🔀",
    criteria: "Achieve 80% or higher in Routing Protocols & Static Routing competency.",
    description: "Awarded for showing deep configuration mastery over static routing, backup routes, and multi-network route maps.",
    color: "from-red-500/25 to-orange-600/5 border-red-500/30 text-red-400"
  },
  {
    id: "top-1",
    name: "Top 1 Overall",
    icon: "👑",
    criteria: "Achieve the #1 rank in combined pre-test and interactive activity scores.",
    description: "Awarded to the student who achieves the highest overall score in the entire course.",
    color: "from-yellow-500/30 to-amber-600/10 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
  },
  {
    id: "top-2",
    name: "Top 2 Overall",
    icon: "🥈",
    criteria: "Achieve the #2 rank in combined pre-test and interactive activity scores.",
    description: "Awarded to the student who achieves the second highest overall score in the course.",
    color: "from-slate-400/30 to-slate-500/10 border-slate-400/40 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)]"
  },
  {
    id: "top-3",
    name: "Top 3 Overall",
    icon: "🥉",
    criteria: "Achieve the #3 rank in combined pre-test and interactive activity scores.",
    description: "Awarded to the student who achieves the third highest overall score in the course.",
    color: "from-amber-600/30 to-amber-700/10 border-amber-600/40 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.1)]"
  }
];

function renderBadgeIcon(iconStr: string) {
  switch (iconStr) {
    case "🎮":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-cyan-400">
          <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
          <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
          <rect width="20" height="12" x="2" y="6" rx="3"/>
        </svg>
      );
    case "🎓":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-400">
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
        </svg>
      );
    case "⚡":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-400">
          <path d="M13 2 L3 14 H12 L11 22 L21 10 H12 Z"/>
        </svg>
      );
    case "🔢":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-purple-400">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M9 22V2"/><path d="M15 22V2"/><path d="M2 9h20"/><path d="M2 15h20"/>
        </svg>
      );
    case "🔌":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-rose-400">
          <rect width="16" height="20" x="4" y="2" rx="2"/>
          <rect width="6" height="6" x="9" y="6" rx="1"/>
          <path d="M9 16h6"/><path d="M12 12v4"/>
        </svg>
      );
    case "🔀":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-400">
          <path d="M18 8h4V4"/><path d="M18 16h4v4"/><path d="m2 4 20 16"/><path d="m2 20 7.6-7.6"/><path d="m15 9 7-7"/>
        </svg>
      );
    case "👑":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
          <path d="M3 20h18"/>
        </svg>
      );
    case "🥈":
    case "🥉":
      const colorClass = iconStr === "🥈" ? "text-slate-300" : "text-amber-500";
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${colorClass}`}>
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 space-y-24">
        {/* Intro Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            About <span className="text-brand-cyan">NetMaster</span>
          </h1>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed">
            NetMaster is a state-of-the-art, gamified command center designed for computer networking education. 
            We replace passive reading with active, terminal-driven challenge scenarios.
          </p>
          <div className="inline-flex items-center gap-2 bg-brand-card px-4 py-2 rounded-full text-xs font-mono text-brand-cyan border border-brand-border">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse"></span>
            Version 1.2.6 — Active Simulation Ready
          </div>
        </section>

        {/* Dynamic Methodology Showcase */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              An Applied Approach to <span className="text-brand-cyan">IT Mastery</span>
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              In modern enterprise environments, networking professionals do not answer multiple-choice questions; 
              they troubleshoot routing tables, debug VLAN configurations, and secure boundary gateways. 
              NetMaster mirrors this requirement through a three-phase loop:
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-bold text-brand-cyan text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-brand-text">Immersive Lectures & Quizzes</h3>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Study modular reading resources mapped directly to academic syllabuses. 
                    Test your memory immediately with focused mid-topic pre-tests and end-of-module quizzes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-bold text-brand-cyan text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-brand-text">Interactive Simulation Sandbox</h3>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Practice binary ANDing, subnet calculations, and Cisco CLI commands 
                    in browser-embedded interactive widgets. Build muscle memory before moving to full topologies.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-bold text-brand-cyan text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-brand-text">Packet Tracer & Kathará Virtualization</h3>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Download custom Cisco Packet Tracer labs, configure real virtual routers in Kathará, 
                    and upload configuration scripts for automated, instant assessment grading.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual abstract widget */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 relative overflow-hidden shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
              <div className="text-[10px] text-brand-cyan font-mono tracking-widest uppercase">System Console</div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40"></span>
              </div>
            </div>
            
            <div className="font-mono text-xs text-brand-muted space-y-2 leading-relaxed">
              <p className="text-brand-cyan font-bold">$ netmaster --verify-system</p>
              <p className="text-emerald-400">✔ Checking Kathará interface links... OK</p>
              <p className="text-emerald-400">✔ Checking Subnetting grids... OK</p>
              <p className="text-yellow-400">⚠ 1 warning: Floating Static Route latency high</p>
              <p className="text-brand-text/80">
                [SYSTEM] Ready for OSPF route configuration. Please enter your terminal commands in the simulation lab sandbox.
              </p>
            </div>

            <div className="border-t border-brand-border/40 pt-4 flex justify-between items-center text-[10px] text-brand-muted">
              <span>ESTABLISHED PORT: 3000</span>
              <span>100% ONLINE</span>
            </div>
          </div>
        </section>

        {/* Digital Badges & Achievements */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Digital <span className="text-brand-cyan">Badge Repository</span>
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Demonstrate networking prowess. Earn digital credentials as you complete modules, 
              calculate addressing topologies, and conquer lab challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className={`bg-gradient-to-br ${badge.color} border rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:scale-[1.01] transition-transform`}
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="w-12 h-12 rounded-xl bg-brand-bg/50 border border-brand-border flex items-center justify-center shadow-inner">
                      {renderBadgeIcon(badge.icon)}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-brand-text">{badge.name}</h3>
                      <span className="text-[9px] text-brand-cyan font-mono uppercase tracking-widest font-bold">
                        Credential Award
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-text/80 leading-relaxed mb-4">{badge.description}</p>
                </div>
                <div className="border-t border-brand-border/20 pt-3">
                  <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-brand-muted mb-1">
                    Requirements
                  </h4>
                  <p className="text-[10px] text-brand-muted leading-snug">{badge.criteria}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-brand-card border border-brand-border rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-2xl md:text-3xl font-black mb-4">
            Take Control of Your <span className="text-brand-cyan">Networking Journey</span>
          </h2>
          <p className="text-brand-muted text-sm max-w-lg mx-auto mb-8">
            Create an account, join the leaderboard, and begin configuring live physical router layers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-sm hover:scale-[1.02]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-brand-card hover:bg-brand-border text-brand-text border border-brand-border px-8 py-3 rounded-xl font-bold transition-all text-sm hover:scale-[1.02]"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
