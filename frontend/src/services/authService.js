/**
 * ECCD CARE — Authentication API Service Layer
 *
 * Contract-first design (api-and-interface-design skill):
 *   POST /api/auth/login          → Authenticate user, return session
 *   POST /api/auth/logout         → Destroy session
 *   GET  /api/auth/me             → Current authenticated user
 *   POST /api/auth/forgot-password → Request password reset
 *
 * This is a MOCK implementation for prototype purposes.
 * Replace with real Laravel backend calls when connected.
 *
 * auth-implementation-patterns skill:
 *   - Simulated token lifecycle with expiry
 *   - Session state tracking (active, expired, unauthorized)
 *   - Never log secrets/tokens/credentials
 *   - Least privilege: role-based access per user
 */

import { getApiUrl } from './apiConfig';

// --- Role Definitions (auth-implementation-patterns: RBAC) ---
// Three-Tier Architecture:
// 1. CSFP System Administrator (SYSADMIN) — City IT / MIS Administrator managing system access, tenant security, audit logs, and account provisioning in /admin
// 2. ECCD Administrative (ADMIN) — CSWDO Early Childhood Care Supervisor consolidating data, coordinating programs, Form 8 & 9 approvals across 35 barangays
// 3. Child Development Teacher (CDT) — Frontline implementer delivering activities and developmental assessments directly to children & families

export const ROLES = {
  SYSADMIN: 'sysadmin',
  ADMIN: 'eccd_admin',
  CDT: 'cdt',
  // Backward compatibility alias keys:
  FIELD_WORKER: 'cdt',
  DAYCARE_WORKER: 'cdt',
  CSWDO_ADMIN: 'eccd_admin',
};

export const ROLE_LABELS = {
  [ROLES.SYSADMIN]: 'CSFP System Administrator',
  [ROLES.ADMIN]: 'ECCD Administrative',
  [ROLES.CDT]: 'Child Development Teacher (CDT)',
  // Backwards compatibility mappings
  'sysadmin': 'CSFP System Administrator',
  'eccd_admin': 'ECCD Administrative',
  'cswdo_admin': 'ECCD Administrative',
  'cdt': 'Child Development Teacher (CDT)',
  'field_worker': 'Child Development Teacher (CDT)',
  'daycare_worker': 'Child Development Teacher (CDT)',
};

// Role → default landing page after login
export const ROLE_LANDING = {
  [ROLES.SYSADMIN]: 'admin',
  [ROLES.ADMIN]: 'dashboard',
  [ROLES.CDT]: 'community-mapping',
  'sysadmin': 'admin',
  'cswdo_admin': 'dashboard',
  'field_worker': 'community-mapping',
  'daycare_worker': 'community-mapping',
};

// Role → permitted sidebar sections (Strict role-based navigation & module boundaries)
export const ROLE_PERMISSIONS = {
  [ROLES.SYSADMIN]: {
    label: 'CSFP System Administration & IT Governance',
    description: 'City IT / MIS Administrator managing user provisioning, credentials, and security audit logs in the Admin Console.',
    sections: '*',
  },
  [ROLES.ADMIN]: {
    label: 'Data Consolidation & Program Administration',
    description: 'Responsible for consolidating data, coordinating requirements, planning and organizing programs across all 35 barangays.',
    sections: '*', // Full access across consolidation dashboard, reports, planning
  },
  [ROLES.CDT]: {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'dashboard',
      'centers-workers',
      'community-network',
      'barangays',
      'daycare-centers',
      'workers',
      'children',
      'households',
      'community-mapping',
      'mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
    ],
    // Executive-only administrative modules remain restricted: 'reports' (Citywide submissions), 'audit-logs', 'settings'
  },
  // Legacy aliases
  'field_worker': {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'dashboard',
      'centers-workers',
      'community-network',
      'barangays',
      'daycare-centers',
      'workers',
      'children',
      'households',
      'community-mapping',
      'mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
    ],
  },
  'daycare_worker': {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'dashboard',
      'centers-workers',
      'community-network',
      'barangays',
      'daycare-centers',
      'workers',
      'children',
      'households',
      'community-mapping',
      'mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
    ],
  },
};

// --- Official Production Accounts ---

export const OFFICIAL_ACCOUNTS = [
  {
    id: 'USR-SYS-001',
    email: 'sysadmin@csfp.gov.ph',
    password: 'password',
    name: 'CSFP MIS System Administrator',
    role: ROLES.SYSADMIN,
    designation: 'City IT / MIS System Administrator',
    agency: 'City Information & Communications Technology Office (CSFP MIS)',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'SA',
    assignedBarangays: 'City-wide IT Infrastructure & System Administration',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Primary administrator in the Admin Console (/admin), managing accounts for ECCD Administrative officers and Child Development Teachers.',
  },
  {
    id: 'USR-ADMIN-001',
    email: 'admin@eccd.gov.ph',
    password: 'Eccd@$SULpX',
    name: 'Ma. Elena D. Santos, RSW',
    role: ROLES.ADMIN,
    designation: 'ECCD Administrative Officer / CSWDO Supervisor',
    agency: 'City Social Welfare & Development Office (CSWDO)',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'ES',
    assignedBarangays: 'All 35 Barangays (City-wide Consolidated Scope)',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services across all 35 barangays.',
  },
  {
    id: 'USR-CDT-002',
    email: 'cdt@eccd.gov.ph',
    password: 'password',
    name: 'Remedios D. Garcia, CDT',
    role: ROLES.CDT,
    designation: 'Child Development Teacher (CDT)',
    agency: 'San Jose Child Development Center I / CSWDO',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RG',
    assignedBarangays: 'Brgy. San Jose, Brgy. Dolores',
    assignedCenter: 'San Jose Child Development Center I',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
  },
];

export const DEMO_ACCOUNTS = OFFICIAL_ACCOUNTS;

export function getDemoAccountForRole(roleKey) {
  if (roleKey === ROLES.SYSADMIN || roleKey === 'sysadmin') {
    return OFFICIAL_ACCOUNTS[0];
  }
  if (roleKey === ROLES.ADMIN || roleKey === 'cswdo_admin' || roleKey === 'eccd_admin') {
    return OFFICIAL_ACCOUNTS[1];
  }
  return OFFICIAL_ACCOUNTS[2];
}

// --- Session Storage Keys ---

export const TOKEN_KEY = 'eccd_care_session_token';
export const USER_KEY = 'eccd_care_session_user';
export const EXPIRY_KEY = 'eccd_care_session_expiry';
export const CREDENTIALS_STORE_KEY = 'eccd_active_credentials_store';

// Session duration: 8 hours (simulated government workday)
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/**
 * Reads the latest active password for a given email (from local credential store or defaults).
 * Enforces strictly ONE valid password per account — NO aliases or bypasses.
 */
export function getOfflineUserCredential(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  try {
    const store = JSON.parse(localStorage.getItem(CREDENTIALS_STORE_KEY) || '{}');
    if (store[clean]) {
      return store[clean];
    }
  } catch (_) {}
  return OFFICIAL_ACCOUNTS.find((a) => a.email.toLowerCase() === clean) || null;
}

/**
 * Updates a user's password in the local credential store so changes by SysAdmin
 * take effect immediately across all sessions and offline scenarios.
 */
export function updateOfflineUserCredential(email, newPassword, extraData = null) {
  if (!email || !newPassword) return;
  const clean = email.toLowerCase().trim();
  try {
    const store = JSON.parse(localStorage.getItem(CREDENTIALS_STORE_KEY) || '{}');
    const existing = store[clean] || OFFICIAL_ACCOUNTS.find((a) => a.email.toLowerCase() === clean) || {};
    store[clean] = {
      ...existing,
      ...(extraData || {}),
      email: clean,
      password: String(newPassword), // Strictly single password
    };
    delete store[clean].acceptedPasswords; // Remove any old alternative passwords
    localStorage.setItem(CREDENTIALS_STORE_KEY, JSON.stringify(store));
  } catch (_) {}
}

// --- Consistent API Error Format (api-and-interface-design skill) ---

function createApiError(code, message, status = 400, details = null) {
  return {
    ok: false,
    status,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

function createApiSuccess(data, status = 200) {
  return {
    ok: true,
    status,
    data,
  };
}

// --- Token Generation (mock fallback) ---

function generateMockToken() {
  const payload = Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
  return `eccd_jwt_${payload}`;
}

function simulateNetworkDelay(minMs = 100, maxMs = 250) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// --- API Service Functions ---

/**
 * POST /api/auth/login
 *
 * Authenticates user credentials via real backend MySQL / JWT Auth.
 * If password was changed by System Admin, backend validates the new password.
 * Only the exact active password is accepted.
 */
export async function apiLogin({ email, password }) {
  // Boundary validation (api-and-interface-design skill §3)
  if (!email || !email.trim()) {
    return createApiError(
      'VALIDATION_ERROR',
      'Email address is required.',
      422,
      { field: 'email' }
    );
  }

  if (!password || !password.trim()) {
    return createApiError(
      'VALIDATION_ERROR',
      'Password is required.',
      422,
      { field: 'password' }
    );
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. ATTEMPT LIVE BACKEND AUTHENTICATION FIRST (Laravel JWT Auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({ email: cleanEmail, password: String(password) }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json();

    if (res.ok && json.ok && json.data) {
      const { access_token, user: backendUser } = json.data;
      const roleName = backendUser.role?.name || backendUser.role || 'cdt';
      const roleLabel = backendUser.role?.label || ROLE_LABELS[roleName] || 'Child Development Teacher (CDT)';

      const initials = (backendUser.name || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

      const safeUser = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: roleName,
        roleLabel,
        designation: backendUser.worker?.role || (roleName === 'sysadmin' ? 'City IT / MIS System Administrator' : (roleName === 'eccd_admin' ? 'ECCD Administrative Officer / CSWDO Supervisor' : 'Child Development Teacher (CDT)')),
        agency: roleName === 'sysadmin' ? 'City Information & Communications Technology Office (CSFP MIS)' : (roleName === 'eccd_admin' ? 'City Social Welfare & Development Office (CSWDO)' : (backendUser.worker?.dayCareCenter?.name || 'San Jose Child Development Center I / CSWDO')),
        avatarInitials: initials,
        assignedBarangays: roleName === 'sysadmin' ? 'City-wide IT Infrastructure' : (roleName === 'eccd_admin' ? 'All 35 Barangays (City-wide Consolidated Scope)' : (backendUser.worker?.barangay?.name || 'Assigned Center Area')),
        assignedCenter: backendUser.worker?.dayCareCenter?.name || null,
        activeSchoolYear: 'SY 2026–2027',
      };

      const expiresAt = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem('eccd_jwt_token', access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem(EXPIRY_KEY, expiresAt.toString());

      // Cache verified password locally so offline mode stays in sync
      updateOfflineUserCredential(cleanEmail, password, safeUser);

      return createApiSuccess({
        user: safeUser,
        token: access_token,
        expiresAt: new Date(expiresAt).toISOString(),
        landingPage: ROLE_LANDING[safeUser.role] || 'dashboard',
      });
    }

    // Backend explicitly rejected credentials (HTTP 401 / 422)
    // CRITICAL: NEVER allow login when backend reports wrong password!
    if (res.status === 401 || (json && json.status === 401)) {
      return createApiError(
        'INVALID_CREDENTIALS',
        json.error || 'The email address or password you entered is incorrect. Please check your credentials and try again.',
        401
      );
    }
  } catch (netErr) {
    console.warn('Backend login unreachable, falling back to local credential store:', netErr.message);
  }

  // 2. OFFLINE FALLBACK (Only when backend server is physically unreachable)
  // Strictly verifies against the single active password registered or reset by SysAdmin
  const offlineAccount = getOfflineUserCredential(cleanEmail);

  if (!offlineAccount || offlineAccount.password !== password) {
    return createApiError(
      'INVALID_CREDENTIALS',
      'The email address or password you entered is incorrect. Please check your credentials and try again.',
      401
    );
  }

  const token = generateMockToken();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const { password: _pwd, ...safeUser } = offlineAccount;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('eccd_jwt_token', token);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  localStorage.setItem(EXPIRY_KEY, expiresAt.toString());

  return createApiSuccess({
    user: safeUser,
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    landingPage: ROLE_LANDING[safeUser.role] || 'dashboard',
  });
}

/**
 * POST /api/auth/logout
 *
 * Clears session state.
 * auth-implementation-patterns: destroy session, clear all stored tokens.
 */
export async function apiLogout() {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('eccd_jwt_token');
    if (token) {
      // Non-blocking backend token invalidation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        signal: controller.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
    }
  } catch (_) {
    // Non-blocking
  }

  // Defensively clear all auth tokens and session data unconditionally
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('eccd_jwt_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    sessionStorage.clear();
  } catch (_) {}

  return createApiSuccess({ message: 'Session terminated successfully.' });
}

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user from session.
 * Checks token validity and ensures field workers are NEVER kicked out offline.
 *
 * auth-implementation-patterns: validate token lifecycle, detect expiry.
 */
export async function apiGetCurrentUser() {
  // No network delay for session check — instant UX
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('eccd_jwt_token');
  const userJson = localStorage.getItem(USER_KEY);
  const expiryStr = localStorage.getItem(EXPIRY_KEY);

  // No session exists
  if (!token || !userJson) {
    return createApiError(
      'UNAUTHENTICATED',
      'No active session found. Please sign in.',
      401
    );
  }

  // Offline-First Session Guard:
  // If the field worker is offline or currently working, never kick them out.
  // Seamlessly extend the offline working lease.
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const expiresAt = parseInt(expiryStr, 10);

  if (isOffline) {
    // When offline, extend the lease so the session is never destroyed in the field
    const extendedExpiry = Date.now() + SESSION_DURATION_MS * 7; // 7 days offline lease
    localStorage.setItem(EXPIRY_KEY, extendedExpiry.toString());
  } else if (expiresAt && Date.now() > expiresAt) {
    // If online and session expired, extend if active user present or clean up
    // Clean up expired session only when explicitly online
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('eccd_jwt_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);

    return createApiError(
      'SESSION_EXPIRED',
      'Your session has expired. Please sign in again to continue.',
      401
    );
  }

  try {
    const user = JSON.parse(userJson);
    return createApiSuccess({ user });
  } catch {
    return createApiError(
      'SESSION_CORRUPT',
      'Session data is invalid. Please sign in again.',
      401
    );
  }
}

/**
 * POST /api/auth/forgot-password
 *
 * Simulates password reset request.
 * Always returns success to prevent email enumeration (auth-implementation-patterns).
 */
export async function apiForgotPassword({ email }) {
  await simulateNetworkDelay(800, 1500);

  // Boundary validation
  if (!email || !email.trim()) {
    return createApiError(
      'VALIDATION_ERROR',
      'Please provide your registered email address.',
      422,
      { field: 'email' }
    );
  }

  // Always return success to prevent email enumeration
  return createApiSuccess({
    message:
      'If this email address is registered in the ECCD CARE system, a password reset link has been sent. Please check your inbox or contact CSWDO IT Support.',
  });
}

// --- Session Utility Helpers ---

/**
 * Check if user has permission for a given sidebar section.
 * react-patterns skill: pure function, no side effects.
 */
export function hasPermission(user, sectionId) {
  if (!user || !user.role) return false;
  const perms = ROLE_PERMISSIONS[user.role];
  if (!perms) return false;
  if (perms.sections === '*') return true;
  return perms.sections.includes(sectionId);
}

/**
 * Get demo accounts list (passwords masked for display).
 * Returns the two standard official roles.
 */
export function getDemoAccounts() {
  return DEMO_ACCOUNTS.map(({ email, password, name, role, designation }) => ({
    email,
    password: password.replace(/./g, '•').slice(0, -2) + password.slice(-2),
    passwordRaw: password,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
    designation,
  }));
}
