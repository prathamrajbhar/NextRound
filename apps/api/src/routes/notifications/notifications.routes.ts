import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { notificationService } from '../../services/notification.service';

export const notificationsRouter = Router();

// GET /api/v1/notifications/stream - Real-time SSE Live Notifications Stream
notificationsRouter.get(
  '/stream',
  authenticate,
  (req: Request, res: Response) => {
    const userId = req.user!.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    notificationService.addClient(userId, res);
  }
);

// GET /api/v1/notifications - Fetch authenticated user's notifications
notificationsRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { user_id: userId, read: false },
      });

      return res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/notifications/:id/read - Mark single notification as read
notificationsRouter.patch(
  '/:id/read',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      const existing = await prisma.notification.findFirst({
        where: { id, user_id: userId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return res.json({
        success: true,
        data: { notification: updated },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/notifications/read-all - Mark all user notifications as read
notificationsRouter.post(
  '/read-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      await prisma.notification.updateMany({
        where: { user_id: userId, read: false },
        data: { read: true },
      });

      return res.json({
        success: true,
        data: { message: 'All notifications marked as read' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/v1/notifications/:id - Delete a single notification
notificationsRouter.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      const existing = await prisma.notification.findFirst({
        where: { id, user_id: userId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      await prisma.notification.delete({ where: { id } });

      return res.json({
        success: true,
        data: { message: 'Notification deleted' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/v1/notifications - Delete all read notifications for user
notificationsRouter.delete(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      await prisma.notification.deleteMany({
        where: { user_id: userId, read: true },
      });

      return res.json({
        success: true,
        data: { message: 'All read notifications cleared' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

