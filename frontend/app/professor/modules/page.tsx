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

const DEFAULT_MODULES: Module[] = [];

export default function ProfessorModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and selection
  const [searchTerm, setSearchTerm] = useState("");
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);

  // Student Preview States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null);
  const [previewSubtopic, setPreviewSubtopic] = useState<Subtopic | null>(null);

  // Input states for creation
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [subtopicTitles, setSubtopicTitles] = useState<Record<number, string>>({});

  // Adding materials state
  const [addingMaterialTo, setAddingMaterialTo] = useState<{
    type: "topic" | "subtopic";
    topicId: number;
    subtopicId?: number;
    materialType: MaterialType;
  } | null>(null);

  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");
  const [matFileName, setMatFileName] = useState("");
  const [matFileSize, setMatFileSize] = useState("");

  // Editing states
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");

  const [editingSubtopicId, setEditingSubtopicId] = useState<number | null>(null);
  const [editingSubtopicTitle, setEditingSubtopicTitle] = useState("");

  // Editing material states
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingMaterialTitle, setEditingMaterialTitle] = useState("");
  const [editingMaterialContent, setEditingMaterialContent] = useState("");
  const [editingMaterialTextStyle, setEditingMaterialTextStyle] = useState<"normal" | "bold" | "italic" | "heading" | "quote" | "code">("normal");
  const [editingMaterialImageAlign, setEditingMaterialImageAlign] = useState<"left" | "center" | "right">("center");
  const [editingMaterialFileName, setEditingMaterialFileName] = useState("");
  const [editingMaterialFileSize, setEditingMaterialFileSize] = useState("");
  const [editingMaterialType, setEditingMaterialType] = useState<MaterialType>("text");

  // Collapsible topics state
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<number, boolean>>({});

  // Import from file states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedModule, setParsedModule] = useState<Module | null>(null);
  const [importError, setImportError] = useState("");

  // Initial load
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        const data = await res.json();
        if (data.success && data.modules) {
          setModules(data.modules);
          if (data.modules.length > 0) {
            setCurrentModuleId(data.modules[0].id);
          }
          try {
            localStorage.setItem("professor_course_modules", JSON.stringify(data.modules));
          } catch (err) {
            console.warn("Storage quota exceeded, could not write to localStorage:", err);
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
          const parsed = JSON.parse(stored);
          setModules(parsed);
          if (parsed.length > 0) {
            setCurrentModuleId(parsed[0].id);
          }
        } catch (e) {
          setModules(DEFAULT_MODULES);
          setCurrentModuleId(DEFAULT_MODULES[0]?.id || null);
        }
      } else {
        setModules(DEFAULT_MODULES);
        try {
          localStorage.setItem("professor_course_modules", JSON.stringify(DEFAULT_MODULES));
        } catch (err) {
          console.warn("Storage quota exceeded, could not write to localStorage:", err);
        }
        setCurrentModuleId(DEFAULT_MODULES[0]?.id || null);
      }
    };

    fetchModules();
  }, []);

  // Sync selected topic/subtopic for Student Preview mode when enabled
  useEffect(() => {
    if (isPreviewMode && currentModuleId) {
      const activeModule = modules.find(m => m.id === currentModuleId);
      if (activeModule && activeModule.topics.length > 0) {
        setPreviewTopic(activeModule.topics[0]);
        setPreviewSubtopic(null);
      } else {
        setPreviewTopic(null);
        setPreviewSubtopic(null);
      }
    }
  }, [isPreviewMode, currentModuleId, modules]);

  // Helper to persist modules state
  const updateAndPersistModules = async (updated: Module[]) => {
    setModules(updated);
    try {
      localStorage.setItem("professor_course_modules", JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage quota exceeded, could not write to localStorage:", err);
    }
    try {
      await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: updated })
      });
    } catch (error) {
      console.error("Error saving modules via API:", error);
    }
  };

  // Helper to parse YouTube embed URLs
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  // --- Module Handlers ---
  const createModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: Module = {
      id: Date.now(),
      title: newModuleTitle.trim(),
      topics: []
    };
    const updated = [newModule, ...modules];
    updateAndPersistModules(updated);
    setNewModuleTitle("");
    setCurrentModuleId(newModule.id);
  };

  const handleFileImport = async () => {
    if (!importFile) return;
    setIsParsing(true);
    setImportError("");
    setParsedModule(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/modules/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.module) {
        const newMod: Module = {
          id: Date.now(),
          title: data.module.title || importFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          topics: (data.module.topics || []).map((t: any, tIdx: number) => ({
            id: Date.now() + tIdx * 1000 + 1,
            title: t.title || `Topic ${tIdx + 1}`,
            materials: (t.materials || []).map((m: any, mIdx: number) => ({
              id: Date.now() + tIdx * 1000 + mIdx + 100000,
              type: m.type,
              title: m.title,
              content: m.content,
              textStyle: m.textStyle,
              imageAlign: m.imageAlign
            })),
            subtopics: (t.subtopics || []).map((s: any, sIdx: number) => ({
              id: Date.now() + tIdx * 1000 + sIdx + 200000,
              title: s.title || `Subtopic ${sIdx + 1}`,
              materials: (s.materials || []).map((sm: any, smIdx: number) => ({
                id: Date.now() + tIdx * 1000 + sIdx * 100 + smIdx + 300000,
                type: sm.type,
                title: sm.title,
                content: sm.content,
                textStyle: sm.textStyle,
                imageAlign: sm.imageAlign
              }))
            }))
          }))
        };
        setParsedModule(newMod);
      } else {
        setImportError(data.message || "Failed to parse document structure.");
      }
    } catch (err) {
      console.error("File import error:", err);
      setImportError("Error occurred during document scanning. Please retry.");
    } finally {
      setIsParsing(false);
    }
  };

  const confirmImportModule = () => {
    if (!parsedModule) return;
    const updated = [parsedModule, ...modules];
    updateAndPersistModules(updated);
    setCurrentModuleId(parsedModule.id);
    setIsImportModalOpen(false);
    setParsedModule(null);
    setImportFile(null);
  };

  const deleteModule = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this module and all its topics?")) return;
    const updated = modules.filter(m => m.id !== id);
    updateAndPersistModules(updated);
    if (currentModuleId === id) {
      setCurrentModuleId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const startEditModule = (mod: Module, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
  };

  const saveEditModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModuleTitle.trim() || !editingModuleId) return;
    const updated = modules.map(m =>
      m.id === editingModuleId ? { ...m, title: editingModuleTitle.trim() } : m
    );
    updateAndPersistModules(updated);
    setEditingModuleId(null);
  };

  // --- Topic Handlers ---
  const addTopic = (moduleId: number) => {
    if (!newTopicTitle.trim()) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: [
              ...mod.topics,
              { id: Date.now(), title: newTopicTitle.trim(), subtopics: [], materials: [] }
            ]
          }
        : mod
    );
    updateAndPersistModules(updated);
    setNewTopicTitle("");
  };

  const deleteTopic = (moduleId: number, topicId: number) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? { ...mod, topics: mod.topics.filter(t => t.id !== topicId) }
        : mod
    );
    updateAndPersistModules(updated);
  };

  const startEditTopic = (topicId: number, title: string) => {
    setEditingTopicId(topicId);
    setEditingTopicTitle(title);
  };

  const saveEditTopic = (moduleId: number) => {
    if (!editingTopicTitle.trim() || !editingTopicId) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: mod.topics.map(t =>
              t.id === editingTopicId ? { ...t, title: editingTopicTitle.trim() } : t
            )
          }
        : mod
    );
    updateAndPersistModules(updated);
    setEditingTopicId(null);
  };

  const moveTopic = (moduleId: number, index: number, direction: "up" | "down") => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const list = [...mod.topics];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = modules.map(m =>
      m.id === moduleId ? { ...m, topics: list } : m
    );
    updateAndPersistModules(updated);
  };

  // --- Subtopic Handlers ---
  const addSubtopic = (moduleId: number, topicId: number) => {
    const titleText = subtopicTitles[topicId];
    if (!titleText || !titleText.trim()) return;
    
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: mod.topics.map(t =>
              t.id === topicId
                ? {
                    ...t,
                    subtopics: [
                      ...(t.subtopics || []),
                      { id: Date.now(), title: titleText.trim(), materials: [] }
                    ]
                  }
                : t
            )
          }
        : mod
    );
    updateAndPersistModules(updated);
    setSubtopicTitles(prev => ({ ...prev, [topicId]: "" }));
    
    // Automatically make sure topic is expanded when adding a subtopic
    setExpandedTopics(prev => ({ ...prev, [topicId]: true }));
  };

  const deleteSubtopic = (moduleId: number, topicId: number, subtopicId: number) => {
    if (!confirm("Are you sure you want to delete this subtopic?")) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: mod.topics.map(t =>
              t.id === topicId
                ? {
                    ...t,
                    subtopics: (t.subtopics || []).filter(s => s.id !== subtopicId)
                  }
                : t
            )
          }
        : mod
    );
    updateAndPersistModules(updated);
  };

  const startEditSubtopic = (subtopicId: number, title: string) => {
    setEditingSubtopicId(subtopicId);
    setEditingSubtopicTitle(title);
  };

  const saveEditSubtopic = (moduleId: number, topicId: number) => {
    if (!editingSubtopicTitle.trim() || !editingSubtopicId) return;
    const updated = modules.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            topics: mod.topics.map(t =>
              t.id === topicId
                ? {
                    ...t,
                    subtopics: (t.subtopics || []).map(s =>
                      s.id === editingSubtopicId ? { ...s, title: editingSubtopicTitle.trim() } : s
                    )
                  }
                : t
            )
          }
        : mod
    );
    updateAndPersistModules(updated);
    setEditingSubtopicId(null);
  };

  const moveSubtopic = (moduleId: number, topicId: number, index: number, direction: "up" | "down") => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const topic = mod.topics.find(t => t.id === topicId);
    if (!topic || !topic.subtopics) return;
    const list = [...topic.subtopics];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = modules.map(m =>
      m.id === moduleId
        ? {
            ...m,
            topics: m.topics.map(t =>
              t.id === topicId ? { ...t, subtopics: list } : t
            )
          }
        : m
    );
    updateAndPersistModules(updated);
  };

  // --- Rich Material Handlers ---
  const handleMaterialFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMatFileName(file.name);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    setMatFileSize(sizeStr);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMatContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveMaterial = (moduleId: number, topicId: number, subtopicId?: number) => {
    if (!addingMaterialTo) return;
    const { materialType } = addingMaterialTo;

    let finalTitle = matTitle.trim();
    if (!finalTitle) {
      if (materialType === "text") finalTitle = "Reading Section";
      else if (materialType === "video") finalTitle = "Watch Explanatory Video";
      else if (materialType === "image") finalTitle = matFileName || "Reference Image";
      else if (materialType === "file") finalTitle = matFileName || "Study Document";
    }

    const newMaterial: Material = {
      id: Date.now(),
      type: materialType,
      title: finalTitle,
      content: matContent.trim(),
      fileName: matFileName || undefined,
      fileSize: matFileSize || undefined
    };

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            // Add material to subtopic
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId) return s;
                return {
                  ...s,
                  materials: [...(s.materials || []), newMaterial]
                };
              })
            };
          } else {
            // Add material to topic
            return {
              ...t,
              materials: [...(t.materials || []), newMaterial]
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
    
    // Clear inputs & state
    setAddingMaterialTo(null);
    setMatTitle("");
    setMatContent("");
    setMatFileName("");
    setMatFileSize("");
  };

  const deleteMaterial = (moduleId: number, topicId: number, subtopicId: number | undefined, materialId: number) => {
    if (!confirm("Are you sure you want to delete this learning material?")) return;

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId) return s;
                return {
                  ...s,
                  materials: (s.materials || []).filter(m => m.id !== materialId)
                };
              })
            };
          } else {
            return {
              ...t,
              materials: (t.materials || []).filter(m => m.id !== materialId)
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const moveMaterial = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    index: number,
    direction: "up" | "down"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            // Move inside subtopic
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                const list = [...s.materials];
                const target = direction === "up" ? index - 1 : index + 1;
                if (target < 0 || target >= list.length) return s;
                const temp = list[index];
                list[index] = list[target];
                list[target] = temp;
                return { ...s, materials: list };
              })
            };
          } else {
            // Move inside topic
            if (!t.materials) return t;
            const list = [...t.materials];
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= list.length) return t;
            const temp = list[index];
            list[index] = list[target];
            list[target] = temp;
            return { ...t, materials: list };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const updateMaterialTextStyle = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    materialId: number,
    textStyle: "normal" | "bold" | "italic" | "heading" | "quote" | "code"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                return {
                  ...s,
                  materials: s.materials.map(m =>
                    m.id === materialId ? { ...m, textStyle } : m
                  )
                };
              })
            };
          } else {
            if (!t.materials) return t;
            return {
              ...t,
              materials: t.materials.map(m =>
                m.id === materialId ? { ...m, textStyle } : m
              )
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  const updateMaterialImageAlign = (
    moduleId: number,
    topicId: number,
    subtopicId: number | undefined,
    materialId: number,
    imageAlign: "left" | "center" | "right"
  ) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId || !s.materials) return s;
                return {
                  ...s,
                  materials: s.materials.map(m =>
                    m.id === materialId ? { ...m, imageAlign } : m
                  )
                };
              })
            };
          } else {
            if (!t.materials) return t;
            return {
              ...t,
              materials: t.materials.map(m =>
                m.id === materialId ? { ...m, imageAlign } : m
              )
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
  };

  // --- Material Formatting & Editing Helpers ---
  const insertFormatTag = (textareaId: string, tagStart: string, tagEnd: string, isEditing: boolean) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = tagStart + selectedText + tagEnd;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    if (isEditing) {
      setEditingMaterialContent(newContent);
    } else {
      setMatContent(newContent);
    }

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 0);
  };

  const renderFormattingToolbar = (textareaId: string, isEditing: boolean) => {
    return (
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-brand-bg/60 border border-brand-border/40 rounded-t-lg -mb-2 border-b-0 text-xs select-none">
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<strong>", "</strong>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<em>", "</em>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, "<u>", "</u>", isEditing)}
          className="p-1 px-2 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-text underline"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, '<mark style="background-color: rgba(34, 211, 238, 0.25); color: #22d3ee; padding: 2px 4px; border-radius: 4px;">', "</mark>", isEditing)}
          className="p-1 px-1.5 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-brand-cyan font-semibold flex items-center gap-1"
          title="Highlight"
        >
          <span className="text-[10px]">📝</span> Highlight
        </button>
        <button
          type="button"
          onClick={() => insertFormatTag(textareaId, '<code style="font-family: monospace; bg-black/40 border border-brand-border/60 px-1.5 py-0.5 rounded text-green-400 text-[11px]">', "</code>", isEditing)}
          className="p-1 px-1.5 rounded bg-brand-card hover:bg-brand-bg border border-brand-border/30 hover:border-brand-cyan/40 text-green-400 font-mono text-[10px]"
          title="Code"
        >
          &lt;/&gt;
        </button>

        <div className="w-[1px] h-4 bg-brand-border/40 mx-0.5"></div>

        {/* Font Family Select Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              insertFormatTag(textareaId, `<span style="font-family: ${e.target.value};">`, "</span>", isEditing);
              e.target.value = ""; // Reset
            }
          }}
          className="bg-brand-card border border-brand-border/45 rounded p-1 text-[10px] text-brand-text focus:outline-none focus:border-brand-cyan/60"
          defaultValue=""
        >
          <option value="" disabled>Font Family</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Outfit', sans-serif">Outfit</option>
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'Roboto Mono', monospace">Roboto Mono</option>
        </select>

        {/* Font Size Select Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              insertFormatTag(textareaId, `<span style="font-size: ${e.target.value};">`, "</span>", isEditing);
              e.target.value = ""; // Reset
            }
          }}
          className="bg-brand-card border border-brand-border/45 rounded p-1 text-[10px] text-brand-text focus:outline-none focus:border-brand-cyan/60"
          defaultValue=""
        >
          <option value="" disabled>Font Size</option>
          <option value="11px">Small</option>
          <option value="14px">Medium</option>
          <option value="18px">Large</option>
          <option value="24px">Extra Large</option>
        </select>
      </div>
    );
  };

  const startEditMaterial = (topicId: number, subtopicId: number | undefined, mat: Material) => {
    setEditingMaterialId(mat.id);
    setEditingMaterialTitle(mat.title);
    setEditingMaterialContent(mat.content);
    setEditingMaterialTextStyle(mat.textStyle || "normal");
    setEditingMaterialImageAlign(mat.imageAlign || "center");
    setEditingMaterialFileName(mat.fileName || "");
    setEditingMaterialFileSize(mat.fileSize || "");
    setEditingMaterialType(mat.type);
    
    // Close addition form if open
    setAddingMaterialTo(null);
  };

  const cancelEditMaterial = () => {
    setEditingMaterialId(null);
    setEditingMaterialTitle("");
    setEditingMaterialContent("");
    setEditingMaterialTextStyle("normal");
    setEditingMaterialImageAlign("center");
    setEditingMaterialFileName("");
    setEditingMaterialFileSize("");
  };

  const saveEditMaterial = (moduleId: number, topicId: number, subtopicId?: number) => {
    if (!editingMaterialId) return;

    let finalTitle = editingMaterialTitle.trim();
    if (!finalTitle) {
      if (editingMaterialType === "text") finalTitle = "Reading Section";
      else if (editingMaterialType === "video") finalTitle = "Watch Explanatory Video";
      else if (editingMaterialType === "image") finalTitle = editingMaterialFileName || "Reference Image";
      else if (editingMaterialType === "file") finalTitle = editingMaterialFileName || "Study Document";
    }

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;

      return {
        ...mod,
        topics: mod.topics.map(t => {
          if (t.id !== topicId) return t;

          if (subtopicId !== undefined) {
            return {
              ...t,
              subtopics: (t.subtopics || []).map(s => {
                if (s.id !== subtopicId) return s;
                return {
                  ...s,
                  materials: (s.materials || []).map(m => {
                    if (m.id !== editingMaterialId) return m;
                    return {
                      ...m,
                      title: finalTitle,
                      content: editingMaterialContent.trim(),
                      textStyle: editingMaterialTextStyle,
                      imageAlign: editingMaterialImageAlign,
                      fileName: editingMaterialFileName || undefined,
                      fileSize: editingMaterialFileSize || undefined
                    };
                  })
                };
              })
            };
          } else {
            return {
              ...t,
              materials: (t.materials || []).map(m => {
                if (m.id !== editingMaterialId) return m;
                return {
                  ...m,
                  title: finalTitle,
                  content: editingMaterialContent.trim(),
                  textStyle: editingMaterialTextStyle,
                  imageAlign: editingMaterialImageAlign,
                  fileName: editingMaterialFileName || undefined,
                  fileSize: editingMaterialFileSize || undefined
                };
              })
            };
          }
        })
      };
    });

    updateAndPersistModules(updated);
    cancelEditMaterial();
  };

  const handleEditMaterialFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditingMaterialFileName(file.name);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    setEditingMaterialFileSize(sizeStr);

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingMaterialContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle topic expanded state
  const toggleTopicExpand = (topicId: number) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId]
    }));
  };

  const toggleSubtopicExpand = (subtopicId: number) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: prev[subtopicId] === undefined ? false : !prev[subtopicId]
    }));
  };

  // Filter modules by search
  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedModule = modules.find(m => m.id === currentModuleId);

  // Statistics calculations
  const totalModules = modules.length;
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const totalSubtopics = modules.reduce(
    (sum, m) => sum + m.topics.reduce((subSum, t) => subSum + (t.subtopics?.length || 0), 0),
    0
  );
  const totalResources = modules.reduce(
    (sum, m) =>
      sum +
      m.topics.reduce((resSum, t) => {
        let count = (t.materials || []).length;
        count += t.subtopics?.reduce((subSum, s) => {
          return subSum + (s.materials || []).length;
        }, 0) || 0;
        return resSum + count;
      }, 0),
    0
  );

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/modules" />
      
      <main className="p-8 flex-grow w-full max-w-6xl mx-auto text-brand-text">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Course Modules</h1>
            <p className="text-brand-muted text-sm">
              Create curriculum structure, arrange topics, and add rich reading, video, and document materials.
            </p>
          </div>
        </header>

        {/* Statistics Panels */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Modules</div>
              <div className="text-2xl font-bold mt-1">{totalModules}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Topics</div>
              <div className="text-2xl font-bold mt-1">{totalTopics}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Subtopics</div>
              <div className="text-2xl font-bold mt-1">{totalSubtopics}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9Z"/><path d="M15 3v6h6"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total Materials</div>
              <div className="text-2xl font-bold mt-1">{totalResources}</div>
            </div>
            <div className="p-2.5 bg-brand-cyan/10 rounded-lg text-brand-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT PANE: Modules Manager */}
            <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-lg text-brand-text mb-1">Create Module</h3>
                <p className="text-xs text-brand-muted">Add a new high-level chapter to your class.</p>
              </div>

              {/* Module Creation */}
              <div className="flex gap-2">
                <input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. OSPF Routing Concepts"
                  className="flex-grow bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/70 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createModule();
                  }}
                />
                <button
                  onClick={createModule}
                  disabled={!newModuleTitle.trim()}
                  className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg font-bold px-4 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
                >
                  Create
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <div className="text-center text-xs text-brand-muted my-1">— OR —</div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full bg-brand-cyan/10 hover:bg-brand-cyan/25 border border-brand-cyan/35 text-brand-cyan font-bold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Auto-Generate from PDF/DOCX
                </button>
              </div>

              <div className="border-t border-brand-border/40 my-1"></div>

              {/* Module Listing with Search */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-brand-text">Your Modules</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted border border-brand-border">
                    {filteredModules.length} found
                  </span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Filter modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/60 placeholder-brand-muted/70 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-text"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredModules.length === 0 ? (
                    <div className="text-center text-xs text-brand-muted py-6">
                      No modules found. Create one above!
                    </div>
                  ) : (
                    filteredModules.map((mod) => (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setCurrentModuleId(mod.id);
                          setAddingMaterialTo(null);
                        }}
                        className={`group relative p-3 rounded-lg border cursor-pointer flex flex-col gap-1 transition-all ${
                          currentModuleId === mod.id
                            ? "bg-brand-cyan/10 border-brand-cyan text-brand-text shadow-sm"
                            : "bg-brand-card border-brand-border hover:bg-brand-bg/40 hover:border-brand-border-var"
                        }`}
                      >
                        {editingModuleId === mod.id ? (
                          <form
                            onSubmit={saveEditModule}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full mt-1"
                          >
                            <input
                              value={editingModuleTitle}
                              onChange={(e) => setEditingModuleTitle(e.target.value)}
                              className="bg-brand-bg border border-brand-cyan rounded px-2 py-1 text-xs text-brand-text flex-grow focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="text-green-500 hover:text-green-400 p-1"
                              title="Save Changes"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModuleId(null);
                              }}
                              className="text-red-500 hover:text-red-400 p-1"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start pr-12">
                              <span className="font-semibold text-sm truncate w-full">
                                {mod.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-brand-muted flex items-center gap-2 mt-1">
                              <span>{mod.topics.length} topics</span>
                              <span>•</span>
                              <span>
                                {mod.topics.reduce(
                                  (sum, t) => sum + (t.subtopics?.length || 0),
                                  0
                                )}{" "}
                                subtopics
                              </span>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-brand-card via-brand-card to-transparent pl-4 py-1.5">
                              <button
                                onClick={(e) => startEditModule(mod, e)}
                                className="text-brand-muted hover:text-brand-cyan p-1 rounded transition-colors"
                                title="Rename Module"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button
                                onClick={(e) => deleteModule(mod.id, e)}
                                className="text-brand-muted hover:text-red-400 p-1 rounded transition-colors"
                                title="Delete Module"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Selected Module Detail Panel */}
            <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
              {selectedModule ? (
                <div>
                  
                  {/* Workspace Header with Builder/Preview toggle */}
                  <div className="border-b border-brand-border/40 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">
                        {isPreviewMode ? "Curriculum Preview Sim" : "Curriculum Builder Workspace"}
                      </span>
                      <h2 className="text-xl font-bold mt-0.5">{selectedModule.title}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Mode Toggle Button Group */}
                      <div className="flex bg-brand-bg border border-brand-border p-1 rounded-lg shrink-0">
                        <button
                          onClick={() => setIsPreviewMode(false)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${!isPreviewMode ? 'bg-brand-cyan text-brand-bg font-bold shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                          Builder
                        </button>
                        <button
                          onClick={() => setIsPreviewMode(true)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isPreviewMode ? 'bg-brand-cyan text-brand-bg font-bold shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                        >
                          Student Preview
                        </button>
                      </div>

                      <div className="text-xs text-brand-muted bg-brand-bg border border-brand-border px-3 py-1.5 rounded-lg flex items-center gap-1.5 hidden md:flex shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                        Active Module
                      </div>
                    </div>
                  </div>

                  {!isPreviewMode ? (
                    <>
                      {/* BUILDER MODE */}
                      {/* Add Topic Input */}
                      <div className="mb-6 bg-brand-bg/40 p-4 rounded-xl border border-brand-border/45">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          Add Topic
                        </h4>
                        <div className="flex gap-2">
                          <input
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            placeholder="e.g. Classless Inter-Domain Routing (CIDR)"
                            className="flex-grow bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/70"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addTopic(selectedModule.id);
                            }}
                          />
                          <button
                            onClick={() => addTopic(selectedModule.id)}
                            disabled={!newTopicTitle.trim()}
                            className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold px-4 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Add Topic
                          </button>
                        </div>
                      </div>

                      {/* Topics List */}
                      <div>
                        <h3 className="font-bold text-sm text-brand-muted mb-4 uppercase tracking-wider">
                          Module Outline
                        </h3>

                        {selectedModule.topics.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mx-auto mb-3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            <p className="text-xs text-brand-muted">This module has no topics yet.</p>
                            <p className="text-[10px] text-brand-muted/70 mt-1">Create one above to begin structuring.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {selectedModule.topics.map((topic, topicIdx) => {
                              const isExpanded = expandedTopics[topic.id] !== false; // default true
                              
                              return (
                                <div
                                  key={topic.id}
                                  className="border border-brand-border/40 rounded-xl bg-brand-bg/25 overflow-hidden transition-all shadow-sm hover:border-brand-border"
                                >
                                  
                                  {/* Topic Header Card */}
                                  <div className="bg-brand-card/45 px-4 py-3 flex items-center justify-between border-b border-brand-border/20">
                                    
                                    {/* Topic Name / Edit Mode */}
                                    <div className="flex-grow mr-4">
                                      {editingTopicId === topic.id ? (
                                        <div className="flex items-center gap-2 max-w-md" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            value={editingTopicTitle}
                                            onChange={(e) => setEditingTopicTitle(e.target.value)}
                                            className="bg-brand-bg border border-brand-cyan rounded-lg px-2 py-1 text-xs text-brand-text flex-grow focus:outline-none"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => saveEditTopic(selectedModule.id)}
                                            className="text-green-500 hover:text-green-400 p-1"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                          </button>
                                          <button
                                            onClick={() => setEditingTopicId(null)}
                                            className="text-red-500 hover:text-red-400 p-1"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <div
                                          onClick={() => toggleTopicExpand(topic.id)}
                                          className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                          <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded">
                                            Topic {topicIdx + 1}
                                          </span>
                                          <span className="font-bold text-sm text-brand-text hover:text-brand-cyan transition-colors">
                                            {topic.title}
                                          </span>
                                          <span className="text-brand-muted">
                                            {isExpanded ? (
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                            ) : (
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Reordering & CRUD controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Up/Down Arrow reordering */}
                                      <div className="flex items-center bg-brand-bg rounded-lg border border-brand-border/60 p-0.5">
                                        <button
                                          disabled={topicIdx === 0}
                                          onClick={() => moveTopic(selectedModule.id, topicIdx, "up")}
                                          className="p-1 text-brand-muted hover:text-brand-cyan disabled:opacity-20 disabled:hover:text-brand-muted transition-colors"
                                          title="Move Up"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                        </button>
                                        <div className="w-[1px] h-3 bg-brand-border/50"></div>
                                        <button
                                          disabled={topicIdx === selectedModule.topics.length - 1}
                                          onClick={() => moveTopic(selectedModule.id, topicIdx, "down")}
                                          className="p-1 text-brand-muted hover:text-brand-cyan disabled:opacity-20 disabled:hover:text-brand-muted transition-colors"
                                          title="Move Down"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </button>
                                      </div>

                                      <div className="w-[1px] h-4 bg-brand-border/40 mx-0.5"></div>

                                      {/* Edit / Trash */}
                                      <button
                                        onClick={() => startEditTopic(topic.id, topic.title)}
                                        className="p-1.5 text-brand-muted hover:text-brand-cyan hover:bg-brand-bg rounded transition-all"
                                        title="Edit Topic Title"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                      </button>
                                      <button
                                        onClick={() => deleteTopic(selectedModule.id, topic.id)}
                                        className="p-1.5 text-brand-muted hover:text-red-400 hover:bg-brand-bg rounded transition-all"
                                        title="Delete Topic"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expanded Topic Details */}
                                  {isExpanded && (
                                    <div className="p-4 flex flex-col gap-4 bg-brand-card/20">
                                      
                                      {/* Learning Materials Section */}
                                      <div className="border border-brand-border/40 rounded-xl p-4 bg-brand-bg/10 flex flex-col">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-brand-border/10">
                                          <h5 className="text-[11px] uppercase font-bold text-brand-muted tracking-wider">
                                            Learning Materials ({(topic.materials || []).length})
                                          </h5>
                                          
                                          {/* Add Material Menu */}
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] text-brand-muted font-medium mr-1">Add:</span>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "text" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Reading
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "video" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Video Link
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "image" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Image
                                            </button>
                                            <button
                                              onClick={() => {
                                                setAddingMaterialTo({ type: "topic", topicId: topic.id, materialType: "file" });
                                                setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                              }}
                                              className="px-2 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan rounded text-[10px] transition-colors"
                                            >
                                              + Document
                                            </button>
                                          </div>
                                        </div>

                                        {/* Adding Material Form (Topic) */}
                                        {addingMaterialTo?.type === "topic" && addingMaterialTo?.topicId === topic.id && (
                                          <div className="bg-brand-card border border-brand-cyan/30 rounded-xl p-4 mb-4 flex flex-col gap-3 shadow-md" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                                                New {addingMaterialTo.materialType} Content
                                              </span>
                                              <button
                                                onClick={() => setAddingMaterialTo(null)}
                                                className="text-[10px] text-brand-muted hover:text-red-400 font-semibold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                            
                                            <input
                                              value={matTitle}
                                              onChange={(e) => setMatTitle(e.target.value)}
                                              placeholder="Material Title (e.g. Subnetting Basics Reading, YouTube explanation)"
                                              className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                            />

                                            {addingMaterialTo.materialType === "text" && (
                                              <div className="flex flex-col">
                                                {renderFormattingToolbar(`mat-textarea-new-${topic.id}`, false)}
                                                <textarea
                                                  id={`mat-textarea-new-${topic.id}`}
                                                  value={matContent}
                                                  onChange={(e) => setMatContent(e.target.value)}
                                                  placeholder="Write your study text here..."
                                                  className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-28 resize-y"
                                                />
                                              </div>
                                            )}

                                            {addingMaterialTo.materialType === "video" && (
                                              <input
                                                value={matContent}
                                                onChange={(e) => setMatContent(e.target.value)}
                                                placeholder="Paste Video URL (e.g. https://www.youtube.com/watch?v=...)"
                                                className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                              />
                                            )}

                                            {(addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && (
                                              <div className="flex items-center gap-3">
                                                <label className="text-xs font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                                  <span>Upload File</span>
                                                  <input
                                                    type="file"
                                                    className="hidden"
                                                    accept={addingMaterialTo.materialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                    onChange={(e) => handleMaterialFileUpload(e, addingMaterialTo.materialType as 'image' | 'file')}
                                                  />
                                                </label>
                                                {matFileName ? (
                                                  <span className="text-[10px] text-brand-text truncate">
                                                    {matFileName} ({matFileSize})
                                                  </span>
                                                ) : (
                                                  <span className="text-[10px] text-brand-muted">No file chosen.</span>
                                                )}
                                              </div>
                                            )}

                                            <button
                                              onClick={() => saveMaterial(selectedModule.id, topic.id)}
                                              disabled={
                                                (addingMaterialTo.materialType === "text" && !matContent.trim()) ||
                                                (addingMaterialTo.materialType === "video" && !matContent.trim()) ||
                                                ((addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && !matContent)
                                              }
                                              className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                              Add Material
                                            </button>
                                          </div>
                                        )}

                                        {/* Render Materials List (Topic) */}
                                        {(topic.materials || []).length === 0 ? (
                                          <div className="text-center text-[10px] text-brand-muted/70 py-4 italic">
                                            No materials added to this topic yet. Add reading sheets or video links above.
                                          </div>
                                        ) : (
                                          <div className="flex flex-col gap-2">
                                            {(topic.materials || []).map((mat, matIdx) => (
                                              editingMaterialId === mat.id ? (
                                                <div key={mat.id} className="bg-brand-card border border-brand-cyan/30 rounded-xl p-4 mb-2 flex flex-col gap-3 shadow-md" onClick={(e) => e.stopPropagation()}>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                                                      Edit {editingMaterialType} Content
                                                    </span>
                                                    <button
                                                      onClick={cancelEditMaterial}
                                                      className="text-[10px] text-brand-muted hover:text-red-400 font-semibold"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                  
                                                  <input
                                                    value={editingMaterialTitle}
                                                    onChange={(e) => setEditingMaterialTitle(e.target.value)}
                                                    placeholder="Material Title"
                                                    className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                  />

                                                  {editingMaterialType === "text" && (
                                                    <div className="flex flex-col">
                                                      {renderFormattingToolbar(`mat-textarea-edit-${mat.id}`, true)}
                                                      <textarea
                                                        id={`mat-textarea-edit-${mat.id}`}
                                                        value={editingMaterialContent}
                                                        onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                        placeholder="Write your study text here..."
                                                        className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-28 resize-y"
                                                      />
                                                    </div>
                                                  )}

                                                  {editingMaterialType === "video" && (
                                                    <input
                                                      value={editingMaterialContent}
                                                      onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                      placeholder="Paste Video URL"
                                                      className="bg-brand-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                    />
                                                  )}

                                                  {(editingMaterialType === "image" || editingMaterialType === "file") && (
                                                    <div className="flex items-center gap-3">
                                                      <label className="text-xs font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                                        <span>Upload New File</span>
                                                        <input
                                                          type="file"
                                                          className="hidden"
                                                          accept={editingMaterialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                          onChange={(e) => handleEditMaterialFileUpload(e, editingMaterialType as 'image' | 'file')}
                                                        />
                                                      </label>
                                                      {editingMaterialFileName ? (
                                                        <span className="text-[10px] text-brand-text truncate">
                                                          {editingMaterialFileName} ({editingMaterialFileSize})
                                                        </span>
                                                      ) : (
                                                        <span className="text-[10px] text-brand-muted font-mono max-w-[200px] truncate">
                                                          {editingMaterialContent.startsWith("data:") ? "Existing base64 resource" : editingMaterialContent}
                                                        </span>
                                                      )}
                                                    </div>
                                                  )}

                                                  <button
                                                    onClick={() => saveEditMaterial(selectedModule.id, topic.id)}
                                                    disabled={
                                                      (editingMaterialType === "text" && !editingMaterialContent.trim()) ||
                                                      (editingMaterialType === "video" && !editingMaterialContent.trim()) ||
                                                      ((editingMaterialType === "image" || editingMaterialType === "file") && !editingMaterialContent)
                                                    }
                                                    className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-xs font-bold py-2 rounded-lg transition-colors"
                                                  >
                                                    Save Changes
                                                  </button>
                                                </div>
                                              ) : (
                                                <div
                                                  key={mat.id}
                                                  className="flex flex-col gap-2 bg-brand-card/40 border border-brand-border/30 rounded-lg p-3 hover:border-brand-border transition-colors animate-fadeIn"
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2.5 truncate mr-4">
                                                      {/* Material Type Icon */}
                                                      {mat.type === "text" && (
                                                        <span className="text-brand-cyan" title="Reading Sheet">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "video" && (
                                                        <span className="text-brand-cyan" title="Video Resource">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "image" && (
                                                        <span className="text-brand-cyan" title="Image Reference">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                        </span>
                                                      )}
                                                      {mat.type === "file" && (
                                                        <span className="text-brand-cyan" title="Document File">
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                                        </span>
                                                      )}

                                                      <div className="flex flex-col truncate">
                                                        <span className="text-xs font-semibold text-brand-text truncate">
                                                          {mat.title}
                                                        </span>
                                                        <span className="text-[9px] text-brand-muted truncate">
                                                          {mat.fileName ? `${mat.fileName} (${mat.fileSize})` : mat.content}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      {/* Reordering */}
                                                      <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40">
                                                        <button
                                                          disabled={matIdx === 0}
                                                          onClick={() => moveMaterial(selectedModule.id, topic.id, undefined, matIdx, "up")}
                                                          className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                        >
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                        </button>
                                                        <button
                                                          disabled={matIdx === (topic.materials || []).length - 1}
                                                          onClick={() => moveMaterial(selectedModule.id, topic.id, undefined, matIdx, "down")}
                                                          className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                        >
                                                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        </button>
                                                      </div>

                                                      <button
                                                        onClick={() => startEditMaterial(topic.id, undefined, mat)}
                                                        className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                        title="Edit Material"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                      </button>

                                                      <button
                                                        onClick={() => deleteMaterial(selectedModule.id, topic.id, undefined, mat.id)}
                                                        className="text-brand-muted hover:text-red-400 p-0.5"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {/* Style / Position adjustments */}
                                                  {mat.type === "text" && (
                                                    <div className="flex items-center gap-1.5 mt-1 border-t border-brand-border/10 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                      <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider">Style:</span>
                                                      {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                        <button
                                                          key={style}
                                                          onClick={() => updateMaterialTextStyle(selectedModule.id, topic.id, undefined, mat.id, style)}
                                                          className={`px-2 py-0.5 rounded-md text-[9px] capitalize border transition-all ${
                                                            (mat.textStyle || "normal") === style
                                                              ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                              : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                          }`}
                                                        >
                                                          {style}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}

                                                  {mat.type === "image" && (
                                                    <div className="flex items-center gap-1.5 mt-1 border-t border-brand-border/10 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                      <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider">Align:</span>
                                                      {(["left", "center", "right"] as const).map((align) => (
                                                        <button
                                                          key={align}
                                                          onClick={() => updateMaterialImageAlign(selectedModule.id, topic.id, undefined, mat.id, align)}
                                                          className={`px-2 py-0.5 rounded-md text-[9px] capitalize border transition-all ${
                                                            (mat.imageAlign || "center") === align
                                                              ? "bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold shadow-sm shadow-brand-cyan/10"
                                                              : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                          }`}
                                                        >
                                                          {align}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        )}

                                      </div>

                                      {/* Subtopics Listing */}
                                      <div className="pl-2 border-l border-brand-border/40 mt-1 flex flex-col gap-2">
                                        <h5 className="text-[10px] uppercase font-bold text-brand-muted tracking-wider mb-1">
                                          Subtopics ({topic.subtopics?.length || 0})
                                        </h5>

                                        {(topic.subtopics || []).map((sub, subIdx) => (
                                          <div
                                            key={sub.id}
                                            className="group/sub flex flex-col bg-brand-bg/40 border border-brand-border/30 rounded-lg p-3 hover:border-brand-border transition-all"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex-grow mr-4">
                                                {editingSubtopicId === sub.id ? (
                                                  <div className="flex items-center gap-2 max-w-sm" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                      value={editingSubtopicTitle}
                                                      onChange={(e) => setEditingSubtopicTitle(e.target.value)}
                                                      className="bg-brand-bg border border-brand-cyan rounded-md px-2 py-0.5 text-xs text-brand-text flex-grow focus:outline-none"
                                                      autoFocus
                                                    />
                                                    <button
                                                      onClick={() => saveEditSubtopic(selectedModule.id, topic.id)}
                                                      className="text-green-500 hover:text-green-400 p-0.5"
                                                    >
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                                    </button>
                                                    <button
                                                      onClick={() => setEditingSubtopicId(null)}
                                                      className="text-red-500 hover:text-red-400 p-0.5"
                                                    >
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div
                                                    onClick={() => toggleSubtopicExpand(sub.id)}
                                                    className="flex items-center gap-2 cursor-pointer select-none group/subTitle"
                                                  >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/70"></span>
                                                    <span className="text-xs text-brand-text font-semibold hover:text-brand-cyan transition-colors">
                                                      {sub.title}
                                                    </span>
                                                    <span className="text-brand-muted hover:text-brand-cyan transition-all transform shrink-0">
                                                      {expandedSubtopics[sub.id] !== false ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                      ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                      )}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Subtopic Outlines / CRUD controls */}
                                              <div className="flex items-center gap-2 shrink-0">
                                                {/* Move Up/Down Subtopic */}
                                                <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                  <button
                                                    disabled={subIdx === 0}
                                                    onClick={() => moveSubtopic(selectedModule.id, topic.id, subIdx, "up")}
                                                    className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                    title="Move Up"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                  </button>
                                                  <button
                                                    disabled={subIdx === (topic.subtopics || []).length - 1}
                                                    onClick={() => moveSubtopic(selectedModule.id, topic.id, subIdx, "down")}
                                                    className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10 transition-colors"
                                                    title="Move Down"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                  </button>
                                                </div>

                                                <div className="w-[1px] h-3 bg-brand-border/40"></div>

                                                <button
                                                  onClick={() => startEditSubtopic(sub.id, sub.title)}
                                                  className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                  title="Rename Subtopic"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                </button>
                                                <button
                                                  onClick={() => deleteSubtopic(selectedModule.id, topic.id, sub.id)}
                                                  className="text-brand-muted hover:text-red-400 p-0.5"
                                                  title="Delete Subtopic"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                </button>
                                              </div>
                                            </div>

                                            {/* Subtopic Materials Management Section */}
                                            {expandedSubtopics[sub.id] !== false && (
                                              <div className="mt-2.5 pt-2 border-t border-brand-border/10 flex flex-col">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] uppercase font-bold text-brand-muted">
                                                  Subtopic Materials ({(sub.materials || []).length})
                                                </span>
                                                
                                                {/* Subtopic Action Buttons */}
                                                <div className="flex items-center gap-1.5">
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "text" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Reading
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "video" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Video
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "image" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Image
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setAddingMaterialTo({ type: "subtopic", topicId: topic.id, subtopicId: sub.id, materialType: "file" });
                                                      setMatTitle(""); setMatContent(""); setMatFileName(""); setMatFileSize("");
                                                    }}
                                                    className="px-1.5 py-0.5 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan rounded text-[9px] transition-colors border border-brand-cyan/10"
                                                  >
                                                    + Doc
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Adding Material Form (Subtopic) */}
                                              {addingMaterialTo?.type === "subtopic" && addingMaterialTo?.subtopicId === sub.id && (
                                                <div className="bg-brand-card border border-brand-cyan/30 rounded-xl p-3.5 mb-3 flex flex-col gap-2.5 shadow-md">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                                                      New {addingMaterialTo.materialType} Material
                                                    </span>
                                                    <button
                                                      onClick={() => setAddingMaterialTo(null)}
                                                      className="text-[9px] text-brand-muted hover:text-red-400 font-semibold"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                  
                                                  <input
                                                    value={matTitle}
                                                    onChange={(e) => setMatTitle(e.target.value)}
                                                    placeholder="Material Title (e.g. CLI Tutorial, Diagram image)"
                                                    className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                  />

                                                  {addingMaterialTo.materialType === "text" && (
                                                    <div className="flex flex-col">
                                                      {renderFormattingToolbar(`mat-textarea-new-sub-${sub.id}`, false)}
                                                      <textarea
                                                        id={`mat-textarea-new-sub-${sub.id}`}
                                                        value={matContent}
                                                        onChange={(e) => setMatContent(e.target.value)}
                                                        placeholder="Write reading description..."
                                                        className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-20 resize-y"
                                                      />
                                                    </div>
                                                  )}

                                                  {addingMaterialTo.materialType === "video" && (
                                                    <input
                                                      value={matContent}
                                                      onChange={(e) => setMatContent(e.target.value)}
                                                      placeholder="Paste YouTube Video Link..."
                                                      className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                    />
                                                  )}

                                                  {(addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && (
                                                    <div className="flex items-center gap-2">
                                                      <label className="text-[10px] font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap">
                                                        <span>Choose File</span>
                                                        <input
                                                          type="file"
                                                          className="hidden"
                                                          accept={addingMaterialTo.materialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                          onChange={(e) => handleMaterialFileUpload(e, addingMaterialTo.materialType as 'image' | 'file')}
                                                        />
                                                      </label>
                                                      {matFileName ? (
                                                        <span className="text-[9px] text-brand-text truncate max-w-[140px]">
                                                          {matFileName}
                                                        </span>
                                                      ) : (
                                                        <span className="text-[9px] text-brand-muted">No file.</span>
                                                      )}
                                                    </div>
                                                  )}

                                                  <button
                                                    onClick={() => saveMaterial(selectedModule.id, topic.id, sub.id)}
                                                    disabled={
                                                      (addingMaterialTo.materialType === "text" && !matContent.trim()) ||
                                                      (addingMaterialTo.materialType === "video" && !matContent.trim()) ||
                                                      ((addingMaterialTo.materialType === "image" || addingMaterialTo.materialType === "file") && !matContent)
                                                    }
                                                    className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                                  >
                                                    Save
                                                  </button>
                                                </div>
                                              )}

                                              {/* Render Materials List (Subtopic) */}
                                              {(sub.materials || []).length === 0 ? (
                                                <span className="text-[9px] text-brand-muted/70 italic py-1">
                                                  No materials.
                                                </span>
                                              ) : (
                                                <div className="flex flex-col gap-1.5 mt-1">
                                                  {(sub.materials || []).map((mat, matIdx) => (
                                                    editingMaterialId === mat.id ? (
                                                      <div key={mat.id} className="bg-brand-card border border-brand-cyan/30 rounded-xl p-3.5 mb-3 flex flex-col gap-2.5 shadow-md">
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                                                            Edit {editingMaterialType} Material
                                                          </span>
                                                          <button
                                                            onClick={cancelEditMaterial}
                                                            className="text-[9px] text-brand-muted hover:text-red-400 font-semibold"
                                                          >
                                                            Cancel
                                                          </button>
                                                        </div>
                                                        
                                                        <input
                                                          value={editingMaterialTitle}
                                                          onChange={(e) => setEditingMaterialTitle(e.target.value)}
                                                          placeholder="Material Title"
                                                          className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                        />

                                                        {editingMaterialType === "text" && (
                                                          <div className="flex flex-col">
                                                            {renderFormattingToolbar(`mat-textarea-edit-sub-${mat.id}`, true)}
                                                            <textarea
                                                              id={`mat-textarea-edit-sub-${mat.id}`}
                                                              value={editingMaterialContent}
                                                              onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                              placeholder="Write reading description..."
                                                              className="bg-brand-bg border border-brand-border rounded-b-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50 h-20 resize-y"
                                                            />
                                                          </div>
                                                        )}

                                                        {editingMaterialType === "video" && (
                                                          <input
                                                            value={editingMaterialContent}
                                                            onChange={(e) => setEditingMaterialContent(e.target.value)}
                                                            placeholder="Paste YouTube Video Link..."
                                                            className="bg-brand-bg border border-brand-border rounded-lg p-2 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/70 placeholder-brand-muted/50"
                                                          />
                                                        )}

                                                        {(editingMaterialType === "image" || editingMaterialType === "file") && (
                                                          <div className="flex items-center gap-2">
                                                            <label className="text-[10px] font-bold text-brand-bg bg-brand-cyan hover:bg-brand-cyan-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap">
                                                              <span>Upload New File</span>
                                                              <input
                                                                type="file"
                                                                className="hidden"
                                                                accept={editingMaterialType === "image" ? "image/*" : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                                                                onChange={(e) => handleEditMaterialFileUpload(e, editingMaterialType as 'image' | 'file')}
                                                              />
                                                            </label>
                                                            {editingMaterialFileName ? (
                                                              <span className="text-[9px] text-brand-text truncate max-w-[140px]">
                                                                {editingMaterialFileName}
                                                              </span>
                                                            ) : (
                                                              <span className="text-[9px] text-brand-muted truncate max-w-[140px]">
                                                                {editingMaterialContent.startsWith("data:") ? "Existing base64" : editingMaterialContent}
                                                              </span>
                                                            )}
                                                          </div>
                                                        )}

                                                        <button
                                                          onClick={() => saveEditMaterial(selectedModule.id, topic.id, sub.id)}
                                                          disabled={
                                                            (editingMaterialType === "text" && !editingMaterialContent.trim()) ||
                                                            (editingMaterialType === "video" && !editingMaterialContent.trim()) ||
                                                            ((editingMaterialType === "image" || editingMaterialType === "file") && !editingMaterialContent)
                                                          }
                                                          className="bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                                        >
                                                          Save Changes
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div
                                                        key={mat.id}
                                                        className="flex flex-col gap-1.5 bg-brand-bg/20 border border-brand-border/20 rounded p-2 hover:border-brand-border/40"
                                                      >
                                                        <div className="flex items-center justify-between w-full">
                                                          <span className="text-[11px] font-medium text-brand-text truncate mr-3">
                                                            {mat.title} <span className="text-[9px] text-brand-muted font-normal font-mono">({mat.type})</span>
                                                          </span>

                                                          <div className="flex items-center gap-1 shrink-0">
                                                            {/* Reordering */}
                                                            <div className="flex items-center bg-brand-bg rounded p-0.5 border border-brand-border/40">
                                                              <button
                                                                disabled={matIdx === 0}
                                                                onClick={() => moveMaterial(selectedModule.id, topic.id, sub.id, matIdx, "up")}
                                                                className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                              </button>
                                                              <button
                                                                disabled={matIdx === (sub.materials || []).length - 1}
                                                                onClick={() => moveMaterial(selectedModule.id, topic.id, sub.id, matIdx, "down")}
                                                                className="p-0.5 text-brand-muted hover:text-brand-cyan disabled:opacity-10"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                              </button>
                                                            </div>

                                                            <button
                                                              onClick={() => startEditMaterial(topic.id, sub.id, mat)}
                                                              className="text-brand-muted hover:text-brand-cyan p-0.5"
                                                              title="Edit Material"
                                                            >
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                                            </button>

                                                            <button
                                                              onClick={() => deleteMaterial(selectedModule.id, topic.id, sub.id, mat.id)}
                                                              className="text-brand-muted hover:text-red-400 p-0.5"
                                                            >
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                            </button>
                                                          </div>
                                                        </div>

                                                        {/* Style / Position adjustments */}
                                                        {mat.type === "text" && (
                                                          <div className="flex items-center gap-1.5 border-t border-brand-border/10 pt-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-[8px] text-brand-muted font-bold uppercase tracking-wider">Style:</span>
                                                            {(["normal", "bold", "italic", "heading", "quote", "code"] as const).map((style) => (
                                                              <button
                                                                key={style}
                                                                onClick={() => updateMaterialTextStyle(selectedModule.id, topic.id, sub.id, mat.id, style)}
                                                                className={`px-1 py-0.5 rounded text-[8px] capitalize border transition-all ${
                                                                  (mat.textStyle || "normal") === style
                                                                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold"
                                                                    : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                                }`}
                                                              >
                                                                {style}
                                                              </button>
                                                            ))}
                                                          </div>
                                                        )}

                                                        {mat.type === "image" && (
                                                          <div className="flex items-center gap-1.5 border-t border-brand-border/10 pt-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-[8px] text-brand-muted font-bold uppercase tracking-wider">Align:</span>
                                                            {(["left", "center", "right"] as const).map((align) => (
                                                              <button
                                                                key={align}
                                                                onClick={() => updateMaterialImageAlign(selectedModule.id, topic.id, sub.id, mat.id, align)}
                                                                className={`px-1 py-0.5 rounded text-[8px] capitalize border transition-all ${
                                                                  (mat.imageAlign || "center") === align
                                                                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold"
                                                                    : "bg-brand-bg/50 border-brand-border/40 text-brand-muted hover:text-brand-text hover:border-brand-border"
                                                                }`}
                                                              >
                                                                {align}
                                                              </button>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            )}

                                          </div>
                                        ))}
                                      </div>

                                      {/* Add Subtopic Outliner Input */}
                                      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          value={subtopicTitles[topic.id] || ""}
                                          onChange={(e) =>
                                            setSubtopicTitles(prev => ({
                                              ...prev,
                                              [topic.id]: e.target.value
                                            }))
                                          }
                                          placeholder="Add new subtopic outline..."
                                          className="flex-grow bg-brand-bg/40 border border-brand-border/40 rounded-lg px-2.5 py-1.5 text-[11px] text-brand-text focus:outline-none focus:border-brand-cyan/60 placeholder-brand-muted/70"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") addSubtopic(selectedModule.id, topic.id);
                                          }}
                                        />
                                        <button
                                          onClick={() => addSubtopic(selectedModule.id, topic.id)}
                                          disabled={!(subtopicTitles[topic.id] || "").trim()}
                                          className="bg-brand-cyan/15 hover:bg-brand-cyan/25 disabled:opacity-20 text-brand-cyan text-[11px] font-semibold px-3 rounded-lg border border-brand-cyan/20 transition-colors whitespace-nowrap"
                                        >
                                          Add Subtopic
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* STUDENT PREVIEW MODE */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 items-start">
                        
                        {/* Simulated Left Navigation Tree */}
                        <div className="md:col-span-1 bg-brand-bg/60 border border-brand-border rounded-xl p-3 flex flex-col gap-2 max-h-[380px] overflow-y-auto shadow-inner">
                          <span className="text-[9px] uppercase font-bold text-brand-cyan px-2.5 mb-1.5">
                            Outline Navigation
                          </span>
                          {selectedModule.topics.length === 0 ? (
                            <div className="text-[10px] text-brand-muted/70 px-2.5 py-1 italic">
                              No topics outlined yet
                            </div>
                          ) : (
                            selectedModule.topics.map((t) => {
                              const isTopicSelected = previewTopic?.id === t.id && !previewSubtopic;
                              const hasSubtopics = t.subtopics && t.subtopics.length > 0;
                              
                              return (
                                <div key={t.id} className="flex flex-col gap-1">
                                  <button
                                    onClick={() => {
                                      setPreviewTopic(t);
                                      setPreviewSubtopic(null);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-all ${
                                      isTopicSelected
                                        ? "bg-brand-cyan text-brand-bg font-bold shadow-sm"
                                        : previewTopic?.id === t.id
                                          ? "bg-brand-cyan/10 text-brand-text font-semibold border border-brand-cyan/20"
                                          : "text-brand-muted hover:text-brand-text hover:bg-brand-bg/40"
                                    }`}
                                  >
                                    Topic: {t.title}
                                  </button>
                                  
                                  {hasSubtopics && previewTopic?.id === t.id && (
                                    <div className="pl-3 border-l border-brand-border/40 ml-3 flex flex-col gap-1 py-0.5">
                                      {t.subtopics!.map((sub) => {
                                        const isSubSelected = previewSubtopic?.id === sub.id;
                                        return (
                                          <button
                                            key={sub.id}
                                            onClick={() => {
                                              setPreviewTopic(t);
                                              setPreviewSubtopic(sub);
                                            }}
                                            className={`w-full text-left px-2 py-1 rounded text-[10px] truncate transition-colors ${
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

                        {/* Simulated Right Content Frame */}
                        <div className="md:col-span-2 bg-brand-bg/20 border border-brand-border rounded-xl p-4 min-h-[320px] flex flex-col shadow-sm">
                          {previewTopic ? (
                            <>
                              {/* Content Header */}
                              <div className="border-b border-brand-border/20 pb-2 mb-4">
                                <span className="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">
                                  {previewSubtopic ? "Subtopic Study Material" : "Topic Study Material"}
                                </span>
                                <h4 className="text-sm font-bold text-brand-text mt-0.5">
                                  {previewSubtopic ? previewSubtopic.title : previewTopic.title}
                                </h4>
                              </div>

                              {/* Material Frame Output */}
                              {((previewSubtopic ? previewSubtopic.materials : previewTopic.materials) || []).length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-brand-border/30 rounded-xl">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>
                                  <span className="text-xs font-bold">No Materials Posted</span>
                                  <span className="text-[10px] text-brand-muted mt-0.5">Switch back to Builder mode to add study sheets, images or videos.</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
                                  {((previewSubtopic ? previewSubtopic.materials : previewTopic.materials) || []).map((mat, idx) => {
                                    const embedUrl = mat.type === "video" ? getYouTubeEmbedUrl(mat.content) : null;
                                    
                                    return (
                                      <div key={mat.id} className="flex flex-col gap-2 pb-4 border-b border-brand-border/10 last:border-b-0 last:pb-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-mono text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.5 rounded">
                                            Material {idx + 1}
                                          </span>
                                          <span className="font-bold text-xs text-brand-text">
                                            {mat.title}
                                          </span>
                                        </div>

                                        {/* TEXT */}
                                        {mat.type === "text" && (
                                          <div
                                            className={`whitespace-pre-wrap text-[11px] leading-relaxed bg-brand-bg/40 p-3.5 border border-brand-border/30 rounded-xl ${
                                              mat.textStyle === "bold" ? "font-bold text-brand-text" :
                                              mat.textStyle === "italic" ? "italic text-brand-text/90" :
                                              mat.textStyle === "heading" ? "text-xs font-extrabold text-brand-cyan border-l-2 border-brand-cyan pl-2 py-0.5" :
                                              mat.textStyle === "quote" ? "border-l-4 border-brand-border/60 pl-3 italic text-brand-muted bg-brand-bg/25" :
                                              mat.textStyle === "code" ? "font-mono bg-black/40 border border-brand-border/40 px-2.5 py-1.5 rounded-lg text-green-400 text-[10px]" :
                                              "text-brand-text/90"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: mat.content }}
                                          />
                                        )}

                                        {/* VIDEO */}
                                        {mat.type === "video" && (
                                          <div className="w-full">
                                            {embedUrl ? (
                                              <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden border border-brand-border bg-brand-bg shadow-sm">
                                                <iframe
                                                  src={embedUrl}
                                                  allowFullScreen
                                                  className="absolute top-0 left-0 w-full h-full border-0"
                                                ></iframe>
                                              </div>
                                            ) : mat.content.startsWith('yt-search:') ? (
                                              <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mat.content.replace('yt-search:', ''))}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/15 via-red-500/5 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text text-xs hover:shadow-md transition-all group cursor-pointer"
                                              >
                                                <div className="p-2.5 bg-red-600 rounded-lg group-hover:bg-red-500 transition-colors shrink-0 shadow-sm">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                  <span className="font-semibold text-brand-text truncate">{mat.title}</span>
                                                  <span className="text-[9px] text-red-400/90 font-medium flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg>
                                                    Watch on YouTube
                                                  </span>
                                                </div>
                                              </a>
                                            ) : (
                                              <a
                                                href={mat.content}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/10 to-brand-bg/50 border border-red-500/30 hover:border-red-500/60 rounded-xl text-brand-text text-xs hover:shadow-md transition-all group"
                                              >
                                                <div className="p-2 bg-red-500/15 rounded-lg group-hover:bg-red-500/25 transition-colors shrink-0">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                  <span className="font-semibold text-brand-text truncate">{mat.title}</span>
                                                  <span className="text-[9px] text-red-400/80 font-medium">▶ Watch Video</span>
                                                </div>
                                              </a>
                                            )}
                                          </div>
                                        )}

                                        {/* IMAGE */}
                                        {mat.type === "image" && (
                                          <div className={`flex w-full ${
                                            mat.imageAlign === "left" ? "justify-start" :
                                            mat.imageAlign === "right" ? "justify-end" :
                                            "justify-center"
                                          }`}>
                                            {mat.content ? (
                                              <div className="border border-brand-border/30 bg-brand-bg/25 rounded-xl p-2.5 flex justify-center max-w-full">
                                                <img src={mat.content} alt={mat.title} className="max-w-full h-auto rounded max-h-[200px] object-contain" />
                                              </div>
                                            ) : (
                                              <div className="border border-dashed border-brand-border/50 bg-brand-bg/15 rounded-xl p-4 flex flex-col items-center gap-2 max-w-xs">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/60"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                <span className="text-[10px] text-brand-muted text-center">{mat.title}</span>
                                                <span className="text-[8px] text-brand-muted/50">Image not available from PDF import</span>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* FILE */}
                                        {mat.type === "file" && (
                                          <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 truncate">
                                              <div className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-lg border border-brand-cyan/15 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                              </div>
                                              <div className="truncate flex flex-col">
                                                <span className="text-xs font-semibold text-brand-text truncate">
                                                  {mat.fileName || "Download Document"}
                                                </span>
                                                <span className="text-[9px] text-brand-muted mt-0.5">
                                                  {mat.fileSize || "unknown"} • Document
                                                </span>
                                              </div>
                                            </div>
                                            <a
                                              href={mat.content}
                                              download={mat.fileName || "document"}
                                              className="px-3 py-1.5 bg-brand-cyan text-brand-bg text-[10px] font-bold rounded-lg whitespace-nowrap"
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
                            </>
                          ) : (
                            <div className="flex-grow flex items-center justify-center text-center p-6 border border-dashed border-brand-border/30 rounded-xl">
                              <span className="text-[10px] text-brand-muted">Select a topic from the selector outline.</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </>
                  )}

                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-brand-border/40 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  <h4 className="font-bold text-sm text-brand-text">No Module Selected</h4>
                  <p className="text-xs text-brand-muted mt-1 max-w-[280px]">
                    Choose a module from the left panel to structure topics, upload resources, and add subtopics.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-brand-card border border-brand-border w-full max-w-3xl max-h-[90vh] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden text-brand-text">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Auto-Generate Module from Document
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Parse PDF or DOCX documents into an organized module outline.</p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedModule(null);
                  setImportFile(null);
                  setImportError("");
                }}
                className="text-brand-muted hover:text-brand-text p-1.5 hover:bg-brand-bg rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body / Steps */}
            <div className="flex-grow overflow-y-auto pr-1">
              {/* STEP 1: Upload */}
              {!isParsing && !parsedModule && (
                <div className="flex flex-col gap-5 py-4">
                  <div className="border-2 border-dashed border-brand-border/60 hover:border-brand-cyan/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-brand-bg/10 hover:bg-brand-bg/20 transition-all relative">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImportFile(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    <div className="p-4 bg-brand-cyan/10 text-brand-cyan rounded-full mb-3 border border-brand-cyan/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h1"/></svg>
                    </div>

                    <h4 className="text-sm font-bold">Select File or Drag & Drop Here</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-sm">
                      Upload standard `.docx` or `.pdf` curriculum sheets (up to 20MB).
                    </p>
                    {importFile && (
                      <div className="mt-4 px-3 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-brand-cyan text-xs font-semibold flex items-center gap-1.5">
                        <span>Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-brand-bg/40 border border-brand-border/40 rounded-xl p-4 flex flex-col gap-2">
                    <h5 className="text-xs font-bold text-brand-cyan">How It Works:</h5>
                    <ul className="text-[11px] text-brand-muted space-y-1.5 list-disc list-inside">
                      <li><strong>Topics & Subtopics:</strong> Auto-split based on headings and markers.</li>
                      <li><strong>Readings:</strong> Long paragraphs converted to text pages.</li>
                      <li><strong>Videos:</strong> YouTube links detected and embedded as video panels.</li>
                      <li><strong>Images:</strong> DOCX embedded pictures extracted as inline image cards.</li>
                    </ul>
                  </div>

                  {importError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs font-semibold">
                      {importError}
                    </div>
                  )}

                  <button
                    onClick={handleFileImport}
                    disabled={!importFile}
                    className="w-full bg-brand-cyan hover:bg-brand-cyan-hover disabled:opacity-40 text-brand-bg font-bold py-3 rounded-lg text-sm transition-colors mt-2"
                  >
                    Start Automatic Scanning
                  </button>
                </div>
              )}

              {/* STEP 2: Parsing Loading State */}
              {isParsing && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="relative w-16 h-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-cyan"></div>
                    <div className="absolute inset-2 bg-brand-card rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan animate-pulse"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text animate-pulse">Scanning Document Structure...</h4>
                    <p className="text-xs text-brand-muted mt-1 max-w-sm">
                      Our system is analyzing text blocks, headings, extraction points, and image attachments. This may take a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview Structure */}
              {parsedModule && (
                <div className="flex flex-col gap-4 py-2">
                  <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-cyan uppercase tracking-wider">Generated Module Name:</label>
                    <input
                      value={parsedModule.title}
                      onChange={(e) => setParsedModule({ ...parsedModule, title: e.target.value })}
                      placeholder="Enter module name"
                      className="w-full bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Extracted Structure Preview:</span>
                    <span className="text-[10px] text-brand-muted">
                      {parsedModule.topics.length} topics • {parsedModule.topics.reduce((s, t) => s + (t.subtopics?.length || 0), 0)} subtopics
                    </span>
                  </div>

                  {/* Render Parsed Outline */}
                  <div className="border border-brand-border/60 rounded-xl overflow-hidden bg-brand-bg/10 max-h-[340px] overflow-y-auto flex flex-col gap-3 p-4">
                    {parsedModule.topics.length === 0 ? (
                      <div className="text-center py-6 text-xs text-brand-muted italic">
                        No headings or topics could be parsed from the file content. An empty module structure will be generated.
                      </div>
                    ) : (
                      parsedModule.topics.map((topic, tIdx) => (
                        <div key={topic.id} className="border border-brand-border/30 rounded-lg p-3 bg-brand-card/30 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded">
                              Topic {tIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-brand-text">{topic.title}</span>
                          </div>

                          {/* Render materials preview inside topic */}
                          {(topic.materials || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              {(topic.materials || []).map((m) => (
                                <span key={m.id} className="text-[9px] bg-brand-bg border border-brand-border/50 text-brand-muted px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                  {m.type === 'text' && '📄 Reading'}
                                  {m.type === 'video' && '🎥 Video link'}
                                  {m.type === 'image' && '🖼️ Image'}
                                  <span>{m.title}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Subtopics outline preview */}
                          {(topic.subtopics || []).length > 0 && (
                            <div className="pl-4 flex flex-col gap-2 mt-1 border-l border-brand-border/30 ml-2">
                              {(topic.subtopics || []).map((sub, sIdx) => (
                                <div key={sub.id} className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-brand-muted font-bold">•</span>
                                    <span className="text-[11px] font-semibold text-brand-text/90">{sub.title}</span>
                                  </div>
                                  {(sub.materials || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-3">
                                      {(sub.materials || []).map((sm) => (
                                        <span key={sm.id} className="text-[8px] bg-brand-bg/60 border border-brand-border/40 text-brand-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                                          {sm.type === 'text' && '📄 Reading'}
                                          {sm.type === 'video' && '🎥 Video link'}
                                          {sm.type === 'image' && '🖼️ Image'}
                                          <span>{sm.title}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setParsedModule(null);
                        setImportFile(null);
                      }}
                      className="flex-grow bg-brand-bg hover:bg-brand-bg/75 border border-brand-border text-brand-text font-bold py-2.5 rounded-lg text-xs transition-colors"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={confirmImportModule}
                      className="flex-grow bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded-lg text-xs transition-colors"
                    >
                      Import into Class Curriculum
                    </button>
                  </div>
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
