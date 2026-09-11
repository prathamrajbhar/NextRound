import { evaluateInterview } from '@/lib/interviewScorer';
import type { Message, InterviewPhase } from '@/components/interview/console/types';

export function createEliminationResult(messages: Message[]) {
  return {
    status: 'completed' as const,
    isPending: false,
    score: 0,
    feedback: 'Disqualified due to proctoring violations.',
    rubric: { technical: 0, communication: 0, cultureFit: 0 },
    transcript: messages.map((item) => ({
      question: item.role === 'ai' ? item.content : '',
      answer: item.role === 'candidate' ? item.content : '',
      feedback: '',
    })),
  };
}

export function evaluateCompletedInterview(
  role: string,
  transcriptData: { question: string; answer: string; feedback: string }[]
) {
  return evaluateInterview({ role, transcriptData });
}

export function getTurnStage(phase: InterviewPhase): 'intro' | 'technical' | 'closing' {
  if (phase === 'Introduction') return 'intro';
  if (phase === 'Core Vetting') return 'technical';
  return 'closing';
}

export function deriveNextInterviewPhase(responseStage?: string): InterviewPhase {
  if (responseStage === 'intro') return 'Introduction';
  if (responseStage === 'closing') return 'Wrap-up';
  return 'Core Vetting';
}
