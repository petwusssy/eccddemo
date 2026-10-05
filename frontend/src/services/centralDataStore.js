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

    // Auto-migrate orphaned records from isolated storage keys
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const oldHhs = JSON.parse(window.localStorage.getItem('eccd_mapping_households_data_v2') || '[]');
        if (Array.isArray(oldHhs)) {
          oldHhs.forEach((hh) => {
            if (!initialData.households.some((h) => h.id === hh.id)) {
              initialData.households.unshift(hh);
            }
          });
        }
        const oldMapKids = JSON.parse(window.localStorage.getItem('eccd_mapping_children_data_v2') || '[]');
        const old360Kids = JSON.parse(window.localStorage.getItem('eccd_children_360_data_v2') || '[]');
        const combined = [...(Array.isArray(oldMapKids) ? oldMapKids : []), ...(Array.isArray(old360Kids) ? old360Kids : [])];
        combined.forEach((k) => {
          if (!initialData.children.some((c) => c.id === k.id)) {
            const ageY = parseInt(k.ageYears || 3, 10);
            const ageM = parseInt(k.ageMonths || 0, 10);
            initialData.children.unshift({
              ...k,
              ageYears: ageY,
              ageMonths: ageM,
              ageDisplay: k.ageDisplay || `${ageY} yrs, ${ageM} mos`,
              fullName: k.fullName || `${k.firstName || ''} ${k.lastName || ''}`.trim(),
              enrollmentStatus: k.enrollmentStatus || 'Not Enrolled',
              healthStatus: k.healthStatus || 'Due for Monitoring',
              developmentStatus: k.developmentStatus || 'Pending Initial Assessment',
            });
          }
        });
      }
    } catch (migErr) {
      console.warn('CentralDataStore: Migration notice:', migErr);
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
      Object.assign(existing, updates, { updatedAt: getPhilippinesDateTime() });
      this.save();
      return existing;
    }
    return null;
  }
  updateHousehold(householdId, updates) {
    const existing = this.data.households.find((h) => h.id === householdId);
    if (existing) {
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
    if (childPayload.id) {
      const existing = this.data.children.find((c) => c.id === childPayload.id);
      if (existing) {
        Object.assign(existing, childPayload, { updatedAt: getPhilippinesDateTime() });
        this.save();
        return existing;
      }
    }

    // Generate persistent ECCD ID: ECCD-YYYY-NNNNNN
    const count = this.data.children.length + 1;
    const newId = childPayload.id || `ECCD-2026-${String(count).padStart(6, '0')}`;
    const ageY = parseInt(childPayload.ageYears || 3, 10);
    const ageM = parseInt(childPayload.ageMonths || 0, 10);

    const newChild = {
      ...childPayload,
      id: newId,
      fullName: childPayload.fullName || `${childPayload.firstName || ''} ${childPayload.middleName ? childPayload.middleName + ' ' : ''}${childPayload.lastName || ''}`.trim(),
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
