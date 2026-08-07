'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, FileText, Code, Sliders, Wallet, Handshake } from '@/lib/lucide-google-icons';
import { CandidateOnboardingShell, OnboardingStep } from './_components/CandidateOnboardingShell';
import {
  useCandidateOnboarding,
  buildCandidatePayload,
  OnboardingStepProps,
} from './_components/useCandidateOnboarding';
import { PersonalContactStep } from './_components/PersonalContactStep';
import { ResumeLinksStep } from './_components/ResumeLinksStep';
import { ExperienceSkillsStep } from './_components/ExperienceSkillsStep';
import { WorkPreferencesStep } from './_components/WorkPreferencesStep';
import { CompensationEligibilityStep } from './_components/CompensationEligibilityStep';
import { FitCultureStep } from './_components/FitCultureStep';

const STEPS: OnboardingStep[] = [
  { label: 'Personal & Contact', description: 'How to reach you', icon: User },
  { label: 'Resume & Online Presence', description: 'Showcase your work', icon: FileText },
  { label: 'Experience & Skills', description: 'Your background', icon: Code },
  { label: 'Work Preferences', description: 'How you like to work', icon: Sliders },
  { label: 'Compensation & Eligibility', description: 'Salary & work rights', icon: Wallet },
  { label: 'Fit & Culture', description: 'What matters to you', icon: Handshake },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export default function CandidateOnboarding() {
  const router = useRouter();
  const { form, step, setStep, submitting, setSubmitting, error, setError, update, addTag, removeTag } =
    useCandidateOnboarding();

  const handleNext = () => {
    if (step === 0 && !form.fullName.trim()) {
      setError('Please enter your full name to continue.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const submitProfile = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = buildCandidatePayload(form);
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      if (form.resumeFile) {
        formData.append('resume', form.resumeFile);
      }

      const res = await fetch(`${API_BASE_URL}/candidate/profile`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        router.push('/candidate/dashboard');
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Failed to complete profile onboarding');
      }
    } catch {
      setSubmitting(false);
      setError('Failed to upload profile data. Please try again.');
    }
  };

  const stepProps: OnboardingStepProps = { form, update, addTag, removeTag };
  const isLast = step === STEPS.length - 1;

  return (
    <CandidateOnboardingShell
      steps={STEPS}
      current={step}
      stepTitle={STEPS[step].label}
      stepDescription={STEPS[step].description}
      error={error}
      onBack={step > 0 ? handleBack : undefined}
      onNext={!isLast ? handleNext : undefined}
      onFinish={isLast ? submitProfile : undefined}
      submitting={submitting}
      showSkip={step === 0}
      onSkip={submitProfile}
    >
      {step === 0 && <PersonalContactStep {...stepProps} />}
      {step === 1 && <ResumeLinksStep {...stepProps} />}
      {step === 2 && <ExperienceSkillsStep {...stepProps} />}
      {step === 3 && <WorkPreferencesStep {...stepProps} />}
      {step === 4 && <CompensationEligibilityStep {...stepProps} />}
      {step === 5 && <FitCultureStep {...stepProps} />}
    </CandidateOnboardingShell>
  );
}
