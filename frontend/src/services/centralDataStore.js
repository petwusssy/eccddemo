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

const STORAGE_KEY = 'eccd_care_central_datastore_v3';

// Seed Roles
export const SEED_ROLES = [
  {
    id: 'ROLE-ADMIN',
    name: 'cswdo_admin',
    label: 'CSWDO Administrator / Supervisor',
    description: 'Full administrative access across all LGU barangays, centers, and system security controls.',
    permissions: ['*'],
  },
  {
    id: 'ROLE-FIELD-WORKER',
    name: 'field_worker',
    label: 'Service Provider / Field Worker',
    description: 'Community mapping, household profiling, child registration, and spot map management.',
    permissions: ['dashboard', 'children', 'households', 'community-mapping', 'enrollment', 'follow-ups', 'community-network', 'barangays', 'daycare-centers', 'workers'],
  },
  {
    id: 'ROLE-DAYCARE-WORKER',
    name: 'daycare_worker',
    label: 'Day Care Worker / Child Development Worker',
    description: 'CDC enrollment, monthly health monitoring, ECCD Checklist evaluation, and local referrals.',
    permissions: ['dashboard', 'children', 'enrollment', 'health-monitoring', 'eccd-checklist', 'follow-ups', 'community-network', 'daycare-centers', 'reports'],
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
    id: 'USR-001',
    username: 'admin.cswdo',
    name: 'Atty. Bernadette M. Ronquillo',
    email: 'bernadette.ronquillo@sanfernandocity.gov.ph',
    roleId: 'ROLE-ADMIN',
    role: 'cswdo_admin',
    designation: 'City Social Welfare & Development Officer',
    status: 'Active',
  },
  {
    id: 'USR-002',
    username: 'maria.santos',
    name: 'Maria C. Santos',
    email: 'maria.santos@sanfernandocity.gov.ph',
    roleId: 'ROLE-DAYCARE-WORKER',
    role: 'daycare_worker',
    designation: 'Child Development Worker I',
    status: 'Active',
  },
  {
    id: 'USR-003',
    username: 'rodel.mendoza',
    name: 'Rodel D. Mendoza',
    email: 'rodel.mendoza@sanfernandocity.gov.ph',
    roleId: 'ROLE-FIELD-WORKER',
    role: 'field_worker',
    designation: 'Community Development Officer II',
    status: 'Active',
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
  }

  loadInitial() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Automatically clear out legacy mock seeds so app opens clean
        window.localStorage.removeItem('eccd_care_central_datastore_v1');
        window.localStorage.removeItem('eccd_care_central_datastore_v2');
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('CentralDataStore: Failed to read from localStorage:', e);
    }

    return {
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

  save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('CentralDataStore: Failed to write to localStorage:', e);
    }
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

  // --- ENTITY COLLECTION GETTERS ---
  getRoles() { return this.data.roles; }
  getUsers() { return this.data.users; }
  getWorkers() { return this.data.workers; }
  getBarangays() { return this.data.barangays; }
  getDayCareCenters() { return this.data.dayCareCenters; }
  getMappingActivities() { return this.data.mappingActivities; }
  getHouseholds() { return this.data.households; }
  getChildren() { return this.data.children; }
  getEnrollments() { return this.data.enrollments; }
  getHealthMonitorings() { return this.data.healthMonitorings; }
  getDevelopmentAssessments() { return this.data.developmentAssessments; }
  getFollowUps() { return this.data.followUps; }
  getAuditLogs() { return this.data.auditLogs; }
  getResources() { return this.data.resources; }

  // Individual Entity Getters
  getChildById(childId) {
    return this.data.children.find((c) => c.id === childId) || null;
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
    const newHousehold = {
      id: payload.id || `HH-2026-${String(this.data.households.length + 1).padStart(4, '0')}`,
      ...payload,
      createdAt: new Date().toISOString(),
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
      Object.assign(existing, updates, { updatedAt: new Date().toISOString() });
      this.save();
      return existing;
    }
    return null;
  }
  updateHousehold(householdId, updates) {
    const existing = this.data.households.find((h) => h.id === householdId);
    if (existing) {
      Object.assign(existing, updates, { updatedAt: new Date().toISOString() });
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
    const enrollments = this.data.enrollments.filter((e) => e.childId === childId);
    const healthRecords = this.data.healthMonitorings.filter((h) => h.childId === childId);
    const assessments = this.data.developmentAssessments.filter((a) => a.childId === childId);
    const followUps = this.data.followUps.filter((f) => f.childId === childId);
    const dayCareCenter = child.dayCareCenterId
      ? this.data.dayCareCenters.find((c) => c.id === child.dayCareCenterId)
      : null;

    return {
      ...child,
      household,
      enrollments,
      healthRecords,
      assessments,
      followUps,
      dayCareCenter,
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
    if (childPayload.id) {
      const existing = this.data.children.find((c) => c.id === childPayload.id);
      if (existing) {
        Object.assign(existing, childPayload, { updatedAt: new Date().toISOString() });
        this.save();
        return existing;
      }
    }

    // Generate persistent ECCD ID: ECCD-YYYY-NNNNNN
    const count = this.data.children.length + 1;
    const newId = childPayload.id || `ECCD-2026-${String(count).padStart(6, '0')}`;
    const newChild = {
      ...childPayload,
      id: newId,
      fullName: `${childPayload.firstName} ${childPayload.middleName ? childPayload.middleName + ' ' : ''}${childPayload.lastName}`,
      enrollmentStatus: childPayload.enrollmentStatus || 'Not Enrolled',
      healthStatus: childPayload.healthStatus || 'Due for Monitoring',
      developmentStatus: childPayload.developmentStatus || 'Pending Initial Assessment',
      hasOpenFollowUp: false,
      createdAt: new Date().toISOString(),
    };

    this.data.children.push(newChild);
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
      createdAt: new Date().toISOString(),
    };

    this.data.enrollments.push(newEnrollment);

    // Update child master record without creating duplicate
    child.enrollmentStatus = 'Enrolled';
    child.dayCareCenterId = enrollmentPayload.dayCareCenterId || child.dayCareCenterId;
    child.updatedAt = new Date().toISOString();

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

    const newHealth = {
      id: `HLT-2026-${String(this.data.healthMonitorings.length + 1).padStart(4, '0')}`,
      ...healthPayload,
      createdAt: new Date().toISOString(),
    };

    this.data.healthMonitorings.push(newHealth);

    // Update child master record health status
    child.healthStatus = 'Up to Date';
    child.updatedAt = new Date().toISOString();

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
      createdAt: new Date().toISOString(),
    };

    this.data.developmentAssessments.push(newAssessment);

    child.developmentStatus = 'Completed';
    child.updatedAt = new Date().toISOString();

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

    const newFollowUp = {
      id: `FLW-2026-${String(this.data.followUps.length + 1).padStart(4, '0')}`,
      ...followUpPayload,
      status: followUpPayload.status || 'Needs Attention',
      createdAt: new Date().toISOString(),
    };

    this.data.followUps.push(newFollowUp);

    child.hasOpenFollowUp = true;
    child.updatedAt = new Date().toISOString();

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
    followUp.completedDate = resolutionData.completedDate || new Date().toISOString().split('T')[0];
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
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...logData,
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }
}

export const centralDataStore = new CentralDataStore();
export default centralDataStore;
