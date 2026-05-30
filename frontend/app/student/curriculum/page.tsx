"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

type MaterialType = "text" | "video" | "image" | "file";

type Material = {
  id: number;
  type: MaterialType;
  title: string;
  content: string; // text body, video link, base64 image/file
  fileName?: string;
  fileSize?: string;
  textStyle?: "normal" | "bold" | "italic" | "heading" | "quote" | "code";
  imageAlign?: "left" | "center" | "right";
};

type Subtopic = {
  id: number;
  title: string;
  materials?: Material[];
};

type Topic = {
  id: number;
  title: string;
  subtopics?: Subtopic[];
  materials?: Material[];
};

type Module = {
  id: number;
  title: string;
  topics: Topic[];
};

export default function StudentCurriculum() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item states
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  // Expanded modules outline state
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        const data = await res.json();
        if (data.success && data.modules) {
          setModules(data.modules);
          if (data.modules.length > 0) {
            setSelectedModuleId(data.modules[0].id);
            setExpandedModules({ [data.modules[0].id]: true });
            
            if (data.modules[0].topics.length > 0) {
              setSelectedTopic(data.modules[0].topics[0]);
              setExpandedTopics({ [data.modules[0].topics[0].id]: true });
            }
          }
          localStorage.setItem("professor_course_modules", JSON.stringify(data.modules));
        } else {
          loadFromLocalStorageFallback();
        }
      } catch (error) {
        console.error("Error fetching modules from API, falling back to localStorage:", error);
        loadFromLocalStorageFallback();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorageFallback = () => {
      const stored = localStorage.getItem("professor_course_modules");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Module[];
          setModules(parsed);
          if (parsed.length > 0) {
            setSelectedModuleId(parsed[0].id);
            setExpandedModules({ [parsed[0].id]: true });
            
            if (parsed[0].topics.length > 0) {
              setSelectedTopic(parsed[0].topics[0]);
              setExpandedTopics({ [parsed[0].topics[0].id]: true });
            }
          }
        } catch (e) {
          console.error("Failed to parse modules:", e);
        }
      }
    };

    fetchModules();
  }, []);

  const toggleModuleExpand = (moduleId: number) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const toggleTopicExpand = (topicId: number) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // Helper to parse YouTube IDs for iframe embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const activeMaterials = selectedSubtopic 
    ? selectedSubtopic.materials || [] 
    : selectedTopic 
      ? selectedTopic.materials || [] 
      : [];

  const activeTitle = selectedSubtopic 
    ? selectedSubtopic.title 
    : selectedTopic 
      ? selectedTopic.title 
      : "Select a topic to start learning";

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/student/curriculum" />

      <main className="p-8 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        {/* Header */}
        <header className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Learning Center</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1 mb-2">Class Curriculum</h1>
          <p className="text-brand-muted text-sm">
            Access study guides, video lessons, and documents shared by your professor.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h3 className="font-bold text-lg">No Curriculum Materials Available</h3>
            <p className="text-brand-muted text-sm max-w-sm mt-1 leading-relaxed">
              Your professor has not uploaded any learning modules or topics yet. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Curriculum Tree Selection */}
            <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-1">
                Course Syllabus
              </h3>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                {modules.map((mod) => {
                  const isModExpanded = expandedModules[mod.id] !== false;
                  
                  return (
                    <div key={mod.id} className="border border-brand-border/40 rounded-xl overflow-hidden">
                      {/* Module Header Button */}
                      <button
                        onClick={() => toggleModuleExpand(mod.id)}
                        className="w-full bg-brand-bg/50 px-4 py-3 flex items-center justify-between text-left hover:bg-brand-bg/80 transition-colors border-b border-brand-border/20"
                      >
                        <div className="truncate pr-4">
                          <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">
                            Module
                          </span>
                          <h4 className="text-sm font-bold truncate mt-0.5">{mod.title}</h4>
                        </div>
                        <span className="text-brand-muted shrink-0">
                          {isModExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          )}
                        </span>
                      </button>

                      {/* Topics List within Module */}
                      {isModExpanded && (
                        <div className="p-2 flex flex-col gap-1.5 bg-brand-card/30">
                          {mod.topics.length === 0 ? (
                            <div className="text-[10px] text-brand-muted/70 px-3 py-2 italic">
                              No topics outlined yet
                            </div>
                          ) : (
                            mod.topics.map((topic) => {
                              const isTopicSelected = selectedTopic?.id === topic.id && !selectedSubtopic;
                              const isTopicExpanded = expandedTopics[topic.id] === true;
                              const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

                              return (
                                <div key={topic.id} className="flex flex-col">
                                  {/* Topic Item Button */}
                                  <div
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                      isTopicSelected
                                        ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                        : selectedTopic?.id === topic.id
                                          ? "bg-brand-cyan/10 text-brand-text font-semibold border border-brand-cyan/20"
                                          : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                    }`}
                                    onClick={() => {
                                      setSelectedTopic(topic);
                                      setSelectedSubtopic(null);
                                      setSelectedModuleId(mod.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-2 truncate pr-4 text-xs">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                      <span className="truncate">{topic.title}</span>
                                    </div>
                                    
                                    {hasSubtopics && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleTopicExpand(topic.id);
                                        }}
                                        className="p-0.5 text-brand-muted hover:text-brand-text"
                                      >
                                        {isTopicExpanded ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Subtopics Listing */}
                                  {hasSubtopics && isTopicExpanded && (
                                    <div className="pl-4 pr-1 mt-1 flex flex-col gap-1 border-l border-brand-border/40 ml-4 py-0.5">
                                      {topic.subtopics!.map((sub) => {
                                        const isSubSelected = selectedSubtopic?.id === sub.id;

                                        return (
                                          <button
                                            key={sub.id}
                                            onClick={() => {
                                              setSelectedTopic(topic);
                                              setSelectedSubtopic(sub);
                                              setSelectedModuleId(mod.id);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] truncate transition-colors ${
                                              isSubSelected
                                                ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                                : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/20"
                                            }`}
                                          >
                                            • {sub.title}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Study Workspace Panel */}
            <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg min-h-[460px] flex flex-col">
              
              {/* Workspace Header */}
              <div className="border-b border-brand-border/40 pb-4 mb-6">
                <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                  Study Workspace
                </span>
                <h2 className="text-xl font-bold mt-0.5">{activeTitle}</h2>
              </div>

              {/* Materials Rendering */}
              <div className="flex-grow flex flex-col gap-6">
                {activeMaterials.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-brand-border/30 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>
                    <h4 className="font-bold text-sm">No Materials Available</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-[260px]">
                      This topic outlines the course syllabus, but no reading materials, videos, or attachments have been uploaded yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {activeMaterials.map((mat, idx) => {
                      const youtubeEmbedUrl = mat.type === "video" ? getYouTubeEmbedUrl(mat.content) : null;

                      return (
                        <div
                          key={mat.id}
                          className="flex flex-col gap-3 pb-6 border-b border-brand-border/20 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2 text-brand-text">
                            <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded">
                              Material {idx + 1}
                            </span>
                            <h3 className="font-bold text-sm text-brand-text">
                              {mat.title}
                            </h3>
                          </div>

                          {/* TYPE 1: Reading Text */}
                          {mat.type === "text" && (
                            <div className={`whitespace-pre-wrap text-xs leading-relaxed bg-brand-bg/40 p-4 border border-brand-border/45 rounded-xl ${
                              mat.textStyle === "bold" ? "font-bold text-brand-text" :
                              mat.textStyle === "italic" ? "italic text-brand-text/95" :
                              mat.textStyle === "heading" ? "text-base font-extrabold text-brand-cyan border-l-4 border-brand-cyan pl-3 py-1 bg-brand-cyan/5" :
                              mat.textStyle === "quote" ? "border-l-4 border-brand-border pl-4 italic text-brand-muted bg-brand-bg/20 py-2" :
                              mat.textStyle === "code" ? "font-mono bg-black/40 border border-brand-border/60 px-3.5 py-2.5 rounded-xl text-green-400 text-[11px]" :
                              "text-brand-text/95"
                            }`}>
                              {mat.content}
                            </div>
                          )}

                          {/* TYPE 2: Video Link */}
                          {mat.type === "video" && (
                            <div className="w-full">
                              {youtubeEmbedUrl ? (
                                <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border shadow-md bg-brand-bg">
                                  <iframe
                                    src={youtubeEmbedUrl}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full border-0"
                                  ></iframe>
                                </div>
                              ) : (
                                <a
                                  href={mat.content}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 p-4 bg-brand-bg/50 border border-brand-border hover:border-brand-cyan rounded-xl text-brand-cyan hover:underline transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                  <div className="flex flex-col text-left">
                                    <span className="text-xs font-bold text-brand-text">Watch External Video Link</span>
                                    <span className="text-[10px] text-brand-muted truncate max-w-[340px] mt-0.5">{mat.content}</span>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}

                           {/* TYPE 3: Image Reference */}
                           {mat.type === "image" && (
                             <div className={`flex w-full ${
                               mat.imageAlign === "left" ? "justify-start" :
                               mat.imageAlign === "right" ? "justify-end" :
                               "justify-center"
                             }`}>
                               <div className="border border-brand-border/40 bg-brand-bg/25 rounded-xl p-3.5 flex flex-col items-center gap-2 max-w-full">
                                 <img
                                   src={mat.content}
                                   alt={mat.title}
                                   className="max-w-full h-auto rounded-lg max-h-[380px] shadow-sm object-contain"
                                 />
                               </div>
                             </div>
                           )}

                          {/* TYPE 4: Document File Attachment */}
                          {mat.type === "file" && (
                            <div className="bg-brand-bg/30 border border-brand-border/40 rounded-xl p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 truncate">
                                <div className="p-2.5 bg-brand-cyan/10 text-brand-cyan rounded-lg border border-brand-cyan/15 shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                </div>
                                <div className="truncate flex flex-col">
                                  <span className="text-xs font-bold text-brand-text truncate">
                                    {mat.fileName || "Download Material"}
                                  </span>
                                  <span className="text-[10px] text-brand-muted font-mono mt-0.5">
                                    {mat.fileSize || "Size Unknown"} • Document File
                                  </span>
                                </div>
                              </div>
                              <a
                                href={mat.content}
                                download={mat.fileName || "document"}
                                className="px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                              >
                                Download
                              </a>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
