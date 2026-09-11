import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter, forgotPasswordRateLimiter } from '../../middleware/rateLimit';
import {
  register,
  login,
  refresh,
  getMe,
} from './auth.controller';
import {
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  updateEmail,
  completeFirstLoginPassword,
} from './auth-password.controller';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.APP_URL) {
  throw new Error(
    'Refusing to start in production: APP_URL is required for generating password reset and verification links. Set it in the environment.'
  );
}

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, register);
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authenticate, getMe);

authRouter.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/complete-first-login', authenticate, completeFirstLoginPassword);
authRouter.patch('/change-password', authenticate, changePassword);
authRouter.patch('/email', authenticate, updateEmail);

