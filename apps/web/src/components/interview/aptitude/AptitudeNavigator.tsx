'use client';

import React from 'react';
import { Send } from '@/lib/lucide-google-icons';
import { AptitudeQuestion } from './useAptitudeQuestions';

interface AptitudeNavigatorProps {
  category: string;
  questions: AptitudeQuestion[];
  currentIndex: number;
  answers: Record<string, number>;
  onNavigate: (index: number) => void;
  onSectionSubmit: () => void;
}

/**
 * Right-column section navigator: a grid of question buttons with answered
 * state, section progress counts, and the submit-section action.
 */
export function AptitudeNavigator({
  category,
  questions,
  currentIndex,
  answers,
  onNavigate,
  onSectionSubmit,
}: AptitudeNavigatorProps) {
  const sectionAnsweredCount = questions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="space-y-4 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/70 backdrop-blur-md shadow-lg flex flex-col justify-between h-full overflow-y-auto">
      <div className="space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {category} Navigator
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] !== undefined;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onNavigate(idx)}
                className={`h-10 rounded-xl border font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-600 dark:bg-brand-500 text-white dark:text-slate-950 font-black shadow-md ring-2 ring-brand-500/30'
                    : isAnswered
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-xs font-semibold">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Section Answered:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {sectionAnsweredCount} / {questions.length}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Section Remaining:</span>
            <span className="text-brand-600 dark:text-orange-400 font-extrabold">
              {questions.length - sectionAnsweredCount}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSectionSubmit}
        className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto"
      >
        <Send className="h-4 w-4" />
        <span>Submit {category} Section</span>
      </button>
    </div>
  );
}
