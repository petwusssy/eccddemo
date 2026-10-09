/**
 * ECCD CARE — Follow-Up / Early Support API Service
 * CSWDO Case Management & Worker Assignment
 * UX Flow: “Identify → Monitor → Detect Need → Follow Up → Record Action”
 * Strict Rule: Do not diagnose children. Do not invent medical interventions.
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDate, addDaysPHT } from '../utils/phTime.js';
import { queueFrontlineAction } from './offlineMappingStore.js';

export const followUpService = {
  /**
   * Automated Case Flagging Logic:
   * Inspects all registered children and auto-inserts them into the Follow-up Queue if:
   * a) Development Assessment indicates Developmental Delay / Below Average (< 79 Standard Score or <= 6 Scaled Score)
   * b) Health Monitoring status is marked as Malnourished (Underweight, Severely Underweight, Stunted, Wasted)
   * c) Chronic absenteeism is flagged (absenteeismFlag, attendance < 75%, 5+ absences)
   */
  syncAutomatedFollowUps() {
    const children = centralDataStore.getChildren() || [];
    const assessments = centralDataStore.getDevelopmentAssessments() || [];
    const healthRecords = centralDataStore.getHealthMonitorings() || [];
    const existingFollowUps = centralDataStore.getFollowUps() || [];

    const existingChildIds = new Set(existingFollowUps.map((f) => f.childId));
    let storeChanged = false;

    children.forEach((child) => {
      const childId = child.id || child.childId;
      if (!childId) return;

      // a) Development Assessment: Developmental Delay / Below Average
      const childAssessments = assessments.filter((a) => a.childId === childId);
      const latestDev = childAssessments[childAssessments.length - 1];
      const hasDevDelay =
        (latestDev && (
          (latestDev.standardScore !== undefined && latestDev.standardScore < 79) ||
          (latestDev.scaledScore !== undefined && latestDev.scaledScore <= 6) ||
          /delay|below average/i.test(latestDev.interpretation || '')
        )) ||
        child.developmentStatus === 'Developmental Delay' ||
        child.developmentStatus === 'Follow-up Required' ||
        (child.statusPillars?.development?.scaledScore && child.statusPillars.development.scaledScore < 79) ||
        child.statusPillars?.development?.status === 'Follow-up Required';

      // b) Health Monitoring: Malnourished (Underweight, Stunted, Wasted)
      const childHealth = healthRecords.filter((h) => h.childId === childId);
      const latestHealth = childHealth[0] || childHealth[childHealth.length - 1];
      const nutStatus = latestHealth?.nutritionalStatus || child.nutritionalStatus || child.statusPillars?.health?.nutritionalStatus || '';
      const isMalnourished =
        /underweight|stunted|wasted/i.test(nutStatus) ||
        latestHealth?.isMalnourished === true;

      // c) Chronic Absenteeism
      const isAbsent =
        child.absenteeismFlag === true ||
        child.isChronicallyAbsent === true ||
        (typeof child.attendanceRate === 'number' && child.attendanceRate < 75) ||
        (typeof child.absentDays === 'number' && child.absentDays >= 5) ||
        child.statusPillars?.enrolled?.isChronicallyAbsent === true;

      if ((hasDevDelay || isMalnourished || isAbsent) && !existingChildIds.has(childId)) {
        let reason = '';
        let title = '';
        let actionType = 'Follow-up';

        if (hasDevDelay) {
          const scoreDisplay = latestDev?.standardScore ?? child.statusPillars?.development?.scaledScore ?? '<79';
          reason = `Developmental Alert: ECCD score (${scoreDisplay}) indicates developmental delay (< 79). Interventions and follow-up recommended.`;
          title = 'Developmental Delay Support';
          actionType = 'Follow-up';
        } else if (isMalnourished) {
          reason = `Nutritional Alert: Child marked as ${nutStatus} during growth monitoring. Supplementary feeding & monitoring required.`;
          title = 'Nutritional Malnutrition Intervention';
          actionType = 'Monitoring';
        } else if (isAbsent) {
          reason = `Attendance Alert: Chronic absenteeism recorded (attendance < 75%). Home visit and caregiver engagement required.`;
          title = 'Chronic Absenteeism Case';
          actionType = 'Scheduled Visit';
        }

        const newCase = {
          childId,
          childName: child.fullName || `${child.firstName || ''} ${child.lastName || ''}`.trim() || childId,
          barangay: child.barangay || 'City of San Fernando',
          dayCareCenter: child.dayCareCenterName || child.dayCareCenter || 'Child Development Center',
          reason,
          title,
          priority: 'Urgent',
          category: 'Needs Attention',
          status: 'Needs Attention',
          actionType,
          assignedWorker: child.worker || 'Maria Santos, CDW I',
          workerContact: '0917-555-0142',
          dueDate: addDaysPHT(14),
          notes: `Automated case flagged per ECCD rules: ${reason}`,
          history: [
            {
              date: getPhilippinesDate(),
              action: 'Automated Case Flagged',
              worker: 'ECCD Monitoring System',
              notes: reason,
            },
          ],
        };

        centralDataStore.createFollowUp(newCase);
        existingChildIds.add(childId);
        storeChanged = true;
      }
    });

    if (storeChanged) {
      centralDataStore.save();
    }
  },

  /**
   * GET /api/follow-ups
   */
  async getFollowUps(filters = {}) {
    this.syncAutomatedFollowUps();
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
    this.syncAutomatedFollowUps();
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
    const caseObj = {
      ...found,
      childProfile: child,
      childName: found.childName || child?.fullName || `Child ${found.childId}`,
      barangay: found.barangay || child?.barangay || 'San Isidro',
      dayCareCenter: found.dayCareCenter || child?.dayCareCenterName || 'San Isidro Child Development Center I',
      parentGuardian: child?.parentGuardian || '',
      history: found.history || [
        {
          date: found.createdAt ? found.createdAt.slice(0, 10) : getPhilippinesDate(),
          action: 'Follow-up Case Created',
          worker: found.assignedWorker || found.assignedWorkerName || 'CDW Worker',
          notes: found.reason || 'Case initiated.',
        },
      ],
    };

    return {
      ...caseObj,
      case: caseObj,
      timeline: child?.timeline || [
        {
          type: 'Follow-up',
          title: `Follow-up Case: ${found.title || found.reason || 'Case Initiated'}`,
          description: found.reason || 'Follow-up active',
          date: found.createdAt?.slice(0, 10) || getPhilippinesDate(),
          author: found.assignedWorker || 'CDW Worker',
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

    // If offline, queue for backend synchronization
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await queueFrontlineAction({
          type: 'followup',
          endpoint: '/api/follow-ups',
          method: 'POST',
          payload: {
            ...payload,
            caseId: newCase.id,
          },
        });
      } catch (e) {
        console.warn('Failed to queue offline follow-up action:', e);
      }
    }

    return {
      success: true,
      case: newCase,
      ...newCase,
    };
  },

  /**
   * POST /api/follow-ups/:id/intervention-plan
   * Formulates specific Early Support intervention plan
   */
  async saveInterventionPlan(caseId, planData) {
    const all = centralDataStore.getFollowUps() || [];
    const found = all.find((c) => c.id === caseId);
    if (!found) return null;

    found.interventionPlan = {
      targetDomains: planData.targetDomains || [],
      objectives: planData.objectives || '',
      activities: planData.activities || '',
      targetReviewDate: planData.targetReviewDate || addDaysPHT(30),
      recordedBy: planData.recordedBy || 'Maria Santos, CDW I',
      updatedAt: getPhilippinesDate(),
    };

    if (found.status === 'Needs Attention') {
      found.status = 'Pending';
      found.category = 'Pending';
    }

    if (!Array.isArray(found.history)) found.history = [];
    found.history.unshift({
      date: getPhilippinesDate(),
      action: 'Intervention Plan Established',
      worker: planData.recordedBy || 'Maria Santos, CDW I',
      notes: `Plan formulated for ${planData.targetDomains?.join(', ') || 'General'}: ${planData.objectives || planData.activities || 'Interventions documented.'}`,
    });

    centralDataStore.save();
    return found;
  },

  /**
   * POST /api/follow-ups/:id/schedule-visit
   * Schedules home visit by CDW or CSWDO worker
   */
  async scheduleHomeVisit(caseId, visitData) {
    const all = centralDataStore.getFollowUps() || [];
    const found = all.find((c) => c.id === caseId);
    if (!found) return null;

    found.scheduledVisit = {
      visitDate: visitData.visitDate || addDaysPHT(7),
      visitingWorker: visitData.visitingWorker || 'Maria Santos, CDW I',
      guardianContact: visitData.guardianContact || '',
      agenda: visitData.agenda || '',
      scheduledAt: getPhilippinesDate(),
    };

    found.status = 'Scheduled';
    found.category = 'Scheduled';
    found.actionType = 'Scheduled Visit';
    if (visitData.visitDate) {
      found.dueDate = visitData.visitDate;
    }

    if (!Array.isArray(found.history)) found.history = [];
    found.history.unshift({
      date: getPhilippinesDate(),
      action: 'Home Visit Scheduled',
      worker: visitData.visitingWorker || 'Maria Santos, CDW I',
      notes: `Home visit scheduled for ${visitData.visitDate}. Focus: ${visitData.agenda || 'Family check and development monitoring.'}`,
    });

    centralDataStore.save();
    return found;
  },

  /**
   * PUT /api/follow-ups/:id/status
   * Updates case progress through completion
   */
  async updateCaseStatus(caseId, newStatus, worker, notes) {
    const all = centralDataStore.getFollowUps() || [];
    const found = all.find((c) => c.id === caseId);
    if (!found) return null;

    found.status = newStatus;
    found.category = newStatus;
    found.updatedAt = getPhilippinesDate();

    if (!Array.isArray(found.history)) found.history = [];
    found.history.unshift({
      date: getPhilippinesDate(),
      action: `Status Updated to ${newStatus}`,
      worker: worker || 'CSWDO Worker',
      notes: notes || `Case progressed to ${newStatus}.`,
    });

    if (newStatus === 'Completed') {
      found.resolvedDate = getPhilippinesDate();
      const child = centralDataStore.getChildById(found.childId);
      if (child) child.hasOpenFollowUp = false;
    }

    centralDataStore.save();
    return found;
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
      if (!Array.isArray(resolved.history)) resolved.history = [];
      resolved.history.unshift({
        date: payload.date || getPhilippinesDate(),
        action: 'Case Resolved & Completed',
        worker: payload.worker || 'CSWDO Staff',
        notes: `${payload.actionTaken}. Remarks: ${payload.notes || 'None'}`,
      });
      resolved.status = payload.status || 'Completed';
      resolved.category = 'Completed';
      resolved.resolvedDate = payload.date || getPhilippinesDate();
      centralDataStore.save();
    }

    return {
      success: true,
      case: resolved,
    };
  },

  async resolveFollowUp(caseId, payload) {
    return this.resolveCase(caseId, payload);
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
