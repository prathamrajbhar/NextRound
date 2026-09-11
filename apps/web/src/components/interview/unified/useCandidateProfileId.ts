import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

export function useCandidateProfileId(): string | null {
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiClient.get<{ profile: { id: string } }>('/candidate/profile');
        if (res && res.profile) {
          setCandidateId(res.profile.id);
        }
      } catch {
        // Non-blocking profile load
      }
    }
    loadProfile();
  }, []);

  return candidateId;
}
