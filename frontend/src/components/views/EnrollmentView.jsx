import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  Building2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  History,
  Info,
  Check,
  Baby,
  MapPin,
  Eye,
  FileCheck2,
  Lock,
  ShieldAlert,
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
import { useAuth } from '../auth/AuthProvider';
import { enrollmentService } from '../../services/enrollmentService';
import { centralDataStore } from '../../services/centralDataStore';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { getPhilippinesDate } from '../../utils/phTime';

const AVAILABLE_BARANGAYS = SAN_FERNANDO_BARANGAYS;

const AVAILABLE_CENTERS = [
  'San Isidro Child Development Center I',
  'San Isidro Child Development Center II',
  'Calulut CDC Central',
  'Dolores Child Development Center',
  'San Jose CDC I',
  'Juliana CDC',
  'Dela Paz Sur CDC II',
  'Lourdes CDC',
  'Sindalan Central CDC',
];

const formatChildName = (name) => {
  if (!name) return '—';
  return String(name).toUpperCase();
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || 'C';
};

export function EnrollmentView({ onNavigate }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canEnroll = user?.role === 'cdt' || user?.role === 'eccd_admin' || user?.role === 'daycare_worker' || user?.role === 'cswdo_admin' || user?.role === 'field_worker';

  // Active sub-view: 'directory' | 'not-enrolled' | 'enroll-wizard'
  const [activeTab, setActiveTab] = useState('directory');

  // Datasets
  const [enrollments, setEnrollments] = useState([]);
  const [notEnrolledChildren, setNotEnrolledChildren] = useState([]);
  const [availableCentersList, setAvailableCentersList] = useState([]);
  const [availableWorkersList, setAvailableWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Directory
  const [searchDir, setSearchDir] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterSY, setFilterSY] = useState('');

  // Filters for Mapped Not Enrolled View
  const [filterNotEnrBarangay, setFilterNotEnrBarangay] = useState('');
  const [filterNotEnrAge, setFilterNotEnrAge] = useState('');
  const [filterNotEnrYear, setFilterNotEnrYear] = useState('');
  const [filterNotEnrStatus, setFilterNotEnrStatus] = useState('');

  // Enroll Existing Child Wizard State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChildForEnrollment, setSelectedChildForEnrollment] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    center: 'San Isidro Child Development Center I',
    dayCareCenterId: null,
    program: 'Child Development Center (CDC)',
    session: 'Morning Session (8:00 AM – 11:00 AM)',
    schoolYear: 'SY 2026–2027',
    enrollmentDate: getPhilippinesDate(),
    status: 'Enrolled',
    teacher: 'Maria Santos, CDW I',
    workerId: null,
  });

  // History Modal State
  const [historyChild, setHistoryChild] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Load datasets
  const loadData = async () => {
    setLoading(true);
    try {
      const enrData = await enrollmentService.getEnrollments({
        search: searchDir,
        barangay: filterBarangay,
        center: filterCenter,
        schoolYear: filterSY,
      });
      setEnrollments(enrData.enrollments || []);

      const notEnrData = await enrollmentService.getNotEnrolledChildren({
        barangay: filterNotEnrBarangay,
        age: filterNotEnrAge,
        year: filterNotEnrYear,
        status: filterNotEnrStatus,
      });
      setNotEnrolledChildren(notEnrData.children || []);

      const rawCenters = centralDataStore.getDayCareCenters() || [];
      const rawWorkers = centralDataStore.getWorkers() || [];
      setAvailableCentersList(
        rawCenters.length > 0
          ? rawCenters
          : AVAILABLE_CENTERS.map((name, i) => ({ id: `CDC-${i + 1}`, name, barangay: 'San Isidro' }))
      );
      setAvailableWorkersList(
        rawWorkers.length > 0
          ? rawWorkers
          : [
              { id: 'WKR-001', name: 'Maria Santos', role: 'CDW I', assignedCenters: ['San Isidro Child Development Center I'], assignedBarangay: 'San Isidro' },
              { id: 'WKR-002', name: 'Elena Dizon', role: 'CDW II', assignedCenters: ['San Isidro Child Development Center II'], assignedBarangay: 'San Isidro' },
            ]
      );
    } catch (e) {
      console.error('Error loading enrollment data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchDir, filterBarangay, filterCenter, filterSY, filterNotEnrBarangay, filterNotEnrAge, filterNotEnrYear, filterNotEnrStatus]);

  useEffect(() => {
    const handleStoreUpdate = () => loadData();
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    return () => window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
  }, []);

  // Live search for Enroll Existing Child
  const handleSearchCandidates = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await enrollmentService.searchChildrenForEnrollment(query);
    setSearchResults(results);
  };

  // Open confirmation modal for child enrollment
  const handleInitiateEnrollment = (child) => {
    setSelectedChildForEnrollment(child);
    const childBrgy = (child.barangay || '').toLowerCase().trim();
    const cdcList = centralDataStore.getDayCareCenters() || [];
    const workerList = centralDataStore.getWorkers() || [];

    // Form 7 CDC matching child's barangay or nearest
    const matchingCdc = cdcList.find((c) => (c.barangay || '').toLowerCase().trim() === childBrgy);
    const centerName = matchingCdc?.name || child.nearestCenter || (cdcList[0]?.name || 'San Isidro Child Development Center I');
    const centerId = matchingCdc?.id || cdcList[0]?.id || null;

    // Form 6 Worker deployed to this center or barangay
    const matchingWorker = workerList.find((w) =>
      (Array.isArray(w.assignedCenters) && w.assignedCenters.some((ac) => ac.toLowerCase() === centerName.toLowerCase())) ||
      (w.assignedBarangay && w.assignedBarangay.toLowerCase().trim() === childBrgy)
    );
    const teacherName = matchingWorker ? `${matchingWorker.name}, ${matchingWorker.role || 'CDW I'}` : 'Maria Santos, CDW I';
    const workerId = matchingWorker?.id || null;

    setEnrollmentForm({
      ...enrollmentForm,
      center: centerName,
      dayCareCenterId: centerId,
      teacher: teacherName,
      workerId: workerId,
      schoolYear: 'SY 2026–2027',
      status: 'Enrolled',
    });
    setIsEnrollModalOpen(true);
  };

  // Confirm and submit enrollment
  const handleConfirmEnrollment = async (e) => {
    e.preventDefault();
    if (!selectedChildForEnrollment) return;

    const res = await enrollmentService.enrollChild({
      childId: selectedChildForEnrollment.childId,
      childName: selectedChildForEnrollment.childName,
      birthDate: selectedChildForEnrollment.birthDate,
      ageDisplay: selectedChildForEnrollment.ageDisplay,
      sex: selectedChildForEnrollment.sex,
      barangay: selectedChildForEnrollment.barangay,
      center: enrollmentForm.center,
      dayCareCenterId: enrollmentForm.dayCareCenterId,
      teacher: enrollmentForm.teacher,
      workerId: enrollmentForm.workerId,
      program: enrollmentForm.program,
      session: enrollmentForm.session,
      schoolYear: enrollmentForm.schoolYear || 'SY 2026–2027',
      enrollmentDate: enrollmentForm.enrollmentDate,
      status: enrollmentForm.status || 'Enrolled',
    });

    addToast(res.message || 'Child enrolled successfully!', 'success');
    setIsEnrollModalOpen(false);
    setSelectedChildForEnrollment(null);
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('directory');
    loadData();
  };

  // View enrollment history
  const handleViewHistory = async (enr) => {
    const res = await enrollmentService.getChildEnrollment(enr.childId);
    setHistoryChild({
      childName: enr.childName,
      childId: enr.childId,
      records: res.history || [enr],
    });
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="enrollment-module-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 className="page-title">Center Enrollment &amp; Session Scheduling</h1>
            <Badge variant="primary" size="sm">SY 2026–2027</Badge>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('enroll-wizard')}
          >
            <Plus size={16} />
            Enroll Existing Child
          </Button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div className="bento-stat-card card-success">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Enrollments
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
              {enrollments.length}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <School size={18} />
          </div>
        </div>

        <div className="bento-stat-card card-warning">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Not Enrolled Queue
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
              {notEnrolledChildren.length}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bento-stat-card card-danger">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4-Year-Old Priority
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-danger-600)', marginTop: '2px' }}>
              {notEnrolledChildren.filter((c) => c?.priorityTarget?.includes('4-Year-Old') || c?.ageYears >= 4).length}
            </div>
          </div>
          <div className="stat-icon-wrap">
            <Baby size={18} />
          </div>
        </div>

        <div className="bento-stat-card card-primary">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enrollment Ratio
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-800)', marginTop: '2px' }}>
              {Math.round((enrollments.length / ((enrollments.length + notEnrolledChildren.length) || 1)) * 100)}%
            </div>
          </div>
          <div className="stat-icon-wrap">
            <UserCheck size={18} />
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="mapping-view-toggle" style={{ marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={`mapping-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <School size={16} />
          <span>Enrollment Directory ({enrollments.length})</span>
        </button>

        <button
          type="button"
          className={`mapping-tab-btn ${activeTab === 'not-enrolled' ? 'active' : ''}`}
          onClick={() => setActiveTab('not-enrolled')}
        >
          <AlertTriangle size={16} />
          <span>Mapped but Not Enrolled ({notEnrolledChildren.length})</span>
        </button>

        <button
          type="button"
          className={`mapping-tab-btn ${activeTab === 'enroll-wizard' ? 'active' : ''}`}
          onClick={() => setActiveTab('enroll-wizard')}
        >
          <UserCheck size={16} />
          <span>Enroll Existing Child</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: 1. ENROLLMENT DIRECTORY
          ========================================================================= */}
      {activeTab === 'directory' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <CardTitle>
                Active Enrollments ({enrollments.length})
              </CardTitle>
              <Badge variant="success" size="sm">
                SY 2026–2027
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '240px' }}>
                <Input
                  placeholder="Search child name, ECCD ID, barangay or center..."
                  value={searchDir}
                  onChange={(e) => setSearchDir(e.target.value)}
                  leftIcon={<Search size={16} />}
                  className="input-sm"
                />
              </div>
              <div style={{ width: '160px' }}>
                <Select
                  value={filterBarangay}
                  onChange={(e) => setFilterBarangay(e.target.value)}
                  options={[{ value: '', label: 'All Barangays' }, ...AVAILABLE_BARANGAYS.map((b) => ({ value: b, label: b }))]}
                  className="select-sm"
                />
              </div>
              <div style={{ width: '220px' }}>
                <Select
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value)}
                  options={[
                    { value: '', label: 'All Day Care Centers' },
                    ...(availableCentersList.length > 0
                      ? availableCentersList.map((c) => ({ value: c.name, label: c.name }))
                      : AVAILABLE_CENTERS.map((c) => ({ value: c, label: c }))),
                  ]}
                  className="select-sm"
                />
              </div>
              <div style={{ width: '130px' }}>
                <Select
                  value={filterSY}
                  onChange={(e) => setFilterSY(e.target.value)}
                  options={[
                    { value: '', label: 'All SY' },
                    { value: 'SY 2026–2027', label: 'SY 2026–2027' },
                  ]}
                  className="select-sm"
                />
              </div>
            </div>

            {/* Enrollment Directory Table */}
            <div className="table-container mobile-table-to-cards">
              <table className="table enrollment-registry-table">
                <TableHead>
                  <TableRow>
                    <TableHeader className="enr-col-child">Child</TableHeader>
                    <TableHeader className="enr-col-id">ECCD ID</TableHeader>
                    <TableHeader className="enr-col-brgy">Barangay</TableHeader>
                    <TableHeader className="enr-col-center">Day Care Center</TableHeader>
                    <TableHeader className="enr-col-sy">School Year</TableHeader>
                    <TableHeader className="enr-col-date">Enrollment Date</TableHeader>
                    <TableHeader className="enr-col-status">Status</TableHeader>
                    <TableHeader className="enr-col-action" style={{ textAlign: 'right' }}>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                        No enrollment records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enr) => {
                      const initials = getInitials(enr.childName);
                      const formattedName = formatChildName(enr.childName);

                      return (
                        <TableRow key={enr.id}>
                          {/* Child Column with Avatar */}
                          <TableCell className="enr-col-child">
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
                                {[enr.ageDisplay, enr.sex].filter(Boolean).filter((v) => v !== '—').length > 0 && (
                                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                    {[enr.ageDisplay, enr.sex].filter(Boolean).filter((v) => v !== '—').join(' • ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* ECCD ID */}
                          <TableCell className="enr-col-id">
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
                              {enr.childId}
                            </code>
                          </TableCell>

                          {/* Barangay */}
                          <TableCell className="enr-col-brgy">
                            <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{enr.barangay}</span>
                          </TableCell>

                          {/* Day Care Center */}
                          <TableCell className="enr-col-center">
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{enr.center}</div>
                            {enr.session && (
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {enr.session}
                              </div>
                            )}
                          </TableCell>

                          {/* School Year */}
                          <TableCell className="enr-col-sy">
                            <Badge variant="neutral" size="sm" dot={false}>
                              {enr.schoolYear}
                            </Badge>
                          </TableCell>

                          {/* Enrollment Date */}
                          <TableCell className="enr-col-date">
                            <span style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                              {enr.enrollmentDate}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="enr-col-status">
                            <Badge variant="success" size="sm">
                              {enr.status}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="enr-col-action" style={{ textAlign: 'right' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={History}
                              onClick={() => handleViewHistory(enr)}
                              title="View Enrollment History"
                            >
                              History
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 2: 2. MAPPED BUT NOT ENROLLED (DEDICATED OPERATIONAL VIEW)
          ========================================================================= */}
      {activeTab === 'not-enrolled' && (
        <div>
          {/* Operational Header Bar */}
          <div className="not-enrolled-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={18} style={{ color: '#ea580c' }} />
              <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: '#9a3412', margin: 0 }}>
                Unenrolled Mapped Cohort
              </h2>
            </div>

            <Badge variant="warning" size="sm">
              {notEnrolledChildren.length} Targets
            </Badge>
          </div>

          <Card>
            <CardBody>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ width: '180px' }}>
                  <Select
                    value={filterNotEnrBarangay}
                    onChange={(e) => setFilterNotEnrBarangay(e.target.value)}
                    options={[{ value: '', label: 'All Barangays' }, ...AVAILABLE_BARANGAYS.map((b) => ({ value: b, label: b }))]}
                    className="select-sm"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <Select
                    value={filterNotEnrAge}
                    onChange={(e) => setFilterNotEnrAge(e.target.value)}
                    options={[
                      { value: '', label: 'All Ages' },
                      { value: '1', label: '1 yr' },
                      { value: '2', label: '2 yrs' },
                      { value: '3', label: '3 yrs' },
                      { value: '4', label: '4 yrs' },
                    ]}
                    className="select-sm"
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <Select
                    value={filterNotEnrYear}
                    onChange={(e) => setFilterNotEnrYear(e.target.value)}
                    options={[
                      { value: '', label: 'Mapping Year' },
                      { value: '2026', label: '2026' },
                      { value: '2025', label: '2025' },
                    ]}
                    className="select-sm"
                  />
                </div>
                <div style={{ width: '220px' }}>
                  <Select
                    value={filterNotEnrStatus}
                    onChange={(e) => setFilterNotEnrStatus(e.target.value)}
                    options={[
                      { value: '', label: 'All Operational Statuses' },
                      { value: 'Mapped (Not Enrolled)', label: 'Mapped (Not Enrolled)' },
                      { value: 'Intake Pending', label: 'Intake Pending' },
                      { value: '4Ps Compliance Check Required', label: '4Ps Compliance Check' },
                      { value: 'Home Care (Underage for CDC)', label: 'Home Care (Underage)' },
                    ]}
                    className="select-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="table-container mobile-table-to-cards">
                <table className="table not-enrolled-table">
                  <TableHead>
                    <TableRow>
                      <TableHeader className="notenr-col-child">Child Name</TableHeader>
                      <TableHeader className="notenr-col-id">ECCD ID</TableHeader>
                      <TableHeader className="notenr-col-age">Age &amp; Sex</TableHeader>
                      <TableHeader className="notenr-col-brgy">Barangay &amp; Purok</TableHeader>
                      <TableHeader className="notenr-col-date">Mapping Date</TableHeader>
                      <TableHeader className="notenr-col-priority">Priority Target</TableHeader>
                      <TableHeader className="notenr-col-center">Nearest Center</TableHeader>
                      <TableHeader className="notenr-col-action" style={{ textAlign: 'right' }}>Action</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notEnrolledChildren.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                          No unenrolled children found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notEnrolledChildren.map((child) => {
                        const priority = child?.priorityTarget || (child?.ageYears >= 4 ? '4-Year-Old Priority' : 'Age 3 Target');
                        const isPriority = priority.includes('4-Year-Old');
                        const initials = getInitials(child.childName);
                        const formattedName = formatChildName(child.childName);
                        const guardianDisplay = child.parentGuardian
                          ? `Guardian: ${String(child.parentGuardian).toUpperCase()}${child.contactNumber ? ` (${child.contactNumber})` : ''}`
                          : null;

                        return (
                          <TableRow key={child.childId}>
                            {/* Child with Avatar */}
                            <TableCell className="notenr-col-child">
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
                                  {guardianDisplay && (
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                      {guardianDisplay}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* ECCD ID */}
                            <TableCell className="notenr-col-id">
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

                            {/* Age & Sex */}
                            <TableCell className="notenr-col-age">
                              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {[child.ageDisplay, child.sex].filter(Boolean).filter((v) => v !== '—').join(' • ') || '—'}
                              </span>
                            </TableCell>

                            {/* Barangay & Purok */}
                            <TableCell className="notenr-col-brgy">
                              <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{child.barangay}</div>
                              {child.purok && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                  {child.purok}
                                </div>
                              )}
                            </TableCell>

                            {/* Mapping Date */}
                            <TableCell className="notenr-col-date">
                              <span style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                {child.mappedDate || child.mappingDate || getPhilippinesDate()}
                              </span>
                            </TableCell>

                            {/* Priority Target */}
                            <TableCell className="notenr-col-priority">
                              <Badge variant={isPriority ? 'danger' : 'warning'} size="sm">
                                {priority}
                              </Badge>
                            </TableCell>

                            {/* Nearest Center */}
                            <TableCell className="notenr-col-center">
                              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {child.nearestCenter || 'San Isidro Child Development Center I'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-success-primary)', fontWeight: 600, marginTop: '2px' }}>
                                {child.availableSlots ?? 12} open slots
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="notenr-col-action" style={{ textAlign: 'right' }}>
                              {canEnroll ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={Plus}
                                  onClick={() => handleInitiateEnrollment(child)}
                                  title="Enroll in Child Development Center"
                                >
                                  Enroll
                                </Button>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Lock size={14} /> View Only
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: 3. ENROLL EXISTING CHILD (SEARCH & CONFIRMATION FLOW)
          ========================================================================= */}
      {activeTab === 'enroll-wizard' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Search for mapped children by name or ECCD Child ID to enroll without creating duplicate records">
              3. Enroll Existing Child
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ maxWidth: '640px', marginBottom: 'var(--space-5)' }}>
              <Input
                label="Search Mapped Children by Name or ECCD Child ID"
                placeholder="Type 'Juan', 'Princess', or 'ECCD-2026-000892'..."
                value={searchQuery}
                onChange={(e) => handleSearchCandidates(e.target.value)}
                leftIcon={<Search size={16} />}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Tip: Type partial names to find children mapped during house-to-house rounds.
              </span>
            </div>

            {/* Search Candidates List */}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Search Results ({searchResults.length} Children Found):
                </span>
                {searchResults.map((c) => (
                  <div
                    key={c.childId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      border: '1.5px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <strong style={{ fontSize: 'var(--font-size-md)' }}>{c.childName}</strong>
                        <code style={{ fontSize: 'var(--font-size-xs)' }}>{c.childId}</code>
                        <Badge variant="warning" size="sm">Mapped (Not Enrolled)</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {[
                          c.ageDisplay && `Age: ${c.ageDisplay}`,
                          c.sex,
                          c.barangay && `Barangay: ${c.barangay}`,
                          c.parentGuardian && `Guardian: ${c.parentGuardian}`,
                        ].filter(Boolean).join(' • ')}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleInitiateEnrollment(c)}
                    >
                      <UserCheck size={16} />
                      Select &amp; Enroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          MODAL: CHILD CONFIRMATION BEFORE ENROLLMENT & DETAILS
          ========================================================================= */}
      {selectedChildForEnrollment && (
        <Modal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          title="Child Admission Confirmation"
          subtitle="Verify existing child record to prevent duplicate entries"
          size="lg"
        >
          <form onSubmit={handleConfirmEnrollment}>
            {/* Child Confirmation Box */}
            <div className="enrollment-confirmation-box">
              <div className="enrollment-confirmation-header">
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {selectedChildForEnrollment.childName[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'bold' }}>
                    {selectedChildForEnrollment.childName}
                  </h3>
                  <code style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary-800)' }}>
                    Persistent ID: {selectedChildForEnrollment.childId}
                  </code>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Badge variant="success">Confirmed Mapped Record</Badge>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                <div><strong>Age & Sex:</strong> {selectedChildForEnrollment.ageDisplay} ({selectedChildForEnrollment.sex})</div>
                <div><strong>Birth Date:</strong> {selectedChildForEnrollment.birthDate}</div>
                <div><strong>Barangay:</strong> {selectedChildForEnrollment.barangay} ({selectedChildForEnrollment.purok})</div>
                <div><strong>Parent/Guardian:</strong> {selectedChildForEnrollment.parentGuardian}</div>
                <div><strong>Household ID:</strong> {selectedChildForEnrollment.householdId}</div>
              </div>
            </div>

            {/* Enrollment Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Day Care Center (Form 7 CDC)"
                  value={enrollmentForm.center}
                  onChange={(e) => {
                    const cdcName = e.target.value;
                    const cdcObj = availableCentersList.find((c) => c.name === cdcName);
                    const matchingWorker = availableWorkersList.find((w) =>
                      (Array.isArray(w.assignedCenters) && w.assignedCenters.some((ac) => ac.toLowerCase() === cdcName.toLowerCase())) ||
                      (cdcObj && w.assignedBarangay && w.assignedBarangay.toLowerCase() === (cdcObj.barangay || '').toLowerCase())
                    );
                    setEnrollmentForm({
                      ...enrollmentForm,
                      center: cdcName,
                      dayCareCenterId: cdcObj?.id || null,
                      teacher: matchingWorker ? `${matchingWorker.name}, ${matchingWorker.role || 'CDW I'}` : enrollmentForm.teacher,
                      workerId: matchingWorker?.id || enrollmentForm.workerId,
                    });
                  }}
                  options={
                    availableCentersList.length > 0
                      ? availableCentersList.map((c) => ({ value: c.name, label: `${c.name} (${c.barangay || 'San Fernando'})` }))
                      : AVAILABLE_CENTERS.map((c) => ({ value: c, label: c }))
                  }
                  required
                />
                <Select
                  label="School Year"
                  value={enrollmentForm.schoolYear}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, schoolYear: e.target.value })}
                  options={[
                    { value: 'SY 2026–2027', label: 'SY 2026–2027 (Active School Year)' },
                    { value: 'SY 2025–2026', label: 'SY 2025–2026' },
                  ]}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Assigned CDW / Teacher (Form 6)"
                  value={enrollmentForm.teacher}
                  onChange={(e) => {
                    const chosen = availableWorkersList.find((w) => `${w.name}, ${w.role || 'CDW I'}` === e.target.value || w.name === e.target.value);
                    setEnrollmentForm({
                      ...enrollmentForm,
                      teacher: e.target.value,
                      workerId: chosen?.id || null,
                    });
                  }}
                  options={
                    availableWorkersList.length > 0
                      ? availableWorkersList.map((w) => ({
                          value: `${w.name}, ${w.role || 'CDW I'}`,
                          label: `${w.name} (${w.assignedBarangay || 'San Fernando'}) — ${w.role || 'CDW I'}`,
                        }))
                      : [{ value: 'Maria Santos, CDW I', label: 'Maria Santos, CDW I' }]
                  }
                  required
                />
                <Select
                  label="Enrollment Status"
                  value={enrollmentForm.status}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, status: e.target.value })}
                  options={[
                    { value: 'Enrolled', label: 'Enrolled' },
                    { value: 'Conditionally Enrolled', label: 'Conditionally Enrolled' },
                    { value: 'Waitlisted', label: 'Waitlisted' },
                  ]}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Input
                  label="Enrollment Date"
                  type="date"
                  value={enrollmentForm.enrollmentDate}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, enrollmentDate: e.target.value })}
                  required
                />
                <Select
                  label="Program Modality"
                  value={enrollmentForm.program}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, program: e.target.value })}
                  options={[
                    { value: 'Child Development Center (CDC)', label: 'Child Development Center (CDC)' },
                    { value: 'Supervised Neighborhood Play (SNP)', label: 'Supervised Neighborhood Play (SNP)' },
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Session Schedule"
                  value={enrollmentForm.session}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, session: e.target.value })}
                  options={[
                    { value: 'Morning Session (8:00 AM – 11:00 AM)', label: 'Morning Session (8:00 AM – 11:00 AM)' },
                    { value: 'Afternoon Session (1:00 PM – 4:00 PM)', label: 'Afternoon Session (1:00 PM – 4:00 PM)' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setIsEnrollModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  <CheckCircle2 size={16} />
                  Confirm & Commit Enrollment
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: 4. ENROLLMENT HISTORY
          ========================================================================= */}
      {historyChild && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Enrollment History: ${historyChild.childName}`}
          subtitle={`ECCD Master ID: ${historyChild.childId}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {historyChild.records.map((rec, i) => (
              <div key={i} className="enrollment-history-item">
                <div>
                  <div style={{ fontWeight: 'bold' }}>{rec.schoolYear} — {rec.center}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Program: {rec.program || 'CDC'} • Session: {rec.session || 'Morning'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Admitted on: {rec.enrollmentDate || 'Archived'}
                  </div>
                </div>
                <Badge variant={rec.status === 'Enrolled' ? 'success' : 'neutral'}>
                  {rec.status}
                </Badge>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default EnrollmentView;
