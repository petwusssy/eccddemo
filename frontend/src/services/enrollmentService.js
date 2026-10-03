/**
 * ECCD CARE — Enrollment API Service Layer
 *
 * Implements Enrollment API Contract:
 *   GET  /api/enrollments               → Directory of enrolled children
 *   GET  /api/enrollments/not-enrolled  → Dedicated operational view: Mapped but Not Enrolled
 *   POST /api/enrollments               → Enroll existing child (reuses ECCD ID, no duplicates!)
 *   GET  /api/children/:id/enrollment   → Get child's enrollment status and history
 *   PUT  /api/enrollments/:id           → Update enrollment record
 *
 * Core Concept: ONE CHILD = ONE PERSISTENT RECORD (Mapped → Not Enrolled → Enrolled).
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';

export const enrollmentService = {
  /**
   * GET /api/enrollments
   */
  async getEnrollments(filters = {}) {
    const rawEnrollments = centralDataStore.getEnrollments() || [];
    const children = centralDataStore.getChildren() || [];

    // Map and enrich enrollments with child details
    let list = rawEnrollments.map((enr) => {
      const child = children.find((c) => c.id === enr.childId);
      return {
        ...enr,
        childName: enr.childName || child?.fullName || 'Enrolled Child',
        ageDisplay: enr.ageDisplay || child?.ageDisplay || '3 yrs',
        sex: enr.sex || child?.sex || 'Female',
        barangay: enr.barangay || child?.barangay || 'San Isidro',
        center: enr.center || child?.dayCareCenterName || 'San Isidro Child Development Center I',
        session: enr.session || 'Morning Session (8:00 AM – 11:00 AM)',
        schoolYear: enr.schoolYear || 'SY 2026–2027',
        enrollmentDate: enr.enrollmentDate || enr.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        status: enr.status || 'Enrolled',
      };
    });

    // Also include any children whose status is 'Enrolled' even if raw enrollment is not present
    children.forEach((c) => {
      if (c.enrollmentStatus === 'Enrolled' && !list.some((e) => e.childId === c.id)) {
        list.push({
          id: `ENR-${c.id}`,
          childId: c.id,
          childName: c.fullName || `${c.firstName} ${c.lastName}`,
          ageDisplay: c.ageDisplay || `${c.ageYears || 3} yrs`,
          sex: c.sex || 'Female',
          barangay: c.barangay || 'San Isidro',
          center: c.dayCareCenterName || 'San Isidro Child Development Center I',
          session: 'Morning Session (8:00 AM – 11:00 AM)',
          schoolYear: 'SY 2026–2027',
          enrollmentDate: c.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: 'Enrolled',
        });
      }
    });

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((e) =>
        (e.childName || '').toLowerCase().includes(q) ||
        (e.childId || '').toLowerCase().includes(q) ||
        (e.barangay || '').toLowerCase().includes(q) ||
        (e.center || '').toLowerCase().includes(q)
      );
    }
    if (filters.barangay) list = list.filter((e) => e.barangay === filters.barangay);
    if (filters.center) list = list.filter((e) => e.center === filters.center);
    if (filters.schoolYear) list = list.filter((e) => e.schoolYear === filters.schoolYear);

    return { total: list.length, enrollments: list };
  },

  /**
   * Helper: Get enrolled children cohort directly
   */
  getEnrolledChildren() {
    return centralDataStore.getChildren().filter((c) => c.enrollmentStatus === 'Enrolled');
  },

  /**
   * GET /api/enrollments/not-enrolled
   */
  async getNotEnrolledChildren(filters = {}) {
    const rawChildren = centralDataStore.getChildren() || [];
    let list = rawChildren
      .filter((c) => c.enrollmentStatus === 'Not Enrolled' || !c.enrollmentStatus)
      .map((c) => ({
        ...c,
        childId: c.id,
        childName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        ageDisplay: c.ageDisplay || `${c.ageYears || 3} yrs`,
        mappingDate: c.createdAt ? c.createdAt.split('T')[0] : '2026-09-15',
        mappingYear: 2026,
        status: 'Mapped (Not Enrolled)',
        nearestCenter: c.nearestCenter || (c.barangay ? `${c.barangay} Child Development Center` : 'San Isidro Child Development Center I'),
      }));

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

    const notEnrolled = await this.getNotEnrolledChildren();
    return (notEnrolled.children || []).filter((c) =>
      (c.childName || '').toLowerCase().includes(q) ||
      (c.childId || '').toLowerCase().includes(q) ||
      (c.barangay || '').toLowerCase().includes(q)
    );
  },

  /**
   * POST /api/enrollments
   * Core rule: ENROLL EXISTING CHILD without creating a duplicate record!
   */
  async enrollChild(arg1, arg2, arg3) {
    // Support both enrollChild(payload) and enrollChild(childId, cdcId, details)
    let payload = {};
    if (typeof arg1 === 'string') {
      payload = {
        childId: arg1,
        dayCareCenterId: arg2,
        center: arg3?.center || arg2,
        ...(arg3 || {}),
      };
    } else {
      payload = { ...arg1 };
    }

    const enrollment = centralDataStore.enrollChild({
      childId: payload.childId,
      dayCareCenterId: payload.dayCareCenterId || payload.centerId,
      center: payload.center || 'San Isidro Child Development Center I',
      program: payload.program || 'Child Development Center (CDC)',
      session: payload.session || 'Morning Session (8:00 AM – 11:00 AM)',
      schoolYear: payload.schoolYear || 'SY 2026–2027',
      enrollmentDate: payload.enrollmentDate || new Date().toISOString().split('T')[0],
      teacher: payload.teacher || 'Maria Santos, CDW I',
      status: payload.status || 'Enrolled',
    });

    return {
      enrollment,
      message: `Child (${payload.childId}) officially enrolled in ${enrollment.center}. Lifecycle updated to ENROLLED. No duplicate created.`,
      lifecycleTransition: 'Mapped → Not Enrolled → Enrolled (Success)',
    };
  },

  /**
   * GET /api/children/:id/enrollment
   */
  async getChildEnrollment(childId) {
    const list = (centralDataStore.getEnrollments() || []).filter((e) => e.childId === childId);
    const child = centralDataStore.getChildById(childId);
    const isEnrolled = child?.enrollmentStatus === 'Enrolled' || list.length > 0;
    const current = list[0] || (isEnrolled ? {
      childId,
      center: child?.dayCareCenterName || 'San Isidro Child Development Center I',
      status: 'Enrolled',
      schoolYear: 'SY 2026–2027',
      enrollmentDate: child?.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    } : null);

    return {
      childId,
      isEnrolled,
      currentEnrollment: current,
      history: list.length > 0 ? list : (current ? [current] : []),
    };
  },

  /**
   * PUT /api/enrollments/:id
   */
  async updateEnrollment(id, data) {
    const list = centralDataStore.getEnrollments() || [];
    const item = list.find((e) => e.id === id);
    if (item) {
      Object.assign(item, data);
      centralDataStore.save();
      return { ok: true, enrollment: item };
    }
    return { ok: false, error: 'Not found' };
  },
};

export default enrollmentService;
