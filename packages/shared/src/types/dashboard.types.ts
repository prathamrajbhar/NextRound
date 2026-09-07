import { Application } from './application.types';

export interface HRDashboardData {
  kpis: {
    activeJobs: number;
    totalApplicants: number;
    avgTimeToHireDays: number;
    pendingInterviews: number;
  };
  stageDistribution: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface HRAnalyticsData {
  weeklyFunnel: Array<{ week: string; applied: number; screened: number; interviewed: number; offered: number }>;
  stageConversionRates: Record<string, number>;
}

export interface CandidateDashboardData {
  kpis: {
    totalApplications: number;
    activeInterviews: number;
    offersReceived: number;
  };
  applications: Application[];
  nextInterview?: {
    id: string;
    jobTitle: string;
    companyName: string;
    scheduledAt: string;
  } | null;
}

export interface HRAnalyticsOverviewDTO {
  kpis: {
    totalApplications: number;
    activeJobs: number;
    avgTimeToHireDays: number;
    offerAcceptanceRatePercent: number;
  };
  weeklyFunnel: Array<{ week: string; applied: number; screened: number; interviewed: number; offered: number }>;
  stageConversionRates: Record<string, number>;
  dropoffAnalysis: Array<{ stage: string; dropCount: number; percentage: number }>;
}
