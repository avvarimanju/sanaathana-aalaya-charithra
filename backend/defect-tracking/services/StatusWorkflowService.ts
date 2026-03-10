/**
 * StatusWorkflowService - State machine logic for defect status transitions
 * Feature: defect-tracking
 * 
 * This service enforces the defect lifecycle workflow by validating status transitions
 * and providing information about allowed transitions.
 * 
 * Valid transitions:
 * - New → Acknowledged
 * - Acknowledged → In_Progress
 * - In_Progress → Resolved
 * - Resolved → Closed (final state)
 * - Resolved → In_Progress (reopening)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { DefectStatus, STATUS_TRANSITIONS, StatusUpdate } from '../types';
import { StatusUpdateRepository } from '../repositories/StatusUpdateRepository';

export interface StatusTransition {
  updateId: string;
  previousStatus?: DefectStatus;
  newStatus?: DefectStatus;
  timestamp: string;
  adminId: string;
  adminName: string;
  message: string;
}

export class StatusWorkflowService {
  private statusUpdateRepository: StatusUpdateRepository;

  constructor(statusUpdateRepository: StatusUpdateRepository) {
    this.statusUpdateRepository = statusUpdateRepository;
  }

  /**
   * Validates if a status transition is allowed
   * 
   * @param currentStatus - The current status of the defect
   * @param newStatus - The desired new status
   * @returns true if the transition is valid, false otherwise
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  isValidTransition(currentStatus: DefectStatus, newStatus: DefectStatus): boolean {
    // Get allowed transitions for the current status
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    
    // Check if the new status is in the allowed transitions list
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Gets the list of allowed next statuses for a given current status
   * 
   * @param currentStatus - The current status of the defect
   * @returns Array of allowed next statuses
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  getAllowedTransitions(currentStatus: DefectStatus): DefectStatus[] {
    return STATUS_TRANSITIONS[currentStatus];
  }

  /**
   * Retrieves the complete status transition history for a defect
   * 
   * @param defectId - The ID of the defect
   * @returns Array of status transitions in chronological order
   * 
   * Requirements: 4.6, 4.7
   */
  async getTransitionHistory(defectId: string): Promise<StatusTransition[]> {
    // Get all status updates for the defect
    const statusUpdates = await this.statusUpdateRepository.findByDefectId(defectId);
    
    // Filter to only include updates that represent status changes
    // and map to StatusTransition format
    const transitions: StatusTransition[] = statusUpdates
      .filter(update => update.previousStatus !== undefined && update.newStatus !== undefined)
      .map(update => ({
        updateId: update.updateId,
        previousStatus: update.previousStatus,
        newStatus: update.newStatus,
        timestamp: update.timestamp,
        adminId: update.adminId,
        adminName: update.adminName,
        message: update.message
      }));
    
    return transitions;
  }
}
