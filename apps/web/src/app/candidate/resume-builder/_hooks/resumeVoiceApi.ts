import { apiClient } from '@/lib/apiClient';
import { siteConfig } from '@/lib/config';

export interface ConversationTurn {
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

export interface ResumeAiTurnRequest {
  sessionId: string;
  transcript: string;
  targetRole: string;
  targetCompany: string;
  stage: string;
  turnNumber: number;
  conversationHistory: { speaker: string; text: string }[];
  memory: Record<string, unknown>;
  existingResume?: string | null;
  careerGoals?: string | null;
  profileType?: string | null;
}

export interface ResumeAiTurnResponse {
  text: string;
  stage: string;
  turnNumber: number;
  isComplete: boolean;
  realtimeInsight?: string;
  memory?: Record<string, unknown>;
  audioUrl?: string;
}

export async function createResumeSession(
  targetRole: string,
  experienceLevel: string
): Promise<string> {
  const res = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
    targetRole,
    experienceLevel,
  });
  if (!res?.sessionId) {
    throw new Error('Failed to obtain session ID from backend.');
  }
  return res.sessionId;
}

export async function finalizeResumeSession(
  activeSessionId: string,
  finalHistory: ConversationTurn[],
  extras?: {
    memory?: Record<string, unknown>;
    profileType?: string | null;
    existingResume?: string | null;
    careerGoals?: string | null;
  }
): Promise<void> {
  try {
    await apiClient.post(`/resume-builder/${activeSessionId}/end`, {
      transcript: finalHistory.map((h) => ({
        speaker: h.role,
        text: h.content,
      })),
      memory: extras?.memory ?? null,
      profileType: extras?.profileType ?? null,
      existingResume: extras?.existingResume ?? null,
      careerGoals: extras?.careerGoals ?? null,
    });
  } catch {
    // Non-blocking end
  }
}

export async function fetchResumeAiTurn(
  payload: ResumeAiTurnRequest
): Promise<ResumeAiTurnResponse> {
  const res = await fetch(`${siteConfig.aiServiceUrl}/api/v1/ai/resume-builder/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AI Service error: ${res.statusText}`);
  }

  return (await res.json()) as ResumeAiTurnResponse;
}
