'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CandidateSidebar from '@/components/CandidateSidebar';
import { Bell, Menu, X } from '@/lib/lucide-google-icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import Image from 'next/image';

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [avatar, setAvatar] = useState('/avatar-girl.jpg');
  const [name, setName] = useState('Ananya Iyer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Mock practice evaluation report for Google Software Engineer is ready.', time: '5 mins ago', read: false },
    { id: 2, text: 'Vercel shortlisted your profile: interview scheduling requested.', time: '1 hour ago', read: false },
    { id: 3, text: 'Stripe screening agent: Resume logic tags matched 90%.', time: '2 hours ago', read: false },
    { id: 4, text: 'New Frontend Engineer position posted at Microsoft.', time: '3 hours ago', read: true },
    { id: 5, text: 'Evaluation feedback calibrated for Technical Logic: improved by 15%.', time: '5 hours ago', read: true }
  ]);

  useEffect(() => {
    // Load initial values from localStorage
    const savedAvatar = localStorage.getItem('candidate_avatar');
    const savedName = localStorage.getItem('candidate_name');
    setTimeout(() => {
      if (savedAvatar) setAvatar(savedAvatar);
      if (savedName) setName(savedName);
    }, 0);

    // Listen for storage updates
    const handleStorageChange = () => {
      const updatedAvatar = localStorage.getItem('candidate_avatar');
      const updatedName = localStorage.getItem('candidate_name');
      if (updatedAvatar) setAvatar(updatedAvatar);
      if (updatedName) setName(updatedName);
    };

    window.addEventListener('storage', handleStorageChange);
    // Listen for custom profile update event
    window.addEventListener('profile_update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile_update', handleStorageChange);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showNotifications]);

  const toggleRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 relative transition-colors duration-300">
      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/35 dark:bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <CandidateSidebar avatar={avatar} name={name} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/60 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 relative z-30 transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Trigger */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer md:hidden flex items-center justify-center"
            >
              {isSidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">Candidate Workspace</span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Dark Mode Toggle Button */}
            <ThemeToggle />

            {/* Notification Bell Button (Navigates directly to Notifications Page) */}
            <Link
              href="/candidate/notifications"
              className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all block"
              aria-label="View notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              )}
            </Link>

            {/* Candidate Avatar Info */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{name}</span>
              <Image
                src={avatar}
                alt="Candidate Avatar"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-emerald-100 dark:border-emerald-900/60 shadow-sm object-cover"
                unoptimized
              />
            </div>

          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
