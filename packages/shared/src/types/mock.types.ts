export interface MockSession {
  id: string;
  candidate_id: string;
  topic: string;
  difficulty?: string;
  feedback?: Record<string, unknown>;
  score?: number;
  created_at: string;
}

export interface PrepContent {
  id: string;
  org_id?: string;
  job_id?: string;
  content_type: string;
  content: Record<string, unknown>;
  created_at: string;
}
