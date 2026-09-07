'use client';

import React from 'react';
import { Save } from '@/lib/lucide-google-icons';
import { OrgProfileCard } from './OrgProfileCard';
import { AiScreeningRulesCard } from './AiScreeningRulesCard';

interface GeneralSettingsTabProps {
  orgName: string;
  setOrgName: (val: string) => void;
  orgDomain: string;
  setOrgDomain: (val: string) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  defaultThreshold: number;
  setDefaultThreshold: (val: number) => void;
  defaultVoice: string;
  setDefaultVoice: (val: string) => void;
  autoInvite: boolean;
  setAutoInvite: (val: boolean) => void;
  anonymizeResumes: boolean;
  setAnonymizeResumes: (val: boolean) => void;
  onSave: () => void;
}

export function GeneralSettingsTab({
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
  defaultVoice,
  setDefaultVoice,
  autoInvite,
  setAutoInvite,
  anonymizeResumes,
  setAnonymizeResumes,
  onSave,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <OrgProfileCard
        orgName={orgName}
        setOrgName={setOrgName}
        orgDomain={orgDomain}
        setOrgDomain={setOrgDomain}
        supportEmail={supportEmail}
        setSupportEmail={setSupportEmail}
        timezone={timezone}
        setTimezone={setTimezone}
      />

      <AiScreeningRulesCard
        defaultThreshold={defaultThreshold}
        setDefaultThreshold={setDefaultThreshold}
        defaultVoice={defaultVoice}
        setDefaultVoice={setDefaultVoice}
        autoInvite={autoInvite}
        setAutoInvite={setAutoInvite}
        anonymizeResumes={anonymizeResumes}
        setAnonymizeResumes={setAnonymizeResumes}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save General Settings</span>
        </button>
      </div>
    </div>
  );
}
