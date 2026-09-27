import { describe, it, expect } from 'vitest';
import { runTemplateTests } from './email.templates.test';
import { EmailService } from '../services/email/email.service';

describe('Email Service Subsystem', () => {
  it('runs template tests successfully', () => {
    expect(() => runTemplateTests()).not.toThrow();
  });

  it('exposes all expected email methods on EmailService', () => {
    const testService = new EmailService();
    expect(typeof testService.sendEmail).toBe('function');
    expect(typeof testService.sendImmediate).toBe('function');
    expect(typeof testService.verifyConnection).toBe('function');
    expect(typeof testService.sendWelcomeCandidate).toBe('function');
    expect(typeof testService.sendPasswordReset).toBe('function');
    expect(typeof testService.sendOfferEmail).toBe('function');
    expect(typeof testService.sendInterviewConfirmation).toBe('function');
    expect(typeof testService.sendOfferResponseAlert).toBe('function');
    expect(typeof testService.sendProctoringAnomalyAlert).toBe('function');
  });
});
