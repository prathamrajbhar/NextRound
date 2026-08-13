'use client';

import React from 'react';
import { Code, BookOpen, CheckCircle2, Sparkles } from '@/lib/lucide-google-icons';
import { CodingProblem } from './useCodingProblem';

export type CodingLeftTab = 'description' | 'editorial' | 'submissions';

interface CodingProblemPanelProps {
  problem: CodingProblem;
  activeTab: CodingLeftTab;
  onTabChange: (tab: CodingLeftTab) => void;
}

const TABS: { key: CodingLeftTab; label: string; icon: React.ElementType }[] = [
  { key: 'description', label: 'Description', icon: Code },
  { key: 'editorial', label: 'Editorial', icon: BookOpen },
  { key: 'submissions', label: 'Submissions', icon: CheckCircle2 },
];

export function CodingProblemPanel({ problem, activeTab, onTabChange }: CodingProblemPanelProps) {
  return (
    <div className="w-1/2 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
      <div className="h-10 px-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === key
                ? 'border-brand-600 dark:border-brand-500 text-slate-900 dark:text-slate-100 font-bold'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-500" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed">
        {activeTab === 'description' && (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-display">
                {problem.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold">
                <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-amber-500/10 text-brand-700 dark:text-amber-400 border border-brand-200 dark:border-amber-500/20 font-bold">
                  {problem.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  Target Time: {problem.expectedComplexity?.time ?? 'Not specified'}
                </span>
              </div>
            </div>

            <div className="whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
              {problem.description}
            </div>

            {problem.examples.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Examples:</h4>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <p><span className="text-slate-400 font-bold">Input: </span><span className="text-slate-800 dark:text-slate-200">{ex.input}</span></p>
                    <p><span className="text-slate-400 font-bold">Output: </span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.output}</span></p>
                    {ex.explanation && (
                      <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 pt-1">{ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Constraints:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {activeTab === 'editorial' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
              <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Optimal Solution Approach
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{problem.editorial}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Complexity</span>
              <div className="flex justify-between font-mono text-xs text-slate-800 dark:text-slate-200">
                <span>Time Complexity: <strong>{problem.expectedComplexity?.time ?? 'Not specified'}</strong></span>
                <span>Space Complexity: <strong>{problem.expectedComplexity?.space ?? 'Not specified'}</strong></span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">Submissions History</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Run or submit code to populate execution benchmarks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
