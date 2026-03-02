/**
 * StatusTransitionButton Component
 * 
 * Button for changing defect status with visual feedback.
 * 
 * Features:
 * - Color-coded based on target status
 * - Loading state support
 * - Disabled state support
 * - Accessible button with proper ARIA attributes
 * 
 * Requirements: 4.1, 5.1, 6.6
 */

import React from 'react';
import { DefectStatus } from '../api/adminDefectApi';

/**
 * Props for StatusTransitionButton component
 */
export interface StatusTransitionButtonProps {
  /** Current status of the defect */
  currentStatus: DefectStatus;
  /** Target status to transition to */
  targetStatus: DefectStatus;
  /** Click handler for the button */
  onClick: (targetStatus: DefectStatus) => void;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional additional CSS class name */
  className?: string;
}

/**
 * Get background color for a given status
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
 * Get hover color (slightly darker) for a given status
 */
const getStatusHoverColor = (status: DefectStatus): string => {
  const colors: Record<DefectStatus, string> = {
    'New': '#2563eb',           // Darker Blue
    'Acknowledged': '#7c3aed',  // Darker Purple
    'In_Progress': '#d97706',   // Darker Orange
    'Resolved': '#059669',      // Darker Green
    'Closed': '#4b5563',        // Darker Gray
  };
  return colors[status];
};

/**
 * StatusTransitionButton Component
 */
export const StatusTransitionButton: React.FC<StatusTransitionButtonProps> = ({
  currentStatus,
  targetStatus,
  onClick,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const backgroundColor = getStatusColor(targetStatus);
  const hoverColor = getStatusHoverColor(targetStatus);
  const isDisabled = loading || disabled;

  const handleClick = () => {
    if (!isDisabled) {
      onClick(targetStatus);
    }
  };

  const style: React.CSSProperties = {
    padding: '12px 20px',
    backgroundColor,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, opacity 0.2s',
    textAlign: 'center',
    width: '100%',
    opacity: isDisabled ? 0.5 : 1,
  };

  // Format status text (replace underscores with spaces)
  const displayText = targetStatus.replace('_', ' ');
  const buttonText = loading ? 'Updating...' : `Mark as ${displayText}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      style={style}
      className={`status-transition-button ${className}`}
      aria-label={`Change status from ${currentStatus} to ${targetStatus}`}
      aria-busy={loading}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
      }}
    >
      {buttonText}
    </button>
  );
};

export default StatusTransitionButton;
