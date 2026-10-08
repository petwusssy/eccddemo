import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  MapPin,
  School,
  UserX,
  HeartPulse,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Phone,
  Eye,
  Calendar,
  AlertCircle,
  Sparkles,
  ClipboardList,
  Baby,
  Stethoscope,
  Activity,
  Layers,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { dashboardService } from '../../services/dashboardService';
import { centralDataStore } from '../../services/centralDataStore';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';
import { formatPHTDate } from '../../utils/phTime';

export function DashboardOverview({ onNavigate }) {
  const { addToast } = useToast();

  // Loading & Data States (api-and-interface-design + react-patterns)
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalChildren: 0,
    mappedChildren: 0,
    mappedPercentage: 0,
    enrolledChildren: 0,
    enrolledPercentage: 0,
    notEnrolledChildren: 0,
    notEnrolledPercentage: 0,
    pendingChildren: 0,
    healthMonitoringDue: 0,
    developmentFollowups: 0,
  });
  const [enrollment, setEnrollment] = useState({
    total: 0,
    breakdown: [
      { key: 'enrolled', count: 0, percentage: 0, subcategories: [{ count: 0 }, { count: 0 }] },
      { key: 'not_enrolled', count: 0, percentage: 0, subcategories: [{ count: 0 }, { count: 0 }] },
      { key: 'pending', count: 0, percentage: 0, subcategories: [{ count: 0 }, { count: 0 }] },
    ],
    targetCohortComparison: { targetAnnualEnrollment: 0, targetMetPercentage: 0 },
  });
  const [monitoring, setMonitoring] = useState({
    health: { upToDate: { count: 0, percentage: 0 }, due: { count: 0, percentage: 0 }, overdue: { count: 0, percentage: 0 } },
    development: { completed: { count: 0, percentage: 0 }, pending: { count: 0, percentage: 0 }, followUp: { count: 0, percentage: 0 } },
    criticalAlerts: [],
  });
  const [barangays, setBarangays] = useState({ rankedBarangays: [], barangays: [], totalBarangays: 35 });
  const [attentionData, setAttentionData] = useState({ items: [], highPriorityCount: 0 });
  const [activityData, setActivityData] = useState({ activities: [] });

  // Filters & Interactivity States
  const [attentionFilter, setAttentionFilter] = useState('all'); // all | development | health | enrollment | urgent
  const [attentionSearch, setAttentionSearch] = useState('');
  const [barangaySearch, setBarangaySearch] = useState('');
  const [barangayRiskFilter, setBarangayRiskFilter] = useState('');

  // Selected Attention Case Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Quick Action Modals
  const [activeQuickAction, setActiveQuickAction] = useState(null); // 'mapping' | 'register' | 'enroll' | 'health' | 'assessment'
  const [quickActionForm, setQuickActionForm] = useState({
    childName: '',
    childId: '',
    barangay: 'San Isidro',
    guardianName: '',
    notes: '',
  });

  // Fetch initial dashboard contract data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sum, enr, mon, bar, att, act] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getEnrollment(),
        dashboardService.getMonitoring(),
        dashboardService.getBarangays(),
        dashboardService.getAttention(),
        dashboardService.getRecentActivity(),
      ]);

      if (sum) setSummary(sum);
      if (enr) setEnrollment(enr);
      if (mon) setMonitoring(mon);
      if (bar) setBarangays(bar);
      if (att) setAttentionData(att);
      if (act) setActivityData(act);
    } catch (err) {
      console.error('Error fetching dashboard endpoints:', err);
      addToast('Error synchronizing dashboard datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Hydrate store from backend in background once on mount
    centralDataStore.syncWithBackend().catch(() => {});

    const handleStoreUpdate = () => loadDashboardData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    window.addEventListener('eccd:offline-sync-completed', handleStoreUpdate);
    window.addEventListener('focus', handleStoreUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
      window.removeEventListener('eccd:offline-sync-completed', handleStoreUpdate);
      window.removeEventListener('focus', handleStoreUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filtered Attention Cases
  const filteredAttentionItems = useMemo(() => {
    if (!attentionData?.items || !Array.isArray(attentionData.items)) return [];
    return attentionData.items.filter((item) => {
      if (!item) return false;
      const childName = String(item.childName || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      const barangay = String(item.barangay || '').toLowerCase();
      const issue = String(item.issue || item.reason || '').toLowerCase();
      const query = String(attentionSearch || '').toLowerCase();

      const matchesSearch =
        childName.includes(query) ||
        id.includes(query) ||
        barangay.includes(query) ||
        issue.includes(query);

      let matchesFilter = true;
      if (attentionFilter === 'urgent') {
        matchesFilter = item.priority === 'Urgent';
      } else if (attentionFilter !== 'all') {
        matchesFilter = item.issueCategory === attentionFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [attentionData, attentionSearch, attentionFilter]);

  // Filtered Barangays
  const filteredBarangays = useMemo(() => {
    const list = barangays?.rankedBarangays || barangays?.barangays || [];
    if (!Array.isArray(list)) return [];
    return list.filter((b) => {
      if (!b) return false;
      const bName = String(b.name || '');
      const matchesSearch = bName.toLowerCase().includes(String(barangaySearch || '').toLowerCase());
      const matchesRisk = !barangayRiskFilter || b.riskLevel === barangayRiskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [barangays, barangaySearch, barangayRiskFilter]);

  // Handle Attention Case Status Update
  const handleUpdateCaseStatus = async (newStatus) => {
    if (!selectedCase) return;
    setUpdatingStatus(true);
    try {
      const res = await dashboardService.updateAttentionItemStatus(selectedCase.id, newStatus);
      if (res.ok) {
        // Refresh local list
        const updated = await dashboardService.getAttention();
        setAttentionData(updated);

        // Also record in activity stream
        await dashboardService.recordQuickAction('Case Status Updated', {
          description: `Action on ${selectedCase.childName || 'Child'} (${selectedCase.id}) marked as "${newStatus}"`,
          type: 'assessment',
          barangay: selectedCase.barangay || 'San Isidro',
          childId: selectedCase.id,
          worker: 'CSWDO Administrator',
          tag: 'Status Update',
          tagVariant: 'info',
        });
        const updatedActs = await dashboardService.getRecentActivity();
        setActivityData(updatedActs);

        addToast(`Case ${selectedCase.id} updated to ${newStatus}`, 'success');
        setIsCaseModalOpen(false);
        setSelectedCase(null);
      } else {
        addToast(res.error || 'Failed to update case status', 'error');
      }
    } catch (error) {
      addToast('Failed to update case status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Quick Action Submission
  const handleQuickActionSubmit = async (e) => {
    e.preventDefault();
    const actionTitles = {
      mapping: 'New Community Mapping Activity Logged',
      register: 'Child Registered in ECCD Database',
      enroll: 'Child Enrolled in Child Development Center',
      health: 'Child Health Monitoring Record Logged',
      assessment: 'ECCD Developmental Assessment Started',
    };

    const actionTitle = actionTitles[activeQuickAction] || 'Action Completed';
    await dashboardService.recordQuickAction(actionTitle, {
      description: `${quickActionForm.childName || 'Child'} (${quickActionForm.barangay}) — ${quickActionForm.notes || 'Recorded by CSWDO Supervisor'}`,
      type: activeQuickAction,
      barangay: quickActionForm.barangay,
      childId: quickActionForm.childId || `ECCD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      worker: 'CSWDO Administrator',
      tag: (activeQuickAction || 'Action').toUpperCase(),
      tagVariant: 'primary',
    });

    const updatedActs = await dashboardService.getRecentActivity();
    setActivityData(updatedActs);

    addToast(`Successfully submitted: ${actionTitle}`, 'success');
    setActiveQuickAction(null);
    setQuickActionForm({
      childName: '',
      childId: '',
      barangay: 'San Isidro',
      guardianName: '',
      notes: '',
    });
  };

  // Helper for priority badges
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="danger" dot={true}>Urgent Action</Badge>;
      case 'High':
        return <Badge variant="warning" dot={true}>High Priority</Badge>;
      default:
        return <Badge variant="neutral">Medium Priority</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'In Progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'Overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'Resolved':
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="dashboard-page" style={{ paddingBottom: 'var(--space-8)' }}>
      {/* =========================================================================
          TOP KPI CARDS (BENTO GRID METRICS)
          ========================================================================= */}
      <section className="dash-kpis-grid" aria-label="Key Metrics Bento Grid">
        {/* Total Children */}
        <div className="kpi-card card-primary" onClick={() => onNavigate('children')} style={{ cursor: 'pointer' }} title="View Children Master Registry">
          <div className="kpi-top">
            <span className="kpi-title">Total Cohort</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary?.totalChildren !== undefined ? summary.totalChildren.toLocaleString() : '0'}</div>
          <div className="kpi-subtext">
            <Badge variant="primary" size="sm">0–4 Cohort</Badge>
          </div>
        </div>

        {/* Mapped */}
        <div className="kpi-card card-info" onClick={() => onNavigate('community-mapping')} style={{ cursor: 'pointer' }} title="View Community Mapping Module">
          <div className="kpi-top">
            <span className="kpi-title">Mapped</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-700)' }}>
              <MapPin size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary?.mappedChildren !== undefined ? summary.mappedChildren.toLocaleString() : '0'}</div>
          <div className="kpi-subtext">
            <Badge variant="info" size="sm">{summary?.mappedPercentage ?? 0}% Mapped</Badge>
          </div>
        </div>

        {/* Enrolled */}
        <div className="kpi-card card-success" onClick={() => onNavigate('enrollment')} style={{ cursor: 'pointer' }} title="View Enrollment Tracking Directory">
          <div className="kpi-top">
            <span className="kpi-title">Enrolled</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)' }}>
              <School size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-success-primary)' }}>
            {summary?.enrolledChildren !== undefined ? summary.enrolledChildren.toLocaleString() : '0'}
          </div>
          <div className="kpi-subtext">
            <Badge variant="success" size="sm">{summary?.enrolledPercentage ?? 0}% Enrolled</Badge>
          </div>
        </div>

        {/* Not Enrolled */}
        <div className="kpi-card card-danger" onClick={() => onNavigate('enrollment')} style={{ cursor: 'pointer' }} title="View Mapped but Not Enrolled Operational View">
          <div className="kpi-top">
            <span className="kpi-title">Not Enrolled</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-primary)' }}>
              <UserX size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-danger-primary)' }}>
            {summary?.notEnrolledChildren !== undefined ? summary.notEnrolledChildren.toLocaleString() : '0'}
          </div>
          <div className="kpi-subtext">
            <Badge variant="danger" size="sm">{summary?.notEnrolledPercentage ?? 0}% Target</Badge>
          </div>
        </div>

        {/* Health Monitoring Due */}
        <div className="kpi-card card-warning" onClick={() => onNavigate('health-monitoring')} style={{ cursor: 'pointer' }} title="View Health Monitoring Due List">
          <div className="kpi-top">
            <span className="kpi-title">Health Due</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-primary)' }}>
              <HeartPulse size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-warning-primary)' }}>
            {summary?.healthMonitoringDue ?? 0}
          </div>
          <div className="kpi-subtext">
            <Badge variant="warning" size="sm">OPT Plus Due</Badge>
          </div>
        </div>

        {/* Development Follow-ups */}
        <div className="kpi-card card-danger" onClick={() => onNavigate('follow-ups')} style={{ cursor: 'pointer' }} title="View Follow-Up & Early Support Queue">
          <div className="kpi-top">
            <span className="kpi-title">Dev Follow-ups</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
              <Brain size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>
            {summary?.developmentFollowups ?? 0}
          </div>
          <div className="kpi-subtext">
            <Badge variant="danger" size="sm">Active Alerts</Badge>
          </div>
        </div>
      </section>

      {/* =========================================================================
          F. QUICK ACTIONS STRIP
          ========================================================================= */}
      <section className="dash-quick-actions-bar" aria-label="Operational Quick Actions">
        <span className="quick-actions-label">
          <Activity size={16} />
          Quick Actions:
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('mapping')}
        >
          <Plus size={16} />
          New Mapping Activity
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('register')}
        >
          <Plus size={16} />
          Register Child
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('enroll')}
        >
          <Plus size={16} />
          Enroll Child
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('health')}
        >
          <Plus size={16} />
          Record Health Monitoring
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('assessment')}
        >
          <Plus size={16} />
          Start Development Assessment
        </Button>
      </section>

      {/* =========================================================================
          SECTION D: ACTIVE INTERVENTION CASES
          ========================================================================= */}
      <section className="attention-card" aria-label="Active Intervention Cases">
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 0, fontWeight: 700 }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-danger-primary)' }} />
                Needs Attention: Active Intervention Cases
              </h2>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${attentionFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAttentionFilter('all')}
              >
                All Cases ({attentionData?.items?.length || 0})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${attentionFilter === 'urgent' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setAttentionFilter('urgent')}
              >
                Urgent
              </button>
              <button
                type="button"
                className={`btn btn-sm ${attentionFilter === 'development' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAttentionFilter('development')}
              >
                Dev Follow-up
              </button>
              <button
                type="button"
                className={`btn btn-sm ${attentionFilter === 'health' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAttentionFilter('health')}
              >
                Health Overdue
              </button>
              <button
                type="button"
                className={`btn btn-sm ${attentionFilter === 'enrollment' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAttentionFilter('enrollment')}
              >
                Unenrolled
              </button>
            </div>
          </div>

          {/* Search Bar for Attention Table */}
          <div style={{ marginTop: 'var(--space-3)', maxWidth: '400px' }}>
            <Input
              placeholder="Search case by child name, ID, or barangay..."
              value={attentionSearch}
              onChange={(e) => setAttentionSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              className="input-sm"
            />
          </div>
        </div>

        {/* Operational Table */}
        <div className="table-container mobile-table-to-cards" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table attention-table">
            <TableHead>
              <TableRow>
                <TableHeader className="attention-col-child">Child</TableHeader>
                <TableHeader className="attention-col-id">Child ID</TableHeader>
                <TableHeader className="attention-col-brgy">Barangay</TableHeader>
                <TableHeader className="attention-col-issue">Issue &amp; Diagnosis</TableHeader>
                <TableHeader className="attention-col-worker">Assigned Worker</TableHeader>
                <TableHeader className="attention-col-due">Due Date</TableHeader>
                <TableHeader className="attention-col-status">Status</TableHeader>
                <TableHeader className="attention-col-action">Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttentionItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    No matching cases found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttentionItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.priority === 'Urgent' ? 'attention-row-urgent' : ''}
                  >
                    {/* Child Name & Details */}
                    <TableCell className="attention-col-child">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-primary-100)',
                          color: 'var(--color-primary-900)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: 'var(--font-size-xs)',
                          flexShrink: 0
                        }}>
                          {String(item?.childName || 'Child').trim().split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('') || 'C'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {item.childName}
                          </div>
                          {[item.age, item.sex].filter(Boolean).filter((v) => v !== '—').length > 0 && (
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {[item.age, item.sex].filter(Boolean).filter((v) => v !== '—').join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Child ID */}
                    <TableCell className="attention-col-id">
                      <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-neutral-100)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        {item.id}
                      </code>
                    </TableCell>

                    {/* Barangay */}
                    <TableCell className="attention-col-brgy">
                      <span style={{ fontWeight: 'var(--font-weight-medium)', whiteSpace: 'nowrap' }}>{item.barangay}</span>
                      {item.purok && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.purok}</div>}
                    </TableCell>

                    {/* Issue */}
                    <TableCell className="attention-col-issue">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                        {item.priority === 'Urgent' && (
                          <AlertCircle size={15} style={{ color: 'var(--color-danger-primary)', flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {item.issue}
                        </span>
                      </div>
                    </TableCell>

                    {/* Assigned Worker */}
                    <TableCell className="attention-col-worker">
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {item.assignedWorker}
                      </div>
                      {item.workerContact && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {item.workerContact}
                        </div>
                      )}
                    </TableCell>

                    {/* Due Date */}
                    <TableCell className="attention-col-due">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>
                        <Calendar size={13} style={{ color: item.status === 'Overdue' ? 'var(--color-danger-primary)' : 'var(--text-muted)' }} />
                        <span style={{ fontWeight: item.status === 'Overdue' ? 'bold' : 'normal', color: item.status === 'Overdue' ? 'var(--color-danger-primary)' : 'var(--text-secondary)' }}>
                          {item.dueDate}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="attention-col-status">
                      {getStatusBadge(item.status)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="attention-col-action">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedCase(item);
                          setIsCaseModalOpen(true);
                        }}
                      >
                        <Eye size={15} />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          TWO-COLUMN SECTION:
          A. ENROLLMENT OVERVIEW  &  C. MONITORING STATUS
          ========================================================================= */}
      <div className="dash-two-col">
        {/* A. ENROLLMENT OVERVIEW */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <CardTitle>
                  A. Enrollment Overview
                </CardTitle>
              </div>
              <Badge variant="primary" size="sm">
                Target: {enrollment?.targetCohortComparison?.targetAnnualEnrollment ?? 0} children
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            {/* Visual Segmented Progress Bar */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>Total Identified: <strong style={{ color: 'var(--text-primary)' }}>{(summary?.totalChildren ?? 0).toLocaleString()} children</strong></span>
                <span>Annual CSWDO Target: <strong style={{ color: 'var(--text-primary)' }}>{enrollment?.targetCohortComparison?.targetMetPercentage ?? 0}% Achieved</strong></span>
              </div>
              <div className="enrollment-progress-bar" title="Enrollment Breakdown Progress Bar">
                <div
                  className="enrollment-seg enrolled"
                  style={{ width: `${enrollment?.breakdown?.[0]?.percentage ?? 0}%` }}
                  title={`Enrolled: ${enrollment?.breakdown?.[0]?.count ?? 0} (${enrollment?.breakdown?.[0]?.percentage ?? 0}%)`}
                />
                <div
                  className="enrollment-seg not-enrolled"
                  style={{ width: `${enrollment?.breakdown?.[1]?.percentage ?? 0}%` }}
                  title={`Not Enrolled: ${enrollment?.breakdown?.[1]?.count ?? 0} (${enrollment?.breakdown?.[1]?.percentage ?? 0}%)`}
                />
                <div
                  className="enrollment-seg pending"
                  style={{ width: `${enrollment?.breakdown?.[2]?.percentage ?? 0}%` }}
                  title={`Pending / Unknown: ${enrollment?.breakdown?.[2]?.count ?? 0} (${enrollment?.breakdown?.[2]?.percentage ?? 0}%)`}
                />
              </div>
            </div>

            {/* Three Breakdown Cards */}
            <div className="enrollment-cards-grid">
              {/* Enrolled Box */}
              <div className="enrollment-stat-box enrolled">
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success-primary)', letterSpacing: '0.04em' }}>
                    ENROLLED
                  </span>
                  <Badge variant="success" size="sm">{enrollment?.breakdown?.[0]?.percentage ?? 0}%</Badge>
                </div>
                <div className="enrollment-stat-count" style={{ color: 'var(--color-success-primary)' }}>
                  {enrollment?.breakdown?.[0]?.count !== undefined ? enrollment.breakdown[0].count.toLocaleString() : '0'}
                </div>
                <div className="enrollment-stat-sublist">
                  <div className="enrollment-sub-item">
                    <span>Child Dev Center (CDC):</span>
                    <strong>{enrollment?.breakdown?.[0]?.subcategories?.[0]?.count ?? 0}</strong>
                  </div>
                  <div className="enrollment-sub-item">
                    <span>Neighborhood Play (SNP):</span>
                    <strong>{enrollment?.breakdown?.[0]?.subcategories?.[1]?.count ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Not Enrolled Box */}
              <div className="enrollment-stat-box not-enrolled">
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger-primary)', letterSpacing: '0.04em' }}>
                    NOT ENROLLED
                  </span>
                  <Badge variant="danger" size="sm">{enrollment?.breakdown?.[1]?.percentage ?? 0}%</Badge>
                </div>
                <div className="enrollment-stat-count" style={{ color: 'var(--color-danger-primary)' }}>
                  {enrollment?.breakdown?.[1]?.count !== undefined ? enrollment.breakdown[1].count.toLocaleString() : '0'}
                </div>
                <div className="enrollment-stat-sublist">
                  <div className="enrollment-sub-item">
                    <span style={{ color: 'var(--color-danger-primary)', fontWeight: 500 }}>Age 3–4 CDC Targets:</span>
                    <strong>{enrollment?.breakdown?.[1]?.subcategories?.[0]?.count ?? 0}</strong>
                  </div>
                  <div className="enrollment-sub-item">
                    <span>Age 0–2 Home Care:</span>
                    <strong>{enrollment?.breakdown?.[1]?.subcategories?.[1]?.count ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Pending / Unknown Box */}
              <div className="enrollment-stat-box pending">
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning-primary)', letterSpacing: '0.04em' }}>
                    PENDING / UNKNOWN
                  </span>
                  <Badge variant="warning" size="sm">{enrollment?.breakdown?.[2]?.percentage ?? 0}%</Badge>
                </div>
                <div className="enrollment-stat-count" style={{ color: 'var(--color-warning-primary)' }}>
                  {enrollment?.breakdown?.[2]?.count !== undefined ? enrollment.breakdown[2].count.toLocaleString() : '0'}
                </div>
                <div className="enrollment-stat-sublist">
                  <div className="enrollment-sub-item">
                    <span>Transient / Relocated:</span>
                    <strong>{enrollment?.breakdown?.[2]?.subcategories?.[0]?.count ?? 0}</strong>
                  </div>
                  <div className="enrollment-sub-item">
                    <span>Pending Verification:</span>
                    <strong>{enrollment?.breakdown?.[2]?.subcategories?.[1]?.count ?? 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* C. MONITORING STATUS */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <CardTitle>
                  C. Monitoring Status
                </CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                Quarterly Cycle
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            {/* Health Subsection */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Health Monitoring (OPT Plus & Immunization)
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {summary?.totalChildren !== undefined ? summary.totalChildren.toLocaleString() : '0'} total children
                </span>
              </div>

              <div className="monitoring-metrics-grid">
                <div className="monitoring-tile success">
                  <div className="monitoring-tile-title">Up to date</div>
                  <div className="monitoring-tile-val" style={{ color: 'var(--color-success-primary)' }}>
                    {monitoring?.health?.upToDate?.count !== undefined ? monitoring.health.upToDate.count.toLocaleString() : '0'}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.health?.upToDate?.percentage ?? 0}% normal growth & complete records
                  </div>
                </div>

                <div className="monitoring-tile warning">
                  <div className="monitoring-tile-title">Due this Month</div>
                  <div className="monitoring-tile-val" style={{ color: 'var(--color-warning-primary)' }}>
                    {monitoring?.health?.due?.count ?? 0}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.health?.due?.percentage ?? 0}% scheduled for routine weigh-in
                  </div>
                </div>

                <div className="monitoring-tile danger">
                  <div className="monitoring-tile-title">Overdue (&gt;30d)</div>
                  <div className="monitoring-tile-val" style={{ color: 'var(--color-danger-primary)' }}>
                    {monitoring?.health?.overdue?.count ?? 0}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.health?.overdue?.percentage ?? 0}% missed immunization/nutrition check
                  </div>
                </div>
              </div>
            </div>

            {/* Development Assessment Subsection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  ECCD Developmental Assessment Checklist
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  7 Domains evaluation
                </span>
              </div>

              <div className="monitoring-metrics-grid">
                <div className="monitoring-tile success">
                  <div className="monitoring-tile-title">Completed</div>
                  <div className="monitoring-tile-val" style={{ color: 'var(--color-success-primary)' }}>
                    {monitoring?.development?.completed?.count !== undefined ? monitoring.development.completed.count.toLocaleString() : '0'}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.development?.completed?.percentage ?? 0}% standard checklist administered
                  </div>
                </div>

                <div className="monitoring-tile neutral">
                  <div className="monitoring-tile-title">Pending</div>
                  <div className="monitoring-tile-val">
                    {monitoring?.development?.pending?.count !== undefined ? monitoring.development.pending.count.toLocaleString() : '0'}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.development?.pending?.percentage ?? 0}% scheduled for 1st cycle assessment
                  </div>
                </div>

                <div className="monitoring-tile danger">
                  <div className="monitoring-tile-title">Follow-up Needed</div>
                  <div className="monitoring-tile-val" style={{ color: 'var(--color-danger-primary)' }}>
                    {monitoring?.development?.followUp?.count ?? 0}
                  </div>
                  <div className="monitoring-tile-desc">
                    {monitoring?.development?.followUp?.percentage ?? 0}% domain delays flagged for action
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Flagged Domains Alert List */}
            {monitoring?.criticalAlerts && monitoring.criticalAlerts.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Priority Intervention Hotspots (Flagged Domains):
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  {monitoring.criticalAlerts.map((alert, idx) => (
                    <Badge key={idx} variant={alert.severity === 'Critical' ? 'danger' : 'warning'} size="sm">
                      {alert.domain}: {alert.flagged}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* =========================================================================
          TWO-COLUMN SECTION:
          B. CHILDREN BY BARANGAY  &  E. RECENT ACTIVITY
          ========================================================================= */}
      <div className="dash-two-col">
        {/* B. CHILDREN BY BARANGAY */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <CardTitle>
                  B. Children by Barangay
                </CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                {barangays?.totalBarangays || 10} Barangays
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="Filter barangay..."
                  value={barangaySearch}
                  onChange={(e) => setBarangaySearch(e.target.value)}
                  leftIcon={<Search size={14} />}
                  className="input-sm"
                />
              </div>
              <div style={{ width: '160px' }}>
                <Select
                  value={barangayRiskFilter}
                  onChange={(e) => setBarangayRiskFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Standing' },
                    { value: 'High Attention', label: 'High Attention' },
                    { value: 'Moderate Attention', label: 'Moderate' },
                    { value: 'Good Standing', label: 'Good Standing' },
                  ]}
                  className="select-sm"
                />
              </div>
            </div>

            {/* Clean Ranked Table Visualization */}
            <div className="table-container mobile-table-to-cards" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader style={{ width: '48px' }}>Rank</TableHeader>
                    <TableHeader>Barangay</TableHeader>
                    <TableHeader>Children</TableHeader>
                    <TableHeader>Enrolled</TableHeader>
                    <TableHeader>Health Due</TableHeader>
                    <TableHeader>Dev Alert</TableHeader>
                    <TableHeader>Priority Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBarangays.map((b, bIdx) => (
                    <TableRow key={b?.name || `brgy-${bIdx}`}>
                      <TableCell>
                        <span className={`barangay-rank-num ${b.rank <= 3 ? 'top-rank' : ''}`}>
                          {b.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong>{b.name}</strong>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {b.assignedWorker} • {b.daycareCenters} CDCs
                        </div>
                      </TableCell>
                      <TableCell>
                        <strong>{b.totalChildren}</strong>
                      </TableCell>
                      <TableCell>
                        <div className="barangay-percent-bar">
                          <span style={{ fontSize: 'var(--font-size-xs)', minWidth: '35px', fontWeight: '500' }}>
                            {b.enrolledPercent}%
                          </span>
                          <div className="barangay-mini-bar" style={{ width: '60px' }}>
                            <div
                              className="barangay-mini-fill"
                              style={{
                                width: `${b.enrolledPercent}%`,
                                backgroundColor: b.enrolledPercent < 60 ? 'var(--color-danger-primary)' : 'var(--color-success-primary)',
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: b.healthDue > 30 ? 'var(--color-danger-primary)' : 'inherit', fontWeight: b.healthDue > 30 ? 'bold' : 'normal' }}>
                          {b.healthDue}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: b.devFollowup > 15 ? 'var(--color-danger-primary)' : 'inherit', fontWeight: b.devFollowup > 15 ? 'bold' : 'normal' }}>
                          {b.devFollowup}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.priorityVariant} size="sm">
                          {b.riskLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>

        {/* E. RECENT ACTIVITY */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <CardTitle>
                  E. Recent Activity
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="activity-feed-list" style={{ maxHeight: '475px', overflowY: 'auto' }}>
              {(!activityData?.activities || activityData.activities.length === 0) ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0 }}>No recent operational activity recorded.</p>
                </div>
              ) : (
                activityData.activities.map((act) => (
                <div key={act.id} className="activity-feed-item">
                  <div
                    className="activity-icon-bubble"
                    style={{
                      backgroundColor:
                        act.type === 'enrollment'
                          ? 'var(--color-success-bg)'
                          : act.type === 'assessment'
                          ? 'var(--color-primary-50)'
                          : act.type === 'health'
                          ? 'var(--color-info-bg)'
                          : 'var(--color-warning-bg)',
                      color:
                        act.type === 'enrollment'
                          ? 'var(--color-success-primary)'
                          : act.type === 'assessment'
                          ? 'var(--color-primary-800)'
                          : act.type === 'health'
                          ? 'var(--color-info-primary)'
                          : 'var(--color-warning-primary)',
                    }}
                  >
                    {act.type === 'enrollment' && <School size={15} />}
                    {act.type === 'assessment' && <Brain size={15} />}
                    {act.type === 'health' && <Stethoscope size={15} />}
                    {act.type === 'mapping' && <MapPin size={15} />}
                  </div>

                  <div className="activity-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                        {act.title}
                      </span>
                      <Badge variant={act.tagVariant} size="sm">
                        {act.tag}
                      </Badge>
                    </div>

                    <p style={{ margin: 'var(--space-1) 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {act.description}
                    </p>

                    <div className="activity-meta">
                      <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary-800)' }}>
                        {act.worker}
                      </span>
                      <span>•</span>
                      <span>{act.barangay}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>{act.timestamp}</span>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* =========================================================================
          MODAL: CASE REVIEW & ACTION WORKFLOW FOR "NEEDS ATTENTION"
          ========================================================================= */}
      {selectedCase && (
        <Modal
          isOpen={isCaseModalOpen}
          onClose={() => {
            setIsCaseModalOpen(false);
            setSelectedCase(null);
          }}
          title={`Operational Case Review: ${selectedCase.childName || 'Child'}`}
          subtitle={[
            selectedCase.id && `Child ID: ${selectedCase.id}`,
            selectedCase.barangay && `${selectedCase.barangay}${selectedCase.purok ? ` (${selectedCase.purok})` : ''}`
          ].filter(Boolean).join(' • ') || undefined}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCaseModalOpen(false);
                  setSelectedCase(null);
                }}
              >
                Close
              </Button>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {selectedCase.status !== 'In Progress' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateCaseStatus('In Progress')}
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedCase.status !== 'Resolved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateCaseStatus('Resolved')}
                  >
                    <CheckCircle2 size={14} />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Urgency Alert Header */}
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: selectedCase.priority === 'Urgent' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                border: `1px solid ${selectedCase.priority === 'Urgent' ? 'var(--color-danger-border)' : 'var(--color-warning-border)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
              }}
            >
              <AlertTriangle size={20} style={{ color: selectedCase.priority === 'Urgent' ? 'var(--color-danger-primary)' : 'var(--color-warning-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: selectedCase.priority === 'Urgent' ? 'var(--color-danger-primary)' : 'var(--color-warning-primary)', fontSize: 'var(--font-size-sm)' }}>
                  {selectedCase.priority || 'Standard'} Priority Case: {(selectedCase.issueCategory || selectedCase.sourceModule || 'general').toUpperCase()} INTERVENTION
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>
                  {selectedCase.issue || selectedCase.reason || 'Operational intervention required'}
                </p>
              </div>
            </div>

            {/* Child Profile Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Age & Sex:</span>
                <div style={{ fontWeight: '500' }}>
                  {[selectedCase.age, selectedCase.sex].filter(Boolean).filter((v) => v !== '—').join(' • ') || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Parent / Guardian:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.guardianName || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Day Care Center:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.center || selectedCase.dayCareCenter || 'Community CDC'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Worker & Contact:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.assignedWorker || selectedCase.assignedWorkerName || 'Assigned CDW'} {selectedCase.workerContact ? `(${selectedCase.workerContact})` : ''}</div>
              </div>
            </div>

            {/* Recommended Protocol Action */}
            <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary-900)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                Recommended CSWDO Protocol Action:
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                {selectedCase.actionRequired || selectedCase.actionPlan || 'Conduct home visit and coordinate with barangay CDW.'}
              </p>
            </div>

            {/* Due date and current status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              <span>Follow-up Target Due Date: <strong>{selectedCase.dueDate || selectedCase.scheduledDate || 'Pending'}</strong></span>
              <span>Current Status: {getStatusBadge(selectedCase.status)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: QUICK ACTIONS (REGISTER, ENROLL, HEALTH, ASSESSMENT, MAPPING)
          ========================================================================= */}
      {activeQuickAction && (
        <Modal
          isOpen={!!activeQuickAction}
          onClose={() => setActiveQuickAction(null)}
          title={
            activeQuickAction === 'register'
              ? '+ Register New Child'
              : activeQuickAction === 'enroll'
              ? '+ Enroll Child in Day Care / SNP'
              : activeQuickAction === 'health'
              ? '+ Record Health & Nutritional Monitoring'
              : activeQuickAction === 'assessment'
              ? '+ Start ECCD Development Assessment'
              : '+ Log Community Mapping Activity'
          }
          size="md"
        >
          <form onSubmit={handleQuickActionSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Child Full Name"
                placeholder="e.g. Juan Dela Cruz"
                required
                value={quickActionForm.childName}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, childName: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Input
                  label="Child System ID (optional)"
                  placeholder="Auto-generated if empty"
                  value={quickActionForm.childId}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, childId: e.target.value })}
                />
                <Select
                  label="Barangay"
                  value={quickActionForm.barangay}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, barangay: e.target.value })}
                  options={[
                    ...BARANGAY_OPTIONS,
                  ]}
                />
              </div>

              <Input
                label="Parent / Guardian Name"
                placeholder="e.g. Rosa Dela Cruz"
                value={quickActionForm.guardianName}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, guardianName: e.target.value })}
              />

              <Input
                label="Operational Remarks / Intake Notes"
                placeholder="Details of the assessment score, nutritional status or enrollment session..."
                value={quickActionForm.notes}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, notes: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveQuickAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Confirm & Submit
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default DashboardOverview;
