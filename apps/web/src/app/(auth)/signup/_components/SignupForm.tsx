'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from '@/lib/lucide-google-icons';
import AuthShell from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { Role, BENEFITS } from './signup.constants';
import { useSignupForm } from './useSignupForm';
import { SignupRoleSelector } from './SignupRoleSelector';

interface SignupFormProps {
  initialRole: Role;
}

export default function SignupForm({ initialRole }: SignupFormProps) {
  const {
    role,
    setRole,
    name,
    setName,
    email,
    setEmail,
    companyName,
    setCompanyName,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errors,
    clearError,
    formError,
    setFormError,
    loading,
    handleSubmit,
  } = useSignupForm(initialRole);

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

        <SignupRoleSelector
          role={role}
          onChange={(newRole) => {
            setRole(newRole);
            setFormError('');
          }}
        />

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
