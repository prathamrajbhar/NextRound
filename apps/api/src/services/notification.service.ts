import { Response } from 'express';
import { prisma } from '../lib/prisma';

class NotificationService {
  private sseClients: Map<string, Set<Response>> = new Map();

  /**
   * Add active SSE client response stream for a user
   */
  public addClient(userId: string, res: Response) {
    if (!this.sseClients.has(userId)) {
      this.sseClients.set(userId, new Set());
    }
    this.sseClients.get(userId)!.add(res);

    // Keep-alive heartbeat every 30 seconds
    const interval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(interval);
        return;
      }
      res.write(`: heartbeat\n\n`);
    }, 30000);

    res.on('close', () => {
      clearInterval(interval);
      this.removeClient(userId, res);
    });
  }

  /**
   * Remove active SSE client stream
   */
  public removeClient(userId: string, res: Response) {
    const clients = this.sseClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.sseClients.delete(userId);
      }
    }
  }

  /**
   * Create persistent notification record in database & stream real-time SSE event to online clients
   */
  public async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'bias_alert' | 'interview_invite' | 'offer' = 'info'
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          user_id: userId,
          title,
          message,
          type,
        },
      });

      // Stream to active SSE clients if user is online
      const clients = this.sseClients.get(userId);
      if (clients && clients.size > 0) {
        const payload = `data: ${JSON.stringify(notification)}\n\n`;
        clients.forEach((clientRes) => {
          if (!clientRes.writableEnded) {
            clientRes.write(payload);
          }
        });
      }

      return notification;
    } catch (err) {
      console.error(`Failed to create/stream notification for user ${userId}:`, err);
      return null;
    }
  }

  /**
   * Broadcast notification to all users in an organization
   */
  public async createOrgNotification(
    orgId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'bias_alert' = 'info'
  ) {
    try {
      const users = await prisma.user.findMany({
        where: { org_id: orgId },
        select: { id: true },
      });

      await Promise.all(
        users.map((u) => this.createNotification(u.id, title, message, type))
      );
    } catch (err) {
      console.error(`Failed to broadcast org notification for org ${orgId}:`, err);
    }
  }
}

export const notificationService = new NotificationService();
