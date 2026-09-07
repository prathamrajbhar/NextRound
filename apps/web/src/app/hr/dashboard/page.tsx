'use client';

import React from 'react';
import { useHrDashboard } from '@/hooks/queries';
import { HRDashboardData } from '@/types';
import { ErrorState } from '@/components/ui/ErrorState';
import { DashboardHeader } from './_components/DashboardHeader';
import { DashboardKpiCards } from './_components/DashboardKpiCards';
import { DashboardActiveJobsCard } from './_components/DashboardActiveJobsCard';
import { DashboardReviewTable, VettedCandidate } from './_components/DashboardReviewTable';
import { DashboardUpcomingInterviews, UpcomingAssessment } from './_components/DashboardUpcomingInterviews';
import { DashboardHiringFunnel } from './_components/DashboardHiringFunnel';
import { DashboardSkeleton } from './_components/DashboardSkeleton';

export default function HrDashboard() {
  const { data, isLoading, isError, error, refetch } = useHrDashboard();

  const jobs = data?.jobs ?? [];
  const applications = data?.dashboard?.recentApplications ?? [];
  const dashboardData: HRDashboardData | null = data?.dashboard ?? null;

  const activeJobs = jobs.filter((j) => j.status === 'active');
  const totalCandidates = dashboardData?.totalApplicationsCount ?? applications.length;
  const interviewingCandidates = applications.filter((app) => app.status === 'interview_scheduled').length;
  const decisionsCount =
    dashboardData?.decisionsCount?.hire ??
    applications.filter((app) => app.status === 'decided' && app.decision === 'hire').length;

  const vettedCandidates: VettedCandidate[] = applications.map((app) => ({
    ...app,
    tech: app.scores?.technical ?? 0,
    comm: app.scores?.communication ?? 0,
    composite: app.scores?.composite ?? 0,
    proctorFlagsCount: app.proctorFlags?.length ?? 0,
  }));

  const upcomingAssessments: UpcomingAssessment[] = applications
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-350">
      <DashboardHeader />

      <DashboardKpiCards
        activeJobsCount={dashboardData?.activeJobsCount ?? activeJobs.length}
        totalCandidates={totalCandidates}
        interviewingCandidates={interviewingCandidates}
        decisionsCount={decisionsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <DashboardActiveJobsCard activeJobs={activeJobs} />
          <DashboardReviewTable vettedCandidates={vettedCandidates} />
        </div>

        <div className="space-y-6">
          <DashboardUpcomingInterviews upcomingAssessments={upcomingAssessments} />
          <DashboardHiringFunnel
            totalApplied={totalApplied}
            totalVetted={totalVetted}
            vettedPct={vettedPct}
            totalHired={totalHired}
            hiredPct={hiredPct}
          />
        </div>
      </div>
    </div>
  );
}
