import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Register() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Link href="/" className="absolute top-8 left-8 text-brand-muted hover:text-brand-cyan flex items-center gap-2 transition-colors text-sm font-medium z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </Link>

      <Navbar showLinks={false} />
      <main className="flex-grow flex items-center justify-center p-8 w-full">
        
        <div className="w-full max-w-5xl bg-brand-card border border-brand-border rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Information */}
          <div className="w-full md:w-5/12 p-10 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-border">
            <div>
              <h1 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
                Student <br />Enrollment
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
            
            <form className="space-y-8">
              
              {/* Personal Identity Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Personal Identity</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">First Name</label>
                    <input type="text" placeholder="Jane" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Middle Name</label>
                    <input type="text" placeholder="Optional" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm w-full text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Last Name</label>
                    <input type="text" placeholder="Doe" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Birthdate</label>
                    <input type="text" placeholder="dd/mm/yyyy" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Age</label>
                    <input type="number" placeholder="19" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Gender</label>
                    <div className="relative">
                      <select className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option>Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Complete Address</label>
                  <input type="text" placeholder="123 Tech Lane, Cyber City, ZIP" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                </div>
              </div>

              {/* Academic Profile Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-4">Academic Profile</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Student ID No.</label>
                    <input type="text" placeholder="STU-2024-XXXX" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Institutional Email</label>
                    <input type="email" placeholder="student@netmaster.edu" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Course/Program</label>
                    <div className="relative">
                      <select className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option>Select Program</option>
                        <option>BS Information Technology</option>
                        <option>BS Computer Science</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Year Level</label>
                    <div className="relative">
                      <select className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text appearance-none focus:outline-none focus:border-brand-cyan transition-colors">
                        <option>Select Year</option>
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
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
                    <input type="text" placeholder="e.g. A" className="w-full bg-brand-bg border border-brand-border rounded p-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-cyan transition-colors" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-3 px-8 rounded flex items-center gap-2 transition-colors">
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