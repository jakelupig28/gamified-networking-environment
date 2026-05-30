"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type Module = {
  id: number;
  title: string;
  topics: { id: number; title: string; subtopics?: { id: number; title: string; file?: string }[]; file?: string }[];
};

export default function ProfessorModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [title, setTitle] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [subtopicTitle, setSubtopicTitle] = useState("");
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);

  const createModule = () => {
    const newModule: Module = { id: Date.now(), title, topics: [] };
    setModules((m) => [newModule, ...m]);
    setTitle("");
  };

  const addTopic = (moduleId: number) => {
    if (!topicTitle) return;
    setModules((m) => m.map(mod => mod.id === moduleId ? { ...mod, topics: [...mod.topics, { id: Date.now(), title: topicTitle }] } : mod));
    setTopicTitle("");
  };

  const addSubtopic = (moduleId: number, topicId: number) => {
    if (!subtopicTitle) return;
    setModules((m) => m.map(mod => mod.id === moduleId ? { ...mod, topics: mod.topics.map(t => t.id === topicId ? { ...t, subtopics: [...(t.subtopics||[]), { id: Date.now(), title: subtopicTitle }] } : t) } : mod));
    setSubtopicTitle("");
  };

  const uploadFileForTopic = (moduleId: number, topicId: number, file?: string) => {
    setModules((m) => m.map(mod => mod.id === moduleId ? { ...mod, topics: mod.topics.map(t => t.id === topicId ? { ...t, file } : t) } : mod));
  };

  const uploadFileForSubtopic = (moduleId: number, topicId: number, subtopicId: number, file?: string) => {
    setModules((m) => m.map(mod => mod.id === moduleId ? { ...mod, topics: mod.topics.map(t => t.id === topicId ? { ...t, subtopics: t.subtopics?.map(s => s.id === subtopicId ? { ...s, file } : s) } : t) } : mod));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, callback: (fileUrl?: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    callback(fileUrl);
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/modules" />
      <main className="p-8 flex-grow w-full max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Modules</h1>
          <p className="text-brand-muted text-sm">Create and manage course modules, topics, and upload files for students.</p>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-brand-card border border-brand-border rounded-xl p-6">
            <h3 className="font-bold mb-4">Create Module</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm mb-3" />
            <button onClick={createModule} className="bg-brand-cyan px-4 py-2 rounded text-brand-bg">Add Module</button>

            <div className="mt-6">
              {modules.map(mod => (
                <div key={mod.id} className={`p-2 rounded ${currentModuleId === mod.id ? 'bg-brand-cyan text-brand-bg' : 'bg-brand-card' } mb-2 cursor-pointer`} onClick={() => setCurrentModuleId(mod.id)}>
                  {mod.title}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-brand-card border border-brand-border rounded-xl p-6">
            {currentModuleId ? (
              <div>
                <h3 className="font-bold mb-4">Manage Module</h3>
                {modules.filter(m => m.id === currentModuleId).map(mod => (
                  <div key={mod.id}>
                    <div className="mb-4">
                      <input value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} placeholder="Topic title" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm mb-2" />
                      <button onClick={() => addTopic(mod.id)} className="bg-brand-cyan px-3 py-1 rounded text-brand-bg mr-3">Add Topic</button>
                    </div>

                    <div>
                      {mod.topics.map(topic => (
                        <div key={topic.id} className="mb-4 border-b border-brand-border/20 pb-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold">{topic.title}</div>
                            <div className="flex items-center gap-2">
                              <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileInput(e, (url) => uploadFileForTopic(mod.id, topic.id, url))} />
                            </div>
                          </div>

                          <div className="pl-4">
                            <input value={subtopicTitle} onChange={(e) => setSubtopicTitle(e.target.value)} placeholder="Subtopic title" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm mb-2" />
                            <button onClick={() => addSubtopic(mod.id, topic.id)} className="bg-brand-cyan px-3 py-1 rounded text-brand-bg mr-3">Add Subtopic</button>

                            <div className="mt-3">
                              {(topic.subtopics || []).map(sub => (
                                <div key={sub.id} className="flex items-center justify-between bg-brand-bg p-2 rounded mb-2">
                                  <div>{sub.title}</div>
                                  <div>
                                    <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileInput(e, (url) => uploadFileForSubtopic(mod.id, topic.id, sub.id, url))} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3">
                              {topic.file && (
                                <a href={topic.file} target="_blank" rel="noreferrer" className="text-brand-cyan underline">View Topic File</a>
                              )}
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-brand-muted">Select a module to manage its topics and files.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
