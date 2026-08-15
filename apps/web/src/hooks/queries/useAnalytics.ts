'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Job } from '@/types';

export interface HRAnalyticsData {
  jobs: Job[];
  totalApplicants: number;
  avgScore: number;
  timeToHire: number;
  [key: string]: unknown;
}

export function useHrAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'hr'],
    queryFn: async () => {
      const [analyticsRes, jobsRes] = await Promise.allSettled([
        apiClient.get<HRAnalyticsData>('/hr/analytics'),
        apiClient.get<Job[]>('/jobs'),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        return { ...analyticsRes.value, jobs: jobsRes.status === 'fulfilled' ? jobsRes.value : [] };
      }
      if (jobsRes.status === 'fulfilled') {
        return { jobs: jobsRes.value } as HRAnalyticsData;
      }
      throw new Error('Failed to load analytics');
    },
  });
}