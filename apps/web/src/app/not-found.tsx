import Link from 'next/link';
import { ArrowLeft, Search } from '@/lib/lucide-google-icons';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[64px] leading-none font-black text-slate-200 dark:text-slate-800 tracking-tight select-none">
          404
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          This page went missing
        </h1>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or is no longer available.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/80 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            Browse Opportunities
          </Link>
        </div>
      </div>
    </div>
  );
}
