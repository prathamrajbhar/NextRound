import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../src/middleware/auth';
import { requireRole } from '../src/middleware/rbac';
import { requireOrgScope } from '../src/middleware/orgScope';
import { requireInternalSecret } from '../src/middleware/internalSecret';
import { signAccessToken } from '../src/lib/jwt';

describe('Auth & Security Middleware Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should return 401 if access token is missing', () => {
      authenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Missing or invalid authentication token' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', () => {
      mockReq.headers = { authorization: 'Bearer invalid-token-string' };
      authenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Invalid or expired token' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should populate req.user and call next() when valid token is provided in cookie', () => {
      const token = signAccessToken({
        userId: 'user-123',
        email: 'hr@org1.com',
        role: 'hr',
        orgId: 'org-123',
      });
      mockReq.cookies = { access_token: token };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user-123');
      expect(mockReq.user?.role).toBe('hr');
      expect(mockReq.user?.orgId).toBe('org-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should populate req.user and call next() when valid Bearer token is provided in header', () => {
      const token = signAccessToken({
        userId: 'candidate-456',
        email: 'cand@test.com',
        role: 'candidate',
      });
      mockReq.headers = { authorization: `Bearer ${token}` };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('candidate-456');
      expect(mockReq.user?.role).toBe('candidate');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate middleware', () => {
    it('should call next without setting req.user when token is missing', () => {
      optionalAuthenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set req.user and call next when valid token is provided', () => {
      const token = signAccessToken({
        userId: 'cand-789',
        email: 'cand2@test.com',
        role: 'candidate',
      });
      mockReq.cookies = { access_token: token };

      optionalAuthenticate(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.user?.userId).toBe('cand-789');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should return 401 if req.user is undefined', () => {
      const middleware = requireRole('hr');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if candidate tries to access HR route', () => {
      mockReq.user = { userId: 'cand-1', email: 'c@t.com', role: 'candidate' };
      const middleware = requireRole('hr');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Forbidden: requires one of [hr] role(s)' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user role matches allowed roles', () => {
      mockReq.user = { userId: 'hr-1', email: 'h@t.com', role: 'hr', orgId: 'org-1' };
      const middleware = requireRole('hr');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOrgScope middleware', () => {
    it('should return 403 if user has no orgId', () => {
      mockReq.user = { userId: 'hr-no-org', email: 'h2@t.com', role: 'hr' };
      requireOrgScope(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Forbidden: HR user must belong to an organization' })
      );
    });

    it('should call next() if user has orgId', () => {
      mockReq.user = { userId: 'hr-1', email: 'h@t.com', role: 'hr', orgId: 'org-100' };
      requireOrgScope(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireInternalSecret middleware', () => {
    it('should return 403 if x-internal-service-secret header is missing', () => {
      requireInternalSecret(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if secret does not match', () => {
      mockReq.headers = { 'x-internal-service-secret': 'wrong-secret' };
      requireInternalSecret(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should call next() when correct internal secret is provided', () => {
      mockReq.headers = { 'x-internal-service-secret': 'test-internal-service-secret' };
      requireInternalSecret(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
