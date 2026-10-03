/**
 * ECCD CARE — Child Management & Child 360° API Service Layer
 *
 * Implements Child Management API Contract (api-and-interface-design skill):
 *   GET  /api/children                → Children Directory with rich multi-field filters
 *   GET  /api/children/:id            → Full Child 360° master profile record
 *   GET  /api/children/:id/timeline   → Complete chronological lifecycle audit trail
 *   GET  /api/children/:id/household  → Family unit & household co-residents
 *   GET  /api/children/:id/status     → 5 core status pillars
 *   POST /api/children                → Register new child
 *   PUT  /api/children/:id            → Update persistent child record
 *
 * Core Concept: ONE CHILD = ONE PERSISTENT RECORD.
 */

const STORAGE_KEY_CHILDREN_360 = 'eccd_children_360_data_v2';

// Master pre-seeded persistent records for City of San Fernando, Pampanga (Clean empty slate)
const DEFAULT_CHILDREN_360 = [];

function getStoredChildren() {
  try {
    localStorage.removeItem('eccd_children_360_data');
    const raw = localStorage.getItem(STORAGE_KEY_CHILDREN_360);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CHILDREN_360;
}

function setStoredChildren(data) {
  try {
    localStorage.setItem(STORAGE_KEY_CHILDREN_360, JSON.stringify(data));
  } catch (e) {}
}

let childrenState = getStoredChildren();

export const childService = {
  /**
   * GET /api/children (Directory with search & filters)
   */
  async getChildren(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.enrollmentStatus) params.append('enrollmentStatus', filters.enrollmentStatus);
      if (filters.sex) params.append('sex', filters.sex);

      const res = await fetch(`/api/children?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}

    // Fallback in-memory filter
    let list = [...childrenState];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.householdId.toLowerCase().includes(q) ||
        c.barangay.toLowerCase().includes(q) ||
        (c.assignedCenter && c.assignedCenter.toLowerCase().includes(q))
      );
    }

    if (filters.barangay) {
      list = list.filter((c) => c.barangay === filters.barangay);
    }

    if (filters.enrollmentStatus) {
      list = list.filter((c) => c.statusPillars.enrolled.status === filters.enrollmentStatus);
    }

    if (filters.healthStatus) {
      list = list.filter((c) => c.statusPillars.health.status === filters.healthStatus);
    }

    if (filters.developmentStatus) {
      list = list.filter((c) => c.statusPillars.development.status === filters.developmentStatus);
    }

    if (filters.followUpStatus) {
      list = list.filter((c) =>
        filters.followUpStatus === 'Active'
          ? c.statusPillars.followUp.status !== 'None'
          : c.statusPillars.followUp.status === 'None'
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
   * GET /api/children/:id
   */
  async getChildById(id) {
    try {
      const res = await fetch(`/api/children/${id}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}

    const child = childrenState.find((c) => c.id === id);
    return child || null;
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
    return child ? child.familyHousehold : null;
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
    const child = childrenState.find((c) => c.id === id);
    if (!child) return { ok: false };

    child.statusPillars.enrolled = {
      status: 'Enrolled',
      variant: 'success',
      center: enrollmentData.center || 'San Isidro CDC I',
      program: enrollmentData.program || 'Child Development Center (CDC)',
      session: enrollmentData.session || 'Morning Session (8:00 AM - 11:00 AM)',
      date: new Date().toISOString().split('T')[0],
      sy: 'SY 2026–2027',
    };
    child.assignedCenter = enrollmentData.center || child.assignedCenter;

    child.timeline.unshift({
      id: `TL-${Date.now()}`,
      type: 'Enrollment',
      title: `Enrolled in ${enrollmentData.center || 'Day Care Center'}`,
      description: `Session: ${enrollmentData.session || 'Morning'} • Program: ${enrollmentData.program || 'CDC'}`,
      date: new Date().toISOString().split('T')[0],
      author: 'CSWDO Administrator',
      badgeVariant: 'success',
    });

    setStoredChildren(childrenState);
    return { ok: true, child };
  },

  /**
   * Quick Action 2: Record Health Monitoring
   */
  async recordHealth(id, healthData) {
    const child = childrenState.find((c) => c.id === id);
    if (!child) return { ok: false };

    const newHealthRec = {
      id: `HLT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: healthData.type || 'OPT Plus Anthropometric Weighing',
      weight: `${healthData.weightKg || '14.5'} kg`,
      height: `${healthData.heightCm || '96.5'} cm`,
      status: healthData.nutritionalStatus || 'Normal',
      examiner: healthData.examiner || 'CDW Worker',
      remarks: healthData.remarks || 'Routine growth monitoring recorded.',
    };

    child.healthRecords.unshift(newHealthRec);
    child.statusPillars.health = {
      status: 'Up to date',
      variant: 'success',
      lastWeightKg: parseFloat(healthData.weightKg || 14.5),
      lastHeightCm: parseFloat(healthData.heightCm || 96.5),
      nutritionalStatus: healthData.nutritionalStatus || 'Normal Weight for Age',
      dewormingStatus: 'Updated',
      vitASupplementation: 'Updated',
      nextDue: 'In 3 Months',
    };

    child.timeline.unshift({
      id: `TL-${Date.now()}`,
      type: 'Health Monitoring',
      title: 'Health & Growth Check Recorded',
      description: `Weight: ${newHealthRec.weight}, Height: ${newHealthRec.height} (${newHealthRec.status})`,
      date: newHealthRec.date,
      author: newHealthRec.examiner,
      badgeVariant: 'info',
    });

    setStoredChildren(childrenState);
    return { ok: true, child };
  },

  /**
   * Quick Action 3: Start Development Assessment
   */
  async startDevelopmentAssessment(id, assessmentData) {
    const child = childrenState.find((c) => c.id === id);
    if (!child) return { ok: false };

    const cycleName = assessmentData.cycle || '2nd Assessment Cycle (SY 2026–2027)';
    const score = parseInt(assessmentData.scaledScore || 105, 10);
    const interpretation = score < 80 ? 'Significant Delay' : score < 90 ? 'Developmental Alert' : 'Standard Average Development';

    const newDevRec = {
      id: `DEV-${Date.now()}`,
      cycle: cycleName,
      date: new Date().toISOString().split('T')[0],
      evaluator: assessmentData.evaluator || 'CDW Teacher',
      scaledScore: score,
      interpretation,
      domains: assessmentData.domains || [
        { name: 'Gross Motor', score: 10, max: 13, alert: false },
        { name: 'Fine Motor', score: 11, max: 11, alert: false },
        { name: 'Self-Help', score: 19, max: 20, alert: false },
        { name: 'Receptive Language', score: 9, max: 9, alert: false },
        { name: 'Expressive Language', score: 9, max: 11, alert: false },
        { name: 'Cognitive', score: 15, max: 16, alert: false },
        { name: 'Social-Emotional', score: 19, max: 20, alert: false },
      ],
    };

    child.developmentAssessments.unshift(newDevRec);
    child.statusPillars.development = {
      status: score >= 90 ? 'Completed (Standard)' : 'Follow-up Needed',
      variant: score >= 90 ? 'success' : 'danger',
      assessmentCycle: cycleName,
      assessmentDate: newDevRec.date,
      scaledScore: score,
      interpretation,
      flaggedDomains: score < 90 ? ['Re-assessment required'] : [],
    };

    child.timeline.unshift({
      id: `TL-${Date.now()}`,
      type: 'Development Assessment',
      title: `ECCD Assessment Completed: Score ${score}`,
      description: `${cycleName} — Result: ${interpretation}`,
      date: newDevRec.date,
      author: newDevRec.evaluator,
      badgeVariant: score >= 90 ? 'success' : 'warning',
    });

    setStoredChildren(childrenState);
    return { ok: true, child };
  },

  /**
   * Quick Action 4: Create Follow-up
   */
  async createFollowUp(id, followUpData) {
    const child = childrenState.find((c) => c.id === id);
    if (!child) return { ok: false };

    const fupId = `FUP-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newFollowUp = {
      id: fupId,
      title: followUpData.title || 'General ECCD Care Follow-up',
      issue: followUpData.issue || 'Intervention needed based on assessment.',
      priority: followUpData.priority || 'High',
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: followUpData.dueDate || 'Nov 30, 2026',
      assignedWorker: followUpData.assignedWorker || child.assignedWorker,
      workerContact: child.assignedWorkerContact,
      plan: followUpData.plan || 'Home visit and parent conference.',
      actionHistory: [],
    };

    child.followUpCases.unshift(newFollowUp);
    child.statusPillars.followUp = {
      status: 'Active Follow-up',
      variant: newFollowUp.priority === 'Urgent' ? 'danger' : 'warning',
      activeCaseId: fupId,
      issue: newFollowUp.title,
      priority: newFollowUp.priority,
      dueDate: newFollowUp.dueDate,
      assignedWorker: newFollowUp.assignedWorker,
    };

    child.timeline.unshift({
      id: `TL-${Date.now()}`,
      type: 'Follow-up',
      title: `Follow-up Case Opened: ${newFollowUp.title}`,
      description: `${newFollowUp.issue} (Priority: ${newFollowUp.priority})`,
      date: newFollowUp.createdDate,
      author: newFollowUp.assignedWorker,
      badgeVariant: 'danger',
    });

    setStoredChildren(childrenState);
    return { ok: true, child };
  },
};

export default childService;
