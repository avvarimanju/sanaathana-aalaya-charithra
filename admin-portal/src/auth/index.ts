/**
 * Admin Authentication Module
 * Exports all authentication-related components, hooks, and types
 */

export { AdminAuthProvider } from './AdminAuthContext';
export { default as AdminAuthContext } from './AdminAuthContext';
export { useAdminAuth } from './useAdminAuth';
export { ProtectedRoute } from './ProtectedRoute';
export type { AdminUser, AuthState, LoginCredentials, LoginResponse } from './types';
