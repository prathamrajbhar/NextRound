export interface DynamicConversationTurn {
  id: number;
  aiMessage: string;
  topicTag: string;
  simulatedUserAnswer: string;
  extractedInsights: {
    type: 'Experience' | 'Metric' | 'Skill' | 'Project';
    label: string;
    value: string;
  }[];
}

export interface GeneratedResumeItem {
  id: string;
  targetRole: string;
  createdAt: string;
  resumePdfUrl?: string;
}

export interface ATSResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  atsScore: number;
  scoreBreakdown: {
    label: string;
    score: number;
    description: string;
  }[];
  experience: {
    company: string;
    role: string;
    location: string;
    period: string;
    highlights: string[];
  }[];
  projects: {
    title: string;
    techStack: string[];
    description: string;
    impact: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  certifications: string[];
  languages?: string[];
  awards?: string[];
  careerObjective?: string;
  pdfUrl?: string;
}
