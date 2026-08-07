import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { UPLOAD_ROOT_DIR } from './lib/storage';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { organizationRouter } from './routes/organization.routes';
import { jobRouter } from './routes/job.routes';
import { applicationRouter } from './routes/application.routes';
import { candidateRouter } from './routes/candidate.routes';
import { hrRouter } from './routes/hr.routes';
import { notificationRouter } from './routes/notification.routes';
import { userRouter } from './routes/user.routes';
import { internalRouter } from './routes/internal.routes';
import { interviewRouter } from './routes/interview.routes';
import { mockRouter } from './routes/mock.routes';
import { resumeBuilderRouter } from './routes/resume-builder.routes';
import { prepRouter } from './routes/prep.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { sentimentRouter } from './routes/sentiment.routes';
import { talentPoolRouter } from './routes/talent-pool.routes';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve local static uploaded files
app.use('/uploads', express.static(UPLOAD_ROOT_DIR));

// Health Check Endpoint
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '@nextround/api',
    },
  });
});

// Mounted API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/candidate', candidateRouter);
app.use('/api/v1/hr/analytics', analyticsRouter);
app.use('/api/v1/hr/sentiment', sentimentRouter);
app.use('/api/v1/hr/talent-pool', talentPoolRouter);
app.use('/api/v1/hr', hrRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/interviews', interviewRouter);
app.use('/api/v1/mock', mockRouter);
app.use('/api/v1/resume-builder', resumeBuilderRouter);
app.use('/api/v1/prep', prepRouter);
app.use('/api/v1/internal', internalRouter);
app.use('/api/v1', userRouter);

app.use(errorHandler);
