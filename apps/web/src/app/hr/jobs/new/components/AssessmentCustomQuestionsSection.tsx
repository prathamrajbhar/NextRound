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
  categoryDistribution = {
    'Quantitative Aptitude': 2,
    'Logical Reasoning': 2,
    'Verbal Ability': 2,
    'Data Interpretation': 2,
  },
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
    <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>AI Assessment Questions (from JD)</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Generate Quantitative Aptitude, Logical Reasoning, Verbal Ability &amp; Data Interpretation MCQs
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenConfig}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>{hasCustom ? 'Select Difficulty & Regenerate' : 'Generate with AI'}</span>
        </button>
      </div>

      {hasCustom && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 animate-in fade-in duration-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {customQuestions.length} Custom Questions Configured
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-amber-700/80 dark:text-amber-400 font-medium pl-5.5">
              <span>{easyCount} Easy</span>
              <span>•</span>
              <span>{intCount} Intermediate</span>
              <span>•</span>
              <span>{advCount} Advanced</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempQuestions(customQuestions);
              setIsReviewOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <ListChecks className="h-3 w-3 text-amber-500" />
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
