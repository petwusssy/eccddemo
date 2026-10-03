/**
 * ECCD CARE — Development Assessment Service
 * CSWDO ECCD Development Checklist Assessment Framework
 * Explicit placeholders for official ECCD Checklist integration.
 * Neutral prototype states: Assessment Pending, Assessment Completed, Follow-up Required.
 * DO NOT calculate fake results. DO NOT invent official questions.
 */

const STORAGE_KEY = 'eccd_development_assessments_v2';
const COHORT_KEY = 'eccd_development_cohort_v2';

const INITIAL_COHORT = [];

const INITIAL_ASSESSMENTS = {};

function getLocalCohort() {
  localStorage.removeItem('eccd_development_cohort');
  const raw = localStorage.getItem(COHORT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(COHORT_KEY, JSON.stringify(INITIAL_COHORT));
  return INITIAL_COHORT;
}

function saveLocalCohort(list) {
  localStorage.setItem(COHORT_KEY, JSON.stringify(list));
}

function getLocalAssessments() {
  localStorage.removeItem('eccd_development_assessments');
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSESSMENTS));
  return INITIAL_ASSESSMENTS;
}

function saveLocalAssessments(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export const developmentService = {
  /**
   * GET /api/development/assessments
   */
  async getAssessments(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/development/assessments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to local storage
    }

    const all = getLocalCohort();
    let filtered = [...all];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(
        (c) => c.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    if (filters.barangay && filters.barangay !== 'all') {
      filtered = filtered.filter((c) => c.barangay === filters.barangay);
    }
    if (filters.dayCareCenter && filters.dayCareCenter !== 'all') {
      filtered = filtered.filter((c) => c.dayCareCenter === filters.dayCareCenter);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.childId.toLowerCase().includes(q) ||
          c.barangay.toLowerCase().includes(q)
      );
    }

    const counts = {
      completedAssessments: all.filter((c) => c.status === 'Assessment Completed').length,
      pendingAssessments: all.filter((c) => c.status === 'Assessment Pending').length,
      followUps: all.filter((c) => c.status === 'Follow-up Required').length,
      dueAssessments: all.filter((c) => c.status === 'Assessment Pending').length,
      totalCohort: all.length,
    };

    return {
      counts,
      total: filtered.length,
      children: filtered,
    };
  },

  /**
   * GET /api/children/:id/development
   */
  async getChildDevelopment(childId) {
    try {
      const res = await fetch(`/api/children/${encodeURIComponent(childId)}/development`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const cohort = getLocalCohort();
    const childInfo = cohort.find((c) => c.childId === childId);
    const map = getLocalAssessments();
    const records = map[childId] || [];

    const sortedDesc = [...records].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
    const latest = sortedDesc[0] || null;

    return {
      childId,
      childName: childInfo ? childInfo.fullName : 'Child ' + childId,
      barangay: childInfo ? childInfo.barangay : '',
      dayCareCenter: childInfo ? childInfo.dayCareCenter : '',
      status: latest ? latest.status : (childInfo ? childInfo.status : 'Assessment Pending'),
      latestAssessment: latest,
      history: sortedDesc,
      integrationPlaceholders: {
        checklistBanner: 'OFFICIAL ECCD CHECKLIST INTEGRATION POINT',
        record1Placeholder: '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 1 HERE]',
        record2Placeholder: '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 2 HERE]',
        scoringBanner: 'OFFICIAL SCORING INTEGRATION POINT',
        scoringPlaceholder: '[PLACEHOLDER — CONNECT OFFICIAL SCALED SCORE / STANDARD SCORE REFERENCE HERE]',
      },
    };
  },

  /**
   * POST /api/children/:id/development
   */
  async recordAssessment(childId, payload) {
    try {
      const res = await fetch(`/api/children/${encodeURIComponent(childId)}/development`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        this.recordAssessmentLocal(childId, payload);
        return json.data;
      }
    } catch {
      // Fallback
    }

    return this.recordAssessmentLocal(childId, payload);
  },

  recordAssessmentLocal(childId, payload) {
    const map = getLocalAssessments();
    const list = map[childId] || [];

    const status = payload.status || 'Assessment Completed';
    const cycle = payload.assessmentCycle || 'Cycle 1 (Baseline - SY 2026–2027)';
    const date = payload.assessmentDate || payload.date || new Date().toISOString().slice(0, 10);
    const assessor = payload.assessor || 'CSWDO Assessor';
    const notes = payload.notes || '';

    const newRecord = {
      id: 'DEV-REC-' + Math.floor(100 + Math.random() * 900),
      childId,
      childName: payload.childName || 'Child ' + childId,
      assessmentCycle: cycle,
      assessmentDate: date,
      assessor,
      status,
      notes,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newRecord);
    map[childId] = list;
    saveLocalAssessments(map);

    // Update cohort list
    const cohort = getLocalCohort();
    const idx = cohort.findIndex((c) => c.childId === childId);
    if (idx !== -1) {
      cohort[idx].lastAssessmentDate = date;
      cohort[idx].status = status;
      cohort[idx].cycle = cycle;
      cohort[idx].assessor = assessor;
    } else {
      cohort.unshift({
        childId,
        fullName: payload.childName || 'Child ' + childId,
        sex: payload.sex || 'Male',
        ageDisplay: payload.ageDisplay || '3 yrs',
        barangay: payload.barangay || 'San Isidro',
        dayCareCenter: payload.dayCareCenter || 'Day Care Center',
        lastAssessmentDate: date,
        status,
        cycle,
        assessor,
      });
    }
    saveLocalCohort(cohort);

    // Child 360° Profile Integration
    try {
      const stored = localStorage.getItem('eccd_children_master');
      if (stored) {
        const children = JSON.parse(stored);
        const child = children.find((c) => c.id === childId);
        if (child) {
          if (!child.statusPillars) child.statusPillars = {};
          const variant = status === 'Assessment Completed' ? 'success' : (status === 'Follow-up Required' ? 'warning' : 'neutral');

          child.statusPillars.development = {
            status,
            variant,
            assessmentCycle: cycle,
            assessmentDate: date,
            assessor,
            interpretation: 'Official scoring pending DepEd/ECCD Council integration.',
            flaggedDomains: [],
          };

          if (!child.timeline) child.timeline = [];
          child.timeline.unshift({
            id: 'TL-' + Math.floor(100 + Math.random() * 900),
            type: 'Development Assessment',
            title: `ECCD Assessment Administered (${cycle})`,
            description: `Status: ${status}. Assessor: ${assessor}. Notes: ${notes || 'Assessment session logged.'}`,
            date,
            author: assessor,
            badgeVariant: variant,
          });

          // Queue into Follow-up queue if action is required
          if (status === 'Follow-up Required') {
            const fupId = 'FUP-2026-' + Math.floor(100 + Math.random() * 900);
            child.statusPillars.followUp = {
              status: 'Active Follow-up',
              variant: 'warning',
              activeCaseId: fupId,
              issue: 'Follow-up required from ECCD Development Assessment',
              priority: 'High',
              dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              assignedWorker: assessor,
            };

            child.timeline.unshift({
              id: 'TL-' + Math.floor(100 + Math.random() * 900),
              type: 'Follow-up',
              title: `Follow-up Case Opened (${fupId})`,
              description: `Case queued from developmental assessment: ${notes || 'Action required.'}`,
              date,
              author: assessor,
              badgeVariant: 'warning',
            });
          }

          localStorage.setItem('eccd_children_master', JSON.stringify(children));
        }
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      record: newRecord,
      developmentStatus: status,
    };
  },

  /**
   * GET /api/development/reference
   */
  async getReference() {
    try {
      const res = await fetch('/api/development/reference');
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    return {
      framework: 'Philippine Early Childhood Care and Development (ECCD) Assessment System',
      governance: 'National ECCD Council / Department of Education / CSWDO',
      integrationStatus: 'Pending Official Checklist and Scoring Tables',
      placeholders: {
        checklistPoint: 'OFFICIAL ECCD CHECKLIST INTEGRATION POINT',
        record1: '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 1 HERE]',
        record2: '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 2 HERE]',
        scoringPoint: 'OFFICIAL SCORING INTEGRATION POINT',
        scoringReference: '[PLACEHOLDER — CONNECT OFFICIAL SCALED SCORE / STANDARD SCORE REFERENCE HERE]',
      },
      neutralStatuses: [
        'Assessment Pending',
        'Assessment Completed',
        'Follow-up Required',
      ],
      guidelines: 'Do not invent official checklist questions. Do not invent official scores. Do not invent developmental standards.',
    };
  },
};

export default developmentService;
