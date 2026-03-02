/**
 * Unit Tests for useAdminAuth Hook
 */

import { renderHook, act } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '../index';
import { adminDefectApi } from '../../api/adminDefectApi';

// Mock the adminDefectApi
jest.mock('../../api/adminDefectApi', () => ({
  adminDefectApi: {
    setAdminToken: jest.fn(),
    clearAdminToken: jest.fn(),
  },
}));

describe('useAdminAuth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should throw error when used outside AdminAuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useAdminAuth());
    }).toThrow('useAdminAuth must be used within an AdminAuthProvider');

    consoleSpy.mockRestore();
  });

  it('should provide auth context when used inside AdminAuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.adminToken).toBeNull();
    expect(result.current.adminUser).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshAuth).toBe('function');
  });

  it('should restore authentication from localStorage on mount', () => {
    const mockToken = 'mock_token_123';
    const mockUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
    };

    localStorage.setItem('admin_auth_token', mockToken);
    localStorage.setItem('admin_user', JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.adminToken).toBe(mockToken);
    expect(result.current.adminUser).toEqual(mockUser);
    expect(adminDefectApi.setAdminToken).toHaveBeenCalledWith(mockToken);
  });

  it('should handle login successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'admin@example.com',
        password: 'password123',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.adminToken).toBeTruthy();
    expect(result.current.adminUser).toBeTruthy();
    expect(result.current.adminUser?.email).toBe('admin@example.com');
    expect(adminDefectApi.setAdminToken).toHaveBeenCalled();
  });

  it('should handle login failure', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login({
          email: 'admin@example.com',
          password: 'short', // Too short, will fail
        });
      })
    ).rejects.toThrow();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.adminToken).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should handle logout', async () => {
    const mockToken = 'mock_token_123';
    const mockUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
    };

    localStorage.setItem('admin_auth_token', mockToken);
    localStorage.setItem('admin_user', JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    // Verify initial authenticated state
    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.adminToken).toBeNull();
    expect(result.current.adminUser).toBeNull();
    expect(localStorage.getItem('admin_auth_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
    expect(adminDefectApi.clearAdminToken).toHaveBeenCalled();
  });

  it('should handle refreshAuth', () => {
    const mockToken = 'mock_token_123';
    const mockUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false);

    // Set token in localStorage
    localStorage.setItem('admin_auth_token', mockToken);
    localStorage.setItem('admin_user', JSON.stringify(mockUser));

    // Refresh auth
    act(() => {
      result.current.refreshAuth();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.adminToken).toBe(mockToken);
    expect(result.current.adminUser).toEqual(mockUser);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('admin_auth_token', 'valid_token');
    localStorage.setItem('admin_user', 'invalid_json{');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should set loading state during login', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    );

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    let loadingDuringLogin = false;

    const loginPromise = act(async () => {
      const promise = result.current.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      // Check loading state immediately after calling login
      loadingDuringLogin = result.current.loading;

      await promise;
    });

    await loginPromise;

    expect(loadingDuringLogin).toBe(true);
    expect(result.current.loading).toBe(false);
  });
});
