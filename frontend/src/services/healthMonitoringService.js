/**
 * ECCD CARE — Health Monitoring API Service
 * CSWDO Monthly Height & Weight Monitoring for Enrolled Day Care Children
 * Note: Measurements only. No medical diagnoses or recommendations.
 */

const STORAGE_KEY = 'eccd_health_records_v2';
const MONITORED_KEY = 'eccd_monitored_children_v2';

const INITIAL_MONITORED = [];

const INITIAL_HISTORY = {};

function getLocalMonitored() {
  localStorage.removeItem('eccd_monitored_children');
  const raw = localStorage.getItem(MONITORED_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(MONITORED_KEY, JSON.stringify(INITIAL_MONITORED));
  return INITIAL_MONITORED;
}

function saveLocalMonitored(list) {
  localStorage.setItem(MONITORED_KEY, JSON.stringify(list));
}

function getLocalHistory() {
  localStorage.removeItem('eccd_health_records');
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
  return INITIAL_HISTORY;
}

function saveLocalHistory(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export const healthMonitoringService = {
  /**
   * GET /api/health-monitoring/due
   */
  async getDueMonitoring(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/health-monitoring/due?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const all = getLocalMonitored();
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
      monitoringDue: all.filter((c) => c.status === 'Due').length,
      completedThisMonth: all.filter(
        (c) => c.lastMeasurementDate && c.lastMeasurementDate.startsWith('2026-09')
      ).length,
      overdue: all.filter((c) => c.status === 'Overdue').length,
      upToDate: all.filter((c) => c.status === 'Up to Date').length,
      totalMonitored: all.length,
    };

    return {
      counts,
      total: filtered.length,
      children: filtered,
    };
  },

  /**
   * GET /api/children/:id/health
   */
  async getChildHealth(childId) {
    try {
      const res = await fetch(`/api/children/${encodeURIComponent(childId)}/health`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const monitored = getLocalMonitored();
    const childInfo = monitored.find((c) => c.childId === childId);
    const historyMap = getLocalHistory();
    const rawList = historyMap[childId] || [];

    // Chronological ascending for trend chart
    const trendData = [...rawList]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: r.date,
        heightCm: Number(r.heightCm),
        weightKg: Number(r.weightKg),
      }));

    // Chronological descending for history table
    const sortedDesc = [...rawList].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sortedDesc.length; i++) {
      const cur = sortedDesc[i];
      const prev = sortedDesc[i + 1];
      if (prev) {
        const hDiff = (cur.heightCm - prev.heightCm).toFixed(1);
        const wDiff = (cur.weightKg - prev.weightKg).toFixed(2);
        cur.deltaHeight = `${hDiff >= 0 ? '+' : ''}${hDiff} cm`;
        cur.deltaWeight = `${wDiff >= 0 ? '+' : ''}${wDiff} kg`;
      } else {
        cur.deltaHeight = 'Baseline';
        cur.deltaWeight = 'Baseline';
      }
    }

    const latest = sortedDesc[0] || null;
    let status = childInfo ? childInfo.status : 'Up to Date';

    return {
      childId,
      childName: childInfo ? childInfo.fullName : 'Child ' + childId,
      barangay: childInfo ? childInfo.barangay : '',
      dayCareCenter: childInfo ? childInfo.dayCareCenter : '',
      monitoringStatus: status,
      latestMeasurement: latest,
      history: sortedDesc,
      trendData,
    };
  },

  /**
   * POST /api/children/:id/health
   */
  async recordChildHealth(childId, payload) {
    try {
      const res = await fetch(`/api/children/${encodeURIComponent(childId)}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        // Also update local storage
        this.recordChildHealthLocal(childId, payload);
        return json.data;
      }
    } catch {
      // Fallback
    }

    return this.recordChildHealthLocal(childId, payload);
  },

  recordChildHealthLocal(childId, payload) {
    const historyMap = getLocalHistory();
    const list = historyMap[childId] || [];

    const newRecord = {
      id: 'HLT-REC-' + Math.floor(100 + Math.random() * 900),
      childId,
      childName: payload.childName || 'Child',
      date: payload.date || new Date().toISOString().slice(0, 10),
      heightCm: Number(payload.height || payload.heightCm || 0),
      weightKg: Number(payload.weight || payload.weightKg || 0),
      recordedBy: payload.recordedBy || 'CSWDO Day Care Worker',
      notes: payload.notes || '',
    };

    list.unshift(newRecord);
    historyMap[childId] = list;
    saveLocalHistory(historyMap);

    // Update monitored list
    const monitored = getLocalMonitored();
    const idx = monitored.findIndex((c) => c.childId === childId);
    if (idx !== -1) {
      monitored[idx].lastMeasurementDate = newRecord.date;
      monitored[idx].lastHeightCm = newRecord.heightCm;
      monitored[idx].lastWeightKg = newRecord.weightKg;
      monitored[idx].status = 'Up to Date';
      monitored[idx].daysSinceLastCheck = 0;
      monitored[idx].dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    } else {
      monitored.unshift({
        childId,
        fullName: payload.childName || 'Child ' + childId,
        sex: payload.sex || 'Male',
        ageDisplay: payload.ageDisplay || '3 yrs',
        barangay: payload.barangay || 'San Isidro',
        dayCareCenter: payload.dayCareCenter || 'Day Care Center',
        lastMeasurementDate: newRecord.date,
        lastHeightCm: newRecord.heightCm,
        lastWeightKg: newRecord.weightKg,
        status: 'Up to Date',
        daysSinceLastCheck: 0,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      });
    }
    saveLocalMonitored(monitored);

    // Child 360 Integration: update child in localStorage if present
    try {
      const storedChildren = localStorage.getItem('eccd_children_master');
      if (storedChildren) {
        const children = JSON.parse(storedChildren);
        const child = children.find((c) => c.id === childId);
        if (child) {
          if (!child.statusPillars) child.statusPillars = {};
          child.statusPillars.health = {
            status: 'Up to date',
            variant: 'success',
            lastWeightKg: newRecord.weightKg,
            lastHeightCm: newRecord.heightCm,
            lastMeasurementDate: newRecord.date,
            nextDue: 'In 30 days',
          };
          if (!child.timeline) child.timeline = [];
          child.timeline.unshift({
            id: 'TL-' + Math.floor(100 + Math.random() * 900),
            type: 'Health Monitoring',
            title: 'Monthly Growth Measurement Recorded',
            description: `Recorded height: ${newRecord.heightCm} cm, weight: ${newRecord.weightKg} kg. Notes: ${newRecord.notes || 'Routine check.'}`,
            date: newRecord.date,
            author: newRecord.recordedBy,
            badgeVariant: 'info',
          });
          localStorage.setItem('eccd_children_master', JSON.stringify(children));
        }
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      record: newRecord,
      monitoringStatus: 'Up to Date',
      nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    };
  },

  /**
   * PUT /api/health-monitoring/:id
   */
  async updateHealthRecord(recordId, payload) {
    try {
      const res = await fetch(`/api/health-monitoring/${encodeURIComponent(recordId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }

    const historyMap = getLocalHistory();
    for (const childId of Object.keys(historyMap)) {
      const record = historyMap[childId].find((r) => r.id === recordId);
      if (record) {
        if (payload.date) record.date = payload.date;
        if (payload.heightCm || payload.height) record.heightCm = Number(payload.heightCm || payload.height);
        if (payload.weightKg || payload.weight) record.weightKg = Number(payload.weightKg || payload.weight);
        if (payload.notes !== undefined) record.notes = payload.notes;
        saveLocalHistory(historyMap);
        return record;
      }
    }
    return null;
  },
};

export default healthMonitoringService;
