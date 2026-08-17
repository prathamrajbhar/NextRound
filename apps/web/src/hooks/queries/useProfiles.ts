'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { CandidateProfileData } from '@/types';

export interface HrProfileData {
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
  title?: string;
  company?: string;
  org_name?: string;
  linkedin_url?: string;
  avatar?: string;
  specialties?: string[];
  profile?: Record<string, unknown>;
}

export function useCandidateProfile() {
  return useQuery({
    queryKey: ['profile', 'candidate'],
    queryFn: () => apiClient.get<{ profile?: CandidateProfileData }>('/candidate/profile'),
  });
}

export function useHrProfile() {
  return useQuery({
    queryKey: ['profile', 'hr'],
    queryFn: () => apiClient.get<{ profile: HrProfileData }>('/hr/profile'),
  });
}
