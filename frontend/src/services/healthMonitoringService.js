/**
 * ECCD CARE — Health Monitoring API Service
 * CSWDO Monthly Height & Weight Monitoring for Enrolled Day Care Children
 * Note: Measurements only. No medical diagnoses or recommendations.
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';

export const healthMonitoringService = {
  /**
   * GET /api/health-monitoring/due
   */
  async getDueMonitoring(filters = {}) {
    const allChildren = centralDataStore.getChildren() || [];
    const allRecords = centralDataStore.getHealthMonitorings() || [];

    // Derive monitored cohort from all registered/enrolled children
    const cohort = allChildren.map((c) => {
      const childRecords = allRecords
        .filter((r) => r.childId === c.id)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const latest = childRecords[0];
      const hasRecord = !!latest;
      const status = hasRecord ? 'Up to Date' : (c.healthStatus === 'Up to Date' ? 'Up to Date' : 'Due');

      return {
        childId: c.id,
        fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        sex: c.sex || 'Female',
        ageDisplay: c.ageDisplay || `${c.ageYears || 3} yrs`,
        barangay: c.barangay || 'San Isidro',
        dayCareCenter: c.dayCareCenterName || 'San Isidro Child Development Center I',
        lastMeasurementDate: latest?.date || (hasRecord ? '2026-09-15' : null),
        lastHeightCm: latest?.heightCm || latest?.height || (c.statusPillars?.health?.lastHeightCm) || null,
        lastWeightKg: latest?.weightKg || latest?.weight || (c.statusPillars?.health?.lastWeightKg) || null,
        status,
        daysSinceLastCheck: hasRecord ? 14 : 45,
        dueDate: hasRecord
          ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      };
    });

    let filtered = [...cohort];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(
        (c) => (c.status || '').toLowerCase() === filters.status.toLowerCase()
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
      monitoringDue: cohort.filter((c) => c.status === 'Due').length,
      completedThisMonth: cohort.filter(
        (c) => c.lastMeasurementDate && c.lastMeasurementDate.startsWith('2026-')
      ).length,
      overdue: cohort.filter((c) => c.status === 'Overdue').length,
      upToDate: cohort.filter((c) => c.status === 'Up to Date').length,
      totalMonitored: cohort.length,
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
    const child = centralDataStore.getChild360(childId) || centralDataStore.getChildById(childId);
    const allRecords = centralDataStore.getHealthMonitorings() || [];
    const rawList = allRecords.filter((r) => r.childId === childId);

    // Chronological ascending for trend chart
    const trendData = [...rawList]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((r) => ({
        date: r.date,
        heightCm: Number(r.heightCm || r.height || 0),
        weightKg: Number(r.weightKg || r.weight || 0),
      }));

    // Chronological descending for history table
    const sortedDesc = [...rawList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    for (let i = 0; i < sortedDesc.length; i++) {
      const cur = sortedDesc[i];
      const prev = sortedDesc[i + 1];
      const curH = Number(cur.heightCm || cur.height || 0);
      const curW = Number(cur.weightKg || cur.weight || 0);
      if (prev) {
        const prevH = Number(prev.heightCm || prev.height || 0);
        const prevW = Number(prev.weightKg || prev.weight || 0);
        const hDiff = (curH - prevH).toFixed(1);
        const wDiff = (curW - prevW).toFixed(2);
        cur.deltaHeight = `${hDiff >= 0 ? '+' : ''}${hDiff} cm`;
        cur.deltaWeight = `${wDiff >= 0 ? '+' : ''}${wDiff} kg`;
      } else {
        cur.deltaHeight = 'Baseline';
        cur.deltaWeight = 'Baseline';
      }
    }

    const latest = sortedDesc[0] || null;
    const status = latest ? 'Up to Date' : (child?.healthStatus || 'Due for Monitoring');

    return {
      childId,
      childName: child ? (child.fullName || `${child.firstName} ${child.lastName}`) : `Child ${childId}`,
      barangay: child ? child.barangay : '',
      dayCareCenter: child ? (child.dayCareCenterName || 'San Isidro Child Development Center I') : '',
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
    const height = Number(payload.height || payload.heightCm || 0);
    const weight = Number(payload.weight || payload.weightKg || 0);

    const newRecord = centralDataStore.recordHealth({
      childId,
      childName: payload.childName || 'Child',
      date: payload.date || new Date().toISOString().slice(0, 10),
      heightCm: height,
      weightKg: weight,
      nutritionalStatus: payload.nutritionalStatus || 'Normal Weight for Age',
      recordedBy: payload.recordedBy || 'CSWDO Day Care Worker',
      notes: payload.notes || '',
    });

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
    const list = centralDataStore.getHealthMonitorings() || [];
    const record = list.find((r) => r.id === recordId);
    if (record) {
      if (payload.date) record.date = payload.date;
      if (payload.heightCm || payload.height) record.heightCm = Number(payload.heightCm || payload.height);
      if (payload.weightKg || payload.weight) record.weightKg = Number(payload.weightKg || payload.weight);
      if (payload.notes !== undefined) record.notes = payload.notes;
      centralDataStore.save();
      return record;
    }
    return null;
  },
};

export default healthMonitoringService;
