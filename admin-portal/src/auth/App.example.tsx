/**
 * Example: Admin Dashboard App with Authentication
 * 
 * This example demonstrates how to integrate the authentication module
 * into the admin dashboard application.
 */

import React from 'react';
import { AdminAuthProvider, ProtectedRoute, useAdminAuth } from './index';
import { DefectListPage } from '../pages/DefectListPage';
import { DefectDetailPage } from '../pages/DefectDetailPage';

/**
 * Example Login Page Component
 */
function LoginPage() {
  const { login, loading, error } = useAdminAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login({ email, password });
      // Redirect to dashboard after successful login
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '8px' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '8px' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>
        {(loginError || error) && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {loginError || error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

/**
 * Example Dashboard Layout with Navigation
 */
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { adminUser, logout } = useAdminAuth();

  return (
    <div>
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Welcome, {adminUser?.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <nav style={{
        backgroundColor: '#34495e',
        padding: '12px 16px',
      }}>
        <a href="/admin/defects" style={{ color: 'white', marginRight: '16px' }}>
          Defects
        </a>
        <a href="/admin/analytics" style={{ color: 'white', marginRight: '16px' }}>
          Analytics
        </a>
      </nav>
      <main style={{ padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}

/**
 * Example: Simple Router Component
 * In a real app, use React Router or similar
 */
function SimpleRouter() {
  const path = window.location.pathname;

  if (path === '/admin/login') {
    return <LoginPage />;
  }

  if (path === '/admin/defects') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <DefectListPage />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (path.startsWith('/admin/defects/')) {
    const defectId = path.split('/').pop();
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <DefectDetailPage defectId={defectId || ''} />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Default: redirect to defects list
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DefectListPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/**
 * Main App Component with Authentication Provider
 */
export function App() {
  return (
    <AdminAuthProvider>
      <SimpleRouter />
    </AdminAuthProvider>
  );
}

/**
 * Example: Using authentication in a component
 */
export function ExampleComponent() {
  const { isAuthenticated, adminUser, adminToken, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>User Info</h2>
      <p>ID: {adminUser?.id}</p>
      <p>Email: {adminUser?.email}</p>
      <p>Name: {adminUser?.name}</p>
      <p>Role: {adminUser?.role}</p>
      <p>Token: {adminToken?.substring(0, 20)}...</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

/**
 * Example: Protected Route with Custom Fallback
 */
export function ExampleProtectedRoute() {
  const customFallback = (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Access Denied</h2>
      <p>You must be logged in as an administrator to view this page.</p>
      <a href="/admin/login">Go to Login</a>
    </div>
  );

  return (
    <ProtectedRoute fallback={customFallback}>
      <div>
        <h1>Protected Content</h1>
        <p>This content is only visible to authenticated administrators.</p>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Example: Conditional Rendering Based on Auth State
 */
export function ExampleConditionalRendering() {
  const { isAuthenticated, loading, adminUser } = useAdminAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome back, {adminUser?.name}!</h2>
          <p>You have access to all admin features.</p>
        </div>
      ) : (
        <div>
          <h2>Welcome, Guest</h2>
          <p>Please log in to access admin features.</p>
          <a href="/admin/login">Login</a>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using Authentication with React Router
 */
/*
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export function AppWithRouter() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/defects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DefectListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/defects/:defectId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DefectDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/admin/defects" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
*/

export default App;
