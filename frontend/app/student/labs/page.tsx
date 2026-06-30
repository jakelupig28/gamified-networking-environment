"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

interface Lab {
  id: string;
  title: string;
  description: string;
  moduleId: number;
  competency: string;
  templateFile: string;
  difficulty: string;
  submitted: boolean;
  submissionDetails?: {
    score: number;
    status: string;
    logs: string[];
    feedback: string;
    fileName: string;
    fileUrl: string;
    submittedAt: string;
  };
}

export default function StudentPTLabs() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingLabId, setUploadingLabId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; type: "success" | "error" | null }>({
    title: "",
    message: "",
    type: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLabs = async () => {
    try {
      const email = localStorage.getItem("userEmail") || "";
      const res = await fetch(`/api/labs?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setLabs(data.labs || []);
      }
    } catch (e) {
      console.error("Error loading PT labs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchLabs();
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pka' && ext !== 'pkt') {
        showAlert("Invalid File Format", "Auto-grader only accepts Cisco Packet Tracer files (.pka or .pkt).", "error");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, labId: string) => {
    e.preventDefault();
    setUploadingLabId(labId);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pka' && ext !== 'pkt') {
        showAlert("Invalid File Format", "Auto-grader only accepts Cisco Packet Tracer files (.pka or .pkt).", "error");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (labId: string) => {
    if (!selectedFile) {
      showAlert("No File Selected", "Please select or drop a valid .pka or .pkt file before submitting.", "error");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const formData = new FormData();
    formData.append("email", email);
    formData.append("labId", labId);
    formData.append("labFile", selectedFile);

    setIsLoading(true);
    try {
      const res = await fetch("/api/labs/submit", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        showAlert(
          "Auto-Grading Complete",
          `Successfully processed! Auto-grader Score: ${data.submission.score}/100.`,
          "success"
        );
        setSelectedFile(null);
        setUploadingLabId(null);
        fetchLabs();
      } else {
        showAlert("Submission Failed", data.message || "Failed to parse lab submission.", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Submission Error", "Failed to connect to grading hook.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (title: string, message: string, type: "success" | "error") => {
    setAlertInfo({ title, message, type });
  };

  const closeAlert = () => {
    setAlertInfo({ title: "", message: "", type: null });
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/student/labs" />
      <main className="p-8 flex-grow w-full max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan mb-2">Applied Configuration Section</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Packet Tracer Configuration Labs</h1>
          <p className="text-brand-muted text-sm mt-1">
            Download topology blueprints, configure routers and switches in Cisco Packet Tracer, and upload your `.pka`/`.pkt` binaries for instant auto-grading.
          </p>
        </header>

        {isLoading && labs.length === 0 ? (
          <div className="flex-grow flex items-center justify-center min-h-[300px]">
            <span className="text-sm font-semibold text-brand-cyan animate-pulse">Retrieving assigned labs...</span>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {labs.map((lab) => {
              const details = lab.submissionDetails;
              const isUploading = uploadingLabId === lab.id;

              return (
                <div key={lab.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-md flex flex-col gap-6">
                  {/* Row 1: Header & Tags */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-brand-border/40 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
                          {lab.difficulty}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                          {lab.competency}
                        </span>
                      </div>
                      <h3 className="text-md font-bold text-brand-text">{lab.title}</h3>
                      <p className="text-xs text-brand-muted leading-relaxed max-w-2xl">{lab.description}</p>
                    </div>

                    {/* Download Template Action */}
                    <a
                      href={`/labs/${lab.id}-template.pka`}
                      onClick={(e) => {
                        // Mock download handling by creating a dynamic dummy file download
                        e.preventDefault();
                        const blob = new Blob([`Mock Packet Tracer template for ${lab.title}`], { type: "application/octet-stream" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = lab.templateFile.split("/").pop() || `${lab.id}-template.pka`;
                        link.click();
                      }}
                      className="shrink-0 bg-brand-bg hover:bg-brand-card border border-brand-border hover:border-brand-border-hover text-brand-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 self-start sm:self-center"
                    >
                      📁 Download Template
                    </a>
                  </div>

                  {/* Row 2: Submissions Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {/* Left: Auto-grader Feedback logs if submitted */}
                    {lab.submitted && details ? (
                      <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-brand-border/30 pb-2">
                          <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">Verification Feedback</span>
                          <span className="text-xs font-mono font-bold text-brand-text">Score: <span className="text-brand-cyan text-sm font-black">{details.score}/100</span></span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed text-brand-text">{details.feedback}</p>
                        <div className="text-[10px] text-brand-muted">Submitted at: {new Date(details.submittedAt).toLocaleString()}</div>

                        <div className="pt-2">
                          <button
                            onClick={() => setExpandedLogsId(expandedLogsId === lab.id ? null : lab.id)}
                            className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:underline"
                          >
                            {expandedLogsId === lab.id ? "Hide Grader Logs" : "Show Grader Logs"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-brand-bg/20 border border-dashed border-brand-border/60 rounded-xl p-6 flex flex-col justify-center items-center text-center text-xs text-brand-muted select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-60"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        No submissions recorded yet. Complete the configuration hops in Packet Tracer and upload your file.
                      </div>
                    )}

                    {/* Right: Upload Interface (Drag-Drop Dropzone) */}
                    <div className="flex flex-col gap-3 justify-center">
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, lab.id)}
                        className={`bg-brand-bg/30 hover:bg-brand-bg/60 border-2 border-dashed border-brand-border rounded-xl p-5 flex flex-col justify-center items-center text-center text-xs transition-colors relative cursor-pointer group min-h-36 ${
                          isUploading ? "border-brand-cyan/60 bg-brand-cyan/5" : ""
                        }`}
                        onClick={() => {
                          setUploadingLabId(lab.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pka,.pkt"
                          className="hidden"
                        />
                        <span className="font-bold text-brand-text mb-1 group-hover:text-brand-cyan transition-colors">
                          {selectedFile && uploadingLabId === lab.id ? selectedFile.name : "Select Completed Lab File"}
                        </span>
                        <span className="text-[10px] text-brand-muted">
                          {selectedFile && uploadingLabId === lab.id
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "Click or drag/drop completed .pka/.pkt file here"}
                        </span>
                      </div>

                      {uploadingLabId === lab.id && selectedFile && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUploadSubmit(lab.id)}
                            className="flex-grow bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-black py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all text-center"
                          >
                            🚀 Upload & Auto-Grade
                          </button>
                          <button
                            onClick={() => { setSelectedFile(null); setUploadingLabId(null); }}
                            className="bg-brand-card hover:bg-brand-border border border-brand-border text-brand-muted hover:text-brand-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {lab.submitted && !selectedFile && (
                        <button
                          onClick={() => { setUploadingLabId(lab.id); fileInputRef.current?.click(); }}
                          className="w-full bg-brand-bg hover:bg-brand-card border border-brand-border hover:border-brand-border-hover text-brand-text py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer text-center"
                        >
                          Re-submit Solution
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Logs Panel */}
                  {expandedLogsId === lab.id && details && (
                    <div className="border-t border-brand-border/40 pt-4 animate-all duration-300">
                      <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider block mb-2.5">Auto-Grader Execution Logs</span>
                      <pre className="bg-brand-bg/80 border border-brand-border/50 rounded-xl p-4 font-mono text-[10px] text-brand-text/90 leading-relaxed overflow-x-auto max-h-56 select-all">
                        {details.logs.join("\n")}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Alert Overlay */}
      {alertInfo.type && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl animate-scaleIn">
            <h3 className={`text-lg font-black ${alertInfo.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
              {alertInfo.title}
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed px-2">{alertInfo.message}</p>
            <button
              onClick={closeAlert}
              className="mt-2 w-full bg-brand-bg hover:bg-brand-border border border-brand-border text-brand-text text-xs font-bold py-2.5 rounded-xl cursor-pointer uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
