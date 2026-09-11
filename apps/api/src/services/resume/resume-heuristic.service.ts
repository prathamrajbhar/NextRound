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
