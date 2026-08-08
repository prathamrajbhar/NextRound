'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Sparkles, CheckCircle2, HelpCircle, Lightbulb, ArrowRight, Bot } from '@/lib/lucide-google-icons';

interface PrepQuestion {
  category?: string;
  question?: string;
  dimension?: string;
  rationale?: string;
}

interface PrepContentData {
  id?: string;
  companyName?: string;
  roleArchetype?: string;
  questions?: PrepQuestion[];
  cultureNotes?: string[];
  culture_notes?: string[];
  skillChecklist?: string[];
  skill_checklist?: string[];
}

interface ApiResponsePrep {
  job?: unknown;
  prepContent?: PrepContentData | null;
}

interface JobPrepSectionProps {
  jobId: string;
  companyName: string;
  roleTitle: string;
}

export function JobPrepSection({ jobId, companyName, roleTitle }: JobPrepSectionProps) {
  const [prep, setPrep] = useState<PrepContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrep() {
      try {
        setLoading(true);
        const res = await apiClient.get<ApiResponsePrep & PrepContentData>(`/prep/jobs/${jobId}`);
        if (res) {
          const content = res.prepContent !== undefined ? res.prepContent : res;
          setPrep(content);
        }
      } catch (err) {
        console.error('Failed to load job prep content:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrep();
  }, [jobId]);

  const rawQuestions = prep?.questions || [];
  const cultureNotes = prep?.cultureNotes || prep?.culture_notes || [];
  const skillChecklist = prep?.skillChecklist || prep?.skill_checklist || [];

  const hasPrepData = rawQuestions.length > 0 || cultureNotes.length > 0 || skillChecklist.length > 0;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 mb-1.5">
            <Sparkles className="h-3 w-3 text-brand-600 dark:text-orange-400" /> AI Prep Studio
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
            {companyName} Interview &amp; Evaluation Prep
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
          Dynamic AI Content
        </span>
      </div>

      {loading ? (
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-6 text-center animate-pulse">
          Loading company prep guidelines...
        </div>
      ) : hasPrepData ? (
        <div className="space-y-6">
          {/* Dynamic Questions */}
          {rawQuestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-brand-600 dark:text-orange-400" />
                Targeted AI Questions
              </h3>
              <div className="space-y-3">
                {rawQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-brand-100 dark:bg-orange-950 text-brand-700 dark:text-orange-300">
                        {q.dimension || q.category || 'Interview Focus'}
                      </span>
                    </div>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 font-display leading-relaxed">
                      {q.question}
                    </p>
                    {q.rationale && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">
                        Insight: {q.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Culture & Skills */}
          {(cultureNotes.length > 0 || skillChecklist.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cultureNotes.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-indigo-500" />
                    Culture &amp; Evaluation Focus
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {cultureNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skillChecklist.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Core Skill Focus
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {skillChecklist.map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Clean Dynamic Placeholder (NO hardcoded fake questions!) */
        <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-3.5">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Dynamic AI Mock Evaluation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed font-medium">
              Questions and evaluation criteria are dynamically generated by our AI agent specifically for your application and experience level during mock sessions.
            </p>
          </div>

          <Link
            href={`/candidate/mock/new?company=${encodeURIComponent(companyName)}&role=${encodeURIComponent(roleTitle)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold px-5 py-2.5 text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Start Dynamic Mock Interview</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
