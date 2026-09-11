'use client';

import React from 'react';
import Image from 'next/image';
import { UploadCloud, CheckCircle2 } from '@/lib/lucide-google-icons';

interface CandidateProfileAvatarCardProps {
  fullName: string;
  headline: string;
  email: string;
  location: string;
  avatar: string;
  customAvatar: string | null;
  initials: string;
  onSelectDefaultAvatar: (path: string) => void;
  onCustomAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CandidateProfileAvatarCard({
  fullName,
  headline,
  email,
  location,
  avatar,
  customAvatar,
  initials,
  onSelectDefaultAvatar,
  onCustomAvatarUpload,
}: CandidateProfileAvatarCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
        {customAvatar ? (
          <Image
            src={customAvatar}
            alt="Custom Avatar"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : avatar ? (
          <Image
            src={avatar}
            alt="Profile Avatar"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="text-center sm:text-left space-y-2 flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {fullName || 'Candidate Profile'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {headline || email || 'Configure profile details below'}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Avatar Selection
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDefaultAvatar('/avatar-boy.jpg')}
                className={`h-8 w-8 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  !customAvatar && avatar === '/avatar-boy.jpg'
                    ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src="/avatar-boy.jpg"
                  alt="Avatar Boy"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>
              <button
                type="button"
                onClick={() => onSelectDefaultAvatar('/avatar-girl.jpg')}
                className={`h-8 w-8 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  !customAvatar && avatar === '/avatar-girl.jpg'
                    ? 'border-brand-500 dark:border-orange-500 scale-105 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src="/avatar-girl.jpg"
                  alt="Avatar Girl"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>

              <label className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-extrabold px-2.5 py-1.5 cursor-pointer transition-all shadow-sm flex items-center gap-1">
                <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCustomAvatarUpload}
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
  );
}
