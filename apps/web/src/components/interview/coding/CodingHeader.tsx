'use client';

import React from 'react';
import { Clock, ChevronDown, Play, Send } from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { CodingProblem, SupportedLanguage, LANGUAGES } from './useCodingProblem';

interface CodingHeaderProps {
  company: string;
  role?: string;
  problem: CodingProblem;
  language: SupportedLanguage;
  isRunning: boolean;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onSubmit: () => void;
}

const DIFFICULTY_CLASS: Record<CodingProblem['difficulty'], string> = {
  Easy: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  Medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  Hard: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};





export function CodingHeader({ company, role, problem, language, isRunning, onLanguageChange, onRun, onSubmit }: CodingHeaderProps) {
  return (
    <header className="h-14 px-4 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
      <div className="flex items-center gap-3">
        <CompanyLogo name={company || 'NextRound'} size="sm" className="shadow-xs flex-shrink-0 border border-slate-200 dark:border-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            {problem.title}
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${DIFFICULTY_CLASS[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
            {problem.category}
          </span>
        </div>
      </div>

      {}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
          <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-amber-400" />
          <span>29:45</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{role || 'Candidate'}</span>
      </div>

      {}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-slate-100 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer appearance-none pr-7"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'python' ? 'Python 3' : lang === 'javascript' ? 'JavaScript' : lang === 'typescript' ? 'TypeScript' : lang === 'java' ? 'Java 21' : 'C++ 20'}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-all"
        >
          <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
          <span>{isRunning ? 'Executing...' : 'Run'}</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isRunning}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Submit</span>
        </button>
      </div>
    </header>
  );
}
