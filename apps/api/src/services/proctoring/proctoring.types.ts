export interface CreateSessionInput {
  id: string;
  candidate_id: string;
  session_type: 'aptitude' | 'coding' | 'video' | 'interview';
  assessment_id?: string | null;
  application_id?: string | null;
  mock_session_id?: string | null;
  policy_version: string;
  consent_version: string;
}

export interface EventInput {
  client_event_id: string;
  client_sequence: number;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: string;
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json?: unknown | null;
}
