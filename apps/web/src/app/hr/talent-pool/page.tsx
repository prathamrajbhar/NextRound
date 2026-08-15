'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTalentPool } from '@/hooks/queries';
import { JobsGridSkeleton } from '@/components/ui/Skeleton';
import { Search, ChevronRight, Users, Filter, Brain } from '@/lib/lucide-google-icons';

interface TalentCandidate {
  candidateId: string;
  applicationId: string | null;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  targetRoles: string[];
  resumeUrl: string | null;
  similarityScore: number | null;
  isBookmarked: boolean;
  bookmarkId: string | null;
  lastActive: string;
}

export default function HrTalentPoolPage() {
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(70);
  const [selectedSkill, setSelectedSkill] = useState<string>('All');

  const { data, isLoading } = useTalentPool(search);
  const candidates = (Array.isArray(data?.candidates) ? data.candidates : []) as unknown as TalentCandidate[];

  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  const allSkills = Array.from(
    new Set(safeCandidates.flatMap((c) => c.skills || []))
  ).sort();

  const filteredCandidates = safeCandidates.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const scoreMatch = c.similarityScore === null || c.similarityScore >= minScore;
    const skillMatch = selectedSkill === 'All' || c.skills.includes(selectedSkill);
    return nameMatch && scoreMatch && skillMatch;
  });

  const scoutHighMatchCount = safeCandidates.filter(
    (c) => c.similarityScore !== null && c.similarityScore >= 90,
  ).length;

  if (isLoading) {
    return <JobsGridSkeleton count={6} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
            HR Console
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Candidate Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Search candidate profiles, evaluation scorecards, and skill profiles across your hiring pipeline.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-100 dark:border-purple-900/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-start">
          <Brain className="h-9 w-9 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">AI Sourcing Scout Insights</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold max-w-2xl">
              {scoutHighMatchCount > 0
                ? <>Found <strong>{scoutHighMatchCount} {scoutHighMatchCount === 1 ? 'candidate' : 'candidates'}</strong> exceeding a 90% semantic match with the active job rubric. Profile scoring and semantic matching completed.</>
                : 'No candidates currently exceed a 90% semantic match. Publish jobs or sync profiles to source a stronger pool.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMinScore(90);
            setSelectedSkill('React');
          }}
          className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-4 py-2 text-[10px] font-black text-purple-700 dark:text-purple-300 shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-[1.01]"
        >
          Apply Scout Filters
        </button>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel grid grid-cols-1 sm:grid-cols-4 gap-4">

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
          >
            <option value="All" className="dark:bg-slate-900 dark:text-slate-200">All Skills</option>
            {allSkills.map((sk) => (
              <option key={sk} value={sk} className="dark:bg-slate-900 dark:text-slate-200">{sk}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
            <span>MIN SCORE</span>
            <span className="text-purple-600 dark:text-purple-400 font-extrabold">{minScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-purple-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCandidates.map((c) => (
            <div
              key={c.candidateId}
              className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/60 p-6 shadow-xl backdrop-blur-md glass-panel flex flex-col justify-between hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 group"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full border border-purple-100 dark:border-purple-900/60 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-sm">
                      <span className="text-white font-black text-sm">{c.name[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{c.name}</h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 block">{c.email}</span>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/40 glass-panel">
          <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">No matching candidates found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Try relaxing filters or widening search criteria.</p>
        </div>
      )}
    </div>
  );
}
