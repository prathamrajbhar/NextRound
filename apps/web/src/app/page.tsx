'use client';

import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { HeroSection } from './landing/HeroSection';
import { BentoGrid } from './landing/BentoGrid';
import { SavingsCalculator } from './landing/SavingsCalculator';
import { WorkflowSection } from './landing/WorkflowSection';
import { FaqSection } from './landing/FaqSection';

export default function LandingPage() {
  const { user } = useAuth();

  const hrHref = user ? (user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard') : '/signup?role=hr';
  const candidateHref = user ? (user.role === 'candidate' ? '/candidate/dashboard' : '/hr/dashboard') : '/signup?role=candidate';
  const isLoggedIn = !!user;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-955 transition-colors duration-300">
      <PublicNavbar />

      <main className="flex-grow flex flex-col items-center">
        {}
        <HeroSection hrHref={hrHref} candidateHref={candidateHref} isLoggedIn={isLoggedIn} />

        {}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full select-none">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center shadow-xs">
            <div>
              <span className="block text-4xl font-extrabold text-brand-600 dark:text-emerald-450">72 Hrs</span>
              <span className="mt-2 block text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Average Time-to-Hire</span>
            </div>
            <div className="border-y md:border-y-0 md:border-x border-slate-200/50 dark:border-slate-800/50 py-6 md:py-0">
              <span className="block text-4xl font-extrabold text-brand-600 dark:text-orange-400">Automated</span>
              <span className="mt-2 block text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Rubric Evaluations</span>
            </div>
            <div>
              <span className="block text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">SOC-2</span>
              <span className="mt-2 block text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Data Isolation & Security</span>
            </div>
          </div>
        </section>

        {}
        <BentoGrid />

        {}
        <SavingsCalculator />

        {}
        <WorkflowSection />

        {}
        <FaqSection />
      </main>

      <PublicFooter />
    </div>
  );
}
