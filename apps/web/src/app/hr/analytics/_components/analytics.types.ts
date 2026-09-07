export interface HRAnalyticsData {
  totalCandidatesProcessed: number;
  zeroHumanHires: number;
  avgTimeToOfferDays: number;
  funnel: { stage: string; count: number; pct: number }[];
  monthlyTrends: { month: string; applicants: number; hires: number; passRate: number }[];
  kpis?: {
    totalApplications?: number;
    zeroHumanHires?: number;
    avgTimeToHireDays?: number;
  };
  dropoffAnalysis?: { stage: string; percentage: number; dropCount: number }[];
  weeklyFunnel?: { week?: string; applied?: number; offered?: number }[];
}

export const INITIAL_ANALYTICS: HRAnalyticsData = {
  totalCandidatesProcessed: 0,
  zeroHumanHires: 0,
  avgTimeToOfferDays: 0,
  funnel: [
    { stage: 'Sourced', count: 0, pct: 0 },
    { stage: 'Screened', count: 0, pct: 0 },
    { stage: 'Assessment', count: 0, pct: 0 },
    { stage: 'Voice Interview', count: 0, pct: 0 },
    { stage: 'Evaluation', count: 0, pct: 0 },
    { stage: 'Offer Sent', count: 0, pct: 0 },
  ],
  monthlyTrends: [],
};
