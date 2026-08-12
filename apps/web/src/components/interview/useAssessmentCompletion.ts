'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Message } from '@/components/interview/console/types';

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
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }

    if (sessionId && sessionId !== 'new' && sessionId !== 'practice') {
      try {
        await apiClient.post(`/mock/sessions/${sessionId}/end`, {
          score,
          transcript: messages.map((m) => ({
            role: m.role === 'candidate' ? 'candidate' : 'interviewer',
            text: m.content,
            timestamp: m.timestamp,
          })),
        });
      } catch (err) {
        console.error('Failed to end mock session:', err);
        // Session end failure means no evaluation will be available
        throw new Error('Failed to save assessment results. Please try again.');
      }
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
