'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
// Canonical shared aptitude bank — single source of truth (packages/shared/data).
import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';

export interface AptitudeQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
  difficulty?: string;
  correctIndex?: number;
}

interface RawApiQuestion {
  id?: string;
  category?: string;
  text?: string;
  question?: string;
  options?: string[];
  difficulty?: string;
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
  sessionId?: string;
}

export default function AptitudeTestConsole({
  questions = [],
  companyName,
  company,
  role,
  roleTitle,
  companyLogoUrl,
  onComplete,
  applicationId,
  sessionId,
}: AptitudeTestConsoleProps) {
  const displayCompany = company || companyName || 'NextRound';
  const displayRole = role || roleTitle || 'Candidate';

  const [fetchedQuestions, setFetchedQuestions] = useState<AptitudeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [batchCount, setBatchCount] = useState(1);

  // 1. Initial Batch Direct Fetch
  useEffect(() => {
    async function loadInitialBatch() {
      apiClient.clearCache('/aptitude');
      const endpoint = applicationId
        ? `/applications/${applicationId}/assessment/aptitude`
        : `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(displayRole)}&company=${encodeURIComponent(displayCompany)}&batch=1&count=4`;

      try {
        setIsLoading(true);
        const res = await apiClient.get<{ questions: RawApiQuestion[] }>(endpoint).catch(() => null);
        if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
          const mapped = res.questions.map((q: RawApiQuestion, idx: number) => ({
            id: q.id || `q_b1_${idx}`,
            category: q.category || 'Logical Reasoning',
            text: q.text || q.question || 'Question text unavailable.',
            options: q.options || [],
            difficulty: q.difficulty || 'medium',
            correctIndex: q.correctIndex,
          }));
          setFetchedQuestions(mapped);
        } else {
          // Direct dynamic fallback guarantee if API endpoint fails. Sourced from
          // the canonical shared bank (packages/shared/data/aptitude-questions.json).
          // correctIndex/explanation are deliberately omitted: the real assessment
          // strips the answer key server-side, so a client-side fallback must not
          // embed it either.
          const fallbackQs: AptitudeQuestion[] = aptitudeFallbackQuestions.map((q) => ({
            id: q.id,
            category: q.category,
            text: (q.text || q.question).replace('{role}', displayRole),
            options: q.options,
            difficulty: q.difficulty,
          }));
          setFetchedQuestions(fallbackQs);
        }
      } catch (err) {
        console.error('Failed to load initial aptitude questions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialBatch();
  }, [applicationId, sessionId, displayRole, displayCompany]);

  // 2. Smart Background Batch Prefetching
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching || isLoading) return;

    const nextBatchNum = batchCount + 1;
    const prefetchEndpoint = applicationId
      ? `/applications/${applicationId}/assessment/aptitude?batch=${nextBatchNum}&count=4`
      : `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(displayRole)}&company=${encodeURIComponent(displayCompany)}&batch=${nextBatchNum}&count=4`;

    try {
      setIsPrefetching(true);
      const res = await apiClient.get<{ questions: RawApiQuestion[] }>(prefetchEndpoint).catch(() => null);
      if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
        const newMapped = res.questions.map((q: RawApiQuestion, idx: number) => ({
          id: `${q.id || 'q'}_b${nextBatchNum}_${idx}`,
          category: q.category || 'Logical Reasoning',
          text: q.text || q.question || 'Question text unavailable.',
          options: q.options || [],
          difficulty: q.difficulty || 'medium',
          correctIndex: q.correctIndex,
        }));
        setFetchedQuestions((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNew = newMapped.filter((item: AptitudeQuestion) => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
        setBatchCount(nextBatchNum);
      }
    } catch (err) {
      console.error(`Failed to prefetch aptitude batch ${nextBatchNum}:`, err);
    } finally {
      setIsPrefetching(false);
    }
  }, [isPrefetching, isLoading, batchCount, applicationId, sessionId, displayRole, displayCompany]);

  // Trigger prefetch when candidate is 2 questions away from the end of current buffer
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (fetchedQuestions.length > 0 && currentIndex >= fetchedQuestions.length - 2 && !isPrefetching) {
      const timer = setTimeout(() => {
        prefetchNextBatch();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fetchedQuestions.length, isPrefetching, prefetchNextBatch]);

  const activeQuestions = fetchedQuestions.length > 0 
    ? fetchedQuestions 
    : questions;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 min total
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60); // 60s per question
  // Refs mirroring timer values so interval callbacks can read/transition them
  // without side effects inside a state updater or an effect body.
  const timeLeftRef = useRef(900);
  const questionTimeLeftRef = useRef(60);
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
    let percentage = activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;

    if (applicationId) {
      try {
        const formattedAnswers = Object.entries(answers).map(([qId, sel]) => ({
          questionId: qId,
          selectedOption: sel,
        }));
        const res = await apiClient.post<{ score?: number }>(`/applications/${applicationId}/assessment/aptitude`, {
          answers: formattedAnswers,
          totalTimeSeconds: 900 - timeLeft,
          tabSwitchCount: strikeCount,
        });
        // For the real assessment the API strips correctIndex (anti-cheat), so the
        // client cannot score locally — use the server-computed score instead of a
        // fabricated 0%.
        if (res && typeof res.score === 'number') {
          percentage = Math.max(0, Math.min(100, Math.round(res.score)));
        }
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
      questionTimeLeftRef.current = 60;
      setQuestionTimeLeft(60);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // 60-Second Per-Question Countdown Timer. Decrements the ref + mirror state
  // inside the interval callback (never inside a state updater or effect body),
  // then advances or submits on expiry.
  useEffect(() => {
    if (submitted || showWarningModal) return;

    const interval = setInterval(() => {
      if (questionTimeLeftRef.current <= 0) return;
      questionTimeLeftRef.current -= 1;
      setQuestionTimeLeft(questionTimeLeftRef.current);

      if (questionTimeLeftRef.current === 0) {
        if (currentIndex < activeQuestions.length - 1) {
          setCurrentIndex((idx) => idx + 1);
          questionTimeLeftRef.current = 60;
          setQuestionTimeLeft(60);
        } else {
          handleSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, currentIndex, activeQuestions.length, handleSubmit]);

  // Overall Test Countdown Timer. Auto-submits when the 15-minute cap expires.
  useEffect(() => {
    if (submitted || showWarningModal) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current === 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, handleSubmit]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
            <Brain className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display text-white">Generating LLM Assessment</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Preparing dynamic, role-tailored aptitude questions using LLM engine for {displayRole}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Brain className="h-8 w-8 animate-pulse text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display text-white">Initializing Assessment</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Connecting to AI service to load questions for {displayRole}...
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Retry Connection
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
