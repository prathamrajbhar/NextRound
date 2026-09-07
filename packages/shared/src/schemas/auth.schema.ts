import { z } from 'zod';
import { UserRole } from '../enums';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.nativeEnum(UserRole).default(UserRole.CANDIDATE),
  orgName: z.string().optional(),
}).refine((registrationInput) => {
  if (registrationInput.role === UserRole.HR && (!registrationInput.orgName || registrationInput.orgName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Organization name is required when registering as HR',
  path: ['orgName'],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const UpdateEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
