'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn } from '@/lib/lucide-google-icons';

export function AptitudeErrorScreen({ error }: { error?: string | null }) {
  const router = useRouter();
  const isAuthError =
    error?.toLowerCase().includes('session') || error?.toLowerCase().includes('log in');

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center font-sans">
      <div className="p-8 rounded-3xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 shadow-xl max-w-md w-full space-y-5">
        <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isAuthError ? 'Session Expired' : 'Could Not Load Questions'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || 'No questions were returned by the server.'}
          </p>
        </div>
        {isAuthError ? (
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Log In Again
          </button>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
