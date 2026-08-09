// Standard API Envelope
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

// Core Entity Types
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
  type: 'pipeline' | 'decision' | 'alert' | 'interview' | 'offer' | 'shortlist' | 'system';
  text: string;
  time: string;
  link: string;
  read: boolean;
}

// Extended Pipeline & Feature Types
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

export interface ReferenceCheck {
  id: string;
  applicationId: string;
  candidateName: string;
  refereeName: string;
  refereeTitle: string;
  refereeRelationship: string;
  status: 'pending' | 'sent' | 'completed' | 'declined';
  requestedDate: string;
  completedDate?: string;
  ratings?: { category: string; score: number }[];
  summary?: string;
  wouldRehire?: boolean;
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

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'numerical' | 'personality_scale';
  prompt: string;
  options?: string[];
  timeLimitSeconds: number;
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

export interface InterviewRound {
  id: string;
  applicationId: string;
  candidateName: string;
  roundNumber: number;
  roundType: 'ai_voice_screen' | 'live_coding' | 'system_design' | 'panel' | 'take_home';
  title: string;
  status: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  durationMinutes: number;
  interviewers?: { name: string; title: string; avatar: string }[];
  score?: number;
  feedback?: string;
  codingProblem?: {
    title: string;
    prompt: string;
    starterCode: string;
    language: string;
    testCases: CodingTestCase[];
    candidateCode: string;
  };
  systemDesignPrompt?: string;
  systemDesignNotes?: string;
  panelFeedback?: { interviewer: string; rating: number; comment: string }[];
}

export interface AsyncVideoResponse {
  questionId: string;
  questionText: string;
  timeLimitSeconds?: number;
  videoUrl: string;
  durationSeconds: number;
  attempts: number;
  aiSummary: string;
}

export interface AsyncScreening {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  orgName?: string;
  status: 'invited' | 'in_progress' | 'submitted' | 'reviewed';
  invitedDate: string;
  submittedDate?: string;
  deadline: string;
  responses: AsyncVideoResponse[];
  reviewScore?: number;
  reviewerNotes?: string;
}

export interface TakeHomeProject {
  id: string;
  applicationId: string;
  candidateName: string;
  title: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded';
  assignedDate: string;
  dueDate: string;
  submittedDate?: string;
  repoUrl?: string;
  rubric: { criterion: string; weight: number; score?: number }[];
  overallScore?: number;
  reviewerNotes?: string;
}

export interface TalentPoolCandidate {
  id: string;
  name: string;
  avatar: string;
  currentTitle: string;
  currentCompany: string;
  location: string;
  skills: string[];
  source: 'LinkedIn' | 'Referral' | 'GitHub' | 'Job Board' | 'Conference' | 'Inbound';
  sourcedDate: string;
  tags: string[];
  status: 'new' | 'contacted' | 'responded' | 'in_pipeline' | 'not_interested' | 'silver_medalist';
  matchScore: number;
  notes?: string;
  lastContactDate?: string;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'system_design' | 'coding' | 'culture_fit';
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  usageCount: number;
  avgScore: number;
  idealAnswerNotes: string;
  createdBy: string;
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
  // Null when no buddy/manager has been assigned yet (honest "not assigned").
  buddyName: string | null;
  managerName: string | null;
  progressPercent: number;
  tasks: OnboardingTask[];
}

export interface PortfolioProject {
  title: string;
  description: string;
  tags: string[];
  link?: string;
}

export interface CandidatePortfolio {
  slug: string;
  applicationId: string;
  name: string;
  avatar: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  yearsExperience: number;
  achievements: string[];
  projects: PortfolioProject[];
  verifiedScores: { label: string; score: number }[];
  socialLinks: { label: string; url: string }[];
  isPublic: boolean;
}

export interface SimilarCandidate {
  applicationId: string;
  name: string;
  avatar: string;
  similarityScore: number | null;
  outcome: 'hired_success' | 'hired_underperformed' | 'rejected' | 'in_progress';
  sharedTraits: string[];
  jobTitle: string;
  orgName: string;
}

export interface SuccessPrediction {
  applicationId: string;
  successProbability: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  contributingFactors: { factor: string; impact: 'positive' | 'negative'; weight: number }[];
  similarCandidates: SimilarCandidate[];
  retentionForecast12mo: number;
  performanceForecast: 'top_performer' | 'strong' | 'average' | 'risk';
}

export interface HighlightClip {
  id: string;
  applicationId: string;
  timestamp: string;
  durationSeconds: number;
  label: string;
  question: string;
  transcriptSnippet: string;
  score: number;
  tag: 'strongest_answer' | 'technical_depth' | 'communication' | 'problem_solving';
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
  durationMinutes: number;
  overallStressScore: number;
  confidenceRating: number;
  speechClarityScore: number;
  avgPauseDurationSec: number;
  biomarkers: {
    audioTone: {
      steadyPercent: number;
      tremorPercent: number;
      status: 'Steady & Calm' | 'Mild Anxiety' | 'Highly Stressed';
    };
    speechPace: {
      wpm: number;
      idealRange: string;
      status: 'Optimal (145 WPM)' | 'Rushed (185 WPM)' | 'Hesitant (105 WPM)';
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
  };
  journeyGraph: {
    time: string;
    minute: number;
    topic: string;
    confidence: number;
    stress: number;
    hesitation: number;
    emotionLabel: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed' | 'Enthusiastic';
  }[];
  transcriptWithSentiment: {
    id: number;
    timestamp: string;
    topic: string;
    speaker: 'AI Agent' | 'Candidate';
    text: string;
    emotion: 'Confident' | 'Neutral' | 'Hesitant' | 'Stressed' | 'Enthusiastic';
    audioMetrics: {
      pitch: string;
      pace: string;
      tone: string;
    };
    hrInsight?: {
      type: 'Nervousness' | 'Skill Gap' | 'High Mastery';
      title: string;
      explanation: string;
    };
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
}
