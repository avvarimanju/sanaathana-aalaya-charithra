/**
 * Custom hooks for accessing defect and notification state
 */

import { useContext } from 'react';
import { DefectContext } from './DefectContext';
import { NotificationContext } from './NotificationContext';

/**
 * Hook to access defect context
 * @throws Error if used outside DefectProvider
 */
export function useDefects() {
  const context = useContext(DefectContext);
  
  if (context === undefined) {
    throw new Error('useDefects must be used within a DefectProvider');
  }
  
  return context;
}

/**
 * Hook to access notification context
 * @throws Error if used outside NotificationProvider
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}
