'use client';

import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getScopedStorage } from '@/lib/storage';
import { useCandidateDashboard } from '@/hooks/queries';
import { ErrorState } from '@/components/ui/ErrorState';
import { CandidateDashboardHero } from './_components/CandidateDashboardHero';
import { CandidateStatsCards } from './_components/CandidateStatsCards';
import { CandidateApplicationsSection } from './_components/CandidateApplicationsSection';
import { CandidateJobsSection } from './_components/CandidateJobsSection';
import { CandidateQuickPrepHub } from './_components/CandidateQuickPrepHub';
import { CandidateDashboardSkeleton } from './_components/CandidateDashboardSkeleton';

export default function CandidateDashboard() {
  const { user } = useAuthContext();
  const { data, isLoading, isError, error, refetch } = useCandidateDashboard();

  const candidateName =
    typeof window !== 'undefined'
      ? getScopedStorage(user?.id, 'candidate_name') || (user?.email ? user.email.split('@')[0] : 'Candidate')
      : user?.email
      ? user.email.split('@')[0]
      : 'Candidate';

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CandidateDashboardSkeleton />;
  }

  const safeApps = Array.isArray(data?.applications) ? data!.applications : [];
  const safeJobs = Array.isArray(data?.jobs) ? data!.jobs : [];
  const latestMockScore = data?.latestMockScore ?? null;
  const scheduledInterviews = safeApps.filter((app) => app.status === 'interview_scheduled');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <CandidateDashboardHero candidateName={candidateName} totalAppsCount={safeApps.length} />

      <CandidateStatsCards
        totalApplications={safeApps.length}
        scheduledInterviewsCount={scheduledInterviews.length}
        latestMockScore={latestMockScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <CandidateApplicationsSection applications={safeApps} />
          <CandidateQuickPrepHub />
        </div>

        <div>
          <CandidateJobsSection jobs={safeJobs} />
        </div>
      </div>
    </div>
  );
}