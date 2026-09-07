import { normalizeResumeText } from './resume-extractor.service';
import { sanitizeParsedData } from './resume-sanitize.service';

export { sanitizeParsedData };

export interface ParsedResumeData {
  fullName?: string;
  headline?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  skills: string[];
  targetRoles: string[];
  targetLocations?: string[];
  workMode?: 'Remote' | 'Hybrid' | 'Onsite';
  currentCtc?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  workAuthorization?: string;
  bio?: string;
  proudProject?: string;
  workValues?: string[];
}

export function fallbackHeuristicParsing(rawText: string): ParsedResumeData {
  const normalized = normalizeResumeText(rawText);
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);

  let fullName: string | undefined;
  let headline: string | undefined;

  for (const line of lines.slice(0, 6)) {
    if (
      !fullName &&
      line.length >= 2 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/resume|curriculum|cv|summary|experience|education|skills|projects|contact/i.test(line)
    ) {
      fullName = line.replace(/^[^\w]+|[^\w]+$/g, '');
      continue;
    }
    if (
      fullName &&
      !headline &&
      line.length >= 3 &&
      line.length <= 60 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/summary|experience|education|skills|projects|contact/i.test(line)
    ) {
      headline = line;
      break;
    }
  }

  const locationMatch = normalized.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s*\d{5,6})?)/);
  const location = locationMatch ? locationMatch[1] : undefined;

  const linkedinMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:tech|io|dev|com|me|design)/i);
  const phoneMatch = normalized.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  const dateYears = normalized.match(/\b(20\d{2})\b/g);
  let yearsOfExperience: number | undefined;
  if (dateYears && dateYears.length >= 2) {
    const years = dateYears.map(Number).sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = new Date().getFullYear();
    yearsOfExperience = Math.min(Math.max(maxYear - minYear, 1), 30);
  }

  const skills: string[] = [];
  const commonSkills = [
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Express.js', 'FastAPI', 'Python', 'Go',
    'Java', 'C++', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'GCP', 'GraphQL', 'REST API', 'Tailwind', 'Git', 'LangChain', 'PyTorch'
  ];

  commonSkills.forEach((skill) => {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      skills.push(skill);
    }
  });

  const targetRoles: string[] = [];
  if (headline) targetRoles.push(headline);
  if (skills.includes('React') || skills.includes('Next.js')) targetRoles.push('Full-Stack Engineer');
  if (skills.includes('Python') || skills.includes('FastAPI')) targetRoles.push('AI/ML Engineer');

  let bio: string | undefined;
  const summaryIdx = normalized.search(/PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT ME/i);
  if (summaryIdx !== -1) {
    const snippet = normalized.slice(summaryIdx, summaryIdx + 500);
    bio = snippet
      .replace(/PROFESSIONAL SUMMARY|SUMMARY|PROFILE|ABOUT ME/i, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 20 && !line.includes('@') && !line.includes('http') && !line.includes('+91'))
      .join(' ')
      .trim();
  }
  if (!bio || bio.length < 20) {
    bio = '';
  }

  let proudProject: string | undefined;
  const projectIdx = normalized.search(/PROJECTS|FEATURED PROJECTS|KEY PROJECTS|EXPERIENCE/i);
  if (projectIdx !== -1) {
    const snippet = normalized.slice(projectIdx, projectIdx + 600);
    proudProject = snippet
      .replace(/PROJECTS|FEATURED PROJECTS|KEY PROJECTS|EXPERIENCE/i, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 20 && !line.includes('@') && !line.includes('http'))
      .slice(0, 4)
      .join(' ')
      .trim();
  }
  if (!proudProject || proudProject.length < 20) {
    proudProject = '';
  }

  return {
    fullName,
    headline,
    location,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : undefined,
    githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : undefined,
    portfolioUrl: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : undefined,
    yearsOfExperience,
    skills,
    targetRoles: Array.from(new Set(targetRoles)),
    bio,
    proudProject,
  };
}
