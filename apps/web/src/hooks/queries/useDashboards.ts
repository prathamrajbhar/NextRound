'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Application, Job, MockSession, HRDashboardData } from '@/types';

export interface CandidateDashboardData {
  applications: Application[];
  jobs: Job[];
  latestMockScore?: number;
}

export interface HrDashboardData {
  dashboard: HRDashboardData | null;
  jobs: Job[];
}

export function useHrDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'hr'],
    queryFn: async () => {
      const [dashRes, jobsRes] = await Promise.allSettled([
        apiClient.get<HRDashboardData>('/hr/dashboard'),
        apiClient.get<Job[]>('/jobs/org'),
      ]);

      const data: HrDashboardData = { dashboard: null, jobs: [] };

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        data.dashboard = dashRes.value;
      }
      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
        data.jobs = jobsRes.value;
      }

      if (dashRes.status === 'rejected' && jobsRes.status === 'rejected') {
        throw dashRes.reason;
      }

      return data;
    },
  });
}

export function useCandidateDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'candidate'],
    queryFn: async () => {
      const [dashRes, appsRes, jobsRes, mockRes] = await Promise.allSettled([
        apiClient.get<CandidateDashboardData>('/candidate/dashboard'),
        apiClient.get<Application[]>('/candidate/applications'),
        apiClient.get<Job[]>('/jobs'),
        apiClient.get<{ overall_score?: number }[]>('/mock/sessions'),
      ]);

      const data: CandidateDashboardData = { applications: [], jobs: [] };

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        if (Array.isArray(dashRes.value.applications)) data.applications = dashRes.value.applications;
        if (Array.isArray(dashRes.value.jobs)) data.jobs = dashRes.value.jobs;
        if (dashRes.value.latestMockScore !== undefined) data.latestMockScore = dashRes.value.latestMockScore;
      } else {
        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value)) {
          data.applications = appsRes.value;
        }
        if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
          data.jobs = jobsRes.value;
        }
      }

      if (mockRes.status === 'fulfilled' && Array.isArray(mockRes.value) && mockRes.value.length > 0) {
        const validScores = mockRes.value.map((s) => s.overall_score).filter((s): s is number => typeof s === 'number');
        if (validScores.length > 0) data.latestMockScore = validScores[0];
      }

      if (dashRes.status === 'rejected' && appsRes.status === 'rejected' && jobsRes.status === 'rejected') {
        throw dashRes.reason;
      }

      return data;
    },
  });
}

export function useMockSessions() {
  return useQuery({
    queryKey: ['mock-sessions'],
    queryFn: () => apiClient.get<MockSession[]>('/mock/sessions'),
  });
}