'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, CheckCircle2 } from '@/lib/lucide-google-icons';
import AuthShell, { AuthBenefit } from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

const SECURITY_BENEFITS: AuthBenefit[] = [
  {
    icon: ShieldCheck,
    title: 'Enterprise-grade credentials',
    description: 'Protect your organization candidate pipelines and confidential evaluation scorecards.',
  },
  {
    icon: KeyRound,
    title: 'Single-use temporary keys',
    description: 'Temporary invitation keys expire permanently once your custom password is set.',
  },
];

export default function ChangePasswordRequiredPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!newPassword) {
      next.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      next.newPassword = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/complete-first-login', {
        newPassword,
        confirmPassword,
      });

      await refreshUser();
      toast({
        title: 'Password updated successfully',
        description: 'Welcome to your NextRound workspace.',
        variant: 'success',
      });

      if (user?.role === 'hr') {
        if (!user.org_id) {
          router.push('/onboarding/company');
        } else {
          router.push('/hr/dashboard');
        }
      } else {
        router.push('/candidate/dashboard');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Security Requirement"
      headline={
        <>
          Set your new <span className="text-orange-400">secure password</span>.
        </>
      }
      sub="You have signed in using a temporary invitation key. Please choose a private, secure password before continuing to your workspace."
      benefits={SECURITY_BENEFITS}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300">
            <KeyRound className="h-3.5 w-3.5" />
            Temporary Password Active
          </div>
          <h2 className="font-display text-xl font-black tracking-tight text-white pt-2">
            Create Your Password
          </h2>
          <p className="text-xs font-medium text-slate-400">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        {formError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField
            id="newPassword"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            autoFocus
            error={errors.newPassword}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
              Password Guidelines
            </div>
            <p className="pl-5 text-slate-400">At least 8 characters. Mix upper & lower case, numbers, and symbols for best strength.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-bold text-slate-950 transition-all hover:from-orange-400 hover:to-amber-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-950/50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Securing Account...</span>
              </>
            ) : (
              <span>Save Password & Continue</span>
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
