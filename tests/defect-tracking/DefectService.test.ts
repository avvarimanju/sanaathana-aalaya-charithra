/**
 * Unit tests for DefectService
 * Feature: defect-tracking
 */

import { DefectService, ValidationError, NotFoundError, ForbiddenError, InvalidTransitionError } from '../../src/defect-tracking/services/DefectService';
import { DefectRepository } from '../../src/defect-tracking/repositories/DefectRepository';
import { StatusUpdateRepository } from '../../src/defect-tracking/repositories/StatusUpdateRepository';
import { StatusWorkflowService } from '../../src/defect-tracking/services/StatusWorkflowService';
import { NotificationService } from '../../src/defect-tracking/services/NotificationService';
import { Defect, DefectStatus, SubmitDefectRequest, StatusUpdate } from '../../src/defect-tracking/types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

describe('DefectService', () => {
  let service: DefectService;
  let mockDefectRepository: jest.Mocked<DefectRepository>;
  let mockStatusUpdateRepository: jest.Mocked<StatusUpdateRepository>;
  let mockStatusWorkflowService: jest.Mocked<StatusWorkflowService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Create mock repositories and services
    mockDefectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      update: jest.fn(),
    } as any;

    mockStatusUpdateRepository = {
      create: jest.fn(),
      findByDefectId: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockStatusWorkflowService = {
      isValidTransition: jest.fn(),
      getAllowedTransitions: jest.fn(),
      getTransitionHistory: jest.fn(),
    } as any;

    mockNotificationService = {
      notifyStatusChange: jest.fn(),
      notifyCommentAdded: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
    } as any;

    service = new DefectService(
      mockDefectRepository,
      mockStatusUpdateRepository,
      mockStatusWorkflowService,
      mockNotificationService
    );

    // Reset date mock
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T10:00:00Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submitDefect', () => {
    const validRequest: SubmitDefectRequest = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Valid Bug Title',
      description: 'This is a valid bug description with enough characters',
      stepsToReproduce: 'Step 1, Step 2, Step 3',
      expectedBehavior: 'Should work correctly',
      actualBehavior: 'Does not work',
      deviceInfo: {
        platform: 'android',
        osVersion: '13',
        appVersion: '1.0.0'
      }
    };

    it('should create a defect with status "New"', async () => {
      mockDefectRepository.create.mockResolvedValue({} as Defect);

      const result = await service.submitDefect(validRequest);

      expect(result.defectId).toBe('mock-uuid-1234');
      expect(result.status).toBe('New');
      expect(result.createdAt).toBe('2024-01-01T10:00:00Z');
    });

    it('should persist defect with all provided fields', async () => {
      mockDefectRepository.create.mockResolvedValue({} as Defect);

      await service.submitDefect(validRequest);

      expect(mockDefectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          defectId: 'mock-uuid-1234',
          userId: validRequest.userId,
          title: validRequest.title,
          description: validRequest.description,
          stepsToReproduce: validRequest.stepsToReproduce,
          expectedBehavior: validRequest.expectedBehavior,
          actualBehavior: validRequest.actualBehavior,
          status: 'New',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          deviceInfo: validRequest.deviceInfo,
          updateCount: 0
        })
      );
    });

    it('should reject defect with title shorter than 5 characters', async () => {
      const invalidRequest = {
        ...validRequest,
        title: 'Bug'
      };

      await expect(service.submitDefect(invalidRequest)).rejects.toThrow(ValidationError);
      expect(mockDefectRepository.create).not.toHaveBeenCalled();
    });

    it('should reject defect with description shorter than 10 characters', async () => {
      const invalidRequest = {
        ...validRequest,
        description: 'Short'
      };

      await expect(service.submitDefect(invalidRequest)).rejects.toThrow(ValidationError);
      expect(mockDefectRepository.create).not.toHaveBeenCalled();
    });

    it('should reject defect with missing title', async () => {
      const invalidRequest = {
        ...validRequest,
        title: undefined as any
      };

      await expect(service.submitDefect(invalidRequest)).rejects.toThrow(ValidationError);
      expect(mockDefectRepository.create).not.toHaveBeenCalled();
    });

    it('should reject defect with missing description', async () => {
      const invalidRequest = {
        ...validRequest,
        description: undefined as any
      };

      await expect(service.submitDefect(invalidRequest)).rejects.toThrow(ValidationError);
      expect(mockDefectRepository.create).not.toHaveBeenCalled();
    });

    it('should accept defect without optional fields', async () => {
      const minimalRequest: SubmitDefectRequest = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description'
      };

      mockDefectRepository.create.mockResolvedValue({} as Defect);

      const result = await service.submitDefect(minimalRequest);

      expect(result.defectId).toBe('mock-uuid-1234');
      expect(result.status).toBe('New');
    });
  });

  describe('getUserDefects', () => {
    it('should return user defects with status information', async () => {
      const mockDefects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-1',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          updateCount: 0
        },
        {
          defectId: 'defect-2',
          userId: 'user-1',
          title: 'Bug 2',
          description: 'Description 2',
          status: 'In_Progress',
          createdAt: '2024-01-01T11:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          updateCount: 2
        }
      ];

      mockDefectRepository.findByUserId.mockResolvedValue({
        items: mockDefects,
        count: 2
      });

      const result = await service.getUserDefects('user-1');

      expect(result.defects).toHaveLength(2);
      expect(result.defects[0].status).toBe('New');
      expect(result.defects[1].status).toBe('In_Progress');
      expect(result.totalCount).toBe(2);
    });

    it('should pass filters to repository', async () => {
      mockDefectRepository.findByUserId.mockResolvedValue({
        items: [],
        count: 0
      });

      await service.getUserDefects('user-1', {
        status: 'New',
        limit: 10
      });

      expect(mockDefectRepository.findByUserId).toHaveBeenCalledWith('user-1', {
        status: 'New',
        limit: 10
      });
    });
  });

  describe('getDefectDetails', () => {
    const mockDefect: Defect = {
      defectId: 'defect-1',
      userId: 'user-1',
      title: 'Bug Title',
      description: 'Bug Description',
      status: 'New',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      updateCount: 0
    };

    const mockStatusUpdates: StatusUpdate[] = [
      {
        updateId: 'update-1',
        defectId: 'defect-1',
        message: 'First update',
        adminId: 'admin-1',
        adminName: 'Admin User',
        timestamp: '2024-01-01T11:00:00Z'
      }
    ];

    it('should return defect with status updates', async () => {
      mockDefectRepository.findById.mockResolvedValue(mockDefect);
      mockStatusUpdateRepository.findByDefectId.mockResolvedValue(mockStatusUpdates);

      const result = await service.getDefectDetails('defect-1', 'user-1');

      expect(result.defectId).toBe('defect-1');
      expect(result.statusUpdates).toEqual(mockStatusUpdates);
    });

    it('should throw NotFoundError if defect does not exist', async () => {
      mockDefectRepository.findById.mockResolvedValue(null);

      await expect(service.getDefectDetails('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user tries to view another user\'s defect', async () => {
      mockDefectRepository.findById.mockResolvedValue(mockDefect);

      await expect(service.getDefectDetails('defect-1', 'user-2')).rejects.toThrow(ForbiddenError);
    });

    it('should allow user to view their own defect', async () => {
      mockDefectRepository.findById.mockResolvedValue(mockDefect);
      mockStatusUpdateRepository.findByDefectId.mockResolvedValue(mockStatusUpdates);

      const result = await service.getDefectDetails('defect-1', 'user-1');

      expect(result.defectId).toBe('defect-1');
    });
  });

  describe('getAllDefects', () => {
    it('should return all defects for admin', async () => {
      const mockDefects: Defect[] = [
        {
          defectId: 'defect-1',
          userId: 'user-1',
          title: 'Bug 1',
          description: 'Description 1',
          status: 'New',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          updateCount: 0
        },
        {
          defectId: 'defect-2',
          userId: 'user-2',
          title: 'Bug 2',
          description: 'Description 2',
          status: 'Resolved',
          createdAt: '2024-01-01T11:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          updateCount: 3
        }
      ];

      mockDefectRepository.findAll.mockResolvedValue({
        items: mockDefects,
        count: 2
      });

      const result = await service.getAllDefects();

      expect(result.defects).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should pass filters to repository', async () => {
      mockDefectRepository.findAll.mockResolvedValue({
        items: [],
        count: 0
      });

      await service.getAllDefects({
        status: 'New',
        search: 'bug',
        limit: 20
      });

      expect(mockDefectRepository.findAll).toHaveBeenCalledWith({
        status: 'New',
        search: 'bug',
        limit: 20
      });
    });
  });

  describe('updateDefectStatus', () => {
    const createMockDefect = (): Defect => ({
      defectId: 'defect-1',
      userId: 'user-1',
      title: 'Bug Title',
      description: 'Bug Description',
      status: 'New',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      updateCount: 0
    });

    it('should update defect status when transition is valid', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(true);
      mockDefectRepository.updateStatus.mockResolvedValue(undefined);
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyStatusChange.mockResolvedValue(undefined);

      const result = await service.updateDefectStatus(
        'defect-1',
        'admin-1',
        'Admin User',
        'Acknowledged',
        'Acknowledging this defect'
      );

      expect(result.previousStatus).toBe('New');
      expect(result.newStatus).toBe('Acknowledged');
      expect(mockDefectRepository.updateStatus).toHaveBeenCalledWith('defect-1', 'Acknowledged');
    });

    it('should create status update record with metadata', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(true);
      mockDefectRepository.updateStatus.mockResolvedValue(undefined);
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyStatusChange.mockResolvedValue(undefined);

      await service.updateDefectStatus(
        'defect-1',
        'admin-1',
        'Admin User',
        'Acknowledged',
        'Acknowledging this defect'
      );

      expect(mockStatusUpdateRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          updateId: 'mock-uuid-1234',
          defectId: 'defect-1',
          message: 'Acknowledging this defect',
          previousStatus: 'New',
          newStatus: 'Acknowledged',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T10:00:00Z'
        })
      );
    });

    it('should send notification to user', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(true);
      mockDefectRepository.updateStatus.mockResolvedValue(undefined);
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyStatusChange.mockResolvedValue(undefined);

      await service.updateDefectStatus(
        'defect-1',
        'admin-1',
        'Admin User',
        'Acknowledged'
      );

      expect(mockNotificationService.notifyStatusChange).toHaveBeenCalledWith(
        'user-1',
        'defect-1',
        'Bug Title',
        'New',
        'Acknowledged'
      );
    });

    it('should throw NotFoundError if defect does not exist', async () => {
      mockDefectRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateDefectStatus('nonexistent', 'admin-1', 'Admin User', 'Acknowledged')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InvalidTransitionError for invalid status transition', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(false);
      mockStatusWorkflowService.getAllowedTransitions.mockReturnValue(['Acknowledged']);

      await expect(
        service.updateDefectStatus('defect-1', 'admin-1', 'Admin User', 'Closed')
      ).rejects.toThrow(InvalidTransitionError);

      expect(mockDefectRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should continue operation even if notification fails', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(true);
      mockDefectRepository.updateStatus.mockResolvedValue(undefined);
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyStatusChange.mockRejectedValue(new Error('Notification failed'));

      const result = await service.updateDefectStatus(
        'defect-1',
        'admin-1',
        'Admin User',
        'Acknowledged'
      );

      expect(result.newStatus).toBe('Acknowledged');
    });

    it('should increment updateCount', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusWorkflowService.isValidTransition.mockReturnValue(true);
      mockDefectRepository.updateStatus.mockResolvedValue(undefined);
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyStatusChange.mockResolvedValue(undefined);

      await service.updateDefectStatus('defect-1', 'admin-1', 'Admin User', 'Acknowledged');

      expect(mockDefectRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updateCount: 1
        })
      );
    });
  });

  describe('addStatusUpdate', () => {
    const createMockDefect = (): Defect => ({
      defectId: 'defect-1',
      userId: 'user-1',
      title: 'Bug Title',
      description: 'Bug Description',
      status: 'In_Progress',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      updateCount: 1
    });

    it('should create status update without changing status', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyCommentAdded.mockResolvedValue(undefined);

      const result = await service.addStatusUpdate(
        'defect-1',
        'admin-1',
        'Admin User',
        'Working on this issue'
      );

      expect(result.message).toBe('Working on this issue');
      expect(result.previousStatus).toBeUndefined();
      expect(result.newStatus).toBeUndefined();
    });

    it('should create status update with all metadata', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyCommentAdded.mockResolvedValue(undefined);

      await service.addStatusUpdate(
        'defect-1',
        'admin-1',
        'Admin User',
        'Working on this issue'
      );

      expect(mockStatusUpdateRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          updateId: 'mock-uuid-1234',
          defectId: 'defect-1',
          message: 'Working on this issue',
          adminId: 'admin-1',
          adminName: 'Admin User',
          timestamp: '2024-01-01T10:00:00Z'
        })
      );
    });

    it('should send notification to user', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyCommentAdded.mockResolvedValue(undefined);

      await service.addStatusUpdate(
        'defect-1',
        'admin-1',
        'Admin User',
        'Working on this issue'
      );

      expect(mockNotificationService.notifyCommentAdded).toHaveBeenCalledWith(
        'user-1',
        'defect-1',
        'Bug Title',
        'Working on this issue'
      );
    });

    it('should throw NotFoundError if defect does not exist', async () => {
      mockDefectRepository.findById.mockResolvedValue(null);

      await expect(
        service.addStatusUpdate('nonexistent', 'admin-1', 'Admin User', 'Comment')
      ).rejects.toThrow(NotFoundError);
    });

    it('should increment updateCount', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyCommentAdded.mockResolvedValue(undefined);

      await service.addStatusUpdate('defect-1', 'admin-1', 'Admin User', 'Comment');

      expect(mockDefectRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updateCount: 2
        })
      );
    });

    it('should continue operation even if notification fails', async () => {
      mockDefectRepository.findById.mockResolvedValue(createMockDefect());
      mockStatusUpdateRepository.create.mockResolvedValue({} as StatusUpdate);
      mockDefectRepository.update.mockResolvedValue({} as Defect);
      mockNotificationService.notifyCommentAdded.mockRejectedValue(new Error('Notification failed'));

      const result = await service.addStatusUpdate(
        'defect-1',
        'admin-1',
        'Admin User',
        'Comment'
      );

      expect(result.message).toBe('Comment');
    });
  });

  describe('validateDefectSubmission', () => {
    it('should return valid for correct input', () => {
      const validRequest: SubmitDefectRequest = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Valid Bug Title',
        description: 'This is a valid bug description'
      };

      const result = service.validateDefectSubmission(validRequest);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for short title', () => {
      const invalidRequest: SubmitDefectRequest = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Bug',
        description: 'This is a valid bug description'
      };

      const result = service.validateDefectSubmission(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'title')).toBe(true);
    });

    it('should return invalid for short description', () => {
      const invalidRequest: SubmitDefectRequest = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Valid Bug Title',
        description: 'Short'
      };

      const result = service.validateDefectSubmission(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'description')).toBe(true);
    });
  });
});
