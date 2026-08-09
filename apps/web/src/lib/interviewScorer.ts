import { Topic } from './interviewTopics';

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
  topics,
  transcriptData,
}: {
  role: string;
  topics: Topic[];
  transcriptData: { question: string; answer: string; feedback: string }[];
}): ScoreResults {
  // Honest pending state: no real evaluator scorecard is available to this
  // function. Scores are produced server-side by the Interviewer/Evaluator agent
  // (see apps/api/src/routes/interviews/interview.routes.ts POST /:id/end, which
  // enqueues the evaluation job) and must NOT be fabricated on the client.
  const answeredCount = transcriptData.filter((t) => t.answer.trim().length > 0).length;

  return {
    status: 'pending_evaluation',
    isPending: true,
    score: null,
    feedback: `Your responses have been recorded and sent for AI evaluation. ${answeredCount} of ${topics.length} topic(s) answered for the ${role} role.`,
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
