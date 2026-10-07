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

// --- Role Definitions (auth-implementation-patterns: RBAC) ---
// Mandated 2 Roles:
// 1. Child Development Teacher (CDT) — Frontline implementer delivering activities and interventions directly to children & families
// 2. ECCD Administrative — Consolidates data, coordinates requirements, plans and organizes programs and services

export const ROLES = {
  ADMIN: 'eccd_admin',
  CDT: 'cdt',
  // Backward compatibility alias keys:
  FIELD_WORKER: 'cdt',
  DAYCARE_WORKER: 'cdt',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'ECCD Administrative',
  [ROLES.CDT]: 'Child Development Teacher (CDT)',
  // Backwards compatibility mappings
  'cswdo_admin': 'ECCD Administrative',
  'field_worker': 'Child Development Teacher (CDT)',
  'daycare_worker': 'Child Development Teacher (CDT)',
};

// Role → default landing page after login
export const ROLE_LANDING = {
  [ROLES.ADMIN]: 'dashboard',
  [ROLES.CDT]: 'community-mapping',
  'cswdo_admin': 'dashboard',
  'field_worker': 'community-mapping',
  'daycare_worker': 'community-mapping',
};

// Role → permitted sidebar sections (Strict role-based navigation & module boundaries)
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    label: 'Data Consolidation & Planning Administration',
    description: 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
    sections: '*', // Full access across consolidation dashboard, reports, planning, and system administration
  },
  [ROLES.CDT]: {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'children',
      'households',
      'community-mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
      'community-network',
    ],
    // Strictly restricted from: 'dashboard' (Executive consolidation), 'reports' (Citywide submissions), 'audit-logs', 'settings'
  },
  // Legacy aliases
  'field_worker': {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'children',
      'households',
      'community-mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
      'community-network',
    ],
  },
  'daycare_worker': {
    label: 'Frontline ECCD Programs & Direct Delivery',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    sections: [
      'children',
      'households',
      'community-mapping',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'development-assessment',
      'follow-ups',
      'community-network',
    ],
  },
};

// --- Demo Accounts (synthetic, safe, non-production) ---

const DEMO_ACCOUNTS = [
  {
    id: 'USR-ADMIN-001',
    email: 'admin@eccdcare.demo',
    password: 'admin123',
    name: 'Ma. Elena D. Santos, RSW',
    role: ROLES.ADMIN,
    designation: 'ECCD Administrative Officer / CSWDO Supervisor',
    agency: 'City Social Welfare & Development Office (CSWDO)',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'ES',
    assignedBarangays: 'All 35 Barangays (City-wide Consolidated Scope)',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
  },
  {
    id: 'USR-CDT-002',
    email: 'teacher@eccdcare.demo',
    password: 'teacher123',
    name: 'Remedios D. Garcia, CDT',
    role: ROLES.CDT,
    designation: 'Child Development Teacher (CDT)',
    agency: 'San Jose Child Development Center I / CSWDO',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RG',
    assignedBarangays: 'Brgy. San Jose, Brgy. Dolores, Brgy. San Isidro',
    assignedCenter: 'San Jose Child Development Center I',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
  },
  // Legacy aliases supported for quick login:
  {
    id: 'USR-CSWDO-014',
    email: 'fieldworker@eccdcare.demo',
    password: 'field123',
    name: 'Rodolfo C. Manansala, CDT',
    role: ROLES.CDT,
    designation: 'Child Development Teacher (CDT)',
    agency: 'CSWDO Frontline Community Section',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RM',
    assignedBarangays: 'Brgy. San Jose, Brgy. Dolores',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
  },
  {
    id: 'USR-CDC-027',
    email: 'daycare@eccdcare.demo',
    password: 'daycare123',
    name: 'Remedios D. Garcia, CDT',
    role: ROLES.CDT,
    designation: 'Child Development Teacher (CDT)',
    agency: 'San Jose Child Development Center I',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RG',
    assignedBarangays: 'Brgy. San Jose',
    assignedCenter: 'San Jose Child Development Center I',
    activeSchoolYear: 'SY 2026–2027',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
  },
];

export function getDemoAccountForRole(roleKey) {
  if (roleKey === ROLES.ADMIN || roleKey === 'cswdo_admin' || roleKey === 'eccd_admin') {
    return DEMO_ACCOUNTS[0];
  }
  return DEMO_ACCOUNTS[1];
}

// --- Session Storage Keys ---

export const TOKEN_KEY = 'eccd_care_session_token';
export const USER_KEY = 'eccd_care_session_user';
export const EXPIRY_KEY = 'eccd_care_session_expiry';

// Session duration: 8 hours (simulated government workday)
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// --- Simulated Network Delay ---

function simulateNetworkDelay(minMs = 600, maxMs = 1200) {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
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

// --- Token Generation (mock) ---

function generateMockToken() {
  const payload = Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
  return `eccd_mock_${payload}`;
}

// --- API Service Functions ---

/**
 * POST /api/auth/login
 *
 * Validates credentials against demo accounts.
 * Returns user profile + session token on success.
 *
 * api-and-interface-design: validate at boundaries, consistent error format.
 * auth-implementation-patterns: regenerate session on login, store minimal identity.
 */
export async function apiLogin({ email, password }) {
  await simulateNetworkDelay();

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

  // Credential lookup
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase().trim()
  );

  if (!account || account.password !== password) {
    return createApiError(
      'INVALID_CREDENTIALS',
      'The email address or password you entered is incorrect. Please check your credentials and try again.',
      401
    );
  }

  // Generate session (auth-implementation-patterns: regenerate on login)
  const token = generateMockToken();
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  // Strip password before storing (never log or persist secrets)
  const { password: _pwd, ...safeUser } = account;

  // Persist session to localStorage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('eccd_jwt_token', token);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  localStorage.setItem(EXPIRY_KEY, expiresAt.toString());

  return createApiSuccess({
    user: safeUser,
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    landingPage: ROLE_LANDING[safeUser.role],
  });
}

/**
 * POST /api/auth/logout
 *
 * Clears session state.
 * auth-implementation-patterns: destroy session, clear all stored tokens.
 */
export async function apiLogout() {
  await simulateNetworkDelay(200, 400);

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('eccd_jwt_token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRY_KEY);

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
  return [DEMO_ACCOUNTS[0], DEMO_ACCOUNTS[1]].map(({ email, password, name, role, designation }) => ({
    email,
    password: password.replace(/./g, '•').slice(0, -2) + password.slice(-2),
    passwordRaw: password,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
    designation,
  }));
}
