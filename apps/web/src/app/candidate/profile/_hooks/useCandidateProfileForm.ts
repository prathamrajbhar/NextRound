'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useCandidateProfile, useResumeHistory } from '@/hooks/queries';
import {
  formatExpectedSalary,
  parseExpectedSalary,
  calculateReadinessScore,
  ParsedProfilePayload,
} from '../_utils/profileUtils';
import { useProfileFields } from './useProfileFields';
import { useProfileResumeActions } from './useProfileResumeActions';

export function useCandidateProfileForm() {
  const { user, refreshUser } = useAuthContext();
  const queryClient = useQueryClient();
  const fields = useProfileFields(user?.email);

  const [detailsSaved, setDetailsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: profileRes, status: profileStatus, error: profileError } = useCandidateProfile();
  const { data: resumeRes } = useResumeHistory();
  const generatedResumes = resumeRes?.history ?? [];

  const buildPayload = (): Record<string, unknown> => ({
    fullName: fields.name,
    phone: fields.phone || null,
    location: fields.location || null,
    headline: fields.headline || null,
    linkedinUrl: fields.linkedinUrl || null,
    githubUrl: fields.githubUrl || null,
    portfolioUrl: fields.portfolioUrl || null,
    bio: fields.bio || null,
    skills: fields.skills,
    targetRoles: fields.targetRoles,
    yearsOfExperience:
      fields.experienceYears.trim() !== '' && !isNaN(Number(fields.experienceYears))
        ? Number(fields.experienceYears)
        : null,
    expectedSalary: parseExpectedSalary(fields.expectedSalary),
    avatarUrl: fields.customAvatar ?? fields.avatar,
  });

  const mergeParsedProfile = (parsed: ParsedProfilePayload) => {
    if (parsed.fullName && !fields.name) fields.setName(parsed.fullName);
    if (parsed.headline && !fields.headline) fields.setHeadline(parsed.headline);
    if (parsed.phone && !fields.phone) fields.setPhone(parsed.phone);
    if (parsed.location && !fields.location) fields.setLocation(parsed.location);
    if (parsed.linkedinUrl && !fields.linkedinUrl) fields.setLinkedinUrl(parsed.linkedinUrl);
    if (parsed.githubUrl && !fields.githubUrl) fields.setGithubUrl(parsed.githubUrl);
    if (parsed.portfolioUrl && !fields.portfolioUrl) fields.setPortfolioUrl(parsed.portfolioUrl);
    if (parsed.yearsOfExperience && !fields.experienceYears)
      fields.setExperienceYears(String(parsed.yearsOfExperience));
    if (parsed.bio && !fields.bio) fields.setBio(parsed.bio);
    if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      fields.setSkills((prev) => Array.from(new Set([...prev, ...parsed.skills!])));
    }
  };

  const resumeActions = useProfileResumeActions({
    onParsedProfile: mergeParsedProfile,
    onError: setSaveError,
    getPayload: buildPayload,
  });

  const {
    setName,
    setPhone,
    setLocation,
    setHeadline,
    setAvatar,
    setCustomAvatar,
    setLinkedinUrl,
    setGithubUrl,
    setPortfolioUrl,
    setSkills,
    setTargetRoles,
    setExperienceYears,
    setExpectedSalary,
    setBio,
    setEmail,
  } = fields;

  const { setResumeUrl, setResumeName, setResumeDate } = resumeActions;

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email, setEmail]);

  useEffect(() => {
    if (profileStatus === 'pending') return;
    const p = (profileRes?.profile ?? null) as Record<string, unknown> | null;
    if (!p) return;

    if (typeof p.full_name === 'string' && p.full_name.trim()) setName(p.full_name);
    if (typeof p.phone === 'string') setPhone(p.phone);
    if (typeof p.location === 'string') setLocation(p.location);
    if (typeof p.headline === 'string') setHeadline(p.headline);
    if (typeof p.avatar_url === 'string') {
      if (p.avatar_url.startsWith('data:')) {
        setCustomAvatar(p.avatar_url);
      } else {
        setAvatar(p.avatar_url);
        setCustomAvatar(null);
      }
    }
    if (typeof p.linkedin_url === 'string') setLinkedinUrl(p.linkedin_url);
    if (typeof p.github_url === 'string') setGithubUrl(p.github_url);
    if (typeof p.portfolio_url === 'string') setPortfolioUrl(p.portfolio_url);
    if (Array.isArray(p.skills) && p.skills.length > 0) setSkills(p.skills.map(String));
    if (Array.isArray(p.target_roles) && p.target_roles.length > 0)
      setTargetRoles(p.target_roles.map(String));
    if (p.years_of_experience !== undefined && p.years_of_experience !== null)
      setExperienceYears(String(p.years_of_experience));
    setExpectedSalary(formatExpectedSalary(p.expected_salary as number | null | undefined));
    if (typeof p.bio === 'string') setBio(p.bio);
    if (typeof p.resume_url === 'string' && p.resume_url) {
      setResumeUrl(p.resume_url);
      setResumeName(p.resume_url.split('/').pop() || 'candidate_resume.pdf');
      setResumeDate('Uploaded recently');
    } else {
      setResumeUrl('');
      setResumeName('No resume uploaded');
      setResumeDate('');
    }
  }, [
    profileStatus,
    profileRes,
    setName,
    setPhone,
    setLocation,
    setHeadline,
    setAvatar,
    setCustomAvatar,
    setLinkedinUrl,
    setGithubUrl,
    setPortfolioUrl,
    setSkills,
    setTargetRoles,
    setExperienceYears,
    setExpectedSalary,
    setBio,
    setResumeUrl,
    setResumeName,
    setResumeDate,
  ]);

  const readiness = calculateReadinessScore({
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    location: fields.location,
    headline: fields.headline,
    linkedinUrl: fields.linkedinUrl,
    githubUrl: fields.githubUrl,
    portfolioUrl: fields.portfolioUrl,
    skills: fields.skills,
    hasResume: resumeActions.resumeName !== 'No resume uploaded',
  });

  const handleSaveDetails = async () => {
    setSaving(true);
    setSaveError('');
    try {
      if (fields.email.trim() && fields.email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
        await apiClient.patch<{ user: { email: string } }>('/auth/email', { email: fields.email.trim() });
        await refreshUser();
      }

      const fd = new FormData();
      fd.append('data', JSON.stringify(buildPayload()));
      if (resumeActions.resumeFile) fd.append('resume', resumeActions.resumeFile);

      await apiClient.post('/candidate/profile', fd);
      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update candidate profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => fields.setCustomAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const initials = fields.name
    ? fields.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CN';

  return {
    ...fields,
    resumeName: resumeActions.resumeName,
    resumeDate: resumeActions.resumeDate,
    resumeUrl: resumeActions.resumeUrl,
    uploadingResume: resumeActions.uploadingResume,
    detailsSaved,
    saving,
    saveError,
    profileStatus,
    profileError,
    generatedResumes,
    readiness,
    initials,
    handleSaveDetails,
    handleResumeUpload: resumeActions.handleResumeUpload,
    handleDeleteResume: resumeActions.handleDeleteResume,
    handleCustomAvatarUpload,
    handleToggleRole: (role: string) =>
      fields.setTargetRoles((prev) =>
        prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
      ),
    handleAddSkill: (skillName?: string) => {
      const s = (skillName || '').trim();
      if (s && !fields.skills.includes(s)) fields.setSkills((prev) => [...prev, s]);
    },
    handleRemoveSkill: (skillName: string) =>
      fields.setSkills((prev) => prev.filter((s) => s !== skillName)),
  };
}
