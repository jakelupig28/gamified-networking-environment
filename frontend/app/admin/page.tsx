"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminDashboard() {
  const [view, setView] = useState<"list" | "create">("list");
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (view === "list") {
      fetchUsers();
    }
  }, [view]);

  // Password validation checks
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minLength || !hasUpper || !hasDigit || !hasSpecial) {
      setMessage("Please meet all password requirements");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: "Professor"
        }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (data.success) {
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
           setView("list");
           setMessage("");
        }, 1500);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/admin/user-management" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text mb-2 flex items-center gap-2">
              <span>Admin</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="m9 18 6-6-6-6"/></svg>
              <span>User Management</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">
              {view === "list" ? "Manage User Accounts" : "Create User Account"}
            </h1>
            <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
              {view === "list" 
                ? "Overview of active student and professor accounts in the system ecosystem." 
                : "Provision a secure administrative access profile. All fields are required to establish fundamental access protocols."}
            </p>
          </div>
          {view === "list" && (
            <button 
              onClick={() => setView("create")}
              className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 px-5 rounded flex items-center gap-2 transition-colors text-sm"
            >
              Add User Account
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </button>
          )}
        </header>

        {view === "list" ? (
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-brand-bg border-b border-brand-border text-xs uppercase tracking-wider font-bold text-brand-text">
                   <tr>
                     <th className="p-4 px-6">Name</th>
                     <th className="p-4 px-6">Email</th>
                     <th className="p-4 px-6">Role</th>
                     <th className="p-4 px-6">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-border text-brand-muted">
                   {users.filter(u => u.role !== "Admin").map((u, i) => (
                     <tr key={i} className="hover:bg-brand-bg/50 transition-colors">
                       <td className="p-4 px-6 font-medium text-brand-text">{u.name || "Default User"}</td>
                       <td className="p-4 px-6">{u.email}</td>
                       <td className="p-4 px-6">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === "Professor" ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
                           {u.role}
                         </span>
                       </td>
                       <td className="p-4 px-6">
                         <span className="flex items-center gap-1.5 text-xs">
                           <span className="w-2 h-2 rounded-full bg-green-500"></span>
                           Active
                         </span>
                       </td>
                     </tr>
                   ))}
                   {users.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-8 text-center text-brand-muted">Loading users...</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-8">
          <div className="flex-grow">
            <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-md">
              {message && <div className={`mb-6 text-xs p-3 rounded bg-brand-bg border border-brand-border ${message.includes("success") || message === "User created" ? 'text-green-400' : 'text-red-400'}`}>{message}</div>}
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
                  <h2 className="text-lg font-bold">Identity Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">First Name</label>
                    <input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required placeholder="e.g. Alan" className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Middle Name <span className="text-brand-muted normal-case">(optional)</span></label>
                    <input type="text" value={middleName} onChange={(e)=>setMiddleName(e.target.value)} placeholder="e.g. Mathison" className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Last Name</label>
                  <input type="text" value={lastName} onChange={(e)=>setLastName(e.target.value)} required placeholder="e.g. Turing" className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <h2 className="text-lg font-bold">Authentication & Security</h2>
                </div>
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Institutional Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="user@netmaster.edu" className="w-full bg-brand-bg border border-brand-border rounded p-3 pl-9 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Temporary Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      </div>
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full bg-brand-bg border border-brand-border rounded p-3 pl-9 pr-10 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-cyan transition-colors">
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
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      </div>
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full bg-brand-bg border border-brand-border rounded p-3 pl-9 pr-10 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-cyan transition-colors">
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t border-brand-border/40">
                <button type="button" onClick={() => { setView("list"); setMessage(""); }} className="text-xs font-bold uppercase tracking-wider text-brand-text hover:text-brand-cyan transition-colors">Cancel</button>
                <button type="submit" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 px-6 rounded flex items-center gap-2 transition-colors text-sm">
                  Create Profile
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                </button>
              </div>
            </form>
          </div>

          <div className="w-72 space-y-4">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-md">
               <div className="w-8 h-8 rounded bg-brand-bg border border-brand-border flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
               </div>
               <h3 className="font-bold mb-2">Access Privileges</h3>
               <p className="text-xs text-brand-muted leading-relaxed">
                 Professor accounts are granted Level 2 administrative clearance by default. This includes curriculum authoring, network moderation, and analytics viewing.
               </p>
            </div>

            <div className="bg-brand-bg border border-brand-border rounded-xl p-6 shadow-md">
               <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${(minLength && hasUpper && hasDigit && hasSpecial) ? "text-green-500" : "text-brand-text"}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                 Password Requirements
               </h3>
               <ul className="text-xs space-y-3">
                 <li className={`flex gap-2 items-start transition-colors ${minLength ? 'text-green-500' : 'text-red-400'}`}>
                   <span className="mt-0.5">â—‡</span> Minimum 8 characters
                 </li>
                 <li className={`flex gap-2 items-start transition-colors ${hasUpper ? 'text-green-500' : 'text-red-400'}`}>
                   <span className="mt-0.5">â—‡</span> At least one uppercase letter
                 </li>
                 <li className={`flex gap-2 items-start transition-colors ${hasDigit ? 'text-green-500' : 'text-red-400'}`}>
                   <span className="mt-0.5">â—‡</span> At least one numeric digit
                 </li>
                 <li className={`flex gap-2 items-start transition-colors ${hasSpecial ? 'text-green-500' : 'text-red-400'}`}>
                   <span className="mt-0.5">â—‡</span> One special character (!@#$%^&*)
                 </li>
               </ul>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}