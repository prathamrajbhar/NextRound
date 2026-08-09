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
  ShieldCheck,
  Check,
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
  
  // Section/Category tracking states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedCategoryScores, setCompletedCategoryScores] = useState<Record<string, number>>({});

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

  // 2. Background Batch Prefetching
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

  // Available unique categories from questions
  const availableCategories = useMemo(() => {
    const categoriesPresent = Array.from(new Set(activeQuestions.map((q) => q.category)));
    return STANDARD_CATEGORIES.filter((cat) => categoriesPresent.includes(cat));
  }, [activeQuestions]);

  // Active questions for the currently selected category section
  const activeCategoryQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    return activeQuestions.filter((q) => q.category === selectedCategory);
  }, [activeQuestions, selectedCategory]);

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

  // Final Overall Submission
  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    let totalCorrect = 0;
    activeQuestions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        totalCorrect++;
      }
    });
    let percentage = activeQuestions.length > 0 ? Math.round((totalCorrect / activeQuestions.length) * 100) : 0;

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

  // Submit current category section & return to Category Selection Hub
  const handleCategorySubmit = useCallback(() => {
    if (!selectedCategory) return;

    let catCorrect = 0;
    activeCategoryQuestions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        catCorrect++;
      }
    });

    const catScore = activeCategoryQuestions.length > 0
      ? Math.round((catCorrect / activeCategoryQuestions.length) * 100)
      : 100;

    setCompletedCategoryScores((prev) => {
      const nextScores = { ...prev, [selectedCategory]: catScore };
      
      // Auto submit full assessment if all categories are now completed
      const allDone = availableCategories.every((cat) => nextScores[cat] !== undefined);
      if (allDone) {
        setTimeout(() => {
          handleFinalSubmit();
        }, 100);
      }
      return nextScores;
    });

    // Exit fullscreen & return to hub screen
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}

    setSelectedCategory(null);
    setIsStarted(false);
  }, [selectedCategory, activeCategoryQuestions, answers, availableCategories, handleFinalSubmit]);

  // Anti-Cheat proctoring listeners
  useEffect(() => {
    if (submitted || !isStarted || !selectedCategory) return;

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
  }, [submitted, isStarted, selectedCategory]);

  // Reset per-question timer on question change
  useEffect(() => {
    if (!isStarted || !selectedCategory) return;
    const timer = setTimeout(() => {
      questionTimeLeftRef.current = 60;
      setQuestionTimeLeft(60);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex, isStarted, selectedCategory]);

  // 60-Second Per-Question Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted || !selectedCategory) return;

    const interval = setInterval(() => {
      if (questionTimeLeftRef.current <= 0) return;
      questionTimeLeftRef.current -= 1;
      setQuestionTimeLeft(questionTimeLeftRef.current);

      if (questionTimeLeftRef.current === 0) {
        if (currentIndex < activeCategoryQuestions.length - 1) {
          setCurrentIndex((idx) => idx + 1);
          questionTimeLeftRef.current = 60;
          setQuestionTimeLeft(60);
        } else {
          handleCategorySubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, selectedCategory, currentIndex, activeCategoryQuestions.length, handleCategorySubmit]);

  // Overall Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current === 0) {
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, handleFinalSubmit]);

  const currentQ = activeCategoryQuestions[currentIndex];

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

  const handleStartCategorySection = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentIndex(0);
    setQuestionTimeLeft(60);
    questionTimeLeftRef.current = 60;

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

  // SUBMITTED STATE
  if (submitted) {
    const isEliminated = strikeCount >= 3;
    const computedScore = finalScore ?? 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-300 font-sans">
        <div
          className={`p-8 rounded-3xl border shadow-2xl max-w-md w-full space-y-6 ${
            isEliminated
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
          }`}
        >
          <div
            className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center border shadow-md ${
              isEliminated
                ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                : 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
            }`}
          >
            <Award className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display tracking-tight">
              {isEliminated ? 'Candidate Disqualified' : 'Assessment Completed'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isEliminated ? 'Exceeded 3 proctoring full-screen violations.' : `Target Enterprise: ${displayCompany} • ${displayRole}`}
            </p>
          </div>

          {!isEliminated ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Aptitude Composite Score
              </span>
              <span className="text-3xl font-black text-brand-600 dark:text-orange-400">{computedScore}%</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-100/60 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 space-y-1">
              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
                Elimination Status
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">0% • Fullscreen Violation</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onComplete(isEliminated ? 0 : computedScore)}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Continue to Next Stage
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 shadow-sm">
            <Brain className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display text-slate-900 dark:text-white">Loading Assessment Questions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Preparing category questions for {displayRole}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CATEGORY SELECTION HUB SCREEN (Returned to after completing a category section)
  if (!selectedCategory || !isStarted) {
    const completedCount = Object.keys(completedCategoryScores).length;
    const totalCategoriesCount = availableCategories.length || 4;
    const isAllDone = completedCount >= totalCategoriesCount;

    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-y-auto">
        <div className="max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl space-y-6 text-center">
          
          <div className="space-y-2">
            <CompanyLogo name={displayCompany} logoUrl={companyLogoUrl} size="lg" className="mx-auto shadow-md" />
            <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white">{displayCompany}</h1>
            <p className="text-xs font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-wider">
              {displayRole} • Aptitude Assessment Hub
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-extrabold mt-1">
              <span>{completedCount} of {totalCategoriesCount} Category Sections Completed</span>
            </div>
          </div>

          {/* 4 Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
            {availableCategories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat] || Brain;
              const isCatCompleted = completedCategoryScores[cat] !== undefined;
              const score = completedCategoryScores[cat];
              const catQs = activeQuestions.filter((q) => q.category === cat);

              return (
                <div
                  key={cat}
                  className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between space-y-4 ${
                    isCatCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-xl border flex-shrink-0 ${
                        isCatCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                          : 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
                      }`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{cat}</h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                          {catQs.length} Questions
                        </span>
                      </div>
                    </div>

                    {isCatCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="h-3 w-3" /> Done ({score}%)
                      </span>
                    )}
                  </div>

                  {!isCatCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleStartCategorySection(cat)}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Start {cat}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Section Completed</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full Assessment Submit Button */}
          {completedCount > 0 && (
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{isAllDone ? 'Submit Complete Assessment' : 'Finish & Submit Assessment Early'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-300 font-sans">
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xl max-w-md w-full space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
            <Brain className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-display text-slate-900 dark:text-white">Initializing {selectedCategory}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading section questions...
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCategorySubmit()}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Return to Assessment Hub
          </button>
        </div>
      </div>
    );
  }

  const sectionAnsweredCount = activeCategoryQuestions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Top Header Bar for Selected Category */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CompanyLogo name={displayCompany} logoUrl={companyLogoUrl} size="md" className="shadow-xs flex-shrink-0 border border-slate-200 dark:border-slate-800" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-display text-slate-900 dark:text-slate-100">{displayCompany}</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-orange-400 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                {selectedCategory}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">{displayRole} • Category Section</span>
          </div>
        </div>

        {/* Timers & Proctoring Badges */}
        <div className="flex items-center gap-3">
          {/* 60s Question Timer Bar */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/40 flex items-center gap-2 shadow-xs">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Question Time</span>
              <span className="text-xs font-black font-mono text-amber-800 dark:text-amber-400">{questionTimeLeft}s Remaining</span>
            </div>
          </div>

          {/* Overall Test Clock */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
            <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Time</span>
              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 hidden sm:inline-block">
            Question {currentIndex + 1} of {activeCategoryQuestions.length}
          </span>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-4 items-start overflow-hidden">
        {/* Left 2-Cols: Active Question Console */}
        <div className="lg:col-span-2 space-y-4 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/70 backdrop-blur-md shadow-lg flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
              <span className="text-xs font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-wider font-mono">
                QUESTION {currentIndex + 1} OF {activeCategoryQuestions.length}
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
                    onClick={() => handleSelectOption(idx)}
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
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              type="button"
              disabled={currentIndex === activeCategoryQuestions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(activeCategoryQuestions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Next Question</span> <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Col: Clean Question Navigator for this Section */}
        <div className="space-y-4 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/70 backdrop-blur-md shadow-lg flex flex-col justify-between h-full overflow-y-auto">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedCategory} Navigator
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {activeCategoryQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-600 dark:bg-brand-500 text-white dark:text-slate-950 font-black shadow-md ring-2 ring-brand-500/30'
                        : isAnswered
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Section Answered:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {sectionAnsweredCount} / {activeCategoryQuestions.length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Section Remaining:</span>
                <span className="text-brand-600 dark:text-orange-400 font-extrabold">
                  {activeCategoryQuestions.length - sectionAnsweredCount}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCategorySubmit}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto"
          >
            <Send className="h-4 w-4" />
            <span>Submit {selectedCategory} Section</span>
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
