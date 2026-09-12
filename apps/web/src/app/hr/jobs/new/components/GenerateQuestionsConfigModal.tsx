'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Sparkles, Loader2, Check, ShieldCheck } from '@/lib/lucide-google-icons';
import { AssessmentDifficulty } from '@/types/assessment-question';

interface GenerateQuestionsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    difficulty: AssessmentDifficulty;
    categoryDistribution: Record<string, number>;
  }) => Promise<void>;
  isGenerating: boolean;
  roleTitle?: string;
  categoryDistribution?: Record<string, number>;
  totalQuestions?: number;
}
interface DiffTier {
  id: AssessmentDifficulty;
  label: string;
  badge: string;
  description: string;
  borderClass: string;
  bgClass: string;
  activeBorder: string;
}

const DIFFICULTIES: DiffTier[] = [
  { id: 'easy', label: 'Easy', badge: 'Foundational & Core', description: 'Direct arithmetic, standard verbal comprehension, logical patterns, and basic charts.', borderClass: 'border-emerald-200/80 dark:border-emerald-800/60', bgClass: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20', activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-950/40' },
  { id: 'intermediate', label: 'Intermediate', badge: 'Standard & Applied', description: 'Multi-step problem solving, realistic data interpretation, situational logic, and professional verbal nuance.', borderClass: 'border-amber-200/80 dark:border-amber-800/60', bgClass: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20', activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/80 dark:bg-amber-950/40' },
  { id: 'advanced', label: 'Advanced', badge: 'Deep & Analytical', description: 'Complex multi-variable deductions, dense dataset tables, tricky logic gates, and advanced technical reasoning.', borderClass: 'border-purple-200/80 dark:border-purple-800/60', bgClass: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20', activeBorder: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/80 dark:bg-purple-950/40' },
];

export function GenerateQuestionsConfigModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  roleTitle,
  categoryDistribution = {
    'Quantitative Aptitude': 2,
    'Logical Reasoning': 2,
    'Verbal Ability': 2,
    'Data Interpretation': 2,
  },
  totalQuestions,
}: GenerateQuestionsConfigModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<AssessmentDifficulty>('intermediate');

  const computedTotal =
    typeof totalQuestions === 'number' && totalQuestions > 0
      ? totalQuestions
      : Object.values(categoryDistribution).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computedTotal === 0 || isGenerating) return;
    await onGenerate({
      difficulty: selectedDifficulty,
      categoryDistribution,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isGenerating) onClose(); }}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">AI Assessment Questions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {roleTitle ? `Targeting: ${roleTitle}` : 'Generate questions matching your HR question distribution'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total: <strong className="text-amber-600 dark:text-amber-400">{computedTotal} MCQs</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={computedTotal === 0 || isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating {computedTotal} Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate {computedTotal} Questions ({selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            1. Select Assessment Difficulty
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Choose the difficulty tier for the generated questions.
          </p>

          <div className="space-y-2">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected ? diff.activeBorder : `${diff.borderClass} ${diff.bgClass} bg-white dark:bg-slate-900`
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{diff.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {diff.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{diff.description}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500' : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
              <span>HR Configured Distribution ({computedTotal} total)</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Configured in Assessment card</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {Object.entries(categoryDistribution).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-750 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium truncate pr-2">{cat}</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 shrink-0">{count} Qs</span>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
