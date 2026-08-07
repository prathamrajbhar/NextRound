'use client';

import { useState } from 'react';

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export interface CandidateForm {
  // Step 1 — Personal & Contact
  fullName: string;
  headline: string;
  phone: string;
  location: string;
  timezone: string;
  // Step 2 — Resume & Online Presence
  resumeFile: File | null;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  // Step 3 — Experience & Skills
  yearsOfExperience: string;
  targetRoles: string[];
  skills: string[];
  // Step 4 — Work Preferences
  workMode: WorkMode;
  targetLocations: string[];
  availability: {
    weekday: boolean;
    weekend: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  // Step 5 — Compensation & Eligibility
  expectedSalary: string;
  currentCtc: string;
  noticePeriod: string;
  workAuthorization: string;
  // Step 6 — Fit & Culture
  proudProject: string;
  bio: string;
  workValues: string[];
}

export const DEFAULT_FORM: CandidateForm = {
  fullName: '',
  headline: '',
  phone: '',
  location: '',
  timezone: 'Asia/Kolkata',
  resumeFile: null,
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  yearsOfExperience: '',
  targetRoles: [],
  skills: [],
  workMode: 'Remote',
  targetLocations: [],
  availability: {
    weekday: true,
    weekend: false,
    morning: true,
    afternoon: true,
    evening: false,
  },
  expectedSalary: '',
  currentCtc: '',
  noticePeriod: '30 days',
  workAuthorization: 'Authorized',
  proudProject: '',
  bio: '',
  workValues: [
    'Learning & Career Growth',
    'High Autonomy & Ownership',
    'Compensation & Benefits',
    'Work-Life Balance',
    'Team Collaboration',
  ],
};

export type TagField = 'targetRoles' | 'skills' | 'targetLocations';

export interface OnboardingStepProps {
  form: CandidateForm;
  update: <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) => void;
  addTag: (key: TagField, value: string) => void;
  removeTag: (key: TagField, value: string) => void;
}

export function useCandidateOnboarding() {
  const [form, setForm] = useState<CandidateForm>(DEFAULT_FORM);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addTag = (key: TagField, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !form[key].includes(trimmed)) {
      setForm((f) => ({ ...f, [key]: [...f[key], trimmed] }));
    }
  };

  const removeTag = (key: TagField, value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((v) => v !== value) }));

  return { form, setForm, step, setStep, submitting, setSubmitting, error, setError, update, addTag, removeTag };
}

export function buildCandidatePayload(form: CandidateForm) {
  const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v.trim()));
  return {
    fullName: form.fullName.trim() || undefined,
    headline: form.headline.trim() || undefined,
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    timezone: form.timezone || undefined,
    linkedinUrl: form.linkedinUrl.trim() || undefined,
    githubUrl: form.githubUrl.trim() || undefined,
    portfolioUrl: form.portfolioUrl.trim() || undefined,
    bio: form.bio.trim() || undefined,
    skills: form.skills,
    targetRoles: form.targetRoles,
    yearsOfExperience: toNumber(form.yearsOfExperience),
    workMode: form.workMode,
    currentCtc: toNumber(form.currentCtc),
    targetLocations: form.targetLocations,
    expectedSalary: toNumber(form.expectedSalary),
    noticePeriod: form.noticePeriod || undefined,
    workAuthorization: form.workAuthorization || undefined,
    proudProject: form.proudProject.trim() || undefined,
    workValues: form.workValues,
    availability: form.availability,
  };
}
