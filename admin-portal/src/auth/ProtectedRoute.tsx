/**
 * ProtectedRoute Component
 * Wraps routes that require admin authentication
 * Redirects to login page if not authenticated
 */

import React, { ReactNode } from 'react';
import { useAdminAuth } from './useAdminAuth';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes by checking authentication status.
 * Shows loading state while checking auth.
 * Redirects to login or shows fallback if not authenticated.
 * 
 * @param children - Content to render when authenticated
 * @param fallback - Optional custom component to show when not authenticated
 * @param redirectTo - Optional redirect path (default: '/login')
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, loading, error } = useAdminAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-container">
        <div className="protected-route-loading">
          <div className="protected-route-spinner"></div>
          <p className="protected-route-loading-text">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication check failed
  if (error && !isAuthenticated) {
    return (
      <div className="protected-route-container">
        <div className="protected-route-error">
          <h2 className="protected-route-error-title">Authentication Error</h2>
          <p className="protected-route-error-message">{error}</p>
          <button
            className="protected-route-retry-button"
            onClick={() => window.location.href = redirectTo}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default: redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }

    return (
      <div className="protected-route-container">
        <div className="protected-route-redirect">
          <p className="protected-route-redirect-text">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Render protected content when authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
