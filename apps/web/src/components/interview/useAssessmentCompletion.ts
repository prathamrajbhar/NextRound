'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';
import { setScopedStorageJSON } from '@/lib/storage';
import { Message } from '@/components/interview/console/types';

interface UseAssessmentCompletionOptions {
  sessionId: string;
  applicationId?: string;
  messages: Message[];
}






export function useAssessmentCompletion({ sessionId, applicationId, messages }: UseAssessmentCompletionOptions) {
  const router = useRouter();
  const { user } = useAuthContext();

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
      setScopedStorageJSON(user?.id, `candidateAssessmentCompleted_${applicationId}`, true);
      const scoreObj = {
        overallScore: score ?? 0,
        completedDate: new Date().toISOString().slice(0, 10),
      };
      setScopedStorageJSON(user?.id, `assessmentResult_${applicationId}`, scoreObj);
      router.push(`/candidate/applications/${applicationId}`);
    } else {
      router.push(`/candidate/mock/${sessionId}/feedback`);
    }
  };

  return handleComplete;
}
