import { Rec, isObject, toDatePart } from './serializers.common';

export function serializeMockSession(session: Rec): Rec {
  return {
    id: session.id,
    targetCompany: session.target_company,
    targetRole: session.target_role,
    difficulty: session.difficulty || 'mid',
    rubric: isObject(session.rubric)
      ? session.rubric
      : { technical: 25, communication: 25, cultureFit: 25 },
    score: typeof session.score === 'number' ? session.score : 0,
    overall_score: typeof session.score === 'number' ? session.score : 0,
    date: toDatePart(session.created_at),
    feedback: session.feedback && isObject(session.feedback) ? (session.feedback as Rec).overallScore : '',
    transcript: Array.isArray(session.transcript)
      ? session.transcript.map((entry) => {
          if (isObject(entry)) {
            return {
              question: typeof entry.question === 'string' ? entry.question : '',
              answer: typeof entry.answer === 'string' ? entry.answer : '',
              feedback: typeof entry.feedback === 'string' ? entry.feedback : '',
            };
          }
          return { question: '', answer: '', feedback: '' };
        })
      : [],
  };
}

export function serializeMockSessionList(sessions: Rec[]): Rec[] {
  return (sessions || []).map((sessionRecord) => serializeMockSession(sessionRecord));
}
