'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Job, Application, HRDashboardData } from '@/types';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Plus,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  ShieldAlert,
  Calendar,
  Clock,
} from '@/lib/lucide-google-icons';

export default function HrDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const [dashRes, jobsRes] = await Promise.allSettled([
          apiClient.get<HRDashboardData>('/hr/dashboard'),
          apiClient.get<Job[]>('/jobs/org'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          setDashboardData(dashRes.value);
          setApplications(dashRes.value.recentApplications || []);
        }

        if (jobsRes.status === 'fulfilled' && jobsRes.value) {
          setJobs(jobsRes.value);
        }
      } catch (err) {
        console.error('Failed to load HR dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'active');
  const totalCandidates = dashboardData?.totalApplicationsCount ?? applications.length;
  const interviewingCandidates = applications.filter((app) => app.status === 'interview_scheduled').length;
  const decisionsCount = dashboardData?.decisionsCount?.hire ?? applications.filter((app) => app.status === 'decided' && app.decision === 'hire').length;

  const vettedCandidates = applications.map((app) => {
    const tech = app.scores?.technical ?? 75;
    const comm = app.scores?.communication ?? 72;
    const composite = app.scores?.composite ?? Math.floor((tech + comm) / 2);
    const proctorFlagsCount = app.proctorFlags?.length ?? 0;

    return {
      ...app,
      tech,
      comm,
      composite,
      proctorFlagsCount,
    };
  });

  const upcomingAssessments = applications
    .filter((app) => app.confirmedSlot || app.status === 'interview_scheduled')
    .map((app) => ({
      id: app.id,
      candidateName: app.candidateName,
      jobTitle: app.jobTitle ? app.jobTitle.split('—')[0] : 'Job Position',
      slot: app.confirmedSlot || 'Scheduled',
    }));

  const totalApplied = totalCandidates;
  const totalVetted = applications.filter((a) => a.status === 'interviewed' || a.status === 'decided').length;
  const totalHired = decisionsCount;

  const vettedPct = totalApplied > 0 ? Math.round((totalVetted / totalApplied) * 100) : 0;
  const hiredPct = totalApplied > 0 ? Math.round((totalHired / totalApplied) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
              <div className="h-7 w-20 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-40 w-full bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-350">
      {/* Console Top branding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Check upcoming interviews, review candidate scores, and track hiring rates.
          </p>
        </div>
        <Link
          href="/hr/jobs/new"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Post a New Job
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-orange-950/50 border border-brand-100 dark:border-orange-900/60 flex items-center justify-center text-brand-600 dark:text-orange-400 shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{dashboardData?.activeJobsCount ?? activeJobs.length}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Active Jobs</span>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{totalCandidates}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Total Candidates</span>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{interviewingCandidates}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Scheduled Interviews</span>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{decisionsCount}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Hires Made</span>
          </div>
        </div>
      </div>

      {/* Main Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Active Postings & Vetting Action Queue */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Postings */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
              Active Jobs
            </h2>
            {activeJobs.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                No active job postings found. Click &quot;Post a New Job&quot; to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeJobs.slice(0, 2).map((job) => (
                  <div key={job.id} className="glass-card p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{job.title}</h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block mt-1">{job.location} • {job.salary}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">{job.applicantsCount || 0} in pipeline</span>
                      <Link
                        href={`/hr/jobs/${job.id}/pipeline`}
                        className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        View Pipeline
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Vetting Action Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                Candidates to Review
              </h2>
              <span className="text-xs font-bold text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-100 dark:border-orange-900/60 px-2.5 py-0.5 rounded-full uppercase">
                Needs Review
              </span>
            </div>

            <div className="glass-card overflow-hidden">
              {vettedCandidates.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                  No applications pending review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-white/20 dark:bg-slate-800/40 text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4.5">Candidate</th>
                        <th className="px-6 py-4.5">Evaluation Score</th>
                        <th className="px-6 py-4.5">Skills (Tech / Comm)</th>
                        <th className="px-6 py-4.5">Warnings</th>
                        <th className="px-6 py-4.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {vettedCandidates.map((app) => (
                        <tr key={app.id} className="hover:bg-white/20 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <span className="block font-black text-slate-800 dark:text-slate-100 text-sm">{app.candidateName}</span>
                            <span className="block text-xs text-slate-400 dark:text-slate-400 font-bold mt-0.5">{app.jobTitle ? app.jobTitle.split('—')[0] : 'Role'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border border-brand-100 dark:border-orange-900/60">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {app.composite}%
                            </span>
                          </td>
                          <td className="px-6 py-4 space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                                <span>Technical</span>
                                <span>{app.tech}%</span>
                              </div>
                              <div className="w-24 bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1">
                                <div className="bg-brand-500 dark:bg-orange-400 h-1 rounded-full" style={{ width: `${app.tech}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                                <span>Communication</span>
                                <span>{app.comm}%</span>
                              </div>
                              <div className="w-24 bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1">
                                <div className="bg-brand-500 dark:bg-orange-400 h-1 rounded-full" style={{ width: `${app.comm}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {app.proctorFlagsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 px-2.5 py-1 rounded-full">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {app.proctorFlagsCount === 1 ? '1 Warning' : `${app.proctorFlagsCount} Warnings`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                                No Flags
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Link
                              href={`/hr/candidates/${app.id}`}
                              className="inline-flex items-center gap-0.5 text-sm font-extrabold text-brand-600 dark:text-orange-400 hover:underline transition-colors"
                            >
                              Review Profile
                              <ChevronRight className="h-4.5 w-4.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Scheduled Assessments & Conversion Funnel */}
        <div className="space-y-6">
          {/* Upcoming Vetting Assessments */}
          <div className="glass-card p-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-600 dark:text-orange-400" />
              Upcoming Interviews
            </span>

            {upcomingAssessments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center py-2">No interviews scheduled</p>
            ) : (
              <div className="space-y-3.5">
                {upcomingAssessments.map((a) => (
                  <div key={a.id} className="space-y-1 border-b border-slate-200/60 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      <span>{a.candidateName}</span>
                      <span className="text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-100 dark:border-orange-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="h-3 w-3" />
                        {a.slot}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight">
                      <span>{a.jobTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vetting Conversion Funnel */}
          <div className="glass-card p-5 space-y-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
              Hiring Funnel
            </span>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Applied</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{totalApplied} Candidates</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
                  <div className="bg-brand-500 dark:bg-orange-400 h-0.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Interviewed</span>
                  <span className="font-extrabold text-brand-600 dark:text-orange-400">{totalVetted} Candidates ({vettedPct}%)</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
                  <div className="bg-brand-500 dark:bg-orange-400 h-0.5 rounded-full" style={{ width: `${vettedPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Hired</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{totalHired} Hires ({hiredPct}%)</span>
                </div>
                <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-0.5 rounded-full" style={{ width: `${hiredPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
