"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

const TrophyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Left Handle */}
    <path d="M6 5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
    
    {/* Right Handle */}
    <path d="M18 5h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
    
    {/* Stem */}
    <line x1="12" y1="15" x2="12" y2="20" strokeWidth="3" />
    
    {/* Base */}
    <polygon points="6,22 18,22 16,20 8,20" fill="currentColor" stroke="currentColor" strokeWidth="2" />

    {/* The Cup (Solid) */}
    <path d="M6 2h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V2z" fill="currentColor" />
  </svg>
);

type StudentRank = {
  rank: number;
  name: string;
  email: string;
  score: number;
  studentId?: string;
  course?: string;
};

export default function StudentLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<StudentRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
          // Filter admitted students
          const admittedStudents = data.users.filter(
            (u: any) => u.role === "Student" && u.status === "admitted"
          );

          // Calculate score for each student
          const ranked: StudentRank[] = admittedStudents.map((s: any) => {
            let totalScore = 0;

            // Sum pre-test scores
            if (s.pretestScores) {
              Object.values(s.pretestScores).forEach((val: any) => {
                totalScore += Number(val) || 0;
              });
            }

            // Sum interactive activity scores
            if (s.interactiveScores) {
              Object.values(s.interactiveScores).forEach((moduleScores: any) => {
                if (moduleScores) {
                  Object.values(moduleScores).forEach((taskScore: any) => {
                    totalScore += Number(taskScore) || 0;
                  });
                }
              });
            }

            return {
              name: s.name,
              email: s.email,
              score: totalScore,
              studentId: s.studentId,
              course: s.course
            };
          });

          // Sort descending by score, then alphabetically by name
          ranked.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return a.name.localeCompare(b.name);
          });

          // Assign ranks (handle ties or index-based)
          const finalRanked = ranked.slice(0, 20).map((item, idx) => ({
            ...item,
            rank: idx + 1
          }));

          setLeaderboard(finalRanked);
        }
      } catch (e) {
        console.error("Error loading leaderboard:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/student/leaderboard" />
      <main className="p-8 flex-grow w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Class Leaderboard</h1>
          <p className="text-brand-muted text-sm mt-1">See how you rank against your fellow network engineering peers.</p>
        </div>

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
            <span className="text-sm font-semibold text-brand-cyan animate-pulse">Loading Leaderboard...</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm">
            No students are currently ranked. Make sure your account is approved and complete some activities!
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium Highlights */}
            <div className="grid grid-cols-3 gap-4 text-center items-end pt-4 pb-2">
              {/* #2 Silver */}
              {leaderboard.length > 1 && (
                <div className="bg-brand-card border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center h-40 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
                  <TrophyIcon className="w-10 h-10 text-slate-300 drop-shadow-[0_2px_8px_rgba(148,163,184,0.35)] mb-1" />
                  <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">Rank 2</div>
                  <div className="font-extrabold text-brand-text truncate max-w-full text-sm mt-1">{leaderboard[1].name}</div>
                  <div className="text-brand-cyan font-bold text-xs mt-1 font-mono">{leaderboard[1].score} pts</div>
                </div>
              )}

              {/* #1 Gold */}
              {leaderboard.length > 0 && (
                <div className="bg-brand-card border border-yellow-500/35 rounded-xl p-5 flex flex-col items-center justify-center h-48 relative overflow-hidden group shadow-2xl scale-105 z-10">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400"></div>
                  <TrophyIcon className="w-12 h-12 text-yellow-400 drop-shadow-[0_2px_12px_rgba(234,179,8,0.45)] mb-1.5 animate-bounce-subtle" />
                  <div className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider">Rank 1</div>
                  <div className="font-black text-brand-text truncate max-w-full text-base mt-1">{leaderboard[0].name}</div>
                  <div className="text-brand-cyan font-black text-sm mt-1 font-mono">{leaderboard[0].score} pts</div>
                </div>
              )}

              {/* #3 Bronze */}
              {leaderboard.length > 2 && (
                <div className="bg-brand-card border border-amber-800/50 rounded-xl p-4 flex flex-col items-center justify-center h-36 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600"></div>
                  <TrophyIcon className="w-8 h-8 text-amber-600 drop-shadow-[0_2px_6px_rgba(217,119,6,0.35)] mb-1" />
                  <div className="text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">Rank 3</div>
                  <div className="font-extrabold text-brand-text truncate max-w-full text-xs mt-1">{leaderboard[2].name}</div>
                  <div className="text-brand-cyan font-bold text-xs mt-1 font-mono">{leaderboard[2].score} pts</div>
                </div>
              )}
            </div>

            {/* Main Leaderboard Table */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-brand-muted uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4 w-20">Rank</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Course / Details</th>
                      <th className="py-3 px-4 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {leaderboard.map((student) => {
                      const isTop3 = student.rank <= 3;
                      return (
                        <tr key={student.email} className={`hover:bg-brand-bg/25 transition-colors ${
                          student.rank === 1 ? "bg-yellow-500/5" : ""
                        }`}>
                          <td className="py-4 px-4 font-mono font-bold text-sm flex items-center">
                            {student.rank === 1 && <TrophyIcon className="w-4 h-4 text-yellow-400 mr-1.5 shrink-0" />}
                            {student.rank === 2 && <TrophyIcon className="w-4 h-4 text-slate-300 mr-1.5 shrink-0" />}
                            {student.rank === 3 && <TrophyIcon className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />}
                            <span className={isTop3 ? "text-brand-cyan font-black" : "text-brand-muted"}>
                              #{student.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-extrabold text-brand-text text-sm">{student.name}</span>
                          </td>
                          <td className="py-4 px-4 text-brand-muted">
                            {student.course || "General Student"}
                            {student.studentId && <span className="text-[10px] font-mono ml-2">({student.studentId})</span>}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-sm text-brand-text">
                            {student.score} <span className="text-[10px] text-brand-muted font-normal">pts</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
