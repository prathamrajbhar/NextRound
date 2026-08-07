'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Globe,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Save,
} from '@/lib/lucide-google-icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

interface CandidateProfileTabProps {
  onSave: () => void;
}

export function CandidateProfileTab({ onSave }: CandidateProfileTabProps) {
  const { user } = useAuthContext();
  const [fullName, setFullName] = useState(() => (user?.email ? user.email.split('@')[0] : ''));
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState(() => user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user?.email) {
        setEmail(user.email);
        if (!fullName) setFullName(user.email.split('@')[0]);
      }

      try {
        const res = await apiClient.get<{ profile?: Record<string, any> }>('/candidate/profile').catch(() => null);
        if (res && res.profile) {
          const p = res.profile;
          if (p.full_name) setFullName(p.full_name);
          if (p.email) setEmail(p.email);
          if (p.phone) setPhone(p.phone);
          if (p.location) setLocation(p.location);
          if (p.headline) setHeadline(p.headline);
          if (p.portfolio_url) setPortfolioUrl(p.portfolio_url);
          if (p.github_url) setGithubUrl(p.github_url);
          if (p.linkedin_url) setLinkedinUrl(p.linkedin_url);
          if (p.bio) setBio(p.bio);
        } else {
          // Fallback to local storage
          const savedName = localStorage.getItem('candidate_name');
          const savedEmail = localStorage.getItem('candidate_email');
          const savedPhone = localStorage.getItem('candidate_phone');
          const savedLoc = localStorage.getItem('candidate_location');
          const savedHeadline = localStorage.getItem('candidate_headline');
          const savedPortfolio = localStorage.getItem('candidate_portfolio');
          const savedGithub = localStorage.getItem('candidate_github');
          const savedLinkedin = localStorage.getItem('candidate_linkedin');
          const savedBio = localStorage.getItem('candidate_bio');

          if (savedName) setFullName(savedName);
          if (savedEmail) setEmail(savedEmail);
          if (savedPhone) setPhone(savedPhone);
          if (savedLoc) setLocation(savedLoc);
          if (savedHeadline) setHeadline(savedHeadline);
          if (savedPortfolio) setPortfolioUrl(savedPortfolio);
          if (savedGithub) setGithubUrl(savedGithub);
          if (savedLinkedin) setLinkedinUrl(savedLinkedin);
          if (savedBio) setBio(savedBio);
        }
      } catch {
        // Keep current state
      }
    }

    loadProfile();
  }, [user]);

  const initials = fullName
    ? fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CN';

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('candidate_name', fullName);
    localStorage.setItem('candidate_email', email);
    localStorage.setItem('candidate_phone', phone);
    localStorage.setItem('candidate_location', location);
    localStorage.setItem('candidate_headline', headline);
    localStorage.setItem('candidate_portfolio', portfolioUrl);
    localStorage.setItem('candidate_github', githubUrl);
    localStorage.setItem('candidate_linkedin', linkedinUrl);
    localStorage.setItem('candidate_bio', bio);

    try {
      await apiClient.post('/candidate/profile', {
        full_name: fullName,
        email,
        phone,
        location,
        headline,
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        bio,
      }).catch(() => null);
    } catch {
      // Ignore API sync errors if offline
    }

    window.dispatchEvent(new Event('profile_update'));
    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group cursor-pointer">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20">
            {initials}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <UploadCloud className="h-6 w-6" />
          </div>
        </div>

        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{fullName || 'Candidate Profile'}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified Profile
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{headline || email || 'Configure profile details below'}</p>
          <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
            {location && (
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                📍 {location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Personal &amp; Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Professional Headline</label>
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer | Full Stack"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Primary Email
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" /> Location &amp; Timezone
          </label>
          <input
            type="text"
            placeholder="City, Country (e.g. San Francisco, CA)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>
      </div>

      {/* Online Profiles & Bio */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          Links &amp; Professional Bio
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Portfolio Website</label>
            <input
              type="text"
              placeholder="https://yourportfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GitHub Profile</label>
            <input
              type="text"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">LinkedIn Profile</label>
            <input
              type="text"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About Me / Summary</label>
            <span className="text-[10px] font-semibold text-slate-400">{bio.length} / 500 chars</span>
          </div>
          <textarea
            rows={3}
            placeholder="Brief description of your background and technical focus..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input resize-none"
          />
        </div>

        {/* Save CTA */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving to DB...' : 'Save Profile Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
