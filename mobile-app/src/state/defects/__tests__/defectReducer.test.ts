/**
 * Unit tests for defect reducer
 */

import { defectReducer, initialDefectState } from '../defectReducer';
import { DefectState, DefectAction } from '../types';
import { DefectSummary, DefectDetails, DefectStatus } from '../../../services/defect-api.service';

describe('defectReducer', () => {
  const mockDefect: DefectSummary = {
    defectId: 'defect-1',
    title: 'Test Defect',
    description: 'Test description',
    status: 'New' as DefectStatus,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    updateCount: 0,
  };

  it('should return initial state', () => {
    const state = defectReducer(initialDefectState, { type: 'CLEAR_STATE' });
    expect(state).toEqual(initialDefectState);
  });

  it('should handle SET_LOADING', () => {
    const action: DefectAction = { type: 'SET_LOADING', payload: true };
    const state = defectReducer(initialDefectState, action);
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle SET_REFRESHING', () => {
    const action: DefectAction = { type: 'SET_REFRESHING', payload: true };
    const state = defectReducer(initialDefectState, action);
    
    expect(state.isRefreshing).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle SET_ERROR', () => {
    const action: DefectAction = { type: 'SET_ERROR', payload: 'Test error' };
    const state = defectReducer(
      { ...initialDefectState, isLoading: true, isRefreshing: true },
      action
    );
    
    expect(state.error).toBe('Test error');
    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
  });

  it('should handle SET_DEFECTS', () => {
    const defects = [mockDefect];
    const action: DefectAction = { type: 'SET_DEFECTS', payload: defects };
    const state = defectReducer(
      { ...initialDefectState, isLoading: true },
      action
    );
    
    expect(state.defects).toEqual(defects);
    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle SET_SELECTED_DEFECT', () => {
    const defectDetails: DefectDetails = {
      ...mockDefect,
      stepsToReproduce: 'Steps',
      expectedBehavior: 'Expected',
      actualBehavior: 'Actual',
      userId: 'user-1',
      statusUpdates: [],
    };
    
    const action: DefectAction = { type: 'SET_SELECTED_DEFECT', payload: defectDetails };
    const state = defectReducer(initialDefectState, action);
    
    expect(state.selectedDefect).toEqual(defectDetails);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle SET_STATUS_FILTER', () => {
    const action: DefectAction = { type: 'SET_STATUS_FILTER', payload: 'In_Progress' };
    const state = defectReducer(initialDefectState, action);
    
    expect(state.statusFilter).toBe('In_Progress');
  });

  it('should handle UPDATE_DEFECT', () => {
    const initialState: DefectState = {
      ...initialDefectState,
      defects: [mockDefect],
    };
    
    const updatedDefect: DefectSummary = {
      ...mockDefect,
      status: 'Acknowledged' as DefectStatus,
      updateCount: 1,
    };
    
    const action: DefectAction = { type: 'UPDATE_DEFECT', payload: updatedDefect };
    const state = defectReducer(initialState, action);
    
    expect(state.defects[0]).toEqual(updatedDefect);
    expect(state.defects[0].status).toBe('Acknowledged');
    expect(state.defects[0].updateCount).toBe(1);
  });

  it('should not update defect if ID does not match', () => {
    const initialState: DefectState = {
      ...initialDefectState,
      defects: [mockDefect],
    };
    
    const differentDefect: DefectSummary = {
      ...mockDefect,
      defectId: 'different-id',
      status: 'Acknowledged' as DefectStatus,
    };
    
    const action: DefectAction = { type: 'UPDATE_DEFECT', payload: differentDefect };
    const state = defectReducer(initialState, action);
    
    expect(state.defects[0]).toEqual(mockDefect);
    expect(state.defects[0].status).toBe('New');
  });

  it('should handle CLEAR_STATE', () => {
    const dirtyState: DefectState = {
      defects: [mockDefect],
      selectedDefect: null,
      isLoading: true,
      isRefreshing: true,
      error: 'Some error',
      statusFilter: 'In_Progress',
    };
    
    const action: DefectAction = { type: 'CLEAR_STATE' };
    const state = defectReducer(dirtyState, action);
    
    expect(state).toEqual(initialDefectState);
  });

  it('should clear error when setting loading to true', () => {
    const stateWithError: DefectState = {
      ...initialDefectState,
      error: 'Previous error',
    };
    
    const action: DefectAction = { type: 'SET_LOADING', payload: true };
    const state = defectReducer(stateWithError, action);
    
    expect(state.error).toBeNull();
  });

  it('should preserve error when setting loading to false', () => {
    const stateWithError: DefectState = {
      ...initialDefectState,
      error: 'Previous error',
      isLoading: true,
    };
    
    const action: DefectAction = { type: 'SET_LOADING', payload: false };
    const state = defectReducer(stateWithError, action);
    
    expect(state.error).toBe('Previous error');
  });
});
