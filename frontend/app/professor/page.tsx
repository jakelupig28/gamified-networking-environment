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

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Active Students */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Active Students</div>
              <div className="w-6 h-6 rounded bg-brand-cyan/20 text-brand-cyan flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">142</div>
            <div className="text-xs text-green-500 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              +5% this week
            </div>
          </div>

          {/* Pending Lab Reviews */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Pending Lab Reviews</div>
              <div className="w-6 h-6 rounded bg-red-500/20 text-red-500 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">28</div>
            <div className="text-xs text-red-500 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Requires attention
            </div>
          </div>

          {/* Avg Cohort Grade */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Avg. Cohort Grade</div>
              <div className="w-6 h-6 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-4">87.4%</div>
            <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
               <div className="w-[87%] h-full bg-brand-cyan"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
           <div className="col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-md flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold">Active Classes</h2>
               <button className="text-xs text-brand-muted hover:text-brand-text transition-colors">View All</button>
             </div>
             
             <div className="space-y-4">
               <div className="bg-brand-bg p-5 rounded-lg border border-brand-border flex items-center justify-between">
                 <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded bg-brand-card border border-brand-border flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
                   </div>
                   <div>
                     <div className="text-sm font-bold">Subnetting Fundamentals</div>
                     <div className="text-[10px] text-brand-muted font-mono mt-0.5">CS401 â€¢ Module 3</div>
                   </div>
                 </div>
                 <div className="w-1/3">
                   <div className="flex justify-between text-[10px] mb-1.5">
                     <span className="text-brand-text">Progress</span>
                     <span className="text-brand-cyan font-mono">65%</span>
                   </div>
                   <div className="w-full bg-brand-card h-1.5 rounded-full overflow-hidden">
                     <div className="w-[65%] h-full bg-brand-cyan"></div>
                   </div>
                 </div>
               </div>

               <div className="bg-brand-bg p-5 rounded-lg border border-brand-border flex items-center justify-between">
                 <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded bg-brand-card border border-brand-border flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                   </div>
                   <div>
                     <div className="text-sm font-bold">BGP Routing Protocols</div>
                     <div className="text-[10px] text-brand-muted font-mono mt-0.5">CS402 â€¢ Module 1</div>
                   </div>
                 </div>
                 <div className="w-1/3">
                   <div className="flex justify-between text-[10px] mb-1.5">
                     <span className="text-brand-text">Progress</span>
                     <span className="text-brand-text font-mono">15%</span>
                   </div>
                   <div className="w-full bg-brand-card h-1.5 rounded-full overflow-hidden">
                     <div className="w-[15%] h-full bg-brand-text"></div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="flex flex-col gap-6">
             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
               <h2 className="text-sm font-bold mb-6">Student Engagement</h2>
               <div className="h-32 flex items-end gap-2 px-2 mb-4">
                 <div className="flex-1 bg-brand-border/40 h-[30%] rounded-t"></div>
                 <div className="flex-1 bg-brand-border/40 h-[45%] rounded-t"></div>
                 <div className="flex-1 bg-brand-border/40 h-[60%] rounded-t"></div>
                 <div className="flex-1 bg-brand-border/40 h-[40%] rounded-t"></div>
                 <div className="flex-1 bg-brand-text opacity-90 h-[90%] rounded-t"></div>
                 <div className="flex-1 bg-brand-border/40 h-[70%] rounded-t"></div>
                 <div className="flex-1 bg-brand-border/40 h-[50%] rounded-t"></div>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <div>
                   <div className="text-brand-muted text-[10px] mb-0.5">Peak Day</div>
                   <div className="font-semibold">Wednesday</div>
                 </div>
                 <div className="text-right">
                   <div className="text-brand-muted text-[10px] mb-0.5">Avg. Logins</div>
                   <div className="text-brand-cyan font-semibold">24/day</div>
                 </div>
               </div>
             </div>

             <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md flex-1">
               <h2 className="text-sm font-bold mb-4">Requires Attention</h2>
               <div className="space-y-4">
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 text-red-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   </div>
                   <div>
                     <div className="text-xs font-semibold mb-0.5">3 students failing Lab 2</div>
                     <div className="text-[10px] text-brand-muted">2 hours ago</div>
                   </div>
                 </div>
                 <div className="flex gap-3 items-start">
                   <div className="mt-1 text-brand-cyan">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                   </div>
                   <div>
                     <div className="text-xs font-semibold mb-0.5">New discussion thread in Module 3</div>
                     <div className="text-[10px] text-brand-muted">5 hours ago</div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>

      </main>
    </div>
  );
}