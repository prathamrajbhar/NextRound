import { Rec, isObject, toIso } from './serializers.common';

export interface EvalLike {
  id?: string;
  resume_score?: number | null;
  interview_score?: number | null;
  aptitude_score?: number | null;
  coding_score?: number | null;
  composite_score?: number | null;
  confidence?: number | null;
  decision?: string | null;
  reasoning?: string | null;
}

export function firstEvaluation(evaluations: unknown): EvalLike | undefined {
  if (Array.isArray(evaluations) && evaluations.length > 0 && isObject(evaluations[0])) {
    return evaluations[0] as EvalLike & Rec;
  }
  if (isObject(evaluations)) {
    return evaluations as EvalLike & Rec;
  }
  return undefined;
}

function parseScoreNumber(scoreValue: number | null | undefined, fallbackScore: number): number {
  return typeof scoreValue === 'number' ? scoreValue : fallbackScore;
}

export function serializeScores(evaluationRecord: EvalLike | undefined): Rec | undefined {
  if (!evaluationRecord) return undefined;
  return {
    composite: Math.round(parseScoreNumber(evaluationRecord.composite_score, 0)),
    technical: Math.round(parseScoreNumber(evaluationRecord.resume_score, 0)),
    communication: Math.round(parseScoreNumber(evaluationRecord.interview_score, 0)),
    problemSolving: Math.round(parseScoreNumber(evaluationRecord.aptitude_score, 0)),
    experience: Math.round(parseScoreNumber(evaluationRecord.coding_score, 0)),
    confidence: evaluationRecord.confidence != null ? Math.round(evaluationRecord.confidence * 100) : 0,
  };
}

export interface InterviewLike {
  id?: string;
  transcript?: unknown;
  proctor_flags?: unknown;
  engagement_signal?: unknown;
  audio_url?: string | null;
  scheduled_at?: Date | string | null;
  status?: string;
}

export function serializeInterview(interview: InterviewLike | undefined): Rec | undefined {
  if (!interview) return undefined;

  const proctorObj = isObject(interview.proctor_flags) ? interview.proctor_flags : undefined;
  const proctorFlags = proctorObj
    ? Object.entries(proctorObj)
        .filter(([, flagValue]) => flagValue === true || (typeof flagValue === 'number' && flagValue > 0))
        .map(([flagKey]) => ({
          timestamp: new Date().toISOString(),
          type: flagKey,
          severity: 'medium',
          description: flagKey.replace(/([A-Z])/g, ' $1').toLowerCase(),
        }))
    : [];

  const engagementObj = interview.engagement_signal;
  const engagementSignal = isObject(engagementObj)
    ? {
        eyeContact: typeof engagementObj.eyeContact === 'number' ? engagementObj.eyeContact : 0,
        speakingRate: typeof engagementObj.speakingRate === 'string' ? engagementObj.speakingRate : 'Normal',
        confidenceScore: typeof engagementObj.confidenceScore === 'number' ? engagementObj.confidenceScore : 0,
      }
    : undefined;

  return {
    id: interview.id,
    scheduledAt: toIso(interview.scheduled_at),
    status: interview.status,
    proctorFlags,
    engagementSignal,
    audioUrl: interview.audio_url || undefined,
  };
}

export function serializeTranscript(interview: InterviewLike | undefined): Rec[] | undefined {
  if (!interview || !Array.isArray(interview.transcript)) return undefined;
  const transcriptSegments: Rec[] = [];
  for (const segment of interview.transcript) {
    if (!isObject(segment)) continue;
    const textContent = segment.text || segment.content;
    if (typeof textContent !== 'string') continue;
    const isCandidateSpeaker = segment.speaker === 'candidate' || segment.speaker === 'human';
    const isInterviewerSpeaker = segment.speaker === 'interviewer' || segment.speaker === 'ai';
    transcriptSegments.push({
      question: isInterviewerSpeaker ? textContent : typeof segment.question === 'string' ? segment.question : '',
      answer: isCandidateSpeaker ? textContent : '',
      score: typeof segment.score === 'number' ? segment.score : 0,
      feedback: typeof segment.feedback === 'string' ? segment.feedback : '',
    });
  }
  return transcriptSegments.length > 0 ? transcriptSegments : undefined;
}
