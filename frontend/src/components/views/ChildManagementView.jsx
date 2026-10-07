import React, { useState, useEffect, useMemo } from 'react';
import {
  Baby,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  MapPin,
  School,
  HeartPulse,
  Brain,
  AlertTriangle,
  Clock,
  Plus,
  Phone,
  FileCheck2,
  Users,
  ShieldCheck,
  UserCheck,
  Building2,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ClipboardList,
  Eye,
  Check,
  X,
  Stethoscope,
  ExternalLink,
  FileText,
  Home,
  Upload,
  Cloud,
  Paperclip,
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
import { childService } from '../../services/childService';
import { apiClient } from '../../services/apiClient';
import { OfficialRegistrationFormModal } from '../forms/OfficialRegistrationFormModal';
import { OfficialForm1HomeProfileModal } from '../forms/OfficialForm1HomeProfileModal';
import { OfficialForm2ChildProfileModal } from '../forms/OfficialForm2ChildProfileModal';
import { OfficialForm5ConsolidatedReport } from '../forms/OfficialForm5ConsolidatedReport';
import { OfficialEccdChecklistModal } from '../forms/OfficialEccdChecklistModal';
import { EccdManualReferenceModal } from '../forms/EccdManualReferenceModal';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';

const AVAILABLE_BARANGAYS = SAN_FERNANDO_BARANGAYS;

// Safe pillar resolution helpers to prevent render crashes on newly mapped or partial records
const isChildEnrolled = (child) =>
  Boolean(
    child?.statusPillars?.enrolled?.status === 'Enrolled' ||
    child?.enrollment?.enrolled ||
    child?.enrollmentStatus === 'Enrolled' ||
    child?.isEnrolled
  );

const getChildEnrollmentStatus = (child) =>
  child?.statusPillars?.enrolled?.status ||
  child?.enrollmentStatus ||
  (isChildEnrolled(child) ? 'Enrolled' : 'Not Enrolled');

const getChildEnrollmentVariant = (child) =>
  child?.statusPillars?.enrolled?.variant ||
  (isChildEnrolled(child) ? 'success' : (getChildEnrollmentStatus(child) === 'Conditionally Enrolled' ? 'warning' : 'neutral'));

const getChildEnrollmentCenter = (child) =>
  child?.statusPillars?.enrolled?.center ||
  child?.dayCareCenterName ||
  child?.dayCareCenter ||
  (isChildEnrolled(child) ? 'Assigned Day Care Center' : 'No Day Care assigned');

export function ChildManagementView({ initialChildId, onNavigate }) {
  const { addToast } = useToast();

  // Mode: 'directory' or 'profile'
  const [viewMode, setViewMode] = useState(initialChildId ? 'profile' : 'directory');
  const [selectedChildId, setSelectedChildId] = useState(initialChildId || null);

  // Directory Data & Filter States
  const [childrenList, setChildrenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterEnrollment, setFilterEnrollment] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [filterDevelopment, setFilterDevelopment] = useState('');
  const [filterFollowUp, setFilterFollowUp] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterAge, setFilterAge] = useState('');

  // 360° Profile Active Tab: 'overview' | 'family' | 'enrollment' | 'health' | 'development' | 'followups' | 'timeline'
  const [profileTab, setProfileTab] = useState('overview');
  const [childProfile, setChildProfile] = useState(null);

  // Quick Action Modal States
  const [activeQuickAction, setActiveQuickAction] = useState(null); // 'enrollment' | 'health' | 'assessment' | 'followup'
  const [enrollForm, setEnrollForm] = useState({
    center: 'San Isidro Child Development Center I',
    program: 'Child Development Center (CDC)',
    session: 'Morning Session (8:00 AM – 11:00 AM)',
  });
  const [healthForm, setHealthForm] = useState({
    weightKg: '14.5',
    heightCm: '96.5',
    nutritionalStatus: 'Normal Weight for Age',
    type: 'OPT Plus Anthropometric Weighing',
    remarks: 'Routine weighing and nutritional check recorded.',
  });
  const [assessmentForm, setAssessmentForm] = useState({
    cycle: '2nd Assessment Cycle (SY 2026–2027)',
    scaledScore: '105',
    evaluator: 'Maria Santos, CDW I',
  });
  const [followUpForm, setFollowUpForm] = useState({
    title: 'Gross Motor Development Guided Session',
    issue: 'Follow-up on balance exercises and parent guidance.',
    priority: 'Urgent',
    dueDate: '2026-11-30',
  });

  // Official Form Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForm1ModalOpen, setIsForm1ModalOpen] = useState(false);
  const [isForm2ModalOpen, setIsForm2ModalOpen] = useState(false);
  const [isForm5ModalOpen, setIsForm5ModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUploadingS3, setIsUploadingS3] = useState(false);

  // AWS S3 Document & Photo Uploader Handler
  const handleUploadChildDocument = async (e, customCategory = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('File exceeds 5MB limit. Please upload a smaller document.', 'error');
      return;
    }

    setIsUploadingS3(true);
    addToast(`Uploading ${file.name} to AWS S3...`, 'info');

    try {
      const isImage = file.type.startsWith('image/');
      const category = customCategory || (isImage ? 'child-photos' : 'documents');
      const res = await apiClient.uploadS3(file, {
        child_id: selectedChildId,
        category,
        description: isImage ? 'Child Profile Photo' : 'ECCD Verification Attachment',
      });

      if (res.ok && res.data) {
        const docRecord = {
          id: `DOC-${Date.now()}`,
          name: res.data.filename,
          url: res.data.url,
          path: res.data.path,
          extension: res.data.extension,
          sizeBytes: res.data.size_bytes,
          uploadedAt: res.data.uploaded_at,
          category,
          s3Bucket: res.data.s3_bucket,
          s3Prefix: res.data.s3_prefix,
        };

        setChildProfile((prev) => {
          if (!prev) return prev;
          const updatedDocs = [...(prev.documents || []), docRecord];
          const updatedPhoto = isImage ? res.data.url : prev.photoUrl;
          return {
            ...prev,
            photoUrl: updatedPhoto,
            documents: updatedDocs,
          };
        });

        const successMessage = res.message || res.data?.message || 'File uploaded to AWS S3 successfully!';
        addToast(successMessage, 'success');
      } else {
        const errorMessage = res.error?.message || res.message || res.error || 'Failed to upload document to S3';
        addToast(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), 'error');
      }
    } catch (err) {
      console.error('Error uploading S3 document:', err);
      const catchMessage = err.response?.data?.message || err.message || 'Failed to upload file to S3';
      addToast(catchMessage, 'error');
    } finally {
      setIsUploadingS3(false);
      e.target.value = '';
    }
  };

  const handleTestS3Connection = async () => {
    addToast('Testing AWS S3 live connection...', 'info');
    try {
      const res = await apiClient.testS3();
      if (res.ok) {
        addToast(
          `AWS S3 Online! Bucket: ${res.data?.bucket || 'configured'} (${res.data?.latency_ms || 35}ms)`,
          'success'
        );
      } else {
        addToast(res.message || res.error || 'AWS S3 connection failed', 'error');
      }
    } catch (err) {
      addToast('Unable to reach S3 endpoint. Falling back to local demo storage.', 'warning');
    }
  };

  // Load directory list
  const loadDirectory = async () => {
    setLoading(true);
    try {
      const data = await childService.getChildren({
        search,
        barangay: filterBarangay,
        enrollmentStatus: filterEnrollment,
        healthStatus: filterHealth,
        developmentStatus: filterDevelopment,
        followUpStatus: filterFollowUp,
        sex: filterSex,
        age: filterAge,
      });
      setChildrenList(data.children || []);
    } catch (e) {
      console.error('Error fetching children directory:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load single child 360° profile
  const loadProfile = async (id) => {
    setLoading(true);
    try {
      const child = await childService.getChildById(id);
      setChildProfile(child);
    } catch (e) {
      console.error('Error fetching child 360 profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'directory') {
      loadDirectory();
    } else if (viewMode === 'profile' && selectedChildId) {
      loadProfile(selectedChildId);
    }
  }, [viewMode, selectedChildId, search, filterBarangay, filterEnrollment, filterHealth, filterDevelopment, filterFollowUp, filterSex, filterAge]);

  useEffect(() => {
    const handleStoreUpdate = () => {
      if (viewMode === 'directory') {
        loadDirectory();
      } else if (viewMode === 'profile' && selectedChildId) {
        loadProfile(selectedChildId);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleStoreUpdate();
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
  }, [viewMode, selectedChildId]);

  // 3. Golden Path Lifecycle Indicator Calculation based on actual records
  const goldenPath = useMemo(() => {
    if (!childProfile) return [];

    // Step 1: Mapped
    const isMapped = true; // All registered children in master registry are mapped
    const mappedDate = childProfile.statusPillars?.mapped?.date || childProfile.createdAt?.slice(0, 10) || 'Completed';

    // Step 2: Enrolled (CDC)
    const isEnrolled = isChildEnrolled(childProfile);
    const enrolledCenter = getChildEnrollmentCenter(childProfile);

    // Step 3: Health Monitored
    const hasHealthRecords = childProfile.healthRecords && childProfile.healthRecords.length > 0;
    const isHealthMonitored = hasHealthRecords || childProfile.statusPillars?.health?.status === 'Up to date';
    const healthStatus = childProfile.statusPillars?.health?.nutritionalStatus || (hasHealthRecords ? 'Up to date' : 'Pending OPT Plus');

    // Step 4: ECCD Assessed
    const hasAssessments = childProfile.developmentAssessments && childProfile.developmentAssessments.length > 0;
    const isEccdAssessed = hasAssessments || (childProfile.statusPillars?.development?.status && !childProfile.statusPillars.development.status.includes('Pending') && !childProfile.statusPillars.development.status.includes('None'));
    const assessScore = childProfile.statusPillars?.development?.scaledScore
      ? `Score: ${childProfile.statusPillars.development.scaledScore}`
      : (hasAssessments ? 'Assessed' : 'Pending Assessment');

    // Step 5: DepEd Kinder Ready
    const devStatus = (childProfile.statusPillars?.development?.status || '').toLowerCase();
    const hasDevDelay = devStatus.includes('delay') || (childProfile.statusPillars?.development?.scaledScore && childProfile.statusPillars.development.scaledScore < 79);
    const isDepEdKinderReady = (childProfile.ageYears >= 5 && isEccdAssessed) || (childProfile.ageYears >= 4 && isEccdAssessed && !hasDevDelay);

    return [
      {
        step: 1,
        title: '1. Mapped by Field Worker',
        subtitle: isMapped ? `Mapped (${mappedDate})` : 'Pending Mapping',
        isCompleted: isMapped,
      },
      {
        step: 2,
        title: '2. Admitted by CDW',
        subtitle: isEnrolled ? (enrolledCenter.length > 20 ? `${enrolledCenter.slice(0, 18)}...` : enrolledCenter) : 'Pending CDC Slot',
        isCompleted: isEnrolled,
      },
      {
        step: 3,
        title: '3. Monthly OPT Plus Logged',
        subtitle: isHealthMonitored ? healthStatus : 'Pending OPT Plus',
        isCompleted: isHealthMonitored,
      },
      {
        step: 4,
        title: '4. ECCD Checklist Assessed',
        subtitle: isEccdAssessed ? assessScore : 'Pending Checklist',
        isCompleted: isEccdAssessed,
      },
      {
        step: 5,
        title: '5. DepEd Kinder Handover Ready',
        subtitle: isDepEdKinderReady ? 'Kindergarten Ready' : (childProfile.ageYears >= 4 ? 'Transition Eligible' : 'Early Prep Stage'),
        isCompleted: isDepEdKinderReady,
      },
    ];
  }, [childProfile]);

  // Open 360° Profile for a child
  const handleOpenProfile = (childId) => {
    setSelectedChildId(childId);
    setViewMode('profile');
    setProfileTab('overview');
  };

  // Handle Quick Action Submissions
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    await childService.addEnrollment(selectedChildId, enrollForm);
    addToast('Enrollment record updated successfully!', 'success');
    setActiveQuickAction(null);
    loadProfile(selectedChildId);
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    await childService.recordHealth(selectedChildId, healthForm);
    addToast('Health monitoring record logged successfully!', 'success');
    setActiveQuickAction(null);
    loadProfile(selectedChildId);
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    await childService.startDevelopmentAssessment(selectedChildId, assessmentForm);
    addToast('ECCD Development assessment saved!', 'success');
    setActiveQuickAction(null);
    loadProfile(selectedChildId);
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    await childService.createFollowUp(selectedChildId, followUpForm);
    addToast('Follow-up case created and assigned!', 'success');
    setActiveQuickAction(null);
    loadProfile(selectedChildId);
  };

  return (
    <div className="child-management-page">
      {/* =========================================================================
          VIEW MODE 1: CHILDREN DIRECTORY
          ========================================================================= */}
      {viewMode === 'directory' && (
        <div>
          {/* Header */}
          <div className="page-header" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="page-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h1 className="page-title">Children Master Registry</h1>
                <Badge variant="primary" size="sm">0–4 Cohort</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForm5ModalOpen(true)}
              >
                <FileText size={16} />
                ECCD Form 5
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                <Plus size={16} />
                Register Child
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bento Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div className="bento-stat-card card-primary">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Registered
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {childrenList.length}
                </div>
              </div>
              <div className="stat-icon-wrap">
                <Baby size={18} />
              </div>
            </div>

            <div className="bento-stat-card card-success">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Enrolled in CDC
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-600)', marginTop: '2px' }}>
                  {childrenList.filter(isChildEnrolled).length}
                </div>
              </div>
              <div className="stat-icon-wrap">
                <School size={18} />
              </div>
            </div>

            <div className="bento-stat-card card-warning">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Unenrolled Target
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-warning-600)', marginTop: '2px' }}>
                  {childrenList.filter((c) => !isChildEnrolled(c)).length}
                </div>
              </div>
              <div className="stat-icon-wrap">
                <Users size={18} />
              </div>
            </div>

            <div className="bento-stat-card card-danger">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Follow-ups
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-danger-600)', marginTop: '2px' }}>
                  {childrenList.filter((c) => c?.hasOpenFollowUp || c?.statusPillars?.followUp?.status === 'Active' || c?.statusPillars?.followUp?.variant === 'danger' || c?.statusPillars?.followUp?.variant === 'warning').length}
                </div>
              </div>
              <div className="stat-icon-wrap">
                <AlertTriangle size={18} />
              </div>
            </div>
          </div>

          {/* Search & Multi-field Filters Card */}
          <Card style={{ marginBottom: 'var(--space-3)' }}>
            <CardBody style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Search Bar */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '260px' }}>
                    <Input
                      placeholder="Search child name, ECCD ID, barangay or center..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
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
                  <div style={{ width: '160px' }}>
                    <Select
                      value={filterEnrollment}
                      onChange={(e) => setFilterEnrollment(e.target.value)}
                      options={[
                        { value: '', label: 'All Enrollment' },
                        { value: 'Enrolled', label: 'Enrolled' },
                        { value: 'Not Enrolled', label: 'Not Enrolled' },
                        { value: 'Enrollment Pending', label: 'Pending' },
                      ]}
                      className="select-sm"
                    />
                  </div>
                </div>

                {/* Secondary Filter Row */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <div style={{ width: '150px' }}>
                    <Select
                      value={filterHealth}
                      onChange={(e) => setFilterHealth(e.target.value)}
                      options={[
                        { value: '', label: 'Health Status' },
                        { value: 'Up to date', label: 'Up to date' },
                        { value: 'Overdue', label: 'Overdue' },
                      ]}
                      className="select-sm"
                    />
                  </div>
                  <div style={{ width: '160px' }}>
                    <Select
                      value={filterDevelopment}
                      onChange={(e) => setFilterDevelopment(e.target.value)}
                      options={[
                        { value: '', label: 'Dev Assessment' },
                        { value: 'Completed (Standard)', label: 'Completed' },
                        { value: 'Follow-up Needed', label: 'Follow-up Needed' },
                        { value: 'Pending Evaluation', label: 'Pending' },
                      ]}
                      className="select-sm"
                    />
                  </div>
                  <div style={{ width: '140px' }}>
                    <Select
                      value={filterFollowUp}
                      onChange={(e) => setFilterFollowUp(e.target.value)}
                      options={[
                        { value: '', label: 'Follow-up Case' },
                        { value: 'Active', label: 'Active Case' },
                        { value: 'None', label: 'No Open Case' },
                      ]}
                      className="select-sm"
                    />
                  </div>
                  <div style={{ width: '110px' }}>
                    <Select
                      value={filterSex}
                      onChange={(e) => setFilterSex(e.target.value)}
                      options={[
                        { value: '', label: 'Sex' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Male', label: 'Male' },
                      ]}
                      className="select-sm"
                    />
                  </div>
                  <div style={{ width: '110px' }}>
                    <Select
                      value={filterAge}
                      onChange={(e) => setFilterAge(e.target.value)}
                      options={[
                        { value: '', label: 'Age' },
                        { value: '2', label: '2 yrs' },
                        { value: '3', label: '3 yrs' },
                        { value: '4', label: '4 yrs' },
                      ]}
                      className="select-sm"
                    />
                  </div>

                  {(search || filterBarangay || filterEnrollment || filterHealth || filterDevelopment || filterFollowUp || filterSex || filterAge) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setFilterBarangay('');
                        setFilterEnrollment('');
                        setFilterHealth('');
                        setFilterDevelopment('');
                        setFilterFollowUp('');
                        setFilterSex('');
                        setFilterAge('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Directory Table */}
          <div className="table-container mobile-table-to-cards">
            <table className="table child-registry-table">
              <TableHead>
                <TableRow>
                  <TableHeader className="child-col-name">Child</TableHeader>
                  <TableHeader className="child-col-id">ECCD ID</TableHeader>
                  <TableHeader className="child-col-age">Age</TableHeader>
                  <TableHeader className="child-col-brgy">Barangay</TableHeader>
                  <TableHeader className="child-col-enrollment">Enrollment</TableHeader>
                  <TableHeader className="child-col-health">Health</TableHeader>
                  <TableHeader className="child-col-dev">Development</TableHeader>
                  <TableHeader className="child-col-fup">Follow-up</TableHeader>
                  <TableHeader className="child-col-action">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {childrenList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                      No children records found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  childrenList.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell className="child-col-name">
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
                            {child.firstName?.[0] || ''}{child.lastName?.[0] || ''}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {child.fullName}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {[child.sex, child.parentGuardian && `Guardian: ${child.parentGuardian}`].filter(Boolean).join(' • ') || '—'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="child-col-id">
                        <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-neutral-100)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                          {child.id}
                        </code>
                      </TableCell>

                      <TableCell className="child-col-age">
                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{child.ageDisplay}</span>
                      </TableCell>

                      <TableCell className="child-col-brgy">
                        <div style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{child.barangay}</div>
                        {child.purok && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{child.purok}</div>}
                      </TableCell>

                      <TableCell className="child-col-enrollment">
                        <Badge variant={getChildEnrollmentVariant(child)} size="sm">
                           {getChildEnrollmentStatus(child)}
                        </Badge>
                      </TableCell>

                      <TableCell className="child-col-health">
                        <Badge variant={child?.statusPillars?.health?.variant || 'warning'} size="sm">
                          {child?.statusPillars?.health?.status || child?.healthStatus || 'Due for Monitoring'}
                        </Badge>
                      </TableCell>

                      <TableCell className="child-col-dev">
                        <Badge variant={child?.statusPillars?.development?.variant || 'neutral'} size="sm">
                          {child?.statusPillars?.development?.status || child?.developmentStatus || 'Pending Initial Assessment'}
                        </Badge>
                      </TableCell>

                      <TableCell className="child-col-fup">
                        <Badge variant={child?.statusPillars?.followUp?.variant || 'neutral'} size="sm">
                          {child?.statusPillars?.followUp?.status || (child?.hasOpenFollowUp ? 'Active Case' : 'None')}
                        </Badge>
                      </TableCell>

                      <TableCell className="child-col-action">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenProfile(child.id)}
                        >
                          <Eye size={15} />
                          Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CHILD 360° PROFILE (HERO FEATURE OF ECCD CARE)
          ========================================================================= */}
      {viewMode === 'profile' && !childProfile && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', margin: 'var(--space-4) 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>No child profile record selected.</p>
          <Button variant="outline" size="sm" onClick={() => setViewMode('directory')}>
            <ArrowLeft size={16} style={{ marginRight: 'var(--space-2)' }} />
            Back to Directory
          </Button>
        </div>
      )}

      {viewMode === 'profile' && childProfile && (
        <div className="child-360-profile-container">
          {/* Back button */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('directory')}>
              <ArrowLeft size={16} />
              Back to Directory
            </Button>
          </div>

          {/* -------------------------------------------------------------
              HERO HEADER BANNER & 5 STATUS INDICATORS
              ------------------------------------------------------------- */}
          <div className="child-360-hero-banner" role="region" aria-label="Child 360 Master Record">
            <div className="child-360-header-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {/* Child Avatar with AWS S3 Photo & Upload Support */}
                <div style={{ position: 'relative' }}>
                  {childProfile.photoUrl ? (
                    <img
                      src={childProfile.photoUrl}
                      alt={childProfile.fullName}
                      className="child-avatar-badge"
                      style={{ objectFit: 'cover', border: '2px solid #22c55e', padding: 0 }}
                    />
                  ) : (
                    <div className="child-avatar-badge">
                      {childProfile.firstName[0]}{childProfile.lastName[0]}
                    </div>
                  )}
                  <label
                    title="Upload Child Photo to AWS S3"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: isUploadingS3 ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingS3}
                      style={{ display: 'none' }}
                      onChange={(e) => handleUploadChildDocument(e, 'child-photos')}
                    />
                  </label>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                      {childProfile.fullName}
                    </h1>
                    <span className="child-id-pill" style={{ color: '#ffffff' }}>
                      <ShieldCheck size={16} />
                      {childProfile.id}
                    </span>
                    {childProfile.photoUrl && (
                      <span className="child-id-pill" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                        <Cloud size={16} />
                        AWS S3 Storage
                      </span>
                    )}
                  </div>

                  <div className="child-demographics-strip">
                    <span className="child-demo-item">
                      <Baby size={16} />
                      {childProfile.ageDisplay}{childProfile.sex ? ` (${childProfile.sex})` : ''}
                    </span>
                    <span>•</span>
                    <span className="child-demo-item">
                      <Calendar size={16} />
                      DOB: {childProfile.birthDate || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="child-demo-item">
                      <MapPin size={16} />
                      {childProfile.barangay || 'San Fernando'}{childProfile.purok ? ` (${childProfile.purok})` : ''}
                    </span>
                    <span>•</span>
                    <span className="child-demo-item">
                      <Users size={16} />
                      Guardian: {childProfile.parentGuardian || 'N/A'}
                      {(childProfile.guardianRelationship || childProfile.guardianContact || childProfile.contactNumber) ? ` (${childProfile.guardianRelationship || childProfile.guardianContact || childProfile.contactNumber})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* LGU Tag */}
              <div style={{ textAlign: 'right' }}>
                <Badge variant="primary" size="sm">
                  ONE CHILD = ONE RECORD
                </Badge>
                <div style={{ fontSize: '11px', color: 'var(--color-primary-200)', marginTop: '4px' }}>
                  City of San Fernando CSWDO
                </div>
              </div>
            </div>

            {/* =============================================================
                5-STEP MILESTONE PROGRESS TRACKER
                ============================================================= */}
            <div
              style={{
                margin: '14px 0 0 0',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {goldenPath.map((stage, idx) => (
                  <React.Fragment key={stage.step}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: '165px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: stage.isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        border: stage.isCompleted ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.14)',
                        boxShadow: stage.isCompleted ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          background: stage.isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                        }}
                      >
                        {stage.isCompleted ? <Check size={14} strokeWidth={3} /> : stage.step}
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: stage.isCompleted ? '#4ade80' : '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {stage.title}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: stage.isCompleted ? '#bbf7d0' : '#cbd5e1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {stage.subtitle}
                        </div>
                      </div>
                    </div>

                    {idx < goldenPath.length - 1 && (
                      <ChevronRight
                        size={16}
                        style={{
                          color: stage.isCompleted && goldenPath[idx + 1].isCompleted ? '#34d399' : 'rgba(255, 255, 255, 0.28)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              5. QUICK ACTIONS STRIP
              ------------------------------------------------------------- */}
          <div className="child-quick-actions">
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 'var(--space-2)' }}>
              Quick Actions:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveQuickAction('enrollment')}
            >
              <Plus size={16} />
              Enrollment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveQuickAction('health')}
            >
              <Plus size={16} />
              Health Record
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveQuickAction('assessment')}
            >
              <Plus size={16} />
              Assessment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveQuickAction('followup')}
            >
              <Plus size={16} />
              Follow-up
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsForm2ModalOpen(true)}
            >
              <FileText size={16} />
              Official Form 2
            </Button>
          </div>

          {/* -------------------------------------------------------------
              7 PROFILE TABS NAVIGATION
              ------------------------------------------------------------- */}
          <div className="child-tabs-bar" role="tablist">
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'overview' ? 'active' : ''}`}
              onClick={() => setProfileTab('overview')}
            >
              <Sparkles size={16} />
              <span>Overview</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'family' ? 'active' : ''}`}
              onClick={() => setProfileTab('family')}
            >
              <Users size={16} />
              <span>Family & Household</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'enrollment' ? 'active' : ''}`}
              onClick={() => setProfileTab('enrollment')}
            >
              <School size={16} />
              <span>Enrollment</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'health' ? 'active' : ''}`}
              onClick={() => setProfileTab('health')}
            >
              <HeartPulse size={16} />
              <span>Health ({childProfile.healthRecords?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'development' ? 'active' : ''}`}
              onClick={() => setProfileTab('development')}
            >
              <Brain size={16} />
              <span>Development ({childProfile.developmentAssessments?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'followups' ? 'active' : ''}`}
              onClick={() => setProfileTab('followups')}
            >
              <AlertTriangle size={16} />
              <span>Follow-ups ({childProfile.followUpCases?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setProfileTab('timeline')}
            >
              <Clock size={16} />
              <span>Timeline ({childProfile.timeline?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`child-tab-item ${profileTab === 'form2' ? 'active' : ''}`}
              onClick={() => setProfileTab('form2')}
            >
              <FileText size={16} />
              <span>Form 2</span>
            </button>
          </div>

          {/* -------------------------------------------------------------
              TAB CONTENT: 3. OVERVIEW
              ------------------------------------------------------------- */}
          {profileTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {/* Box 1: Current Enrollment */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Current educational modality and attendance session">
                    Current Enrollment
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
                      <Badge variant={getChildEnrollmentVariant(childProfile)}>
                        {getChildEnrollmentStatus(childProfile)}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Center:</span>
                      <span style={{ fontWeight: '600' }}>{childProfile.assignedCenter || getChildEnrollmentCenter(childProfile) || 'None'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Program:</span>
                      <span>{childProfile.statusPillars?.enrolled?.program || (isChildEnrolled(childProfile) ? 'Child Development Center (CDC)' : 'N/A')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Session:</span>
                      <span>{childProfile.statusPillars?.enrolled?.session || (isChildEnrolled(childProfile) ? 'Morning Session' : 'N/A')}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Box 2: Latest Health Record */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Most recent anthropometric weighing & immunization">
                    Latest Health Record
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Health Status:</span>
                      <Badge variant={childProfile.statusPillars?.health?.variant || 'warning'}>
                        {childProfile.statusPillars?.health?.status || childProfile.healthStatus || 'Due for Monitoring'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Weight & Height:</span>
                      <span style={{ fontWeight: '600' }}>
                        {childProfile.statusPillars?.health?.lastWeightKg && childProfile.statusPillars?.health?.lastHeightCm
                          ? `${childProfile.statusPillars.health.lastWeightKg} kg • ${childProfile.statusPillars.health.lastHeightCm} cm`
                          : childProfile.statusPillars?.health?.lastWeightKg
                          ? `${childProfile.statusPillars.health.lastWeightKg} kg`
                          : childProfile.statusPillars?.health?.lastHeightCm
                          ? `${childProfile.statusPillars.health.lastHeightCm} cm`
                          : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Nutritional Status:</span>
                      <span>{childProfile.statusPillars?.health?.nutritionalStatus || 'Pending OPT Plus'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Next Schedule:</span>
                      <span>{childProfile.statusPillars?.health?.nextDue || 'Pending Schedule'}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Box 3: Latest Development Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Standardized 7 ECCD developmental domains evaluation">
                    Latest Development Assessment
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status:</span>
                      <Badge variant={childProfile.statusPillars?.development?.variant || 'neutral'}>
                        {childProfile.statusPillars?.development?.status || childProfile.developmentStatus || 'Pending Initial Assessment'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Scaled Standard Score:</span>
                      <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-md)', color: (childProfile.statusPillars?.development?.scaledScore && childProfile.statusPillars.development.scaledScore < 90) ? 'var(--color-danger-primary)' : 'var(--color-success-primary)' }}>
                        {childProfile.statusPillars?.development?.scaledScore || 'Unscored'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Interpretation:</span>
                      <span>{childProfile.statusPillars?.development?.interpretation || 'Standard evaluation pending'}</span>
                    </div>
                    {childProfile.statusPillars?.development?.flaggedDomains?.length > 0 && (
                      <div style={{ marginTop: 'var(--space-1)', padding: 'var(--space-2)', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger-border)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-danger-primary)' }}>Flagged Delays:</span>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>
                          {childProfile.statusPillars.development.flaggedDomains.join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Box 4: Open Follow-ups & Assigned Worker */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Active intervention case & assigned focal officers">
                    Open Follow-ups & Focal Officers
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Active Follow-up:</span>
                      <Badge variant={childProfile.statusPillars?.followUp?.variant || 'neutral'}>
                        {childProfile.statusPillars?.followUp?.status || (childProfile.hasOpenFollowUp ? 'Active Case' : 'None')}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Case Summary:</span>
                      <span style={{ fontWeight: '500', maxWidth: '180px', textAlign: 'right' }}>
                        {childProfile.statusPillars?.followUp?.issue || 'None'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Worker:</span>
                      <span style={{ fontWeight: '600' }}>{childProfile.assignedWorker}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Worker Contact:</span>
                      <span>{childProfile.assignedWorkerContact}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Box 5: AWS S3 Cloud Storage & Attachments */}
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <CardTitle subtitle="S3 bucket integration with live team prefix handling">
                        AWS S3 Cloud Documents
                      </CardTitle>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <Cloud size={13} style={{ color: '#2563eb' }} />
                        AWS S3 Cloud Storage (ap-southeast-1)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTestS3Connection}
                        title="Verify S3 write permissions immediately"
                      >
                        Test S3
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Live Cloud Storage:</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: '#ba1607', fontWeight: 600 }}>
                        s3://cgsfp-hackathon/eccd/
                      </span>
                    </div>

                    {/* Attached files list */}
                    {childProfile.documents && childProfile.documents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {childProfile.documents.map((doc, idx) => (
                          <div
                            key={doc.id || idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: 'var(--color-bg-secondary)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              border: '1px solid var(--border-subtle, #e2e8f0)',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', minWidth: '140px' }}>
                              <Paperclip size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                              <span style={{ fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {doc.name || 'Attachment'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                }}
                              >
                                <Cloud size={11} style={{ color: '#2563eb' }} />
                                AWS S3 Cloud Storage (ap-southeast-1)
                              </span>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  color: '#2563eb',
                                  textDecoration: 'none',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                <span>Open S3</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>
                        No verification documents uploaded yet.
                      </div>
                    )}

                    {/* Upload button */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                      <label
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'var(--color-primary-600, #2563eb)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          cursor: isUploadingS3 ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <Upload size={13} />
                        {isUploadingS3 ? 'Uploading to S3...' : 'Upload Document to AWS S3'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={isUploadingS3}
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadChildDocument(e, 'verifications')}
                        />
                      </label>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: FAMILY & HOUSEHOLD
              ------------------------------------------------------------- */}
          {profileTab === 'family' && (() => {
            const hh = childProfile.familyHousehold || childProfile.household;
            const coResidents = Array.isArray(hh?.coResidentChildren) ? hh.coResidentChildren : [];

            if (!hh) {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle subtitle="Household profile captured during community mapping and persistent linkage">
                      Family & Household Roster
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Home size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>No linked household record found for this child.</p>
                      <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>Child was registered or mapped directly without an attached Form 1 Home Profile.</p>
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsForm1ModalOpen(true)}
                        >
                          <Home size={14} />
                          Open Official Form 1 (Home Profile)
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Household profile captured during community mapping and persistent linkage">
                    Family & Household Roster
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Household ID:</span>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-md)' }}>
                        {hh.householdId || hh.id || childProfile.householdId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Primary Guardian:</span>
                      <div style={{ fontWeight: '600' }}>
                        {hh.parentGuardian || childProfile.parentGuardian || '—'}
                        {(hh.guardianRelationship || childProfile.guardianRelationship) ? ` (${hh.guardianRelationship || childProfile.guardianRelationship})` : ''}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Contact Number:</span>
                      <div>{hh.contactNumber || childProfile.contactNumber || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Physical Address:</span>
                      <div>{hh.address || `${childProfile.barangay || 'San Fernando'}${childProfile.purok ? ` (${childProfile.purok})` : ''}` || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>4Ps Beneficiary Tag:</span>
                      <div>{(childProfile.is4PsBeneficiary || hh.is4PsBeneficiary) ? <Badge variant="success">Registered 4Ps Beneficiary</Badge> : <Badge variant="neutral">Non-4Ps</Badge>}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Monthly Income Classification:</span>
                      <div>{childProfile.monthlyIncomeClass || hh.monthlyIncomeClass || hh.incomeBracket || '—'}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Co-Resident Siblings & Children in Household:
                    </span>
                    {coResidents.length === 0 ? (
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        No other minor children recorded in this household during mapping survey.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        {coResidents.map((sib, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                            <div>
                              <strong>{sib.name || sib.fullName || 'Sibling'}</strong>{sib.age ? ` • ${sib.age}` : ''}{sib.relation ? ` (${sib.relation})` : ''}
                            </div>
                            {(sib.school || sib.status) && (
                              <Badge variant="neutral" size="sm">{sib.school || sib.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsForm1ModalOpen(true)}
                    >
                      <Home size={14} />
                      View / Edit Official Form 1 (Home Profile)
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })()}

          {/* -------------------------------------------------------------
              TAB CONTENT: OFFICIAL FORM 2 (CHILDREN'S PROFILE)
              ------------------------------------------------------------- */}
          {profileTab === 'form2' && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <CardTitle subtitle="Official ECCD Council April 2014 Children's Profile (All 16 sections digitized)">
                    ECCD Council Form 2 — Children's Profile
                  </CardTitle>
                  <Button variant="primary" size="sm" onClick={() => setIsForm2ModalOpen(true)}>
                    <FileText size={14} /> Open Full Form 2 Editor
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="official-instruction-banner">
                  Connected directly to centralized child record <strong>{childProfile.childId}</strong>. Data entered during Official Registration and Health Monitoring is automatically pre-filled.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', color: '#475569', marginBottom: '6px' }}>SECTIONS 1–7: PERSONAL &amp; BIRTH</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Name:</strong> {childProfile.fullName}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>DOB:</strong> {childProfile.birthDate} ({childProfile.ageDisplay})</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Sex:</strong> {childProfile.sex}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Birth Order:</strong> 1st Child</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Registered:</strong> {childProfile.registeredWithCivilRegistrar ? 'Yes (Has Birth Cert)' : 'No'}</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', color: '#475569', marginBottom: '6px' }}>SECTIONS 8–11: HEALTH &amp; VACCINES</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Height:</strong> {childProfile.anthropometrics?.heightCm || 92} cm</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Weight:</strong> {childProfile.anthropometrics?.weightKg || 13.5} kg</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Nutritional Status:</strong> {childProfile.statusPillars?.health?.nutritionalStatus || childProfile.healthStatus || 'Normal Weight for Age'}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>ECCD Card:</strong> Recorded in Portfolio</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Vaccines:</strong> BCG, DPT, Oral Polio, Hepa B, Measles</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', color: '#475569', marginBottom: '6px' }}>SECTIONS 12–16: ENVIRONMENT &amp; LOGISTICS</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Physical Deformities:</strong> None reported</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Home Learning:</strong> With Mother &amp; Father</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Travel to DCC:</strong> 10 mins (Walking)</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Goes to School with:</strong> Mother</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}><strong>Has Baon:</strong> Food &amp; Water</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: ENROLLMENT
              ------------------------------------------------------------- */}
          {profileTab === 'enrollment' && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Early childhood education placement, center admission, and program schedule">
                    Day Care & Center Enrollment Profile
                  </CardTitle>
                  <Button variant="primary" size="sm" onClick={() => setActiveQuickAction('enrollment')}>
                    <Plus size={14} />
                    Update Enrollment
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Enrollment Status:</span>
                    <div><Badge variant={getChildEnrollmentVariant(childProfile)}>{getChildEnrollmentStatus(childProfile)}</Badge></div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Day Care Center:</span>
                    <div style={{ fontWeight: '600' }}>{getChildEnrollmentCenter(childProfile) || 'Unassigned'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Program Modality:</span>
                    <div>{childProfile.statusPillars?.enrolled?.program || (isChildEnrolled(childProfile) ? 'Child Development Center (CDC)' : 'N/A')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Session Schedule:</span>
                    <div>{childProfile.statusPillars?.enrolled?.session || (isChildEnrolled(childProfile) ? 'Morning Session' : 'N/A')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>School Year:</span>
                    <div>{childProfile.statusPillars?.enrolled?.sy || 'SY 2026–2027'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Admission Date:</span>
                    <div>{childProfile.statusPillars?.enrolled?.date || childProfile.statusPillars?.enrolled?.enrolledDate || 'N/A'}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: HEALTH
              ------------------------------------------------------------- */}
          {profileTab === 'health' && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Anthropometric growth records, immunization completion, and nutritional tracking">
                    Health & Nutritional Status Monitoring
                  </CardTitle>
                  <Button variant="primary" size="sm" onClick={() => setActiveQuickAction('health')}>
                    <Plus size={14} />
                    Record Health Weighing
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="table-container">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Date</TableHeader>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Weight</TableHeader>
                        <TableHeader>Height</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Examiner</TableHeader>
                        <TableHeader>Remarks</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!childProfile.healthRecords || childProfile.healthRecords.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No health check entries recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (childProfile.healthRecords || []).map((rec, i) => (
                          <TableRow key={i}>
                            <TableCell><strong>{rec.date}</strong></TableCell>
                            <TableCell>{rec.type}</TableCell>
                            <TableCell><strong>{rec.weight || '—'}</strong></TableCell>
                            <TableCell>{rec.height || '—'}</TableCell>
                            <TableCell>
                              <Badge variant={rec.status === 'Normal' || rec.status.includes('Complete') ? 'success' : 'danger'}>
                                {rec.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{rec.examiner}</TableCell>
                            <TableCell style={{ fontSize: 'var(--font-size-xs)', maxWidth: '240px' }}>
                              {rec.remarks}
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

          {/* -------------------------------------------------------------
              TAB CONTENT: DEVELOPMENT (7 ECCD DOMAINS)
              ------------------------------------------------------------- */}
          {profileTab === 'development' && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Standardized 7 ECCD developmental domain checklist scores and evaluations">
                    Development Assessment & Domain Scoring
                  </CardTitle>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsManualModalOpen(true)}
                    >
                      How to Use Checklist (Manual)
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsChecklistModalOpen(true)}
                    >
                      <Plus size={14} />
                      Start Official ECCD Checklist
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {(!childProfile.developmentAssessments || childProfile.developmentAssessments.length === 0) ? (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No developmental assessment cycles recorded yet. Click "Start Official ECCD Checklist" to evaluate the child.
                  </div>
                ) : (
                  (childProfile.developmentAssessments || []).map((ass, idx) => (
                    <div key={idx} style={{ marginBottom: 'var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <div>
                          <strong style={{ fontSize: 'var(--font-size-md)' }}>{ass.cycle}</strong>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                            Administered on {ass.date} by {ass.evaluator}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {ass.recordType && (
                            <Badge variant="outline" size="sm">
                              {ass.recordType}
                            </Badge>
                          )}
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setIsChecklistModalOpen(true)}
                          >
                            <FileText size={12} />
                            View Checklist
                          </Button>
                          <Badge variant={ass.scaledScore < 90 || (ass.interpretation && ass.interpretation.includes('Follow-up')) ? 'danger' : 'success'}>
                            {ass.interpretation}
                          </Badge>
                        </div>
                      </div>

                      {/* 7 Domains Matrix */}
                      <div className="domains-matrix-grid">
                        {(ass.domains || []).map((dom, dIdx) => (
                          <div key={dIdx} className={`domain-tile ${dom.alert ? 'alert' : ''}`}>
                            <div className="domain-header">
                              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>{dom.name}</span>
                              {dom.alert ? (
                                <Badge variant="danger" size="sm">Alert</Badge>
                              ) : (
                                <Badge variant="success" size="sm">Normal</Badge>
                              )}
                            </div>
                            <div className="domain-score">
                              {dom.score} / {dom.max}
                            </div>
                            {dom.note && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {dom.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: FOLLOW-UPS
              ------------------------------------------------------------- */}
          {profileTab === 'followups' && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Clinical referrals, physical therapy coordination, and home visit interventions">
                    Intervention & Follow-up Cases
                  </CardTitle>
                  <Button variant="primary" size="sm" onClick={() => setActiveQuickAction('followup')}>
                    <Plus size={14} />
                    Create Follow-up Case
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {(!childProfile.followUpCases || childProfile.followUpCases.length === 0) ? (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active or historical follow-up cases recorded. Child is in good standing.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {(childProfile.followUpCases || []).map((fup) => (
                      <div key={fup.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <strong style={{ fontSize: 'var(--font-size-md)' }}>{fup.title}</strong>
                            <code style={{ fontSize: 'var(--font-size-xs)' }}>{fup.id}</code>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Badge variant={fup.priority === 'Urgent' ? 'danger' : 'warning'}>{fup.priority}</Badge>
                            <Badge variant="neutral">{fup.status}</Badge>
                          </div>
                        </div>

                        <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                          <strong>Issue:</strong> {fup.issue}
                        </p>

                        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
                          <strong>Intervention Protocol:</strong> {fup.plan}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          <span>Assigned Worker: <strong>{fup.assignedWorker}</strong> ({fup.workerContact})</span>
                          <span>Target Due Date: <strong>{fup.dueDate}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: 4. TIMELINE (CLEAN CHRONOLOGICAL AUDIT TRAIL)
              ------------------------------------------------------------- */}
          {profileTab === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle subtitle="Full chronological lifetime audit trail of all surveillance, clinical, and educational events">
                  Chronological Life Timeline: One Child = One Record
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="child-timeline-feed">
                  {childProfile.timeline?.map((event) => (
                    <div key={event.id} className="timeline-event-item">
                      <div className="timeline-event-dot" />
                      <div className="timeline-event-card">
                        <div className="timeline-event-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-950)' }}>
                              {event.title}
                            </strong>
                            <Badge variant={event.badgeVariant || 'primary'} size="sm">
                              {event.type}
                            </Badge>
                          </div>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {event.date}
                          </span>
                        </div>

                        <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {event.description}
                        </p>

                        <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--color-primary-800)', fontWeight: '500' }}>
                          Recorded by: {event.author}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: QUICK ACTION 1 — ADD ENROLLMENT
          ========================================================================= */}
      {activeQuickAction === 'enrollment' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveQuickAction(null)}
          title={`Update Enrollment for ${childProfile?.fullName}`}
          subtitle="Assign Child Development Center (CDC) or Supervised Neighborhood Play (SNP) slot"
          size="md"
        >
          <form onSubmit={handleEnrollSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Select
                label="Child Development Center"
                value={enrollForm.center}
                onChange={(e) => setEnrollForm({ ...enrollForm, center: e.target.value })}
                options={[
                  { value: 'San Isidro Child Development Center I', label: 'San Isidro Child Development Center I' },
                  { value: 'San Isidro Child Development Center II', label: 'San Isidro Child Development Center II' },
                  { value: 'Calulut CDC Central', label: 'Calulut CDC Central' },
                  { value: 'Dolores CDC Morning', label: 'Dolores CDC Morning' },
                  { value: 'San Jose CDC I', label: 'San Jose CDC I' },
                ]}
              />
              <Select
                label="Program Modality"
                value={enrollForm.program}
                onChange={(e) => setEnrollForm({ ...enrollForm, program: e.target.value })}
                options={[
                  { value: 'Child Development Center (CDC)', label: 'Child Development Center (CDC)' },
                  { value: 'Supervised Neighborhood Play (SNP)', label: 'Supervised Neighborhood Play (SNP)' },
                ]}
              />
              <Select
                label="Session Schedule"
                value={enrollForm.session}
                onChange={(e) => setEnrollForm({ ...enrollForm, session: e.target.value })}
                options={[
                  { value: 'Morning Session (8:00 AM – 11:00 AM)', label: 'Morning Session (8:00 AM – 11:00 AM)' },
                  { value: 'Afternoon Session (1:00 PM – 4:00 PM)', label: 'Afternoon Session (1:00 PM – 4:00 PM)' },
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setActiveQuickAction(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Confirm Admission
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: QUICK ACTION 2 — RECORD HEALTH
          ========================================================================= */}
      {activeQuickAction === 'health' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveQuickAction(null)}
          title={`Record Health Monitoring for ${childProfile?.fullName}`}
          subtitle="OPT Plus anthropometric measurement and immunization log"
          size="md"
        >
          <form onSubmit={handleHealthSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={healthForm.weightKg}
                  onChange={(e) => setHealthForm({ ...healthForm, weightKg: e.target.value })}
                  required
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.1"
                  value={healthForm.heightCm}
                  onChange={(e) => setHealthForm({ ...healthForm, heightCm: e.target.value })}
                  required
                />
              </div>
              <Select
                label="Nutritional Status (OPT Plus)"
                value={healthForm.nutritionalStatus}
                onChange={(e) => setHealthForm({ ...healthForm, nutritionalStatus: e.target.value })}
                options={[
                  { value: 'Normal Weight for Age', label: 'Normal Weight for Age' },
                  { value: 'Underweight', label: 'Underweight' },
                  { value: 'Severely Underweight', label: 'Severely Underweight' },
                  { value: 'Overweight', label: 'Overweight' },
                ]}
              />
              <Input
                label="Clinical Remarks / Immunization notes"
                value={healthForm.remarks}
                onChange={(e) => setHealthForm({ ...healthForm, remarks: e.target.value })}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setActiveQuickAction(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Health Record
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: QUICK ACTION 3 — START DEVELOPMENT ASSESSMENT
          ========================================================================= */}
      {activeQuickAction === 'assessment' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveQuickAction(null)}
          title={`ECCD Development Assessment for ${childProfile?.fullName}`}
          subtitle="Administer standard 7 developmental domains evaluation"
          size="md"
        >
          <form onSubmit={handleAssessmentSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Select
                label="Assessment Cycle"
                value={assessmentForm.cycle}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, cycle: e.target.value })}
                options={[
                  { value: '2nd Assessment Cycle (SY 2026–2027)', label: '2nd Assessment Cycle (SY 2026–2027)' },
                  { value: '3rd Assessment Cycle (End of Year)', label: '3rd Assessment Cycle (End of Year)' },
                ]}
              />
              <Input
                label="Total Scaled Standard Score (Average: 90–119)"
                type="number"
                value={assessmentForm.scaledScore}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, scaledScore: e.target.value })}
                required
              />
              <Input
                label="Assessor / Evaluator Name"
                value={assessmentForm.evaluator}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, evaluator: e.target.value })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setActiveQuickAction(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Commit Assessment Score
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: QUICK ACTION 4 — CREATE FOLLOW-UP
          ========================================================================= */}
      {activeQuickAction === 'followup' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveQuickAction(null)}
          title={`Create Follow-up Case for ${childProfile?.fullName}`}
          subtitle="Trigger CSWDO home visit or specialized health/intervention referral"
          size="md"
        >
          <form onSubmit={handleFollowUpSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Case Title"
                placeholder="e.g. Speech Delay Intervention Follow-up"
                value={followUpForm.title}
                onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                required
              />
              <Input
                label="Clinical or Developmental Issue"
                placeholder="Describe findings and child reaction..."
                value={followUpForm.issue}
                onChange={(e) => setFollowUpForm({ ...followUpForm, issue: e.target.value })}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select
                  label="Priority Level"
                  value={followUpForm.priority}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}
                  options={[
                    { value: 'Urgent', label: 'Urgent Action' },
                    { value: 'High', label: 'High Priority' },
                    { value: 'Medium', label: 'Medium Priority' },
                  ]}
                />
                <Input
                  label="Target Due Date"
                  type="date"
                  value={followUpForm.dueDate}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setActiveQuickAction(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Dispatch & Save Case
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          OFFICIAL ECCD COUNCIL FORM MODALS
          ========================================================================= */}
      <OfficialRegistrationFormModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(newChild) => {
          loadDirectory();
          handleOpenProfile(newChild.id);
        }}
        onViewExistingChild={(id) => handleOpenProfile(id)}
      />

      <OfficialForm1HomeProfileModal
        isOpen={isForm1ModalOpen}
        onClose={() => setIsForm1ModalOpen(false)}
        householdId={childProfile?.familyHousehold?.householdId}
        householdNo={childProfile?.familyHousehold?.householdId}
        onSuccess={() => {
          if (childProfile?.childId) handleOpenProfile(childProfile.childId);
        }}
      />

      <OfficialForm2ChildProfileModal
        isOpen={isForm2ModalOpen}
        onClose={() => setIsForm2ModalOpen(false)}
        childId={childProfile?.childId}
        onSuccess={() => {
          if (childProfile?.childId) handleOpenProfile(childProfile.childId);
        }}
      />

      {isForm5ModalOpen && (
        <Modal
          isOpen={isForm5ModalOpen}
          onClose={() => setIsForm5ModalOpen(false)}
          title="Official ECCD Form 5 — Consolidated Children's Profile"
          size="xl"
          className="official-form-modal"
        >
          <div>
            <OfficialForm5ConsolidatedReport onClose={() => setIsForm5ModalOpen(false)} />
          </div>
        </Modal>
      )}

      {/* Official ECCD Checklist Modal */}
      {isChecklistModalOpen && (
        <OfficialEccdChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          childId={selectedChildId}
          onSuccess={() => {
            loadProfile(selectedChildId);
            loadDirectory();
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

export default ChildManagementView;
