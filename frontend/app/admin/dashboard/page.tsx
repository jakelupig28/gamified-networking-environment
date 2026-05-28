"use client";

import Sidebar from "@/components/Sidebar";

export default function AdminDashboardOverview() {
  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/admin/dashboard" />
      <main className="p-10 flex-grow w-full max-w-6xl">
        <header className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text mb-2 flex items-center gap-2">
            <span>Admin</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><path d="m9 18 6-6-6-6"/></svg>
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-brand-text">
            System Overview
          </h1>
          <p className="text-brand-muted text-sm max-w-2xl leading-relaxed">
            Real-time analytics and management interface for the NetMaster environment.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
            <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">Total Users</h3>
            <div className="text-3xl font-bold text-brand-cyan mb-2">1,248</div>
            <div className="text-xs text-green-500 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              12% from last month
            </div>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
            <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">Active Modules</h3>
            <div className="text-3xl font-bold text-brand-text mb-2">42</div>
            <div className="text-xs text-brand-muted font-medium">Across 8 Curriculums</div>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
            <h3 className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">System Health</h3>
            <div className="text-3xl font-bold text-green-500 mb-2">99.9%</div>
            <div className="text-xs text-brand-muted font-medium">All services operational</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-text mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 text-sm pb-4 border-b border-brand-border/50 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-xs shrink-0">
                    S{i}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-brand-text">Student Module Completion</p>
                    <p className="text-xs text-brand-muted">Advanced Routing Protocol</p>
                  </div>
                  <div className="text-xs text-brand-muted">{i * 2}h ago</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-text mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
               <button className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                 <span className="text-xs font-bold">New User</span>
               </button>
               <button className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                 <span className="text-xs font-bold">New Module</span>
               </button>
               <button className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                 <span className="text-xs font-bold">Reports</span>
               </button>
               <button className="p-4 border border-brand-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-colors text-brand-text hover:text-brand-cyan">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                 <span className="text-xs font-bold">Network Status</span>
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}