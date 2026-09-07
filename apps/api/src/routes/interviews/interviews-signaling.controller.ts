import { Request, Response, NextFunction } from 'express';
import { Prisma, prisma } from '@nextround/database';
import { logger } from '../../lib/logger';

export async function sendSignal(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['id']);
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ success: false, error: 'sender and message are required' });
    }

    const signal = await prisma.webRTCSignal.create({
      data: {
        application_id: applicationId,
        sender,
        message: message as Prisma.InputJsonValue,
      },
    });

    return res.json({ success: true, data: signal });
  } catch (error) {
    return next(error);
  }
}

export async function getSignals(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['id']);
    const since = req.query['since'] ? new Date(String(req.query['since'])) : new Date(Date.now() - 10000);

    const signals = await prisma.webRTCSignal.findMany({
      where: {
        application_id: applicationId,
        created_at: { gt: since },
      },
      orderBy: { created_at: 'asc' },
    });

    prisma.webRTCSignal.deleteMany({
      where: {
        application_id: applicationId,
        created_at: { lt: new Date(Date.now() - 300000) },
      },
    }).catch((error) => logger.child('Interviews').error('Failed to clean up old signaling messages:', error));

    return res.json({ success: true, data: signals });
  } catch (error) {
    return next(error);
  }
}
