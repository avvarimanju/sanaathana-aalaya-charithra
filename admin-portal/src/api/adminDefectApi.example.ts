/**
 * Example usage of the Admin Defect API Client
 * This file demonstrates how to use the adminDefectApi in your React components
 */

import { adminDefectApi, DefectStatus } from './adminDefectApi';

/**
 * Example 1: Initialize and authenticate
 */
export const initializeAdminApi = (adminToken: string) => {
  // Set the admin authentication token
  adminDefectApi.setAdminToken(adminToken);
  
  console.log('Admin API initialized with token');
};

/**
 * Example 2: Fetch all defects with pagination
 */
export const fetchAllDefects = async () => {
  const response = await adminDefectApi.getAllDefects({
    limit: 20,
  });

  if (response.success && response.data) {
    console.log('Fetched defects:', response.data.defects);
    console.log('Total count:', response.data.totalCount);
    
    // Handle pagination
    if (response.data.lastEvaluatedKey) {
      console.log('More results available, use lastEvaluatedKey for next page');
    }
    
    return response.data.defects;
  } else {
    console.error('Failed to fetch defects:', response.error);
    return [];
  }
};

/**
 * Example 3: Filter defects by status
 */
export const fetchDefectsByStatus = async (status: DefectStatus) => {
  const response = await adminDefectApi.getAllDefects({
    status,
    limit: 50,
  });

  if (response.success && response.data) {
    console.log(`Defects with status ${status}:`, response.data.defects);
    return response.data.defects;
  } else {
    console.error('Failed to fetch defects by status:', response.error);
    return [];
  }
};

/**
 * Example 4: Search for defects
 */
export const searchDefects = async (searchTerm: string) => {
  const response = await adminDefectApi.getAllDefects({
    search: searchTerm,
    limit: 20,
  });

  if (response.success && response.data) {
    console.log('Search results:', response.data.defects);
    return response.data.defects;
  } else {
    console.error('Search failed:', response.error);
    return [];
  }
};

/**
 * Example 5: Get defect details
 */
export const viewDefectDetails = async (defectId: string) => {
  const response = await adminDefectApi.getDefectDetails(defectId);

  if (response.success && response.data) {
    const defect = response.data;
    
    console.log('Defect ID:', defect.defectId);
    console.log('Title:', defect.title);
    console.log('Description:', defect.description);
    console.log('Status:', defect.status);
    console.log('Created:', defect.createdAt);
    console.log('Status Updates:', defect.statusUpdates);
    
    return defect;
  } else {
    console.error('Failed to fetch defect details:', response.error);
    return null;
  }
};

/**
 * Example 6: Update defect status with validation
 */
export const updateDefectStatusSafely = async (
  defectId: string,
  currentStatus: DefectStatus,
  newStatus: DefectStatus,
  comment?: string
) => {
  // Client-side validation before making API call
  const isValid = adminDefectApi.isValidStatusTransition(currentStatus, newStatus);
  
  if (!isValid) {
    const allowedTransitions = adminDefectApi.getAllowedTransitions(currentStatus);
    console.error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    console.error('Allowed transitions:', allowedTransitions);
    return {
      success: false,
      error: 'Invalid status transition',
      allowedTransitions,
    };
  }

  // Make the API call
  const response = await adminDefectApi.updateDefectStatus(defectId, {
    newStatus,
    comment,
  });

  if (response.success && response.data) {
    console.log('Status updated successfully');
    console.log('Previous status:', response.data.previousStatus);
    console.log('New status:', response.data.newStatus);
    console.log('Updated at:', response.data.updatedAt);
    
    return {
      success: true,
      data: response.data,
    };
  } else {
    console.error('Failed to update status:', response.error);
    
    // Handle specific error types
    if (response.error?.error === 'INVALID_STATUS_TRANSITION') {
      console.error('Server rejected transition');
      console.error('Allowed transitions:', response.error.allowedTransitions);
    }
    
    return {
      success: false,
      error: response.error?.message,
    };
  }
};

/**
 * Example 7: Add status update comment
 */
export const addCommentToDefect = async (
  defectId: string,
  message: string
) => {
  const response = await adminDefectApi.addStatusUpdate(defectId, {
    message,
  });

  if (response.success && response.data) {
    console.log('Comment added successfully');
    console.log('Update ID:', response.data.updateId);
    console.log('Timestamp:', response.data.timestamp);
    
    return response.data;
  } else {
    console.error('Failed to add comment:', response.error);
    return null;
  }
};

/**
 * Example 8: Get defect statistics
 */
export const getDefectStats = async () => {
  const response = await adminDefectApi.getDefectStatistics();

  if (response.success && response.data) {
    console.log('Total defects:', response.data.total);
    console.log('Defects by status:');
    console.log('  New:', response.data.byStatus.New);
    console.log('  Acknowledged:', response.data.byStatus.Acknowledged);
    console.log('  In Progress:', response.data.byStatus.In_Progress);
    console.log('  Resolved:', response.data.byStatus.Resolved);
    console.log('  Closed:', response.data.byStatus.Closed);
    
    return response.data;
  } else {
    console.error('Failed to fetch statistics:', response.error);
    return null;
  }
};

/**
 * Example 9: Handle authentication errors
 */
export const handleAuthError = (error: any) => {
  if (error?.error === 'UNAUTHORIZED' || error?.error === 'FORBIDDEN') {
    console.log('Authentication failed, redirecting to login...');
    // Clear the token
    adminDefectApi.clearAdminToken();
    // Redirect to login page
    window.location.href = '/admin/login';
  }
};

/**
 * Example 10: Complete workflow - Acknowledge and comment on a new defect
 */
export const acknowledgeDefect = async (defectId: string) => {
  try {
    // Step 1: Get current defect details
    const detailsResponse = await adminDefectApi.getDefectDetails(defectId);
    
    if (!detailsResponse.success || !detailsResponse.data) {
      console.error('Failed to fetch defect details');
      return false;
    }

    const currentStatus = detailsResponse.data.status;
    
    // Step 2: Validate that defect is in "New" status
    if (currentStatus !== 'New') {
      console.error('Defect is not in New status, cannot acknowledge');
      return false;
    }

    // Step 3: Update status to Acknowledged
    const statusResponse = await adminDefectApi.updateDefectStatus(defectId, {
      newStatus: 'Acknowledged',
      comment: 'Thank you for reporting this issue. We have acknowledged it and will investigate.',
    });

    if (!statusResponse.success) {
      console.error('Failed to update status:', statusResponse.error);
      return false;
    }

    console.log('Defect acknowledged successfully');
    return true;
  } catch (error) {
    console.error('Error in acknowledgeDefect:', error);
    return false;
  }
};

/**
 * Example 11: React Hook for fetching defects
 */
export const useDefects = () => {
  // This would be implemented as a React hook in a real component
  // Example structure:
  /*
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDefects = async (filters) => {
    setLoading(true);
    const response = await adminDefectApi.getAllDefects(filters);
    
    if (response.success) {
      setDefects(response.data.defects);
      setError(null);
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  };

  return { defects, loading, error, fetchDefects };
  */
};

/**
 * Example 12: Batch operations
 */
export const acknowledgeMultipleDefects = async (defectIds: string[]) => {
  const results = await Promise.allSettled(
    defectIds.map(async (defectId) => {
      const response = await adminDefectApi.updateDefectStatus(defectId, {
        newStatus: 'Acknowledged',
        comment: 'Batch acknowledgement',
      });
      
      return {
        defectId,
        success: response.success,
        error: response.error,
      };
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Batch operation complete: ${successful} successful, ${failed} failed`);
  
  return results;
};

/**
 * Example 13: Get allowed transitions for UI
 */
export const getStatusTransitionOptions = (currentStatus: DefectStatus) => {
  const allowedTransitions = adminDefectApi.getAllowedTransitions(currentStatus);
  
  // Map to UI-friendly labels
  const statusLabels: Record<DefectStatus, string> = {
    'New': 'New',
    'Acknowledged': 'Acknowledged',
    'In_Progress': 'In Progress',
    'Resolved': 'Resolved',
    'Closed': 'Closed',
  };

  return allowedTransitions.map(status => ({
    value: status,
    label: statusLabels[status],
  }));
};

/**
 * Example 14: Error handling wrapper
 */
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorHandler?: (error: any) => void
): Promise<T | null> => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    
    if (errorHandler) {
      errorHandler(error);
    } else {
      // Default error handling
      handleAuthError(error);
    }
    
    return null;
  }
};
