/**
 * ECCD CARE — Community Mapping API Service Layer
 *
 * Implements Community Mapping API Contract (api-and-interface-design skill):
 *   POST /api/mapping/activities
 *   GET  /api/mapping/activities
 *   GET  /api/mapping/activities/:id
 *   POST /api/mapping/activities/:id/assignments
 *
 *   POST /api/households
 *   GET  /api/households
 *   GET  /api/households/:id
 *
 *   POST /api/children
 *   GET  /api/children/search
 *   GET  /api/children/:id
 *   POST /api/mapping/children
 *
 * Prevents duplicate child records when matched.
 * Centralized data model + local draft persistence for mobile field workers.
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDate, addDaysPHT, formatPHTTime } from '../utils/phTime.js';

const STORAGE_KEY_ACTIVITIES = 'eccd_mapping_activities_data_v2';
const STORAGE_KEY_ASSIGNMENTS = 'eccd_mapping_assignments_data_v2';
const STORAGE_KEY_DRAFT = 'eccd_mapping_field_draft_v2';

// Default synthetic data
const DEFAULT_ACTIVITIES = [
  {
    id: 'ACT-MAP-2026-001',
    name: '2026 Annual CSWDO House-to-House Child Mapping Drive',
    year: 2026,
    barangays: ['San Isidro', 'Calulut', 'Dolores', 'San Jose', 'Juliana'],
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    assignedWorkers: [
      { id: 'USR-FW-009', name: 'Rodel Mendoza', role: 'Community Development Officer II' },
      { id: 'USR-FW-010', name: 'Maria Santos', role: 'Child Development Worker I' },
      { id: 'USR-FW-011', name: 'Lourdes David', role: 'Child Development Worker II' },
    ],
    status: 'In Progress',
    progress: 0,
    totalTargetHouseholds: 450,
    mappedHouseholds: 0,
    childrenIdentified: 0,
    archived: false,
  },
  {
    id: 'ACT-MAP-2026-002',
    name: 'Sitio Riverside & High-Density Purok Vulnerability Survey',
    year: 2026,
    barangays: ['Dela Paz Sur', 'Lourdes'],
    startDate: '2026-10-01',
    endDate: '2026-12-15',
    assignedWorkers: [
      { id: 'USR-FW-012', name: 'Grace Pineda', role: 'Child Development Worker II' },
    ],
    status: 'Pending Start',
    progress: 0,
    totalTargetHouseholds: 180,
    mappedHouseholds: 0,
    childrenIdentified: 0,
    archived: false,
  },
  {
    id: 'ACT-MAP-2025-004',
    name: '2025 Year-End Mid-Term Demographic Assessment',
    year: 2025,
    barangays: ['Sindalan', 'Magliman', 'Santa Lucia'],
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    assignedWorkers: [
      { id: 'USR-FW-009', name: 'Rodel Mendoza', role: 'Community Development Officer II' },
    ],
    status: 'Completed',
    progress: 0,
    totalTargetHouseholds: 320,
    mappedHouseholds: 0,
    childrenIdentified: 0,
    archived: true,
  },
];

const DEFAULT_ASSIGNMENTS = [
  {
    workerId: 'USR-FW-009',
    workerName: 'Rodel Mendoza',
    assignedBarangay: 'Dolores',
    activityId: 'ACT-MAP-2026-001',
    activityName: '2026 Annual CSWDO House-to-House Child Mapping Drive',
    progress: 0,
    householdsMapped: 0,
    childrenIdentified: 0,
    remainingHouseholds: 38,
    status: 'Active in Field',
  },
  {
    workerId: 'USR-FW-010',
    workerName: 'Maria Santos',
    assignedBarangay: 'San Isidro',
    activityId: 'ACT-MAP-2026-001',
    activityName: '2026 Annual CSWDO House-to-House Child Mapping Drive',
    progress: 0,
    householdsMapped: 0,
    childrenIdentified: 0,
    remainingHouseholds: 60,
    status: 'Active in Field',
  },
  {
    workerId: 'USR-FW-011',
    workerName: 'Lourdes David',
    assignedBarangay: 'Calulut',
    activityId: 'ACT-MAP-2026-001',
    activityName: '2026 Annual CSWDO House-to-House Child Mapping Drive',
    progress: 0,
    householdsMapped: 0,
    childrenIdentified: 0,
    remainingHouseholds: 52,
    status: 'Active in Field',
  },
];

const DEFAULT_HOUSEHOLDS = [];

const DEFAULT_CHILDREN = [];

function getStored(key, fallback) {
  try {
    if (key.endsWith('_v2')) { localStorage.removeItem(key.replace('_v2', '')); }
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // localStorage unavailable
  }
  return fallback;
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // quota exceeded or private mode
  }
}

// In-memory data store initialized from storage
let activitiesState = getStored(STORAGE_KEY_ACTIVITIES, DEFAULT_ACTIVITIES);
let assignmentsState = getStored(STORAGE_KEY_ASSIGNMENTS, DEFAULT_ASSIGNMENTS);

export const communityMappingService = {
  /**
   * GET /api/mapping/activities
   */
  async getActivities() {
    try {
      const res = await fetch('/api/mapping/activities', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {
      // Fallback to local store
    }
    return {
      activities: [...activitiesState],
      assignments: [...assignmentsState],
      totalActivities: activitiesState.length,
    };
  },

  /**
   * POST /api/mapping/activities
   */
  async createActivity(activityData) {
    const year = parseInt(activityData.year || new Date().getFullYear(), 10);
    const id = `ACT-MAP-${year}-${String(activitiesState.length + 1).padStart(3, '0')}`;

    const newActivity = {
      id,
      name: activityData.name,
      year,
      barangays: activityData.barangays || ['San Isidro'],
      startDate: activityData.startDate || getPhilippinesDate(),
      endDate: activityData.endDate || addDaysPHT(60),
      assignedWorkers: activityData.assignedWorkers || [],
      status: 'In Progress',
      progress: 0,
      totalTargetHouseholds: parseInt(activityData.totalTargetHouseholds || 150, 10),
      mappedHouseholds: 0,
      childrenIdentified: 0,
      archived: false,
    };

    activitiesState.unshift(newActivity);
    setStored(STORAGE_KEY_ACTIVITIES, activitiesState);

    // Auto-create assignment for each assigned worker
    if (activityData.assignedWorkers?.length > 0) {
      activityData.assignedWorkers.forEach((worker) => {
        assignmentsState.unshift({
          workerId: worker.id || `USR-FW-${Math.floor(100 + Math.random() * 900)}`,
          workerName: worker.name,
          assignedBarangay: newActivity.barangays[0],
          activityId: id,
          activityName: newActivity.name,
          progress: 0,
          householdsMapped: 0,
          childrenIdentified: 0,
          remainingHouseholds: newActivity.totalTargetHouseholds,
          status: 'Assigned',
        });
      });
      setStored(STORAGE_KEY_ASSIGNMENTS, assignmentsState);
    }

    try {
      await fetch('/api/mapping/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });
    } catch (e) { }

    return newActivity;
  },

  /**
   * GET /api/mapping/activities/:id
   */
  async getActivityById(id) {
    const act = activitiesState.find((a) => a.id === id);
    return act || null;
  },

  /**
   * POST /api/mapping/activities/:id/assignments
   */
  async assignWorkers(activityId, workers, barangay) {
    const activity = activitiesState.find((a) => a.id === activityId);
    if (!activity) return { ok: false, error: 'Activity not found' };

    workers.forEach((worker) => {
      // Check if already assigned
      const exists = assignmentsState.some(
        (asn) => asn.activityId === activityId && asn.workerName === worker.name
      );
      if (!exists) {
        assignmentsState.push({
          workerId: worker.id || `USR-FW-${Math.floor(100 + Math.random() * 900)}`,
          workerName: worker.name,
          assignedBarangay: barangay,
          activityId,
          activityName: activity.name,
          progress: 0,
          householdsMapped: 0,
          childrenIdentified: 0,
          remainingHouseholds: 75,
          status: 'Assigned',
        });
      }
    });

    setStored(STORAGE_KEY_ASSIGNMENTS, assignmentsState);
    return { ok: true, assignments: [...assignmentsState] };
  },

  /**
   * Archive Activity
   */
  async archiveActivity(id) {
    const act = activitiesState.find((a) => a.id === id);
    if (act) {
      act.archived = !act.archived;
      setStored(STORAGE_KEY_ACTIVITIES, activitiesState);
      return { ok: true, activity: act };
    }
    return { ok: false, error: 'Not found' };
  },

  /**
   * GET /api/households
   */
  async getHouseholds() {
    return centralDataStore.getHouseholds();
  },

  /**
   * POST /api/households
   */
  async createHousehold(hhData) {
    const id = hhData.id || `HH-2026-${String(centralDataStore.getHouseholds().length + 101).padStart(4, '0')}`;
    const newHousehold = centralDataStore.createHousehold({
      id,
      parentGuardian: hhData.parentGuardian || 'Parent / Guardian',
      contactNumber: hhData.contactNumber || '',
      address: hhData.address || '',
      barangay: hhData.barangay || 'San Isidro',
      mappingActivityId: hhData.mappingActivityId || 'ACT-MAP-2026-001',
      mappedDate: getPhilippinesDate(),
      mappedBy: hhData.mappedBy || 'Field Worker',
      childrenCount: parseInt(hhData.childrenCount || 1, 10),
      status: 'Completed',
    });

    try {
      await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHousehold),
      });
    } catch (e) { }

    return newHousehold;
  },

  /**
   * GET /api/children/search
   * Search for duplicate prevention during mapping
   */
  async searchChildren(query, birthDate = null) {
    const q = (query || '').toLowerCase().trim();
    if (!q && !birthDate) return [];

    return centralDataStore.getChildren().filter((c) => {
      const fullName = (c.fullName || `${c.firstName} ${c.lastName}`).toLowerCase();
      const idMatch = c.id.toLowerCase().includes(q);
      const nameMatch = q ? fullName.includes(q) : false;
      const dobMatch = birthDate ? c.birthDate === birthDate : false;
      return idMatch || nameMatch || dobMatch;
    });
  },

  /**
   * POST /api/children OR POST /api/mapping/children
   * Generates Unique Child ID or links matched record without duplication
   */
  async registerChild(childData) {
    // Check if user confirmed "This is the same child"
    if (childData.existingChildId) {
      const existing = centralDataStore.getChildById(childData.existingChildId);
      if (existing) {
        if (childData.householdId) existing.householdId = childData.householdId;
        if (childData.enrollmentStatus) existing.enrollmentStatus = childData.enrollmentStatus;
        if (childData.enrollmentCenter) existing.enrollmentCenter = childData.enrollmentCenter;
        centralDataStore.save();

        return {
          child: existing,
          isDuplicatePrevented: true,
          message: `Linked to existing record (${existing.id}). No duplicate record created.`,
        };
      }
    }

    const newChild = centralDataStore.registerChild({
      firstName: childData.firstName,
      middleName: childData.middleName || '',
      lastName: childData.lastName,
      birthDate: childData.birthDate,
      sex: childData.sex || 'Female',
      ageYears: parseInt(childData.ageYears || 3, 10),
      ageMonths: parseInt(childData.ageMonths || 0, 10),
      householdId: childData.householdId,
      parentGuardian: childData.parentGuardian || '',
      barangay: childData.barangay || 'San Isidro',
      enrollmentStatus: childData.enrollmentStatus || 'Not Enrolled',
      enrollmentCenter: childData.enrollmentCenter || null,
      matched: false,
    });

    try {
      await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChild),
      });
    } catch (e) { }

    return {
      child: newChild,
      isDuplicatePrevented: false,
      message: `New unique child ID generated: ${newChild.id}`,
    };
  },

  /**
   * Mobile draft persistence (Save Draft & Offline sync)
   */
  saveDraft(draftData) {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draftData));
      return { ok: true, timestamp: formatPHTTime(new Date()) };
    } catch (e) {
      return { ok: false };
    }
  },

  getDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
  },

  clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch (e) { }
  },
};

export default communityMappingService;
