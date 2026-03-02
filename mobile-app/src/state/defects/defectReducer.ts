/**
 * Defect state reducer
 */

import { DefectState, DefectAction } from './types';

/**
 * Initial defect state
 */
export const initialDefectState: DefectState = {
  defects: [],
  selectedDefect: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  statusFilter: null,
};

/**
 * Defect reducer
 */
export function defectReducer(state: DefectState, action: DefectAction): DefectState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_REFRESHING':
      return {
        ...state,
        isRefreshing: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isRefreshing: false,
      };

    case 'SET_DEFECTS':
      return {
        ...state,
        defects: action.payload,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };

    case 'SET_SELECTED_DEFECT':
      return {
        ...state,
        selectedDefect: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload,
      };

    case 'UPDATE_DEFECT':
      return {
        ...state,
        defects: state.defects.map((defect) =>
          defect.defectId === action.payload.defectId ? action.payload : defect
        ),
      };

    case 'CLEAR_STATE':
      return initialDefectState;

    default:
      return state;
  }
}
