/**
 * Unit Tests for ProtectedRoute Component
 */

import { render, screen } from '@testing-library/react';
import { AdminAuthProvider, ProtectedRoute } from '../index';
import AdminAuthContext from '../AdminAuthContext';

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.href = '';
  });

  it('should show loading state while checking authentication', () => {
    const mockContextValue = {
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show error state when authentication fails', () => {
    const mockContextValue = {
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: false,
      error: 'Authentication failed',
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    const mockContextValue = {
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
    expect(window.location.href).toBe('/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when specified', () => {
    const mockContextValue = {
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute redirectTo="/admin/login">
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(window.location.href).toBe('/admin/login');
  });

  it('should show custom fallback when not authenticated', () => {
    const mockContextValue = {
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    const customFallback = <div>Custom Login Prompt</div>;

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute fallback={customFallback}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Custom Login Prompt')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render protected content when authenticated', () => {
    const mockContextValue = {
      isAuthenticated: true,
      adminToken: 'mock_token_123',
      adminUser: {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
      },
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
    expect(screen.queryByText('Redirecting to login...')).not.toBeInTheDocument();
  });

  it('should render multiple children when authenticated', () => {
    const mockContextValue = {
      isAuthenticated: true,
      adminToken: 'mock_token_123',
      adminUser: {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
      },
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    };

    render(
      <AdminAuthContext.Provider value={mockContextValue}>
        <ProtectedRoute>
          <div>Header</div>
          <div>Content</div>
          <div>Footer</div>
        </ProtectedRoute>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should work with AdminAuthProvider wrapper', () => {
    const mockToken = 'mock_token_123';
    const mockUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
    };

    localStorage.setItem('admin_auth_token', mockToken);
    localStorage.setItem('admin_user', JSON.stringify(mockUser));

    render(
      <AdminAuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AdminAuthProvider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
