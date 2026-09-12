'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ListChecks, Sliders, Loader2 } from '@/lib/lucide-google-icons';
import { AssessmentQuestion } from '@/types/assessment-question';
import { AssessmentQuestionReviewModal } from './AssessmentQuestionReviewModal';
import { GenerateQuestionsConfigModal } from './GenerateQuestionsConfigModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/contexts/ToastContext';

interface AssessmentCustomQuestionsSectionProps {
  customQuestions?: AssessmentQuestion[];
  onUpdateCustomQuestions: (questions: AssessmentQuestion[]) => void;
  categoryDistribution?: Record<string, number>;
  mcqCount?: number;
  jdText: string;
  roleTitle?: string;
  skills?: string[];
  experienceLevel?: string;
}

export function AssessmentCustomQuestionsSection({
  customQuestions = [],
  onUpdateCustomQuestions,
  categoryDistribution = { 'Quantitative Aptitude': 2, 'Logical Reasoning': 2, 'Verbal Ability': 2, 'Data Interpretation': 2 },
  mcqCount,
  jdText,
  roleTitle,
  skills = [],
  experienceLevel,
}: AssessmentCustomQuestionsSectionProps) {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [tempQuestions, setTempQuestions] = useState<AssessmentQuestion[]>(customQuestions);

  const handleOpenConfig = () => {
    if (!jdText || jdText.trim().length < 15) {
      toast({
        title: 'Job Description Required',
        description: 'Please write or generate a job description first before creating assessment questions.',
        variant: 'error',
      });
      return;
    }
    setIsConfigOpen(true);
  };

  const handleExecuteGenerate = async (params: {
    difficulty: import('@/types/assessment-question').AssessmentDifficulty;
    categoryDistribution: Record<string, number>;
  }) => {
    setIsGenerating(true);
    try {
      const res = await apiClient.post<{
        questions: AssessmentQuestion[];
        total: number;
        breakdown: { easy: number; intermediate: number; advanced: number };
      }>('/jobs/generate-questions', {
        title: roleTitle,
        description: jdText,
        skills,
        experienceLevel,
        difficulty: params.difficulty,
        categoryDistribution: params.categoryDistribution,
      });

      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        setTempQuestions(res.questions);
        setIsConfigOpen(false);
        setIsReviewOpen(true);
        toast({
          title: 'Questions Generated',
          description: `Created ${res.questions.length} questions matching your HR distribution at ${params.difficulty} difficulty.`,
          variant: 'success',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate assessment questions';
      toast({
        title: 'Generation Failed',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasCustom = customQuestions && customQuestions.length > 0;
  const easyCount = customQuestions.filter((q) => q.difficulty === 'easy').length;
  const intCount = customQuestions.filter((q) => q.difficulty === 'intermediate').length;
  const advCount = customQuestions.filter((q) => q.difficulty === 'advanced').length;

  return (
    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
      {/* Header Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              AI Assessment Questions
            </h4>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-750">
              From JD
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
            Generate Quantitative Aptitude, Logical Reasoning, Verbal Ability &amp; Data Interpretation MCQs
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenConfig}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Sliders className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>{hasCustom ? 'Regenerate Questions' : 'Generate with AI'}</span>
        </button>
      </div>

      {/* Configured Status Card */}
      {hasCustom && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {customQuestions.length} Custom Questions Configured
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {easyCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{easyCount} Easy</span>
                )}
                {intCount > 0 && (
                  <>
                    {easyCount > 0 && <span>•</span>}
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{intCount} Intermediate</span>
                  </>
                )}
                {advCount > 0 && (
                  <>
                    {(easyCount > 0 || intCount > 0) && <span>•</span>}
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">{advCount} Advanced</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempQuestions(customQuestions);
              setIsReviewOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 transition-all active:scale-95 cursor-pointer"
          >
            <ListChecks className="h-3.5 w-3.5" />
            <span>Review &amp; Edit</span>
          </button>
        </div>
      )}

      {/* 1. Configuration Modal: Select Easy / Intermediate / Advanced */}
      <GenerateQuestionsConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onGenerate={handleExecuteGenerate}
        isGenerating={isGenerating}
        roleTitle={roleTitle}
        categoryDistribution={categoryDistribution}
        totalQuestions={mcqCount}
      />

      {/* 2. Review Modal: Review, edit options, answers, delete, or save */}
      <AssessmentQuestionReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        questions={tempQuestions}
        onSave={onUpdateCustomQuestions}
        roleTitle={roleTitle}
      />
    </div>
  );
}
