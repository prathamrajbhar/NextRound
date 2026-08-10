'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Message } from '@/hooks/useInterviewSession';

interface UseAssessmentCompletionOptions {
  sessionId: string;
  applicationId?: string;
  messages: Message[];
}

/**
 * Ends an assessment session: persists the transcript + score to the mock
 * session, records the candidate result locally for applications, and routes
 * to the appropriate destination (application detail or feedback page).
 */
export function useAssessmentCompletion({ sessionId, applicationId, messages }: UseAssessmentCompletionOptions) {
  const router = useRouter();

  const handleComplete = async (score?: number) => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}

    try {
      if (sessionId && sessionId !== 'new' && sessionId !== 'practice') {
        await apiClient.post(`/mock/sessions/${sessionId}/end`, {
          score,
          transcript: messages.map((m) => ({
            role: m.role === 'candidate' ? 'candidate' : 'interviewer',
            text: m.content,
            timestamp: m.timestamp,
          })),
        }).catch(() => null);
      }
    } catch (err) {
      console.error('Error ending mock session:', err);
    }
    if (applicationId) {
      localStorage.setItem(`candidateAssessmentCompleted_${applicationId}`, 'true');
      const scoreObj = {
        overallScore: score ?? 0,
        completedDate: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(`assessmentResult_${applicationId}`, JSON.stringify(scoreObj));
      router.push(`/candidate/applications/${applicationId}`);
    } else {
      router.push(`/candidate/mock/${sessionId}/feedback`);
    }
  };

  return handleComplete;
}
