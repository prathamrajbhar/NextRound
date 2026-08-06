import { describe, it, expect, jest } from '@jest/globals';
import { emailService } from '../../src/services/email.service';
import { notificationService } from '../../src/services/notification.service';
import { Response } from 'express';

describe('Express API Services Suite', () => {
  describe('EmailService', () => {
    it('sends application received email using fallback mock mode when SMTP credentials are absent or configured', async () => {
      const result = await emailService.sendApplicationReceived(
        'candidate@example.com',
        'John Doe',
        'Senior Fullstack Engineer',
        'Acme Corp'
      );
      expect(result).toBe(true);
    });

    it('sends candidate rejection email with formatted skill gaps', async () => {
      const result = await emailService.sendRejectionEmail(
        'candidate@example.com',
        'Jane Doe',
        'Lead AI Architect',
        { missing_skills: ['LangGraph dynamic routing', 'WebRTC voice stream management'] }
      );
      expect(result).toBe(true);
    });

    it('sends offer letter notification email with magic acceptance link', async () => {
      const result = await emailService.sendOfferEmail(
        'candidate@example.com',
        'Alex Smith',
        'Principal Engineer',
        { salary: 180000, equity: '0.25%', magicLinkToken: 'token-uuid-123' }
      );
      expect(result).toBe(true);
    });

    it('sends constructive rejection email with practice recommendation', async () => {
      const result = await emailService.sendConstructiveRejection(
        'candidate@example.com',
        'Sam Wilson',
        'DevOps Specialist',
        ['Kubernetes ingress controllers', 'Terraform state management'],
        'Thank you for interviewing. Here is detailed guidance to improve your readiness.'
      );
      expect(result).toBe(true);
    });
  });

  describe('NotificationService', () => {
    it('manages SSE clients registry and gracefully handles client connection and removal', () => {
      const mockRes = {
        writableEnded: false,
        write: jest.fn(),
        on: jest.fn(),
      } as unknown as Response;

      const userId = 'user-test-123';
      notificationService.addClient(userId, mockRes);
      expect(mockRes.on).toHaveBeenCalledWith('close', expect.any(Function));

      notificationService.removeClient(userId, mockRes);
    });
  });
});
