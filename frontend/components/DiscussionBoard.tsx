"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

// Preset Warning Drafts for Professors and Admins
const WARNING_DRAFTS = [
  {
    title: "Academic Integrity",
    message: "Reminder: Please maintain academic integrity in all discussions. Sharing direct solutions to tests, assignments, or quizzes is strictly prohibited."
  },
  {
    title: "Inappropriate Language",
    message: "Warning: Inappropriate language, offensive behavior, or profanity has been detected/reported. Please keep discussions professional and respectful."
  },
  {
    title: "Off-topic Posts",
    message: "Notice: Please keep discussions on-topic and focused on course materials and network labs. Use relevant channels for specific modules."
  },
  {
    title: "Spam & Flooding",
    message: "Warning: Multiple spam messages or repetitive posts detected. Please refrain from flooding the discussion channels."
  },
  {
    title: "System Announcement",
    message: "Announcement: Scheduled system maintenance or update. Please complete and save your active topology labs."
  }
];

// Helper to extract clean user initials for avatars
function getAvatarInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export default function DiscussionBoard({ activePath }: { activePath: string }) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0); // 0 = General Discussion
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [postError, setPostError] = useState("");
  const [isWarningChecked, setIsWarningChecked] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch user profile and modules list on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = localStorage.getItem("userEmail") || "";
        
        // Fetch users to find profile
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          const profile = usersData.users.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (profile) {
            setUserProfile(profile);
          }
        }

        // Fetch modules
        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();
        if (modulesData.success && modulesData.modules) {
          setModules(modulesData.modules);
        }
      } catch (e) {
        console.error("Error fetching discussion board initialization data:", e);
      }
    };

    fetchData();
  }, []);

  // 2. Fetch posts whenever selectedChannelId changes
  const fetchPosts = async (channelId: number) => {
    setIsLoadingPosts(true);
    setPostError("");
    try {
      const res = await fetch(`/api/discussions?moduleId=${channelId}`);
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Error fetching discussions:", e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedChannelId);
  }, [selectedChannelId]);

  // Scroll to bottom helper when posts change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

  // 3. Post a message
  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostMessage.trim()) return;

    setPostError("");
    const email = userProfile?.email || localStorage.getItem("userEmail") || "";
    const name = userProfile?.name || localStorage.getItem("userName") || "User";

    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId: selectedChannelId,
          email,
          name,
          message: newPostMessage,
          isWarning: isWarningChecked,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewPostMessage("");
        setIsWarningChecked(false);
        fetchPosts(selectedChannelId);
      } else {
        setPostError(data.message || "Failed to send message.");
      }
    } catch (e) {
      setPostError("An error occurred while sending your message. Please try again.");
    }
  };

  // 4. Delete a post (Professor/Admin only)
  const handleDeletePost = async (postId: number) => {
    const email = userProfile?.email || localStorage.getItem("userEmail") || "";

    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/discussions?postId=${postId}&email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchPosts(selectedChannelId);
      } else {
        alert(data.message || "Failed to delete message.");
      }
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  };

  const isUserModerator = userProfile?.role === "Professor" || userProfile?.role === "Admin" || (typeof window !== "undefined" && (localStorage.getItem("userRole") === "Professor" || localStorage.getItem("userRole") === "Admin"));

  // 5. Client-Side Post Filtering & Search
  const filteredPosts = posts.filter((post) => {
    if (showWarningsOnly && !post.isWarning) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = post.message.toLowerCase().includes(q);
      
      const displayMaskName = post.isWarning ? (post.role === "Admin" ? "Admin" : "Professor") : post.name;
      const authorMatch = displayMaskName.toLowerCase().includes(q);
      const roleMatch = post.role.toLowerCase().includes(q);
      
      return textMatch || authorMatch || roleMatch;
    }
    
    return true;
  });

  // Track dates to insert visual day boundaries
  let lastDateStr = "";

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath={activePath} />

      <main className="p-8 flex-grow w-full max-w-6xl mx-auto flex flex-col text-brand-text">
        <header className="mb-6 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Community Forum</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1 mb-2">Class Discussions</h1>
          <p className="text-brand-muted text-sm">
            Exchange thoughts, share network topologies, and ask questions about your course modules.
          </p>
        </header>

        {/* Double-Pane Roster Layout */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
          
          {/* LEFT PANEL: Channels list */}
          <div className="lg:col-span-1 bg-brand-card/90 border border-brand-border/60 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-[10px] text-brand-cyan/80 uppercase tracking-widest mb-3 select-none">
                Discussion Channels
              </h3>
              
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[450px]">
                {/* General Channel */}
                <button
                  onClick={() => setSelectedChannelId(0)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden border ${
                    selectedChannelId === 0
                      ? "bg-gradient-to-r from-brand-cyan/15 to-transparent border-brand-cyan/30 text-brand-cyan font-extrabold"
                      : "bg-brand-bg/20 border-brand-border/20 text-brand-muted hover:text-brand-text hover:bg-brand-bg/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={selectedChannelId === 0 ? "text-brand-cyan" : "text-brand-muted/70 group-hover:text-brand-text"}>#</span>
                    <span className="truncate">general-chat</span>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full bg-brand-cyan transition-all opacity-0 ${selectedChannelId === 0 ? "opacity-100 shadow-glow" : ""}`} />
                </button>

                {/* Categories Divider */}
                <h3 className="font-bold text-[9px] text-brand-muted/70 uppercase tracking-widest mt-5 mb-2 select-none border-b border-brand-border/30 pb-1.5">
                  Course Modules
                </h3>

                {/* Modules list */}
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedChannelId(mod.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden border ${
                      selectedChannelId === mod.id
                        ? "bg-gradient-to-r from-brand-cyan/15 to-transparent border-brand-cyan/30 text-brand-cyan font-extrabold"
                        : "bg-brand-bg/20 border-brand-border/20 text-brand-muted hover:text-brand-text hover:bg-brand-bg/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={selectedChannelId === mod.id ? "text-brand-cyan" : "text-brand-muted/70 group-hover:text-brand-text"}>#</span>
                      <span className="truncate" title={mod.title}>{mod.title}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full bg-brand-cyan transition-all opacity-0 ${selectedChannelId === mod.id ? "opacity-100 shadow-glow" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Chat Workspace */}
          <div className="lg:col-span-3 bg-brand-card/90 border border-brand-border/60 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[480px] backdrop-blur-md">
            
            {/* Active Channel Header */}
            <div className="border-b border-brand-border/45 pb-4 mb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] text-brand-cyan uppercase tracking-widest font-bold">Active Channel</span>
                <h2 className="text-xl font-extrabold text-brand-text mt-0.5 flex items-center gap-1.5">
                  <span>#</span>
                  {selectedChannelId === 0
                    ? "general-chat"
                    : modules.find((m) => m.id === selectedChannelId)?.title || "Module Channel"}
                </h2>
              </div>

              {/* Utility Search & Filters */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Warnings Only Filter Button */}
                <button
                  type="button"
                  onClick={() => setShowWarningsOnly(!showWarningsOnly)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    showWarningsOnly 
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400" 
                      : "bg-brand-bg/40 border-brand-border/40 text-brand-muted hover:text-brand-text hover:bg-brand-bg/70"
                  }`}
                  title="Filter by official warnings and notices"
                >
                  <span>⚠️</span> Warnings Only
                </button>

                {/* Real-time search bar */}
                <div className="relative w-40 sm:w-56">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-bg/45 border border-brand-border/40 focus:border-brand-cyan/60 focus:outline-none rounded-xl pl-8 pr-7 py-1.5 text-xs text-brand-text placeholder-brand-muted/70 transition-all"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text text-xs cursor-pointer bg-brand-border/40 hover:bg-brand-border/80 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Feed */}
            <div className="flex-grow overflow-y-auto max-h-[380px] mb-4 pr-1.5 flex flex-col gap-4.5 scrollbar-thin">
              {isLoadingPosts ? (
                <div className="flex justify-center items-center py-20 flex-grow">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20 text-brand-muted text-sm italic flex-grow flex flex-col justify-center items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>
                    {searchQuery || showWarningsOnly 
                      ? "No posts found matching the active filters." 
                      : "No thoughts shared in this channel yet. Start the conversation!"}
                  </span>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const isWarning = post.isWarning === true;
                  const isMsgModerator = post.role === "Professor" || post.role === "Admin";
                  
                  // Mask name if official warning post
                  const displayAuthorName = isWarning ? post.role : post.name;
                  
                  // Formulate date block boundaries
                  const postDateObject = new Date(post.createdAt);
                  const postDateStr = postDateObject.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  const insertDateHeader = postDateStr !== lastDateStr;
                  lastDateStr = postDateStr;

                  return (
                    <div key={post.id} className="flex flex-col gap-3">
                      {insertDateHeader && (
                        <div className="flex items-center gap-3 py-2.5 select-none">
                          <div className="flex-grow h-[1px] bg-brand-border/20" />
                          <span className="text-[9px] text-brand-muted/80 font-bold uppercase tracking-widest bg-brand-card border border-brand-border/40 px-3.5 py-1 rounded-full shadow-md">
                            {postDateStr}
                          </span>
                          <div className="flex-grow h-[1px] bg-brand-border/20" />
                        </div>
                      )}

                      <div
                        className={`border rounded-2xl p-4.5 flex gap-4 relative group animate-scaleIn transition-all ${
                          isWarning
                            ? "bg-amber-500/5 border-amber-500/25 border-l-4 border-l-amber-500 hover:border-amber-500/40 hover:bg-amber-500/8 shadow-md shadow-amber-500/5"
                            : "bg-brand-bg/30 border border-brand-border/35 hover:border-brand-border-hover/65 hover:bg-brand-bg/45"
                        }`}
                      >
                        {/* Circular Role-Gradient Avatar */}
                        <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 border select-none ${
                          isWarning 
                            ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-brand-bg border-amber-400"
                            : isMsgModerator
                              ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-brand-bg border-emerald-400"
                              : "bg-gradient-to-br from-brand-cyan to-blue-600 text-brand-bg border-brand-cyan/40"
                        }`}>
                          {getAvatarInitials(displayAuthorName)}
                        </div>

                        {/* Message details */}
                        <div className="flex-grow flex flex-col gap-1.5">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-brand-text leading-none">{displayAuthorName}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded leading-none uppercase select-none ${
                                isMsgModerator 
                                  ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                                  : "bg-brand-bg border border-brand-border/40 text-brand-muted"
                              }`}>
                                {post.role}
                              </span>
                              {isWarning && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded leading-none bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase flex items-center gap-0.5 select-none animate-pulse">
                                  <span>⚠️</span> Official Warning
                                </span>
                              )}
                              <span className="text-[9px] text-brand-muted font-mono leading-none">
                                {postDateObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Deletion button for admins and professors */}
                            {isUserModerator && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-500/10 cursor-pointer"
                                title="Delete message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                            isWarning ? "text-amber-300 font-medium italic" : "text-brand-text/90"
                          }`}>
                            {post.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Posting Form */}
            <form onSubmit={handlePostMessage} className="mt-auto shrink-0 flex flex-col gap-3">
              {postError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs leading-relaxed flex items-start gap-2 animate-scaleIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-400 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{postError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {isUserModerator && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        id="isWarningToggle"
                        checked={isWarningChecked}
                        onChange={(e) => setIsWarningChecked(e.target.checked)}
                        className="w-4 h-4 text-amber-500 bg-brand-bg/50 border-brand-border rounded focus:ring-amber-500 focus:ring-2 cursor-pointer accent-amber-500"
                      />
                      <label htmlFor="isWarningToggle" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1">
                        <span>⚠️</span> Post as Anonymous Official Warning / Announcement
                      </label>
                    </div>

                    {/* Pre-defined Drafts Template Selector */}
                    {isWarningChecked && (
                      <div className="bg-brand-bg/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2.5 animate-scaleIn">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1 select-none">
                          <span>💡</span> Warning Draft Templates (Click to fill)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {WARNING_DRAFTS.map((draft, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewPostMessage(draft.message);
                                if (postError) setPostError("");
                              }}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/20 hover:border-amber-500/45 text-amber-400 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                            >
                              {draft.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <textarea
                    value={newPostMessage}
                    onChange={(e) => {
                      setNewPostMessage(e.target.value);
                      if (postError) setPostError("");
                    }}
                    placeholder={
                      isWarningChecked 
                        ? "Enter your official warning/announcement message here (your name will show as Professor/Admin)..." 
                        : "Type a message or share thoughts about what you are learning..."
                    }
                    className="flex-grow bg-brand-bg/50 border border-brand-border/40 focus:border-brand-cyan focus:outline-none rounded-xl px-4.5 py-3 text-xs text-brand-text placeholder-brand-muted/70 resize-none h-16 min-h-[4rem] leading-relaxed transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newPostMessage.trim()}
                    className="px-6 py-3 bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md self-end"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
