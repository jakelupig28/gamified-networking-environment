"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import labsData from "@/data/packetTracerLabs.json";
import Link from "next/link";

interface Lab {
  id: string;
  title: string;
  description: string;
  moduleId: number;
  competency: string;
  templateFile: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
}

export default function LabsPage() {
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
      case "medium":
        return "bg-amber-500/15 border-amber-500/40 text-amber-400";
      case "hard":
        return "bg-rose-500/15 border-rose-500/40 text-rose-400";
      default:
        return "bg-slate-500/15 border-slate-500/40 text-slate-400";
    }
  };

  const filteredLabs = filterDifficulty === "All"
    ? labsData
    : labsData.filter((lab) => lab.difficulty.toLowerCase() === filterDifficulty.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Packet Tracer <span className="text-brand-cyan">Lab Challenges</span>
          </h1>
          <p className="text-brand-muted text-base">
            Put theory into action with standard Cisco Packet Tracer configuration files. 
            Download templates, complete tasks, and test topology reachability.
          </p>
        </div>

        {/* Instructions / How it works */}
        <section className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
          <h2 className="text-lg font-extrabold mb-6 tracking-tight flex items-center gap-2">
            <span>🛠️</span> How to Complete Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-brand-muted">
            <div className="space-y-2">
              <div className="font-bold text-brand-text flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                Download PKA File
              </div>
              <p className="leading-relaxed">
                Log in to the student command portal, navigate to the topic, and download the custom `.pka` network template file.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-brand-text flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                Configure Topology
              </div>
              <p className="leading-relaxed">
                Open in Cisco Packet Tracer. Configure OSPF routes, static gateways, VLAN IDs, and subnets until completion reaches 100%.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-brand-text flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-mono text-[10px] font-bold">3</span>
                Upload & Verify
              </div>
              <p className="leading-relaxed">
                Submit your completed configuration file to the portal. The automated grading system will verify host ping telemetry and award XP!
              </p>
            </div>
          </div>
        </section>

        {/* Labs Grid */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
            <h2 className="text-xl font-bold tracking-tight">Available Labs</h2>
            
            <div className="flex bg-brand-card p-1 rounded-xl border border-brand-border text-xs">
              {["All", "Easy", "Medium", "Hard"].map((difficulty) => {
                const isActive = filterDifficulty === difficulty;
                return (
                  <button
                    key={difficulty}
                    onClick={() => setFilterDifficulty(difficulty)}
                    className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-brand-cyan text-brand-bg shadow-md"
                        : "text-brand-muted hover:text-brand-text"
                    }`}
                  >
                    {difficulty}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLabs.map((lab: Lab) => (
              <div
                key={lab.id}
                className="bg-brand-card border border-brand-border/60 hover:border-brand-cyan/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:scale-[1.01] transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`border text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-wider ${getDifficultyStyles(lab.difficulty)}`}>
                      {lab.difficulty}
                    </span>
                    <span className="text-[10px] text-brand-muted font-mono tracking-wider font-semibold">
                      ID: {lab.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold tracking-tight text-brand-text">
                    {lab.title}
                  </h3>

                  <p className="text-xs text-brand-muted leading-relaxed">
                    {lab.description}
                  </p>
                </div>

                <div className="border-t border-brand-border/40 pt-4 mt-6 flex items-center justify-between text-[10px] text-brand-muted">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider font-extrabold">Mapped Competency</span>
                    <span className="font-bold text-brand-cyan mt-0.5 block">{lab.competency}</span>
                  </div>
                  
                  <Link
                    href="/login"
                    className="bg-brand-bg hover:bg-brand-card-light text-brand-text border border-brand-border py-2 px-4 rounded-lg font-bold transition-all hover:scale-[1.02] uppercase tracking-widest text-[9px]"
                  >
                    View Lab
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kathara Sandbox Info */}
        <section className="bg-gradient-to-br from-brand-card-light/40 to-brand-card/40 border border-brand-border rounded-3xl p-8 flex flex-col lg:flex-row items-center justify-between gap-8 max-w-4xl mx-auto shadow-2xl">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex bg-brand-cyan/15 text-brand-cyan text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
              💡 Virtualization Sandbox
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Integrated Kathará Container Labs
            </h2>
            <p className="text-brand-muted text-xs leading-relaxed">
              For advanced modules, NetMaster deploys lightweight **Kathará** Docker containers representing 
              live Linux routing interfaces. Configure dynamic OSPF protocols and verify real routing tables 
              inside interactive Linux terminals hosted directly in your web browser.
            </p>
          </div>
          <div className="w-full lg:w-auto shrink-0 flex justify-center">
            <Link
              href="/register"
              className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider hover:scale-[1.02] shadow-lg"
            >
              Access Container Sandbox
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
