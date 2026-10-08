import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Save,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Building,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { useToast } from '../ui/Toast';
import { getPhilippinesDate } from '../../utils/phTime';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';

export function OfficialRegistrationFormModal({
  isOpen,
  onClose,
  onSuccess,
  onViewExistingChild,
  initialHousehold = null,
}) {
  const { addToast } = useToast();

  // Step 1: Duplicate Check, Step 2: Form Intake, Step 3: Success Confirmation
  const [currentStep, setCurrentStep] = useState('check'); // 'check' | 'form' | 'success'

  // Pre-registration Duplicate Search inputs
  const [searchFirst, setSearchFirst] = useState('');
  const [searchLast, setSearchLast] = useState('');
  const [searchBirthDate, setSearchBirthDate] = useState('');
  const [searchParent, setSearchParent] = useState('');
  const [duplicateResult, setDuplicateResult] = useState(null);

  // Form State — Exactly matches ECCD Council Form 1: Registration Form
  const [formData, setFormData] = useState({
    // Child
    childLastName: '',
    childFirstName: '',
    childMiddleName: '',
    childSex: 'Male', // M / F
    childAddress: '',
    childBirthDate: '',
    childAge: '',
    registered: 'Yes', // Registered with Civil Registrar: Yes / No
    guardianName: '',
    guardianRelationship: '',
    childFirstLanguage: 'Kapampangan',
    childSecondLanguage: 'Tagalog',
    guardianEmail: '',

    // Mother
    motherName: '',
    motherOccupation: '',
    motherAddress: '',
    motherContactHome: '',
    motherContactWork: '',

    // Father
    fatherName: '',
    fatherOccupation: '',
    fatherAddress: '',
    fatherContactHome: '',
    fatherContactWork: '',

    // Emergency Contact
    emergencyName: '',
    emergencyRelationship: '',
    emergencyContactHome: '',
    emergencyContactWork: '',

    // Signatures
    parentGuardianSignatureName: '',
    dateAccomplished: getPhilippinesDate(),
    reviewedByCDT: 'Maria C. Santos (CDW I)',
    dateReviewed: getPhilippinesDate(),

    // System Linkage
    barangay: 'Alasas',
    dayCareCenterName: '',
    householdId: initialHousehold ? initialHousehold.id : '',
  });

  const [createdResult, setCreatedResult] = useState(null);

  // Load draft or initial household data when opening
  useEffect(() => {
    if (isOpen) {
      if (initialHousehold) {
        setFormData((prev) => ({
          ...prev,
          householdId: initialHousehold.id,
          barangay: initialHousehold.barangay || prev.barangay,
          childAddress: initialHousehold.address || prev.childAddress,
          motherAddress: initialHousehold.address || prev.motherAddress,
          fatherAddress: initialHousehold.address || prev.fatherAddress,
          guardianName: initialHousehold.parentGuardian || prev.guardianName,
        }));
      }

      // Check draft
      const draft = officialFormsService.getDraft('REGISTRATION');
      if (draft && !initialHousehold) {
        setFormData(draft.data);
      }
    }
  }, [isOpen, initialHousehold]);

  // Auto-calculate age in years/months when birthdate changes
  useEffect(() => {
    if (formData.childBirthDate) {
      const bDate = new Date(formData.childBirthDate);
      const today = new Date();
      if (!isNaN(bDate.getTime())) {
        const diffMonths = (today.getFullYear() - bDate.getFullYear()) * 12 + (today.getMonth() - bDate.getMonth());
        const years = Math.max(0, Math.floor(diffMonths / 12));
        const months = Math.max(0, diffMonths % 12);
        setFormData((prev) => ({
          ...prev,
          childAge: `${years} yrs, ${months} mos`,
        }));
      }
    }
  }, [formData.childBirthDate]);

  // Perform Duplicate Check
  const handleCheckDuplicates = () => {
    const res = officialFormsService.checkExistingChild({
      firstName: searchFirst,
      lastName: searchLast,
      birthDate: searchBirthDate,
      parentName: searchParent,
    });
    setDuplicateResult(res);
  };

  const handleProceedToForm = (bypassDuplicates = false) => {
    // Populate form with duplicate search entries
    setFormData((prev) => ({
      ...prev,
      childFirstName: searchFirst || prev.childFirstName,
      childLastName: searchLast || prev.childLastName,
      childBirthDate: searchBirthDate || prev.childBirthDate,
      guardianName: searchParent || prev.guardianName,
    }));
    setCurrentStep('form');
  };

  const handleSaveDraft = () => {
    officialFormsService.saveDraft('REGISTRATION', formData);
    addToast('Official Registration draft saved to browser storage.', 'info');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.childFirstName || !formData.childLastName || !formData.childBirthDate) {
      addToast('Please complete Child Name and Birthday before submitting.', 'warning');
      return;
    }

    const result = officialFormsService.submitRegistrationForm(formData);
    if (result.success) {
      setCreatedResult(result);
      setCurrentStep('success');
      addToast(`Official Registration successful! Assigned ECCD Child ID: ${result.eccdChildId}`, 'success');
      if (onSuccess) onSuccess(result.child);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="official-form-modal"
    >
      <div style={{ padding: 'var(--space-2)' }}>
        {/* Document Header */}
        <div className="official-doc-header">
          <div className="agency-title">Early Childhood Care and Development Council</div>
          <span className="form-code-badge">FORM 1</span>
          <h2 className="form-main-title">REGISTRATION FORM</h2>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            City Social Welfare and Development Office (CSWDO) • City of San Fernando, Pampanga
          </div>
        </div>

        {/* Legal Instruction Banner */}
        <div className="official-instruction-banner">
          <strong>Instructions:</strong> This form is to be filled up by the parent/guardian of the child upon enrolment to the Child Development Center. This will be kept by the Child Development Teacher in the portfolio of the child.
        </div>

        {/* =====================================================================
            STEP 1: PRE-REGISTRATION DUPLICATE RECORD CHECK
            ===================================================================== */}
        {currentStep === 'check' && (
          <div>
            <div className="dup-check-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <Search size={18} style={{ color: '#b45309' }} />
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: '#92400e', margin: 0 }}>
                  Civil Registry Pre-Check: Prevent Duplicate Child Records
                </h3>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#78350f', margin: '0 0 var(--space-3) 0' }}>
                Per RA 10410, each child must hold exactly ONE persistent ECCD Child ID. Search the centralized database before registering.
              </p>

              <div className="official-grid-2">
                <Input
                  label="Child First Name"
                  placeholder="e.g. Juan"
                  uppercase
                  value={searchFirst}
                  onChange={(e) => setSearchFirst(e.target.value.toUpperCase())}
                />
                <Input
                  label="Child Last Name"
                  placeholder="e.g. Dela Cruz"
                  uppercase
                  value={searchLast}
                  onChange={(e) => setSearchLast(e.target.value.toUpperCase())}
                />
                <Input
                  type="date"
                  label="Date of Birth"
                  value={searchBirthDate}
                  onChange={(e) => setSearchBirthDate(e.target.value)}
                />
                <Input
                  label="Mother / Guardian Name (Optional)"
                  placeholder="e.g. Rosa Dela Cruz"
                  uppercase
                  value={searchParent}
                  onChange={(e) => setSearchParent(e.target.value.toUpperCase())}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={handleCheckDuplicates}>
                  <Search size={14} />
                  Check Database for Existing Record
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleProceedToForm(true)}>
                  Skip Check &amp; Open Form
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            {/* Duplicate Check Results */}
            {duplicateResult && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                {duplicateResult.hasMatch ? (
                  <Alert variant="warning" title="Potential Duplicate Child Records Found!">
                    <p style={{ margin: '4px 0 var(--space-2) 0', fontSize: 'var(--font-size-xs)' }}>
                      The following existing records match this child. To maintain data integrity, you can open their existing profile rather than creating a duplicate:
                    </p>
                    {duplicateResult.matches.map((match) => (
                      <div key={match.id} className="dup-match-item">
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                            {match.fullName} ({match.sex})
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ECCD Child ID: <strong>{match.id}</strong> • DOB: {match.birthDate} ({match.ageYears}y {match.ageMonths}m) • Brgy: {match.barangay}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Parent/Guardian: {match.parentGuardian} • Status: {match.enrollmentStatus}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              onClose();
                              if (onViewExistingChild) onViewExistingChild(match.id);
                            }}
                          >
                            <ExternalLink size={13} />
                            Open Child 360°
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 'var(--space-3)', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleProceedToForm(true)}>
                        None of these match — Register as New Child
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <Alert variant="success" title="No Matching Record Found">
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)' }}>
                      No child with this name/birthdate is registered yet. Proceed to complete official Form 1.
                    </p>
                    <div style={{ marginTop: 'var(--space-3)', textAlign: 'right' }}>
                      <Button variant="primary" size="sm" onClick={() => handleProceedToForm(false)}>
                        Proceed with Registration
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            STEP 2: OFFICIAL REGISTRATION FORM INTAKE
            ===================================================================== */}
        {currentStep === 'form' && (
          <form onSubmit={handleSubmit}>
            {/* CHILD INFORMATION */}
            <div className="official-section-title">Child Information</div>
            <div className="official-grid-3">
              <Input
                label="Last Name *"
                uppercase
                value={formData.childLastName}
                onChange={(e) => setFormData({ ...formData, childLastName: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="First Name *"
                uppercase
                value={formData.childFirstName}
                onChange={(e) => setFormData({ ...formData, childFirstName: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Middle Name / Initial"
                uppercase
                value={formData.childMiddleName}
                onChange={(e) => setFormData({ ...formData, childMiddleName: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="official-grid-4" style={{ marginTop: 'var(--space-3)' }}>
              <div>
                <label className="input-label">Sex *</label>
                <div className="official-choice-group">
                  <div
                    className={`official-choice-item ${formData.childSex === 'Male' ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, childSex: 'Male' })}
                  >
                    <span>M (Male)</span>
                  </div>
                  <div
                    className={`official-choice-item ${formData.childSex === 'Female' ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, childSex: 'Female' })}
                  >
                    <span>F (Female)</span>
                  </div>
                </div>
              </div>

              <Input
                type="date"
                label="Birthday *"
                value={formData.childBirthDate}
                onChange={(e) => setFormData({ ...formData, childBirthDate: e.target.value })}
                required
              />

              <Input
                label="Age"
                value={formData.childAge}
                onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                placeholder="Auto-calculated"
              />

              <div>
                <label className="input-label">Registered with Civil Registrar? *</label>
                <div className="official-choice-group">
                  <div
                    className={`official-choice-item ${formData.registered === 'Yes' ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, registered: 'Yes' })}
                  >
                    <span>Yes (Has Birth Cert)</span>
                  </div>
                  <div
                    className={`official-choice-item ${formData.registered === 'No' ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, registered: 'No' })}
                  >
                    <span>No</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="official-grid-2" style={{ marginTop: 'var(--space-3)' }}>
              <Input
                label="Address *"
                value={formData.childAddress}
                onChange={(e) => setFormData({ ...formData, childAddress: e.target.value })}
                placeholder="Purok, Street, Barangay, City of San Fernando, Pampanga"
                required
              />
              <Select
                label="Barangay *"
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                options={[
                  ...BARANGAY_OPTIONS,
                ]}
              />
            </div>

            <div className="official-grid-2" style={{ marginTop: 'var(--space-3)' }}>
              <Input
                label="Child's First Language *"
                value={formData.childFirstLanguage}
                onChange={(e) => setFormData({ ...formData, childFirstLanguage: e.target.value })}
                placeholder="e.g. Kapampangan, Tagalog"
                required
              />
              <Input
                label="Child's Second Language"
                value={formData.childSecondLanguage}
                onChange={(e) => setFormData({ ...formData, childSecondLanguage: e.target.value })}
                placeholder="e.g. Tagalog, English"
              />
            </div>

            {/* GUARDIAN INFORMATION */}
            <div className="official-section-title">Guardian Information</div>
            <div className="official-grid-3">
              <Input
                label="Guardian Name *"
                uppercase
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Relationship to Child *"
                value={formData.guardianRelationship}
                onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                placeholder="e.g. Mother, Father, Grandmother"
                required
              />
              <Input
                type="email"
                label="Guardian E-mail Address"
                value={formData.guardianEmail}
                onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            {/* MOTHER'S INFORMATION */}
            <div className="official-section-title">Mother's Information</div>
            <div className="official-grid-2">
              <Input
                label="Mother's Full Name"
                uppercase
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value.toUpperCase() })}
                placeholder="First Middle Last"
              />
              <Input
                label="Occupation"
                value={formData.motherOccupation}
                onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                placeholder="e.g. Teacher, Vendor, Homemaker"
              />
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Input
                label="Mother's Address"
                value={formData.motherAddress}
                onChange={(e) => setFormData({ ...formData, motherAddress: e.target.value })}
                placeholder="Leave blank if same as child's address"
              />
            </div>
            <div className="official-grid-2" style={{ marginTop: 'var(--space-2)' }}>
              <Input
                label="Mother Contact Number: Home"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.motherContactHome}
                onChange={(e) => setFormData({ ...formData, motherContactHome: e.target.value.replace(/\D/g, '') })}
                placeholder="09171234567"
              />
              <Input
                label="Mother Contact Number: Work"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.motherContactWork}
                onChange={(e) => setFormData({ ...formData, motherContactWork: e.target.value.replace(/\D/g, '') })}
                placeholder="09171234567"
              />
            </div>

            {/* FATHER'S INFORMATION */}
            <div className="official-section-title">Father's Information</div>
            <div className="official-grid-2">
              <Input
                label="Father's Full Name"
                uppercase
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                placeholder="First Middle Last"
              />
              <Input
                label="Occupation"
                value={formData.fatherOccupation}
                onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                placeholder="e.g. Driver, Carpenter, Engineer"
              />
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Input
                label="Father's Address"
                value={formData.fatherAddress}
                onChange={(e) => setFormData({ ...formData, fatherAddress: e.target.value })}
                placeholder="Leave blank if same as child's address"
              />
            </div>
            <div className="official-grid-2" style={{ marginTop: 'var(--space-2)' }}>
              <Input
                label="Father Contact Number: Home"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.fatherContactHome}
                onChange={(e) => setFormData({ ...formData, fatherContactHome: e.target.value.replace(/\D/g, '') })}
                placeholder="09171234567"
              />
              <Input
                label="Father Contact Number: Work"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.fatherContactWork}
                onChange={(e) => setFormData({ ...formData, fatherContactWork: e.target.value.replace(/\D/g, '') })}
                placeholder="09171234567"
              />
            </div>

            {/* IN CASE OF EMERGENCY */}
            <div className="official-section-title">In Case of Emergency, Please Contact</div>
            <div className="official-grid-2">
              <Input
                label="Emergency Contact Name *"
                uppercase
                value={formData.emergencyName}
                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Relationship to Child *"
                value={formData.emergencyRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                placeholder="e.g. Aunt, Grandmother, Neighbor"
                required
              />
            </div>
            <div className="official-grid-2" style={{ marginTop: 'var(--space-2)' }}>
              <Input
                label="Emergency Contact Number: Home *"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.emergencyContactHome}
                onChange={(e) => setFormData({ ...formData, emergencyContactHome: e.target.value.replace(/\D/g, '') })}
                required
              />
              <Input
                label="Emergency Contact Number: Work"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.emergencyContactWork}
                onChange={(e) => setFormData({ ...formData, emergencyContactWork: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            {/* OFFICIAL SIGNATURES & AUDIT BLOCK */}
            <div className="official-signature-block">
              <div>
                <Input
                  label="Accomplished by: Printed Name of Parent / Guardian *"
                  uppercase
                  value={formData.parentGuardianSignatureName}
                  onChange={(e) => setFormData({ ...formData, parentGuardianSignatureName: e.target.value.toUpperCase() })}
                  placeholder="Parent / Guardian Name"
                  required
                />
                <Input
                  type="date"
                  label="Date Accomplished"
                  value={formData.dateAccomplished}
                  onChange={(e) => setFormData({ ...formData, dateAccomplished: e.target.value })}
                />
                <div className="official-sig-line">Signature over printed name of parent/guardian</div>
              </div>

              <div>
                <Input
                  label="Reviewed by: Printed Name of CD T *"
                  value={formData.reviewedByCDT}
                  onChange={(e) => setFormData({ ...formData, reviewedByCDT: e.target.value })}
                  placeholder="Child Development Teacher Name"
                  required
                />
                <Input
                  type="date"
                  label="Date Reviewed"
                  value={formData.dateReviewed}
                  onChange={(e) => setFormData({ ...formData, dateReviewed: e.target.value })}
                />
                <div className="official-sig-line">Signature over printed name of CD T</div>
              </div>
            </div>

            {/* FORM FOOTER ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep('check')}>
                  <ArrowLeft size={14} />
                  Back to Check
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraft}>
                  <Save size={14} />
                  Save Draft
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 size={14} />
                  Submit Official Registration
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* =====================================================================
            STEP 3: SUCCESS CONFIRMATION & CHILD 360° ROUTE
            ===================================================================== */}
        {currentStep === 'success' && createdResult && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)' }}>
              <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#1e293b', marginBottom: 'var(--space-1)' }}>
              Child Successfully Registered!
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#64748b', maxWidth: '480px', margin: '0 auto var(--space-4)' }}>
              Official Form 1 has been validated and integrated into the CSWDO Central Database. One persistent ECCD Child ID has been issued.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', maxWidth: '420px', margin: '0 auto var(--space-5)', textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#64748b' }}>Assigned Persistent Identifier:</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-primary-700)', letterSpacing: '0.04em' }}>
                {createdResult.eccdChildId}
              </div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: '#334155' }}>
                <strong>Child:</strong> {createdResult.child.fullName}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#334155' }}>
                <strong>Household:</strong> {createdResult.household.householdNo} ({createdResult.household.barangay})
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#334155' }}>
                <strong>Capture Once:</strong> Form 1 &amp; Form 2 profiles have been auto-initialized with this child's data.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  if (onViewExistingChild) onViewExistingChild(createdResult.child.id);
                }}
              >
                <ExternalLink size={14} />
                Open Child 360° Profile
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCurrentStep('check');
                  setFormData((prev) => ({
                    ...prev,
                    childFirstName: '',
                    childLastName: '',
                    childMiddleName: '',
                    childBirthDate: '',
                    childAge: '',
                  }));
                }}
              >
                Register Another Child
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
