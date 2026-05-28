"use client";

import Sidebar from "@/components/Sidebar";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/dashboard" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text mb-2">Student Portal</div>
            <h1 className="text-3xl font-bold mb-3">Welcome back, Alex.</h1>
            <p className="text-brand-muted text-sm max-w-xl leading-relaxed">
              Your network topology skills are in the top 15% of your cohort. Keep pushing towards your CCNA certification.
            </p>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-lg p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded bg-green-500/20 flex items-center justify-center text-green-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             </div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Current Tier</div>
               <div className="font-bold">Level 4: Routing</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Module Progress */}
          <div className="col-span-2 bg-brand-card border border-brand-border rounded-xl p-8 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-brand-bg text-[10px] font-bold uppercase tracking-wider text-brand-text px-3 py-1.5 rounded border border-brand-border">In Progress</div>
              <div className="w-10 h-10 rounded border border-brand-border flex items-center justify-center text-brand-cyan relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-cyan rounded-full"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-3">CCNA Module 4: OSPF Concepts</h2>
            <p className="text-brand-muted text-sm mb-8 max-w-lg leading-relaxed">
              Master the fundamentals of Open Shortest Path First routing protocol. Complete the interactive lab to solidify your understanding of single-area OSPF.
            </p>
            
            <div className="mb-8">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-brand-text">Module Progress</span>
                <span className="text-brand-cyan font-semibold">Est. 45 mins remaining</span>
              </div>
              <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-brand-cyan"></div>
              </div>
            </div>
            
            <button className="bg-brand-bg border border-brand-border hover:border-brand-cyan text-brand-text hover:text-brand-cyan font-bold text-xs uppercase tracking-wider py-3 px-6 rounded flex items-center gap-2 transition-colors">
              Resume Lab
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>

          {/* Latest Lab Score */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Latest Lab Score</div>
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div className="flex-grow">
              <div className="text-4xl font-bold mb-2">92 <span className="text-lg text-brand-muted font-normal">/ 100</span></div>
              <div className="font-bold text-sm mb-1">VLAN Configuration</div>
              <div className="text-xs text-green-500 font-semibold">Passed With Distinction</div>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-text text-left mt-6 flex items-center gap-1">
              Review Feedback <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>

          {/* Upcoming */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text">Upcoming</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
             </div>
             <div className="space-y-5">
               <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-muted"></div>
                 <div>
                   <div className="text-[10px] font-mono text-brand-muted mb-1">NOV 21, 14:00</div>
                   <div className="text-sm font-semibold">Live Peer Review: Subnetting</div>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-green-500"></div>
                 <div>
                   <div className="text-[10px] font-mono text-green-500 mb-1">TOMORROW, 09:00</div>
                   <div className="text-sm font-semibold">Module 4 Quiz</div>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-muted"></div>
                 <div>
                   <div className="text-[10px] font-mono text-brand-muted mb-1">FRI, 16:00</div>
                   <div className="text-sm font-semibold">Open Office Hours</div>
                 </div>
               </div>
             </div>
          </div>

          {/* Skills Overview */}
          <div className="col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg flex gap-8 items-center">
            <div className="flex-1 space-y-5">
               <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-4">Skills Overview</div>
               
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-brand-text">Routing Protocols</span>
                    <span className="font-mono">85%</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-brand-muted"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-brand-text">Switching & VLANs</span>
                    <span className="font-mono text-brand-cyan">92%</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-brand-cyan"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-brand-text">Network Security</span>
                    <span className="font-mono">64%</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1 rounded-full overflow-hidden">
                    <div className="w-[64%] h-full bg-brand-muted"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-brand-text">Troubleshooting</span>
                    <span className="font-mono">78%</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1 rounded-full overflow-hidden">
                    <div className="w-[78%] h-full bg-brand-muted"></div>
                  </div>
                </div>
            </div>
            
            <div className="w-32 h-32 relative border border-brand-border/40 rounded flex items-center justify-center">
              {/* Radar chart placeholder visualization */}
               <div className="absolute w-[80%] h-[80%] border border-brand-border/60 rounded"></div>
               <div className="absolute w-[60%] h-[60%] border border-brand-border/80 rounded bg-brand-cyan/5"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
               <div className="absolute top-0 right-1/2 w-1.5 h-1.5 bg-brand-text rounded-full"></div>
               <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-brand-cyan rounded-full"></div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}