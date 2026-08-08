import { Topic } from './interviewTopics';

export interface ScoreResults {
  score: number;
  feedback: string;
  rubric: { technical: number; communication: number; cultureFit: number };
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
  const answeredCount = transcriptData.filter((t) => t.answer.trim().length > 0).length;
  const totalTopics = topics.length || 1;
  const baseScore = answeredCount === 0 ? 0 : Math.min(100, Math.round((answeredCount / totalTopics) * 85 + 15));


  return {
    score: baseScore,
    feedback: `Interview evaluation completed for ${role} position across ${answeredCount} responses.`,
    rubric: {
      technical: baseScore,
      communication: baseScore,
      cultureFit: baseScore,
    },
    transcript: transcriptData.map((item) => ({
      question: item.question,
      answer: item.answer,
      feedback: 'Response logged for review.',
    })),
  };
}
