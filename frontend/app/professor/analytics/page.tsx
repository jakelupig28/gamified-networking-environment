"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { INTERACTIVE_ACTIVITIES_CONFIG } from "@/data/interactiveActivities";

const getInteractiveModuleDetails = (mId: string | number, scores: any) => {
  const ids = [
    1782134355228, 1782182808093, 1782181968596, 1782184909611,
    1782185665993, 1782186311891, 1782186928370, 1782197552474,
    1782198533015, 1782199846377, 1782200580841, 1782203599448
  ];
  const moduleIdx = ids.indexOf(Number(mId));
  const title = `Module ${moduleIdx + 1}`;
  if (!scores) return { title, total: 0, max: 0, details: "Not started" };

  const t1 = Number(scores.task1) || 0;
  const t2 = Number(scores.task2) || 0;
  const t3 = Number(scores.task3) || 0;

  let max = 0;
  let total = 0;
  let details = "";

  switch (moduleIdx) {
    case 0:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 1:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 2:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 3:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 4:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 5:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 6:
      max = 3;
      total = t1 + t2;
      details = `T1: ${t1}/1, T2: ${t2}/2`;
      break;
    case 7:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 8:
      max = 4;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/2, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 9:
      max = 3;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/1`;
      break;
    case 10:
      max = 3;
      total = t1 + t2;
      details = `T1: ${t1}/2, T2: ${t2}/1`;
      break;
    case 11:
      max = 5;
      total = t1 + t2 + t3;
      details = `T1: ${t1}/1, T2: ${t2}/1, T3: ${t3}/3`;
      break;
    default:
      max = 10;
      total = t1 + t2 + t3;
      details = `T1: ${t1}, T2: ${t2}, T3: ${t3}`;
  }

  return { title, total, max, details };
};

export default function ProfessorAnalytics() {
  const [activeTab, setActiveTab] = useState<"roster" | "heatmaps" | "security">("roster");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<"pretest" | "interactive" | "simulation">("pretest");
  const [selectedGridCell, setSelectedGridCell] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          const allStudents = usersData.users.filter(
            (u: any) => u.role === "Student"
          );
          setStudents(allStudents);
        }

        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();
        if (modulesData.success && modulesData.modules) {
          setModules(modulesData.modules);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(String(modules[0].id));
    }
  }, [modules, selectedModuleId]);

  const calculateStudentProgress = (student: any) => {
    if (modules.length === 0) return 0;
    const completed = student.completedTopics || {};
    const watched = student.watchedVideos || {};
    
    let totalTopics = 0;
    let progressSum = 0;
    
    modules.forEach((mod) => {
      mod.topics.forEach((topic: any) => {
        totalTopics += 1;
        if (completed[topic.id]) {
          progressSum += 100;
        } else {
          const videoMat = topic.materials?.find((m: any) => m.type === "video") ||
                           topic.subtopics?.flatMap((s: any) => s.materials || []).find((m: any) => m.type === "video");
          if (videoMat && watched[videoMat.id]) {
            progressSum += 50;
          }
        }
      });
    });
    
    if (totalTopics === 0) return 0;
    return Math.round(progressSum / totalTopics);
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/professor/analytics" />
      <main className="p-8 flex-grow w-full max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Course Analytics</h1>
            <p className="text-brand-muted text-sm mt-1">Investigate students' pretest/activity mistake heatmaps and monitor secure test violations.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
            <span className="text-sm font-semibold text-brand-cyan animate-pulse">Loading Analytics Data...</span>
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md animate-fade-in">
            {/* Tab Navigation Headers */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-brand-border/40 pb-4 mb-6 gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => { setActiveTab("roster"); setSelectedGridCell(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "roster"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text hover:border-brand-border-hover"
                  }`}
                >
                  Student Roster
                </button>
                <button
                  onClick={() => { setActiveTab("heatmaps"); setSelectedGridCell(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "heatmaps"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text hover:border-brand-border-hover"
                  }`}
                >
                  Mistake Heatmaps
                </button>
                <button
                  onClick={() => { setActiveTab("security"); setSelectedGridCell(null); }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    activeTab === "security"
                      ? "bg-brand-cyan text-brand-bg border-brand-cyan font-black"
                      : "bg-brand-bg/30 text-brand-muted border-brand-border hover:text-brand-text hover:border-brand-border-hover"
                  }`}
                >
                  Academic Integrity
                </button>
              </div>
              <span className="text-xs text-brand-muted font-mono">{students.length} Student(s) registered</span>
            </div>

            {/* TAB 1: STUDENT ROSTER & scores */}
            {activeTab === "roster" && (
              students.length === 0 ? (
                <div className="text-center py-10 text-brand-muted text-sm border border-dashed border-brand-border/40 rounded-xl bg-brand-bg/25">
                  No students are currently registered in the course.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-brand-muted uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3.5 px-4">Student Details</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Overall Progress</th>
                        <th className="py-3.5 px-4 text-center">Pre-test Scores</th>
                        <th className="py-3.5 px-4 text-center">Interactive Activities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20">
                      {students.map((student) => {
                        const progress = calculateStudentProgress(student);
                        const pScores = student.pretestScores || {};
                        const pretestDisplay = Object.keys(pScores).length > 0 
                          ? Object.entries(pScores).map(([mId, score]) => {
                              const mTitle = modules.find(m => String(m.id) === String(mId))?.title || `Mod ${mId}`;
                              const maxQuestions = modules.find(m => String(m.id) === String(mId))?.pretest?.length || 5;
                              return `${mTitle}: ${score}/${maxQuestions}`;
                            }).join(", ")
                          : "No pre-tests taken";
                        const iScores = student.interactiveScores || {};

                        return (
                          <tr key={student.id} className="hover:bg-brand-bg/25 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-brand-text text-sm">{student.name}</div>
                              <div className="text-[10px] text-brand-muted font-mono mt-0.5">
                                ID: {student.studentId || "N/A"} • {student.email}
                              </div>
                              {student.course && (
                                <div className="text-[9px] text-brand-cyan/85 mt-0.5">
                                  {student.course} - Year {student.yearLevel || "N/A"} (Sec {student.section || "N/A"})
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                student.status === "admitted"
                                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                                  : student.status === "rejected"
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                              }`}>
                                {student.status === "admitted" ? "Admitted" : student.status === "rejected" ? "Rejected" : "Pending"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="font-bold text-brand-text text-sm font-mono">{progress}%</span>
                                <div className="w-24 h-2 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                                  <div className="h-full bg-brand-cyan" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-semibold text-brand-text">
                              <div className="max-w-[200px] mx-auto text-xs truncate" title={pretestDisplay}>
                                {pretestDisplay}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-brand-text">
                              <div className="max-w-[250px] mx-auto text-[11px] font-mono leading-relaxed flex flex-col gap-2">
                                {Object.keys(iScores).length > 0 ? (
                                  Object.entries(iScores).map(([mId, scores]: [string, any]) => {
                                    const details = getInteractiveModuleDetails(mId, scores);
                                    return (
                                      <div key={mId} className="flex flex-col items-center border border-brand-border/30 rounded-lg p-1.5 bg-brand-bg/40 max-w-[240px] mx-auto gap-1">
                                        <span className="text-[9px] font-bold text-brand-cyan uppercase">{details.title}</span>
                                        <span className="font-bold text-xs">{details.total} / {details.max}</span>
                                        <span className="text-[9px] text-brand-muted font-bold">{details.details}</span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-brand-muted italic">No activities submitted</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB 2: MISTAKE HEATMAPS */}
            {activeTab === "heatmaps" && (
              <div className="flex flex-col gap-6">
                {/* Control Panel */}
                <div className="bg-brand-bg/15 border border-brand-border/30 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Select Module</label>
                      <select
                        value={selectedModuleId}
                        onChange={(e) => { setSelectedModuleId(e.target.value); setSelectedGridCell(null); }}
                        className="bg-brand-bg border border-brand-border text-brand-text text-xs rounded-lg p-2 outline-none focus:border-brand-cyan"
                      >
                        {modules.map((m) => (
                          <option key={m.id} value={String(m.id)}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 justify-end">
                      <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Assessment Type</label>
                      <div className="flex border border-brand-border rounded-lg overflow-hidden h-[34px]">
                        <button
                          type="button"
                          onClick={() => { setAssessmentType("pretest"); setSelectedGridCell(null); }}
                          className={`px-4 text-xs font-bold transition-all ${
                            assessmentType === "pretest"
                              ? "bg-brand-cyan text-brand-bg font-extrabold"
                              : "bg-brand-bg/30 text-brand-muted hover:text-brand-text"
                          }`}
                        >
                          Pre-test
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAssessmentType("interactive"); setSelectedGridCell(null); }}
                          className={`px-4 text-xs font-bold transition-all ${
                            assessmentType === "interactive"
                              ? "bg-brand-cyan text-brand-bg font-extrabold"
                              : "bg-brand-bg/30 text-brand-muted hover:text-brand-text"
                          }`}
                        >
                          Interactive Activities
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAssessmentType("simulation"); setSelectedGridCell(null); }}
                          className={`px-4 text-xs font-bold transition-all ${
                            assessmentType === "simulation"
                              ? "bg-brand-cyan text-brand-bg font-extrabold"
                              : "bg-brand-bg/30 text-brand-muted hover:text-brand-text"
                          }`}
                        >
                          Simulation Labs
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-xs text-brand-muted border-t md:border-t-0 md:border-l border-brand-border/30 pt-3 md:pt-0 md:pl-4">
                    <span className="font-bold text-brand-cyan uppercase tracking-wider text-[9px] mb-1">Mistake Color Grid Legend</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30"></span>0 - 20%</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/30"></span>21 - 50%</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40"></span>51 - 100%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Grid */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-brand-cyan uppercase tracking-wider">
                      {assessmentType === "pretest" ? "Pre-test Mistakes Grid" : assessmentType === "interactive" ? "Interactive Task Items Grid" : "Simulation Lab Activity Grid"}
                    </h3>

                    {assessmentType === "pretest" && (() => {
                      const mod = modules.find(m => String(m.id) === String(selectedModuleId));
                      const questions = mod?.pretest || [];
                      if (questions.length === 0) {
                        return (
                          <div className="text-center py-10 text-brand-muted italic text-xs border border-brand-border/30 rounded-xl bg-brand-bg/10">
                            No pre-test configured for this module.
                          </div>
                        );
                      }

                      const attempts = students.filter(s => s.status === "admitted" && s.completedPretests?.[selectedModuleId]);
                      const totalAttempts = attempts.length;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {questions.map((q, idx) => {
                            const incorrectCount = attempts.filter(s => {
                              const mistakesList = s.pretestMistakes?.[selectedModuleId] || [];
                              return mistakesList.some((m: any) => m.question === q.question);
                            }).length;

                            const errRate = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0;
                            const isSelected = selectedGridCell?.type === "pretest" && selectedGridCell?.idx === idx;

                            let colorClass = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10";
                            if (errRate > 20 && errRate <= 50) {
                              colorClass = "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15";
                            } else if (errRate > 50) {
                              colorClass = "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedGridCell({
                                  type: "pretest",
                                  idx,
                                  question: q.question,
                                  options: q.options,
                                  correctAnswer: q.options[q.correctAnswer] || String(q.correctAnswer),
                                  errRate,
                                  incorrectCount,
                                  totalAttempts,
                                  attempts
                                })}
                                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-32 cursor-pointer ${colorClass} ${
                                  isSelected ? "ring-2 ring-brand-cyan border-brand-cyan scale-102" : ""
                                }`}
                              >
                                <div className="w-full">
                                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-85">
                                    <span>Question {idx + 1}</span>
                                    <span className="font-mono text-xs">{errRate}% Error</span>
                                  </div>
                                  <p className="text-xs font-semibold mt-2 text-brand-text truncate leading-relaxed">
                                    {q.question}
                                  </p>
                                </div>
                                <div className="text-[10px] opacity-75 font-medium">
                                  {incorrectCount} student(s) got this wrong
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {assessmentType === "interactive" && (() => {
                      const ids = [
                        1782134355228, 1782182808093, 1782181968596, 1782184909611,
                        1782185665993, 1782186311891, 1782186928370, 1782197552474,
                        1782198533015, 1782199846377, 1782200580841, 1782203599448
                      ];
                      const moduleIdx = ids.indexOf(Number(selectedModuleId));
                      const tasks = INTERACTIVE_ACTIVITIES_CONFIG[moduleIdx] || [];

                      if (tasks.length === 0) {
                        return (
                          <div className="text-center py-10 text-brand-muted italic text-xs border border-brand-border/30 rounded-xl bg-brand-bg/10">
                            No interactive activities configured for this module.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          {tasks.map((task, tIdx) => {
                            const taskKey = `task${tIdx + 1}`;
                            const attempts = students.filter(s => s.status === "admitted" && s.interactiveScores?.[selectedModuleId]?.[taskKey] !== undefined);
                            const totalAttempts = attempts.length;

                            return (
                              <div key={tIdx} className="bg-brand-bg/20 border border-brand-border/40 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                                    Task {tIdx + 1}: {task.title}
                                  </h4>
                                  <span className="text-[10px] text-brand-muted font-mono">{totalAttempts} submissions</span>
                                </div>

                                {task.correctAnswers ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.keys(task.correctAnswers).map((key, itemIdx) => {
                                      const rowObj = task.rows?.find(r => r.id === key);
                                      const itemLabel = rowObj ? rowObj.label : key;

                                      const incorrectCount = attempts.filter(s => {
                                        const mistakesList = s.interactiveMistakes?.[selectedModuleId]?.[taskKey] || [];
                                        return mistakesList.some((m: any) => m.item === itemLabel);
                                      }).length;

                                      const errRate = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0;
                                      const isSelected = selectedGridCell?.type === "interactive" && selectedGridCell?.taskIdx === tIdx && selectedGridCell?.key === key;

                                      let colorClass = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10";
                                      if (errRate > 20 && errRate <= 50) {
                                        colorClass = "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15";
                                      } else if (errRate > 50) {
                                        colorClass = "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                                      }

                                      const correctVal = task.correctAnswers[key];
                                      const correctOptObj = task.options?.find(o => o.val === correctVal);
                                      const correctText = correctOptObj ? correctOptObj.label : correctVal;

                                      return (
                                        <button
                                          key={key}
                                          onClick={() => setSelectedGridCell({
                                            type: "interactive",
                                            taskIdx: tIdx,
                                            key,
                                            taskTitle: task.title,
                                            itemLabel,
                                            correctAnswer: correctText,
                                            errRate,
                                            incorrectCount,
                                            totalAttempts,
                                            attempts,
                                            taskKey
                                          })}
                                          className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between h-28 cursor-pointer ${colorClass} ${
                                            isSelected ? "ring-2 ring-brand-cyan border-brand-cyan scale-102" : ""
                                          }`}
                                        >
                                          <div className="w-full">
                                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider opacity-85">
                                              <span className="truncate max-w-[130px]">Item {itemIdx + 1}</span>
                                              <span className="font-mono">{errRate}% Error</span>
                                            </div>
                                            <p className="text-xs font-semibold mt-1.5 text-brand-text truncate leading-relaxed">
                                              {itemLabel}
                                            </p>
                                          </div>
                                          <div className="text-[9px] opacity-75 font-medium">
                                            {incorrectCount} student(s) got this wrong
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-brand-muted italic">Non-matching task type</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {assessmentType === "simulation" && (() => {
                      const simLabConfigs: Record<number, { title: string; items: { id: string; label: string }[] }> = {
                        3: {
                          title: "IPv4 Static Addressing Challenge",
                          items: [
                            { id: "pc1-ip", label: "No host PC configured with IP 192.168.1.10" },
                            { id: "pc2-ip", label: "No host PC configured with IP 192.168.1.20" },
                            { id: "connectivity", label: "No physical cabling link connects PC1 and PC2" },
                            { id: "ping-test", label: "Ping test between PC1 and PC2 (192.168.1.20) was not completed successfully" }
                          ]
                        },
                        6: {
                          title: "Local Host Cabling Challenge",
                          items: [
                            { id: "pc1-sw1-conn", label: "PC and Switch are not connected" },
                            { id: "straight-cable", label: "Incorrect cable type used (requires Straight-Through cable)" },
                            { id: "pc1-ip-10", label: "PC eth0 interface not configured with IP 10.0.0.10" }
                          ]
                        },
                        7: {
                          title: "Gateway Router Configuration Challenge",
                          items: [
                            { id: "pc1-r1-conn", label: "PC and Router are not cabled" },
                            { id: "router-gateway-ip", label: "Router R1 eth0 gateway interface not configured with IP 192.168.1.1" },
                            { id: "pc1-ip-gateway", label: "PC PC1 interface not configured with IP 192.168.1.10" },
                            { id: "ping-gateway", label: "PC1 did not successfully ping the gateway (192.168.1.1)" }
                          ]
                        },
                        9: {
                          title: "Inter-network Static Routing Challenge",
                          items: [
                            { id: "routers-connected", label: "Routers R1 and R2 are not interconnected by cabling link" },
                            { id: "pc1-ip", label: "No host PC configured with IP 192.168.1.10" },
                            { id: "pc2-ip", label: "No host PC configured with IP 192.168.2.20" },
                            { id: "ping-across", label: "Ping across network subnets to PC2 (192.168.2.20) was not successful" }
                          ]
                        }
                      };

                      const ids = [
                        1782134355228, 1782182808093, 1782181968596, 1782184909611,
                        1782185665993, 1782186311891, 1782186928370, 1782197552474,
                        1782198533015, 1782199846377, 1782200580841, 1782203599448
                      ];
                      const moduleIdx = ids.indexOf(Number(selectedModuleId));
                      const config = simLabConfigs[moduleIdx];

                      if (!config) {
                        return (
                          <div className="text-center py-10 text-brand-muted italic text-xs border border-brand-border/30 rounded-xl bg-brand-bg/10">
                            No Simulation Lab activity is configured for this module.
                          </div>
                        );
                      }

                      const attempts = students.filter(s => s.status === "admitted" && s.interactiveScores?.[selectedModuleId]?.["simulationLab"] !== undefined);
                      const totalAttempts = attempts.length;

                      return (
                        <div className="space-y-6">
                          <div className="bg-brand-bg/20 border border-brand-border/40 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                                Lab Challenge: {config.title}
                              </h4>
                              <span className="text-[10px] text-brand-muted font-mono">{totalAttempts} submissions</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {config.items.map((item, itemIdx) => {
                                const incorrectCount = attempts.filter(s => {
                                  const mistakesList = s.interactiveMistakes?.[selectedModuleId]?.["simulationLab"] || [];
                                  return mistakesList.some((m: any) => m.item === item.label);
                                }).length;

                                const errRate = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0;
                                const isSelected = selectedGridCell?.type === "simulation" && selectedGridCell?.id === item.id;

                                let colorClass = "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10";
                                if (errRate > 20 && errRate <= 50) {
                                  colorClass = "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15";
                                } else if (errRate > 50) {
                                  colorClass = "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                                }

                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setSelectedGridCell({
                                      type: "simulation",
                                      id: item.id,
                                      taskTitle: config.title,
                                      itemLabel: item.label,
                                      correctAnswer: "Successful topology validation check passed",
                                      errRate,
                                      incorrectCount,
                                      totalAttempts,
                                      attempts,
                                      taskKey: "simulationLab"
                                    })}
                                    className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between h-28 cursor-pointer ${colorClass} ${
                                      isSelected ? "ring-2 ring-brand-cyan border-brand-cyan scale-102" : ""
                                    }`}
                                  >
                                    <div className="w-full">
                                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider opacity-85">
                                        <span>Check {itemIdx + 1}</span>
                                        <span className="font-mono">{errRate}% Error</span>
                                      </div>
                                      <p className="text-xs font-semibold mt-1.5 text-brand-text truncate leading-relaxed">
                                        {item.label}
                                      </p>
                                    </div>
                                    <div className="text-[9px] opacity-75 font-medium">
                                      {incorrectCount} student(s) failed this verification
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right: Details panel */}
                  <div className="bg-brand-bg/25 border border-brand-border/40 rounded-xl p-5 shadow-sm min-h-[300px]">
                    {selectedGridCell ? (() => {
                      const { type, errRate, incorrectCount, totalAttempts, correctAnswer, attempts } = selectedGridCell;

                      const errorDistribution: Record<string, number> = {};
                      if (type === "pretest") {
                        attempts.forEach((s: any) => {
                          const mistakesList = s.pretestMistakes?.[selectedModuleId] || [];
                          const mistake = mistakesList.find((m: any) => m.question === selectedGridCell.question);
                          if (mistake) {
                            const ans = mistake.userAnswer || "Unanswered";
                            errorDistribution[ans] = (errorDistribution[ans] || 0) + 1;
                          }
                        });
                      } else if (type === "simulation") {
                        attempts.forEach((s: any) => {
                          const mistakesList = s.interactiveMistakes?.[selectedModuleId]?.["simulationLab"] || [];
                          const mistake = mistakesList.find((m: any) => m.item === selectedGridCell.itemLabel);
                          if (mistake) {
                            const ans = "Validation Check Failed";
                            errorDistribution[ans] = (errorDistribution[ans] || 0) + mistake.count;
                          }
                        });
                      } else {
                        attempts.forEach((s: any) => {
                          const mistakesList = s.interactiveMistakes?.[selectedModuleId]?.[selectedGridCell.taskKey] || [];
                          const mistake = mistakesList.find((m: any) => m.item === selectedGridCell.itemLabel);
                          if (mistake) {
                            const ans = mistake.user || "No choice";
                            errorDistribution[ans] = (errorDistribution[ans] || 0) + 1;
                          }
                        });
                      }

                      const sortedErrors = Object.entries(errorDistribution).sort((a, b) => b[1] - a[1]);

                      return (
                        <div className="flex flex-col gap-5 animate-all duration-300">
                          <div>
                            <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-extrabold block mb-1">
                              {type === "pretest" ? "Pre-test Question Detail" : type === "simulation" ? `Simulation Check Detail: ${selectedGridCell.taskTitle}` : `Task Detail: ${selectedGridCell.taskTitle}`}
                            </span>
                            <h4 className="text-sm font-bold text-brand-text leading-relaxed">
                              {type === "pretest" ? selectedGridCell.question : selectedGridCell.itemLabel}
                            </h4>
                          </div>

                          <div className="border-t border-b border-brand-border/30 py-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-brand-muted">Failure rate:</span>
                              <span className={`font-mono font-bold ${
                                errRate > 50 ? "text-rose-400" : errRate > 20 ? "text-amber-400" : "text-emerald-400"
                              }`}>{errRate}% ({incorrectCount} / {totalAttempts} students)</span>
                            </div>
                            <div className="w-full h-2.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                              <div className={`h-full ${
                                errRate > 50 ? "bg-rose-500" : errRate > 20 ? "bg-amber-500" : "bg-emerald-500"
                              }`} style={{ width: `${errRate}%` }} />
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block mb-1.5">Correct Configuration / Answer</span>
                            <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold rounded-xl truncate">
                              {correctAnswer}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block mb-2">Common Misconceptions</span>
                            {sortedErrors.length === 0 ? (
                              <div className="text-center py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-400 font-semibold select-none">
                                🎉 No mistakes! 100% correctness recorded.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sortedErrors.map(([choice, count]) => {
                                  const ratio = Math.round((count / incorrectCount) * 100);
                                  return (
                                    <div key={choice} className="text-xs space-y-1">
                                      <div className="flex justify-between font-medium">
                                        <span className="truncate max-w-[150px]" title={choice}>{choice}</span>
                                        <span className="text-brand-muted shrink-0 font-mono">{count} ({ratio}%)</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-brand-bg/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500/70" style={{ width: `${ratio}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="h-full flex flex-col justify-center items-center text-center text-xs text-brand-muted p-4 italic select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-60"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        Select any grid cell on the left to investigate failure rates and common student misconceptions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY LOGS */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-brand-bg/15 border border-brand-border/30 rounded-xl p-4 text-xs leading-relaxed text-brand-muted flex items-start gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>
                    The system monitors student activity during pre-tests and interactive assessments. Triggering focus changes (blurring tabs) or exiting fullscreen mode generates automatic alerts. Reaching the limit of 3 warnings locks the assessment immediately and records a violation flag.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-brand-muted uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Total Violations</th>
                        <th className="py-3 px-4">Timeline / History of incidents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20">
                      {students.map((student) => {
                        const logs = student.cheatingLogs || [];
                        const violationsCount = logs.length;

                        return (
                          <tr key={student.id} className="hover:bg-brand-bg/25 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-brand-text text-sm">{student.name}</div>
                              <div className="text-[10px] text-brand-muted font-mono mt-0.5">{student.email}</div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {violationsCount === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  Clean
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                  Flagged
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center font-mono font-bold text-sm">
                              {violationsCount}
                            </td>
                            <td className="py-4 px-4">
                              {violationsCount === 0 ? (
                                <span className="text-xs text-brand-muted italic">No violations recorded. Academic integrity maintained.</span>
                              ) : (
                                <div className="flex flex-col gap-2 max-w-md max-h-40 overflow-y-auto pr-1">
                                  {logs.map((log: any, lIdx: number) => {
                                    const mTitle = modules.find(m => String(m.id) === String(log.moduleId))?.title || `Mod ${log.moduleId}`;
                                    return (
                                      <div key={lIdx} className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-2 text-[10px] space-y-1">
                                        <div className="flex justify-between font-semibold">
                                          <span className="text-rose-300 uppercase tracking-wider">{log.assessmentType} Assessment Locked</span>
                                          <span className="text-brand-muted">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-brand-text font-medium">
                                          Module: <span className="text-brand-cyan">{mTitle}</span>
                                        </div>
                                        <div className="text-brand-muted font-medium italic">
                                          Reason: "{log.reason}"
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
