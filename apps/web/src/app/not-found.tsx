'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from '@/lib/lucide-google-icons';
import { LottiePlayer } from '@/components/ui/LottiePlayer';

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#faf9f6] text-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-lime-100 selection:text-slate-900">

      {}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-lime-200/40 via-emerald-100/30 to-transparent blur-[110px] pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-1/3 w-[450px] h-[300px] bg-gradient-to-br from-amber-100/30 via-lime-200/20 to-transparent blur-[110px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none opacity-50"
        aria-hidden="true"
      />

      {}
      <main className="relative z-10 w-full max-w-md text-center rounded-3xl border border-slate-200/90 bg-white backdrop-blur-2xl p-8 sm:p-12 shadow-2xl shadow-slate-200/60 my-auto">

        {}
        <div className="w-56 h-56 mx-auto -mt-2 mb-2 relative flex items-center justify-center">
          <LottiePlayer
            src="/404-animation.json"
            className="w-full h-full"
          />
        </div>

        {}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2.5">
          Page Not Found
        </h1>

        {}
        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xs mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist, was removed, or is no longer available.
        </p>

        {}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-xs sm:text-sm font-extrabold shadow-lg shadow-slate-900/15 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/candidate/jobs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 text-xs sm:text-sm font-extrabold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xs"
          >
            <Search className="h-4 w-4 text-slate-500" />
            Browse Jobs
          </Link>
        </div>

      </main>
    </div>
  );
}
