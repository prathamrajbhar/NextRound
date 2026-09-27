'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

export type WorkplaceType = 'Remote-first' | 'Hybrid' | 'Onsite';

export interface CompanyForm {
  name: string;
  logoUrl?: string;
  website: string;
  industry: string;
  size: string;
  hqLocation: string;
  description: string;
  workplaceType: WorkplaceType;

  primaryRoles: string[];
  interviewTimezone: string;
  interviewHours: string;
  autoOffer: boolean;

  invites: string[];
  isPreConfigured?: boolean;
}

export const DEFAULT_FORM: CompanyForm = {
  name: '',
  logoUrl: undefined,
  website: '',
  industry: 'Technology',
  size: '11-50',
  hqLocation: '',
  description: '',
  workplaceType: 'Remote-first',
  primaryRoles: [],
  interviewTimezone: 'Asia/Kolkata',
  interviewHours: '09:00 - 18:00',
  autoOffer: false,
  invites: [],
  isPreConfigured: false,
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
  const { user } = useAuth();
  const [form, setForm] = useState<CompanyForm>(() => ({
    ...DEFAULT_FORM,
    name: user?.orgName || '',
    isPreConfigured: Boolean(user?.orgName),
  }));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchOrg = async () => {
      try {
        const res = await apiClient.get<{ organization?: { name?: string; logo_url?: string; industry?: string; size?: string; settings?: Record<string, unknown> } }>('/organizations/me');
        if (mounted && res?.organization) {
          const o = res.organization;
          const s = (o.settings || {}) as Record<string, unknown>;
          setForm((f) => ({
            ...f,
            name: o.name || f.name || user?.orgName || '',
            logoUrl: o.logo_url || f.logoUrl,
            industry: o.industry || f.industry,
            size: o.size || f.size,
            website: (s.website as string) || f.website,
            hqLocation: (s.hqLocation as string) || f.hqLocation,
            description: (s.description as string) || f.description,
            workplaceType: (s.workplaceType as WorkplaceType) || f.workplaceType,
            primaryRoles: Array.isArray(s.primaryRoles) && s.primaryRoles.length > 0 ? (s.primaryRoles as string[]) : f.primaryRoles,
            interviewTimezone: (s.interviewTimezone as string) || f.interviewTimezone,
            interviewHours: (s.interviewHours as string) || f.interviewHours,
            autoOffer: typeof s.autoOffer === 'boolean' ? s.autoOffer : f.autoOffer,
            isPreConfigured: true,
          }));
        } else if (mounted && user?.orgName && !form.name) {
          setForm((f) => ({ ...f, name: user.orgName || '', isPreConfigured: true }));
        }
      } catch {
        if (mounted && user?.orgName && !form.name) {
          setForm((f) => ({ ...f, name: user.orgName || '', isPreConfigured: true }));
        }
      }
    };
    fetchOrg();
    return () => {
      mounted = false;
    };
  }, [user]);

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
      description: form.description.trim() || undefined,
      workplaceType: form.workplaceType,
      primaryRoles: form.primaryRoles,
      interviewTimezone: form.interviewTimezone,
      interviewHours: form.interviewHours,
      autoOffer: form.autoOffer,
    },
  };
}
