/**
 * ECCD CARE — Authentication Context Provider
 *
 * react-patterns skill:
 *   - Context for shared auth state (avoids deep prop-drilling)
 *   - Clean effect lifecycle with cleanup
 *   - Container component handles logic, children handle display
 *
 * auth-implementation-patterns skill:
 *   - Session state: authenticated | unauthenticated | expired | loading
 *   - Token lifecycle validation on mount
 *   - Centralized auth state for protected route enforcement
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  apiLogout,
  apiGetCurrentUser,
  apiForgotPassword,
  ROLE_LANDING,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  hasPermission,
  getDemoAccountForRole,
  TOKEN_KEY,
  USER_KEY,
  EXPIRY_KEY,
} from '../../services/authService';

// Auth state enum (auth-implementation-patterns: explicit session states)
export const AUTH_STATUS = {
  LOADING: 'loading',       // Initial session check in progress
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  EXPIRED: 'session_expired',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  // Check existing session on mount (auth-implementation-patterns: validate token lifecycle)
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const result = await apiGetCurrentUser();

      if (cancelled) return;

      if (result.ok) {
        setUser(result.data.user);
        setStatus(AUTH_STATUS.AUTHENTICATED);
      } else if (result.error?.code === 'SESSION_EXPIRED') {
        setUser(null);
        setStatus(AUTH_STATUS.EXPIRED);
        setSessionExpiredMessage(result.error.message);
      } else {
        setUser(null);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
      }
    }

    checkSession();

    // react-patterns skill: clean up effects on unmount
    return () => {
      cancelled = true;
    };
  }, []);

  // Login handler
  const login = useCallback(async ({ email, password }) => {
    const result = await apiLogin({ email, password });

    if (result.ok) {
      setUser(result.data.user);
      setStatus(AUTH_STATUS.AUTHENTICATED);
      setSessionExpiredMessage('');
      return result;
    }

    return result;
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('apiLogout cleanup notice:', err);
    } finally {
      // Unconditionally wipe all session state and localStorage
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('eccd_jwt_token');
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        sessionStorage.clear();
      } catch (_) {}

      setUser(null);
      setStatus(AUTH_STATUS.UNAUTHENTICATED);
      setSessionExpiredMessage('');
    }
  }, []);

  // Forgot password handler
  const forgotPassword = useCallback(async ({ email }) => {
    return await apiForgotPassword({ email });
  }, []);

  // Clear expired session state (for dismissing the expired banner)
  const clearExpiredState = useCallback(() => {
    setStatus(AUTH_STATUS.UNAUTHENTICATED);
    setSessionExpiredMessage('');
  }, []);

  // Permission check bound to current user
  const checkPermission = useCallback(
    (sectionId) => hasPermission(user, sectionId),
    [user]
  );

  // Get landing page for current user's role
  const getLandingPage = useCallback(() => {
    if (!user) return 'dashboard';
    return ROLE_LANDING[user.role] || 'dashboard';
  }, [user]);

  // Role switching simulator for prototype governance testing
  const switchRole = useCallback((roleKey) => {
    const account = getDemoAccountForRole(roleKey);
    setUser(account);
    try {
      localStorage.setItem('eccd_care_session_user', JSON.stringify(account));
    } catch {
      // ignore
    }
  }, []);

  // Trigger prototype session expiration
  const triggerSessionExpiry = useCallback(() => {
    setStatus(AUTH_STATUS.EXPIRED);
    setSessionExpiredMessage('Session expired due to prototype security policy timeout.');
  }, []);

  // Unlock session after password verification
  const unlockSession = useCallback(() => {
    setStatus(AUTH_STATUS.AUTHENTICATED);
    setSessionExpiredMessage('');
  }, []);

  const value = {
    user,
    status,
    sessionExpiredMessage,
    isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
    isLoading: status === AUTH_STATUS.LOADING,
    isExpired: status === AUTH_STATUS.EXPIRED,
    login,
    logout,
    forgotPassword,
    clearExpiredState,
    checkPermission,
    getLandingPage,
    switchRole,
    triggerSessionExpiry,
    unlockSession,
    roleLabel: user ? ROLE_LABELS[user.role] : '',
    rolePermissions: user ? ROLE_PERMISSIONS[user.role] : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume auth context.
 * react-patterns skill: custom hooks start with "use", enforce provider boundary.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
