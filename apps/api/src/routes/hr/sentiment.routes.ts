import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

export const sentimentRouter = Router();

// ML_BYPASS: audio prosody/pitch analysis — implement later with pyAudioAnalysis or wav2vec2
// All sentiment routes return 501 until the audio ML pipeline is ready.
sentimentRouter.get(
  '/:interviewId',
  authenticate,
  requireRole('hr'),
  (_req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: 'Sentiment analysis is not yet implemented. This feature will be available in a future release.',
      bypass: 'audio_prosody_ml',
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
      error: 'Sentiment analysis is not yet implemented. This feature will be available in a future release.',
      bypass: 'audio_prosody_ml',
    });
  }
);
