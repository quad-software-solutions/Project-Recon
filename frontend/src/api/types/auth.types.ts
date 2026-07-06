export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'other';
  fingerprint?: string;
  user_agent?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  otp: string;
  new_password: string;
}

export interface AuthError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
