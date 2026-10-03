/**
 * ECCD CARE — Follow-Up / Early Support API Service
 * CSWDO Case Management & Worker Assignment
 * UX Flow: “Identify → Monitor → Detect Need → Follow Up → Record Action”
 * Strict Rule: Do not diagnose children. Do not invent medical interventions.
 */

const STORAGE_KEY = 'eccd_follow_up_cases_v2';

const INITIAL_CASES = [];

function getLocalCases() {
  localStorage.removeItem('eccd_follow_up_cases');
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CASES));
  return INITIAL_CASES;
}

function saveLocalCases(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const followUpService = {
  /**
   * GET /api/follow-ups
   */
  async getFollowUps(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const all = getLocalCases();
    let filtered = [...all];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(
        (c) => (c.category || c.status).toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.actionType && filters.actionType !== 'all') {
      filtered = filtered.filter((c) => c.actionType === filters.actionType);
    }

    if (filters.barangay && filters.barangay !== 'all') {
      filtered = filtered.filter((c) => c.barangay === filters.barangay);
    }

    if (filters.assignedWorker && filters.assignedWorker !== 'all') {
      filtered = filtered.filter((c) => c.assignedWorker === filters.assignedWorker);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.childName.toLowerCase().includes(q) ||
          c.childId.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.reason.toLowerCase().includes(q) ||
          c.barangay.toLowerCase().includes(q)
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
    try {
      const res = await fetch('/api/follow-ups/needs-attention');
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const all = getLocalCases();
    const cases = all.filter((c) => (c.category || c.status) === 'Needs Attention');
    return {
      total: cases.length,
      cases,
    };
  },

  /**
   * POST /api/follow-ups
   */
  async createFollowUp(payload) {
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        this.createFollowUpLocal(payload);
        return json.data;
      }
    } catch {
      // fallback
    }

    return this.createFollowUpLocal(payload);
  },

  createFollowUpLocal(payload) {
    const list = getLocalCases();
    const fupId = 'FUP-2026-' + Math.floor(100 + Math.random() * 900);
    const newCase = {
      id: fupId,
      childId: payload.childId,
      childName: payload.childName || 'Child ' + payload.childId,
      barangay: payload.barangay || 'San Isidro',
      dayCareCenter: payload.dayCareCenter || 'San Isidro CDC I',
      reason: payload.reason || 'Follow-up on early support need',
      assignedWorker: payload.assignedWorker || 'Maria Santos, CDW I',
      workerContact: payload.workerContact || '0917-555-0100',
      createdDate: payload.createdDate || new Date().toISOString().slice(0, 10),
      dueDate: payload.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      category: payload.category || 'Needs Attention',
      status: payload.category || 'Needs Attention',
      actionType: payload.actionType || 'Follow-up',
      notes: payload.notes || '',
      actionTaken: null,
      resolvedDate: null,
    };

    list.unshift(newCase);
    saveLocalCases(list);

    // Child 360° Profile Integration
    try {
      const stored = localStorage.getItem('eccd_children_master');
      if (stored) {
        const children = JSON.parse(stored);
        const child = children.find((c) => c.id === payload.childId);
        if (child) {
          if (!child.statusPillars) child.statusPillars = {};
          child.statusPillars.followUp = {
            status: 'Active Follow-up',
            variant: newCase.category === 'Needs Attention' ? 'danger' : 'warning',
            activeCaseId: fupId,
            issue: newCase.reason,
            priority: newCase.category === 'Needs Attention' ? 'Urgent' : 'Standard',
            dueDate: newCase.dueDate,
            assignedWorker: newCase.assignedWorker,
          };

          if (!child.timeline) child.timeline = [];
          child.timeline.unshift({
            id: 'TL-' + Math.floor(100 + Math.random() * 900),
            type: 'Follow-up',
            title: `Follow-up Case Opened (${fupId}): ${newCase.actionType}`,
            description: `Assigned to ${newCase.assignedWorker}. Reason: ${newCase.reason}. Due: ${newCase.dueDate}.`,
            date: newCase.createdDate,
            author: newCase.assignedWorker,
            badgeVariant: newCase.category === 'Needs Attention' ? 'danger' : 'warning',
          });

          localStorage.setItem('eccd_children_master', JSON.stringify(children));
        }
      }
    } catch {
      // ignore
    }

    return newCase;
  },

  /**
   * PUT /api/follow-ups/:id
   */
  async updateFollowUp(id, payload) {
    try {
      const res = await fetch(`/api/follow-ups/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const list = getLocalCases();
    const item = list.find((c) => c.id === id);
    if (item) {
      Object.assign(item, payload);
      if (payload.category) item.status = payload.category;
      if (payload.status) item.category = payload.status;
      saveLocalCases(list);
      return item;
    }
    return null;
  },

  /**
   * POST /api/follow-ups/:id/resolve
   */
  async resolveFollowUp(id, payload) {
    try {
      const res = await fetch(`/api/follow-ups/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        this.resolveFollowUpLocal(id, payload);
        return json.data;
      }
    } catch {
      // fallback
    }

    return this.resolveFollowUpLocal(id, payload);
  },

  resolveFollowUpLocal(id, payload) {
    const list = getLocalCases();
    const item = list.find((c) => c.id === id);
    if (!item) return null;

    const resolvedDate = payload.date || payload.resolvedDate || new Date().toISOString().slice(0, 10);
    const actionTaken = payload.actionTaken || 'Action documented and confirmed.';
    const notes = payload.notes || '';
    const status = payload.status || 'Completed';

    item.category = 'Completed';
    item.status = status;
    item.resolvedDate = resolvedDate;
    item.actionTaken = actionTaken;
    if (notes) {
      item.notes = item.notes ? `${item.notes} | Resolution: ${notes}` : notes;
    }

    saveLocalCases(list);

    // Child 360° Profile Integration
    try {
      const stored = localStorage.getItem('eccd_children_master');
      if (stored) {
        const children = JSON.parse(stored);
        const child = children.find((c) => c.id === item.childId);
        if (child) {
          if (!child.statusPillars) child.statusPillars = {};
          child.statusPillars.followUp = {
            status: 'Case Resolved',
            variant: 'success',
            activeCaseId: id,
            issue: `Resolved on ${resolvedDate}: ${actionTaken}`,
            priority: 'Resolved',
            dueDate: 'Completed',
            assignedWorker: item.assignedWorker,
          };

          if (!child.timeline) child.timeline = [];
          child.timeline.unshift({
            id: 'TL-' + Math.floor(100 + Math.random() * 900),
            type: 'Follow-up',
            title: `Follow-up Resolved (${id})`,
            description: `Action taken: ${actionTaken}. Notes: ${notes || 'Resolution confirmed.'}`,
            date: resolvedDate,
            author: item.assignedWorker,
            badgeVariant: 'success',
          });

          localStorage.setItem('eccd_children_master', JSON.stringify(children));
        }
      }
    } catch {
      // ignore
    }

    return item;
  },

  /**
   * GET /api/follow-ups/:id/case-view
   */
  async getCaseView(id) {
    try {
      const res = await fetch(`/api/follow-ups/${encodeURIComponent(id)}/case-view`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const all = getLocalCases();
    const caseItem = all.find((c) => c.id === id);
    if (!caseItem) return null;

    // Build relevant child timeline
    const timeline = [
      {
        type: 'Follow-up',
        title: `Active Case: ${caseItem.id} (${caseItem.actionType})`,
        description: `${caseItem.reason} — Assigned to ${caseItem.assignedWorker}. Due: ${caseItem.dueDate}`,
        date: caseItem.createdDate,
        author: caseItem.assignedWorker,
        badgeVariant: caseItem.category === 'Needs Attention' ? 'danger' : 'warning',
      },
      {
        type: 'Development',
        title: 'Development Assessment Completed (Cycle 1)',
        description: 'Baseline assessment recorded. Early support activity recommended.',
        date: '2026-09-15',
        author: caseItem.assignedWorker,
        badgeVariant: 'primary',
      },
      {
        type: 'Health',
        title: 'Monthly Growth Weighing & Height Check',
        description: 'Growth measurement recorded in monthly health log.',
        date: '2026-08-20',
        author: 'Lourdes David, CDW II',
        badgeVariant: 'info',
      },
      {
        type: 'Enrollment',
        title: 'Enrolled in Day Care Center',
        description: `Admission confirmed for ${caseItem.dayCareCenter}.`,
        date: '2026-06-15',
        author: caseItem.assignedWorker,
        badgeVariant: 'success',
      },
      {
        type: 'Mapping',
        title: 'House-to-House Community Mapping',
        description: `Household identified in Barangay ${caseItem.barangay}. Persistent ECCD ID generated.`,
        date: '2026-05-18',
        author: 'Rodel Mendoza, Field Worker',
        badgeVariant: 'neutral',
      },
    ];

    if (caseItem.resolvedDate && caseItem.actionTaken) {
      timeline.unshift({
        type: 'Follow-up',
        title: `Case Resolved (${caseItem.id})`,
        description: `Action Taken: ${caseItem.actionTaken}`,
        date: caseItem.resolvedDate,
        author: caseItem.assignedWorker,
        badgeVariant: 'success',
      });
    }

    return {
      case: caseItem,
      timeline,
    };
  },
};

export default followUpService;
