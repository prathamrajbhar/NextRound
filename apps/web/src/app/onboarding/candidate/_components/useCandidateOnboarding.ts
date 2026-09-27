'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
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
  const { user } = useAuth();
  const [form, setForm] = useState<CandidateForm>(() => ({
    ...DEFAULT_FORM,
    fullName: user?.name || '',
  }));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchExisting = async () => {
      try {
        const res = await apiClient.get<{ profile?: Record<string, unknown> }>('/candidate/profile');
        if (mounted && res?.profile) {
          const p = res.profile;
          setForm((f) => ({
            ...f,
            fullName: (p.fullName as string) || (p.full_name as string) || user?.name || f.fullName,
            headline: (p.headline as string) || f.headline,
            phone: (p.phone as string) || f.phone,
            location: (p.location as string) || f.location,
            timezone: (p.timezone as string) || f.timezone,
            currentCompany: (p.currentCompany as string) || f.currentCompany,
            currentTitle: (p.currentTitle as string) || f.currentTitle,
            education: Array.isArray(p.education) ? p.education : f.education,
            yearsOfExperience: p.yearsOfExperience !== undefined && p.yearsOfExperience !== null ? String(p.yearsOfExperience) : f.yearsOfExperience,
            skills: Array.isArray(p.skills) && p.skills.length > 0 ? (p.skills as string[]) : f.skills,
            targetRoles: Array.isArray(p.targetRoles) && p.targetRoles.length > 0 ? (p.targetRoles as string[]) : f.targetRoles,
            workMode: (p.workMode as WorkMode) || f.workMode,
            currentCtc: p.currentCtc !== undefined && p.currentCtc !== null ? String(p.currentCtc) : f.currentCtc,
            expectedSalary: p.expectedSalary !== undefined && p.expectedSalary !== null ? String(p.expectedSalary) : f.expectedSalary,
            noticePeriod: (p.noticePeriod as string) || f.noticePeriod,
            workAuthorization: (p.workAuthorization as string) || f.workAuthorization,
            bio: (p.bio as string) || f.bio,
            proudProject: (p.proudProject as string) || f.proudProject,
          }));
        } else if (mounted && user?.name && !form.fullName) {
          setForm((f) => ({ ...f, fullName: user.name || f.fullName }));
        }
      } catch {
        if (mounted && user?.name && !form.fullName) {
          setForm((f) => ({ ...f, fullName: user.name || f.fullName }));
        }
      }
    };
    fetchExisting();
    return () => {
      mounted = false;
    };
  }, [user]);

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
    setForm((f) => {
      const hasValidExpectedSalary = parsed.expectedSalary !== undefined && Number(parsed.expectedSalary) > 0;
      const parsedSalaryNum = hasValidExpectedSalary ? Number(parsed.expectedSalary) : undefined;
      const expectedSalaryMin = parsedSalaryNum ? String(Math.max(1, Math.round(parsedSalaryNum * 0.8))) : f.expectedSalaryMin;
      const expectedSalaryMax = parsedSalaryNum ? String(Math.round(parsedSalaryNum * 1.3)) : f.expectedSalaryMax;

      return {
        ...f,
        rawResumeText: rawText || f.rawResumeText,
        parsedResume: (parsed as Record<string, unknown>) || f.parsedResume,
        fullName: parsed.fullName || f.fullName,
        headline: parsed.headline || f.headline,
        currentCompany: parsed.currentCompany || f.currentCompany,
        currentTitle: parsed.currentTitle || f.currentTitle,
        education: Array.isArray(parsed.education) && parsed.education.length > 0 ? parsed.education : f.education,
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
        expectedSalary: hasValidExpectedSalary ? String(parsed.expectedSalary) : f.expectedSalary,
        expectedSalaryMin,
        expectedSalaryMax,
        currentCtc: parsed.currentCtc !== undefined && Number(parsed.currentCtc) > 0 ? String(parsed.currentCtc) : f.currentCtc,
        noticePeriod: parsed.noticePeriod || f.noticePeriod,
        workAuthorization: parsed.workAuthorization || f.workAuthorization,
        bio: parsed.bio || f.bio,
        proudProject: parsed.proudProject || f.proudProject,
      };
    });
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
