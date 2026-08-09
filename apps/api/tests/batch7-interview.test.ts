import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { evaluatorQueue } from '../src/lib/bullmq';
import { signAccessToken } from '../src/lib/jwt';

/**
 * Batch 7a interview-result honesty contract:
 *  - PATCH /interviews/:id/result with no interview_score (and no real
 *    composite) stores a null decision and does NOT move the application
 *    status — a missing score must never be coerced into an auto-reject.
 *  - A real score still advances the application and enqueues the evaluator
 *    with the real stage scores.
 */
describe('PATCH /api/v1/internal/interviews/:id/result (no fabricated score)', () => {
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'test-internal-service-secret';
  const mockInterviewFindUnique = prisma.interview.findUnique as jest.Mock;
  const mockInterviewUpdate = prisma.interview.update as jest.Mock;
  const mockEvaluationUpsert = prisma.evaluation.upsert as jest.Mock;
  const mockAppUpdate = prisma.application.update as jest.Mock;
  const mockEvaluatorAdd = evaluatorQueue.add as jest.Mock;

  it('stores null decision and leaves application status untouched when interview_score is absent', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-1',
      application_id: 'app-1',
      status: 'in_progress',
      transcript: null,
    });
    mockInterviewUpdate.mockResolvedValue({
      id: 'int-1',
      application_id: 'app-1',
      status: 'completed',
    });
    mockEvaluationUpsert.mockResolvedValue({
      id: 'eval-1',
      application_id: 'app-1',
      stage: 'interview',
      interview_score: null,
      composite_score: null,
      decision: null,
    });

    const res = await request(app)
      .patch('/api/v1/internal/interviews/int-1/result')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({ transcript: [] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // The evaluation is written with a null score and a null decision — no
    // fabricated 85/70 threshold outcome.
    expect(mockEvaluationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          interview_score: null,
          composite_score: null,
          decision: null,
        }),
        update: expect.objectContaining({
          interview_score: null,
          composite_score: null,
          decision: null,
        }),
      })
    );

    // Without a real score the application status is NOT advanced/regressed,
    // and the evaluator is NOT enqueued with fabricated stage defaults.
    expect(mockAppUpdate).not.toHaveBeenCalled();
    expect(mockEvaluatorAdd).not.toHaveBeenCalled();
  });

  it('advances to hr_round and enqueues the evaluator when a real score is present', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-2',
      application_id: 'app-2',
      status: 'in_progress',
      transcript: null,
    });
    mockInterviewUpdate.mockResolvedValue({
      id: 'int-2',
      application_id: 'app-2',
      status: 'completed',
    });
    mockEvaluationUpsert.mockResolvedValue({
      id: 'eval-2',
      application_id: 'app-2',
      stage: 'interview',
      resume_score: null,
      aptitude_score: null,
      coding_score: null,
      interview_score: 84.0,
      composite_score: 84.0,
      decision: 'hire',
    });
    mockAppUpdate.mockResolvedValue({ id: 'app-2', status: 'hr_round' });

    const res = await request(app)
      .patch('/api/v1/internal/interviews/int-2/result')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({ transcript: [{ speaker: 'ai', text: 'Welcome.' }], interview_score: 84 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockAppUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'hr_round', hr_round_status: 'pending' }),
      })
    );
    // Missing stage scores are passed as null to the evaluator — never 80/85/90.
    expect(mockEvaluatorAdd).toHaveBeenCalledWith(
      'run_evaluation',
      expect.objectContaining({
        extraData: expect.objectContaining({
          screening_score: null,
          aptitude_score: null,
          coding_score: null,
          interview_score: 84,
        }),
      }),
      expect.anything()
    );
  });
});

describe('PATCH /api/v1/interviews/:id/proctoring (absent CV signals stored as null)', () => {
  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });
  const mockInterviewFindUnique = prisma.interview.findUnique as jest.Mock;
  const mockInterviewUpdate = prisma.interview.update as jest.Mock;

  it('stores null for every signal the client did not send (no fabricated clean audit flag)', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-proc-1',
      application_id: 'app-1',
      status: 'in_progress',
      proctor_flags: [],
    });
    mockInterviewUpdate.mockResolvedValue({
      id: 'int-proc-1',
      application_id: 'app-1',
      status: 'in_progress',
    });

    const res = await request(app)
      .patch('/api/v1/interviews/int-proc-1/proctoring')
      .set('Cookie', [`access_token=${candidateToken}`])
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.proctor_flag_count).toBe(1);

    // An unmeasured signal must be stored as null (unknown), never coerced to a
    // compliant value (1 / true / 90 / 0) that would become a clean audit flag.
    expect(mockInterviewUpdate).toHaveBeenCalledWith({
      where: { id: 'int-proc-1' },
      data: expect.objectContaining({
        proctor_flags: [
          expect.objectContaining({
            face_count: null,
            gaze_centered: null,
            engagement_index: null,
            multiple_faces_detected: null,
            tab_switch_count: null,
          }),
        ],
        engagement_signal: expect.objectContaining({
          latest_engagement: null,
          total_events: 1,
        }),
      }),
    });
  });

  it('preserves real signal values while nulling only the signals not sent', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-proc-2',
      application_id: 'app-1',
      status: 'in_progress',
      proctor_flags: [],
    });
    mockInterviewUpdate.mockResolvedValue({
      id: 'int-proc-2',
      application_id: 'app-1',
      status: 'in_progress',
    });

    const res = await request(app)
      .patch('/api/v1/interviews/int-proc-2/proctoring')
      .set('Cookie', [`access_token=${candidateToken}`])
      .send({
        face_count: 2,
        engagement_index: 88,
        multiple_faces_detected: true,
      });

    expect(res.status).toBe(200);
    expect(mockInterviewUpdate).toHaveBeenCalledWith({
      where: { id: 'int-proc-2' },
      data: expect.objectContaining({
        proctor_flags: [
          expect.objectContaining({
            face_count: 2,
            gaze_centered: null,
            engagement_index: 88,
            multiple_faces_detected: true,
            tab_switch_count: null,
          }),
        ],
        engagement_signal: expect.objectContaining({
          latest_engagement: 88,
        }),
      }),
    });
  });
});

describe('POST /api/v1/interviews/:id/session-token (honest session contract)', () => {
  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });
  const mockInterviewFindUnique = prisma.interview.findUnique as jest.Mock;
  const mockInterviewUpdate = prisma.interview.update as jest.Mock;
  const ORIGINAL_ICE = process.env.ICE_SERVERS;

  afterEach(() => {
    if (ORIGINAL_ICE === undefined) {
      delete process.env.ICE_SERVERS;
    } else {
      process.env.ICE_SERVERS = ORIGINAL_ICE;
    }
  });

  it('returns the real org name, a null session token, and the default STUN servers', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-sess-1',
      application_id: 'app-1',
      status: 'in_progress',
      application: {
        job: {
          title: 'Staff Engineer',
          organization: { name: 'Acme Corp' },
        },
      },
    });

    delete process.env.ICE_SERVERS;

    const res = await request(app)
      .post('/api/v1/interviews/int-sess-1/session-token')
      .set('Cookie', [`access_token=${candidateToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // company comes from the real organization — never the hardcoded product name.
    expect(res.body.data.company).toBe('Acme Corp');
    expect(res.body.data.jobTitle).toBe('Staff Engineer');
    // No real session credential exists here: the fields are null, not fabricated.
    expect(res.body.data.sessionToken).toBeNull();
    expect(res.body.data.expiresInSeconds).toBeNull();
    // Dev default: the two public Google STUN servers, no invented TURN.
    expect(res.body.data.iceServers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
    // status was already in_progress, so the row is not touched.
    expect(mockInterviewUpdate).not.toHaveBeenCalled();
  });

  it('honors env-provided ICE_SERVERS and falls back to STUN defaults when malformed', async () => {
    mockInterviewFindUnique.mockResolvedValue({
      id: 'int-sess-2',
      application_id: 'app-1',
      status: 'scheduled',
      application: {
        job: {
          title: 'Staff Engineer',
          organization: { name: 'Acme Corp' },
        },
      },
    });
    mockInterviewUpdate.mockResolvedValue({
      id: 'int-sess-2',
      application_id: 'app-1',
      status: 'in_progress',
    });

    // 1. A valid env JSON (including a real TURN credential) is honored verbatim.
    process.env.ICE_SERVERS = JSON.stringify([
      { urls: 'stun:stun.example.com:19302' },
      { urls: 'turn:turn.example.com:3478', username: 'u', credential: 'p' },
    ]);
    const validRes = await request(app)
      .post('/api/v1/interviews/int-sess-2/session-token')
      .set('Cookie', [`access_token=${candidateToken}`]);
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.iceServers).toEqual([
      { urls: 'stun:stun.example.com:19302' },
      { urls: 'turn:turn.example.com:3478', username: 'u', credential: 'p' },
    ]);

    // 2. Malformed JSON falls back to the STUN defaults instead of inventing servers.
    process.env.ICE_SERVERS = 'not json';
    const badRes = await request(app)
      .post('/api/v1/interviews/int-sess-2/session-token')
      .set('Cookie', [`access_token=${candidateToken}`]);
    expect(badRes.status).toBe(200);
    expect(badRes.body.data.iceServers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });
});
