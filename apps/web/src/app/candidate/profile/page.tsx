'use client';

import React from 'react';
import { useCandidateProfileForm } from './_hooks/useCandidateProfileForm';
import { ProfileSkeleton } from './_components/ProfileSkeleton';
import { ProfileHeader } from './_components/ProfileHeader';
import { ProfilePersonalDetailsCard } from './_components/ProfilePersonalDetailsCard';
import { ProfileSocialLinksCard } from './_components/ProfileSocialLinksCard';
import { ProfileRolesCard } from './_components/ProfileRolesCard';
import { ProfileExperienceCard } from './_components/ProfileExperienceCard';
import { ProfileSkillsCard } from './_components/ProfileSkillsCard';
import { ProfileReadinessCard } from './_components/ProfileReadinessCard';
import { ProfileResumeVaultCard } from './_components/ProfileResumeVaultCard';

export default function CandidateProfile() {
  const form = useCandidateProfileForm();

  if (form.profileStatus === 'pending') {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300 pb-12">
      <ProfileHeader
        saving={form.saving}
        detailsSaved={form.detailsSaved}
        saveError={form.saveError}
        loadError={(form.profileError as Error | null)?.message}
        onSave={form.handleSaveDetails}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 sm:p-7 shadow-md backdrop-blur-md glass-panel space-y-6">
            <ProfilePersonalDetailsCard
              name={form.name}
              setName={form.setName}
              email={form.email}
              setEmail={form.setEmail}
              phone={form.phone}
              setPhone={form.setPhone}
              location={form.location}
              setLocation={form.setLocation}
              headline={form.headline}
              setHeadline={form.setHeadline}
              avatar={form.avatar}
              setAvatar={form.setAvatar}
              customAvatar={form.customAvatar}
              setCustomAvatar={form.setCustomAvatar}
              initials={form.initials}
              onCustomAvatarUpload={form.handleCustomAvatarUpload}
            />

            <ProfileSocialLinksCard
              linkedinUrl={form.linkedinUrl}
              setLinkedinUrl={form.setLinkedinUrl}
              githubUrl={form.githubUrl}
              setGithubUrl={form.setGithubUrl}
              portfolioUrl={form.portfolioUrl}
              setPortfolioUrl={form.setPortfolioUrl}
            />

            <ProfileRolesCard
              targetRoles={form.targetRoles}
              onToggleRole={form.handleToggleRole}
            />

            <ProfileExperienceCard
              experienceYears={form.experienceYears}
              setExperienceYears={form.setExperienceYears}
              expectedSalary={form.expectedSalary}
              setExpectedSalary={form.setExpectedSalary}
              bio={form.bio}
              setBio={form.setBio}
              saving={form.saving}
              onSave={form.handleSaveDetails}
            />
          </div>

          <ProfileSkillsCard
            skills={form.skills}
            onAddSkill={form.handleAddSkill}
            onRemoveSkill={form.handleRemoveSkill}
          />
        </div>

        <div className="space-y-6">
          <ProfileReadinessCard readiness={form.readiness} />

          <ProfileResumeVaultCard
            resumeName={form.resumeName}
            resumeDate={form.resumeDate}
            resumeUrl={form.resumeUrl}
            uploadingResume={form.uploadingResume}
            generatedResumes={form.generatedResumes}
            onUploadResume={form.handleResumeUpload}
            onDeleteResume={form.handleDeleteResume}
          />
        </div>
      </div>
    </div>
  );
}
