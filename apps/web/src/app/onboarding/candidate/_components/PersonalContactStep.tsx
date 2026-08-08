'use client';

import React, { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Compass, Lightbulb, FileUp, Check, Loader2, Sparkles } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls, selectCls } from './CandidateOnboardingShell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;

    update('resumeFile', file);
    setParsing(true);
    setParseStatus(null);
    setParseError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/candidate/parse-resume`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data?.profile) {
        if (mergeParsedProfile) {
          mergeParsedProfile(json.data.profile, json.data.rawText);
        }
        setParseStatus('Resume parsed with Gemini AI! Profile fields pre-filled.');
      } else {
        setParseError(typeof json.error === 'string' ? json.error : 'Could not parse resume text.');
      }
    } catch {
      setParseError('Failed to parse resume text.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />

      {/* Sleek Resume Upload Action Bar */}
      <div className="rounded-2xl border border-orange-500/30 bg-slate-900/90 p-4 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">Auto-fill Profile with Resume AI</span>
            <span className="text-xs text-slate-400 block mt-0.5">Extract contact, experience &amp; skills automatically</span>
          </div>
        </div>

        {form.resumeFile ? (
          <div className="flex items-center gap-3">
            {parsing ? (
              <span className="flex items-center gap-2 text-xs font-bold text-orange-300 bg-orange-500/10 py-1.5 px-3.5 rounded-xl border border-orange-500/30">
                <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                Parsing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/30">
                <Check className="h-4 w-4" />
                <span className="truncate max-w-[140px]">{form.resumeFile.name}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border border-orange-400/30 shrink-0"
          >
            <FileUp className="h-4 w-4" />
            <span>Upload Resume</span>
          </button>
        )}
      </div>

      {parseStatus && (
        <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2 px-3.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{parseStatus}</span>
        </div>
      )}

      {parseError && (
        <div className="text-xs font-semibold text-rose-300 bg-rose-500/10 py-2 px-3.5 rounded-xl border border-rose-500/30">
          {parseError}
        </div>
      )}

      {/* 2-Column High-Density Grid */}
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
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className={`${inputCls} pl-10`}
            />
          </div>
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
