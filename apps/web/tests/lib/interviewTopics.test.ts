import { describe, it, expect } from 'vitest';
import { getTopicsForRoleAndCompany } from '../../src/lib/interviewTopics';

describe('apps/web/src/lib/interviewTopics.ts', () => {
  it('returns specialized Swiggy frontend topics when role is developer/engineer and company is Swiggy', () => {
    const topics = getTopicsForRoleAndCompany('Frontend Engineer', 'Swiggy');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toBe('Swiggy Menu Virtualization');
    expect(topics[0].keywords).toContain('virtual');
  });

  it('returns generic frontend topics for other companies when role contains engineer/developer', () => {
    const topics = getTopicsForRoleAndCompany('Software Developer', 'Google');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toBe('Web Performance Optimization');
  });

  it('returns product manager topics when role is PM or Product', () => {
    const topics = getTopicsForRoleAndCompany('Product Manager', 'Stripe');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toBe('UPI Intent Localizations');
  });

  it('returns default fallback topics for generic software engineering roles', () => {
    const topics = getTopicsForRoleAndCompany('System Architect', 'Meta');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toBe('Architectural Scale');
  });
});
