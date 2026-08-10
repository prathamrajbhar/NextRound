import { describe, expect, it } from 'vitest';

import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
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
