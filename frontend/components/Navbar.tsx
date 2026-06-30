"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar({ showLinks = true, showAuth = true }: { showLinks?: boolean, showAuth?: boolean }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  return (
    <nav className="relative flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto text-sm">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
        NetMaster
      </Link>
      
      {showLinks && (
        <div className="hidden md:flex items-center gap-8 font-medium text-brand-text md:absolute md:left-1/2 md:-translate-x-1/2">
          <Link href="/curriculum" className="hover:text-brand-cyan transition-colors">Curriculum</Link>
          <Link href="/leaderboard" className="hover:text-brand-cyan transition-colors">Leaderboard</Link>
          <Link href="/labs" className="hover:text-brand-cyan transition-colors">Labs</Link>
          <Link href="/certification" className="hover:text-brand-cyan transition-colors">Certification</Link>
          <Link href="/about" className="hover:text-brand-cyan transition-colors">About</Link>
        </div>
      )}

      {showAuth && (
        <div className="flex items-center gap-6 font-medium">
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
          <Link href="/login" className="hover:text-brand-cyan transition-colors">Login</Link>
          <Link href="/register" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg px-5 py-2 rounded font-semibold transition-colors">
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}