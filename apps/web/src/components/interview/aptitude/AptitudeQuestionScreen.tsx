'use client';

import React from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from '@/lib/lucide-google-icons';
import { AptitudeQuestion } from './useAptitudeQuestions';
import { AptitudeNavigator } from './AptitudeNavigator';
import { AptitudeQuestionHeader } from './AptitudeQuestionHeader';
import { ProctoringWarningModal } from '../ProctoringWarningModal';
import { useToast } from '@/contexts/ToastContext';

interface AptitudeQuestionScreenProps {
  companyName: string;
  roleTitle: string;
  companyLogoUrl?: string;
  category: string;
  questions: AptitudeQuestion[];
  currentIndex: number;
  questionTimeLeft: number;
  timeLeft: number;
  answers: Record<string, number>;
  onSelectOption: (optionIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onNavigate: (index: number) => void;
  onSectionSubmit: () => void;
  showWarningModal: boolean;
  strikeCount: number;
  maxStrikes: number;
  onResumeFullscreen: () => void;
  onEliminate: () => void;
}

/**
 * Active single-category question console: the question header with timers,
 * the current question + options, a grid navigator for the section, and the
 * fullscreen proctoring violation modal.
 */
export function AptitudeQuestionScreen({
  companyName,
  roleTitle,
  companyLogoUrl,
  category,
  questions,
  currentIndex,
  questionTimeLeft,
  timeLeft,
  answers,
  onSelectOption,
  onPrevious,
  onNext,
  onNavigate,
  onSectionSubmit,
  showWarningModal,
  strikeCount,
  maxStrikes,
  onResumeFullscreen,
  onEliminate,
}: AptitudeQuestionScreenProps) {
  const { toast } = useToast();
  const currentQ = questions[currentIndex];
  const questionCount = questions.length;

  React.useEffect(() => {
    if (currentQ) {
      const correctIdx = currentQ.correctIndex !== undefined ? currentQ.correctIndex : (currentQ as any).correct_index;
      if (typeof correctIdx === 'number' && correctIdx >= 0) {
        const optionLetter = String.fromCharCode(65 + correctIdx);
        toast({
          title: `Question ${currentIndex + 1} Answer`,
          description: `Correct Option: ${optionLetter} - ${currentQ.options[correctIdx]}`,
          variant: 'info',
        });
      }
    }
  }, [currentQ, currentIndex, toast]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Top Header Bar for Selected Category */}
      <AptitudeQuestionHeader
        companyName={companyName}
        roleTitle={roleTitle}
        companyLogoUrl={companyLogoUrl}
        category={category}
        questionTimeLeft={questionTimeLeft}
        timeLeft={timeLeft}
        currentIndex={currentIndex}
        questionCount={questionCount}
      />

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-4 items-start overflow-hidden">
        {/* Left 2-Cols: Active Question Console */}
        <div className="lg:col-span-2 space-y-4 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/70 backdrop-blur-md shadow-lg flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
              <span className="text-xs font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-wider font-mono">
                QUESTION {currentIndex + 1} OF {questionCount}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-orange-400 border border-brand-200 dark:border-brand-800">
                {currentQ.category}
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-display">
              {currentQ.text}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-950 dark:text-slate-100 ring-2 ring-brand-500/30 font-bold'
                        : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl border flex items-center justify-center font-extrabold text-xs transition-colors ${
                        isSelected
                          ? 'border-brand-500 bg-brand-600 dark:bg-brand-500 text-white dark:text-slate-950'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-xs font-semibold flex-1 leading-relaxed">{opt}</span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={onPrevious}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              type="button"
              disabled={currentIndex === questionCount - 1}
              onClick={onNext}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Next Question</span> <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Col: Clean Question Navigator for this Section */}
        <AptitudeNavigator
          category={category}
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          onNavigate={onNavigate}
          onSectionSubmit={onSectionSubmit}
        />
      </div>

      {/* Fullscreen Proctoring Violation Warning Modal */}
      <ProctoringWarningModal
        isOpen={showWarningModal}
        strikeCount={strikeCount}
        maxStrikes={maxStrikes}
        onResumeFullscreen={onResumeFullscreen}
        onEliminate={onEliminate}
      />
    </div>
  );
}
