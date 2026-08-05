'use client';

import React, { useState } from 'react';
import {
  Settings,
  Users,
  Mail,
  Plus,
  Building2,
  Trash2,
  Save,
  CheckCircle2,
  Bot,
  Sun,
  Moon,
  Palette,
  Bell,
  BellRing,
  Sparkles,
  Sliders,
  ShieldCheck,
} from '@/lib/lucide-google-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrganizationSettings } from '@/lib/mockData';

export default function HrSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'team' | 'emails'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();

  const orgSettings = getOrganizationSettings();

  // General Settings state
  const [orgName, setOrgName] = useState(orgSettings.orgName);
  const [orgDomain, setOrgDomain] = useState(orgSettings.domain);
  const [supportEmail, setSupportEmail] = useState(orgSettings.supportEmail);
  const [timezone, setTimezone] = useState(orgSettings.timezone);
  const [defaultThreshold, setDefaultThreshold] = useState(orgSettings.defaultThreshold);
  const [autoInvite, setAutoInvite] = useState(orgSettings.autoOfferEnabled);
  const [defaultVoice, setDefaultVoice] = useState(orgSettings.defaultVoice);
  const [anonymizeResumes, setAnonymizeResumes] = useState(orgSettings.anonymizeResumes);

  // Appearance & Theme State
  const [brandColor, setBrandColor] = useState('orange');
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [compactDensity, setCompactDensity] = useState(false);

  // Notification Preferences State
  const [notifyShortlist, setNotifyShortlist] = useState(true);
  const [notifyHighScore, setNotifyHighScore] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);

  // Team Members state
  const [team, setTeam] = useState([
    { id: 1, name: 'Karan Malhotra', email: 'karan@swiggy.in', role: 'Owner', status: 'Active' },
    { id: 2, name: 'Ananya Sharma', email: 'ananya@swiggy.in', role: 'Admin', status: 'Active' },
    { id: 3, name: 'Rohan Gupta', email: 'rohan.g@swiggy.in', role: 'Recruiter', status: 'Active' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Recruiter' | 'Reviewer'>('Recruiter');

  // Email Templates state
  const [activeTemplate, setActiveTemplate] = useState<'interview' | 'assessment' | 'offer' | 'rejection'>('interview');
  const [templates, setTemplates] = useState({
    interview: {
      subject: 'Invitation to AI Voice Screening Round for {{role_title}}',
      body: 'Hi {{candidate_name}},\n\nOur AI Screening Agent evaluated your resume and matched your background for the {{role_title}} position at {{company_name}}.\n\nPlease select a convenient 15-minute slot to complete your conversational voice interview: {{interview_link}}\n\nBest regards,\n{{company_name}} Recruiting Team',
    },
    assessment: {
      subject: 'Online Technical Assessment Link for {{role_title}}',
      body: 'Hello {{candidate_name}},\n\nYou have been invited to complete the Online Technical Assessment for the {{role_title}} opening. This includes 5 multiple-choice questions and 1 coding challenge.\n\nStart Assessment: {{assessment_link}}\n\nGood luck!\n{{company_name}} Engineering Board',
    },
    offer: {
      subject: 'Official Employment Offer Letter — {{role_title}}',
      body: 'Dear {{candidate_name}},\n\nCongratulations! We are thrilled to offer you the position of {{role_title}} at {{company_name}}.\n\nAttached is your formal employment agreement. Please sign and accept by {{offer_deadline}}.\n\nWelcome aboard!\n{{company_name}} HR Team',
    },
    rejection: {
      subject: 'Update regarding your application for {{role_title}}',
      body: 'Dear {{candidate_name}},\n\nThank you for taking the time to interview for the {{role_title}} role at {{company_name}}. While your profile is impressive, we have decided to advance other candidates whose skills more closely match our immediate needs.\n\nWe will keep your resume in our talent pool for future openings.\n\nWarm regards,\n{{company_name}} Recruiting',
    },
  });

  const triggerSaveNotification = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      setTeam([
        ...team,
        {
          id: Date.now(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail.trim(),
          role: inviteRole,
          status: 'Active',
        },
      ]);
      setInviteEmail('');
      triggerSaveNotification();
    }
  };

  const handleRemoveMember = (id: number) => {
    setTeam(team.filter((m) => m.id !== id));
    triggerSaveNotification();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
            HR Settings
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Workspace &amp; System Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Configure theme aesthetics, AI screening thresholds, notification alerts, team access, and email templates.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 animate-in zoom-in-95 duration-200 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Navigation (1 Col) / Right Content (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Navigation Tabs */}
        <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-4 shadow-md backdrop-blur-md glass-panel flex flex-col gap-1.5 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'general'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>General &amp; AI Cutoffs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'appearance'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Theme &amp; Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'notifications'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notification Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'team'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team &amp; Recruiter Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'emails'
                ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email &amp; Candidate Templates</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: General & AI Thresholds */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Company Profile Card */}
              <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <Building2 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    Organization &amp; Workspace Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={orgDomain}
                      onChange={(e) => setOrgDomain(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Support Contact Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Primary Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                      <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Global AI Screening Parameters Card */}
              <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <Bot className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    Global AI Screening &amp; Cutoff Rules
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div>
                    <div className="flex justify-between mb-1 text-[11px] font-bold">
                      <span>Default Candidate Passing Score Cutoff</span>
                      <span className="text-brand-600 dark:text-orange-400 font-extrabold">{defaultThreshold}% Score</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={defaultThreshold}
                      onChange={(e) => setDefaultThreshold(Number(e.target.value))}
                      className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Default Voice Interviewer Persona
                    </label>
                    <select
                      value={defaultVoice}
                      onChange={(e) => setDefaultVoice(e.target.value as any)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Serena (Warm/Professional)">Serena (Warm &amp; Professional)</option>
                      <option value="Marcus (Technical/Direct)">Marcus (Technical &amp; Direct)</option>
                      <option value="Charlotte (Conversational)">Charlotte (Conversational &amp; Friendly)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Auto-Send Assessment Links</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                          Automatically invite candidates who pass initial resume evaluation
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoInvite}
                          onChange={(e) => setAutoInvite(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Anonymize Demographic Resumes</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                          Hide candidate names and locations for Double-Pass Bias Norm Compliance
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={anonymizeResumes}
                          onChange={(e) => setAnonymizeResumes(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={triggerSaveNotification}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save General Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Theme & Visual Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Theme Mode Selector Card */}
              <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <Palette className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    Theme Mode &amp; Color Scheme
                  </h3>
                </div>

                {/* Light vs Dark Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
                      theme === 'light'
                        ? 'border-brand-600 dark:border-orange-500 bg-brand-50/50 dark:bg-orange-950/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Light Theme</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Clean high-contrast daytime UI</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
                      theme === 'dark'
                        ? 'border-brand-600 dark:border-orange-500 bg-brand-50/50 dark:bg-orange-950/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Dark Theme</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sleek dark mode interface</span>
                    </div>
                  </div>
                </div>

                {/* Primary Accent Color Selector */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Primary Accent Palette</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'orange', name: 'HireOS Orange', bg: 'bg-orange-500' },
                      { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600' },
                      { id: 'emerald', name: 'Emerald Mint', bg: 'bg-emerald-500' },
                      { id: 'purple', name: 'Vibrant Purple', bg: 'bg-purple-600' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setBrandColor(c.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          brandColor === c.id
                            ? 'border-slate-900 dark:border-white ring-2 ring-slate-400/20 bg-slate-50 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full ${c.bg} flex-shrink-0`} />
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Density & Backdrop Toggles */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Glassmorphism Backdrop Blur</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                        Enable frosted glass panel styling across HR cards
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={glassmorphism}
                        onChange={(e) => setGlassmorphism(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Compact View Density</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                        Reduce list padding for maximum screen data density
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compactDensity}
                        onChange={(e) => setCompactDensity(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={triggerSaveNotification}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Appearance Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Notification Preferences */}
          {activeTab === 'notifications' && (
            <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <BellRing className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  Recruiter Notification &amp; Alert Preferences
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Candidate Shortlist Alerts</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      Receive email when a candidate completes the AI Voice Interview
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyShortlist}
                      onChange={(e) => setNotifyShortlist(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">High-Score Candidate Push Alerts</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      Instant notification when a candidate scores &gt;90% overall match rating
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyHighScore}
                      onChange={(e) => setNotifyHighScore(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Daily Pipeline Summary Digest</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      Morning email recap of new applicants, interviews scheduled, and offer decisions
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dailyDigest}
                      onChange={(e) => setDailyDigest(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={triggerSaveNotification}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Notification Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Team & Recruiter Roles */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Invite Recruiter Card */}
              <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                    Invite New Recruiting Partner
                  </h3>
                </div>

                <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="recruiter@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-grow p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />

                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 justify-center cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Send Invite</span>
                  </button>
                </form>
              </div>

              {/* Active Team Table */}
              <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 font-display">
                  Active Team Members ({team.length})
                </h3>

                <div className="space-y-3">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-orange-950/80 text-brand-700 dark:text-orange-400 font-extrabold flex items-center justify-center border border-brand-200 dark:border-orange-800">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-extrabold text-slate-900 dark:text-slate-100">{member.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{member.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-2.5 py-0.5 rounded-full uppercase">
                          {member.role}
                        </span>

                        {member.role !== 'Owner' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Email & Candidate Templates */}
          {activeTab === 'emails' && (
            <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                    <Mail className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
                    Candidate Communication Templates
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Customize automated emails sent to applicants during screening.
                  </p>
                </div>
              </div>

              {/* Template Selectors */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'interview', label: 'Interview Invitation' },
                  { id: 'assessment', label: 'Assessment Test Link' },
                  { id: 'offer', label: 'Offer Letter' },
                  { id: 'rejection', label: 'Rejection Courtesy' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTemplate(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                      activeTemplate === t.id
                        ? 'bg-brand-600 dark:bg-orange-600 text-white border-transparent shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Template Editor */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={templates[activeTemplate].subject}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: { ...templates[activeTemplate], subject: e.target.value },
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Body Content
                  </label>
                  <textarea
                    rows={8}
                    value={templates[activeTemplate].body}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: { ...templates[activeTemplate], body: e.target.value },
                      })
                    }
                    className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    Available Dynamic Variables
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-brand-600 dark:text-orange-400 font-bold">
                    <span>{'{{candidate_name}}'}</span>
                    <span>{'{{role_title}}'}</span>
                    <span>{'{{company_name}}'}</span>
                    <span>{'{{interview_link}}'}</span>
                    <span>{'{{assessment_link}}'}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={triggerSaveNotification}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Email Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
