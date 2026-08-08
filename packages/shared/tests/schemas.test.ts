import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  JobCreateSchema,
  MockSessionCreateSchema,
  CandidateProfileSchema,
  CandidateSettingsSchema,
  TalentOutreachSchema,
  AnalyticsExportQuerySchema,
  TalentPoolSearchSchema,
  OrganizationSchema,
  MemberInviteSchema,
  DecisionOverrideSchema,
} from '../src/schemas';
import { UserRole, DecisionType } from '../src/enums';

describe('@nextround/shared Zod Schemas', () => {
  describe('LoginSchema', () => {
    it('validates a valid email and password', () => {
      const res = LoginSchema.safeParse({
        email: 'user@example.com',
        password: 'securepassword123',
      });
      expect(res.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const res = LoginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(res.success).toBe(false);
    });

    it('rejects missing password', () => {
      const res = LoginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('validates candidate registration without orgName', () => {
      const res = RegisterSchema.safeParse({
        email: 'candidate@example.com',
        password: 'password123',
        role: UserRole.CANDIDATE,
      });
      expect(res.success).toBe(true);
    });

    it('validates HR registration with orgName', () => {
      const res = RegisterSchema.safeParse({
        email: 'hr@company.com',
        password: 'password123',
        role: UserRole.HR,
        orgName: 'Acme Corp',
      });
      expect(res.success).toBe(true);
    });

    it('rejects HR registration when orgName is missing or empty', () => {
      const res = RegisterSchema.safeParse({
        email: 'hr@company.com',
        password: 'password123',
        role: UserRole.HR,
      });
      expect(res.success).toBe(false);

      const whitespaceRes = RegisterSchema.safeParse({
        email: 'hr@company.com',
        password: 'password123',
        role: UserRole.HR,
        orgName: '   ',
      });
      expect(whitespaceRes.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const res = RegisterSchema.safeParse({
        email: 'candidate@example.com',
        password: 'short',
        role: UserRole.CANDIDATE,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('JobCreateSchema', () => {
    it('validates valid job creation payload', () => {
      const res = JobCreateSchema.safeParse({
        title: 'Senior Full Stack Engineer',
        description: 'Looking for a skilled engineer with Node.js and React expertise.',
        rubric: {
          technical: 40,
          communication: 20,
          problemSolving: 20,
          experience: 20,
        },
        thresholds: {
          minScore: 75,
          autoOffer: true,
        },
      });
      expect(res.success).toBe(true);
    });

    it('rejects title shorter than 2 characters or description shorter than 10 characters', () => {
      const res = JobCreateSchema.safeParse({
        title: 'A',
        description: 'Short',
      });
      expect(res.success).toBe(false);
    });

    it('rejects rubric weights out of range [0, 100]', () => {
      const res = JobCreateSchema.safeParse({
        title: 'Lead Engineer',
        description: 'Detailed description of the lead engineering role.',
        rubric: {
          technical: 150,
          communication: 20,
          problemSolving: 20,
          experience: 20,
        },
      });
      expect(res.success).toBe(false);
    });
  });

  describe('MockSessionCreateSchema', () => {
    it('applies default targetCompany, targetRole, difficulty, and focusAreas', () => {
      const res = MockSessionCreateSchema.parse({});
      expect(res.targetCompany).toBe('General Tech');
      expect(res.targetRole).toBe('Senior Software Engineer');
      expect(res.difficulty).toBe('medium');
      expect(res.focusAreas).toEqual([]);
    });

    it('accepts valid difficulty level overrides', () => {
      const res = MockSessionCreateSchema.safeParse({
        difficulty: 'senior',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.difficulty).toBe('senior');
      }
    });

    it('rejects invalid difficulty string', () => {
      const res = MockSessionCreateSchema.safeParse({
        difficulty: 'super-hard',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('CandidateProfileSchema & CandidateSettingsSchema', () => {
    it('applies default arrays for candidate profile', () => {
      const parsed = CandidateProfileSchema.parse({});
      expect(parsed.targetRoles).toEqual([]);
      expect(parsed.skills).toEqual([]);
      expect(parsed.workValues).toEqual([]);
    });

    it('validates candidate settings default values', () => {
      const settings = CandidateSettingsSchema.parse({ emailNotifications: true, privacyMode: false, timezone: 'UTC' });
      expect(settings.emailNotifications).toBe(true);
      expect(settings.privacyMode).toBe(false);
      expect(settings.timezone).toBe('UTC');
    });

  });

  describe('TalentOutreachSchema & AnalyticsExportQuerySchema', () => {
    it('validates talent outreach email requirements', () => {
      const res = TalentOutreachSchema.safeParse({
        candidateId: 'cand-123',
        subject: 'Interview Invitation for Senior Role',
        body: 'Hello, we were impressed by your profile and would love to chat.',
      });
      expect(res.success).toBe(true);
    });

    it('rejects outreach with short subject or body', () => {
      const res = TalentOutreachSchema.safeParse({
        candidateId: 'cand-123',
        subject: 'A',
        body: 'Hi',
      });
      expect(res.success).toBe(false);
    });

    it('applies defaults to analytics export query', () => {
      const parsed = AnalyticsExportQuerySchema.parse({});
      expect(parsed.format).toBe('csv');
      expect(parsed.period).toBe('30d');
    });
  });

  describe('OrganizationSchema & DecisionOverrideSchema', () => {
    it('validates organization creation', () => {
      const res = OrganizationSchema.safeParse({
        name: 'TechCorp Solutions',
        industry: 'Software',
        size: '50-200',
      });
      expect(res.success).toBe(true);
    });

    it('validates decision override enum values', () => {
      const res = DecisionOverrideSchema.safeParse({
        decision: DecisionType.OFFER,
        reason: 'Exceptional system architecture skills demonstrated.',
      });
      expect(res.success).toBe(true);
    });
  });
});
