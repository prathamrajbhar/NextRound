import { ApplicationStatus, DecisionType } from '../enums';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  status: ApplicationStatus;
  scores?: {
    composite: number;
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  created_at: string;
}

export interface Evaluation {
  id: string;
  application_id: string;
  composite_score: number;
  confidence: number;
  decision: DecisionType;
  created_at: string;
}
