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
  assessments?: {
    id: string;
    applicationId: string;
    assessmentName: string;
    category: 'aptitude' | 'coding';
    status: 'in_progress' | 'completed' | 'not_started';
    completedDate?: string;
    overallScore?: number;
  }[];
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
