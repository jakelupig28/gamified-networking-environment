"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Sidebar({ activePath }: { activePath: string }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Check initial preference on mount from localStorage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.add('light-mode');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.remove('light-mode');
    }

    // Load user identity
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setUserName(savedName);
    if (savedRole) setUserRole(savedRole);
  }, []);

  const toggleTheme = () => {
    const newThemeMode = !isDarkMode;
    setIsDarkMode(newThemeMode);
    
    if (newThemeMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const getDashboardPath = () => {
    if (activePath.includes('/admin')) return '/admin/dashboard';
    if (activePath.includes('/student')) return '/student';
    if (activePath.includes('/professor')) return '/professor';
    return '/dashboard';
  };

  const menuItems = [
    { name: 'Dashboard', path: getDashboardPath(), icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/> },
    { name: 'Curriculum', path: '#', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
    { name: 'Network', path: '#', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
    { name: 'Achievements', path: '#', icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></> },
    { name: 'Analytics', path: '#', icon: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></> },
  ];
  if (activePath.includes('/student')) {
    menuItems.push(
      { name: 'Settings', path: '/student/settings', icon: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></> }
    );
  }
  if (activePath.includes('/admin')) {
    menuItems.push({ name: 'User Management', path: '/admin', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></> });
  }

  if (activePath.includes('/professor')) {
    menuItems.push(
      { name: 'Students', path: '/professor/students', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
      { name: 'Modules', path: '/professor/modules', icon: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></> },
      { name: 'Subjects', path: '/professor/subjects', icon: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></> },
      { name: 'Settings', path: '/professor/settings', icon: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></> }
    );
  }

  return (
    <aside className="w-64 bg-brand-bg border-r border-brand-border h-screen flex flex-col fixed left-0 top-0 text-sm overflow-y-auto">
      <div className="p-6 pb-6 border-b border-brand-border/30">
        <div className="flex items-center justify-between gap-2 text-xl font-bold tracking-tight text-brand-text mb-1">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            NetMaster
          </div>
          <button 
            type="button"
            onClick={toggleTheme} 
            className="p-1.5 rounded-md hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
        </div>
        <div className="text-[10px] text-brand-muted tracking-wide mb-6">Elite Networking</div>
        
        {(activePath.includes(`/${userRole?.toLowerCase() || 'student'}`) || activePath.includes('/student') || activePath.includes('/professor')) && (
          <div className="flex items-center gap-3 p-3 bg-brand-card rounded-md border border-brand-border">
            <div className="w-10 h-10 rounded border-brand-border overflow-hidden shrink-0">
              <img id="sidebar-profile-pic" src="/placeholder-avatar.jpg" alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-tr from-brand-muted to-brand-cyan/20"></div>'; }} />
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-sm truncate max-w-[120px]" title={userName}>{userName}</div>
              <div className="text-[9px] font-medium text-brand-cyan uppercase tracking-wider">{userRole || "Student"}</div>
            </div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path} 
            className={`flex items-center gap-3 px-4 py-3 rounded-md font-semibold transition-colors ${activePath.includes(item.name.toLowerCase()) || activePath === item.path ? 'bg-brand-cyan text-brand-bg' : 'text-brand-muted hover:bg-brand-card hover:text-brand-text'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            {item.name}
          </Link>
        ))}
        <div className="pt-4">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-card hover:bg-brand-border text-brand-text font-medium text-xs rounded border border-brand-border transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            New Module
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-brand-border/30 space-y-2">
        <Link href="/login" className="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-brand-muted hover:bg-brand-card hover:text-red-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </Link>
      </div>
    </aside>
  );
}