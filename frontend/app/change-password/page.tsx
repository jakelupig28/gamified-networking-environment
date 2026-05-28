"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingChangePasswordEmail");
    if (!storedEmail) {
      router.push("/login");
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        alert("Password changed successfully. Please login again.");
        router.push("/login");
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showLinks={false} />
      <main className="flex-grow flex items-center justify-center p-8 w-full">
        <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-lg p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-2">Change Password Required</h1>
          <p className="text-brand-muted text-sm mb-6">For security reasons, you must change your password on your first login.</p>
          
          {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 p-3 rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors"
              />
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