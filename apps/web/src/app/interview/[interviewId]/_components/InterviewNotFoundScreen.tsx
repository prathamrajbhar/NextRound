'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export function InterviewNotFoundScreen() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-3">
        <h1 className="text-lg font-extrabold text-white font-display">Interview Not Found</h1>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          We couldn&apos;t load this interview. Please go back and try again.
        </p>
        <button
          type="button"
          onClick={() => router.push('/candidate/dashboard')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
