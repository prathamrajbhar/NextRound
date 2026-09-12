'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Sparkles, Loader2, Cpu, Check, Layers, AlertCircle } from '@/lib/lucide-google-icons';
import { AssessmentDifficulty } from '@/types/assessment-question';

interface GenerateQuestionsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (distribution: { easy: number; intermediate: number; advanced: number }) => Promise<void>;
  isGenerating: boolean;
  roleTitle?: string;
}

export function GenerateQuestionsConfigModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  roleTitle,
}: GenerateQuestionsConfigModalProps) {
  const [counts, setCounts] = useState<{ easy: number; intermediate: number; advanced: number }>({
    easy: 3,
    intermediate: 4,
    advanced: 3,
  });

  const total = counts.easy + counts.intermediate + counts.advanced;

  const handleCountChange = (tier: 'easy' | 'intermediate' | 'advanced', val: number) => {
    setCounts((prev) => ({
      ...prev,
      [tier]: Math.max(0, Math.min(20, val)),
    }));
  };

  const handleQuickPreset = (preset: { easy: number; intermediate: number; advanced: number }) => {
    setCounts(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total === 0 || isGenerating) return;
    await onGenerate(counts);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isGenerating) onClose();
      }}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Customize Question Difficulty &amp; Count
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {roleTitle ? `Targeting: ${roleTitle}` : 'Configure number of questions per difficulty tier'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total to generate: <strong className="text-amber-600 dark:text-amber-400">{total} Questions</strong>
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
              disabled={total === 0 || isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Drafting Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Choose exactly how many questions you want for each difficulty tier. You can also turn any difficulty off completely by setting it to 0.
        </p>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset({ easy: 4, intermediate: 4, advanced: 2 })}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Balanced (10Q)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset({ easy: 5, intermediate: 3, advanced: 0 })}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 transition-colors"
          >
            Entry / Fresher (8Q)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset({ easy: 0, intermediate: 4, advanced: 6 })}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40 transition-colors"
          >
            Senior / Deep Tech (10Q)
          </button>
        </div>

        {/* Tier Inputs */}
        <div className="space-y-2.5 pt-1">
          {/* Easy Tier */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Easy Questions
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">
                Syntax, core definitions, and foundational checks
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-emerald-300/80 dark:border-emerald-700 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-2xs">
              <button
                type="button"
                onClick={() => handleCountChange('easy', counts.easy - 1)}
                disabled={counts.easy <= 0}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="20"
                value={counts.easy}
                onChange={(e) => handleCountChange('easy', parseInt(e.target.value) || 0)}
                className="w-8 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handleCountChange('easy', counts.easy + 1)}
                disabled={counts.easy >= 20}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Intermediate Tier */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                Intermediate Questions
              </span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400 font-medium">
                Debugging scenarios, practical framework usage, trade-offs
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-amber-300/80 dark:border-amber-700 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-2xs">
              <button
                type="button"
                onClick={() => handleCountChange('intermediate', counts.intermediate - 1)}
                disabled={counts.intermediate <= 0}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="20"
                value={counts.intermediate}
                onChange={(e) => handleCountChange('intermediate', parseInt(e.target.value) || 0)}
                className="w-8 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handleCountChange('intermediate', counts.intermediate + 1)}
                disabled={counts.intermediate >= 20}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Advanced Tier */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60">
            <div>
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block">
                Advanced Questions
              </span>
              <span className="text-[10px] text-purple-600/80 dark:text-purple-400 font-medium">
                Performance optimization, edge cases, scalability, system architecture
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-purple-300/80 dark:border-purple-700 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-2xs">
              <button
                type="button"
                onClick={() => handleCountChange('advanced', counts.advanced - 1)}
                disabled={counts.advanced <= 0}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="20"
                value={counts.advanced}
                onChange={(e) => handleCountChange('advanced', parseInt(e.target.value) || 0)}
                className="w-8 text-center font-black text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handleCountChange('advanced', counts.advanced + 1)}
                disabled={counts.advanced >= 20}
                className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
