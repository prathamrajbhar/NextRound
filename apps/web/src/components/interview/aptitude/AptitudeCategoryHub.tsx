'use client';

import React from 'react';
import {
  Brain,
  Cpu,
  Compass,
  BookOpen,
  BarChart3,
  Play,
  Check,
  CheckCircle2,
  ChevronRight,
  Send,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { AptitudeQuestion } from './useAptitudeQuestions';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Quantitative Aptitude': Cpu,
  'Logical Reasoning': Compass,
  'Verbal Ability': BookOpen,
  'Data Interpretation': BarChart3,
};

interface AptitudeCategoryHubProps {
  companyName: string;
  roleTitle: string;
  companyLogoUrl?: string;
  categories: string[];
  activeQuestions: AptitudeQuestion[];
  completedCategoryScores: Record<string, number>;
  isSubmitting: boolean;
  getCategoryQuestionCount?: (category: string) => number;
  onStartCategory: (category: string) => void;
  onFinalSubmit: () => void;
}

/**
 * Landing hub listing each aptitude category as a card, with completion state
 * per section and the full-assessment submit action.
 */
export function AptitudeCategoryHub({
  companyName,
  roleTitle,
  companyLogoUrl,
  categories,
  activeQuestions,
  completedCategoryScores,
  isSubmitting,
  getCategoryQuestionCount,
  onStartCategory,
  onFinalSubmit,
}: AptitudeCategoryHubProps) {
  const completedCount = Object.keys(completedCategoryScores).length;
  const totalCategoriesCount = categories.length || 4;
  const isAllDone = completedCount >= totalCategoriesCount;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-y-auto">
      <div className="max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl space-y-6 text-center">
        <div className="space-y-2">
          <CompanyLogo name={companyName} logoUrl={companyLogoUrl} size="lg" className="mx-auto shadow-md" />
          <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white">{companyName}</h1>
          <p className="text-xs font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-wider">
            {roleTitle} • Aptitude Assessment Hub
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-extrabold mt-1">
            <span>{completedCount} of {totalCategoriesCount} Category Sections Completed</span>
          </div>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          {categories.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat] || Brain;
            const isCatCompleted = completedCategoryScores[cat] !== undefined;
            const score = completedCategoryScores[cat];
            const catQs = activeQuestions.filter((q) => q.category === cat);
            const questionCount = getCategoryQuestionCount ? getCategoryQuestionCount(cat) : catQs.length;
            const hasCorrectKeys = catQs.length > 0 && catQs.every((q) => q.correctIndex !== undefined);

            return (
              <div
                key={cat}
                className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between space-y-4 ${
                  isCatCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 hover:border-brand-400 dark:hover:border-brand-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-xl border flex-shrink-0 ${
                      isCatCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                        : 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
                    }`}>
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{cat}</h3>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                        {questionCount} Questions
                      </span>
                    </div>
                  </div>

                  {isCatCompleted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-3 w-3" /> Done {hasCorrectKeys ? `(${score}%)` : ''}
                    </span>
                  )}
                </div>

                {!isCatCompleted ? (
                  <button
                    type="button"
                    onClick={() => onStartCategory(cat)}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start {cat}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Section Completed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Full Assessment Submit Button */}
        {completedCount > 0 && (
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onFinalSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>{isAllDone ? 'Submit Complete Assessment' : 'Finish & Submit Assessment Early'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
