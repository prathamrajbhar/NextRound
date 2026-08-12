'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application, Job } from '@/types';
import {
  ChevronRight,
  Video,
  ArrowLeft,
  Loader2,
  User,
} from '@/lib/lucide-google-icons';
import SkillsScorecard from '../components/SkillsScorecard';
import DecisionControl from '../components/DecisionControl';
import { CandidateHeader } from '../components/CandidateHeader';
import { AssessmentScorecard } from '../components/AssessmentScorecard';
import { ProctoringReportCard, type ProctoringReport } from '../components/ProctoringReportCard';

interface VoiceData {
  status?: 'pending_evaluation' | 'pending_review' | 'completed';
  score?: number;
  rubric?: { technical?: number; communication?: number; cultureFit?: number };
  feedback?: string;
}

interface AssessData {
  overallScore?: number;
  codingScore?: number;
  mcqScore?: number;
  [key: string]: unknown;
}

export default function HrCandidateScoringPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessData | null>(null);
  const [proctorReport, setProctorReport] = useState<ProctoringReport | null>(null);

  useEffect(() => {
    async function fetchScoringData() {
      try {
        setLoading(true);
        let appData = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
        if (!appData && typeof window !== 'undefined') {
          const storedHrResult = localStorage.getItem(`hrRoundResult_${applicationId}`);
          if (storedHrResult) appData = JSON.parse(storedHrResult);
        }

        if (appData) {
          let voiceInterviewData: VoiceData | null = null;
          if (typeof window !== 'undefined') {
            const localVoice = localStorage.getItem(`candidateInterview_${applicationId}`);
            if (localVoice) voiceInterviewData = JSON.parse(localVoice);
            
            const localAssess = localStorage.getItem(`assessmentResult_${applicationId}`);
            if (localAssess) setAssessmentData(JSON.parse(localAssess));
          }

          let mergedScores = appData.scores;
          let mergedReasoning = appData.reasoning || '';

          if (voiceInterviewData && voiceInterviewData.status === 'completed' && typeof voiceInterviewData.score === 'number') {
            mergedScores = {
              composite: voiceInterviewData.score,
              technical: voiceInterviewData.rubric?.technical ?? 0,
              communication: voiceInterviewData.rubric?.communication ?? 0,
              problemSolving: 0,
              experience: 0,
              confidence: 0,
            };
            mergedReasoning = voiceInterviewData.feedback || mergedReasoning;
          }

          const finalApp = { ...appData, scores: mergedScores, reasoning: mergedReasoning };
          setApp(finalApp);

          if (finalApp.jobId) {
            const jobData = await apiClient.get<Job>(`/jobs/${finalApp.jobId}`).catch(() => null);
            if (jobData) setJob(jobData);
          }

          const report = await apiClient.get<ProctoringReport>(`/proctoring/applications/${applicationId}/report`).catch(() => null);
          if (report) setProctorReport(report);
        }
      } catch (err) {
        console.error('Failed to load candidate scoring:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScoringData();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-orange-400" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <User className="h-12 w-12 mx-auto text-amber-500" />
        <h2 className="text-base font-extrabold text-slate-900">Scoring Report Not Found</h2>
        <Link href="/hr/jobs" className="inline-block px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-extrabold text-xs">
          Back to HR Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/hr/jobs" className="hover:text-brand-600 dark:hover:text-orange-400">Jobs</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <Link href={`/hr/jobs/${app.jobId}/pipeline`} className="hover:text-brand-600 dark:hover:text-orange-400">Pipeline</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <Link href={`/hr/candidates/${app.id}`} className="hover:text-brand-600 dark:hover:text-orange-400">{app.candidateName}</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-slate-200 font-extrabold">Scoring Report</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/hr/candidates/${app.id}`}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>View Profile</span>
          </Link>
        </div>
      </div>

      <CandidateHeader app={app} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <SkillsScorecard scores={app.scores} />

          {/* AI Evaluator Reasoning */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              AI Agent Vetting Reasoning
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic border-l-2 border-brand-500 pl-3.5 py-1 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-2xl">
              &ldquo;{app.reasoning}&rdquo;
            </p>
          </div>

          <AssessmentScorecard assessmentData={assessmentData} />

          {proctorReport && <ProctoringReportCard report={proctorReport} />}

          {/* Gap Analysis */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              Screening Gap Analysis
            </h3>
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Screening gap analysis not yet available.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Decision controls */}
        <div className="space-y-6">
          {app.stage?.toLowerCase() === 'hr round' && (
            <div className="rounded-3xl border border-brand-200/80 dark:border-orange-800/80 bg-brand-50/40 dark:bg-orange-950/40 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-brand-700 dark:text-orange-300 font-extrabold text-xs uppercase tracking-wider font-display">
                <Video className="h-4 w-4 text-brand-600 dark:text-orange-400" />
                <span>Human HR Round Console</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Launch live 1:1 WebRTC video call room with candidate and evaluate cultural fit.
              </p>
              <Link
                href={`/hr/interview/${app.id}`}
                className="w-full py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Video className="h-4 w-4" />
                <span>Start HR Video Call</span>
              </Link>
            </div>
          )}

          <DecisionControl
            appId={app.id}
            initialDecision={app.decision || 'hold'}
            initialReasoning={app.reasoning || ''}
            showApprovalButtons={true}
          />

          {/* Voice Session Replay */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
              Interview Session Replay
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Listen to recorded AI voice interview recording and dynamic transcript grading log.
            </p>
            <button
              type="button"
              onClick={() => alert('Playing recorded AI voice session audio...')}
              className="w-full py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Video className="h-4 w-4" />
              <span>Replay Voice Session</span>
            </button>

            {/* Engagement Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-left">
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gaze Contact</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">No data</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Speech Pacing</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">No data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
