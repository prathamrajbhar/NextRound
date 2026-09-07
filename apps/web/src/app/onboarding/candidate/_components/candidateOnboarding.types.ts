export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export interface CandidateForm {
  fullName: string;
  headline: string;
  phone: string;
  location: string;
  timezone: string;

  resumeFile: File | null;
  rawResumeText?: string;
  parsedResume?: Record<string, unknown>;
  socialData?: Record<string, unknown>;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  dataConsent: boolean;

  yearsOfExperience: string;
  targetRoles: string[];
  skills: string[];

  workMode: WorkMode;
  targetLocations: string[];
  availability: {
    weekday: boolean;
    weekend: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };

  expectedSalary: string;
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  currentCtc: string;
  noticePeriod: string;
  workAuthorization: string;

  proudProject: string;
  bio: string;
  workValues: string[];
}

export const DEFAULT_FORM: CandidateForm = {
  fullName: '',
  headline: '',
  phone: '',
  location: '',
  timezone: 'Asia/Kolkata',
  resumeFile: null,
  rawResumeText: undefined,
  parsedResume: undefined,
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  dataConsent: true,
  yearsOfExperience: '',
  targetRoles: [],
  skills: [],
  workMode: 'Remote',
  targetLocations: [],
  availability: {
    weekday: true,
    weekend: false,
    morning: true,
    afternoon: true,
    evening: false,
  },
  expectedSalary: '25',
  expectedSalaryMin: '18',
  expectedSalaryMax: '30',
  currentCtc: '15',
  noticePeriod: '30 days',
  workAuthorization: 'Authorized',
  proudProject: '',
  bio: '',
  workValues: [
    'Learning & Career Growth',
    'High Autonomy & Ownership',
    'Compensation & Benefits',
    'Work-Life Balance',
    'Team Collaboration',
  ],
};

export type TagField = 'targetRoles' | 'skills' | 'targetLocations';

export interface ParsedProfilePayload {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  skills?: string[];
  targetRoles?: string[];
  targetLocations?: string[];
  workMode?: WorkMode;
  currentCtc?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  workAuthorization?: string;
  bio?: string;
  proudProject?: string;
  rawText?: string;
  rawTextLength?: number;
  [key: string]: unknown;
}

export interface OnboardingStepProps {
  form: CandidateForm;
  update: <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) => void;
  addTag: (key: TagField, value: string) => void;
  removeTag: (key: TagField, value: string) => void;
  mergeParsedProfile?: (parsed: ParsedProfilePayload, rawText?: string) => void;
  mergeSocialData?: (social: Record<string, unknown>, extractedSkills?: string[]) => void;
}

export function buildCandidatePayload(form: CandidateForm) {
  const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v.trim()));
  return {
    fullName: form.fullName.trim() || undefined,
    headline: form.headline.trim() || undefined,
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    timezone: form.timezone || undefined,
    rawResumeText: form.rawResumeText || undefined,
    parsedResume: form.parsedResume || undefined,
    socialData: form.socialData || undefined,
    linkedinUrl: form.linkedinUrl.trim() || undefined,
    githubUrl: form.githubUrl.trim() || undefined,
    portfolioUrl: form.portfolioUrl.trim() || undefined,
    dataConsent: form.dataConsent,
    consentAt: form.dataConsent ? new Date().toISOString() : undefined,
    bio: form.bio.trim() || undefined,
    skills: form.skills,
    targetRoles: form.targetRoles,
    yearsOfExperience: toNumber(form.yearsOfExperience),
    workMode: form.workMode,
    currentCtc: toNumber(form.currentCtc),
    noticePeriod: form.noticePeriod || undefined,
    workAuthorization: form.workAuthorization || undefined,
    proudProject: form.proudProject.trim() || undefined,
    workValues: form.workValues,
    availability: form.availability,
  };
}
