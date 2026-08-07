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
} from '@/lib/lucide-google-icons';

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
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

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
          tabSwitchCount,
        });
      } catch (err) {
        console.warn('API submission warning:', err);
      }
    }

    setFinalScore(percentage);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-in fade-in duration-300 font-sans">
      {/* Top Header */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company} size="lg" className="shadow-md flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white font-display">{company}</span>
              <span className="h-1 w-1 rounded-full bg-slate-700"></span>
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Brain className="h-3 w-3" /> Aptitude &amp; Reasoning Test
              </span>
            </div>
            <h1 className="text-xs text-slate-400 font-semibold mt-0.5">{role}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>

          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      {/* Main Test Viewport */}
      {!submitted ? (
        <div className="w-full max-w-7xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 min-h-0">
          {/* Left Column (8 Cols): Question & Options Card */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Question {currentQ.id}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Single Choice • 20 Points
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-extrabold text-white leading-relaxed font-display">
              {currentQ.question}
            </h2>

            {/* 4 Options Grid */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs font-semibold flex-1">{option}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-5">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-full border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  Next Question <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Aptitude Test'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (4 Cols): Question Grid Palette & Progress */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-white font-display uppercase tracking-wider">
                Question Navigator
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Click any number to jump directly to the question.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-extrabold text-xs cursor-pointer transition-all border ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                        : isAnswered
                        ? 'border-emerald-800 bg-emerald-950/80 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <div className="flex justify-between items-center text-slate-400">
                <span>Answered:</span>
                <span className="text-emerald-400 font-bold">
                  {Object.keys(answers).length} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Remaining:</span>
                <span className="text-amber-400 font-bold">
                  {questions.length - Object.keys(answers).length}
                </span>
              </div>
              {tabSwitchCount > 0 && (
                <div className="flex justify-between items-center text-rose-400 font-semibold pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Focus Lost Count:</span>
                  <span className="font-extrabold">{tabSwitchCount} times</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.01]"
            >
              Submit &amp; Finish Test
            </button>
          </div>
        </div>
      ) : (
        /* Test Completion Results Card */
        <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl border border-slate-800 bg-slate-900 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <Award className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Test Completed
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2 font-display">
              Aptitude Score: {finalScore}%
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              You answered {Math.round((finalScore / 100) * questions.length)} out of{' '}
              {questions.length} questions correctly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onComplete(finalScore)}
            className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            View Evaluation Feedback
          </button>
        </div>
      )}
    </div>
  );
}
