/**
 * Admin Authentication Context
 * Provides authentication state and methods throughout the admin dashboard
 */

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { adminDefectApi } from '../api/adminDefectApi';
import { AdminUser, AuthState, LoginCredentials, LoginResponse } from './types';

interface AdminAuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'admin_auth_token';
const USER_STORAGE_KEY = 'admin_user';

interface AdminAuthProviderProps {
  children: ReactNode;
}

/**
 * Admin Authentication Provider Component
 * Manages authentication state and token storage
 */
export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    adminToken: null,
    adminUser: null,
    loading: true,
    error: null,
  });

  /**
   * Initialize authentication from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          const user: AdminUser = JSON.parse(storedUser);
          
          // Set token in API client
          adminDefectApi.setAdminToken(storedToken);

          setAuthState({
            isAuthenticated: true,
            adminToken: storedToken,
            adminUser: user,
            loading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState({
          isAuthenticated: false,
          adminToken: null,
          adminUser: null,
          loading: false,
          error: 'Failed to restore authentication session',
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login with credentials
   * In a real implementation, this would call an authentication API
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // TODO: Replace with actual authentication API call
      // For now, this is a placeholder that simulates an API call
      const response = await mockLoginAPI(credentials);

      // Store token and user in localStorage
      localStorage.setItem(STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));

      // Set token in API client
      adminDefectApi.setAdminToken(response.token);

      setAuthState({
        isAuthenticated: true,
        adminToken: response.token,
        adminUser: response.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setAuthState({
        isAuthenticated: false,
        adminToken: null,
        adminUser: null,
        loading: false,
        error: errorMessage,
      });

      throw error;
    }
  }, []);

  /**
   * Logout and clear authentication state
   */
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    // Clear token from API client
    adminDefectApi.clearAdminToken();

    setAuthState({
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: false,
      error: null,
    });
  }, []);

  /**
   * Refresh authentication state (useful after token refresh)
   */
  const refreshAuth = useCallback(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken && storedUser) {
      const user: AdminUser = JSON.parse(storedUser);
      adminDefectApi.setAdminToken(storedToken);

      setAuthState({
        isAuthenticated: true,
        adminToken: storedToken,
        adminUser: user,
        loading: false,
        error: null,
      });
    }
  }, []);

  const value: AdminAuthContextValue = {
    ...authState,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

/**
 * Mock login API for demonstration
 * TODO: Replace with actual authentication API integration
 */
async function mockLoginAPI(credentials: LoginCredentials): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock validation
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required');
  }

  // Mock authentication (replace with real API call)
  if (credentials.password.length < 6) {
    throw new Error('Invalid credentials');
  }

  // Return mock response
  return {
    token: `mock_token_${Date.now()}`,
    user: {
      id: 'admin-123',
      email: credentials.email,
      name: 'Admin User',
      role: 'admin',
    },
  };
}

export default AdminAuthContext;
