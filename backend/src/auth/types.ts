/**
 * Authentication Types
 * 
 * Type definitions for the authentication system
 */

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  status: 'ACTIVE' | 'DEACTIVATED' | 'PENDING_ACTIVATION';
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
  mfaEnabled: boolean;
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
  ANALYTICS_VIEWER = 'ANALYTICS_VIEWER',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN'
}

export enum Permission {
  MANAGE_TEMPLES = 'MANAGE_TEMPLES',
  MANAGE_ARTIFACTS = 'MANAGE_ARTIFACTS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_SYSTEM_CONFIG = 'MANAGE_SYSTEM_CONFIG',
  VIEW_LOGS = 'VIEW_LOGS',
  MODERATE_CONTENT = 'MODERATE_CONTENT'
}

export interface AuthCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  permissions: Permission[];
  role: AdminRole;
  createdAt: number;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  user?: AdminUser;
  error?: string;
  requiresMfa?: boolean;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: AuthSession;
  user?: AdminUser;
  error?: string;
}

export const PERMISSIONS_BY_ROLE: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    Permission.MANAGE_TEMPLES,
    Permission.MANAGE_ARTIFACTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_SYSTEM_CONFIG,
    Permission.VIEW_LOGS,
    Permission.MODERATE_CONTENT,
  ],
  [AdminRole.CONTENT_ADMIN]: [
    Permission.MANAGE_TEMPLES,
    Permission.MANAGE_ARTIFACTS,
    Permission.VIEW_ANALYTICS,
    Permission.MODERATE_CONTENT,
  ],
  [AdminRole.ANALYTICS_VIEWER]: [
    Permission.VIEW_ANALYTICS,
  ],
  [AdminRole.SUPPORT_ADMIN]: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_LOGS,
    Permission.MANAGE_USERS,
  ],
};