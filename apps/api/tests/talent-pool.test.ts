import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';
import { prisma } from '@nextround/database';

/**
 * Batch 5 honesty contract for GET /api/v1/hr/talent-pool.
 *
 * similarityScore must be a REAL pgvector cosine percent or null — never the
 * fabricated 85/95/72 baseline. When the ai-service is unreachable or returns a
 * hash-fallback embedding, candidates must come back with a null score and
 * semanticMatch: false instead of a made-up number.
 */
describe('GET /api/v1/hr/talent-pool (real pgvector matching)', () => {
  const hrToken = signAccessToken({
    userId: 'user-hr-1',
    email: 'hr@org.com',
    role: 'hr',
    orgId: 'org-uuid',
  });

  const mockCandidate = {
    id: 'cand-1',
    user_id: 'user-1',
    skills: ['React', 'TypeScript'],
    target_roles: ['Frontend Engineer'],
    resume_url: 'https://resume/cand-1.pdf',
    proud_project: 'Built a hiring dashboard',
    created_at: new Date('2026-01-05T00:00:00.000Z'),
    user: { id: 'user-1', email: 'alex@example.com', created_at: new Date('2026-01-05T00:00:00.000Z') },
  };

  const mockFetch = jest.fn();

  const originalFetch = global.fetch;

  beforeEach(() => {
    (prisma.talentBookmark.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns recent candidates with a null score when no query is provided', async () => {
    (prisma.candidateProfile.findMany as jest.Mock).mockResolvedValue([mockCandidate]);

    const res = await request(app)
      .get('/api/v1/hr/talent-pool')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.semanticMatch).toBe(false);
    expect(res.body.data.candidates).toHaveLength(1);
    expect(global.fetch).not.toHaveBeenCalled();

    const c = res.body.data.candidates[0];
    expect(c.similarityScore).toBeNull();
    expect(c.candidateId).toBe('cand-1');
    expect(c.applicationId).toBeNull();
    expect(c.userId).toBe('user-1');
    expect(c.name).toBe('alex');
    expect(c.email).toBe('alex@example.com');
    expect(c.skills).toEqual(['React', 'TypeScript']);
    expect(c.targetRoles).toEqual(['Frontend Engineer']);
    expect(c.resumeUrl).toBe('https://resume/cand-1.pdf');
    expect(c.isBookmarked).toBe(false);
    expect(c.bookmarkId).toBeNull();
    expect(c.lastActive).toBe('2026-01-05T00:00:00.000Z');
  });

  it('does not fabricate scores when the ai-service is unreachable', async () => {
    (prisma.candidateProfile.findMany as jest.Mock).mockResolvedValue([mockCandidate]);
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app)
      .get('/api/v1/hr/talent-pool?query=senior%20react')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.semanticMatch).toBe(false);
    expect(res.body.data.candidates[0].similarityScore).toBeNull();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('treats a hash-fallback embedding as unavailable (null score)', async () => {
    (prisma.candidateProfile.findMany as jest.Mock).mockResolvedValue([mockCandidate]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          embedding: new Array(768).fill(0.1),
          model: 'Fallback-768 hash',
        },
      }),
    });

    const res = await request(app)
      .get('/api/v1/hr/talent-pool?query=senior%20react')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.semanticMatch).toBe(false);
    expect(res.body.data.candidates[0].similarityScore).toBeNull();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('runs real pgvector ranking and reports cosine similarity when a real embedding is available', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        candidateId: 'cand-1',
        userId: 'user-1',
        email: 'alex@example.com',
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        resumeUrl: 'https://resume/cand-1.pdf',
        skills: ['React', 'TypeScript'],
        targetRoles: ['Frontend Engineer'],
        cosineSimilarity: 0.84,
      },
      {
        candidateId: 'cand-2',
        userId: 'user-2',
        email: 'sam@example.com',
        createdAt: new Date('2026-01-04T00:00:00.000Z'),
        resumeUrl: null,
        skills: ['Python'],
        targetRoles: ['Backend Engineer'],
        cosineSimilarity: 0.42,
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          embedding: new Array(768).fill(0.25),
          model: 'BAAI/bge-base-en-v1.5 (ONNX)',
        },
      }),
    });

    const res = await request(app)
      .get('/api/v1/hr/talent-pool?query=senior%20react')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.semanticMatch).toBe(true);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(res.body.data.candidates).toHaveLength(2);
    expect(res.body.data.candidates[0].similarityScore).toBe(84);
    expect(res.body.data.candidates[0].candidateId).toBe('cand-1');
    expect(res.body.data.candidates[1].similarityScore).toBe(42);
    expect(res.body.data.candidates[1].lastActive).toBe('2026-01-04T00:00:00.000Z');

    // SQL fidelity — capture the actual $queryRaw invocation and verify the
    // pgvector ranking query it emitted. A broken query (dropped `<=>`
    // operator, missing `::vector` cast, missing ORDER BY, or a non-vector
    // bound parameter) would still return the mocked rows above and previously
    // slipped through with no assertion on the SQL itself.
    const queryRawCall = (prisma.$queryRaw as jest.Mock).mock.calls[0];
    const [templateStrings, ...boundParams] = queryRawCall;
    const emittedSql = (templateStrings as string[]).reduce(
      (sql: string, part: string, i: number) => sql + (boundParams[i] ?? '') + part,
      ''
    );

    // The pgvector operator, cast, ordering, and filtering must survive.
    expect(emittedSql).toContain('<=>');
    expect(emittedSql).toContain('::vector');
    expect(emittedSql).toContain('ORDER BY');
    expect(emittedSql).toContain('LIMIT 50');
    expect(emittedSql).toContain('resume_embedding IS NOT NULL');
    expect(emittedSql).toMatch(/JOIN\s+"User"/);
    expect(emittedSql).toMatch(/cosineSimilarity/i);

    // The bound vector parameter must be the serialized 768-dim query
    // embedding array string (vectorStr is interpolated, not bound as a raw
    // text scalar), matching pgvector's `$1::vector` literal form.
    expect(boundParams).toHaveLength(2);
    for (const param of boundParams) {
      expect(typeof param).toBe('string');
      expect(param.startsWith('[')).toBe(true);
      expect(param.endsWith(']')).toBe(true);
      const nums = param.slice(1, -1).split(',');
      expect(nums).toHaveLength(768);
      expect(nums.every((n) => Number.isFinite(Number(n)))).toBe(true);
    }
  });

  it('requires HR role (candidate receives 403)', async () => {
    const candidateToken = signAccessToken({
      userId: 'user-cand-1',
      email: 'candidate@test.com',
      role: 'candidate',
    });

    const res = await request(app)
      .get('/api/v1/hr/talent-pool?query=react')
      .set('Cookie', [`access_token=${candidateToken}`]);

    expect(res.status).toBe(403);
  });
});
