import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  UserCheck,
  Building2,
  MapPin,
  FileText,
  Phone,
  Check,
  X,
  RefreshCw,
  Eye,
  HeartPulse,
  Brain,
  School,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { followUpService } from '../../services/followUpService';
import { centralDataStore } from '../../services/centralDataStore';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { getPhilippinesDate, addDaysPHT } from '../../utils/phTime';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';

const formatChildName = (name) => {
  if (!name) return '—';
  if (name === name.toUpperCase() && name.length > 2) {
    return name
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return name;
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || 'C';
};

const getFollowUpCategoryVariant = (cat) => {
  if (cat === 'Needs Attention') return 'danger';
  if (cat === 'Pending' || cat === 'In Progress') return 'warning';
  if (cat === 'Scheduled') return 'info';
  if (cat === 'Completed' || cat === 'Resolved') return 'success';
  return 'neutral';
};

const getFollowUpCategoryIcon = (cat) => {
  if (cat === 'Needs Attention') return AlertTriangle;
  if (cat === 'Pending' || cat === 'In Progress') return Clock;
  if (cat === 'Scheduled') return Calendar;
  if (cat === 'Completed' || cat === 'Resolved') return CheckCircle2;
  return null;
};

const getActionTypeVariant = (type) => {
  if (type === 'Monitoring') return 'info';
  if (type === 'Follow-up') return 'primary';
  if (type === 'Scheduled Visit') return 'warning';
  if (type === 'Referral') return 'danger';
  return 'neutral';
};

const ACTION_TYPES = [
  'Follow-up',
  'Family Contact',
  'Scheduled Visit',
  'Referral',
  'Monitoring',
  'Other',
];

const CATEGORIES = [
  'Needs Attention',
  'Pending',
  'Scheduled',
  'Completed',
];

export function FollowUpView({ onNavigate }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'create' | 'case-view'

  // Data states
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState({
    counts: { needsAttention: 0, pending: 0, scheduled: 0, completed: 0, totalCases: 0 },
    total: 0,
    cases: [],
  });

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected case for deep Case View or resolving
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseViewData, setCaseViewData] = useState(null);
  const [caseViewLoading, setCaseViewLoading] = useState(false);
  const [registeredChildren, setRegisteredChildren] = useState([]);

  // Form states for Create Follow-up
  const [createForm, setCreateForm] = useState({
    childId: '',
    childName: '',
    barangay: '',
    dayCareCenter: '',
    reason: '',
    assignedWorker: '',
    workerContact: '',
    dueDate: addDaysPHT(30),
    category: 'Needs Attention',
    actionType: 'Follow-up',
    notes: '',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form states for Resolve Follow-up modal
  const [resolvingCase, setResolvingCase] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    date: getPhilippinesDate(),
    actionTaken: '',
    notes: '',
    status: 'Completed',
  });
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // Load queue data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await followUpService.getFollowUps({
        category: categoryFilter,
        actionType: actionTypeFilter,
        barangay: barangayFilter,
        assignedWorker: workerFilter,
        search: searchQuery,
      });
      // Strict UI safeguard: guarantee exactly 1 row per childId in the follow-up queue
      const uniqueCases = [];
      const seenChildIds = new Set();
      (data.cases || []).forEach((c) => {
        const key = c.childId || c.id;
        if (!seenChildIds.has(key)) {
          seenChildIds.add(key);
          uniqueCases.push(c);
        }
      });

      setQueueData({
        ...data,
        cases: uniqueCases,
        total: uniqueCases.length,
      });
      const kids = centralDataStore.getChildren() || [];
      setRegisteredChildren(kids);
      if (data.cases && data.cases.length > 0) {
        if (!selectedCaseId || !data.cases.some((c) => c.id === selectedCaseId)) {
          setSelectedCaseId(data.cases[0].id);
        }
      } else {
        setSelectedCaseId(null);
        setCaseViewData(null);
      }
    } catch (err) {
      console.error('Failed to load follow-up queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, actionTypeFilter, barangayFilter, workerFilter, searchQuery]);

  useEffect(() => {
    const handleStoreUpdate = () => {
      loadData();
      if (selectedCaseId) loadCaseView(selectedCaseId);
    };
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    return () => window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
  }, [selectedCaseId]);

  // Load case view details
  const loadCaseView = async (id) => {
    if (!id) return;
    setCaseViewLoading(true);
    try {
      const data = await followUpService.getCaseView(id);
      setCaseViewData(data);
    } catch (err) {
      console.error('Failed to load case view:', err);
    } finally {
      setCaseViewLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseView(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Create Follow-up submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.reason.trim()) errs.reason = 'Reason for follow-up is required.';
    if (!createForm.assignedWorker.trim()) errs.assignedWorker = 'Assigned worker is required.';
    if (!createForm.dueDate) errs.dueDate = 'Due date is required.';

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    setCreateErrors({});
    setIsSubmittingCreate(true);

    try {
      const newCase = await followUpService.createFollowUp(createForm);

      setSaveSuccessMsg(
        `Follow-up case ${newCase.id} successfully created and assigned to ${newCase.assignedWorker}. Child 360° status and timeline updated.`
      );

      setCreateForm({
        childId: '',
        childName: '',
        barangay: '',
        dayCareCenter: '',
        reason: '',
        assignedWorker: '',
        workerContact: '',
        dueDate: addDaysPHT(30),
        category: 'Needs Attention',
        actionType: 'Follow-up',
        notes: '',
      });

      await loadData();
      setSelectedCaseId(newCase.id);

      setTimeout(() => {
        setSaveSuccessMsg('');
      }, 7000);
    } catch (err) {
      console.error('Failed to create follow-up:', err);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Resolve Follow-up submission
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingCase) return;
    if (!resolveForm.actionTaken.trim()) {
      alert('Please specify the action taken to resolve this case.');
      return;
    }

    setIsSubmittingResolve(true);
    try {
      await followUpService.resolveFollowUp(resolvingCase.id, resolveForm);
      setResolvingCase(null);
      setResolveForm({
        date: getPhilippinesDate(),
        actionTaken: '',
        notes: '',
        status: 'Completed',
      });

      await loadData();
      if (selectedCaseId === resolvingCase.id) {
        await loadCaseView(selectedCaseId);
      }
    } catch (err) {
      console.error('Failed to resolve follow-up:', err);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Helper for category badge classes
  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'Needs Attention':
        return 'needs-attention';
      case 'Pending':
        return 'pending';
      case 'Scheduled':
        return 'scheduled';
      case 'Completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  // Helper for action type chip classes
  const getActionChipClass = (type) => {
    return (type || 'other').toLowerCase().replace(' ', '-');
  };

  return (
    <div className="fup-container">

      {/* 2. Top KPI Cards (Categories) */}
      <div className="fup-kpi-grid">
        <div
          className={`fup-kpi-card card-danger ${categoryFilter === 'needs attention' ? 'is-active' : ''}`}
          onClick={() =>
            setCategoryFilter(categoryFilter === 'needs attention' ? 'all' : 'needs attention')
          }
          title="Filter cases needing urgent attention"
        >
          <div className="fup-kpi-icon needs-attention">
            <AlertTriangle size={24} />
          </div>
          <div className="fup-kpi-body">
            <span className="fup-kpi-label">Needs Attention</span>
            <span className="fup-kpi-value" style={{ color: '#dc2626' }}>{queueData.counts.needsAttention}</span>
            <span className="fup-kpi-subtext">Immediate action required</span>
          </div>
        </div>

        <div
          className={`fup-kpi-card card-warning ${categoryFilter === 'pending' ? 'is-active' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === 'pending' ? 'all' : 'pending')}
          title="Filter pending follow-ups"
        >
          <div className="fup-kpi-icon pending">
            <Clock size={24} />
          </div>
          <div className="fup-kpi-body">
            <span className="fup-kpi-label">Pending</span>
            <span className="fup-kpi-value" style={{ color: 'var(--color-warning-600)' }}>{queueData.counts.pending}</span>
            <span className="fup-kpi-subtext">Awaiting intake / visit</span>
          </div>
        </div>

        <div
          className={`fup-kpi-card card-info ${categoryFilter === 'scheduled' ? 'is-active' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === 'scheduled' ? 'all' : 'scheduled')}
          title="Filter scheduled appointments and visits"
        >
          <div className="fup-kpi-icon scheduled">
            <Calendar size={24} />
          </div>
          <div className="fup-kpi-body">
            <span className="fup-kpi-label">Scheduled</span>
            <span className="fup-kpi-value" style={{ color: 'var(--color-info-primary)' }}>{queueData.counts.scheduled}</span>
            <span className="fup-kpi-subtext">Appointment / visit set</span>
          </div>
        </div>

        <div
          className={`fup-kpi-card card-success ${categoryFilter === 'completed' ? 'is-active' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === 'completed' ? 'all' : 'completed')}
          title="Filter resolved and completed cases"
        >
          <div className="fup-kpi-icon completed">
            <CheckCircle2 size={24} />
          </div>
          <div className="fup-kpi-body">
            <span className="fup-kpi-label">Completed</span>
            <span className="fup-kpi-value" style={{ color: 'var(--color-success-600)' }}>{queueData.counts.completed}</span>
            <span className="fup-kpi-subtext">Action taken &amp; documented</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Navigation */}
      <div className="dev-tabs-nav">
        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'queue' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <CalendarClock size={16} />
          Follow-Up Queue Directory
        </button>

        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'create' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} />
          Assign New Follow-Up (CSWDO Intake)
        </button>

        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'case-view' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('case-view')}
        >
          <Eye size={16} />
          Early Support Case View (Timeline)
        </button>
      </div>

      {/* =========================================================================
          TAB 1: FOLLOW-UP QUEUE DIRECTORY
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Toolbar & Filter Bar */}
          <div className="health-toolbar">
            <div className="health-toolbar-left">
              <div className="health-search-box">
                <Search size={16} className="health-search-icon" />
                <input
                  type="text"
                  placeholder="Search case ID, child name, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <select
                className="health-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Action Type Filter */}
              <select
                className="health-select"
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
              >
                <option value="all">All Action Types</option>
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Barangay Filter */}
              <select
                className="health-select"
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
              >
                <option value="all">All Barangays</option>
                {SAN_FERNANDO_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={loadData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setActiveTab('create')}
              >
                Assign Follow-Up
              </Button>
            </div>
          </div>

          {/* Follow-Up Records Table */}
          <div className="table-container mobile-table-to-cards">
            <table className="table follow-up-table">
              <TableHead>
                <TableRow>
                  <TableHeader className="fup-col-case-id">Case ID</TableHeader>
                  <TableHeader className="fup-col-child">Child</TableHeader>
                  <TableHeader className="fup-col-type">Action Type</TableHeader>
                  <TableHeader className="fup-col-reason">Reason &amp; Description</TableHeader>
                  <TableHeader className="fup-col-worker">Assigned Worker</TableHeader>
                  <TableHeader className="fup-col-due">Due Date</TableHeader>
                  <TableHeader className="fup-col-status">Category / Status</TableHeader>
                  <TableHeader className="fup-col-actions" style={{ textAlign: 'right' }}>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--color-primary-800)' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading follow-up queue...</p>
                    </TableCell>
                  </TableRow>
                ) : queueData.cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                        No follow-up cases match the current filter selection.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  queueData.cases.map((caseItem) => {
                    const initials = getInitials(caseItem.childName);
                    const formattedName = formatChildName(caseItem.childName);

                    return (
                      <TableRow key={caseItem.id}>
                        {/* Case ID */}
                        <TableCell className="fup-col-case-id">
                          <code style={{
                            fontSize: 'var(--font-size-xs)',
                            backgroundColor: 'var(--color-neutral-100)',
                            color: 'var(--color-primary-900)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap'
                          }}>
                            {caseItem.id}
                          </code>
                        </TableCell>

                        {/* Child with Avatar */}
                        <TableCell className="fup-col-child">
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
                              {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                {formattedName}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                {[caseItem.childId, caseItem.barangay].filter(Boolean).filter((v) => v !== '—').join(' • ')}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Action Type */}
                        <TableCell className="fup-col-type">
                          <Badge variant={getActionTypeVariant(caseItem.actionType)} dot={false} size="sm">
                            {caseItem.actionType}
                          </Badge>
                        </TableCell>

                        {/* Reason & Description */}
                        <TableCell className="fup-col-reason">
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                            {caseItem.reason}
                          </div>
                          {caseItem.actionTaken && (
                            <div style={{ fontSize: 'var(--font-size-xs)', color: '#047857', marginTop: '0.25rem', fontWeight: 500 }}>
                              ✓ Action: {caseItem.actionTaken}
                            </div>
                          )}
                        </TableCell>

                        {/* Assigned Worker */}
                        <TableCell className="fup-col-worker">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {caseItem.assignedWorker}
                            </span>
                            {caseItem.workerContact && (
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                {caseItem.workerContact}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Due Date */}
                        <TableCell className="fup-col-due">
                          <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>
                            {caseItem.dueDate}
                          </span>
                        </TableCell>

                        {/* Category / Status */}
                        <TableCell className="fup-col-status">
                          <Badge
                            variant={getFollowUpCategoryVariant(caseItem.category || caseItem.status)}
                            icon={getFollowUpCategoryIcon(caseItem.category || caseItem.status)}
                            dot={!getFollowUpCategoryIcon(caseItem.category || caseItem.status)}
                            size="sm"
                          >
                            {caseItem.category || caseItem.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="fup-col-actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Eye}
                              onClick={() => {
                                setSelectedCaseId(caseItem.id);
                                setActiveTab('case-view');
                              }}
                              title="Inspect Full Child Case Timeline"
                            >
                              Case View
                            </Button>

                            {caseItem.category !== 'Completed' && caseItem.status !== 'Resolved' && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={Check}
                                onClick={() => {
                                  setResolvingCase(caseItem);
                                  setResolveForm({
                                    date: getPhilippinesDate(),
                                    actionTaken: '',
                                    notes: '',
                                    status: 'Completed',
                                  });
                                }}
                                title="Resolve Follow-Up Case"
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CREATE & ASSIGN FOLLOW-UP (CSWDO WORKER ASSIGNMENT)
          ========================================================================= */}
      {activeTab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {saveSuccessMsg && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#065f46',
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle2 size={20} className="flex-shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="health-record-form-card">
            <h4 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>
              Assign Early Support / Follow-Up Case to Worker
            </h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
              Turn monitoring findings into concrete action. Authorize child development workers or social workers to conduct home visits, caregiver orientations, or program endorsements.
            </p>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Select Child */}
              <div className="dev-form-group">
                <label className="dev-form-label">Target Child for Early Support</label>
                <select
                  className="health-select"
                  value={createForm.childId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    const kid = registeredChildren.find((item) => (item.id === cid || item.childId === cid));
                    const c = queueData.cases.find((item) => item.childId === cid);
                    setCreateForm({
                      ...createForm,
                      childId: cid,
                      childName: kid ? `${kid.firstName || ''} ${kid.lastName || ''}`.trim() : (c ? c.childName : ''),
                      barangay: kid ? (kid.barangay || '') : (c ? c.barangay : ''),
                      dayCareCenter: kid ? (kid.dayCareCenter || '') : (c ? c.dayCareCenter : ''),
                    });
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select Registered Child --</option>
                  {registeredChildren.map((kid) => {
                    const fullName = `${kid.firstName || ''} ${kid.lastName || ''}`.trim();
                    return (
                      <option key={kid.id || kid.childId} value={kid.id || kid.childId}>
                        {fullName} ({kid.id || kid.childId}) — {kid.barangay || 'San Fernando'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Grid 1: Action Type, Category, Due Date */}
              <div className="dev-metadata-grid">
                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Action Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="health-select"
                    value={createForm.actionType}
                    onChange={(e) => setCreateForm({ ...createForm, actionType: e.target.value })}
                  >
                    {ACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Queue Category <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="health-select"
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  >
                    <option value="Needs Attention">Needs Attention (Urgent)</option>
                    <option value="Pending">Pending (Scheduled Intake)</option>
                    <option value="Scheduled">Scheduled (Appointment Set)</option>
                  </select>
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Action Due Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="dev-input"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    required
                  />
                  {createErrors.dueDate && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{createErrors.dueDate}</span>
                  )}
                </div>
              </div>

              {/* Grid 2: Assigned Worker & Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Assigned Worker Name &amp; Title <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="dev-input"
                    value={createForm.assignedWorker}
                    onChange={(e) => setCreateForm({ ...createForm, assignedWorker: e.target.value })}
                    placeholder="e.g. Maria Santos, CDW I or CSWDO Social Worker"
                    required
                  />
                  {createErrors.assignedWorker && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                      {createErrors.assignedWorker}
                    </span>
                  )}
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">Worker Contact Number</label>
                  <input
                    type="text"
                    className="dev-input"
                    value={createForm.workerContact}
                    onChange={(e) => setCreateForm({ ...createForm, workerContact: e.target.value })}
                    placeholder="e.g. 0917-555-0142"
                  />
                </div>
              </div>

              {/* Reason for Follow-up */}
              <div className="dev-form-group">
                <label className="dev-form-label">
                  Reason for Early Support / Follow-Up <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="dev-textarea"
                  rows={2}
                  placeholder="Clearly state early support objective (e.g., coordinate physical coordination exercises with mother; verify day care admission intake)."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  required
                />
                {createErrors.reason && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{createErrors.reason}</span>
                )}
              </div>

              {/* Notes */}
              <div className="dev-form-group">
                <label className="dev-form-label">Action Plan &amp; Additional Guidance (Optional)</label>
                <textarea
                  className="dev-textarea"
                  rows={2}
                  placeholder="Record planned steps (e.g., provide CSWDO home activity booklet, coordinate with Barangay Health Station)."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Standard: Focus on early childhood care, family engagement, and educational support. Do not invent medical interventions.
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateForm({
                      childId: '',
                      childName: '',
                      barangay: '',
                      dayCareCenter: '',
                      reason: '',
                      assignedWorker: '',
                      workerContact: '',
                      dueDate: addDaysPHT(30),
                      category: 'Needs Attention',
                      actionType: 'Follow-up',
                      notes: '',
                    });
                    setCreateErrors({});
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Check}
                  disabled={isSubmittingCreate}
                >
                  {isSubmittingCreate ? 'Assigning...' : 'Assign Follow-Up to Worker'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CASE VIEW (TIMELINE DEEP-DIVE)
          ========================================================================= */}
      {activeTab === 'case-view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Case Selector Header */}
          <div className="health-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>
                Select Case for Timeline View:
              </span>
              <select
                className="health-select"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                style={{ minWidth: '340px' }}
              >
                {queueData.cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}: {c.childName} — {c.reason.slice(0, 45)}... [{c.category || c.status}]
                  </option>
                ))}
              </select>
            </div>

            {caseViewData && caseViewData.case && caseViewData.case.category !== 'Completed' && (
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={() => {
                  setResolvingCase(caseViewData.case);
                  setResolveForm({
                    date: getPhilippinesDate(),
                    actionTaken: '',
                    notes: '',
                    status: 'Completed',
                  });
                }}
              >
                Resolve Case
              </Button>
            )}
          </div>

          {(!caseViewData || !caseViewData.case) && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <ShieldAlert size={36} style={{ margin: '0 auto 0.75rem', color: '#94a3b8' }} />
              <h4 style={{ margin: '0 0 0.5rem', color: '#334155' }}>No Active Follow-Up Case Selected</h4>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Select an active case from the Queue tab or create a new follow-up referral to inspect the timeline.
              </p>
            </div>
          )}

          {caseViewData && caseViewData.case && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Left Column: Case Record Details */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: 'fit-content',
                }}
              >
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Case Identifier</div>
                  <h3 style={{ margin: '0.2rem 0', color: '#7e191b', fontSize: '1.25rem' }}>
                    {caseViewData.case.id}
                  </h3>
                  <span className={`fup-category-badge ${getCategoryClass(caseViewData.case.category)}`}>
                    {caseViewData.case.category}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Child Name &amp; ID:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {caseViewData.case.childName}
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#ba1607', fontWeight: 600 }}>
                      {caseViewData.case.childId}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Barangay &amp; Center:</span>
                    <div>{caseViewData.case.barangay}</div>
                    <div style={{ color: '#475569' }}>{caseViewData.case.dayCareCenter}</div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Action Type:</span>
                    <div>
                      <span className={`fup-action-chip ${getActionChipClass(caseViewData.case.actionType)}`}>
                        {caseViewData.case.actionType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Assigned Worker:</span>
                    <div style={{ fontWeight: 600 }}>{caseViewData.case.assignedWorker}</div>
                    <div style={{ color: '#94a3b8' }}>{caseViewData.case.workerContact}</div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Timeline Schedule:</span>
                    <div>Created: {caseViewData.case.createdDate}</div>
                    <div>Due: {caseViewData.case.dueDate}</div>
                    {caseViewData.case.resolvedDate && (
                      <div style={{ color: '#047857', fontWeight: 600 }}>
                        Resolved: {caseViewData.case.resolvedDate}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <span style={{ color: '#64748b' }}>Objective / Reason:</span>
                    <div style={{ color: '#1e293b', marginTop: '0.2rem' }}>
                      {caseViewData.case.reason}
                    </div>
                  </div>

                  {caseViewData.case.actionTaken && (
                    <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '6px' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>Action Taken:</span>
                      <div style={{ color: '#065f46', marginTop: '0.2rem' }}>
                        {caseViewData.case.actionTaken}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Complete Child Lifecycle Timeline */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>
                    Child Lifecycle Timeline: Mapping → Enrollment → Health → Development → Follow-ups
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    Comprehensive chronological trail demonstrating end-to-end follow-through on this persistent child record.
                  </p>
                </div>

                <div className="fup-timeline-list">
                  {caseViewData.timeline && caseViewData.timeline.map((node, i) => {
                    let IconComponent = Clock;
                    if (node.type === 'Follow-up') IconComponent = CalendarClock;
                    else if (node.type === 'Development') IconComponent = Brain;
                    else if (node.type === 'Health') IconComponent = HeartPulse;
                    else if (node.type === 'Enrollment') IconComponent = School;
                    else if (node.type === 'Mapping') IconComponent = Home;

                    return (
                      <div key={i} className="fup-timeline-node">
                        <div className="fup-timeline-marker">
                          <IconComponent size={13} style={{ color: '#7e191b' }} />
                        </div>
                        <div className="fup-timeline-header">
                          <span className="fup-timeline-title">{node.title}</span>
                          <span className="fup-timeline-date">{node.date}</span>
                        </div>
                        <p className="fup-timeline-desc">{node.description}</p>
                        {node.author && (
                          <span className="fup-timeline-author">Logged by: {node.author}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: RESOLVE FOLLOW-UP MODAL
          ========================================================================= */}
      {resolvingCase && (
        <div className="modal-backdrop" onClick={() => setResolvingCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: '#059669' }} />
                <h3 className="modal-title">Resolve Follow-Up Case</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setResolvingCase(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {resolvingCase.id} — {resolvingCase.childName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {[
                      resolvingCase.assignedWorker && `Assigned: ${resolvingCase.assignedWorker}`,
                      resolvingCase.reason && `Objective: ${resolvingCase.reason}`,
                    ].filter(Boolean).join(' • ')}
                  </div>
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Resolution Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="dev-input"
                    value={resolveForm.date}
                    onChange={(e) => setResolveForm({ ...resolveForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Action Taken &amp; Support Delivered <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    className="dev-textarea"
                    rows={3}
                    placeholder="Describe the action completed (e.g., conducted home visit with mother; provided fine-motor puzzle guide; confirmed day care attendance)."
                    value={resolveForm.actionTaken}
                    onChange={(e) => setResolveForm({ ...resolveForm, actionTaken: e.target.value })}
                    required
                  />
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">Additional Case Notes (Optional)</label>
                  <textarea
                    className="dev-textarea"
                    rows={2}
                    placeholder="Any follow-through notes or recommendations for the Day Care teacher."
                    value={resolveForm.notes}
                    onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" onClick={() => setResolvingCase(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Check}
                  disabled={isSubmittingResolve}
                >
                  {isSubmittingResolve ? 'Resolving...' : 'Confirm Resolution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FollowUpView;
