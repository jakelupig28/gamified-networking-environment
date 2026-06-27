"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

type Badge = {
  id: string;
  name: string;
  description: string;
  criteria: string;
  imagePath: string;
  isDefault: boolean;
  createdAt: string;
};

type Student = {
  id: number;
  name: string;
  email: string;
  role: string;
  status?: string;
  earnedBadges?: { badgeId: string; awardedAt: string; awardedBy: string }[];
};

export default function ProfessorBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create badge form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeCriteria, setNewBadgeCriteria] = useState("");
  const [newBadgeImage, setNewBadgeImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Award badge modal
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedBadgeForAward, setSelectedBadgeForAward] = useState<Badge | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardSearch, setAwardSearch] = useState("");

  // Badge detail view
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<Badge | null>(null);

  // Full-screen image preview
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete confirmation
  const [badgeToDelete, setBadgeToDelete] = useState<Badge | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [badgesRes, usersRes] = await Promise.all([
        fetch("/api/badges"),
        fetch("/api/users"),
      ]);
      const badgesData = await badgesRes.json();
      const usersData = await usersRes.json();

      if (badgesData.success) setBadges(badgesData.badges);
      if (usersData.success) {
        const admittedStudents = usersData.users.filter(
          (u: any) => u.role === "Student" && u.status === "admitted"
        );
        setStudents(admittedStudents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBadgeImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setNewBadgeImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeName.trim() || !newBadgeDesc.trim()) return;

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", newBadgeName.trim());
      formData.append("description", newBadgeDesc.trim());
      formData.append("criteria", newBadgeCriteria.trim());
      if (newBadgeImage) {
        formData.append("image", newBadgeImage);
      }

      const res = await fetch("/api/badges", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showNotification("success", `Badge "${newBadgeName}" created successfully!`);
        setNewBadgeName("");
        setNewBadgeDesc("");
        setNewBadgeCriteria("");
        setNewBadgeImage(null);
        setImagePreview(null);
        setShowCreateForm(false);
        fetchData();
      } else {
        showNotification("error", data.message || "Failed to create badge");
      }
    } catch (err) {
      showNotification("error", "Server error creating badge");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBadge = async (badge: Badge) => {
    try {
      const res = await fetch(`/api/badges?id=${badge.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotification("success", `Badge "${badge.name}" deleted.`);
        setBadgeToDelete(null);
        if (selectedBadgeDetail?.id === badge.id) setSelectedBadgeDetail(null);
        fetchData();
      } else {
        showNotification("error", data.message || "Failed to delete badge");
      }
    } catch {
      showNotification("error", "Server error deleting badge");
    }
  };

  const openAwardModal = (badge: Badge) => {
    setSelectedBadgeForAward(badge);
    setSelectedStudents([]);
    setAwardSearch("");
    setShowAwardModal(true);
  };

  const handleAwardBadge = async () => {
    if (!selectedBadgeForAward || selectedStudents.length === 0) return;
    setIsAwarding(true);

    const professorName = localStorage.getItem("userName") || "Professor";
    let successCount = 0;
    let errorMessages: string[] = [];

    for (const studentEmail of selectedStudents) {
      try {
        const res = await fetch("/api/badges/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            badgeId: selectedBadgeForAward.id,
            studentEmail,
            awardedBy: professorName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorMessages.push(`${studentEmail}: ${data.message}`);
        }
      } catch {
        errorMessages.push(`${studentEmail}: Server error`);
      }
    }

    if (successCount > 0) {
      showNotification(
        "success",
        `Badge "${selectedBadgeForAward.name}" awarded to ${successCount} student(s)!`
      );
    }
    if (errorMessages.length > 0) {
      showNotification("error", errorMessages.join("; "));
    }

    setShowAwardModal(false);
    setIsAwarding(false);
    fetchData();
  };

  const handleRevokeBadge = async (badgeId: string, studentEmail: string) => {
    try {
      const res = await fetch(
        `/api/badges/award?badgeId=${badgeId}&studentEmail=${encodeURIComponent(studentEmail)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Badge revoked.");
        fetchData();
      } else {
        showNotification("error", data.message);
      }
    } catch {
      showNotification("error", "Server error revoking badge");
    }
  };

  const getStudentsWithBadge = (badgeId: string) => {
    return students.filter((s) =>
      s.earnedBadges?.some((eb) => eb.badgeId === badgeId)
    );
  };

  const filteredStudentsForAward = students.filter((s) => {
    const search = awardSearch.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search);
    const alreadyHasBadge = s.earnedBadges?.some(
      (eb) => eb.badgeId === selectedBadgeForAward?.id
    );
    return matchesSearch && !alreadyHasBadge;
  });

  const defaultBadges = badges.filter((b) => b.isDefault);
  const customBadges = badges.filter((b) => !b.isDefault);

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/badges" />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl border shadow-2xl text-sm font-semibold flex items-center gap-3 animate-scaleIn ${
            notification.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {notification.type === "success" ? (
              <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
            ) : (
              <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
            )}
          </svg>
          {notification.message}
        </div>
      )}

      <main className="p-8 flex-grow w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-1">Badge Management</div>
            <h1 className="text-3xl font-bold tracking-tight">Digital Badges</h1>
            <p className="text-sm text-brand-muted mt-1">
              Manage and award digital badges to recognize student achievements.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 px-5 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Badge
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <>
            {/* Default Badges */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold">Default Badges</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                  {defaultBadges.length} badges
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {defaultBadges.map((badge) => {
                  const awardedTo = getStudentsWithBadge(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className="bg-brand-card border border-brand-border rounded-2xl shadow-md hover:border-brand-cyan/40 transition-all group cursor-pointer flex flex-col overflow-hidden"
                      onClick={() => setSelectedBadgeDetail(badge)}
                    >
                      {/* Large Badge Image */}
                      <div className="relative w-full aspect-square bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg flex items-center justify-center p-4 overflow-hidden">
                        <img
                          src={badge.imagePath}
                          alt={badge.name}
                          className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {/* Click to preview overlay */}
                        <div
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({ src: badge.imagePath, name: badge.name });
                          }}
                        >
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 border border-white/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
                            </svg>
                          </div>
                        </div>
                        {/* Tag */}
                        <span className="absolute top-2 right-2 text-[7px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/25 backdrop-blur-sm">
                          DEFAULT
                        </span>
                      </div>
                      {/* Badge Info */}
                      <div className="p-3 flex flex-col gap-1.5 flex-grow">
                        <h3 className="text-xs font-bold text-brand-text truncate" title={badge.name}>{badge.name}</h3>
                        <p className="text-[10px] text-brand-muted leading-snug line-clamp-2 flex-grow">
                          {badge.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border/30 mt-1">
                          <span className="text-[9px] text-brand-muted font-medium">
                            {awardedTo.length > 0 ? `${awardedTo.length} earned` : "None"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAwardModal(badge);
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider text-brand-cyan hover:text-brand-cyan-hover transition-colors"
                          >
                            Award
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Custom Badges */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold">Custom Badges</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {customBadges.length} badges
                </span>
              </div>

              {customBadges.length === 0 ? (
                <div className="bg-brand-card border border-dashed border-brand-border/40 rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <p className="text-sm text-brand-muted font-medium mb-1">No custom badges created yet.</p>
                  <p className="text-xs text-brand-muted/70">Click &quot;Create Badge&quot; to design your own achievement badges.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {customBadges.map((badge) => {
                    const awardedTo = getStudentsWithBadge(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className="bg-brand-card border border-brand-border rounded-2xl shadow-md hover:border-purple-500/40 transition-all group cursor-pointer flex flex-col overflow-hidden"
                        onClick={() => setSelectedBadgeDetail(badge)}
                      >
                        {/* Large Badge Image */}
                        <div className="relative w-full aspect-square bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg flex items-center justify-center p-4 overflow-hidden">
                          {badge.imagePath && badge.imagePath !== "/badges/default-custom.png" ? (
                            <img
                              src={badge.imagePath}
                              alt={badge.name}
                              className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/60">
                              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                          )}
                          {/* Click to preview overlay */}
                          <div
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ src: badge.imagePath, name: badge.name });
                            }}
                          >
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 border border-white/30">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
                              </svg>
                            </div>
                          </div>
                          {/* Tag */}
                          <span className="absolute top-2 right-2 text-[7px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/25 backdrop-blur-sm">
                            CUSTOM
                          </span>
                        </div>
                        {/* Badge Info */}
                        <div className="p-3 flex flex-col gap-1.5 flex-grow">
                          <h3 className="text-xs font-bold text-brand-text truncate" title={badge.name}>{badge.name}</h3>
                          <p className="text-[10px] text-brand-muted leading-snug line-clamp-2 flex-grow">
                            {badge.description}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-brand-border/30 mt-1">
                            <span className="text-[9px] text-brand-muted font-medium">
                              {awardedTo.length > 0 ? `${awardedTo.length} earned` : "None"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBadgeToDelete(badge);
                                }}
                                className="text-[9px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                              >
                                Del
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAwardModal(badge);
                                }}
                                className="text-[9px] font-bold uppercase tracking-wider text-brand-cyan hover:text-brand-cyan-hover transition-colors"
                              >
                                Award
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ===== CREATE BADGE MODAL ===== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-border/30">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Create New Badge</h2>
                  <p className="text-xs text-brand-muted mt-1">Design a custom achievement badge for your students.</p>
                </div>
                <button onClick={() => { setShowCreateForm(false); setImagePreview(null); setNewBadgeImage(null); }} className="p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-muted hover:text-brand-text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateBadge} className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Badge Image</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-border hover:border-brand-cyan/40 rounded-xl p-6 text-center cursor-pointer transition-colors bg-brand-bg/30"
                >
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-contain rounded-xl" />
                      <span className="text-[10px] text-brand-muted">Click or drop to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span className="text-xs font-medium">Drag & drop or click to upload</span>
                      <span className="text-[10px]">PNG, JPG, SVG • Max 10MB</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Badge Name *</label>
                <input
                  type="text"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  required
                  placeholder="e.g., Network Architect"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors placeholder:text-brand-muted/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Description *</label>
                <textarea
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe what this badge represents..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors resize-none placeholder:text-brand-muted/50"
                />
              </div>

              {/* Criteria */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Earning Criteria</label>
                <textarea
                  value={newBadgeCriteria}
                  onChange={(e) => setNewBadgeCriteria(e.target.value)}
                  rows={2}
                  placeholder="What students need to do to earn this badge..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors resize-none placeholder:text-brand-muted/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setImagePreview(null); setNewBadgeImage(null); }}
                  className="flex-1 bg-brand-bg border border-brand-border text-brand-text font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newBadgeName.trim() || !newBadgeDesc.trim()}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  {isCreating ? "Creating..." : "Create Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== AWARD BADGE MODAL ===== */}
      {showAwardModal && selectedBadgeForAward && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-border/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-bg border border-brand-border overflow-hidden flex items-center justify-center">
                    <img src={selectedBadgeForAward.imagePath} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Award Badge</h2>
                    <p className="text-xs text-brand-muted mt-0.5">{selectedBadgeForAward.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAwardModal(false)} className="p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-muted hover:text-brand-text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={awardSearch}
                  onChange={(e) => setAwardSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors placeholder:text-brand-muted/50"
                />
              </div>

              {/* Student List */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 mb-5">
                {filteredStudentsForAward.length === 0 ? (
                  <div className="text-center py-8 text-brand-muted text-sm">
                    {students.length === 0
                      ? "No admitted students available."
                      : "All eligible students already have this badge."}
                  </div>
                ) : (
                  filteredStudentsForAward.map((student) => {
                    const isSelected = selectedStudents.includes(student.email);
                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudents((prev) =>
                            isSelected
                              ? prev.filter((e) => e !== student.email)
                              : [...prev, student.email]
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-brand-cyan/10 border-brand-cyan/30"
                            : "bg-brand-bg/30 border-brand-border hover:border-brand-border"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-brand-cyan border-brand-cyan"
                              : "border-brand-border"
                          }`}
                        >
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-bg"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-brand-text truncate">{student.name}</div>
                          <div className="text-[10px] text-brand-muted font-mono">{student.email}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAwardModal(false)}
                  className="flex-1 bg-brand-bg border border-brand-border text-brand-text font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAwardBadge}
                  disabled={isAwarding || selectedStudents.length === 0}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  {isAwarding
                    ? "Awarding..."
                    : `Award to ${selectedStudents.length} Student(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {badgeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-sm shadow-2xl animate-scaleIn p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Delete Badge</h3>
                <p className="text-sm text-brand-muted">
                  Are you sure you want to delete &quot;{badgeToDelete.name}&quot;? This will also remove it from all students who have earned it.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setBadgeToDelete(null)}
                  className="flex-1 bg-brand-bg border border-brand-border text-brand-text font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBadge(badgeToDelete)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ===== BADGE DETAIL PANEL ===== */}
      {selectedBadgeDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            {/* Hero Badge Image */}
            <div className="relative w-full bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg flex items-center justify-center p-8">
              <div
                className="w-40 h-40 flex items-center justify-center cursor-zoom-in hover:scale-105 transition-transform duration-300"
                onClick={() => setPreviewImage({ src: selectedBadgeDetail.imagePath, name: selectedBadgeDetail.name })}
              >
                <img
                  src={selectedBadgeDetail.imagePath}
                  alt={selectedBadgeDetail.name}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              <button
                onClick={() => setSelectedBadgeDetail(null)}
                className="absolute top-4 right-4 p-2 bg-brand-bg/60 hover:bg-brand-bg rounded-lg transition-colors text-brand-muted hover:text-brand-text border border-brand-border/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span className={`absolute top-4 left-4 text-[8px] font-bold px-2 py-1 rounded-lg border backdrop-blur-sm ${
                selectedBadgeDetail.isDefault
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/25"
                  : "bg-purple-500/20 text-purple-300 border-purple-500/25"
              }`}>
                {selectedBadgeDetail.isDefault ? "DEFAULT" : "CUSTOM"}
              </span>
              {/* Click to enlarge hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] text-brand-muted/60 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                Click image to enlarge
              </div>
            </div>

            <div className="p-6">
              {/* Name & Description */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold mb-1.5">{selectedBadgeDetail.name}</h2>
                <p className="text-sm text-brand-muted leading-relaxed">{selectedBadgeDetail.description}</p>
              </div>

              {/* Criteria */}
              {selectedBadgeDetail.criteria && (
                <div className="mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-2">Earning Criteria</h4>
                  <p className="text-sm text-brand-text bg-brand-bg/50 border border-brand-border/30 rounded-xl p-4 leading-relaxed">
                    {selectedBadgeDetail.criteria}
                  </p>
                </div>
              )}

              {/* Students who earned this badge */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-3">
                  Awarded Students ({getStudentsWithBadge(selectedBadgeDetail.id).length})
                </h4>
                {getStudentsWithBadge(selectedBadgeDetail.id).length === 0 ? (
                  <div className="text-center py-6 text-brand-muted text-xs bg-brand-bg/30 border border-dashed border-brand-border/30 rounded-xl">
                    No students have earned this badge yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getStudentsWithBadge(selectedBadgeDetail.id).map((student) => {
                      const award = student.earnedBadges?.find(
                        (eb) => eb.badgeId === selectedBadgeDetail.id
                      );
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-brand-bg/30 border border-brand-border rounded-xl"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-brand-text truncate">{student.name}</div>
                            <div className="text-[10px] text-brand-muted font-mono">
                              {student.email}
                              {award && (
                                <span className="ml-2 text-brand-cyan">
                                  • Awarded {new Date(award.awardedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeBadge(selectedBadgeDetail.id, student.email)}
                            className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors shrink-0"
                          >
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border/30">
                <button
                  onClick={() => openAwardModal(selectedBadgeDetail)}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Award to Students
                </button>
                {!selectedBadgeDetail.isDefault && (
                  <button
                    onClick={() => {
                      setBadgeToDelete(selectedBadgeDetail);
                      setSelectedBadgeDetail(null);
                    }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider border border-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
