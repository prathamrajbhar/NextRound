'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ATSResumeData } from '@/types';
import { RawResumeData, mapRawToAtsResume } from './resumeResultMapper';

export type ResumeStatus = 'idle' | 'generating' | 'completed' | 'error';

const DEFAULT_RESUME: ATSResumeData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  atsScore: 0,
  scoreBreakdown: [],
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
};

interface UseResumePollingProps {
  sessionId: string;
  stage: string;
  resumeStatus: ResumeStatus;
  targetRole: string;
  setResumeStatus: (status: ResumeStatus) => void;
}

export function useResumePolling({
  sessionId,
  stage,
  resumeStatus,
  targetRole,
  setResumeStatus,
}: UseResumePollingProps) {
  const [resumeData, setResumeData] = useState<ATSResumeData>(DEFAULT_RESUME);

  useEffect(() => {
    if (stage !== 'resume' || !sessionId || resumeStatus !== 'generating') return;

    const deadline = Date.now() + 120_000;

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient.get<{
          status: string;
          generatedResume: RawResumeData;
          resumePdfUrl: string;
        }>(`/resume-builder/${sessionId}/result`);

        if (res && res.status === 'completed') {
          clearInterval(pollInterval);
          const mappedResume = mapRawToAtsResume(
            res.generatedResume || {},
            targetRole,
            res.resumePdfUrl
          );
          setResumeData(mappedResume);
          setResumeStatus('completed');
        } else if (res && res.status === 'failed') {
          clearInterval(pollInterval);
          setResumeStatus('error');
        } else if (Date.now() > deadline) {
          clearInterval(pollInterval);
          setResumeStatus('error');
        }
      } catch {
        if (Date.now() > deadline) {
          clearInterval(pollInterval);
          setResumeStatus('error');
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [stage, sessionId, resumeStatus, targetRole, setResumeStatus]);

  return { resumeData, setResumeData };
}
