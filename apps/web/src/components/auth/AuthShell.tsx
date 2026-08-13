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
  benefits: AuthBenefit[];
  children: React.ReactNode;
}

export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-2.5 group">
      <span
        className={`relative ${className} overflow-hidden rounded-full border border-white/40 shadow-lg shadow-slate-950/50 transition-transform flex-shrink-0 group-hover:scale-105`}
      >
        <Image src="/logo.png" alt="NextRound logo" fill sizes="40px" className="scale-[1.3] object-cover" />
      </span>
      <span className="font-display text-2xl font-black tracking-tight text-white">
        Next<span className="text-orange-400">Round</span>
      </span>
    </Link>
  );
}

/**
 * Shared split-screen auth layout. A cinematic background video (`/bg.mp4`)
 * is layered behind a readability gradient, with drifting accent glows and a
 * focused glass form card on the right. Collapses to a stacked layout with a
 * compact brand header on mobile.
 */
export default function AuthShell({ eyebrow, headline, sub, benefits, children }: AuthShellProps) {
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
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/60" />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2,6,23,0.6)_100%)]" />

      {/* Drifting accent glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-orange-500/15 blur-[120px] motion-reduce:animate-none" />
        <div className="animate-drift-slow absolute -bottom-32 right-[-80px] h-[380px] w-[380px] rounded-full bg-emerald-500/10 blur-[120px] motion-reduce:animate-none" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Brand panel — desktop */}
          <section className="hidden lg:flex lg:min-h-[560px] lg:flex-col lg:justify-between">
            <div className="anim-fade-up">
              <BrandMark />
              <div className="mt-12 space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                  </span>
                  {eyebrow}
                </span>
                <h1 className="font-display text-4xl font-black leading-[1.08] tracking-tight text-white">
                  {headline}
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-slate-300">{sub}</p>
              </div>
            </div>

            <div className="space-y-8 anim-fade-up" style={{ animationDelay: '150ms' }}>
              <ul className="space-y-5">
                {benefits.map((benefit) => (
                  <li key={benefit.title} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/15 text-orange-300 shadow-lg shadow-orange-950/40">
                      <benefit.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-100">{benefit.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-bold text-slate-200">AI interview agents online</span>
              </div>
            </div>
          </section>

          {/* Form panel */}
          <section className="w-full lg:ml-auto lg:max-w-md">
            {/* Compact brand header — mobile only */}
            <div className="mb-8 flex flex-col items-center gap-4 text-center lg:hidden anim-fade-up">
              <BrandMark />
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-black tracking-tight text-white">{headline}</h1>
                <p className="text-sm text-slate-300">{sub}</p>
              </div>
            </div>

            <div
              className="relative rounded-3xl border border-white/15 bg-slate-950/50 p-6 shadow-2xl shadow-slate-950/80 ring-1 ring-white/10 backdrop-blur-2xl sm:p-8 anim-zoom-in motion-reduce:animate-none"
              style={{ animationDelay: '120ms' }}
            >
              {/* Top highlight hairline */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent"
              />
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
