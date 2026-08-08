import request from 'supertest';
import { app } from '../src/app';

describe('Security & Parameter Injection Tests', () => {
  describe('Internal Endpoint Protection', () => {
    it('should reject requests to internal endpoints without X-Internal-Service-Secret with 403', async () => {
      const res = await request(app)
        .post('/api/v1/internal/screening-complete')
        .send({
          application_id: 'app-123',
          resume_score: 85,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should reject requests to internal endpoints with wrong secret with 403', async () => {
      const res = await request(app)
        .post('/api/v1/internal/screening-complete')
        .set('X-Internal-Service-Secret', 'invalid-secret')
        .send({
          application_id: 'app-123',
          resume_score: 85,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('JWT Tampering Protection', () => {
    it('should return 401 when a tampered JWT header is submitted', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsInJvbGUiOiJocnJvbGUiLCJvcmdJZCI6Im9yZy0xMjMifQ.tampered-signature';

      const res = await request(app)
        .get('/api/v1/hr/dashboard')
        .set('Cookie', [`access_token=${tamperedToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired token');
    });
  });

  describe('SQL & Parameter Injection Sanity', () => {
    it('should return 400 validation error for malformed inputs rather than exposing DB errors', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });
});
