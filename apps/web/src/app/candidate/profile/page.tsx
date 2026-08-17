'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Globe,
  Code,
  Sparkles,
  CheckCircle2,
  Check,
  Plus,
  X,
  FileText,
  UploadCloud,
  Save,
  Zap,
  AlertCircle,
  Trash2,
  Download,
  Loader2,
} from '@/lib/lucide-google-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useCandidateProfile, useResumeHistory } from '@/hooks/queries';

const PRESET_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Python',
  'PostgreSQL',
  'Tailwind CSS',
  'Docker',
  'AWS',
  'GraphQL',
  'REST API',
];

const PRESET_ROLES = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'DevOps Specialist',
  'AI / ML Engineer',
];

const DEFAULT_AVATAR = '/avatar-boy.jpg';

function parseExpectedSalary(value: string): number | null {
  const parsed = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatExpectedSalary(value: number | null | undefined): string {
  if (value == null || value <= 0) return '';
  return `₹${value.toLocaleString()} / yr`;
}

function convertNumberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const doubleDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const getWord = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += tensMultiple[Math.floor(n / 10)] + ' ' + singleDigits[n % 10];
    } else if (n > 9) {
      str += doubleDigits[n - 10];
    } else if (n > 0) {
      str += singleDigits[n];
    }
    return str.trim();
  };

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) {
    result += getWord(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += getWord(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += getWord(thousand) + ' Thousand ';
  }
  if (num > 0) {
    result += getWord(num);
  }

  return result.trim() ? result.trim() + ' Rupees' : '';
}

interface ParsedProfilePayload {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  targetRoles?: string[];
  yearsOfExperience?: number;
  expectedSalary?: number;
  bio?: string;
  proudProject?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export default function CandidateProfile() {
  const { user, refreshUser } = useAuthContext();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => (user?.email ? user.email.split('@')[0] : ''));
  const [email, setEmail] = useState(() => user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [bio, setBio] = useState('');
  const [resumeName, setResumeName] = useState('No resume uploaded');
  const [resumeDate, setResumeDate] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [detailsSaved, setDetailsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: profileRes, status: profileStatus, error: profileError } = useCandidateProfile();
  const { data: resumeRes } = useResumeHistory();
  const generatedResumes = resumeRes?.history ?? [];

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (profileStatus === 'pending') return;

    const p = (profileRes?.profile ?? null) as Record<string, unknown> | null;
    if (p) {
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
      if (Array.isArray(p.target_roles) && p.target_roles.length > 0) setTargetRoles(p.target_roles.map(String));
      if (p.years_of_experience !== undefined && p.years_of_experience !== null) setExperienceYears(String(p.years_of_experience));
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
    }
  }, [profileStatus, profileRes]);

  const getReadinessScore = () => {
    let score = 20;
    if (name.trim()) score += 10;
    if (email.trim()) score += 10;
    if (phone.trim()) score += 10;
    if (location.trim()) score += 10;
    if (headline.trim()) score += 10;
    if (linkedinUrl.trim() || githubUrl.trim() || portfolioUrl.trim()) score += 10;
    if (skills.length >= 3) score += 10;
    if (resumeName !== 'No resume uploaded') score += 10;
    return Math.min(100, score);
  };

  const readiness = getReadinessScore();

  const buildPayload = () => ({
    fullName: name,
    phone: phone || null,
    location: location || null,
    headline: headline || null,
    linkedinUrl: linkedinUrl || null,
    githubUrl: githubUrl || null,
    portfolioUrl: portfolioUrl || null,
    bio: bio || null,
    skills,
    targetRoles,
    yearsOfExperience: experienceYears.trim() !== '' && !isNaN(Number(experienceYears)) ? Number(experienceYears) : null,
    expectedSalary: parseExpectedSalary(expectedSalary),
    avatarUrl: customAvatar ?? avatar,
  });

  const handleSaveDetails = async () => {
    setSaving(true);
    setSaveError('');

    try {
      if (email.trim() && email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
        await apiClient.patch<{ user: { email: string } }>('/auth/email', { email: email.trim() });
        await refreshUser();
      }

      const data = buildPayload();
      const fd = new FormData();
      fd.append('data', JSON.stringify(data));
      if (resumeFile) fd.append('resume', resumeFile);

      const res = await apiClient.post<{ profile?: Record<string, unknown> }>(
        '/candidate/profile',
        resumeFile ? fd : data
      );

      const savedResumeUrl = (res?.profile?.resume_url as string | undefined) ?? null;
      if (savedResumeUrl) {
        setResumeUrl(savedResumeUrl);
        setResumeName(savedResumeUrl.split('/').pop() || 'candidate_resume.pdf');
        setResumeDate('Uploaded just now');
      }

      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });

      setResumeFile(null);
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = (tagToAdd?: string) => {
    const target = tagToAdd || newSkill;
    if (target.trim() && !skills.includes(target.trim())) {
      setSkills([...skills, target.trim()]);
      if (!tagToAdd) setNewSkill('');
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter((s) => s !== tag));
  };

  const handleToggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter((r) => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  const mergeParsedProfile = (profile: ParsedProfilePayload) => {
    if (profile.fullName) setName(profile.fullName);
    if (profile.headline) setHeadline(profile.headline);
    if (profile.phone) setPhone(profile.phone);
    if (profile.location) setLocation(profile.location);
    if (profile.bio) setBio(profile.bio);
    if (profile.skills && profile.skills.length > 0) {
      const combined = Array.from(new Set([...skills, ...profile.skills]));
      setSkills(combined);
    }
    if (profile.targetRoles && profile.targetRoles.length > 0) {
      const combined = Array.from(new Set([...targetRoles, ...profile.targetRoles]));
      setTargetRoles(combined);
    }
    if (profile.yearsOfExperience !== undefined) setExperienceYears(String(profile.yearsOfExperience));
    if (profile.expectedSalary !== undefined) setExpectedSalary(formatExpectedSalary(profile.expectedSalary));
    if (profile.linkedinUrl) setLinkedinUrl(profile.linkedinUrl);
    if (profile.githubUrl) setGithubUrl(profile.githubUrl);
    if (profile.portfolioUrl) setPortfolioUrl(profile.portfolioUrl);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const parsed = await apiClient.post<{
        profile?: ParsedProfilePayload;
        rawText?: string;
      }>('/candidate/parse-resume', formData);

      const fd = new FormData();
      fd.append('resume', file);
      const currentData = buildPayload();
      fd.append('data', JSON.stringify(currentData));

      const uploadRes = await apiClient.post<{ profile?: { resume_url?: string } }>(
        '/candidate/profile',
        fd
      );

      const savedUrl = uploadRes?.profile?.resume_url;
      if (savedUrl) {
        setResumeUrl(savedUrl);
        setResumeName(savedUrl.split('/').pop() || file.name);
        setResumeDate('Uploaded just now');
      }

      if (parsed?.profile) {
        mergeParsedProfile(parsed.profile);
      }

      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to upload and parse resume.');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to delete your active resume?')) return;
    setUploadingResume(true);
    setSaveError('');
    try {
      const currentData = buildPayload() as Record<string, unknown>;
      currentData.resumeUrl = null;
      currentData.rawResumeText = null;
      currentData.parsedResume = {};

      await apiClient.post('/candidate/profile', currentData);

      setResumeUrl('');
      setResumeName('No resume uploaded');
      setResumeDate('');
      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CN';

  if (profileStatus === 'pending') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-pulse pb-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/40 dark:border-slate-800/60 pb-4">
          <div className="space-y-2">
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
            <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800/65 rounded-lg" />
            <div className="h-3.5 w-72 bg-slate-200/50 dark:bg-slate-800/50 rounded-md" />
          </div>
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800/65 rounded-2xl" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white/45 dark:bg-slate-900/60 p-6 sm:p-7 shadow-sm space-y-6">
              <div className="h-4.5 w-36 bg-slate-200 dark:bg-slate-800/65 rounded-md mb-4" />
              
              {/* Avatar circle + info */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800/65 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
                  <div className="h-8 w-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
                    <div className="h-10 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Completeness Card */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white/45 dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
              <div className="flex justify-center py-4">
                <div className="h-28 w-28 rounded-full border-8 border-slate-200 dark:border-slate-800/65 flex items-center justify-center">
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
                </div>
              </div>
            </div>

            {/* Resume Card */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white/45 dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/65 rounded-md" />
              <div className="h-12 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
              <div className="h-10 w-full bg-slate-200/40 dark:bg-slate-800/40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
            Identity Center • Candidate Profile
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            My Candidate Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Manage your unified candidate profile, skill matrix, social credentials, and resume documents.
          </p>
        </div>

        {detailsSaved ? (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 animate-in zoom-in-95 duration-200 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Profile Saved!</span>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">Completeness</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{readiness}% Complete</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              {readiness}%
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {profileStatus === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Could not load your profile from the server
            {(profileError as Error | null)?.message ? ` — ${(profileError as Error).message}` : ''}. You can still update it below and save.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 sm:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
              Candidate Details &amp; Contact Info
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-5">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
                {customAvatar ? (
                  <Image src={customAvatar} alt="Custom Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                ) : avatar ? (
                  <Image src={avatar} alt="Profile Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Profile Avatar Choice</label>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => { setCustomAvatar(null); setAvatar('/avatar-boy.jpg'); }}
                    className={`h-10 w-10 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      !customAvatar && avatar === '/avatar-boy.jpg' ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src="/avatar-boy.jpg" alt="Avatar Boy" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomAvatar(null); setAvatar('/avatar-girl.jpg'); }}
                    className={`h-10 w-10 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      !customAvatar && avatar === '/avatar-girl.jpg' ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src="/avatar-girl.jpg" alt="Avatar Girl" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  </button>

                  <label className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-2 cursor-pointer transition-all shadow-sm flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Upload Custom</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  Changing your email also updates your login identity.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location &amp; Timezone</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Professional Headline</label>
              <input
                type="text"
                placeholder="Senior Full-Stack Engineer | React, Node.js &amp; Cloud Specialist"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GitHub URL</label>
                <div className="relative">
                  <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portfolio Website</label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.dev"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  placeholder="e.g. 3"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Compensation / Yr</label>
                <input
                  type="text"
                  placeholder="e.g. ₹1,200,000"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
                />
                {parseExpectedSalary(expectedSalary) !== null && (
                  <p className="text-[10px] text-brand-650 dark:text-orange-405 font-extrabold tracking-wide mt-1 animate-in fade-in duration-200 uppercase">
                    In Words: {convertNumberToIndianWords(parseExpectedSalary(expectedSalary)!)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Job Roles</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ROLES.map((role) => {
                  const isSelected = targetRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Professional Bio / Summary</label>
                <span className="text-[10px] font-semibold text-slate-400">{bio.length} / 1000 chars</span>
              </div>
              <textarea
                rows={3}
                placeholder="Passionate engineer with expertise in React, TypeScript, and microservice architectures..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving Profile...' : 'Save Profile Details'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                Skills &amp; AI Vetting Keywords
              </h3>
              <span className="text-[10px] font-extrabold text-slate-400">{skills.length} Skills Added</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 text-brand-700 dark:text-orange-300 shadow-sm"
                >
                  {s}
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-500 cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddSkill(); }} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add skill keyword (e.g. Docker, GraphQL, Python)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="pt-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">Quick Add Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SKILLS.filter((ps) => !skills.includes(ps)).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddSkill(preset)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-orange-950/40 hover:text-brand-600 dark:hover:text-orange-400 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800 flex items-center gap-1"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-4">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Profile Completeness</span>

            <div className="relative h-28 w-28 mx-auto my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-brand-500 dark:text-orange-500 transition-all duration-500"
                  strokeDasharray={`${readiness}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xl font-black text-slate-900 dark:text-slate-100">{readiness}%</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 inline-block">
                {readiness >= 90 ? 'Profile Calibrated' : readiness >= 60 ? 'Profile In Progress' : 'Initial Setup'}
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
                Complete your contact details and resume to reach 100% recruiter match readiness.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span>Active Resume PDF</span>
              <span className="text-[10px] text-emerald-500 font-bold">PDF Format</span>
            </h3>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-50/50 dark:bg-orange-950/40 border border-brand-100 dark:border-orange-900/60 text-brand-700 dark:text-orange-300 shadow-sm">
              <FileText className="h-6 w-6 flex-shrink-0 text-brand-600 dark:text-orange-400" />
              <div className="min-w-0 flex-grow">
                <span className="text-xs font-extrabold truncate block">{resumeName}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold block mt-0.5">{resumeDate || 'PDF Resume Attached'}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {resumeUrl && (
                  <>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-orange-400 cursor-pointer transition-colors"
                      title="Download Resume"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={handleDeleteResume}
                      disabled={uploadingResume}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer transition-colors disabled:opacity-50"
                      title="Delete Resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <label className="w-full text-center text-xs font-extrabold text-brand-600 dark:text-orange-400 hover:text-brand-700 dark:hover:text-orange-300 transition-colors py-3 cursor-pointer block border border-dashed border-brand-200 dark:border-orange-900/60 bg-brand-50/10 dark:bg-orange-950/20 rounded-2xl shadow-inner hover:bg-brand-50/20 dark:hover:bg-orange-950/40">
              {uploadingResume ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Loader2 className="h-5 w-5 text-brand-500 dark:text-orange-400 animate-spin" />
                  <span>Uploading &amp; Syncing details...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 mx-auto mb-1 text-brand-500 dark:text-orange-400" />
                  <span>Upload &amp; Sync Resume PDF</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
                Generated ATS Resumes Vault
              </h3>
              <span className="text-[10px] font-extrabold text-slate-400">{generatedResumes.length} Saved</span>
            </div>

            {generatedResumes.length === 0 ? (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <FileText className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold">No AI Voice Resumes Yet</p>
                <p className="text-[10px] text-slate-500">Generate resumes using AI Voice Studio.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {generatedResumes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block truncate">{item.targetRole}</span>
                      <span className="text-[10px] text-slate-400 block">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    <a
                      href={item.resumePdfUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-900 text-[10px] font-extrabold hover:bg-brand-100 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <Zap className="h-3 w-3" />
                      <span>View PDF</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}