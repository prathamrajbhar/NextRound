'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HrSidebar from '@/components/HrSidebar';
import { Bell, Menu, X } from '@/lib/lucide-google-icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Image from 'next/image';

import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';
import { getScopedStorage } from '@/lib/storage';

interface ApiNotification {
  id: string;
  title?: string;
  message: string;
  type?: string;
  read: boolean;
  created_at: string;
}

export default function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [avatar, setAvatar] = useState('/avatar-boy.jpg');
  const [name, setName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    
    setMounted(true);
    const savedAvatar = getScopedStorage(user?.id, 'hr_avatar');
    const savedName = getScopedStorage(user?.id, 'hr_name');
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setName(savedName);
  }, [user?.id]);

  const displayName = mounted ? (name || (user?.email ? user.email.split('@')[0] : 'Recruiter')) : 'Recruiter';

  
  const [notifications, setNotifications] = useState<{ id: number; rawId?: string; text: string; time: string; read: boolean }[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiClient.get<{ notifications: ApiNotification[] }>('/notifications')
      .then((res) => {
        if (isMounted && res && res.notifications) {
          const formatted = res.notifications.map((n, idx) => ({
            id: idx + 1,
            rawId: n.id,
            text: n.message || n.title || 'Notification alert',
            time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.read,
          }));
          setNotifications(formatted);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
      });

    const handleStorageChange = () => {
      const updatedAvatar = getScopedStorage(user?.id, 'hr_avatar');
      const updatedName = getScopedStorage(user?.id, 'hr_name');
      if (updatedAvatar) setAvatar(updatedAvatar);
      if (updatedName) setName(updatedName);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hr_profile_update', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hr_profile_update', handleStorageChange);
    };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const isInterviewRoom = pathname.includes('/hr/interview');

  if (isInterviewRoom) {
    return <div className="w-screen h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden font-sans">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 relative transition-colors duration-300">
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/35 dark:bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <HrSidebar avatar={avatar} name={displayName} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/60 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 relative z-30 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer md:hidden flex items-center justify-center"
            >
              {isSidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">Recruiter Workspace</span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />

            <Link
              href="/hr/notifications"
              className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all block"
              aria-label="View notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              )}
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{displayName}</span>
              <Image
                src={avatar}
                alt="Recruiter Avatar"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-orange-100 dark:border-orange-900/60 shadow-sm object-cover"
                unoptimized
              />
            </div>

          </div>
        </header>
        <main key={pathname} className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-200">{children}</main>
      </div>
    </div>
  );
}
