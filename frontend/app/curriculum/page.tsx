"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import modulesData from "@/data/modules_meta.json";
import { COMPETENCIES_CONFIG } from "@/utils/competencies";
import Link from "next/link";

interface Topic {
  id: number;
  title: string;
}

interface Module {
  id: number;
  title: string;
  topics: Topic[];
}

function renderCompetencyIcon(iconStr: string, className = "w-6 h-6") {
  switch (iconStr) {
    case "🌐":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} text-brand-cyan`}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          <path d="M2 12h20"/>
        </svg>
      );
    case "🔢":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} text-purple-400`}>
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M9 22V2"/>
          <path d="M15 22V2"/>
          <path d="M2 9h20"/>
          <path d="M2 15h20"/>
        </svg>
      );
    case "🔌":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} text-emerald-400`}>
          <rect width="16" height="20" x="4" y="2" rx="2"/>
          <rect width="6" height="6" x="9" y="6" rx="1"/>
          <path d="M9 16h6"/>
          <path d="M12 12v4"/>
        </svg>
      );
    case "⚙️":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} text-amber-400`}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      );
    case "🔀":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} text-rose-400`}>
          <path d="M18 8h4V4"/>
          <path d="M18 16h4v4"/>
          <path d="m2 4 20 16"/>
          <path d="m2 20 7.6-7.6"/>
          <path d="m15 9 7-7"/>
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
}

const CAREER_PATHS = [
  {
    name: "Network Support Specialist",
    description: "Ideal for entry-level IT roles. Focuses on foundational network topologies, internet communication models, and essential host configuration.",
    careers: ["IT Helpdesk Analyst", "Systems Support Technician", "Junior System Administrator"],
    moduleIds: [1782134355228, 1782182808093, 1782181968596, 1782186928370],
    estHours: "12 Hours",
    icon: "🛠️"
  },
  {
    name: "Network Operations Engineer",
    description: "Designed for core routing, switching, and local domain administrators. Focuses on VLAN routing, switch management, and standard CLI commands.",
    careers: ["Network Administrator", "Systems Operations Lead", "Infrastructure Specialist"],
    moduleIds: [1782185665993, 1782186311891, 1782186928370, 1782197552474, 1782198533015, 1782199846377],
    estHours: "24 Hours",
    icon: "🔀"
  },
  {
    name: "IT Infrastructure Architect",
    description: "Advanced track focusing on complex IP capacity subnetting plans, floating backup static routing failover, and summary calculation protocols.",
    careers: ["Network Architect", "Security Architect", "IT Systems Planner"],
    moduleIds: [1782184909611, 1782199846377, 1782200580841, 1782203599448],
    estHours: "18 Hours",
    icon: "📐"
  }
];

export default function CurriculumPage() {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [filterByPath, setFilterByPath] = useState<boolean>(false);

  const toggleModule = (id: number) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const getModuleCompetency = (moduleId: number) => {
    const comp = COMPETENCIES_CONFIG.find((c) => c.moduleIds.includes(moduleId));
    if (comp) return comp;
    return {
      name: "Core Networking",
      icon: "🌐",
      themeColor: "from-slate-500 to-slate-600 border-slate-500/20 text-slate-400",
    };
  };

  // Filter modules by selected competency and path if active
  let filteredModules = modulesData as Module[];

  if (selectedCompetency) {
    const comp = COMPETENCIES_CONFIG.find((c) => c.name === selectedCompetency);
    filteredModules = filteredModules.filter((mod) => comp?.moduleIds.includes(mod.id));
  }

  if (selectedPath && filterByPath) {
    const pathObj = CAREER_PATHS.find((p) => p.name === selectedPath);
    filteredModules = filteredModules.filter((mod) => pathObj?.moduleIds.includes(mod.id));
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Our <span className="text-brand-cyan">Learning Curriculum</span>
          </h1>
          <p className="text-brand-muted text-base">
            Master the core concepts of computer networking through structured lecture paths, 
            interactive subnetting challenges, and advanced Packet Tracer labs.
          </p>
        </div>

        {/* Competencies Overview */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">Focus Competencies</h2>
            {selectedCompetency && (
              <button
                onClick={() => setSelectedCompetency(null)}
                className="text-xs text-brand-cyan hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {COMPETENCIES_CONFIG.map((comp) => {
              const isActive = selectedCompetency === comp.name;
              return (
                <button
                  key={comp.name}
                  onClick={() => setSelectedCompetency(isActive ? null : comp.name)}
                  className={`text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-40 ${
                    isActive
                      ? "bg-brand-card-light border-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]"
                      : "bg-brand-card border-brand-border hover:border-brand-cyan/40 hover:scale-[1.01]"
                  }`}
                >
                  <div>
                    <div className="mb-2">{renderCompetencyIcon(comp.icon)}</div>
                    <h3 className="font-bold text-xs leading-snug line-clamp-2">
                      {comp.name}
                    </h3>
                  </div>
                  <span className="text-[10px] text-brand-muted uppercase tracking-widest font-mono mt-2 block">
                    {comp.moduleIds.length} Modules
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Paths Recommendations */}
        <div className="mb-16 bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Recommended Learning Paths</h2>
              <p className="text-brand-muted text-xs mt-1">Select a career pathway to view structured module sequences and filter your focus syllabus.</p>
            </div>
            {selectedPath && (
              <button
                onClick={() => {
                  setSelectedPath(null);
                  setFilterByPath(false);
                }}
                className="text-xs text-brand-cyan hover:underline cursor-pointer md:self-start"
              >
                Reset Path
              </button>
            )}
          </div>

          {/* Paths Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {CAREER_PATHS.map((path) => {
              const isSelected = selectedPath === path.name;
              return (
                <button
                  key={path.name}
                  onClick={() => {
                    setSelectedPath(path.name);
                    setFilterByPath(true);
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-brand-card-light border-brand-cyan shadow-[0_0_12px_rgba(6,182,212,0.12)]"
                      : "bg-brand-bg/50 border-brand-border hover:border-brand-cyan/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{path.icon}</span>
                    <div>
                      <h3 className="font-extrabold text-xs text-brand-text">{path.name}</h3>
                      <span className="text-[10px] text-brand-muted block mt-0.5">{path.estHours} • {path.moduleIds.length} Modules</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Path Details */}
          {selectedPath && (() => {
            const pathObj = CAREER_PATHS.find((p) => p.name === selectedPath)!;
            return (
              <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-5 space-y-4 animate-scaleIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/30 pb-3">
                  <div>
                    <span className="text-[9px] text-brand-cyan font-black uppercase tracking-widest font-mono">Selected Career Blueprint</span>
                    <h3 className="font-extrabold text-sm text-brand-text mt-0.5">{pathObj.name}</h3>
                  </div>
                  <button
                    onClick={() => setFilterByPath(!filterByPath)}
                    className={`px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer border transition-all ${
                      filterByPath
                        ? "bg-brand-cyan text-brand-bg border-brand-cyan"
                        : "bg-transparent text-brand-cyan border-brand-cyan/40 hover:bg-brand-cyan/5"
                    }`}
                  >
                    {filterByPath ? "Showing Path Modules" : "Filter Syllabus by Path"}
                  </button>
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  {pathObj.description}
                </p>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-text mb-2">Target Careers</h4>
                  <div className="flex flex-wrap gap-2">
                    {pathObj.careers.map((career) => (
                      <span key={career} className="bg-brand-card px-2.5 py-1 rounded text-[10px] text-brand-text/90 font-semibold border border-brand-border/50">
                        {career}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Syllabus / Module List Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Syllabus Outline</h2>

          {filteredModules.length === 0 ? (
            <div className="text-center p-12 bg-brand-card rounded-2xl border border-brand-border text-brand-muted">
              No modules found for the selected filter.
            </div>
          ) : (
            filteredModules.map((mod, index) => {
              const comp = getModuleCompetency(mod.id);
              const isOpen = expandedModule === mod.id;

              return (
                <div
                  key={mod.id}
                  className="bg-brand-card border border-brand-border rounded-xl overflow-hidden transition-all duration-200 hover:border-brand-border/80"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-brand-card-light/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center font-mono text-xs text-brand-cyan font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-sm md:text-base text-brand-text">
                          {mod.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-brand-muted font-medium">
                            {mod.topics.length} Lecture Topics
                          </span>
                          <span className="text-[10px] text-brand-muted">•</span>
                          <span className="text-[10px] text-brand-cyan font-semibold flex items-center gap-1.5">
                            {renderCompetencyIcon(comp.icon, "w-3.5 h-3.5")}
                            <span>{comp.name}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-brand-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-cyan" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {/* Accordion Content */}
                  <div
                    className={`transition-all duration-300 ${
                      isOpen ? "max-h-[800px] border-t border-brand-border/60" : "max-h-0 overflow-hidden"
                    }`}
                  >
                    <div className="p-6 bg-brand-card-light/20 space-y-4">
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-brand-cyan">
                        Lecture Topics Checklist
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mod.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-start gap-3 p-3 bg-brand-bg/50 border border-brand-border/40 rounded-lg"
                          >
                            <span className="w-4 h-4 rounded-full border border-brand-cyan/40 flex items-center justify-center text-[8px] text-brand-cyan mt-0.5 shrink-0">
                              ○
                            </span>
                            <span className="text-xs font-semibold text-brand-text/90">
                              {topic.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-20 p-8 rounded-2xl bg-brand-card border border-brand-cyan/20 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-transparent pointer-events-none"></div>
          <h2 className="text-2xl font-bold mb-3">Ready to Build Your Network?</h2>
          <p className="text-brand-muted text-sm max-w-lg mx-auto mb-6">
            Get hands-on experience, test your understanding in custom simulators, and earn credentials to showcase your skills.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg px-6 py-3 rounded font-bold transition-all shadow-lg text-sm hover:scale-[1.02]"
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="bg-brand-card hover:bg-brand-border text-brand-text border border-brand-border px-6 py-3 rounded font-bold transition-all text-sm hover:scale-[1.02]"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
