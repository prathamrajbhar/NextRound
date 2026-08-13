export type InterviewScoreStatus = 'pending_evaluation' | 'pending_review' | 'completed';

export interface ScoreResults {
  status: InterviewScoreStatus;
  isPending: boolean;
  score: number | null;
  feedback: string;
  rubric: { technical: number | null; communication: number | null; cultureFit: number | null };
  transcript: { question: string; answer: string; feedback: string }[];
}

export function evaluateInterview({
  role,
  transcriptData,
}: {
  role: string;
  transcriptData: { question: string; answer: string; feedback: string }[];
}): ScoreResults {
  const answeredCount = transcriptData.filter((t) => t.answer.trim().length > 0).length;

  return {
    status: 'pending_evaluation',
    isPending: true,
    score: null,
    feedback: `Your responses have been recorded and sent for AI evaluation. ${answeredCount} response(s) recorded for the ${role} role.`,
    rubric: {
      technical: null,
      communication: null,
      cultureFit: null,
    },
    transcript: transcriptData.map((item) => ({
      question: item.question,
      answer: item.answer,
      feedback: '',
    })),
  };
}
