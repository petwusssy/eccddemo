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
  User,
  Heart,
  DollarSign,
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
import { apiClient } from '../../services/apiClient';
import { officialFormsService } from '../../services/officialFormsService';
import { communityMappingService } from '../../services/communityMappingService';
import { communityService } from '../../services/communityService';
import { centralDataStore } from '../../services/centralDataStore';
import { OfficialForm1HomeProfileModal } from '../forms/OfficialForm1HomeProfileModal';
import { OfficialForm3CommunityProfileModal } from '../forms/OfficialForm3CommunityProfileModal';
import { OfflineSyncBanner } from '../ui/OfflineSyncBanner';
import {
  saveOfflineSurvey,
  getAllOfflineSurveys,
  getPendingSyncCount,
  markSurveySynced,
  syncPendingSurveysToBackend,
} from '../../services/offlineMappingStore';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { formatPHTTime, getPhilippinesDate } from '../../utils/phTime';

const AVAILABLE_BARANGAYS = SAN_FERNANDO_BARANGAYS;

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
  const [workers, setWorkers] = useState(() => centralDataStore.getWorkers() || []);
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Household, 2: Parent Profiles (1.A/B), 3: Family & Housing (1.C), 4: Children 0–4, 5: Review & Save, 6: Completion
  const [parentProfileTab, setParentProfileTab] = useState('mother'); // 'mother' | 'father'

  // Step 1: Household Form
  const [householdForm, setHouseholdForm] = useState({
    id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
    parentGuardian: '',
    contactNumber: '',
    address: '',
    barangay: 'San Isidro',
    purok: 'Purok 1',
    activityId: 'ACT-MAP-2026-001',
    workerId: '',
    workerName: '',
  });

  // Step 2: Form 1.A Father's Profile
  const [fatherProfile, setFatherProfile] = useState({
    lastName: '',
    firstName: '',
    middleInitial: '',
    birthDate: '',
    age: '',
    civilStatus: 'Married',
    district: 'San Isidro',
    purok: 'Purok 1',
    motherTongue: 'Tagalog',
    motherTongueOthers: '',
    otherDialects: 'Kapampangan',
    educationalAttainment: 'High School /Graduate',
    occupationalStatus: 'Employed',
    occupationalStatusOthers: '',
  });

  // Step 2: Form 1.B Mother's Profile
  const [motherProfile, setMotherProfile] = useState({
    lastName: '',
    firstName: '',
    middleInitial: '',
    birthDate: '',
    age: '',
    civilStatus: 'Married',
    district: 'San Isidro',
    purok: 'Purok 1',
    pregnant: 'No',
    motherTongue: 'Tagalog',
    motherTongueOthers: '',
    otherDialects: 'Kapampangan',
    educationalAttainment: 'College /Graduate',
    occupationalStatus: 'Employed',
    occupationalStatusOthers: '',
    interestedAge: '3 years old',
  });

  // Step 3: Form 1.C Family Profile
  const [familyProfile, setFamilyProfile] = useState({
    ownership: 'Owned',
    materials: 'Concrete',
    nature: 'Multiple Rooms',
    incomeClass: 'P10,000 - P20,000',
    is4Ps: false,
    withToilet: true,
    withOpenPlayArea: true,
    bedroom: true,
    diningRoom: true,
    sala: true,
    kitchen: true,
    runningWater: true,
    electricity: true,
    aircon: false,
    mobilePhone: true,
    computer: true,
    internet: true,
    cdDvdPlayer: false,
    television: true,
    radio: true,
    books: true,
    storyBooks: true,
    boardGames: true,
    toys: true,
    immediateMembersCount: 4,
    relativesCount: 0,
    nonRelativesCount: 0,
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
      const [actsData, rawWorkers] = await Promise.all([
        communityMappingService.getActivities(),
        communityService.getWorkers(),
      ]);
      setActivities(actsData.activities || []);
      setAssignments(actsData.assignments || []);
      if (rawWorkers && rawWorkers.length > 0) {
        setWorkers(rawWorkers);
      }

      const hhData = await communityMappingService.getHouseholds();
      const offlineSurveys = await getAllOfflineSurveys();

      // Only include offline surveys that are truly pending sync and not already represented in server households
      const pendingOfflineSurveys = (offlineSurveys || []).filter((s) => s.syncStatus === 'pending');

      const existingGuardians = new Set(
        (hhData || []).map((h) => `${(h.parentGuardian || h.parent_guardian || '').toLowerCase().trim()}|${(h.barangay || '').toLowerCase().trim()}`)
      );
      const existingIds = new Set((hhData || []).map((h) => h.id || h.household_no));

      const trulyUnsyncedOffline = pendingOfflineSurveys
        .filter((s) => {
          const id = s.householdId || s.id;
          const guardian = (s.household?.parentGuardian || s.parentGuardian || '').toLowerCase().trim();
          const brgy = (s.household?.barangay || s.barangay || '').toLowerCase().trim();
          const key = `${guardian}|${brgy}`;
          return !existingIds.has(id) && (!guardian || !existingGuardians.has(key));
        })
        .map((s) => ({
          id: s.householdId || s.id,
          parentGuardian: s.household?.parentGuardian || s.parentGuardian || 'Offline Household Record',
          address: s.household?.address || s.address || 'Field Survey',
          barangay: s.household?.barangay || s.barangay || 'San Isidro',
          contactNumber: s.household?.contactNumber || s.contactNumber || 'N/A',
          childrenCount: s.children?.length || s.household?.childrenCount || 1,
          mappedBy: s.mappedBy || 'Field Worker (PWA Offline)',
          mappedDate: s.createdAt ? s.createdAt.slice(0, 10) : 'Recent',
          status: 'Pending Sync',
          syncStatus: 'pending',
          isOfflineRecord: true,
          children: s.children || [],
        }));

      const mergedHouseholds = [
        ...trulyUnsyncedOffline,
        ...(hhData || []).map((h) => {
          const matchingOffline = (offlineSurveys || []).find((s) => s.householdId === h.id || s.id === h.id);
          if (matchingOffline) {
            return { ...h, syncStatus: matchingOffline.syncStatus };
          }
          return h;
        }),
      ];

      // Final strict deduplication by normalized guardian and barangay
      const seenHouseholds = new Map();
      const deduplicatedHouseholds = [];
      mergedHouseholds.forEach((h) => {
        const guardian = (h.parentGuardian || h.parent_guardian || '').toLowerCase().trim();
        const brgy = (h.barangay || '').toLowerCase().trim();
        const key = guardian && guardian !== 'offline household record' && guardian !== 'n/a'
          ? `${guardian}|${brgy}`
          : (h.id || Math.random());
        if (!seenHouseholds.has(key)) {
          seenHouseholds.set(key, h);
          deduplicatedHouseholds.push(h);
        }
      });

      setHouseholds(deduplicatedHouseholds);

      // Check for saved local draft
      const draft = communityMappingService.getDraft();
      if (draft && draft.householdForm) {
        setHouseholdForm(draft.householdForm);
        if (draft.fatherProfile) setFatherProfile(draft.fatherProfile);
        if (draft.motherProfile) setMotherProfile(draft.motherProfile);
        if (draft.familyProfile) setFamilyProfile(draft.familyProfile);
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

  // Single Source of Truth: dynamic Form 6 Worker assignments linked to centers and activities
  const dynamicAssignments = useMemo(() => {
    const workerPool = (workers && workers.length > 0)
      ? workers
      : (assignments && assignments.length > 0
          ? assignments.map((a) => ({
              id: a.workerId,
              name: a.workerName,
              assignedBarangay: a.assignedBarangay,
              assignedCenters: [a.assignedCenter || 'Child Development Center'],
              role: a.role || 'Child Development Worker',
              status: a.status || 'Active',
            }))
          : []);

    if (workerPool.length === 0) return assignments;

    return workerPool.map((w) => {
      const assignedBrgy = w.assignedBarangay || 'San Isidro';
      const assignedCenter =
        (Array.isArray(w.assignedCenters) && w.assignedCenters[0]) ||
        w.center ||
        w.centerName ||
        w.dayCareCenterName ||
        'Child Development Center';

      // Connect to active mapping rounds for this worker's barangay
      const activeDrive =
        activities.find(
          (act) =>
            !act.archived &&
            (act.barangays || []).some(
              (b) => (b || '').toLowerCase().trim() === assignedBrgy.toLowerCase().trim()
            )
        ) ||
        activities.find((act) => !act.archived) ||
        activities[0] || {
          id: 'ACT-MAP-2026-001',
          name: '2026 Annual CSWDO House-to-House Child Mapping Drive',
        };

      // Real-time metrics computed directly from Form 1 surveyed households
      const brgyHouseholds = households.filter((h) => {
        const matchBrgy = (h.barangay || '').toLowerCase().trim() === assignedBrgy.toLowerCase().trim();
        const matchWorker =
          (h.mappedBy && (h.mappedBy === w.name || h.mappedBy.includes(w.name))) ||
          (h.workerId && h.workerId === w.id);
        return matchBrgy || matchWorker;
      });

      const householdsMapped = brgyHouseholds.length;
      const childrenIdentified = brgyHouseholds.reduce(
        (acc, h) =>
          acc + (h.children?.length || (h.childrenAges ? h.childrenAges.length : 0) || h.childrenCount || 1),
        0
      );

      const targetHH = 60; // Standard cohort coverage target
      const remainingHouseholds = Math.max(0, targetHH - householdsMapped);
      const progress = targetHH > 0 ? Math.min(100, Math.round((householdsMapped / targetHH) * 100)) : 0;

      return {
        workerId: w.id,
        workerName: w.name,
        role: w.role || w.designation || 'Child Development Worker',
        assignedBarangay: assignedBrgy,
        assignedCenter,
        assignedCenters: [assignedCenter],
        activityId: activeDrive.id,
        activityName: activeDrive.name,
        progress,
        householdsMapped,
        childrenIdentified,
        remainingHouseholds,
        status: (w.status || '').toLowerCase() === 'inactive' ? 'On Leave' : 'Active in Field',
      };
    });
  }, [workers, assignments, activities, households]);

  // Save draft locally
  const handleSaveDraft = () => {
    const draftPayload = {
      householdForm,
      fatherProfile,
      motherProfile,
      familyProfile,
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
      firstName: currentChildInput.firstName.trim().toUpperCase(),
      middleName: (currentChildInput.middleName || '').trim().toUpperCase(),
      lastName: currentChildInput.lastName.trim().toUpperCase(),
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

  // Run Check Existing Records (Deduplication Logic)
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

  // Proceed to Next Step in 5-Step Sequence
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!householdForm.parentGuardian || !householdForm.address) {
        addToast('Please fill out Parent/Guardian and Address', 'error');
        return;
      }
      // Auto-prefill Father or Mother name from parentGuardian if both are blank
      if (!fatherProfile.firstName && !fatherProfile.lastName && !motherProfile.firstName && !motherProfile.lastName) {
        const parts = householdForm.parentGuardian.trim().split(' ');
        const lName = parts.length > 1 ? parts[parts.length - 1] : '';
        const fName = parts.length > 0 ? parts.slice(0, -1).join(' ') || parts[0] : '';
        setMotherProfile((prev) => ({
          ...prev,
          firstName: fName,
          lastName: lName,
          purok: householdForm.purok || prev.purok,
          district: householdForm.barangay || prev.district,
        }));
        setFatherProfile((prev) => ({
          ...prev,
          lastName: lName,
          purok: householdForm.purok || prev.purok,
          district: householdForm.barangay || prev.district,
        }));
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Parent Profiles validation
      const hasMother = motherProfile.firstName || motherProfile.lastName;
      const hasFather = fatherProfile.firstName || fatherProfile.lastName;
      if (!hasMother && !hasFather && !householdForm.parentGuardian) {
        addToast('Please provide at least Father or Mother profile details', 'error');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Step 3: Family Profile -> proceed to Children Cohort
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Step 4: Children Cohort validation
      if (childrenList.length === 0) {
        addToast('Please add at least one child aged 0–4 before continuing', 'error');
        return;
      }
      setCurrentStep(5);
      await runDuplicateCheck();
    } else if (currentStep === 5) {
      // Step 5: Final Submission
      await handleFinalSubmission();
    }
  };

  // Final Submission: Save Household, Full Form 1 (Home Profile), and Children 0–4 Cohort
  const handleFinalSubmission = async () => {
    setSyncStatus('saving');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const brgyIndex = SAN_FERNANDO_BARANGAYS.findIndex(
      (b) => b.toLowerCase().trim() === (householdForm.barangay || '').toLowerCase().trim()
    );
    const form3BarangayId = brgyIndex >= 0 ? `BRGY-${String(brgyIndex + 1).padStart(2, '0')}` : 'BRGY-01';

    const primaryGuardian =
      householdForm.parentGuardian ||
      (motherProfile.firstName ? `${motherProfile.firstName} ${motherProfile.lastName}` : '') ||
      (fatherProfile.firstName ? `${fatherProfile.firstName} ${fatherProfile.lastName}` : 'Household Head');

    const householdPayload = {
      id: householdForm.id,
      household_no: householdForm.id,
      parentGuardian: String(primaryGuardian).trim().toUpperCase(),
      contactNumber: householdForm.contactNumber ? householdForm.contactNumber.replace(/\D/g, '') : '',
      address: `${householdForm.address}, ${householdForm.purok}`,
      barangay: householdForm.barangay,
      barangayId: form3BarangayId,
      purok: householdForm.purok,
      mappingActivityId: householdForm.activityId,
      childrenCount: childrenList.length,
      mappedBy: householdForm.workerName || 'CSWDO Field Officer',
      workerId: householdForm.workerId || null,
      mappedDate: new Date().toISOString().slice(0, 10),
      is4Ps: familyProfile.is4Ps,
      status: 'Completed',
    };

    const completeForm1Payload = {
      householdId: householdForm.id,
      householdNo: householdForm.id,
      barangay: householdForm.barangay,
      barangayId: form3BarangayId,
      purok: householdForm.purok,
      address: householdForm.address,
      parentGuardian: primaryGuardian,
      contactNumber: householdForm.contactNumber,
      childrenCount: childrenList.length,
      father: {
        ...fatherProfile,
        district: householdForm.barangay,
        purok: householdForm.purok,
      },
      mother: {
        ...motherProfile,
        district: householdForm.barangay,
        purok: householdForm.purok,
      },
      family: {
        ...familyProfile,
      },
      nameOfCDT: householdForm.workerName || 'Child Development Worker',
      dateConducted: getPhilippinesDate(),
    };

    // 1. Immediately write to IndexedDB (idb) with pending status so data is never lost offline
    const surveyId = `SURVEY-${householdForm.id}`;
    await saveOfflineSurvey({
      id: surveyId,
      householdId: householdForm.id,
      household: householdPayload,
      form1Data: completeForm1Payload,
      children: childrenList,
      syncStatus: 'pending',
    });

    try {
      // 2. Create household bound to Form 3 Barangay
      const createdHh = await communityMappingService.createHousehold(householdPayload);

      // Save complete Form 1 Master Profile for this household
      officialFormsService.saveForm1Data(createdHh.id, completeForm1Payload);

      // 3. Register children and auto-push to Mapped but Not Enrolled Queue
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
          parentGuardian: primaryGuardian,
          barangay: householdForm.barangay,
          barangayId: form3BarangayId,
          enrollmentStatus: child.enrollmentStatus || 'Not Enrolled',
          enrollmentCenter: child.enrollmentCenter || (child.enrollmentStatus === 'Enrolled' ? 'Assigned CDC' : 'Pending CDC Assignment'),
          documentUrl: child.documentUrl,
          documentName: child.documentName,
          existingChildId: child.decision === 'same' && child.matchedRecord ? child.matchedRecord.id : null,
        });
        savedChildren.push(regRes.child);
      }

      // If online, perform complete sync to central backend
      if (isOnline) {
        try {
          await syncPendingSurveysToBackend();
          await markSurveySynced(surveyId, { ok: true, synced: true });
        } catch (syncErr) {
          console.warn('Auto-sync deferred:', syncErr.message);
        }
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

      setCurrentStep(6);
      if (isOnline) {
        addToast('Household mapping and Form 1 Profile completed and synced successfully!', 'success');
      } else {
        addToast('Saved offline to IndexedDB. Form 1 record queued for sync!', 'info');
      }

      await loadData();
    } catch (err) {
      console.warn('Network issue during submission, safely retained in IndexedDB:', err);
      // Mark as pending sync in IndexedDB
      await saveOfflineSurvey({
        id: `SURVEY-${householdForm.id}`,
        householdId: householdForm.id,
        household: householdPayload,
        form1Data: completeForm1Payload,
        children: childrenList,
        syncStatus: 'pending',
      });
      officialFormsService.saveForm1Data(householdForm.id, completeForm1Payload);
      setSyncStatus('draft');
      setCompletedSummary({
        household: householdPayload,
        children: childrenList,
        timestamp: formatPHTTime(new Date(), true),
      });
      setCurrentStep(6);
      addToast('Working offline: Survey and Form 1 saved to local IndexedDB and queued for sync.', 'warning');
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
      workerId: householdForm.workerId,
      workerName: householdForm.workerName,
    });
    setFatherProfile({
      lastName: '',
      firstName: '',
      middleInitial: '',
      birthDate: '',
      age: '',
      civilStatus: 'Married',
      district: householdForm.barangay,
      purok: householdForm.purok,
      motherTongue: 'Tagalog',
      motherTongueOthers: '',
      otherDialects: 'Kapampangan',
      educationalAttainment: 'High School /Graduate',
      occupationalStatus: 'Employed',
      occupationalStatusOthers: '',
    });
    setMotherProfile({
      lastName: '',
      firstName: '',
      middleInitial: '',
      birthDate: '',
      age: '',
      civilStatus: 'Married',
      district: householdForm.barangay,
      purok: householdForm.purok,
      pregnant: 'No',
      motherTongue: 'Tagalog',
      motherTongueOthers: '',
      otherDialects: 'Kapampangan',
      educationalAttainment: 'College /Graduate',
      occupationalStatus: 'Employed',
      occupationalStatusOthers: '',
      interestedAge: '3 years old',
    });
    setFamilyProfile({
      ownership: 'Owned',
      materials: 'Concrete',
      nature: 'Multiple Rooms',
      incomeClass: 'P10,000 - P20,000',
      is4Ps: false,
      withToilet: true,
      withOpenPlayArea: true,
      bedroom: true,
      diningRoom: true,
      sala: true,
      kitchen: true,
      runningWater: true,
      electricity: true,
      aircon: false,
      mobilePhone: true,
      computer: true,
      internet: true,
      cdDvdPlayer: false,
      television: true,
      radio: true,
      books: true,
      storyBooks: true,
      boardGames: true,
      toys: true,
      immediateMembersCount: 4,
      relativesCount: 0,
      nonRelativesCount: 0,
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

    const assignedWorkers = workers.filter((w) =>
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

    const selectedWorkers = workers.filter((w) => assignWorkerIds.includes(w.id));
    await communityMappingService.assignWorkers(
      selectedActivityForAssign.id,
      selectedWorkers,
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
          <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-success-primary)', margin: 0 }}>{dynamicAssignments.length}</div>
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
            setSelectedBarangayForForm3(householdForm?.barangay || 'San Isidro');
            setIsForm3ModalOpen(true);
          }}
          title="Open official ECCD Council Form 3"
        >
          <FileText size={16} />
          <span>Official Form 3</span>
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
            Field Worker Assignments ({dynamicAssignments.length})
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: HOUSE-TO-HOUSE WORKFLOW (GUIDED 4-STEP STEPPER)
          MOBILE-FIRST UX (mobile-design skill)
          ========================================================================= */}
      {activeTab === 'stepper' && (
        <div className="mapping-stepper-container">
          {/* Modern Compact Pill Stepper - 5 Official Steps */}
          <div className="mapping-stepper" role="navigation" aria-label="Mapping Stepper">
            {[
              { num: 1, label: 'Household Info' },
              { num: 2, label: 'Parent Profiles (1.A/B)' },
              { num: 3, label: 'Family & Housing (1.C)' },
              { num: 4, label: `Children 0–4 (${childrenList.length})` },
              { num: 5, label: 'Review & Save' },
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
              STEP 1: HOUSEHOLD & ADDRESS INFORMATION
              ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                  <CardTitle subtitle="Step 1: Community Mapping demographic identifiers and location">
                    Household & Address Information
                  </CardTitle>
                  {householdForm.workerName && (
                    <Badge variant="primary" size="sm">
                      <Users size={12} style={{ marginRight: '4px' }} />
                      Field Worker: {householdForm.workerName}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                    <Input
                      label="Household ID"
                      value={householdForm.id}
                      onChange={(e) => setHouseholdForm({ ...householdForm, id: e.target.value })}
                      required
                    />

                    <Select
                      label="Barangay"
                      value={householdForm.barangay}
                      onChange={(e) => {
                        const newBrgy = e.target.value;
                        const matchingWorker = workers.find(
                          (w) => (w.assignedBarangay || '').toLowerCase() === newBrgy.toLowerCase()
                        );
                        setHouseholdForm({
                          ...householdForm,
                          barangay: newBrgy,
                          ...(matchingWorker
                            ? { workerId: matchingWorker.id, workerName: matchingWorker.name }
                            : {}),
                        });
                        setFatherProfile((prev) => ({ ...prev, district: newBrgy }));
                        setMotherProfile((prev) => ({ ...prev, district: newBrgy }));
                      }}
                      options={AVAILABLE_BARANGAYS.map((b) => ({ value: b, label: b }))}
                    />

                    <Select
                      label="Assigned Worker (Form 6)"
                      value={householdForm.workerId || ''}
                      onChange={(e) => {
                        const selectedW = workers.find((w) => String(w.id) === String(e.target.value));
                        setHouseholdForm({
                          ...householdForm,
                          workerId: selectedW ? selectedW.id : '',
                          workerName: selectedW ? selectedW.name : '',
                          ...(selectedW?.assignedBarangay ? { barangay: selectedW.assignedBarangay } : {}),
                        });
                      }}
                      options={[
                        { value: '', label: '-- Select Field Worker --' },
                        ...workers.map((w) => ({
                          value: w.id,
                          label: `${w.name} (${w.assignedBarangay || 'Unassigned'})`,
                        })),
                      ]}
                    />

                    <Input
                      label="Purok / Sitio / Cluster"
                      placeholder="e.g. Purok 3 (Riverside)"
                      value={householdForm.purok}
                      onChange={(e) => {
                        const p = e.target.value;
                        setHouseholdForm({ ...householdForm, purok: p });
                        setFatherProfile((prev) => ({ ...prev, purok: p }));
                        setMotherProfile((prev) => ({ ...prev, purok: p }));
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                    <Input
                      label="Primary Parent / Guardian Full Name"
                      placeholder="e.g. Maria Santos Dela Cruz"
                      uppercase
                      value={householdForm.parentGuardian}
                      onChange={(e) => setHouseholdForm({ ...householdForm, parentGuardian: e.target.value.toUpperCase() })}
                      required
                    />

                    <Input
                      label="Contact Number"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 09171234567"
                      value={householdForm.contactNumber}
                      onChange={(e) => setHouseholdForm({ ...householdForm, contactNumber: e.target.value.replace(/\D/g, '') })}
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
                  Next: Parent Profiles (1.A/B)
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 2: PARENT/GUARDIAN PROFILES (FORM 1.A & 1.B)
              ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                  <CardTitle subtitle="Step 2: Official Form 1.A Father's Profile & Form 1.B Mother's Profile">
                    Parent / Guardian Profiles
                  </CardTitle>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Badge variant={motherProfile.firstName ? 'success' : 'neutral'} size="sm">
                      Mother: {motherProfile.firstName ? `${motherProfile.firstName} ${motherProfile.lastName}` : 'Pending'}
                    </Badge>
                    <Badge variant={fatherProfile.firstName ? 'success' : 'neutral'} size="sm">
                      Father: {fatherProfile.firstName ? `${fatherProfile.firstName} ${fatherProfile.lastName}` : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* Sub-tab Switcher for 1.A / 1.B */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${parentProfileTab === 'mother' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setParentProfileTab('mother')}
                    style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                  >
                    <User size={14} style={{ marginRight: '6px' }} />
                    Form 1.B Mother's Profile
                    {motherProfile.firstName ? ' ✓' : ''}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${parentProfileTab === 'father' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setParentProfileTab('father')}
                    style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                  >
                    <User size={14} style={{ marginRight: '6px' }} />
                    Form 1.A Father's Profile
                    {fatherProfile.firstName ? ' ✓' : ''}
                  </button>
                </div>

                {/* FORM 1.B MOTHER'S PROFILE */}
                {parentProfileTab === 'mother' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="official-section-title">1. Personal Information (Mother)</div>
                    <div className="official-grid-5">
                      <Input
                        label="Last Name"
                        uppercase
                        value={motherProfile.lastName}
                        onChange={(e) => setMotherProfile({ ...motherProfile, lastName: e.target.value.toUpperCase() })}
                      />
                      <Input
                        label="First Name"
                        uppercase
                        value={motherProfile.firstName}
                        onChange={(e) => setMotherProfile({ ...motherProfile, firstName: e.target.value.toUpperCase() })}
                      />
                      <Input
                        label="Middle Initial"
                        uppercase
                        value={motherProfile.middleInitial}
                        onChange={(e) => setMotherProfile({ ...motherProfile, middleInitial: e.target.value.toUpperCase() })}
                      />
                      <Input
                        type="date"
                        label="Date of Birth"
                        value={motherProfile.birthDate}
                        onChange={(e) => {
                          const dob = e.target.value;
                          let ageVal = motherProfile.age;
                          if (dob) {
                            const bDate = new Date(dob);
                            const now = new Date();
                            ageVal = String(now.getFullYear() - bDate.getFullYear());
                          }
                          setMotherProfile({ ...motherProfile, birthDate: dob, age: ageVal });
                        }}
                      />
                      <Input
                        type="number"
                        label="Age"
                        value={motherProfile.age}
                        onChange={(e) => setMotherProfile({ ...motherProfile, age: e.target.value })}
                      />
                    </div>

                    <div className="official-grid-2">
                      <div>
                        <div className="official-section-title">2. Civil Status</div>
                        <div className="official-choice-group">
                          {['Single', 'Married', 'Separated', 'Widower', 'Live-in'].map((status) => (
                            <div
                              key={status}
                              className={`official-choice-item ${motherProfile.civilStatus === status ? 'is-selected' : ''}`}
                              onClick={() => setMotherProfile({ ...motherProfile, civilStatus: status })}
                            >
                              <span>{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="official-section-title">3. Pregnancy Status</div>
                        <div className="official-choice-group">
                          {['No', 'Yes'].map((opt) => (
                            <div
                              key={opt}
                              className={`official-choice-item ${motherProfile.pregnant === opt ? 'is-selected' : ''}`}
                              onClick={() => setMotherProfile({ ...motherProfile, pregnant: opt })}
                            >
                              <span>{opt === 'Yes' ? '🤰 Currently Pregnant' : 'Not Pregnant'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="official-section-title">4. Mother Tongue &amp; Dialects</div>
                    <div className="official-choice-group">
                      {['Tagalog', 'Visayan', 'Ilocano', 'Bicolano', 'Others'].map((lang) => (
                        <div
                          key={lang}
                          className={`official-choice-item ${motherProfile.motherTongue === lang ? 'is-selected' : ''}`}
                          onClick={() => setMotherProfile({ ...motherProfile, motherTongue: lang })}
                        >
                          <span>{lang}</span>
                        </div>
                      ))}
                    </div>
                    {motherProfile.motherTongue === 'Others' && (
                      <Input
                        label="Other Mother Tongue, please specify"
                        value={motherProfile.motherTongueOthers}
                        onChange={(e) => setMotherProfile({ ...motherProfile, motherTongueOthers: e.target.value })}
                      />
                    )}
                    <Input
                      label="Other Dialects Spoken at Home"
                      placeholder="e.g. Kapampangan"
                      value={motherProfile.otherDialects}
                      onChange={(e) => setMotherProfile({ ...motherProfile, otherDialects: e.target.value })}
                    />

                    <div className="official-section-title">5. Educational Attainment</div>
                    <div className="official-choice-group">
                      {[
                        'Elem. /Graduate',
                        'High School/ Graduate',
                        'College/ Graduate',
                        'Technical/Vocational Graduate',
                        'Masteral Unit/Degree',
                        'Doctoral Unit/Degree',
                      ].map((edu) => (
                        <div
                          key={edu}
                          className={`official-choice-item ${motherProfile.educationalAttainment === edu ? 'is-selected' : ''}`}
                          onClick={() => setMotherProfile({ ...motherProfile, educationalAttainment: edu })}
                        >
                          <span>{edu}</span>
                        </div>
                      ))}
                    </div>

                    <div className="official-section-title">6. Occupational Status</div>
                    <div className="official-choice-group">
                      {['Employed', 'Unemployed', 'Retired', 'OFW', 'Others'].map((occ) => (
                        <div
                          key={occ}
                          className={`official-choice-item ${motherProfile.occupationalStatus === occ ? 'is-selected' : ''}`}
                          onClick={() => setMotherProfile({ ...motherProfile, occupationalStatus: occ })}
                        >
                          <span>{occ}</span>
                        </div>
                      ))}
                    </div>
                    {motherProfile.occupationalStatus === 'Others' && (
                      <Input
                        label="Other Occupation, please specify"
                        value={motherProfile.occupationalStatusOthers}
                        onChange={(e) => setMotherProfile({ ...motherProfile, occupationalStatusOthers: e.target.value })}
                      />
                    )}

                    <div className="official-section-title">7. Desired Age for Day Care (CDC) Entry</div>
                    <div className="official-choice-group">
                      {['Below 1 year old', '1 year old', '2 years old', '3 years old', '4 years old'].map((ageOption) => (
                        <div
                          key={ageOption}
                          className={`official-choice-item ${motherProfile.interestedAge === ageOption ? 'is-selected' : ''}`}
                          onClick={() => setMotherProfile({ ...motherProfile, interestedAge: ageOption })}
                        >
                          <span>{ageOption}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FORM 1.A FATHER'S PROFILE */}
                {parentProfileTab === 'father' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="official-section-title">1. Personal Information (Father)</div>
                    <div className="official-grid-5">
                      <Input
                        label="Last Name"
                        uppercase
                        value={fatherProfile.lastName}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, lastName: e.target.value.toUpperCase() })}
                      />
                      <Input
                        label="First Name"
                        uppercase
                        value={fatherProfile.firstName}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, firstName: e.target.value.toUpperCase() })}
                      />
                      <Input
                        label="Middle Initial"
                        uppercase
                        value={fatherProfile.middleInitial}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, middleInitial: e.target.value.toUpperCase() })}
                      />
                      <Input
                        type="date"
                        label="Date of Birth"
                        value={fatherProfile.birthDate}
                        onChange={(e) => {
                          const dob = e.target.value;
                          let ageVal = fatherProfile.age;
                          if (dob) {
                            const bDate = new Date(dob);
                            const now = new Date();
                            ageVal = String(now.getFullYear() - bDate.getFullYear());
                          }
                          setFatherProfile({ ...fatherProfile, birthDate: dob, age: ageVal });
                        }}
                      />
                      <Input
                        type="number"
                        label="Age"
                        value={fatherProfile.age}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, age: e.target.value })}
                      />
                    </div>

                    <div className="official-section-title">2. Civil Status</div>
                    <div className="official-choice-group">
                      {['Single', 'Married', 'Separated', 'Widower', 'Live-in'].map((status) => (
                        <div
                          key={status}
                          className={`official-choice-item ${fatherProfile.civilStatus === status ? 'is-selected' : ''}`}
                          onClick={() => setFatherProfile({ ...fatherProfile, civilStatus: status })}
                        >
                          <span>{status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="official-section-title">3. Mother Tongue &amp; Dialects</div>
                    <div className="official-choice-group">
                      {['Tagalog', 'Visayan', 'Ilocano', 'Bicolnon', 'Others'].map((lang) => (
                        <div
                          key={lang}
                          className={`official-choice-item ${fatherProfile.motherTongue === lang ? 'is-selected' : ''}`}
                          onClick={() => setFatherProfile({ ...fatherProfile, motherTongue: lang })}
                        >
                          <span>{lang}</span>
                        </div>
                      ))}
                    </div>
                    {fatherProfile.motherTongue === 'Others' && (
                      <Input
                        label="Other Mother Tongue, please specify"
                        value={fatherProfile.motherTongueOthers}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, motherTongueOthers: e.target.value })}
                      />
                    )}
                    <Input
                      label="Other Dialects Spoken at Home"
                      placeholder="e.g. Kapampangan"
                      value={fatherProfile.otherDialects}
                      onChange={(e) => setFatherProfile({ ...fatherProfile, otherDialects: e.target.value })}
                    />

                    <div className="official-section-title">4. Educational Attainment</div>
                    <div className="official-choice-group">
                      {[
                        'Elem./Graduate',
                        'High School /Graduate',
                        'College /Graduate',
                        'Technical/Vocational Graduate',
                        'Masteral Unit/Degree',
                        'Doctoral Unit/Degree',
                      ].map((edu) => (
                        <div
                          key={edu}
                          className={`official-choice-item ${fatherProfile.educationalAttainment === edu ? 'is-selected' : ''}`}
                          onClick={() => setFatherProfile({ ...fatherProfile, educationalAttainment: edu })}
                        >
                          <span>{edu}</span>
                        </div>
                      ))}
                    </div>

                    <div className="official-section-title">5. Occupational Status</div>
                    <div className="official-choice-group">
                      {['Employed', 'Unemployed', 'Retired', 'OFW', 'Others'].map((occ) => (
                        <div
                          key={occ}
                          className={`official-choice-item ${fatherProfile.occupationalStatus === occ ? 'is-selected' : ''}`}
                          onClick={() => setFatherProfile({ ...fatherProfile, occupationalStatus: occ })}
                        >
                          <span>{occ}</span>
                        </div>
                      ))}
                    </div>
                    {fatherProfile.occupationalStatus === 'Others' && (
                      <Input
                        label="Other Occupation, please specify"
                        value={fatherProfile.occupationalStatusOthers}
                        onChange={(e) => setFatherProfile({ ...fatherProfile, occupationalStatusOthers: e.target.value })}
                      />
                    )}
                  </div>
                )}
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button variant="ghost" size="md" onClick={handleSaveDraft}>
                  <Save size={16} />
                  Save Draft
                </Button>
                <Button variant="primary" size="md" onClick={handleNextStep}>
                  Next: Family & Housing (1.C)
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 3: FAMILY & HOUSING PROFILE (FORM 1.C)
              ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle subtitle="Step 3: Official Form 1.C Housing materials, utilities, socio-economic class, and 4Ps membership">
                  Family & Housing Profile (Form 1.C)
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {/* 1. Ownership & Materials */}
                  <div className="official-section-title">1. Housing Ownership &amp; Materials</div>
                  <div className="official-grid-2">
                    <div>
                      <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ownership</label>
                      <div className="official-choice-group">
                        {['Owned', 'Rented', 'With parents', 'With relatives'].map((opt) => (
                          <div
                            key={opt}
                            className={`official-choice-item ${familyProfile.ownership === opt ? 'is-selected' : ''}`}
                            onClick={() => setFamilyProfile({ ...familyProfile, ownership: opt })}
                          >
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Construction Materials</label>
                      <div className="official-choice-group">
                        {['Concrete', 'Wood', 'Nipa', 'Make shift'].map((mat) => (
                          <div
                            key={mat}
                            className={`official-choice-item ${familyProfile.materials === mat ? 'is-selected' : ''}`}
                            onClick={() => setFamilyProfile({ ...familyProfile, materials: mat })}
                          >
                            <span>{mat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Nature of House & Rooms */}
                  <div className="official-section-title">2. Nature of House &amp; Room Layout</div>
                  <div className="official-choice-group" style={{ marginBottom: 'var(--space-2)' }}>
                    {['Multiple Rooms', 'One Room'].map((roomType) => (
                      <div
                        key={roomType}
                        className={`official-choice-item ${familyProfile.nature === roomType ? 'is-selected' : ''}`}
                        onClick={() => setFamilyProfile({ ...familyProfile, nature: roomType })}
                      >
                        <strong>{roomType}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="official-grid-3">
                    <label className={`official-choice-item ${familyProfile.withToilet ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.withToilet}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, withToilet: e.target.checked })}
                      />
                      <span>With Sanitary Toilet</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.withOpenPlayArea ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.withOpenPlayArea}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, withOpenPlayArea: e.target.checked })}
                      />
                      <span>With Open Play Area</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.bedroom ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.bedroom}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, bedroom: e.target.checked })}
                      />
                      <span>Bedroom</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.diningRoom ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.diningRoom}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, diningRoom: e.target.checked })}
                      />
                      <span>Dining Room</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.sala ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.sala}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, sala: e.target.checked })}
                      />
                      <span>Living Room (Sala)</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.kitchen ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.kitchen}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, kitchen: e.target.checked })}
                      />
                      <span>Kitchen</span>
                    </label>
                  </div>

                  {/* 3. Utilities & Connectivity */}
                  <div className="official-section-title">3. Utilities &amp; Connectivity</div>
                  <div className="official-grid-4">
                    <label className={`official-choice-item ${familyProfile.runningWater ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.runningWater}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, runningWater: e.target.checked })}
                      />
                      <span>Running Water</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.electricity ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.electricity}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, electricity: e.target.checked })}
                      />
                      <span>Electricity</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.internet ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.internet}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, internet: e.target.checked })}
                      />
                      <span>Internet Access</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.mobilePhone ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.mobilePhone}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, mobilePhone: e.target.checked })}
                      />
                      <span>Mobile Phone</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.television ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.television}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, television: e.target.checked })}
                      />
                      <span>Television</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.computer ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.computer}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, computer: e.target.checked })}
                      />
                      <span>Computer / Tablet</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.radio ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.radio}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, radio: e.target.checked })}
                      />
                      <span>Radio</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.aircon ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.aircon}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, aircon: e.target.checked })}
                      />
                      <span>Air Conditioning</span>
                    </label>
                  </div>

                  {/* 4. Learning & Recreation */}
                  <div className="official-section-title">4. Learning Materials &amp; Play Resources</div>
                  <div className="official-grid-4">
                    <label className={`official-choice-item ${familyProfile.books ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.books}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, books: e.target.checked })}
                      />
                      <span>Books</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.storyBooks ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.storyBooks}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, storyBooks: e.target.checked })}
                      />
                      <span>Story Books</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.toys ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.toys}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, toys: e.target.checked })}
                      />
                      <span>Educational Toys</span>
                    </label>
                    <label className={`official-choice-item ${familyProfile.boardGames ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={familyProfile.boardGames}
                        onChange={(e) => setFamilyProfile({ ...familyProfile, boardGames: e.target.checked })}
                      />
                      <span>Board Games / Puzzles</span>
                    </label>
                  </div>

                  {/* 5. Socio-Economic Profile */}
                  <div className="official-section-title">5. Socio-Economic Profile &amp; 4Ps Program</div>
                  <div className="official-grid-3">
                    <div>
                      <label className="input-label" style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>4Ps Beneficiary Membership</label>
                      <div className="official-choice-group">
                        <div
                          className={`official-choice-item ${familyProfile.is4Ps ? 'is-selected' : ''}`}
                          onClick={() => setFamilyProfile({ ...familyProfile, is4Ps: true })}
                        >
                          <CheckCircle2 size={13} />
                          <span>4Ps Beneficiary (Yes)</span>
                        </div>
                        <div
                          className={`official-choice-item ${!familyProfile.is4Ps ? 'is-selected' : ''}`}
                          onClick={() => setFamilyProfile({ ...familyProfile, is4Ps: false })}
                        >
                          <span>Non-4Ps (No)</span>
                        </div>
                      </div>
                    </div>

                    <Select
                      label="Monthly Family Income Class"
                      value={familyProfile.incomeClass}
                      onChange={(e) => setFamilyProfile({ ...familyProfile, incomeClass: e.target.value })}
                      options={[
                        { value: 'Below ₱10,000', label: 'Below ₱10,000 (Low Income)' },
                        { value: '₱10,000 - ₱20,000', label: '₱10,000 - ₱20,000 (Lower Middle)' },
                        { value: '₱20,000 - ₱40,000', label: '₱20,000 - ₱40,000 (Middle)' },
                        { value: 'Above ₱40,000', label: 'Above ₱40,000 (Upper Middle / High)' },
                      ]}
                    />

                    <Input
                      label="Immediate Members Living in House"
                      type="number"
                      value={familyProfile.immediateMembersCount}
                      onChange={(e) => setFamilyProfile({ ...familyProfile, immediateMembersCount: parseInt(e.target.value || 0, 10) })}
                    />
                  </div>
                </div>
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
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
              STEP 4: CHILDREN 0–4 COHORT REGISTRATION
              ------------------------------------------------------------- */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CardTitle subtitle="Step 4: Register all children aged 0–4 residing in this household">
                    Children Aged 0–4 Cohort Registration
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
                    + Register Child to {householdForm.parentGuardian || 'Household'}'s Roster
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <Input
                      label="First Name"
                      placeholder="e.g. Juan"
                      uppercase
                      value={currentChildInput.firstName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, firstName: e.target.value.toUpperCase() })}
                      required
                    />
                    <Input
                      label="Middle Name"
                      placeholder="e.g. Bautista"
                      uppercase
                      value={currentChildInput.middleName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, middleName: e.target.value.toUpperCase() })}
                    />
                    <Input
                      label="Last Name"
                      placeholder="e.g. Dela Cruz"
                      uppercase
                      value={currentChildInput.lastName}
                      onChange={(e) => setCurrentChildInput({ ...currentChildInput, lastName: e.target.value.toUpperCase() })}
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
                        { value: 'Not Enrolled', label: 'Not Enrolled (Mapped Queue)' },
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
                        Supporting Document / PSA Birth Certificate / Intake Form (AWS S3)
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
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button variant="ghost" size="md" onClick={handleSaveDraft}>
                  <Save size={16} />
                  Save Draft
                </Button>
                <Button variant="primary" size="md" onClick={handleNextStep}>
                  Next: Record Check & Review ({childrenList.length})
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          )}

          {/* -------------------------------------------------------------
              STEP 5: RECORD CHECK, REVIEW & SAVE
              ------------------------------------------------------------- */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                  <CardTitle subtitle="Step 5: Verify deduplication checks, Form 1 profiles, and household summary before commit">
                    Record Verification, Review & Save
                  </CardTitle>
                  <Button variant="secondary" size="sm" onClick={runDuplicateCheck} disabled={isSearchingMatch}>
                    Re-check Records
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Deduplication Record Cross-Reference */}
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Registry Deduplication Verification ({childrenList.length} Child/Children):
                    </span>

                    {isSearchingMatch ? (
                      <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-primary-900)' }}>
                          Checking central database for duplicate records...
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        {childrenList.map((child, index) => (
                          <div key={child.tempId} className="child-duplicate-check-box" style={{ padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
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
                                  Clean Record
                                </Badge>
                              )}
                            </div>

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
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${child.decision === 'same' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => {
                                      const updated = [...childrenList];
                                      updated[index].decision = 'same';
                                      setChildrenList(updated);
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                    “This is the same child” (Link ID: {child.matchedRecord.id})
                                  </button>

                                  <button
                                    type="button"
                                    className={`btn btn-sm ${child.decision === 'new' ? 'btn-primary' : 'btn-secondary'}`}
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
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-success-bg)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-primary)' }}>
                                  <strong>Clean Record:</strong> Unique ECCD Child ID will be generated upon save and added to Mapped queue.
                                </div>
                                <Badge variant="success">New Child Record</Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary 1: Household & Address */}
                  <div style={{ backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      2. Household &amp; Address Summary
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Household ID:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.id}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Barangay &amp; Purok:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.barangay}, {householdForm.purok}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Assigned Worker:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.workerName || 'CSWDO Worker'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Contact:</span>
                        <div style={{ fontWeight: '600' }}>{householdForm.contactNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary 2: Form 1.A & 1.B Parent Profiles */}
                  <div style={{ backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      3. Form 1.A &amp; 1.B Parent Profiles
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Mother's Profile:</span>
                        <div style={{ fontWeight: '600' }}>{motherProfile.firstName ? `${motherProfile.firstName} ${motherProfile.lastName}` : 'Not Specified'}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          Status: {motherProfile.civilStatus} • Edu: {motherProfile.educationalAttainment} • Occ: {motherProfile.occupationalStatus}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Father's Profile:</span>
                        <div style={{ fontWeight: '600' }}>{fatherProfile.firstName ? `${fatherProfile.firstName} ${fatherProfile.lastName}` : 'Not Specified'}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          Status: {fatherProfile.civilStatus} • Edu: {fatherProfile.educationalAttainment} • Occ: {fatherProfile.occupationalStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary 3: Form 1.C Housing & 4Ps Profile */}
                  <div style={{ backgroundColor: 'var(--bg-canvas)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      4. Form 1.C Housing &amp; 4Ps Profile
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Ownership &amp; Materials:</span>
                        <div style={{ fontWeight: '600' }}>{familyProfile.ownership} ({familyProfile.materials})</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>4Ps Beneficiary:</span>
                        <div style={{ fontWeight: '600', color: familyProfile.is4Ps ? '#16a34a' : 'var(--text-primary)' }}>
                          {familyProfile.is4Ps ? '✓ Enrolled in 4Ps' : 'Non-4Ps'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Income Class:</span>
                        <div style={{ fontWeight: '600' }}>{familyProfile.incomeClass}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Toilet &amp; Running Water:</span>
                        <div style={{ fontWeight: '600' }}>{familyProfile.withToilet ? '✓ Toilet' : 'No Toilet'} • {familyProfile.runningWater ? '✓ Water' : 'No Water'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>

              <div className="mobile-stepper-footer">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(4)}>
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
              STEP 6: MAPPING COMPLETION & OUTCOME
              ------------------------------------------------------------- */}
          {currentStep === 6 && completedSummary && (
            <Card style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)' }}>
                <CheckCircle2 size={32} />
              </div>

              <h2 className="text-h2" style={{ color: 'var(--color-success-primary)', marginBottom: 'var(--space-2)' }}>
                Household &amp; Form 1 Mapping Completed!
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-5)' }}>
                Household <strong>{completedSummary.household.id}</strong> in {completedSummary.household.barangay} and complete <strong>Official Form 1 (Home Profile)</strong> records have been recorded into the CSWDO ECCD master database and queued for central sync.
              </p>

              {/* Completion Outcome Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', maxWidth: '640px', margin: '0 auto var(--space-6)', textAlign: 'left' }}>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Form 1 Status</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-success-primary)' }}>100% Complete</div>
                </div>

                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Children Identified</span>
                  <div style={{ fontWeight: 'bold' }}>{completedSummary.children.length} Registered</div>
                </div>

                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Enrollment Queue</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-info-primary)' }}>Pushed to Queue</div>
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
            {dynamicAssignments.map((asn, idx) => (
              <div key={asn.workerId || idx} className="assignment-card">
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                    <Building2 size={13} />
                    <span>{asn.assignedCenter}</span>
                  </div>
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
                      setHouseholdForm((prev) => ({
                        ...prev,
                        barangay: asn.assignedBarangay,
                        workerId: asn.workerId,
                        workerName: asn.workerName,
                        activityId: asn.activityId || prev.activityId,
                      }));
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
                {workers.map((w) => {
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
                      {w.name} ({w.role || 'CDW'})
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
                  {workers.map((w) => {
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
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{w.role || w.assignedBarangay || 'Child Development Worker'}</div>
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
