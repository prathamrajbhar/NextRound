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
  return {
    score: 0,
    feedback: '',
    rubric: {
      technical: 0,
      communication: 0,
      cultureFit: 0,
    },
    transcript: transcriptData.map((item) => ({
      question: item.question,
      answer: item.answer,
      feedback: '',
    })),
  };
}
