import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { optionalAuthenticate } from '../../middleware/auth';
import { extractTextFromBuffer, parseResumeWithGemini } from '../../services/resume-parser.service';
import { logger } from '../../lib/logger';

export const resumeParserRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase();
    const isAllowedExt = ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') || ext.endsWith('.txt');
    const isAllowedMime = (file.mimetype || '').includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('text') || file.mimetype.includes('stream');

    if (isAllowedExt || isAllowedMime || !file.mimetype) {
      cb(null, true);
    } else {

      cb(null, false);
    }
  },
});

resumeParserRouter.post(
  '/parse-resume',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        logger.child('ParseResume').error('Multer file upload error in /parse-resume:', err);
        return res.status(400).json({ success: false, error: typeof err === 'string' ? err : err.message || 'File upload error' });
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No resume file uploaded' });
      }

      const rawText = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      logger.child('ParseResume').info(`Parsed resume "${req.file.originalname}": extracted ${rawText.length} chars`);

      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Could not extract text from the uploaded resume file' });
      }

      const parsedData = await parseResumeWithGemini(rawText);

      return res.json({
        success: true,
        data: {
          rawTextLength: rawText.length,
          rawText,
          profile: parsedData,
        },
      });
    } catch (err) {
      logger.child('ParseResume').error('Failed to parse resume:', err);
      return next(err);
    }
  }
);
