"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { StudentProfile } from '@/utils/competencies';

export default function Sidebar({ activePath }: { activePath: string }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentUserStatus, setCurrentUserStatus] = useState<string>("pending");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check initial preference on mount from localStorage
    const storedTheme = localStorage.getItem('theme');
    Promise.resolve().then(() => {
      if (storedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.add('light-mode');
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.remove('light-mode');
      }
    });

    const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
    Promise.resolve().then(() => {
      setIsCollapsed(collapsed);
    });
    if (collapsed) {
      document.documentElement.classList.add("sidebar-collapsed");
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
      document.body.classList.remove("sidebar-collapsed");
    }

    const timer = setTimeout(() => {
      setIsMounted(true);
      document.body.classList.remove("preload");
    }, 50);

    // Load user identity
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    Promise.resolve().then(() => {
      if (savedName) setUserName(savedName);
      if (savedRole) setUserRole(savedRole);
    });

    // Load profile pic
    const savedPic = localStorage.getItem('profilePic');
    Promise.resolve().then(() => {
      if (savedPic) setProfilePic(savedPic);
    });

    // Listen for updates
    const handlePicUpdate = () => {
      const pic = localStorage.getItem('profilePic');
      Promise.resolve().then(() => {
        setProfilePic(pic);
      });
    };
    window.addEventListener("profilePicUpdated", handlePicUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("profilePicUpdated", handlePicUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const email = localStorage.getItem("userEmail") || "";
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
          // 1. Pending count for Professor/Admin
          const pending = data.users.filter(
            (u: { role: string; status?: string }) => u.role === "Student" && (u.status === "pending" || !u.status)
          );
          setPendingCount(pending.length);

          // 2. Current user's status for access locking
          const currentUser = data.users.find(
            (u: StudentProfile) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (currentUser) {
            setCurrentUserStatus(currentUser.status || "pending");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchUsersData();

    window.addEventListener("studentsUpdated", fetchUsersData);
    window.addEventListener("profileUpdated", fetchUsersData);
    return () => {
      window.removeEventListener("studentsUpdated", fetchUsersData);
      window.removeEventListener("profileUpdated", fetchUsersData);
    };
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

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem("sidebar-collapsed", String(nextCollapsed));
    if (nextCollapsed) {
      document.documentElement.classList.add("sidebar-collapsed");
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
      document.body.classList.remove("sidebar-collapsed");
    }
    window.dispatchEvent(new Event("sidebarToggle"));
  };

  const getDashboardPath = () => {
    if (activePath.includes('/admin')) return '/admin/dashboard';
    if (activePath.includes('/student')) return '/student';
    if (activePath.includes('/professor')) return '/professor';
    return '/dashboard';
  };

  const getMenuItems = () => {
    if (activePath.includes('/admin')) {
      return [
        { name: 'Dashboard', path: getDashboardPath(), icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
        { name: 'User Management', path: '/admin', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></> },
        { name: 'Discussion', path: '/admin/discussion', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> }
      ];
    }

    if (activePath.includes('/professor')) {
      return [
        { name: 'Dashboard', path: getDashboardPath(), icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
        { name: 'Modules', path: '/professor/modules', icon: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></> },
        { name: 'Students', path: '/professor/students', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
        { name: 'Analytics', path: '/professor/analytics', icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
        { name: 'PT Labs', path: '/professor/labs', icon: <><rect width="14" height="14" x="5" y="5" rx="2" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></> },
        { name: 'Leaderboard', path: '/professor/leaderboard', icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></> },
        { name: 'Badges', path: '/professor/badges', icon: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></> },
        { name: 'Discussion', path: '/professor/discussion', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
        { name: 'Settings', path: '/professor/settings', icon: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></> }
      ];
    }

    // Default: Student Sidebar
    return [
      { name: 'Dashboard', path: getDashboardPath(), icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
      { name: 'Subjects', path: '/student/curriculum', icon: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /> },
      { name: 'Competencies', path: '/student/competencies', icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v20"/><path d="M2 12h20"/></> },
      { name: 'Leaderboard', path: '/student/leaderboard', icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></> },
      { name: 'Simulation Lab', path: '/student/simulation', icon: <><rect width="8" height="8" x="8" y="2" rx="2" /><rect width="8" height="8" x="2" y="14" rx="2" /><rect width="8" height="8" x="14" y="14" rx="2" /><path d="M12 10v4" /><path d="M12 14H6v2" /><path d="M12 14h6v2" /></> },
      { name: 'PT Labs', path: '/student/labs', icon: <><rect width="14" height="14" x="5" y="5" rx="2" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></> },
      { name: 'Quiz Mode', path: '/student/quizzes', icon: <><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></> },
      { name: 'Discussion', path: '/student/discussion', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
      { name: 'Achievements', path: '/student/achievements', icon: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></> },
      { name: 'Settings', path: '/student/settings', icon: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></> }
    ];
  };

  return (
    <aside className={`bg-brand-bg border-r border-brand-border h-screen flex flex-col fixed left-0 top-0 text-sm overflow-hidden z-50 ${
      isMounted ? 'transition-all duration-300' : ''
    } ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`pb-3 border-b border-brand-border/30 flex flex-col gap-3 ${
        isMounted ? 'transition-all duration-300' : ''
      } ${
        isCollapsed ? 'p-4 px-0 items-center' : 'p-4 items-stretch'
      }`}>
        <div className={`flex items-center text-xl font-bold tracking-tight text-brand-text w-full overflow-hidden ${
          isCollapsed ? 'justify-center' : 'justify-between gap-2'
        }`}>
          <div className={`flex items-center shrink-0 ${
            isCollapsed ? 'gap-0' : 'gap-2'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan shrink-0"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            <span className={`origin-left whitespace-nowrap overflow-hidden ${
              isMounted ? 'transition-all duration-300' : ''
            } ${
              isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[150px]'
            }`}>
              NetMaster
            </span>
          </div>
          
          <div className={`flex items-center gap-1 shrink-0 overflow-hidden ${
            isMounted ? 'transition-all duration-300' : ''
          } ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[100px]'
          }`}>
            <button 
              type="button"
              onClick={toggleTheme} 
              className="p-1.5 rounded-md hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
            <button 
              type="button"
              onClick={toggleCollapse} 
              className="p-1.5 rounded-md hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        {/* Collapsed actions panel (fades in and expands when collapsed) */}
        <div className={`overflow-hidden flex flex-col items-center gap-1.5 w-full border-brand-border/20 ${
          isMounted ? 'transition-all duration-300' : ''
        } ${
          isCollapsed 
            ? 'opacity-100 max-h-20 border-t pt-2 mt-1' 
            : 'opacity-0 max-h-0 pointer-events-none'
        }`}>
          <button 
            type="button"
            onClick={toggleTheme} 
            className="p-2 rounded-md hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors cursor-pointer w-8 h-8 flex items-center justify-center animate-fadeIn"
            title="Toggle Theme"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
          <button 
            type="button"
            onClick={toggleCollapse} 
            className="p-2 rounded-md hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors cursor-pointer w-8 h-8 flex items-center justify-center animate-fadeIn"
            title="Expand Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className={`overflow-hidden whitespace-nowrap text-[10px] text-brand-muted tracking-wide mb-1 select-none origin-left ${
          isMounted ? 'transition-all duration-300' : ''
        } ${
          isCollapsed ? 'opacity-0 max-h-0 pointer-events-none' : 'opacity-100 max-h-4'
        }`}>
          Elite Networking
        </div>
        
        {(activePath.includes(`/${userRole?.toLowerCase() || 'student'}`) || activePath.includes('/student') || activePath.includes('/professor')) && (
          <div className={`flex items-center p-2 rounded-md w-full overflow-hidden ${
            isMounted ? 'transition-all duration-300' : ''
          } ${
            isCollapsed 
              ? 'bg-transparent border-transparent justify-center' 
              : 'bg-brand-card border border-brand-border gap-2.5 justify-start'
          }`}>
            <div className={`w-8 h-8 overflow-hidden shrink-0 bg-brand-bg flex items-center justify-center ${
              isMounted ? 'transition-all duration-300' : ''
            } ${
              isCollapsed ? 'rounded-full border border-brand-cyan shadow-md' : 'rounded border border-brand-border'
            }`}>
              {profilePic ? (
                <img id="sidebar-profile-pic" src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-brand-muted to-brand-cyan/20"></div>
              )}
            </div>
            <div className={`flex flex-col min-w-0 origin-left ${
              isMounted ? 'transition-all duration-300' : ''
            } ${
              isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[120px]'
            }`}>
              <div className="font-bold text-xs truncate whitespace-nowrap" title={userName}>{userName}</div>
              <div className="text-[9px] font-medium text-brand-cyan uppercase tracking-wider whitespace-nowrap">{userRole || "Student"}</div>
            </div>
          </div>
        )}
      </div>
      
      <nav className={`flex-1 py-4 space-y-1 ${
        isMounted ? 'transition-all duration-300' : ''
      } ${isCollapsed ? 'flex flex-col items-center w-full px-0' : 'px-3'}`}>
        {getMenuItems().map((item) => {
          const isActive = 
            activePath === item.path ||
            activePath.includes(item.name.toLowerCase()) ||
            (item.name === 'Subjects' && activePath.includes('/student/curriculum'));
          
          const showBadge = (item.name === 'Students' && pendingCount > 0) || 
                            (item.name === 'User Management' && pendingCount > 0);

          const isStudent = userRole === "Student";
          const isApproved = currentUserStatus === "admitted";
          const isRestricted = isStudent && !isApproved && 
                               (item.name === 'Subjects' || 
                                item.name === 'Discussion' || 
                                item.name === 'Achievements' ||
                                item.name === 'Leaderboard' ||
                                item.name === 'Simulation Lab' ||
                                item.name === 'Quiz Mode');
          
          return (
            <Link 
              key={item.name} 
              href={isRestricted ? "#" : item.path} 
              title={isCollapsed ? item.name : undefined}
              onClick={(e) => {
                if (isRestricted) {
                  e.preventDefault();
                  alert("This section is locked until your registration is approved by the professor.");
                }
              }}
              className={`flex items-center rounded-md font-semibold relative ${
                isMounted ? 'transition-all duration-300' : ''
              } ${
                isCollapsed ? 'p-2 justify-center w-10 h-10 mx-auto' : 'px-3 py-2 w-full justify-between'
              } ${
                isRestricted 
                  ? 'opacity-40 cursor-not-allowed text-brand-muted hover:bg-transparent' 
                  : isActive 
                    ? 'bg-brand-cyan text-brand-bg' 
                    : 'text-brand-muted hover:bg-brand-card hover:text-brand-text'
              }`}
            >
              <div className={`flex items-center min-w-0 ${
                isMounted ? 'transition-all duration-300' : ''
              } ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  {item.icon}
                </svg>
                <span className={`origin-left whitespace-nowrap overflow-hidden ${
                  isMounted ? 'transition-all duration-300' : ''
                } ${
                  isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[150px]'
                }`}>
                  {item.name}
                </span>
              </div>
              <div className={`overflow-hidden flex items-center justify-center shrink-0 ${
                isMounted ? 'transition-all duration-300' : ''
              } ${
                isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[50px]'
              }`}>
                {isRestricted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                ) : showBadge ? (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${isActive ? 'bg-brand-bg text-brand-cyan font-extrabold' : 'bg-red-500 text-white animate-pulse'}`}>
                    {pendingCount}
                  </span>
                ) : null}
              </div>
              {isCollapsed && showBadge && !isRestricted && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-brand-bg animate-pulse animate-fadeIn" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-brand-border/30 flex flex-col items-center w-full">
        <Link 
          href="/login" 
          title={isCollapsed ? "Sign Out" : undefined}
          className={`flex items-center rounded-md font-medium text-brand-muted hover:bg-brand-card hover:text-red-400 ${
            isMounted ? 'transition-all duration-300' : ''
          } ${
            isCollapsed ? 'p-2 justify-center w-10 h-10 mx-auto gap-0' : 'gap-3 px-3 py-1.5 w-full'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span className={`origin-left whitespace-nowrap overflow-hidden ${
            isMounted ? 'transition-all duration-300' : ''
          } ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[150px]'
          }`}>
            Sign Out
          </span>
        </Link>
      </div>
    </aside>
  );
}