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

  const fullName = toString(data.fullName, data.full_name, data.name, data.candidateName);
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

  const skills = Array.from(new Set(toStringArray(data.skills)));

  let targetRoles = toStringArray(data.targetRoles, data.roles);
  if (targetRoles.length === 0) {
    if (headline) {
      targetRoles.push(headline);
    }
    if (skills.includes('React') || skills.includes('TypeScript') || skills.includes('Node.js')) {
      targetRoles.push('Full-Stack Engineer');
    }
    if (skills.includes('Python') || skills.includes('FastAPI') || skills.includes('LangChain') || skills.includes('PyTorch')) {
      targetRoles.push('AI/ML Engineer');
    }
    targetRoles = Array.from(new Set(targetRoles));
  }

  const targetLocations = toStringArray(data.targetLocations);
  const yearsOfExperience = toNumber(data.yearsOfExperience, data.experienceYears);

  const workModeStr = toString(data.workMode);
  const workMode = ['Remote', 'Hybrid', 'Onsite'].includes(workModeStr || '')
    ? (workModeStr as 'Remote' | 'Hybrid' | 'Onsite')
    : undefined;

  let bio = toString(data.bio, data.summary, data.professionalSummary);
  if (bio && (bio.includes('@') || bio.includes('+91') || bio.includes('http'))) {
    bio = bio
      .split('\n')
      .filter((line) => !line.includes('@') && !line.includes('+') && !line.includes('http') && line.length > 15)
      .join(' ')
      .trim();
  }

  const proudProject = toString(data.proudProject, data.keyProject, data.featuredProject);
  const currentCtc = toNumber(data.currentCtc);
  const expectedSalary = toNumber(data.expectedSalary);
  const noticePeriod = toString(data.noticePeriod);
  const workAuthorization = toString(data.workAuthorization);

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
