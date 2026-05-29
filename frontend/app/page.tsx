import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-8 py-16">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32 relative">
          
          <div className="space-y-8 z-10">
            {/* IP Tag */}
            <div className="inline-flex items-center gap-2 bg-brand-card px-3 py-1.5 rounded text-xs font-mono text-brand-cyan border border-brand-border">
              <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
              <span className="opacity-90">192.168.1.104 — 10.4.30.211</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Master Networking<br />
              Through <span className="text-brand-cyan">Applied Action</span>
            </h1>

            <p className="text-brand-muted max-w-lg leading-relaxed text-sm">
              A web-based, gamified command center for your IT career. Track competencies, analyze real-time performance, and dominate complex routing scenarios in simulated environments.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-semibold px-6 py-3 rounded flex items-center gap-2 transition-colors">
                Start Learning
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link href="#" className="bg-brand-card hover:bg-brand-border text-brand-text font-semibold px-6 py-3 rounded border border-brand-border flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                View Demo
              </Link>
            </div>

            <div className="flex items-center gap-12 pt-8 border-t border-brand-border max-w-md">
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1">150+</div>
                <div className="text-xs text-brand-muted font-medium">Active Labs</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1">12k</div>
                <div className="text-xs text-brand-muted font-medium">Peers Online</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1">98%</div>
                <div className="text-xs text-brand-muted font-medium">Cert Rate</div>
              </div>
            </div>
          </div>
          
          <div className="relative h-full min-h-[400px]">
            {/* Abstract Graphic representation from screenshot */}
            <div className="absolute top-[10%] right-[10%] bg-brand-card border border-brand-border p-5 rounded-lg w-64 shadow-2xl z-20 animate-float-1">
               <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] text-brand-cyan font-mono tracking-widest">OSPF Config</div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
               </div>
               <div className="text-lg font-semibold mb-4">OSPF Routing</div>
               <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                 <div className="w-[75%] h-full bg-brand-cyan"></div>
               </div>
               <div className="text-[10px] text-right text-brand-muted mt-2">75% Complete</div>
            </div>

            <div className="absolute top-[45%] right-[25%] bg-brand-card border border-brand-border p-5 rounded-lg w-56 shadow-2xl z-10 animate-float-2">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded bg-brand-bg flex items-center justify-center border border-brand-border">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
                 </div>
                 <div className="text-xs font-semibold tracking-wider">Global Elite</div>
               </div>
               <div className="flex gap-2">
                 <div className="w-8 h-6 bg-brand-border rounded"></div>
                 <div className="w-8 h-6 bg-brand-cyan/30 rounded"></div>
                 <div className="w-8 h-6 bg-brand-cyan/60 rounded"></div>
                 <div className="w-8 h-6 bg-brand-cyan rounded"></div>
               </div>
            </div>

            <div className="absolute bottom-[10%] right-[40%] bg-brand-card border border-brand-border px-4 py-3 flex items-center gap-3 rounded-lg shadow-2xl z-30 animate-float-3">
              <div className="w-8 h-8 rounded bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold text-xs">AC</div>
              <div>
                <div className="text-xs font-bold leading-tight">Alex Chen</div>
                <div className="text-[10px] text-brand-cyan">Collaborating...</div>
              </div>
            </div>

            <div className="absolute bottom-[20%] right-[5%] bg-brand-card border border-brand-border px-4 py-3 rounded-lg shadow-2xl z-20 animate-float-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div className="text-[10px] font-mono text-brand-text tracking-widest">System Load: 12ms</div>
              </div>
            </div>

            {/* Faint Connecting Lines (Circular Patterns) */}
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-brand-border/30 z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
              <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
              <circle cx="200" cy="200" r="200" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
            </svg>
          </div>
        </div>

        {/* Command Center Section */}
        <div className="mb-24 pt-16">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">The Command Center</h2>
            <p className="text-brand-muted text-sm max-w-xl leading-relaxed">
              Everything you need to map your progress, analyze your performance, and execute complex networking scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Competency Tracking */}
            <div className="md:col-span-2 bg-brand-card border border-brand-border p-8 rounded-xl flex flex-col justify-between">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan mb-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/></svg>
                <h3 className="text-lg font-bold mb-2">Competency Tracking</h3>
                <p className="text-brand-muted text-sm max-w-md">Real-time mapping of your skill acquisition against industry standard certification paths.</p>
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-brand-text">Subnetting Mastery</span>
                    <span className="text-brand-cyan font-mono font-bold">920</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-brand-cyan"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-brand-text">VLAN Configuration</span>
                    <span className="text-brand-cyan font-mono font-bold">640</span>
                  </div>
                  <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                    <div className="w-[64%] h-full bg-brand-text"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gamified Labs */}
            <div className="bg-brand-card border border-brand-border p-8 rounded-xl flex flex-col">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan mb-4"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
              <h3 className="text-lg font-bold mb-2">Gamified Labs</h3>
              <p className="text-brand-muted text-sm mb-8 flex-grow">Simulated environments where configuration errors have consequences.</p>
              <button className="w-full py-3 bg-brand-bg hover:bg-brand-border text-brand-text font-semibold text-sm rounded border border-brand-border transition-colors">
                Enter Terminal
              </button>
            </div>

            {/* Live Analytics */}
            <div className="bg-brand-card border border-brand-border p-8 rounded-xl flex flex-col justify-between overflow-hidden relative group">
              <div className="z-10 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted mb-4"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                <h3 className="text-lg font-bold mb-2">Live Analytics</h3>
                <p className="text-brand-muted text-sm">Packet-level analysis of your lab performance.</p>
              </div>
              <div className="h-20 mt-6 flex items-end gap-2 px-2 z-0">
                <div className="flex-1 bg-brand-border h-[20%] rounded-t opacity-40"></div>
                <div className="flex-1 bg-brand-border h-[40%] rounded-t opacity-40"></div>
                <div className="flex-1 bg-brand-border h-[30%] rounded-t opacity-40"></div>
                <div className="flex-1 bg-brand-border h-[60%] rounded-t opacity-60"></div>
                <div className="flex-1 bg-brand-border h-[50%] rounded-t opacity-60"></div>
                <div className="flex-1 bg-brand-text h-[100%] rounded-t relative">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-bg"></div>
                </div>
              </div>
            </div>

            {/* Peer Synchronization */}
            <div className="md:col-span-2 bg-brand-card border border-brand-border p-8 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text mb-4"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="18" y1="12" y2="16"/><line x1="12" x2="6" y1="12" y2="16"/></svg>
                <h3 className="text-lg font-bold mb-2">Peer Synchronization</h3>
                <p className="text-brand-muted text-sm max-w-md mb-4 leading-relaxed">Connect with a global network of aspiring network engineers, form study clusters and tackle complex topologies together.</p>
                <Link href="#" className="text-brand-cyan text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-brand-cyan-hover">
                  View Active Clusters
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="flex bg-brand-bg rounded-lg border border-brand-border p-1">
                <div className="w-10 h-10 border-r border-brand-border flex items-center justify-center bg-brand-card hover:bg-brand-border cursor-pointer transition-colors rounded-l">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-brand-text"></div>
                </div>
                <div className="w-10 h-10 border-r border-brand-border flex items-center justify-center bg-brand-card hover:bg-brand-border cursor-pointer transition-colors">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-brand-text"></div>
                </div>
                <div className="w-10 h-10 border-r border-brand-border flex items-center justify-center bg-brand-card hover:bg-brand-border cursor-pointer transition-colors">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-brand-text"></div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-brand-card text-xs font-mono text-brand-muted rounded-r">+12</div>
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}