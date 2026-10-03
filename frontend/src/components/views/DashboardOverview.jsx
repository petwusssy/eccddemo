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
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';

export function DashboardOverview({ onNavigate }) {
  const { addToast } = useToast();

  // Loading & Data States (api-and-interface-design + react-patterns)
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [barangays, setBarangays] = useState(null);
  const [attentionData, setAttentionData] = useState(null);
  const [activityData, setActivityData] = useState(null);

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

      setSummary(sum);
      setEnrollment(enr);
      setMonitoring(mon);
      setBarangays(bar);
      setAttentionData(att);
      setActivityData(act);
    } catch (err) {
      console.error('Error fetching dashboard endpoints:', err);
      addToast('Error synchronizing dashboard datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleStoreUpdate = () => loadDashboardData();
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    return () => window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
  }, []);

  // Filtered Attention Cases
  const filteredAttentionItems = useMemo(() => {
    if (!attentionData?.items) return [];
    return attentionData.items.filter((item) => {
      const matchesSearch =
        item.childName.toLowerCase().includes(attentionSearch.toLowerCase()) ||
        item.id.toLowerCase().includes(attentionSearch.toLowerCase()) ||
        item.barangay.toLowerCase().includes(attentionSearch.toLowerCase()) ||
        item.issue.toLowerCase().includes(attentionSearch.toLowerCase());

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
    if (!barangays?.rankedBarangays) return [];
    return barangays.rankedBarangays.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(barangaySearch.toLowerCase());
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
        setSelectedCase(res.item);
        // Refresh local list
        const updated = await dashboardService.getAttention();
        setAttentionData(updated);

        // Also record in activity stream
        await dashboardService.recordQuickAction('Case Status Updated', {
          description: `Action on ${selectedCase.childName} (${selectedCase.id}) marked as "${newStatus}"`,
          type: 'assessment',
          barangay: selectedCase.barangay,
          childId: selectedCase.id,
          worker: 'CSWDO Administrator',
          tag: 'Status Update',
          tagVariant: 'info',
        });
        const updatedActs = await dashboardService.getRecentActivity();
        setActivityData(updatedActs);

        addToast(`Case ${selectedCase.id} updated to ${newStatus}`, 'success');
        setIsCaseModalOpen(false);
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
      tag: activeQuickAction.toUpperCase(),
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
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 className="page-title">CSWDO Operations Dashboard</h1>
            <Badge variant="primary" size="sm">City Level</Badge>
          </div>
          <p className="page-subtitle">
            ECCD CARE Central Decision System — City Social Welfare and Development Office, City of San Fernando, Pampanga ({summary?.reportingSchoolYear || 'SY 2026–2027'})
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveQuickAction('register')}
          >
            <Plus size={14} />
            Register Child
          </Button>
        </div>
      </div>

      {/* =========================================================================
          OPERATIONAL DECISION STRIP: ANSWERS 6 CORE QUESTIONS IMMEDIATELY
          ========================================================================= */}
      <section className="dash-decision-strip" aria-label="Core Operational Answers">
        <div className="dash-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="dash-decision-badge">
              <Sparkles size={13} />
              CSWDO Executive Briefing
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.85)' }}>
              Direct answers for administrative & field mobilization decisions
            </span>
          </div>
          <span className="dash-decision-timestamp">
            Updated: {summary ? new Date(summary.lastUpdated).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Live'}
          </span>
        </div>

        <div className="dash-decision-grid">
          {/* Question 1 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">1</div>
            <div>
              <div className="dash-decision-question">Children Aged 0–4 Identified:</div>
              <div className="dash-decision-answer">
                <strong>{summary?.totalChildren !== undefined ? summary.totalChildren.toLocaleString() : '0'}</strong> documented across {summary?.totalBarangays || 10} barangays ({summary?.mappedPercentage ?? 0}% mapped)
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">2</div>
            <div>
              <div className="dash-decision-question">Enrolled in Day Care / SNP:</div>
              <div className="dash-decision-answer">
                <span style={{ color: 'var(--color-success-light)' }}>
                  <strong>{summary?.enrolledChildren !== undefined ? summary.enrolledChildren.toLocaleString() : '0'} enrolled</strong>
                </span> ({summary?.enrolledPercentage ?? 0}% coverage)
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">3</div>
            <div>
              <div className="dash-decision-question">Not Enrolled Children:</div>
              <div className="dash-decision-answer">
                <span style={{ color: '#fca5a5' }}>
                  <strong>{summary?.notEnrolledChildren !== undefined ? summary.notEnrolledChildren.toLocaleString() : '0'} unenrolled</strong>
                </span> ({summary?.notEnrolledPercentage ?? 0}% of cohort)
              </div>
            </div>
          </div>

          {/* Question 4 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">4</div>
            <div>
              <div className="dash-decision-question">Children Needing Health Monitoring:</div>
              <div className="dash-decision-answer">
                <span style={{ color: '#fde047' }}>
                  <strong>{summary?.healthMonitoringDue ?? 0} children due/overdue</strong>
                </span> for OPT Plus / vaccines
              </div>
            </div>
          </div>

          {/* Question 5 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">5</div>
            <div>
              <div className="dash-decision-question">Children Needing Development Follow-up:</div>
              <div className="dash-decision-answer">
                <span style={{ color: '#fca5a5' }}>
                  <strong>{summary?.developmentFollowups ?? 0} children flagged</strong>
                </span> with domain alerts (motor/speech)
              </div>
            </div>
          </div>

          {/* Question 6 */}
          <div className="dash-decision-item">
            <div className="dash-decision-num">6</div>
            <div>
              <div className="dash-decision-question">Barangays Needing Immediate Attention:</div>
              <div className="dash-decision-answer">
                <span style={{ color: '#fde047' }}>
                  <strong>{summary?.barangaysNeedingAttention ?? 0} priority barangays</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOP KPI CARDS (6 CARDS WITH REALISTIC SYNTHETIC METRICS)
          ========================================================================= */}
      <section className="dash-kpis-grid" aria-label="Top Key Performance Indicators">
        {/* Total Children */}
        <div className="kpi-card" onClick={() => onNavigate('children')} style={{ cursor: 'pointer' }} title="View Children Master Registry">
          <div className="kpi-top">
            <span className="kpi-title">Total Children</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}>
              <Users size={17} />
            </div>
          </div>
          <div className="kpi-value">{summary?.totalChildren !== undefined ? summary.totalChildren.toLocaleString() : '0'}</div>
          <div className="kpi-subtext">
            <span>Aged 0–4 years cohort</span>
          </div>
        </div>

        {/* Mapped */}
        <div className="kpi-card" onClick={() => onNavigate('community-mapping')} style={{ cursor: 'pointer' }} title="View Community Mapping Module">
          <div className="kpi-top">
            <span className="kpi-title">Mapped</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-700)' }}>
              <MapPin size={17} />
            </div>
          </div>
          <div className="kpi-value">{summary?.mappedChildren !== undefined ? summary.mappedChildren.toLocaleString() : '0'}</div>
          <div className="kpi-subtext">
            <TrendingUp size={13} style={{ color: 'var(--color-success-primary)' }} />
            <span><strong>{summary?.mappedPercentage ?? 0}%</strong> of LGU target</span>
          </div>
        </div>

        {/* Enrolled */}
        <div className="kpi-card" onClick={() => onNavigate('enrollment')} style={{ cursor: 'pointer' }} title="View Enrollment Tracking Directory">
          <div className="kpi-top">
            <span className="kpi-title">Enrolled</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)' }}>
              <School size={17} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-success-primary)' }}>
            {summary?.enrolledChildren !== undefined ? summary.enrolledChildren.toLocaleString() : '0'}
          </div>
          <div className="kpi-subtext">
            <span><strong>{summary?.enrolledPercentage ?? 0}%</strong> in CDC & SNP</span>
          </div>
        </div>

        {/* Not Enrolled */}
        <div className="kpi-card" onClick={() => onNavigate('enrollment')} style={{ cursor: 'pointer' }} title="View Mapped but Not Enrolled Operational View">
          <div className="kpi-top">
            <span className="kpi-title">Not Enrolled</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-primary)' }}>
              <UserX size={17} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-danger-primary)' }}>
            {summary?.notEnrolledChildren !== undefined ? summary.notEnrolledChildren.toLocaleString() : '0'}
          </div>
          <div className="kpi-subtext">
            <span><strong>{summary?.notEnrolledPercentage ?? 0}%</strong> unenrolled</span>
          </div>
        </div>

        {/* Health Monitoring Due */}
        <div className="kpi-card" onClick={() => onNavigate('health-monitoring')} style={{ cursor: 'pointer' }} title="View Health Monitoring Due List">
          <div className="kpi-top">
            <span className="kpi-title">Health Due</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-primary)' }}>
              <HeartPulse size={17} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-warning-primary)' }}>
            {summary?.healthMonitoringDue ?? 0}
          </div>
          <div className="kpi-subtext">
            <span>Overdue or scheduled now</span>
          </div>
        </div>

        {/* Development Follow-ups */}
        <div className="kpi-card" onClick={() => onNavigate('follow-ups')} style={{ cursor: 'pointer' }} title="View Follow-Up & Early Support Queue">
          <div className="kpi-top">
            <span className="kpi-title">Dev Follow-ups</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
              <Brain size={17} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>
            {summary?.developmentFollowups ?? 0}
          </div>
          <div className="kpi-subtext">
            <span>Domain delays flagged</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          F. QUICK ACTIONS STRIP
          ========================================================================= */}
      <section className="dash-quick-actions-bar" aria-label="Operational Quick Actions">
        <span className="quick-actions-label">
          <Activity size={14} />
          Quick Actions:
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('mapping')}
        >
          <Plus size={13} />
          New Mapping Activity
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('register')}
        >
          <Plus size={13} />
          Register Child
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('enroll')}
        >
          <Plus size={13} />
          Enroll Child
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('health')}
        >
          <Plus size={13} />
          Record Health Monitoring
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveQuickAction('assessment')}
        >
          <Plus size={13} />
          Start Development Assessment
        </Button>
      </section>

      {/* =========================================================================
          SECTION D: PROMINENT OPERATIONAL TABLE — "NEEDS ATTENTION"
          PRIORITIZED OPERATIONAL DECISION MAKING OVER DECORATIVE CHARTS
          ========================================================================= */}
      <section className="attention-card" aria-label="Children Needing Attention Table">
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-danger-primary)' }} />
                  Needs Attention: Active Operational Intervention Cases
                </h2>
                <Badge variant="danger" size="sm">
                  {attentionData?.highPriorityCount ?? 0} Urgent
                </Badge>
              </div>
              <p className="card-subtitle" style={{ marginTop: '2px' }}>
                Priority list of individual children requiring immediate CSWDO supervisor review, health endorsement, or field follow-up.
              </p>
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
                Urgent Only
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
          <div style={{ marginTop: 'var(--space-3)', maxWidth: '420px' }}>
            <Input
              placeholder="Search by child name, ID, barangay or issue..."
              value={attentionSearch}
              onChange={(e) => setAttentionSearch(e.target.value)}
              leftIcon={<Search size={15} />}
              className="input-sm"
            />
          </div>
        </div>

        {/* Operational Table */}
        <div className="table-container mobile-table-to-cards" style={{ border: 'none', borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Child</TableHeader>
                <TableHeader>Child ID</TableHeader>
                <TableHeader>Barangay</TableHeader>
                <TableHeader>Issue & Diagnosis</TableHeader>
                <TableHeader>Assigned Worker</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader style={{ textAlign: 'right' }}>Action</TableHeader>
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
                    <TableCell>
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                          {item.childName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {item.age} • {item.sex}
                        </div>
                      </div>
                    </TableCell>

                    {/* Child ID */}
                    <TableCell>
                      <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-neutral-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                        {item.id}
                      </code>
                    </TableCell>

                    {/* Barangay */}
                    <TableCell>
                      <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{item.barangay}</span>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.purok}</div>
                    </TableCell>

                    {/* Issue */}
                    <TableCell style={{ maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                        {item.priority === 'Urgent' && (
                          <AlertCircle size={15} style={{ color: 'var(--color-danger-primary)', flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                          {item.issue}
                        </span>
                      </div>
                    </TableCell>

                    {/* Assigned Worker */}
                    <TableCell>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>{item.assignedWorker}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.workerContact}</div>
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>
                        <Calendar size={13} style={{ color: item.status === 'Overdue' ? 'var(--color-danger-primary)' : 'var(--text-muted)' }} />
                        <span style={{ fontWeight: item.status === 'Overdue' ? 'bold' : 'normal', color: item.status === 'Overdue' ? 'var(--color-danger-primary)' : 'var(--text-secondary)' }}>
                          {item.dueDate}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>

                    {/* Action */}
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedCase(item);
                          setIsCaseModalOpen(true);
                        }}
                      >
                        <Eye size={13} />
                        Review Case
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                <CardTitle subtitle="Distribution of 0–4 age cohort across early childhood education modalities">
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
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Total Identified: <strong>{(summary?.totalChildren ?? 0).toLocaleString()} children</strong></span>
                <span>Annual CSWDO Target: <strong>{enrollment?.targetCohortComparison?.targetMetPercentage ?? 0}% Achieved</strong></span>
              </div>
              <div className="enrollment-progress-bar" title="Enrollment Breakdown Progress Bar">
                <div
                  className="enrollment-seg enrolled"
                  style={{ width: `${enrollment?.breakdown?.[0]?.percentage ?? 0}%` }}
                >
                  Enrolled ({enrollment?.breakdown?.[0]?.percentage ?? 0}%)
                </div>
                <div
                  className="enrollment-seg not-enrolled"
                  style={{ width: `${enrollment?.breakdown?.[1]?.percentage ?? 0}%` }}
                >
                  Not Enrolled ({enrollment?.breakdown?.[1]?.percentage ?? 0}%)
                </div>
                <div
                  className="enrollment-seg pending"
                  style={{ width: `${enrollment?.breakdown?.[2]?.percentage ?? 0}%` }}
                >
                  Pending ({enrollment?.breakdown?.[2]?.percentage ?? 0}%)
                </div>
              </div>
            </div>

            {/* Three Breakdown Cards */}
            <div className="enrollment-cards-grid">
              {/* Enrolled Box */}
              <div className="enrollment-stat-box" style={{ borderLeft: '3px solid var(--color-success-primary)' }}>
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-success-primary)' }}>
                    ENROLLED
                  </span>
                  <Badge variant="success" size="sm">{enrollment?.breakdown?.[0]?.percentage ?? 0}%</Badge>
                </div>
                <div className="enrollment-stat-count">
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
              <div className="enrollment-stat-box" style={{ borderLeft: '3px solid var(--color-danger-primary)' }}>
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-danger-primary)' }}>
                    NOT ENROLLED
                  </span>
                  <Badge variant="danger" size="sm">{enrollment?.breakdown?.[1]?.percentage ?? 0}%</Badge>
                </div>
                <div className="enrollment-stat-count" style={{ color: 'var(--color-danger-primary)' }}>
                  {enrollment?.breakdown?.[1]?.count !== undefined ? enrollment.breakdown[1].count.toLocaleString() : '0'}
                </div>
                <div className="enrollment-stat-sublist">
                  <div className="enrollment-sub-item">
                    <span style={{ color: 'var(--color-danger-primary)', fontWeight: '500' }}>Age 3–4 CDC Targets:</span>
                    <strong>{enrollment?.breakdown?.[1]?.subcategories?.[0]?.count ?? 0}</strong>
                  </div>
                  <div className="enrollment-sub-item">
                    <span>Age 0–2 Home Care:</span>
                    <strong>{enrollment?.breakdown?.[1]?.subcategories?.[1]?.count ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Pending / Unknown Box */}
              <div className="enrollment-stat-box" style={{ borderLeft: '3px solid var(--color-warning-primary)' }}>
                <div className="enrollment-stat-header">
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-warning-primary)' }}>
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

            {/* Strategic Operational Note */}
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', gap: 'var(--space-2)' }}>
              <School size={15} style={{ color: 'var(--color-primary-600)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Operational Action:</strong> {summary?.totalChildren ? `${summary.notEnrolledChildren || 0} unenrolled children identified across mapped barangays.` : 'Clean operational slate. Map households or register children to begin tracking enrollment.'}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* C. MONITORING STATUS */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <CardTitle subtitle="Health (immunization / growth) & ECCD development assessment status">
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
            <div style={{ marginTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Priority Intervention Hotspots (Flagged Domains):
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                {(!monitoring?.criticalAlerts || monitoring.criticalAlerts.length === 0) ? (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    No active critical alerts or domain delays flagged.
                  </span>
                ) : (
                  monitoring.criticalAlerts.map((alert, idx) => (
                    <Badge key={idx} variant={alert.severity === 'Critical' ? 'danger' : 'warning'} size="sm">
                      {alert.domain}: {alert.flagged}
                    </Badge>
                  ))
                )}
              </div>
            </div>
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
                <CardTitle subtitle="Ranked by priority operational attention needed">
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
                  {filteredBarangays.map((b) => (
                    <TableRow key={b.name}>
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
                <CardTitle subtitle="Real-time multi-stream log of community mapping, enrollments, and clinical assessments">
                  E. Recent Activity
                </CardTitle>
              </div>
              <Badge variant="primary" size="sm">Live Feed</Badge>
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
          onClose={() => setIsCaseModalOpen(false)}
          title={`Operational Case Review: ${selectedCase.childName}`}
          subtitle={`Child ID: ${selectedCase.id} • ${selectedCase.barangay} (${selectedCase.purok})`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCaseModalOpen(false)}
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
                  {selectedCase.priority} Priority Case: {selectedCase.issueCategory.toUpperCase()} INTERVENTION
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>
                  {selectedCase.issue}
                </p>
              </div>
            </div>

            {/* Child Profile Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Age & Sex:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.age} • {selectedCase.sex}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Parent / Guardian:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.guardianName}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Day Care Center:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.center}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Worker & Contact:</span>
                <div style={{ fontWeight: '500' }}>{selectedCase.assignedWorker} ({selectedCase.workerContact})</div>
              </div>
            </div>

            {/* Recommended Protocol Action */}
            <div style={{ border: '1px solid var(--border-default)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary-900)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                Recommended CSWDO Protocol Action:
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                {selectedCase.actionRequired}
              </p>
            </div>

            {/* Due date and current status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              <span>Follow-up Target Due Date: <strong>{selectedCase.dueDate}</strong></span>
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
          subtitle="Direct operational entry into the ECCD CARE central repository"
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
