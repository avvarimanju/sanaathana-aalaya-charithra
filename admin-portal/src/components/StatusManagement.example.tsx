/**
 * Example: Using Status Management Components
 * 
 * This file demonstrates how to use the StatusBadge, StatusTransitionButton,
 * and StatusUpdateForm components together in a real-world scenario.
 */

import React, { useState } from 'react';
import {
  StatusBadge,
  StatusTransitionButton,
  StatusUpdateForm,
} from './index';
import { DefectStatus, adminDefectApi } from '../api/adminDefectApi';

/**
 * Example 1: Simple Status Display
 */
export const SimpleStatusDisplay: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Status Badge Examples</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatusBadge status="New" />
        <StatusBadge status="Acknowledged" />
        <StatusBadge status="In_Progress" />
        <StatusBadge status="Resolved" />
        <StatusBadge status="Closed" />
      </div>

      <h3 style={{ marginTop: '24px' }}>Size Variants</h3>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <StatusBadge status="New" size="small" />
        <StatusBadge status="New" size="medium" />
        <StatusBadge status="New" size="large" />
      </div>
    </div>
  );
};

/**
 * Example 2: Status Transition Buttons
 */
export const StatusTransitionExample: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<DefectStatus>('New');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: DefectStatus) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCurrentStatus(newStatus);
    setLoading(false);
  };

  const allowedTransitions = adminDefectApi.getAllowedTransitions(currentStatus);

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Status Transition Example</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Current Status:</strong>
        <div style={{ marginTop: '8px' }}>
          <StatusBadge status={currentStatus} size="large" />
        </div>
      </div>

      <div>
        <strong>Available Transitions:</strong>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allowedTransitions.length > 0 ? (
            allowedTransitions.map((status) => (
              <StatusTransitionButton
                key={status}
                currentStatus={currentStatus}
                targetStatus={status}
                onClick={handleStatusChange}
                loading={loading}
              />
            ))
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
              No transitions available (terminal state)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example 3: Status Update Form
 */
export const StatusUpdateFormExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<string[]>([]);

  const handleSubmit = async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Failed to add update. Please try again.');
      }

      // Add update to list
      setUpdates([message, ...updates]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err; // Re-throw so form doesn't clear
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Status Update Form Example</h2>
      
      <StatusUpdateForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />

      {updates.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3>Recent Updates</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {updates.map((update, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <p style={{ margin: 0, fontSize: '14px' }}>{update}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 4: Complete Defect Management Interface
 */
interface DefectManagementProps {
  defectId: string;
  initialStatus: DefectStatus;
  onUpdate?: () => void;
}

export const CompleteDefectManagement: React.FC<DefectManagementProps> = ({
  defectId,
  initialStatus,
  onUpdate,
}) => {
  const [currentStatus, setCurrentStatus] = useState<DefectStatus>(initialStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Get allowed transitions
  const allowedTransitions = adminDefectApi.getAllowedTransitions(currentStatus);

  // Handle status change
  const handleStatusChange = async (newStatus: DefectStatus) => {
    setStatusLoading(true);
    setStatusError(null);

    try {
      const response = await adminDefectApi.updateDefectStatus(defectId, {
        newStatus,
      });

      if (response.success) {
        setCurrentStatus(newStatus);
        onUpdate?.();
      } else {
        // Handle workflow validation errors
        if (response.error?.error === 'INVALID_STATUS_TRANSITION') {
          const allowedTransitions = response.error.allowedTransitions || [];
          setStatusError(
            `Cannot transition from ${response.error.currentStatus} to ${response.error.attemptedStatus}. ` +
            `Allowed transitions: ${allowedTransitions.join(', ')}`
          );
        } else {
          setStatusError(response.error?.message || 'Failed to update status');
        }
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (message: string) => {
    setCommentLoading(true);
    setCommentError(null);

    try {
      const response = await adminDefectApi.addStatusUpdate(defectId, {
        message,
      });

      if (response.success) {
        onUpdate?.();
      } else {
        setCommentError(response.error?.message || 'Failed to add comment');
        throw new Error(response.error?.message);
      }
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px' }}>
      {/* Left Column - Status Management */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Current Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Current Status</h3>
          </div>
          <div style={styles.cardBody}>
            <StatusBadge status={currentStatus} size="large" />
          </div>
        </div>

        {/* Status Transition Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Change Status</h3>
          </div>
          <div style={styles.cardBody}>
            {statusError && (
              <div style={styles.errorBanner}>
                <p style={styles.errorText}>{statusError}</p>
              </div>
            )}
            
            {allowedTransitions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allowedTransitions.map((status) => (
                  <StatusTransitionButton
                    key={status}
                    currentStatus={currentStatus}
                    targetStatus={status}
                    onClick={handleStatusChange}
                    loading={statusLoading}
                  />
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

      {/* Right Column - Comments */}
      <div>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Add Status Update</h3>
          </div>
          <div style={styles.cardBody}>
            <StatusUpdateForm
              onSubmit={handleCommentSubmit}
              loading={commentLoading}
              error={commentError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Styles for the example components
 */
const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  cardHeader: {
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
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    margin: '0',
  },
  noTransitionsText: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    margin: '0',
  },
};

/**
 * Example 5: All Examples in One Page
 */
export const AllExamples: React.FC = () => {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '40px', color: '#1f2937' }}>
        Status Management Components Examples
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <SimpleStatusDisplay />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <StatusTransitionExample />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <StatusUpdateFormExample />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>Complete Defect Management</h2>
          <CompleteDefectManagement
            defectId="example-defect-123"
            initialStatus="New"
            onUpdate={() => console.log('Defect updated')}
          />
        </div>
      </div>
    </div>
  );
};

export default AllExamples;
