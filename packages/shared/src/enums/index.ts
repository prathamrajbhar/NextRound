export enum UserRole {
  HR = 'hr',
  CANDIDATE = 'candidate',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  SCREENING_COMPLETED = 'screening_completed',
  ASSESSMENT = 'assessment',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  EVALUATION = 'evaluation',
  HR_ROUND = 'hr_round',
  DECIDED = 'decided',
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
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
  PUBLISHED = 'published',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  DELETED = 'deleted',
}
