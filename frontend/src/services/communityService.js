/**
 * ECCD CARE — Community Management API Service
 * City Social Welfare & Development Office (CSWDO)
 *
 * API Contract:
 * GET /api/barangays
 * GET /api/barangays/:id
 * GET /api/centers
 * GET /api/centers/:id
 * GET /api/workers
 * GET /api/workers/:id
 *
 * Barangay list = official 35 barangays of the City of San Fernando, Pampanga.
 * Every counter is computed from REAL registered child records — no mock statistics.
 */

import { centralDataStore } from './centralDataStore.js';
import { SAN_FERNANDO_BARANGAYS } from '../data/sanFernandoBarangays.js';

export const WORKER_ROLES = [
  'Service Provider',
  'Day Care Worker',
  'Child Development Worker',
  'CSWDO Admin',
];

const norm = (v) => String(v || '').toLowerCase().trim();

/** Build barangay rows from the official list + live child records. */
function buildBarangays() {
  const children = centralDataStore.getChildren() || [];
  const centers = centralDataStore.getDayCareCenters() || [];
  const workers = centralDataStore.getWorkers() || [];

  return SAN_FERNANDO_BARANGAYS.map((name, i) => {
    const kids = children.filter((c) => norm(c.barangay) === norm(name));
    const enrolled = kids.filter(
      (c) => c.statusPillars?.enrolled?.status === 'Enrolled' || c.enrollmentStatus === 'Enrolled'
    ).length;
    const healthDue = kids.filter((c) => {
      const s = c.statusPillars?.health?.status;
      return s && s !== 'Up to date';
    }).length;
    const devFollowups = kids.filter(
      (c) => (c.followUpCases || []).some((f) => f.status !== 'Closed' && f.status !== 'Resolved')
    ).length;
    const brgyCenters = centers.filter((c) => norm(c.barangayName || c.barangay) === norm(name));
    const brgyWorkers = workers.filter((w) => (w.assignedBarangays || []).some((b) => norm(b) === norm(name)));

    return {
      id: `BRGY-${String(i + 1).padStart(2, '0')}`,
      name,
      district: 'City of San Fernando',
      totalChildren: kids.length,
      mapped: kids.length,
      enrolled,
      notEnrolled: kids.length - enrolled,
      healthDue,
      devFollowups,
      centersCount: brgyCenters.length,
      workersCount: brgyWorkers.length,
      primaryWorker: brgyWorkers[0]?.name || '—',
      centers: brgyCenters.map((c) => c.name),
    };
  });
}

function mapCenter(c) {
  return {
    ...c,
    barangay: c.barangay || c.barangayName || '',
    primaryWorker: c.primaryWorker || '—',
    assignedWorkers: c.assignedWorkers || [],
    enrolledChildren: c.enrolledChildren ?? c.enrolledCount ?? 0,
  };
}

function mapWorker(w) {
  return {
    ...w,
    assignedBarangay: w.assignedBarangay || (w.assignedBarangays || []).join(', '),
    assignedCenters: w.assignedCenters || (w.dayCareCenterName ? [w.dayCareCenterName] : []),
  };
}

export const communityService = {
  /** GET /api/barangays */
  async getBarangays(filters = {}) {
    let list = buildBarangays();
    if (filters.search) {
      const q = norm(filters.search);
      list = list.filter((b) => norm(b.name).includes(q) || norm(b.primaryWorker).includes(q));
    }
    return list;
  },

  /** GET /api/barangays/:id */
  async getBarangayById(id) {
    return buildBarangays().find((b) => b.id === id || norm(b.name) === norm(id)) || null;
  },

  /** GET /api/centers */
  async getCenters(filters = {}) {
    let list = (centralDataStore.getDayCareCenters() || []).map(mapCenter);
    if (filters.barangay && filters.barangay !== 'all') {
      list = list.filter((c) => c.barangay === filters.barangay);
    }
    if (filters.search) {
      const q = norm(filters.search);
      list = list.filter((c) => norm(c.name).includes(q) || norm(c.barangay).includes(q));
    }
    return list;
  },

  /** GET /api/centers/:id */
  async getCenterById(id) {
    const list = (centralDataStore.getDayCareCenters() || []).map(mapCenter);
    return list.find((c) => c.id === id || norm(c.name) === norm(id)) || null;
  },

  /** GET /api/workers */
  async getWorkers(filters = {}) {
    let list = (centralDataStore.getWorkers() || []).map(mapWorker);
    if (filters.role && filters.role !== 'all') {
      list = list.filter((w) => w.role === filters.role);
    }
    if (filters.search) {
      const q = norm(filters.search);
      list = list.filter(
        (w) => norm(w.name).includes(q) || norm(w.role).includes(q) || norm(w.assignedBarangay).includes(q)
      );
    }
    return list;
  },

  /** GET /api/workers/:id */
  async getWorkerById(id) {
    const list = (centralDataStore.getWorkers() || []).map(mapWorker);
    return list.find((w) => w.id === id || norm(w.name) === norm(id)) || null;
  },
};

export default communityService;
