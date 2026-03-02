/**
 * useAdminAuth Hook
 * Custom hook to access admin authentication context
 */

import { useContext } from 'react';
import AdminAuthContext from './AdminAuthContext';

/**
 * Hook to access admin authentication state and methods
 * Must be used within AdminAuthProvider
 * 
 * @throws Error if used outside AdminAuthProvider
 * @returns Admin authentication context value
 */
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (context === undefined) {
    throw new Error(
      'useAdminAuth must be used within an AdminAuthProvider. ' +
      'Wrap your component tree with <AdminAuthProvider> to use this hook.'
    );
  }

  return context;
};

export default useAdminAuth;
