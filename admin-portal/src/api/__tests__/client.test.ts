/**
 * API Client Tests
 * Tests for error handling and connection detection
 */

import { ApiClient } from '../client';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:4000');
  });

  describe('Connection Error Handling', () => {
    it('should detect connection refused errors', async () => {
      // Mock fetch to simulate connection refused
      global.fetch = jest.fn().mockRejectedValue(
        new TypeError('Failed to fetch')
      );

      try {
        await client.get('/api/temples');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Backend server is not running');
        expect(error.message).toContain('port 4000');
        expect(error.isConnectionRefused).toBe(true);
      }
    });

    it('should provide user-friendly error message for network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(
        new TypeError('NetworkError when attempting to fetch resource')
      );

      try {
        await client.post('/api/temples', { name: 'Test' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Backend server is not running');
        expect(error.isConnectionRefused).toBe(true);
      }
    });

    it('should handle other errors normally', async () => {
      global.fetch = jest.fn().mockRejectedValue(
        new Error('Some other error')
      );

      try {
        await client.get('/api/temples');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Some other error');
        expect(error.isConnectionRefused).toBeUndefined();
      }
    });
  });

  describe('Health Check', () => {
    it('should return true when backend is available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', environment: 'local', timestamp: '2024-01-01' }),
      } as Response);

      const isAvailable = await client.isBackendAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when backend is not available', async () => {
      global.fetch = jest.fn().mockRejectedValue(
        new TypeError('Failed to fetch')
      );

      const isAvailable = await client.isBackendAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when health check fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const isAvailable = await client.isBackendAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('HTTP Methods', () => {
    it('should handle successful GET requests', async () => {
      const mockData = { items: [], total: 0 };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.get('/api/temples');
      expect(result).toEqual(mockData);
    });

    it('should handle successful POST requests', async () => {
      const mockData = { templeId: '123', name: 'Test Temple' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.post('/api/temples', { name: 'Test Temple' });
      expect(result).toEqual(mockData);
    });

    it('should handle successful PUT requests', async () => {
      const mockData = { templeId: '123', name: 'Updated Temple' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.put('/api/temples/123', { name: 'Updated Temple' });
      expect(result).toEqual(mockData);
    });

    it('should handle successful DELETE requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      const result = await client.delete('/api/temples/123');
      expect(result).toBeUndefined();
    });
  });
});
