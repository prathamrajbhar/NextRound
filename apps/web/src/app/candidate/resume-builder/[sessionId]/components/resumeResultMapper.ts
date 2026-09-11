import { ATSResumeData } from '@/types';

export interface RawResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  atsScore?: number;
  ats_score?: number;
  scoreBreakdown?: { label: string; score: number; description: string }[];
  score_breakdown?: { label: string; score: number; description: string }[];
  work_history?: {
    title?: string;
    role?: string;
    company?: string;
    dates?: string;
    period?: string;
    location?: string;
    bullets?: string[];
    highlights?: string[];
  }[];
  experience?: {
    title?: string;
    role?: string;
    company?: string;
    dates?: string;
    period?: string;
    location?: string;
    bullets?: string[];
    highlights?: string[];
  }[];
  skills?: string[] | { category: string; items: string[] }[];
  projects?: {
    name?: string;
    title?: string;
    description?: string;
    techStack?: string[];
    tech_stack?: string[];
    impact?: string;
  }[];
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    dates?: string;
    gpa?: string;
    relevant_coursework?: string[];
  }[];
  certifications?: string[] | { name?: string; issuer?: string; year?: string }[];
  languages?: string[] | { language?: string; proficiency?: string }[];
  awards?: string[] | { title?: string; issuer?: string; year?: string }[];
  career_objective?: string;
}

export function mapRawToAtsResume(
  raw: RawResumeData,
  targetRole: string,
  pdfUrl?: string
): ATSResumeData {
  const contact = raw.contact || {};

  return {
    name: contact.name || raw.name || '',
    title: raw.title || targetRole,
    email: contact.email || raw.email || '',
    phone: contact.phone || raw.phone || '',
    location: contact.location || raw.location || '',
    linkedin: contact.linkedin || raw.linkedin || '',
    github: contact.github || raw.github || '',
    portfolio: contact.portfolio || raw.portfolio || '',
    summary: raw.summary || '',
    atsScore: raw.atsScore ?? raw.ats_score ?? 0,
    scoreBreakdown: raw.scoreBreakdown ?? raw.score_breakdown ?? [],
    experience: (raw.work_history || raw.experience || []).map((exp) => ({
      role: exp.role || exp.title || '',
      company: exp.company || '',
      period: exp.period || exp.dates || '',
      location: exp.location || 'Remote',
      highlights: exp.highlights || exp.bullets || [],
    })),
    projects: (raw.projects || []).map((proj) => ({
      title: proj.title || proj.name || '',
      techStack: proj.techStack || proj.tech_stack || [],
      description: proj.description || '',
      impact: proj.impact || proj.description || '',
    })),
    skills: Array.isArray(raw.skills)
      ? typeof raw.skills[0] === 'string'
        ? [{ category: 'Core Competencies', items: raw.skills as string[] }]
        : (raw.skills as { category: string; items: string[] }[])
      : [],
    education: (raw.education || []).map((edu) => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      year: edu.year || edu.dates || '',
      gpa: edu.gpa || undefined,
    })),
    certifications: (raw.certifications || []).map((c) =>
      typeof c === 'string' ? c : [c.name, c.issuer, c.year].filter(Boolean).join(' — ')
    ),
    languages: (raw.languages || []).map((l) =>
      typeof l === 'string' ? l : `${l.language || ''}${l.proficiency ? ` (${l.proficiency})` : ''}`
    ),
    awards: (raw.awards || []).map((a) =>
      typeof a === 'string' ? a : [a.title, a.issuer, a.year].filter(Boolean).join(' — ')
    ),
    careerObjective: raw.career_objective || undefined,
    pdfUrl: pdfUrl || undefined,
  };
}
