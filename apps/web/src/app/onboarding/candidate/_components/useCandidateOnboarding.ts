'use client';

import { useState } from 'react';
import {
  CandidateForm,
  DEFAULT_FORM,
  TagField,
  ParsedProfilePayload,
  WorkMode,
  OnboardingStepProps,
  buildCandidatePayload,
} from './candidateOnboarding.types';

export type { WorkMode, CandidateForm, TagField, ParsedProfilePayload, OnboardingStepProps };
export { DEFAULT_FORM, buildCandidatePayload };

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
