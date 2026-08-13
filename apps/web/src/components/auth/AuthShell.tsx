'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type AuthIcon = React.ComponentType<{ className?: string }>;

export interface AuthBenefit {
  icon: AuthIcon;
  title: string;
  description: string;
}

interface AuthShellProps {
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
  benefits: AuthBenefit[]; // Kept for interface compatibility, but simplified out of visual centered view
  children: React.ReactNode;
}

export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-3 group">
      <span
        className={`relative ${className} overflow-hidden rounded-full border border-white/20 shadow-lg shadow-slate-950/50 transition-transform flex-shrink-0 group-hover:scale-105`}
      >
        <Image src="/logo.png" alt="NextRound logo" fill sizes="40px" className="scale-[1.3] object-cover" />
      </span>
      <span className="font-display text-2xl font-black tracking-tight text-white">
        Hire<span className="text-brand-600 dark:text-orange-400">OS</span>
      </span>
    </Link>
  );
}

export default function AuthShell({ eyebrow, headline, sub, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      {/* Cinematic background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="pointer-events-none fixed inset-0 h-full w-full object-cover contrast-[1.05] saturate-[1.15]"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Readability overlays */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-slate-955/80 dark:bg-slate-955/90" />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2,6,23,0.75)_100%)]" />

      {/* Drifting accent glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[120px] motion-reduce:animate-none" />
        <div className="animate-drift-slow absolute -bottom-32 right-[-80px] h-[380px] w-[380px] rounded-full bg-emerald-500/5 blur-[120px] motion-reduce:animate-none" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-grow flex-col justify-center px-4 py-16 sm:px-6">
        {/* Brand header centered */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center anim-fade-up">
          <BrandMark />
          <div className="space-y-3 pt-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-slate-300 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              {eyebrow}
            </span>
            <h1 className="font-display text-2xl font-black tracking-tight text-white leading-tight">
              {headline}
            </h1>
            <p className="text-sm font-medium text-slate-400 max-w-sm">
              {sub}
            </p>
          </div>
        </div>

        {/* Centered Glassmorphic Form Card */}
        <div
          className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/80 ring-1 ring-white/5 backdrop-blur-2xl sm:p-8 anim-zoom-in motion-reduce:animate-none"
        >
          {/* Top highlight hairline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent"
          />
          {children}
        </div>
      </main>
    </div>
  );
}
