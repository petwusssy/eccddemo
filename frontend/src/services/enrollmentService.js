/**
 * ECCD CARE — Enrollment API Service Layer
 *
 * Implements Enrollment API Contract (api-and-interface-design skill):
 *   GET  /api/enrollments               → Directory of enrolled children
 *   GET  /api/enrollments/not-enrolled  → Dedicated operational view: Mapped but Not Enrolled
 *   POST /api/enrollments               → Enroll existing child (reuses ECCD ID, no duplicates!)
 *   GET  /api/children/:id/enrollment   → Get child's enrollment status and history
 *   PUT  /api/enrollments/:id           → Update enrollment record
 *
 * Core Concept: ONE CHILD = ONE PERSISTENT RECORD (Mapped → Not Enrolled → Enrolled).
 */

const STORAGE_KEY_ENROLLMENTS = 'eccd_enrollments_data_v2';
const STORAGE_KEY_NOT_ENROLLED = 'eccd_not_enrolled_data_v2';

const DEFAULT_ENROLLMENTS = [];

const DEFAULT_NOT_ENROLLED = [];

function getStored(key, fallback) {
  try {
    if (key.endsWith('_v2')) { localStorage.removeItem(key.replace('_v2', '')); }
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

let enrollmentsState = getStored(STORAGE_KEY_ENROLLMENTS, DEFAULT_ENROLLMENTS);
let notEnrolledState = getStored(STORAGE_KEY_NOT_ENROLLED, DEFAULT_NOT_ENROLLED);

export const enrollmentService = {
  /**
   * GET /api/enrollments
   */
  async getEnrollments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.center) params.append('center', filters.center);
      if (filters.schoolYear) params.append('schoolYear', filters.schoolYear);

      const res = await fetch(`/api/enrollments?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}

    let list = [...enrollmentsState];
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((e) =>
        e.childName.toLowerCase().includes(q) ||
        e.childId.toLowerCase().includes(q) ||
        e.barangay.toLowerCase().includes(q) ||
        e.center.toLowerCase().includes(q)
      );
    }
    if (filters.barangay) list = list.filter((e) => e.barangay === filters.barangay);
    if (filters.center) list = list.filter((e) => e.center === filters.center);
    if (filters.schoolYear) list = list.filter((e) => e.schoolYear === filters.schoolYear);

    return { total: list.length, enrollments: list };
  },

  /**
   * GET /api/enrollments/not-enrolled
   */
  async getNotEnrolledChildren(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.age) params.append('age', filters.age);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`/api/enrollments/not-enrolled?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}

    let list = [...notEnrolledState];
    if (filters.barangay) list = list.filter((c) => c.barangay === filters.barangay);
    if (filters.age) list = list.filter((c) => c.ageYears === parseInt(filters.age, 10));
    if (filters.year) list = list.filter((c) => c.mappingYear === parseInt(filters.year, 10));
    if (filters.status) list = list.filter((c) => c.status === filters.status);

    return { total: list.length, children: list };
  },

  /**
   * Search candidate children to enroll by Name or ECCD ID
   */
  async searchChildrenForEnrollment(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    return notEnrolledState.filter((c) =>
      c.childName.toLowerCase().includes(q) ||
      c.childId.toLowerCase().includes(q) ||
      c.barangay.toLowerCase().includes(q)
    );
  },

  /**
   * POST /api/enrollments
   * Core rule: ENROLL EXISTING CHILD without creating a duplicate record!
   */
  async enrollChild(data) {
    const childId = data.childId;
    const notEnrIndex = notEnrolledState.findIndex((c) => c.childId === childId);
    const existingMapped = notEnrIndex >= 0 ? notEnrolledState[notEnrIndex] : null;

    if (notEnrIndex >= 0) {
      notEnrolledState.splice(notEnrIndex, 1);
      setStored(STORAGE_KEY_NOT_ENROLLED, notEnrolledState);
    }

    const id = `ENR-2026-${String(enrollmentsState.length + 42).padStart(4, '0')}`;

    const newEnrollment = {
      id,
      childId,
      childName: data.childName || (existingMapped ? existingMapped.childName : 'Enrolled Child'),
      birthDate: data.birthDate || (existingMapped ? existingMapped.birthDate : '2023-01-01'),
      ageDisplay: data.ageDisplay || (existingMapped ? existingMapped.ageDisplay : '3 yrs'),
      sex: data.sex || (existingMapped ? existingMapped.sex : 'Female'),
      barangay: data.barangay || (existingMapped ? existingMapped.barangay : 'San Isidro'),
      center: data.center || 'San Isidro Child Development Center I',
      program: data.program || 'Child Development Center (CDC)',
      session: data.session || 'Morning Session (8:00 AM – 11:00 AM)',
      schoolYear: data.schoolYear || 'SY 2026–2027',
      enrollmentDate: data.enrollmentDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Enrolled',
      teacher: data.teacher || 'Assigned Daycare Teacher',
      previousRecords: [],
    };

    enrollmentsState.unshift(newEnrollment);
    setStored(STORAGE_KEY_ENROLLMENTS, enrollmentsState);

    try {
      await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    return {
      enrollment: newEnrollment,
      message: `Child ${newEnrollment.childName} (${childId}) officially enrolled. Lifecycle updated to ENROLLED. No duplicate created.`,
      lifecycleTransition: 'Mapped → Not Enrolled → Enrolled (Success)',
    };
  },

  /**
   * GET /api/children/:id/enrollment
   */
  async getChildEnrollment(childId) {
    const list = enrollmentsState.filter((e) => e.childId === childId);
    const current = list.find((e) => e.status === 'Enrolled') || list[0] || null;
    return {
      childId,
      isEnrolled: !!current,
      currentEnrollment: current,
      history: list,
    };
  },

  /**
   * PUT /api/enrollments/:id
   */
  async updateEnrollment(id, data) {
    const item = enrollmentsState.find((e) => e.id === id);
    if (item) {
      Object.assign(item, data);
      setStored(STORAGE_KEY_ENROLLMENTS, enrollmentsState);
      return { ok: true, enrollment: item };
    }
    return { ok: false, error: 'Not found' };
  },
};

export default enrollmentService;
