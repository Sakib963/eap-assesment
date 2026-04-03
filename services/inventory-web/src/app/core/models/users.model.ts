export type UserRole = 'manager' | 'salesman';
export type UserStatus = 'active' | 'inactive';

export interface UserRecord {
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

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}
