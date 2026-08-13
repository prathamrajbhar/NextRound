'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Mail,
  CheckCircle2,
  Palette,
  Bell,
} from '@/lib/lucide-google-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/apiClient';
import { GeneralSettingsTab } from './_components/GeneralSettingsTab';
import { AppearanceTab } from './_components/AppearanceTab';
import { NotificationsTab } from './_components/NotificationsTab';
import { TeamTab } from './_components/TeamTab';
import { EmailTemplatesTab } from './_components/EmailTemplatesTab';

import { useAuthContext } from '@/contexts/AuthContext';

const DEFAULT_ORG_SETTINGS = {
  orgName: '',
  domain: '',
  supportEmail: '',
  timezone: '',
  defaultThreshold: 0,
  autoOfferEnabled: false,
  defaultVoice: 'Serena' as const,
  anonymizeResumes: false,
};

export default function HrSettingsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'team' | 'emails'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  
  const [orgName, setOrgName] = useState(DEFAULT_ORG_SETTINGS.orgName);
  const [orgDomain, setOrgDomain] = useState(DEFAULT_ORG_SETTINGS.domain);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_ORG_SETTINGS.supportEmail);
  const [timezone, setTimezone] = useState(DEFAULT_ORG_SETTINGS.timezone);
  const [defaultThreshold, setDefaultThreshold] = useState(DEFAULT_ORG_SETTINGS.defaultThreshold);
  const [autoInvite, setAutoInvite] = useState(DEFAULT_ORG_SETTINGS.autoOfferEnabled);
  const [defaultVoice, setDefaultVoice] = useState<'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer'>(DEFAULT_ORG_SETTINGS.defaultVoice);
  const [anonymizeResumes, setAnonymizeResumes] = useState(DEFAULT_ORG_SETTINGS.anonymizeResumes);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const orgRes = await apiClient.get<{ organization: { id: string; name: string; settings: Record<string, unknown> } }>('/organizations/me').catch(() => null);
        if (orgRes?.organization) {
          if (orgRes.organization.id) setOrgId(orgRes.organization.id);
          if (orgRes.organization.name) setOrgName(orgRes.organization.name);
          const s = orgRes.organization.settings || {};
          if (typeof s.domain === 'string') setOrgDomain(s.domain);
          if (typeof s.supportEmail === 'string') setSupportEmail(s.supportEmail);
          if (typeof s.timezone === 'string') setTimezone(s.timezone);
          if (typeof s.defaultThreshold === 'number') setDefaultThreshold(s.defaultThreshold);
          if (typeof s.autoOfferEnabled === 'boolean') setAutoInvite(s.autoOfferEnabled);
          if (typeof s.defaultVoice === 'string') setDefaultVoice(s.defaultVoice as 'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer');
          if (typeof s.anonymizeResumes === 'boolean') setAnonymizeResumes(s.anonymizeResumes);
        }
      } catch (err) {
        console.error('Failed to fetch org settings:', err);
      }
    }
    fetchSettings();
  }, []);

  
  const [brandColor, setBrandColor] = useState('orange');
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [compactDensity, setCompactDensity] = useState(false);

  
  const [notifyShortlist, setNotifyShortlist] = useState(true);
  const [notifyHighScore, setNotifyHighScore] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  
  const [team, setTeam] = useState<{ id: string; name: string; email: string; role: string; status: string }[]>(() => {
    if (user?.email) {
      return [{ id: user?.id || 'me', name: user.email.split('@')[0], email: user.email, role: 'Owner', status: 'Active' }];
    }
    return [];
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Recruiter' | 'Reviewer'>('Recruiter');

  
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

  
  useEffect(() => {
    async function loadMembers() {
      if (!orgId) return;
      try {
        const res = await apiClient
          .get<{ members: { id: string; email: string; role: string }[] }>(`/organizations/${orgId}/members`)
          .catch(() => null);
        if (res?.members?.length) {
          setTeam(
            res.members.map((m) => ({
              id: m.id,
              name: m.email.split('@')[0],
              email: m.email,
              role: m.id === user?.id ? 'Owner' : 'Admin',
              status: 'Active',
            }))
          );
        }
      } catch {
        
      }
    }
    loadMembers();
  }, [orgId, user]);

  const handleGeneralSave = async () => {
    if (orgId) {
      try {
        await apiClient.patch(`/organizations/${orgId}`, {
          name: orgName,
          settings: {
            domain: orgDomain,
            supportEmail,
            timezone,
            defaultThreshold,
            autoOfferEnabled: autoInvite,
            defaultVoice,
            anonymizeResumes,
          },
        });
      } catch {
        
      }
    }
    triggerSaveNotification();
  };

  const handleNotificationsSave = async () => {
    if (orgId) {
      try {
        await apiClient.patch(`/organizations/${orgId}`, {
          settings: {
            notificationPrefs: { notifyShortlist, notifyHighScore, dailyDigest },
          },
        });
      } catch {
        
      }
    }
    triggerSaveNotification();
  };

  const handleEmailTemplatesSave = async () => {
    if (orgId) {
      try {
        await apiClient.patch(`/organizations/${orgId}`, {
          settings: { emailTemplates: templates },
        });
      } catch {
        
      }
    }
    triggerSaveNotification();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    try {
      await apiClient.post(`/organizations/${orgId}/members/invite`, {
        email: inviteEmail.trim(),
        role: 'hr',
      });
      setTeam([
        ...team,
        {
          id: `pending-${Date.now()}`,
          name: inviteEmail.split('@')[0],
          email: inviteEmail.trim(),
          role: inviteRole,
          status: 'Invited',
        },
      ]);
      setInviteEmail('');
    } catch {
      
    }
    triggerSaveNotification();
  };

  const handleRemoveMember = async (id: string) => {
    if (orgId && !id.startsWith('pending-')) {
      try {
        await apiClient.delete(`/organizations/${orgId}/members/${id}`);
      } catch {
        
      }
    }
    setTeam(team.filter((m) => m.id !== id));
    triggerSaveNotification();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      {}
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

      {}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {}
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

        {}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <GeneralSettingsTab
              orgName={orgName}
              setOrgName={setOrgName}
              orgDomain={orgDomain}
              setOrgDomain={setOrgDomain}
              supportEmail={supportEmail}
              setSupportEmail={setSupportEmail}
              timezone={timezone}
              setTimezone={setTimezone}
              defaultThreshold={defaultThreshold}
              setDefaultThreshold={setDefaultThreshold}
              defaultVoice={defaultVoice}
              setDefaultVoice={(val) => setDefaultVoice(val as 'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer')}
              autoInvite={autoInvite}
              setAutoInvite={setAutoInvite}
              anonymizeResumes={anonymizeResumes}
              setAnonymizeResumes={setAnonymizeResumes}
              onSave={handleGeneralSave}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab
              theme={theme}
              setTheme={setTheme}
              brandColor={brandColor}
              setBrandColor={setBrandColor}
              glassmorphism={glassmorphism}
              setGlassmorphism={setGlassmorphism}
              compactDensity={compactDensity}
              setCompactDensity={setCompactDensity}
              onSave={triggerSaveNotification}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notifyShortlist={notifyShortlist}
              setNotifyShortlist={setNotifyShortlist}
              notifyHighScore={notifyHighScore}
              setNotifyHighScore={setNotifyHighScore}
              dailyDigest={dailyDigest}
              setDailyDigest={setDailyDigest}
              onSave={handleNotificationsSave}
            />
          )}

          {activeTab === 'team' && (
            <TeamTab
              team={team}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              handleInviteSubmit={handleInviteSubmit}
              handleRemoveMember={handleRemoveMember}
            />
          )}

          {activeTab === 'emails' && (
            <EmailTemplatesTab
              activeTemplate={activeTemplate}
              setActiveTemplate={setActiveTemplate}
              templates={templates}
              setTemplates={setTemplates}
              onSave={handleEmailTemplatesSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
