process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-32-chars-long!!';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-32-chars!!';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-service-secret';
process.env.PORT = '4001';

// Mocks for database and redis queues to run unit tests without live services.
// Mocked at the package level (@nextround/database) so internal.routes.ts and
// lib/pipeline.ts — which import prisma directly from '@nextround/database' —
// share the SAME fake object as consumers that go through src/lib/prisma.ts
// (which simply re-exports it). Without this, internal webhook handlers hit a
// real PrismaClient and would 404/throw against a live DB.
jest.mock('@nextround/database', () => ({
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
      findMany: jest.fn(),
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
      upsert: jest.fn(),
    },
    assessment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    interview: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    offer: {
      upsert: jest.fn(),
    },
    mockSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    agentLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    codingSubmission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    talentBookmark: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
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
  analyticsQueue: { add: jest.fn().mockResolvedValue({ id: 'job-analytics-1' }) },
  getQueue: jest.fn().mockReturnValue({ add: jest.fn().mockResolvedValue({ id: 'job-999' }) }),
}));
