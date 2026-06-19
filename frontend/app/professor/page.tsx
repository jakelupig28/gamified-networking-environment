"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ProfessorDashboard() {
  const router = useRouter();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [userName, setUserName] = useState("Dr. A. Chen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [modules, setModules] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success && usersData.users) {
          const admitted = usersData.users.filter(
            (u: any) => u.role === "Student" && u.status === "admitted"
          );
          const pending = usersData.users.filter(
            (u: any) => u.role === "Student" && (u.status === "pending" || !u.status)
          );
          setActiveStudentsCount(admitted.length);
          setPendingCount(pending.length);
          setPendingStudents(pending);
        }

        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();
        if (modulesData.success && modulesData.modules) {
          setModules(modulesData.modules);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const isFirst = localStorage.getItem("professorFirstLogin") === "true";
    const pendingEmail = localStorage.getItem("pendingChangePasswordEmail");
    if (isFirst && pendingEmail) {
      setIsFirstLogin(true);
      setEmail(pendingEmail);
    }
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
    }

    const savedPic = localStorage.getItem("profilePic");
    if (savedPic) setProfilePic(savedPic);

    const handlePicUpdate = () => {
      const pic = localStorage.getItem("profilePic");
      setProfilePic(pic);
    };
    window.addEventListener("profilePicUpdated", handlePicUpdate);
    return () => window.removeEventListener("profilePicUpdated", handlePicUpdate);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("pendingChangePasswordEmail");
        localStorage.removeItem("professorFirstLogin");
        alert("Password changed successfully. Please login again.");
        router.push("/login");
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  if (isFirstLogin) {
    return (
      <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
        <Sidebar activePath="/professor/dashboard" />
        <main className="flex-grow flex items-center justify-center p-8 w-full">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-lg p-8 shadow-2xl">
            <h1 className="text-2xl font-bold mb-2">Change Password Required</h1>
            <p className="text-brand-muted text-sm mb-6">For security reasons, you must change your password on your first login.</p>
            
            {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 p-3 rounded">{error}</div>}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-brand-bg border border-brand-border rounded p-3 pr-10 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-cyan transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-brand-bg border rounded p-3 pr-10 text-sm focus:outline-none transition-colors ${
                      passwordsMatch ? 'border-green-500 text-green-500' : 
                      passwordsMismatch ? 'border-red-500 text-red-500' : 'border-brand-border text-brand-text focus:border-brand-cyan'
                    }`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-cyan transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 rounded transition-colors">
                Update Password
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/dashboard" />
      <main className="p-8 flex-grow w-full max-w-6xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">Professor Overview</h1>
            <div className="text-sm font-medium text-brand-text">CS401 - Advanced Networking Systems</div>
          </div>
        </header>

        {pendingCount > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex justify-between items-center text-sm text-yellow-500 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{pendingCount} student{pendingCount > 1 ? "s are" : " is"} awaiting enrollment validation.</span>
            </div>
            <button 
              onClick={() => router.push("/professor/students")}
              className="text-xs font-bold uppercase tracking-wider bg-yellow-500/20 hover:bg-yellow-500/35 px-4.5 py-2 rounded-md transition-colors text-yellow-500 cursor-pointer border-none"
            >
              Validate Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Students */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Active Students</div>
              <div className="w-6 h-6 rounded bg-brand-cyan/20 text-brand-cyan flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{activeStudentsCount}</div>
            <div className="text-xs text-brand-muted font-medium">Validated and admitted students</div>
          </div>

          {/* Pending Admissions */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Pending Admissions</div>
              <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{pendingCount}</div>
            <div className="text-xs text-yellow-500 font-medium">Requires enrollment check</div>
          </div>

          {/* Active Modules Count */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Active Course Modules</div>
              <div className="w-6 h-6 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{modules.length}</div>
            <div className="text-xs text-brand-muted font-medium">Syllabus modules configured</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* LEFT COLUMN: Active Modules & Pending Admissions list */}
           <div className="lg:col-span-2 flex flex-col gap-6">
             
             {/* Active Modules */}
             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold">Active Course Modules</h2>
                 <button onClick={() => router.push("/professor/modules")} className="text-xs text-brand-cyan hover:text-brand-cyan-hover transition-colors font-bold uppercase tracking-wider">Manage</button>
               </div>
               
               {modules.length === 0 ? (
                 <div className="text-center py-10 text-brand-muted text-sm border border-dashed border-brand-border/40 rounded-xl bg-brand-bg/25">
                   No modules configured in syllabus. Go to "Manage" to add new learning content.
                 </div>
               ) : (
                 <div className="space-y-4">
                   {modules.map((mod) => (
                     <div key={mod.id} className="bg-brand-bg/50 p-4 rounded-xl border border-brand-border flex items-center justify-between hover:border-brand-border-hover transition-colors">
                       <div className="flex gap-4 items-center min-w-0">
                         <div className="w-10 h-10 rounded-lg bg-brand-card border border-brand-border flex items-center justify-center shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
                         </div>
                         <div className="min-w-0">
                           <div className="text-sm font-bold truncate text-brand-text">{mod.title}</div>
                           <div className="text-[10px] text-brand-muted font-mono mt-0.5">{mod.topics.length} learning topics outlined</div>
                         </div>
                       </div>
                       <button onClick={() => router.push("/professor/modules")} className="text-xs text-brand-muted hover:text-brand-text transition-colors whitespace-nowrap px-3 py-1.5 rounded-lg border border-brand-border bg-brand-card">
                         View Details
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Pending Students Validation Queue */}
             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold">Enrollment validation queue</h2>
                 {pendingCount > 0 && (
                   <button onClick={() => router.push("/professor/students")} className="text-xs text-brand-cyan hover:text-brand-cyan-hover transition-colors font-bold uppercase tracking-wider">Validate All</button>
                 )}
               </div>
               
               {pendingStudents.length === 0 ? (
                 <div className="text-center py-10 text-brand-muted text-sm border border-dashed border-brand-border/40 rounded-xl bg-brand-bg/25">
                   All student profiles are verified. No pending admission enrollments.
                 </div>
               ) : (
                 <div className="space-y-4">
                   {pendingStudents.slice(0, 3).map((stu) => (
                     <div key={stu.id} className="bg-brand-bg/50 p-4 rounded-xl border border-brand-border flex items-center justify-between hover:border-brand-border-hover transition-colors">
                       <div className="min-w-0">
                         <div className="text-sm font-bold text-brand-text truncate">{stu.name || stu.email}</div>
                         <div className="text-[10px] text-brand-muted font-mono mt-0.5">ID: {stu.studentId || "N/A"} • {stu.email}</div>
                       </div>
                       <button onClick={() => router.push("/professor/students")} className="text-xs text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3.5 py-1.5 rounded-lg border border-yellow-500/30 transition-colors whitespace-nowrap">
                         Review
                       </button>
                     </div>
                   ))}
                   {pendingStudents.length > 3 && (
                     <div onClick={() => router.push("/professor/students")} className="text-center text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors cursor-pointer py-2 hover:underline">
                       + {pendingStudents.length - 3} more pending student(s) in queue. Click to view all.
                     </div>
                   )}
                 </div>
               )}
             </div>

           </div>

           {/* RIGHT COLUMN: Roster Analytics & Quick Actions */}
           <div className="flex flex-col gap-6">
             {/* Roster Distribution stats */}
             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
               <h2 className="text-sm font-bold mb-6">Student Roster</h2>
               <div className="space-y-4 text-xs">
                 <div className="flex justify-between items-center pb-2 border-b border-brand-border/30">
                   <span className="text-brand-muted">Admitted Students</span>
                   <span className="font-bold text-green-400 font-mono">{activeStudentsCount}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-brand-border/30">
                   <span className="text-brand-muted">Pending Validation</span>
                   <span className="font-bold text-yellow-500 font-mono">{pendingCount}</span>
                 </div>
                 <div className="flex justify-between items-center font-bold text-sm">
                   <span>Total Registered</span>
                   <span className="font-mono text-brand-cyan">{activeStudentsCount + pendingCount}</span>
                 </div>
               </div>
             </div>

             {/* Quick Actions */}
             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
               <h2 className="text-sm font-bold mb-4">Quick Actions</h2>
               <div className="flex flex-col gap-3 text-xs">
                 <button onClick={() => router.push("/professor/modules")} className="w-full text-left p-3 border border-brand-border hover:border-brand-cyan rounded-xl bg-brand-bg/30 text-brand-text hover:text-brand-cyan transition-all flex items-center justify-between font-semibold">
                   <span>Configure Course Modules</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                 </button>
                 <button onClick={() => router.push("/professor/students")} className="w-full text-left p-3 border border-brand-border hover:border-brand-cyan rounded-xl bg-brand-bg/30 text-brand-text hover:text-brand-cyan transition-all flex items-center justify-between font-semibold">
                   <span>Validate Enrollments</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                 </button>
                 <button onClick={() => router.push("/professor/settings")} className="w-full text-left p-3 border border-brand-border hover:border-brand-cyan rounded-xl bg-brand-bg/30 text-brand-text hover:text-brand-cyan transition-all flex items-center justify-between font-semibold">
                   <span>Edit Profile Settings</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                 </button>
               </div>
             </div>
           </div>
        </div>

      </main>
    </div>
  );
}