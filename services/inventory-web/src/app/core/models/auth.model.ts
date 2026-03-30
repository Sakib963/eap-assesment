export interface PublicUser {
  id: string;
  email: string;
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
}

export interface LoginRequest {
  email: string;
  password: string;
}
