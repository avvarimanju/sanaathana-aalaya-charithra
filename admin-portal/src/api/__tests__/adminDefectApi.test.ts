/**
 * Unit tests for Admin Defect API Client
 */

import { createAdminDefectAPIClient, DefectStatus } from '../adminDefectApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminDefectAPIClient', () => {
  let client: ReturnType<typeof createAdminDefectAPIClient>;
  const mockBaseUrl = 'https://test-api.example.com';
  const mockAdminToken = 'test-admin-token-123';

  beforeEach(() => {
    client = createAdminDefectAPIClient({
      baseUrl: mockBaseUrl,
      timeout: 5000,
    });
    client.setAdminToken(mockAdminToken);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.clearAdminToken();
  });

  describe('Authentication', () => {
    it('should set and get admin token', () => {
      const token = 'new-token-456';
      client.setAdminToken(token);
      expect(client.getAdminToken()).toBe(token);
    });

    it('should clear admin token', () => {
      client.clearAdminToken();
      expect(client.getAdminToken()).toBeNull();
    });

    it('should return error when token is not set', async () => {
      client.clearAdminToken();
      
      const response = await client.getAllDefects();
      
      expect(response.success).toBe(false);
      expect(response.error?.error).toBe('UNAUTHORIZED');
      expect(response.error?.message).toContain('authentication token is required');
    });

    it('should include Authorization header in requests', async () => {
      const mockResponse = {
        defects: [],
        totalCount: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getAllDefects();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAdminToken}`,
          }),
        })
      );
    });
  });

  describe('getAllDefects', () => {
    it('should fetch all defects successfully', async () => {
      const mockResponse = {
        defects: [
          {
            defectId: 'defect-1',
            userId: 'user-1',
            title: 'Test Bug',
            description: 'Test description',
            status: 'New' as DefectStatus,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            updateCount: 0,
          },
        ],
        totalCount: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.getAllDefects();

      expect(response.success).toBe(true);
      expect(response.data?.defects).toHaveLength(1);
      expect(response.data?.totalCount).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects`,
        expect.any(Object)
      );
    });

    it('should apply status filter', async () => {
      const mockResponse = {
        defects: [],
        totalCount: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getAllDefects({ status: 'New' });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects?status=New`,
        expect.any(Object)
      );
    });

    it('should apply search filter', async () => {
      const mockResponse = {
        defects: [],
        totalCount: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getAllDefects({ search: 'login bug' });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects?search=login+bug`,
        expect.any(Object)
      );
    });

    it('should apply pagination parameters', async () => {
      const mockResponse = {
        defects: [],
        totalCount: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getAllDefects({
        limit: 50,
        lastEvaluatedKey: 'key-123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects?limit=50&lastEvaluatedKey=key-123`,
        expect.any(Object)
      );
    });
  });

  describe('getDefectDetails', () => {
    it('should fetch defect details successfully', async () => {
      const mockDefect = {
        defectId: 'defect-1',
        userId: 'user-1',
        title: 'Test Bug',
        description: 'Test description',
        status: 'New' as DefectStatus,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        updateCount: 0,
        statusUpdates: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefect,
      });

      const response = await client.getDefectDetails('defect-1');

      expect(response.success).toBe(true);
      expect(response.data?.defectId).toBe('defect-1');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects/defect-1`,
        expect.any(Object)
      );
    });
  });

  describe('updateDefectStatus', () => {
    it('should update defect status successfully', async () => {
      const mockResponse = {
        defectId: 'defect-1',
        previousStatus: 'New' as DefectStatus,
        newStatus: 'Acknowledged' as DefectStatus,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.updateDefectStatus('defect-1', {
        newStatus: 'Acknowledged',
        comment: 'Test comment',
      });

      expect(response.success).toBe(true);
      expect(response.data?.newStatus).toBe('Acknowledged');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects/defect-1/status`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            newStatus: 'Acknowledged',
            comment: 'Test comment',
          }),
        })
      );
    });

    it('should handle invalid status transition error', async () => {
      const mockError = {
        error: 'INVALID_STATUS_TRANSITION',
        message: 'Cannot transition from Resolved to Acknowledged',
        currentStatus: 'Resolved',
        attemptedStatus: 'Acknowledged',
        allowedTransitions: ['Closed', 'In_Progress'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const response = await client.updateDefectStatus('defect-1', {
        newStatus: 'Acknowledged',
      });

      expect(response.success).toBe(false);
      expect(response.error?.error).toBe('INVALID_STATUS_TRANSITION');
      expect(response.error?.allowedTransitions).toEqual(['Closed', 'In_Progress']);
    });
  });

  describe('addStatusUpdate', () => {
    it('should add status update successfully', async () => {
      const mockResponse = {
        updateId: 'update-1',
        defectId: 'defect-1',
        message: 'Test update',
        timestamp: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.addStatusUpdate('defect-1', {
        message: 'Test update',
      });

      expect(response.success).toBe(true);
      expect(response.data?.updateId).toBe('update-1');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/admin/defects/defect-1/updates`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Test update',
          }),
        })
      );
    });
  });

  describe('Status Workflow Validation', () => {
    it('should validate valid status transitions', () => {
      expect(client.isValidStatusTransition('New', 'Acknowledged')).toBe(true);
      expect(client.isValidStatusTransition('Acknowledged', 'In_Progress')).toBe(true);
      expect(client.isValidStatusTransition('In_Progress', 'Resolved')).toBe(true);
      expect(client.isValidStatusTransition('Resolved', 'Closed')).toBe(true);
      expect(client.isValidStatusTransition('Resolved', 'In_Progress')).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      expect(client.isValidStatusTransition('New', 'Closed')).toBe(false);
      expect(client.isValidStatusTransition('New', 'In_Progress')).toBe(false);
      expect(client.isValidStatusTransition('Acknowledged', 'Resolved')).toBe(false);
      expect(client.isValidStatusTransition('Closed', 'New')).toBe(false);
    });

    it('should return correct allowed transitions', () => {
      expect(client.getAllowedTransitions('New')).toEqual(['Acknowledged']);
      expect(client.getAllowedTransitions('Acknowledged')).toEqual(['In_Progress']);
      expect(client.getAllowedTransitions('In_Progress')).toEqual(['Resolved']);
      expect(client.getAllowedTransitions('Resolved')).toEqual(['Closed', 'In_Progress']);
      expect(client.getAllowedTransitions('Closed')).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await client.getAllDefects();

      expect(response.success).toBe(false);
      expect(response.error?.error).toBe('NETWORK_ERROR');
      expect(response.error?.message).toContain('Network error');
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        error: 'NOT_FOUND',
        message: 'Defect not found',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const response = await client.getDefectDetails('invalid-id');

      expect(response.success).toBe(false);
      expect(response.error?.error).toBe('NOT_FOUND');
    });

    it('should handle 403 forbidden errors', async () => {
      const mockError = {
        error: 'FORBIDDEN',
        message: 'Admin privileges required',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const response = await client.updateDefectStatus('defect-1', {
        newStatus: 'Acknowledged',
      });

      expect(response.success).toBe(false);
      expect(response.error?.error).toBe('FORBIDDEN');
    });
  });

  describe('getDefectStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockResponse = {
        defects: [
          { status: 'New' as DefectStatus },
          { status: 'New' as DefectStatus },
          { status: 'Acknowledged' as DefectStatus },
          { status: 'In_Progress' as DefectStatus },
          { status: 'Resolved' as DefectStatus },
          { status: 'Closed' as DefectStatus },
          { status: 'Closed' as DefectStatus },
        ],
        totalCount: 7,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.getDefectStatistics();

      expect(response.success).toBe(true);
      expect(response.data?.total).toBe(7);
      expect(response.data?.byStatus.New).toBe(2);
      expect(response.data?.byStatus.Acknowledged).toBe(1);
      expect(response.data?.byStatus.In_Progress).toBe(1);
      expect(response.data?.byStatus.Resolved).toBe(1);
      expect(response.data?.byStatus.Closed).toBe(2);
    });
  });
});
