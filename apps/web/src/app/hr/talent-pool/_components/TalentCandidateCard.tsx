'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from '@/lib/lucide-google-icons';
import { TalentCandidate } from './talentPool.types';

interface TalentCandidateCardProps {
  candidate: TalentCandidate;
}

export function TalentCandidateCard({ candidate: c }: TalentCandidateCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/60 p-6 shadow-xl backdrop-blur-md glass-panel flex flex-col justify-between hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 group">
      <div>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full border border-purple-100 dark:border-purple-900/60 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">{c.name[0]?.toUpperCase() || '?'}</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{c.name}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 block">
                {c.email}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/60 uppercase">
              {c.similarityScore !== null ? `${c.similarityScore}% match` : 'Not scored'}
            </span>
            {c.isBookmarked && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/60 uppercase mt-0.5">
                Bookmarked
              </span>
            )}
          </div>
        </div>

        {c.targetRoles.length > 0 && (
          <p className="mt-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Targeting: {c.targetRoles.slice(0, 2).join(', ')}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {c.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
          Last active: {new Date(c.lastActive).toLocaleDateString()}
        </span>
        <Link
          href={`/hr/candidates/${c.applicationId ?? c.candidateId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline transition-all group-hover:translate-x-0.5"
        >
          Inspect Profile
          <ChevronRight className="h-4 w-4 text-purple-400" />
        </Link>
      </div>
    </div>
  );
}
