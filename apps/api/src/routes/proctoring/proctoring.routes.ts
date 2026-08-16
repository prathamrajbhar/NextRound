import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { asyncHandler, ok, validate } from '../../lib/http';
import { forbidden } from '../../lib/http-errors';
import { logger } from '../../lib/logger';
import {
  CreateProctoringSessionSchema,
  BatchEventsSchema,
  ReviewViolationSchema,
  RecordingUploadSchema,
  EvidenceUploadSchema,
} from '../../validators/proctoring.schemas';
import * as proctoringService from '../../services/proctoring.service';

export const proctoringRouter = Router();

const AUDIO_MIME_RE = /(webm|ogg|wav|audio|mp4|mpeg)/;
const IMAGE_MIME_RE = /(jpeg|jpg|png|image)/;

const recordingUpload = multer({
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, !file.mimetype || AUDIO_MIME_RE.test(file.mimetype));
  },
});

const evidenceUpload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, !file.mimetype || IMAGE_MIME_RE.test(file.mimetype));
  },
});


proctoringRouter.use(authenticate);


proctoringRouter.post(
  '/sessions',
  validate(CreateProctoringSessionSchema),
  asyncHandler(async (req, res) => {
    const session = await proctoringService.createProctoringSession(req.body, req.user!.userId);
    ok(res, session, 201);
  })
);


proctoringRouter.post(
  '/sessions/:id/events',
  validate(BatchEventsSchema),
  asyncHandler(async (req, res) => {
    const result = await proctoringService.logProctoringEvents(
      req.params.id as string,
      req.body.events,
      req.user!.userId
    );
    ok(res, result);
  })
);


proctoringRouter.post(
  '/sessions/:id/heartbeat',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.updateHeartbeat(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/pause',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.pauseProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/resume',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.resumeProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/end',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.endProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/recording',
  (req: Request, res: Response, next: NextFunction) => {
    recordingUpload.single('file')(req, res, (err) => {
      if (err) {
        logger.child('Proctoring').error(`Recording upload error for session ${req.params.id}:`, err);
        return res.status(400).json({
          success: false,
          error: typeof err === 'string' ? err : err.message || 'Recording upload error',
        });
      }
      next();
    });
  },
  validate(RecordingUploadSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No recording file uploaded' });
    }
    const body = req.body as { duration_ms?: number | null };
    const session = await proctoringService.saveProctoringRecording(
      req.params.id as string,
      req.user!.userId,
      req.file.buffer,
      {
        mimeType: req.file.mimetype,
        durationMs: body.duration_ms ?? undefined,
      }
    );
    ok(res, { session_id: session.id, recording_url: session.recording_url }, 201);
  })
);


proctoringRouter.post(
  '/sessions/:id/evidence',
  (req: Request, res: Response, next: NextFunction) => {
    evidenceUpload.single('file')(req, res, (err) => {
      if (err) {
        logger.child('Proctoring').error(`Evidence upload error for session ${req.params.id}:`, err);
        return res.status(400).json({
          success: false,
          error: typeof err === 'string' ? err : err.message || 'Evidence upload error',
        });
      }
      next();
    });
  },
  validate(EvidenceUploadSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No evidence file uploaded' });
    }
    const body = req.body as { width?: number; height?: number };
    const evidence = await proctoringService.saveProctoringSnapshot(
      req.params.id as string,
      req.user!.userId,
      req.file.buffer,
      {
        mimeType: req.file.mimetype,
        width: body.width ?? undefined,
        height: body.height ?? undefined,
      }
    );
    ok(res, { evidence_id: evidence.id, url: evidence.url }, 201);
  })
);


proctoringRouter.get(
  '/sessions/:id/report',
  asyncHandler(async (req, res) => {
    const report = await proctoringService.getProctoringReport(
      req.params.id as string,
      req.user!.role,
      req.user!.orgId,
      req.user!.userId
    );
    ok(res, report);
  })
);


proctoringRouter.get(
  '/applications/:applicationId/report',
  asyncHandler(async (req, res) => {
    const report = await proctoringService.getProctoringReportByApplicationId(
      req.params.applicationId as string,
      req.user!.role,
      req.user!.orgId,
      req.user!.userId
    );
    if (!report) {
      ok(res, null);
    } else {
      ok(res, report);
    }
  })
);


proctoringRouter.post(
  '/violations/:id/review',
  validate(ReviewViolationSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'hr') {
      throw forbidden('Access denied: HR role required for violation review');
    }
    const result = await proctoringService.reviewProctoringViolation(
      req.params.id as string,
      req.body.status,
      req.body.review_reason,
      req.user!.userId,
      req.user!.orgId ?? null
    );
    ok(res, result);
  })
);
