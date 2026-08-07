'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';
import { Application, Job } from '@/types';
import { CandidateDashboardHero } from './_components/CandidateDashboardHero';
import { CandidateStatsCards } from './_components/CandidateStatsCards';
import { CandidateApplicationsSection } from './_components/CandidateApplicationsSection';
import { CandidateJobsSection } from './_components/CandidateJobsSection';
import { CandidateQuickPrepHub } from './_components/CandidateQuickPrepHub';
import { CandidateDashboardSkeleton } from './_components/CandidateDashboardSkeleton';

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

  const candidateName =
    typeof window !== 'undefined'
      ? localStorage.getItem('candidate_name') || (user?.email ? user.email.split('@')[0] : 'Candidate')
      : user?.email
      ? user.email.split('@')[0]
      : 'Candidate';

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
          if (appsRes.status === 'fulfilled' && appsRes.value && Array.isArray(appsRes.value)) {
            setApplications(appsRes.value);
          }
          if (jobsRes.status === 'fulfilled' && jobsRes.value && Array.isArray(jobsRes.value)) {
            setJobs(jobsRes.value);
          }
        }

        if (mockRes.status === 'fulfilled' && Array.isArray(mockRes.value) && mockRes.value.length > 0) {
          const validScores = mockRes.value.map((s) => s.overall_score).filter((s): s is number => typeof s === 'number');
          if (validScores.length > 0) {
            setLatestMockScore(validScores[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load candidate dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <CandidateDashboardSkeleton />;
  }

  const safeApps = Array.isArray(applications) ? applications : [];
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const scheduledInterviews = safeApps.filter((app) => app.status === 'interview_scheduled');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <CandidateDashboardHero candidateName={candidateName} totalAppsCount={safeApps.length} />

      {/* Performance & Metric Cards */}
      <CandidateStatsCards
        totalApplications={safeApps.length}
        scheduledInterviewsCount={scheduledInterviews.length}
        latestMockScore={latestMockScore}
      />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Active Applications */}
        <div className="lg:col-span-2 space-y-8">
          <CandidateApplicationsSection applications={safeApps} />
          <CandidateQuickPrepHub />
        </div>

        {/* Right 1 Col: Jobs Recommendations */}
        <div>
          <CandidateJobsSection jobs={safeJobs} />
        </div>
      </div>
    </div>
  );
}
