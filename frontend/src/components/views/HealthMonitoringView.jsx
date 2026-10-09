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
import { computeNutritionalStatus } from '../../utils/whoGrowthStandards';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';

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

const getNutritionalBadgeStyle = (status) => {
  if (!status) {
    return {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
      border: '1px solid #cbd5e1',
      dotColor: '#94a3b8',
    };
  }
  const s = status.toLowerCase();
  if (s.includes('severely') || s.includes('severe')) {
    return {
      backgroundColor: '#fee2e2', // bg-red-100
      color: '#b91c1c',           // text-red-700
      border: '1px solid #fca5a5', // border-red-300
      dotColor: '#dc2626',
    };
  }
  if (s.includes('wasted')) {
    return {
      backgroundColor: '#ffe4e6', // bg-rose-100
      color: '#be123c',           // text-rose-700
      border: '1px solid #fda4af', // border-rose-300
      dotColor: '#e11d48',
    };
  }
  if (s.includes('stunted')) {
    return {
      backgroundColor: '#ffedd5', // bg-orange-100
      color: '#c2410c',           // text-orange-700
      border: '1px solid #fdba74', // border-orange-300
      dotColor: '#ea580c',
    };
  }
  if (s.includes('underweight')) {
    return {
      backgroundColor: '#fef3c7', // bg-amber-100
      color: '#b45309',           // text-amber-700
      border: '1px solid #fcd34d', // border-amber-300
      dotColor: '#d97706',
    };
  }
  if (s.includes('overweight') || s.includes('obese')) {
    return {
      backgroundColor: '#ede9fe', // purple
      color: '#6d28d9',
      border: '1px solid #c4b5fd',
      dotColor: '#7c3aed',
    };
  }
  return {
    backgroundColor: '#d1fae5', // bg-emerald-100
    color: '#047857',           // text-emerald-700
    border: '1px solid #6ee7b7', // border-emerald-300
    dotColor: '#059669',
  };
};

const getNutritionalBadgeVariant = (status) => {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('severely') || s.includes('underweight') || s.includes('wasted') || s.includes('stunted')) {
    return 'danger';
  }
  if (s.includes('overweight') || s.includes('obese') || s.includes('risk')) {
    return 'warning';
  }
  if (s.includes('normal')) {
    return 'success';
  }
  return 'neutral';
};

const getMonitoringBadgeVariant = (status) => {
  if (status === 'Up to Date') return 'success';
  if (status === 'Overdue') return 'danger';
  if (status === 'Due') return 'warning';
  return 'neutral';
};

const getMonitoringIcon = (status) => {
  if (status === 'Up to Date') return CheckCircle2;
  if (status === 'Overdue') return AlertTriangle;
  if (status === 'Due') return Clock;
  return null;
};

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
    muacCm: '',
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

  // Real-time Dynamic Calculation for Modal (Record Monthly Measurement)
  const modalCalc = useMemo(() => {
    if (!quickRecordChild) return null;
    return computeNutritionalStatus({
      weightKg: quickRecordChild.inputWeight,
      heightCm: quickRecordChild.inputHeight,
      muacCm: quickRecordChild.inputMuac,
      birthDate: quickRecordChild.birthDate,
      sex: quickRecordChild.sex || 'Female',
      measurementDate: quickRecordChild.inputDate || getPhilippinesDate(),
    });
  }, [
    quickRecordChild?.inputWeight,
    quickRecordChild?.inputHeight,
    quickRecordChild?.inputMuac,
    quickRecordChild?.inputDate,
    quickRecordChild?.birthDate,
    quickRecordChild?.sex,
  ]);

  // Real-time Dynamic Calculation for Tab 2 Form
  const formCalc = useMemo(() => {
    return computeNutritionalStatus({
      weightKg: formData.weightKg,
      heightCm: formData.heightCm,
      muacCm: formData.muacCm,
      birthDate: currentChildProfile?.birthDate,
      sex: currentChildProfile?.sex || 'Female',
      measurementDate: formData.date || getPhilippinesDate(),
    });
  }, [
    formData.weightKg,
    formData.heightCm,
    formData.muacCm,
    formData.date,
    currentChildProfile?.birthDate,
    currentChildProfile?.sex,
  ]);

  // Form input validation
  const validateForm = (data) => {
    const errs = {};
    if (!data.date) errs.date = 'Measurement date is required.';
    const h = parseFloat(data.heightCm);
    if (isNaN(h) || h < 40 || h > 140) {
      errs.heightCm = 'Height must be between 40.0 cm and 140.0 cm.';
    }
    const w = parseFloat(data.weightKg);
    if (isNaN(w) || w < 2 || w > 45) {
      errs.weightKg = 'Weight must be between 2.0 kg and 45.0 kg.';
    }
    if (data.muacCm) {
      const m = parseFloat(data.muacCm);
      if (isNaN(m) || m < 5 || m > 35) {
        errs.muacCm = 'MUAC must be between 5.0 cm and 35.0 cm.';
      }
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

      const calcRes = computeNutritionalStatus({
        weightKg: formData.weightKg,
        heightCm: formData.heightCm,
        muacCm: formData.muacCm,
        birthDate: child.birthDate,
        sex: child.sex || 'Female',
        measurementDate: formData.date || getPhilippinesDate(),
      });
      const nutStatus = calcRes.status;

      await healthMonitoringService.recordChildHealth(selectedChildId, {
        childName: child.fullName,
        barangay: child.barangay,
        dayCareCenter: child.dayCareCenter,
        date: formData.date,
        heightCm: formData.heightCm,
        weightKg: formData.weightKg,
        muacCm: formData.muacCm,
        nutritionalStatus: nutStatus,
        recordedBy: formData.recordedBy,
        notes: formData.notes,
      });

      // Auto-trigger urgent follow-up if child is malnourished (Underweight, Stunted, Wasted)
      if (calcRes.isMalnourished || ['Underweight', 'Severely Underweight', 'Stunted', 'Wasted'].includes(nutStatus)) {
        try {
          await followUpService.createFollowUp({
            childId: selectedChildId,
            childName: child.fullName,
            barangay: child.barangay || 'City of San Fernando',
            dayCareCenter: child.dayCareCenter || 'Child Development Center',
            reason: `Nutritional Alert: Child flagged as ${nutStatus} during OPT Plus.`,
            priority: 'Urgent',
            status: 'Needs Attention',
            category: 'Needs Attention',
            actionType: 'Monitoring',
            assignedWorker: formData.recordedBy || 'Maria Santos, CDW I',
            dueDate: addDaysPHT(14),
            notes: `Urgent nutritional intervention required. Recorded: ${formData.weightKg} kg, ${formData.heightCm} cm${formData.muacCm ? `, MUAC: ${formData.muacCm} cm` : ''}. Status: ${nutStatus}. WHO Z-Score: ${calcRes.zScore} SD.`,
          });
        } catch (err) {
          console.warn('Failed to dispatch nutritional follow-up:', err);
        }
      }

      setSaveSuccessMsg(
        `Measurement recorded successfully for ${child.fullName} (${child.childId}). Auto-computed status: ${nutStatus}. Health status updated to Up to Date.`
      );
      setFormData({
        date: getPhilippinesDate(),
        heightCm: '',
        weightKg: '',
        muacCm: '',
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
    const muac = quickRecordChild.inputMuac ? parseFloat(quickRecordChild.inputMuac) : null;

    if (isNaN(h) || h < 40 || isNaN(w) || w < 2) {
      alert('Please enter valid numeric height (cm) and weight (kg).');
      return;
    }

    try {
      const calcRes = computeNutritionalStatus({
        weightKg: w,
        heightCm: h,
        muacCm: muac,
        birthDate: quickRecordChild.birthDate,
        sex: quickRecordChild.sex || 'Female',
        measurementDate: quickRecordChild.inputDate || getPhilippinesDate(),
      });
      const nutStatus = calcRes.status;

      await healthMonitoringService.recordChildHealth(quickRecordChild.childId, {
        childName: quickRecordChild.fullName,
        barangay: quickRecordChild.barangay,
        dayCareCenter: quickRecordChild.dayCareCenter,
        date: quickRecordChild.inputDate || getPhilippinesDate(),
        heightCm: h,
        weightKg: w,
        muacCm: muac,
        nutritionalStatus: nutStatus,
        recordedBy: quickRecordChild.inputWorker || 'CSWDO CDW',
        notes: quickRecordChild.inputNotes || '',
      });

      // Auto-trigger urgent follow-up if child is malnourished (Underweight, Stunted, Wasted)
      if (calcRes.isMalnourished || ['Underweight', 'Severely Underweight', 'Stunted', 'Wasted'].includes(nutStatus)) {
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
            notes: `Urgent nutritional intervention required. Recorded: ${w} kg, ${h} cm${muac ? `, MUAC: ${muac} cm` : ''}. Status: ${nutStatus}. WHO Z-Score: ${calcRes.zScore} SD.`,
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Child Health &amp; Growth Monitoring (OPT Plus)
          </h1>
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
          className={`bento-stat-card card-warning ${statusFilter === 'due' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'due' ? 'all' : 'due')}
          title="Filter children due for monthly check"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monitoring Due
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
              {monitoringData.counts.monitoringDue}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <CalendarClock size={18} />
          </div>
        </div>

        <div
          className="bento-stat-card card-success"
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
          title="Children monitored this calendar month"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed (Month)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
              {monitoringData.counts.completedThisMonth}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div
          className={`bento-stat-card card-danger ${statusFilter === 'overdue' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          title="Filter children overdue for monthly check"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overdue (&gt;45d)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>
              {monitoringData.counts.overdue}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          className={`bento-stat-card card-primary ${statusFilter === 'up to date' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'up to date' ? 'all' : 'up to date')}
          title="Filter children with up-to-date measurements"
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Up to Date
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-800)', marginTop: '2px' }}>
              {monitoringData.counts.upToDate}
            </div>
          </div>
          <div className="stat-icon-wrap">
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
          Monthly Monitoring Directory
        </button>

        <button
          type="button"
          className={`health-tab-btn ${activeTab === 'record' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <Scale size={16} />
          Record Child Measurement
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
          <div className="table-container mobile-table-to-cards">
            <table className="table health-registry-table">
              <TableHead>
                <TableRow>
                  <TableHeader className="health-col-child">Child</TableHeader>
                  <TableHeader className="health-col-id">ECCD ID</TableHeader>
                  <TableHeader className="health-col-brgy">Barangay</TableHeader>
                  <TableHeader className="health-col-center">Day Care Center</TableHeader>
                  <TableHeader className="health-col-measurement">Last Measurement</TableHeader>
                  <TableHeader className="health-col-metrics">Height &amp; Weight</TableHeader>
                  <TableHeader className="health-col-nutritional">Nutritional Status</TableHeader>
                  <TableHeader className="health-col-status">Monitoring Status</TableHeader>
                  <TableHeader className="health-col-actions" style={{ textAlign: 'right' }}>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--color-primary-800)' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading health monitoring records...</p>
                    </TableCell>
                  </TableRow>
                ) : monitoringData.children.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                        No children match the selected health monitoring filters.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  monitoringData.children.map((child) => {
                    const initials = getInitials(child.fullName, child.firstName, child.lastName);
                    const formattedName = formatChildName(child.fullName);

                    return (
                      <TableRow key={child.childId}>
                        {/* Child Name & Avatar */}
                        <TableCell className="health-col-child">
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
                        <TableCell className="health-col-id">
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
                        <TableCell className="health-col-brgy">
                          <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{child.barangay}</span>
                        </TableCell>

                        {/* Day Care Center */}
                        <TableCell className="health-col-center">
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {child.dayCareCenter}
                          </span>
                        </TableCell>

                        {/* Last Measurement */}
                        <TableCell className="health-col-measurement">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {child.lastMeasurementDate || 'None recorded'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {child.daysSinceLastCheck !== undefined
                                ? `${child.daysSinceLastCheck} days ago`
                                : ''}
                            </span>
                          </div>
                        </TableCell>

                        {/* Height & Weight */}
                        <TableCell className="health-col-metrics">
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary-800, #ba1607)' }}>
                              {child.lastHeightCm ? `${child.lastHeightCm} cm` : '—'}
                            </span>
                            <span style={{ color: 'var(--text-muted, #cbd5e1)' }}>/</span>
                            <span style={{ fontWeight: 600, color: '#0d9488' }}>
                              {child.lastWeightKg ? `${child.lastWeightKg} kg` : '—'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Nutritional Status Badge */}
                        <TableCell className="health-col-nutritional">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '600',
                              ...getNutritionalBadgeStyle(child.nutritionalStatus),
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: getNutritionalBadgeStyle(child.nutritionalStatus).dotColor,
                              }}
                            />
                            {child.nutritionalStatus || 'Normal'}
                          </span>
                        </TableCell>

                        {/* Monitoring Status Badge */}
                        <TableCell className="health-col-status">
                          <Badge
                            variant={getMonitoringBadgeVariant(child.status)}
                            icon={getMonitoringIcon(child.status)}
                            dot={!getMonitoringIcon(child.status)}
                            size="sm"
                          >
                            {child.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="health-col-actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={TrendingUp}
                              onClick={() => {
                                setTrendModalChild(child);
                                loadChildDetails(child.childId);
                              }}
                              title="View Growth Trend & History"
                            >
                              Trend
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              icon={Scale}
                              onClick={() => {
                                const initDate = getPhilippinesDate();
                                const initH = child.lastHeightCm || '';
                                const initW = child.lastWeightKg || '';
                                const initMuac = child.lastMuacCm || '';
                                const initCalc = computeNutritionalStatus({
                                  weightKg: initW,
                                  heightCm: initH,
                                  muacCm: initMuac,
                                  birthDate: child.birthDate,
                                  sex: child.sex || 'Female',
                                  measurementDate: initDate,
                                });
                                setQuickRecordChild({
                                  ...child,
                                  inputDate: initDate,
                                  inputHeight: initH,
                                  inputWeight: initW,
                                  inputMuac: initMuac,
                                  inputNutritionalStatus: initCalc.status,
                                  inputWorker: 'Maria Santos, CDW I',
                                  inputNotes: '',
                                });
                              }}
                              title="Quick Record Measurement"
                            >
                              Weigh
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
                    Last: {currentChildProfile.lastHeightCm && currentChildProfile.lastWeightKg
                      ? `${currentChildProfile.lastHeightCm} cm / ${currentChildProfile.lastWeightKg} kg`
                      : currentChildProfile.lastHeightCm
                      ? `${currentChildProfile.lastHeightCm} cm`
                      : currentChildProfile.lastWeightKg
                      ? `${currentChildProfile.lastWeightKg} kg`
                      : 'None recorded'}
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

                {/* MUAC (Mid-Upper Arm Circumference) */}
                <div className="health-form-group">
                  <label className="health-form-label">
                    MUAC (Centimeters / cm) <span style={{ fontSize: '11px', color: '#64748b' }}>(OPT Plus)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 13.5"
                      className="health-input"
                      value={formData.muacCm}
                      onChange={(e) => setFormData({ ...formData, muacCm: e.target.value })}
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
                  {formErrors.muacCm && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{formErrors.muacCm}</span>
                  )}
                </div>

                {/* Auto-calculated Real-Time Nutritional Status */}
                <div className="health-form-group">
                  <label className="health-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Nutritional Status (OPT Plus — WHO Standards)</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                      Auto-calculated in real time
                    </span>
                  </label>

                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: formCalc?.style?.backgroundColor || '#f8fafc',
                      border: `1.5px solid ${formCalc?.style?.borderColor || '#cbd5e1'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: formCalc?.style?.dotColor || '#94a3b8',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: formCalc?.style?.color || '#0f172a',
                          }}
                        >
                          {formCalc?.status || 'Enter weight & height'}
                        </span>
                      </div>

                      {formCalc?.bmi && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: formCalc?.style?.color || '#475569',
                            backgroundColor: 'rgba(255, 255, 255, 0.75)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${formCalc?.style?.borderColor || '#cbd5e1'}`,
                          }}
                        >
                          BMI: {formCalc.bmi} kg/m²
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                      <span>
                        Age at check: <strong>{formCalc?.ageMonths !== null ? `${formCalc?.ageMonths} mos` : '—'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        WHO Z-Score: <strong>{formCalc?.zScore !== undefined ? `${formCalc?.zScore > 0 ? '+' : ''}${formCalc?.zScore} SD` : '—'}</strong>
                      </span>
                      <span>•</span>
                      <span style={{ color: formCalc?.status === 'Severely Underweight' || formCalc?.status === 'Underweight' ? '#b91c1c' : '#047857', fontWeight: '600' }}>
                        {formCalc?.status === 'Severely Underweight'
                          ? '⚠ Critically low for age & height (Automatic Alert)'
                          : formCalc?.status === 'Underweight'
                          ? '⚠ Below -2 SD standard threshold (Automatic Alert)'
                          : formCalc?.status === 'Overweight'
                          ? 'Above +2 SD standard threshold'
                          : '✓ Normal standard range (-2 to +2 SD)'}
                      </span>
                    </div>
                  </div>
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
                        <span style={{ fontWeight: 700, color: '#ba1607' }}>{record.heightCm} cm</span>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={20} style={{ color: '#7e191b' }} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
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

                  <div className="health-form-group">
                    <label className="health-form-label">MUAC (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="health-input"
                      placeholder="e.g. 13.5"
                      value={quickRecordChild.inputMuac || ''}
                      onChange={(e) =>
                        setQuickRecordChild({ ...quickRecordChild, inputMuac: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Auto-calculated Real-Time Nutritional Status (OPT Plus) */}
                <div className="health-form-group">
                  <label className="health-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Nutritional Status (OPT Plus — WHO Standards)</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                      Auto-calculated in real time
                    </span>
                  </label>

                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: modalCalc?.style?.backgroundColor || '#f8fafc',
                      border: `1.5px solid ${modalCalc?.style?.borderColor || '#cbd5e1'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: modalCalc?.style?.dotColor || '#94a3b8',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: modalCalc?.style?.color || '#0f172a',
                          }}
                        >
                          {modalCalc?.status || 'Enter weight & height'}
                        </span>
                      </div>

                      {modalCalc?.bmi && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: modalCalc?.style?.color || '#475569',
                            backgroundColor: 'rgba(255, 255, 255, 0.75)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${modalCalc?.style?.borderColor || '#cbd5e1'}`,
                          }}
                        >
                          BMI: {modalCalc.bmi} kg/m²
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                      <span>
                        Age at check: <strong>{modalCalc?.ageMonths !== null ? `${modalCalc?.ageMonths} mos` : '—'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        WHO Z-Score: <strong>{modalCalc?.zScore !== undefined ? `${modalCalc?.zScore > 0 ? '+' : ''}${modalCalc?.zScore} SD` : '—'}</strong>
                      </span>
                      <span>•</span>
                      <span style={{ color: modalCalc?.status === 'Severely Underweight' || modalCalc?.status === 'Underweight' ? '#b91c1c' : '#047857', fontWeight: '600' }}>
                        {modalCalc?.status === 'Severely Underweight'
                          ? '⚠ Critically low for age & height (Automatic Nutritional Alert)'
                          : modalCalc?.status === 'Underweight'
                          ? '⚠ Below -2 SD standard threshold (Automatic Alert)'
                          : modalCalc?.status === 'Overweight'
                          ? 'Above +2 SD standard threshold'
                          : '✓ Normal standard range (-2 to +2 SD)'}
                      </span>
                    </div>
                  </div>
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
            style={{ maxWidth: '960px', width: '94vw' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: '#7e191b' }} />
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
                            <span style={{ color: '#ba1607', fontWeight: 600 }}>{r.heightCm} cm</span>
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
              stroke="#ba1607"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => {
              const x = getX(i);
              const y = getYHeight(d.heightCm);
              return (
                <g key={`h-${i}`}>
                  <circle cx={x} cy={y} r="5" fill="#ba1607" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={x}
                    y={y - 9}
                    textAnchor="middle"
                    fill="#ba1607"
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
