import rateLimit from 'express-rate-limit';

const isTest = () => process.env.NODE_ENV === 'test';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in a minute.',
  },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again later.',
  },
});
