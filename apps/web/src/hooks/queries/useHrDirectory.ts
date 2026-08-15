'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  avatar: string;
  currentTitle: string;
  currentCompany: string;
  location: string;
  skills: string[];
  matchScore: number;
  similarityScore: number | null;
  source: string;
  sourcedDate: string;
  status: string;
  notes?: string;
}

export function useTalentPool(query: string) {
  return useQuery({
    queryKey: ['talent-pool', query],
    queryFn: () =>
      apiClient.get<{ candidates: TalentCandidate[]; total: number }>(
        `/hr/talent-pool${query ? `?query=${encodeURIComponent(query)}` : ''}`
      ),
  });
}

export function useSentimentProfiles() {
  return useQuery({
    queryKey: ['sentiment-profiles'],
    queryFn: () => apiClient.get<{ profiles: Record<string, unknown>[] }>('/hr/sentiment'),
  });
}