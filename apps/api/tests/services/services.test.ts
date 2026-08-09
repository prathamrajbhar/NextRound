import { describe, it, expect, jest } from '@jest/globals';
import { emailService } from '../../src/services/email.service';
import { notificationService } from '../../src/services/notification.service';
import { syncCandidateSocialProfiles } from '../../src/services/social-sync.service';
import { Response } from 'express';

describe('Express API Services Suite', () => {
  describe('EmailService', () => {
    // With no SMTP_* env vars configured in the test environment there is no
    // transporter, so the service must FAIL honestly (false) instead of
    // pretending the email was sent. Callers then report the failure.
    it('fails honestly when SMTP is not configured (application received)', async () => {
      const result = await emailService.sendApplicationReceived(
        'candidate@example.com',
        'John Doe',
        'Senior Fullstack Engineer',
        'Acme Corp'
      );
      expect(result).toBe(false);
    });

    it('fails honestly when SMTP is not configured (rejection)', async () => {
      const result = await emailService.sendRejectionEmail(
        'candidate@example.com',
        'Jane Doe',
        'Lead AI Architect',
        { missing_skills: ['LangGraph dynamic routing', 'WebRTC voice stream management'] }
      );
      expect(result).toBe(false);
    });

    it('fails honestly when SMTP is not configured (offer)', async () => {
      const result = await emailService.sendOfferEmail(
        'candidate@example.com',
        'Alex Smith',
        'Principal Engineer',
        { salary: 180000, equity: '0.25%', magicLinkToken: 'token-uuid-123' }
      );
      expect(result).toBe(false);
    });

    it('fails honestly when SMTP is not configured (constructive rejection)', async () => {
      const result = await emailService.sendConstructiveRejection(
        'candidate@example.com',
        'Sam Wilson',
        'DevOps Specialist',
        ['Kubernetes ingress controllers', 'Terraform state management'],
        'Thank you for interviewing. Here is detailed guidance to improve your readiness.'
      );
      expect(result).toBe(false);
    });

    it('fails honestly when SMTP is not configured (organization member invite)', async () => {
      const result = await emailService.sendMemberInvite(
        'invited@example.com',
        'org-uuid-1',
        'hr@example.com'
      );
      expect(result).toBe(false);
    });
  });

  describe('SocialSyncService', () => {
    it('syncs real LinkedIn profile data and extracts skills', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            profile: {
              name: 'Jane Doe',
              headline: 'Senior Software Engineer',
              location: 'Bengaluru',
              about: 'Building robust systems',
              profile_pic: 'https://example.com/jane.jpg',
              skills: ['TypeScript', 'Python'],
              experiences: [{ title: 'Engineer', company: 'Acme' }],
              education: [{ degree: 'B.Tech', school: 'NIT' }],
            },
            posts: [],
          }),
      } as unknown as Response);
      try {
        const result = await syncCandidateSocialProfiles(
          undefined,
          'https://www.linkedin.com/in/janedoe'
        );
        expect(result.linkedin?.status).toBe('synced');
        expect(result.linkedin?.synced).toBe(true);
        expect(result.linkedin?.name).toBe('Jane Doe');
        expect(result.linkedin?.skills).toEqual(['TypeScript', 'Python']);
        expect(result.linkedin?.experiences).toHaveLength(1);
        expect(result.extractedSkills).toEqual(['TypeScript', 'Python']);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('reports an honest not_synced state with the real error when the scraper fails', async () => {
      // The LinkedIn branch now performs a real fetch against the bytemap
      // scraper. On network failure it must report the actual error rather than
      // claiming success with fabricated data.
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('scraper network unreachable'));
      try {
        const result = await syncCandidateSocialProfiles(
          undefined,
          'https://www.linkedin.com/in/janedoe'
        );
        expect(result.linkedin?.status).toBe('not_synced');
        expect(result.linkedin?.synced).toBe(false);
        expect(result.linkedin?.reason).toContain('scraper network unreachable');
        expect(result.extractedSkills).toEqual([]);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('returns a not_found state when the scraper reports the profile is missing', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      } as unknown as Response);
      try {
        const result = await syncCandidateSocialProfiles(
          undefined,
          'https://www.linkedin.com/in/ghostuser'
        );
        expect(result.linkedin?.status).toBe('not_found');
        expect(result.linkedin?.synced).toBe(false);
        expect(result.linkedin?.reason).toContain('not found');
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('returns no linkedin entry when no LinkedIn URL is provided', async () => {
      const result = await syncCandidateSocialProfiles(undefined, undefined);
      expect(result.linkedin).toBeUndefined();
      expect(result.extractedSkills).toEqual([]);
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
