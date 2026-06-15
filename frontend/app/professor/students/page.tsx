"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function ProfessorStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitSubject, setAdmitSubject] = useState("Networking 1");
  const [admitTerm, setAdmitTerm] = useState("1st Semester AY 2026 - 2027");

  // Validation Mode
  const [validationMode, setValidationMode] = useState<"manual" | "automatic">("manual");

  // File upload and parsing states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsedDataText, setParsedDataText] = useState("");

  // Match details computed from the parsed data
  const [matchResults, setMatchResults] = useState<any[]>([]);

  // Batch action states
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [showBatchAdmitModal, setShowBatchAdmitModal] = useState(false);

  // Helper to load CDN scripts dynamically
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  };

  // Parse Excel file
  const parseExcelFile = async (file: File): Promise<string> => {
    setParseProgress("Loading spreadsheet engine...");
    await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
    setParseProgress("Parsing Excel sheets...");
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          // @ts-ignore
          const workbook = (window as any).XLSX.read(data, { type: 'array' });
          let text = "";
          workbook.SheetNames.forEach((sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            // @ts-ignore
            text += (window as any).XLSX.utils.sheet_to_txt(sheet) + "\n";
          });
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse PDF file
  const parsePdfFile = async (file: File): Promise<string> => {
    setParseProgress("Loading PDF engine...");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js");
    // @ts-ignore
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    setParseProgress("Parsing PDF text...");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            setParseProgress(`Parsing PDF page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse Image file via OCR
  const parseImageFile = async (file: File): Promise<string> => {
    setParseProgress("Loading OCR image engine (Tesseract)...");
    await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js");
    setParseProgress("Reading characters from image...");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          // @ts-ignore
          const result = await (window as any).Tesseract.recognize(dataUrl, 'eng', {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                setParseProgress(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          resolve(result.data.text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsParsing(true);
    setParseProgress("Preparing file...");
    setParseError("");
    setParsedDataText("");
    setMatchResults([]);

    try {
      let extractedText = "";
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        extractedText = await parseExcelFile(file);
      } else if (ext === 'pdf') {
        extractedText = await parsePdfFile(file);
      } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
        extractedText = await parseImageFile(file);
      } else {
        throw new Error("Unsupported file type. Please upload Excel, PDF, or JPG/PNG files.");
      }

      setParsedDataText(extractedText);
      runMatchingEngine(extractedText);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "An error occurred while parsing the file.");
      setIsParsing(false);
    }
  };

  const runMatchingEngine = (docText: string) => {
    setParseProgress("Running student matching engine...");
    
    // Normalize raw text to alphanumeric lowercase for robust search
    const normalizedText = docText.replace(/[^a-zA-Z0-9\s]/g, " ").toLowerCase();
    
    const pendingStudents = students.filter(s => s.status === 'pending' || !s.status);
    
    const results = pendingStudents.map(student => {
      // 1. Check ID Match
      let idMatched = false;
      let matchedByIdStr = "";
      if (student.studentId) {
        const cleanId = student.studentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (cleanId && cleanId.length >= 4) {
          const cleanDocText = normalizedText.replace(/\s+/g, "");
          if (cleanDocText.includes(cleanId)) {
            idMatched = true;
            matchedByIdStr = student.studentId;
          }
        }
      }

      // 2. Check Name Match
      let nameMatched = false;
      let matchScore = 0;
      if (student.name) {
        const nameParts = student.name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((part: string) => part.length > 2);

        if (nameParts.length > 0) {
          const matchedParts = nameParts.filter((part: string) => normalizedText.includes(part));
          matchScore = matchedParts.length / nameParts.length;
          if (matchedParts.length === nameParts.length || (nameParts.length > 1 && matchedParts.length >= 2)) {
            nameMatched = true;
          }
        }
      }

      const isVerified = idMatched || nameMatched;
      const matchReason = idMatched 
        ? `Matched student ID: ${matchedByIdStr}` 
        : nameMatched 
          ? `Matched student name: "${student.name}"` 
          : "No match found in masterlist";

      return {
        student,
        isVerified,
        matchReason,
        matchScore
      };
    });

    results.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return b.matchScore - a.matchScore;
    });

    setMatchResults(results);
    
    // Automatically select verified students for batch selection
    const verifiedIds = results.filter(r => r.isVerified).map(r => r.student.id);
    setSelectedForBatch(verifiedIds);
    setIsParsing(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        const s = data.users.filter((u: any) => u.role === "Student");
        setStudents(s);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (parsedDataText) {
      runMatchingEngine(parsedDataText);
    }
  }, [students]);

  const handleAction = async (id: string, action: "admitted" | "rejected") => {
    try {
      const res = await fetch("/api/users/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: action,
          rejectMessage: action === "rejected" ? rejectReason : "",
          subject: action === "admitted" ? admitSubject : undefined,
          term: action === "admitted" ? admitTerm : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Student ${action} successfully`);
        if (action === 'admitted') setShowAdmitModal(false);
        setSelectedStudent(null);
        setRejectReason("");
        fetchStudents();
        window.dispatchEvent(new Event("studentsUpdated"));
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Action failed");
      }
    } catch (e) {
      setMessage("Server error");
    }
  };

  const handleBatchAdmit = async () => {
    if (selectedForBatch.length === 0) return;
    setIsSubmittingBatch(true);
    try {
      const res = await fetch("/api/users/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedForBatch,
          status: "admitted",
          subject: admitSubject,
          term: admitTerm
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${selectedForBatch.length} students admitted successfully`);
        setShowBatchAdmitModal(false);
        setSelectedForBatch([]);
        setUploadFile(null);
        setParsedDataText("");
        setMatchResults([]);
        fetchStudents();
        window.dispatchEvent(new Event("studentsUpdated"));
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Batch action failed");
      }
    } catch (e) {
      setMessage("Server error admitting students");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/students" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text mb-2 flex items-center gap-2">
              <span>Professor</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="m9 18 6-6-6-6"/></svg>
              <span>Students</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">Student Validation</h1>
            <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
              Review and validate pending student enrollments. Admit verified students automatically using a masterlist or process them manually.
            </p>
          </div>
        </header>

        {message && (
          <div className={`mb-6 text-sm p-4 rounded bg-brand-card border border-brand-border ${message.includes("success") ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </div>
        )}

        {/* Validation Mode Selector */}
        <div className="flex bg-brand-card border border-brand-border rounded-xl p-1 mb-8 max-w-md">
          <button
            onClick={() => setValidationMode("manual")}
            className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              validationMode === "manual"
                ? "bg-brand-cyan text-brand-bg shadow"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            Manual Validation
          </button>
          <button
            onClick={() => setValidationMode("automatic")}
            className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              validationMode === "automatic"
                ? "bg-brand-cyan text-brand-bg shadow"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            Automatic (Masterlist Upload)
          </button>
        </div>

        {validationMode === "manual" ? (
          <div className="flex gap-6">
            {/* List */}
            <div className="w-1/2 bg-brand-card border border-brand-border rounded-xl shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-brand-border font-bold">Enrolled Students</div>
              <div className="overflow-y-auto max-h-[600px] flex-grow">
                {isLoading ? (
                  <div className="p-8 text-center text-brand-muted text-sm">Loading...</div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center text-brand-muted text-sm">No students found.</div>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {students.map((s, i) => (
                      <li 
                        key={i} 
                        onClick={() => setSelectedStudent(s)}
                        className={`p-4 cursor-pointer hover:bg-brand-bg transition-colors flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-brand-bg/60 border-l-4 border-l-brand-cyan' : ''}`}
                      >
                        <div>
                          <div className="font-medium text-brand-text">{s.name || s.email}</div>
                          <div className="text-xs text-brand-muted mt-1">{s.email}</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          s.status === 'admitted' ? 'bg-green-500/10 text-green-500' : 
                          s.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {s.status || "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="w-1/2">
              {selectedStudent ? (
                <div className="bg-brand-card border border-brand-border rounded-xl shadow-md p-8">
                  <h2 className="text-xl font-bold mb-6 pb-4 border-b border-brand-border/50">Student Profile</h2>
                  
                  <div className="space-y-6 mb-8">
                    {/* Identity */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-3 border-b border-brand-border/50 pb-2">Personal Identity</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Full Name</div>
                          <div className="text-sm font-medium">{selectedStudent.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Gender & Age</div>
                          <div className="text-sm font-medium">{selectedStudent.gender || "Unspecified"} • {selectedStudent.age || "N/A"} yrs old</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Complete Address</div>
                          <div className="text-sm font-medium">{selectedStudent.address || "No address provided"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Profile */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-3 border-b border-brand-border/50 pb-2">Academic Profile</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Student ID No.</div>
                          <div className="text-sm font-medium font-mono">{selectedStudent.studentId || "STU-XXXX-XXXX"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Institutional Email</div>
                          <div className="text-sm font-medium text-brand-cyan">{selectedStudent.email}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Course / Program</div>
                          <div className="text-sm font-medium">{selectedStudent.course || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Year & Section</div>
                          <div className="text-sm font-medium">{selectedStudent.yearLevel || "N/A"} • {selectedStudent.section || "N/A"}</div>
                        </div>
                      </div>
                    </div>

                    {(selectedStudent.status === 'pending' || !selectedStudent.status) && (
                      <div className="pt-4 mt-4 border-t border-brand-border/40">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Rejection Reason (if rejecting)</div>
                        <textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="State reason here before rejecting..."
                          className="w-full h-24 bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-red-400 transition-colors resize-none text-brand-text"
                        />
                      </div>
                    )}
                    {selectedStudent.status === 'rejected' && selectedStudent.rejectMessage && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-sm text-red-400 mt-4">
                        <div className="font-bold mb-1 text-xs uppercase tracking-wider">Rejection Reason:</div>
                        {selectedStudent.rejectMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-brand-border/40">
                    <button 
                      onClick={() => setShowAdmitModal(true)}
                      className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded transition-colors text-sm cursor-pointer"
                    >
                      Admit Student
                    </button>
                    <button 
                      onClick={() => handleAction(selectedStudent.id, "rejected")}
                      className="flex-1 bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-bold py-2.5 rounded transition-colors text-sm cursor-pointer"
                    >
                      Reject Student
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-card border border-brand-border rounded-xl shadow-md p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] text-brand-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <div className="text-sm font-medium">Select a student from the list to view details and validate.</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Automatic Validation mode (File upload & Cross-referencing) */
          <div className="flex gap-6 animate-fadeIn">
            {/* Left side: Upload Panel & Raw Data preview */}
            <div className="w-1/2 flex flex-col gap-6">
              <div className="bg-brand-card border border-brand-border rounded-xl shadow-md p-6">
                <h3 className="text-md font-bold mb-4">Upload Masterlist</h3>
                <p className="text-xs text-brand-muted mb-6 leading-relaxed">
                  Upload your enrolled student roster in Excel, PDF, or JPG/PNG formats. The system will extract names and student ID numbers to cross-match them.
                </p>

                {/* Upload zone */}
                <div className="border-2 border-dashed border-brand-border hover:border-brand-cyan rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all relative min-h-[180px] bg-brand-bg/40">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isParsing}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <div className="text-xs font-bold text-brand-text mb-1">
                    {uploadFile ? uploadFile.name : "Click or drag your roster file here"}
                  </div>
                  <div className="text-[10px] text-brand-muted mt-1">
                    Supports Excel (.xlsx, .xls), PDF (.pdf), or Image (.jpg, .jpeg, .png)
                  </div>
                </div>

                {uploadFile && !isParsing && (
                  <div className="mt-4 flex items-center justify-between p-3 rounded bg-brand-bg/60 border border-brand-border">
                    <div className="flex items-center gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <div className="text-xs text-left">
                        <div className="font-semibold text-brand-text truncate max-w-[180px]">{uploadFile.name}</div>
                        <div className="text-[10px] text-brand-muted mt-0.5">{(uploadFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setParsedDataText("");
                        setMatchResults([]);
                        setParseError("");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>
                )}

                {parseError && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded text-xs text-red-400 text-left">
                    <span className="font-bold">Error:</span> {parseError}
                  </div>
                )}
              </div>

              {parsedDataText && (
                <div className="bg-brand-card border border-brand-border rounded-xl shadow-md p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-brand-border/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Extracted Masterlist Raw Text</h3>
                    <span className="text-[10px] text-brand-muted font-mono">{parsedDataText.length} characters read</span>
                  </div>
                  <div className="bg-brand-bg border border-brand-border rounded-lg p-4 font-mono text-[11px] overflow-y-auto max-h-[300px] leading-relaxed text-brand-muted whitespace-pre-wrap flex-grow text-left select-all">
                    {parsedDataText}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Verification results & Batch action */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-brand-card border border-brand-border rounded-xl shadow-md overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="p-4 border-b border-brand-border font-bold flex justify-between items-center bg-brand-card text-left">
                  <span>Roster Match Results</span>
                  {matchResults.length > 0 && (
                    <span className="text-xs bg-brand-bg px-2 py-1 rounded border border-brand-border text-brand-muted">
                      Pending: {students.filter(s => s.status === 'pending' || !s.status).length} • Matches: {matchResults.filter(r => r.isVerified).length}
                    </span>
                  )}
                </div>

                <div className="flex-grow overflow-y-auto max-h-[500px]">
                  {isParsing ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
                      <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4" />
                      <div className="text-sm font-semibold text-brand-text">{parseProgress}</div>
                      <div className="text-xs text-brand-muted mt-2">Do not close this page or navigate away</div>
                    </div>
                  ) : matchResults.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center h-full min-h-[350px] text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                      <div className="text-sm font-medium">No masterlist uploaded yet.</div>
                      <p className="text-xs text-brand-muted max-w-xs mt-2 leading-relaxed">
                        Upload an Excel file, PDF, or scan in JPG format on the left. The engine will instantly map pending student profiles.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-border">
                      {/* Checkbox controller */}
                      <div className="p-4 bg-brand-bg/40 flex justify-between items-center text-xs text-brand-muted border-b border-brand-border">
                        <label className="flex items-center gap-2 font-medium cursor-pointer text-brand-text">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-brand-cyan border-brand-border cursor-pointer bg-brand-bg"
                            checked={selectedForBatch.length === matchResults.filter(r => r.isVerified).length && selectedForBatch.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForBatch(matchResults.filter(r => r.isVerified).map(r => r.student.id));
                              } else {
                                setSelectedForBatch([]);
                              }
                            }}
                          />
                          Select All Auto-Verified ({matchResults.filter(r => r.isVerified).length})
                        </label>
                        <span>{selectedForBatch.length} selected for batch approval</span>
                      </div>

                      {matchResults.map((res, i) => (
                        <div
                          key={i}
                          className={`p-4 flex gap-3 transition-colors text-left ${
                            res.isVerified ? "bg-green-500/[0.02]" : "bg-red-500/[0.01]"
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-brand-cyan border-brand-border cursor-pointer bg-brand-bg"
                              disabled={!res.isVerified}
                              checked={selectedForBatch.includes(res.student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForBatch([...selectedForBatch, res.student.id]);
                                } else {
                                  setSelectedForBatch(selectedForBatch.filter(id => id !== res.student.id));
                                }
                              }}
                            />
                          </div>

                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold text-sm text-brand-text">{res.student.name || res.student.email}</div>
                                <div className="text-[11px] text-brand-muted font-mono mt-0.5">
                                  ID: {res.student.studentId || "STU-XXXX-XXXX"} • {res.student.email}
                                </div>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                                res.isVerified 
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {res.isVerified ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Auto-Verified
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    Not Found
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="mt-2 text-xs flex items-center gap-1.5 text-brand-muted">
                              <span className="font-medium text-[10px] uppercase tracking-wider text-brand-muted/70">Matching Reason:</span>
                              <span className={res.isVerified ? "text-green-400/90 font-medium" : "text-brand-muted/80"}>
                                {res.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {matchResults.length > 0 && !isParsing && (
                  <div className="p-4 border-t border-brand-border bg-brand-card flex items-center gap-4">
                    <button
                      onClick={() => setShowBatchAdmitModal(true)}
                      disabled={selectedForBatch.length === 0 || isSubmittingBatch}
                      className="w-full bg-brand-cyan hover:bg-brand-cyan-hover disabled:bg-brand-muted/20 disabled:text-brand-muted/60 disabled:cursor-not-allowed text-brand-bg font-bold py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingBatch ? (
                        <>
                          <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                          Batch processing admission...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                          Batch Admit Selected ({selectedForBatch.length} students)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admit Modal */}
        {showAdmitModal && selectedStudent && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-2 text-left">Admit Student</h2>
              <p className="text-xs text-brand-muted mb-6 text-left">Assign <span className="text-brand-cyan">{selectedStudent.name || selectedStudent.email}</span> to a structured curriculum and academic term.</p>
              
              <div className="space-y-4 mb-8 text-left">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Subject Assignment</label>
                  <div className="relative">
                    <select 
                      value={admitSubject} 
                      onChange={(e) => setAdmitSubject(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="Networking 1">Networking 1</option>
                      <option value="Networking 2">Networking 2</option>
                      <option value="Cybersecurity Basics">Cybersecurity Basics</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Academic Term</label>
                  <div className="relative">
                    <select 
                      value={admitTerm} 
                      onChange={(e) => setAdmitTerm(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="1st Semester AY 2026 - 2027">1st Semester AY 2026 - 2027</option>
                      <option value="2nd Semester AY 2026 - 2027">2nd Semester AY 2026 - 2027</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAdmitModal(false)}
                  className="flex-1 bg-transparent border border-brand-muted text-brand-text hover:bg-brand-border font-bold py-2.5 rounded transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAction(selectedStudent.id, "admitted")}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Confirm Admission
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Admit Modal */}
        {showBatchAdmitModal && selectedForBatch.length > 0 && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-2 text-left">Batch Admit Students</h2>
              <p className="text-xs text-brand-muted mb-6 text-left">Assign the <span className="text-brand-cyan">{selectedForBatch.length} selected students</span> to a structured curriculum and academic term.</p>
              
              <div className="space-y-4 mb-8 text-left">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Subject Assignment</label>
                  <div className="relative">
                    <select 
                      value={admitSubject} 
                      onChange={(e) => setAdmitSubject(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="Networking 1">Networking 1</option>
                      <option value="Networking 2">Networking 2</option>
                      <option value="Cybersecurity Basics">Cybersecurity Basics</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Academic Term</label>
                  <div className="relative">
                    <select 
                      value={admitTerm} 
                      onChange={(e) => setAdmitTerm(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="1st Semester AY 2026 - 2027">1st Semester AY 2026 - 2027</option>
                      <option value="2nd Semester AY 2026 - 2027">2nd Semester AY 2026 - 2027</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowBatchAdmitModal(false)}
                  className="flex-1 bg-transparent border border-brand-muted text-brand-text hover:bg-brand-border font-bold py-2.5 rounded transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBatchAdmit}
                  disabled={isSubmittingBatch}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-brand-muted/20 disabled:text-brand-muted/60"
                >
                  {isSubmittingBatch ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                      Admitting...
                    </>
                  ) : (
                    <>
                      Confirm Admission
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}