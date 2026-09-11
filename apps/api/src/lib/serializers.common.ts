export type Rec = Record<string, unknown>;

export function isObject(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null;
}

export function asStringArray(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export const STAGE_BY_STATUS: Rec = {
  applied: 'Sourced',
  screening: 'Screened',
  screening_completed: 'Screened',
  assessment: 'Assessment',
  interview_scheduled: 'Interview',
  interviewed: 'Interview',
  evaluation: 'Assessment',
  hr_round: 'HR Round',
  decided: 'Decision',
  offered: 'Decision',
  accepted: 'Decision',
  rejected: 'Decision',
  withdrawn: 'Decision',
};

export function statusToStage(status: unknown): string {
  if (typeof status === 'string' && STAGE_BY_STATUS[status]) {
    return STAGE_BY_STATUS[status] as string;
  }
  return 'Sourced';
}

export function candidateName(candidate: Rec | undefined): string {
  if (!candidate) return 'Candidate';
  const explicitName = candidate.name || candidate.full_name;
  if (typeof explicitName === 'string' && explicitName) return explicitName;
  const userEmail = isObject(candidate.user) ? candidate.user.email : undefined;
  if (typeof userEmail === 'string' && userEmail) {
    return userEmail
      .split('@')[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return 'Candidate';
}

export function candidateEmail(candidate: Rec | undefined): string {
  if (!candidate) return '';
  const userEmail = isObject(candidate.user) ? candidate.user.email : undefined;
  return typeof userEmail === 'string' ? userEmail : '';
}

export function orgName(job: Rec | undefined): string {
  const organization = job?.organization;
  if (isObject(organization) && typeof organization.name === 'string') return organization.name;
  return '';
}

export function orgLogo(job: Rec | undefined): string {
  const organization = isObject(job) ? job.organization : undefined;
  if (isObject(organization) && typeof organization.logo_url === 'string') return organization.logo_url;
  return '';
}

export function toIso(timestampValue: unknown): string | undefined {
  if (!timestampValue) return undefined;
  try {
    return new Date(timestampValue as string | number | Date).toISOString();
  } catch {
    return undefined;
  }
}

export function toDatePart(timestampValue: unknown): string {
  if (!timestampValue) return '';
  try {
    return new Date(timestampValue as string | number | Date).toISOString().split('T')[0];
  } catch {
    return '';
  }
}
