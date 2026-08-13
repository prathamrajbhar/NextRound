'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, LayoutDashboard } from '@/lib/lucide-google-icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const dashboardPath = user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-955/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-900/80 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-10 w-10 rounded-full overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0 select-none border border-slate-200 dark:border-slate-750 shadow-2xs">
              <Image
                src="/logo.png"
                alt="NextRound Logo"
                fill
                sizes="40px"
                className="object-cover scale-[1.3]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
                Hire<span className="text-brand-600 dark:text-orange-400">OS</span>
              </span>
            </div>
          </Link>
        </div>

        {}
        <nav className="hidden md:flex items-center gap-3">
          {links.map((link) => {
            const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-extrabold transition-all px-3.5 py-1.5 rounded-xl border ${
                  isActive
                    ? 'text-brand-600 dark:text-orange-400 bg-brand-50/80 dark:bg-orange-950/40 border-brand-100/50 dark:border-orange-900/30 font-black'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-900/40'
                }`}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {}
        <div className="flex items-center gap-4">
          {}
          <ThemeToggle />

          {user ? (
            <Link
              href={dashboardPath}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-5.5 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-extrabold text-slate-650 dark:text-slate-300 hover:text-brand-600 dark:hover:text-orange-400 transition-colors px-4 py-3 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
              >
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-orange-600 hover:bg-slate-950 dark:hover:bg-orange-700 px-5.5 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
