/**
 * Unit Tests for DashboardPage
 * Tests the dashboard component including Quick Actions navigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render dashboard with stats cards', () => {
      renderDashboard();
      
      expect(screen.getByText('Total Temples')).toBeInTheDocument();
      expect(screen.getByText('Total Artifacts')).toBeInTheDocument();
      expect(screen.getByText('QR Scans (30 days)')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      renderDashboard();
      
      expect(screen.getByText('25')).toBeInTheDocument(); // temples
      expect(screen.getByText('150')).toBeInTheDocument(); // artifacts
      expect(screen.getByText('1250')).toBeInTheDocument(); // scans
      expect(screen.getByText('450')).toBeInTheDocument(); // users
    });

    it('should render recent activity section', () => {
      renderDashboard();
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New artifact added')).toBeInTheDocument();
      expect(screen.getByText('Content generated')).toBeInTheDocument();
    });

    it('should render top artifacts section', () => {
      renderDashboard();
      
      expect(screen.getByText('Top Artifacts')).toBeInTheDocument();
      expect(screen.getAllByText('Hanging Pillar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Monolithic Nandi').length).toBeGreaterThan(0);
    });

    it('should render Quick Actions section', () => {
      renderDashboard();
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Temple')).toBeInTheDocument();
      expect(screen.getByText('🗿 Add Artifact')).toBeInTheDocument();
      expect(screen.getByText('✨ Generate Content')).toBeInTheDocument();
      expect(screen.getByText('📊 View Analytics')).toBeInTheDocument();
    });
  });

  describe('Quick Actions Navigation', () => {
    it('should navigate to temple form when Add Temple is clicked', () => {
      renderDashboard();
      
      const addTempleButton = screen.getByText('➕ Add Temple');
      fireEvent.click(addTempleButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/temples/new');
    });

    it('should navigate to artifacts page when Add Artifact is clicked', () => {
      renderDashboard();
      
      const addArtifactButton = screen.getByText('🗿 Add Artifact');
      fireEvent.click(addArtifactButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/artifacts');
    });

    it('should navigate to content generation when Generate Content is clicked', () => {
      renderDashboard();
      
      const generateContentButton = screen.getByText('✨ Generate Content');
      fireEvent.click(generateContentButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/content');
    });

    it('should navigate to analytics when View Analytics is clicked', () => {
      renderDashboard();
      
      const viewAnalyticsButton = screen.getByText('📊 View Analytics');
      fireEvent.click(viewAnalyticsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/analytics');
    });
  });

  describe('Activity Display', () => {
    it('should display all recent activities with timestamps', () => {
      renderDashboard();
      
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('5 hours ago')).toBeInTheDocument();
      expect(screen.getAllByText('1 day ago')).toHaveLength(2);
    });

    it('should display artifact names in activities', () => {
      renderDashboard();
      
      expect(screen.getAllByText('Hanging Pillar').length).toBeGreaterThan(0);
      expect(screen.getByText('Audio Guide - Lepakshi')).toBeInTheDocument();
      expect(screen.getByText('Tirumala Temple')).toBeInTheDocument();
    });
  });

  describe('Top Artifacts Display', () => {
    it('should display artifacts with scan counts', () => {
      renderDashboard();
      
      expect(screen.getByText('245 scans')).toBeInTheDocument();
      expect(screen.getByText('198 scans')).toBeInTheDocument();
      expect(screen.getByText('187 scans')).toBeInTheDocument();
      expect(screen.getByText('156 scans')).toBeInTheDocument();
    });

    it('should display temple names for artifacts', () => {
      renderDashboard();
      
      expect(screen.getAllByText('Lepakshi')).toHaveLength(2);
      expect(screen.getByText('Tirumala')).toBeInTheDocument();
      expect(screen.getByText('Sri Kalahasti')).toBeInTheDocument();
    });

    it('should display artifacts in ranked order', () => {
      const { container } = renderDashboard();
      
      const ranks = container.querySelectorAll('.artifact-rank');
      expect(ranks).toHaveLength(4);
      expect(ranks[0]).toHaveTextContent('1');
      expect(ranks[1]).toHaveTextContent('2');
      expect(ranks[2]).toHaveTextContent('3');
      expect(ranks[3]).toHaveTextContent('4');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderDashboard();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/.+/); // Has some text content
      });
    });
  });
});
