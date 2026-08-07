'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CompanyLogo } from '@/components/ui';
import { apiClient } from '@/lib/apiClient';
import {
  Clock,
  CheckCircle2,
  Brain,
  ChevronRight,
  ChevronLeft,
  Award,
  Send,
  Timer,
} from '@/lib/lucide-google-icons';
import { ProctoringWarningModal } from './ProctoringWarningModal';

export interface AptitudeQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex?: number;
}

interface AptitudeTestConsoleProps {
  questions?: AptitudeQuestion[];
  companyName?: string;
  company?: string;
  role?: string;
  roleTitle?: string;
  companyLogoUrl?: string;
  onComplete: (score: number) => void;
  applicationId?: string;
}

const DEFAULT_APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  {
    id: 'q1',
    category: 'Quantitative Reasoning',
    text: 'If a project timeline is reduced by 20% and productivity is increased by 25%, what is the net change in total output capacity?',
    options: ['No change (0%)', '5% increase', '10% increase', '5% decrease'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    category: 'Logical Deduction',
    text: 'All algorithms with O(n log n) complexity are faster than O(n^2) for large datasets. Algorithm A runs in O(n log n). Which statement must be true?',
    options: [
      'Algorithm A is faster than all O(n^2) algorithms for any dataset size.',
      'For sufficiently large inputs, Algorithm A will outperform O(n^2) algorithms.',
      'Algorithm A is optimal for sorting.',
      'Algorithm A uses O(n) auxiliary space.',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3',
    category: 'Pattern Recognition',
    text: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '48'],
    correctIndex: 1,
  },
  {
    id: 'q4',
    category: 'Data Interpretation',
    text: 'A service handles 10,000 requests/sec with a p99 latency of 50ms. If throughput doubles and p99 scales linearly with load, what is the expected p99 latency?',
    options: ['50ms', '75ms', '100ms', '200ms'],
    correctIndex: 2,
  },
  {
    id: 'q5',
    category: 'Problem Solving',
    text: 'Three microservices A, B, and C have availability SLAs of 99.9%, 99.5%, and 99.0% respectively. What is the overall sequential system availability?',
    options: ['98.4%', '99.0%', '99.5%', '99.9%'],
    correctIndex: 0,
  },
];

export default function AptitudeTestConsole({
  questions = DEFAULT_APTITUDE_QUESTIONS,
  companyName,
  company,
  role,
  roleTitle,
  companyLogoUrl,
  onComplete,
  applicationId,
}: AptitudeTestConsoleProps) {
  const displayCompany = company || companyName || 'NextRound';
  const displayRole = role || roleTitle || 'Candidate';

  const activeQuestions = questions.length > 0 ? questions : DEFAULT_APTITUDE_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 min total
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60); // 60s per question
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    let correctCount = 0;
    activeQuestions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    const percentage = activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;

    if (applicationId) {
      try {
        const formattedAnswers = Object.entries(answers).map(([qId, sel]) => ({
          questionId: qId,
          selectedOption: sel,
        }));
        await apiClient.post(`/applications/${applicationId}/assessment/aptitude`, {
          answers: formattedAnswers,
          totalTimeSeconds: 900 - timeLeft,
          tabSwitchCount: strikeCount,
        });
      } catch (err) {
        console.error('Failed to submit aptitude assessment:', err);
      }
    }

    setFinalScore(percentage);
    setSubmitted(true);
    setIsSubmitting(false);
  }, [answers, applicationId, activeQuestions, strikeCount, timeLeft]);

  // Anti-Cheat: Fullscreen & Tab Blur Guard
  useEffect(() => {
    if (submitted) return;

    const handleProctoringViolation = () => {
      if (document.hidden || !document.fullscreenElement) {
        setStrikeCount((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleProctoringViolation);
    document.addEventListener('visibilitychange', handleProctoringViolation);

    return () => {
      document.removeEventListener('fullscreenchange', handleProctoringViolation);
      document.removeEventListener('visibilitychange', handleProctoringViolation);
    };
  }, [submitted]);

  // Reset timer on question change
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuestionTimeLeft(60);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // 60-Second Per-Question Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal) return;

    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex((idx) => idx + 1);
          } else {
            handleSubmit();
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, submitted, showWarningModal, activeQuestions.length, handleSubmit]);

  // Overall Test Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, showWarningModal]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
    }
  };

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setShowWarningModal(false);
  };

  const handleEliminateCandidate = () => {
    setSubmitted(true);
    onComplete(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (submitted) {
    const isEliminated = strikeCount >= 3;
    const computedScore = finalScore ?? 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-in fade-in duration-300 font-sans">
        <div className={`p-8 rounded-3xl border shadow-2xl max-w-md w-full space-y-6 ${
          isEliminated ? 'bg-rose-950/80 border-rose-800 text-rose-100' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center border ${
            isEliminated ? 'bg-rose-900/40 border-rose-700 text-rose-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <Award className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display">
              {isEliminated ? 'Candidate Disqualified' : 'Assessment Completed'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              {isEliminated ? 'Exceeded 3 proctoring full-screen violations.' : `Target Enterprise: ${displayCompany} • ${displayRole}`}
            </p>
          </div>

          {!isEliminated ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Aptitude Score</span>
              <span className="text-3xl font-black text-amber-400">{computedScore}%</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 space-y-1">
              <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block">Elimination Status</span>
              <span className="text-lg font-black text-rose-400">0% • Fullscreen Violation</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onComplete(isEliminated ? 0 : computedScore)}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Continue to Next Stage
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center border border-slate-700 bg-slate-950 text-slate-300">
            <Brain className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display">Aptitude Assessment Not Configured</h2>
            <p className="text-xs text-slate-400 font-semibold">
              No aptitude questions are available yet. The assessment will be provisioned when configured for this application.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onComplete(0)}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-slate-950 text-slate-100 font-sans relative overflow-hidden">

      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo name={displayCompany} logoUrl={companyLogoUrl} size="md" className="shadow-xs flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-display text-slate-100">{displayCompany}</h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                Aptitude &amp; Reasoning Test
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium block">{displayRole}</span>
          </div>
        </div>

        {/* Timers & Proctoring Badges */}
        <div className="flex items-center gap-3">

          {/* 60s Question Timer Bar */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center gap-2 shadow-sm">
            <Timer className="h-4 w-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold text-amber-300 uppercase">Question Time</span>
              <span className="text-xs font-black font-mono text-amber-400">{questionTimeLeft}s Remaining</span>
            </div>
          </div>

          {/* Overall Test Clock */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-sm">
            <Clock className="h-4 w-4 text-brand-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Total Time</span>
              <span className="text-xs font-black font-mono text-slate-200">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400 hidden sm:inline-block">
            Question {currentIndex + 1} of {activeQuestions.length}
          </span>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-4 items-start">

        {/* Left 2-Cols: Active Question Console */}
        <div className="lg:col-span-2 space-y-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[420px]">

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider font-mono">
                QUESTION {currentIndex + 1}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Single Choice • {currentQ.category}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed font-display">
              {currentQ.text}
            </h3>

            {/* Answer Options */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-slate-100 ring-2 ring-amber-500/30'
                        : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-xl border flex items-center justify-center font-extrabold text-xs ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-xs font-semibold flex-1">{opt}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-extrabold text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              type="button"
              disabled={currentIndex === activeQuestions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Next Question</span> <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Right Col: Question Navigator & Submit Box */}
        <div className="space-y-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[420px]">

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Question Navigator
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold">
              Click any number to jump directly to the question.
            </p>

            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500 text-slate-950 font-black ring-2 ring-amber-500/30'
                        : isAnswered
                        ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>Answered:</span>
                <span className="text-emerald-400 font-extrabold">{answeredCount} / {activeQuestions.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Remaining:</span>
                <span className="text-amber-400 font-extrabold">{activeQuestions.length - answeredCount}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
          >
            <Send className="h-4 w-4" />
            <span>Submit &amp; Finish Test</span>
          </button>

        </div>

      </div>

      {/* Fullscreen Proctoring Violation Warning Modal */}
      <ProctoringWarningModal
        isOpen={showWarningModal}
        strikeCount={strikeCount}
        maxStrikes={3}
        onResumeFullscreen={handleResumeFullscreen}
        onEliminate={handleEliminateCandidate}
      />

    </div>
  );
}
