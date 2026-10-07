/**
 * ECCD CARE — Audit Log & System Governance Service
 * City Social Welfare & Development Office (CSWDO)
 *
 * Core Concept:
 * - Activity logging for all user actions
 * - Prototype security & role-based governance controls
 * - Do not claim compliance certifications.
 *
 * API Contract:
 * GET  /api/audit-logs
 * POST /api/audit-logs
 * GET  /api/governance/roles
 */

import { getPhilippinesDateTime } from '../utils/phTime.js';
import { getApiUrl } from './apiConfig.js';

const STORAGE_KEY = 'eccd_care_audit_logs_v2';

export const INITIAL_AUDIT_LOGS = [];

export const auditService = {
  /**
   * GET /api/audit-logs
   */
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.module && filters.module !== 'all') params.append('module', filters.module);
    if (filters.search) params.append('search', filters.search);

    try {
      const qs = params.toString();
      const url = getApiUrl('/api/audit-logs' + (qs ? `?${qs}` : ''));
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data.logs;
      }
    } catch {
      // Local fallback
    }

    let logs = [];
    try {
      localStorage.removeItem('eccd_care_audit_logs');
      const stored = localStorage.getItem(STORAGE_KEY);
      logs = stored ? JSON.parse(stored) : [...INITIAL_AUDIT_LOGS];
    } catch {
      logs = [...INITIAL_AUDIT_LOGS];
    }

    if (filters.role && filters.role !== 'all') {
      logs = logs.filter(l => l.role === filters.role);
    }
    if (filters.status && filters.status !== 'all') {
      logs = logs.filter(l => l.status === filters.status);
    }
    if (filters.module && filters.module !== 'all') {
      logs = logs.filter(l => l.module === filters.module);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        l =>
          l.user.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.record && l.record.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return logs;
  },

  /**
   * POST /api/audit-logs
   */
  async logActivity({ user, role, action, module, record, status = 'Successful', details = '' }) {
    const entry = {
      id: 'LOG-2026-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: getPhilippinesDateTime().replace('T', ' ').slice(0, 19),
      user: user || 'Authorized User',
      role: role || 'Staff',
      action,
      module,
      record: record || 'N/A',
      status,
      details,
    };

    try {
      await fetch(getApiUrl('/api/audit-logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // ignore
    }

    // Save locally
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [...INITIAL_AUDIT_LOGS];
      list.unshift(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }

    return entry;
  },
};

export default auditService;
