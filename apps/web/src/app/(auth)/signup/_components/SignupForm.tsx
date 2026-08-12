'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AudioLines,
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Mic,
  Scale,
  User,
  UserPlus,
} from '@/lib/lucide-google-icons';
import AuthShell, { AuthBenefit } from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type Role = 'candidate' | 'hr';

const BENEFITS: AuthBenefit[] = [
  {
    icon: Mic,
    title: 'AI voice interviews',
    description: 'Candidates are screened by voice agents with live transcripts and structured scoring.',
  },
  {
    icon: Scale,
    title: 'Objective rubric decisions',
    description: 'Every evaluation is normalized and explained — clear, defensible shortlists.',
  },
  {
    icon: AudioLines,
    title: 'Candidate prep built in',
    description: 'Mock interviews and practice content for every applicant, free of charge.',
  },
];

const ROLE_OPTIONS: { value: Role; label: string; icon: AuthBenefit['icon'] }[] = [
  { value: 'candidate', label: "I'm a Candidate", icon: User },
  { value: 'hr', label: "I'm an Employer", icon: Building },
];

interface SignupFormProps {
  /** Account type preselected by the landing page via /signup?role=hr|candidate. */
  initialRole: Role;
}

export default function SignupForm({ initialRole }: SignupFormProps) {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; companyName?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = (key: keyof typeof errors) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (role === 'hr' && !companyName.trim()) next.companyName = 'Company name is required.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);

    const result = await register(email.trim(), password, role, role === 'hr' ? companyName.trim() : undefined);
    setLoading(false);

    if (result.success && result.user) {
      toast({ title: 'Account created successfully', variant: 'success' });
      router.push(role === 'candidate' ? '/onboarding/candidate' : '/onboarding/company');
    } else {
      setFormError(result.error || 'Unable to create your account. Please try again.');
    }
  };

  return (
    <AuthShell
      eyebrow="AI-Native Recruitment Platform"
      headline={
        <>
          From application to offer, <span className="text-orange-400">zero human steps.</span>
        </>
      }
      sub="Post a role and AI agents source, screen, interview and score candidates — with free mock-interview prep for every applicant."
      benefits={BENEFITS}
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-black tracking-tight text-white">Create your account</h2>
          <p className="text-xs font-medium text-slate-400">Choose your account type to get started.</p>
        </div>

        <div role="group" aria-label="Account type" className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setRole(option.value);
                setFormError('');
              }}
              aria-pressed={role === option.value}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all ${
                role === option.value
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>

        {formError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField
            id="name"
            label="Full name"
            icon={User}
            value={name}
            onChange={(value) => {
              setName(value);
              clearError('name');
            }}
            placeholder="Enter your full name"
            autoComplete="name"
            required
            autoFocus
            error={errors.name}
          />

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
            error={errors.email}
          />

          {role === 'hr' && (
            <div className="anim-fade-in motion-reduce:animate-none">
              <AuthField
                id="companyName"
                label="Company name"
                icon={Building}
                value={companyName}
                onChange={(value) => {
                  setCompanyName(value);
                  clearError('companyName');
                }}
                placeholder="Acme Inc."
                autoComplete="organization"
                required
                error={errors.companyName}
              />
            </div>
          )}

          <div>
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
              placeholder="Create a password"
              autoComplete="new-password"
              required
              error={errors.password}
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
            <PasswordStrength password={password} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-extrabold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-500 hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            By continuing you agree to the NextRound terms of service and privacy policy.
          </p>
        </form>

        <p className="pt-1 text-center text-xs font-medium text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-extrabold text-orange-400 transition-colors hover:text-orange-300"
          >
            Sign in
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
