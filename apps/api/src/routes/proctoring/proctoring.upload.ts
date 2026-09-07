import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';

const AUDIO_MIME_RE = /(webm|ogg|wav|audio|mp4|mpeg)/;
const IMAGE_MIME_RE = /(jpeg|jpg|png|image)/;

export const recordingUpload = multer({
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, !file.mimetype || AUDIO_MIME_RE.test(file.mimetype));
  },
});

export const evidenceUpload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, !file.mimetype || IMAGE_MIME_RE.test(file.mimetype));
  },
});

export function handleRecordingUpload(req: Request, res: Response, next: NextFunction) {
  recordingUpload.single('file')(req, res, (error) => {
    if (error) {
      logger.child('Proctoring').error(`Recording upload error for session ${req.params['id']}:`, error);
      return res.status(400).json({
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Recording upload error',
      });
    }
    next();
  });
}

export function handleEvidenceUpload(req: Request, res: Response, next: NextFunction) {
  evidenceUpload.single('file')(req, res, (error) => {
    if (error) {
      logger.child('Proctoring').error(`Evidence upload error for session ${req.params['id']}:`, error);
      return res.status(400).json({
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Evidence upload error',
      });
    }
    next();
  });
}
