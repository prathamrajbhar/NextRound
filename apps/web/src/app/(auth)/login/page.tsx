'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from '@/lib/lucide-google-icons';
import AuthShell, { AuthBenefit } from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFITS: AuthBenefit[] = [
  {
    icon: LayoutDashboard,
    title: 'One workspace for hiring',
    description: 'Jobs, candidates, interviews and offers — managed from a single dashboard.',
  },
  {
    icon: Activity,
    title: 'Live multi-stage scorecards',
    description: 'Follow structured evaluations in real time as every candidate progresses.',
  },
  {
    icon: ShieldCheck,
    title: 'Org-scoped by design',
    description: 'Role-based access keeps each tenant’s data isolated and auditable.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = (key: keyof typeof errors) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);

    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      toast({ title: 'Signed in successfully', variant: 'success' });
      router.push(result.user.role === 'candidate' ? '/candidate/dashboard' : '/hr/dashboard');
    } else {
      setFormError(result.error || 'Unable to sign in. Please try again.');
    }
  };

  return (
    <AuthShell
      eyebrow="AI-Native Recruitment Platform"
      headline={
        <>
          Your hiring pipeline, <span className="text-orange-400">in one place.</span>
        </>
      }
      sub="Sourcing, AI screening, voice interviews and automated decisions — all managed from a single workspace."
      benefits={BENEFITS}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-black tracking-tight text-white">Welcome back</h2>
          <p className="text-xs font-medium text-slate-400">Sign in to your NextRound account.</p>
        </div>

        {formError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField
            id="email"
            label="Email address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(value) => {
              setEmail(value);
              clearError('email');
            }}
            placeholder="name@company.com"
            autoComplete="email"
            required
            autoFocus
            error={errors.email}
          />

          <AuthField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(value) => {
              setPassword(value);
              clearError('password');
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            error={errors.password}
            labelRight={
              <Link
                href="/forgot-password"
                className="text-[11px] font-extrabold text-orange-400 transition-colors hover:text-orange-300"
              >
                Forgot password?
              </Link>
            }
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-extrabold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-500 hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="pt-1 text-center text-xs font-medium text-slate-500">
          New to NextRound?{' '}
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 font-extrabold text-orange-400 transition-colors hover:text-orange-300"
          >
            Create an account
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
