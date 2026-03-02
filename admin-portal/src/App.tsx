import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DefectListPage from './pages/DefectListPage';
import DefectDetailPage from './pages/DefectDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import TempleListPage from './pages/TempleListPage';
import TempleFormPage from './pages/TempleFormPage';
import ArtifactListPage from './pages/ArtifactListPage';
import ContentGenerationPage from './pages/ContentGenerationPage';
import PricingManagementPage from './pages/PricingManagementPage';
import PriceCalculatorPage from './pages/PriceCalculatorPage';
import StateManagementPage from './pages/StateManagementPage';
import TempleDetailPage from './pages/TempleDetailPage';

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/defects"
          element={
            <ProtectedRoute>
              <Layout>
                <DefectListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/defects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <DefectDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/temples"
          element={
            <ProtectedRoute>
              <Layout>
                <TempleListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/temples/new"
          element={
            <ProtectedRoute>
              <Layout>
                <TempleFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/temples/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TempleDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/temples/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <TempleFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/artifacts"
          element={
            <ProtectedRoute>
              <Layout>
                <ArtifactListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content"
          element={
            <ProtectedRoute>
              <Layout>
                <ContentGenerationPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <Layout>
                <PricingManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/price-calculator"
          element={
            <ProtectedRoute>
              <Layout>
                <PriceCalculatorPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/states"
          element={
            <ProtectedRoute>
              <Layout>
                <StateManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Placeholder routes - to be implemented */}
        <Route path="/analytics" element={<ProtectedRoute><Layout><div>Analytics - Coming Soon</div></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><div>Settings - Coming Soon</div></Layout></ProtectedRoute>} />
      </Routes>
    </div>
  );
};

export default App;
