/**
 * ECCD CARE — Centralized Relational Data Model & Store
 * City Social Welfare and Development Office (CSWDO)
 *
 * Implements the 14 core entities with strict relational integrity:
 * 1. User
 * 2. Role
 * 3. Worker
 * 4. Barangay
 * 5. DayCareCenter
 * 6. MappingActivity
 * 7. Household
 * 8. Child (Universal persistent entity — ECCD ID is immutable primary key)
 * 9. Enrollment
 * 10. HealthMonitoring
 * 11. DevelopmentAssessment
 * 12. FollowUp
 * 13. AuditLog
 * 14. Resource
 *
 * RELATIONSHIP CONSTRAINTS:
 * - Household → has many Children
 * - Child → belongs to Household
 * - Child → has many Enrollment records
 * - Child → has many HealthMonitoring records
 * - Child → has many DevelopmentAssessment records
 * - Child → has many FollowUps
 * - DayCareCenter → has many Workers
 * - DayCareCenter → has many enrolled Children
 * - Barangay → has many Households
 * - Barangay → has many Children
 * - Barangay → has many DayCareCenters
 * - MappingActivity → has many assigned Workers
 * - MappingActivity → records mapped Households and Children
 *
 * CRITICAL RULE:
 * NEVER duplicate child records when enrollment, health monitoring,
 * or development assessment occurs. The ECCD Child ID is the single persistent
 * foreign key across all child-related lifecycle records.
 */

import { SAN_FERNANDO_BARANGAYS } from '../data/sanFernandoBarangays.js';
import { getPhilippinesDate, getPhilippinesDateTime, addDaysPHT } from '../utils/phTime.js';
import { getApiUrl } from './apiConfig.js';

const STORAGE_KEY = 'eccd_care_central_datastore_v3';

// Seed Roles
export const SEED_ROLES = [
  {
    id: 'ROLE-SYSADMIN',
    name: 'sysadmin',
    label: 'CSFP System Administrator',
    description: 'City IT / MIS Administrator managing system access, tenant security, audit logs, and account provisioning in /admin.',
    permissions: ['*'],
  },
  {
    id: 'ROLE-ADMIN',
    name: 'eccd_admin',
    label: 'ECCD Administrative',
    description: 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
    permissions: ['*'],
  },
  {
    id: 'ROLE-CDT',
    name: 'cdt',
    label: 'Child Development Teacher (CDT)',
    description: 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
    permissions: [
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
];

// Seed Barangays (City of San Fernando, Pampanga)
export const SEED_BARANGAYS = SAN_FERNANDO_BARANGAYS.map((name, i) => ({
  id: `BRGY-${String(i + 1).padStart(3, '0')}`,
  name,
  district: 'City of San Fernando',
}));

// Seed Day Care Centers
export const SEED_DAY_CARE_CENTERS = [];

// Seed Users & Workers
export const SEED_USERS = [
  {
    id: 'USR-SYS-001',
    username: 'sysadmin.csfp',
    name: 'CSFP MIS System Administrator',
    email: 'sysadmin@csfp.gov.ph',
    password: 'password',
    roleId: 'ROLE-SYSADMIN',
    role: 'sysadmin',
    designation: 'City IT / MIS System Administrator',
    status: 'Active',
  },
  {
    id: 'USR-001',
    username: 'admin.cswdo',
    name: 'Ma. Elena D. Santos, RSW',
    email: 'admin@eccd.gov.ph',
    password: 'password',
    roleId: 'ROLE-ADMIN',
    role: 'eccd_admin',
    designation: 'ECCD Administrative Officer / CSWDO Supervisor',
    status: 'Active',
  },
  {
    id: 'USR-002',
    username: 'remedios.garcia',
    name: 'Remedios D. Garcia, CDT',
    email: 'cdt@eccd.gov.ph',
    password: 'password',
    roleId: 'ROLE-CDT',
    role: 'cdt',
    designation: 'Child Development Teacher (CDT)',
  },
];

export const SEED_WORKERS = [];

// Seed Mapping Activities
export const SEED_MAPPING_ACTIVITIES = [];

// Operational Collections — Initialized to Clean Empty Arrays (0 records on launch)
export const SEED_HOUSEHOLDS = [];
export const SEED_CHILDREN = [];
export const SEED_ENROLLMENTS = [];
export const SEED_HEALTH_MONITORINGS = [];
export const SEED_DEVELOPMENT_ASSESSMENTS = [];
export const SEED_FOLLOW_UPS = [];
export const SEED_AUDIT_LOGS = [];


// Seed Resources
export const SEED_RESOURCES = [
  {
    id: 'RES-001',
    title: 'Form 1 – Home Profile',
    category: 'Community Mapping & Registration',
    code: 'ECCD-F1',
    formNumber: 'Form 1',
    description: 'Official CSWDO demographic profiling form for family household units.',
    status: 'Integrated & Active',
    officialDocPlaceholder: 'INTEGRATED OFFICIAL FORM 1',
    fileType: 'Digital Form / PDF Reference',
    lastUpdated: '2026-09-01',
  },
  {
    id: 'RES-002',
    title: 'Form 2 – Children Profile',
    category: 'Community Mapping & Registration',
    code: 'ECCD-F2',
    formNumber: 'Form 2',
    description: 'Official developmental roster of identified 0–4 age cohort children.',
    status: 'Integrated & Active',
    officialDocPlaceholder: 'INTEGRATED OFFICIAL FORM 2',
    fileType: 'Digital Form / PDF Reference',
    lastUpdated: '2026-09-01',
  },
  {
    id: 'RES-003',
    title: 'ECCD Checklist Child’s Record 1',
    category: 'ECCD Checklist',
    code: 'ECCD-CHK-CR1',
    formNumber: 'Child’s Record 1',
    description: 'Standardized assessment tool across 7 developmental domains for ages 0–3.0.',
    status: 'Integrated & Active',
    officialDocPlaceholder: 'INTEGRATED OFFICIAL ECCD CHECKLIST CHILD’S RECORD 1',
    fileType: 'Digital Assessment / Rating Scale',
    lastUpdated: '2026-09-01',
  },
  {
    id: 'RES-004',
    title: 'ECCD Checklist Child’s Record 2',
    category: 'ECCD Checklist',
    code: 'ECCD-CHK-CR2',
    formNumber: 'Child’s Record 2',
    description: 'Standardized assessment tool across 7 developmental domains for ages 3.1–5.11.',
    status: 'Integrated & Active',
    officialDocPlaceholder: 'INTEGRATED OFFICIAL ECCD CHECKLIST CHILD’S RECORD 2',
    fileType: 'Digital Assessment / Rating Scale',
    lastUpdated: '2026-09-01',
  },
];

/**
 * In-Memory & LocalStorage Sync Store
 */
class CentralDataStore {
  constructor() {
    this.data = this.loadInitial();
    // Auto-hydrate once on app launch and when network connection is restored
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncWithBackend().catch(() => {});
      }, 500);

      // Pull latest records when returning online or switching to tab
      window.addEventListener('online', () => {
        this.syncWithBackend(true).catch(() => {});
      });

      window.addEventListener('focus', () => {
        this.syncWithBackend(true).catch(() => {});
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncWithBackend(true).catch(() => {});
        }
      });
    }
  }

  loadInitial() {
    let initialData = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Automatically clear out legacy mock seeds so app opens clean
        window.localStorage.removeItem('eccd_care_central_datastore_v1');
        window.localStorage.removeItem('eccd_care_central_datastore_v2');
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          initialData = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('CentralDataStore: Failed to read from localStorage:', e);
    }

    if (!initialData) {
      initialData = {
        roles: SEED_ROLES,
        users: SEED_USERS,
        workers: SEED_WORKERS,
        barangays: SEED_BARANGAYS,
        dayCareCenters: SEED_DAY_CARE_CENTERS,
        mappingActivities: SEED_MAPPING_ACTIVITIES,
        households: SEED_HOUSEHOLDS,
        children: SEED_CHILDREN,
        enrollments: SEED_ENROLLMENTS,
        healthMonitorings: SEED_HEALTH_MONITORINGS,
        developmentAssessments: SEED_DEVELOPMENT_ASSESSMENTS,
        followUps: SEED_FOLLOW_UPS,
        auditLogs: SEED_AUDIT_LOGS,
        resources: SEED_RESOURCES,
      };
    }

    // Clear obsolete legacy keys so stale duplicates are permanently purged
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('eccd_mapping_households_data_v2');
        window.localStorage.removeItem('eccd_mapping_children_data_v2');
        window.localStorage.removeItem('eccd_children_360_data_v2');
      }
    } catch (_) {}

    // Deduplicate households in initial data
    if (Array.isArray(initialData.households)) {
      const seenHh = new Map();
      initialData.households = initialData.households.filter((hh) => {
        if (!hh) return false;
        const guardian = (hh.parentGuardian || hh.parent_guardian || '').toLowerCase().trim();
        const brgy = (hh.barangay || '').toLowerCase().trim();
        const key = guardian && guardian !== 'parent / guardian' && guardian !== 'n/a'
          ? `${guardian}|${brgy}`
          : (hh.id || Math.random());
        if (seenHh.has(key)) {
          const existing = seenHh.get(key);
          if (hh.id && !hh.id.startsWith('HH-2026-0') && existing.id && existing.id.startsWith('HH-2026-0')) {
            existing.id = hh.id;
            existing.household_no = hh.id;
          }
          return false;
        }
        seenHh.set(key, hh);
        return true;
      });
    }

    // Deduplicate children in initial data
    if (Array.isArray(initialData.children)) {
      const seenKids = new Map();
      initialData.children = initialData.children.filter((k) => {
        if (!k) return false;
        const name = (k.fullName || `${k.firstName || ''} ${k.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
        const key = name ? `${name}|${(k.householdId || '').trim() || (k.birthDate || '').trim()}` : (k.id || Math.random());
        if (name && seenKids.has(key)) {
          const existing = seenKids.get(key);
          const currentCanonical = k.id && (k.id.includes('-001') || !k.id.includes('-00000'));
          const existingTemp = !existing.id || existing.id.startsWith('TMP-') || existing.id.includes('-00000');
          if (currentCanonical && existingTemp) {
            existing.id = k.id;
            existing.eccd_id = k.id;
          }
          return false;
        }
        seenKids.set(key, k);
        return true;
      });
    }

    // Consolidate follow-up cases by childId (1 case per child, merging timeline history)
    if (Array.isArray(initialData.followUps)) {
      const casesByChild = new Map();
      const sorted = [...initialData.followUps].sort((a, b) => {
        const aActive = a.status !== 'Completed' && a.status !== 'Resolved' && a.category !== 'Completed';
        const bActive = b.status !== 'Completed' && b.status !== 'Resolved' && b.category !== 'Completed';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      sorted.forEach((f) => {
        const childKey = f.childId || f.id;
        if (!casesByChild.has(childKey)) {
          casesByChild.set(childKey, { ...f, history: [...(f.history || [])] });
        } else {
          const canonical = casesByChild.get(childKey);
          if (Array.isArray(f.history)) {
            f.history.forEach((h) => {
              if (!canonical.history.some((ch) => ch.date === h.date && ch.action === h.action)) {
                canonical.history.push(h);
              }
            });
          }
        }
      });
      initialData.followUps = Array.from(casesByChild.values());
    }

    // Ensure ALL CAPS for all names of children, parents, and guardians
    if (Array.isArray(initialData.children)) {
      initialData.children.forEach((c) => {
        if (!c) return;
        if (c.firstName) c.firstName = String(c.firstName).toUpperCase();
        if (c.middleName) c.middleName = String(c.middleName).toUpperCase();
        if (c.lastName) c.lastName = String(c.lastName).toUpperCase();
        if (c.fullName) c.fullName = String(c.fullName).toUpperCase();
        if (c.parentGuardian) c.parentGuardian = String(c.parentGuardian).toUpperCase();
      });
    }
    if (Array.isArray(initialData.households)) {
      initialData.households.forEach((h) => {
        if (!h) return;
        if (h.parentGuardian) h.parentGuardian = String(h.parentGuardian).toUpperCase();
        if (h.parent_guardian) h.parent_guardian = String(h.parent_guardian).toUpperCase();
      });
    }

    return initialData;
  }

  notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eccd:datastore-updated'));
    }
  }

  save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('CentralDataStore: Failed to write to localStorage:', e);
    }
    this.notify();
  }

  reset() {
    this.data = {
      roles: [...SEED_ROLES],
      users: [...SEED_USERS],
      workers: [...SEED_WORKERS],
      barangays: [...SEED_BARANGAYS],
      dayCareCenters: [...SEED_DAY_CARE_CENTERS],
      mappingActivities: [...SEED_MAPPING_ACTIVITIES],
      households: [...SEED_HOUSEHOLDS],
      children: [...SEED_CHILDREN],
      enrollments: [...SEED_ENROLLMENTS],
      healthMonitorings: [...SEED_HEALTH_MONITORINGS],
      developmentAssessments: [...SEED_DEVELOPMENT_ASSESSMENTS],
      followUps: [...SEED_FOLLOW_UPS],
      auditLogs: [...SEED_AUDIT_LOGS],
      resources: [...SEED_RESOURCES],
    };
    this.save();
  }

  deduplicateHouseholds() {
    if (!Array.isArray(this.data.households)) return false;
    const seen = new Map();
    const originalCount = this.data.households.length;
    const clean = [];

    this.data.households.forEach((hh) => {
      if (!hh) return;
      const guardian = (hh.parentGuardian || hh.parent_guardian || '').toLowerCase().trim();
      const brgy = (hh.barangay || '').toLowerCase().trim();
      const key = guardian && guardian !== 'parent / guardian' && guardian !== 'n/a'
        ? `${guardian}|${brgy}`
        : (hh.id || Math.random());

      if (seen.has(key)) {
        const existing = seen.get(key);
        if (hh.id && !hh.id.startsWith('HH-2026-0') && existing.id && existing.id.startsWith('HH-2026-0')) {
          existing.id = hh.id;
          existing.household_no = hh.id;
        }
        Object.assign(existing, hh);
      } else {
        seen.set(key, hh);
        clean.push(hh);
      }
    });

    if (clean.length !== originalCount) {
      this.data.households = clean;
      return true;
    }
    return false;
  }

  deduplicateChildren() {
    if (!Array.isArray(this.data.children)) return false;
    const seen = new Map();
    const originalCount = this.data.children.length;
    const clean = [];

    this.data.children.forEach((c) => {
      if (!c) return;
      const name = (c.fullName || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
      const hh = (c.householdId || '').trim();
      const dob = (c.birthDate || '').trim();
      const key = name ? `${name}|${hh || dob}` : (c.id || Math.random());

      if (name && seen.has(key)) {
        const existing = seen.get(key);
        const currentIsCanonical = c.id && (c.id.includes('-001') || !c.id.includes('-00000'));
        const existingIsTemp = !existing.id || existing.id.startsWith('TMP-') || existing.id.includes('-00000');
        if (currentIsCanonical && existingIsTemp) {
          existing.id = c.id;
          existing.eccd_id = c.id;
        }
        Object.assign(existing, {
          ...c,
          id: existing.id,
          eccd_id: existing.id,
        });
      } else {
        seen.set(key, c);
        clean.push(c);
      }
    });

    if (clean.length !== originalCount) {
      this.data.children = clean;
      return true;
    }
    return false;
  }

  /**
   * Merge live records received from MySQL backend API into local store.
   * Normalizes fields so UI views never crash on undefined properties.
   */
  mergeRecordsFromServer(serverChildren = [], serverHouseholds = [], serverEnrollments = []) {
    let changed = false;

    if (Array.isArray(serverHouseholds) && serverHouseholds.length > 0) {
      if (!Array.isArray(this.data.households)) this.data.households = [];
      serverHouseholds.forEach((sh) => {
        if (!sh) return;
        const id = sh.id || sh.household_no;
        if (!id) return;
        const guardian = (sh.parentGuardian || sh.parent_guardian || '').toLowerCase().trim();
        const brgy = (sh.barangay || '').toLowerCase().trim();

        const idx = this.data.households.findIndex((h) => {
          if (h.id === id || h.household_no === id) return true;
          const hGuardian = (h.parentGuardian || h.parent_guardian || '').toLowerCase().trim();
          const hBrgy = (h.barangay || '').toLowerCase().trim();
          return guardian && hGuardian && guardian === hGuardian && brgy === hBrgy;
        });

        const normalizedHh = {
          ...sh,
          id,
          household_no: id,
          parentGuardian: String(sh.parentGuardian || sh.parent_guardian || 'Parent / Guardian').toUpperCase(),
          barangay: sh.barangay || 'San Isidro',
          status: sh.status || 'Completed',
        };
        if (idx >= 0) {
          this.data.households[idx] = { ...this.data.households[idx], ...normalizedHh };
          changed = true;
        } else {
          this.data.households.unshift(normalizedHh);
          changed = true;
        }
      });
    }

    if (Array.isArray(serverChildren) && serverChildren.length > 0) {
      if (!Array.isArray(this.data.children)) this.data.children = [];
      serverChildren.forEach((sc) => {
        if (!sc) return;
        const id = sc.id || sc.eccd_id;
        if (!id) return;
        const fnUpper = String(sc.firstName || sc.first_name || '').toUpperCase();
        const lnUpper = String(sc.lastName || sc.last_name || '').toUpperCase();
        const mnUpper = String(sc.middleName || sc.middle_name || '').toUpperCase();
        const fullUpper = String(sc.fullName || `${fnUpper} ${lnUpper}`.trim() || 'CHILD RECORD').toUpperCase();
        const pGuardUpper = String(sc.parentGuardian || sc.parent_guardian || '').toUpperCase();
        const normName = (fullUpper || `${fnUpper} ${lnUpper}`).toLowerCase().trim().replace(/\s+/g, ' ');
        const ageY = parseInt(sc.ageYears ?? 3, 10);
        const ageM = parseInt(sc.ageMonths ?? 0, 10);
        const normalizedChild = {
          ...sc,
          id,
          eccd_id: id,
          firstName: fnUpper,
          lastName: lnUpper,
          middleName: mnUpper,
          fullName: fullUpper,
          ageYears: isNaN(ageY) ? 3 : ageY,
          ageMonths: isNaN(ageM) ? 0 : ageM,
          ageDisplay: sc.ageDisplay || `${isNaN(ageY) ? 3 : ageY} yrs, ${isNaN(ageM) ? 0 : ageM} mos`,
          sex: sc.sex || 'Female',
          barangay: sc.barangay || 'San Isidro',
          householdId: sc.householdId || sc.household_id || 'HH-2026-0101',
          parentGuardian: pGuardUpper,
          enrollmentStatus: sc.enrollmentStatus || sc.enrollment_status || 'Not Enrolled',
          healthStatus: sc.healthStatus || sc.health_status || 'Due for Monitoring',
          developmentStatus: sc.developmentStatus || sc.development_status || 'Pending Initial Assessment',
        };

        const idx = this.data.children.findIndex((c) => {
          if (c.id === id || c.eccd_id === id) return true;
          const cName = (c.fullName || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
          if (normName && cName && normName === cName) {
            return true;
          }
          return false;
        });

        if (idx >= 0) {
          this.data.children[idx] = { ...this.data.children[idx], ...normalizedChild };
          changed = true;
        } else {
          this.data.children.unshift(normalizedChild);
          changed = true;
        }
      });
    }

    if (Array.isArray(serverEnrollments) && serverEnrollments.length > 0) {
      if (!Array.isArray(this.data.enrollments)) this.data.enrollments = [];
      serverEnrollments.forEach((se) => {
        if (!se) return;
        const childId = se.childId || se.child_id;
        const id = se.id || `ENR-${childId}`;
        const idx = this.data.enrollments.findIndex(
          (e) => (e.id && e.id === id) || (e.childId && childId && e.childId === childId)
        );
        const normEnr = {
          ...se,
          id,
          childId,
          status: se.status || 'Enrolled',
        };
        if (idx >= 0) {
          this.data.enrollments[idx] = { ...this.data.enrollments[idx], ...normEnr };
        } else {
          this.data.enrollments.unshift(normEnr);
        }
        changed = true;

        // Ensure child in local data is marked as Enrolled
        if (childId && Array.isArray(this.data.children)) {
          const c = this.data.children.find((k) => k.id === childId || k.eccd_id === childId);
          if (c && c.enrollmentStatus !== 'Enrolled') {
            c.enrollmentStatus = 'Enrolled';
            changed = true;
          }
        }
      });
    }

    if (this.deduplicateHouseholds()) changed = true;
    if (this.deduplicateChildren()) changed = true;

    if (changed) {
      this.save();
    }
  }

  /**
   * Hydrates centralDataStore from live MySQL backend API.
   * Guarantees that records mapped on another device appear across all clients.
   * Includes re-entrancy lock and throttle to prevent API loop storm.
   */
  async syncWithBackend(force = false) {
    if (this._isSyncing) return;
    const now = Date.now();
    if (!force && this._lastSyncTime && now - this._lastSyncTime < 60000) {
      return;
    }
    this._isSyncing = true;
    try {
      const [childRes, hhRes, enrRes] = await Promise.allSettled([
        fetch(getApiUrl('/api/children'), {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }),
        fetch(getApiUrl('/api/households'), {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }),
        fetch(getApiUrl('/api/enrollments'), {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }),
      ]);

      let serverChildren = [];
      let serverHouseholds = [];
      let serverEnrollments = [];

      if (childRes.status === 'fulfilled' && childRes.value && childRes.value.ok) {
        const cJson = await childRes.value.json();
        serverChildren = cJson.data?.children || cJson.data || [];
        if (!Array.isArray(serverChildren)) serverChildren = [];
      }

      if (hhRes.status === 'fulfilled' && hhRes.value && hhRes.value.ok) {
        const hJson = await hhRes.value.json();
        serverHouseholds = hJson.data || [];
        if (!Array.isArray(serverHouseholds)) serverHouseholds = [];
      }

      if (enrRes.status === 'fulfilled' && enrRes.value && enrRes.value.ok) {
        const eJson = await enrRes.value.json();
        serverEnrollments = eJson.data?.enrollments || eJson.data || [];
        if (!Array.isArray(serverEnrollments)) serverEnrollments = [];
      }

      // Check server system status and reset token for cross-device invalidation
      let serverResetToken = null;
      try {
        const statusRes = await fetch(getApiUrl('/api/system/status'), {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
          },
        });
        if (statusRes.ok) {
          const sJson = await statusRes.json();
          serverResetToken = sJson.reset_token;
        }
      } catch (_) {}

      const localResetToken = typeof window !== 'undefined' ? localStorage.getItem('eccd_last_reset_token') : null;
      const isServerFreshReset = serverResetToken && localResetToken && serverResetToken !== localResetToken;

      if (isServerFreshReset) {
        this.data.children = [];
        this.data.households = [];
        this.data.enrollments = [];
        this.data.healthMonitorings = [];
        this.data.developmentAssessments = [];
        this.data.followUps = [];
        try {
          if (typeof indexedDB !== 'undefined') {
            indexedDB.deleteDatabase('eccd_care_offline_db');
          }
        } catch (_) {}
        if (typeof window !== 'undefined') {
          localStorage.setItem('eccd_last_reset_token', serverResetToken);
        }
        this.save();
        return;
      }

      if (serverResetToken && typeof window !== 'undefined') {
        localStorage.setItem('eccd_last_reset_token', serverResetToken);
      }

      // If the server explicitly responded OK for both children and households,
      // but returned 0 records, that means the server database is completely clean (0 records).
      // Synchronize this device by wiping any stale old records!
      const isBackendLive = childRes.status === 'fulfilled' && childRes.value?.ok &&
                            hhRes.status === 'fulfilled' && hhRes.value?.ok;

      if (isBackendLive && serverChildren.length === 0 && serverHouseholds.length === 0) {
        if (this.data.children.length > 0 || this.data.households.length > 0) {
          this.data.children = [];
          this.data.households = [];
          this.data.enrollments = [];
          this.data.healthMonitorings = [];
          this.data.developmentAssessments = [];
          this.data.followUps = [];
          try {
            if (typeof indexedDB !== 'undefined') {
              indexedDB.deleteDatabase('eccd_care_offline_db');
            }
          } catch (_) {}
          this.save();
        }
      } else if (serverChildren.length > 0 || serverHouseholds.length > 0 || serverEnrollments.length > 0) {
        this.mergeRecordsFromServer(serverChildren, serverHouseholds, serverEnrollments);
      }
    } catch (err) {
      console.warn('CentralDataStore: backend sync notice:', err.message);
    } finally {
      this._lastSyncTime = Date.now();
      this._isSyncing = false;
    }
  }

  // --- ENTITY COLLECTION GETTERS ---
  getRoles() { return this.data.roles; }
  getUsers() { return this.data.users; }
  updateUserPassword(identifier, newPassword) {
    if (!Array.isArray(this.data.users)) this.data.users = [];
    const idx = this.data.users.findIndex(
      (u) => String(u.id) === String(identifier) || u.email?.toLowerCase() === String(identifier).toLowerCase()
    );
    if (idx !== -1) {
      this.data.users[idx].password = newPassword;
      this.save();
      return true;
    }
    return false;
  }
  getWorkers() { return this.data.workers; }
  getBarangays() { return this.data.barangays; }
  getDayCareCenters() { return this.data.dayCareCenters; }
  getMappingActivities() { return this.data.mappingActivities; }
  getHouseholds() { return this.data.households; }
  getChildren() { return this.data.children; }
  getEnrollments() { return this.data.enrollments; }
  getHealthMonitorings() { return this.data.healthMonitorings; }
  getDevelopmentAssessments() { return this.data.developmentAssessments; }
  getFollowUps() {
    if (!Array.isArray(this.data.followUps)) return [];
    const casesByChild = new Map();
    const sorted = [...this.data.followUps].sort((a, b) => {
      const aActive = a.status !== 'Completed' && a.status !== 'Resolved' && a.category !== 'Completed';
      const bActive = b.status !== 'Completed' && b.status !== 'Resolved' && b.category !== 'Completed';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    sorted.forEach((f) => {
      const childKey = f.childId || f.id;
      if (!casesByChild.has(childKey)) {
        casesByChild.set(childKey, { ...f, history: [...(f.history || [])] });
      } else {
        const canonical = casesByChild.get(childKey);
        if (Array.isArray(f.history)) {
          f.history.forEach((h) => {
            if (!canonical.history.some((ch) => ch.date === h.date && ch.action === h.action)) {
              canonical.history.push(h);
            }
          });
        }
      }
    });

    const consolidated = Array.from(casesByChild.values());
    if (consolidated.length !== this.data.followUps.length) {
      this.data.followUps = consolidated;
      this.save();
    }
    return this.data.followUps;
  }
  getAuditLogs() { return this.data.auditLogs; }
  getResources() { return this.data.resources; }

  // Individual Entity Getters
  getChildById(childId) {
    return this.data.children.find((c) => c.id === childId) || null;
  }
  getChild(childId) {
    return this.getChildById(childId);
  }
  getHouseholdById(householdId) {
    return this.data.households.find((h) => h.id === householdId) || null;
  }
  getWorkerById(workerId) {
    return this.data.workers.find((w) => w.id === workerId) || null;
  }
  getDayCareCenterById(centerId) {
    return this.data.dayCareCenters.find((c) => c.id === centerId) || null;
  }
  createHousehold(payload) {
    if (payload.parentGuardian) payload.parentGuardian = String(payload.parentGuardian).toUpperCase();
    if (payload.parent_guardian) payload.parent_guardian = String(payload.parent_guardian).toUpperCase();
    const guardian = (payload.parentGuardian || payload.parent_guardian || '').toLowerCase().trim();
    const brgy = (payload.barangay || '').toLowerCase().trim();
    const existing = this.data.households.find((h) => {
      if (payload.id && (h.id === payload.id || h.household_no === payload.id)) return true;
      if (guardian && guardian !== 'parent / guardian' && guardian !== 'n/a') {
        const hGuardian = (h.parentGuardian || h.parent_guardian || '').toLowerCase().trim();
        const hBrgy = (h.barangay || '').toLowerCase().trim();
        if (guardian === hGuardian && brgy === hBrgy) return true;
      }
      return false;
    });

    if (existing) {
      Object.assign(existing, payload, { updatedAt: getPhilippinesDateTime() });
      this.save();
      return existing;
    }

    const newHousehold = {
      id: payload.id || `HH-2026-${String(this.data.households.length + 1).padStart(4, '0')}`,
      ...payload,
      createdAt: getPhilippinesDateTime(),
    };
    this.data.households.push(newHousehold);
    this.save();
    return newHousehold;
  }
  createChild(payload) {
    return this.registerChild(payload);
  }
  updateChild(childId, updates) {
    const existing = this.data.children.find((c) => c.id === childId);
    if (existing) {
      if (updates.firstName) updates.firstName = String(updates.firstName).toUpperCase();
      if (updates.middleName) updates.middleName = String(updates.middleName).toUpperCase();
      if (updates.lastName) updates.lastName = String(updates.lastName).toUpperCase();
      if (updates.parentGuardian) updates.parentGuardian = String(updates.parentGuardian).toUpperCase();
      if (updates.fullName) updates.fullName = String(updates.fullName).toUpperCase();
      Object.assign(existing, updates, { updatedAt: getPhilippinesDateTime() });
      this.save();
      return existing;
    }
    return null;
  }
  updateHousehold(householdId, updates) {
    const existing = this.data.households.find((h) => h.id === householdId);
    if (existing) {
      if (updates.parentGuardian) updates.parentGuardian = String(updates.parentGuardian).toUpperCase();
      if (updates.parent_guardian) updates.parent_guardian = String(updates.parent_guardian).toUpperCase();
      Object.assign(existing, updates, { updatedAt: getPhilippinesDateTime() });
      this.save();
      return existing;
    }
    return null;
  }
  createAuditLog(payload) {
    return this.logAudit(payload);
  }

  // --- RELATIONAL QUERIES ---

  /**
   * Child 360° View: Joins Household, Enrollments, Health Logs, Assessments, Follow-ups
   * Strictly respects Child.id as universal persistent key
   */
  getChild360(childId) {
    const child = this.data.children.find((c) => c.id === childId);
    if (!child) return null;

    const household = this.data.households.find((h) => h.id === child.householdId) || null;
    let familyHousehold = household ? { ...household } : null;
    if (familyHousehold) {
      if (!Array.isArray(familyHousehold.coResidentChildren)) {
        const otherKids = this.data.children.filter((c) => c.householdId === child.householdId && c.id !== childId);
        familyHousehold.coResidentChildren = otherKids.map((k) => ({
          name: k.fullName || `${k.firstName || ''} ${k.lastName || ''}`.trim() || 'Sibling',
          age: k.ageDisplay || `${k.ageYears || 0} yrs`,
          relation: 'Sibling / Co-resident',
          status: k.enrollmentStatus || 'Active',
          school: k.dayCareCenterName || 'Home',
        }));
      }
    } else {
      familyHousehold = {
        householdId: child.householdId || `HH-${child.id}`,
        parentGuardian: child.parentGuardian || 'Parent / Guardian',
        guardianRelationship: child.guardianRelationship || 'Guardian',
        contactNumber: child.contactNumber || child.guardianContact || '—',
        address: `${child.barangay || 'San Fernando'}${child.purok ? ` (${child.purok})` : ''}`,
        is4PsBeneficiary: child.is4PsBeneficiary || false,
        monthlyIncomeClass: child.monthlyIncomeClass || '—',
        coResidentChildren: [],
      };
    }

    const enrollments = this.data.enrollments.filter((e) => e.childId === childId);
    const healthRecords = this.data.healthMonitorings
      .filter((h) => h.childId === childId)
      .sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const createdDiff = (b.createdAt || '').localeCompare(a.createdAt || '');
        if (createdDiff !== 0) return createdDiff;
        return (b.id || '').localeCompare(a.id || '');
      });
    const assessments = this.data.developmentAssessments.filter((a) => a.childId === childId);
    const followUps = this.data.followUps.filter((f) => f.childId === childId);
    const dayCareCenter = child.dayCareCenterId
      ? this.data.dayCareCenters.find((c) => c.id === child.dayCareCenterId)
      : null;

    const statusPillars = child.statusPillars || {
      mapped: { status: 'Mapped', variant: 'success', date: child.createdAt?.slice(0, 10) || getPhilippinesDate() },
      enrolled: {
        status: child.enrollmentStatus || (enrollments.length > 0 ? 'Enrolled' : 'Not Enrolled'),
        variant: (child.enrollmentStatus === 'Enrolled' || enrollments.length > 0) ? 'success' : 'neutral',
        center: child.dayCareCenterName || dayCareCenter?.name || (enrollments[0]?.center || 'Pending CDC Slot'),
      },
      health: {
        status: healthRecords.length > 0 ? 'Up to date' : (child.healthStatus || 'Due for Monitoring'),
        variant: healthRecords.length > 0 ? 'success' : 'warning',
        lastWeightKg: healthRecords[0]?.weightKg ?? child.lastWeightKg ?? 14.5,
        lastHeightCm: healthRecords[0]?.heightCm ?? child.lastHeightCm ?? 96.5,
        nutritionalStatus: healthRecords[0]?.nutritionalStatus ?? child.nutritionalStatus ?? 'Normal Weight for Age',
      },
      development: {
        status: assessments.length > 0 ? (assessments[0].status || 'Completed') : (child.developmentStatus || 'Pending Initial Assessment'),
        variant: assessments.length > 0 ? 'success' : 'neutral',
        scaledScore: assessments[0]?.standardScore || assessments[0]?.scaledScore || null,
      },
      followUp: {
        status: followUps.length > 0 ? followUps[0].status : (child.hasOpenFollowUp ? 'Active' : 'None'),
        variant: followUps.length > 0 ? 'warning' : 'success',
      },
    };

    // Auto-synthesize chronological timeline if not explicitly provided
    const timeline = child.timeline || [
      ...(child.createdAt ? [{
        id: `TL-MAP-${childId}`,
        type: 'Community Mapping',
        title: 'Child Profiled in Community Mapping',
        description: `Registered in Barangay ${child.barangay || 'San Isidro'}`,
        date: child.createdAt.slice(0, 10),
        author: 'Field Worker',
        badgeVariant: 'primary',
      }] : []),
      ...enrollments.map((enr) => ({
        id: `TL-ENR-${enr.id}`,
        type: 'Enrollment',
        title: `Enrolled in ${enr.center || 'Day Care Center'}`,
        description: `Program: ${enr.program || 'CDC'} • Session: ${enr.session || 'Morning'}`,
        date: enr.enrollmentDate || enr.createdAt?.slice(0, 10) || getPhilippinesDate(),
        author: enr.teacher || 'CSWDO CDW',
        badgeVariant: 'success',
      })),
      ...healthRecords.map((h) => ({
        id: `TL-HLT-${h.id}`,
        type: 'Health Monitoring',
        title: 'Growth Measurement Recorded',
        description: `Weight: ${h.weightKg || h.weight || '—'} kg, Height: ${h.heightCm || h.height || '—'} cm`,
        date: h.date || h.createdAt?.slice(0, 10) || getPhilippinesDate(),
        author: h.examiner || h.recordedBy || 'Health Worker',
        badgeVariant: 'info',
      })),
      ...assessments.map((a) => ({
        id: `TL-DEV-${a.id}`,
        type: 'Development Assessment',
        title: `ECCD Assessment: ${a.interpretation || a.status || 'Recorded'}`,
        description: `Scaled / Standard Score: ${a.standardScore || a.scaledScore || '—'}`,
        date: a.date || a.assessmentDate || a.createdAt?.slice(0, 10) || getPhilippinesDate(),
        author: a.evaluator || a.assessor || 'CDW Worker',
        badgeVariant: 'warning',
      })),
      ...followUps.map((f) => ({
        id: `TL-FUP-${f.id}`,
        type: 'Follow-up',
        title: `Follow-up Case: ${f.title || f.reason || 'Case Opened'}`,
        description: `Priority: ${f.priority || 'Medium'} • Status: ${f.status || 'Open'}`,
        date: f.createdDate || f.createdAt?.slice(0, 10) || getPhilippinesDate(),
        author: f.assignedWorker || 'CSWDO Staff',
        badgeVariant: 'danger',
      })),
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      ...child,
      household: familyHousehold,
      familyHousehold: familyHousehold,
      enrollments,
      healthRecords,
      assessments,
      developmentAssessments: assessments,
      followUps,
      followUpCases: followUps,
      timeline,
      dayCareCenter,
      assignedCenter: child.dayCareCenterName || dayCareCenter?.name || enrollments[0]?.center || 'None',
      statusPillars,
    };
  }

  /**
   * Household with its children
   */
  getHouseholdWithChildren(householdId) {
    const household = this.data.households.find((h) => h.id === householdId);
    if (!household) return null;

    const children = this.data.children.filter((c) => c.householdId === householdId);
    const barangay = this.data.barangays.find((b) => b.id === household.barangayId || b.name === household.barangay);

    return {
      ...household,
      children,
      barangay,
    };
  }

  /**
   * Day Care Center with assigned workers and enrolled children
   */
  getDayCareCenterDetails(centerId) {
    const center = this.data.dayCareCenters.find((c) => c.id === centerId);
    if (!center) return null;

    const workers = this.data.workers.filter((w) => w.dayCareCenterId === centerId);
    const enrolledChildren = this.data.children.filter((c) => c.dayCareCenterId === centerId);

    return {
      ...center,
      workers,
      enrolledChildren,
    };
  }

  /**
   * Barangay with households, centers, and children
   */
  getBarangayDetails(barangayId) {
    const barangay = this.data.barangays.find((b) => b.id === barangayId || b.name === barangayId);
    if (!barangay) return null;

    const centers = this.data.dayCareCenters.filter((c) => c.barangayId === barangay.id || c.barangayName === barangay.name);
    const households = this.data.households.filter((h) => h.barangayId === barangay.id || h.barangay === barangay.name);
    const children = this.data.children.filter((c) => c.barangayId === barangay.id || c.barangay === barangay.name);

    return {
      ...barangay,
      centers,
      households,
      children,
    };
  }

  // --- MUTATIONS WITH RELATIONAL INTEGRITY & DEDUPLICATION ---

  /**
   * Register or link child. NEVER duplicates if matching child ID exists.
   */
  registerChild(childPayload) {
    if (childPayload.firstName) childPayload.firstName = String(childPayload.firstName).toUpperCase();
    if (childPayload.middleName) childPayload.middleName = String(childPayload.middleName).toUpperCase();
    if (childPayload.lastName) childPayload.lastName = String(childPayload.lastName).toUpperCase();
    if (childPayload.parentGuardian) childPayload.parentGuardian = String(childPayload.parentGuardian).toUpperCase();
    if (childPayload.fullName) {
      childPayload.fullName = String(childPayload.fullName).toUpperCase();
    } else {
      childPayload.fullName = `${childPayload.firstName || ''} ${childPayload.middleName ? childPayload.middleName + ' ' : ''}${childPayload.lastName || ''}`.trim().toUpperCase();
    }
    const normName = (childPayload.fullName || `${childPayload.firstName || ''} ${childPayload.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
    const existing = this.data.children.find((c) => {
      if (childPayload.id && (c.id === childPayload.id || c.eccd_id === childPayload.id)) return true;
      if (normName) {
        const cName = (c.fullName || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
        if (normName === cName) {
          if (childPayload.householdId && c.householdId && childPayload.householdId === c.householdId) return true;
          if (childPayload.birthDate && c.birthDate && childPayload.birthDate === c.birthDate) return true;
          return true;
        }
      }
      return false;
    });

    if (existing) {
      Object.assign(existing, childPayload, { updatedAt: getPhilippinesDateTime() });
      this.save();
      return existing;
    }

    // Generate persistent ECCD ID: ECCD-YYYY-NNNNNN
    const count = this.data.children.length + 1;
    const newId = childPayload.id || `ECCD-2026-${String(count).padStart(6, '0')}`;
    const ageY = parseInt(childPayload.ageYears || 3, 10);
    const ageM = parseInt(childPayload.ageMonths || 0, 10);

    const newChild = {
      ...childPayload,
      id: newId,
      firstName: childPayload.firstName || '',
      middleName: childPayload.middleName || '',
      lastName: childPayload.lastName || '',
      fullName: childPayload.fullName,
      ageYears: ageY,
      ageMonths: ageM,
      ageDisplay: childPayload.ageDisplay || `${ageY} yrs, ${ageM} mos`,
      sex: childPayload.sex || 'Female',
      barangay: childPayload.barangay || 'San Isidro',
      parentGuardian: childPayload.parentGuardian || '',
      enrollmentStatus: childPayload.enrollmentStatus || 'Not Enrolled',
      healthStatus: childPayload.healthStatus || 'Due for Monitoring',
      developmentStatus: childPayload.developmentStatus || 'Pending Initial Assessment',
      hasOpenFollowUp: false,
      statusPillars: {
        mapped: { status: 'Mapped', variant: 'success', date: getPhilippinesDate() },
        enrolled: {
          status: childPayload.enrollmentStatus || 'Not Enrolled',
          variant: (childPayload.enrollmentStatus === 'Enrolled' || childPayload?.enrollment?.enrolled) ? 'success' : 'neutral',
          center: childPayload.dayCareCenterName || childPayload.enrollmentCenter || 'Pending CDC Slot',
        },
        health: {
          status: childPayload.healthStatus || 'Due for Monitoring',
          variant: (childPayload.healthStatus === 'Up to date' || childPayload.healthStatus === 'Up to Date') ? 'success' : 'warning',
          lastWeightKg: childPayload.lastWeightKg || 14.5,
          lastHeightCm: childPayload.lastHeightCm || 96.5,
          nutritionalStatus: childPayload.nutritionalStatus || 'Normal Weight for Age',
        },
        development: {
          status: childPayload.developmentStatus || 'Pending Initial Assessment',
          variant: 'neutral',
          scaledScore: null,
          interpretation: 'Standard evaluation pending',
        },
        followUp: {
          status: 'None',
          variant: 'neutral',
          issue: null,
          dueDate: null,
        },
      },
      createdAt: getPhilippinesDateTime(),
    };

    this.data.children.unshift(newChild);
    this.save();
    return newChild;
  }

  /**
   * Enroll child: Creates Enrollment record, updates Child enrollment status.
   * NEVER CREATES A NEW CHILD!
   */
  enrollChild(enrollmentPayload) {
    const child = this.data.children.find((c) => c.id === enrollmentPayload.childId);
    if (!child) {
      throw new Error(`Child with ECCD ID ${enrollmentPayload.childId} not found in central registry.`);
    }

    const newEnrollment = {
      id: `ENR-2026-${String(this.data.enrollments.length + 1).padStart(4, '0')}`,
      ...enrollmentPayload,
      status: 'Enrolled',
      createdAt: getPhilippinesDateTime(),
    };

    this.data.enrollments.push(newEnrollment);

    // Update child master record without creating duplicate
    child.enrollmentStatus = 'Enrolled';
    child.dayCareCenterId = enrollmentPayload.dayCareCenterId || child.dayCareCenterId;
    child.dayCareCenterName = enrollmentPayload.center || child.dayCareCenterName || 'San Isidro Child Development Center I';
    if (!child.statusPillars) child.statusPillars = {};
    child.statusPillars.enrolled = {
      status: 'Enrolled',
      center: child.dayCareCenterName,
      variant: 'success',
      enrolledDate: enrollmentPayload.enrollmentDate || getPhilippinesDate(),
    };
    child.updatedAt = getPhilippinesDateTime();

    this.save();
    return newEnrollment;
  }

  /**
   * Health Record: Creates HealthMonitoring record, updates Child health status.
   * NEVER CREATES A NEW CHILD!
   */
  recordHealth(healthPayload) {
    const child = this.data.children.find((c) => c.id === healthPayload.childId);
    if (!child) {
      throw new Error(`Child with ECCD ID ${healthPayload.childId} not found in central registry.`);
    }

    const height = Number(healthPayload.heightCm || healthPayload.height || 0);
    const weight = Number(healthPayload.weightKg || healthPayload.weight || 0);
    const date = healthPayload.date || getPhilippinesDate();
    const nutStatus = healthPayload.nutritionalStatus || 'Normal Weight';

    const newHealth = {
      id: `HLT-2026-${String(this.data.healthMonitorings.length + 1).padStart(4, '0')}`,
      ...healthPayload,
      heightCm: height,
      weightKg: weight,
      date,
      nutritionalStatus: nutStatus,
      createdAt: getPhilippinesDateTime(),
    };

    // Prepend so the newest measurement is at index 0
    this.data.healthMonitorings.unshift(newHealth);

    // Update child master record health status and root fields
    child.healthStatus = 'Up to Date';
    child.lastWeightKg = weight;
    child.lastHeightCm = height;
    child.lastMeasurementDate = date;
    child.nutritionalStatus = nutStatus;

    if (!child.statusPillars) child.statusPillars = {};
    child.statusPillars.health = {
      status: 'Up to date',
      variant: 'success',
      lastWeightKg: weight,
      lastHeightCm: height,
      nutritionalStatus: nutStatus,
      lastMeasurementDate: date,
      nextDue: addDaysPHT(30),
    };
    child.updatedAt = getPhilippinesDateTime();

    this.save();
    return newHealth;
  }

  /**
   * Development Assessment: Creates Assessment record, updates Child assessment status.
   * NEVER CREATES A NEW CHILD!
   */
  recordAssessment(assessmentPayload) {
    const child = this.data.children.find((c) => c.id === assessmentPayload.childId);
    if (!child) {
      throw new Error(`Child with ECCD ID ${assessmentPayload.childId} not found in central registry.`);
    }

    const newAssessment = {
      id: `DEV-2026-${String(this.data.developmentAssessments.length + 1).padStart(4, '0')}`,
      ...assessmentPayload,
      status: 'Completed',
      createdAt: getPhilippinesDateTime(),
    };

    this.data.developmentAssessments.push(newAssessment);

    child.developmentStatus = 'Completed';
    if (!child.statusPillars) child.statusPillars = {};
    child.statusPillars.development = {
      status: 'Completed',
      variant: 'success',
      scaledScore: assessmentPayload.standardScore || assessmentPayload.scaledScore || 100,
      interpretation: assessmentPayload.interpretation || 'Average Development',
      lastAssessmentDate: assessmentPayload.assessmentDate || getPhilippinesDate(),
    };
    child.updatedAt = getPhilippinesDateTime();

    this.save();
    return newAssessment;
  }

  /**
   * Follow-up: Creates FollowUp record, updates Child hasOpenFollowUp flag.
   * NEVER CREATES A NEW CHILD!
   */
  createFollowUp(followUpPayload) {
    const child = this.data.children.find((c) => c.id === followUpPayload.childId);
    if (!child) {
      throw new Error(`Child with ECCD ID ${followUpPayload.childId} not found in central registry.`);
    }

    // Root-cause guard: 1 case per child in the Follow-up registry
    const existing = this.data.followUps.find((f) => f.childId === followUpPayload.childId);

    if (existing) {
      existing.reason = followUpPayload.reason || existing.reason;
      existing.actionType = followUpPayload.actionType || existing.actionType;
      existing.status = followUpPayload.status || 'Needs Attention';
      existing.category = followUpPayload.category || 'Needs Attention';
      existing.priority = followUpPayload.priority || existing.priority || 'Medium';
      existing.dueDate = followUpPayload.dueDate || existing.dueDate || addDaysPHT(14);
      existing.assignedWorker = followUpPayload.assignedWorker || existing.assignedWorker;
      existing.workerContact = followUpPayload.workerContact || existing.workerContact;
      existing.updatedAt = getPhilippinesDateTime();

      if (!Array.isArray(existing.history)) existing.history = [];
      existing.history.unshift({
        date: getPhilippinesDate(),
        action: followUpPayload.actionType ? `${followUpPayload.actionType} Updated` : 'Follow-up Case Updated',
        worker: followUpPayload.assignedWorker || 'CDW Worker',
        notes: followUpPayload.notes || followUpPayload.reason || 'Case updated.',
      });

      child.hasOpenFollowUp = true;
      if (!child.statusPillars) child.statusPillars = {};
      child.statusPillars.followUp = {
        status: existing.status || 'Active Case',
        variant: 'danger',
        issue: existing.reason || 'Needs Attention',
        dueDate: existing.dueDate || getPhilippinesDate(),
      };
      child.updatedAt = getPhilippinesDateTime();

      this.save();
      return existing;
    }

    const newFollowUp = {
      id: `FLW-2026-${String(this.data.followUps.length + 1).padStart(4, '0')}`,
      ...followUpPayload,
      status: followUpPayload.status || 'Needs Attention',
      createdAt: getPhilippinesDateTime(),
      history: followUpPayload.history || [
        {
          date: getPhilippinesDate(),
          action: 'Case Created',
          worker: followUpPayload.assignedWorker || 'CDW Worker',
          notes: followUpPayload.notes || followUpPayload.reason || 'Follow-up initiated.',
        },
      ],
    };

    this.data.followUps.push(newFollowUp);

    child.hasOpenFollowUp = true;
    if (!child.statusPillars) child.statusPillars = {};
    child.statusPillars.followUp = {
      status: followUpPayload.status || 'Active Case',
      variant: 'danger',
      issue: followUpPayload.reason || followUpPayload.concern || 'Needs Attention',
      dueDate: followUpPayload.targetDate || followUpPayload.dueDate || getPhilippinesDate(),
    };
    child.updatedAt = getPhilippinesDateTime();

    this.save();
    return newFollowUp;
  }

  /**
   * Resolve Follow-up
   */
  resolveFollowUp(followUpId, resolutionData) {
    const followUp = this.data.followUps.find((f) => f.id === followUpId);
    if (!followUp) return null;

    followUp.status = 'Completed';
    followUp.completedDate = resolutionData.completedDate || getPhilippinesDate();
    followUp.actionTaken = resolutionData.actionTaken || followUp.actionTaken;
    followUp.remarks = resolutionData.remarks || followUp.remarks;

    // Check if child has remaining open follow-ups
    const openFollowUps = this.data.followUps.filter(
      (f) => f.childId === followUp.childId && f.status !== 'Completed' && f.id !== followUpId
    );
    const child = this.data.children.find((c) => c.id === followUp.childId);
    if (child) {
      child.hasOpenFollowUp = openFollowUps.length > 0;
    }

    this.save();
    return followUp;
  }

  /**
   * Append Audit Log
   */
  logAudit(logData) {
    const newLog = {
      id: `LOG-2026-${String(this.data.auditLogs.length + 1).padStart(5, '0')}`,
      timestamp: getPhilippinesDateTime().replace('T', ' ').substring(0, 19),
      ...logData,
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }
}

export const centralDataStore = new CentralDataStore();
export default centralDataStore;
