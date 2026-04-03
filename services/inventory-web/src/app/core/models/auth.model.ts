export type UserRole = 'manager' | 'salesman';
export type UserStatus = 'active' | 'inactive';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  token: string;
  user: PublicUser;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequestPayload {
  email: string;
}

export interface ForgotPasswordVerifyPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordResetPayload {
  email: string;
  otp: string;
  new_password: string;
}
