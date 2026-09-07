'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { RawResumeData } from './resumeResultMapper';
import type { ResumeStatus } from './useResumePolling';

type Stage = 'loading' | 'interview' | 'resume';

interface UseResumeSessionDetailsProps {
  sessionId: string;
  setResumeStatus: (status: ResumeStatus) => void;
}

export function useResumeSessionDetails({
  sessionId,
  setResumeStatus,
}: UseResumeSessionDetailsProps) {
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  useEffect(() => {
    let active = true;
    apiClient
      .get<{
        target_role?: string;
        difficulty?: string;
        status?: string;
        generated_resume?: RawResumeData;
        resume_pdf_url?: string;
      }>(`/resume-builder/${sessionId}`)
      .then((res) => {
        if (!active) return;
        if (!res) throw new Error('Session not found');

        setTargetRole(res.target_role || 'Senior Full Stack Engineer');
        setExperienceLevel(res.difficulty || 'Senior (5+ Years)');

        const status = res.status || 'created';
        if (status === 'active' || status === 'created') {
          setStage('interview');
        } else {
          setStage('resume');
          setResumeStatus('generating');
        }
        setLoadingSession(false);
      })
      .catch(() => {
        if (!active) return;
        setSessionError(
          'This practice session does not exist, or you do not have permission to view it.'
        );
        setLoadingSession(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId, setResumeStatus]);

  return {
    loadingSession,
    sessionError,
    stage,
    setStage,
    targetRole,
    experienceLevel,
  };
}
