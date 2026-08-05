'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getMockSessionFeedback } from '@/lib/mockData';
import {
  CheckCircle2,
  ChevronRight,
  Mic,
  Compass,
  Sparkles,
  MessageSquare,
  Activity,
  Layers,
  LayoutDashboard,
  Target,
  Zap,
  ShieldCheck,
  Eye,
  Clock,
  TrendingUp,
} from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';

export default function MockFeedbackPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const feedbackData = getMockSessionFeedback(sessionId);

  const [session, setSession] = useState({
    id: sessionId,
    targetCompany: feedbackData?.targetRole.split(' ')[0] || 'Swiggy',
    targetRole: feedbackData?.targetRole || 'Senior Full Stack Engineer',
    difficulty: 'senior',
    score: feedbackData?.overallScore || 84,
    feedback: feedbackData?.detailedBreakdown[0]?.feedback || 'Demonstrated deep familiarity with architecture.',
    rubric: {
      technical: feedbackData?.metrics['Technical Depth'] || 88,
      communication: feedbackData?.metrics['Communication & Tone'] || 85,
      cultureFit: feedbackData?.metrics['System Architecture'] || 80,
    },
    strengths: feedbackData?.keyStrengths || [],
    growthAreas: feedbackData?.areasToImprove || [],
    transcript: feedbackData?.transcriptHighlights.map(t => ({
      question: t.text,
      answer: t.note,
      feedback: `Speaker: ${t.speaker} (${t.timestamp})`
    })) || []
  });

  const performance =
    session.score >= 85
      ? { text: 'Excellent Match', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60' }
      : session.score >= 75
      ? { text: 'Strong Match', bg: 'bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border-brand-200 dark:border-orange-900/60' }
      : { text: 'Needs Calibration', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' };

  const transcript = session.transcript && session.transcript.length > 0 ? session.transcript : [
    {
      question: 'How do you handle virtualization and performance optimization for long scroll lists in high-throughput applications?',
      answer: 'I implement windowing libraries like react-window to render only visible items within the viewport. Additionally, I memoize item row components using React.memo.',
      feedback: 'Excellent explanation of windowing techniques and memory optimization.',
    }
  ];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
        <Link href="/candidate/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <Link href="/candidate/mock/new" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Mock Practice
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-bold">Report</span>
      </div>

      {/* Hero Scorecard Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 via-white/50 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-center">
          <CompanyLogo name={session.targetCompany} size="lg" className="shadow-md flex-shrink-0" />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 mb-1">
              <Sparkles className="h-3 w-3 text-brand-600 dark:text-orange-400" /> AI Evaluator Scorecard
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              {session.targetRole} Evaluation
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              <span>Target Blueprint: <strong className="text-emerald-600 dark:text-emerald-400">{session.targetCompany}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> Session Completed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Overall Readiness Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl md:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                {session.score}%
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 100</span>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold tracking-wider uppercase ${performance.bg}`}>
            {performance.text}
          </span>
        </div>
      </div>

      {/* Main 2-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Executive Feedback, Strengths, Competencies & Transcript */}
        <div className="lg:col-span-8 space-y-6">
          {/* Coaching Summary Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                Executive Assessment Summary
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 uppercase">
                Evaluator Verified
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold italic border-l-4 border-brand-500 dark:border-orange-400 pl-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-2xl">
              &ldquo;{session.feedback}&rdquo;
            </p>

            {/* Key Strengths & Growth Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Strengths
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {(session.strengths.length > 0 ? session.strengths : [
                    'Strong algorithmic reasoning and Big-O complexity analysis.',
                    'Clear verbal articulation of state isolation and React rendering performance.',
                    'Excellent gaze focus and camera engagement throughout the session.'
                  ]).map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                  <Target className="h-4 w-4 text-amber-500" /> Focus Areas for Growth
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {(session.growthAreas.length > 0 ? session.growthAreas : [
                    'Include explicit error validation paths in system edge-case handling.',
                    'Provide more quantitative metrics when describing system scale benchmarks.'
                  ]).map((g, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Competency Scorecard Panel */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                Competency Evaluation Breakdown
              </h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Benchmark Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {[
                { name: 'Technical Architecture', score: session.rubric.technical, color: 'bg-emerald-500' },
                { name: 'Communication & Pacing', score: session.rubric.communication, color: 'bg-indigo-500' },
                { name: 'Culture & Principles', score: session.rubric.cultureFit, color: 'bg-purple-500' },
              ].map((c) => (
                <div key={c.name} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {c.name}
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                      {c.score}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Target Passed</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className={`${c.color} h-full rounded-full`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Annotated Interview Transcript Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                Annotated Session Q&amp;A Breakdown
              </h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {transcript.length} Responses Evaluated
              </span>
            </div>

            <div className="space-y-6">
              {transcript.map((item: { question: string; answer: string; feedback?: string }, idx: number) => (
                <div key={idx} className="space-y-3 pb-5 border-b border-slate-200/60 dark:border-slate-800/60 last:border-none last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 text-[10px] font-extrabold text-brand-700 dark:text-orange-300 uppercase">
                      Question {idx + 1}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed font-display">
                    {item.question}
                  </h4>

                  <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                      Candidate Response
                    </span>
                    {item.answer}
                  </div>

                  <div className="flex items-start gap-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">Evaluator Calibration: </strong>
                      {item.feedback}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Category Metrics & Telemetry */}
        <div className="lg:col-span-4 space-y-6">
          {/* Eye Gaze & Telemetry Panel */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-500" />
                Gaze &amp; Biometric Telemetry
              </h3>
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/60">
                Verified
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Screen Gaze Focus
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    94% Direct Contact
                  </span>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Speech Pacing
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    142 WPM (Optimal)
                  </span>
                </div>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-3">
            <Link
              href="/candidate/mock/new"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold py-3.5 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Mic className="h-4 w-4" />
              <span>Practice Another Company</span>
            </Link>

            <Link
              href="/candidate/jobs"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold py-3 text-xs shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Compass className="h-4 w-4 text-slate-400" />
              <span>Browse Open Jobs</span>
            </Link>

            <Link
              href="/candidate/dashboard"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/60 font-bold py-3 text-xs shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
