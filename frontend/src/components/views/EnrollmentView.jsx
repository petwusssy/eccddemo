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

export function EnrollmentView({ onNavigate }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const isFieldWorker = user?.role === 'field_worker';

  // Active sub-view: 'directory' | 'not-enrolled' | 'enroll-wizard'
  const [activeTab, setActiveTab] = useState('directory');

  // Datasets
  const [enrollments, setEnrollments] = useState([]);
  const [notEnrolledChildren, setNotEnrolledChildren] = useState([]);
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
    program: 'Child Development Center (CDC)',
    session: 'Morning Session (8:00 AM – 11:00 AM)',
    schoolYear: 'SY 2026–2027',
    enrollmentDate: getPhilippinesDate(),
    status: 'Enrolled',
    teacher: 'Maria Santos, CDW I',
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
    if (isFieldWorker) {
      addToast('Admission restricted: Only Child Development Workers (CDWs) can enroll children.', 'warning');
      return;
    }
    setSelectedChildForEnrollment(child);
    setEnrollmentForm({
      ...enrollmentForm,
      center: child.nearestCenter || 'San Isidro Child Development Center I',
    });
    setIsEnrollModalOpen(true);
  };

  // Confirm and submit enrollment
  const handleConfirmEnrollment = async (e) => {
    e.preventDefault();
    if (isFieldWorker) {
      addToast('Admission restricted: Only Child Development Workers (CDWs) can enroll children.', 'warning');
      return;
    }
    if (!selectedChildForEnrollment) return;

    const res = await enrollmentService.enrollChild({
      childId: selectedChildForEnrollment.childId,
      childName: selectedChildForEnrollment.childName,
      birthDate: selectedChildForEnrollment.birthDate,
      ageDisplay: selectedChildForEnrollment.ageDisplay,
      sex: selectedChildForEnrollment.sex,
      barangay: selectedChildForEnrollment.barangay,
      center: enrollmentForm.center,
      program: enrollmentForm.program,
      session: enrollmentForm.session,
      schoolYear: enrollmentForm.schoolYear,
      enrollmentDate: enrollmentForm.enrollmentDate,
      status: enrollmentForm.status,
      teacher: enrollmentForm.teacher,
    });

    addToast(res.message, 'success');
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
            <h1 className="page-title">Day Care &amp; CDC Enrollment</h1>
            <Badge variant="primary" size="sm">SY 2026–2027</Badge>
          </div>
          <p className="page-subtitle">
            Community mapping to Day Care admission tracking and enrollment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {!isFieldWorker ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('enroll-wizard')}
            >
              <Plus size={16} />
              Enroll Existing Child
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
              <Lock size={16} />
              <span>Admission: CDW Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Enrollments
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
              {enrollments.length}
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
            <School size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Not Enrolled Queue
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
              {notEnrolledChildren.length}
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
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4-Year-Old Priority
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-danger-600)', marginTop: '2px' }}>
              {notEnrolledChildren.filter((c) => c?.priorityTarget?.includes('4-Year-Old') || c?.ageYears >= 4).length}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-50)',
              color: 'var(--color-danger-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Baby size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enrollment Ratio
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary-600)', marginTop: '2px' }}>
              {Math.round((enrollments.length / ((enrollments.length + notEnrolledChildren.length) || 1)) * 100)}%
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
            <UserCheck size={18} />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          6. IMPORTANT UX: MAPPED → NOT ENROLLED → ENROLLED LIFECYCLE STRIP
          ------------------------------------------------------------- */}
      <div className="enrollment-lifecycle-strip" role="region" aria-label="ECCD Lifecycle Progression">
        <div className="lifecycle-stage">
          <span className="lifecycle-badge" style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--text-primary)' }}>
            1. Mapped
          </span>
          <span>Community Mapping</span>
        </div>

        <ArrowRight size={16} className="lifecycle-arrow" />

        <div className="lifecycle-stage">
          <span className="lifecycle-badge" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-primary)', border: '1px solid var(--color-warning-border)' }}>
            2. Not Enrolled
          </span>
          <span>Target for Admission ({notEnrolledChildren.length})</span>
        </div>

        <ArrowRight size={16} className="lifecycle-arrow" />

        <div className="lifecycle-stage active">
          <span className="lifecycle-badge" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)', border: '1px solid var(--color-success-border)' }}>
            3. Enrolled
          </span>
          <span>Active in Day Care ({enrollments.length})</span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-800)', fontWeight: 'bold' }}>
          * ZERO DUPLICATE GUARANTEE: Persistent Child ID Reused
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
              <CardTitle subtitle="Master directory of admitted children for the current school year">
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
                  options={[{ value: '', label: 'All Day Care Centers' }, ...AVAILABLE_CENTERS.map((c) => ({ value: c, label: c }))]}
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Child</TableHeader>
                    <TableHeader>ECCD ID</TableHeader>
                    <TableHeader>Barangay</TableHeader>
                    <TableHeader>Day Care Center</TableHeader>
                    <TableHeader>School Year</TableHeader>
                    <TableHeader>Enrollment Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader style={{ textAlign: 'right' }}>Actions</TableHeader>
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
                    enrollments.map((enr) => (
                      <TableRow key={enr.id}>
                        <TableCell>
                          <strong>{enr.childName}</strong>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {enr.ageDisplay} • {enr.sex}
                          </div>
                        </TableCell>

                        <TableCell>
                          <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-neutral-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                            {enr.childId}
                          </code>
                        </TableCell>

                        <TableCell>{enr.barangay}</TableCell>

                        <TableCell>
                          <div style={{ fontWeight: '500' }}>{enr.center}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {enr.session}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="neutral" size="sm">{enr.schoolYear}</Badge>
                        </TableCell>

                        <TableCell style={{ fontSize: 'var(--font-size-xs)' }}>
                          {enr.enrollmentDate}
                        </TableCell>

                        <TableCell>
                          <Badge variant="success" size="sm">
                            {enr.status}
                          </Badge>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewHistory(enr)}
                          >
                            <History size={16} />
                            History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Child Name</TableHeader>
                      <TableHeader>ECCD ID</TableHeader>
                      <TableHeader>Age &amp; Sex</TableHeader>
                      <TableHeader>Barangay &amp; Purok</TableHeader>
                      <TableHeader>Mapping Date</TableHeader>
                      <TableHeader>Priority Target</TableHeader>
                      <TableHeader>Nearest Center</TableHeader>
                      <TableHeader style={{ textAlign: 'right' }}>Action</TableHeader>
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

                        return (
                          <TableRow key={child.childId}>
                            <TableCell>
                              <strong>{child.childName}</strong>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                Guardian: {child.parentGuardian} ({child.contactNumber})
                              </div>
                            </TableCell>

                            <TableCell>
                              <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-warning-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                                {child.childId}
                              </code>
                            </TableCell>

                            <TableCell>{child.ageDisplay} • {child.sex}</TableCell>

                            <TableCell>
                              <div>{child.barangay}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{child.purok}</div>
                            </TableCell>

                            <TableCell style={{ fontSize: 'var(--font-size-xs)' }}>
                              {child.mappedDate || child.mappingDate || getPhilippinesDate()}
                            </TableCell>

                            <TableCell>
                              <Badge variant={isPriority ? 'danger' : 'warning'} size="sm">
                                {priority}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500' }}>{child.nearestCenter || 'San Isidro Child Development Center I'}</span>
                              <div style={{ fontSize: '11px', color: 'var(--color-success-primary)' }}>
                                {child.availableSlots ?? 12} open slots
                              </div>
                            </TableCell>

                          <TableCell style={{ textAlign: 'right' }}>
                            {!isFieldWorker ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleInitiateEnrollment(child)}
                              >
                                <Plus size={16} />
                                Enroll
                              </Button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={14} /> CDW Only
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  </TableBody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: 3. ENROLL EXISTING CHILD (SEARCH & CONFIRMATION FLOW)
          ========================================================================= */}
      {activeTab === 'enroll-wizard' && (
        isFieldWorker ? (
          <Card>
            <CardBody style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <ShieldAlert size={36} style={{ color: '#f59e0b', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admission Action Restricted</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '8px auto var(--space-4)' }}>
                Field workers can track not-enrolled children from house-to-house mapping, but official Day Care admission is reserved for accredited Child Development Workers (CDWs).
              </p>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('not-enrolled')}>
                Back to Not-Enrolled Children List
              </Button>
            </CardBody>
          </Card>
        ) : (
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
                        Age: {c.ageDisplay} • {c.sex} • Barangay: {c.barangay} • Guardian: {c.parentGuardian}
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
        )
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
                  label="Day Care Center"
                  value={enrollmentForm.center}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, center: e.target.value })}
                  options={AVAILABLE_CENTERS.map((c) => ({ value: c, label: c }))}
                  required
                />
                <Select
                  label="School Year"
                  value={enrollmentForm.schoolYear}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, schoolYear: e.target.value })}
                  options={[
                    { value: 'SY 2026–2027', label: 'SY 2026–2027' },
                    { value: 'SY 2025–2026', label: 'SY 2025–2026' },
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
                <Select
                  label="Program Modality"
                  value={enrollmentForm.program}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, program: e.target.value })}
                  options={[
                    { value: 'Child Development Center (CDC)', label: 'Child Development Center (CDC)' },
                    { value: 'Supervised Neighborhood Play (SNP)', label: 'Supervised Neighborhood Play (SNP)' },
                  ]}
                />
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
