import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { UPLOAD_ROOT_DIR } from './lib/storage';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiRouter } from './routes';
import { env } from './lib/env';

export const app = express();

app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: env('APP_URL'),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(UPLOAD_ROOT_DIR));

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

app.get('/api/v1/ping', (_req, res) => {
  res.json({ pong: true, ts: Date.now() });
});

app.get('/api/v1/speedtest', async (_req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const upstream = await fetch('https://speed.cloudflare.com/__down?bytes=1048576', {
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok || !upstream.body) throw new Error('upstream failed');

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch {

    const SIZE = 1024 * 1024;
    const buf = Buffer.allocUnsafe(SIZE);
    for (let i = 0; i < SIZE; i += 4) buf.writeUInt32BE((Math.random() * 0xffffffff) >>> 0, i);
    res.setHeader('Content-Length', SIZE);
    res.end(buf);
  }
});

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);

app.use(errorHandler);
