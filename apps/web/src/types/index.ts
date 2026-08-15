
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string | { message: string; code?: string; details?: unknown } | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}


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
  status: 'active' | 'published' | 'draft' | 'closed' | 'paused' | 'deleted';
  location: string;
  department?: string;
  salary: string;
  experienceLevel: string;
  postedDate: string;
  applicantsCount: number;
  skills?: string[];
  stages?: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
  assessmentConfig?: {
    mcqCount: number;
    codingProblemId: string;
    passingScore: number;
    mcqDistribution?: Record<string, number>;
  };
}

export type HRRoundStatus = 'PENDING' | 'SCHEDULED' | 'PASSED' | 'FAILED';

export type ApplicationStatus =
  | 'applied'
  | 'sourced'
  | 'screening'
  | 'screening_completed'
  | 'assessment'
  | 'interview_scheduled'
  | 'interviewed'
  | 'voice_screen'
  | 'evaluation'
  | 'hr_round'
  | 'decided'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'hired'
  | 'withdrawn';

export interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  status: ApplicationStatus;
  stage: 'Sourced' | 'Screened' | 'Assessment' | 'Interview' | 'HR Round' | 'Panel' | 'Decision';
  hrRoundStatus?: HRRoundStatus;
  hrRoundScheduledAt?: string;
  hrRoundCompletedAt?: string;
  interviewScheduledAt?: string;
  screenedDate?: string;
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
  reasoning?: string;
  decision?: 'hire' | 'reject' | 'hold';
  transcript?: { question: string; answer: string; score: number; feedback: string }[];
  audioUrl?: string;
  proctorFlags?: { timestamp: string; type: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  engagementSignal?: { eyeContact: number; speakingRate: string; confidenceScore: number };
  scheduledSlots?: string[];
  confirmedSlot?: string;
  yearsOfExperience?: number;
  location?: string;
  noticePeriod?: string;
  expectedSalary?: number;
  workExperience?: { company: string; role: string; duration: string; description?: string }[];
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

export interface Notification {
  id: string;
  type: 'pipeline' | 'decision' | 'alert' | 'interview' | 'offer' | 'shortlist' | 'system';
  text: string;
  time: string;
  link: string;
  read: boolean;
}

export interface OfferNegotiationMessage {
  id: string;
  author: 'candidate' | 'hr';
  message: string;
  timestamp: string;
  proposedSalary?: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  status: 'draft' | 'sent' | 'negotiating' | 'accepted' | 'declined' | 'expired';
  baseSalary: string;
  bonus: string;
  equity: string;
  joiningDate: string;
  expiryDate: string;
  benefits: string[];
  negotiationHistory: OfferNegotiationMessage[];
  letterUrl: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  starterCode: {
    javascript: string;
    typescript: string;
    python: string;
    java: string;
    cpp: string;
  };
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    description: string;
  }[];
}

export interface AssessmentResult {
  id: string;
  applicationId: string;
  candidateName: string;
  assessmentName: string;
  category: 'aptitude' | 'psychometric';
  status: 'not_started' | 'in_progress' | 'completed';
  completedDate?: string;
  durationMinutes: number;
  overallScore?: number;
  percentile?: number;
  sectionScores?: { section: string; score: number; benchmark: number }[];
  traits?: { trait: string; score: number; description: string }[];
}

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  passed: boolean;
}

export interface OnboardingTask {
  id: string;
  title: string;
  category: 'paperwork' | 'equipment' | 'access' | 'training' | 'social';
  owner: 'HR' | 'IT' | 'Manager' | 'New Hire';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}

export interface OnboardingRecord {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  orgName: string;
  startDate: string;
  
  buddyName: string | null;
  managerName: string | null;
  progressPercent: number;
  tasks: OnboardingTask[];
}

export interface CandidateProfileData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  targetCompensation?: string;
  workAuthorization?: string;
  resumeUrl?: string;
}

export interface HRDashboardData {
  activeJobsCount: number;
  totalApplicationsCount: number;
  decisionsCount: { hire: number; hold: number; reject: number };
  recentApplications: Application[];
  pipelineSummary: { stage: string; count: number }[];
}

export interface CandidateDashboardData {
  activeApplications: Application[];
  upcomingInterviews: { id: string; jobTitle: string; date: string; type: string }[];
  recentMockSessions: MockSession[];
  recommendedJobs: Job[];
}

export interface CandidateSentimentProfile {
  id: string;
  candidateName: string;
  role: string;
  avatar: string;
  interviewDate: string;
  hasAudioAnalysis: boolean;
  audioUrl: string | null;
  durationMinutes: number | null;
  overallTone: string | null;
  overallStressScore: number | null;
  confidenceRating: number | null;
  speechClarityScore: number | null;
  avgPauseDurationSec: number | null;
  biomarkers: {
    audioTone: {
      steadyPercent: number;
      tremorPercent: number;
      status: 'Steady & Calm' | 'Mild Anxiety' | 'Highly Stressed';
    };
    speechPace: {
      wpm: number;
      idealRange: string;
      status: 'Optimal' | 'Rushed' | 'Hesitant';
    };
    pitchVariation: {
      hzStdDev: number;
      status: 'Dynamic & Natural' | 'Monotone' | 'High Pitch Spikes';
    };
    pausePatterns: {
      pausesPerMin: number;
      longPauseCount: number;
      status: 'Natural Cadence' | 'Frequent Pauses' | 'Blocking Stalls';
    };
  } | null;
  journeyGraph: {
    timeLabel: string;
    minute: number;
    confidence: number;
    stress: number;
    hesitation: number;
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed';
  }[];
}

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
  pdfUrl?: string;
}
