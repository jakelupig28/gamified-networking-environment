"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

type Badge = {
  id: string;
  name: string;
  description: string;
  criteria: string;
  imagePath: string;
  isDefault: boolean;
};

type EarnedBadge = {
  badgeId: string;
  awardedAt: string;
  awardedBy: string;
};

export default function StudentAchievementsPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Student");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName.split(" ")[0]);

    const fetchData = async () => {
      try {
        const email = localStorage.getItem("userEmail") || "";

        const [badgesRes, usersRes] = await Promise.all([
          fetch("/api/badges"),
          fetch("/api/users"),
        ]);

        const badgesData = await badgesRes.json();
        const usersData = await usersRes.json();

        if (badgesData.success) setBadges(badgesData.badges);

        if (usersData.success && usersData.users) {
          const currentUser = usersData.users.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (currentUser?.earnedBadges) {
            setEarnedBadges(currentUser.earnedBadges);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const isEarned = (badgeId: string) =>
    earnedBadges.some((eb) => eb.badgeId === badgeId);

  const getAwardInfo = (badgeId: string) =>
    earnedBadges.find((eb) => eb.badgeId === badgeId);

  const earnedCount = badges.filter((b) => isEarned(b.id)).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/student/achievements" />

      <main className="p-10 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        <header className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-2">
            Student Achievements
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Your Badges & Achievements
          </h1>
          <p className="text-brand-muted text-sm max-w-xl leading-relaxed">
            {isLoading
              ? "Loading your achievements..."
              : earnedCount === 0
              ? "Start your journey! Complete course activities and challenges to earn digital badges."
              : `Congratulations, ${userName}! You have earned ${earnedCount} out of ${totalCount} available badges.`}
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Badge Collection */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Earned Badges */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan border-b border-brand-border/40 pb-2 flex-grow">
                    Earned Badges
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-1 ml-4 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                    {earnedCount} earned
                  </span>
                </div>

                {earnedCount === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/50">
                        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-brand-muted mb-1">No badges earned yet</p>
                    <p className="text-xs text-brand-muted/70 max-w-xs mx-auto">
                      Keep up with your coursework and interactive activities. Badges are awarded by your professor for outstanding achievements!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {badges
                      .filter((b) => isEarned(b.id))
                      .map((badge) => {
                        const award = getAwardInfo(badge.id);
                        return (
                          <div
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            className="bg-brand-bg/40 border border-brand-border rounded-2xl overflow-hidden hover:border-brand-cyan/30 transition-all cursor-pointer group flex flex-col"
                          >
                            {/* Badge Image Hero */}
                            <div className="relative w-full aspect-square bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg flex items-center justify-center p-5 overflow-hidden">
                              <img
                                src={badge.imagePath}
                                alt={badge.name}
                                className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                              />
                              {/* Earned glow ring */}
                              <div className="absolute inset-2 rounded-xl ring-2 ring-brand-cyan/15 ring-offset-0 pointer-events-none"></div>
                              {/* Preview overlay */}
                              <div
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage({ src: badge.imagePath, name: badge.name });
                                }}
                              >
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
                                  </svg>
                                </div>
                              </div>
                              {/* Earned check */}
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            </div>
                            {/* Info */}
                            <div className="p-3 flex flex-col gap-1">
                              <h3 className="text-xs font-bold truncate">{badge.name}</h3>
                              {award && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                  <span className="text-[9px] font-semibold text-green-400">
                                    Earned {new Date(award.awardedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* All Available Badges */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-6 border-b border-brand-border/40 pb-2">
                  All Available Badges
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {badges.map((badge) => {
                    const earned = isEarned(badge.id);
                    const award = getAwardInfo(badge.id);
                    return (
                      <div
                        key={badge.id}
                        onClick={() => {
                          if (earned) {
                            setSelectedBadge(badge);
                          }
                        }}
                        className={`rounded-2xl border transition-all flex flex-col overflow-hidden ${
                          earned
                            ? "bg-brand-bg/40 border-brand-cyan/20 hover:border-brand-cyan/40 cursor-pointer"
                            : "bg-brand-bg/20 border-brand-border/50 cursor-default opacity-50"
                        }`}
                      >
                        {/* Badge Image */}
                        <div className={`relative w-full aspect-square flex items-center justify-center p-5 overflow-hidden ${
                          earned
                            ? "bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg"
                            : "bg-brand-bg/30"
                        }`}>
                          <img
                            src={badge.imagePath}
                            alt={badge.name}
                            className={`w-full h-full object-contain drop-shadow-md transition-transform duration-300 ${
                              earned ? "group-hover:scale-110" : "grayscale opacity-40"
                            }`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {/* Preview overlay */}
                          {earned && (
                            <div
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage({ src: badge.imagePath, name: badge.name });
                              }}
                            >
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
                                </svg>
                              </div>
                            </div>
                          )}
                          {/* Status icon */}
                          {earned ? (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-border/60 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/60"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-3 flex flex-col gap-1">
                          <h3 className={`text-xs font-bold truncate ${earned ? "" : "text-brand-muted"}`}>
                            {badge.name}
                          </h3>
                          {earned && award ? (
                            <span className="text-[9px] font-semibold text-green-400">
                              ✓ Earned {new Date(award.awardedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-brand-muted/50">
                              🔒 Not yet earned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Progress & Stats */}
            <div className="flex flex-col gap-8">
              {/* Achievement Progress */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-6 border-b border-brand-border/40 pb-2 w-full text-left">
                  Badge Progress
                </h2>

                {/* Circular Indicator */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      stroke="currentColor" strokeWidth="6" fill="transparent"
                      className="text-brand-bg"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      stroke="currentColor" strokeWidth="6" fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercent / 100)}`}
                      className="text-brand-cyan transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-brand-text">{earnedCount}</span>
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                      of {totalCount}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-brand-muted mb-2">
                  {progressPercent}% of badges collected
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                  <div
                    className="h-full bg-brand-cyan transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2">
                  Achievement Stats
                </h2>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border/30">
                    <span className="text-brand-muted">Badges Earned</span>
                    <span className="font-bold text-green-400 font-mono">{earnedCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border/30">
                    <span className="text-brand-muted">Badges Remaining</span>
                    <span className="font-bold text-brand-muted font-mono">{totalCount - earnedCount}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span>Total Available</span>
                    <span className="font-mono text-brand-cyan">{totalCount}</span>
                  </div>
                </div>
              </div>

              {/* Most Recent Badge */}
              {earnedCount > 0 && (() => {
                const sortedEarned = [...earnedBadges].sort(
                  (a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()
                );
                const latestAward = sortedEarned[0];
                const latestBadge = badges.find(b => b.id === latestAward?.badgeId);
                
                if (!latestBadge || !latestAward) return null;
                
                return (
                  <div className="bg-brand-card border border-brand-cyan/20 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4 border-b border-brand-border/40 pb-2">
                      Latest Achievement
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-brand-bg border border-brand-cyan/20 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={latestBadge.imagePath} alt="" className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">{latestBadge.name}</h3>
                        <p className="text-[10px] text-brand-muted mt-0.5">
                          Awarded by {latestAward.awardedBy}
                        </p>
                        <p className="text-[9px] text-brand-cyan font-semibold mt-1">
                          {new Date(latestAward.awardedAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* ===== FULL-SCREEN IMAGE PREVIEW LIGHTBOX ===== */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex flex-col items-center gap-5 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              className="max-w-[80vw] max-h-[75vh] object-contain rounded-2xl drop-shadow-2xl"
            />
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-white/15">
              <span className="text-white font-bold text-sm">{previewImage.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== BADGE DETAIL MODAL ===== */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
            {/* Hero Badge Image */}
            <div className={`relative w-full bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg flex items-center justify-center p-8 ${
              !isEarned(selectedBadge.id) ? "opacity-60 grayscale" : ""
            }`}>
              <div
                className="w-36 h-36 flex items-center justify-center cursor-zoom-in hover:scale-105 transition-transform duration-300"
                onClick={() => setPreviewImage({ src: selectedBadge.imagePath, name: selectedBadge.name })}
              >
                <img
                  src={selectedBadge.imagePath}
                  alt={selectedBadge.name}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 bg-brand-bg/60 hover:bg-brand-bg rounded-lg transition-colors text-brand-muted hover:text-brand-text border border-brand-border/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              {/* Status badge */}
              <span className={`absolute top-4 left-4 text-[8px] font-bold px-2 py-1 rounded-lg border backdrop-blur-sm ${
                isEarned(selectedBadge.id)
                  ? "bg-green-500/20 text-green-300 border-green-500/25"
                  : "bg-brand-border/40 text-brand-muted border-brand-border/50"
              }`}>
                {isEarned(selectedBadge.id) ? "✓ EARNED" : "🔒 LOCKED"}
              </span>
              {/* Click to enlarge hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] text-brand-muted/60 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                Click image to enlarge
              </div>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <h2 className="text-xl font-bold mb-1.5">{selectedBadge.name}</h2>

              <p className="text-sm text-brand-muted leading-relaxed mb-4">
                {selectedBadge.description}
              </p>

              {selectedBadge.criteria && (
                <div className="w-full bg-brand-bg/50 border border-brand-border/30 rounded-xl p-4 mb-4 text-left">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-1.5">How to Earn</h4>
                  <p className="text-xs text-brand-text leading-relaxed">{selectedBadge.criteria}</p>
                </div>
              )}

              {isEarned(selectedBadge.id) && (() => {
                const award = getAwardInfo(selectedBadge.id);
                if (!award) return null;
                return (
                  <div className="w-full bg-green-500/5 border border-green-500/15 rounded-xl p-4 text-left">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1.5">Award Details</h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-muted">Awarded by</span>
                      <span className="font-semibold text-brand-text">{award.awardedBy}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-brand-muted">Date</span>
                      <span className="font-semibold text-brand-text">
                        {new Date(award.awardedAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-5 w-full bg-brand-bg border border-brand-border text-brand-text font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-card transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
