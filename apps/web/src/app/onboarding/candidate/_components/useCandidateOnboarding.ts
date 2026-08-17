'use client';

import { useState } from 'react';

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export interface CandidateForm {

  fullName: string;
  headline: string;
  phone: string;
  location: string;
  timezone: string;

  resumeFile: File | null;
  rawResumeText?: string;
  parsedResume?: Record<string, unknown>;
  socialData?: Record<string, unknown>;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  dataConsent: boolean;

  yearsOfExperience: string;
  targetRoles: string[];
  skills: string[];

  workMode: WorkMode;
  targetLocations: string[];
  availability: {
    weekday: boolean;
    weekend: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };

  expectedSalary: string;
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  currentCtc: string;
  noticePeriod: string;
  workAuthorization: string;

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
  rawResumeText: undefined,
  parsedResume: undefined,
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  dataConsent: false,
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
  expectedSalary: '25',
  expectedSalaryMin: '18',
  expectedSalaryMax: '30',
  currentCtc: '15',
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

export interface ParsedProfilePayload {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  skills?: string[];
  targetRoles?: string[];
  targetLocations?: string[];
  workMode?: WorkMode;
  currentCtc?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  workAuthorization?: string;
  bio?: string;
  proudProject?: string;
  rawText?: string;
  rawTextLength?: number;
  [key: string]: unknown;
}

export interface OnboardingStepProps {
  form: CandidateForm;
  update: <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) => void;
  addTag: (key: TagField, value: string) => void;
  removeTag: (key: TagField, value: string) => void;
  mergeParsedProfile?: (parsed: ParsedProfilePayload, rawText?: string) => void;
  mergeSocialData?: (social: Record<string, unknown>, extractedSkills?: string[]) => void;
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

  const mergeParsedProfile = (parsed: ParsedProfilePayload, rawText?: string) => {
    setForm((f) => ({
      ...f,
      rawResumeText: rawText || f.rawResumeText,
      parsedResume: (parsed as Record<string, unknown>) || f.parsedResume,
      fullName: parsed.fullName || f.fullName,
      headline: parsed.headline || f.headline,
      phone: parsed.phone || f.phone,
      location: parsed.location || f.location,
      timezone: parsed.timezone || f.timezone,
      linkedinUrl: parsed.linkedinUrl || f.linkedinUrl,
      githubUrl: parsed.githubUrl || f.githubUrl,
      portfolioUrl: parsed.portfolioUrl || f.portfolioUrl,
      yearsOfExperience: parsed.yearsOfExperience !== undefined ? String(parsed.yearsOfExperience) : f.yearsOfExperience,
      skills: parsed.skills && parsed.skills.length > 0 ? Array.from(new Set([...f.skills, ...parsed.skills])) : f.skills,
      targetRoles: parsed.targetRoles && parsed.targetRoles.length > 0 ? Array.from(new Set([...f.targetRoles, ...parsed.targetRoles])) : f.targetRoles,
      targetLocations: parsed.targetLocations && parsed.targetLocations.length > 0 ? Array.from(new Set([...f.targetLocations, ...parsed.targetLocations])) : f.targetLocations,
      workMode: parsed.workMode || f.workMode,
      expectedSalary: parsed.expectedSalary !== undefined ? String(parsed.expectedSalary) : f.expectedSalary,
      currentCtc: parsed.currentCtc !== undefined ? String(parsed.currentCtc) : f.currentCtc,
      noticePeriod: parsed.noticePeriod || f.noticePeriod,
      workAuthorization: parsed.workAuthorization || f.workAuthorization,
      bio: parsed.bio || f.bio,
      proudProject: parsed.proudProject || f.proudProject,
    }));
  };

  const mergeSocialData = (social: Record<string, unknown>, extractedSkills?: string[]) => {
    setForm((f) => ({
      ...f,
      socialData: social,
      skills: extractedSkills && extractedSkills.length > 0 ? Array.from(new Set([...f.skills, ...extractedSkills])) : f.skills,
    }));
  };

  return { form, setForm, step, setStep, submitting, setSubmitting, error, setError, update, addTag, removeTag, mergeParsedProfile, mergeSocialData };
}

export function buildCandidatePayload(form: CandidateForm) {
  const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v.trim()));
  return {
    fullName: form.fullName.trim() || undefined,
    headline: form.headline.trim() || undefined,
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    timezone: form.timezone || undefined,
    rawResumeText: form.rawResumeText || undefined,
    parsedResume: form.parsedResume || undefined,
    socialData: form.socialData || undefined,
    linkedinUrl: form.linkedinUrl.trim() || undefined,
    githubUrl: form.githubUrl.trim() || undefined,
    portfolioUrl: form.portfolioUrl.trim() || undefined,
    dataConsent: form.dataConsent,
    consentAt: form.dataConsent ? new Date().toISOString() : undefined,
    bio: form.bio.trim() || undefined,
    skills: form.skills,
    targetRoles: form.targetRoles,
    yearsOfExperience: toNumber(form.yearsOfExperience),
    workMode: form.workMode,
    currentCtc: toNumber(form.currentCtc),
    noticePeriod: form.noticePeriod || undefined,
    workAuthorization: form.workAuthorization || undefined,
    proudProject: form.proudProject.trim() || undefined,
    workValues: form.workValues,
    availability: form.availability,
  };
}
