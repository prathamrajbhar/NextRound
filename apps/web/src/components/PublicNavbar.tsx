'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  HelpCircle,
  LogIn,
  ArrowRight,
  Home,
  Mail,
  LayoutDashboard,
} from '@/lib/lucide-google-icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const dashboardPath = user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  const links = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About Us', path: '/about', icon: HelpCircle },
    { name: 'Pricing', path: '/pricing', icon: CreditCard },
    { name: 'Contact Us', path: '/contact', icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-full border border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/75 backdrop-blur-xl px-4 sm:px-6 py-2.5 shadow-xl shadow-slate-900/5 dark:shadow-slate-950/40 flex items-center justify-between transition-all duration-300">
          {/* Logo & AI Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 rounded-full overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0 select-none border border-slate-200 dark:border-slate-700 shadow-2xs">
                <Image
                  src="/logo.png"
                  alt="NextRound Logo"
                  fill
                  sizes="36px"
                  className="object-cover scale-[1.3]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
                  Hire<span className="text-brand-600 dark:text-orange-400">OS</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-xs font-extrabold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100/70 dark:hover:bg-slate-800/60 ${isActive
                      ? 'text-brand-600 dark:text-orange-400 bg-brand-50/80 dark:bg-orange-950/60 font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {user ? (
              <Link
                href={dashboardPath}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
