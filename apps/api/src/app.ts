import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { UPLOAD_ROOT_DIR } from './lib/storage';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

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

// Mounted API v1 Router
app.use('/api/v1', apiRouter);

app.use(errorHandler);
