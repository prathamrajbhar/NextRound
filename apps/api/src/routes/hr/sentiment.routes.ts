import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

export const sentimentRouter = Router();

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&auto=format&fit=crop&q=80',
];

interface SentimentAudioMetrics {
  speakingRateWpm?: number;
  avgPauseDurationSec?: number;
  pausesPerMinute?: number;
  longPauseCount?: number;
  pitchMeanHz?: number;
  pitchStdDevHz?: number;
  tremorPercent?: number;
  steadyPercent?: number;
  durationSec?: number;
}

interface SentimentReport {
  status?: string;
  overall?: {
    tone?: string;
    stressScore?: number;
    confidenceScore?: number;
    clarityScore?: number;
  };
  audio?: SentimentAudioMetrics;
  journey?: Array<{
    timeLabel?: string;
    minute?: number;
    confidence?: number;
    stress?: number;
    hesitation?: number;
    emotionLabel?: string;
  }>;
}

function getAvatarUrl(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_POOL.length;
  return AVATAR_POOL[idx];
}

function getSentimentReport(value: unknown): SentimentReport | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as SentimentReport;
  }
  return null;
}

function buildBiomarkers(audio: SentimentAudioMetrics) {
  const steadyPercent = audio.steadyPercent ?? 0;
  const wpm = audio.speakingRateWpm ?? 0;
  const pitchStdDevHz = audio.pitchStdDevHz ?? 0;
  const pausesPerMin = audio.pausesPerMinute ?? 0;

  return {
    audioTone: {
      steadyPercent,
      tremorPercent: audio.tremorPercent ?? 0,
      status: steadyPercent > 80 ? 'Steady & Calm' : steadyPercent > 60 ? 'Mild Anxiety' : 'Highly Stressed',
    },
    speechPace: {
      wpm,
      idealRange: '120-150 WPM',
      status: wpm > 160 ? 'Rushed' : wpm < 115 ? 'Hesitant' : 'Optimal',
    },
    pitchVariation: {
      hzStdDev: pitchStdDevHz,
      status: pitchStdDevHz > 40 ? 'High Pitch Spikes' : pitchStdDevHz < 15 ? 'Monotone' : 'Dynamic & Natural',
    },
    pausePatterns: {
      pausesPerMin,
      longPauseCount: audio.longPauseCount ?? 0,
      status: pausesPerMin > 22 ? 'Frequent Pauses' : pausesPerMin > 14 ? 'Blocking Stalls' : 'Natural Cadence',
    },
  };
}

function buildProfile(interview: {
  id: string;
  created_at: Date;
  audio_url: string | null;
  sentiment_report: unknown;
  application: {
    candidate: {
      id: string;
      full_name: string | null;
      user: { email: string };
    };
    job: { title: string };
  };
}) {
  const app = interview.application;
  const candidate = app.candidate;
  const candidateName = candidate.full_name || candidate.user.email.split('@')[0] || 'Candidate';

  const report = getSentimentReport(interview.sentiment_report);
  const hasAudioAnalysis = report?.status === 'completed' && !!report.audio && !!report.overall;
  const audio = report?.audio ?? {};
  const overall = report?.overall ?? {};

  return {
    id: interview.id,
    candidateName,
    role: app.job.title,
    avatar: getAvatarUrl(candidate.id),
    interviewDate: new Date(interview.created_at).toLocaleDateString(),
    hasAudioAnalysis,
    audioUrl: interview.audio_url,
    durationMinutes: audio.durationSec ? Math.max(1, Math.round(audio.durationSec / 60)) : null,
    overallTone: overall.tone ?? null,
    overallStressScore: overall.stressScore ?? null,
    confidenceRating: overall.confidenceScore ?? null,
    speechClarityScore: overall.clarityScore ?? null,
    avgPauseDurationSec: audio.avgPauseDurationSec ?? null,
    biomarkers: hasAudioAnalysis ? buildBiomarkers(audio) : null,
    journeyGraph: hasAudioAnalysis && Array.isArray(report.journey) ? report.journey : [],
  };
}

sentimentRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const interviews = await prisma.interview.findMany({
        where: {
          status: 'completed',
          application: {
            job: { org_id: orgId },
          },
        },
        include: {
          application: {
            include: {
              candidate: {
                include: {
                  user: { select: { email: true } },
                },
              },
              job: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      const profiles = interviews.map(buildProfile);

      return res.json({
        success: true,
        data: { profiles },
      });
    } catch (err) {
      return next(err);
    }
  }
);

sentimentRouter.get(
  '/:interviewId',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const interview = await prisma.interview.findFirst({
        where: {
          id: req.params.interviewId as string,
          status: 'completed',
          application: {
            job: { org_id: orgId },
          },
        },
        include: {
          application: {
            include: {
              candidate: {
                include: {
                  user: { select: { email: true } },
                },
              },
              job: true,
            },
          },
        },
      });

      if (!interview) {
        return res.status(404).json({ success: false, error: 'Interview sentiment data not found' });
      }

      const profile = buildProfile(interview);

      return res.json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      return next(err);
    }
  }
);
