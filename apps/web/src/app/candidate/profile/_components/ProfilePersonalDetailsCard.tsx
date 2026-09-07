'use client';

import React from 'react';
import Image from 'next/image';
import { User, Mail, Phone, Globe, UploadCloud } from '@/lib/lucide-google-icons';

interface ProfilePersonalDetailsCardProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  headline: string;
  setHeadline: (val: string) => void;
  avatar: string;
  setAvatar: (val: string) => void;
  customAvatar: string | null;
  setCustomAvatar: (val: string | null) => void;
  initials: string;
  onCustomAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfilePersonalDetailsCard({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  location,
  setLocation,
  headline,
  setHeadline,
  avatar,
  setAvatar,
  customAvatar,
  setCustomAvatar,
  initials,
  onCustomAvatarUpload,
}: ProfilePersonalDetailsCardProps) {
  return (
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
              <input type="file" accept="image/*" onChange={onCustomAvatarUpload} className="hidden" />
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
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="+1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location / City</label>
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

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Professional Headline</label>
          <input
            type="text"
            placeholder="Senior Full Stack Engineer · React, TypeScript &amp; Distributed Systems"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>
      </div>
    </div>
  );
}
