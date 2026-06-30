"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface StudentRank {
  rank: number;
  name: string;
  email: string;
  score: number;
  course?: string;
  yearLevel?: string;
  section?: string;
}

const MOCK_LEADERBOARD: StudentRank[] = [
  { rank: 1, name: "Alex Chen", email: "alex@netmaster.edu", score: 1850, course: "BS Computer Science", yearLevel: "3rd Year", section: "CS3A" },
  { rank: 2, name: "Jake Lupig", email: "jake@netmaster.edu", score: 1450, course: "BS Information Technology", yearLevel: "3rd Year", section: "3A" },
  { rank: 3, name: "Maria Santos", email: "maria@netmaster.edu", score: 1200, course: "BS Information Technology", yearLevel: "2nd Year", section: "2B" },
  { rank: 4, name: "Liam O'Connor", email: "liam@netmaster.edu", score: 950, course: "BS Computer Science", yearLevel: "3rd Year", section: "CS3A" },
  { rank: 5, name: "Sophia Martinez", email: "sophia@netmaster.edu", score: 900, course: "BS Information Technology", yearLevel: "4th Year", section: "4A" },
  { rank: 6, name: "Kenji Tanaka", email: "kenji@netmaster.edu", score: 750, course: "BS Computer Science", yearLevel: "2nd Year", section: "CS2B" }
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<StudentRank[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
          const admitted = data.users.filter(
            (u: any) => u.role === "Student" && u.status === "admitted"
          );

          if (admitted.length > 0) {
            const mapped: StudentRank[] = admitted.map((s: any) => ({
              name: s.name || "Anonymous Student",
              email: s.email,
              score: s.xp || 0,
              course: s.course || "General IT",
              yearLevel: s.yearLevel || "",
              section: s.section || "",
              rank: 0
            }));

            // Sort by score desc, then name asc
            mapped.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return a.name.localeCompare(b.name);
            });

            // Assign Ranks
            const ranked = mapped.map((item, idx) => ({
              ...item,
              rank: idx + 1
            }));

            setLeaderboard(ranked);
          } else {
            setLeaderboard(MOCK_LEADERBOARD);
          }
        } else {
          setLeaderboard(MOCK_LEADERBOARD);
        }
      } catch (e) {
        console.error("Leaderboard fetch error, using fallback mock data:", e);
        setLeaderboard(MOCK_LEADERBOARD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Filter functionality
  const filteredLeaderboard = leaderboard.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.course && student.course.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCourse = courseFilter === "All" || student.course === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Extract top 3 for the podium
  const top1 = filteredLeaderboard.find((s) => s.rank === 1) || leaderboard[0];
  const top2 = filteredLeaderboard.find((s) => s.rank === 2) || leaderboard[1];
  const top3 = filteredLeaderboard.find((s) => s.rank === 3) || leaderboard[2];

  // Rest of the list (Rank 4+)
  const runnersUp = filteredLeaderboard.filter((s) => s.rank > 3);

  // Dynamic courses list for filter dropdown
  const courses = ["All", ...Array.from(new Set(leaderboard.map(s => s.course).filter(Boolean)))];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Global <span className="text-brand-cyan">Mastery Leaderboard</span>
          </h1>
          <p className="text-brand-muted text-base">
            See where you rank against peers as you calculate subnet grids, 
            configure redundant OSPF topologies, and gain ultimate network command.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-cyan/20 border-t-brand-cyan animate-spin"></div>
            <p className="text-brand-muted text-xs font-mono">Retrieving class scores...</p>
          </div>
        ) : (
          <>
            {/* Podium Showcase (Top 3) */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 max-w-4xl mx-auto px-4">
              
              {/* 2nd Place */}
              {top2 && (
                <div className="w-full md:w-64 bg-brand-card border border-brand-border/60 rounded-2xl p-6 flex flex-col items-center order-2 md:order-1 h-80 justify-end relative shadow-xl hover:scale-[1.01] transition-transform">
                  <div className="absolute top-4 left-4 bg-slate-400/10 border border-slate-400/30 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    #2 Rank
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-400/20 border-2 border-slate-400 flex items-center justify-center font-bold text-lg text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)] mb-4">
                    {getInitials(top2.name)}
                  </div>
                  <h3 className="font-extrabold text-sm text-center line-clamp-1">{top2.name}</h3>
                  <p className="text-[10px] text-brand-muted mt-1 text-center line-clamp-1">{top2.course}</p>
                  <div className="mt-4 bg-slate-400/10 border border-slate-400/20 text-slate-300 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider">
                    {top2.score} XP
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top1 && (
                <div className="w-full md:w-72 bg-brand-card-light border-2 border-brand-cyan rounded-3xl p-8 flex flex-col items-center order-1 md:order-2 h-96 justify-end relative shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:scale-[1.02] transition-all">
                  <div className="absolute -top-4 bg-brand-cyan text-brand-bg text-xs px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg">
                    🥇 Champion
                  </div>
                  <div className="w-20 h-20 rounded-full bg-brand-cyan/20 border-3 border-brand-cyan flex items-center justify-center font-black text-2xl text-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.2)] mb-4">
                    {getInitials(top1.name)}
                  </div>
                  <h3 className="font-black text-base text-center line-clamp-1">{top1.name}</h3>
                  <p className="text-xs text-brand-muted mt-1 text-center line-clamp-1">{top1.course}</p>
                  <div className="mt-4 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan px-5 py-2.5 rounded-2xl text-sm font-mono font-black tracking-widest shadow-inner">
                    {top1.score} XP
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3 && (
                <div className="w-full md:w-64 bg-brand-card border border-brand-border/60 rounded-2xl p-6 flex flex-col items-center order-3 h-72 justify-end relative shadow-xl hover:scale-[1.01] transition-transform">
                  <div className="absolute top-4 left-4 bg-amber-700/10 border border-amber-700/30 text-amber-500 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    #3 Rank
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center font-bold text-base text-amber-500 shadow-[0_0_15px_rgba(180,83,9,0.1)] mb-4">
                    {getInitials(top3.name)}
                  </div>
                  <h3 className="font-extrabold text-sm text-center line-clamp-1">{top3.name}</h3>
                  <p className="text-[10px] text-brand-muted mt-1 text-center line-clamp-1">{top3.course}</p>
                  <div className="mt-4 bg-amber-700/10 border border-amber-700/20 text-amber-500 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider">
                    {top3.score} XP
                  </div>
                </div>
              )}
            </div>

            {/* Filter and Table Container */}
            <div className="max-w-5xl mx-auto bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8">
              {/* Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 border-b border-brand-border/40 pb-6">
                <h2 className="text-xl font-bold tracking-tight w-full md:w-auto">Class Rankings</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Search classmates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-brand-bg text-brand-text border border-brand-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-cyan/60"
                    />
                  </div>

                  {/* Course Dropdown */}
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="bg-brand-bg text-brand-text border border-brand-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-cyan/60 cursor-pointer"
                  >
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course === "All" ? "All Courses" : course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table list */}
              {filteredLeaderboard.length === 0 ? (
                <div className="text-center p-12 text-brand-muted text-xs">
                  No peers match the search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/60 text-brand-muted font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-4 px-4">Rank</th>
                        <th className="py-4 px-4">Student</th>
                        <th className="py-4 px-4">Course Details</th>
                        <th className="py-4 px-4 text-right">Mastery Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/40">
                      {/* Top 3 as table lines also, for completeness, plus the rest */}
                      {filteredLeaderboard.map((student) => {
                        const isTop3 = student.rank <= 3;
                        return (
                          <tr
                            key={student.email}
                            className={`hover:bg-brand-card-light/20 transition-colors ${
                              isTop3 ? "font-bold text-brand-text" : "text-brand-text/90"
                            }`}
                          >
                            <td className="py-4 px-4 font-mono font-bold">
                              {student.rank === 1 ? (
                                <span className="text-brand-cyan text-sm">🥇 1</span>
                              ) : student.rank === 2 ? (
                                <span className="text-slate-300 text-sm">🥈 2</span>
                              ) : student.rank === 3 ? (
                                <span className="text-amber-500 text-sm">🥉 3</span>
                              ) : (
                                `#${student.rank}`
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  student.rank === 1
                                    ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30"
                                    : student.rank === 2
                                    ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                                    : student.rank === 3
                                    ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                                    : "bg-brand-bg border border-brand-border text-brand-muted"
                                }`}>
                                  {getInitials(student.name)}
                                </div>
                                <div>
                                  <div className="font-extrabold">{student.name}</div>
                                  <div className="text-[10px] text-brand-muted line-clamp-1">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-brand-muted">
                              <div className="font-medium text-brand-text/80">{student.course}</div>
                              <div className="text-[9px] font-mono">
                                {student.yearLevel && `${student.yearLevel}`}
                                {student.section && ` • Section ${student.section}`}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-black text-brand-cyan text-sm">
                              {student.score} XP
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
