'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Maximize2,
  ShieldAlert,
  Timer,
} from '@/lib/lucide-google-icons';
import { ProctoringWarningModal } from './ProctoringWarningModal';

interface AptitudeTestConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  onComplete: (score: number) => void;
}

interface Question {
  id: string | number;
  category?: string;
  question: string;
  options: string[];
  correctIndex?: number;
}

const defaultAptitudeQuestions: Question[] = [
  {
    id: 1,
    question: 'A food delivery system processes 1,200 orders per minute. If driver dispatch efficiency increases by 25%, how many orders are dispatched per 5-minute interval?',
    options: ['6,000 orders', '7,500 orders', '8,000 orders', '9,200 orders'],
    correctIndex: 1,
  },
  {
    id: 2,
    question: 'Find the next number in the pattern series: 4, 9, 19, 39, 79, ?',
    options: ['119', '149', '159', '169'],
    correctIndex: 2,
  },
  {
    id: 3,
    question: 'If Server A handles 40% of traffic with a 99.9% uptime and Server B handles 60% with a 99.5% uptime, what is the combined availability system SLA?',
    options: ['99.66%', '99.75%', '99.80%', '99.90%'],
    correctIndex: 0,
  },
  {
    id: 4,
    question: 'Five microservices (P, Q, R, S, T) communicate in sequence. P finishes before Q. R finishes after S. T finishes before P. Which service finishes first?',
    options: ['Service P', 'Service Q', 'Service T', 'Service R'],
    correctIndex: 2,
  },
  {
    id: 5,
    question: 'A database query execution time decreases from 400ms to 80ms after adding an index. What is the percentage speed improvement?',
    options: ['75%', '80%', '400%', '500%'],
    correctIndex: 1,
  },
];

export default function AptitudeTestConsole({
  company = 'Google',
  role = 'Software Engineer',
  applicationId,
  onComplete,
}: AptitudeTestConsoleProps) {
  const [questions, setQuestions] = useState<Question[]>(defaultAptitudeQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins total
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60); // 60 seconds per question
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proctoring & Fullscreen warning state
  const [strikeCount, setStrikeCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      if (!applicationId) return;
      try {
        const res = await apiClient.get<{ questions: Question[] }>(`/applications/${applicationId}/assessment/aptitude`);
        if (res?.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        }
      } catch (err) {
        console.warn('Using seed question set:', err);
      }
    }
    loadQuestions();
  }, [applicationId]);

  // Fullscreen Exit & Tab Switch Listener
  useEffect(() => {
    if (submitted) return;

    const handleProctoringViolation = () => {
      if (!document.fullscreenElement || document.hidden) {
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

  // 60-Second Per-Question Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal) return;

    setQuestionTimeLeft(60); // Reset timer whenever question changes

    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question -> auto advance or submit
          if (currentIndex < questions.length - 1) {
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
  }, [currentIndex, submitted, showWarningModal, questions.length]);

  // Overall Test Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, showWarningModal]);

  const currentQ = questions[currentIndex] || defaultAptitudeQuestions[0];

  const handleSelectOption = (optIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let correctCount = 0;
    questions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 80;

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
              {isEliminated ? 'Exceeded 3 proctoring full-screen violations.' : `Target Enterprise: ${company} • ${role}`}
            </p>
          </div>

          {!isEliminated ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Aptitude Score</span>
              <span className="text-3xl font-black text-amber-400">{finalScore}%</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 space-y-1">
              <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block">Elimination Status</span>
              <span className="text-lg font-black text-rose-400">0% • Fullscreen Violation</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onComplete(isEliminated ? 0 : finalScore)}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Continue to Next Stage
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
          <CompanyLogo name={company} size="md" className="shadow-xs flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black font-display text-slate-100">{company}</h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                Aptitude &amp; Reasoning Test
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium block">{role}</span>
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
            Question {currentIndex + 1} of {questions.length}
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
                Single Choice • 20 Points
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed font-display">
              {currentQ.question}
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
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
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
              {questions.map((q, idx) => {
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
                <span className="text-emerald-400 font-extrabold">{answeredCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Remaining:</span>
                <span className="text-amber-400 font-extrabold">{questions.length - answeredCount}</span>
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
