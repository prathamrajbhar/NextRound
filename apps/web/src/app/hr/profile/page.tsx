'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useHrProfile } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { RecruiterDetailsCard } from './_components/RecruiterDetailsCard';
import { HiringSpecialtiesCard } from './_components/HiringSpecialtiesCard';
import { ProfileDangerZoneCard } from './_components/ProfileDangerZoneCard';
import { WorkspaceIntegrityCard } from './_components/WorkspaceIntegrityCard';
import { ActiveLicenseCard } from './_components/ActiveLicenseCard';

export default function HrProfile() {
  const { user } = useAuthContext();
  const [name, setName] = useState(() => (user?.email ? user.email.split('@')[0] : ''));
  const [email, setEmail] = useState(() => user?.email || '');
  const [role, setRole] = useState('Recruiter');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatar, setAvatar] = useState('/avatar-boy.jpg');
  const [licenseName, setLicenseName] = useState('Verification Pending');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');

  const [detailsSaved, setDetailsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const { data: profile } = useHrProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setName(user.email.split('@')[0]);
    }

    if (profile) {
      const profileObj = profile.profile || profile;
      if (typeof profileObj.name === 'string') setName(profileObj.name);
      if (typeof profileObj.full_name === 'string') setName(profileObj.full_name);
      if (typeof profileObj.email === 'string') setEmail(profileObj.email);
      if (typeof profileObj.role === 'string') setRole(profileObj.role);
      if (typeof profileObj.title === 'string') setRole(profileObj.title);
      if (typeof profileObj.company === 'string') setCompany(profileObj.company);
      if (typeof profileObj.org_name === 'string') setCompany(profileObj.org_name);
      if (typeof profileObj.linkedin_url === 'string') setLinkedinUrl(profileObj.linkedin_url);
      if (typeof profileObj.avatar === 'string') setAvatar(profileObj.avatar);
      if (Array.isArray(profileObj.specialties)) setSpecialties(profileObj.specialties);
    }
  }, [user, profile]);

  const handleSave = async () => {
    try {
      await apiClient.patch('/hr/profile', {
        name,
        company,
        title: role,
        linkedinUrl: linkedinUrl || null,
        avatarUrl: avatar,
        specialties,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', 'hr'] });
    } catch {
      // Failed to save HR profile
    }

    setDetailsSaved(true);
    setTimeout(() => setDetailsSaved(false), 2000);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (tag: string) => {
    setSpecialties(specialties.filter((s) => s !== tag));
  };

  const handleDeleteData = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setDeleted(true);
    }, 1500);
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseName(file.name);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-1">
          Identity Center
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Manage your Recruiter Workspace profile settings, hiring specializations, and company credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <RecruiterDetailsCard
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            role={role}
            setRole={setRole}
            company={company}
            setCompany={setCompany}
            linkedinUrl={linkedinUrl}
            setLinkedinUrl={setLinkedinUrl}
            avatar={avatar}
            setAvatar={setAvatar}
            detailsSaved={detailsSaved}
            onSave={handleSave}
            onCustomAvatarUpload={handleCustomAvatarUpload}
          />

          <HiringSpecialtiesCard
            specialties={specialties}
            newSpecialty={newSpecialty}
            setNewSpecialty={setNewSpecialty}
            onAddSpecialty={handleAddSpecialty}
            onRemoveSpecialty={handleRemoveSpecialty}
          />

          <ProfileDangerZoneCard
            deleted={deleted}
            isDeleting={isDeleting}
            onDeleteData={handleDeleteData}
          />
        </div>

        <div className="space-y-6">
          <WorkspaceIntegrityCard />
          <ActiveLicenseCard
            licenseName={licenseName}
            onLicenseUpload={handleLicenseUpload}
          />
        </div>
      </div>
    </div>
  );
}
