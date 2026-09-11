'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useCandidateProfile } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { CandidateProfileAvatarCard } from './CandidateProfileAvatarCard';
import { CandidateProfileContactCard } from './CandidateProfileContactCard';
import { CandidateProfileBioCard } from './CandidateProfileBioCard';

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
      <CandidateProfileAvatarCard
        fullName={fullName}
        headline={headline}
        email={email}
        location={location}
        avatar={avatar}
        customAvatar={customAvatar}
        initials={initials}
        onSelectDefaultAvatar={(path) => {
          setCustomAvatar(null);
          setAvatar(path);
        }}
        onCustomAvatarUpload={handleCustomAvatarUpload}
      />

      <CandidateProfileContactCard
        fullName={fullName}
        setFullName={setFullName}
        headline={headline}
        setHeadline={setHeadline}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        location={location}
        setLocation={setLocation}
      />

      <CandidateProfileBioCard
        portfolioUrl={portfolioUrl}
        setPortfolioUrl={setPortfolioUrl}
        githubUrl={githubUrl}
        setGithubUrl={setGithubUrl}
        linkedinUrl={linkedinUrl}
        setLinkedinUrl={setLinkedinUrl}
        bio={bio}
        setBio={setBio}
        saving={saving}
        saveError={saveError}
        onSave={handleSave}
      />
    </div>
  );
}
