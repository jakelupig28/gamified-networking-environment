"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

type YouTubeObserverProps = {
  videoId: string;
  onWatched: () => void;
};

function YouTubeObserver({ videoId, onWatched }: YouTubeObserverProps) {
  const containerId = `yt-player-${videoId}`;

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    let checkInterval: any;

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        player = new (window as any).YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          events: {
            onStateChange: (event: any) => {
              if (event.data === 0) {
                onWatched();
              }
            }
          }
        });
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          initPlayer();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border shadow-md bg-brand-bg">
      <div id={containerId} className="absolute top-0 left-0 w-full h-full border-0"></div>
    </div>
  );
}

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

type ViewSelection = {
  moduleId: number;
  topic: Topic | null;
  subtopic: Subtopic | null;
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

  // Topic Completion progress state
  const [completedTopics, setCompletedTopics] = useState<Record<number, boolean>>({});
  const [watchedVideos, setWatchedVideos] = useState<Record<number, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  const getTopicPreview = (topic: Topic): string => {
    const textMat = topic.materials?.find(m => m.type === "text") || 
                    topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "text");
    if (textMat && textMat.content) {
      const clean = textMat.content
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      if (clean.length > 150) {
        return clean.slice(0, 150) + "...";
      }
      return clean || "This topic contains lecture and interactive materials.";
    }
    return "This topic contains lecture and interactive materials.";
  };

  const getSelectableSequence = (): ViewSelection[] => {
    const list: ViewSelection[] = [];
    modules.forEach((mod) => {
      list.push({
        moduleId: mod.id,
        topic: null,
        subtopic: null
      });

      mod.topics.forEach((topic) => {
        list.push({
          moduleId: mod.id,
          topic: topic,
          subtopic: null
        });

        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((sub) => {
            list.push({
              moduleId: mod.id,
              topic: topic,
              subtopic: sub
            });
          });
        }
      });
    });
    return list;
  };

  const handleSelectNextTopic = () => {
    const sequence = getSelectableSequence();
    const currentIndex = sequence.findIndex(
      (item) =>
        item.moduleId === selectedModuleId &&
        (item.topic?.id === selectedTopic?.id || (!item.topic && !selectedTopic)) &&
        (item.subtopic?.id === selectedSubtopic?.id || (!item.subtopic && !selectedSubtopic))
    );

    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1];
      setSelectedModuleId(next.moduleId);
      setSelectedTopic(next.topic);
      setSelectedSubtopic(next.subtopic);
      
      setExpandedModules((prev) => ({ ...prev, [next.moduleId]: true }));
      if (next.topic) {
        setExpandedTopics((prev) => ({ ...prev, [next.topic!.id]: true }));
      }
    } else {
      alert("Congratulations! You have completed the final topic in the course!");
    }
  };

  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const downloadModulePDF = async (mod: Module) => {
    setIsDownloading(true);
    try {
      if (!(window as any).jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = () => resolve();
          script.onerror = (err) => reject(err);
          document.body.appendChild(script);
        });
      }

      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("COURSE SYLLABUS", 20, 20);

      doc.setFontSize(16);
      doc.setTextColor(0, 150, 136);
      doc.text(`Module: ${mod.title}`, 20, 30);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      let yPos = 45;
      const pageHeight = 297;

      for (let tIdx = 0; tIdx < mod.topics.length; tIdx++) {
        const topic = mod.topics[tIdx];
        if (yPos > pageHeight - 35) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(33, 33, 33);
        doc.text(`${tIdx + 1}. Topic: ${topic.title}`, 20, yPos);
        yPos += 8;

        const materialsList = topic.materials || [];
        const subtopicsList = topic.subtopics || [];

        for (const mat of materialsList) {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);
          doc.text(`[${mat.type.toUpperCase()}] ${mat.title}`, 22, yPos);
          yPos += 6;

          if (mat.type === "text" && mat.content) {
            const cleanText = mat.content
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/p>/gi, "\n\n")
              .replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);

            const paragraphs = cleanText.split("\n");
            paragraphs.forEach((para) => {
              const trimmedPara = para.trim();
              if (!trimmedPara) {
                yPos += 3;
                return;
              }
              const splitText = doc.splitTextToSize(trimmedPara, 160);
              splitText.forEach((line: string) => {
                if (yPos > pageHeight - 20) {
                  doc.addPage();
                  yPos = 20;
                }
                doc.text(line, 24, yPos);
                yPos += 5;
              });
              yPos += 2;
            });
            yPos += 4;
          } else if (mat.type === "image" && mat.content) {
            try {
              const img = await loadImageElement(mat.content);
              const maxW = 160;
              const maxH = 100;
              let imgW = img.width;
              let imgH = img.height;
              const ratio = imgW / imgH;
              if (imgW > maxW) {
                imgW = maxW;
                imgH = imgW / ratio;
              }
              if (imgH > maxH) {
                imgH = maxH;
                imgW = imgH * ratio;
              }

              if (yPos > pageHeight - imgH - 25) {
                doc.addPage();
                yPos = 20;
              }

              const xPos = 20 + (160 - imgW) / 2;
              doc.addImage(img, "PNG", xPos, yPos, imgW, imgH);
              yPos += imgH + 8;
            } catch (err) {
              console.error("Failed to load image for PDF:", err);
            }
          } else if (mat.type === "video") {
            doc.setFont("helvetica", "oblique");
            doc.setFontSize(10);
            doc.setTextColor(0, 100, 200);
            doc.text(`Video Link: ${mat.content}`, 24, yPos);
            yPos += 7;
          }
        }

        for (let sIdx = 0; sIdx < subtopicsList.length; sIdx++) {
          const sub = subtopicsList[sIdx];
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(80, 80, 80);
          doc.text(`  ${tIdx + 1}.${sIdx + 1} Subtopic: ${sub.title}`, 22, yPos);
          yPos += 7;

          const subMaterials = sub.materials || [];
          for (const mat of subMaterials) {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`    [${mat.type.toUpperCase()}] ${mat.title}`, 24, yPos);
            yPos += 6;

            if (mat.type === "text" && mat.content) {
              const cleanText = mat.content
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n\n")
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");

              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(110, 110, 110);

              const paragraphs = cleanText.split("\n");
              paragraphs.forEach((para) => {
                const trimmedPara = para.trim();
                if (!trimmedPara) {
                  yPos += 3;
                  return;
                }
                const splitText = doc.splitTextToSize(trimmedPara, 155);
                splitText.forEach((line: string) => {
                  if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                  }
                  doc.text(line, 26, yPos);
                  yPos += 5;
                });
                yPos += 2;
              });
              yPos += 4;
            } else if (mat.type === "image" && mat.content) {
              try {
                const img = await loadImageElement(mat.content);
                const maxW = 150;
                const maxH = 90;
                let imgW = img.width;
                let imgH = img.height;
                const ratio = imgW / imgH;
                if (imgW > maxW) {
                  imgW = maxW;
                  imgH = imgW / ratio;
                }
                if (imgH > maxH) {
                  imgH = maxH;
                  imgW = imgH * ratio;
                }

                if (yPos > pageHeight - imgH - 25) {
                  doc.addPage();
                  yPos = 20;
                }

                const xPos = 24 + (150 - imgW) / 2;
                doc.addImage(img, "PNG", xPos, yPos, imgW, imgH);
                yPos += imgH + 8;
              } catch (err) {
                console.error("Failed to load subtopic image for PDF:", err);
              }
            } else if (mat.type === "video") {
              doc.setFont("helvetica", "oblique");
              doc.setFontSize(9.5);
              doc.setTextColor(0, 100, 200);
              doc.text(`    Video Link: ${mat.content}`, 26, yPos);
              yPos += 7;
            }
          }
        }

        yPos += 5;
      }

      doc.save(`Module_${mod.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "Student";
    const storedCompleted = localStorage.getItem(`completed_topics_${savedName}`);
    if (storedCompleted) {
      try {
        setCompletedTopics(JSON.parse(storedCompleted));
      } catch (e) {
        console.error("Failed to parse completed topics:", e);
      }
    }
    const storedWatched = localStorage.getItem(`watched_videos_${savedName}`);
    if (storedWatched) {
      try {
        setWatchedVideos(JSON.parse(storedWatched));
      } catch (e) {
        console.error("Failed to parse watched videos:", e);
      }
    }
  }, []);

  const toggleTopicCompletion = (topicId: number) => {
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...completedTopics, [topicId]: !completedTopics[topicId] };
    setCompletedTopics(updated);
    localStorage.setItem(`completed_topics_${savedName}`, JSON.stringify(updated));
  };

  const markVideoAsWatched = (materialId: number) => {
    const savedName = localStorage.getItem("userName") || "Student";
    const updated = { ...watchedVideos, [materialId]: true };
    setWatchedVideos(updated);
    localStorage.setItem(`watched_videos_${savedName}`, JSON.stringify(updated));
  };

  const getTopicVideoMaterial = (topic: Topic) => {
    const videoMat = topic.materials?.find(m => m.type === "video");
    if (videoMat) return videoMat;
    const subVideoMat = topic.subtopics?.flatMap(s => s.materials || []).find(m => m.type === "video");
    if (subVideoMat) return subVideoMat;
    return null;
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  const getTopicProgress = (topic: Topic): number => {
    if (completedTopics[topic.id]) return 100;
    const videoMat = getTopicVideoMaterial(topic);
    if (videoMat && watchedVideos[videoMat.id]) {
      return 50;
    }
    return 0;
  };

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
          try {
            localStorage.setItem("professor_course_modules", JSON.stringify(data.modules));
          } catch (e) {
            console.warn("Storage quota exceeded, could not save to localStorage:", e);
          }
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

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const isModuleOverviewActive = selectedModuleId !== null && selectedTopic === null && !!selectedModule;

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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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
                Networking 1
              </h3>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                {modules.map((mod) => {
                  const isModExpanded = expandedModules[mod.id] !== false;

                  return (
                    <div key={mod.id} className="border border-brand-border/40 rounded-xl overflow-hidden">
                      {/* Module Header Button */}
                      <button
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          toggleModuleExpand(mod.id);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-brand-border/20 hover:bg-brand-bg/85 ${
                          selectedModuleId === mod.id && !selectedTopic
                            ? "bg-brand-cyan/15 text-brand-cyan font-bold border-l-2 border-l-brand-cyan"
                            : "bg-brand-bg/50 text-brand-text"
                        }`}
                      >
                        <div className="truncate pr-4">
                          <span className={`text-[9px] uppercase tracking-wider font-semibold ${
                            selectedModuleId === mod.id && !selectedTopic ? "text-brand-cyan" : "text-brand-cyan/70"
                          }`}>
                            Module
                          </span>
                          <h4 className="text-sm font-bold truncate mt-0.5">{mod.title}</h4>
                        </div>
                        <span className="text-brand-muted shrink-0">
                          {isModExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
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
                              const progress = getTopicProgress(topic);

                              return (
                                <div key={topic.id} className="flex flex-col">
                                  {/* Topic Item Button */}
                                  <div
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isTopicSelected
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
                                    <div className="flex items-center gap-2 text-sm font-bold truncate min-w-0 flex-grow">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`shrink-0 ${
                                          progress === 100
                                            ? isTopicSelected
                                              ? "text-green-800"
                                              : "text-green-500"
                                            : ""
                                        }`}
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="m9 12 2 2 4-4" />
                                      </svg>
                                      <span className="truncate">{topic.title}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Small Progress Bar + Percentage */}
                                      <div className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                                        <div className={`w-8 h-1.5 rounded-full overflow-hidden border ${
                                          isTopicSelected 
                                            ? 'bg-brand-bg/30 border-transparent' 
                                            : 'bg-brand-bg border-brand-border/20'
                                        }`}>
                                          <div 
                                            className={`h-full transition-all duration-300 ${
                                              isTopicSelected ? 'bg-white' : 'bg-brand-cyan'
                                            }`} 
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                        <span>{progress}%</span>
                                      </div>

                                      {hasSubtopics && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTopicExpand(topic.id);
                                          }}
                                          className={`p-0.5 shrink-0 ${isTopicSelected ? 'text-brand-bg hover:text-brand-bg/80' : 'text-brand-muted hover:text-brand-text'}`}
                                        >
                                          {isTopicExpanded ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                          )}
                                        </button>
                                      )}
                                    </div>
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
                                            className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] truncate transition-colors ${isSubSelected
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

              {isModuleOverviewActive ? (
                // MODULE OVERVIEW PANEL
                <div className="flex-grow flex flex-col h-full">
                  {/* Workspace Header */}
                  <div className="border-b border-brand-border/40 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                        Module Overview
                      </span>
                      <h2 className="text-xl font-bold mt-0.5">{selectedModule.title}</h2>
                    </div>

                    <button
                      onClick={() => downloadModulePDF(selectedModule)}
                      disabled={isDownloading}
                      className="px-4 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer select-none"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-bg"></div>
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          <span>Download Module PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Overview Body */}
                  <div className="flex-grow flex flex-col gap-6">
                    <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-5">
                      <h3 className="font-bold text-sm text-brand-cyan mb-2">About this Module</h3>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        This module covers key network building blocks, concepts, and materials carefully compiled by your instructor. Explore the topics below to build a solid foundation. You can download the complete syllabus and course materials as a structured PDF using the download button above.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-brand-muted">Topics in this Module</h3>
                      {selectedModule.topics.length === 0 ? (
                        <div className="text-xs text-brand-muted italic py-4">No topics in this module.</div>
                      ) : (
                        <div className="grid gap-3">
                          {selectedModule.topics.map((topic, index) => {
                            const progress = getTopicProgress(topic);
                            const preview = getTopicPreview(topic);
                            const materialsList = topic.materials || [];
                            const subtopicsList = topic.subtopics || [];

                            const hasVideo = materialsList.some(m => m.type === "video") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "video");
                            const hasText = materialsList.some(m => m.type === "text") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "text");
                            const hasFile = materialsList.some(m => m.type === "file") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "file");
                            const hasImage = materialsList.some(m => m.type === "image") || subtopicsList.flatMap(s => s.materials || []).some(m => m.type === "image");

                            return (
                              <div
                                key={topic.id}
                                className="bg-brand-bg/25 border border-brand-border/20 hover:border-brand-cyan/35 rounded-xl p-4 transition-all flex flex-col gap-3 group"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-brand-cyan bg-brand-cyan/10 w-6 h-6 rounded-full flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <h4 className="font-bold text-sm text-brand-text group-hover:text-brand-cyan transition-colors">
                                      {topic.title}
                                    </h4>
                                  </div>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                    progress === 100 
                                      ? "bg-green-500/10 text-green-400 border border-green-500/25" 
                                      : progress === 50 
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25" 
                                        : "bg-brand-muted/10 text-brand-muted border border-brand-border/40"
                                  }`}>
                                    {progress === 100 ? "Completed" : progress === 50 ? "In Progress (50%)" : "Not Started"}
                                  </span>
                                </div>

                                <div className="text-[11px] text-brand-muted leading-relaxed pl-8">
                                  {preview}
                                </div>

                                <div className="flex flex-wrap gap-2 pl-8 items-center mt-1">
                                  <span className="text-[9px] text-brand-muted/70 uppercase tracking-widest mr-1 font-bold">Includes:</span>
                                  {hasText && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      📘 Reading Lecture
                                    </span>
                                  )}
                                  {hasVideo && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      🎥 Video Lesson
                                    </span>
                                  )}
                                  {hasImage && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      🖼️ Diagrams
                                    </span>
                                  )}
                                  {hasFile && (
                                    <span className="text-[10px] bg-brand-card px-2 py-0.5 rounded border border-brand-border/30 text-brand-text/90 flex items-center gap-1">
                                      📎 Attachments
                                    </span>
                                  )}
                                  {subtopicsList.length > 0 && (
                                    <span className="text-[10px] bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20 text-brand-cyan flex items-center gap-1">
                                      🌿 {subtopicsList.length} Subtopics
                                    </span>
                                  )}
                                </div>

                                <div className="pl-8 flex justify-start mt-1">
                                  <button
                                    onClick={() => {
                                      setSelectedTopic(topic);
                                      setSelectedSubtopic(null);
                                      setExpandedTopics(prev => ({ ...prev, [topic.id]: true }));
                                    }}
                                    className="text-[11px] text-brand-cyan hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    Go to topic contents →
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-brand-border/40 flex justify-end">
                    <button
                      onClick={() => {
                        if (selectedModule.topics.length > 0) {
                          setSelectedTopic(selectedModule.topics[0]);
                          setSelectedSubtopic(null);
                          setExpandedTopics(prev => ({ ...prev, [selectedModule.topics[0].id]: true }));
                        }
                      }}
                      disabled={selectedModule.topics.length === 0}
                      className="px-6 py-3 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-extrabold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Start Learning Module →
                    </button>
                  </div>
                </div>
              ) : (
                // EXISTING TOPIC / MATERIALS PANEL
                <>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M6 6h10M6 10h10" /></svg>
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
                              <div className="flex items-center justify-between gap-4 text-brand-text w-full">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded shrink-0">
                                    Material {idx + 1}
                                  </span>
                                  <h3 className="font-bold text-sm text-brand-text truncate">
                                    {mat.title}
                                  </h3>
                                </div>
                                
                                {/* Video watch status label */}
                                {mat.type === "video" && youtubeEmbedUrl && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    watchedVideos[mat.id]
                                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                                      : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                  }`}>
                                    {watchedVideos[mat.id] ? "✓ Watched" : "● Unwatched"}
                                  </span>
                                )}
                              </div>

                              {/* TYPE 1: Reading Text */}
                              {mat.type === "text" && (
                                <div
                                  className={`whitespace-pre-wrap text-xs leading-relaxed bg-brand-bg/40 p-4 border border-brand-border/45 rounded-xl ${mat.textStyle === "bold" ? "font-bold text-brand-text" :
                                    mat.textStyle === "italic" ? "italic text-brand-text/95" :
                                      mat.textStyle === "heading" ? "text-base font-extrabold text-brand-cyan border-l-4 border-brand-cyan pl-3 py-1 bg-brand-cyan/5" :
                                        mat.textStyle === "quote" ? "border-l-4 border-brand-border pl-4 italic text-brand-muted bg-brand-bg/20 py-2" :
                                          mat.textStyle === "code" ? "font-mono bg-black/40 border border-brand-border/60 px-3.5 py-2.5 rounded-xl text-green-400 text-[11px]" :
                                            "text-brand-text/95"
                                  }`}
                                  dangerouslySetInnerHTML={{ __html: mat.content }}
                                />
                              )}

                              {/* TYPE 2: Video Link */}
                              {mat.type === "video" && (
                                <div className="w-full">
                                  {youtubeEmbedUrl ? (
                                    (() => {
                                      const videoId = getYouTubeVideoId(mat.content);
                                      return videoId ? (
                                        <YouTubeObserver
                                          videoId={videoId}
                                          onWatched={() => markVideoAsWatched(mat.id)}
                                        />
                                      ) : (
                                        <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border shadow-md bg-brand-bg">
                                          <iframe
                                            src={youtubeEmbedUrl}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full border-0"
                                          ></iframe>
                                        </div>
                                      );
                                    })()
                                  ) : mat.content.startsWith('yt-search:') ? (
                                    <a
                                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mat.content.replace('yt-search:', ''))}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/15 via-red-500/5 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text hover:shadow-lg hover:shadow-red-500/10 transition-all group cursor-pointer"
                                    >
                                      <div className="p-3 bg-red-600 rounded-xl group-hover:bg-red-500 transition-colors shrink-0 shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                      </div>
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-sm font-bold text-brand-text truncate">{mat.title}</span>
                                        <span className="text-[11px] text-red-400/90 font-semibold flex items-center gap-1">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" /></svg>
                                          Watch on YouTube
                                        </span>
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={mat.content}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-3 p-4 bg-brand-bg/50 border border-brand-border hover:border-brand-cyan rounded-xl text-brand-cyan hover:underline transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
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
                                <div className={`flex w-full ${mat.imageAlign === "left" ? "justify-start" :
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
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
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

                  {selectedTopic && activeMaterials.length > 0 && (
                    (() => {
                      const videoMaterial = getTopicVideoMaterial(selectedTopic);
                      const isVideoWatched = videoMaterial ? watchedVideos[videoMaterial.id] === true : true;
                      const isTopicCompleted = completedTopics[selectedTopic.id] === true;

                      return (
                        <div className="mt-8 pt-6 border-t border-brand-border/40">
                          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-brand-bg/30 border-brand-border/40">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-xs font-bold text-brand-text">Overall Topic Completion</span>
                              <span className="text-[11px] text-brand-muted">
                                {!isVideoWatched 
                                  ? "⚠️ Video lesson must be watched in full before marking this topic as completed." 
                                  : "Mark this entire topic as completed to save your progress."}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleTopicCompletion(selectedTopic.id)}
                                disabled={!isVideoWatched}
                                className={`px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 select-none ${
                                  isTopicCompleted
                                    ? "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                                    : !isVideoWatched
                                      ? "bg-brand-muted/20 text-brand-muted/50 border border-brand-border/40 cursor-not-allowed"
                                      : "bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg cursor-pointer"
                                }`}
                              >
                                {isTopicCompleted ? (
                                  <span className="flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Topic Completed
                                  </span>
                                ) : (
                                  "Mark Completed"
                                )}
                              </button>

                              {isTopicCompleted && (
                                <button
                                  onClick={handleSelectNextTopic}
                                  className="px-4 py-2.5 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg hover:shadow-md hover:shadow-brand-cyan/20 transition-all font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Next Topic</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </>
              )}

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
