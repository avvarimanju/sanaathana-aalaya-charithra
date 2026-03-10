/**
 * Unit Tests for TempleListPage
 * Tests temple list display, filtering, and API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TempleListPage from '../TempleListPage';
import { templeApi } from '../../api/templeApi';

// Mock the API
jest.mock('../../api/templeApi');
const mockTempleApi = templeApi as jest.Mocked<typeof templeApi>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTemples = [
  {
    templeId: 'temple-1',
    name: 'Lepakshi Temple',
    description: 'Famous for hanging pillar',
    location: {
      state: 'Andhra Pradesh',
      city: 'Lepakshi',
      district: 'Anantapur',
      address: 'Lepakshi, AP'
    },
    accessMode: 'PAID' as const,
    status: 'active' as const,
    activeArtifactCount: 5,
    qrCodeCount: 10,
    imageUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedBy: 'admin',
    version: 1
  },
  {
    templeId: 'temple-2',
    name: 'Tirumala Temple',
    description: 'Richest temple',
    location: {
      state: 'Andhra Pradesh',
      city: 'Tirupati',
      district: 'Tirupati',
      address: 'Tirumala, AP'
    },
    accessMode: 'FREE' as const,
    status: 'active' as const,
    activeArtifactCount: 15,
    qrCodeCount: 20,
    imageUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedBy: 'admin',
    version: 1
  }
];

describe('TempleListPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTempleApi.listTemples.mockResolvedValue({
      items: mockTemples,
      total: 2
    });
  });

  const renderTemplePage = () => {
    return render(
      <BrowserRouter>
        <TempleListPage />
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockTempleApi.listTemples.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderTemplePage();
      expect(screen.getByText('Loading temples...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display temples after loading', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
        expect(screen.getByText('Tirumala Temple')).toBeInTheDocument();
      });
    });

    it('should display temple statistics', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total temples
        expect(screen.getByText('20')).toBeInTheDocument(); // Total artifacts
      });
    });

    it('should display temple details', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Famous for hanging pillar')).toBeInTheDocument();
        expect(screen.getByText('Richest temple')).toBeInTheDocument();
      });
    });

    it('should display temple locations', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText(/Lepakshi.*Anantapur.*Andhra Pradesh/)).toBeInTheDocument();
        expect(screen.getByText(/Tirupati.*Tirupati.*Andhra Pradesh/)).toBeInTheDocument();
      });
    });

    it('should display artifact counts', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('📿 5 artifacts')).toBeInTheDocument();
        expect(screen.getByText('📿 15 artifacts')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter temples by name', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/Search temples/i);
      fireEvent.change(searchInput, { target: { value: 'Lepakshi' } });
      
      expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      expect(screen.queryByText('Tirumala Temple')).not.toBeInTheDocument();
    });

    it('should filter temples by location', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/Search temples/i);
      fireEvent.change(searchInput, { target: { value: 'Tirupati' } });
      
      expect(screen.queryByText('Lepakshi Temple')).not.toBeInTheDocument();
      expect(screen.getByText('Tirumala Temple')).toBeInTheDocument();
    });

    it('should show empty state when no results', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/Search temples/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
      
      expect(screen.getByText('No temples found')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('should filter by state', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const stateFilter = screen.getByDisplayValue('All States');
      fireEvent.change(stateFilter, { target: { value: 'Karnataka' } });
      
      expect(screen.getByText('No temples found')).toBeInTheDocument();
    });

    it('should filter by status', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const statusFilter = screen.getByDisplayValue('All Status');
      fireEvent.change(statusFilter, { target: { value: 'inactive' } });
      
      expect(screen.getByText('No temples found')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to add temple page', async () => {
      renderTemplePage();
      
      const addButton = screen.getByText('➕ Add New Temple');
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/temples/new');
    });

    it('should navigate to temple details', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/temples/temple-1');
    });

    it('should navigate to edit temple', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/temples/temple-1/edit');
    });

    it('should navigate to artifacts page', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
      
      const artifactButtons = screen.getAllByTitle('View Artifacts');
      fireEvent.click(artifactButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/artifacts?temple=temple-1');
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      mockTempleApi.listTemples.mockRejectedValue(new Error('API Error'));
      
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load temples. Please try again.')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      mockTempleApi.listTemples.mockRejectedValueOnce(new Error('API Error'));
      
      renderTemplePage();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load temples. Please try again.')).toBeInTheDocument();
      });
      
      mockTempleApi.listTemples.mockResolvedValue({
        items: mockTemples,
        total: 2
      });
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Lepakshi Temple')).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('should display active status badge', async () => {
      renderTemplePage();
      
      await waitFor(() => {
        const badges = screen.getAllByText('ACTIVE');
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });
});
