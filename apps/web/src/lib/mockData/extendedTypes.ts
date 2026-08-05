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
  question: string;
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
  buddyName: string;
  managerName: string;
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
  similarityScore: number;
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
