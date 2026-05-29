"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Login() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: activeMode }),
      });

      const data = await res.json();
      
      if (data.success) {
        if (data.user.isFirstLogin && data.user.role === "Professor") {
          localStorage.setItem("pendingChangePasswordEmail", email);
          localStorage.setItem("professorFirstLogin", "true");
          router.push("/professor");
        } else if (data.user.isFirstLogin) {
          localStorage.setItem("pendingChangePasswordEmail", email);
          router.push("/change-password");
        } else {
          // Redirect to dashboard based on role
          if (data.user.role === "Admin") router.push("/admin");
          else if (data.user.role === "Professor") router.push("/professor");
          else router.push("/student");
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error");
    }
  };
  
  return (
    <div className="relative min-h-screen flex flex-col">
      <Link href="/" className="absolute top-8 left-8 text-brand-muted hover:text-brand-cyan flex items-center gap-2 transition-colors text-sm font-medium z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </Link>
      
      <Navbar showLinks={false} showAuth={false} />
      <main className="flex-grow flex items-center justify-center p-8 w-full">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">NetMaster</h1>
            <p className="text-brand-text text-sm">System Authentication Portal</p>
          </div>

          {/* Form Container */}
          <div className="bg-brand-card border-t-2 border-brand-text border-x border-b border-x-brand-border border-b-brand-border rounded-lg p-8 shadow-2xl relative">
            
            {/* Access Type Tabs */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-3 block">Select Access Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => setActiveMode("Student")} 
                  className={`py-2.5 px-2 text-sm font-medium rounded transition-colors ${activeMode === "Student" ? "bg-brand-bg border border-brand-cyan text-brand-cyan" : "bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text"}`}
                >
                  Student
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveMode("Professor")} 
                  className={`py-2.5 px-2 text-sm font-medium rounded transition-colors ${activeMode === "Professor" ? "bg-brand-bg border border-brand-cyan text-brand-cyan" : "bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text"}`}
                >
                  Professor
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveMode("Admin")} 
                  className={`py-2.5 px-2 text-sm font-medium rounded transition-colors ${activeMode === "Admin" ? "bg-brand-bg border border-brand-cyan text-brand-cyan" : "bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text"}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {error && <div className="text-red-400 text-xs bg-red-400/10 p-2 rounded">{error}</div>}
              {/* Email */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@netmaster.edu"
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text block">Password</label>
                  <Link href="#" className="text-[10px] text-brand-muted hover:text-brand-cyan transition-colors">Forgot?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-brand-bg border border-brand-border rounded p-3 pl-9 pr-10 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors"
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

              {/* Submit */}
              <button type="submit" className="w-full mt-6 bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 rounded flex justify-center items-center gap-2 transition-colors">
                Initialize Session
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-brand-muted">
                  Are you a student and don't have an account? <Link href="/register" className="text-brand-cyan hover:text-brand-cyan-hover font-bold transition-colors">Register here</Link>
                </p>
              </div>
            </form>

            {/* Footer Text */}
            <div className="mt-8 text-center text-xs text-brand-text font-medium">
              Require system access? <Link href="/register" className="text-brand-text hover:text-brand-cyan underline underline-offset-2 transition-colors">Request Credentials</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}