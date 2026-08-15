'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Job } from '@/types';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs', 'public'],
    queryFn: () => apiClient.get<Job[]>('/jobs'),
  });
}

export function useOrgJobs() {
  return useQuery({
    queryKey: ['jobs', 'org'],
    queryFn: () => apiClient.get<Job[]>('/jobs/org'),
  });
}

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => apiClient.get<Job>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });
}