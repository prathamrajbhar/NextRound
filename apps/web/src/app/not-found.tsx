'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from '@/lib/lucide-google-icons';
import { LottiePlayer } from '@/components/ui/LottiePlayer';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[#faf9f6] text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Soft Ambient Light Glow */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-amber-200/30 via-lime-200/20 to-transparent blur-[100px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      {/* Subtle Dot Grid Backdrop */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none opacity-60" 
        aria-hidden="true"
      />

      {/* Clean Single Card Container */}
      <main className="relative z-10 w-full max-w-md text-center rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-8 sm:p-12 shadow-xl shadow-slate-200/60">
        
        {/* Centered Lottie Illustration */}
        <div className="w-56 h-56 mx-auto -mt-2 mb-2 relative flex items-center justify-center">
          <LottiePlayer 
            src="/404-animation.json" 
            className="w-full h-full"
          />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2.5">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xs mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist, was removed, or is no longer available.
        </p>

        {/* Clean Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-3 text-xs sm:text-sm font-extrabold shadow-md shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/candidate/jobs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 px-5 py-3 text-xs sm:text-sm font-extrabold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xs"
          >
            <Search className="h-4 w-4 text-slate-500" />
            Browse Jobs
          </Link>
        </div>

      </main>
    </div>
  );
}
