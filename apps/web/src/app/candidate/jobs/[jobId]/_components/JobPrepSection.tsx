'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Sparkles, CheckCircle2, HelpCircle, Lightbulb } from '@/lib/lucide-google-icons';

interface PrepContentData {
  id?: string;
  companyName?: string;
  roleArchetype?: string;
  questions?: Array<{ category?: string; question?: string; dimension?: string; rationale?: string }>;
  cultureNotes?: string[];
  skillChecklist?: string[];
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
        const res = await apiClient.get<PrepContentData>(`/prep/jobs/${jobId}`);
        if (res) {
          setPrep(res);
        }
      } catch (err) {
        console.error('Failed to load job prep content:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrep();
  }, [jobId]);

  const questions = prep?.questions || [
    {
      dimension: 'System Architecture',
      question: `How would you architect a real-time event-driven system for ${companyName}'s ${roleTitle} workload?`,
      rationale: 'Tests deep knowledge of event buses (Kafka/RabbitMQ), partitioning strategies, and fault tolerance.',
    },
    {
      dimension: 'Problem Solving',
      question: 'Describe a time when you optimized a critical database query or state management flow under load.',
      rationale: 'Evaluates analytical profiling capabilities and execution performance mindset.',
    },
    {
      dimension: 'Communication & Culture',
      question: `Why ${companyName}, and how do you handle cross-functional tradeoffs between product velocity and engineering debt?`,
      rationale: 'Assesses cultural alignment, communication clarity, and ownership mindset.',
    },
  ];

  const cultureNotes = prep?.cultureNotes || [
    'Strong ownership & bias for action across technical initiatives.',
    'Emphasis on customer-first impact and scalable architecture.',
    'Data-driven decision making and transparent post-mortem reviews.',
  ];

  const skillChecklist = prep?.skillChecklist || [
    'Distributed Systems & Microservices',
    'High Throughput Caching (Redis/Memcached)',
    'Database Schema Optimization & Indexing',
    'Frontend State Management & React Virtualization',
  ];

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 mb-1">
            <Sparkles className="h-3 w-3 text-brand-600 dark:text-orange-400" /> AI Company Prep Library
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
            {companyName} Interview Guide &amp; Question Bank
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
          Updated dynamically
        </span>
      </div>

      {loading ? (
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-4 text-center">
          Loading company prep resources...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Practice Question Bank */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-brand-600 dark:text-orange-400" />
              Targeted Question Bank
            </h3>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-brand-100 dark:bg-orange-950 text-brand-700 dark:text-orange-300">
                      {q.dimension || 'Technical Round'}
                    </span>
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 font-display">
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

          {/* Culture Notes & Skill Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Culture Notes */}
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

            {/* Recommended Skills */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2.5">
              <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Core Skill Checklist
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
          </div>
        </div>
      )}
    </div>
  );
}
