'use client';

import React, { useState } from 'react';
import { useHrAnalytics } from '@/hooks/queries';
import { Job } from '@/types';
import { AnalyticsKpiCards } from './_components/AnalyticsKpiCards';
import { StageBreakdownChart } from './_components/StageBreakdownChart';
import { AnalyticsGridSkeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { HRAnalyticsData, INITIAL_ANALYTICS } from './_components/analytics.types';
import { AnalyticsHeader } from './_components/AnalyticsHeader';
import { MonthlyApplicantsChart } from './_components/MonthlyApplicantsChart';
import { DropoffAnalysisCard } from './_components/DropoffAnalysisCard';
import { AiAccuracyCard } from './_components/AiAccuracyCard';
import { ActiveJobListingsTable } from './_components/ActiveJobListingsTable';

export default function HrAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [department, setDepartment] = useState<string>('all');

  const { data, isLoading, isError, error, refetch } = useHrAnalytics();

  const raw = (data ?? {}) as HRAnalyticsData & { jobs?: Job[] };

  const funnel = Array.isArray(raw.funnel)
    ? raw.funnel
    : Array.isArray(raw.weeklyFunnel)
    ? raw.weeklyFunnel.map((w) => ({ stage: w.week || 'Week', count: w.applied || 0, pct: 0 }))
    : INITIAL_ANALYTICS.funnel;

  const monthlyTrends = Array.isArray(raw.monthlyTrends)
    ? raw.monthlyTrends
    : Array.isArray(raw.weeklyFunnel)
    ? raw.weeklyFunnel.map((w) => ({ month: w.week || 'W1', applicants: w.applied || 0, hires: w.offered || 0, passRate: 0 }))
    : INITIAL_ANALYTICS.monthlyTrends;

  const analyticsData: HRAnalyticsData = {
    ...raw,
    totalCandidatesProcessed: raw.kpis?.totalApplications ?? raw.totalCandidatesProcessed ?? 0,
    zeroHumanHires: raw.kpis?.zeroHumanHires ?? raw.zeroHumanHires ?? 0,
    avgTimeToOfferDays: raw.kpis?.avgTimeToHireDays ?? raw.avgTimeToOfferDays ?? 0,
    funnel,
    monthlyTrends,
  };
  const jobs: Job[] = Array.isArray(raw.jobs) ? raw.jobs : [];

  const safeFunnel = Array.isArray(analyticsData?.funnel) ? analyticsData.funnel : INITIAL_ANALYTICS.funnel;
  const safeTrends = Array.isArray(analyticsData?.monthlyTrends) ? analyticsData.monthlyTrends : INITIAL_ANALYTICS.monthlyTrends;

  const funnelSteps = safeFunnel.map((f) => ({ name: f.stage, count: f.count, pct: f.pct }));
  const trendData = safeTrends.map((t) => ({ month: t.month, count: t.applicants, hires: t.hires }));

  const handleExportCSV = () => {
    const csvContent =
      'Stage,Candidate Count,Percentage\n' +
      funnelSteps.map((s) => `"${s.name}",${s.count},${s.pct}%`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireOS_Hiring_Analytics_${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    return <AnalyticsGridSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      <AnalyticsHeader
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        department={department}
        setDepartment={setDepartment}
        onExportCSV={handleExportCSV}
      />

      <AnalyticsKpiCards data={(analyticsData as unknown as { kpis?: Record<string, number> })?.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <StageBreakdownChart funnelSteps={funnelSteps} />
          <MonthlyApplicantsChart trendData={trendData} />
        </div>

        <div className="space-y-6">
          <DropoffAnalysisCard dropoffAnalysis={analyticsData.dropoffAnalysis} />
          <AiAccuracyCard
            avgTimeToOfferDays={analyticsData.avgTimeToOfferDays ?? 0}
            zeroHumanHires={analyticsData.zeroHumanHires ?? 0}
          />
        </div>
      </div>

      <ActiveJobListingsTable jobs={jobs} />
    </div>
  );
}
