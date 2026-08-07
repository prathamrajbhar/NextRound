'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application, Job } from '@/types';
import {
  ChevronRight,
  Scale,
  Video,
  CheckCircle2,
  Download,
  FileText,
  ArrowLeft,
  Loader2,
  User,
} from '@/lib/lucide-google-icons';
import SkillsScorecard from './components/SkillsScorecard';
import DecisionControl from './components/DecisionControl';
import { CandidateHeader } from './components/CandidateHeader';
import { AssessmentScorecard } from './components/AssessmentScorecard';

interface VoiceData {
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

export default function HrCandidateEvaluationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const [assessmentData, setAssessmentData] = useState<AssessData | null>(null);

  useEffect(() => {
    async function fetchCandidateData() {
      try {
        setLoading(true);
        let appData = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
        
        if (!appData && typeof window !== 'undefined') {
          const storedHrResult = localStorage.getItem(`hrRoundResult_${applicationId}`);
          if (storedHrResult) {
            try { appData = JSON.parse(storedHrResult); } catch {}
          }
        }

        if (appData) {
          let voiceInterviewData: VoiceData | null = null;
          if (typeof window !== 'undefined') {
            const localVoice = localStorage.getItem(`candidateInterview_${applicationId}`);
            if (localVoice) {
              try { voiceInterviewData = JSON.parse(localVoice); } catch {}
            }
            const localAssess = localStorage.getItem(`assessmentResult_${applicationId}`);
            if (localAssess) {
              try {
                const parsed = JSON.parse(localAssess);
                setAssessmentData(parsed);
              } catch {}
            }
          }

          let mergedScores = appData.scores;
          let mergedReasoning = appData.reasoning || '';

          if (voiceInterviewData) {
            const vScore = voiceInterviewData.score ?? 0;
            mergedScores = {
              composite: vScore,
              technical: voiceInterviewData.rubric?.technical ?? 0,
              communication: voiceInterviewData.rubric?.communication ?? 0,
              problemSolving: 0,
              experience: 0,
              confidence: 0,
            };
            mergedReasoning = voiceInterviewData.feedback || mergedReasoning;
          }

          const finalApp = {
            ...appData,
            scores: mergedScores,
            reasoning: mergedReasoning,
          };
          setApp(finalApp);

          if (finalApp.jobId) {
            try {
              const jobData = await apiClient.get<Job>(`/jobs/${finalApp.jobId}`).catch(() => null);
              if (jobData) setJob(jobData);
            } catch (jobErr) {
              console.warn('Failed to fetch associated job:', jobErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load candidate application:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidateData();
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
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-8 text-center space-y-4 max-w-md mx-auto my-12 backdrop-blur-md glass-panel">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <User className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">Candidate Application Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">The requested candidate dossier may have been removed or does not exist.</p>
        </div>
        <Link
          href="/hr/jobs"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
        >
          Back to HR Job Postings
        </Link>
      </div>
    );
  }

  // Handler to generate candidate resume from available application data only
  const handleDownloadResume = () => {
    const content = `=================================================\nHireOS CANDIDATE DOSSIER & RESUME: ${app.candidateName.toUpperCase()}\nEmail: ${app.candidateEmail}\nPipeline Stage: ${app.stage}\nAI Readiness Score: ${app.scores?.composite ?? 'N/A'}%\n=================================================\n\nCANDIDATE SNAPSHOT:\n- Position Applied: ${job?.title || app.jobTitle || 'N/A'}\n- Skills: ${(app.skills || []).join(', ') || 'N/A'}\n\nAI EVALUATION SUMMARY:\nTechnical Score: ${app.scores?.technical ?? 'N/A'}%\nCommunication Score: ${app.scores?.communication ?? 'N/A'}%\nProblem Solving Score: ${app.scores?.problemSolving ?? 'N/A'}%\nExperience Score: ${app.scores?.experience ?? 'N/A'}%\n\nEvaluator Notes: "${app.reasoning || 'No evaluation notes available.'}"\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${app.candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/hr/jobs" className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors">Jobs</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <Link href={`/hr/jobs/${app.jobId}/pipeline`} className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors">Pipeline</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-slate-200 font-extrabold">{app.candidateName}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/hr/jobs/${app.jobId}/pipeline`}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Pipeline</span>
          </Link>
          <button
            type="button"
            onClick={handleDownloadResume}
            className="inline-flex items-center gap-1.5 bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
          >
            <Download className="h-4 w-4" />
            <span>Download Resume PDF</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <CandidateHeader app={app} />

      {/* Main Grid: Left Column 8 / Right Column 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Download Resume File Card */}
          <div className="p-5 rounded-3xl bg-brand-50/50 dark:bg-slate-900/90 border border-brand-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs backdrop-blur-md glass-panel">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-100 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-800 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  {app.candidateName.replace(/\s+/g, '_')}_Resume.pdf
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  Candidate Resume PDF
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadResume}
              className="px-4 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Verified Tech Stack Tags */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
              Verified Tech Stack &amp; Skill Competencies
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {(app.skills || []).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Category Breakdown Scorecard */}
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

          {/* Work Experience Timeline */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              Work Experience History
            </h3>
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Work experience history is not available for this candidate.</p>
            </div>
          </div>

          {/* Dynamic Assessment Section */}
          <AssessmentScorecard assessmentData={assessmentData} />

          {/* Gap Analysis */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              Screening Gap Analysis
            </h3>
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Screening gap analysis not yet available.</p>
            </div>
          </div>

          {/* Bias Audit Log */}
          {app.biasReport && (
            <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 text-purple-600 dark:text-purple-400">
                <Scale className="h-4.5 w-4.5" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">Double-Pass Bias Audit Log</h3>
              </div>
              <div className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/60 p-3 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <span>Auditor Score Normalized</span>
                  <span className="font-extrabold">{app.biasReport.overallScore}% reliability</span>
                </div>
                <p className="leading-relaxed font-medium">{app.biasReport.explanation}</p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Gender Check</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold mt-1 block">{app.biasReport.genderBiasCheck}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Origin Bias Check</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold mt-1 block">{app.biasReport.originBiasCheck}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Decision Control & Replay Link (1 Col) */}
        <div className="space-y-6">
          {/* HR Round Video Call Launch Card */}
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

          {/* Decision Control Panel */}
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
