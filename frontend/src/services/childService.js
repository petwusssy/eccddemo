/**
 * ECCD CARE — Child Management & Child 360° API Service Layer
 *
 * Implements Child Management API Contract:
 *   GET  /api/children                → Children Directory with rich multi-field filters
 *   GET  /api/children/:id            → Full Child 360° master profile record
 *   GET  /api/children/:id/timeline   → Complete chronological lifecycle audit trail
 *   GET  /api/children/:id/household  → Family unit & household co-residents
 *   GET  /api/children/:id/status     → 5 core status pillars
 *   POST /api/children                → Register new child
 *   PUT  /api/children/:id            → Update persistent child record
 *
 * Core Concept: ONE CHILD = ONE PERSISTENT RECORD.
 * Directly bound to centralDataStore.js as single source of truth.
 */

import { centralDataStore } from './centralDataStore.js';

export const childService = {
  /**
   * GET /api/children (Directory with search & filters)
   */
  async getChildren(filters = {}) {
    let list = centralDataStore.getChildren() || [];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((c) => {
        const name = (c.fullName || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase();
        const id = (c.id || '').toLowerCase();
        const hhId = (c.householdId || '').toLowerCase();
        const brgy = (c.barangay || '').toLowerCase();
        const center = (c.dayCareCenterName || c.assignedCenter || '').toLowerCase();
        return name.includes(q) || id.includes(q) || hhId.includes(q) || brgy.includes(q) || center.includes(q);
      });
    }

    if (filters.barangay) {
      list = list.filter((c) => c.barangay === filters.barangay);
    }

    if (filters.enrollmentStatus) {
      list = list.filter(
        (c) =>
          c.enrollmentStatus === filters.enrollmentStatus ||
          c.statusPillars?.enrolled?.status === filters.enrollmentStatus
      );
    }

    if (filters.healthStatus) {
      list = list.filter(
        (c) =>
          c.healthStatus === filters.healthStatus ||
          c.statusPillars?.health?.status === filters.healthStatus
      );
    }

    if (filters.developmentStatus) {
      list = list.filter(
        (c) =>
          c.developmentStatus === filters.developmentStatus ||
          c.statusPillars?.development?.status === filters.developmentStatus
      );
    }

    if (filters.followUpStatus) {
      list = list.filter((c) =>
        filters.followUpStatus === 'Active'
          ? (c.hasOpenFollowUp || (c.statusPillars?.followUp?.status && c.statusPillars.followUp.status !== 'None'))
          : (!c.hasOpenFollowUp && (!c.statusPillars?.followUp?.status || c.statusPillars.followUp.status === 'None'))
      );
    }

    if (filters.sex) {
      list = list.filter((c) => c.sex === filters.sex);
    }

    if (filters.age) {
      const ageNum = parseInt(filters.age, 10);
      list = list.filter((c) => c.ageYears === ageNum);
    }

    return {
      total: list.length,
      children: list,
    };
  },

  /**
   * GET /api/children/:id (Child 360° Profile)
   */
  async getChildById(id) {
    return centralDataStore.getChild360(id);
  },

  /**
   * GET /api/children/:id/timeline
   */
  async getTimeline(id) {
    const child = await this.getChildById(id);
    return child ? child.timeline || [] : [];
  },

  /**
   * GET /api/children/:id/household
   */
  async getHousehold(id) {
    const child = await this.getChildById(id);
    return child ? child.familyHousehold || child.household : null;
  },

  /**
   * GET /api/children/:id/status
   */
  async getStatusPillars(id) {
    const child = await this.getChildById(id);
    return child ? child.statusPillars : null;
  },

  /**
   * Quick Action 1: Add Enrollment
   */
  async addEnrollment(id, enrollmentData) {
    try {
      centralDataStore.enrollChild({
        childId: id,
        ...enrollmentData,
      });
      return { ok: true, child: centralDataStore.getChild360(id) };
    } catch (e) {
      console.warn('Failed to add enrollment:', e);
      return { ok: false, error: e.message };
    }
  },

  /**
   * Quick Action 2: Record Health Monitoring
   */
  async recordHealth(id, healthData) {
    try {
      centralDataStore.recordHealth({
        childId: id,
        ...healthData,
      });
      return { ok: true, child: centralDataStore.getChild360(id) };
    } catch (e) {
      console.warn('Failed to record health:', e);
      return { ok: false, error: e.message };
    }
  },

  /**
   * Quick Action 3: Start Development Assessment
   */
  async startDevelopmentAssessment(id, assessmentData) {
    try {
      centralDataStore.recordAssessment({
        childId: id,
        ...assessmentData,
      });
      return { ok: true, child: centralDataStore.getChild360(id) };
    } catch (e) {
      console.warn('Failed to record assessment:', e);
      return { ok: false, error: e.message };
    }
  },

  /**
   * Quick Action 4: Create Follow-up
   */
  async createFollowUp(id, followUpData) {
    try {
      centralDataStore.createFollowUp({
        childId: id,
        ...followUpData,
      });
      return { ok: true, child: centralDataStore.getChild360(id) };
    } catch (e) {
      console.warn('Failed to create follow-up:', e);
      return { ok: false, error: e.message };
    }
  },
};

export default childService;
