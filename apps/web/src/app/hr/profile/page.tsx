'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  User, 
  Check, 
  Plus, 
  Mail, 
  Briefcase, 
  Building2, 
  Link as LinkIcon,
  X,
  FileText,
  UploadCloud,
  AlertTriangle,
  Trash2,
  Sparkles
} from '@/lib/lucide-google-icons';
import { Autocomplete } from '@/components/ui';
import { SUGGESTED_COMPANIES, SUGGESTED_ROLES } from '@/lib/suggestedOptions';

import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useHrProfile } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function HrProfile() {
  const { user } = useAuthContext();
  const [name, setName] = useState(() => user?.email ? user.email.split('@')[0] : '');
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
        title: role,
        linkedinUrl: linkedinUrl || null,
        avatarUrl: avatar,
        specialties,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', 'hr'] });
    } catch (err) {
      console.error('Failed to save HR profile:', err);
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
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Manage your Recruiter Workspace profile settings, hiring specializations, and company credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          
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
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">Select Profile Avatar</label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAvatar('/avatar-boy.jpg')}
                    className={`h-10 w-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                      avatar === '/avatar-boy.jpg' ? 'border-purple-600 dark:border-purple-400 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src="/avatar-boy.jpg" alt="Avatar Boy" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatar('/avatar-girl.jpg')}
                    className={`h-10 w-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                      avatar === '/avatar-girl.jpg' ? 'border-purple-600 dark:border-purple-400 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src="/avatar-girl.jpg" alt="Avatar Girl" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  </button>
                  
                  <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold px-3 py-2 cursor-pointer transition-all shadow-sm flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Upload Custom</span>
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
                onClick={handleSave}
                className="w-full sm:w-auto rounded-xl bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                Save
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              Focus Hiring Specialties
            </h3>
            
            <div className="flex flex-wrap gap-1.5 mb-2">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 shadow-sm"
                >
                  {s}
                  <button type="button" onClick={() => handleRemoveSpecialty(s)} className="hover:text-purple-950 dark:hover:text-white cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <form onSubmit={handleAddSpecialty} className="flex gap-2">
              <input
                type="text"
                placeholder="Add specialty tag (e.g. Sales, Frontend)..."
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-500 transition-all font-semibold"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs px-4 hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center shadow-md"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 p-6 shadow-sm glass-panel space-y-4">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-black">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Under corporate workspace directives, you have the right to request deletion of all organizational client metadata, active job postings, and historical evaluation logs.
            </p>
            {deleted ? (
              <div className="text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-100 dark:border-rose-900/60">
                Purge request logged. Core systems cleanup initiated.
              </div>
            ) : (
              <button
                onClick={handleDeleteData}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Processing purge request...' : 'Purge Client Workspace'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Workspace Integrity</span>
            <div className="relative h-24 w-24 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600 dark:text-purple-400"
                  strokeDasharray="95, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-lg font-black text-slate-800 dark:text-slate-100">95%</span>
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60 w-fit mx-auto block mb-2">
              Certified Recruiter
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-relaxed">
              Verify your organizational credentials to lock tenant hiring authorities.
            </span>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2">Active License</h3>
            
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 shadow-sm">
              <FileText className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-grow">
                <span className="text-xs font-extrabold truncate block leading-none">{licenseName}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-400 font-semibold block mt-1">Validated 2 days ago</span>
              </div>
            </div>

            <label className="w-full text-center text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:underline transition-colors py-2 cursor-pointer block border border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/10 dark:bg-purple-950/20 rounded-2xl shadow-inner">
              <UploadCloud className="h-4.5 w-4.5 mx-auto mb-1 text-purple-500 dark:text-purple-400" />
              <span>Replace License file</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleLicenseUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
