import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Users,
  Home,
  Baby,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  FileCheck2,
  Calendar,
  Layers,
  Smartphone,
  Wifi,
  ShieldCheck,
  UserCheck,
  Building2,
  Phone,
  Filter,
  Eye,
  Archive,
  UserPlus,
  Info,
  Check,
  FileText,
  Upload,
  Cloud,
  ExternalLink,
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
import { communityMappingService } from '../../services/communityMappingService';
import { OfficialForm1HomeProfileModal } from '../forms/OfficialForm1HomeProfileModal';
import { OfficialForm3CommunityProfileModal } from '../forms/OfficialForm3CommunityProfileModal';
import { OfflineSyncBanner } from '../ui/OfflineSyncBanner';
import {
  saveOfflineSurvey,
  getAllOfflineSurveys,
  getPendingSyncCount,
} from '../../services/offlineMappingStore';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { formatPHTTime } from '../../utils/phTime';

const AVAILABLE_BARANGAYS = SAN_FERNANDO_BARANGAYS;

const AVAILABLE_WORKERS = [
  { id: 'USR-FW-009', name: 'Rodel Mendoza', role: 'Community Development Officer II' },
  { id: 'USR-FW-010', name: 'Maria Santos', role: 'Child Development Worker I' },
  { id: 'USR-FW-011', name: 'Lourdes David', role: 'Child Development Worker II' },
  { id: 'USR-FW-012', name: 'Grace Pineda', role: 'Child Development Worker II' },
  { id: 'USR-FW-013', name: 'Elena Manalo', role: 'Child Development Worker I' },
];

export function CommunityMappingView({ onNavigate, initialTab }) {
  const { addToast } = useToast();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState(initialTab || 'stepper'); // 'stepper' | 'activities' | 'assignments' | 'households'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Service datasets
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync / Draft State (mobile-design skill: offline-safe)
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'draft' | 'saving'
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Official Forms Modal States
  const [isForm1ModalOpen, setIsForm1ModalOpen] = useState(false);
  const [selectedHouseholdForForm1, setSelectedHouseholdForForm1] = useState(null);
  const [isForm3ModalOpen, setIsForm3ModalOpen] = useState(false);
  const [selectedBarangayForForm3, setSelectedBarangayForForm3] = useState('San Isidro');

  // --- HOUSE-TO-HOUSE STEPPER STATE ---
  const [currentStep, setCurrentStep] = useState(1); // 1: Household, 2: Children, 3: Match Check, 4: Review, 5: Completion

  // Step 1: Household Form
  const [householdForm, setHouseholdForm] = useState({
    id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
    parentGuardian: '',
    contactNumber: '',
    address: '',
    barangay: 'San Isidro',
    purok: 'Purok 1',
    activityId: 'ACT-MAP-2026-001',
  });

  // Step 2: Children in this household
  const [childrenList, setChildrenList] = useState([]);
  const [currentChildInput, setCurrentChildInput] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    sex: 'Female',
    enrollmentStatus: 'Not Enrolled',
    enrollmentCenter: '',
    documentUrl: '',
    documentName: '',
  });
  const [isUploadingMappingDoc, setIsUploadingMappingDoc] = useState(false);

  // AWS S3 Document Upload during Community Mapping
  const handleUploadMappingDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('File exceeds 5MB limit.', 'error');
      return;
    }

    setIsUploadingMappingDoc(true);
    addToast(`Uploading ${file.name} to AWS S3...`, 'info');

    try {
      const res = await apiClient.uploadS3(file, {
        category: 'mapping-intake',
        description: 'Community Mapping Child Verification Document',
      });

      if (res.ok && res.data) {
        setCurrentChildInput((prev) => ({
          ...prev,
          documentUrl: res.data.url,
          documentName: res.data.filename,
        }));
        const successMessage = res.message || res.data?.message || 'File uploaded to AWS S3 successfully!';
        addToast(successMessage, 'success');
      } else {
        const errorMessage = res.error?.message || res.message || res.error || 'Failed to upload document to S3';
        addToast(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), 'error');
      }
    } catch (err) {
      console.error('Error uploading mapping document:', err);
      const catchMessage = err.response?.data?.message || err.message || 'Failed to upload file to S3';
      addToast(catchMessage, 'error');
    } finally {
      setIsUploadingMappingDoc(false);
      e.target.value = '';
    }
  };

  // Step 3: Duplicate Record Check state
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]); // Array of { childIndex, matchedRecord, decision: 'same' | 'new' | null }

  // Step 5: Completed result state
  const [completedSummary, setCompletedSummary] = useState(null);

  // --- MODALS STATE ---
  // Create Activity Modal
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [newActivityForm, setNewActivityForm] = useState({
    name: '',
    year: '2026',
    barangays: ['San Isidro'],
    startDate: '',
    endDate: '',
    assignedWorkerIds: ['USR-FW-009'],
    totalTargetHouseholds: 200,
  });

  // Assign Workers Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedActivityForAssign, setSelectedActivityForAssign] = useState(null);
  const [assignWorkerIds, setAssignWorkerIds] = useState([]);
  const [assignBarangay, setAssignBarangay] = useState('San Isidro');

  // Load initial data including offline IndexedDB records
  const loadData = async () => {
    setLoading(true);
    try {
      const actsData = await communityMappingService.getActivities();
      setActivities(actsData.activities || []);
      setAssignments(actsData.assignments || []);

      const hhData = await communityMappingService.getHouseholds();
      const offlineSurveys = await getAllOfflineSurveys();

      // Format offline surveys and merge with server households
      const offlineHouseholds = (offlineSurveys || []).map((s) => ({
        id: s.householdId || s.id,
        parentGuardian: s.household?.parentGuardian || s.parentGuardian || 'Offline Household Record',
        address: s.household?.address || s.address || 'Field Survey',
        barangay: s.household?.barangay || s.barangay || 'San Isidro',
        contactNumber: s.household?.contactNumber || s.contactNumber || 'N/A',
        childrenCount: s.children?.length || s.household?.childrenCount || 1,
        mappedBy: s.mappedBy || 'Field Worker (PWA Offline)',
        mappedDate: s.createdAt ? s.createdAt.slice(0, 10) : 'Recent',
        status: s.syncStatus === 'pending' ? 'Pending Sync' : 'Completed',
        syncStatus: s.syncStatus,
        isOfflineRecord: true,
        children: s.children || [],
      }));

      const existingIds = new Set((hhData || []).map((h) => h.id));
      const mergedHouseholds = [
        ...offlineHouseholds.filter((oh) => !existingIds.has(oh.id)),
        ...(hhData || []).map((h) => {
          const matchingOffline = (offlineSurveys || []).find((s) => s.householdId === h.id || s.id === h.id);
          if (matchingOffline) {
            return { ...h, syncStatus: matchingOffline.syncStatus };
          }
          return h;
        }),
      ];

      setHouseholds(mergedHouseholds);

      // Check for saved local draft
      const draft = communityMappingService.getDraft();
      if (draft && draft.householdForm) {
        setHouseholdForm(draft.householdForm);
        setChildrenList(draft.childrenList || []);
        setCurrentStep(draft.currentStep || 1);
        setSyncStatus('draft');
        setLastSavedTime(draft.timestamp || 'Previous session');
      }
    } catch (e) {
      console.error('Error loading community mapping data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStoreUpdate = () => loadData();
    window.addEventListener('eccd:datastore-updated', handleStoreUpdate);
    window.addEventListener('eccd:offline-survey-updated', handleStoreUpdate);
    window.addEventListener('eccd:offline-sync-completed', handleStoreUpdate);
    return () => {
      window.removeEventListener('eccd:datastore-updated', handleStoreUpdate);
      window.removeEventListener('eccd:offline-survey-updated', handleStoreUpdate);
      window.removeEventListener('eccd:offline-sync-completed', handleStoreUpdate);
    };
  }, []);

  // Save draft locally
  const handleSaveDraft = () => {
    const draftPayload = {
      householdForm,
      childrenList,
      currentStep,
      timestamp: formatPHTTime(new Date(), false),
    };
    const res = communityMappingService.saveDraft(draftPayload);
    if (res.ok) {
      setSyncStatus('draft');
      setLastSavedTime(res.timestamp);
      addToast('Draft saved to local device', 'info');
    }
  };

  // Add child to temporary household list
  const handleAddChildToHousehold = (e) => {
    e.preventDefault();
    if (!currentChildInput.firstName || !currentChildInput.lastName || !currentChildInput.birthDate) {
      addToast('Please provide child name and birth date', 'error');
      return;
    }

    const birth = new Date(currentChildInput.birthDate);
    const now = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const ageYears = Math.floor(ageMonths / 12);

    const childObj = {
      ...currentChildInput,
      tempId: `TMP-${Date.now()}`,
      ageYears,
      ageMonths: ageMonths % 12,
      decision: null, // 'same' | 'new'
      matchedRecord: null,
    };

    setChildrenList([...childrenList, childObj]);
    setCurrentChildInput({
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: '',
      sex: 'Female',
      enrollmentStatus: 'Not Enrolled',
      enrollmentCenter: '',
      documentUrl: '',
      documentName: '',
    });
    addToast('Child added to household roster', 'success');
  };

  // Remove child from temporary roster
  const handleRemoveChild = (tempId) => {
    setChildrenList(childrenList.filter((c) => c.tempId !== tempId));
  };

  // Run Check Existing Records (Step 3)
  const runDuplicateCheck = async () => {
    setIsSearchingMatch(true);
    try {
      const updatedChildren = [...childrenList];
      for (let i = 0; i < updatedChildren.length; i++) {
        const c = updatedChildren[i];
        const searchMatches = await communityMappingService.searchChildren(
          `${c.firstName} ${c.lastName}`,
          c.birthDate
        );

        if (searchMatches.length > 0) {
          c.matchedRecord = searchMatches[0];
          c.decision = c.decision || 'same'; // Default to linking if matched
        } else {
          c.matchedRecord = null;
          c.decision = 'new';
        }
      }
      setChildrenList(updatedChildren);
    } catch (e) {
      console.error('Error during duplication check:', e);
    } finally {
      setIsSearchingMatch(false);
    }
  };

  // Proceed to Next Step
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!householdForm.parentGuardian || !householdForm.address) {
        addToast('Please fill out Parent/Guardian and Address', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (childrenList.length === 0) {
        addToast('Please add at least one child aged 0–4 before continuing', 'error');
        return;
      }
      setCurrentStep(3);
      await runDuplicateCheck();
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      await handleFinalSubmission();
    }
  };

  // Final Step 4 Submission: Save household and children with Offline-First IndexedDB resilience
  const handleFinalSubmission = async () => {
    setSyncStatus('saving');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const householdPayload = {
      id: householdForm.id,
      parentGuardian: householdForm.parentGuardian,
      contactNumber: householdForm.contactNumber,
      address: `${householdForm.address}, ${householdForm.purok}`,
      barangay: householdForm.barangay,
      mappingActivityId: householdForm.activityId,
      childrenCount: childrenList.length,
      mappedBy: 'CSWDO Field Officer',
      mappedDate: new Date().toISOString().slice(0, 10),
    };

    // 1. Immediately write to IndexedDB (idb) so data is never lost offline
    await saveOfflineSurvey({
      id: `SURVEY-${householdForm.id}`,
      householdId: householdForm.id,
      household: householdPayload,
      children: childrenList,
      syncStatus: isOnline ? 'synced' : 'pending',
    });

    try {
      // 2. Create household
      const createdHh = await communityMappingService.createHousehold(householdPayload);

      // 3. Register or link children without duplicates
      const savedChildren = [];
      for (const child of childrenList) {
        const regRes = await communityMappingService.registerChild({
          firstName: child.firstName,
          middleName: child.middleName,
          lastName: child.lastName,
          birthDate: child.birthDate,
          sex: child.sex,
          ageYears: child.ageYears,
          ageMonths: child.ageMonths,
          householdId: createdHh.id,
          parentGuardian: householdForm.parentGuardian,
          barangay: householdForm.barangay,
          enrollmentStatus: child.enrollmentStatus,
          enrollmentCenter: child.enrollmentCenter,
          existingChildId: child.decision === 'same' && child.matchedRecord ? child.matchedRecord.id : null,
        });
        savedChildren.push(regRes.child);
      }

      // 4. Clear draft
      communityMappingService.clearDraft();
      setSyncStatus(isOnline ? 'synced' : 'draft');

      // 5. Set completed summary
      setCompletedSummary({
        household: createdHh,
        children: savedChildren,
        timestamp: formatPHTTime(new Date(), true),
      });

      setCurrentStep(5);
      if (isOnline) {
        addToast('Household mapping completed and synced successfully!', 'success');
      } else {
        addToast('Saved offline to IndexedDB. Record queued for sync!', 'info');
      }

      await loadData();
    } catch (err) {
      console.warn('Network issue during submission, safely retained in IndexedDB:', err);
      // Mark as pending sync in IndexedDB
      await saveOfflineSurvey({
        id: `SURVEY-${householdForm.id}`,
        householdId: householdForm.id,
        household: householdPayload,
        children: childrenList,
        syncStatus: 'pending',
      });
      setSyncStatus('draft');
      setCompletedSummary({
        household: householdPayload,
        children: childrenList,
        timestamp: formatPHTTime(new Date(), true),
      });
      setCurrentStep(5);
      addToast('Working offline: Survey saved to local IndexedDB and queued for sync.', 'warning');
    }
  };

  // Reset Stepper for next household
  const handleResetForNextHousehold = () => {
    setHouseholdForm({
      id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
      parentGuardian: '',
      contactNumber: '',
      address: '',
      barangay: householdForm.barangay, // retain barangay for rapid consecutive mapping
      purok: householdForm.purok,
      activityId: householdForm.activityId,
    });
    setChildrenList([]);
    setCompletedSummary(null);
    setCurrentStep(1);
    communityMappingService.clearDraft();
  };

  // Create Mapping Activity submission
  const handleCreateActivitySubmit = async (e) => {
    e.preventDefault();
    if (!newActivityForm.name) {
      addToast('Please enter an activity name', 'error');
      return;
    }

    const assignedWorkers = AVAILABLE_WORKERS.filter((w) =>
      newActivityForm.assignedWorkerIds.includes(w.id)
    );

    const act = await communityMappingService.createActivity({
      name: newActivityForm.name,
      year: newActivityForm.year,
      barangays: newActivityForm.barangays,
      startDate: newActivityForm.startDate,
      endDate: newActivityForm.endDate,
      assignedWorkers,
      totalTargetHouseholds: newActivityForm.totalTargetHouseholds,
    });

    addToast(`Activity "${act.name}" created`, 'success');
    setIsCreateActivityOpen(false);
    loadData();
  };

  // Assign Workers submission
  const handleAssignWorkersSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivityForAssign) return;

    const workers = AVAILABLE_WORKERS.filter((w) => assignWorkerIds.includes(w.id));
    await communityMappingService.assignWorkers(
      selectedActivityForAssign.id,
      workers,
      assignBarangay
    );

    addToast('Service providers assigned to activity', 'success');
    setIsAssignModalOpen(false);
    loadData();
  };

  // Toggle Archive Activity
  const handleToggleArchive = async (actId) => {
    const res = await communityMappingService.archiveActivity(actId);
    if (res.ok) {
      addToast(`Activity ${res.activity.archived ? 'archived' : 'unarchived'}`, 'info');
      loadData();
    }
  };

  return (
    <div className="community-mapping-view">
      {/* Top Header with Sync Indicator */}
      <div className="page-header" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 className="page-title">Community Child Mapping</h1>
            <Badge variant="primary" size="sm">0–4 Cohort</Badge>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {syncStatus === 'synced' && (
            <div className="mapping-sync-badge">
              <Wifi size={16} />
              <span>Online • All Records Synced</span>
            </div>
          )}
          {syncStatus === 'draft' && (
            <div className="mapping-sync-badge draft">
              <Smartphone size={16} />
              <span>Draft Saved Locally ({lastSavedTime || 'Recent'})</span>
            </div>
          )}
          {syncStatus === 'saving' && (
            <div className="mapping-sync-badge draft">
              <span>Saving &amp; Synchronizing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Offline / Online Sync Banner with Pending Queue Counter & Sync Now button */}
      <OfflineSyncBanner onSyncComplete={loadData} />

      {/* Community Mapping Bento Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="kpi-card card-primary" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="kpi-top" style={{ marginBottom: '4px' }}>
            <span className="kpi-title">Mapped Households</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)', width: '1.75rem', height: '1.75rem' }}>
              <Home size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-900)', margin: 0 }}>{households.length}</div>
        </div>

        <div className="kpi-card card-info" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="kpi-top" style={{ marginBottom: '4px' }}>
            <span className="kpi-title">Active Rounds</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-700)', width: '1.75rem', height: '1.75rem' }}>
              <MapPin size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-info-primary)', margin: 0 }}>{activities.filter(a => a.status === 'In Progress').length || activities.length}</div>
        </div>

        <div className="kpi-card card-success" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="kpi-top" style={{ marginBottom: '4px' }}>
            <span className="kpi-title">Field Workers</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)', width: '1.75rem', height: '1.75rem' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-primary)', margin: 0 }}>{assignments.length}</div>
        </div>

        <div className="kpi-card card-primary" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="kpi-top" style={{ marginBottom: '4px' }}>
            <span className="kpi-title">Surveyed Children</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)', width: '1.75rem', height: '1.75rem' }}>
              <Baby size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-800)', margin: 0 }}>
            {households.reduce((acc, h) => acc + (h.children?.length || (h.childrenAges ? h.childrenAges.length : 0) || 1), 0)}
          </div>
        </div>
      </div>

      {/* Main Tab View Switcher (Deduplicated navigation) */}
      <nav className="mapping-view-toggle" aria-label="Community Mapping Navigation">
        <button
          type="button"
          className={`mapping-tab-btn ${activeTab !== 'households' ? 'active' : ''}`}
          onClick={() => {
            if (activeTab === 'households') {
              setActiveTab('stepper');
            }
          }}
        >
          <MapPin size={16} />
          <span>Mapping Rounds & Stepper</span>
        </button>
        <button
          type="button"
          className={`mapping-tab-btn ${activeTab === 'households' ? 'active' : ''}`}
          onClick={() => setActiveTab('households')}
        >
          <Home size={16} />
          <span>Household Directory (Form 1) ({households.length})</span>
        </button>
        <button
          type="button"
          className="mapping-tab-btn"
          onClick={() => {
            setSelectedBarangayForForm3('San Isidro');
            setIsForm3ModalOpen(true);
          }}
          title="Open official ECCD Council Form 3"
        >
          <FileText size={16} />
          <span>Official Form 3 (Community Profile)</span>
        </button>
      </nav>

      {/* Sub-navigation for Mapping Rounds & Stepper modes */}
      {activeTab !== 'households' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'stepper' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stepper')}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
          >
            <Home size={16} style={{ marginRight: '6px' }} />
            House-to-House Stepper
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'activities' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('activities')}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
          >
            <MapPin size={16} style={{ marginRight: '6px' }} />
            Mapping Rounds &amp; Activities ({activities.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('assignments')}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
          >
            <Users size={16} style={{ marginRight: '6px' }} />
            Field Worker Assignments ({assignments.length})
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: HOUSE-TO-HOUSE WORKFLOW (GUIDED 4-STEP STEPPER)
          MOBILE-FIRST UX (mobile-design skill)
          ========================================================================= */}
      {activeTab === 'stepper' && (
        <div className="mapping-stepper-container">
          {/* Modern Compact Pill Stepper */}
          <div className="mapping-stepper" role="navigation" aria-label="Mapping Stepper">
            {[
              { num: 1, label: 'Household Info' },
              { num: 2, label: `Children 0–4 (${childrenList.length})` },
              { num: 3, label: 'Record Check' },
              { num: 4, label: 'Review & Save' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (isDone || isActive) setCurrentStep(step.num);
                  }}
                  disabled={!isDone && !isActive}
                  className={`stepper-step ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                  style={{ border: 'none', cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed', textAlign: 'left' }}
                >
                  <div className="stepper-circle">
                    {isDone ? <Check size={12} /> : step.num}
                  </div>
                  <span className="stepper-label">{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* -------------------------------------------------------------
              STEP 1: HOUSEHOLD INFORMATION
              ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle>
                    Household Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                    <Input
                      label="Household ID"
                      value={householdForm.id}
                      onChange={(e) => setHouseholdForm({ ...householdForm, id: e.target.value })}
                      required
                    />

                    <Select
                      label="Barangay"
                      value={householdForm.barangay}
                      onChange={(e) => setHouseholdForm({ ...householdForm, barangay: e.target.value })}
                      options={AVAILABLE_BARANGAYS.map((b) => ({ value: b, label: b }))}
                    />

                    <Input
                      label="Purok / Sitio / Cluster"
                      placeholder="e.g. Purok 3 (Riverside)"
                      value={householdForm.purok}
                      onChange={(e) => setHouseholdForm({ ...householdForm, purok: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                    <Input
                      label="Parent / Guardian Full Name"
                      placeholder="e.g. Maria Santos Dela Cruz"
                      value={householdForm.parentGuardian}
                      onChange={(e) => setHouseholdForm({ ...householdForm, parentGuardian: e.target.value })}
                      required
                    />

                    <Input
                      label="Contact Number"
                      placeholder="e.g. 0917-555-0142"
                      value={householdForm.contactNumber}
                      onChange={(e) => setHouseholdForm({ ...householdForm, contactNumber: e.target.value })}
                      leftIcon={<Phone size={14} />}
                    />
                  </div>

                  <Input
                    label="Physical Address / House Number & Street"
                    placeholder="e.g. House No. 45, Dahlia St., Purok 3"
                    value={householdForm.address}
                    onChange={(e) => setHouseholdForm({ ...householdForm, address: e.target.value })}
                    required
                  />
                </div>
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="ghost" size="md" onClick={handleSaveDraft}>
                  <Save size={16} />
                  Save Draft
                </Button>
                <Button variant="primary" size="md" onClick={handleNextStep}>
                  Next: Children (0–4)
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 2: CHILDREN 0–4
              ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Children residing in household (Ages 0–4)">
                    Children Aged 0–4 Roster
                  </CardTitle>
                  <Badge variant="primary" size="sm">
                    {childrenList.length} Child(ren) Added
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                {/* Child Add Form */}
                <form onSubmit={handleAddChildToHousehold} style={{ backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-primary-900)', display: 'block', marginBottom: 'var(--space-3)' }}>
                    + Add Child to {householdForm.parentGuardian}'s Household
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <Input
                      label="First Name"
                      placeholder="e.g. Juan"
                      value={currentChildInput.firstName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Middle Name"
                      placeholder="e.g. Bautista"
                      value={currentChildInput.middleName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, middleName: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      placeholder="e.g. Dela Cruz"
                      value={currentChildInput.lastName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <Input
                      label="Birth Date"
                      type="date"
                      value={currentChildInput.birthDate}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, birthDate: e.target.value })}
                      required
                    />
                    <Select
                      label="Sex"
                      value={currentChildInput.sex}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, sex: e.target.value })}
                      options={[
                        { value: 'Female', label: 'Female' },
                        { value: 'Male', label: 'Male' },
                      ]}
                    />
                    <Select
                      label="Enrollment Status"
                      value={currentChildInput.enrollmentStatus}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, enrollmentStatus: e.target.value })}
                      options={[
                        { value: 'Not Enrolled', label: 'Not Enrolled' },
                        { value: 'Enrolled', label: 'Enrolled in Day Care (CDC)' },
                        { value: 'SNP', label: 'Supervised Neighborhood Play' },
                      ]}
                    />
                  </div>

                  {currentChildInput.enrollmentStatus === 'Enrolled' && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <Input
                        label="Child Development Center Name"
                        placeholder="e.g. San Isidro Child Development Center I"
                        value={currentChildInput.enrollmentCenter}
                        onChange={(e) => setCurrentChildInput({ ...currentChildInput, enrollmentCenter: e.target.value })}
                      />
                    </div>
                  )}

                  {/* AWS S3 Document Upload Field */}
                  <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-neutral-50, #f8fafc)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Supporting Document / PSA / Intake Attachment (AWS S3)
                      </label>
                      {currentChildInput.documentUrl && (
                        <span style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                          <Check size={12} /> S3 Uploaded: {currentChildInput.documentName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: '#2563eb',
                          color: '#fff',
                          borderRadius: '6px',
                          cursor: isUploadingMappingDoc ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        <Upload size={12} />
                        {isUploadingMappingDoc ? 'Uploading...' : 'Choose File to Upload to S3'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={isUploadingMappingDoc}
                          style={{ display: 'none' }}
                          onChange={handleUploadMappingDoc}
                        />
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {currentChildInput.documentName ? currentChildInput.documentName : 'PDF, JPG, PNG up to 5MB'}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" variant="secondary" size="md">
                    <Plus size={16} />
                    Add Child to Household List
                  </Button>
                </form>

                {/* List of Added Children */}
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Household Roster ({childrenList.length} Child/Children):
                  </span>

                  {childrenList.length === 0 ? (
                    <div style={{ padding: 'var(--space-5)', textAlign: 'center', backgroundColor: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                      No children registered in this household yet. Fill the form above and click "Add Child to Household List".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      {childrenList.map((c, idx) => (
                        <div key={c.tempId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>
                              #{idx + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {c.firstName} {c.middleName} {c.lastName}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                Age: {c.ageYears} yrs {c.ageMonths} mos • DOB: {c.birthDate} • Sex: {c.sex} • Status: <strong>{c.enrollmentStatus}</strong>
                              </div>
                              {c.documentUrl && (
                                <a
                                  href={c.documentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', color: '#2563eb', fontSize: '11px', textDecoration: 'none' }}
                                >
                                  <Cloud size={11} /> S3 Doc: {c.documentName || 'Attachment'} <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChild(c.tempId)}
                            style={{ color: 'var(--color-danger-primary)' }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={handleNextStep}>
                  Next: Record Check ({childrenList.length})
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 3: EXISTING RECORD CHECK (DEDUPLICATION LOGIC)
              ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Central registry cross-reference and deduplication">
                    Existing Record Verification & Deduplication
                  </CardTitle>
                  <Button variant="secondary" size="sm" onClick={runDuplicateCheck} disabled={isSearchingMatch}>
                    Re-check Records
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {isSearchingMatch ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: '600', color: 'var(--color-primary-900)' }}>
                      Searching existing ECCD records...
                    </div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Comparing names, birthdates, and residential barangay records in CSWDO database.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

                    {childrenList.map((child, index) => (
                      <div key={child.tempId} className="child-duplicate-check-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                          <div>
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
                              Child #{index + 1}: {child.firstName} {child.middleName} {child.lastName}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                              (DOB: {child.birthDate} • {child.sex})
                            </span>
                          </div>

                          {child.matchedRecord ? (
                            <Badge variant="warning" dot={true}>
                              Possible Match Found
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              No Existing Match
                            </Badge>
                          )}
                        </div>

                        {/* If match found */}
                        {child.matchedRecord ? (
                          <div>
                            <div className="match-found-banner">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: '600', color: 'var(--color-warning-primary)', marginBottom: 'var(--space-1)' }}>
                                <AlertTriangle size={16} />
                                Match Found in Central Registry!
                              </div>
                              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                Existing Record ID: <strong>{child.matchedRecord.id}</strong> — {child.matchedRecord.firstName} {child.matchedRecord.lastName} ({child.matchedRecord.barangay})
                              </div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                Parent recorded: {child.matchedRecord.parentGuardian} • Current Status: {child.matchedRecord.enrollmentStatus}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                              <button
                                type="button"
                                className={`btn btn-md ${child.decision === 'same' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => {
                                  const updated = [...childrenList];
                                  updated[index].decision = 'same';
                                  setChildrenList(updated);
                                }}
                              >
                                <CheckCircle2 size={16} />
                                “This is the same child” (Link ID: {child.matchedRecord.id})
                              </button>

                              <button
                                type="button"
                                className={`btn btn-md ${child.decision === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => {
                                  const updated = [...childrenList];
                                  updated[index].decision = 'new';
                                  setChildrenList(updated);
                                }}
                              >
                                “Create new child” (Generate New ID)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-success-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success-primary)' }}>
                              <strong>Clean Record:</strong> No prior duplicates detected. A new unique Child ID (format: <code>ECCD-2026-XXXXXX</code>) will be generated.
                            </div>
                            <Badge variant="success">New Child Record</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={handleNextStep}>
                  Next: Review & Save
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 4: REVIEW & SAVE
              ------------------------------------------------------------- */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle subtitle="Verify household profile and children entries before saving">
                  Review & Save Household Mapping
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Household Summary Box */}
                  <div style={{ backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Household Profile
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Household ID:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.id}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Parent / Guardian:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.parentGuardian}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Contact:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.contactNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Location:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.address}, {householdForm.purok}, {householdForm.barangay}</div>
                      </div>
                    </div>
                  </div>

                  {/* Children Summary List */}
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Identified Children ({childrenList.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      {childrenList.map((c, i) => (
                        <div key={c.tempId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {c.firstName} {c.middleName} {c.lastName}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                              Age: {c.ageYears} yrs {c.ageMonths} mos • DOB: {c.birthDate} • Enrollment: <strong>{c.enrollmentStatus}</strong>
                            </div>
                            {c.documentUrl && (
                              <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <Cloud size={11} /> AWS S3 Document: <a href={c.documentUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>{c.documentName || 'View Attachment'}</a>
                              </div>
                            )}
                          </div>
                          <div>
                            {c.decision === 'same' && c.matchedRecord ? (
                              <Badge variant="info">
                                Linked ID: {c.matchedRecord.id} (No Duplicate)
                              </Badge>
                            ) : (
                              <Badge variant="success">
                                New Unique ID Generated
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFinalSubmission}
                  disabled={syncStatus === 'saving'}
                >
                  <CheckCircle2 size={16} />
                  {syncStatus === 'saving' ? 'Saving...' : 'Confirm & Commit Mapping'}
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 5: MAPPING COMPLETION (8. MAPPING COMPLETION)
              ------------------------------------------------------------- */}
          {currentStep === 5 && completedSummary && (
            <Card style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)' }}>
                <CheckCircle2 size={32} />
              </div>

              <h2 className="text-h2" style={{ color: 'var(--color-success-primary)', marginBottom: 'var(--space-2)' }}>
                Household Mapping Completed!
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto var(--space-5)' }}>
                Household <strong>{completedSummary.household.id}</strong> in {completedSummary.household.barangay} has been officially recorded into the CSWDO ECCD master database.
              </p>

              {/* Completion Outcome Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', maxWidth: '640px', margin: '0 auto var(--space-6)', textAlign: 'left' }}>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Household Status</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-success-primary)' }}>100% Complete</div>
                </div>

                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Children Identified</span>
                  <div style={{ fontWeight: 'bold' }}>{completedSummary.children.length} Registered</div>
                </div>

                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Enrollment Status</span>
                  <div style={{ fontWeight: 'bold' }}>Captured & Logged</div>
                </div>
              </div>

              {/* Registered Children IDs list */}
              <div style={{ maxWidth: '640px', margin: '0 auto var(--space-6)', textAlign: 'left' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Assigned ECCD Child Master IDs:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {completedSummary.children.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-neutral-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span><strong>{c.firstName} {c.lastName}</strong></span>
                      <code style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>{c.id}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="md" onClick={handleResetForNextHousehold}>
                  <Plus size={16} />
                  Start Next Household
                </Button>
                <Button variant="secondary" size="md" onClick={() => setActiveTab('households')}>
                  <Building2 size={16} />
                  View Mapped Households
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MAPPING ACTIVITY LIST (1. MAPPING ACTIVITY LIST)
          ========================================================================= */}
      {activeTab === 'activities' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <CardTitle subtitle="Annual and scheduled CSWDO house-to-house demographic surveillance activities">
                Mapping Activities ({activities.length})
              </CardTitle>
              <Button variant="primary" size="sm" onClick={() => setIsCreateActivityOpen(true)}>
                <Plus size={14} />
                + Create Mapping Activity
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="table-container">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Activity Name</TableHeader>
                    <TableHeader>Year</TableHeader>
                    <TableHeader>Barangays Covered</TableHeader>
                    <TableHeader>Dates</TableHeader>
                    <TableHeader>Assigned Workers</TableHeader>
                    <TableHeader>Progress</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader style={{ textAlign: 'right' }}>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((act) => (
                    <TableRow key={act.id} style={{ opacity: act.archived ? 0.6 : 1 }}>
                      <TableCell>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {act.name}
                        </div>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {act.id}
                        </code>
                      </TableCell>

                      <TableCell>
                        <Badge variant="neutral">{act.year}</Badge>
                      </TableCell>

                      <TableCell>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                          {act.barangays.map((b) => (
                            <Badge key={b} variant="neutral" size="sm">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>
                          {act.startDate} to {act.endDate}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ fontSize: 'var(--font-size-xs)' }}>
                          {act.assignedWorkers.map((w) => w.name).join(', ') || 'None assigned'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>{act.progress}%</span>
                          <div style={{ width: '70px', height: '6px', backgroundColor: 'var(--color-neutral-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{ width: `${act.progress}%`, height: '100%', backgroundColor: act.progress === 100 ? 'var(--color-success-primary)' : 'var(--color-primary-600)' }} />
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {act.mappedHouseholds} / {act.totalTargetHouseholds} HH
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={act.status === 'Completed' ? 'success' : act.status === 'In Progress' ? 'primary' : 'neutral'}>
                          {act.status}
                        </Badge>
                      </TableCell>

                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedActivityForAssign(act);
                              setAssignBarangay(act.barangays[0] || 'San Isidro');
                              setIsAssignModalOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleArchive(act.id)}
                            title={act.archived ? 'Unarchive Activity' : 'Archive Activity'}
                          >
                            <Archive size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 3: FIELD WORKER ASSIGNMENTS (3. FIELD WORKER ASSIGNMENTS)
          ========================================================================= */}
      {activeTab === 'assignments' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {assignments.map((asn, idx) => (
              <div key={idx} className="assignment-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <Badge variant="primary" size="sm">
                      {asn.assignedBarangay}
                    </Badge>
                    <Badge variant="success" size="sm">
                      {asn.status}
                    </Badge>
                  </div>

                  <h3 className="text-h3" style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' }}>
                    {asn.workerName}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {asn.activityName}
                  </p>

                  <div className="assignment-metric-grid">
                    <div className="assignment-metric-item">
                      <div className="assignment-metric-val">{asn.householdsMapped}</div>
                      <div className="assignment-metric-lbl">HH Mapped</div>
                    </div>
                    <div className="assignment-metric-item">
                      <div className="assignment-metric-val" style={{ color: 'var(--color-primary-800)' }}>
                        {asn.childrenIdentified}
                      </div>
                      <div className="assignment-metric-lbl">Children 0–4</div>
                    </div>
                    <div className="assignment-metric-item">
                      <div className="assignment-metric-val" style={{ color: 'var(--color-warning-primary)' }}>
                        {asn.remainingHouseholds}
                      </div>
                      <div className="assignment-metric-lbl">Remaining</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <span>Area Completion</span>
                      <span><strong>{asn.progress}%</strong></span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-neutral-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${asn.progress}%`, height: '100%', backgroundColor: 'var(--color-primary-600)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setHouseholdForm({
                        ...householdForm,
                        barangay: asn.assignedBarangay,
                      });
                      setActiveTab('stepper');
                      setCurrentStep(1);
                    }}
                  >
                    Open Stepper for this Area
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MAPPED HOUSEHOLDS REGISTRY
          ========================================================================= */}
      {activeTab === 'households' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <CardTitle subtitle="Masterlist of surveyed households with children under 5">
                Mapped Households Registry ({households.length})
              </CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('stepper');
                  setCurrentStep(1);
                }}
              >
                <Plus size={14} />
                + Map New Household
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="table-container">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Household ID</TableHeader>
                    <TableHeader>Parent / Guardian</TableHeader>
                    <TableHeader>Barangay & Address</TableHeader>
                    <TableHeader>Contact</TableHeader>
                    <TableHeader>Children</TableHeader>
                    <TableHeader>Mapped By</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader style={{ textAlign: 'right' }}>Official Form</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {households.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                        No mapped households found. Click "+ Map New Household" above to begin house-to-house mapping.
                      </TableCell>
                    </TableRow>
                  ) : (
                    households.map((hh) => (
                    <TableRow key={hh.id}>
                      <TableCell>
                        <code style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
                          {hh.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <strong>{hh.parentGuardian}</strong>
                      </TableCell>
                      <TableCell>
                        <div>{hh.barangay}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {hh.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 'var(--font-size-xs)' }}>{hh.contactNumber || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" size="sm">
                          {hh.childrenCount} 0–4 yr
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 'var(--font-size-xs)' }}>{hh.mappedBy}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 'var(--font-size-xs)' }}>{hh.mappedDate}</span>
                      </TableCell>
                      <TableCell>
                        {hh.syncStatus === 'pending' ? (
                          <Badge variant="warning" size="sm">
                            Pending Sync (IndexedDB)
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            {hh.status || 'Verified'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setSelectedHouseholdForForm1(hh);
                            setIsForm1ModalOpen(true);
                          }}
                        >
                          <FileText size={12} />
                          Form 1
                        </Button>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          MODAL: CREATE MAPPING ACTIVITY (2. CREATE MAPPING ACTIVITY)
          ========================================================================= */}
      <Modal
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        title="Create New Mapping Activity"
        subtitle="Schedule a community house-to-house demographic survey round"
        size="lg"
      >
        <form onSubmit={handleCreateActivitySubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Activity Name"
              placeholder="e.g. 2026 Quarter 4 CSWDO Child Surveillance Drive"
              value={newActivityForm.name}
              onChange={(e) => setNewActivityForm({ ...newActivityForm, name: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Target Year"
                type="number"
                value={newActivityForm.year}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, year: e.target.value })}
                required
              />
              <Input
                label="Target Households Count"
                type="number"
                value={newActivityForm.totalTargetHouseholds}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, totalTargetHouseholds: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Start Date"
                type="date"
                value={newActivityForm.startDate}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={newActivityForm.endDate}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, endDate: e.target.value })}
                required
              />
            </div>

            {/* Barangay Multi-selection pills */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Target Barangays:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {AVAILABLE_BARANGAYS.map((b) => {
                  const isSelected = newActivityForm.barangays.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        if (isSelected) {
                          setNewActivityForm({
                            ...newActivityForm,
                            barangays: newActivityForm.barangays.filter((x) => x !== b),
                          });
                        } else {
                          setNewActivityForm({
                            ...newActivityForm,
                            barangays: [...newActivityForm.barangays, b],
                          });
                        }
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assigned Service Providers selection */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Assigned Service Providers / Field Workers:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {AVAILABLE_WORKERS.map((w) => {
                  const isSelected = newActivityForm.assignedWorkerIds.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        if (isSelected) {
                          setNewActivityForm({
                            ...newActivityForm,
                            assignedWorkerIds: newActivityForm.assignedWorkerIds.filter((x) => x !== w.id),
                          });
                        } else {
                          setNewActivityForm({
                            ...newActivityForm,
                            assignedWorkerIds: [...newActivityForm.assignedWorkerIds, w.id],
                          });
                        }
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {w.name} ({w.role})
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" size="md" onClick={() => setIsCreateActivityOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Create & Initialize Activity
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: ASSIGN WORKERS (1. ASSIGN WORKERS ACTION)
          ========================================================================= */}
      {selectedActivityForAssign && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Field Workers: ${selectedActivityForAssign.name}`}
          subtitle={`Activity ID: ${selectedActivityForAssign.id}`}
          size="md"
        >
          <form onSubmit={handleAssignWorkersSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Select
                label="Assign to Barangay"
                value={assignBarangay}
                onChange={(e) => setAssignBarangay(e.target.value)}
                options={selectedActivityForAssign.barangays.map((b) => ({ value: b, label: b }))}
              />

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Select Field Workers to Dispatch:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {AVAILABLE_WORKERS.map((w) => {
                    const isSelected = assignWorkerIds.includes(w.id);
                    return (
                      <div
                        key={w.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) var(--space-3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setAssignWorkerIds(assignWorkerIds.filter((x) => x !== w.id));
                          } else {
                            setAssignWorkerIds([...assignWorkerIds, w.id]);
                          }
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{w.name}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{w.role}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" size="md" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Confirm Worker Assignment
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          OFFICIAL ECCD COUNCIL FORM MODALS
          ========================================================================= */}
      <OfficialForm1HomeProfileModal
        isOpen={isForm1ModalOpen}
        onClose={() => setIsForm1ModalOpen(false)}
        householdId={selectedHouseholdForForm1?.id}
        householdNo={selectedHouseholdForForm1?.id}
      />

      <OfficialForm3CommunityProfileModal
        isOpen={isForm3ModalOpen}
        onClose={() => setIsForm3ModalOpen(false)}
        barangayName={selectedBarangayForForm3}
      />
    </div>
  );
}

export default CommunityMappingView;
