'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';

export function useInterviewRoomData(interviewId: string) {
  const [app, setApp] = useState<Application | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function fetchApp() {
      try {
        const res = await apiClient.get<Application>(`/applications/${interviewId}`);
        if (res) {
          setApp(res);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      }
    }
    fetchApp();
  }, [interviewId]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiClient.get<{ profile: { id: string } }>('/candidate/profile');
        if (res?.profile?.id) {
          setCandidateId(res.profile.id);
        }
      } catch {
        // Non-blocking profile load
      }
    }
    loadProfile();
  }, []);

  return { app, candidateId, loadError };
}
