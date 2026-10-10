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
import { getApiUrl } from './apiConfig.js';

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
      const res = await fetch(getApiUrl('/api/mapping/activities'), {
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data && data.activities && data.assignments && data.assignments.length > 0) {
          return data;
        }
      }
    } catch (e) {
      // Fallback to local store
    }

    // Single source of truth: compile assignments dynamically from registered Form 6 workers
    const workers = (centralDataStore.getWorkers() || []).filter((w) => w.status !== 'Inactive');
    const households = centralDataStore.getHouseholds() || [];
    const activitiesList = activitiesState.length > 0 ? activitiesState : DEFAULT_ACTIVITIES;

    const dynamicAssignments = workers.map((w) => {
      const brgy = w.assignedBarangay || 'San Isidro';
      const center =
        (Array.isArray(w.assignedCenters) ? w.assignedCenters[0] : w.assignedCenters) ||
        w.centerName ||
        w.dayCareCenterName ||
        'Child Development Center';

      const matchingActivity =
        activitiesList.find(
          (act) =>
            !act.archived &&
            (act.barangays || []).some((b) => (b || '').toLowerCase().trim() === brgy.toLowerCase().trim())
        ) ||
        activitiesList.find((act) => !act.archived) ||
        activitiesList[0];

      const mappedHHs = households.filter((h) => {
        const matchBrgy = (h.barangay || '').toLowerCase().trim() === brgy.toLowerCase().trim();
        const matchWorker = (h.mappedBy && h.mappedBy === w.name) || (h.workerId && h.workerId === w.id);
        return matchBrgy || matchWorker;
      });

      const householdsMapped = mappedHHs.length;
      const childrenIdentified = mappedHHs.reduce(
        (acc, h) => acc + (h.children?.length || (h.childrenAges ? h.childrenAges.length : 0) || h.childrenCount || 1),
        0
      );
      const target = 60;
      const progress = target > 0 ? Math.min(100, Math.round((householdsMapped / target) * 100)) : 0;

      return {
        workerId: w.id,
        workerName: w.name,
        role: w.role || w.designation || 'Child Development Worker',
        assignedBarangay: brgy,
        assignedCenter: center,
        assignedCenters: [center],
        activityId: matchingActivity?.id || 'ACT-MAP-2026-001',
        activityName: matchingActivity?.name || '2026 Annual CSWDO House-to-House Child Mapping Drive',
        progress,
        householdsMapped,
        childrenIdentified,
        remainingHouseholds: Math.max(0, target - householdsMapped),
        status: 'Active in Field',
      };
    });

    return {
      activities: [...activitiesList],
      assignments: dynamicAssignments.length > 0 ? dynamicAssignments : [...assignmentsState],
      totalActivities: activitiesList.length,
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
      await fetch(getApiUrl('/api/mapping/activities'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
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
   * Single Source of Truth: centralDataStore.js (backend sync handled centrally)
   */
  async getHouseholds() {
    return centralDataStore.getHouseholds() || [];
  },

  /**
   * POST /api/households
   */
  async createHousehold(hhData) {
    const id = hhData.id || `HH-2026-${String(centralDataStore.getHouseholds().length + 101).padStart(4, '0')}`;
    const newHousehold = centralDataStore.createHousehold({
      id,
      parentGuardian: String(hhData.parentGuardian || 'Parent / Guardian').toUpperCase(),
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
      const res = await fetch(getApiUrl('/api/households'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(newHousehold),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          centralDataStore.mergeRecordsFromServer([], [json.data]);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Network offline during createHousehold, safely retained locally:', e.message);
    }

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
      firstName: String(childData.firstName || '').toUpperCase(),
      middleName: String(childData.middleName || '').toUpperCase(),
      lastName: String(childData.lastName || '').toUpperCase(),
      birthDate: childData.birthDate,
      sex: childData.sex || 'Female',
      ageYears: parseInt(childData.ageYears || 3, 10),
      ageMonths: parseInt(childData.ageMonths || 0, 10),
      householdId: childData.householdId,
      parentGuardian: String(childData.parentGuardian || '').toUpperCase(),
      barangay: childData.barangay || 'San Isidro',
      enrollmentStatus: childData.enrollmentStatus || 'Not Enrolled',
      enrollmentCenter: childData.enrollmentCenter || null,
      matched: false,
    });

    try {
      const res = await fetch(getApiUrl('/api/children'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(newChild),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          centralDataStore.mergeRecordsFromServer([json.data], []);
          return {
            child: json.data,
            isDuplicatePrevented: false,
            message: `New unique child ID generated: ${json.data.id || json.data.eccd_id}`,
          };
        }
      }
    } catch (e) {
      console.warn('Network offline during registerChild, safely retained locally:', e.message);
    }

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
