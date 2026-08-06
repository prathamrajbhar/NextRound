process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-32-chars-long!!';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-32-chars!!';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-service-secret';
process.env.PORT = '4001';

// Mocks for database and redis queues to run unit tests without live services
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    candidateProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    evaluation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/bullmq', () => ({
  screeningQueue: { add: jest.fn().mockResolvedValue({ id: 'job-123' }) },
  schedulingQueue: { add: jest.fn().mockResolvedValue({ id: 'job-124' }) },
  assessmentQueue: { add: jest.fn().mockResolvedValue({ id: 'job-125' }) },
  codingQueue: { add: jest.fn().mockResolvedValue({ id: 'job-126' }) },
  interviewQueue: { add: jest.fn().mockResolvedValue({ id: 'job-127' }) },
  evaluatorQueue: { add: jest.fn().mockResolvedValue({ id: 'job-128' }) },
  decisionQueue: { add: jest.fn().mockResolvedValue({ id: 'job-129' }) },
  mockQueue: { add: jest.fn().mockResolvedValue({ id: 'job-130' }) },
  resumeBuilderQueue: { add: jest.fn().mockResolvedValue({ id: 'job-131' }) },
  getQueue: jest.fn().mockReturnValue({ add: jest.fn().mockResolvedValue({ id: 'job-999' }) }),
}));
