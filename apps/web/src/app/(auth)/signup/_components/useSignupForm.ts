'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { Role, EMAIL_RE, MIN_PASSWORD_LENGTH } from './signup.constants';

export function useSignupForm(initialRole: Role) {
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

  return {
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
  };
}
