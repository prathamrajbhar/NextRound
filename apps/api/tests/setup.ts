import { vi } from 'vitest';


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
