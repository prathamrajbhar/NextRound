'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface ResumeHistoryItem {
  id: string;
  targetRole: string;
  createdAt: string;
  resumePdfUrl?: string;
}

export function useResumeHistory() {
  return useQuery({
    queryKey: ['resume-history'],
    queryFn: () => apiClient.get<{ history: ResumeHistoryItem[] }>('/resume-builder/history'),
  });
}

export function useMockFeedback(sessionId: string | null) {
  return useQuery({
    queryKey: ['mock-feedback', sessionId],
    queryFn: () => apiClient.get<Record<string, unknown>>(`/mock/sessions/${sessionId}/feedback`),
    enabled: Boolean(sessionId),
  });
}
