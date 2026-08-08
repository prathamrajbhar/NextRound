import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';

describe('RBAC & Multi-Tenant Isolation Integration Tests', () => {
  const orgA_HR_Token = signAccessToken({
    userId: 'user-hr-org-a',
    email: 'hr@orga.com',
    role: 'hr',
    orgId: 'org-a-uuid',
  });

  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });

  describe('Multi-Tenant HR Isolation', () => {
    it('should return 403 Forbidden when candidate attempts to access HR Analytics endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/hr/analytics')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should return 403 Forbidden when HR submits org_id in request body (rejectExplicitOrgId)', async () => {
      const res = await request(app)
        .get('/api/v1/hr/talent-pool?org_id=org-b-uuid')
        .set('Cookie', [`access_token=${orgA_HR_Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Security Error: org_id parameter is forbidden');
    });

    it('should return 403 Forbidden when candidate attempts candidate-forbidden endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', [`access_token=${candidateToken}`])
        .send({
          title: 'Unauthorized Job Creation',
          department: 'Engineering',
          location: 'Remote',
          type: 'full-time',
          description: 'Test job description',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
