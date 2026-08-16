import { describe, it, expect } from 'vitest';
import { normalizeCodingProblem, pickCodingEndpoint } from '@/components/interview/coding/normalize';

describe('coding/normalizeCodingProblem', () => {
  it('normalizes a complete problem payload', () => {
    const problem = normalizeCodingProblem({
      id: 'p1',
      title: 'Two Sum',
      difficulty: 'easy',
      category: 'Arrays',
      description: 'Find two numbers.',
      constraints: ['n <= 10^4'],
      examples: [{ input: '[1,2]', output: '[0,1]', explanation: 'sum' }],
      starterCode: { python: 'def two_sum(): pass' },
      testCases: [{ name: 'basic', input: '[1,2]', expected: '[0,1]' }],
      editorial: 'sort first',
      expectedComplexity: { time: 'O(n)', space: 'O(1)' },
    });

    expect(problem.id).toBe('p1');
    expect(problem.title).toBe('Two Sum');
    expect(problem.difficulty).toBe('Easy');
    expect(problem.category).toBe('Arrays');
    expect(problem.constraints).toEqual(['n <= 10^4']);
    expect(problem.examples).toHaveLength(1);
    expect(problem.starterCode.python).toBe('def two_sum(): pass');
    expect(problem.starterCode.javascript).toBe('');
    expect(problem.testCases[0]).toEqual({ name: 'basic', input: '[1,2]', expected: '[0,1]', hidden: false });
    expect(problem.expectedComplexity).toEqual({ time: 'O(n)', space: 'O(1)' });
  });

  it('normalizes difficulty casing', () => {
    expect(normalizeCodingProblem({ difficulty: 'medium' }).difficulty).toBe('Medium');
    expect(normalizeCodingProblem({ difficulty: 'HARD' }).difficulty).toBe('Hard');
    expect(normalizeCodingProblem({ difficulty: 'MeDiUm' }).difficulty).toBe('Medium');
  });

  it('fills safe defaults for a sparse payload', () => {
    const problem = normalizeCodingProblem({});
    expect(problem.id).toBe('db-problem');
    expect(problem.title).toBe('Coding Problem');
    expect(problem.difficulty).toBe('Medium');
    expect(problem.category).toBe('Algorithms');
    expect(problem.description).toBe('');
    expect(problem.constraints).toEqual([]);
    expect(problem.examples).toEqual([]);
    expect(problem.starterCode).toEqual({ python: '', javascript: '', typescript: '', java: '', cpp: '' });
    expect(problem.testCases).toEqual([]);
    expect(problem.editorial).toBe('');
    expect(problem.expectedComplexity).toBeNull();
  });

  it('serializes non-string test case inputs and honors expectedOutput', () => {
    const problem = normalizeCodingProblem({
      testCases: [
        { input: [1, 2, 3], expected: [3, 2, 1] },
        { input: 'x', expectedOutput: 'y' },
        { name: 'hidden-case', input: 'a', expected: 'b', hidden: true },
      ],
    });

    expect(problem.testCases[0]).toEqual({ name: 'Case 1', input: '[1,2,3]', expected: '[3,2,1]', hidden: false });
    expect(problem.testCases[1]).toEqual({ name: 'Case 2', input: 'x', expected: 'y', hidden: false });
    expect(problem.testCases[2]).toEqual({ name: 'hidden-case', input: 'a', expected: 'b', hidden: true });
  });

  it('keeps missing starter code languages empty', () => {
    const problem = normalizeCodingProblem({ starterCode: { python: 'x' } });
    expect(problem.starterCode.python).toBe('x');
    expect(problem.starterCode.cpp).toBe('');
  });
});

describe('coding/pickCodingEndpoint', () => {
  const base = { role: 'SDE', company: 'ACME' };

  it('prefers the application endpoint when an applicationId is present', () => {
    expect(pickCodingEndpoint({ ...base, applicationId: 'app-1', sessionId: 'sess-1' }))
      .toBe('/applications/app-1/assessment/coding');
  });

  it('uses the mock session endpoint when only a sessionId is present', () => {
    expect(pickCodingEndpoint({ ...base, sessionId: 'sess-9' }))
      .toBe('/mock/sessions/sess-9/coding');
  });

  it('falls back to the generic problem endpoint with encoded role/company', () => {
    expect(pickCodingEndpoint(base)).toBe(
      '/coding/problem?role=SDE&company=ACME'
    );
    expect(pickCodingEndpoint({ role: 'Cloud Engineer', company: 'Google Cloud India' })).toBe(
      '/coding/problem?role=Cloud%20Engineer&company=Google%20Cloud%20India'
    );
  });

  it('supplies default role and company when absent', () => {
    expect(pickCodingEndpoint({ role: '', company: '' })).toBe(
      '/coding/problem?role=Software%20Engineer&company=Tech%20Enterprise'
    );
  });
});