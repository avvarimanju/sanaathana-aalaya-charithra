/**
 * StatusBadge Component
 * 
 * Displays a defect status with color-coded visual indicator.
 * 
 * Features:
 * - Color mapping for each status (New=Blue, Acknowledged=Purple, etc.)
 * - Optional size variants (small, medium, large)
 * - Accessible and semantic HTML
 * 
 * Requirements: 4.1, 5.1, 6.6
 */

import React from 'react';
import { DefectStatus } from '../api/adminDefectApi';

/**
 * Props for StatusBadge component
 */
export interface StatusBadgeProps {
  /** The defect status to display */
  status: DefectStatus;
  /** Optional size variant (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
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
 * Get padding based on size
 */
const getSizePadding = (size: 'small' | 'medium' | 'large'): string => {
  const padding: Record<string, string> = {
    small: '4px 10px',
    medium: '6px 14px',
    large: '8px 18px',
  };
  return padding[size];
};

/**
 * Get font size based on size
 */
const getSizeFontSize = (size: 'small' | 'medium' | 'large'): string => {
  const fontSize: Record<string, string> = {
    small: '11px',
    medium: '13px',
    large: '15px',
  };
  return fontSize[size];
};

/**
 * StatusBadge Component
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'medium',
  className = '',
}) => {
  const backgroundColor = getStatusColor(status);
  const padding = getSizePadding(size);
  const fontSize = getSizeFontSize(size);

  const style: React.CSSProperties = {
    display: 'inline-block',
    padding,
    backgroundColor,
    borderRadius: '12px',
    fontSize,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  };

  // Format status text (replace underscores with spaces)
  const displayText = status.replace('_', ' ');

  return (
    <span 
      style={style} 
      className={`status-badge status-badge-${status.toLowerCase()} ${className}`}
      role="status"
      aria-label={`Status: ${displayText}`}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
