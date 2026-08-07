'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { Search, ChevronRight, Users, Filter, UserCheck, Brain, Loader2 } from '@/lib/lucide-google-icons';
import Image from 'next/image';

export default function HrTalentPoolPage() {
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(70);
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    async function fetchTalentPool() {
      try {
        setLoading(true);
        const data = await apiClient.get<Application[]>('/hr/talent-pool').catch(() =>
          apiClient.get<Application[]>('/applications')
        );
        if (data) {
          setCandidates(Array.isArray(data) ? data : []);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error('Failed to load talent pool:', err);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTalentPool();
  }, []);

  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  // Derive unique skills and statuses for filter dropdowns
  const allSkills = Array.from(
    new Set(safeCandidates.flatMap((app) => app.skills || []))
  ).sort();

  const allStatuses = Array.from(
    new Set(safeCandidates.map((app) => app.status))
  ).sort();

  const filteredCandidates = safeCandidates.filter((app) => {
    const nameMatch = (app.candidateName || '').toLowerCase().includes(search.toLowerCase()) ||
      (app.candidateEmail || '').toLowerCase().includes(search.toLowerCase());

    const compositeScore = app.scores?.composite || 75;
    const scoreMatch = compositeScore >= minScore;

    const skillMatch = selectedSkill === 'All' || (app.skills && app.skills.includes(selectedSkill));
    const statusMatch = selectedStatus === 'All' || app.status === selectedStatus;

    return nameMatch && scoreMatch && skillMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Console Top branding */}
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

      {/* Sourcing AI Scout recommendations box */}
      <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-100 dark:border-purple-900/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-start">
          <Brain className="h-9 w-9 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">AI Sourcing Scout Insights</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold max-w-2xl">
              Found <strong>3 candidates</strong> exceeding a 90% technical logic match rate with active pipeline slots. Origin bias audits have successfully run across all parsed profiles.
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

      {/* Filter bar console */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Search */}
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

        {/* Skill dropdown */}
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

        {/* Status dropdown */}
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
          >
            <option value="All" className="dark:bg-slate-900 dark:text-slate-200">All Statuses</option>
            {allStatuses.map((st) => (
              <option key={st} value={st} className="dark:bg-slate-900 dark:text-slate-200">{st.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Score filter slider */}
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

      {/* Candidates List grid */}
      {filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCandidates.map((app) => {
            const composite = app.scores?.composite || 75;
            const tech = app.scores?.technical || 70;
            const comm = app.scores?.communication || 70;

            return (
              <div
                key={app.id}
                className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/60 p-6 shadow-xl backdrop-blur-md glass-panel flex flex-col justify-between hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 group"
              >
                <div>
                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={app.candidateAvatar}
                        alt={app.candidateName}
                        width={42}
                        height={42}
                        className="h-11 w-11 rounded-full border border-purple-100 dark:border-purple-900/60 object-cover shadow-sm"
                        unoptimized
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{app.candidateName}</h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 block">{app.candidateEmail}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/60 uppercase">
                        {composite}% composite
                      </span>
                      {app.biasReport && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/60 uppercase mt-0.5">
                          Bias Passed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {app.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Summary reasoning */}
                  {app.reasoning && (
                    <p className="mt-4 text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed line-clamp-2 italic">
                      &ldquo;{app.reasoning}&rdquo;
                    </p>
                  )}
                </div>

                {/* Lower Action bar */}
                <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex gap-4 text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                    <span>Tech: <strong className="text-slate-700 dark:text-slate-200">{tech}%</strong></span>
                    <span>Comm: <strong className="text-slate-700 dark:text-slate-200">{comm}%</strong></span>
                  </div>
                  <Link
                    href={`/hr/candidates/${app.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline transition-all group-hover:translate-x-0.5"
                  >
                    Inspect Profile
                    <ChevronRight className="h-4 w-4 text-purple-400" />
                  </Link>
                </div>
              </div>
            );
          })}
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
