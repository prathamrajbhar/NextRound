'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ListChecks, Loader2 } from '@/lib/lucide-google-icons';
import { AssessmentQuestion } from '@/types/assessment-question';
import { AssessmentQuestionReviewModal } from './AssessmentQuestionReviewModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/contexts/ToastContext';

interface AssessmentCustomQuestionsSectionProps {
  customQuestions?: AssessmentQuestion[];
  onUpdateCustomQuestions: (questions: AssessmentQuestion[]) => void;
  jdText: string;
  roleTitle?: string;
  skills?: string[];
  experienceLevel?: string;
}

export function AssessmentCustomQuestionsSection({
  customQuestions = [],
  onUpdateCustomQuestions,
  jdText,
  roleTitle,
  skills = [],
  experienceLevel,
}: AssessmentCustomQuestionsSectionProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [tempQuestions, setTempQuestions] = useState<AssessmentQuestion[]>(customQuestions);

  const handleGenerateQuestions = async () => {
    if (!jdText || jdText.trim().length < 15) {
      toast({
        title: 'Job Description Required',
        description: 'Please write or generate a job description first before creating assessment questions.',
        variant: 'error',
      });
      return;
    }

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
        countPerTier: 4,
      });

      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        setTempQuestions(res.questions);
        setIsReviewOpen(true);
        toast({
          title: 'Questions Generated',
          description: `Created ${res.questions.length} questions across Easy, Intermediate, and Advanced tiers.`,
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
            Tailored Easy, Intermediate, &amp; Advanced MCQs derived from role requirements
          </span>
        </div>

        <button
          type="button"
          onClick={handleGenerateQuestions}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isGenerating ? 'Drafting...' : hasCustom ? 'Regenerate' : 'Generate from JD'}</span>
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
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <ListChecks className="h-3 w-3 text-amber-500" />
            <span>Review &amp; Edit</span>
          </button>
        </div>
      )}

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
