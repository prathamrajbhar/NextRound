import { AudioLines, Building, Mic, Scale, User } from '@/lib/lucide-google-icons';
import { AuthBenefit } from '@/components/auth/AuthShell';

export type Role = 'candidate' | 'hr';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export const BENEFITS: AuthBenefit[] = [
  {
    icon: Mic,
    title: 'AI voice interviews',
    description: 'Candidates are screened by voice agents with live transcripts and structured scoring.',
  },
  {
    icon: Scale,
    title: 'Objective rubric decisions',
    description: 'Every evaluation is normalized and explained — clear, defensible shortlists.',
  },
  {
    icon: AudioLines,
    title: 'Candidate prep built in',
    description: 'Mock interviews and practice content for every applicant, free of charge.',
  },
];

export const ROLE_OPTIONS: { value: Role; label: string; icon: AuthBenefit['icon'] }[] = [
  { value: 'candidate', label: "I'm a Candidate", icon: User },
  { value: 'hr', label: "I'm an Employer", icon: Building },
];
