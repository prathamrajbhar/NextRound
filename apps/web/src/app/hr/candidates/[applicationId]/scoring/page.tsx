'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useApplication } from '@/hooks/queries';
import { Application } from '@/types';
import {
  ChevronRight,
  Video,
  ArrowLeft,
  User,
} from '@/lib/lucide-google-icons';
import SkillsScorecard from '../components/SkillsScorecard';
import DecisionControl from '../components/DecisionControl';
import { CandidateHeader } from '../components/CandidateHeader';
import { AssessmentScorecard } from '../components/AssessmentScorecard';
import { ProctoringReportCard, type ProctoringReport } from '../components/ProctoringReportCard';
import { EvidenceReviewCard } from '../components/EvidenceReviewCard';
import { CandidateDetailSkeleton } from '@/components/ui';

interface AssessData {
  overallScore?: number;
  codingScore?: number;
  mcqScore?: number;
  completedDate?: string;
  [key: string]: unknown;
}

export default function HrCandidateScoringPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessData | null>(null);
  const [proctorReport, setProctorReport] = useState<ProctoringReport | null>(null);

  const { data: fetchedApp } = useApplication(applicationId);

  useEffect(() => {
    async function fetchScoringData() {
      try {
        setLoading(true);
        if (fetchedApp) {
          setApp({ ...fetchedApp, scores: fetchedApp.scores, reasoning: fetchedApp.reasoning || '' });

          const assessments = Array.isArray(fetchedApp.assessments) ? fetchedApp.assessments : [];
          const scored = assessments.filter((a) => typeof a.overallScore === 'number');
          if (scored.length > 0) {
            const aptitude = scored.find((a) => a.category === 'aptitude');
            const coding = scored.find((a) => a.category === 'coding');
            setAssessmentData({
              overallScore: aptitude?.overallScore ?? coding?.overallScore,
              mcqScore: aptitude?.overallScore,
              codingScore: coding?.overallScore,
              completedDate: scored[0].completedDate,
            });
          }

          const report = await apiClient
            .get<ProctoringReport>(`/proctoring/applications/${applicationId}/report`)
            .catch(() => null);
          if (report) setProctorReport(report);
        }
      } catch (err) {
        console.error('Failed to load candidate scoring:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScoringData();
  }, [fetchedApp, applicationId]);

  if (loading) {
    return <CandidateDetailSkeleton />;
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
        <div className="lg:col-span-2 space-y-6">
          <SkillsScorecard scores={app.scores} />

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              AI Agent Vetting Reasoning
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic border-l-2 border-brand-500 pl-3.5 py-1 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-2xl">
              &ldquo;{app.reasoning}&rdquo;
            </p>
          </div>

          <AssessmentScorecard assessmentData={assessmentData} />

          {proctorReport && (
            <EvidenceReviewCard
              recording={proctorReport.recording}
              evidence={proctorReport.evidence}
              riskScore={proctorReport.risk_score}
              summary={proctorReport.summary}
            />
          )}

          {proctorReport && <ProctoringReportCard report={proctorReport} />}
        </div>

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
          />
        </div>
      </div>
    </div>
  );
}
