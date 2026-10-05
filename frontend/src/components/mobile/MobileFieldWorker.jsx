/**
 * ECCD CARE — Mobile Field Worker Interface
 *
 * Mobile-First · Touch-First · Field Data Collection Tool
 *
 * User specifications:
 * 1. MY ASSIGNMENTS:
 *    - Today's mapping
 *    - Assigned barangay
 *    - Households completed
 *    - Children identified
 * 2. QUICK ACTIONS:
 *    - + New Household
 *    - + Add Child
 *    - Save Draft
 *    - Sync
 * 3. MOBILE MAPPING FLOW:
 *    Assignment → Household → Children → Existing Record Check → Review → Save → Next Household
 * 4. VISIBLE SYNC INDICATOR:
 *    - Online | Offline | Syncing | Pending Sync | Synced
 *    - Example: "8 records waiting to sync"
 * 5. Touch-friendly form controls (>=48px touch targets)
 * 6. Sticky bottom actions
 * 7. Convert tables to touch cards
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  Baby,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Layers,
  Search,
  Check,
  UserCheck,
  Phone,
  Calendar,
  ChevronRight,
  CheckCircle,
  FileCheck2,
  HelpCircle,
  Database,
  Trash2,
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { communityMappingService } from '../../services/communityMappingService';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { formatPHTTime } from '../../utils/phTime';

const AVAILABLE_BARANGAYS = SAN_FERNANDO_BARANGAYS;

export function MobileFieldWorker({ onNavigate }) {
  const { addToast } = useToast();

  // Active top-level subview: 'mapping-flow' | 'recent-cards'
  const [activeSubView, setActiveSubView] = useState('mapping-flow');

  // --- SYNC ENGINE STATE ---
  // Sync states: 'online' | 'offline' | 'syncing' | 'pending' | 'synced'
  const [syncState, setSyncState] = useState('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');

  // --- MY ASSIGNMENTS DATA ---
  const [assignmentData, setAssignmentData] = useState({
    title: '2026 Annual CSWDO House-to-House Child Mapping',
    barangay: 'San Isidro',
    purok: 'Purok 1, 2 & 3',
    completedHouseholds: 0,
    targetHouseholds: 35,
    childrenIdentified: 0,
    workerName: 'Rodel Mendoza',
    workerId: 'USR-FW-009',
  });

  // --- 7-STEP MOBILE MAPPING FLOW ---
  // 1: Assignment | 2: Household | 3: Children | 4: Existing Record Check | 5: Review | 6: Save | 7: Next Household
  const [flowStep, setFlowStep] = useState(1);

  // Step 1: Assignment details
  const [selectedActivity, setSelectedActivity] = useState('ACT-MAP-2026-001');
  const [selectedBarangay, setSelectedBarangay] = useState('San Isidro');
  const [selectedPurok, setSelectedPurok] = useState('Purok 1');

  // Step 2: Household details
  const [householdForm, setHouseholdForm] = useState({
    id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
    parentGuardian: '',
    contactNumber: '',
    address: '',
    is4Ps: 'No',
    isIP: 'No',
  });

  // Step 3: Children in this household
  const [childrenList, setChildrenList] = useState([]);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childForm, setChildForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    sex: 'Female',
    enrollmentStatus: 'Not Enrolled',
    enrollmentCenter: '',
  });

  // Step 4: Existing Record Check
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [matchedChildren, setMatchedChildren] = useState([]); // { childIndex, matchResult, decision: 'same' | 'new' }

  // Step 6 & 7: Save summary & completion
  const [savedHouseholdRecord, setSavedHouseholdRecord] = useState(null);

  // Recent completed households for touch cards view
  const [recentRecords, setRecentRecords] = useState([]);

  // Load existing draft if available
  useEffect(() => {
    const draft = communityMappingService.getDraft();
    if (draft && draft.householdForm) {
      setHouseholdForm(draft.householdForm);
      if (draft.childrenList && draft.childrenList.length > 0) {
        setChildrenList(draft.childrenList);
      }
      if (draft.flowStep) {
        setFlowStep(draft.flowStep);
      }
      addToast('Resumed active field draft from local storage', 'info');
    }
  }, []);

  // --- SYNC ACTIONS ---
  const handleTriggerSync = () => {
    if (syncState === 'offline') {
      addToast('Cannot sync while device is Offline. Turn on network.', 'error');
      return;
    }
    setSyncState('syncing');
    addToast(`Syncing ${pendingCount} field records to CSWDO central server...`, 'info');

    setTimeout(() => {
      setSyncState('synced');
      setPendingCount(0);
      const currentTime = formatPHTTime(new Date(), false);
      setLastSyncedTime(`${currentTime} Today`);
      addToast('All field records synced successfully!', 'success');
    }, 1800);
  };

  const handleToggleOffline = () => {
    if (syncState === 'offline') {
      setSyncState(pendingCount > 0 ? 'pending' : 'online');
      addToast('Connected to cellular network (Online)', 'success');
    } else {
      setSyncState('offline');
      addToast('Field Worker Offline Mode Active (Local queue enabled)', 'info');
    }
  };

  // --- QUICK ACTIONS ---
  const handleQuickNewHousehold = () => {
    setHouseholdForm({
      id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
      parentGuardian: '',
      contactNumber: '',
      address: '',
      is4Ps: 'No',
      isIP: 'No',
    });
    setChildrenList([]);
    setFlowStep(1);
    setActiveSubView('mapping-flow');
    addToast('Started new Household Mapping workflow', 'info');
  };

  const handleQuickAddChild = () => {
    if (flowStep < 2) {
      setFlowStep(2);
    }
    setIsAddingChild(true);
    setActiveSubView('mapping-flow');
  };

  const handleSaveDraft = () => {
    const draftPayload = {
      flowStep,
      selectedBarangay,
      selectedPurok,
      householdForm,
      childrenList,
      timestamp: formatPHTTime(new Date(), false),
    };
    communityMappingService.saveDraft(draftPayload);
    addToast('Draft saved securely to mobile device', 'success');
  };

  // --- CHILD FORM LOGIC ---
  const handleAddChildToRoster = (e) => {
    e?.preventDefault();
    if (!childForm.firstName || !childForm.lastName || !childForm.birthDate) {
      addToast('Please input Child Name and Date of Birth', 'error');
      return;
    }

    const birth = new Date(childForm.birthDate);
    const now = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const ageYears = Math.floor(ageMonths / 12);

    const newChild = {
      ...childForm,
      tempId: `TMP-${Date.now()}`,
      ageYears,
      ageMonths: ageMonths % 12,
      decision: 'new', // default
      matchedRecord: null,
    };

    setChildrenList([...childrenList, newChild]);
    setChildForm({
      firstName: '',
      middleName: '',
      lastName: '',
      birthDate: '',
      sex: 'Female',
      enrollmentStatus: 'Not Enrolled',
      enrollmentCenter: '',
    });
    setIsAddingChild(false);
    addToast('Child added to household roster', 'success');
  };

  const handleRemoveChild = (tempId) => {
    setChildrenList(childrenList.filter((c) => c.tempId !== tempId));
  };

  // --- STEP 4: EXISTING RECORD CHECK ---
  const runDuplicateCheck = async () => {
    setIsCheckingDuplicates(true);
    try {
      const results = [];
      for (const c of childrenList) {
        // Search duplicate in database
        const matches = await communityMappingService.searchChildren(
          `${c.firstName} ${c.lastName}`,
          c.birthDate
        );

        if (matches && matches.length > 0) {
          results.push({
            child: c,
            matchedRecord: matches[0],
            decision: 'same', // default suggestion is to link existing
          });
        } else {
          results.push({
            child: c,
            matchedRecord: null,
            decision: 'new',
          });
        }
      }
      setMatchedChildren(results);
    } catch (err) {
      console.error('Error during duplicate check:', err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // --- STEP TRANSITIONS ---
  const handleNext = async () => {
    if (flowStep === 1) {
      setFlowStep(2);
    } else if (flowStep === 2) {
      if (!householdForm.parentGuardian) {
        addToast('Please enter Parent/Guardian full name', 'error');
        return;
      }
      if (!householdForm.address) {
        addToast('Please enter house address / location landmark', 'error');
        return;
      }
      setFlowStep(3);
    } else if (flowStep === 3) {
      if (childrenList.length === 0) {
        addToast('Please add at least 1 child (aged 0–4) in this household', 'error');
        return;
      }
      setFlowStep(4);
      await runDuplicateCheck();
    } else if (flowStep === 4) {
      setFlowStep(5); // Review
    } else if (flowStep === 5) {
      // Save
      await handleSaveMappingRecord();
    } else if (flowStep === 7) {
      // Next Household
      handleNextHouseholdReset();
    }
  };

  const handleBack = () => {
    if (flowStep > 1 && flowStep < 7) {
      setFlowStep(flowStep - 1);
    }
  };

  // --- STEP 6: SAVE RECORD ---
  const handleSaveMappingRecord = async () => {
    setFlowStep(6);
    try {
      // 1. Create household record
      const fullAddress = `${householdForm.address}, ${selectedPurok}, ${selectedBarangay}`;
      const createdHh = await communityMappingService.createHousehold({
        id: householdForm.id,
        parentGuardian: householdForm.parentGuardian,
        contactNumber: householdForm.contactNumber,
        address: fullAddress,
        barangay: selectedBarangay,
        mappingActivityId: selectedActivity,
        childrenCount: childrenList.length,
        mappedBy: assignmentData.workerName,
        is4Ps: householdForm.is4Ps === 'Yes',
      });

      // 2. Register children without duplicating
      const savedChildren = [];
      for (const item of matchedChildren.length > 0 ? matchedChildren : childrenList.map((c) => ({ child: c, decision: 'new' }))) {
        const c = item.child;
        const regRes = await communityMappingService.registerChild({
          firstName: c.firstName,
          middleName: c.middleName,
          lastName: c.lastName,
          birthDate: c.birthDate,
          sex: c.sex,
          ageYears: c.ageYears,
          ageMonths: c.ageMonths,
          householdId: createdHh.id,
          parentGuardian: householdForm.parentGuardian,
          barangay: selectedBarangay,
          enrollmentStatus: c.enrollmentStatus,
          enrollmentCenter: c.enrollmentCenter,
          existingChildId: item.decision === 'same' && item.matchedRecord ? item.matchedRecord.id : null,
        });
        savedChildren.push(regRes.child);
      }

      // 3. Clear local draft
      communityMappingService.clearDraft();

      // 4. Update stats
      setAssignmentData((prev) => ({
        ...prev,
        completedHouseholds: prev.completedHouseholds + 1,
        childrenIdentified: prev.childrenIdentified + childrenList.length,
      }));

      // 5. Update pending sync count
      setPendingCount((prev) => prev + 1);
      if (syncState === 'synced') {
        setSyncState('pending');
      }

      // Add to recent records
      setRecentRecords([
        {
          id: createdHh.id,
          parentGuardian: householdForm.parentGuardian,
          address: fullAddress,
          childrenCount: savedChildren.length,
          childrenNames: savedChildren.map((c) => `${c.firstName} (${c.ageYears}y)`).join(', '),
          is4Ps: householdForm.is4Ps === 'Yes',
          syncStatus: syncState === 'offline' ? 'Waiting to sync' : 'Pending Sync',
          time: formatPHTTime(new Date(), false),
        },
        ...recentRecords,
      ]);

      setSavedHouseholdRecord({
        household: createdHh,
        children: savedChildren,
        time: formatPHTTime(new Date(), true),
      });

      // Move to step 7: Next Household prompt
      setFlowStep(7);
      addToast('Household record saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save mapping record:', err);
      addToast('Error saving record. Preserved in local draft.', 'error');
      setFlowStep(5);
    }
  };

  // --- STEP 7: NEXT HOUSEHOLD RESET ---
  const handleNextHouseholdReset = () => {
    setHouseholdForm({
      id: `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
      parentGuardian: '',
      contactNumber: '',
      address: '',
      is4Ps: 'No',
      isIP: 'No',
    });
    setChildrenList([]);
    setMatchedChildren([]);
    setSavedHouseholdRecord(null);
    setFlowStep(2); // Directly jump to Household step to keep fast field momentum!
    addToast('Ready for Next Household. Barangay preserved.', 'info');
  };

  return (
    <div className="mobile-field-root">
      {/* 1. VISIBLE SYNC INDICATOR BANNER */}
      <div className={`field-sync-banner ${syncState}`}>
        <div className="sync-state-content">
          <div className="sync-pulse-dot" />
          <div>
            {syncState === 'online' && (
              <span>
                <strong>Online</strong> — Connected to CSWDO Server
              </span>
            )}
            {syncState === 'offline' && (
              <span>
                <strong>Offline</strong> — Saving to Local Device Queue
              </span>
            )}
            {syncState === 'syncing' && (
              <span>
                <strong>Syncing...</strong> Uploading field records
              </span>
            )}
            {syncState === 'pending' && (
              <span>
                <strong>Pending Sync</strong> — {pendingCount} records waiting to sync
              </span>
            )}
            {syncState === 'synced' && (
              <span>
                <strong>Synced</strong> — All records updated ({lastSyncedTime})
              </span>
            )}
          </div>
        </div>

        <div className="sync-actions-group">
          <button
            type="button"
            className="sync-interactive-chip"
            onClick={handleToggleOffline}
            title="Toggle Offline Simulation"
          >
            {syncState === 'offline' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{syncState === 'offline' ? 'Go Online' : 'Go Offline'}</span>
          </button>

          {(syncState === 'pending' || syncState === 'offline') && (
            <button
              type="button"
              className="sync-interactive-chip"
              onClick={handleTriggerSync}
              disabled={syncState === 'offline' || syncState === 'syncing'}
              title="Sync pending records"
            >
              <RefreshCw size={14} className={syncState === 'syncing' ? 'spin' : ''} />
              <span>Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-VIEW SELECTOR: FIELD WORKFLOW vs TOUCH CARDS */}
      <div className="field-mode-toggle-bar">
        <div className="field-mode-label">
          <Sparkles size={16} color="#ba1607" />
          <span>Mobile Field Tool</span>
        </div>

        <div className="field-segmented-toggle">
          <button
            type="button"
            className={`field-segment-btn ${activeSubView === 'mapping-flow' ? 'is-active' : ''}`}
            onClick={() => setActiveSubView('mapping-flow')}
          >
            <MapPin size={14} />
            <span>Mapping Flow</span>
          </button>
          <button
            type="button"
            className={`field-segment-btn ${activeSubView === 'recent-cards' ? 'is-active' : ''}`}
            onClick={() => setActiveSubView('recent-cards')}
          >
            <Database size={14} />
            <span>Field Records ({recentRecords.length})</span>
          </button>
        </div>
      </div>

      {/* 3. MY ASSIGNMENTS CARD */}
      <div className="my-assignments-card">
        <div className="assignment-card-header">
          <div>
            <span className="assignment-badge">Active Assignment</span>
            <h2 className="assignment-title" style={{ marginTop: '0.35rem' }}>
              {assignmentData.title}
            </h2>
            <div className="assignment-barangay">
              <MapPin size={14} />
              <span>
                <strong>{assignmentData.barangay}</strong> ({assignmentData.purok})
              </span>
            </div>
          </div>
        </div>

        <div className="assignment-stats-row">
          <div className="assignment-stat-item">
            <span className="assignment-stat-label">Households Completed</span>
            <span className="assignment-stat-val">
              {assignmentData.completedHouseholds}{' '}
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>/ {assignmentData.targetHouseholds}</span>
            </span>
            <div className="assignment-progress-bar">
              <div
                className="assignment-progress-fill"
                style={{
                  width: `${Math.min(100, Math.round((assignmentData.completedHouseholds / assignmentData.targetHouseholds) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="assignment-stat-item">
            <span className="assignment-stat-label">Children Identified</span>
            <span className="assignment-stat-val" style={{ color: '#7e191b' }}>
              {assignmentData.childrenIdentified}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ages 0–4 years</span>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS GRID */}
      <div className="quick-actions-grid">
        <button
          type="button"
          className="quick-action-btn primary"
          onClick={handleQuickNewHousehold}
        >
          <Plus size={20} />
          <span>+ New Household</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleQuickAddChild}
        >
          <Baby size={20} color="#ba1607" />
          <span>+ Add Child</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleSaveDraft}
        >
          <Save size={20} color="#475569" />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          className="quick-action-btn"
          onClick={handleTriggerSync}
          disabled={syncState === 'syncing' || syncState === 'offline'}
        >
          <RefreshCw size={20} color="#059669" className={syncState === 'syncing' ? 'spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* 5. VIEW CONTENT BASED ON SUB-VIEW */}
      {activeSubView === 'mapping-flow' ? (
        <>
          {/* STEPPER TRACKER */}
          <div className="mobile-stepper-tracker">
            {[
              { num: 1, label: 'Assignment' },
              { num: 2, label: 'Household' },
              { num: 3, label: 'Children' },
              { num: 4, label: 'Check' },
              { num: 5, label: 'Review' },
              { num: 6, label: 'Save' },
              { num: 7, label: 'Next' },
            ].map((step) => {
              const isActive = flowStep === step.num;
              const isComplete = flowStep > step.num;
              return (
                <div
                  key={step.num}
                  className={`mobile-step-pill ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
                >
                  <span className="mobile-step-num">{isComplete ? '✓' : step.num}</span>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: ASSIGNMENT */}
          {flowStep === 1 && (
            <div className="mobile-form-card">
              <h3 className="mobile-form-title">
                <MapPin size={20} color="#7e191b" />
                Step 1: Mapping Assignment
              </h3>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Assigned Barangay</label>
                <select
                  className="mobile-touch-select"
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                >
                  {AVAILABLE_BARANGAYS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Purok / Sitio</label>
                <select
                  className="mobile-touch-select"
                  value={selectedPurok}
                  onChange={(e) => setSelectedPurok(e.target.value)}
                >
                  <option value="Purok 1">Purok 1</option>
                  <option value="Purok 2">Purok 2</option>
                  <option value="Purok 3">Purok 3</option>
                  <option value="Purok 4">Purok 4</option>
                  <option value="Purok 5">Purok 5</option>
                  <option value="Sitio Riverside">Sitio Riverside</option>
                </select>
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Enumerator / Field Worker</label>
                <input
                  type="text"
                  className="mobile-touch-input"
                  value={`${assignmentData.workerName} (${assignmentData.workerId})`}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Mapping Activity</label>
                <input
                  type="text"
                  className="mobile-touch-input"
                  value={assignmentData.title}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: HOUSEHOLD */}
          {flowStep === 2 && (
            <div className="mobile-form-card">
              <h3 className="mobile-form-title">
                <Home size={20} color="#7e191b" />
                Step 2: Household Profile
              </h3>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Household Tracking ID</label>
                <input
                  type="text"
                  className="mobile-touch-input"
                  value={householdForm.id}
                  disabled
                  style={{ background: '#f8fafc', fontWeight: 700 }}
                />
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">
                  Parent / Guardian Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="mobile-touch-input"
                  placeholder="e.g., Maria Dela Cruz"
                  value={householdForm.parentGuardian}
                  onChange={(e) => setHouseholdForm({ ...householdForm, parentGuardian: e.target.value })}
                />
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">Contact / Mobile Number</label>
                <input
                  type="tel"
                  className="mobile-touch-input"
                  placeholder="e.g., 0917-123-4567"
                  value={householdForm.contactNumber}
                  onChange={(e) => setHouseholdForm({ ...householdForm, contactNumber: e.target.value })}
                />
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">
                  House # / Street / Landmark <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="mobile-touch-input"
                  placeholder="e.g., House 124, Near Barangay Chapel"
                  value={householdForm.address}
                  onChange={(e) => setHouseholdForm({ ...householdForm, address: e.target.value })}
                />
              </div>

              <div className="mobile-input-group">
                <label className="mobile-input-label">4Ps Beneficiary Household?</label>
                <div className="touch-segmented">
                  <button
                    type="button"
                    className={`touch-segment-option ${householdForm.is4Ps === 'Yes' ? 'selected' : ''}`}
                    onClick={() => setHouseholdForm({ ...householdForm, is4Ps: 'Yes' })}
                  >
                    Yes (4Ps Tagged)
                  </button>
                  <button
                    type="button"
                    className={`touch-segment-option ${householdForm.is4Ps === 'No' ? 'selected' : ''}`}
                    onClick={() => setHouseholdForm({ ...householdForm, is4Ps: 'No' })}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CHILDREN */}
          {flowStep === 3 && (
            <div className="mobile-form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="mobile-form-title">
                  <Baby size={20} color="#7e191b" />
                  Step 3: Children (Ages 0–4)
                </h3>
                <span className="assignment-badge">{childrenList.length} Added</span>
              </div>

              {/* Roster of added children */}
              {childrenList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {childrenList.map((c, idx) => (
                    <div key={c.tempId || idx} className="child-card-touch">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="child-card-avatar">{c.firstName ? c.firstName[0] : 'C'}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1e1112' }}>
                            {c.firstName} {c.middleName} {c.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {c.sex} • {c.ageYears}y {c.ageMonths}m • {c.enrollmentStatus}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveChild(c.tempId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          minHeight: '44px',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '1.25rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    border: '1.5px dashed #cbd5e1',
                  }}
                >
                  No children added yet. Tap <strong>+ Add Child to Household</strong> below.
                </div>
              )}

              {/* Add Child Form or Button */}
              {!isAddingChild ? (
                <button
                  type="button"
                  className="quick-action-btn primary"
                  style={{ width: '100%', minHeight: '52px', marginTop: '0.5rem' }}
                  onClick={() => setIsAddingChild(true)}
                >
                  <Plus size={20} />
                  <span>+ Add Child to Household</span>
                </button>
              ) : (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #ba1607',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#7e191b' }}>
                    New Child Information
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">First Name *</label>
                    <input
                      type="text"
                      className="mobile-touch-input"
                      placeholder="e.g., Juan"
                      value={childForm.firstName}
                      onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                    />
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">Middle Name</label>
                    <input
                      type="text"
                      className="mobile-touch-input"
                      placeholder="e.g., Santos"
                      value={childForm.middleName}
                      onChange={(e) => setChildForm({ ...childForm, middleName: e.target.value })}
                    />
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">Last Name *</label>
                    <input
                      type="text"
                      className="mobile-touch-input"
                      placeholder="e.g., Dela Cruz"
                      value={childForm.lastName}
                      onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                    />
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="mobile-touch-input"
                      value={childForm.birthDate}
                      onChange={(e) => setChildForm({ ...childForm, birthDate: e.target.value })}
                    />
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">Sex</label>
                    <div className="touch-segmented">
                      <button
                        type="button"
                        className={`touch-segment-option ${childForm.sex === 'Female' ? 'selected' : ''}`}
                        onClick={() => setChildForm({ ...childForm, sex: 'Female' })}
                      >
                        Female
                      </button>
                      <button
                        type="button"
                        className={`touch-segment-option ${childForm.sex === 'Male' ? 'selected' : ''}`}
                        onClick={() => setChildForm({ ...childForm, sex: 'Male' })}
                      >
                        Male
                      </button>
                    </div>
                  </div>

                  <div className="mobile-input-group">
                    <label className="mobile-input-label">Day Care / CDC Enrollment</label>
                    <select
                      className="mobile-touch-select"
                      value={childForm.enrollmentStatus}
                      onChange={(e) => setChildForm({ ...childForm, enrollmentStatus: e.target.value })}
                    >
                      <option value="Not Enrolled">Not Enrolled</option>
                      <option value="Enrolled">Enrolled in Day Care</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="mobile-bottom-btn secondary"
                      onClick={() => setIsAddingChild(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mobile-bottom-btn primary"
                      onClick={handleAddChildToRoster}
                    >
                      Save Child to Roster
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: EXISTING RECORD CHECK */}
          {flowStep === 4 && (
            <div className="mobile-form-card">
              <h3 className="mobile-form-title">
                <Search size={20} color="#7e191b" />
                Step 4: Existing Record Check
              </h3>

              {isCheckingDuplicates ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <RefreshCw size={24} className="spin" color="#ba1607" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    Checking Central ECCD Registry...
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {matchedChildren.map((item, idx) => {
                    const hasMatch = !!item.matchedRecord;
                    return (
                      <div
                        key={idx}
                        className={`match-check-card ${hasMatch ? 'has-match' : 'no-match'}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {hasMatch ? (
                            <AlertTriangle size={20} color="#d97706" />
                          ) : (
                            <CheckCircle2 size={20} color="#059669" />
                          )}
                          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1e1112' }}>
                            {item.child.firstName} {item.child.lastName}
                          </div>
                        </div>

                        {hasMatch ? (
                          <>
                            <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                              Potential matching child found in database:
                              <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                                ECCD Child ID: {item.matchedRecord.id} ({item.matchedRecord.fullName})
                              </div>
                              <div>Barangay: {item.matchedRecord.barangay}</div>
                            </div>

                            <div className="match-decision-picker">
                              <button
                                type="button"
                                className={`match-decision-btn ${item.decision === 'same' ? 'active' : ''}`}
                                onClick={() => {
                                  const updated = [...matchedChildren];
                                  updated[idx].decision = 'same';
                                  setMatchedChildren(updated);
                                }}
                              >
                                <Check size={16} />
                                <div>
                                  <strong>Link to Existing Child Record</strong>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Keep existing ECCD Child ID. No duplicate created.
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                className={`match-decision-btn ${item.decision === 'new' ? 'active' : ''}`}
                                onClick={() => {
                                  const updated = [...matchedChildren];
                                  updated[idx].decision = 'new';
                                  setMatchedChildren(updated);
                                }}
                              >
                                <Plus size={16} />
                                <div>
                                  <strong>Create As New Child</strong>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Different child with same or similar name.
                                  </div>
                                </div>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.8125rem', color: '#059669' }}>
                            ✓ No duplicate found. Clean registration will generate a unique ECCD Child ID.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {flowStep === 5 && (
            <div className="mobile-form-card">
              <h3 className="mobile-form-title">
                <FileCheck2 size={20} color="#7e191b" />
                Step 5: Review Before Saving
              </h3>

              <div className="mobile-review-section">
                <div className="mobile-review-row">
                  <span className="mobile-review-label">Barangay:</span>
                  <span className="mobile-review-value">
                    {selectedBarangay} ({selectedPurok})
                  </span>
                </div>
                <div className="mobile-review-row">
                  <span className="mobile-review-label">Household ID:</span>
                  <span className="mobile-review-value">{householdForm.id}</span>
                </div>
                <div className="mobile-review-row">
                  <span className="mobile-review-label">Parent / Guardian:</span>
                  <span className="mobile-review-value">{householdForm.parentGuardian}</span>
                </div>
                <div className="mobile-review-row">
                  <span className="mobile-review-label">Address:</span>
                  <span className="mobile-review-value">{householdForm.address}</span>
                </div>
                <div className="mobile-review-row">
                  <span className="mobile-review-label">4Ps Tagged:</span>
                  <span className="mobile-review-value">{householdForm.is4Ps}</span>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#7e191b', marginTop: '0.5rem' }}>
                Children to be Saved ({childrenList.length}):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {childrenList.map((c, i) => (
                  <div key={i} className="child-card-touch">
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1e1112' }}>
                        {c.firstName} {c.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {c.sex} • {c.ageYears} yrs • {c.enrollmentStatus}
                      </div>
                    </div>
                    <span className="assignment-badge">Validated</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: SAVING INDICATOR */}
          {flowStep === 6 && (
            <div className="mobile-form-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <RefreshCw size={36} className="spin" color="#ba1607" style={{ margin: '0 auto' }} />
              <h3 style={{ marginTop: '1rem', color: '#7e191b' }}>Saving Field Record...</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Storing household & children in local storage queue.
              </p>
            </div>
          )}

          {/* STEP 7: SAVE COMPLETE & NEXT HOUSEHOLD */}
          {flowStep === 7 && savedHouseholdRecord && (
            <div className="completion-hero-card">
              <div className="completion-icon-ring">✓</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e191b', margin: 0 }}>
                Household Record Saved!
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                {savedHouseholdRecord.household.id} — {savedHouseholdRecord.household.parentGuardian}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748b' }}>Children Registered:</span>
                  <strong>{savedHouseholdRecord.children.length} Children</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748b' }}>Barangay:</span>
                  <strong>{selectedBarangay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748b' }}>Sync Status:</span>
                  <span style={{ color: '#ea580c', fontWeight: 700 }}>Waiting in queue</span>
                </div>
              </div>

              <button
                type="button"
                className="mobile-bottom-btn primary"
                style={{ width: '100%', minHeight: '52px', marginTop: '0.5rem' }}
                onClick={handleNextHouseholdReset}
              >
                <span>Next Household →</span>
              </button>
            </div>
          )}

          {/* STICKY BOTTOM ACTIONS BAR */}
          {flowStep < 7 && (
            <div className="mobile-sticky-bottom-bar">
              {flowStep > 1 && (
                <button
                  type="button"
                  className="mobile-bottom-btn secondary"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                className="mobile-bottom-btn secondary"
                onClick={handleSaveDraft}
                title="Save work in progress"
              >
                <Save size={16} />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                className={`mobile-bottom-btn ${flowStep === 5 ? 'success' : 'primary'}`}
                onClick={handleNext}
              >
                {flowStep === 5 ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Save Record</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* RECENT FIELD RECORDS (CARDS VIEW - AVOIDS DENSE TABLES) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#7e191b', margin: 0 }}>
              Recent Mapped Households ({recentRecords.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Touch cards</span>
          </div>

          <div className="touch-records-list">
            {recentRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <Home size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, color: '#334155' }}>No mapped households yet</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Start your field mapping assignment to record households.</div>
              </div>
            ) : (
              recentRecords.map((rec) => (
              <div key={rec.id} className="touch-record-card">
                <div className="touch-record-header">
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ba1607' }}>
                      {rec.id}
                    </span>
                    <div className="touch-record-title">{rec.parentGuardian}</div>
                  </div>
                  <span
                    className={`assignment-badge ${rec.syncStatus === 'Synced' ? 'is-complete' : ''}`}
                    style={{
                      background: rec.syncStatus === 'Synced' ? '#dcfce7' : '#ffedd5',
                      color: rec.syncStatus === 'Synced' ? '#15803d' : '#c2410c',
                    }}
                  >
                    {rec.syncStatus}
                  </span>
                </div>

                <div className="touch-record-meta">
                  <MapPin size={12} />
                  <span>{rec.address}</span>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#334155' }}>
                  <strong>Children ({rec.childrenCount}):</strong> {rec.childrenNames}
                </div>

                <div className="touch-record-footer">
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {rec.time} • {rec.is4Ps ? '4Ps Tagged' : 'Non-4Ps'}
                  </div>
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#ba1607',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      addToast(`Viewing details for ${rec.id}`, 'info');
                    }}
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )))}
          </div>

          <button
            type="button"
            className="mobile-bottom-btn primary"
            style={{ width: '100%', minHeight: '50px', marginTop: '1rem' }}
            onClick={() => {
              setActiveSubView('mapping-flow');
              setFlowStep(1);
            }}
          >
            <Plus size={18} />
            <span>Map Another Household</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MobileFieldWorker;
