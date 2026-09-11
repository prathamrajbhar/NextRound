'use client';

import React from 'react';
import { GeneralSettingsTab } from './_components/GeneralSettingsTab';
import { AppearanceTab } from './_components/AppearanceTab';
import { NotificationsTab } from './_components/NotificationsTab';
import { TeamTab } from './_components/TeamTab';
import { EmailTemplatesTab } from './_components/EmailTemplatesTab';
import { SettingsHeader } from './_components/SettingsHeader';
import { SettingsNavTabs } from './_components/SettingsNavTabs';
import { useHrSettings } from './_hooks/useHrSettings';

export default function HrSettingsPage() {
  const s = useHrSettings();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
      <SettingsHeader savedSuccess={s.savedSuccess} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <SettingsNavTabs activeTab={s.activeTab} setActiveTab={s.setActiveTab} />

        <div className="lg:col-span-3 space-y-6">
          {s.activeTab === 'general' && (
            <GeneralSettingsTab
              orgName={s.orgName}
              setOrgName={s.setOrgName}
              orgDomain={s.orgDomain}
              setOrgDomain={s.setOrgDomain}
              supportEmail={s.supportEmail}
              setSupportEmail={s.setSupportEmail}
              timezone={s.timezone}
              setTimezone={s.setTimezone}
              defaultThreshold={s.defaultThreshold}
              setDefaultThreshold={s.setDefaultThreshold}
              defaultVoice={s.defaultVoice}
              setDefaultVoice={(val) => s.setDefaultVoice(val as 'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer')}
              autoInvite={s.autoInvite}
              setAutoInvite={s.setAutoInvite}
              anonymizeResumes={s.anonymizeResumes}
              setAnonymizeResumes={s.setAnonymizeResumes}
              onSave={s.handleGeneralSave}
            />
          )}

          {s.activeTab === 'appearance' && (
            <AppearanceTab
              theme={s.theme}
              setTheme={s.setTheme}
              brandColor={s.brandColor}
              setBrandColor={s.setBrandColor}
              glassmorphism={s.glassmorphism}
              setGlassmorphism={s.setGlassmorphism}
              compactDensity={s.compactDensity}
              setCompactDensity={s.setCompactDensity}
              onSave={s.triggerSaveNotification}
            />
          )}

          {s.activeTab === 'notifications' && (
            <NotificationsTab
              notifyShortlist={s.notifyShortlist}
              setNotifyShortlist={s.setNotifyShortlist}
              notifyHighScore={s.notifyHighScore}
              setNotifyHighScore={s.setNotifyHighScore}
              dailyDigest={s.dailyDigest}
              setDailyDigest={s.setDailyDigest}
              onSave={s.handleNotificationsSave}
            />
          )}

          {s.activeTab === 'team' && (
            <TeamTab
              team={s.team}
              inviteEmail={s.inviteEmail}
              setInviteEmail={s.setInviteEmail}
              inviteRole={s.inviteRole}
              setInviteRole={s.setInviteRole}
              lastInvitedEmail={s.lastInvitedEmail}
              clearInvitedBanner={s.clearInvitedBanner}
              handleInviteSubmit={s.handleInviteSubmit}
              handleRemoveMember={s.handleRemoveMember}
            />
          )}

          {s.activeTab === 'emails' && (
            <EmailTemplatesTab
              activeTemplate={s.activeTemplate}
              setActiveTemplate={s.setActiveTemplate}
              templates={s.templates}
              setTemplates={s.setTemplates}
              onSave={s.handleEmailTemplatesSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
