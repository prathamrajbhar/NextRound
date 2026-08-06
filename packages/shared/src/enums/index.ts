export enum UserRole {
  HR = 'hr',
  CANDIDATE = 'candidate',
  ADMIN = 'admin',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  ASSESSMENT = 'assessment',
  VOICE_SCREEN = 'voice_screen',
  HR_ROUND = 'hr_round',
  DECISION = 'decision',
  OFFER = 'offer',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export enum DecisionType {
  SHORTLIST = 'shortlist',
  REJECT = 'reject',
  OFFER = 'offer',
}

export enum InterviewType {
  VOICE = 'voice',
  HR = 'hr',
  TECHNICAL = 'technical',
  MOCK = 'mock',
}

export enum AssessmentCategory {
  MCQ = 'mcq',
  CODING = 'coding',
  APTITUDE = 'aptitude',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}
