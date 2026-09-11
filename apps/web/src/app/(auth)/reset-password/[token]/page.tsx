'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from '@/lib/lucide-google-icons';
import AuthShell, { AuthBenefit } from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import { apiClient } from '@/lib/apiClient';

const RESET_BENEFITS: AuthBenefit[] = [
  {
    icon: ShieldCheck,
    title: 'Bank-grade security',
    description: 'All passwords are hashed with high-cost salt factors to guarantee workspace isolation.',
  },
  {
    icon: KeyRound,
    title: 'One-time authorization',
    description: 'Your recovery token expires immediately upon updating your credentials.',
  },
];

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: { password?: string; confirmPassword?: string } = {};
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters long.';
    if (!confirmPassword) errs.confirmPassword = 'Confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Security"
      headline={
        <>
          Create your <span className="text-orange-400">new password.</span>
        </>
      }
      sub="Choose a strong, unique password to secure your NextRound recruitment workspace."
      benefits={RESET_BENEFITS}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-black tracking-tight text-white">Create New Password</h2>
          <p className="text-xs font-medium text-slate-400">
            Specify a secure password for your account.
          </p>
        </div>

        {formError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
            {formError}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-white">Password updated!</p>
              <p className="text-xs text-slate-300">Redirecting to login…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <AuthField
              id="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              required
              autoFocus
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <AuthField
              id="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              icon={Lock}
              value={confirmPassword}
              onChange={(val) => {
                setConfirmPassword(val);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="••••••••"
              required
              error={errors.confirmPassword}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-200"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-extrabold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-500 hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password…
                  </>
                ) : (
                  'Save Password'
                )}
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
