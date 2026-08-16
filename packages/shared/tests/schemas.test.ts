import { describe, expect, it } from 'vitest';

import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  CandidateProfileSchema,
  SocialSyncRequestSchema,
  CandidateEmbeddingBatchSchema,
} from '../src/schemas';

describe('auth schemas', () => {
  it('LoginSchema accepts a valid email + password', () => {
    expect(LoginSchema.parse({ email: 'candidate@example.com', password: 'secret' })).toEqual({
      email: 'candidate@example.com',
      password: 'secret',
    });
  });

  it('LoginSchema rejects a malformed email', () => {
    expect(LoginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false);
  });

  it('ForgotPasswordSchema rejects a missing email', () => {
    expect(ForgotPasswordSchema.safeParse({}).success).toBe(false);
  });

  it('ResetPasswordSchema requires a token and an 8-char password', () => {
    expect(ResetPasswordSchema.safeParse({ token: '', password: 'secret' }).success).toBe(false);
    expect(ResetPasswordSchema.safeParse({ token: 'tok', password: 'short' }).success).toBe(false);
    expect(ResetPasswordSchema.safeParse({ token: 'tok', password: 'longenough' }).success).toBe(true);
  });

  it('ChangePasswordSchema requires a current password', () => {
    expect(ChangePasswordSchema.safeParse({ newPassword: 'longenough' }).success).toBe(false);
  });

  it('RegisterSchema defaults role to candidate', () => {
    const parsed = RegisterSchema.parse({ email: 'dev@example.com', password: 'longenough' });
    expect(parsed.role).toBe('candidate');
  });

  it('RegisterSchema requires an org name for HR role', () => {
    const hr = RegisterSchema.safeParse({ email: 'hr@example.com', password: 'longenough', role: 'hr' });
    expect(hr.success).toBe(false);
  });
});

describe('CandidateProfileSchema consent fields', () => {
  it('defaults dataConsent to false when omitted', () => {
    const parsed = CandidateProfileSchema.parse({});
    expect(parsed.dataConsent).toBe(false);
  });

  it('accepts an explicit consent with a valid consentAt datetime', () => {
    const parsed = CandidateProfileSchema.parse({
      dataConsent: true,
      consentAt: '2026-08-16T12:00:00.000Z',
    });
    expect(parsed.dataConsent).toBe(true);
    expect(parsed.consentAt).toBe('2026-08-16T12:00:00.000Z');
  });

  it('rejects a non-datetime consentAt', () => {
    const result = CandidateProfileSchema.safeParse({ consentAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

describe('SocialSyncRequestSchema', () => {
  it('accepts URLs, usernames or both', () => {
    const result = SocialSyncRequestSchema.safeParse({
      githubUrl: 'https://github.com/alex',
      linkedinUsername: 'alex-morgan',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.githubUrl).toBe('https://github.com/alex');
      expect(result.data.linkedinUsername).toBe('alex-morgan');
    }
  });

  it('defaults dataConsent to false when omitted', () => {
    const parsed = SocialSyncRequestSchema.parse({});
    expect(parsed.dataConsent).toBe(false);
  });

  it('accepts an empty body (all fields optional)', () => {
    const result = SocialSyncRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects a non-boolean dataConsent', () => {
    const result = SocialSyncRequestSchema.safeParse({ dataConsent: 'yes' });
    expect(result.success).toBe(false);
  });
});

describe('CandidateEmbeddingBatchSchema', () => {
  const section = {
    sourceType: 'github',
    section: 'skills',
    content: 'GITHUB SKILLS\nTypeScript, Go',
    contentHash: 'abc123',
    embedding: Array.from({ length: 768 }, (_, i) => i),
  };

  it('accepts a batch with a valid 768-dim embedding', () => {
    const result = CandidateEmbeddingBatchSchema.safeParse({ sections: [section] });
    expect(result.success).toBe(true);
  });

  it('rejects an embedding that is not 768-dim', () => {
    const result = CandidateEmbeddingBatchSchema.safeParse({
      sections: [{ ...section, embedding: [1, 2, 3] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sourceType', () => {
    const result = CandidateEmbeddingBatchSchema.safeParse({
      sections: [{ ...section, sourceType: 'twitter' }],
    });
    expect(result.success).toBe(false);
  });
});
