'use client';

import React from 'react';
import { User, Mail, Phone, Compass, Lightbulb } from '@/lib/lucide-google-icons';
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
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <PersonalResumeUploadBanner
        resumeFile={form.resumeFile}
        onFileSelect={(file) => update('resumeFile', file)}
        mergeParsedProfile={mergeParsedProfile}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className={labelCls}>
            Full Name <span className="text-orange-400">*</span>
          </label>
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
          <label className={labelCls}>Professional Headline</label>
          <div className="relative">
            <Lightbulb className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.headline}
              onChange={(e) => update('headline', e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer · React & Node"
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

        <div>
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

        <div>
          <label className={labelCls}>Account Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input type="email" readOnly placeholder="Connected via signup" className={`${inputCls} pl-10 opacity-50 cursor-not-allowed`} />
          </div>
        </div>
      </div>
    </div>
  );
}
