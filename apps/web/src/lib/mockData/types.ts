export interface Job {
  id: string;
  orgId: string;
  orgName: string;
  orgLogo: string;
  title: string;
  description: string;
  rubric: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  thresholds: {
    minScore: number;
    autoOffer: boolean;
  };
  status: 'active' | 'draft' | 'closed';
  location: string;
  department?: string;
  salary: string;
  experienceLevel: string;
  postedDate: string;
  applicantsCount: number;
  stages?: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
  assessmentConfig?: {
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
  };
}

export type HRRoundStatus = 'PENDING' | 'SCHEDULED' | 'PASSED' | 'FAILED';

export interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  status: 'sourced' | 'screening' | 'interview_scheduled' | 'interviewed' | 'hr_round' | 'decided';
  stage: 'Sourced' | 'Screened' | 'Assessment' | 'Interview' | 'HR Round' | 'Panel' | 'Decision';
  hrRoundStatus?: HRRoundStatus;
  hrRoundScheduledAt?: string;
  hrRoundCompletedAt?: string;
  appliedDate: string;
  resumeUrl: string;
  skills: string[];
  targetRoles: string[];
  scores?: {
    composite: number;
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
    confidence: number;
  };
  biasReport?: {
    overallScore: number;
    flaggedPhrases: { phrase: string; category: string; explanation: string }[];
    genderBiasCheck: string;
    originBiasCheck: string;
    explanation: string;
  };
  reasoning?: string;
  decision?: 'hire' | 'reject' | 'hold';
  transcript?: { question: string; answer: string; score: number; feedback: string }[];
  audioUrl?: string;
  proctorFlags?: { timestamp: string; type: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  engagementSignal?: { eyeContact: number; speakingRate: string; confidenceScore: number };
  scheduledSlots?: string[];
  confirmedSlot?: string;
}

export interface MockSession {
  id: string;
  targetCompany: string;
  targetRole: string;
  difficulty: 'junior' | 'mid' | 'senior';
  rubric: { technical: number; communication: number; cultureFit: number };
  score: number;
  date: string;
  feedback: string;
  transcript: { question: string; answer: string; feedback: string }[];
}

export interface PrepContent {
  id: string;
  companyName: string;
  logo: string;
  roleArchetype: string;
  difficulty: string;
  cultureNotes: string;
  questions: { question: string; tip: string; sampleAnswer: string }[];
}

export interface Notification {
  id: string;
  type: 'pipeline' | 'decision' | 'alert' | 'interview' | 'offer';
  text: string;
  time: string;
  link: string;
  read: boolean;
}
