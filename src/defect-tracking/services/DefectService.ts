/**
 * DefectService - Core business logic for defect tracking system
 * Feature: defect-tracking
 * 
 * This service integrates DefectRepository, StatusUpdateRepository, 
 * StatusWorkflowService, NotificationService, and validation to provide
 * complete defect management functionality.
 * 
 * Requirements: 1.1-1.10, 2.1-2.4, 3.1-3.5, 4.1-4.7, 5.1-5.5
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Defect,
  DefectStatus,
  DefectCreationResult,
  DefectFilters,
  AdminDefectFilters,
  DefectDetails,
  DefectList,
  DefectSummary,
  StatusUpdateResult,
  StatusUpdate,
  SubmitDefectRequest,
  ValidationResult
} from '../types';
import { DefectRepository } from '../repositories/DefectRepository';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';
import { StatusWorkflowService } from './StatusWorkflowService';
import { NotificationService } from './NotificationService';
import { validateDefectSubmission } from '../validation/schemas';

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(
    message: string,
    public currentStatus: DefectStatus,
    public attemptedStatus: DefectStatus,
    public allowedTransitions: DefectStatus[]
  ) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * DefectService - Main service for defect management
 */
export class DefectService {
  private defectRepository: DefectRepository;
  private statusUpdateRepository: StatusUpdateRepository;
  private statusWorkflowService: StatusWorkflowService;
  private notificationService: NotificationService;

  constructor(
    defectRepository: DefectRepository,
    statusUpdateRepository: StatusUpdateRepository,
    statusWorkflowService: StatusWorkflowService,
    notificationService: NotificationService
  ) {
    this.defectRepository = defectRepository;
    this.statusUpdateRepository = statusUpdateRepository;
    this.statusWorkflowService = statusWorkflowService;
    this.notificationService = notificationService;
  }

  /**
   * Submit a new defect report
   * 
   * Validates input, creates defect with status "New", and persists to database
   * 
   * @param request - Defect submission data
   * @returns Defect creation result with ID and status
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
   */
  async submitDefect(request: SubmitDefectRequest): Promise<DefectCreationResult> {
    // Validate input
    const validation = this.validateDefectSubmission(request);
    if (!validation.valid) {
      throw new ValidationError('Invalid defect submission', validation.errors!);
    }

    // Create defect entity
    const now = new Date().toISOString();
    const defect: Defect = {
      defectId: uuidv4(),
      userId: request.userId,
      title: request.title,
      description: request.description,
      stepsToReproduce: request.stepsToReproduce,
      expectedBehavior: request.expectedBehavior,
      actualBehavior: request.actualBehavior,
      status: 'New', // Requirement 1.9: Initial status is always "New"
      createdAt: now, // Requirement 1.7: Record submission timestamp
      updatedAt: now,
      deviceInfo: request.deviceInfo,
      updateCount: 0
    };

    // Persist to database
    await this.defectRepository.create(defect);

    // Return creation result
    return {
      defectId: defect.defectId, // Requirement 1.10: Return unique identifier
      status: defect.status,
      createdAt: defect.createdAt
    };
  }

  /**
   * Get all defects submitted by a specific user
   * 
   * @param userId - The user ID
   * @param filters - Optional filters (status, pagination)
   * @returns List of user's defects
   * 
   * Requirements: 2.1, 2.2
   */
  async getUserDefects(userId: string, filters?: DefectFilters): Promise<DefectList> {
    const result = await this.defectRepository.findByUserId(userId, filters);

    const defects: DefectSummary[] = result.items.map(defect => ({
      defectId: defect.defectId,
      title: defect.title,
      description: defect.description,
      status: defect.status, // Requirement 2.2: Display current status
      createdAt: defect.createdAt,
      updatedAt: defect.updatedAt,
      updateCount: defect.updateCount
    }));

    return {
      defects,
      lastEvaluatedKey: result.lastEvaluatedKey
        ? JSON.stringify(result.lastEvaluatedKey)
        : undefined,
      totalCount: result.count
    };
  }

  /**
   * Get detailed defect information including status updates
   * 
   * Includes authorization check - users can only view their own defects
   * 
   * @param defectId - The defect ID
   * @param requesterId - The ID of the user requesting the defect
   * @returns Detailed defect information with status updates
   * 
   * Requirements: 2.2, 2.3, 2.4, 3.4, 3.5, 10.5
   */
  async getDefectDetails(defectId: string, requesterId: string): Promise<DefectDetails> {
    // Find the defect
    const defect = await this.defectRepository.findById(defectId);
    
    if (!defect) {
      throw new NotFoundError(`Defect with ID ${defectId} not found`);
    }

    // Authorization check: User can only view their own defects
    // (Admin check would be done at a higher level)
    if (defect.userId !== requesterId) {
      throw new ForbiddenError('You can only view your own defects');
    }

    // Get status updates
    const statusUpdates = await this.statusUpdateRepository.findByDefectId(defectId);
    
    // Requirement 2.4: Status updates should be in chronological order (oldest first)
    // The repository already returns them in chronological order

    return {
      ...defect,
      statusUpdates // Requirement 2.3: Display all status updates
    };
  }

  /**
   * Get all defects (admin only)
   * 
   * Supports filtering by status and searching by defect ID or title
   * 
   * @param filters - Optional filters (status, search, pagination)
   * @returns List of all defects
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.6
   */
  async getAllDefects(filters?: AdminDefectFilters): Promise<DefectList> {
    const result = await this.defectRepository.findAll(filters);

    const defects: DefectSummary[] = result.items.map(defect => ({
      defectId: defect.defectId,
      title: defect.title,
      description: defect.description,
      status: defect.status,
      createdAt: defect.createdAt,
      updatedAt: defect.updatedAt,
      updateCount: defect.updateCount
    }));

    return {
      defects,
      lastEvaluatedKey: result.lastEvaluatedKey
        ? JSON.stringify(result.lastEvaluatedKey)
        : undefined,
      totalCount: result.count
    };
  }

  /**
   * Update defect status (admin only)
   * 
   * Validates status transition, updates defect, creates status update record,
   * and sends notification to user
   * 
   * @param defectId - The defect ID
   * @param adminId - The admin performing the update
   * @param adminName - The admin's display name
   * @param newStatus - The new status
   * @param comment - Optional comment about the status change
   * @returns Status update result
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 8.1
   */
  async updateDefectStatus(
    defectId: string,
    adminId: string,
    adminName: string,
    newStatus: DefectStatus,
    comment?: string
  ): Promise<StatusUpdateResult> {
    // Find the defect
    const defect = await this.defectRepository.findById(defectId);
    
    if (!defect) {
      throw new NotFoundError(`Defect with ID ${defectId} not found`);
    }

    const currentStatus = defect.status;

    // Validate status transition
    if (!this.statusWorkflowService.isValidTransition(currentStatus, newStatus)) {
      const allowedTransitions = this.statusWorkflowService.getAllowedTransitions(currentStatus);
      throw new InvalidTransitionError(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        currentStatus,
        newStatus,
        allowedTransitions
      );
    }

    // Update defect status
    await this.defectRepository.updateStatus(defectId, newStatus);

    // Create status update record
    const now = new Date().toISOString();
    const statusUpdate: StatusUpdate = {
      updateId: uuidv4(),
      defectId,
      message: comment || `Status changed from ${currentStatus} to ${newStatus}`,
      previousStatus: currentStatus, // Requirement 4.6: Record previous status
      newStatus, // Requirement 4.6: Record new status
      adminId, // Requirement 4.7: Record admin ID
      adminName, // Requirement 4.7: Record admin name
      timestamp: now // Requirement 4.6: Record timestamp
    };

    await this.statusUpdateRepository.create(statusUpdate);

    // Update defect's updateCount
    defect.status = newStatus;
    defect.updateCount += 1;
    defect.updatedAt = now;
    await this.defectRepository.update(defect);

    // Send notification to user
    // Requirement 8.1: Create notification for status change
    try {
      await this.notificationService.notifyStatusChange(
        defect.userId,
        defectId,
        defect.title,
        currentStatus,
        newStatus
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send notification:', error);
    }

    return {
      defectId,
      previousStatus: currentStatus,
      newStatus,
      updatedAt: now
    };
  }

  /**
   * Add a status update comment (admin only)
   * 
   * Creates a status update record without changing the status
   * and sends notification to user
   * 
   * @param defectId - The defect ID
   * @param adminId - The admin adding the update
   * @param adminName - The admin's display name
   * @param message - The update message
   * @returns The created status update
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.2
   */
  async addStatusUpdate(
    defectId: string,
    adminId: string,
    adminName: string,
    message: string
  ): Promise<StatusUpdate> {
    // Find the defect
    const defect = await this.defectRepository.findById(defectId);
    
    if (!defect) {
      throw new NotFoundError(`Defect with ID ${defectId} not found`);
    }

    // Create status update record
    const now = new Date().toISOString();
    const statusUpdate: StatusUpdate = {
      updateId: uuidv4(),
      defectId,
      message, // Requirement 5.2: Record update message
      // No status change, so previousStatus and newStatus are undefined
      adminId, // Requirement 5.4: Record admin ID
      adminName, // Requirement 5.4: Record admin name
      timestamp: now // Requirement 5.3: Record timestamp
    };

    await this.statusUpdateRepository.create(statusUpdate);

    // Update defect's updateCount
    defect.updateCount += 1;
    defect.updatedAt = now;
    await this.defectRepository.update(defect);

    // Send notification to user
    // Requirement 8.2: Create notification for comment added
    try {
      await this.notificationService.notifyCommentAdded(
        defect.userId,
        defectId,
        defect.title,
        message
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send notification:', error);
    }

    return statusUpdate;
  }

  /**
   * Validate defect submission
   * 
   * @param request - Defect submission data
   * @returns Validation result
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  validateDefectSubmission(request: SubmitDefectRequest): ValidationResult {
    return validateDefectSubmission(request);
  }
}
