'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building, Target, Calendar, Users } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { CompanyOnboardingShell, CompanyStep } from './_components/CompanyOnboardingShell';
import {
  useCompanyOnboarding,
  buildOrganizationPayload,
  CompanyStepProps,
} from './_components/useCompanyOnboarding';
import { CompanyDetailsStep } from './_components/CompanyDetailsStep';
import { HiringContextStep } from './_components/HiringContextStep';
import { SchedulingAutomationStep } from './_components/SchedulingAutomationStep';
import { TeamInviteStep } from './_components/TeamInviteStep';

const STEPS: CompanyStep[] = [
  { label: 'Company Details', description: 'Who you are', icon: Building },
  { label: 'Hiring Context', description: 'What you hire for', icon: Target },
  { label: 'Scheduling & Automation', description: 'When interviews run', icon: Calendar },
  { label: 'Team & Launch', description: 'Invite partners', icon: Users },
];

export default function CompanyOnboarding() {
  const router = useRouter();
  const { form, step, setStep, submitting, setSubmitting, error, setError, update, addRole, removeRole, addInvite, removeInvite } =
    useCompanyOnboarding();

  const handleNext = () => {
    if (step === 0 && !form.name.trim()) {
      setError('Please enter your organization name to continue.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError('');

    const payload = buildOrganizationPayload(form);
    try {
      const { organization } = await apiClient.post<{ organization: { id: string } }>('/organizations', payload);
      const orgId = organization?.id;

      if (orgId && form.invites.length > 0) {
        
        await Promise.all(
          form.invites.map((email) =>
            apiClient.post(`/organizations/${orgId}/members/invite`, { email }).catch(() => null)
          )
        );
      }
      router.push('/hr/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup organization');
    } finally {
      setSubmitting(false);
    }
  };

  const stepProps: CompanyStepProps = { form, update, addRole, removeRole, addInvite, removeInvite };
  const isLast = step === STEPS.length - 1;

  return (
    <CompanyOnboardingShell
      steps={STEPS}
      current={step}
      stepTitle={STEPS[step].label}
      stepDescription={STEPS[step].description}
      error={error}
      onBack={step > 0 ? handleBack : undefined}
      onNext={!isLast ? handleNext : undefined}
      onFinish={isLast ? handleFinish : undefined}
      submitting={submitting}
    >
      {step === 0 && <CompanyDetailsStep {...stepProps} />}
      {step === 1 && <HiringContextStep {...stepProps} />}
      {step === 2 && <SchedulingAutomationStep {...stepProps} />}
      {step === 3 && <TeamInviteStep {...stepProps} />}
    </CompanyOnboardingShell>
  );
}
