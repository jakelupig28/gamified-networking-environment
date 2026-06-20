"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminDashboardOverview() {
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeModules, setActiveModules] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          setUsers(usersData.users);
          setTotalUsers(usersData.users.length);
          
          // Sort users descending by ID (newest first)
          const sorted = [...usersData.users].sort((a: any, b: any) => b.id - a.id);
          setRecentUsers(sorted.slice(0, 4));
        }

        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();
        if (modulesData.success && modulesData.modules) {
          setModules(modulesData.modules);
          setActiveModules(modulesData.modules.length);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute Role Distribution Donut Chart Data
  const students = users.filter((u) => u.role === "Student");
  const professors = users.filter((u) => u.role === "Professor");
  const admins = users.filter((u) => u.role === "Admin");

  const studentsCount = students.length;
  const professorsCount = professors.length;
  const adminsCount = admins.length;

  const donutRadius = 50;
  const donutStrokeWidth = 11;
  const circumference = 2 * Math.PI * donutRadius; // 314.159

  const studentPct = totalUsers ? (studentsCount / totalUsers) * 100 : 0;
  const profPct = totalUsers ? (professorsCount / totalUsers) * 100 : 0;
  const adminPct = totalUsers ? (adminsCount / totalUsers) * 100 : 0;

  const studentStroke = (studentPct / 100) * circumference;
  const profStroke = (profPct / 100) * circumference;
  const adminStroke = (adminPct / 100) * circumference;

  // Compute Student Progress Bar Chart Data
  const totalTopicsCount = modules.reduce((acc, m) => {
    const topicsList = m.topics || [];
    return acc + topicsList.filter((t: any) => t.id !== 888888 && t.id !== 999999).length;
  }, 0) || 5; // fallback to 5 to prevent division by zero

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/admin/dashboard" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <header className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-2 flex items-center gap-2">
            <span>Admin</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="m9 18 6-6-6-6"/></svg>
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-brand-text">
            System Overview
          </h1>
          <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
            Real-time analytics and management interface for the NetMaster environment.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <>
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all">
                <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">Total Users</h3>
                <div className="text-3xl font-extrabold text-brand-cyan mb-2">{totalUsers}</div>
                <div className="text-xs text-brand-muted font-medium">Registered NetMaster accounts</div>
              </div>
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all">
                <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">Active Modules</h3>
                <div className="text-3xl font-extrabold text-brand-text mb-2">{activeModules}</div>
                <div className="text-xs text-brand-muted font-medium">Configured in curriculum</div>
              </div>
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all">
                <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">System Health</h3>
                <div className="text-3xl font-extrabold text-emerald-400 mb-2">99.9%</div>
                <div className="text-xs text-brand-muted font-medium">All services operational</div>
              </div>
            </div>

            {/* Graphs / Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Chart 1: User Distribution Donut */}
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text mb-4">User Distribution</h2>
                
                <div className="flex-grow flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                  {/* Center-text Overlay Donut */}
                  <div className="relative flex justify-center items-center select-none shrink-0">
                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
                      <circle
                        cx="70"
                        cy="70"
                        r={donutRadius}
                        fill="transparent"
                        className="stroke-brand-border/30"
                        strokeWidth={donutStrokeWidth}
                      />
                      {totalUsers > 0 && (
                        <>
                          {/* Students Segment (Cyan) */}
                          <circle
                            cx="70"
                            cy="70"
                            r={donutRadius}
                            fill="transparent"
                            className="stroke-brand-cyan transition-all duration-500"
                            strokeWidth={donutStrokeWidth}
                            strokeDasharray={`${studentStroke} ${circumference - studentStroke}`}
                            strokeDashoffset={0}
                          />
                          {/* Professors Segment (Emerald) */}
                          <circle
                            cx="70"
                            cy="70"
                            r={donutRadius}
                            fill="transparent"
                            className="stroke-emerald-400 transition-all duration-500"
                            strokeWidth={donutStrokeWidth}
                            strokeDasharray={`${profStroke} ${circumference - profStroke}`}
                            strokeDashoffset={-studentStroke}
                          />
                          {/* Admins Segment (Amber) */}
                          <circle
                            cx="70"
                            cy="70"
                            r={donutRadius}
                            fill="transparent"
                            className="stroke-amber-500 transition-all duration-500"
                            strokeWidth={donutStrokeWidth}
                            strokeDasharray={`${adminStroke} ${circumference - adminStroke}`}
                            strokeDashoffset={-(studentStroke + profStroke)}
                          />
                        </>
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold text-brand-text leading-none">{totalUsers}</span>
                      <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mt-1">Users</span>
                    </div>
                  </div>

                  {/* Legend details */}
                  <div className="flex flex-col gap-3 min-w-[140px]">
                    <div className="flex items-center justify-between gap-4 text-xs font-bold text-brand-text">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan inline-block shrink-0" />
                        <span>Students</span>
                      </div>
                      <span className="text-brand-muted">{studentsCount} ({studentPct.toFixed(0)}%)</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs font-bold text-brand-text">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                        <span>Professors</span>
                      </div>
                      <span className="text-brand-muted">{professorsCount} ({profPct.toFixed(0)}%)</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs font-bold text-brand-text">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                        <span>Admins</span>
                      </div>
                      <span className="text-brand-muted">{adminsCount} ({adminPct.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Student Progress Bars */}
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text mb-4">Student Learning Progress</h2>
                
                <div className="flex-grow flex flex-col gap-4.5 justify-center">
                  {students.length === 0 ? (
                    <div className="text-center py-10 text-brand-muted text-xs italic">
                      No student accounts found to track learning metrics.
                    </div>
                  ) : (
                    students.map((student) => {
                      const completedCount = Object.keys(student.completedTopics || {}).length;
                      const progressPct = Math.min(100, Math.round((completedCount / totalTopicsCount) * 100));
                      
                      // Calculate quiz scores average if available
                      const quizScores = Object.values(student.pretestScores || {}) as number[];
                      const avgQuiz = quizScores.length > 0
                        ? (quizScores.reduce((acc: number, v: number) => acc + v, 0) / quizScores.length)
                        : null;

                      return (
                        <div key={student.id} className="flex flex-col gap-1.5 pb-4 border-b border-brand-border/30 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-xs font-bold text-brand-text">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="truncate">{student.name || student.email}</span>
                              {avgQuiz !== null && (
                                <span className="text-[9px] bg-amber-500/10 border border-amber-500/25 text-amber-400 font-extrabold px-2 py-0.5 rounded-full select-none tracking-wide">
                                  🎯 Avg Quiz: {avgQuiz.toFixed(1)}/5
                                </span>
                              )}
                            </div>
                            <span className="text-brand-cyan whitespace-nowrap font-mono">{completedCount} / {totalTopicsCount} Topics ({progressPct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-brand-bg/50 border border-brand-border/40 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-cyan to-blue-500 rounded-full transition-all duration-700 shadow-glow shadow-brand-cyan/25" 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Registrations & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all">
                <h2 className="text-lg font-bold text-brand-text mb-4">Recent Registrations</h2>
                {recentUsers.length === 0 ? (
                  <div className="text-center py-8 text-brand-muted text-sm">
                    No users registered in the system.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-4 text-sm pb-4 border-b border-brand-border/50 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-xs shrink-0">
                          {(user.name || "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-brand-text truncate">{user.name || user.email}</p>
                          <p className="text-xs text-brand-muted truncate">{user.role} • {user.email}</p>
                        </div>
                        <div className="text-xs text-brand-muted shrink-0">
                          {user.status === "pending" ? (
                            <span className="text-yellow-500 font-bold text-[9px] uppercase tracking-wider">Pending</span>
                          ) : user.status === "admitted" ? (
                            <span className="text-green-500 font-bold text-[9px] uppercase tracking-wider">Admitted</span>
                          ) : (
                            <span className="text-brand-cyan font-bold text-[9px] uppercase tracking-wider">Active</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-6 shadow-sm hover:border-brand-border transition-all">
                <h2 className="text-lg font-bold text-brand-text mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                   <a href="/admin" className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                     <span className="text-xs font-bold">New User</span>
                   </a>
                   <a href="/professor/modules" className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                     <span className="text-xs font-bold">New Module</span>
                   </a>
                   <a href="#" className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                     <span className="text-xs font-bold">Reports</span>
                   </a>
                   <a href="#" className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                     <span className="text-xs font-bold">Network Status</span>
                   </a>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}