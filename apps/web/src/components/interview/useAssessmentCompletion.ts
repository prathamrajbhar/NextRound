'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Message } from '@/components/interview/console/types';

interface UseAssessmentCompletionOptions {
  sessionId: string;
  applicationId?: string;
  messages: Message[];
}

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

    const isMockSession = !applicationId && sessionId && sessionId !== 'new' && sessionId !== 'practice';

    if (isMockSession) {
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
        throw new Error('Failed to save assessment results. Please try again.');
      }
    }

    if (applicationId) {
      router.push(`/candidate/applications/${applicationId}`);
    } else {
      router.push(`/candidate/mock/${sessionId}/feedback`);
    }
  };

  return handleComplete;
}
