import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../lib/logger';

const statusBadge = (code: number): string =>
  code >= 500 ? 'ERR' : code >= 400 ? 'BAD' : code >= 300 ? 'REDIRECT' : 'OK';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);

  const method = req.method;
  const url = req.originalUrl || req.url;
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const log = logger.child('HTTP');
    const message = `${method} ${url} -> ${status} ${statusBadge(status)} (${durationMs.toFixed(1)}ms) [${requestId.slice(0, 8)}]`;

    if (status >= 500) log.error(message);
    else if (status >= 400) log.warn(message);
    else log.http(message);
  });

  next();
}