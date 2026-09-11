import { apiClient } from '@/lib/apiClient';
import { siteConfig } from '@/lib/config';

export interface InterviewContextData {
  jobTitle: string;
  candidateResume?: string;
  candidateContext?: Record<string, unknown>;
}

export async function fetchInterviewContext(interviewId: string, defaultRole: string): Promise<InterviewContextData> {
  const result: InterviewContextData = { jobTitle: defaultRole };
  if (!interviewId) return result;

  try {
    await apiClient.post(`/interviews/${interviewId}/consent`, { consent: true });
    await apiClient.post(`/interviews/${interviewId}/session-token`);
  } catch {
    // Non-blocking consent / token setup
  }

  try {
    const ctx = await apiClient.get<{
      context?: {
        job?: { title?: string; skills?: string[]; rubric?: Record<string, unknown> };
      };
      contextText?: string;
    }>(`/interviews/${interviewId}/context`);

    if (ctx?.contextText) result.candidateResume = ctx.contextText;
    if (ctx?.context) result.candidateContext = ctx.context as unknown as Record<string, unknown>;
    if (ctx?.context?.job?.title) result.jobTitle = ctx.context.job.title;
  } catch {
    // Context is optional
  }

  return result;
}

export async function requestAiTurn(params: {
  interviewId: string;
  transcript: string;
  turnNumber: number;
  stage: string;
  jobTitle: string;
  candidateResume?: string;
  candidateContext?: Record<string, unknown>;
  conversationHistory: { speaker: string; text: string }[];
}): Promise<{ text: string; stage?: string; analysis?: unknown; turnRecord?: unknown }> {
  const res = await fetch(`${siteConfig.aiServiceUrl}/api/v1/ai/interview/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`AI respond failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data || typeof data.text !== 'string' || !data.text.trim()) {
    throw new Error('AI returned an unexpected response format.');
  }

  return {
    text: data.text,
    stage: data.stage,
    analysis: data.analysis,
    turnRecord: data.turnRecord,
  };
}

export async function requestInitialAiTurn(
  interviewId: string,
  context: InterviewContextData
): Promise<{ text: string }> {
  return requestAiTurn({
    interviewId,
    transcript: '',
    turnNumber: 0,
    stage: 'intro',
    jobTitle: context.jobTitle,
    candidateResume: context.candidateResume,
    candidateContext: context.candidateContext,
    conversationHistory: [],
  });
}

export async function endInterviewSession(interviewId: string, transcript: unknown[]): Promise<void> {
  if (!interviewId) return;
  try {
    await apiClient.post(`/interviews/${interviewId}/end`, { transcript });
  } catch {
    // Non-blocking end persistence
  }
}
