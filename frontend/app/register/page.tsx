"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    address: "",
    studentId: "",
    email: "",
    course: "",
    yearLevel: "",
    section: "",
    password: "",
    confirmPassword: ""
  });
  const [birthdate, setBirthdate] = useState("");
  const [age, setAge] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const reqMinChars = formData.password.length >= 8;
  const reqUpper = /[A-Z]/.test(formData.password);
  const reqNumber = /[0-9]/.test(formData.password);
  const reqSpecial = /[!@#$%^&*]/.test(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (birthdate) {
      const bday = new Date(birthdate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - bday.getFullYear();
      const m = today.getMonth() - bday.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    }
  }, [birthdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!reqMinChars || !reqUpper || !reqNumber || !reqSpecial) {
      setError("Password does not meet all requirements");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          birthdate,
          age,
          role: "Student",
          status: "pending"
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        // Clear form
        setFormData({
          firstName: "", middleName: "", lastName: "", 
          gender: "", address: "", studentId: "", 
          email: "", course: "", yearLevel: "", section: "",
          password: "", confirmPassword: ""
        });
        setBirthdate("");
        setAge("");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Server error during registration");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Link href="/" className="absolute top-8 left-8 text-brand-muted hover:text-brand-cyan flex items-center gap-2 transition-colors text-sm font-medium z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </Link>

      <main className="flex-grow flex flex-col items-center justify-center p-8 w-full">
        {/* Centered Logo */}
        <div className="mb-8 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            NetMaster
          </Link>
        </div>
        
        <div className="w-full max-w-5xl bg-brand-card border border-brand-border rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Information */}
          <div className="w-full md:w-5/12 p-10 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-border">
            <div>
              <h1 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
                Student <br />Registration
              </h1>
              <p className="text-brand-text text-sm leading-relaxed mb-12">
                Join the high-performance, gamified educational networking environment. Equip yourself for academic rigor.
              </p>
            </div>

            <div className="bg-brand-bg p-5 rounded border border-brand-border flex gap-4">
              <div className="mt-1">
                <div className="w-6 h-6 rounded bg-brand-bg flex items-center justify-center border border-brand-cyan">
                  <span className="text-brand-cyan text-xs font-bold font-mono">i</span>
                </div>
              </div>
              <p className="text-[11px] text-brand-muted leading-relaxed font-medium">
                Note: This form is strictly for student registration. Professor/Admin accounts must be provisioned directly by the system administrator.
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-7/12 p-10 md:p-12">
            
            {showSuccess && (
              <div className="mb-8 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-text p-4 rounded-lg flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-brand-cyan">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-cyan mb-1">Registration Successfully Submitted</h4>
                    <p className="text-xs text-brand-muted leading-relaxed select-text">
                      Please wait for a confirmation via email. The professor will validate your registration before you are officially admitted to the subject.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowSuccess(false)}
                  className="text-brand-muted hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            {error && (
              <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              {/* Personal Identity Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Personal Identity</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Jane" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Middle Name</label>
                    <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="Optional" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm w-full text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Birthdate</label>
                    <input 
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors style-color-scheme" 
                      style={{ colorScheme: 'dark' }} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Age</label>
                    <input 
                      type="number" 
                      placeholder="19" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Gender</label>
                    <div className="relative">
                      <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Complete Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="123 Tech Lane, Cyber City, ZIP" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                </div>
              </div>

              {/* Academic Profile Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Academic Profile</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Student ID No.</label>
                    <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required placeholder="STU-2024-XXXX" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Institutional Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="student@netmaster.edu" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Course/Program</label>
                    <div className="relative">
                      <select name="course" value={formData.course} onChange={handleChange} required className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option value="">Select Program</option>
                        <option value="BS Information Technology">BS Information Technology</option>
                        <option value="BS Computer Science">BS Computer Science</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Year Level</label>
                    <div className="relative">
                      <select name="yearLevel" value={formData.yearLevel} onChange={handleChange} required className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Section</label>
                    <input type="text" name="section" value={formData.section} onChange={handleChange} required placeholder="e.g. A" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>
              </div>

              {/* Account Setup Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Account Setup</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        placeholder="••••••••" 
                        className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors pr-10" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-muted hover:text-brand-cyan transition-colors"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
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
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        required 
                        placeholder="••••••••" 
                        className={`w-full bg-brand-bg border rounded p-2.5 text-sm text-brand-text focus:outline-none transition-colors pr-10 ${
                          formData.confirmPassword 
                            ? formData.password === formData.confirmPassword 
                              ? 'border-green-500 focus:border-green-500' 
                              : 'border-red-500 focus:border-red-500'
                            : 'border-brand-border focus:border-brand-cyan'
                        }`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-muted hover:text-brand-cyan transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Requirements Panel */}
                <div className="mt-4 p-4 bg-[#0a111a] border border-brand-border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <h4 className="font-bold text-sm text-brand-text tracking-wide uppercase">Password Requirements</h4>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className={`flex items-center gap-2 ${reqMinChars ? 'text-green-500' : 'text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-sm bg-current"></span>
                      Minimum 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${reqUpper ? 'text-green-500' : 'text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-sm bg-current"></span>
                      At least one uppercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${reqNumber ? 'text-green-500' : 'text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-sm bg-current"></span>
                      At least one numeric digit
                    </li>
                    <li className={`flex items-center gap-2 ${reqSpecial ? 'text-green-500' : 'text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-sm bg-current"></span>
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Submit Button & Login Link */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link href="/login" className="text-sm text-brand-muted hover:text-brand-cyan transition-colors">
                  Already have an account as student? <span className="font-bold underline">Login</span>
                </Link>
                <button type="submit" className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 px-8 rounded flex items-center justify-center gap-2 transition-colors">
                  Register
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>

            </form>

          </div>
        </div>

      </main>
    </div>
  );
}