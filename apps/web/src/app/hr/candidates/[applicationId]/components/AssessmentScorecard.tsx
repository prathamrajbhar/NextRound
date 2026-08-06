'use client';

import React, { useState } from 'react';
import { ClipboardCheck, ChevronDown } from '@/lib/lucide-google-icons';

interface AssessmentData {
  overallScore?: number;
  mcqScore?: number;
  mcqCorrectCount?: number;
  mcqTotalCount?: number;
  codeScore?: number;
  codingScore?: number;
  selectedLanguage?: string;
  codePassedTestsCount?: number;
  codeTotalTestsCount?: number;
  submittedCode?: string;
}

interface AssessmentScorecardProps {
  assessmentData?: AssessmentData | null;
}

export function AssessmentScorecard({ assessmentData }: AssessmentScorecardProps) {
  const [viewCodeOpen, setViewCodeOpen] = useState(true);

  if (!assessmentData) return null;

  return (
    <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/60 pb-2.5">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
          <ClipboardCheck className="h-5 w-5" />
          <h3 className="text-sm font-display font-extrabold">Online Assessment Scorecard</h3>
        </div>
        <span className="text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 px-3 py-0.5 rounded-full uppercase">
          Vetting Score: {assessmentData.overallScore}%
        </span>
      </div>

      {/* Subsection scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 p-3 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">MCQ Logic Vetting</span>
          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{assessmentData.mcqScore}%</span>
        </div>
        <div className="bg-white/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 p-3 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Coding Algorithmic Logic</span>
          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{assessmentData.codingScore}%</span>
        </div>
      </div>

      {/* Monospace Code Viewer */}
      {assessmentData.submittedCode && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setViewCodeOpen(!viewCodeOpen)}
            className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>Submitted Algorithm Code ({assessmentData.selectedLanguage})</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${viewCodeOpen ? 'rotate-180' : ''}`} />
          </button>

          {viewCodeOpen && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-900 shadow-md">
              <div className="bg-slate-950 text-[10px] font-mono p-4 overflow-x-auto text-emerald-400 whitespace-pre leading-relaxed max-h-72">
                <div className="absolute top-2 right-2 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-sans uppercase font-bold">
                  {assessmentData.selectedLanguage}
                </div>
                {assessmentData.submittedCode}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
