'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import type { CandidateProfileData, Application } from '@/types';
import { EMAIL_RE } from './login.constants';

export function useLoginForm() {
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

      if (result.user.role === 'candidate') {
        try {
          const profileData = await apiClient.get<{ profile?: CandidateProfileData }>('/candidate/profile');
          const profile = profileData?.profile;
          const isProfileIncomplete = !profile || !profile.full_name || !profile.data_consent;
          if (isProfileIncomplete) {
            router.push('/onboarding/candidate');
            return;
          }

          const apps = await apiClient.get<Application[]>('/candidate/applications');
          const acceptedApp = apps?.find((app) => app.status === 'accepted');
          if (acceptedApp) {
            const isCompleted = localStorage.getItem('onboarding_completed_' + acceptedApp.id) === 'true';
            if (!isCompleted) {
              router.push(`/candidate/applications/${acceptedApp.id}/onboarding`);
              return;
            }
          }
        } catch {
          router.push('/onboarding/candidate');
          return;
        }
        router.push('/candidate/dashboard');
      } else {
        if (!result.user.org_id) {
          router.push('/onboarding/company');
          return;
        }
        router.push('/hr/dashboard');
      }
    } else {
      setFormError(result.error || 'Unable to sign in. Please try again.');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errors,
    clearError,
    formError,
    loading,
    handleSubmit,
  };
}
