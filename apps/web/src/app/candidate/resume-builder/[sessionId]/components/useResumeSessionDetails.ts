'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const queryRole = searchParams?.get('role') || '';
  const queryExp = searchParams?.get('level') || '';

  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [targetRole, setTargetRole] = useState(queryRole);
  const [experienceLevel, setExperienceLevel] = useState(queryExp);
  const [existingResumeText, setExistingResumeText] = useState<string | null>(null);
  const [careerGoals, setCareerGoals] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{
        session?: {
          target_role?: string;
          difficulty?: string;
          experienceLevel?: string;
          status?: string;
          generated_resume?: RawResumeData;
          resume_pdf_url?: string;
          rubric?: Record<string, unknown>;
          focus_areas?: string[];
        };
        target_role?: string;
        difficulty?: string;
        experienceLevel?: string;
        status?: string;
        generated_resume?: RawResumeData;
        resume_pdf_url?: string;
        rubric?: Record<string, unknown>;
        focus_areas?: string[];
      }>(`/resume-builder/${sessionId}`)
      .then((res) => {
        if (!active) return;
        if (!res) throw new Error('Session not found');

        const sessionObj = res.session || res;
        const resolvedRole = sessionObj.target_role || res.target_role || queryRole;
        const resolvedExp =
          sessionObj.difficulty ||
          sessionObj.experienceLevel ||
          res.difficulty ||
          res.experienceLevel ||
          queryExp;

        setTargetRole(resolvedRole || 'Full Stack Engineer');
        setExperienceLevel(resolvedExp || 'Fresher (0-2 Years)');

        // Extract existing resume text and career goals stored in session rubric/focus_areas
        const rubric = (sessionObj.rubric || res.rubric) as Record<string, unknown> | undefined;
        if (rubric?.rawText && typeof rubric.rawText === 'string') {
          setExistingResumeText(rubric.rawText);
        }
        const focusAreas = sessionObj.focus_areas || res.focus_areas;
        const goals = focusAreas?.[0];
        if (goals && typeof goals === 'string') {
          setCareerGoals(goals);
        }

        const status = sessionObj.status || res.status || 'created';
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
  }, [sessionId, setResumeStatus, queryRole, queryExp]);

  return {
    loadingSession,
    sessionError,
    stage,
    setStage,
    targetRole,
    experienceLevel,
    existingResumeText,
    careerGoals,
  };
}
