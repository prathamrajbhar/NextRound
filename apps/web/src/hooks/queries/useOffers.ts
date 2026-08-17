'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Offer, OnboardingRecord } from '@/types';

export function useOffer(applicationId: string | null) {
  return useQuery({
    queryKey: ['offer', applicationId],
    queryFn: () => apiClient.get<Offer>(`/candidate/applications/${applicationId}/offer`),
    enabled: Boolean(applicationId),
  });
}

export function useOnboarding(applicationId: string | null) {
  return useQuery({
    queryKey: ['onboarding', applicationId],
    queryFn: () => apiClient.get<OnboardingRecord>(`/candidate/applications/${applicationId}/onboarding`),
    enabled: Boolean(applicationId),
  });
}
