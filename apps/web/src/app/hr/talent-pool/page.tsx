'use client';

import React, { useState } from 'react';
import { useTalentPool } from '@/hooks/queries';
import { JobsGridSkeleton } from '@/components/ui/Skeleton';
import { Users } from '@/lib/lucide-google-icons';
import { TalentCandidate } from './_components/talentPool.types';
import { TalentScoutBanner } from './_components/TalentScoutBanner';
import { TalentPoolFilters } from './_components/TalentPoolFilters';
import { TalentCandidateCard } from './_components/TalentCandidateCard';

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
    const nameMatch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const scoreMatch = c.similarityScore === null || c.similarityScore >= minScore;
    const skillMatch = selectedSkill === 'All' || c.skills.includes(selectedSkill);
    return nameMatch && scoreMatch && skillMatch;
  });

  const scoutHighMatchCount = safeCandidates.filter(
    (c) => c.similarityScore !== null && c.similarityScore >= 90
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Candidate Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Search candidate profiles, evaluation scorecards, and skill profiles across your hiring pipeline.
          </p>
        </div>
      </div>

      <TalentScoutBanner
        scoutHighMatchCount={scoutHighMatchCount}
        onApplyFilters={() => {
          setMinScore(90);
          setSelectedSkill('React');
        }}
      />

      <TalentPoolFilters
        search={search}
        setSearch={setSearch}
        selectedSkill={selectedSkill}
        setSelectedSkill={setSelectedSkill}
        minScore={minScore}
        setMinScore={setMinScore}
        allSkills={allSkills}
      />

      {filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCandidates.map((c) => (
            <TalentCandidateCard key={c.candidateId} candidate={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/40 glass-panel">
          <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">
            No matching candidates found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Try relaxing filters or widening search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
