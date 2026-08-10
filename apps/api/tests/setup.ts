import { vi } from 'vitest';

// Mock database and other globals if needed
vi.mock('@nextround/database', () => ({
  prisma: {
    codingProblem: {
      upsert: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    evaluation: {
      upsert: vi.fn(),
    },
  },
}));
