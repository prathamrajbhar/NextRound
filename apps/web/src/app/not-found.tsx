import Link from 'next/link';
import { ArrowLeft, Search, Home, Briefcase, Sparkles, Compass } from '@/lib/lucide-google-icons';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-500/15 via-amber-500/10 to-transparent blur-[90px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />
      <div 
        className="absolute -bottom-32 right-1/4 w-[400px] h-[300px] bg-gradient-to-br from-blue-500/10 via-brand-500/5 to-transparent blur-[80px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      {/* Subtle Grid Backdrop */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" 
        aria-hidden="true"
      />

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-lg text-center rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-6 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          404 ERROR &bull; PAGE NOT FOUND
        </div>

        {/* 404 Typography */}
        <p className="font-mono text-7xl sm:text-9xl leading-none font-black tracking-tight bg-gradient-to-r from-brand-600 via-amber-500 to-amber-600 dark:from-brand-400 dark:via-amber-400 dark:to-amber-500 bg-clip-text text-transparent select-none drop-shadow-xs">
          404
        </p>

        {/* Heading & Subtext */}
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Lost in Space?
        </h1>
        <p className="mt-2.5 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or has taken an unexpected sabbatical.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-500 hover:to-amber-500 text-white px-5 py-3 text-xs sm:text-sm font-extrabold shadow-md shadow-brand-600/20 hover:shadow-brand-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/candidate/jobs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-5 py-3 text-xs sm:text-sm font-extrabold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xs"
          >
            <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Browse Jobs
          </Link>
        </div>

        {/* Quick Destinations Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Quick Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Home className="h-3.5 w-3.5 text-brand-500" />
              Dashboard
            </Link>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-500" />
              Opportunities
            </Link>
            <Link
              href="/candidate/mock/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              AI Mock Practice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

