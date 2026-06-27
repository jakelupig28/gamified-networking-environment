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
  const [postError, setPostError] = useState("");
  const [isWarningChecked, setIsWarningChecked] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);

  // Forum thread states
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [isAddingDiscussion, setIsAddingDiscussion] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionMessage, setNewDiscussionMessage] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical" | "replies">("recent");
  const [tempSearchQuery, setTempSearchQuery] = useState(""); // For search input box
  const [replyMessage, setReplyMessage] = useState("");

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
    setSelectedThreadId(null);
    setIsAddingDiscussion(false);
  }, [selectedChannelId]);

  // 3. Post a new thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionTitle.trim() || !newDiscussionMessage.trim()) return;

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
          title: newDiscussionTitle,
          message: newDiscussionMessage,
          isWarning: isWarningChecked,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewDiscussionTitle("");
        setNewDiscussionMessage("");
        setIsAddingDiscussion(false);
        setIsWarningChecked(false);
        fetchPosts(selectedChannelId);
      } else {
        setPostError(data.message || "Failed to post discussion topic.");
      }
    } catch (e) {
      setPostError("An error occurred while posting. Please try again.");
    }
  };

  // 4. Submit a reply/comment to a thread
  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || selectedThreadId === null) return;

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
          parentId: selectedThreadId,
          message: replyMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyMessage("");
        fetchPosts(selectedChannelId);
      } else {
        setPostError(data.message || "Failed to post reply.");
      }
    } catch (e) {
      setPostError("An error occurred while posting your reply. Please try again.");
    }
  };

  // 5. Delete a post (Professor/Admin only)
  const handleDeletePost = async (postId: number) => {
    const email = userProfile?.email || localStorage.getItem("userEmail") || "";

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/discussions?postId=${postId}&email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchPosts(selectedChannelId);
      } else {
        alert(data.message || "Failed to delete post.");
      }
    } catch (e) {
      console.error("Error deleting post:", e);
    }
  };

  const isUserModerator = userProfile?.role === "Professor" || userProfile?.role === "Admin" || (typeof window !== "undefined" && (localStorage.getItem("userRole") === "Professor" || localStorage.getItem("userRole") === "Admin"));

  // Helper to extract clean relative time
  function getRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / (3600 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  // Filter threads (posts without parentId)
  const threads = posts.filter((p: any) => !p.parentId);

  const filteredThreads = threads.filter((thread: any) => {
    if (showWarningsOnly && !thread.isWarning) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = thread.title?.toLowerCase().includes(q) || false;
      const msgMatch = thread.message.toLowerCase().includes(q);
      const authorMatch = thread.name.toLowerCase().includes(q);
      return titleMatch || msgMatch || authorMatch;
    }
    
    return true;
  });

  // Sort threads
  const sortedThreads = [...filteredThreads].sort((a: any, b: any) => {
    if (sortOrder === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOrder === "alphabetical") {
      const titleA = a.title || "";
      const titleB = b.title || "";
      return titleA.localeCompare(titleB);
    }
    if (sortOrder === "replies") {
      const repliesA = posts.filter((p: any) => p.parentId === a.id).length;
      const repliesB = posts.filter((p: any) => p.parentId === b.id).length;
      return repliesB - repliesA;
    }
    return 0;
  });

  const activeThread = posts.find((p: any) => p.id === selectedThreadId);
  const replies = posts.filter((p: any) => p.parentId === selectedThreadId);

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

        {/* Double-Pane Layout */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
          
          {/* LEFT PANEL: Channels list */}
          <div className="lg:col-span-1 bg-gradient-to-b from-brand-card/95 to-brand-card/85 border border-brand-border/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-[10px] text-brand-cyan/90 uppercase tracking-widest mb-3 select-none">
                Discussion Channels
              </h3>
              
              <div className="flex flex-col gap-1.5">
                {/* General Channel */}
                <button
                  onClick={() => setSelectedChannelId(0)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-start gap-2.5 group cursor-pointer relative overflow-hidden border hover:scale-[1.01] active:scale-[0.99] ${
                    selectedChannelId === 0
                      ? "bg-gradient-to-r from-brand-cyan/15 to-brand-cyan/5 border-brand-cyan/40 text-brand-cyan shadow-md shadow-brand-cyan/5"
                      : "bg-brand-bg/25 border-brand-border/20 text-brand-muted hover:text-brand-text hover:bg-brand-card-light/40 hover:border-brand-border/40"
                  }`}
                >
                  <span className={`mt-0.5 select-none font-bold text-sm leading-none ${selectedChannelId === 0 ? "text-brand-cyan" : "text-brand-muted/50 group-hover:text-brand-text"}`}>#</span>
                  <span className="whitespace-normal break-words leading-tight flex-1 text-left">general-chat</span>
                </button>

                {/* Categories Divider */}
                <h3 className="font-bold text-[9px] text-brand-cyan/60 uppercase tracking-widest mt-6 mb-2 select-none border-b border-brand-border/25 pb-2">
                  Course Modules
                </h3>

                {/* Modules list */}
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedChannelId(mod.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-start gap-2.5 group cursor-pointer relative overflow-hidden border hover:scale-[1.01] active:scale-[0.99] ${
                      selectedChannelId === mod.id
                        ? "bg-gradient-to-r from-brand-cyan/15 to-brand-cyan/5 border-brand-cyan/40 text-brand-cyan shadow-md shadow-brand-cyan/5"
                        : "bg-brand-bg/25 border-brand-border/20 text-brand-muted hover:text-brand-text hover:bg-brand-card-light/40 hover:border-brand-border/40"
                    }`}
                  >
                    <span className={`mt-0.5 select-none font-bold text-sm leading-none ${selectedChannelId === mod.id ? "text-brand-cyan" : "text-brand-muted/50 group-hover:text-brand-text"}`}>#</span>
                    <span className="whitespace-normal break-words leading-tight flex-1 text-left">{mod.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Forum Feed Area */}
          <div className="lg:col-span-3 flex flex-col min-h-[480px]">
            {/* Dark Styled Forum Card */}
            <div className="bg-gradient-to-b from-brand-card/95 to-brand-card/85 border border-brand-border/50 rounded-2xl p-6 shadow-2xl flex flex-col flex-grow min-h-[480px] backdrop-blur-md">
              
              {/* Forum Header Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-brand-border/30 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-brand-text leading-none">
                    {selectedThreadId !== null 
                      ? "Discussion Thread" 
                      : `${sortedThreads.length} discussions`}
                  </h2>
                  <p className="text-brand-muted text-xs mt-1">
                    Channel: <span className="font-bold text-brand-cyan">#{selectedChannelId === 0 ? "general-chat" : modules.find(m => m.id === selectedChannelId)?.title || "Module Channel"}</span>
                  </p>
                </div>
                
                {selectedThreadId === null && !isAddingDiscussion && (
                  <button
                    onClick={() => {
                      setIsAddingDiscussion(true);
                      setPostError("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer shadow-md shadow-blue-600/10 animate-fade-in"
                  >
                    Add a new discussion
                  </button>
                )}
              </div>

              {/* 1. ADD NEW DISCUSSION FORM VIEW */}
              {isAddingDiscussion ? (
                <form onSubmit={handleCreateThread} className="flex flex-col gap-4 animate-scale-in">
                  <h3 className="text-base font-black text-brand-text border-b border-brand-border/20 pb-2">Create New Discussion Topic</h3>
                  
                  {postError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs leading-relaxed">
                      {postError}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">Subject / Title</label>
                    <input
                      type="text"
                      required
                      value={newDiscussionTitle}
                      onChange={(e) => setNewDiscussionTitle(e.target.value)}
                      placeholder="What is your discussion topic about?"
                      className="w-full bg-brand-bg/40 border border-brand-border/35 text-brand-text rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/15 text-xs transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">Message Content</label>
                    <textarea
                      required
                      value={newDiscussionMessage}
                      onChange={(e) => setNewDiscussionMessage(e.target.value)}
                      placeholder="Type your message description here..."
                      className="w-full bg-brand-bg/40 border border-brand-border/35 text-brand-text rounded-xl py-3 px-4 focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/15 text-xs h-36 resize-none leading-relaxed transition-all"
                    />
                  </div>

                  {isUserModerator && (
                    <div className="flex items-center gap-2 select-none py-1">
                      <input
                        type="checkbox"
                        id="isWarningToggle"
                        checked={isWarningChecked}
                        onChange={(e) => setIsWarningChecked(e.target.checked)}
                        className="w-4 h-4 text-brand-cyan bg-brand-bg/50 border-brand-border rounded focus:ring-brand-cyan"
                      />
                      <label htmlFor="isWarningToggle" className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer">
                        ⚠️ Post as Official Warning / Announcement
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 border-t border-brand-border/20 pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Post Discussion
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDiscussion(false);
                        setNewDiscussionTitle("");
                        setNewDiscussionMessage("");
                      }}
                      className="bg-brand-bg/50 hover:bg-brand-bg/85 border border-brand-border/30 text-brand-text font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : selectedThreadId !== null ? (
                /* 2. THREAD DETAILS VIEW */
                <div className="flex flex-col gap-6 flex-grow animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setSelectedThreadId(null)}
                    className="text-xs font-bold text-brand-muted hover:text-brand-cyan flex items-center gap-1 cursor-pointer self-start"
                  >
                    ← Back to Discussions
                  </button>

                  {activeThread && (
                    <div className="flex flex-col gap-4">
                      {/* Original Thread Card */}
                      <div className="border border-brand-border/30 bg-brand-bg/25 rounded-2xl p-5 flex gap-4">
                        {/* Creator Info */}
                        <div className="flex flex-col items-center text-center w-24 shrink-0 gap-1.5">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-cyan to-blue-600 text-brand-bg flex items-center justify-center font-extrabold text-sm shadow-sm select-none">
                            {getAvatarInitials(activeThread.name)}
                          </div>
                          <span className="text-[10px] font-extrabold text-brand-cyan uppercase tracking-wider leading-snug break-words w-full">
                            {activeThread.name}
                          </span>
                          <span className="text-[9px] bg-brand-bg/50 border border-brand-border/30 text-brand-muted font-bold px-2 py-0.5 rounded-full uppercase leading-none select-none">
                            {activeThread.role}
                          </span>
                        </div>

                        {/* Thread Title & Message */}
                        <div className="flex-grow flex flex-col gap-2 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-black text-brand-text text-lg leading-tight">
                              {activeThread.title || "Untitled Discussion"}
                            </h3>
                            <span className="text-brand-muted/70 text-xs font-mono shrink-0">
                              {getRelativeTime(activeThread.createdAt)}
                            </span>
                          </div>
                          
                          {activeThread.isWarning && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md max-w-fit mb-1 flex items-center gap-1">
                              <span>⚠️</span> Official Warning / Announcement
                            </div>
                          )}

                          <p className="text-brand-text/90 text-sm whitespace-pre-wrap leading-relaxed">
                            {activeThread.message}
                          </p>
                          
                          {isUserModerator && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDeletePost(activeThread.id);
                                setSelectedThreadId(null);
                              }}
                              className="text-red-400 hover:text-red-500 text-xs font-bold self-end mt-2 flex items-center gap-1 cursor-pointer"
                            >
                              Delete Topic
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Replies feed */}
                      <div className="flex flex-col gap-3.5 pl-6 border-l-2 border-brand-border/20">
                        <h4 className="text-xs font-extrabold text-brand-muted uppercase tracking-wider">
                          Replies ({replies.length})
                        </h4>

                        {replies.length === 0 ? (
                          <p className="text-brand-muted/60 text-xs italic py-2">No replies yet. Be the first to answer!</p>
                        ) : (
                          replies.map((reply: any) => (
                            <div key={reply.id} className="border border-brand-border/20 bg-brand-bg/15 rounded-xl p-4 flex gap-3.5 shadow-sm">
                              <div className="flex flex-col items-center text-center w-20 shrink-0 gap-1">
                                <div className="w-9 h-9 rounded-full bg-brand-bg/30 text-brand-muted flex items-center justify-center font-bold text-xs select-none">
                                  {getAvatarInitials(reply.name)}
                                </div>
                                <span className="text-[9px] font-bold text-brand-muted/70 truncate w-full">
                                  {reply.name}
                                </span>
                              </div>
                              <div className="flex-grow min-w-0 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] bg-brand-bg/50 border border-brand-border/30 text-brand-muted px-2 py-0.5 rounded font-bold uppercase tracking-wider">{reply.role}</span>
                                  <span className="text-brand-muted/50 text-[10px] font-mono">{getRelativeTime(reply.createdAt)}</span>
                                </div>
                                <p className="text-brand-text/90 text-xs whitespace-pre-wrap leading-relaxed">
                                  {reply.message}
                                </p>
                                {isUserModerator && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePost(reply.id)}
                                    className="text-red-400 hover:text-red-550 text-[10px] font-bold self-end mt-1 cursor-pointer"
                                  >
                                    Delete Reply
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment/Reply Form */}
                      <form onSubmit={handleCreateReply} className="flex flex-col gap-3 mt-4 border-t border-brand-border/20 pt-4">
                        <textarea
                          required
                          value={replyMessage}
                          onChange={(e) => {
                            setReplyMessage(e.target.value);
                            if (postError) setPostError("");
                          }}
                          placeholder="Write a reply to this discussion..."
                          className="w-full bg-brand-bg/40 border border-brand-border/35 text-brand-text rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/15 text-xs h-24 resize-none leading-relaxed transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!replyMessage.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider self-end cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Submit Reply
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                /* 3. DISCUSSIONS LIST VIEW */
                <div className="flex flex-col flex-grow animate-fade-in">
                  
                  {/* Search, Filter & Sorting Bar */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-border/30">
                    
                    {/* Filter Warnings button */}
                    <div className="flex items-center gap-2 select-none">
                      <button
                        type="button"
                        onClick={() => setShowWarningsOnly(!showWarningsOnly)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          showWarningsOnly 
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400 font-black" 
                            : "bg-brand-bg/40 border-brand-border/30 text-brand-muted hover:text-brand-text hover:bg-brand-bg/70"
                        }`}
                      >
                        <span>⚠️</span> Warnings Only
                      </button>
                    </div>

                    {/* Search and Sort Dropdowns */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search Form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setSearchQuery(tempSearchQuery);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <span className="text-brand-muted text-xs font-bold shrink-0 flex items-center justify-center bg-brand-bg/50 border border-brand-border/30 w-6 h-6 rounded-full" title="Search help">?</span>
                        <input
                          type="text"
                          placeholder="Search discussions..."
                          value={tempSearchQuery}
                          onChange={(e) => setTempSearchQuery(e.target.value)}
                          className="bg-brand-bg/40 border border-brand-border/35 text-brand-text rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/15 text-xs w-40 sm:w-48"
                        />
                        <button
                          type="submit"
                          className="bg-brand-bg/50 hover:bg-brand-bg/85 border border-brand-border/30 text-brand-text font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Search
                        </button>
                      </form>

                      {/* Sort Controls */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="bg-brand-bg/40 border border-brand-border/35 text-brand-text rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/15 text-xs"
                        >
                          <option value="recent">Recent</option>
                          <option value="alphabetical">Alphabetical</option>
                          <option value="replies">Most Replies</option>
                        </select>
                        <button
                          onClick={() => setSearchQuery(tempSearchQuery)}
                          className="bg-brand-bg/50 hover:bg-brand-bg/85 border border-brand-border/30 text-brand-text font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Sort
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Discussions list content */}
                  {isLoadingPosts ? (
                    <div className="flex-grow flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
                    </div>
                  ) : sortedThreads.length === 0 ? (
                    <div className="text-center py-16 text-brand-muted text-xs italic flex-grow flex flex-col justify-center items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span>No discussions found. Start the first topic!</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-border/20">
                      {sortedThreads.map((thread) => {
                        const replyCount = posts.filter((p: any) => p.parentId === thread.id).length;
                        // Thread is new if created within last 24h
                        const isNew = (Date.now() - new Date(thread.createdAt).getTime()) < 24 * 60 * 60 * 1000;

                        return (
                          <div key={thread.id} className="py-6 flex items-start gap-5 hover:bg-brand-bg/15 transition-colors rounded-xl px-2">
                            {/* Left Column: Creator circular avatar and capitalized teal name */}
                            <div className="flex flex-col items-center text-center w-24 shrink-0 gap-1.5">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-cyan to-blue-600 text-brand-bg flex items-center justify-center font-extrabold text-sm shadow-sm select-none">
                                {getAvatarInitials(thread.name)}
                              </div>
                              <span className="text-[10px] font-extrabold text-brand-cyan uppercase tracking-wider leading-snug break-words w-full">
                                {thread.name}
                              </span>
                            </div>

                            {/* Center Column: Thread Title & Info */}
                            <div className="flex-grow min-w-0 flex flex-col gap-1">
                              <h3 
                                onClick={() => {
                                  setSelectedThreadId(thread.id);
                                  setPostError("");
                                  setReplyMessage("");
                                }}
                                className="text-base font-extrabold text-brand-cyan hover:text-brand-cyan-hover cursor-pointer hover:underline truncate"
                              >
                                {thread.title || "Untitled Discussion"}
                              </h3>
                              <span className="text-brand-muted/70 text-xs font-medium">
                                {getRelativeTime(thread.createdAt)}
                              </span>
                            </div>

                            {/* Right Column: Tags & Mail envelope count */}
                            <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
                              {isNew && (
                                <span className="bg-amber-500 text-brand-bg text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider select-none">
                                  New
                                </span>
                              )}
                              <div 
                                onClick={() => {
                                  setSelectedThreadId(thread.id);
                                  setPostError("");
                                  setReplyMessage("");
                                }}
                                className="text-slate-400 hover:text-brand-cyan cursor-pointer flex items-center gap-1"
                                title={`${replyCount} replies`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400 hover:text-brand-cyan transition-colors">
                                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                                {replyCount > 0 && (
                                  <span className="text-[10px] font-bold text-slate-500">{replyCount}</span>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
