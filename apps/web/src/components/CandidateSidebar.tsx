'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Mic,
  FileText,
  User,
  Settings,
  LogOut
} from '@/lib/lucide-google-icons';

import { useAuthContext } from '@/contexts/AuthContext';

interface CandidateSidebarProps {
  avatar?: string;
  name?: string;
}

export default function CandidateSidebar({ avatar = '/avatar-girl.jpg', name = 'Candidate User' }: CandidateSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthContext();

  const menuGroups = [
    {
      title: 'Menu',
      items: [
        { name: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
        { name: 'Jobs', path: '/candidate/jobs', icon: Compass },
        { name: 'Applications', path: '/candidate/applications', icon: Briefcase },
      ],
    },
    {
      title: 'Prep',
      items: [
        { name: 'Mock Interview', path: '/candidate/mock/new', icon: Mic },
        { name: 'AI Resume Builder', path: '/candidate/resume-builder', icon: FileText },
      ],
    },
    {
      title: 'Account',
      items: [
        { name: 'Profile', path: '/candidate/profile', icon: User },
        { name: 'Settings', path: '/candidate/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-white/60 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md flex flex-col p-4 h-screen transition-colors duration-300">
      {}
      <div className="mb-6 px-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-full overflow-hidden group-hover:scale-105 transition-transform duration-200 flex-shrink-0 select-none">
            <Image
              src="/logo.png"
              alt="NextRound Logo"
              fill
              sizes="36px"
              className="object-cover scale-[1.3]"
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100">
            Hire<span className="text-success-600 dark:text-emerald-400 bg-gradient-to-r from-success-600 to-brand-600 dark:from-emerald-400 dark:to-orange-400 bg-clip-text text-transparent">OS</span>
          </span>
        </Link>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-widest uppercase block mt-1 ml-11 select-none">
          Candidate Portal
        </span>
      </div>

      {}
      <nav className="flex-grow space-y-5">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <span className="px-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block select-none">
              {group.title}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                
                const isActive = pathname === item.path ||
                  (item.path !== '/candidate/dashboard' && pathname.startsWith(item.path)) ||
                  (item.path === '/candidate/mock/new' && pathname.startsWith('/candidate/mock'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={true}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border-l-2 duration-200 select-none ${isActive
                      ? 'bg-emerald-600/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-600 dark:border-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ease-out group-hover:scale-110 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {}
      <div className="mt-auto space-y-4 pt-4 border-t border-slate-100/60 dark:border-slate-800/80">
        {}
        <div className="flex items-center justify-between p-2 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/70 transition-colors duration-250">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <Image
                src={avatar}
                alt={name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-sm object-cover"
                unoptimized
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{name}</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Software Applicant</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 transition-colors duration-200 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
