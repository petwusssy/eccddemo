import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Plus,
  Info,
  X,
  User,
  Building2,
  ChevronRight,
  RefreshCw,
  Layers,
  FileText,
  ShieldCheck,
  Check,
  CalendarClock,
  Eye,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { developmentService } from '../../services/developmentService';
import { officialFormsService } from '../../services/officialFormsService';
import { officialChecklistService } from '../../services/officialChecklistService';
import { barangaysList, dayCareCentersList } from '../../data/mockData';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';
import { OfficialEccdChecklistModal } from '../forms/OfficialEccdChecklistModal';
import { EccdManualReferenceModal } from '../forms/EccdManualReferenceModal';
import { getPhilippinesDate } from '../../utils/phTime';

const formatChildName = (name) => {
  if (!name) return '—';
  return String(name).toUpperCase();
};

const getInitials = (fullName, firstName, lastName) => {
  if (firstName && lastName) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }
  if (!fullName) return 'C';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || 'C';
};

const getDevBadgeVariant = (status) => {
  if (status === 'Assessment Completed') return 'success';
  if (status === 'Follow-up Required') return 'warning';
  if (status === 'Assessment Pending') return 'neutral';
  return 'neutral';
};

const getDevBadgeIcon = (status) => {
  if (status === 'Assessment Completed') return CheckCircle2;
  if (status === 'Follow-up Required') return AlertTriangle;
  if (status === 'Assessment Pending') return Clock;
  return null;
};

export function DevelopmentView({ onNavigate }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'session' | 'history'

  // Data states
  const [loading, setLoading] = useState(true);
  const [cohortData, setCohortData] = useState({
    counts: { completedAssessments: 0, pendingAssessments: 0, followUps: 0, dueAssessments: 0 },
    total: 0,
    children: [],
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected child for assessment session or history
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childDevDetails, setChildDevDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states for Assessment Session Metadata
  const [sessionForm, setSessionForm] = useState({
    assessmentDate: getPhilippinesDate(),
    assessmentCycle: 'Cycle 1 (Baseline - SY 2026–2027)',
    assessor: 'Maria Santos, CDW I',
    status: 'Assessment Completed', // 'Assessment Pending' | 'Assessment Completed' | 'Follow-up Required'
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modals
  const [quickAssessChild, setQuickAssessChild] = useState(null);
  const [viewHistoryModal, setViewHistoryModal] = useState(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [checklistChildId, setChecklistChildId] = useState('');
  const [selectedRecordType, setSelectedRecordType] = useState(null);

  // Automatic form selection logic based on Form 2 / child birthdate:
  // - 0 to 3.1 years old (<= 37 months) -> Child's Record 1 Modal
  // - 3.2 to 5.11 years old (38 to 71 months) -> Child's Record 2 Modal
  const handleOpenChecklistForChild = (targetChild, forcedRecord = null) => {
    if (!targetChild) return;
    const childId = targetChild.childId || targetChild.id;
    const f2 = officialFormsService.getForm2Data(childId);
    const birthDate = f2?.birthDate || targetChild.birthDate;

    let ageMonths = 36;
    if (birthDate) {
      const bdate = new Date(birthDate);
      const now = new Date();
      if (!isNaN(bdate.getTime())) {
        let months = (now.getFullYear() - bdate.getFullYear()) * 12 + (now.getMonth() - bdate.getMonth());
        if (now.getDate() < bdate.getDate()) months -= 1;
        ageMonths = Math.max(0, months);
      }
    } else if (targetChild.ageMonths !== undefined && targetChild.ageMonths !== null) {
      ageMonths = targetChild.ageMonths;
    } else if (targetChild.ageYears !== undefined) {
      ageMonths = targetChild.ageYears * 12;
    }

    const recordKey = forcedRecord || (ageMonths <= 37 ? 'record1' : 'record2');
    setChecklistChildId(childId);
    setSelectedRecordType(recordKey);
    setIsChecklistModalOpen(true);
  };

  // Load cohort data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await developmentService.getAssessments({
        status: statusFilter,
        barangay: barangayFilter,
        dayCareCenter: centerFilter,
        search: searchQuery,
      });
      setCohortData(data);
      if (!selectedChildId && data.children && data.children.length > 0) {
        setSelectedChildId(data.children[0].childId);
        setChecklistChildId(data.children[0].childId);
      }
    } catch (err) {
      console.error('Failed to load development assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, barangayFilter, centerFilter, searchQuery]);

  useEffect(() => {
    const handleStoreUpdate = () => {
      loadData();
      if (selectedChildId) loadChildDetails(selectedChildId);
    };
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    return () => window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
  }, [selectedChildId]);

  // Load child assessment details
  const loadChildDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const details = await developmentService.getChildDevelopment(id);
      setChildDevDetails(details);
    } catch (err) {
      console.error('Failed to load child development details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      loadChildDetails(selectedChildId);
    }
  }, [selectedChildId]);

  // Selected child object
  const currentChildProfile = useMemo(() => {
    return cohortData.children.find((c) => c.childId === selectedChildId) || null;
  }, [cohortData.children, selectedChildId]);

  // Submit assessment session
  const handleSaveAssessment = async (e) => {
    if (e) e.preventDefault();
    if (!sessionForm.assessor.trim()) {
      setFormErrors({ assessor: 'Assessor name is required.' });
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const child = currentChildProfile || {
        childId: selectedChildId,
        fullName: 'Enrolled Child',
      };

      await developmentService.recordAssessment(selectedChildId, {
        childName: child.fullName,
        barangay: child.barangay,
        dayCareCenter: child.dayCareCenter,
        assessmentDate: sessionForm.assessmentDate,
        assessmentCycle: sessionForm.assessmentCycle,
        assessor: sessionForm.assessor,
        status: sessionForm.status,
        notes: sessionForm.notes,
      });

      const followUpNotice =
        sessionForm.status === 'Follow-up Required'
          ? ' Case automatically queued into Follow-up Management queue.'
          : '';

      setSaveSuccessMsg(
        `ECCD Development Assessment recorded successfully for ${child.fullName} (${child.childId}). Status updated to "${sessionForm.status}" in Child 360° Profile & timeline.${followUpNotice}`
      );

      setSessionForm({
        assessmentDate: getPhilippinesDate(),
        assessmentCycle: 'Cycle 1 (Baseline - SY 2026–2027)',
        assessor: sessionForm.assessor,
        status: 'Assessment Completed',
        notes: '',
      });

      await loadData();
      await loadChildDetails(selectedChildId);

      setTimeout(() => {
        setSaveSuccessMsg('');
      }, 7000);
    } catch (err) {
      console.error('Failed to save assessment session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick assessment submit from modal
  const handleQuickAssessSubmit = async (e) => {
    e.preventDefault();
    if (!quickAssessChild) return;

    try {
      await developmentService.recordAssessment(quickAssessChild.childId, {
        childName: quickAssessChild.fullName,
        barangay: quickAssessChild.barangay,
        dayCareCenter: quickAssessChild.dayCareCenter,
        assessmentDate: quickAssessChild.inputDate || getPhilippinesDate(),
        assessmentCycle: quickAssessChild.inputCycle || 'Cycle 1 (Baseline - SY 2026–2027)',
        assessor: quickAssessChild.inputAssessor || 'Maria Santos, CDW I',
        status: quickAssessChild.inputStatus || 'Assessment Completed',
        notes: quickAssessChild.inputNotes || '',
      });

      setQuickAssessChild(null);
      await loadData();
      if (selectedChildId === quickAssessChild.childId) {
        await loadChildDetails(selectedChildId);
      }
    } catch (err) {
      console.error('Failed to submit quick assessment:', err);
    }
  };

  return (
    <div className="dev-module-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Phil-ECCD Developmental Assessment Checklist
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
          >
            <BookOpen size={14} />
            Checklist Manual
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenChecklistForChild(currentChildProfile || cohortData.children[0])}
          >
            + Start Assessment
          </Button>
        </div>
      </div>

      {/* 2. Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div
          className={`bento-stat-card card-success ${statusFilter === 'assessment completed' ? 'is-active' : ''}`}
          onClick={() =>
            setStatusFilter(statusFilter === 'assessment completed' ? 'all' : 'assessment completed')
          }
          title="Filter completed assessments"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Assessments
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
              {cohortData.counts.completedAssessments}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div
          className={`bento-stat-card card-warning ${statusFilter === 'assessment pending' ? 'is-active' : ''}`}
          onClick={() =>
            setStatusFilter(statusFilter === 'assessment pending' ? 'all' : 'assessment pending')
          }
          title="Filter pending assessments"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Assessments
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
              {cohortData.counts.pendingAssessments}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <Clock size={18} />
          </div>
        </div>

        <div
          className={`bento-stat-card card-danger ${statusFilter === 'follow-up required' ? 'is-active' : ''}`}
          onClick={() =>
            setStatusFilter(statusFilter === 'follow-up required' ? 'all' : 'follow-up required')
          }
          title="Filter assessments flagged for follow-up"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Follow-ups Needed
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>
              {cohortData.counts.followUps}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          className="bento-stat-card card-primary"
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
          title="Total due assessments in current cycle"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Due Baseline Rate
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-800)', marginTop: '2px' }}>
              {cohortData.counts.dueAssessments}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <CalendarClock size={18} />
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Navigation */}
      <div className="dev-tabs-nav">
        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'directory' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Layers size={16} />
          Development Dashboard &amp; Cohort
        </button>

        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'session' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          <CheckSquare size={16} />
          Start Assessment
        </button>

        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FileText size={16} />
          Previous Assessments &amp; Timeline
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DEVELOPMENT DASHBOARD & COHORT DIRECTORY
          ========================================================================= */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Toolbar & Filters */}
          <div className="health-toolbar">
            <div className="health-toolbar-left">
              <div className="health-search-box">
                <Search size={16} className="health-search-icon" />
                <input
                  type="text"
                  placeholder="Search child name, ECCD Child ID, barangay..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="health-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Development Statuses</option>
                <option value="Assessment Completed">Assessment Completed</option>
                <option value="Assessment Pending">Assessment Pending</option>
                <option value="Follow-up Required">Follow-up Required</option>
              </select>

              <select
                className="health-select"
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
              >
                <option value="all">All Barangays</option>
                {barangaysList.map((b) => (
                  <option key={b.id} value={b.name.replace('Barangay ', '')}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                className="health-select"
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
              >
                <option value="all">All Day Care Centers</option>
                {dayCareCentersList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
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
                onClick={() => handleOpenChecklistForChild(currentChildProfile || cohortData.children[0])}
              >
                + Start Assessment
              </Button>
            </div>
          </div>

          {/* Cohort Table */}
          <div className="table-container mobile-table-to-cards">
            <table className="table dev-registry-table">
              <TableHead>
                <TableRow>
                  <TableHeader className="dev-col-child">Child</TableHeader>
                  <TableHeader className="dev-col-id">ECCD ID</TableHeader>
                  <TableHeader className="dev-col-brgy">Barangay</TableHeader>
                  <TableHeader className="dev-col-center">Day Care Center</TableHeader>
                  <TableHeader className="dev-col-cycle">Cycle</TableHeader>
                  <TableHeader className="dev-col-last">Last Assessment</TableHeader>
                  <TableHeader className="dev-col-status">Development Status</TableHeader>
                  <TableHeader className="dev-col-actions" style={{ textAlign: 'right' }}>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--color-primary-800)' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading development cohort...</p>
                    </TableCell>
                  </TableRow>
                ) : cohortData.children.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                        No children match the selected assessment filters.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cohortData.children.map((child) => {
                    const initials = getInitials(child.fullName, child.firstName, child.lastName);
                    const formattedName = formatChildName(child.fullName);

                    return (
                      <TableRow key={child.childId}>
                        {/* Child Name & Avatar */}
                        <TableCell className="dev-col-child">
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
                              {[child.ageDisplay, child.sex].filter(Boolean).filter((v) => v !== '—').length > 0 && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                  {[child.ageDisplay, child.sex].filter(Boolean).filter((v) => v !== '—').join(' • ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* ECCD ID */}
                        <TableCell className="dev-col-id">
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
                            {child.childId}
                          </code>
                        </TableCell>

                        {/* Barangay */}
                        <TableCell className="dev-col-brgy">
                          <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{child.barangay}</span>
                        </TableCell>

                        {/* Day Care Center */}
                        <TableCell className="dev-col-center">
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {child.dayCareCenter}
                          </span>
                        </TableCell>

                        {/* Cycle */}
                        <TableCell className="dev-col-cycle">
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-neutral-100)',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap'
                          }}>
                            {child.cycle || 'Cycle 1'}
                          </span>
                        </TableCell>

                        {/* Last Assessment */}
                        <TableCell className="dev-col-last">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {child.lastAssessmentDate || 'None administered'}
                            </span>
                            {child.assessor && (
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                By {child.assessor}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Development Status */}
                        <TableCell className="dev-col-status">
                          <Badge
                            variant={getDevBadgeVariant(child.status)}
                            icon={getDevBadgeIcon(child.status)}
                            dot={!getDevBadgeIcon(child.status)}
                            size="sm"
                          >
                            {child.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="dev-col-actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={FileText}
                              onClick={() => {
                                setViewHistoryModal(child);
                                loadChildDetails(child.childId);
                              }}
                              title="View Assessment History"
                            >
                              History
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckSquare}
                              onClick={() => handleOpenChecklistForChild(child)}
                              title="Conduct ECCD Checklist"
                            >
                              Checklist
                            </Button>
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
          TAB 2: START ASSESSMENT (ACTIVE ASSESSMENT SESSION)
          ========================================================================= */}
      {activeTab === 'session' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

          {/* Child Picker & Confirmation Card */}
          <div className="health-record-form-card">
            <div className="health-form-group">
              <label className="health-form-label">Select Enrolled Child for Assessment Session</label>
              <select
                className="health-select"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                style={{ width: '100%', fontSize: '0.9375rem' }}
              >
                {cohortData.children.map((c) => (
                  <option key={c.childId} value={c.childId}>
                    {c.fullName} ({c.childId}) — {c.dayCareCenter} [{c.status}]
                  </option>
                ))}
              </select>
            </div>

            {currentChildProfile && (
              <div className="health-child-confirm-box">
                <div className="health-child-profile-group">
                  <div className="health-child-avatar">
                    {currentChildProfile.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="health-child-details">
                    <h4>{currentChildProfile.fullName}</h4>
                    <div className="health-child-meta">
                      <span>ECCD Child ID: <strong>{currentChildProfile.childId}</strong></span>
                      <span>•</span>
                      <span>Barangay: <strong>{currentChildProfile.barangay}</strong></span>
                      <span>•</span>
                      <span>Center: <strong>{currentChildProfile.dayCareCenter}</strong></span>
                      <span>•</span>
                      <span>Age: <strong>{currentChildProfile.ageDisplay}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Status</div>
                  <span
                    className={`dev-status-badge ${
                      currentChildProfile.status === 'Assessment Completed'
                        ? 'completed'
                        : currentChildProfile.status === 'Follow-up Required'
                        ? 'followup'
                        : 'pending'
                    }`}
                  >
                    {currentChildProfile.status}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {currentChildProfile.cycle || 'Cycle 1'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------
          {/* -------------------------------------------------------------
              2. OFFICIAL ECCD CHECKLIST ASSESSMENTS
              ------------------------------------------------------------- */}
          <div className="dev-integration-box">
            <div className="dev-integration-header">
              <div className="dev-integration-title">
                <ShieldCheck size={18} style={{ color: '#7e191b' }} />
                <span>OFFICIAL ECCD CHECKLIST ASSESSMENTS</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#166534',
                  background: '#dcfce7',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '4px',
                }}
              >
                Standard Form Active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="dev-placeholder-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#7e191b', fontSize: '13px' }}>
                    Child's Record 1 (Form 2)
                  </span>
                  <span style={{ fontSize: '11px', color: '#ba1607', background: '#fdf2f2', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Ages 0 to 3.0 yrs
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  7 developmental domains for infants and toddlers (115 standardized items).
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckSquare}
                  onClick={() => handleOpenChecklistForChild(currentChildProfile, 'record1')}
                >
                  Start Record 1 Assessment
                </Button>
              </div>

              <div className="dev-placeholder-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#7e191b', fontSize: '13px' }}>
                    Child's Record 2 (Form 2)
                  </span>
                  <span style={{ fontSize: '11px', color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Ages 3.2 to 5.11 yrs
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  7 developmental domains for preschool children (109 standardized items).
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckSquare}
                  onClick={() => handleOpenChecklistForChild(currentChildProfile, 'record2')}
                >
                  Start Record 2 Assessment
                </Button>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              3. OFFICIAL SCORING CONVERSION STATUS
              ------------------------------------------------------------- */}
          <div className="dev-scoring-box">
            <div className="dev-scoring-header">
              <div className="dev-scoring-title">
                <TrendingUp size={18} style={{ color: '#ba1607' }} />
                <span>OFFICIAL ECCD COUNCIL SCORING MATRIX</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#ba1607',
                  background: '#e0f2fe',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '4px',
                }}
              >
                Norms Table Connected
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>Domain Raw Scores are automatically converted to Scaled Scores (1–19) and Standard Score (Mean 100, SD 15) inside the digital checklist.</span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              4. ASSESSMENT METADATA FORM
              ------------------------------------------------------------- */}
          <div className="dev-metadata-card">
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Assessment Session Metadata
            </h4>

            <form onSubmit={handleSaveAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="dev-metadata-grid">
                {/* Assessment Date */}
                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Assessment Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="dev-input"
                    value={sessionForm.assessmentDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, assessmentDate: e.target.value })}
                    required
                  />
                </div>

                {/* Assessor */}
                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Assessor Name &amp; Designation <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="dev-input"
                    placeholder="e.g. Maria Santos, CDW I"
                    value={sessionForm.assessor}
                    onChange={(e) => setSessionForm({ ...sessionForm, assessor: e.target.value })}
                    required
                  />
                  {formErrors.assessor && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.assessor}</span>
                  )}
                </div>

                {/* Status (Neutral Prototype States) */}
                <div className="dev-form-group">
                  <label className="dev-form-label">
                    Session Status (Neutral Protocol) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="health-select"
                    value={sessionForm.status}
                    onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Assessment Completed">Assessment Completed</option>
                    <option value="Assessment Pending">Assessment Pending</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                  </select>
                </div>
              </div>

              {/* Assessment Cycle */}
              <div className="dev-form-group">
                <label className="dev-form-label">Assessment Cycle</label>
                <select
                  className="health-select"
                  value={sessionForm.assessmentCycle}
                  onChange={(e) => setSessionForm({ ...sessionForm, assessmentCycle: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="Cycle 1 (Baseline - SY 2026–2027)">Cycle 1 (Baseline - SY 2026–2027)</option>
                  <option value="Cycle 2 (Mid-Year Progress)">Cycle 2 (Mid-Year Progress)</option>
                  <option value="Cycle 3 (Year-End Evaluation)">Cycle 3 (Year-End Evaluation)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="dev-form-group">
                <label className="dev-form-label">Session Notes &amp; Observations</label>
                <textarea
                  className="dev-textarea"
                  placeholder="Record assessment administration context (e.g., child cooperative, demonstrated interest in puzzles, parent present during session). Do not record medical or clinical diagnoses."
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Neutral procedural logging only.
                </span>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSessionForm({
                      assessmentDate: getPhilippinesDate(),
                      assessmentCycle: 'Cycle 1 (Baseline - SY 2026–2027)',
                      assessor: 'Maria Santos, CDW I',
                      status: 'Assessment Completed',
                      notes: '',
                    });
                  }}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Check}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Assessment...' : 'Commit Assessment Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PREVIOUS ASSESSMENTS & TIMELINE
          ========================================================================= */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Child Picker */}
          <div className="health-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Select Child:</span>
              <select
                className="health-select"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                style={{ minWidth: '320px' }}
              >
                {cohortData.children.map((c) => (
                  <option key={c.childId} value={c.childId}>
                    {c.fullName} ({c.childId}) — {c.barangay}
                  </option>
                ))}
              </select>
            </div>

            {childDevDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Current Status:</span>
                <span
                  className={`dev-status-badge ${
                    childDevDetails.status === 'Assessment Completed'
                      ? 'completed'
                      : childDevDetails.status === 'Follow-up Required'
                      ? 'followup'
                      : 'pending'
                  }`}
                >
                  {childDevDetails.status}
                </span>
              </div>
            )}
          </div>

          {/* Chronological Table */}
          <div className="health-table-card mobile-table-to-cards">
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Chronological Assessment History
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Historical assessment cycles and administration records
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setActiveTab('session')}
              >
                Start New Assessment
              </Button>
            </div>

            <table className="health-table">
              <thead>
                <tr>
                  <th>Assessment Cycle</th>
                  <th>Date</th>
                  <th>Assessor</th>
                  <th>Status</th>
                  <th>Session Notes</th>
                  <th>Integration Points</th>
                </tr>
              </thead>
              <tbody>
                {detailsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Loading assessment history...
                    </td>
                  </tr>
                ) : !childDevDetails || !childDevDetails.history || childDevDetails.history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No assessment sessions recorded for this child.
                    </td>
                  </tr>
                ) : (
                  childDevDetails.history.map((record) => {
                    const badgeClass =
                      record.status === 'Assessment Completed'
                        ? 'completed'
                        : record.status === 'Follow-up Required'
                        ? 'followup'
                        : 'pending';

                    return (
                      <tr key={record.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {record.assessmentCycle}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{record.assessmentDate}</td>
                        <td>{record.assessor}</td>
                        <td>
                          <span className={`dev-status-badge ${badgeClass}`}>{record.status}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            {record.notes || 'Assessment session logged.'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontFamily: 'monospace',
                              background: '#f1f5f9',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              color: '#ba1607',
                            }}
                          >
                            Placeholder Attached
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: QUICK ASSESSMENT MODAL
          ========================================================================= */}
      {quickAssessChild && (
        <div className="modal-backdrop" onClick={() => setQuickAssessChild(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} style={{ color: '#7e191b' }} />
                <h3 className="modal-title">Administer ECCD Assessment</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setQuickAssessChild(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAssessSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{quickAssessChild.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {quickAssessChild.childId} • {quickAssessChild.barangay} • {quickAssessChild.dayCareCenter}
                  </div>
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">Assessment Cycle</label>
                  <select
                    className="health-select"
                    value={quickAssessChild.inputCycle}
                    onChange={(e) =>
                      setQuickAssessChild({ ...quickAssessChild, inputCycle: e.target.value })
                    }
                  >
                    <option value="Cycle 1 (Baseline - SY 2026–2027)">Cycle 1 (Baseline - SY 2026–2027)</option>
                    <option value="Cycle 2 (Mid-Year Progress)">Cycle 2 (Mid-Year Progress)</option>
                    <option value="Cycle 3 (Year-End Evaluation)">Cycle 3 (Year-End Evaluation)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="dev-form-group">
                    <label className="dev-form-label">Date</label>
                    <input
                      type="date"
                      className="dev-input"
                      value={quickAssessChild.inputDate}
                      onChange={(e) =>
                        setQuickAssessChild({ ...quickAssessChild, inputDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="dev-form-group">
                    <label className="dev-form-label">Status (Neutral)</label>
                    <select
                      className="health-select"
                      value={quickAssessChild.inputStatus}
                      onChange={(e) =>
                        setQuickAssessChild({ ...quickAssessChild, inputStatus: e.target.value })
                      }
                    >
                      <option value="Assessment Completed">Assessment Completed</option>
                      <option value="Assessment Pending">Assessment Pending</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                    </select>
                  </div>
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">Assessor</label>
                  <input
                    type="text"
                    className="dev-input"
                    value={quickAssessChild.inputAssessor}
                    onChange={(e) =>
                      setQuickAssessChild({ ...quickAssessChild, inputAssessor: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="dev-form-group">
                  <label className="dev-form-label">Notes</label>
                  <textarea
                    className="dev-textarea"
                    rows={2}
                    placeholder="Assessment session observations. No medical diagnoses."
                    value={quickAssessChild.inputNotes}
                    onChange={(e) =>
                      setQuickAssessChild({ ...quickAssessChild, inputNotes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" onClick={() => setQuickAssessChild(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" icon={Check}>
                  Save &amp; Update Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW ASSESSMENT HISTORY MODAL
          ========================================================================= */}
      {viewHistoryModal && (
        <div className="modal-backdrop" onClick={() => setViewHistoryModal(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '920px', width: '92vw' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: '#7e191b' }} />
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>
                    Assessment Record: {viewHistoryModal.fullName}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {viewHistoryModal.childId} • {viewHistoryModal.barangay}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewHistoryModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table className="health-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Date</th>
                      <th>Assessor</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childDevDetails && childDevDetails.history && childDevDetails.history.length > 0 ? (
                      childDevDetails.history.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.assessmentCycle}</td>
                          <td>{r.assessmentDate}</td>
                          <td>{r.assessor}</td>
                          <td>
                            <span
                              className={`dev-status-badge ${
                                r.status === 'Assessment Completed'
                                  ? 'completed'
                                  : r.status === 'Follow-up Required'
                                  ? 'followup'
                                  : 'pending'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td style={{ color: '#64748b' }}>{r.notes || 'Session logged.'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          No historical assessments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="outline" onClick={() => setViewHistoryModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={CheckSquare}
                onClick={() => {
                  const target = viewHistoryModal;
                  setViewHistoryModal(null);
                  setQuickAssessChild({
                    ...target,
                    inputDate: getPhilippinesDate(),
                    inputCycle: 'Cycle 1 (Baseline - SY 2026–2027)',
                    inputAssessor: 'Maria Santos, CDW I',
                    inputStatus: 'Assessment Completed',
                    inputNotes: '',
                  });
                }}
              >
                Administer Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Official ECCD Checklist Assessment Modal */}
      {isChecklistModalOpen && (
        <OfficialEccdChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => {
            setIsChecklistModalOpen(false);
            setSelectedRecordType(null);
          }}
          childId={checklistChildId}
          initialRecordType={selectedRecordType}
          onSuccess={async () => {
            await loadData();
            await loadChildDetails(checklistChildId);
          }}
        />
      )}

      {/* Official ECCD Manual Reference Modal */}
      {isManualModalOpen && (
        <EccdManualReferenceModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}
    </div>
  );
}

export default DevelopmentView;
