/**
 * Unit tests for StatusWorkflowService
 * Feature: defect-tracking
 */

import { StatusWorkflowService } from '../../src/defect-tracking/services/StatusWorkflowService';
import { StatusUpdateRepository } from '../../src/defect-tracking/repositories/StatusUpdateRepository';
import { DefectStatus, StatusUpdate } from '../../src/defect-tracking/types';

describe('StatusWorkflowService', () => {
  let service: StatusWorkflowService;
  let mockStatusUpdateRepository: jest.Mocked<StatusUpdateRepository>;

  beforeEach(() => {
    // Create mock repository
    mockStatusUpdateRepository = {
      create: jest.fn(),
      findByDefectId: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new StatusWorkflowService(mockStatusUpdateRepository);
  });

  describe('isValidTransition', () => {
    it('should allow New → Acknowledged transition', () => {
      const result = service.isValidTransition('New', 'Acknowledged');
      expect(result).toBe(true);
    });

    it('should allow Acknowledged → In_Progress transition', () => {
      const result = service.isValidTransition('Acknowledged', 'In_Progress');
      expect(result).toBe(true);
    });

    it('should allow In_Progress → Resolved transition', () => {
      const result = service.isValidTransition('In_Progress', 'Resolved');
      expect(result).toBe(true);
    });

    it('should allow Resolved → Closed transition', () => {
      const result = service.isValidTransition('Resolved', 'Closed');
      expect(result).toBe(true);
    });

    it('should allow Resolved → In_Progress transition (reopening)', () => {
      const result = service.isValidTransition('Resolved', 'In_Progress');
      expect(result).toBe(true);
    });

    it('should reject New → Closed transition (skipping steps)', () => {
      const result = service.isValidTransition('New', 'Closed');
      expect(result).toBe(false);
    });

    it('should reject New → In_Progress transition', () => {
      const result = service.isValidTransition('New', 'In_Progress');
      expect(result).toBe(false);
    });

    it('should reject Acknowledged → Resolved transition', () => {
      const result = service.isValidTransition('Acknowledged', 'Resolved');
      expect(result).toBe(false);
    });

    it('should reject Closed → any transition (terminal state)', () => {
      expect(service.isValidTransition('Closed', 'New')).toBe(false);
      expect(service.isValidTransition('Closed', 'Acknowledged')).toBe(false);
      expect(service.isValidTransition('Closed', 'In_Progress')).toBe(false);
      expect(service.isValidTransition('Closed', 'Resolved')).toBe(false);
    });

    it('should reject backward transitions except Resolved → In_Progress', () => {
      expect(service.isValidTransition('Acknowledged', 'New')).toBe(false);
      expect(service.isValidTransition('In_Progress', 'Acknowledged')).toBe(false);
      expect(service.isValidTransition('In_Progress', 'New')).toBe(false);
      expect(service.isValidTransition('Resolved', 'Acknowledged')).toBe(false);
      expect(service.isValidTransition('Resolved', 'New')).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return [Acknowledged] for New status', () => {
      const result = service.getAllowedTransitions('New');
      expect(result).toEqual(['Acknowledged']);
    });

    it('should return [In_Progress] for Acknowledged status', () => {
      const result = service.getAllowedTransitions('Acknowledged');
      expect(result).toEqual(['In_Progress']);
    });

    it('should return [Resolved] for In_Progress status', () => {
      const result = service.getAllowedTransitions('In_Progress');
      expect(result).toEqual(['Resolved']);
    });

    it('should return [Closed, In_Progress] for Resolved status', () => {
      const result = service.getAllowedTransitions('Resolved');
      expect(result).toEqual(['Closed', 'In_Progress']);
    });

    it('should return empty array for Closed status (terminal state)', () => {
      const result = service.getAllowedTransitions('Closed');
      expect(result).toEqual([]);
    });
  });

  describe('getTransitionHistory', () => {
    it('should return empty array when no status updates exist', async () => {
      mockStatusUpdateRepository.findByDefectId.mockResolvedValue([]);

      const result = await service.getTransitionHistory('defect-123');

      expect(result).toEqual([]);
      expect(mockStatusUpdateRepository.findByDefectId).toHaveBeenCalledWith('defect-123');
    });

    it('should return only status change updates (not comments)', async () => {
      const mockUpdates: StatusUpdate[] = [
        {
          updateId: 'update-1',
          defectId: 'defect-123',
          message: 'Acknowledged the defect',
          previousStatus: 'New',
          newStatus: 'Acknowledged',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          updateId: 'update-2',
          defectId: 'defect-123',
          message: 'Just a comment, no status change',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T11:00:00Z'
        },
        {
          updateId: 'update-3',
          defectId: 'defect-123',
          message: 'Started working on this',
          previousStatus: 'Acknowledged',
          newStatus: 'In_Progress',
          adminId: 'admin-2',
          adminName: 'Another Admin',
          timestamp: '2024-01-01T12:00:00Z'
        }
      ];

      mockStatusUpdateRepository.findByDefectId.mockResolvedValue(mockUpdates);

      const result = await service.getTransitionHistory('defect-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        updateId: 'update-1',
        previousStatus: 'New',
        newStatus: 'Acknowledged',
        timestamp: '2024-01-01T10:00:00Z',
        adminId: 'admin-1',
        adminName: 'Admin User',
        message: 'Acknowledged the defect'
      });
      expect(result[1]).toEqual({
        updateId: 'update-3',
        previousStatus: 'Acknowledged',
        newStatus: 'In_Progress',
        timestamp: '2024-01-01T12:00:00Z',
        adminId: 'admin-2',
        adminName: 'Another Admin',
        message: 'Started working on this'
      });
    });

    it('should return complete transition history in chronological order', async () => {
      const mockUpdates: StatusUpdate[] = [
        {
          updateId: 'update-1',
          defectId: 'defect-123',
          message: 'Acknowledged',
          previousStatus: 'New',
          newStatus: 'Acknowledged',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          updateId: 'update-2',
          defectId: 'defect-123',
          message: 'Started work',
          previousStatus: 'Acknowledged',
          newStatus: 'In_Progress',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T11:00:00Z'
        },
        {
          updateId: 'update-3',
          defectId: 'defect-123',
          message: 'Fixed',
          previousStatus: 'In_Progress',
          newStatus: 'Resolved',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T12:00:00Z'
        },
        {
          updateId: 'update-4',
          defectId: 'defect-123',
          message: 'Issue persists, reopening',
          previousStatus: 'Resolved',
          newStatus: 'In_Progress',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T13:00:00Z'
        },
        {
          updateId: 'update-5',
          defectId: 'defect-123',
          message: 'Actually fixed now',
          previousStatus: 'In_Progress',
          newStatus: 'Resolved',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T14:00:00Z'
        },
        {
          updateId: 'update-6',
          defectId: 'defect-123',
          message: 'Closing',
          previousStatus: 'Resolved',
          newStatus: 'Closed',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T15:00:00Z'
        }
      ];

      mockStatusUpdateRepository.findByDefectId.mockResolvedValue(mockUpdates);

      const result = await service.getTransitionHistory('defect-123');

      expect(result).toHaveLength(6);
      expect(result.map(t => t.newStatus)).toEqual([
        'Acknowledged',
        'In_Progress',
        'Resolved',
        'In_Progress',
        'Resolved',
        'Closed'
      ]);
    });

    it('should include all transition metadata', async () => {
      const mockUpdates: StatusUpdate[] = [
        {
          updateId: 'update-1',
          defectId: 'defect-123',
          message: 'Acknowledged the defect',
          previousStatus: 'New',
          newStatus: 'Acknowledged',
          adminId: 'admin-1',
          adminName: 'John Doe',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      mockStatusUpdateRepository.findByDefectId.mockResolvedValue(mockUpdates);

      const result = await service.getTransitionHistory('defect-123');

      expect(result[0]).toEqual({
        updateId: 'update-1',
        previousStatus: 'New',
        newStatus: 'Acknowledged',
        timestamp: '2024-01-01T10:00:00Z',
        adminId: 'admin-1',
        adminName: 'John Doe',
        message: 'Acknowledged the defect'
      });
    });
  });
});
