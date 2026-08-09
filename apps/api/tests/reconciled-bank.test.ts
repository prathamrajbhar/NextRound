import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';
import { prisma } from '../src/lib/prisma';
import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';

const CANONICAL_IDS = aptitudeFallbackQuestions.map((q) => q.id);
const CANONICAL_OPTION_COUNT = aptitudeFallbackQuestions[0].options.length;

/**
 * When the AI service is unreachable both aptitude fallbacks must source their
 * questions from the canonical shared bank (packages/shared/data/
 * aptitude-questions.json): same ids, same options, and the correct answer-key
 * handling per surface (real assessment strips it; mock/practice keeps it for
 * self-assessment).
 */
describe('reconciled aptitude bank fallback (route payloads)', () => {
  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });

  const mockApplicationFindUnique = prisma.application.findUnique as jest.Mock;
  const mockAssessmentFindFirst = prisma.assessment.findFirst as jest.Mock;
  const mockAssessmentCreate = prisma.assessment.create as jest.Mock;
  const mockCandidateProfileFindUnique = prisma.candidateProfile.findUnique as jest.Mock;
  const mockMockSessionFindFirst = prisma.mockSession.findFirst as jest.Mock;

  beforeEach(() => {
    // Force the AI-service branch to fail so both routes take the canonical
    // fallback deterministically (no live network in unit tests).
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('AI service unreachable (test)'));
  });

  describe('GET /api/v1/applications/:id/assessment/aptitude', () => {
    it('falls back to canonical bank and strips the answer key', async () => {
      mockApplicationFindUnique.mockResolvedValue({
        id: 'app-1',
        candidate: { user_id: 'user-cand-1' },
        job: { title: 'Backend Engineer' },
      });
      mockAssessmentFindFirst.mockResolvedValue(null);
      mockAssessmentCreate.mockResolvedValue({
        id: 'assess-1',
        test_type: 'aptitude',
        questions: aptitudeFallbackQuestions,
        status: 'pending',
      });

      const res = await request(app)
        .get('/api/v1/applications/app-1/assessment/aptitude')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const questions = res.body.data.questions;
      expect(questions).toHaveLength(CANONICAL_IDS.length);
      expect(questions.map((q) => q.id)).toEqual(CANONICAL_IDS);
      for (const q of questions) {
        expect(q.options.length).toBe(CANONICAL_OPTION_COUNT);
        // No answer-key leakage to the client.
        expect(q).not.toHaveProperty('correctIndex');
        expect(q).not.toHaveProperty('explanation');
      }
      // The fallback was actually persisted for server-side scoring.
      expect(mockAssessmentCreate).toHaveBeenCalled();
    });

    it('interpolates the job title into the {role} placeholder', async () => {
      mockApplicationFindUnique.mockResolvedValue({
        id: 'app-2',
        candidate: { user_id: 'user-cand-1' },
        job: { title: 'Backend Engineer' },
      });
      mockAssessmentFindFirst.mockResolvedValue(null);
      mockAssessmentCreate.mockResolvedValue({ id: 'assess-2' });

      const res = await request(app)
        .get('/api/v1/applications/app-2/assessment/aptitude')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      const [first] = res.body.data.questions;
      expect(first.question).toContain('Backend Engineer');
      expect(first.question).not.toContain('{role}');
      expect(first.text).toBe(first.question);
    });
  });

  describe('GET /api/v1/mock/sessions/:id/aptitude', () => {
    it('falls back to canonical bank and keeps correctIndex for self-assessment', async () => {
      mockCandidateProfileFindUnique.mockResolvedValue({ id: 'cand-profile-1' });
      mockMockSessionFindFirst.mockResolvedValue({
        id: 'mock-1',
        target_role: 'Backend Engineer',
        target_company: 'Acme',
        difficulty: 'hard',
      });

      const res = await request(app)
        .get('/api/v1/mock/sessions/mock-1/aptitude')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const questions = res.body.data.questions;
      expect(questions).toHaveLength(CANONICAL_IDS.length);
      expect(questions.map((q) => q.id)).toEqual(CANONICAL_IDS);
      for (const q of questions) {
        // Practice sessions are candidate-scored, so the answer key is kept —
        // but the explanation is still stripped.
        expect(q).toHaveProperty('correctIndex');
        expect(q).not.toHaveProperty('explanation');
      }
      // Selected difficulty overrides the flexible questions (apt_q1/2/4).
      expect(questions[0].difficulty).toBe('hard');
    });
  });
});

/**
 * The internal coding-result webhook must persist 'unknown' (not a fabricated
 * 'O(N)') when the AI worker reports no complexity analysis.
 */
describe('PATCH /api/v1/internal/applications/:id/coding-result (honest complexity)', () => {
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'test-internal-service-secret';

  const mockApplicationFindUnique = prisma.application.findUnique as jest.Mock;
  const mockApplicationUpdate = prisma.application.update as jest.Mock;
  const mockCodingSubmissionUpdate = prisma.codingSubmission.update as jest.Mock;
  const mockEvaluationUpsert = prisma.evaluation.upsert as jest.Mock;

  it('stores complexity "unknown" when complexity_analysis is absent', async () => {
    mockApplicationFindUnique.mockResolvedValue({ id: 'app-1', status: 'assessment' });
    mockCodingSubmissionUpdate.mockResolvedValue({ id: 'sub-1' });
    mockApplicationUpdate.mockResolvedValue({ id: 'app-1', status: 'rejected' });
    mockEvaluationUpsert.mockResolvedValue({ id: 'eval-1' });

    const res = await request(app)
      .patch('/api/v1/internal/applications/app-1/coding-result')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({
        submissionId: 'sub-1',
        score: 40,
        pass_rate: 0.4,
        passed: false,
        feedback: 'Failed 2/5 test cases.',
        execution_time_ms: 12.3,
        memory_kb: 2048,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(mockCodingSubmissionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ complexity: 'unknown' }),
      })
    );
    // Failed code must not regress a passed app but reject one still in assessment.
    expect(mockApplicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'rejected' }) })
    );
  });

  it('stores the reported time_complexity when one is provided', async () => {
    mockApplicationFindUnique.mockResolvedValue({ id: 'app-1', status: 'assessment' });
    mockCodingSubmissionUpdate.mockResolvedValue({ id: 'sub-1' });
    mockApplicationUpdate.mockResolvedValue({ id: 'app-1', status: 'rejected' });
    mockEvaluationUpsert.mockResolvedValue({ id: 'eval-1' });

    const res = await request(app)
      .patch('/api/v1/internal/applications/app-1/coding-result')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({
        submissionId: 'sub-1',
        passed: false,
        complexity_analysis: { time_complexity: 'O(N log N)' },
      });

    expect(res.status).toBe(200);
    expect(mockCodingSubmissionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ complexity: 'O(N log N)' }),
      })
    );
  });

  it('rejects requests without the internal secret', async () => {
    const res = await request(app)
      .patch('/api/v1/internal/applications/app-1/coding-result')
      .send({ submissionId: 'sub-1', passed: false });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
