import { describe, it, expect } from 'vitest';
import { getTopicsForRoleAndCompany } from '../../src/lib/interviewTopics';

describe('apps/web/src/lib/interviewTopics.ts', () => {
  it('dynamically formats topic titles and questions using company and role', () => {
    const topics = getTopicsForRoleAndCompany('Frontend Engineer', 'ByteMap');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toContain('Frontend Engineer System Architecture');
    expect(topics[0].question).toContain('ByteMap');
  });

  it('handles empty company or role gracefully', () => {
    const topics = getTopicsForRoleAndCompany('', '');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].topic).toContain('Software Engineer System Architecture');
    expect(topics[0].question).toContain('the organization');
  });
});
