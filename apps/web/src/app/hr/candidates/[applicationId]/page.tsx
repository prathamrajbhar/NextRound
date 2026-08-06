'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { mockApplications, getStoredJobs } from '@/lib/mockData';
import {
  ChevronRight,
  Scale,
  Video,
  CheckCircle2,
  Download,
  FileText,
  ArrowLeft,
} from '@/lib/lucide-google-icons';
import SkillsScorecard from './components/SkillsScorecard';
import DecisionControl from './components/DecisionControl';
import { CandidateHeader } from './components/CandidateHeader';
import { AssessmentScorecard } from './components/AssessmentScorecard';

import { Application } from '@/lib/mockData';

interface VoiceData {
  score?: number;
  rubric?: { technical?: number; communication?: number; cultureFit?: number };
  feedback?: string;
}

interface AssessData {
  overallScore?: number;
  codingScore?: number;
  mcqScore?: number;
}

export default function HrCandidateEvaluationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [assessmentData] = useState<Record<string, number | string | undefined> | null>(() => {
    if (typeof window === 'undefined') return null;
    const localAssess = localStorage.getItem(`assessmentResult_${applicationId}`);
    if (localAssess) {
      try {
        return JSON.parse(localAssess);
      } catch {}
    }
    return null;
  });

  const [app] = useState<Application>(() => {
    const defaultAppObj = mockApplications.find((a) => a.id === applicationId) || mockApplications[0];
    if (typeof window === 'undefined') return defaultAppObj;

    let voiceInterviewData: VoiceData | null = null;
    const localVoice = localStorage.getItem(`candidateInterview_${applicationId}`);
    if (localVoice) {
      try {
        voiceInterviewData = JSON.parse(localVoice);
      } catch {}
    }

    let assessData: AssessData | null = null;
    const localAssess = localStorage.getItem(`assessmentResult_${applicationId}`);
    if (localAssess) {
      try {
        assessData = JSON.parse(localAssess);
      } catch {}
    }

    let mergedScores = defaultAppObj.scores || {
      composite: 86,
      technical: 88,
      communication: 82,
      problemSolving: 85,
      experience: 89,
      confidence: 90,
    };
    let mergedReasoning = defaultAppObj.reasoning || 'Demonstrated competent understanding of senior software engineering architecture. Clean execution paths and solid Big-O analysis.';

    if (assessData) {
      mergedScores = {
        composite: Math.round(((assessData.overallScore || 80) + (voiceInterviewData?.score || 78)) / 2),
        technical: assessData.codingScore || 80,
        communication: voiceInterviewData?.rubric?.communication || mergedScores.communication || 75,
        problemSolving: assessData.mcqScore || 80,
        experience: mergedScores.experience || 75,
        confidence: voiceInterviewData?.rubric?.cultureFit || mergedScores.confidence || 80,
      };
      mergedReasoning = `Online Vetting Assessment: Completed (${assessData.overallScore}% score). MCQ Logic: ${assessData.mcqScore}%, Coding algorithm: ${assessData.codingScore}%. ` + (voiceInterviewData?.feedback || mergedReasoning);
    } else if (voiceInterviewData) {
      const vScore = voiceInterviewData.score || 80;
      mergedScores = {
        composite: vScore,
        technical: voiceInterviewData.rubric?.technical || 80,
        communication: voiceInterviewData.rubric?.communication || 80,
        problemSolving: Math.floor(vScore * 0.95),
        experience: Math.floor(vScore * 0.92),
        confidence: Math.floor(vScore * 0.98),
      };
      mergedReasoning = voiceInterviewData.feedback || mergedReasoning;
    }

    return {
      ...defaultAppObj,
      scores: mergedScores,
      reasoning: mergedReasoning,
    };
  });

  if (!app) {
    return <div className="text-center text-xs text-slate-400 dark:text-slate-500 p-8 font-bold">Loading candidate profile...</div>;
  }

  const jobsList = getStoredJobs();
  const job = jobsList.find((j) => j.id === app.jobId);

  // Handler to generate and download candidate PDF resume
  const handleDownloadResume = () => {
    const content = `=================================================\nHireOS CANDIDATE DOSSIER & RESUME: ${app.candidateName.toUpperCase()}\nEmail: ${app.candidateEmail}\nPipeline Stage: ${app.stage}\nAI Readiness Score: ${app.scores?.composite || 85}%\n=================================================\n\nCANDIDATE SNAPSHOT:\n- Position Applied: ${job?.title || app.jobTitle || 'Senior Frontend Engineer'}\n- Total Experience: 5+ Years\n- Location: San Francisco, CA (Remote)\n- Availability: Immediate (2 Weeks Notice)\n- Primary Tech Stack: React, TypeScript, Next.js, Node.js, System Architecture\n\nPROFESSIONAL EXPERIENCE:\n\n1. Senior Frontend Engineer — TechCorp (2022 - Present)\n   - Built high-throughput order checkout pipelines serving 5M daily users.\n   - Virtualized menu lists and improved LCP by 42%.\n   - Managed micro-frontend state isolation and performance telemetry.\n\n2. Software Engineer — DataSystems (2020 - 2022)\n   - Architected React component libraries with TypeScript & Tailwind.\n   - Reduced bundle sizes by 35% through tree-shaking and dynamic code splitting.\n\nAI EVALUATION SUMMARY:\nTechnical Score: ${app.scores?.technical || 90}%\nCommunication Score: ${app.scores?.communication || 85}%\nProblem Solving Score: ${app.scores?.problemSolving || 88}%\nExperience Score: ${app.scores?.experience || 85}%\n\nEvaluator Notes: "${app.reasoning || 'Demonstrated competent understanding of senior software engineering architecture.'}"\n`;

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
                  Verified Candidate PDF Resume • 1.2 MB • Uploaded on {app.appliedDate}
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
              {(app.skills || ['React', 'TypeScript', 'Next.js', 'Node.js', 'System Architecture', 'Tailwind CSS', 'GraphQL']).map((skill: string, idx: number) => (
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
              <div className="border-l-2 border-brand-500 pl-3.5 space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Senior Frontend Engineer — TechCorp</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">2022 - Present • 2 yrs 6 mos</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-1">
                  Built high-throughput order checkout pipelines serving 5M daily users. Virtualized menu lists and improved LCP by 42%.
                </p>
              </div>

              <div className="border-l-2 border-indigo-500 pl-3.5 space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Software Engineer — DataSystems</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">2020 - 2022 • 2 yrs</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-1">
                  Architected React micro-frontends with TypeScript. Managed state isolation and dynamic event bus channels.
                </p>
              </div>
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
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">Matched Qualifications</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300 font-medium">Excellent typescript configuration capabilities, react concurrent streaming, aspect ratio layout shift adjustments.</p>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">Gaps &amp; Growth Areas</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300 font-medium">Relatively light backend experience, lacks extensive distributed queuing knowledge (e.g. BullMQ, RabbitMQ).</p>
              </div>
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
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">96% Direct</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Speech Pacing</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">140 WPM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
