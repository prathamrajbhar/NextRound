export interface MockFunnelStep {
  stage: string;
  count: number;
  pct: number;
}

export interface MockMonthlyTrend {
  month: string;
  applicants: number;
  hires: number;
  passRate: number;
}

export interface MockBiasAuditStat {
  overallBiasFreeScore: number;
  genderParityPct: number;
  originEquityPct: number;
  flaggedPhrasesTotal: number;
}

export interface MockHRAnalytics {
  totalCandidatesProcessed: number;
  zeroHumanHires: number;
  avgTimeToOfferDays: number;
  biasReductionScore: number;
  funnel: MockFunnelStep[];
  monthlyTrends: MockMonthlyTrend[];
  biasAudit: MockBiasAuditStat[];
  departmentPassRates: Array<{ department: string; passPct: number; totalApplied: number }>;
}

export const MOCK_HR_ANALYTICS: MockHRAnalytics = {
  totalCandidatesProcessed: 1248,
  zeroHumanHires: 142,
  avgTimeToOfferDays: 4.2,
  biasReductionScore: 98.4,
  funnel: [
    { stage: 'Sourced', count: 1248, pct: 100 },
    { stage: 'Screened', count: 840, pct: 67.3 },
    { stage: 'Assessment', count: 480, pct: 38.4 },
    { stage: 'Voice Interview', count: 210, pct: 16.8 },
    { stage: 'Evaluation', count: 160, pct: 12.8 },
    { stage: 'Offer Sent', count: 142, pct: 11.3 }
  ],
  monthlyTrends: [
    { month: 'Jan', applicants: 120, hires: 12, passRate: 10.0 },
    { month: 'Feb', applicants: 155, hires: 18, passRate: 11.6 },
    { month: 'Mar', applicants: 180, hires: 22, passRate: 12.2 },
    { month: 'Apr', applicants: 210, hires: 24, passRate: 11.4 },
    { month: 'May', applicants: 245, hires: 28, passRate: 11.4 },
    { month: 'Jun', applicants: 290, hires: 32, passRate: 11.0 },
    { month: 'Jul', applicants: 310, hires: 36, passRate: 11.6 }
  ],
  biasAudit: [
    {
      overallBiasFreeScore: 98.4,
      genderParityPct: 99.1,
      originEquityPct: 97.8,
      flaggedPhrasesTotal: 4
    }
  ],
  departmentPassRates: [
    { department: 'Engineering', passPct: 32, totalApplied: 540 },
    { department: 'Product', passPct: 28, totalApplied: 220 },
    { department: 'AI & Data', passPct: 24, totalApplied: 180 },
    { department: 'DevOps & Security', passPct: 35, totalApplied: 160 },
    { department: 'Design & UX', passPct: 30, totalApplied: 148 }
  ]
};
