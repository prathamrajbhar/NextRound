'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from '@/lib/lucide-google-icons';
import AuthShell, { AuthBenefit } from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import { apiClient } from '@/lib/apiClient';

const FORGOT_BENEFITS: AuthBenefit[] = [
  {
    icon: ShieldCheck,
    title: 'Secure password recovery',
    description: 'Time-limited, single-use reset links ensure your recruitment workspace remains protected.',
  },
  {
    icon: KeyRound,
    title: 'Instant email delivery',
    description: 'Receive your recovery link within seconds directly to your registered work email.',
  },
  {
    icon: Sparkles,
    title: 'Zero friction access',
    description: 'Reset your credentials seamlessly and pick right back up with your candidate pipeline.',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      headline={
        <>
          Reset your account, <span className="text-orange-400">get back to hiring.</span>
        </>
      }
      sub="Enter your registered email address and we'll dispatch a secure, single-use password reset link to your inbox."
      benefits={FORGOT_BENEFITS}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-black tracking-tight text-white">Recover your password</h2>
          <p className="text-xs font-medium text-slate-400">
            We will send a password reset link to your registered email.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-white">Reset link sent!</p>
              <p className="text-xs font-medium leading-relaxed text-slate-300">
                Please check your inbox at <span className="font-bold text-orange-400">{email}</span>. The link will expire in 1 hour.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white cursor-pointer"
              >
                Send to a different email
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-500 hover:shadow-orange-500/30 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <AuthField
              id="email"
              label="Email address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(val) => {
                setEmail(val);
                if (emailError) setEmailError('');
                if (error) setError('');
              }}
              placeholder="ananya.iyer@gmail.com"
              autoComplete="email"
              required
              autoFocus
              error={emailError}
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
                    Sending link…
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Cancel and return to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
