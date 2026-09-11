'use client';

import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { Sparkles } from '@/lib/lucide-google-icons';
import { ContactFormCard } from './_components/ContactFormCard';
import { ContactChannelsCard } from './_components/ContactChannelsCard';
import { ContactFaqSection } from './_components/ContactFaqSection';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-1 w-full animate-in fade-in duration-300">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3" />
            Connect With NextRound
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-3 font-display">
            Let&apos;s Build Your AI Hiring Pipeline
          </h1>

          <p className="mt-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Have questions about enterprise sales, AI voice screening, or candidate practice? Schedule a demo or send us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto mb-20">
          <ContactFormCard />
          <ContactChannelsCard />
        </div>

        <ContactFaqSection />
      </main>

      <PublicFooter />
    </div>
  );
}
