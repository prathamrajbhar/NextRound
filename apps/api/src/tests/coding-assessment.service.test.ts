import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@nextround/database';
import { selectCodingProblem } from '../services/coding/coding-bank.service';
import { badRequest } from '../lib/http-errors';
import { shuffleInPlace } from '../services/questions/question-bank.helpers';
import { executeCodingSubmission, compareOutputs } from '../services/coding/coding-executor.service';
import { enqueueSubmissionExecution, processSubmissionJob } from '../services/submission/submission-queue.service';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    codingProblem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    codingSubmission: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@nextround/database', () => ({
  prisma: mockPrisma,
  Prisma: {
    InputJsonValue: null,
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
  Prisma: {
    InputJsonValue: null,
  },
}));

vi.mock('../services/scoring/scoring.service', () => ({
  updateApplicationCodingScore: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/questions/question-bank.helpers', () => ({
  shuffleInPlace: vi.fn((arr: unknown[]) => arr),
}));

// ---------------------------------------------------------------------------
// Problem selection
// ---------------------------------------------------------------------------

describe('Coding Bank — selectCodingProblem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProblem = {
    id: 'prob-001',
    slug: 'two-sum',
    title: 'Two Sum',
    category: 'algorithms',
    difficulty: 'easy',
    description: 'Given an array of integers, return indices of the two numbers...',
    starter_code: {
      javascript: 'function twoSum(nums, target) {\n  // your code\n}',
      python: 'def two_sum(nums, target):\n    pass',
    },
    public_tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Basic case' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'No duplicates' },
    ],
    hidden_tests: [
      { input: [[1, 1, 1, 1], 2], expected: [0, 1] },
    ],
  };

  it('returns a random active problem with combined test cases', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);
    vi.mocked(shuffleInPlace).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ difficulty: 'easy', category: 'algorithms' });

    expect(result.id).toBe('prob-001');
    expect(result.slug).toBe('two-sum');
    expect(result.difficulty).toBe('easy');
    expect(result.category).toBe('algorithms');
    expect(result.starterCode).toHaveProperty('javascript');
    expect(result.starterCode).toHaveProperty('python');
    expect(result.testCases).toHaveLength(3);
    expect(result.testCases[0].hidden).toBe(false);
    expect(result.testCases[2].hidden).toBe(true);
  });

  it('returns a problem without category filter', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);
    vi.mocked(shuffleInPlace).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ difficulty: 'easy' });

    expect(result.id).toBe('prob-001');
    expect(result.category).toBe('algorithms');
  });

  it('returns a problem without difficulty filter', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);
    vi.mocked(shuffleInPlace).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ category: 'algorithms' });

    expect(result.id).toBe('prob-001');
  });

  it('returns a problem with no filters', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);
    vi.mocked(shuffleInPlace).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({});

    expect(result.id).toBe('prob-001');
  });

  it('throws badRequest when no active problems in pool', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([]);

    await expect(selectCodingProblem({ difficulty: 'hard', category: 'dp' })).rejects.toThrow(
      'No active coding problems found'
    );
  });

  it('throws badRequest when pool empty without filters', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([]);

    await expect(selectCodingProblem()).rejects.toThrow('No active coding problems found');
  });

  it('only queries is_active=true problems', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);

    await selectCodingProblem({ difficulty: 'easy', category: 'algorithms' });

    expect(mockPrisma.codingProblem.findMany).toHaveBeenCalledWith({
      where: {
        is_active: true,
        difficulty: 'easy',
        category: 'algorithms',
      },
      take: 50,
    });
  });

  it('handles problems with no public or hidden tests', async () => {
    const problemNoTests = {
      ...mockProblem,
      public_tests: [],
      hidden_tests: [],
    };
    mockPrisma.codingProblem.findMany.mockResolvedValue([problemNoTests]);
    vi.mocked(shuffleInPlace).mockReturnValue([problemNoTests]);

    const result = await selectCodingProblem({});

    expect(result.testCases).toHaveLength(0);
  });

  it('validates selected problem shape includes all required fields', async () => {
    mockPrisma.codingProblem.findMany.mockResolvedValue([mockProblem]);
    vi.mocked(shuffleInPlace).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({});

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('testCases');
    expect(result).toHaveProperty('expectedComplexity');
  });
});

// ---------------------------------------------------------------------------
// Code execution
// ---------------------------------------------------------------------------

describe('Code Executor — executeCodingSubmission', () => {
  it('returns summary with pass/fail for valid JavaScript submission', () => {
    const code = `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}
`;
    const testCases = [
      { name: 'Case 1', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: 'Case 2', args: [[3, 2, 4], 6], expected: [1, 2] },
    ];

    const result = executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.allPassed).toBe(true);
    expect(result.passRate).toBe(100);
    expect(result.passRateRatio).toBe(1);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].status).toBe('passed');
    expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.runnerVersion).toBeDefined();
  });

  it('returns partial pass when some tests fail', () => {
    const code = `function twoSum(nums, target) { return []; }`;
    const testCases = [
      { name: 'Pass Case', args: [[2, 7], 9], expected: [] },
      { name: 'Fail Case', args: [[1, 2], 3], expected: [0, 1] },
    ];

    const result = executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.allPassed).toBe(false);
    expect(result.passRate).toBe(50);
    expect(result.passRateRatio).toBe(0.5);
  });

  it('handles empty test suite', () => {
    const code = `const x = 1;`;
    const testCases: any[] = [];

    const result = executeCodingSubmission(code, 'javascript', testCases, 'solution');

    expect(result.allPassed).toBe(false);
    expect(result.passRate).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it('handles runtime errors gracefully', () => {
    const code = `function twoSum() { throw new Error('test error'); }`;
    const testCases = [
      { name: 'Error Case', args: [[1]], expected: [0] },
    ];

    const result = executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].status).toBe('error');
    expect(result.results[0].errorMessage).toBeDefined();
  });

  it('supports Python submissions', () => {
    const code = `
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []
`;
    const testCases = [
      { name: 'Python Case', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    ];

    const result = executeCodingSubmission(code, 'python', testCases, 'two_sum');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].status).toBe('passed');
  });

  it('handles empty code submission', () => {
    const code = '';
    const testCases = [
      { name: 'Empty Code', args: [[1, 2], 3], expected: [0, 1] },
    ];

    const result = executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.results).toHaveLength(0);
    expect(result.allPassed).toBe(false);
    expect(result.passRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// compareOutputs
// ---------------------------------------------------------------------------

describe('Coding Executor — compareOutputs', () => {
  it('compares exact primitives', () => {
    expect(compareOutputs(42, 42)).toBe(true);
    expect(compareOutputs('hello', 'hello')).toBe(true);
    expect(compareOutputs(true, true)).toBe(true);
    expect(compareOutputs(42, 43)).toBe(false);
  });

  it('compares floating point numbers within epsilon', () => {
    expect(compareOutputs(0.1 + 0.2, 0.3)).toBe(true);
  });

  it('compares trimmed strings', () => {
    expect(compareOutputs('  hello  \n', 'hello')).toBe(true);
  });

  it('compares objects and arrays via JSON equality', () => {
    expect(compareOutputs([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(compareOutputs({ a: 1 }, { a: 1 })).toBe(true);
    expect(compareOutputs([1, 2], [1, 3])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Submission queue service
// ---------------------------------------------------------------------------

describe('Submission Queue — enqueueSubmissionExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates submission with idempotency key', async () => {
    const idempotencyKey = `test_${crypto.randomUUID()}`;
    mockPrisma.codingSubmission.findUnique.mockResolvedValue(null);
    mockPrisma.codingSubmission.count.mockResolvedValue(0);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        codingSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 'sub-created-001',
            idempotency_key: idempotencyKey,
            code_hash: 'hash-123',
            language: 'javascript',
            status: 'queued',
            attempt_number: 1,
          }),
        },
      });
    });

    const result = await enqueueSubmissionExecution({
      applicationId: 'app-sub-001',
      problemId: 'prob-001',
      code: 'function solve() {}',
      language: 'javascript',
      idempotencyKey,
    });

    expect(result.idempotency_key).toBe(idempotencyKey);
    expect(result.status).toBe('queued');
    expect(result.attempt_number).toBe(1);
  });

  it('returns existing submission when idempotency key matches', async () => {
    const existing = {
      id: 'existing-sub',
      idempotency_key: 'existing-key',
      status: 'passed',
    };
    mockPrisma.codingSubmission.findUnique.mockResolvedValue(existing);

    const result = await enqueueSubmissionExecution({
      applicationId: 'app-sub-002',
      code: 'different code',
      language: 'javascript',
      idempotencyKey: 'existing-key',
    });

    expect(result.id).toBe('existing-sub');
    expect(mockPrisma.codingSubmission.count).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Submission Queue — processSubmissionJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates submission status to running and processes test cases', async () => {
    const submission = {
      id: 'sub-process-001',
      application_id: 'app-proc-001',
      problem_id: 'prob-process',
      code: 'function solve(x) { return x * 2; }',
      language: 'javascript',
      status: 'queued',
      problem: {
        entry_point: 'solve',
        public_tests: [{ name: 'Double 5', args: [5], expected: 10 }],
        hidden_tests: [{ name: 'Double 0', args: [0], expected: 0 }],
      },
    };

    mockPrisma.codingSubmission.update.mockResolvedValueOnce({
      ...submission,
      status: 'running',
    });
    mockPrisma.codingSubmission.findUnique.mockResolvedValue(submission);
    mockPrisma.codingSubmission.update.mockResolvedValueOnce({
      ...submission,
      status: 'passed',
      test_results: [{ name: 'Double 5', status: 'passed' }],
      pass_rate: 100,
    });

    const result = await processSubmissionJob('sub-process-001');

    expect(result.status).toBe('passed');
  });

  it('throws when problem has no configured test cases', async () => {
    const submission = {
      id: 'sub-default',
      application_id: 'app-default',
      problem_id: 'prob-no-tests',
      code: 'function solve() { return 0; }',
      language: 'javascript',
      status: 'queued',
      problem: {
        entry_point: 'solve',
        public_tests: [],
        hidden_tests: [],
      },
    };

    mockPrisma.codingSubmission.update.mockResolvedValue({
      ...submission,
      status: 'running',
    });
    mockPrisma.codingSubmission.findUnique.mockResolvedValue(submission);

    await expect(processSubmissionJob('sub-default')).rejects.toThrow(
      'has no configured test cases'
    );
  });

  it('throws when submission not found', async () => {
    mockPrisma.codingSubmission.update.mockResolvedValue({
      id: 'ghost-sub',
      status: 'running',
    });
    mockPrisma.codingSubmission.findUnique.mockResolvedValue(null);

    await expect(processSubmissionJob('ghost-sub')).rejects.toThrow(
      'Submission ghost-sub not found in database'
    );
  });
});
