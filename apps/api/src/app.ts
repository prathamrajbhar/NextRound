import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { UPLOAD_ROOT_DIR } from './lib/storage';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
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

// Latency ping — no auth, no overhead, just a timestamp echo
app.get('/api/v1/ping', (_req, res) => {
  res.json({ pong: true, ts: Date.now() });
});

// Download speed probe — proxies 1 MB from Cloudflare's speed endpoint so the
// browser measures real internet throughput (no CORS issues since the fetch
// happens server-side). Falls back to a local random buffer if unreachable.
app.get('/api/v1/speedtest', async (_req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const upstream = await fetch('https://speed.cloudflare.com/__down?bytes=1048576', {
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok || !upstream.body) throw new Error('upstream failed');

    // Stream directly to the client — no buffering in memory
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch {
    // Fallback: 1 MB local random buffer (still useful for LAN latency checks)
    const SIZE = 1024 * 1024;
    const buf = Buffer.allocUnsafe(SIZE);
    for (let i = 0; i < SIZE; i += 4) buf.writeUInt32BE((Math.random() * 0xffffffff) >>> 0, i);
    res.setHeader('Content-Length', SIZE);
    res.end(buf);
  }
});

// Mounted API v1 Router
app.use('/api/v1', apiRouter);

// JSON 404 for unmatched routes (inside /api/v1)
app.use(notFoundHandler);

app.use(errorHandler);
