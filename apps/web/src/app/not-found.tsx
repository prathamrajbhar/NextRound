'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Home, 
  Briefcase, 
  Sparkles, 
  ArrowRight,
  Compass
} from '@/lib/lucide-google-icons';
import { LottiePlayer } from '@/components/ui/LottiePlayer';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/candidate/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/candidate/jobs');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Soft Ambient Light Glows (Warm Gold & Mint) */}
      <div 
        className="absolute -top-40 left-1/4 w-[650px] h-[450px] bg-gradient-to-tr from-amber-200/30 via-lime-200/20 to-transparent blur-[120px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />
      <div 
        className="absolute -bottom-40 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-lime-200/25 via-amber-200/20 to-transparent blur-[120px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      {/* Modern Light Architectural Grid Backdrop */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none opacity-60" 
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Hire<span className="text-amber-600">OS</span>
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-extrabold tracking-wide uppercase shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Page Not Found &bull; 404
        </div>
      </header>

      {/* Main SaaS Unique Split Card Container */}
      <main className="relative z-10 w-full max-w-6xl my-auto py-8">
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl shadow-slate-200/70 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Lottie Illustration & Visual Halo */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Soft Circular Halo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/60 via-lime-100/40 to-slate-50 rounded-full blur-xl transform scale-95" />
              <LottiePlayer 
                src="/404-animation.json" 
                className="w-full h-full relative z-10 drop-shadow-xs"
              />
            </div>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-2">
              Error Code: HTTP 404
            </p>
          </div>

          {/* Right Column: Interactive Content & Navigation */}
          <div className="lg:col-span-7 flex flex-col text-left">
            
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold mb-3">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Navigation Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Looking for something specific?
            </h1>

            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
              The page you are trying to reach doesn&apos;t exist or might have been relocated. Search our platform below or jump directly to key areas.
            </p>

            {/* Unique Feature: Live Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="mb-8 w-full max-w-xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, interview practice, candidate profiles..."
                  className="w-full pl-11 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3.5 text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
              <Link
                href="/candidate/jobs"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 text-sm font-extrabold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xs"
              >
                <Briefcase className="h-4 w-4 text-amber-600" />
                Browse Open Roles
              </Link>
            </div>

            {/* Quick SaaS Destinations Grid */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Quick Portal Links
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  href="/"
                  className="group flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Home className="w-4 h-4 text-amber-600" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Home Base</span>
                  <span className="text-[11px] text-slate-500">Main overview</span>
                </Link>

                <Link
                  href="/candidate/jobs"
                  className="group flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Job Board</span>
                  <span className="text-[11px] text-slate-500">Find new roles</span>
                </Link>

                <Link
                  href="/candidate/mock/new"
                  className="group flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">AI Mock Studio</span>
                  <span className="text-[11px] text-slate-500">Interview practice</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4">
        <p className="text-xs font-semibold text-slate-400">
          HireOS &bull; AI-Powered Hiring & Interview Platform
        </p>
      </footer>
    </div>
  );
}
