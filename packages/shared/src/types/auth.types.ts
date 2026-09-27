import { UserRole } from '../enums';

export interface UserPublic {
  id: string;
  email: string;
  name?: string | null;
  role: 'hr' | 'candidate';
  org_id?: string | null;
  orgName?: string | null;
  created_at: string;
  must_change_password?: boolean;
}

export interface AuthResponse {
  user: UserPublic;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  org_id?: string | null;
  orgName?: string | null;
  created_at: string;
  must_change_password?: boolean;
}
