/**
 * DefectListPage Unit Tests
 * 
 * Tests for the DefectListPage component functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DefectListPage from '../DefectListPage';
import { adminDefectApi } from '../../api/adminDefectApi';

// Mock the API client
jest.mock('../../api/adminDefectApi', () => ({
  adminDefectApi: {
    getAllDefects: jest.fn(),
    setAdminToken: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Sample test data
const mockDefects = [
  {
    defectId: 'def-001',
    userId: 'user-001',
    title: 'App crashes on startup',
    description: 'The app crashes immediately after opening',
    status: 'New' as const,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    updateCount: 0,
  },
  {
    defectId: 'def-002',
    userId: 'user-002',
    title: 'Login button not working',
    description: 'Cannot click the login button',
    status: 'Acknowledged' as const,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
    updateCount: 2,
  },
  {
    defectId: 'def-003',
    userId: 'user-003',
    title: 'Image upload fails',
    description: 'Images fail to upload',
    status: 'In_Progress' as const,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
    updateCount: 5,
  },
];

describe('DefectListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the page title', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: [],
          totalCount: 0,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      expect(screen.getByText('Defect Reports')).toBeInTheDocument();
    });

    it('should render filter controls', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: [],
          totalCount: 0,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      expect(screen.getByLabelText('Status:')).toBeInTheDocument();
      expect(screen.getByLabelText('Search:')).toBeInTheDocument();
    });

    it('should render refresh button', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: [],
          totalCount: 0,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      expect(screen.getByText('↻ Refresh')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(<DefectListPage />);
      
      expect(screen.getByText('Loading defects...')).toBeInTheDocument();
    });
  });

  describe('Defect Display', () => {
    it('should display defects in table', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
        expect(screen.getByText('Login button not working')).toBeInTheDocument();
        expect(screen.getByText('Image upload fails')).toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Acknowledged')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
      });
    });

    it('should display update counts', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no defects', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: [],
          totalCount: 0,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No defects found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          error: 'API_ERROR',
          message: 'Failed to fetch defects',
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch defects/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          error: 'API_ERROR',
          message: 'Failed to fetch defects',
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText('Status:');
      fireEvent.change(statusFilter, { target: { value: 'New' } });

      await waitFor(() => {
        expect(adminDefectApi.getAllDefects).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'New' })
        );
      });
    });

    it('should search by query', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Search:');
      fireEvent.change(searchInput, { target: { value: 'crash' } });

      await waitFor(() => {
        expect(adminDefectApi.getAllDefects).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'crash' })
        );
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by column when header is clicked', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
      });

      const titleHeader = screen.getByText(/Title/);
      fireEvent.click(titleHeader);

      // Verify sorting indicator changes
      expect(titleHeader.textContent).toContain('↑');
    });
  });

  describe('Navigation', () => {
    it('should navigate to defect details on row click', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
      });

      const defectRow = screen.getByText('App crashes on startup').closest('tr');
      fireEvent.click(defectRow!);

      expect(mockNavigate).toHaveBeenCalledWith('/defects/def-001');
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
          lastEvaluatedKey: 'next-page-key',
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('← Previous')).toBeInTheDocument();
        expect(screen.getByText('Next →')).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        const prevButton = screen.getByText('← Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button when no more pages', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
          // No lastEvaluatedKey means no more pages
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next →');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Refresh', () => {
    it('should refetch data when refresh button is clicked', async () => {
      (adminDefectApi.getAllDefects as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          defects: mockDefects,
          totalCount: 3,
        },
      });

      renderWithRouter(<DefectListPage />);
      
      await waitFor(() => {
        expect(screen.getByText('App crashes on startup')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('↻ Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(adminDefectApi.getAllDefects).toHaveBeenCalledTimes(2);
      });
    });
  });
});

