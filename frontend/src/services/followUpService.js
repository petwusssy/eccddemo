/**
 * ECCD CARE — Follow-Up / Early Support API Service
 * CSWDO Case Management & Worker Assignment
 * UX Flow: “Identify → Monitor → Detect Need → Follow Up → Record Action”
 * Strict Rule: Do not diagnose children. Do not invent medical interventions.
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDate, addDaysPHT } from '../utils/phTime.js';

export const followUpService = {
  /**
   * GET /api/follow-ups
   */
  async getFollowUps(filters = {}) {
    const all = centralDataStore.getFollowUps() || [];
    let filtered = [...all];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(
        (c) => (c.category || c.status || '').toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.actionType && filters.actionType !== 'all') {
      filtered = filtered.filter((c) => c.actionType === filters.actionType);
    }

    if (filters.barangay && filters.barangay !== 'all') {
      filtered = filtered.filter((c) => c.barangay === filters.barangay);
    }

    if (filters.assignedWorker && filters.assignedWorker !== 'all') {
      filtered = filtered.filter((c) => (c.assignedWorker || c.assignedWorkerName) === filters.assignedWorker);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          (c.childName || '').toLowerCase().includes(q) ||
          (c.childId || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q) ||
          (c.reason || c.title || '').toLowerCase().includes(q) ||
          (c.barangay || '').toLowerCase().includes(q)
      );
    }

    const counts = {
      needsAttention: all.filter((c) => (c.category || c.status) === 'Needs Attention').length,
      pending: all.filter((c) => (c.category || c.status) === 'Pending').length,
      scheduled: all.filter((c) => (c.category || c.status) === 'Scheduled').length,
      completed: all.filter((c) => (c.category || c.status) === 'Completed').length,
      totalCases: all.length,
    };

    return {
      counts,
      total: filtered.length,
      cases: filtered,
    };
  },

  /**
   * GET /api/follow-ups/needs-attention
   */
  async getNeedsAttention() {
    const all = centralDataStore.getFollowUps() || [];
    const cases = all.filter((c) => (c.category || c.status) === 'Needs Attention');
    return {
      total: cases.length,
      cases,
    };
  },

  /**
   * GET /api/follow-ups/:id
   */
  async getCaseById(id) {
    const all = centralDataStore.getFollowUps() || [];
    const found = all.find((c) => c.id === id);
    if (!found) return null;

    const child = centralDataStore.getChild360(found.childId) || centralDataStore.getChildById(found.childId);
    return {
      ...found,
      childProfile: child,
      childName: found.childName || child?.fullName || `Child ${found.childId}`,
      barangay: found.barangay || child?.barangay || 'San Isidro',
      dayCareCenter: found.dayCareCenter || child?.dayCareCenterName || 'San Isidro Child Development Center I',
      parentGuardian: child?.parentGuardian || '',
      history: found.history || [
        {
          date: found.createdAt ? found.createdAt.slice(0, 10) : '2026-09-15',
          action: 'Follow-up Case Created',
          worker: found.assignedWorker || found.assignedWorkerName || 'CDW Worker',
          notes: found.reason || 'Case initiated.',
        },
      ],
    };
  },

  async getCaseView(id) {
    return this.getCaseById(id);
  },

  /**
   * POST /api/follow-ups
   */
  async createFollowUp(payload) {
    const child = centralDataStore.getChildById(payload.childId);
    const newCase = centralDataStore.createFollowUp({
      childId: payload.childId,
      childName: payload.childName || child?.fullName || `Child ${payload.childId}`,
      barangay: payload.barangay || child?.barangay || 'San Isidro',
      dayCareCenter: payload.dayCareCenter || child?.dayCareCenterName || 'San Isidro Child Development Center I',
      reason: payload.reason || payload.title || 'General early support needed.',
      title: payload.title || payload.reason || 'Follow-up Case',
      priority: payload.priority || 'Medium',
      category: payload.category || 'Needs Attention',
      status: payload.status || 'Needs Attention',
      actionType: payload.actionType || 'Follow-up',
      assignedWorker: payload.assignedWorker || 'Maria Santos, CDW I',
      assignedWorkerName: payload.assignedWorker || 'Maria Santos, CDW I',
      workerContact: payload.workerContact || '0917-123-4567',
      dueDate: payload.dueDate || addDaysPHT(30),
      notes: payload.notes || '',
      history: [
        {
          date: getPhilippinesDate(),
          action: 'Case Created',
          worker: payload.assignedWorker || 'CDW Worker',
          notes: payload.notes || payload.reason || 'Follow-up initiated.',
        },
      ],
    });

    return {
      success: true,
      case: newCase,
    };
  },

  /**
   * POST /api/follow-ups/:id/resolve
   */
  async resolveCase(caseId, payload) {
    const resolved = centralDataStore.resolveFollowUp(caseId, {
      completedDate: payload.date || getPhilippinesDate(),
      actionTaken: payload.actionTaken || 'Case resolved and verified.',
      remarks: payload.notes || '',
    });

    if (resolved) {
      if (!resolved.history) resolved.history = [];
      resolved.history.push({
        date: payload.date || getPhilippinesDate(),
        action: 'Case Resolved',
        worker: payload.worker || 'CSWDO Staff',
        notes: `${payload.actionTaken}. Remarks: ${payload.notes || 'None'}`,
      });
      resolved.status = payload.status || 'Completed';
      resolved.category = 'Completed';
      centralDataStore.save();
    }

    return {
      success: true,
      case: resolved,
    };
  },

  /**
   * PUT /api/follow-ups/:id
   */
  async updateCase(id, payload) {
    const all = centralDataStore.getFollowUps() || [];
    const found = all.find((c) => c.id === id);
    if (found) {
      Object.assign(found, payload);
      centralDataStore.save();
      return found;
    }
    return null;
  },
};

export default followUpService;
