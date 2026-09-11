import { UserRole } from '../enums';

export interface UserPublic {
  id: string;
  email: string;
  role: 'hr' | 'candidate';
  org_id?: string | null;
  created_at: string;
  must_change_password?: boolean;
}

export interface AuthResponse {
  user: UserPublic;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  org_id?: string | null;
  created_at: string;
  must_change_password?: boolean;
}
