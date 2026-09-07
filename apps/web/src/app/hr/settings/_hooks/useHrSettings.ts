'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/apiClient';
import { DEFAULT_EMAIL_TEMPLATES } from '../_components/defaultTemplates';
import { SettingsTabType } from '../_components/SettingsNavTabs';
import { useHrTeamMembers } from './useHrTeamMembers';

export function useHrSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTabType>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, setTheme, setBrandColor: setGlobalBrandColor } = useTheme();

  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultThreshold, setDefaultThreshold] = useState(0);
  const [autoInvite, setAutoInvite] = useState(false);
  const [defaultVoice, setDefaultVoice] = useState<'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer'>('Serena');
  const [anonymizeResumes, setAnonymizeResumes] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [brandColor, setBrandColor] = useState('orange');
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [compactDensity, setCompactDensity] = useState(false);

  const [notifyShortlist, setNotifyShortlist] = useState(true);
  const [notifyHighScore, setNotifyHighScore] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const [activeTemplate, setActiveTemplate] = useState<'interview' | 'assessment' | 'offer' | 'rejection'>('interview');
  const [templates, setTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);

  const triggerSaveNotification = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const teamData = useHrTeamMembers(orgId, triggerSaveNotification);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const orgRes = await apiClient
          .get<{ organization: { id: string; name: string; settings: Record<string, unknown> } }>('/organizations/me')
          .catch(() => null);
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
      } catch {
        // Failed to fetch org settings
      }
    }
    fetchSettings();
  }, []);

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
      } catch {}
    }
    triggerSaveNotification();
  };

  const handleNotificationsSave = async () => {
    if (orgId) {
      try {
        await apiClient.patch(`/organizations/${orgId}`, {
          settings: { notificationPrefs: { notifyShortlist, notifyHighScore, dailyDigest } },
        });
      } catch {}
    }
    triggerSaveNotification();
  };

  const handleEmailTemplatesSave = async () => {
    if (orgId) {
      try {
        await apiClient.patch(`/organizations/${orgId}`, {
          settings: { emailTemplates: templates },
        });
      } catch {}
    }
    triggerSaveNotification();
  };

  return {
    activeTab,
    setActiveTab,
    savedSuccess,
    theme,
    setTheme,
    brandColor,
    setBrandColor: (color: string) => {
      setBrandColor(color);
      setGlobalBrandColor?.(color);
    },
    glassmorphism,
    setGlassmorphism,
    compactDensity,
    setCompactDensity,
    orgName,
    setOrgName,
    orgDomain,
    setOrgDomain,
    supportEmail,
    setSupportEmail,
    timezone,
    setTimezone,
    defaultThreshold,
    setDefaultThreshold,
    autoInvite,
    setAutoInvite,
    defaultVoice,
    setDefaultVoice,
    anonymizeResumes,
    setAnonymizeResumes,
    notifyShortlist,
    setNotifyShortlist,
    notifyHighScore,
    setNotifyHighScore,
    dailyDigest,
    setDailyDigest,
    activeTemplate,
    setActiveTemplate,
    templates,
    setTemplates,
    handleGeneralSave,
    handleNotificationsSave,
    handleEmailTemplatesSave,
    triggerSaveNotification,
    ...teamData,
  };
}
