'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Sparkles, Loader2, Check, ShieldCheck, Cpu, Brain, BookOpen, BarChart3, ChevronRight } from '@/lib/lucide-google-icons';
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

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Quantitative Aptitude': { icon: Cpu, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
  'Logical Reasoning': { icon: Brain, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
  'Verbal Ability': { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
  'Data Interpretation': { icon: BarChart3, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 dark:bg-sky-500/20' },
};

const DIFFICULTIES = [
  { id: 'easy' as const, label: 'Easy', sublabel: 'Foundational', badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-300/40 dark:border-emerald-700/40', desc: 'Core arithmetic, basic logical sequences, straightforward comprehension passages, and direct data tables.', activeStyle: 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs' },
  { id: 'intermediate' as const, label: 'Intermediate', sublabel: 'Role-Applied', badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-300/40 dark:border-amber-700/40', desc: 'Multi-step computational reasoning, contextual business scenarios, logic puzzles, and realistic dataset metrics.', activeStyle: 'border-amber-500/80 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-xs' },
  { id: 'advanced' as const, label: 'Advanced', sublabel: 'Deep Analytical', badgeClass: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-300/40 dark:border-purple-700/40', desc: 'Dense cross-table deductions, tricky conditional logic, subtle nuance, and rigorous technical estimation.', activeStyle: 'border-purple-500/80 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-xs' },
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

  const computedTotal = typeof totalQuestions === 'number' && totalQuestions > 0
    ? totalQuestions
    : Object.values(categoryDistribution).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computedTotal === 0 || isGenerating) return;
    await onGenerate({ difficulty: selectedDifficulty, categoryDistribution });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isGenerating) onClose(); }}
      size="2xl"
      title={
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">AI Assessment Generation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {roleTitle ? `Configuring questions for: ${roleTitle}` : 'Generate professional aptitude questions matching your HR distribution'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Output:</span>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-3 py-1 rounded-xl">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300">{computedTotal} Total Questions</span>
              <span className="text-amber-400 dark:text-amber-600">•</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 capitalize">{selectedDifficulty} Tier</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button type="button" onClick={onClose} disabled={isGenerating} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={computedTotal === 0 || isGenerating} className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
              {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>Generating {computedTotal} Questions...</span></>) : (<><Sparkles className="h-4 w-4" /><span>Generate {computedTotal} Questions ({selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)})</span><ChevronRight className="h-3.5 w-3.5 opacity-80" /></>)}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-1">
        {/* Step 1: Difficulty Tier Selection Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                1. Select Difficulty Tier
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Determines problem depth, formula complexity, and contextual nuance
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Pick one level</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? diff.activeStyle
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 hover:bg-slate-100/60 dark:bg-slate-850/40 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{diff.label}</span>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${diff.badgeClass}`}>
                      {diff.sublabel}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      {diff.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Configured Categories Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-500" />
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                  2. Question Distribution Breakdown
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pre-configured by HR in the assessment pipeline card
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-200/50 dark:border-amber-800/40 px-3 py-1 rounded-xl">
              {computedTotal} MCQs Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(categoryDistribution).map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || { icon: Cpu, color: 'text-slate-600', bg: 'bg-slate-100' };
              const Icon = meta.icon;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-8 w-8 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {cat}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/50 shrink-0 ml-3">
                    {count} Questions
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
