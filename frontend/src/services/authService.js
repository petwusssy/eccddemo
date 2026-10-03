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

export const ROLES = {
  ADMIN: 'cswdo_admin',
  FIELD_WORKER: 'field_worker',
  DAYCARE_WORKER: 'daycare_worker',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'CSWDO Admin / Supervisor',
  [ROLES.FIELD_WORKER]: 'Service Provider / Field Worker',
  [ROLES.DAYCARE_WORKER]: 'Day Care Worker',
};

// Role → default landing page after login
export const ROLE_LANDING = {
  [ROLES.ADMIN]: 'dashboard',
  [ROLES.FIELD_WORKER]: 'community-mapping',
  [ROLES.DAYCARE_WORKER]: 'enrollment',
};

// Role → permitted sidebar sections (role-based navigation)
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    label: 'Full System Access',
    sections: '*', // all sections
  },
  [ROLES.FIELD_WORKER]: {
    label: 'Community & Child Registration',
    sections: [
      'dashboard',
      'children',
      'households',
      'community-mapping',
      'enrollment',
      'follow-ups',
      'community-network',
      'barangays',
      'daycare-centers',
      'workers',
    ],
  },
  [ROLES.DAYCARE_WORKER]: {
    label: 'Day Care Center Operations',
    sections: [
      'dashboard',
      'children',
      'enrollment',
      'health-monitoring',
      'eccd-checklist',
      'follow-ups',
      'community-network',
      'daycare-centers',
      'reports',
    ],
  },
};

// --- Demo Accounts (synthetic, safe, non-production) ---

const DEMO_ACCOUNTS = [
  {
    id: 'USR-CSWDO-001',
    email: 'admin@eccdcare.demo',
    password: 'admin123',
    name: 'Ma. Elena D. Santos, RSW',
    role: ROLES.ADMIN,
    designation: 'CSWDO Senior Social Worker / ECCD Focal',
    agency: 'City Social Welfare & Development Office',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'ES',
    assignedBarangays: 'All 10 City Barangays (City-wide)',
    activeSchoolYear: 'SY 2026–2027',
  },
  {
    id: 'USR-CSWDO-014',
    email: 'fieldworker@eccdcare.demo',
    password: 'field123',
    name: 'Rodolfo C. Manansala',
    role: ROLES.FIELD_WORKER,
    designation: 'Community Development Officer II',
    agency: 'CSWDO — Community Development Section',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RM',
    assignedBarangays: 'Brgy. San Jose, Brgy. Dolores, Brgy. Lourdes',
    activeSchoolYear: 'SY 2026–2027',
  },
  {
    id: 'USR-CDC-027',
    email: 'daycare@eccdcare.demo',
    password: 'daycare123',
    name: 'Remedios D. Garcia, CDW I',
    role: ROLES.DAYCARE_WORKER,
    designation: 'Accredited Child Development Worker I',
    agency: 'San Jose Child Development Center I',
    lgu: 'City of San Fernando, Pampanga',
    region: 'Region III — Central Luzon',
    avatarInitials: 'RG',
    assignedBarangays: 'Brgy. San Jose',
    assignedCenter: 'San Jose Child Development Center I',
    activeSchoolYear: 'SY 2026–2027',
  },
];

export function getDemoAccountForRole(roleKey) {
  return DEMO_ACCOUNTS.find(a => a.role === roleKey) || DEMO_ACCOUNTS[0];
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
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRY_KEY);

  return createApiSuccess({ message: 'Session terminated successfully.' });
}

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user from session.
 * Checks token validity and expiry.
 *
 * auth-implementation-patterns: validate token lifecycle, detect expiry.
 */
export async function apiGetCurrentUser() {
  // No network delay for session check — instant UX
  const token = localStorage.getItem(TOKEN_KEY);
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

  // Session expired
  const expiresAt = parseInt(expiryStr, 10);
  if (Date.now() > expiresAt) {
    // Clean up expired session
    localStorage.removeItem(TOKEN_KEY);
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
 */
export function getDemoAccounts() {
  return DEMO_ACCOUNTS.map(({ email, password, name, role }) => ({
    email,
    password: password.replace(/./g, '•').slice(0, -2) + password.slice(-2),
    passwordRaw: password,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
  }));
}
