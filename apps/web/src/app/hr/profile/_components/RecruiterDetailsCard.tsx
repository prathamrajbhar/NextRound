'use client';

import React from 'react';
import Image from 'next/image';
import {
  User,
  Check,
  Plus,
  Mail,
  Briefcase,
  Building2,
  Link as LinkIcon,
} from '@/lib/lucide-google-icons';
import { Autocomplete } from '@/components/ui';
import { SUGGESTED_COMPANIES, SUGGESTED_ROLES } from '@/lib/suggestedOptions';

interface RecruiterDetailsCardProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  role: string;
  setRole: (val: string) => void;
  company: string;
  setCompany: (val: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  avatar: string;
  setAvatar: (val: string) => void;
  detailsSaved: boolean;
  onSave: () => void;
  onCustomAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RecruiterDetailsCard({
  name,
  setName,
  email,
  setEmail,
  role,
  setRole,
  company,
  setCompany,
  linkedinUrl,
  setLinkedinUrl,
  avatar,
  setAvatar,
  detailsSaved,
  onSave,
  onCustomAvatarUpload,
}: RecruiterDetailsCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-md glass-panel space-y-6">
      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 flex items-center gap-1.5">
        <User className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
        Recruiter Details
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
          <Image src={avatar} alt="Profile Avatar" width={64} height={64} className="h-full w-full object-cover" unoptimized />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">
            Select Profile Avatar
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAvatar('/avatar-boy.jpg')}
              className={`h-10 w-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                avatar === '/avatar-boy.jpg'
                  ? 'border-purple-600 dark:border-purple-400 scale-105 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src="/avatar-boy.jpg" alt="Avatar Boy" width={40} height={40} className="h-full w-full object-cover" unoptimized />
            </button>
            <button
              type="button"
              onClick={() => setAvatar('/avatar-girl.jpg')}
              className={`h-10 w-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                avatar === '/avatar-girl.jpg'
                  ? 'border-purple-600 dark:border-purple-400 scale-105 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src="/avatar-girl.jpg" alt="Avatar Girl" width={40} height={40} className="h-full w-full object-cover" unoptimized />
            </button>

            <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold px-3 py-2 cursor-pointer transition-all shadow-sm flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Upload Custom</span>
              <input type="file" accept="image/*" onChange={onCustomAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-500 transition-all font-semibold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-500 transition-all font-semibold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Job Title</label>
          <Autocomplete
            options={SUGGESTED_ROLES}
            value={role}
            onChange={(val) => setRole(val)}
            icon={<Briefcase className="h-4 w-4" />}
            className="focus:border-purple-500 text-xs font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Company Name</label>
          <Autocomplete
            options={SUGGESTED_COMPANIES}
            value={company}
            onChange={(val) => setCompany(val)}
            icon={<Building2 className="h-4 w-4" />}
            className="focus:border-purple-500 text-xs font-semibold"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">LinkedIn Profile URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-500 transition-all font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex justify-end gap-3 items-center">
        {detailsSaved && (
          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 rounded-full p-1.5 flex items-center justify-center animate-in scale-in duration-200 shadow-sm">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
        <button
          type="button"
          onClick={onSave}
          className="w-full sm:w-auto rounded-xl bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
