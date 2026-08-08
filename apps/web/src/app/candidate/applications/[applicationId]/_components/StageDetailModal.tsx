'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  ClipboardCheck,
  Video,
  UserCheck,
  Gift,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Award,
  Calendar,
} from '@/lib/lucide-google-icons';
import { Application, AssessmentResult, AsyncScreening, TakeHomeProject, Offer } from '@/types';

export interface StageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageIndex: number;
  app: Application;
  assessments?: AssessmentResult[];
  asyncScreening?: AsyncScreening | null;
  takeHome?: TakeHomeProject | null;
  offer?: Offer | null;
}

export function StageDetailModal({
  isOpen,
  onClose,
  stageIndex,
  app,
  assessments = [],
  asyncScreening,
  takeHome,
  offer,
}: StageDetailModalProps) {
  if (!isOpen) return null;

  const assessmentScore = assessments[0]?.overallScore ?? app.scores?.problemSolving ?? 85;
  const technicalScore = app.scores?.technical ?? 90;
  const commScore = app.scores?.communication ?? 88;
  const compositeScore = app.scores?.composite ?? Math.round((technicalScore + commScore + assessmentScore) / 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-500/10 dark:bg-orange-500/10 text-brand-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
              {stageIndex + 1}
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display">
                {stageIndex === 0 && 'Stage 1: Application Submission & Verification'}
                {stageIndex === 1 && 'Stage 2: AI Resume Screening Scorecard'}
                {stageIndex === 2 && 'Stage 3: Timed Skill & Aptitude Assessment'}
                {stageIndex === 3 && 'Stage 4: AI Voice Conversational Interview'}
                {stageIndex === 4 && 'Stage 5: Live 1:1 HR Round Evaluation'}
                {stageIndex === 5 && 'Stage 6: Final Outcome & Compensation Offer'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Application ID: <span className="font-mono text-[11px]">{app.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Stage 1: Applied */}
          {stageIndex === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Application successfully submitted on <strong>{app.appliedDate}</strong>.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Position Applied</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 block">{app.jobTitle}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Organization</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 block">{app.orgName || 'Northloop Mobility'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Submitted Resume & Details</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4 text-brand-500" />
                    <span className="truncate max-w-[240px]">{app.resumeUrl || 'Candidate_Resume.pdf'}</span>
                  </div>
                  {app.resumeUrl ? (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                      <span>View File</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Attached to Profile</span>
                  )}
                </div>
              </div>

              {app.skills && app.skills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Parsed Candidate Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {app.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Screened */}
          {stageIndex === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    {compositeScore}%
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-950 dark:text-indigo-100 text-sm">Overall Qualification Fit</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">AI Resume Match Agent Assessment</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200">
                  {compositeScore >= 80 ? 'Strong Match' : compositeScore >= 60 ? 'Moderate Match' : 'Pending Review'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Technical Fit</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{technicalScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${technicalScore}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Communication</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{commScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${commScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  AI Evaluation Reasoning
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {app.reasoning ||
                    'Candidate demonstrates strong background matching target role qualifications, domain experience, and core competencies required by the hiring team.'}
                </p>
              </div>

              {asyncScreening && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h5 className="font-bold text-purple-950 dark:text-purple-100">Async Video Screening Module</h5>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300">
                        Status: <strong className="capitalize">{asyncScreening.status}</strong>
                      </p>
                    </div>
                  </div>
                  <NextLink
                    href={`/candidate/applications/${app.id}/video-screening`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    Open Video
                  </NextLink>
                </div>
              )}
            </div>
          )}

          {/* Stage 3: Assessment */}
          {stageIndex === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Aptitude & Technical Skills Test</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Timed evaluation module with instant scoring</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Overall Score</span>
                  <span className="text-xl font-extrabold text-brand-600 dark:text-orange-400 font-display">
                    {assessmentScore}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold block">Logical Aptitude</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">90%</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold block">Coding Speed</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">85%</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold block">Problem Solving</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">90%</span>
                </div>
              </div>

              {takeHome && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-amber-600" />
                      Take-Home Project
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 capitalize">
                      {takeHome.status}
                    </span>
                  </div>
                  <p className="text-amber-900 dark:text-amber-200 text-[11px]">{takeHome.title || 'Technical Design & Implementation Assignment'}</p>
                </div>
              )}

              <div className="pt-2">
                <NextLink
                  href={`/candidate/mock/session-${app.id}?applicationId=${app.id}&track=aptitude`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-extrabold py-3 shadow-md transition-all"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Launch Assessment Console</span>
                </NextLink>
              </div>
            </div>
          )}

          {/* Stage 4: Interview */}
          {stageIndex === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-blue-950 dark:text-blue-100 text-sm">AI Voice Conversational Interview</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-[11px]">Real-time speech evaluation & technical depth check</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200">
                  {app.status === 'interviewed' ? 'Completed' : 'Ready'}
                </span>
              </div>

              {app.transcript && app.transcript.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Interview Highlights & Questions</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {app.transcript.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Q: {item.question}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] italic">&ldquo;{item.answer}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <ShieldCheck className="h-6 w-6 text-blue-500 mx-auto" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    The AI Interviewer Agent is ready to evaluate your domain expertise, problem-solving approach, and communication skills.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <NextLink
                  href={`/candidate/mock/session-${app.id}?applicationId=${app.id}&track=voice`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 shadow-md transition-all"
                >
                  <Video className="h-4 w-4" />
                  <span>Start AI Voice Interview</span>
                </NextLink>
              </div>
            </div>
          )}

          {/* Stage 5: HR Round */}
          {stageIndex === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Live 1:1 HR Evaluation Round</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Human HR video call & cultural fit review</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 uppercase">
                  {app.hrRoundStatus || 'SCHEDULED'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>
                    Scheduled Date:{' '}
                    <strong>{app.hrRoundScheduledAt || app.hrRoundCompletedAt || 'August 12, 2026 at 2:00 PM EST'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span>Duration: <strong>30 minutes</strong></span>
                </div>
              </div>

              <div className="pt-2">
                <NextLink
                  href="/candidate/hr-round"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 shadow-md transition-all"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule / Join HR Meeting</span>
                </NextLink>
              </div>
            </div>
          )}

          {/* Stage 6: Decision */}
          {stageIndex === 5 && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    <span>Hiring Decision & Compensation Offer</span>
                  </div>
                  {offer && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                      {offer.baseSalary}
                    </span>
                  )}
                </div>

                <p className="text-emerald-950 dark:text-emerald-100 leading-relaxed font-normal">
                  The hiring team and AI evaluation agents have compiled your multi-stage performance matrix.
                </p>
              </div>

              {offer ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Offer Status:</span>
                    <span className="font-extrabold uppercase text-emerald-600 dark:text-emerald-400">{offer.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Base Salary:</span>
                    <span className="font-extrabold">{offer.baseSalary}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                  Offer details being finalized by the recruitment manager.
                </div>
              )}

              <div className="pt-2 space-y-2">
                <NextLink
                  href={`/candidate/applications/${app.id}/offer`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 shadow-md transition-all"
                >
                  <span>Review & Sign Official Offer</span>
                  <ArrowRight className="h-4 w-4" />
                </NextLink>
                <NextLink
                  href={`/candidate/applications/${app.id}/onboarding`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 transition-all text-xs"
                >
                  <span>Go to Onboarding Checklist</span>
                </NextLink>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
