/**
 * ECCD CARE — CSWDO Dashboard API Service Layer
 *
 * Implements Dashboard API Contract:
 *   GET /api/dashboard/summary         → High-level KPIs dynamically computed from centralDataStore
 *   GET /api/dashboard/enrollment      → Detailed enrollment status breakdown
 *   GET /api/dashboard/monitoring      → Health and development assessment monitoring
 *   GET /api/dashboard/barangays       → Children by barangay ranked by priority
 *   GET /api/dashboard/attention       → Prominent operational table for critical cases
 *   GET /api/dashboard/recent-activity → Real-time multi-stream activity audit log
 *
 * Single Source of Truth: centralDataStore.js
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDateTime } from '../utils/phTime.js';
import { getApiUrl } from './apiConfig.js';

export const dashboardService = {
  /**
   * GET /api/dashboard/summary
   */
  async getSummary() {
    try {
      const res = await fetch(getApiUrl('/api/dashboard/summary'), {
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const serverData = json.data || json;
        if (serverData && typeof serverData.totalChildren === 'number' && serverData.totalChildren > 0) {
          return serverData;
        }
      }
    } catch (e) {
      // Offline fallback
    }

    const children = centralDataStore.getChildren() || [];
    const enrollments = centralDataStore.getEnrollments() || [];
    const healthLogs = centralDataStore.getHealthMonitorings() || [];
    const followUps = centralDataStore.getFollowUps() || [];
    const barangays = centralDataStore.getBarangays() || [];

    const total = children.length;
    const enrolled = children.filter((c) => c.enrollmentStatus === 'Enrolled').length;
    const notEnrolled = children.filter((c) => c.enrollmentStatus === 'Not Enrolled' || !c.enrollmentStatus).length;
    const healthDue = healthLogs.filter((h) => (h.status || '').toLowerCase() === 'due' || (h.status || '').toLowerCase() === 'overdue').length
      || children.filter((c) => c.healthStatus === 'Due for Monitoring').length;
    const urgentFollowUps = followUps.filter(
      (f) => (f.priority || '').toLowerCase() === 'urgent' || (f.priority || '').toLowerCase() === 'high' || f.status === 'Open' || f.status === 'Needs Attention'
    ).length;

    return {
      totalChildren: total,
      mappedChildren: total,
      mappedPercentage: total > 0 ? 100 : 0,
      enrolledChildren: enrolled,
      enrolledPercentage: total > 0 ? Math.round((enrolled / total) * 100) : 0,
      notEnrolledChildren: notEnrolled,
      notEnrolledPercentage: total > 0 ? Math.round((notEnrolled / total) * 100) : 0,
      pendingChildren: 0,
      pendingPercentage: 0,
      healthMonitoringDue: healthDue,
      developmentFollowups: urgentFollowUps,
      totalBarangays: barangays.length || 35,
      barangaysNeedingAttention: 0,
      reportingSchoolYear: 'SY 2026–2027',
      cityMunicipality: 'City of San Fernando, Pampanga',
      lastUpdated: getPhilippinesDateTime(),
      coreAnswers: {
        identifiedChildren: `${total} children aged 0–4 documented in system`,
        enrolledChildren: `${enrolled} enrolled in CDCs and SNP programs (${total > 0 ? Math.round((enrolled / total) * 100) : 0}%)`,
        notEnrolledChildren: `${notEnrolled} not enrolled`,
        needsHealthMonitoring: `${healthDue} children due/overdue for growth monitoring`,
        needsDevFollowup: `${urgentFollowUps} children flagged for developmental domain delays`,
        barangaysNeedingAttention: 'All barangays up to date',
      },
    };
  },

  /**
   * GET /api/dashboard/enrollment
   */
  async getEnrollment() {
    const children = centralDataStore.getChildren() || [];
    const total = children.length;
    const enrolled = children.filter((c) => c.enrollmentStatus === 'Enrolled').length;
    const notEnrolled = children.filter((c) => c.enrollmentStatus === 'Not Enrolled' || !c.enrollmentStatus).length;
    const pending = total - enrolled - notEnrolled;

    return {
      total,
      breakdown: [
        {
          key: 'enrolled',
          label: 'Enrolled in CDC / SNP',
          count: enrolled,
          percentage: total > 0 ? Math.round((enrolled / total) * 100) : 0,
          statusColor: 'var(--color-success-primary)',
          badgeVariant: 'success',
          subcategories: [
            { label: 'Child Development Center (CDC)', count: enrolled, percentage: total > 0 ? Math.round((enrolled / total) * 100) : 0 },
            { label: 'Supervised Neighborhood Play (SNP)', count: 0, percentage: 0 },
          ],
        },
        {
          key: 'not_enrolled',
          label: 'Not Enrolled',
          count: notEnrolled,
          percentage: total > 0 ? Math.round((notEnrolled / total) * 100) : 0,
          statusColor: 'var(--color-danger-primary)',
          badgeVariant: 'danger',
          subcategories: [
            { label: 'Age 3–4 Priority Target for CDC', count: children.filter((c) => (c.enrollmentStatus === 'Not Enrolled' || !c.enrollmentStatus) && c.ageYears >= 3).length, percentage: 0 },
            { label: 'Age 0–2 Home Care / Unserved', count: children.filter((c) => (c.enrollmentStatus === 'Not Enrolled' || !c.enrollmentStatus) && c.ageYears < 3).length, percentage: 0 },
          ],
        },
        {
          key: 'pending',
          label: 'Pending / Unknown',
          count: Math.max(0, pending),
          percentage: total > 0 ? Math.round((Math.max(0, pending) / total) * 100) : 0,
          statusColor: 'var(--color-warning-primary)',
          badgeVariant: 'warning',
          subcategories: [
            { label: 'Recently Relocated / Transient', count: 0, percentage: 0 },
            { label: 'Pending Barangay Worker Verification', count: 0, percentage: 0 },
          ],
        },
      ],
      targetCohortComparison: {
        targetAnnualEnrollment: 2800,
        targetMetPercentage: total > 0 ? Math.round((enrolled / 2800) * 100) : 0,
        availableCenterSlots: 2650,
        occupancyRate: total > 0 ? Math.round((enrolled / 2650) * 100) : 0,
      },
    };
  },

  /**
   * GET /api/dashboard/monitoring
   */
  async getMonitoring() {
    const children = centralDataStore.getChildren() || [];
    const healthLogs = centralDataStore.getHealthMonitorings() || [];
    const devAssessments = centralDataStore.getDevelopmentAssessments() || [];
    const followUps = centralDataStore.getFollowUps() || [];
    const total = children.length;
    const completedAssessments = devAssessments.filter((a) => a.status === 'Completed').length;
    const normalHealth = healthLogs.filter((h) => (h.nutritionalStatus || '').includes('Normal')).length
      || children.filter((c) => c.healthStatus === 'Up to Date').length;
    const dueHealth = total - normalHealth;

    return {
      health: {
        total,
        upToDate: {
          label: 'Up to date',
          count: normalHealth,
          percentage: total > 0 ? Math.round((normalHealth / total) * 100) : 0,
          variant: 'success',
          description: 'Normal growth & complete records',
        },
        due: {
          label: 'Due this month',
          count: Math.max(0, dueHealth),
          percentage: total > 0 ? Math.round((Math.max(0, dueHealth) / total) * 100) : 0,
          variant: 'warning',
          description: 'Scheduled for routine weigh-in',
        },
        overdue: {
          label: 'Overdue (>30 days)',
          count: 0,
          percentage: 0,
          variant: 'danger',
          description: 'Pending nutritional check',
        },
      },
      development: {
        total,
        completed: {
          label: 'Completed',
          count: completedAssessments,
          percentage: total > 0 ? Math.round((completedAssessments / total) * 100) : 0,
          variant: 'success',
          description: 'Standard checklist administered',
        },
        pending: {
          label: 'Pending Evaluation',
          count: Math.max(0, total - completedAssessments),
          percentage: total > 0 ? Math.round(((total - completedAssessments) / total) * 100) : 0,
          variant: 'neutral',
          description: 'Scheduled for baseline checklist',
        },
        followUp: {
          label: 'Follow-up Needed',
          count: followUps.length,
          percentage: total > 0 ? Math.round((followUps.length / total) * 100) : 0,
          variant: 'danger',
          description: 'Flagged for developmental action',
        },
      },
      criticalAlerts: [],
    };
  },

  /**
   * GET /api/dashboard/barangays
   */
  async getBarangays() {
    const barangays = centralDataStore.getBarangays() || [];
    const children = centralDataStore.getChildren() || [];

    const items = barangays.map((b, idx) => {
      const bChildren = children.filter((c) => c.barangay === b.name || c.barangayId === b.id);
      const enrolled = bChildren.filter((c) => c.enrollmentStatus === 'Enrolled').length;
      return {
        rank: idx + 1,
        name: b.name,
        totalChildren: bChildren.length,
        enrolled,
        enrolledPercent: bChildren.length > 0 ? Math.round((enrolled / bChildren.length) * 100) : 0,
        notEnrolled: bChildren.length - enrolled,
        healthDue: 0,
        devFollowup: 0,
        riskLevel: bChildren.length > 0 ? 'Active Monitoring' : 'Ready for Survey',
        priorityVariant: bChildren.length > 0 ? 'success' : 'neutral',
        assignedWorker: 'CDW Assigned',
        daycareCenters: b.dayCareCentersCount || 1,
        primaryIssue: bChildren.length > 0 ? 'Ongoing child monitoring' : 'Awaiting household mapping',
      };
    });

    return {
      total: barangays.length,
      reportingYear: 'SY 2026–2027',
      barangays: items,
    };
  },

  /**
   * GET /api/dashboard/attention
   */
  async getAttention() {
    const followUps = centralDataStore.getFollowUps() || [];
    const urgentCount = followUps.filter((f) => f.priority === 'High' || f.priority === 'Urgent').length;

    const items = followUps.map((f) => {
      const child = f.childId ? centralDataStore.getChildById(f.childId) : null;
      return {
        id: f.id,
        childName: f.childName || child?.fullName || 'Child Record',
        age: f.age && f.age !== '—' ? f.age : (child?.ageDisplay || ''),
        sex: f.sex && f.sex !== '—' ? f.sex : (child?.sex || ''),
        barangay: f.barangay || child?.barangay || 'San Isidro',
        purok: f.purok || child?.purok || '',
        issue: f.reason || f.title || f.issue,
        issueCategory: f.sourceModule?.toLowerCase() || 'development',
        assignedWorker: f.assignedWorkerName || f.assignedWorker || child?.assignedWorker || 'CDW',
        workerContact: child?.workerContact || '',
        dueDate: f.scheduledDate || f.dueDate || 'Pending',
        status: f.status,
        priority: f.priority,
        guardianName: f.guardianName || child?.parentGuardian || '',
        center: f.center || f.dayCareCenter || child?.dayCareCenter || '',
        actionRequired: f.actionPlan || f.plan || '',
      };
    });

    return {
      totalNeedingAttention: items.length,
      highPriorityCount: urgentCount,
      items,
    };
  },

  /**
   * GET /api/dashboard/recent-activity
   */
  async getRecentActivity() {
    const logs = centralDataStore.getAuditLogs() || [];
    if (logs.length > 0) {
      return {
        activities: logs.slice(0, 10).map((l) => ({
          id: l.id,
          type: (l.action || '').toLowerCase().includes('enroll') ? 'enrollment' : (l.action || '').toLowerCase().includes('health') ? 'health' : 'mapping',
          title: l.action || 'Activity Recorded',
          description: l.details || '',
          worker: l.userName || 'System User',
          barangay: l.barangay || 'City of San Fernando',
          timestamp: l.timestamp || 'Recent',
          tag: (l.action || '').toLowerCase().includes('enroll') ? 'Enrollment' : 'System',
          tagVariant: (l.action || '').toLowerCase().includes('enroll') ? 'success' : 'primary',
        })),
      };
    }

    return { activities: [] };
  },

  /**
   * Interactive update for attention items status
   */
  async updateAttentionItemStatus(id, newStatus) {
    const followUps = centralDataStore.getFollowUps() || [];
    const item = followUps.find((f) => f.id === id);
    if (item) {
      item.status = newStatus;
      item.category = newStatus;
      centralDataStore.save();

      const child = item.childId ? centralDataStore.getChildById(item.childId) : null;
      const formattedItem = {
        id: item.id,
        childName: item.childName || child?.fullName || 'Child Record',
        age: item.age && item.age !== '—' ? item.age : (child?.ageDisplay || ''),
        sex: item.sex && item.sex !== '—' ? item.sex : (child?.sex || ''),
        barangay: item.barangay || child?.barangay || 'San Isidro',
        purok: item.purok || child?.purok || '',
        issue: item.reason || item.title || item.issue || 'Operational monitoring required',
        issueCategory: (item.sourceModule || item.issueCategory || item.category || 'development').toLowerCase(),
        assignedWorker: item.assignedWorkerName || item.assignedWorker || child?.assignedWorker || 'CDW Assigned',
        workerContact: item.workerContact || child?.workerContact || '',
        dueDate: item.scheduledDate || item.dueDate || 'Pending',
        status: item.status,
        priority: item.priority || 'Normal',
        guardianName: item.guardianName || child?.parentGuardian || '',
        center: item.center || item.dayCareCenter || child?.dayCareCenter || '',
        actionRequired: item.actionPlan || item.plan || item.actionRequired || '',
      };

      return { ok: true, item: formattedItem };
    }
    return { ok: false, error: 'Item not found' };
  },

  /**
   * Append new quick action to activities
   */
  async recordQuickAction(actionName, details) {
    const newLog = centralDataStore.logAudit({
      action: actionName,
      details: details.notes || 'Action logged to dashboard feed.',
      userName: details.worker || 'System User',
      barangay: details.barangay || 'San Isidro',
    });

    const newAct = {
      id: newLog.id,
      type: details.type || 'mapping',
      title: actionName,
      description: details.notes || 'Action logged to dashboard feed.',
      worker: details.worker || 'System User',
      barangay: details.barangay || 'San Isidro',
      timestamp: 'Just now',
      childId: details.childId || details.id || 'ECCD-RECORD',
      tag: details.type === 'enrollment' ? 'Enrollment' : details.type === 'health' ? 'Health' : 'Mapping',
      tagVariant: details.type === 'enrollment' ? 'success' : details.type === 'health' ? 'info' : 'primary',
    };
    return { ok: true, activity: newAct };
  },
};

export default dashboardService;
