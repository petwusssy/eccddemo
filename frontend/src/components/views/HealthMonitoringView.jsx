import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  TrendingUp,
  LineChart as LineChartIcon,
  ChevronRight,
  ShieldAlert,
  Info,
  X,
  User,
  Building2,
  Calendar,
  Scale,
  Ruler,
  Check,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { healthMonitoringService } from '../../services/healthMonitoringService';
import { followUpService } from '../../services/followUpService';
import { barangaysList, dayCareCentersList } from '../../data/mockData';
import { getPhilippinesDate, addDaysPHT } from '../../utils/phTime';
import Button from '../ui/Button';

export function HealthMonitoringView({ onNavigate }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'record' | 'trend'

  // Data states
  const [loading, setLoading] = useState(true);
  const [monitoringData, setMonitoringData] = useState({
    counts: { monitoringDue: 0, completedThisMonth: 0, overdue: 0, upToDate: 0 },
    total: 0,
    children: [],
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected child for recording or trend viewing
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childHealthDetails, setChildHealthDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states for Recording Measurement
  const [formData, setFormData] = useState({
    date: getPhilippinesDate(),
    heightCm: '',
    weightKg: '',
    nutritionalStatus: 'Normal',
    recordedBy: 'Maria Santos, CDW I',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modals
  const [quickRecordChild, setQuickRecordChild] = useState(null);
  const [trendModalChild, setTrendModalChild] = useState(null);

  // Chart view mode
  const [chartMetric, setChartMetric] = useState('combined'); // 'combined' | 'height' | 'weight'

  // Fetch monitoring list
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await healthMonitoringService.getDueMonitoring({
        status: statusFilter,
        barangay: barangayFilter,
        dayCareCenter: centerFilter,
        search: searchQuery,
      });
      setMonitoringData(data);
      if (!selectedChildId && data.children && data.children.length > 0) {
        setSelectedChildId(data.children[0].childId);
      }
    } catch (err) {
      console.error('Failed to load health monitoring data:', err);
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

  // Load selected child health details
  const loadChildDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const details = await healthMonitoringService.getChildHealth(id);
      setChildHealthDetails(details);
    } catch (err) {
      console.error('Failed to load child health details:', err);
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
    return monitoringData.children.find((c) => c.childId === selectedChildId) || null;
  }, [monitoringData.children, selectedChildId]);

  // Form input validation
  const validateForm = (data) => {
    const errs = {};
    if (!data.date) errs.date = 'Measurement date is required.';
    const h = parseFloat(data.heightCm);
    if (isNaN(h) || h < 40 || h > 140) {
      errs.heightCm = 'Height must be between 40.0 cm and 140.0 cm.';
    }
    const w = parseFloat(data.weightKg);
    if (isNaN(w) || w < 3 || w > 45) {
      errs.weightKg = 'Weight must be between 3.0 kg and 45.0 kg.';
    }
    return errs;
  };

  // Submit new health record
  const handleSaveMeasurement = async (e) => {
    if (e) e.preventDefault();
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const child = currentChildProfile || {
        childId: selectedChildId,
        fullName: 'Enrolled Child',
      };

      await healthMonitoringService.recordChildHealth(selectedChildId, {
        childName: child.fullName,
        barangay: child.barangay,
        dayCareCenter: child.dayCareCenter,
        date: formData.date,
        heightCm: formData.heightCm,
        weightKg: formData.weightKg,
        nutritionalStatus: formData.nutritionalStatus,
        recordedBy: formData.recordedBy,
        notes: formData.notes,
      });

      // Auto-trigger urgent follow-up if Underweight or Severely Underweight
      if (formData.nutritionalStatus === 'Underweight' || formData.nutritionalStatus === 'Severely Underweight') {
        try {
          await followUpService.createFollowUp({
            childId: selectedChildId,
            childName: child.fullName,
            barangay: child.barangay || 'City of San Fernando',
            dayCareCenter: child.dayCareCenter || 'Child Development Center',
            reason: `Nutritional Alert: Child flagged as ${formData.nutritionalStatus} during OPT Plus.`,
            priority: 'Urgent',
            status: 'Needs Attention',
            category: 'Needs Attention',
            actionType: 'Monitoring',
            assignedWorker: formData.recordedBy || 'Maria Santos, CDW I',
            dueDate: addDaysPHT(14),
            notes: `Urgent nutritional intervention required. Recorded: ${formData.weightKg} kg, ${formData.heightCm} cm. Status: ${formData.nutritionalStatus}.`,
          });
        } catch (err) {
          console.warn('Failed to dispatch nutritional follow-up:', err);
        }
      }

      setSaveSuccessMsg(
        `Measurement recorded successfully for ${child.fullName} (${child.childId}). Child 360° health status updated to Up to Date and timeline logged.`
      );
      setFormData({
        date: getPhilippinesDate(),
        heightCm: '',
        weightKg: '',
        nutritionalStatus: 'Normal',
        recordedBy: formData.recordedBy,
        notes: '',
      });

      // Refresh list & child details
      await loadData();
      await loadChildDetails(selectedChildId);

      setTimeout(() => {
        setSaveSuccessMsg('');
      }, 6000);
    } catch (err) {
      console.error('Failed to save measurement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick record submit from modal
  const handleSaveQuickRecord = async (e) => {
    e.preventDefault();
    if (!quickRecordChild) return;

    const h = parseFloat(quickRecordChild.inputHeight);
    const w = parseFloat(quickRecordChild.inputWeight);

    if (isNaN(h) || h < 40 || isNaN(w) || w < 3) {
      alert('Please enter valid numeric height (cm) and weight (kg).');
      return;
    }

    try {
      const nutStatus = quickRecordChild.inputNutritionalStatus || 'Normal';
      await healthMonitoringService.recordChildHealth(quickRecordChild.childId, {
        childName: quickRecordChild.fullName,
        barangay: quickRecordChild.barangay,
        dayCareCenter: quickRecordChild.dayCareCenter,
        date: quickRecordChild.inputDate || getPhilippinesDate(),
        heightCm: h,
        weightKg: w,
        nutritionalStatus: nutStatus,
        recordedBy: quickRecordChild.inputWorker || 'CSWDO CDW',
        notes: quickRecordChild.inputNotes || '',
      });

      // Auto-trigger urgent follow-up if Underweight or Severely Underweight
      if (nutStatus === 'Underweight' || nutStatus === 'Severely Underweight') {
        try {
          await followUpService.createFollowUp({
            childId: quickRecordChild.childId,
            childName: quickRecordChild.fullName,
            barangay: quickRecordChild.barangay || 'City of San Fernando',
            dayCareCenter: quickRecordChild.dayCareCenter || 'Child Development Center',
            reason: `Nutritional Alert: Child flagged as ${nutStatus} during OPT Plus.`,
            priority: 'Urgent',
            status: 'Needs Attention',
            category: 'Needs Attention',
            actionType: 'Monitoring',
            assignedWorker: quickRecordChild.inputWorker || 'CSWDO CDW',
            dueDate: addDaysPHT(14),
            notes: `Urgent nutritional intervention required. Recorded: ${w} kg, ${h} cm. Status: ${nutStatus}.`,
          });
        } catch (err) {
          console.warn('Failed to dispatch nutritional follow-up:', err);
        }
      }

      setQuickRecordChild(null);
      await loadData();
      await loadChildDetails(quickRecordChild.childId);
    } catch (err) {
      console.error('Failed to record quick measurement:', err);
    }
  };

  return (
    <div className="health-module-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Child Health &amp; Nutrition Monitoring
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-1) 0 0 0' }}>
            Monthly Operation Timbang (OPT Plus) height and weight surveillance
          </p>
        </div>
      </div>

      {/* 2. Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div
          onClick={() => setStatusFilter(statusFilter === 'due' ? 'all' : 'due')}
          style={{
            background: statusFilter === 'due' ? 'var(--color-primary-50)' : 'var(--surface-primary)',
            border: statusFilter === 'due' ? '1.5px solid var(--color-primary-500)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
          }}
          title="Filter children due for monthly check"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monitoring Due
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
              {monitoringData.counts.monitoringDue}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-50)',
              color: 'var(--color-warning-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarClock size={18} />
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
          }}
          title="Children monitored this calendar month"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed (Month)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
              {monitoringData.counts.completedThisMonth}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-50)',
              color: 'var(--color-success-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          style={{
            background: statusFilter === 'overdue' ? '#fef2f2' : 'var(--surface-primary)',
            border: statusFilter === 'overdue' ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
          }}
          title="Filter children overdue for monthly check"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overdue (&gt;45d)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>
              {monitoringData.counts.overdue}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'up to date' ? 'all' : 'up to date')}
          style={{
            background: statusFilter === 'up to date' ? 'var(--color-primary-50)' : 'var(--surface-primary)',
            border: statusFilter === 'up to date' ? '1.5px solid var(--color-primary-500)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
          }}
          title="Filter children with up-to-date measurements"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Up to Date
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary-600)', marginTop: '2px' }}>
              {monitoringData.counts.upToDate}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-50)',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse size={18} />
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Navigation */}
      <div className="health-tabs-nav">
        <button
          type="button"
          className={`health-tab-btn ${activeTab === 'directory' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Clock size={16} />
          Monthly Monitoring Directory &amp; Due List
        </button>

        <button
          type="button"
          className={`health-tab-btn ${activeTab === 'record' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <Scale size={16} />
          Record Child Measurement (Intake)
        </button>

        <button
          type="button"
          className={`health-tab-btn ${activeTab === 'trend' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('trend')}
        >
          <LineChartIcon size={16} />
          Growth Trend &amp; History Explorer
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MONTHLY MONITORING DIRECTORY & DUE LIST
          ========================================================================= */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Toolbar & Filters */}
          <div className="health-toolbar">
            <div className="health-toolbar-left">
              {/* Search Box */}
              <div className="health-search-box">
                <Search size={16} className="health-search-icon" />
                <input
                  type="text"
                  placeholder="Search child name, ECCD Child ID, barangay..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="health-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Monitoring Statuses</option>
                <option value="Due">Due for Check</option>
                <option value="Overdue">Overdue (&gt;45 days)</option>
                <option value="Up to Date">Up to Date</option>
              </select>

              {/* Barangay Filter */}
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

              {/* Center Filter */}
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
                onClick={() => setActiveTab('record')}
              >
                Record Measurement
              </Button>
            </div>
          </div>

          {/* Monitoring Table */}
          <div className="health-table-card mobile-table-to-cards">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>ECCD ID</th>
                  <th>Barangay</th>
                  <th>Day Care Center</th>
                  <th>Last Measurement</th>
                  <th>Height &amp; Weight</th>
                  <th>Nutritional Status</th>
                  <th>Monitoring Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ color: '#64748b', margin: 0 }}>Loading health monitoring records...</p>
                    </td>
                  </tr>
                ) : monitoringData.children.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <p style={{ color: '#64748b', fontSize: '0.9375rem', margin: 0 }}>
                        No children match the selected health monitoring filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  monitoringData.children.map((child) => {
                    const badgeClass =
                      child.status === 'Up to Date'
                        ? 'uptodate'
                        : child.status === 'Overdue'
                        ? 'overdue'
                        : 'due';

                    const nutStatus = child.nutritionalStatus || 'Normal Weight';
                    const nutBadgeClass =
                      nutStatus.includes('Severely')
                        ? 'overdue'
                        : nutStatus.includes('Underweight')
                        ? 'overdue'
                        : nutStatus.includes('Overweight')
                        ? 'due'
                        : 'uptodate';

                    return (
                      <tr key={child.childId}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {child.fullName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {child.ageDisplay} • {child.sex}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f2744' }}>
                            {child.childId}
                          </span>
                        </td>
                        <td>{child.barangay}</td>
                        <td>
                          <span style={{ fontSize: '0.8125rem' }}>{child.dayCareCenter}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>
                              {child.lastMeasurementDate || 'None recorded'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {child.daysSinceLastCheck !== undefined
                                ? `${child.daysSinceLastCheck} days ago`
                                : ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#0284c7' }}>
                              {child.lastHeightCm ? `${child.lastHeightCm} cm` : '—'}
                            </span>
                            <span style={{ color: '#cbd5e1' }}>/</span>
                            <span style={{ fontWeight: 600, color: '#0d9488' }}>
                              {child.lastWeightKg ? `${child.lastWeightKg} kg` : '—'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`health-status-badge ${nutBadgeClass}`}>
                            {nutStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`health-status-badge ${badgeClass}`}>
                            {child.status === 'Up to Date' && <CheckCircle2 size={12} />}
                            {child.status === 'Due' && <Clock size={12} />}
                            {child.status === 'Overdue' && <AlertTriangle size={12} />}
                            {child.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                setTrendModalChild(child);
                                loadChildDetails(child.childId);
                              }}
                              title="View Growth Trend & History"
                            >
                              <TrendingUp size={16} style={{ marginRight: '0.25rem' }} />
                              Trend
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                setQuickRecordChild({
                                  ...child,
                                  inputDate: getPhilippinesDate(),
                                  inputHeight: child.lastHeightCm || '',
                                  inputWeight: child.lastWeightKg || '',
                                  inputNutritionalStatus: child.nutritionalStatus || 'Normal',
                                  inputWorker: 'Maria Santos, CDW I',
                                  inputNotes: '',
                                });
                              }}
                            >
                              <Scale size={16} style={{ marginRight: '0.25rem' }} />
                              Weigh
                            </button>
                          </div>
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
          TAB 2: RECORD CHILD MEASUREMENT (INTAKE FORM)
          ========================================================================= */}
      {activeTab === 'record' && (
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
            {/* Child Selector */}
            <div className="health-form-group">
              <label className="health-form-label">Select Enrolled Child for Monthly Measurement</label>
              <select
                className="health-select"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                style={{ width: '100%', fontSize: '0.9375rem' }}
              >
                {monitoringData.children.map((c) => (
                  <option key={c.childId} value={c.childId}>
                    {c.fullName} ({c.childId}) — {c.dayCareCenter} [{c.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Child Confirmation Card */}
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
                    className={`health-status-badge ${
                      currentChildProfile.status === 'Up to Date'
                        ? 'uptodate'
                        : currentChildProfile.status === 'Overdue'
                        ? 'overdue'
                        : 'due'
                    }`}
                  >
                    {currentChildProfile.status}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Last: {currentChildProfile.lastHeightCm || '—'} cm / {currentChildProfile.lastWeightKg || '—'} kg
                  </div>
                </div>
              </div>
            )}

            {/* Intake Fields */}
            <form onSubmit={handleSaveMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="health-form-grid">
                {/* Measurement Date */}
                <div className="health-form-group">
                  <label className="health-form-label">
                    Measurement Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="health-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  {formErrors.date && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.date}</span>
                  )}
                </div>

                {/* Height */}
                <div className="health-form-group">
                  <label className="health-form-label">
                    Height (Centimeters / cm) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 96.5"
                      className="health-input"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.8125rem',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                      }}
                    >
                      cm
                    </span>
                  </div>
                  {formErrors.heightCm && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.heightCm}</span>
                  )}
                </div>

                {/* Weight */}
                <div className="health-form-group">
                  <label className="health-form-label">
                    Weight (Kilograms / kg) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 14.2"
                      className="health-input"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.8125rem',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                      }}
                    >
                      kg
                    </span>
                  </div>
                  {formErrors.weightKg && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.weightKg}</span>
                  )}
                </div>

                {/* Nutritional Status Selector */}
                <div className="health-form-group">
                  <label className="health-form-label">
                    Nutritional Status (OPT Plus) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="health-input"
                    value={formData.nutritionalStatus}
                    onChange={(e) => setFormData({ ...formData, nutritionalStatus: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                    <option value="Stunted">Stunted</option>
                    <option value="Overweight">Overweight</option>
                  </select>
                </div>
              </div>

              {/* Recorded By */}
              <div className="health-form-group">
                <label className="health-form-label">Examiner / Recorded By</label>
                <input
                  type="text"
                  className="health-input"
                  value={formData.recordedBy}
                  onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                  placeholder="Child Development Worker name and designation"
                />
              </div>

              {/* Notes */}
              <div className="health-form-group">
                <label className="health-form-label">
                  Measurement Notes &amp; Observations (Optional)
                </label>
                <textarea
                  className="health-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Procedural notes (calibrated beam balance, light clothing, shoes removed, child calm)."
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      date: getPhilippinesDate(),
                      heightCm: '',
                      weightKg: '',
                      recordedBy: 'Maria Santos, CDW I',
                      notes: '',
                    });
                    setFormErrors({});
                  }}
                >
                  Clear Fields
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Check}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Measurement...' : 'Save Health Measurement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GROWTH TREND & HISTORY EXPLORER
          ========================================================================= */}
      {activeTab === 'trend' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                {monitoringData.children.length === 0 ? (
                  <option value="">No children registered yet</option>
                ) : (
                  monitoringData.children.map((c) => (
                    <option key={c.childId} value={c.childId}>
                      {c.fullName} ({c.childId}) — {c.barangay}
                    </option>
                  ))
                )}
              </select>
            </div>

            {childHealthDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Status:</span>
                <span
                  className={`health-status-badge ${
                    childHealthDetails.monitoringStatus === 'Up to Date'
                      ? 'uptodate'
                      : childHealthDetails.monitoringStatus === 'Overdue'
                      ? 'overdue'
                      : 'due'
                  }`}
                >
                  {childHealthDetails.monitoringStatus}
                </span>
              </div>
            )}
          </div>

          {/* Simple Trend Visualization (SVG Line Chart) */}
          <div className="health-trend-container">
            <div className="health-trend-header">
              <div className="health-trend-title-group">
                <h3>Height &amp; Weight Growth Progression</h3>
              </div>

              <div className="health-chart-toggles">
                <button
                  type="button"
                  className={`health-chart-toggle-btn ${chartMetric === 'combined' ? 'active' : ''}`}
                  onClick={() => setChartMetric('combined')}
                >
                  Combined
                </button>
                <button
                  type="button"
                  className={`health-chart-toggle-btn ${chartMetric === 'height' ? 'active' : ''}`}
                  onClick={() => setChartMetric('height')}
                >
                  Height (cm)
                </button>
                <button
                  type="button"
                  className={`health-chart-toggle-btn ${chartMetric === 'weight' ? 'active' : ''}`}
                  onClick={() => setChartMetric('weight')}
                >
                  Weight (kg)
                </button>
              </div>
            </div>

            {/* SVG Chart Rendering */}
            {childHealthDetails && childHealthDetails.trendData && childHealthDetails.trendData.length > 0 ? (
              <SimpleTrendChart data={childHealthDetails.trendData} mode={chartMetric} />
            ) : (
              <div
                style={{
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  color: '#94a3b8',
                }}
              >
                No historical growth measurements available to render trend.
              </div>
            )}

            <div className="health-chart-legend">
              {(chartMetric === 'combined' || chartMetric === 'height') && (
                <div className="health-legend-item">
                  <span className="health-legend-indicator height" />
                  <span>Height (cm)</span>
                </div>
              )}
              {(chartMetric === 'combined' || chartMetric === 'weight') && (
                <div className="health-legend-item">
                  <span className="health-legend-indicator weight" />
                  <span>Weight (kg)</span>
                </div>
              )}
            </div>
          </div>

          {/* Chronological Health History Table */}
          <div className="health-table-card">
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
                  Chronological Health History
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  All historical monthly growth check-ins recorded for this child
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setActiveTab('record')}
              >
                Add Measurement
              </Button>
            </div>

            <table className="health-table">
              <thead>
                <tr>
                  <th>Measurement Date</th>
                  <th>Height (cm)</th>
                  <th>Growth Delta (Height)</th>
                  <th>Weight (kg)</th>
                  <th>Growth Delta (Weight)</th>
                  <th>Recorded By</th>
                  <th>Measurement Notes</th>
                </tr>
              </thead>
              <tbody>
                {detailsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Loading history...
                    </td>
                  </tr>
                ) : !childHealthDetails || !childHealthDetails.history || childHealthDetails.history.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No previous records found.
                    </td>
                  </tr>
                ) : (
                  childHealthDetails.history.map((record) => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{record.date}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>{record.heightCm} cm</span>
                      </td>
                      <td>
                        <span
                          className={`health-delta-chip ${
                            record.deltaHeight && !record.deltaHeight.includes('-') && record.deltaHeight !== 'Baseline'
                              ? 'positive'
                              : ''
                          }`}
                        >
                          {record.deltaHeight || 'Baseline'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0d9488' }}>{record.weightKg} kg</span>
                      </td>
                      <td>
                        <span
                          className={`health-delta-chip ${
                            record.deltaWeight && !record.deltaWeight.includes('-') && record.deltaWeight !== 'Baseline'
                              ? 'positive'
                              : ''
                          }`}
                        >
                          {record.deltaWeight || 'Baseline'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                          {record.recordedBy || 'CDW'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {record.notes || 'Routine check.'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: QUICK MEASUREMENT MODAL (from Due Table)
          ========================================================================= */}
      {quickRecordChild && (
        <div className="modal-backdrop" onClick={() => setQuickRecordChild(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={20} style={{ color: '#0f2744' }} />
                <h3 className="modal-title">Record Monthly Measurement</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setQuickRecordChild(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickRecord}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{quickRecordChild.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {quickRecordChild.childId} • {quickRecordChild.barangay} • {quickRecordChild.dayCareCenter}
                  </div>
                </div>

                <div className="health-form-group">
                  <label className="health-form-label">Date of Measurement</label>
                  <input
                    type="date"
                    className="health-input"
                    value={quickRecordChild.inputDate}
                    onChange={(e) =>
                      setQuickRecordChild({ ...quickRecordChild, inputDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="health-form-group">
                    <label className="health-form-label">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="health-input"
                      placeholder="e.g. 96.5"
                      value={quickRecordChild.inputHeight}
                      onChange={(e) =>
                        setQuickRecordChild({ ...quickRecordChild, inputHeight: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="health-form-group">
                    <label className="health-form-label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      className="health-input"
                      placeholder="e.g. 14.2"
                      value={quickRecordChild.inputWeight}
                      onChange={(e) =>
                        setQuickRecordChild({ ...quickRecordChild, inputWeight: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="health-form-group">
                  <label className="health-form-label">
                    Nutritional Status (OPT Plus) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="health-input"
                    value={quickRecordChild.inputNutritionalStatus || 'Normal'}
                    onChange={(e) =>
                      setQuickRecordChild({ ...quickRecordChild, inputNutritionalStatus: e.target.value })
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="Underweight">Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                    <option value="Stunted">Stunted</option>
                    <option value="Overweight">Overweight</option>
                  </select>
                </div>

                <div className="health-form-group">
                  <label className="health-form-label">Examiner / Recorded By</label>
                  <input
                    type="text"
                    className="health-input"
                    value={quickRecordChild.inputWorker}
                    onChange={(e) =>
                      setQuickRecordChild({ ...quickRecordChild, inputWorker: e.target.value })
                    }
                  />
                </div>

                <div className="health-form-group">
                  <label className="health-form-label">Notes (Optional)</label>
                  <textarea
                    className="health-textarea"
                    rows={2}
                    placeholder="Measurement observations only. No medical diagnoses."
                    value={quickRecordChild.inputNotes}
                    onChange={(e) =>
                      setQuickRecordChild({ ...quickRecordChild, inputNotes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="outline" onClick={() => setQuickRecordChild(null)}>
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
          MODAL: GROWTH TREND & HISTORY MODAL (from Due Table)
          ========================================================================= */}
      {trendModalChild && (
        <div className="modal-backdrop" onClick={() => setTrendModalChild(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: '#0f2744' }} />
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>
                    Growth Trend &amp; History: {trendModalChild.fullName}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {trendModalChild.childId} • {trendModalChild.barangay} • {trendModalChild.dayCareCenter}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setTrendModalChild(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Trend Chart */}
              {childHealthDetails && childHealthDetails.trendData && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                    Height &amp; Weight Progression
                  </div>
                  <SimpleTrendChart data={childHealthDetails.trendData} mode="combined" />
                </div>
              )}

              {/* History Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table className="health-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Height</th>
                      <th>Weight</th>
                      <th>Worker</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childHealthDetails && childHealthDetails.history && childHealthDetails.history.length > 0 ? (
                      childHealthDetails.history.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.date}</td>
                          <td>
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>{r.heightCm} cm</span>
                            {r.deltaHeight && (
                              <span style={{ fontSize: '0.6875rem', marginLeft: '0.25rem', color: '#64748b' }}>
                                ({r.deltaHeight})
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: '#0d9488', fontWeight: 600 }}>{r.weightKg} kg</span>
                            {r.deltaWeight && (
                              <span style={{ fontSize: '0.6875rem', marginLeft: '0.25rem', color: '#64748b' }}>
                                ({r.deltaWeight})
                              </span>
                            )}
                          </td>
                          <td>{r.recordedBy}</td>
                          <td style={{ color: '#64748b' }}>{r.notes || 'Routine check.'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          No historical measurements.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                onClick={() => setTrendModalChild(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                icon={Scale}
                onClick={() => {
                  const target = trendModalChild;
                  setTrendModalChild(null);
                  setQuickRecordChild({
                    ...target,
                    inputDate: getPhilippinesDate(),
                    inputHeight: target.lastHeightCm || '',
                    inputWeight: target.lastWeightKg || '',
                    inputNutritionalStatus: 'Normal',
                    inputWorker: 'Maria Santos, CDW I',
                    inputNotes: '',
                  });
                }}
              >
                Record New Measurement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clean SVG Trend Chart
 * Draws Height (cm) and Weight (kg) over time without external heavy chart dependencies.
 * Visual excellence, responsive SVG viewBox, tooltips, and crisp government styling.
 */
function SimpleTrendChart({ data, mode = 'combined' }) {
  if (!data || data.length === 0) return null;

  // Chart coordinate space
  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 40, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Extents for Height (cm) and Weight (kg)
  const heights = data.map((d) => d.heightCm);
  const weights = data.map((d) => d.weightKg);

  const minH = Math.floor(Math.min(...heights) - 2);
  const maxH = Math.ceil(Math.max(...heights) + 2);

  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);

  // Map points to SVG coordinates
  const n = data.length;
  const getX = (idx) => padding.left + (n === 1 ? chartW / 2 : (idx / (n - 1)) * chartW);

  const getYHeight = (val) => {
    const range = maxH - minH || 1;
    return padding.top + chartH - ((val - minH) / range) * chartH;
  };

  const getYWeight = (val) => {
    const range = maxW - minW || 1;
    return padding.top + chartH - ((val - minW) / range) * chartH;
  };

  // Build SVG path strings
  let heightPath = '';
  let weightPath = '';

  data.forEach((d, i) => {
    const x = getX(i);
    const yh = getYHeight(d.heightCm);
    const yw = getYWeight(d.weightKg);

    if (i === 0) {
      heightPath += `M ${x} ${yh}`;
      weightPath += `M ${x} ${yw}`;
    } else {
      heightPath += ` L ${x} ${yh}`;
      weightPath += ` L ${x} ${yw}`;
    }
  });

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
      >
        {/* Background grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          return (
            <line
              key={idx}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Height line and points */}
        {(mode === 'combined' || mode === 'height') && (
          <>
            <path
              d={heightPath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => {
              const x = getX(i);
              const y = getYHeight(d.heightCm);
              return (
                <g key={`h-${i}`}>
                  <circle cx={x} cy={y} r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={x}
                    y={y - 9}
                    textAnchor="middle"
                    fill="#0284c7"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {d.heightCm} cm
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* Weight line and points */}
        {(mode === 'combined' || mode === 'weight') && (
          <>
            <path
              d={weightPath}
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => {
              const x = getX(i);
              const y = getYWeight(d.weightKg);
              return (
                <g key={`w-${i}`}>
                  <circle cx={x} cy={y} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={x}
                    y={y + 18}
                    textAnchor="middle"
                    fill="#0d9488"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {d.weightKg} kg
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* X-axis date labels */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <text
              key={`date-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontWeight="600"
            >
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default HealthMonitoringView;
