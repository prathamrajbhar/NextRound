'use client';

import React from 'react';

interface CandidateDigestCadenceCardProps {
  digestFrequency: string;
  setDigestFrequency: (val: string) => void;
}

const DIGEST_FREQUENCIES = ['Realtime', 'Daily', 'Weekly'];

export function CandidateDigestCadenceCard({
  digestFrequency,
  setDigestFrequency,
}: CandidateDigestCadenceCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Digest Cadence</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          How frequently should we bundle non-urgent match alerts?
        </p>
      </div>

      <div className="flex gap-2">
        {DIGEST_FREQUENCIES.map((freq) => (
          <button
            key={freq}
            type="button"
            onClick={() => setDigestFrequency(freq)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              digestFrequency === freq
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
            }`}
          >
            {freq}
          </button>
        ))}
      </div>
    </div>
  );
}
