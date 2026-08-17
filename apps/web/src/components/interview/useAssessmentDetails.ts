'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { MockSession, Application } from '@/types';

interface UseAssessmentDetailsOptions {
  sessionId: string;
  applicationId?: string;
  company?: string;
  role?: string;
}

export function useAssessmentDetails({ sessionId, applicationId, company, role }: UseAssessmentDetailsOptions) {
  const [session, setSession] = useState<Partial<MockSession>>({
    id: sessionId,
    targetCompany: company || '',
    targetRole: role || '',
  });
  const [app, setApp] = useState<Partial<Application> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!applicationId && sessionId && sessionId !== 'new' && sessionId !== 'practice') {
          const res = await apiClient.get<{ session: MockSession }>(`/mock/sessions/${sessionId}`).catch(() => null);
          if (res?.session) setSession(res.session);
        }
        if (applicationId) {
          const resApp = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
          if (resApp) setApp(resApp);
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
      }
    }
    fetchData();
  }, [sessionId, applicationId]);

  const targetCompany = app?.orgName || session.targetCompany || company || '';
  const targetRole = app?.jobTitle || session.targetRole || role || '';

  return { targetCompany, targetRole };
}
