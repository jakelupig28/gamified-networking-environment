"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { COMPETENCIES_CONFIG, calculateCompetencyScore, Module } from "@/utils/competencies";

interface LabSubmission {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  labId: string;
  labTitle: string;
  score: number;
  status: string;
  feedback: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
  logs: string[];
}

interface Lab {
  id: string;
  title: string;
  description: string;
  moduleId: number;
  competency: string;
  difficulty: string;
}

interface UserSubmissionDetail {
  score: number;
  status: string;
  feedback: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
  logs?: string[];
}

interface StudentUser {
  name: string;
  email: string;
  studentId?: string;
  role: string;
  labSubmissions?: Record<string, UserSubmissionDetail>;
  completedTopics?: Record<string, boolean>;
  pretestScores?: Record<string, number>;
  interactiveScores?: Record<string, Record<string, number>>;
}

export default function ProfessorLabs() {
  const [activeTab, setActiveTab] = useState<"submissions" | "manage" | "heatmaps" | "quests">("submissions");
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<StudentUser[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  // Quest Creator States
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questDifficulty, setQuestDifficulty] = useState("Medium");
  const [questCompetency, setQuestCompetency] = useState("Introduction to Networks & Topologies");
  const [questModuleId, setQuestModuleId] = useState("");
  const [questRubrics, setQuestRubrics] = useState<{ id: string; label: string }[]>([
    { id: "rub-1", label: "Router interface IP configuration" }
  ]);
  const [isCreatingQuest, setIsCreatingQuest] = useState(false);

  const [gradingSubmission, setGradingSubmission] = useState<LabSubmission | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideFeedback, setOverrideFeedback] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fetchData = async (showLoading: boolean = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      // 1. Fetch labs
      const labsRes = await fetch("/api/labs");
      const labsData = await labsRes.json();
      const labList: Lab[] = labsData.labs || [];
      setLabs(labList);

      // 2. Fetch modules
      const modulesRes = await fetch("/api/modules");
      const modulesData = await modulesRes.json();
      if (modulesData.success) {
        setModules(modulesData.modules || []);
      }

      // 3. Fetch users to collect submissions
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      if (usersData.success && usersData.users) {
        setAllUsers(usersData.users);
        const studentSubmissions: LabSubmission[] = [];
        usersData.users.forEach((user: StudentUser) => {
          if (user.role === "Student" && user.labSubmissions) {
            Object.entries(user.labSubmissions).forEach(([labId, details]: [string, UserSubmissionDetail]) => {
              const labObj = labList.find(l => l.id === labId);
              studentSubmissions.push({
                studentName: user.name,
                studentEmail: user.email,
                studentId: user.studentId,
                labId,
                labTitle: labObj ? labObj.title : labId,
                score: details.score,
                status: details.status,
                feedback: details.feedback,
                fileName: details.fileName,
                fileUrl: details.fileUrl,
                submittedAt: details.submittedAt,
                logs: details.logs || []
              });
            });
          }
        });
        
        // Sort newest submissions first
        studentSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setSubmissions(studentSubmissions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, []);

  const handleOpenGradeOverride = (sub: LabSubmission) => {
    setGradingSubmission(sub);
    setOverrideScore(sub.score);
    setOverrideFeedback(sub.feedback);
  };

  const handleSaveGradeOverride = async () => {
    if (!gradingSubmission) return;
    if (overrideScore < 0 || overrideScore > 100) {
      setAlertMessage("Score must be between 0 and 100.");
      return;
    }

    setIsSavingGrade(true);
    try {
      const res = await fetch("/api/labs/submit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gradingSubmission.studentEmail,
          labId: gradingSubmission.labId,
          score: overrideScore,
          feedback: overrideFeedback
        })
      });
      const data = await res.json();
      if (data.success) {
        setGradingSubmission(null);
        setAlertMessage("Manual grade override saved successfully!");
        fetchData();
      } else {
        setAlertMessage(data.message || "Failed to save override.");
      }
    } catch (e) {
      console.error(e);
      setAlertMessage("Failed to connect to grading override hook.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleExportCSV = () => {
    const students = allUsers.filter(u => u.role === "Student");
    if (students.length === 0) {
      alert("No student data available to export.");
      return;
    }

    const headers = [
      "Student Name",
      "Student ID",
      "Email",
      "Intro to Networks Mastery %",
      "Subnetting & IPv4 Mastery %",
      "VLAN Switching Mastery %",
      "Router Config Mastery %",
      "Routing Protocols Mastery %"
    ];

    const rows = students.map(student => {
      const scores = COMPETENCIES_CONFIG.map(comp => 
        calculateCompetencyScore(comp, student, modules)
      );
      return [
        `"${student.name}"`,
        `"${student.studentId || 'N/A'}"`,
        `"${student.email}"`,
        ...scores
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Class_Competency_Grades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/professor/labs" />
      <main className="p-8 flex-grow w-full max-w-6xl">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Packet Tracer Labs Panel</h1>
            <p className="text-brand-muted text-sm mt-1">Review student Packet Tracer file uploads, view auto-grader output validation tests, and apply grade overrides.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
            <span className="text-sm font-semibold text-brand-cyan animate-pulse">Loading Packet Tracer submissions...</span>
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md animate-fade-in flex flex-col gap-6">
            
            {/* Tab navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-border/40 pb-4 mb-4 gap-4 w-full">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setActiveTab("submissions"); setGradingSubmission(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "submissions"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text"
                  }`}
                >
                  Student Submissions ({submissions.length})
                </button>
                <button
                  onClick={() => { setActiveTab("manage"); setGradingSubmission(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "manage"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text"
                  }`}
                >
                  Assigned Lab Blueprints ({labs.length})
                </button>
                <button
                  onClick={() => { setActiveTab("heatmaps"); setGradingSubmission(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "heatmaps"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text"
                  }`}
                >
                  Class Heatmaps
                </button>
                <button
                  onClick={() => { setActiveTab("quests"); setGradingSubmission(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "quests"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text"
                  }`}
                >
                  Quest & Rubric Creator
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Export Grades CSV
              </button>
            </div>

            {/* Submissions view */}
            {activeTab === "submissions" && (
              submissions.length === 0 ? (
                <div className="text-center py-10 text-brand-muted text-sm border border-dashed border-brand-border/40 rounded-xl bg-brand-bg/25 select-none">
                  No Packet Tracer lab submissions found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-brand-muted uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Lab Activity</th>
                        <th className="py-3 px-4">Upload File</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20">
                      {submissions.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-brand-bg/25 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-brand-text text-sm">{sub.studentName}</div>
                            <div className="text-[10px] text-brand-muted font-mono mt-0.5">
                              ID: {sub.studentId || "N/A"} • {sub.studentEmail}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-brand-text">
                            <div>{sub.labTitle}</div>
                            <div className="text-[9px] text-brand-muted mt-0.5">
                              Submitted: {new Date(sub.submittedAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-brand-cyan truncate max-w-[150px]" title={sub.fileName}>
                            <a
                              href="#"
                              onClick={(e) => {
                                // Simulate download student submission file
                                e.preventDefault();
                                const blob = new Blob([`Dummy data content of student lab file ${sub.fileName}`], { type: "application/octet-stream" });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = sub.fileName;
                                link.click();
                              }}
                              className="hover:underline flex items-center gap-1.5"
                            >
                              📂 {sub.fileName}
                            </a>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-extrabold text-sm font-mono text-brand-text">{sub.score} / 100</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleOpenGradeOverride(sub)}
                              className="bg-brand-bg hover:bg-brand-card border border-brand-border hover:border-brand-border-hover text-brand-text px-3.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Grade / Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Manage assigned lab blueprints view */}
            {activeTab === "manage" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {labs.map((lab) => (
                  <div key={lab.id} className="bg-brand-bg/40 border border-brand-border rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-brand-cyan mb-1.5">
                        <span>{lab.difficulty}</span>
                        <span>{lab.competency}</span>
                      </div>
                      <h4 className="text-sm font-bold text-brand-text">{lab.title}</h4>
                      <p className="text-xs text-brand-muted leading-relaxed mt-1">{lab.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-brand-muted mt-2 border-t border-brand-border/20 pt-2">
                      <span>Lab ID: {lab.id}</span>
                      <span>Assoc Module: {lab.moduleId}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Class Heatmap View */}
            {activeTab === "heatmaps" && (() => {
              const students = allUsers.filter(u => u.role === "Student");
              if (students.length === 0) {
                return (
                  <div className="text-center py-10 text-brand-muted text-sm border border-dashed border-brand-border/40 rounded-xl bg-brand-bg/25 select-none">
                    No student profile data loaded.
                  </div>
                );
              }

              // Calculate competency averages
              const averages = COMPETENCIES_CONFIG.map(comp => {
                const total = students.reduce((sum, s) => sum + calculateCompetencyScore(comp, s, modules), 0);
                return {
                  name: comp.name,
                  avg: Math.round(total / students.length)
                };
              });

              return (
                <div className="flex flex-col gap-8 animate-fade-in text-brand-text">
                  {/* Summary Heatmap Row */}
                  <div className="bg-brand-bg/20 border border-brand-border/60 rounded-xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Class Performance averages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {averages.map(item => (
                        <div key={item.name} className="bg-brand-card/50 border border-brand-border p-4 rounded-xl flex flex-col items-center text-center gap-1">
                          <span className="text-[10px] text-brand-muted font-bold truncate max-w-full" title={item.name}>{item.name}</span>
                          <span className="text-2xl font-black text-brand-cyan font-mono">{item.avg}%</span>
                          <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-brand-cyan h-full" style={{ width: `${item.avg}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Student Heatmap Grid Table */}
                  <div className="overflow-x-auto border border-brand-border rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-brand-border/40 bg-brand-bg/40 text-brand-muted uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-3 px-4">Student</th>
                          {COMPETENCIES_CONFIG.map(comp => (
                            <th key={comp.name} className="py-3 px-4 text-center max-w-[120px] truncate" title={comp.name}>
                              {comp.icon} {comp.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/20">
                        {students.map((student, idx) => (
                          <tr key={idx} className="hover:bg-brand-bg/25 transition-colors">
                            <td className="py-4 px-4 font-bold">
                              <div>{student.name}</div>
                              <div className="text-[9px] text-brand-muted font-mono">{student.email}</div>
                            </td>
                            {COMPETENCIES_CONFIG.map(comp => {
                              const score = calculateCompetencyScore(comp, student, modules);
                              
                              // Color code cell based on level
                              let cellClass = "bg-red-500/10 text-red-400 border border-red-500/20";
                              if (score >= 80) {
                                cellClass = "bg-green-500/10 text-green-400 border border-green-500/20";
                              } else if (score >= 40) {
                                cellClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                              }

                              return (
                                <td key={comp.name} className="py-4 px-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-[11px] ${cellClass}`}>
                                    {score}%
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Quest Creator View */}
            {activeTab === "quests" && (
              <div className="animate-fade-in flex flex-col gap-6 text-brand-text">
                <header>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-brand-cyan mb-1">Create Quest & Set Rubrics</h3>
                  <p className="text-brand-muted text-xs">Configure a custom hands-on Packet Tracer lab blueprint. Setup specific evaluation criteria (rubrics) for the auto-grader.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Config Form */}
                  <div className="bg-brand-bg/20 border border-brand-border/60 rounded-xl p-5 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border/20 pb-2">Quest Blueprint Details</h4>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-brand-muted">Quest Title</label>
                      <input
                        type="text"
                        placeholder="e.g. OSPF Single-Area Configuration Challenge"
                        value={questTitle}
                        onChange={(e) => setQuestTitle(e.target.value)}
                        className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text placeholder-brand-muted/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-brand-muted">Description / Objective</label>
                      <textarea
                        placeholder="Detail the objectives the student must complete in Packet Tracer..."
                        value={questDescription}
                        onChange={(e) => setQuestDescription(e.target.value)}
                        rows={3}
                        className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text placeholder-brand-muted/50 resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-brand-muted">Competency Alignment</label>
                        <select
                          value={questCompetency}
                          onChange={(e) => setQuestCompetency(e.target.value)}
                          className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text"
                        >
                          {COMPETENCIES_CONFIG.map(comp => (
                            <option key={comp.name} value={comp.name}>{comp.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-brand-muted">Difficulty</label>
                        <select
                          value={questDifficulty}
                          onChange={(e) => setQuestDifficulty(e.target.value)}
                          className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-brand-muted">Map to Course Module</label>
                      <select
                        value={questModuleId}
                        onChange={(e) => setQuestModuleId(e.target.value)}
                        className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text"
                      >
                        <option value="">-- Select Module --</option>
                        {modules.map(mod => (
                          <option key={mod.id} value={mod.id}>{mod.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Rubrics setup */}
                  <div className="bg-brand-bg/20 border border-brand-border/60 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-brand-border/20 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Auto-Grader Rubrics / Checkpoints</h4>
                      <button
                        onClick={() => setQuestRubrics([...questRubrics, { id: `rub-${Date.now()}`, label: "" }])}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5 rounded hover:bg-brand-cyan/15 transition-all"
                      >
                        + Add Checkpoint
                      </button>
                    </div>

                    <p className="text-[10px] text-brand-muted">Assign evaluation criteria. The grading engine calculates matching score dynamically based on how many checkpoints pass execution tests.</p>

                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {questRubrics.map((rubric, idx) => (
                        <div key={rubric.id} className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-brand-muted font-mono w-5">#{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="e.g. VLAN 10 named 'Sales' present on Switch1"
                            value={rubric.label}
                            onChange={(e) => {
                              const copy = [...questRubrics];
                              copy[idx].label = e.target.value;
                              setQuestRubrics(copy);
                            }}
                            className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs focus:border-brand-cyan outline-none text-brand-text placeholder-brand-muted/50 flex-grow"
                          />
                          {questRubrics.length > 1 && (
                            <button
                              onClick={() => {
                                const copy = questRubrics.filter(r => r.id !== rubric.id);
                                setQuestRubrics(copy);
                              }}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={async () => {
                        if (!questTitle || !questDescription || !questModuleId) {
                          alert("Please fill in the title, description, and select a mapped course module.");
                          return;
                        }
                        const filledRubrics = questRubrics.filter(r => r.label.trim() !== "");
                        if (filledRubrics.length === 0) {
                          alert("Please configure at least one rubric checkpoint.");
                          return;
                        }

                        setIsCreatingQuest(true);
                        try {
                          const res = await fetch("/api/labs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: questTitle,
                              description: questDescription,
                              difficulty: questDifficulty,
                              competency: questCompetency,
                              moduleId: Number(questModuleId),
                              rubrics: filledRubrics
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert("Quest published and rubrics locked successfully!");
                            // Reset Form
                            setQuestTitle("");
                            setQuestDescription("");
                            setQuestDifficulty("Medium");
                            setQuestCompetency("Introduction to Networks & Topologies");
                            setQuestModuleId("");
                            setQuestRubrics([{ id: `rub-${Date.now()}`, label: "" }]);
                            // Refresh labs list
                            fetchData();
                            setActiveTab("manage");
                          } else {
                            alert(data.message || "Failed to publish quest");
                          }
                        } catch (e) {
                          console.error(e);
                          alert("Failed to connect to the server.");
                        } finally {
                          setIsCreatingQuest(false);
                        }
                      }}
                      disabled={isCreatingQuest}
                      className="w-full bg-brand-cyan hover:bg-brand-cyan-hover disabled:bg-brand-border disabled:text-brand-muted text-brand-bg font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                    >
                      {isCreatingQuest ? "Publishing Quest..." : "Publish Quest & Lock Rubrics"}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Manual override drawer / popup modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-end p-4 animate-fade-in">
          <div className="bg-slate-900 border-l border-brand-border h-full max-w-lg w-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-drawer-in">
            <div className="space-y-6">
              <header className="flex justify-between items-center border-b border-brand-border/40 pb-4">
                <div>
                  <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider block">Submission grading</span>
                  <h3 className="text-md font-bold">{gradingSubmission.labTitle}</h3>
                </div>
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="p-1.5 rounded-lg hover:bg-brand-card text-brand-muted hover:text-brand-text cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </header>

              {/* Student details */}
              <div className="bg-brand-bg/50 border border-brand-border/30 rounded-xl p-4 text-xs space-y-2">
                <div>Student: <span className="font-bold text-brand-text">{gradingSubmission.studentName}</span></div>
                <div>ID: <span className="font-semibold text-brand-text font-mono">{gradingSubmission.studentId || "N/A"}</span></div>
                <div>Email: <span className="font-semibold text-brand-cyan font-mono">{gradingSubmission.studentEmail}</span></div>
                <div className="border-t border-brand-border/20 pt-2 mt-2">
                  Uploaded file: <span className="font-semibold text-brand-cyan underline">{gradingSubmission.fileName}</span>
                </div>
              </div>

              {/* Grader output logs */}
              <div className="space-y-2">
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Auto-Grader Execution Logs</span>
                <pre className="bg-brand-bg border border-brand-border/60 rounded-xl p-4 font-mono text-[9px] leading-relaxed max-h-48 overflow-y-auto text-brand-text select-all">
                  {gradingSubmission.logs.join("\n")}
                </pre>
              </div>

              {/* Score and feedback editing */}
              <div className="space-y-4 border-t border-brand-border/30 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Configure Grade Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="bg-brand-bg border border-brand-border text-brand-text font-mono font-bold text-sm rounded-lg p-2.5 outline-none focus:border-brand-cyan w-24"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Review Comments & Feedback</label>
                  <textarea
                    rows={4}
                    value={overrideFeedback}
                    onChange={(e) => setOverrideFeedback(e.target.value)}
                    placeholder="Enter manual evaluation feedback details..."
                    className="bg-brand-bg border border-brand-border text-brand-text text-xs rounded-lg p-2.5 outline-none focus:border-brand-cyan w-full resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-brand-border/40 mt-6 shrink-0">
              <button
                onClick={handleSaveGradeOverride}
                disabled={isSavingGrade}
                className="flex-grow bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all text-center disabled:opacity-50"
              >
                {isSavingGrade ? "Saving Grade..." : "Override Grade & Save"}
              </button>
              <button
                onClick={() => setGradingSubmission(null)}
                className="bg-brand-bg hover:bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text px-5 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Overlay */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl">
            <h3 className="text-md font-bold text-brand-text">Notification</h3>
            <p className="text-xs text-brand-muted leading-relaxed px-2">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className="mt-2 w-full bg-brand-bg hover:bg-brand-border border border-brand-border text-brand-text text-xs font-bold py-2.5 rounded-xl cursor-pointer uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
