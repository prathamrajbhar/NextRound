'use client';

import React from 'react';
import { User, Mail, Phone, Compass, Lightbulb, Building, Briefcase, CheckCircle2 } from '@/lib/lucide-google-icons';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls, selectCls } from './CandidateOnboardingShell';
import { SingleCityInput } from './SingleCityInput';
import { PersonalResumeUploadBanner } from './PersonalResumeUploadBanner';

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
  'UTC',
];

export function PersonalContactStep({ form, update, mergeParsedProfile }: OnboardingStepProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <PersonalResumeUploadBanner
        resumeFile={form.resumeFile}
        onFileSelect={(file) => update('resumeFile', file)}
        mergeParsedProfile={mergeParsedProfile}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls.replace('mb-2', '')}>
              Full Name <span className="text-orange-400">*</span>
            </label>
            {user?.name && form.fullName === user.name && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Pre-filled
              </span>
            )}
          </div>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Alex Morgan"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Account Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              placeholder="Connected via signup"
              className={`${inputCls} pl-10 opacity-70 cursor-not-allowed bg-slate-900/50`}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls.replace('mb-2', '')}>Professional Headline</label>
            <span className="text-[10px] font-mono text-slate-400">
              {form.headline.length}/100
            </span>
          </div>
          <div className="relative">
            <Lightbulb className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              maxLength={100}
              value={form.headline}
              onChange={(e) => update('headline', e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer specializing in Distributed Systems"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Current Employer / Company</label>
          <div className="relative">
            <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.currentCompany}
              onChange={(e) => update('currentCompany', e.target.value)}
              placeholder="e.g. Acme Corp (or 'Freelance')"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Current Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.currentTitle}
              onChange={(e) => update('currentTitle', e.target.value)}
              placeholder="e.g. SDE II / Senior Frontend Engineer"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Current Location</label>
          <SingleCityInput
            value={form.location}
            onChange={(val) => update('location', val)}
            placeholder="e.g. Bengaluru, India"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Timezone</label>
          <div className="relative">
            <Compass className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className={`${selectCls} pl-10`}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
