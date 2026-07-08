import { UserProfile } from '../../../shared/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'Student' | 'Instructor';
}

export interface AuthResponse {
  user: UserProfile;
  token?: string;
}
