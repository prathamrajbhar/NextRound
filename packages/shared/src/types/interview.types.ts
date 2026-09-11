import { InterviewType } from '../enums';

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  transcript?: Array<{ question: string; answer: string; score?: number; feedback?: string }>;
  proctor_flags?: Record<string, unknown>;
  engagement_signal?: number;
  audio_url?: string;
  created_at: string;
}

export interface SentimentReportDTO {
  interviewId: string;
  status: 'completed' | 'unavailable';
  source: 'audio';
  audioUrl: string;
  overall: {
    tone: 'calm' | 'steady' | 'anxious' | 'stressed';
    stressScore: number;
    confidenceScore: number;
    clarityScore: number;
  };
  audio: {
    speakingRateWpm: number;
    avgPauseDurationSec: number;
    pausesPerMinute: number;
    longPauseCount: number;
    pitchMeanHz: number;
    pitchStdDevHz: number;
    tremorPercent: number;
    steadyPercent: number;
    durationSec: number;
  };
  journey: Array<{
    timeLabel: string;
    minute: number;
    confidence: number;
    stress: number;
    hesitation: number;
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed';
  }>;
  summaryNarrative: string;
}
