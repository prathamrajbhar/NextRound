'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';
import { Application, Job } from '@/types';
import { JobCard } from '@/components/ui';
import { Briefcase, Calendar, ArrowRight, Mic, Award } from '@/lib/lucide-google-icons';

interface CandidateDashboardData {
  applications: Application[];
  jobs: Job[];
  latestMockScore?: number;
}

export default function CandidateDashboard() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [latestMockScore, setLatestMockScore] = useState<number | null>(null);

  const candidateName = typeof window !== 'undefined' ? localStorage.getItem('candidate_name') || (user?.email ? user.email.split('@')[0] : 'Candidate') : (user?.email ? user.email.split('@')[0] : 'Candidate');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [dashRes, appsRes, jobsRes, mockRes] = await Promise.allSettled([
          apiClient.get<CandidateDashboardData>('/candidate/dashboard'),
          apiClient.get<Application[]>('/candidate/applications'),
          apiClient.get<Job[]>('/jobs'),
          apiClient.get<{ overall_score?: number }[]>('/mock/sessions'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          if (dashRes.value.applications) setApplications(dashRes.value.applications);
          if (dashRes.value.jobs) setJobs(dashRes.value.jobs);
          if (dashRes.value.latestMockScore !== undefined) setLatestMockScore(dashRes.value.latestMockScore);
        } else {
          if (appsRes.status === 'fulfilled' && appsRes.value) {
            setApplications(appsRes.value);
          }
          if (jobsRes.status === 'fulfilled' && jobsRes.value) {
            setJobs(jobsRes.value);
          }
        }

        if (mockRes.status === 'fulfilled' && Array.isArray(mockRes.value) && mockRes.value.length > 0) {
          const validScores = mockRes.value.map(s => s.overall_score).filter((s): s is number => typeof s === 'number');
          if (validScores.length > 0) {
            setLatestMockScore(validScores[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load candidate dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const safeApps = Array.isArray(applications) ? applications : [];
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  const scheduledInterviews = safeApps.filter((app) => app.status === 'interview_scheduled');
  const recommendations = safeJobs.slice(0, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back, {candidateName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Track your applications, read interview transcripts, and practice mock interviews.
          </p>
        </div>
        <Link
          href="/candidate/mock/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          Start Practice Mock
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card glass-card-indigo p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-100">{applications.length}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">Total Applications</span>
          </div>
        </div>

        <div className="glass-card glass-card-emerald p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-100">{scheduledInterviews.length}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">Scheduled Interviews</span>
          </div>
        </div>

        <div className="glass-card glass-card-purple p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-100">{latestMockScore !== null ? `${latestMockScore}%` : '--'}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">Latest Mock Score</span>
          </div>
        </div>
      </div>

      {/* Application Statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Applications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Active Applications</h2>
            <Link
              href="/candidate/applications"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-0.5"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {safeApps.map((app) => (
              <div
                key={app.id}
                className="glass-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{app.jobTitle}</h3>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block mt-0.5">{app.orgName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-2">Applied on {app.appliedDate}</span>
                </div>
                <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
                  <span className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${app.status === 'decided'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60'
                      : app.status === 'interview_scheduled'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/60'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/60'
                    }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/candidate/applications/${app.id}`}
                    className="text-center text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-full shadow-sm glass-panel"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Jobs for You</h2>
          <div className="space-y-4">
            {recommendations.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                orgName={job.orgName}
                orgLogo={job.orgLogo}
                title={job.title}
                description={job.description}
                location={job.location}
                salary={job.salary}
                experienceLevel={job.experienceLevel}
                postedDate={job.postedDate}
                status={job.status}
                matchScore={job.id === 'job-102' ? 89 : 74}
                viewHref={`/candidate/jobs/${job.id}`}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
