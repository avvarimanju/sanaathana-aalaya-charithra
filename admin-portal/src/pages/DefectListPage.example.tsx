/**
 * DefectListPage Usage Example
 * 
 * This file demonstrates how to integrate the DefectListPage component
 * into your React application with React Router.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DefectListPage from './DefectListPage';
import { adminDefectApi } from '../api/adminDefectApi';

/**
 * Example App Component with Routing
 */
export const ExampleApp: React.FC = () => {
  // Set admin token (in real app, this would come from authentication)
  React.useEffect(() => {
    const adminToken = 'your-admin-jwt-token-here';
    adminDefectApi.setAdminToken(adminToken);
  }, []);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Navigation Bar */}
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>Admin Dashboard</h2>
          <div style={styles.navLinks}>
            <a href="/defects" style={styles.navLink}>Defects</a>
            <a href="/analytics" style={styles.navLink}>Analytics</a>
            <a href="/settings" style={styles.navLink}>Settings</a>
          </div>
        </nav>

        {/* Main Content */}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/defects" replace />} />
            <Route path="/defects" element={<DefectListPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

/**
 * Example with Custom API Configuration
 */
export const ExampleWithCustomAPI: React.FC = () => {
  React.useEffect(() => {
    // Configure API client with custom base URL
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.example.com';
    
    // In a real app, you would create a custom instance
    // const customApi = createAdminDefectAPIClient({
    //   baseUrl: apiBaseUrl,
    //   timeout: 30000,
    // });
    
    // Set admin token from authentication
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      adminDefectApi.setAdminToken(adminToken);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/defects" element={<DefectListPage />} />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Example with Protected Route
 */
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const ExampleWithAuth: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/defects"
          element={
            <ProtectedRoute>
              <DefectListPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Styles for example components
 */
const styles: Record<string, React.CSSProperties> = {
  navbar: {
    backgroundColor: '#1f2937',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navTitle: {
    color: 'white',
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    color: '#d1d5db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  main: {
    minHeight: 'calc(100vh - 64px)',
  },
};

/**
 * Usage Instructions:
 * 
 * 1. Install dependencies:
 *    npm install react react-dom react-router-dom
 *    npm install --save-dev @types/react @types/react-dom
 * 
 * 2. Configure environment variables:
 *    Create a .env file with:
 *    REACT_APP_API_BASE_URL=https://your-api-url.com
 * 
 * 3. Set up authentication:
 *    - Implement login flow to get admin JWT token
 *    - Store token in localStorage or secure cookie
 *    - Set token using adminDefectApi.setAdminToken(token)
 * 
 * 4. Add routing:
 *    - Import DefectListPage in your main App component
 *    - Add route: <Route path="/defects" element={<DefectListPage />} />
 * 
 * 5. Navigate to defect details:
 *    - The component automatically navigates to /defects/{defectId}
 *    - Create a DefectDetailPage component for that route
 * 
 * 6. Customize styling:
 *    - Modify DefectListPage.css for custom styles
 *    - Override inline styles by passing custom style props
 *    - Use CSS modules or styled-components if preferred
 */

export default ExampleApp;
