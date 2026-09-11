import type { ParsedResumeData } from './resume-heuristic.service';

export function sanitizeParsedData(data: Record<string, unknown>): ParsedResumeData {
  const toString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return undefined;
  };

  const toNumber = (...values: unknown[]): number | undefined => {
    for (const value of values) {
      if (typeof value === 'number' && !isNaN(value)) return value;
      if (typeof value === 'string' && !isNaN(Number(value.trim()))) return Number(value.trim());
    }
    return undefined;
  };

  const toStringArray = (...values: unknown[]): string[] => {
    for (const value of values) {
      if (Array.isArray(value)) {
        const array = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (array.length > 0) return array;
      }
    }
    return [];
  };

  let fullName = toString(data.fullName, data.full_name, data.name, data.candidateName);
  if (fullName) {
    const lower = fullName.toLowerCase().trim();
    if (
      lower.includes('curriculum vitae') ||
      lower === 'resume' ||
      lower.startsWith('resume') ||
      lower.startsWith('page ') ||
      lower.includes('@') ||
      lower.includes('http') ||
      /\d/.test(fullName) ||
      fullName.length > 50
    ) {
      fullName = undefined;
    }
  }

  const headline = toString(data.headline, data.professionalHeadline, data.title, data.currentRole, data.role);
  const phone = toString(data.phone, data.phone_number, data.phoneNumber, data.mobile);
  const location = toString(data.location, data.currentLocation, data.address, data.city);
  const timezone = toString(data.timezone);

  let linkedinUrl = toString(data.linkedinUrl, data.linkedin);
  if (linkedinUrl && !linkedinUrl.startsWith('http')) {
    linkedinUrl = `https://${linkedinUrl}`;
  }

  let githubUrl = toString(data.githubUrl, data.github);
  if (githubUrl && !githubUrl.startsWith('http')) {
    githubUrl = `https://${githubUrl}`;
  }

  let portfolioUrl = toString(data.portfolioUrl, data.portfolio, data.website);
  if (portfolioUrl && !portfolioUrl.startsWith('http')) {
    portfolioUrl = `https://${portfolioUrl}`;
  }

  const skillsMap = new Map<string, string>();
  for (const item of toStringArray(data.skills)) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!skillsMap.has(key)) {
      skillsMap.set(key, trimmed);
    }
  }
  const skills = Array.from(skillsMap.values());

  let targetRoles = toStringArray(data.targetRoles, data.roles);
  if (targetRoles.length === 0 && headline) {
    targetRoles = [headline.split('|')[0].trim()];
  }

  const targetLocations = toStringArray(data.targetLocations);
  const rawYears = toNumber(data.yearsOfExperience, data.experienceYears);
  const yearsOfExperience = rawYears !== undefined && rawYears >= 0 && rawYears <= 50 ? rawYears : undefined;

  const workModeStr = toString(data.workMode);
  const workMode = ['Remote', 'Hybrid', 'Onsite'].includes(workModeStr || '')
    ? (workModeStr as 'Remote' | 'Hybrid' | 'Onsite')
    : undefined;

  let bio = toString(data.bio, data.summary, data.professionalSummary);
  if (bio) {
    // Remove email addresses, URLs, and phone numbers from the bio
    bio = bio
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/(?:\+\d{1,3}[-.\s]*)?\(?\d{1,4}\)?[-.\s]*\d{3,5}[-.\s]*\d{3,5}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (bio.length === 0) {
      bio = undefined;
    }
  }

  const proudProject = toString(data.proudProject, data.keyProject, data.featuredProject);

  const normalizeSalary = (val: unknown): number | undefined => {
    const num = toNumber(val);
    if (num === undefined || num <= 0) return undefined;
    // Reject years like 2020-2029
    if (num >= 2020 && num <= 2030) return undefined;
    // If given in full INR (e.g. 1500000 -> 15 LPA)
    if (num >= 100000) {
      return Math.round(num / 100000);
    }
    // If given in LPA (e.g. 15 or 25)
    if (num < 500) {
      return num;
    }
    return undefined;
  };

  const currentCtc = normalizeSalary(data.currentCtc);
  const expectedSalary = normalizeSalary(data.expectedSalary);

  const rawNoticePeriod = toString(data.noticePeriod);
  let noticePeriod: string | undefined;
  if (rawNoticePeriod) {
    const npLower = rawNoticePeriod.toLowerCase();
    if (npLower.includes('60') || npLower.includes('2 month') || npLower.includes('8 week')) {
      noticePeriod = '60 days';
    } else if (npLower.includes('90') || npLower.includes('3 month') || npLower.includes('12 week')) {
      noticePeriod = '90 days';
    } else if (npLower.includes('30') || npLower.includes('1 month') || npLower.includes('4 week')) {
      noticePeriod = '30 days';
    } else if (npLower.includes('15') || npLower.includes('1-2 week') || npLower.includes('2 week')) {
      noticePeriod = '15 days';
    } else if (npLower.includes('immediate') || npLower.includes('0 day') || npLower.includes('now')) {
      noticePeriod = 'Immediate';
    }
  }

  const rawWorkAuth = toString(data.workAuthorization);
  let workAuthorization: string | undefined;
  if (rawWorkAuth) {
    const waLower = rawWorkAuth.toLowerCase();
    if (waLower.includes('sponsor')) {
      workAuthorization = 'Sponsorship Required';
    } else if (waLower.includes('student') || waLower.includes('permit') || waLower.includes('opt') || waLower.includes('cpt')) {
      workAuthorization = 'Student / On Work Permit';
    } else if (waLower.includes('authoriz') || waLower.includes('citizen') || waLower.includes('permanent') || waLower.includes('eligible')) {
      workAuthorization = 'Authorized';
    }
  }

  return {
    fullName,
    headline,
    phone,
    location,
    timezone,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    yearsOfExperience,
    skills,
    targetRoles,
    targetLocations,
    workMode,
    bio,
    proudProject,
    currentCtc,
    expectedSalary,
    noticePeriod,
    workAuthorization,
  };
}
