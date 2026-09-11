import { JobStatus } from '../enums';

export interface JobRubric {
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
}

export interface JobThresholds {
  minScore: number;
  autoOffer: boolean;
}

export interface Job {
  id: string;
  org_id: string;
  title: string;
  description: string;
  location?: string;
  salary?: string;
  experienceLevel?: string;
  skills?: string[];
  rubric?: JobRubric;
  thresholds?: JobThresholds;
  pipelineToggles?: Record<string, boolean>;
  stages?: string[];
  status: JobStatus;
  created_at: string;
}
