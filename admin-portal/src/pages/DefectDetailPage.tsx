/**
 * DefectDetailPage Component
 * 
 * Admin dashboard page for viewing and managing a single defect report.
 * 
 * Features:
 * - Display full defect information
 * - Show status update timeline in chronological order
 * - StatusTransitionButton for changing defect status
 * - StatusUpdateForm for adding comments
 * - Back button to return to defect list
 * - Loading states, error handling
 * - Refresh button to reload data
 * 
 * Requirements: 3.4, 3.5, 4.1, 5.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  adminDefectApi, 
  DefectDetails, 
  DefectStatus,
  StatusUpdate,
  UpdateStatusRequest,
  AddStatusUpdateRequest,
  ErrorResponse
} from '../api/adminDefectApi';
import './DefectDetailPage.css';

/**
 * DefectDetailPage Component
 */
export const DefectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use id from params
  const defectId = id;

  // State management
  const [defect, setDefect] = useState<DefectDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);
  const [commentLoading, setCommentLoading] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  /**
   * Fetch defect details from API
   */
  const fetchDefectDetails = useCallback(async () => {
    if (!defectId) {
      setError('No defect ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // DEVELOPMENT MODE: Use mock data
      const mockDefectDetails: Record<string, DefectDetails> = {
        'def-001-abc123': {
          defectId: 'def-001-abc123',
          userId: 'user-123',
          title: 'App crashes on temple details page',
          description: 'The app crashes when trying to view temple details. This happens consistently on both Android and iOS.',
          stepsToReproduce: '1. Open the app\n2. Navigate to temple list\n3. Click on any temple\n4. App crashes immediately',
          expectedBehavior: 'Temple details page should load and display information',
          actualBehavior: 'App crashes with no error message',
          status: 'New',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deviceInfo: {
            platform: 'android',
            osVersion: '13.0',
            appVersion: '1.2.0',
            deviceModel: 'Samsung Galaxy S21',
          },
          updateCount: 0,
          statusUpdates: [],
        },
        'def-002-xyz789': {
          defectId: 'def-002-xyz789',
          userId: 'user-456',
          title: 'Audio playback not working',
          description: 'Audio files are not playing in the app. The play button appears but nothing happens when clicked.',
          stepsToReproduce: '1. Navigate to temple details\n2. Click on audio guide\n3. Press play button\n4. No audio plays',
          expectedBehavior: 'Audio should play when play button is pressed',
          actualBehavior: 'Nothing happens, no error shown',
          status: 'Acknowledged',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          deviceInfo: {
            platform: 'ios',
            osVersion: '16.4',
            appVersion: '1.2.0',
            deviceModel: 'iPhone 14 Pro',
          },
          updateCount: 2,
          statusUpdates: [
            {
              updateId: 'upd-001',
              message: 'Defect acknowledged. Investigating audio playback issue.',
              previousStatus: 'New',
              newStatus: 'Acknowledged',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-002',
              message: 'Found the issue - audio codec not supported on iOS. Working on fix.',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
          ],
        },
        'def-003-lmn456': {
          defectId: 'def-003-lmn456',
          userId: 'user-789',
          title: 'Search results not accurate',
          description: 'Temple search returns incorrect results. Searching for specific temples shows unrelated results.',
          status: 'In_Progress',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          deviceInfo: {
            platform: 'android',
            osVersion: '12.0',
            appVersion: '1.1.5',
          },
          updateCount: 5,
          statusUpdates: [
            {
              updateId: 'upd-003',
              message: 'Defect acknowledged. Will investigate search algorithm.',
              previousStatus: 'New',
              newStatus: 'Acknowledged',
              adminId: 'admin-456',
              adminName: 'Tech Lead',
              timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-004',
              message: 'Started working on improving search relevance.',
              previousStatus: 'Acknowledged',
              newStatus: 'In_Progress',
              adminId: 'admin-456',
              adminName: 'Tech Lead',
              timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-005',
              message: 'Implemented fuzzy search. Testing in progress.',
              adminId: 'admin-456',
              adminName: 'Tech Lead',
              timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-006',
              message: 'Added search filters for better results.',
              adminId: 'admin-789',
              adminName: 'Developer',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-007',
              message: 'Ready for QA testing.',
              adminId: 'admin-456',
              adminName: 'Tech Lead',
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        'def-004-pqr321': {
          defectId: 'def-004-pqr321',
          userId: 'user-234',
          title: 'Image upload fails',
          description: 'Cannot upload images for temple contributions. Upload button shows loading but never completes.',
          status: 'Resolved',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          updateCount: 8,
          statusUpdates: [
            {
              updateId: 'upd-008',
              message: 'Investigating image upload issue.',
              previousStatus: 'New',
              newStatus: 'Acknowledged',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-009',
              message: 'Found issue with S3 bucket permissions.',
              previousStatus: 'Acknowledged',
              newStatus: 'In_Progress',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-010',
              message: 'Fixed S3 permissions. Testing upload functionality.',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-011',
              message: 'Upload working correctly. Deployed to production.',
              previousStatus: 'In_Progress',
              newStatus: 'Resolved',
              adminId: 'admin-123',
              adminName: 'Admin User',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        'def-005-stu654': {
          defectId: 'def-005-stu654',
          userId: 'user-567',
          title: 'Login button not responsive',
          description: 'Login button does not respond to taps on some devices.',
          status: 'Closed',
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updateCount: 3,
          statusUpdates: [
            {
              updateId: 'upd-012',
              message: 'Acknowledged. Will investigate button responsiveness.',
              previousStatus: 'New',
              newStatus: 'Acknowledged',
              adminId: 'admin-789',
              adminName: 'Developer',
              timestamp: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-013',
              message: 'Fixed touch target size. Deployed to production.',
              previousStatus: 'Acknowledged',
              newStatus: 'In_Progress',
              adminId: 'admin-789',
              adminName: 'Developer',
              timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-014',
              message: 'Verified fix. Closing defect.',
              previousStatus: 'In_Progress',
              newStatus: 'Resolved',
              adminId: 'admin-789',
              adminName: 'Developer',
              timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            },
            {
              updateId: 'upd-015',
              message: 'User confirmed fix. Closing.',
              previousStatus: 'Resolved',
              newStatus: 'Closed',
              adminId: 'admin-789',
              adminName: 'Developer',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockDefect = mockDefectDetails[defectId];
      if (mockDefect) {
        setDefect(mockDefect);
      } else {
        setError('Defect not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [defectId]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchDefectDetails();
  }, [fetchDefectDetails]);

  /**
   * Handle status change
   */
  const handleStatusChange = async (newStatus: DefectStatus) => {
    if (!defect || !defectId) return;

    setStatusUpdateLoading(true);
    setStatusError(null);

    try {
      // DEVELOPMENT MODE: Simulate status change
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate transition
      const isValid = adminDefectApi.isValidStatusTransition(defect.status, newStatus);
      if (!isValid) {
        const allowedTransitions = adminDefectApi.getAllowedTransitions(defect.status);
        setStatusError(
          `Cannot transition from ${defect.status} to ${newStatus}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ')}`
        );
        setStatusUpdateLoading(false);
        return;
      }

      // Create status change update
      const statusChangeUpdate: StatusUpdate = {
        updateId: `upd-${Date.now()}`,
        message: `Status changed from ${defect.status.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
        previousStatus: defect.status,
        newStatus: newStatus,
        adminId: 'admin-123',
        adminName: 'Admin User',
        timestamp: new Date().toISOString(),
      };

      // Update defect with new status and status update
      setDefect(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: newStatus,
          statusUpdates: [...prev.statusUpdates, statusChangeUpdate],
          updateCount: prev.updateCount + 1,
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  /**
   * Handle add comment
   */
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defect || !defectId || !commentText.trim()) return;

    setCommentLoading(true);
    setCommentError(null);

    try {
      // DEVELOPMENT MODE: Simulate adding comment
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create new status update
      const newUpdate: StatusUpdate = {
        updateId: `upd-${Date.now()}`,
        message: commentText.trim(),
        adminId: 'admin-123',
        adminName: 'Admin User',
        timestamp: new Date().toISOString(),
      };

      // Update defect with new status update
      setDefect(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          statusUpdates: [...prev.statusUpdates, newUpdate],
          updateCount: prev.updateCount + 1,
          updatedAt: new Date().toISOString(),
        };
      });

      // Clear comment text
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setCommentLoading(false);
    }
  };

  /**
   * Handle back button
   */
  const handleBack = () => {
    navigate('/defects');
  };

  /**
   * Handle refresh button
   */
  const handleRefresh = () => {
    fetchDefectDetails();
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: DefectStatus): string => {
    const colors: Record<DefectStatus, string> = {
      'New': '#3b82f6',           // Blue
      'Acknowledged': '#8b5cf6',  // Purple
      'In_Progress': '#f59e0b',   // Orange
      'Resolved': '#10b981',      // Green
      'Closed': '#6b7280',        // Gray
    };
    return colors[status];
  };

  /**
   * Format date for display
   */
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get allowed status transitions
   */
  const getAllowedTransitions = (): DefectStatus[] => {
    if (!defect) return [];
    return adminDefectApi.getAllowedTransitions(defect.status);
  };

  /**
   * Check if status update is a status change
   */
  const isStatusChange = (update: StatusUpdate): boolean => {
    return !!update.previousStatus && !!update.newStatus;
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.centerMessage}>
          <div style={styles.spinner}></div>
          <p>Loading defect details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !defect) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Error: {error || 'Defect not found'}</p>
          <div style={styles.errorActions}>
            <button onClick={handleBack} style={styles.backButton} className="back-button">
              ← Back to List
            </button>
            <button onClick={handleRefresh} style={styles.retryButton} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={handleBack} style={styles.backButton} className="back-button">
            ← Back
          </button>
          <h1 style={styles.title}>Defect Details</h1>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton} className="refresh-button">
          ↻ Refresh
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Column - Defect Information */}
        <div style={styles.leftColumn}>
          {/* Defect Info Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Defect Information</h2>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(defect.status),
                }}
              >
                {defect.status.replace('_', ' ')}
              </span>
            </div>

            <div style={styles.cardBody}>
              {/* Defect ID */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Defect ID:</span>
                <span style={styles.infoValue}>{defect.defectId}</span>
              </div>

              {/* Title */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Title:</span>
                <span style={styles.infoValueBold}>{defect.title}</span>
              </div>

              {/* Description */}
              <div style={styles.infoSection}>
                <span style={styles.infoLabel}>Description:</span>
                <p style={styles.infoText}>{defect.description}</p>
              </div>

              {/* Steps to Reproduce */}
              {defect.stepsToReproduce && (
                <div style={styles.infoSection}>
                  <span style={styles.infoLabel}>Steps to Reproduce:</span>
                  <p style={styles.infoText}>{defect.stepsToReproduce}</p>
                </div>
              )}

              {/* Expected Behavior */}
              {defect.expectedBehavior && (
                <div style={styles.infoSection}>
                  <span style={styles.infoLabel}>Expected Behavior:</span>
                  <p style={styles.infoText}>{defect.expectedBehavior}</p>
                </div>
              )}

              {/* Actual Behavior */}
              {defect.actualBehavior && (
                <div style={styles.infoSection}>
                  <span style={styles.infoLabel}>Actual Behavior:</span>
                  <p style={styles.infoText}>{defect.actualBehavior}</p>
                </div>
              )}

              {/* Device Info */}
              {defect.deviceInfo && (
                <div style={styles.infoSection}>
                  <span style={styles.infoLabel}>Device Information:</span>
                  <div style={styles.deviceInfo}>
                    <div style={styles.deviceInfoRow}>
                      <span style={styles.deviceInfoLabel}>Platform:</span>
                      <span style={styles.deviceInfoValue}>
                        {defect.deviceInfo.platform.toUpperCase()}
                      </span>
                    </div>
                    <div style={styles.deviceInfoRow}>
                      <span style={styles.deviceInfoLabel}>OS Version:</span>
                      <span style={styles.deviceInfoValue}>{defect.deviceInfo.osVersion}</span>
                    </div>
                    <div style={styles.deviceInfoRow}>
                      <span style={styles.deviceInfoLabel}>App Version:</span>
                      <span style={styles.deviceInfoValue}>{defect.deviceInfo.appVersion}</span>
                    </div>
                    {defect.deviceInfo.deviceModel && (
                      <div style={styles.deviceInfoRow}>
                        <span style={styles.deviceInfoLabel}>Device Model:</span>
                        <span style={styles.deviceInfoValue}>{defect.deviceInfo.deviceModel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Created:</span>
                <span style={styles.infoValue}>{formatDate(defect.createdAt)}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Last Updated:</span>
                <span style={styles.infoValue}>{formatDate(defect.updatedAt)}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>User ID:</span>
                <span style={styles.infoValue}>{defect.userId}</span>
              </div>
            </div>
          </div>

          {/* Status Transition Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Change Status</h2>
            </div>
            <div style={styles.cardBody}>
              {statusError && (
                <div style={styles.errorBanner}>
                  <p style={styles.errorBannerText}>{statusError}</p>
                </div>
              )}
              
              {allowedTransitions.length > 0 ? (
                <div style={styles.statusTransitionButtons}>
                  {allowedTransitions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusUpdateLoading}
                      style={{
                        ...styles.statusTransitionButton,
                        backgroundColor: getStatusColor(status),
                        ...(statusUpdateLoading ? styles.buttonDisabled : {}),
                      }}
                      className="status-transition-button"
                    >
                      {statusUpdateLoading ? 'Updating...' : `Mark as ${status.replace('_', ' ')}`}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={styles.noTransitionsText}>
                  No status transitions available. This defect is in a terminal state.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div style={styles.rightColumn}>
          {/* Status Update Timeline */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Status Update Timeline</h2>
              <span style={styles.updateCountBadge}>
                {defect.statusUpdates.length} update{defect.statusUpdates.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={styles.cardBody}>
              {defect.statusUpdates.length === 0 ? (
                <p style={styles.emptyTimelineText}>No status updates yet</p>
              ) : (
                <div style={styles.timeline}>
                  {defect.statusUpdates.map((update, index) => (
                    <div key={update.updateId} style={styles.timelineItem}>
                      {/* Timeline connector */}
                      {index < defect.statusUpdates.length - 1 && (
                        <div style={styles.timelineConnector}></div>
                      )}
                      
                      {/* Timeline icon */}
                      <div
                        style={{
                          ...styles.timelineIcon,
                          backgroundColor: isStatusChange(update)
                            ? '#3b82f6'
                            : '#6b7280',
                        }}
                      >
                        {isStatusChange(update) ? '↻' : '💬'}
                      </div>

                      {/* Timeline content */}
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineHeader}>
                          <span style={styles.timelineAdmin}>{update.adminName}</span>
                          <span style={styles.timelineDate}>{formatDate(update.timestamp)}</span>
                        </div>

                        {/* Status change indicator */}
                        {isStatusChange(update) && (
                          <div style={styles.statusChangeIndicator}>
                            <span
                              style={{
                                ...styles.statusChangeBadge,
                                backgroundColor: getStatusColor(update.previousStatus!),
                              }}
                            >
                              {update.previousStatus!.replace('_', ' ')}
                            </span>
                            <span style={styles.statusChangeArrow}>→</span>
                            <span
                              style={{
                                ...styles.statusChangeBadge,
                                backgroundColor: getStatusColor(update.newStatus!),
                              }}
                            >
                              {update.newStatus!.replace('_', ' ')}
                            </span>
                          </div>
                        )}

                        {/* Update message */}
                        <p style={styles.timelineMessage}>{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Comment Form */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Add Status Update</h2>
            </div>
            <div style={styles.cardBody}>
              {commentError && (
                <div style={styles.errorBanner}>
                  <p style={styles.errorBannerText}>{commentError}</p>
                </div>
              )}
              
              <form onSubmit={handleAddComment} style={styles.commentForm}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment or update about this defect..."
                  style={styles.commentTextarea}
                  rows={4}
                  disabled={commentLoading}
                  className="comment-textarea"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !commentText.trim()}
                  style={{
                    ...styles.submitButton,
                    ...(commentLoading || !commentText.trim() ? styles.buttonDisabled : {}),
                  }}
                  className="submit-button"
                >
                  {commentLoading ? 'Adding...' : 'Add Update'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline styles for the component
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0',
  },
  cardBody: {
    padding: '20px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  infoValueBold: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
  },
  infoSection: {
    padding: '16px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  infoText: {
    fontSize: '14px',
    color: '#1f2937',
    lineHeight: '1.6',
    marginTop: '8px',
    marginBottom: '0',
    whiteSpace: 'pre-wrap',
  },
  deviceInfo: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  deviceInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  deviceInfoLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
  },
  deviceInfoValue: {
    fontSize: '13px',
    color: '#1f2937',
    fontWeight: '600',
  },
  statusTransitionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusTransitionButton: {
    padding: '12px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  noTransitionsText: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    margin: '0',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  errorBannerText: {
    fontSize: '14px',
    color: '#dc2626',
    margin: '0',
  },
  updateCountBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  timelineConnector: {
    position: 'absolute',
    left: '15px',
    top: '40px',
    bottom: '-24px',
    width: '2px',
    backgroundColor: '#e5e7eb',
  },
  timelineIcon: {
    flexShrink: 0,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    padding: '8px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  timelineAdmin: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  statusChangeIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  statusChangeBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  statusChangeArrow: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
  },
  timelineMessage: {
    fontSize: '14px',
    color: '#1f2937',
    lineHeight: '1.5',
    margin: '0',
    whiteSpace: 'pre-wrap',
  },
  emptyTimelineText: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '20px 0',
  },
  commentForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  commentTextarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  centerMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '16px',
    marginBottom: '16px',
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default DefectDetailPage;
