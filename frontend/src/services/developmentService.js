/**
 * ECCD CARE — Development Assessment Service
 * CSWDO ECCD Development Checklist Assessment Framework
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDate, addDaysPHT } from '../utils/phTime.js';

export const developmentService = {
  /**
   * GET /api/development/assessments
   */
  async getAssessments(filters = {}) {
    const allChildren = centralDataStore.getChildren() || [];
    const allAssessments = centralDataStore.getDevelopmentAssessments() || [];
    const allFollowUps = centralDataStore.getFollowUps() || [];

    // Derive cohort from centralDataStore
    const cohort = allChildren.map((c) => {
      const childAssessments = allAssessments
        .filter((a) => a.childId === c.id)
        .sort((a, b) => (b.assessmentDate || b.date || '').localeCompare(a.assessmentDate || a.date || ''));

      const latest = childAssessments[0];
      const hasAssessment = !!latest;
      const childFollowUps = allFollowUps.filter((f) => f.childId === c.id && f.status !== 'Completed');

      let status = 'Assessment Pending';
      if (childFollowUps.length > 0 || (latest?.status === 'Follow-up Required')) {
        status = 'Follow-up Required';
      } else if (hasAssessment || c.developmentStatus === 'Completed') {
        status = 'Assessment Completed';
      }

      return {
        childId: c.id,
        fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        firstName: c.firstName,
        lastName: c.lastName,
        sex: c.sex || 'Female',
        ageDisplay: c.ageDisplay || `${c.ageYears || 3} yrs`,
        barangay: c.barangay || 'San Isidro',
        dayCareCenter: c.dayCareCenterName || 'San Isidro Child Development Center I',
        status,
        lastAssessmentDate: latest?.assessmentDate || latest?.date || (hasAssessment ? '2026-09-15' : null),
        scaledScore: latest?.scaledScore || latest?.standardScore || null,
        standardScore: latest?.standardScore || null,
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
      completedAssessments: cohort.filter((c) => c.status === 'Assessment Completed').length,
      pendingAssessments: cohort.filter((c) => c.status === 'Assessment Pending').length,
      followUps: cohort.filter((c) => c.status === 'Follow-up Required').length,
      dueAssessments: cohort.filter((c) => c.status === 'Assessment Pending').length,
      totalCohort: cohort.length,
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
    const child = centralDataStore.getChild360(childId) || centralDataStore.getChildById(childId);
    const allAssessments = centralDataStore.getDevelopmentAssessments() || [];
    const records = allAssessments.filter((a) => a.childId === childId);

    const sortedDesc = [...records].sort((a, b) =>
      (b.assessmentDate || b.date || '').localeCompare(a.assessmentDate || a.date || '')
    );
    const latest = sortedDesc[0] || null;

    return {
      childId,
      childName: child ? (child.fullName || `${child.firstName} ${child.lastName}`) : `Child ${childId}`,
      barangay: child ? child.barangay : '',
      dayCareCenter: child ? (child.dayCareCenterName || 'San Isidro Child Development Center I') : '',
      status: latest ? latest.status : (child?.developmentStatus || 'Assessment Pending'),
      latestAssessment: latest,
      history: sortedDesc,
      integrationPlaceholders: {
        checklistBanner: 'OFFICIAL ECCD CHECKLIST INTEGRATION POINT',
        record1Placeholder: '[CHILD’S RECORD 1 — DOMAIN SCORES]',
        record2Placeholder: '[CHILD’S RECORD 2 — DEVELOPMENT PROFILE]',
        scoringBanner: 'OFFICIAL SCORING (DepEd / ECCD Council Tables)',
        scoringPlaceholder: '[STANDARD SCALED SCORES APPLIED]',
      },
    };
  },

  /**
   * POST /api/children/:id/development
   */
  async recordAssessment(childId, payload) {
    const status = payload.status || 'Assessment Completed';
    const cycle = payload.assessmentCycle || 'Cycle 1 (Baseline - SY 2026–2027)';
    const date = payload.assessmentDate || payload.date || getPhilippinesDate();
    const assessor = payload.assessor || 'CSWDO Assessor';
    const notes = payload.notes || '';

    const newRecord = centralDataStore.recordAssessment({
      childId,
      childName: payload.childName || 'Child ' + childId,
      assessmentCycle: cycle,
      assessmentDate: date,
      assessor,
      status,
      scaledScore: payload.scaledScore || payload.standardScore || 100,
      standardScore: payload.standardScore || payload.scaledScore || 100,
      interpretation: payload.interpretation || (status === 'Follow-up Required' ? 'Developmental Alert' : 'Standard Development'),
      notes,
    });

    // If follow-up required, queue automatically
    if (status === 'Follow-up Required' || (payload.standardScore && payload.standardScore < 79)) {
      centralDataStore.createFollowUp({
        childId,
        childName: payload.childName || 'Child ' + childId,
        title: 'Developmental Follow-up Required',
        reason: notes || 'Flagged for developmental delay or low score on assessment.',
        priority: 'High',
        status: 'Needs Attention',
        sourceModule: 'development',
        assignedWorkerName: assessor,
        scheduledDate: addDaysPHT(14),
      });
    }

    return {
      success: true,
      record: newRecord,
      status,
    };
  },
};

export default developmentService;
