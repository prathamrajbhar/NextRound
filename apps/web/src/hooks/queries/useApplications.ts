'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Application } from '@/types';

export function useMyApplications() {
  return useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => apiClient.get<Application[]>('/applications/my'),
  });
}

export function useCandidateApplications() {
  return useQuery({
    queryKey: ['applications', 'candidate'],
    queryFn: () => apiClient.get<Application[]>('/candidate/applications'),
  });
}

export function useApplication(applicationId: string | null) {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => apiClient.get<Application>(`/applications/${applicationId}`),
    enabled: Boolean(applicationId),
  });
}
