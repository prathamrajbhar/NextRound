export interface CandidateNotification {
  id: string;
  message: string;
  title?: string;
  read: boolean;
  type: string;
  created_at: string;
  link?: string;
}

export type FilterCategory = 'all' | 'unread';
