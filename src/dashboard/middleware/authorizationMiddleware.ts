/**
 * Authorization Middleware
 * Feature: real-time-reports-dashboard
 * Task: 12.2
 * 
 * Role-based access control (RBAC)
 * Regional data filtering for regional managers
 * 
 * Validates: Requirements 12.2, 12.4
 */

import { AuthenticatedUser, UserRole, FilterState } from '../types';

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    analyst: 2,
    regional_manager: 1
  };
  
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: AuthenticatedUser, requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => hasRole(user, role));
}

/**
 * Apply regional data filtering for regional managers
 * Requirement 12.4: Regional managers can only access data from their assigned region
 */
export function applyRegionalFiltering(
  user: AuthenticatedUser,
  filters: FilterState
): FilterState {
  // Admin and analyst can access all regions
  if (user.role === 'admin' || user.role === 'analyst') {
    return filters;
  }
  
  // Regional managers can only access their region
  if (user.role === 'regional_manager' && user.region) {
    return {
      ...filters,
      regions: [user.region]
    };
  }
  
  return filters;
}


/**
 * Check if user can access specific temple data
 */
export function canAccessTemple(user: AuthenticatedUser, templeId: string, templeRegion: string): boolean {
  // Admin and analyst can access all temples
  if (user.role === 'admin' || user.role === 'analyst') {
    return true;
  }
  
  // Regional managers can only access temples in their region
  if (user.role === 'regional_manager') {
    return user.region === templeRegion;
  }
  
  return false;
}

/**
 * Check if user can export data
 */
export function canExportData(user: AuthenticatedUser): boolean {
  // All authenticated users can export data (with regional filtering applied)
  return true;
}

/**
 * Check if user can access admin features
 */
export function canAccessAdminFeatures(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

/**
 * Check if user can view all regions
 */
export function canViewAllRegions(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'analyst';
}

/**
 * Get accessible regions for user
 */
export function getAccessibleRegions(user: AuthenticatedUser, allRegions: string[]): string[] {
  if (canViewAllRegions(user)) {
    return allRegions;
  }
  
  if (user.role === 'regional_manager' && user.region) {
    return [user.region];
  }
  
  return [];
}
