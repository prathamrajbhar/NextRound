'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application, Job } from '@/types';
import {
  ChevronRight,
  Download,
  FileText,
  ArrowLeft,
  User,
  CheckCircle2,
  Award,
} from '@/lib/lucide-google-icons';
import { CandidateHeader } from './components/CandidateHeader';
import { CandidateDetailSkeleton } from '@/components/ui';

export default function HrCandidateProfilePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCandidateProfile() {
      try {
        setLoading(true);
        const appData = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
        if (appData) {
          setApp(appData);
          if (appData.jobId) {
            const jobData = await apiClient.get<Job>(`/jobs/${appData.jobId}`).catch(() => null);
            if (jobData) setJob(jobData);
          }
        }
      } catch (err) {
        console.error('Failed to load candidate profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidateProfile();
  }, [applicationId]);

  if (loading) {
    return <CandidateDetailSkeleton />;
  }

  if (!app) {
    return (
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-8 text-center space-y-4 max-w-md mx-auto my-12 backdrop-blur-md glass-panel">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <User className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">Candidate Profile Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">The requested candidate profile may have been removed or does not exist.</p>
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

  const handleDownloadResume = () => {
    const content = `=================================================\nHireOS CANDIDATE DOSSIER: ${app.candidateName.toUpperCase()}\nEmail: ${app.candidateEmail}\nPipeline Stage: ${app.stage}\n=================================================\n\nCANDIDATE SNAPSHOT:\n- Position Applied: ${job?.title || app.jobTitle || 'N/A'}\n- Skills: ${(app.skills || []).join(', ') || 'N/A'}\n`;
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
          <Link
            href={`/hr/candidates/${app.id}/scoring`}
            className="inline-flex items-center gap-1.5 bg-emerald-600 dark:bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
          >
            <Award className="h-4 w-4" />
            <span>View Scoring Report</span>
          </Link>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <CandidateHeader app={app} />

      {/* Main Grid: Profile info & resume */}
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

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
              Work Experience History
            </h3>
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {app.workExperience && app.workExperience.length > 0 ? (
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 pl-4 space-y-5">
                  {app.workExperience.map((exp, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-orange-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between flex-wrap gap-1 font-extrabold">
                          <span className="text-slate-900 dark:text-slate-100">{exp.role}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{exp.duration}</span>
                        </div>
                        <p className="text-[11px] text-brand-600 dark:text-orange-400 font-bold">{exp.company}</p>
                        {exp.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 font-medium">Work experience history is not available for this candidate.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Profile Summary Details */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              Profile Meta Details
            </h4>
            <div className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Email Address</span>
                <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.candidateEmail}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Current Status</span>
                <span className="text-slate-800 dark:text-slate-200 block mt-0.5 capitalize">{app.stage}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Applied Role</span>
                <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{job?.title || app.jobTitle}</span>
              </div>
              {app.location && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Preferred Location</span>
                  <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.location}</span>
                </div>
              )}
              {app.noticePeriod && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Notice Period</span>
                  <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.noticePeriod}</span>
                </div>
              )}
              {app.expectedSalary && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Expected Salary</span>
                  <span className="text-slate-800 dark:text-slate-200 block mt-0.5">${app.expectedSalary.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
