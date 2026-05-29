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

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        // Assume default status of new students is 'pending' unless set
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

  const handleAction = async (id: string, action: "admitted" | "rejected") => {
    try {
      const res = await fetch("/api/users/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: action,
          rejectMessage: action === "rejected" ? rejectReason : ""
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Student ${action} successfully`);
        if (action === 'admitted') setShowAdmitModal(false);
        setSelectedStudent(null);
        setRejectReason("");
        fetchStudents();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Action failed");
      }
    } catch (e) {
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/students" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text mb-2 flex items-center gap-2">
              <span>Professor</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="m9 18 6-6-6-6"/></svg>
              <span>Students</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">Student Validation</h1>
            <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
              Review and validate pending student enrollments to your curriculum. Admit verified students or reject with a reason.
            </p>
          </div>
        </header>

        {message && (
          <div className={`mb-6 text-sm p-4 rounded bg-brand-card border border-brand-border ${message.includes("success") ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </div>
        )}

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
                        className="w-full h-24 bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-red-400 transition-colors resize-none"
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
                    className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded transition-colors text-sm"
                  >
                    Admit Student
                  </button>
                  <button 
                    onClick={() => handleAction(selectedStudent.id, "rejected")}
                    className="flex-1 bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-bold py-2.5 rounded transition-colors text-sm"
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

        {/* Admit Modal */}
        {showAdmitModal && selectedStudent && (
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-2">Admit Student</h2>
              <p className="text-xs text-brand-muted mb-6">Assign <span className="text-brand-cyan">{selectedStudent.name || selectedStudent.email}</span> to a structured curriculum and academic term.</p>
              
              <div className="space-y-4 mb-8">
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
                  className="flex-1 bg-transparent border border-brand-muted text-brand-text hover:bg-brand-border font-bold py-2.5 rounded transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAction(selectedStudent.id, "admitted")}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Confirm Admission
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}