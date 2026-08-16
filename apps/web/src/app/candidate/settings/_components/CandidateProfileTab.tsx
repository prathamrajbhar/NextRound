'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Globe,
  UploadCloud,
  CheckCircle2,
  Save,
} from '@/lib/lucide-google-icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useCandidateProfile } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

interface CandidateProfileTabProps {
  onSave: () => void;
}

export function CandidateProfileTab({ onSave }: CandidateProfileTabProps) {
  const { user, refreshUser } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: profileRes, status: profileStatus } = useCandidateProfile();
  const [fullName, setFullName] = useState(() => (user?.email ? user.email.split('@')[0] : ''));
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState(() => user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('/avatar-boy.jpg');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setFullName((prev) => prev || (user.email ? user.email.split('@')[0] : ''));
    }
  }, [user]);

  useEffect(() => {
    if (profileStatus === 'pending') return;

    const p = (profileRes?.profile ?? null) as Record<string, unknown> | null;
    if (!p) return;
    if (typeof p.full_name === 'string' && p.full_name.trim()) setFullName(p.full_name);
    if (typeof p.phone === 'string') setPhone(p.phone);
    if (typeof p.location === 'string') setLocation(p.location);
    if (typeof p.headline === 'string') setHeadline(p.headline);
    if (typeof p.portfolio_url === 'string') setPortfolioUrl(p.portfolio_url);
    if (typeof p.github_url === 'string') setGithubUrl(p.github_url);
    if (typeof p.linkedin_url === 'string') setLinkedinUrl(p.linkedin_url);
    if (typeof p.bio === 'string') setBio(p.bio);
    if (typeof p.avatar_url === 'string') {
      if (p.avatar_url.startsWith('data:')) {
        setCustomAvatar(p.avatar_url);
      } else {
        setAvatar(p.avatar_url);
        setCustomAvatar(null);
      }
    }
  }, [profileStatus, profileRes]);

  const initials = fullName
    ? fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CN';

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      if (email.trim() && email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
        await apiClient.patch<{ user: { email: string } }>('/auth/email', { email: email.trim() });
        await refreshUser();
      }

      await apiClient.post('/candidate/profile', {
        fullName,
        phone: phone || null,
        location: location || null,
        headline: headline || null,
        portfolioUrl: portfolioUrl || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        bio: bio || null,
        avatarUrl: customAvatar ?? avatar,
      });

      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center gap-6">
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
          {customAvatar ? (
            <Image src={customAvatar} alt="Custom Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
          ) : avatar ? (
            <Image src={avatar} alt="Profile Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="text-center sm:text-left space-y-2 flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{fullName || 'Candidate Profile'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Profile
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{headline || email || 'Configure profile details below'}</p>
            </div>
            
            <div className="flex flex-col items-center sm:items-start gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Avatar Selection</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setCustomAvatar(null); setAvatar('/avatar-boy.jpg'); }}
                  className={`h-8 w-8 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    !customAvatar && avatar === '/avatar-boy.jpg' ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src="/avatar-boy.jpg" alt="Avatar Boy" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                </button>
                <button
                  type="button"
                  onClick={() => { setCustomAvatar(null); setAvatar('/avatar-girl.jpg'); }}
                  className={`h-8 w-8 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    !customAvatar && avatar === '/avatar-girl.jpg' ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src="/avatar-girl.jpg" alt="Avatar Girl" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                </button>

                <label className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-extrabold px-2.5 py-1.5 cursor-pointer transition-all shadow-sm flex items-center gap-1">
                  <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                  <span>Upload</span>
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
          <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
            {location && (
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                📍 {location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Personal &amp; Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Professional Headline</label>
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer | Full Stack"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Primary Email
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" /> Location &amp; Timezone
          </label>
          <input
            type="text"
            placeholder="City, Country (e.g. San Francisco, CA)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          Links &amp; Professional Bio
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Portfolio Website</label>
            <input
              type="text"
              placeholder="https://yourportfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GitHub Profile</label>
            <input
              type="text"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">LinkedIn Profile</label>
            <input
              type="text"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About Me / Summary</label>
            <span className="text-[10px] font-semibold text-slate-400">{bio.length} / 500 chars</span>
          </div>
          <textarea
            rows={3}
            placeholder="Brief description of your background and technical focus..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end items-center gap-3">
          {saveError && (
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{saveError}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving to DB...' : 'Save Profile Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
