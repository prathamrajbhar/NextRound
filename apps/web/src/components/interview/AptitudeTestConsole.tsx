'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Play,
  Cpu,
  Compass,
  BookOpen,
  BarChart3,
} from '@/lib/lucide-google-icons';
import { ProctoringWarningModal } from './ProctoringWarningModal';

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

export const STANDARD_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
] as const;

export function normalizeCategory(rawCat?: string, index: number = 0): string {
  if (!rawCat) return STANDARD_CATEGORIES[index % 4];
  const cat = rawCat.trim();
  if (STANDARD_CATEGORIES.includes(cat as any)) return cat;

  const lower = cat.toLowerCase();
  if (
    lower.includes('quant') ||
    lower.includes('math') ||
    lower.includes('arithmetic') ||
    lower.includes('throughput') ||
    lower.includes('latency') ||
    lower.includes('rate') ||
    lower.includes('system')
  ) {
    return 'Quantitative Aptitude';
  }
  if (
    lower.includes('logic') ||
    lower.includes('reason') ||
    lower.includes('deduction') ||
    lower.includes('algo') ||
    lower.includes('complexity')
  ) {
    return 'Logical Reasoning';
  }
  if (
    lower.includes('verbal') ||
    lower.includes('english') ||
    lower.includes('language') ||
    lower.includes('grammar') ||
    lower.includes('vocab') ||
    lower.includes('text')
  ) {
    return 'Verbal Ability';
  }
  if (
    lower.includes('data') ||
    lower.includes('chart') ||
    lower.includes('graph') ||
    lower.includes('stat') ||
    lower.includes('table') ||
    lower.includes('interpretation') ||
    lower.includes('pipeline')
  ) {
    return 'Data Interpretation';
  }
  return STANDARD_CATEGORIES[index % 4];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Quantitative Aptitude': Cpu,
  'Logical Reasoning': Compass,
  'Verbal Ability': BookOpen,
  'Data Interpretation': BarChart3,
};

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
  const [isStarted, setIsStarted] = useState(false);

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
            category: normalizeCategory(q.category, idx),
            text: q.text || q.question || 'Question text unavailable.',
            options: q.options || [],
            difficulty: q.difficulty || 'medium',
            correctIndex: q.correctIndex,
          }));
          setFetchedQuestions(mapped);
        }
      } catch (err) {
        console.error('Failed to load initial aptitude questions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialBatch();
  }, [applicationId, sessionId, displayRole, displayCompany]);

  // 2. Smart Background Batch Prefetching (Only for mock practice, never for job assessments)
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching || isLoading || applicationId) return;

    const nextBatchNum = batchCount + 1;
    const prefetchEndpoint = `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(displayRole)}&company=${encodeURIComponent(displayCompany)}&batch=${nextBatchNum}&count=4`;

    try {
      setIsPrefetching(true);
      const res = await apiClient.get<{ questions: RawApiQuestion[] }>(prefetchEndpoint).catch(() => null);
      if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
        const newMapped = res.questions.map((q: RawApiQuestion, idx: number) => ({
          id: `${q.id || 'q'}_b${nextBatchNum}_${idx}`,
          category: normalizeCategory(q.category, idx),
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
  }, [isPrefetching, isLoading, applicationId, batchCount, sessionId, displayRole, displayCompany]);

  // Normalize & sort active questions sequentially by category
  const activeQuestions = useMemo(() => {
    const list = fetchedQuestions.length > 0 ? fetchedQuestions : questions;
    const mapped = list.map((q, idx) => ({
      ...q,
      category: normalizeCategory(q.category, idx),
    }));

    return mapped.sort((a, b) => {
      const idxA = STANDARD_CATEGORIES.indexOf(a.category as any);
      const idxB = STANDARD_CATEGORIES.indexOf(b.category as any);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [fetchedQuestions, questions]);

  // Group questions into Category Sections
  const categorySections = useMemo(() => {
    const map = new Map<string, { category: string; startIndex: number; questions: AptitudeQuestion[] }>();
    STANDARD_CATEGORIES.forEach((cat) => {
      const catQs = activeQuestions.filter((q) => q.category === cat);
      if (catQs.length > 0) {
        const firstIndex = activeQuestions.findIndex((q) => q.category === cat);
        map.set(cat, { category: cat, startIndex: firstIndex, questions: catQs });
      }
    });

    // Also include any fallback category if present
    activeQuestions.forEach((q, idx) => {
      if (!map.has(q.category)) {
        const firstIdx = activeQuestions.findIndex((item) => item.category === q.category);
        const catQs = activeQuestions.filter((item) => item.category === q.category);
        map.set(q.category, { category: q.category, startIndex: firstIdx, questions: catQs });
      }
    });

    return Array.from(map.values());
  }, [activeQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!applicationId && activeQuestions.length > 0 && currentIndex >= activeQuestions.length - 2 && !isPrefetching) {
      const timer = setTimeout(() => {
        prefetchNextBatch();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [applicationId, currentIndex, activeQuestions.length, isPrefetching, prefetchNextBatch]);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 min total
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60); // 60s per question
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
    if (submitted || !isStarted) return;

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
  }, [submitted, isStarted]);

  // Reset timer on question change
  useEffect(() => {
    if (!isStarted) return;
    const timer = setTimeout(() => {
      questionTimeLeftRef.current = 60;
      setQuestionTimeLeft(60);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex, isStarted]);

  // 60-Second Per-Question Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted) return;

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
  }, [submitted, showWarningModal, isStarted, currentIndex, activeQuestions.length, handleSubmit]);

  // Overall Test Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current === 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, handleSubmit]);

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

  const handleStartTest = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
    setIsStarted(true);
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
        <div
          className={`p-8 rounded-3xl border shadow-2xl max-w-md w-full space-y-6 ${
            isEliminated ? 'bg-rose-950/80 border-rose-800 text-rose-100' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          <div
            className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center border ${
              isEliminated ? 'bg-rose-900/40 border-rose-700 text-rose-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
            <Brain className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display text-white">Loading Category Sections</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Preparing category-divided questions (Quantitative, Logical, Verbal, Data Interpretation) for {displayRole}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // START SCREEN: 4 Clean Category Cards with direct Start buttons
  if (!isStarted) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-950 text-slate-100 font-sans relative overflow-y-auto">
        <div className="max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <CompanyLogo name={displayCompany} logoUrl={companyLogoUrl} size="lg" className="mx-auto shadow-md" />
            <h1 className="text-xl sm:text-2xl font-black font-display text-white">{displayCompany}</h1>
            <p className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              {displayRole} • Aptitude Assessment
            </p>
          </div>

          {/* 4 Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
            {STANDARD_CATEGORIES.map((cat) => {
              const sec = categorySections.find((s) => s.category === cat);
              const qCount = sec ? sec.questions.length : 0;
              const startIndex = sec ? sec.startIndex : 0;
              const IconComp = CATEGORY_ICONS[cat] || Brain;

              return (
                <div
                  key={cat}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-amber-500/40 transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-100">{cat}</h3>
                      <span className="text-xs font-semibold text-slate-400 block">
                        {qCount > 0 ? `${qCount} Questions` : 'Included'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(startIndex);
                      handleStartTest();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                  >
                    <Play className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Start {cat}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
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
            <h2 className="text-xl font-black font-display text-white">Initializing Category Questions</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Connecting to AI service to load category questions for {displayRole}...
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

  const answeredCount = Object.keys(answers).length;

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
                Aptitude Assessment
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

      {/* Clean Category Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-b border-slate-800/60 no-scrollbar">
        {categorySections.map((sec) => {
          const isActive = currentQ.category === sec.category;
          const IconComp = CATEGORY_ICONS[sec.category] || Brain;
          return (
            <button
              key={sec.category}
              type="button"
              onClick={() => setCurrentIndex(sec.startIndex)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-500/30 font-black'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <IconComp className="h-3.5 w-3.5" />
              <span>{sec.category}</span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-4 items-start">
        {/* Left 2-Cols: Active Question Console */}
        <div className="lg:col-span-2 space-y-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[420px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider font-mono">
                QUESTION {currentIndex + 1} OF {activeQuestions.length}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {currentQ.category}
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
                    <div
                      className={`h-6 w-6 rounded-xl border flex items-center justify-center font-extrabold text-xs ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-slate-950'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
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

        {/* Right Col: Clean Question Navigator */}
        <div className="space-y-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[420px]">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Question Navigator
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
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

            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>Answered:</span>
                <span className="text-emerald-400 font-extrabold">
                  {answeredCount} / {activeQuestions.length}
                </span>
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
