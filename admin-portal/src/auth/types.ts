/**
 * Admin Authentication Types
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}

export interface AuthState {
  isAuthenticated: boolean;
  adminToken: string | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}
