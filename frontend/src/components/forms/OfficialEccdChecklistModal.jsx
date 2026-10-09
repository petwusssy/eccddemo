import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Printer,
  X,
  Baby,
  Calendar,
  User,
  Building2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Minus,
  BookOpen,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { centralDataStore } from '../../services/centralDataStore';
import { officialChecklistService } from '../../services/officialChecklistService';
import { CHECKLIST_RECORD_1, CHECKLIST_RECORD_2 } from '../../data/officialChecklistData';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialEccdChecklistModal({
  isOpen,
  onClose,
  childId = '',
  initialRecordType = null,
  onSuccess,
}) {
  const { addToast } = useToast();

  // Child data from Central Store
  const [child, setChild] = useState(null);

  // Active Wizard Step: 'profile' | 'guidelines' | 'assessment' | 'review'
  const [currentStep, setCurrentStep] = useState('assessment');

  // Selected Record: 'record1' (0-3.0 yrs) | 'record2' (3.1-5.11 yrs)
  const [recordTypeKey, setRecordTypeKey] = useState(
    initialRecordType === 'record1' || initialRecordType === "Child's Record 1" ? 'record1' : 'record2'
  );

  // Domain Tab in Assessment: 'gross-motor' | 'fine-motor' | 'self-help' | 'receptive-language' | 'expressive-language' | 'cognitive' | 'social-emotional' | 'qualitative'
  const [activeDomainId, setActiveDomainId] = useState('gross-motor');

  // Responses state: { [itemId]: { present: boolean, comment: string } }
  const [answers, setAnswers] = useState({});

  // Qualitative notes: { background, familyEnv, stimulatingActivities, homeEnv, others }
  const [qualitativeNotes, setQualitativeNotes] = useState({
    background: '',
    familyEnv: '',
    stimulatingActivities: '',
    homeEnv: '',
    others: '',
  });

  // Session metadata
  const [sessionMeta, setSessionMeta] = useState({
    assessmentCycle: 'Cycle 1 (Baseline - SY 2026–2027)',
    assessmentDate: getPhilippinesDate(),
    evaluator: 'Maria Santos, CDW I',
    placeAdministered: 'San Isidro Child Development Center I',
    handedness: 'right', // 'right' | 'left' | 'both' | 'not yet established'
    isStudying: 'Yes', // 'Yes' | 'No'
    schoolName: 'San Isidro Child Development Center I',
  });

  // Follow-up flag
  const [flagFollowUp, setFlagFollowUp] = useState(false);
  const [followUpPriority, setFollowUpPriority] = useState('High');
  const [followUpReason, setFollowUpReason] = useState('Developmental progress monitoring recommended after assessment.');

  const [saving, setSaving] = useState(false);

  // Load child and pick record
  useEffect(() => {
    if (isOpen && childId) {
      const c = centralDataStore.getChildById(childId);
      if (c) {
        setChild(c);
        if (initialRecordType) {
          const isRec1 = initialRecordType === 'record1' || initialRecordType === "Child's Record 1";
          setRecordTypeKey(isRec1 ? 'record1' : 'record2');
        } else {
          const appropriate = officialChecklistService.getAppropriateRecord(c, sessionMeta.assessmentDate);
          const isRec1 = appropriate.recordType === "Child's Record 1";
          setRecordTypeKey(isRec1 ? 'record1' : 'record2');
        }

        setSessionMeta((prev) => ({
          ...prev,
          placeAdministered: c.dayCareCenter || `${c.barangay} Child Development Center`,
          schoolName: c.dayCareCenter || 'Barangay Child Development Center',
        }));
      }
    }
  }, [isOpen, childId, initialRecordType]);

  // Current active record definition
  const currentRecord = useMemo(() => {
    return recordTypeKey === 'record1' ? CHECKLIST_RECORD_1 : CHECKLIST_RECORD_2;
  }, [recordTypeKey]);

  // Tally raw scores per domain
  const domainRawScores = useMemo(() => {
    const scores = {};
    currentRecord.domains.forEach((dom) => {
      let count = 0;
      dom.sections.forEach((sec) => {
        sec.items.forEach((item) => {
          if (answers[item.id]?.present) {
            count++;
          }
        });
      });
      scores[dom.name] = count;
    });
    return scores;
  }, [currentRecord, answers]);

  // Total raw score (sum of all checks)
  const totalRawScore = useMemo(() => {
    return Object.values(domainRawScores).reduce((a, b) => a + b, 0);
  }, [domainRawScores]);

  // Calculate official ECCD scores & standard conversion from manual
  const scoringSummary = useMemo(() => {
    return officialChecklistService.calculateScores({
      domainRawScores,
      recordType: currentRecord.recordType,
      child,
    });
  }, [domainRawScores, currentRecord.recordType, child]);

  // Auto-flag Urgent Follow-up if delay detected based on ECCD Council standards
  useEffect(() => {
    if (scoringSummary.isDelayed) {
      setFlagFollowUp(true);
      setFollowUpPriority('Urgent');
      setFollowUpReason(scoringSummary.delayReason);
    }
  }, [scoringSummary.isDelayed, scoringSummary.delayReason]);

  // Handle toggling present / not present
  const handleItemToggle = (itemId, isPresent) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        present: isPresent,
      },
    }));
  };

  // Handle item comment change
  const handleCommentChange = (itemId, comment) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment,
      },
    }));
  };

  // Save and Complete
  const handleSaveAssessment = async () => {
    setSaving(true);
    try {
      await officialChecklistService.saveChecklistAssessment({
        childId: child?.id || childId,
        recordType: currentRecord.recordType,
        evaluator: sessionMeta.evaluator,
        assessmentDate: sessionMeta.assessmentDate,
        placeAdministered: sessionMeta.placeAdministered,
        answers,
        domainRawScores,
        totalRawScore,
        qualitativeNotes,
        assessmentCycle: sessionMeta.assessmentCycle,
        requiresFollowUp: flagFollowUp,
        followUpReason: followUpReason,
        followUpPriority: followUpPriority,
      });

      addToast(
        `Official ECCD Checklist (${currentRecord.recordType}) saved successfully! Child 360° Profile and timeline updated.`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save ECCD checklist assessment:', err);
      addToast('Error saving checklist assessment.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="official-form-modal"
    >
      <div style={{ padding: '0.25rem' }}>
        {/* =========================================================================
            HEADER: OFFICIAL ECCD CHECKLIST IDENTIFICATION
            ========================================================================= */}
        <div className="official-form-header" style={{ borderBottom: '2px solid #7e191b', paddingBottom: '12px', marginBottom: '14px', paddingRight: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ba1607' }}>
                Early Childhood Care and Development Council • DepEd • DSWD • DOH • UNICEF
              </div>
              <h1 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: 900, color: '#1e1112' }}>
                Early Childhood Care and Development (ECCD) Checklist
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <Badge variant="primary" size="sm">
                  {currentRecord.recordType}
                </Badge>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  Target: <strong>{currentRecord.ageRange}</strong>
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                  ✓ Centralized Child Data Auto-Linked
                </span>
              </div>
            </div>

            {/* Record Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <button
                type="button"
                onClick={() => setRecordTypeKey('record1')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: recordTypeKey === 'record1' ? '#7e191b' : 'transparent',
                  color: recordTypeKey === 'record1' ? '#fff' : '#334155',
                }}
              >
                Child's Record 1 (0–3.0 yrs)
              </button>
              <button
                type="button"
                onClick={() => setRecordTypeKey('record2')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: recordTypeKey === 'record2' ? '#7e191b' : 'transparent',
                  color: recordTypeKey === 'record2' ? '#fff' : '#334155',
                }}
              >
                Child's Record 2 (3.1–5.11 yrs)
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            WIZARD STEP NAVIGATION
            ========================================================================= */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'profile', label: '1. Child Profile & Demographics' },
            { id: 'guidelines', label: '2. Administering Scripts & Rules' },
            { id: 'assessment', label: '3. Fillable Checklist (7 Domains)' },
            { id: 'review', label: '4. Review & Complete Assessment' },
          ].map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #7e191b' : '1px solid #cbd5e1',
                  background: isActive ? '#7e191b' : '#f8fafc',
                  color: isActive ? '#fff' : '#334155',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {step.label}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            STEP 1: CHILD PROFILE & DEMOGRAPHICS (Reused from System)
            ========================================================================= */}
        {currentStep === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '10px' }}>
                Page 1: Sociodemographic Profile (ECCD Checklist)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Child's Name:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{child?.fullName || 'Juan Bautista Dela Cruz'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Sex:</span>
                  <div style={{ fontWeight: 600 }}>{child?.sex || 'Male'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Date of Birth:</span>
                  <div style={{ fontWeight: 600 }}>{child?.birthDate || '2023-04-12'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>ECCD Child ID:</span>
                  <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{child?.id || childId}</code></div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Address:</span>
                  <div style={{ fontWeight: 500 }}>{child?.address || 'Purok 2, San Isidro, City of San Fernando, Pampanga, Region III'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Barangay / City:</span>
                  <div style={{ fontWeight: 600 }}>{child?.barangay || 'San Isidro'} • City of San Fernando</div>
                </div>
              </div>
            </div>

            {/* Handedness & Study Profile */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>
                Child's Handedness & Schooling Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Select
                  label="Child's Handedness (Check appropriate Box)"
                  value={sessionMeta.handedness}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, handedness: e.target.value })}
                  options={[
                    { value: 'right', label: 'Right Handed' },
                    { value: 'left', label: 'Left Handed' },
                    { value: 'both', label: 'Both / Ambidextrous' },
                    { value: 'not yet established', label: 'Not Yet Established' },
                  ]}
                />
                <Select
                  label="Is the child presently studying?"
                  value={sessionMeta.isStudying}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, isStudying: e.target.value })}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                />
              </div>

              {sessionMeta.isStudying === 'Yes' && (
                <div style={{ marginTop: '10px' }}>
                  <Input
                    label="Name of child's school / learning center / day care"
                    value={sessionMeta.schoolName}
                    onChange={(e) => setSessionMeta({ ...sessionMeta, schoolName: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Parents & Siblings Profile */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>
                Parents & Family Background (Reused from Household & Form 1)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: 700, color: '#7e191b', marginBottom: '4px' }}>Father's Information</div>
                  <div><strong>Name:</strong> {child?.fatherName || 'Roberto M. Dela Cruz'}</div>
                  <div><strong>Age:</strong> 34</div>
                  <div><strong>Occupation:</strong> Electrician / Construction</div>
                  <div><strong>Education:</strong> High School Graduate</div>
                </div>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: 700, color: '#7e191b', marginBottom: '4px' }}>Mother's Information</div>
                  <div><strong>Name:</strong> {child?.motherName || 'Elena S. Dela Cruz'}</div>
                  <div><strong>Age:</strong> 31</div>
                  <div><strong>Occupation:</strong> Homemaker</div>
                  <div><strong>Education:</strong> College Undergraduate</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep('guidelines')}>
                <BookOpen size={14} /> Protocols & Rules
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCurrentStep('assessment')}>
                Start Assessment <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: GUIDELINES & SCRIPTS (CONCISE PROTOCOL BLOCKS)
            ========================================================================= */}
        {currentStep === 'guidelines' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#fdf8f8', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 800, color: '#7e191b', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} /> Caregiver Briefing Protocol
                </div>
                <div style={{ fontSize: '12px', color: '#4a1517', lineHeight: 1.5 }}>
                  Clarify to parent/guardian that this is a developmental screening tool, not a pass/fail exam. Emphasize that questions span ages up to 6, and asking parents not to coach the child.
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Baby size={15} /> Child Rapport & Engagement
                </div>
                <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: 1.5 }}>
                  Establish warm, comfortable rapport. Introduce activities as play-based tasks. Reassure the child that attempting tasks is what matters, maintaining a relaxed assessment atmosphere.
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={15} /> Scoring Standards & Notation
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', color: '#334155' }}>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px' }}>
                  <strong style={{ color: '#16a34a' }}>✓ Present:</strong> Child readily demonstrates the skill during observation or assessment.
                </div>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px' }}>
                  <strong style={{ color: '#dc2626' }}>– Not Present:</strong> Child cannot demonstrate skill. Enter reason/observation in notes.
                </div>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px' }}>
                  <strong style={{ color: '#ba1607' }}>Parental Report:</strong> Accept caregiver confirmation for items tagged with this allowance.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep('profile')}>
                <ChevronLeft size={14} /> Back to Profile
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCurrentStep('assessment')}>
                Proceed to Checklist <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: FILLABLE DIGITAL ASSESSMENT (7 DOMAINS + OBSERVATIONS)
            ========================================================================= */}
        {currentStep === 'assessment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Domain Tabs Bar */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '2px solid #e2e8f0' }}>
              {currentRecord.domains.map((dom) => {
                const isActive = activeDomainId === dom.id;
                const score = domainRawScores[dom.name] || 0;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => setActiveDomainId(dom.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: isActive ? '#7e191b' : '#f1f5f9',
                      color: isActive ? '#fff' : '#334155',
                    }}
                  >
                    <span>{dom.name.replace(' Domain', '')}</span>
                    <span
                      style={{
                        background: isActive ? '#ba1607' : '#cbd5e1',
                        color: isActive ? '#fff' : '#0f172a',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontSize: '10px',
                      }}
                    >
                      {score}
                    </span>
                  </button>
                );
              })}

              {/* Qualitative Observations Tab */}
              <button
                type="button"
                onClick={() => setActiveDomainId('qualitative')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: activeDomainId === 'qualitative' ? '#7e191b' : '#f1f5f9',
                  color: activeDomainId === 'qualitative' ? '#fff' : '#334155',
                }}
              >
                <span>Qualitative Notes</span>
              </button>
            </div>

            {/* DOMAIN CHECKLIST ITEMS */}
            {activeDomainId !== 'qualitative' && (
              <div>
                {currentRecord.domains
                  .filter((d) => d.id === activeDomainId)
                  .map((dom) => (
                    <div key={dom.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{dom.name}</h3>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{dom.description}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Domain Raw Score: </span>
                          <strong style={{ fontSize: '16px', color: '#7e191b' }}>{domainRawScores[dom.name] || 0}</strong>
                        </div>
                      </div>

                      {dom.sections.map((sec, secIdx) => (
                        <div key={secIdx} style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ba1607', background: '#fdf8f8', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {sec.sectionName}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {sec.items.map((item) => {
                              const isPresent = answers[item.id]?.present === true;
                              const isNotPresent = answers[item.id]?.present === false;
                              const commentVal = answers[item.id]?.comment || '';

                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    border: isPresent ? '1px solid #86efac' : isNotPresent ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    background: isPresent ? '#f0fdf4' : isNotPresent ? '#fff5f5' : '#ffffff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '240px' }}>
                                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 800, color: '#ba1607', fontSize: '12px', fontFamily: 'monospace' }}>
                                          #{item.itemNo}
                                        </span>
                                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', lineHeight: 1.4 }}>
                                          {item.indicator}
                                        </span>
                                        {item.parentalReportAllowed && (
                                          <span style={{ fontSize: '10px', color: '#ba1607', background: '#fdf2f2', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                                            Parental report
                                          </span>
                                        )}
                                      </div>

                                      {/* Procedure / Material detail */}
                                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                                        {item.material && <span style={{ color: '#475569' }}><strong>Material:</strong> {item.material} • </span>}
                                        <span>{item.procedure}</span>
                                      </div>
                                    </div>

                                    {/* Action Buttons: Compact segmented pills */}
                                    <div style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                                      <button
                                        type="button"
                                        onClick={() => handleItemToggle(item.id, true)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '4px 10px',
                                          borderRadius: '5px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          border: isPresent ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                          background: isPresent ? '#16a34a' : '#ffffff',
                                          color: isPresent ? '#ffffff' : '#334155',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Check size={13} />
                                        <span>Present</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleItemToggle(item.id, false)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '4px 10px',
                                          borderRadius: '5px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          border: isNotPresent ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                          background: isNotPresent ? '#dc2626' : '#ffffff',
                                          color: isNotPresent ? '#ffffff' : '#334155',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Minus size={13} />
                                        <span>Not Present</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Comments input: displayed when not present or if comment exists */}
                                  {(isNotPresent || commentVal) && (
                                    <div style={{ marginTop: '2px' }}>
                                      <input
                                        type="text"
                                        placeholder="Reason / clinical observation (e.g., child shy, no opportunity, refused)..."
                                        value={commentVal}
                                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                        style={{
                                          width: '100%',
                                          fontSize: '11px',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          border: isNotPresent ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                          background: '#ffffff',
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}

            {/* TAB: QUALITATIVE OBSERVATIONS */}
            {activeDomainId === 'qualitative' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    To the Examiner: Notes, Descriptions, and Observations
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Record qualitative context on the child's development, health, and family environment.
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    1. Child's background (ex. behavior / health / etc.):
                  </label>
                  <textarea
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={qualitativeNotes.background}
                    onChange={(e) => setQualitativeNotes({ ...qualitativeNotes, background: e.target.value })}
                    placeholder="Enter observation notes on child's demeanor, attention, and physical condition..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    2. Family environment (ex. health of family members / family problems / economic conditions):
                  </label>
                  <textarea
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={qualitativeNotes.familyEnv}
                    onChange={(e) => setQualitativeNotes({ ...qualitativeNotes, familyEnv: e.target.value })}
                    placeholder="Enter notes on family stability, support system, or health challenges..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    3. Parents' stimulating activities for the child:
                  </label>
                  <textarea
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={qualitativeNotes.stimulatingActivities}
                    onChange={(e) => setQualitativeNotes({ ...qualitativeNotes, stimulatingActivities: e.target.value })}
                    placeholder="What are the activities/things that the parents do to help stimulate the child's development? (e.g. storytelling, singing, games)..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    4. Home environment (ex. facilities / type of house / household items / interaction):
                  </label>
                  <textarea
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={qualitativeNotes.homeEnv}
                    onChange={(e) => setQualitativeNotes({ ...qualitativeNotes, homeEnv: e.target.value })}
                    placeholder="Observations on living condition and learning materials in the home..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    5. Other observations:
                  </label>
                  <textarea
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={qualitativeNotes.others}
                    onChange={(e) => setQualitativeNotes({ ...qualitativeNotes, others: e.target.value })}
                    placeholder="Any other relevant observations during the evaluation..."
                  />
                </div>
              </div>
            )}

            {/* Stepper Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Total Demonstrated Items: <strong style={{ color: '#7e191b', fontSize: '14px' }}>{totalRawScore}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => setCurrentStep('guidelines')}>
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={() => setCurrentStep('review')}>
                  Review Assessment <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: REVIEW & SAVE / COMPLETE
            ========================================================================= */}
        {currentStep === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                    Part 4: Official ECCD Council Scoring & Standard Conversion
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Domain Raw Scores converted to Scaled Scores (1–19) and derived Standard Score (Mean 100, SD 15).
                  </div>
                </div>
                <Badge variant={scoringSummary.isDelayed ? 'danger' : 'success'}>
                  {scoringSummary.interpretation}
                </Badge>
              </div>

              {/* Delay Detection Banner */}
              {scoringSummary.isDelayed && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px', padding: '10px 12px', margin: '10px 0 12px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: 1.4 }}>
                    <strong>ECCD Council Delay Cutoff Triggered:</strong>{' '}
                    {scoringSummary.isStandardScoreDelayed ? `Standard Score (${scoringSummary.standardScore}) is < 79. ` : ''}
                    {scoringSummary.anyDomainDelayed ? `Domain Scaled Score ≤ 6 in: ${scoringSummary.delayedDomains.map((d) => `${d.name.replace(' Domain', '')} (${d.scaledScore})`).join(', ')}. ` : ''}
                    <div>
                      Follow-up case has been automatically flagged with <strong>Urgent</strong> priority.
                    </div>
                  </div>
                </div>
              )}

              {/* 7 Domains Bento Grid showing both Raw Checks and Scaled Scores (1-19) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {scoringSummary.domainDetails.map((dom) => (
                  <div
                    key={dom.name}
                    style={{
                      background: dom.alert ? '#fef2f2' : '#ffffff',
                      border: dom.alert ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '12px', color: dom.alert ? '#991b1b' : '#0f172a', fontWeight: 700 }}>
                        {dom.name.replace(' Domain', '')}
                      </div>
                      {dom.alert && (
                        <Badge variant="danger" size="xs">Delay (≤6)</Badge>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Raw: </span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{dom.rawScore}</strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>/{dom.max}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Scaled: </span>
                        <strong style={{ fontSize: '16px', color: dom.alert ? '#dc2626' : '#7e191b' }}>{dom.scaledScore}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Standard Score & Summary Stats Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '12px' }}>
                <div style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Total Raw Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {totalRawScore} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>checks</span>
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Sum of Scaled Scores</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ba1607', marginTop: '2px' }}>
                    {scoringSummary.sumScaledScores} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>/ 133</span>
                  </div>
                </div>

                <div style={{ background: scoringSummary.isDelayed ? '#fee2e2' : '#fdf2f2', padding: '10px 12px', borderRadius: '6px', border: scoringSummary.isDelayed ? '1px solid #f87171' : '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', color: scoringSummary.isDelayed ? '#991b1b' : '#7e191b', fontWeight: 700 }}>
                    Overall Standard Score
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: scoringSummary.isDelayed ? '#b91c1c' : '#7e191b', marginTop: '2px' }}>
                    {scoringSummary.standardScore} <span style={{ fontSize: '11px', fontWeight: 600 }}>(Mean 100, SD 15)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Session & Examiner Metadata */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '10px' }}>
                Examiner & Administration Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Name & Designation of Examiner"
                  value={sessionMeta.evaluator}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, evaluator: e.target.value })}
                  required
                />
                <Input
                  label="Date Administered"
                  type="date"
                  value={sessionMeta.assessmentDate}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, assessmentDate: e.target.value })}
                  required
                />
                <Input
                  label="Place Where Test is Administered"
                  value={sessionMeta.placeAdministered}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, placeAdministered: e.target.value })}
                />
                <Select
                  label="Assessment Interval / Cycle"
                  value={sessionMeta.assessmentCycle}
                  onChange={(e) => setSessionMeta({ ...sessionMeta, assessmentCycle: e.target.value })}
                  options={[
                    { value: 'Cycle 1 (Baseline - SY 2026–2027)', label: 'Cycle 1 (Baseline - Start of SY)' },
                    { value: 'Cycle 2 (Mid-Year Progress)', label: 'Cycle 2 (Mid-Year Progress)' },
                    { value: 'Cycle 3 (End-of-Year Summative)', label: 'Cycle 3 (End-of-Year Summative)' },
                  ]}
                />
              </div>
            </div>

            {/* Follow-up Case Creation Trigger */}
            <div style={{ background: flagFollowUp ? '#fef2f2' : '#f8fafc', border: flagFollowUp ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: flagFollowUp ? '#991b1b' : '#1e293b' }}>
                <input
                  type="checkbox"
                  checked={flagFollowUp}
                  onChange={(e) => setFlagFollowUp(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Flag for Follow-up Case & Guidance Referral</span>
              </label>

              {flagFollowUp && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <Select
                      label="Priority Level"
                      value={followUpPriority}
                      onChange={(e) => setFollowUpPriority(e.target.value)}
                      options={[
                        { value: 'Urgent', label: 'Urgent Action' },
                        { value: 'High', label: 'High Priority' },
                        { value: 'Medium', label: 'Medium Priority' },
                      ]}
                    />
                    <Input
                      label="Case Reason / Guidance Details"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#991b1b' }}>
                    A follow-up case will automatically be added to the child's portfolio and the CSWDO follow-up monitoring queue.
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep('assessment')}>
                <ChevronLeft size={14} /> Back to Checklist
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
                  Print Checklist
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onClick={handleSaveAssessment}
                >
                  <Save size={14} />
                  Save &amp; Complete Assessment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default OfficialEccdChecklistModal;
