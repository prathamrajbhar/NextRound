import { z } from 'zod';

export const SentimentAudioMetricsSchema = z
  .object({
    speakingRateWpm: z.number().optional(),
    avgPauseDurationSec: z.number().optional(),
    pausesPerMinute: z.number().optional(),
    longPauseCount: z.number().optional(),
    pitchMeanHz: z.number().optional(),
    pitchStdDevHz: z.number().optional(),
    tremorPercent: z.number().optional(),
    steadyPercent: z.number().optional(),
    speechDurationSec: z.number().optional(),
    durationSec: z.number().optional(),
    voicedRatio: z.number().optional(),
  })
  .passthrough();

export const SentimentJourneyPointSchema = z
  .object({
    timeLabel: z.string().optional(),
    minute: z.number().optional(),
    confidence: z.number().optional(),
    stress: z.number().optional(),
    hesitation: z.number().optional(),
    emotionLabel: z.string().optional(),
  })
  .passthrough();

export const SentimentReportSchema = z
  .object({
    interviewId: z.string().optional(),
    status: z.string().optional(),
    source: z.literal('audio').optional(),
    audioUrl: z.string().optional(),
    overall: z
      .object({
        tone: z.string().optional(),
        stressScore: z.number().optional(),
        confidenceScore: z.number().optional(),
        clarityScore: z.number().optional(),
      })
      .passthrough()
      .optional(),
    audio: SentimentAudioMetricsSchema.optional(),
    journey: z.array(SentimentJourneyPointSchema).optional(),
    summaryNarrative: z.string().optional(),
  })
  .passthrough();

export const InterviewSentimentSchema = z
  .object({
    sentiment_report: SentimentReportSchema.optional(),
  })
  .passthrough();
