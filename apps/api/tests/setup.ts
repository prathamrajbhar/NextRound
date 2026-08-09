// Mock database and other globals if needed
jest.mock('@nextround/database', () => ({
  prisma: {
    codingProblem: {
      upsert: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    evaluation: {
      upsert: jest.fn(),
    },
  },
}));
