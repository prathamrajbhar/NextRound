import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

export const sentimentRouter = Router();

// ML_BYPASS: audio prosody/pitch analysis — implement later with pyAudioAnalysis or wav2vec2
// The audio ML pipeline is not built, so these routes honestly report the feature
// as unavailable. No fabricated sentiment metrics are ever returned.
sentimentRouter.get(
  '/:interviewId',
  authenticate,
  requireRole('hr'),
  (_req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      data: null,
      error: 'Sentiment analysis is unavailable: the audio-prosody ML pipeline is not built yet. No sentiment data exists for this interview.',
    });
  }
);

sentimentRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  (_req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      data: null,
      error: 'Sentiment analysis is unavailable: the audio-prosody ML pipeline is not built yet. No sentiment data exists.',
    });
  }
);
