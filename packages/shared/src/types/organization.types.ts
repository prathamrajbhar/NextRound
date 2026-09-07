export interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
  industry?: string | null;
  size?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
}
