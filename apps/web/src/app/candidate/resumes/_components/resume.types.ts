export interface GeneratedResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  atsScore?: number;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  experience?: Array<{
    role?: string;
    title?: string;
    company?: string;
    duration?: string;
    period?: string;
    location?: string;
    highlights?: string[];
    bullets?: string[];
  }>;
  skills?: string[] | Array<{ category?: string; items?: string[] }>;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  projects?: Array<{
    title?: string;
    name?: string;
    techStack?: string[];
    tech_stack?: string[];
    description?: string;
    impact?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    dates?: string;
    gpa?: string;
  }>;
  certifications?: string[];
}

export interface ResumeItem {
  id: string;
  targetRole: string;
  targetCompany: string;
  generatedResume: GeneratedResumeData | null;
}

export interface ResumeHistoryItem extends ResumeItem {
  status: string;
  resumePdfUrl: string | null;
  createdAt: string;
  endedAt: string | null;
}
