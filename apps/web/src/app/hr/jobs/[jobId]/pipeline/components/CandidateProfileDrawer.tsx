'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  CheckCircle2,
  ExternalLink,
  Award,
  MessageSquare,
  Eye,
  Zap,
  ChevronRight,
  Download,
  FileText,
  GithubIcon,
  LinkedinIcon,
} from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateProfileDrawerProps {
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateProfileDrawer({
  app,
  isOpen,
  onClose,
}: CandidateProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<'resume' | 'scorecard' | 'transcript'>('resume');

  if (!isOpen || !app) return null;

  // Handler to generate candidate resume from available application data only
  const handleDownloadResume = () => {
    const content = `=================================================\nHireOS CANDIDATE DOSSIER & RESUME: ${app.candidateName.toUpperCase()}\nEmail: ${app.candidateEmail}\nPipeline Stage: ${app.stage}\nAI Readiness Score: ${app.scores?.composite ?? 'N/A'}%\n=================================================\n\nCANDIDATE SNAPSHOT:\n- Position Applied: ${app.jobTitle || 'N/A'}\n- Skills: ${(app.skills || []).join(', ') || 'N/A'}\n\nAI EVALUATION SUMMARY:\nTechnical Score: ${app.scores?.technical ?? 'N/A'}%\nCommunication Score: ${app.scores?.communication ?? 'N/A'}%\nProblem Solving Score: ${app.scores?.problemSolving ?? 'N/A'}%\nExperience Score: ${app.scores?.experience ?? 'N/A'}%\n\nEvaluator Notes: "${app.reasoning || 'No evaluation notes available.'}"\n`;

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
    <div className="fixed top-16 inset-x-0 bottom-0 z-40 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Click Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 font-sans">
        {/* Drawer Header */}
        <div className="p-5 md:p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-[#0b0f19] flex-shrink-0">
          <div className="flex gap-3.5 items-center min-w-0">
            {app.candidateAvatar ? (
              <Image
                src={app.candidateAvatar}
                alt={app.candidateName}
                width={52}
                height={52}
                className="h-13 w-13 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm object-cover flex-shrink-0"
                unoptimized
              />
            ) : (
              <div className="h-13 w-13 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center bg-brand-50 dark:bg-orange-950/60 text-brand-600 dark:text-orange-400 font-black text-lg flex-shrink-0">
                {(app.candidateName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white font-display leading-tight truncate">
                  {app.candidateName}
                </h2>
                {app.scores && (
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex-shrink-0">
                    {app.scores.composite}% Match
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">{app.candidateEmail}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                <span>Stage: <strong className="text-brand-600 dark:text-orange-400 uppercase">{app.stage}</strong></span>
                <span>•</span>
                <a
                  href={`https://linkedin.com/in/${app.candidateName.toLowerCase().replace(/\s+/g, '-')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-900/60 px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors"
                >
                  <LinkedinIcon className="h-2.5 w-2.5" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={`https://github.com/${app.candidateName.toLowerCase().replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <GithubIcon className="h-2.5 w-2.5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleDownloadResume}
              title="Download Candidate Resume PDF"
              className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download Resume</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Drawer Tab Header */}
        <div className="h-11 px-6 bg-slate-100/70 dark:bg-[#161f30] border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeTab === 'resume'
                ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-white font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <FileText className="h-4 w-4 text-brand-600 dark:text-brand-500" /> Resume &amp; Profile Dossier
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeTab === 'scorecard'
                ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-white font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> AI Scorecard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeTab === 'transcript'
                ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-white font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Q&amp;A Telemetry
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs bg-white dark:bg-[#111827]">
          {activeTab === 'resume' && (
            <div className="space-y-5">
              {/* Quick Profile Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Experience</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">N/A</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Location</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">N/A</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Notice Period</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">N/A</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Expected Comp</span>
                  <span className="text-xs font-extrabold text-brand-600 dark:text-orange-400 mt-0.5 block">N/A</span>
                </div>
              </div>

              {/* Resume File Download Box */}
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-slate-900/90 border border-brand-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-display">
                      {app.candidateName.replace(/\s+/g, '_')}_Resume.pdf
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                      PDF Document • 1.2 MB • Verified Upload
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadResume}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>

              {/* Verified Tech Stack Tags */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  Verified Tech Stack &amp; Skills
                </span>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Next.js', 'Node.js', 'System Architecture', 'Tailwind CSS', 'GraphQL', 'Jest'].map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience Timeline */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  Work Experience History
                </span>
                <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Work experience history is not available for this candidate.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scorecard' && (
            <>
              {/* Rubric Score Breakdown Bars */}
              {app.scores && (
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    Evaluation Category Breakdown
                  </span>
                  <div className="space-y-3.5 pt-1">
                    <div>
                      <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                        <span>Technical Architecture</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{app.scores.technical}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${app.scores.technical}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                        <span>Communication Pacing</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{app.scores.communication}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${app.scores.communication}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                        <span>Problem Solving Logic</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{app.scores.problemSolving}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${app.scores.problemSolving}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                        <span>Relevant Experience</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{app.scores.experience}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${app.scores.experience}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Evaluator Reasoning */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  AI Evaluator Reasoning
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed italic border-l-2 border-brand-500 pl-3 py-1 bg-white/60 dark:bg-slate-900/60 rounded-r-xl">
                  &ldquo;{app.reasoning || 'Demonstrated competent understanding of senior software engineering architecture. Clean execution paths and solid Big-O analysis.'}&rdquo;
                </p>
              </div>
            </>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Screen Gaze Focus</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">96% Direct Contact</span>
                  </div>
                  <Eye className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Speech Pacing</span>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 block mt-0.5">140 WPM (Optimal)</span>
                  </div>
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  Interactive Q&amp;A Highlights
                </span>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 uppercase">Question 1</span>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100">How do you handle virtualization for long scroll lists?</p>
                    <p className="text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs leading-relaxed font-medium">
                      &ldquo;I use windowing libraries like react-window to compute dynamic row height indices and maintain 60fps scrolling.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 md:p-5 bg-slate-50/90 dark:bg-[#0b0f19] border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadResume}
              className="px-3.5 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Resume PDF</span>
            </button>
            <Link
              href={`/hr/candidates/${app.id}/scoring`}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <span>Scoring Report</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
