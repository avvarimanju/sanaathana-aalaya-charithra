/**
 * Defect Context Provider
 * Manages defect state across the mobile app
 */

import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import { defectApiService, DefectFilters } from '../../services/defect-api.service';
import { DefectState } from './types';
import { defectReducer, initialDefectState } from './defectReducer';

/**
 * Context value interface
 */
interface DefectContextValue extends DefectState {
  // Actions
  loadDefects: (userId: string, filters?: DefectFilters) => Promise<void>;
  loadDefectDetails: (defectId: string) => Promise<void>;
  refreshDefects: (userId: string, filters?: DefectFilters) => Promise<void>;
  setStatusFilter: (status: DefectState['statusFilter']) => void;
  clearError: () => void;
  clearState: () => void;
}

/**
 * Create context
 */
export const DefectContext = createContext<DefectContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface DefectProviderProps {
  children: ReactNode;
}

/**
 * Defect Provider Component
 */
export function DefectProvider({ children }: DefectProviderProps) {
  const [state, dispatch] = useReducer(defectReducer, initialDefectState);

  /**
   * Load defects from API
   */
  const loadDefects = useCallback(async (userId: string, filters?: DefectFilters) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await defectApiService.getUserDefects(userId, filters);

      if (response.success && response.data) {
        dispatch({ type: 'SET_DEFECTS', payload: response.data.defects });
      } else {
        const errorMessage = response.error?.message || 'Failed to load defects';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } catch (error) {
      console.error('Error loading defects:', error);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, []);

  /**
   * Refresh defects (with refreshing indicator)
   */
  const refreshDefects = useCallback(async (userId: string, filters?: DefectFilters) => {
    dispatch({ type: 'SET_REFRESHING', payload: true });

    try {
      const response = await defectApiService.getUserDefects(userId, filters);

      if (response.success && response.data) {
        dispatch({ type: 'SET_DEFECTS', payload: response.data.defects });
      } else {
        const errorMessage = response.error?.message || 'Failed to refresh defects';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } catch (error) {
      console.error('Error refreshing defects:', error);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, []);

  /**
   * Load defect details
   */
  const loadDefectDetails = useCallback(async (defectId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await defectApiService.getDefectDetails(defectId);

      if (response.success && response.data) {
        dispatch({ type: 'SET_SELECTED_DEFECT', payload: response.data });
      } else {
        const errorMessage = response.error?.message || 'Failed to load defect details';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } catch (error) {
      console.error('Error loading defect details:', error);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, []);

  /**
   * Set status filter
   */
  const setStatusFilter = useCallback((status: DefectState['statusFilter']) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: status });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Clear state (on logout)
   */
  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  const value: DefectContextValue = {
    ...state,
    loadDefects,
    loadDefectDetails,
    refreshDefects,
    setStatusFilter,
    clearError,
    clearState,
  };

  return <DefectContext.Provider value={value}>{children}</DefectContext.Provider>;
}
