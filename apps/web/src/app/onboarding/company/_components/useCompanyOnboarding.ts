'use client';

import { useState } from 'react';

export interface CompanyForm {
  name: string;
  logoUrl?: string;
  website: string;
  industry: string;
  size: string;
  hqLocation: string;

  primaryRoles: string[];
  autoOffer: boolean;

  invites: string[];
}

export const DEFAULT_FORM: CompanyForm = {
  name: '',
  logoUrl: undefined,
  website: '',
  industry: 'Technology',
  size: '11-50',
  hqLocation: '',
  primaryRoles: [],
  autoOffer: false,
  invites: [],
};

export interface CompanyStepProps {
  form: CompanyForm;
  update: <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) => void;
  addRole: (value: string) => void;
  removeRole: (value: string) => void;
  addInvite: (email: string) => void;
  removeInvite: (email: string) => void;
}

export function useCompanyOnboarding() {
  const [form, setForm] = useState<CompanyForm>(DEFAULT_FORM);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addRole = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !form.primaryRoles.includes(trimmed)) {
      setForm((f) => ({ ...f, primaryRoles: [...f.primaryRoles, trimmed] }));
    }
  };

  const removeRole = (value: string) =>
    setForm((f) => ({ ...f, primaryRoles: f.primaryRoles.filter((v) => v !== value) }));

  const addInvite = (email: string) => {
    const trimmed = email.trim();
    if (trimmed && !form.invites.includes(trimmed)) {
      setForm((f) => ({ ...f, invites: [...f.invites, trimmed] }));
    }
  };

  const removeInvite = (email: string) =>
    setForm((f) => ({ ...f, invites: f.invites.filter((v) => v !== email) }));

  return { form, setForm, step, setStep, submitting, setSubmitting, error, setError, update, addRole, removeRole, addInvite, removeInvite };
}

export function buildOrganizationPayload(form: CompanyForm) {
  return {
    name: form.name.trim(),
    logoUrl: form.logoUrl || undefined,
    industry: form.industry,
    size: form.size,
    settings: {
      website: form.website.trim() || undefined,
      hqLocation: form.hqLocation.trim() || undefined,
      primaryRoles: form.primaryRoles,
      autoOffer: form.autoOffer,
    },
  };
}
