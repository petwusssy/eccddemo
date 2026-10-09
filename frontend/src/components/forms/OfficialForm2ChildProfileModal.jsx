import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  X,
  Baby,
  HeartPulse,
  Activity,
  Users,
  Compass,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';
import { useToast } from '../ui/Toast';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialForm2ChildProfileModal({
  isOpen,
  onClose,
  childId,
  onSuccess,
}) {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' | 'health' | 'physical' | 'siblings' | 'experience' | 'performance' | 'logistics'

  const [formData, setFormData] = useState({
    childId: '',
    barangay: 'San Isidro',
    householdId: '',
    // 1. Personal Information
    lastName: '',
    firstName: '',
    middleInitial: '',
    birthDate: '',
    age: '',
    sex: 'Male', // Male, Female
    birthOrder: '1',
    registered: 'Yes', // Yes, No
    bornAt: 'Hospital', // Hospital, Health Center, Home
    motherTongue: 'Tagalog',
    motherTongueOthers: '',
    otherDialects: 'Kapampangan',

    // 8-10. Anthropometrics & Cards
    heightCm: '',
    weightKg: '',
    hasEccdCard: true,
    hasMotherChildBook: true,
    hasOtherCards: '',

    // 11. Vaccination and Other Health Data
    vaccinations: {
      bcg: 'Yes', // Yes, No, Don't Know
      dpt: 'Yes',
      oralPolio: 'Yes',
      hepaB: 'Yes',
      measles: 'Yes',
      others: 'No',
    },

    // 12. Physical Attributes
    deformities: {
      hareLip: false,
      crossEyed: false,
      deaf: false,
      blind: false,
      disabledLeg: false,
      disabledArmHand: false,
      deformityFingersToes: false,
    },
    problemsWith: {
      behavior: false,
      speaking: false,
      hearing: false,
      vision: false,
    },
    leftHanded: 'No', // Yes, No

    // 13. Siblings Roster
    siblings: [
      { age: '6', sex: 'Female', education: 'In School' },
      { age: '1', sex: 'Male', education: 'Out of School' },
    ],

    // 14. Prior Early Childhood Experience
    priorExperience: {
      nursery: 'Public Day Care', // Private Pre School, Public Pre-School, Private Day Care, Public Day Care, Church-based, Home-based, Others
      kindergarten: 'Public Pre-School',
      preparatory: 'Public Pre-School',
    },

    // 15. Other Performance Related Inputs
    learnsAtHomeWith: 'Mother/Father/Both', // Nobody, Siblings, Househelp/Maid, Tutor, Mother/Father/Both, Relatives, Others
    playOlderSiblings: 'Sometimes', // Always, Sometimes, Rarely, Never
    playYoungerSiblings: 'Always',
    playNeighborsSameAge: 'Sometimes',

    // 16. Logistics
    hasMealBeforeSchool: 'Always', // Always, Most of the time, Sometimes, Rarely, Never
    foodEaten: {
      vegetable: true,
      pork: true,
      chicken: true,
      beef: false,
      fish: true,
      rice: true,
      noodle: true,
      soup: true,
      bread: true,
      fruits: true,
      cereals: false,
      fruitJuice: true,
      milk: true,
    },
    hasBaon: 'Food', // Money, Food, Both, None, Don’t Know
    travelTimeToDCC: '10',
    modeToDCC: 'Walking', // Walking, Private Vehicle, Public Transportation
    travelTimeToNCDC: '20',
    modeToNCDC: 'Public Transportation',
    publicTransportationType: 'Tricycle', // School bus, Jeep, Bus, Banca, Calesa, Tricycle, Pedicab, Habal-Habal, Others
    goesToSchoolWith: 'Mother', // Mother, Father, Both Parents, Siblings, Relatives, Grandparents, Maid, None

    // Metadata & Signatures
    nameOfRespondent: '',
    nameOfCDT: 'Maria C. Santos (CDW I)',
    dateConducted: getPhilippinesDate(),
  });

  // Prepopulate from Child record in Central Store (Capture Once → Reuse Everywhere!)
  useEffect(() => {
    if (isOpen && childId && childId !== 'new') {
      const existing = officialFormsService.getForm2Data(childId);
      const child = centralDataStore.getChildById(childId);

      if (existing) {
        setFormData((prev) => ({
          ...prev,
          ...existing,
          childId,
        }));
      } else if (child) {
        setFormData((prev) => ({
          ...prev,
          childId,
          barangay: child.barangay || 'San Isidro',
          householdId: child.householdId || '',
          lastName: child.lastName || '',
          firstName: child.firstName || '',
          middleInitial: child.middleName ? child.middleName.charAt(0) : '',
          birthDate: child.birthDate || '',
          age: `${child.ageYears || 3} yrs`,
          sex: child.sex || 'Male',
          registered: child.registeredWithCivilRegistrar ? 'Yes' : 'No',
          motherTongue: child.firstLanguage || 'Tagalog',
          otherDialects: child.secondLanguage || 'Kapampangan',
          heightCm: child.height ? String(child.height) : '92',
          weightKg: child.weight ? String(child.weight) : '13.5',
          nameOfRespondent: child.parentGuardian || '',
        }));
      }
    } else if (isOpen && (!childId || childId === 'new')) {
      const defaultHh = centralDataStore.getHouseholds()[0];
      setFormData((prev) => ({
        ...prev,
        childId: '',
        barangay: defaultHh?.barangay || 'San Isidro',
        householdId: defaultHh?.id || '',
        nameOfRespondent: defaultHh?.parentGuardian || '',
        lastName: '',
        firstName: '',
        middleInitial: '',
        birthDate: '',
        age: '3 yrs',
        sex: 'Male',
        heightCm: '92',
        weightKg: '13.5',
        nameOfCDT: 'Maria C. Santos (CDW I)',
        dateConducted: getPhilippinesDate(),
      }));
    }
  }, [isOpen, childId]);

  const handleSaveDraft = () => {
    const draftKey = childId && childId !== 'new' ? `FORM_2_${childId}` : 'FORM_2_NEW';
    officialFormsService.saveDraft(draftKey, formData);
    addToast('Official Form 2 draft saved locally.', 'info');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      addToast('Please enter Child First Name and Last Name.', 'error');
      return;
    }

    let targetChildId = childId;
    if (!targetChildId || targetChildId === 'new') {
      const allKids = centralDataStore.getChildren() || [];
      targetChildId = `ECCD-2026-${String(allKids.length + 101).padStart(5, '0')}`;

      // Register new Master Child Profile into Central Data Store
      centralDataStore.registerChild({
        id: targetChildId,
        firstName: formData.firstName.toUpperCase().trim(),
        lastName: formData.lastName.toUpperCase().trim(),
        middleName: (formData.middleInitial || '').toUpperCase().trim(),
        fullName: `${formData.firstName} ${formData.lastName}`.toUpperCase().trim(),
        birthDate: formData.birthDate,
        sex: formData.sex,
        barangay: formData.barangay || 'San Isidro',
        householdId: formData.householdId || null,
        parentGuardian: formData.nameOfRespondent || 'Parent / Guardian',
        height: parseFloat(formData.heightCm) || 92,
        weight: parseFloat(formData.weightKg) || 13.5,
        firstLanguage: formData.motherTongue,
        secondLanguage: formData.otherDialects,
        enrollmentStatus: 'Not Enrolled',
      });
    } else {
      centralDataStore.updateChild(targetChildId, {
        firstName: formData.firstName.toUpperCase().trim(),
        lastName: formData.lastName.toUpperCase().trim(),
        birthDate: formData.birthDate,
        sex: formData.sex,
        height: parseFloat(formData.heightCm) || undefined,
        weight: parseFloat(formData.weightKg) || undefined,
      });
    }

    officialFormsService.saveForm2Data(targetChildId, {
      ...formData,
      childId: targetChildId,
    });

    addToast(`Official Form 2 (Children's Profile) saved! ECCD ID: ${targetChildId}`, 'success');
    if (onSuccess) onSuccess(formData, targetChildId);
    onClose();
  };

  const handleAddSibling = () => {
    setFormData((prev) => ({
      ...prev,
      siblings: [...prev.siblings, { age: '', sex: 'Male', education: 'In School' }],
    }));
  };

  const handleRemoveSibling = (idx) => {
    setFormData((prev) => ({
      ...prev,
      siblings: prev.siblings.filter((_, i) => i !== idx),
    }));
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
          <span className="form-code-badge">FORM 2</span>
          <h2 className="form-main-title">CHILDREN'S PROFILE</h2>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            ECCD Child ID: <strong>{childId}</strong> • April 2014 Edition
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="official-stepper-bar">
          {[
            { id: 'personal', label: '1–7. Personal' },
            { id: 'health', label: '8–11. Health & Vaccines' },
            { id: 'physical', label: '12. Physical Attributes' },
            { id: 'siblings', label: '13. Siblings' },
            { id: 'experience', label: '14. Early Childhood Exp' },
            { id: 'performance', label: '15. Home Learning' },
            { id: 'logistics', label: '16. Logistics & Travel' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`official-step-btn ${activeSection === sec.id ? 'is-active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {/* ===================================================================
              SECTION 1: PERSONAL INFORMATION (SECTIONS 1–7)
              =================================================================== */}
          {activeSection === 'personal' && (
            <div>
              {/* Connected Form 1 Household & Barangay */}
              <div className="official-grid-2" style={{ marginBottom: 'var(--space-3)' }}>
                <Select
                  label="Connected Barangay (Form 3) *"
                  value={formData.barangay || 'San Isidro'}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  options={BARANGAY_OPTIONS}
                />
                <Select
                  label="Connected Household (Form 1 Home Profile)"
                  value={formData.householdId || ''}
                  onChange={(e) => {
                    const hh = centralDataStore.getHouseholdById(e.target.value);
                    setFormData({
                      ...formData,
                      householdId: e.target.value,
                      barangay: hh?.barangay || formData.barangay,
                      nameOfRespondent: hh?.parentGuardian || formData.nameOfRespondent,
                    });
                  }}
                  options={[
                    { value: '', label: 'Select Form 1 Household (Optional)...' },
                    ...centralDataStore.getHouseholds().map((h) => ({
                      value: h.id,
                      label: `${h.id} — ${h.parentGuardian} (${h.barangay})`,
                    })),
                  ]}
                />
              </div>

              <div className="official-section-title">1. Personal Information</div>
              <div className="official-grid-5">
                <Input
                  label="Last Name"
                  uppercase
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase() })}
                />
                <Input
                  label="First Name"
                  uppercase
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })}
                />
                <Input
                  label="Middle Initial"
                  uppercase
                  value={formData.middleInitial}
                  onChange={(e) => setFormData({ ...formData, middleInitial: e.target.value.toUpperCase() })}
                />
                <Input
                  type="date"
                  label="Date of Birth"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <Input
                  label="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div className="official-grid-4" style={{ marginTop: 'var(--space-3)' }}>
                <div>
                  <label className="input-label">2. Sex</label>
                  <div className="official-choice-group">
                    {['Male', 'Female'].map((s) => (
                      <div
                        key={s}
                        className={`official-choice-item ${formData.sex === s ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, sex: s })}
                      >
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Input
                  label="3. Birth Order"
                  value={formData.birthOrder}
                  onChange={(e) => setFormData({ ...formData, birthOrder: e.target.value })}
                  placeholder="e.g. 1st, 2nd"
                />

                <div>
                  <label className="input-label">4. Registered (Birth Cert)?</label>
                  <div className="official-choice-group">
                    {['Yes', 'No'].map((r) => (
                      <div
                        key={r}
                        className={`official-choice-item ${formData.registered === r ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, registered: r })}
                      >
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">5. Born at</label>
                  <div className="official-choice-group">
                    {['Hospital', 'Health Center', 'Home'].map((b) => (
                      <div
                        key={b}
                        className={`official-choice-item ${formData.bornAt === b ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, bornAt: b })}
                      >
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="official-section-title">6. Mother Tongue &amp; 7. Other Dialects</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-2)' }}>
                {['Tagalog', 'Visayan', 'Ilocano', 'Bicolnon', 'Others'].map((lang) => (
                  <div
                    key={lang}
                    className={`official-choice-item ${formData.motherTongue === lang ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, motherTongue: lang })}
                  >
                    <span>{lang}</span>
                  </div>
                ))}
              </div>
              {formData.motherTongue === 'Others' && (
                <Input
                  label="Others, please specify"
                  value={formData.motherTongueOthers}
                  onChange={(e) => setFormData({ ...formData, motherTongueOthers: e.target.value })}
                />
              )}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Input
                  label="7. Other dialects spoken at home. Please specify"
                  value={formData.otherDialects}
                  onChange={(e) => setFormData({ ...formData, otherDialects: e.target.value })}
                  placeholder="e.g. Kapampangan"
                />
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 2: HEALTH, ANTHROPOMETRICS & VACCINES (SECTIONS 8–11)
              =================================================================== */}
          {activeSection === 'health' && (
            <div>
              <div className="official-section-title">8–10. Anthropometrics &amp; Cards</div>
              <div className="official-grid-4">
                <Input
                  type="number"
                  step="0.1"
                  label="8. Height (cm)"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.1"
                  label="9. Weight (kg)"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                />
                <label className={`official-choice-item ${formData.hasEccdCard ? 'is-selected' : ''}`} style={{ marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasEccdCard}
                    onChange={(e) => setFormData({ ...formData, hasEccdCard: e.target.checked })}
                  />
                  <span>10. ECCD Card</span>
                </label>
                <label className={`official-choice-item ${formData.hasMotherChildBook ? 'is-selected' : ''}`} style={{ marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasMotherChildBook}
                    onChange={(e) => setFormData({ ...formData, hasMotherChildBook: e.target.checked })}
                  />
                  <span>Mother &amp; Child Book</span>
                </label>
              </div>

              <div className="official-section-title">11. Vaccination and Other Health Data</div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Vaccine / Health Intervention</th>
                    <th className="text-center">Yes</th>
                    <th className="text-center">No</th>
                    <th className="text-center">Don’t Know</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'bcg', label: 'BCG' },
                    { key: 'dpt', label: 'DPT' },
                    { key: 'oralPolio', label: 'Oral Polio' },
                    { key: 'hepaB', label: 'Hepa B' },
                    { key: 'measles', label: 'Measles' },
                    { key: 'others', label: 'Others' },
                  ].map((v) => (
                    <tr key={v.key}>
                      <td style={{ fontWeight: '500' }}>{v.label}</td>
                      {['Yes', 'No', "Don't Know"].map((opt) => (
                        <td key={opt} className="text-center">
                          <input
                            type="radio"
                            name={`vax_${v.key}`}
                            checked={formData.vaccinations[v.key] === opt}
                            onChange={() => setFormData({
                              ...formData,
                              vaccinations: { ...formData.vaccinations, [v.key]: opt },
                            })}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================================================================
              SECTION 3: PHYSICAL ATTRIBUTES & DEFORMITY (SECTION 12)
              =================================================================== */}
          {activeSection === 'physical' && (
            <div>
              <div className="official-section-title">12.1 Physical Deformity</div>
              <div className="official-grid-4">
                {[
                  { key: 'hareLip', label: 'Hare Lip' },
                  { key: 'crossEyed', label: 'Cross-Eyed (Duling/Banlag)' },
                  { key: 'deaf', label: 'Deaf' },
                  { key: 'blind', label: 'Blind' },
                  { key: 'disabledLeg', label: 'Disabled leg' },
                  { key: 'disabledArmHand', label: 'Disabled Arm/Hand' },
                  { key: 'deformityFingersToes', label: 'Deformity in Fingers/Toes' },
                ].map((d) => (
                  <label key={d.key} className={`official-choice-item ${formData.deformities[d.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.deformities[d.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        deformities: { ...formData.deformities, [d.key]: e.target.checked },
                      })}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>

              <div className="official-section-title">12.2 Problems with</div>
              <div className="official-grid-4">
                {[
                  { key: 'behavior', label: 'Behavior' },
                  { key: 'speaking', label: 'Speaking' },
                  { key: 'hearing', label: 'Hearing' },
                  { key: 'vision', label: 'Vision' },
                ].map((p) => (
                  <label key={p.key} className={`official-choice-item ${formData.problemsWith[p.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.problemsWith[p.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        problemsWith: { ...formData.problemsWith, [p.key]: e.target.checked },
                      })}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>

              <div className="official-section-title">12.3 Left Handed</div>
              <div className="official-choice-group">
                {['Yes', 'No'].map((lh) => (
                  <div
                    key={lh}
                    className={`official-choice-item ${formData.leftHanded === lh ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, leftHanded: lh })}
                  >
                    <span>{lh}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 4: SIBLINGS ROSTER (SECTION 13)
              =================================================================== */}
          {activeSection === 'siblings' && (
            <div>
              <div className="official-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>13. Siblings</span>
                <Button type="button" variant="secondary" size="xs" onClick={handleAddSibling}>
                  <Plus size={12} /> Add Sibling
                </Button>
              </div>

              <table className="official-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Education Status</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.siblings.map((sib, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          className="input-sm"
                          style={{ width: '80px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          value={sib.age}
                          onChange={(e) => {
                            const updated = [...formData.siblings];
                            updated[idx].age = e.target.value;
                            setFormData({ ...formData, siblings: updated });
                          }}
                        />
                      </td>
                      <td>
                        <select
                          className="select-sm"
                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          value={sib.sex}
                          onChange={(e) => {
                            const updated = [...formData.siblings];
                            updated[idx].sex = e.target.value;
                            setFormData({ ...formData, siblings: updated });
                          }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="select-sm"
                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          value={sib.education}
                          onChange={(e) => {
                            const updated = [...formData.siblings];
                            updated[idx].education = e.target.value;
                            setFormData({ ...formData, siblings: updated });
                          }}
                        >
                          <option value="In School">In School</option>
                          <option value="Out of School">Out of School</option>
                        </select>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSibling(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================================================================
              SECTION 5: PRIOR EARLY CHILDHOOD EXPERIENCE (SECTION 14)
              =================================================================== */}
          {activeSection === 'experience' && (
            <div>
              <div className="official-section-title">14. Prior Early Childhood Experience</div>
              {[
                { key: 'nursery', label: '14.1 Nursery' },
                { key: 'kindergarten', label: '14.2 Kindergarten' },
                { key: 'preparatory', label: '14.3 Preparatory' },
              ].map((level) => (
                <div key={level.key} style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="input-label">{level.label}</label>
                  <div className="official-choice-group">
                    {[
                      'Private Pre School',
                      'Public Pre-School',
                      'Private Day Care',
                      'Public Day Care',
                      'Church-based',
                      'Home-based',
                      'Others',
                    ].map((opt) => (
                      <div
                        key={opt}
                        className={`official-choice-item ${formData.priorExperience[level.key] === opt ? 'is-selected' : ''}`}
                        onClick={() => setFormData({
                          ...formData,
                          priorExperience: { ...formData.priorExperience, [level.key]: opt },
                        })}
                      >
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===================================================================
              SECTION 6: PERFORMANCE RELATED INPUTS (SECTION 15)
              =================================================================== */}
          {activeSection === 'performance' && (
            <div>
              <div className="official-section-title">15.1 Learns at Home with</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-4)' }}>
                {['Nobody', 'Siblings', 'Househelp/Maid', 'Tutor', 'Mother/Father/Both', 'Relatives', 'Others'].map((l) => (
                  <div
                    key={l}
                    className={`official-choice-item ${formData.learnsAtHomeWith === l ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, learnsAtHomeWith: l })}
                  >
                    <span>{l}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">15.2 Play / Interacts with Older Siblings</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-3)' }}>
                {['Always', 'Sometimes', 'Rarely', 'Never'].map((freq) => (
                  <div
                    key={freq}
                    className={`official-choice-item ${formData.playOlderSiblings === freq ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, playOlderSiblings: freq })}
                  >
                    <span>{freq}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">15.3 Play / Interacts with Younger Siblings</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-3)' }}>
                {['Always', 'Sometimes', 'Rarely', 'Never'].map((freq) => (
                  <div
                    key={freq}
                    className={`official-choice-item ${formData.playYoungerSiblings === freq ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, playYoungerSiblings: freq })}
                  >
                    <span>{freq}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">15.4 Play / Interacts with Neighbors of Same Age</div>
              <div className="official-choice-group">
                {['Always', 'Sometimes', 'Rarely', 'Never'].map((freq) => (
                  <div
                    key={freq}
                    className={`official-choice-item ${formData.playNeighborsSameAge === freq ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, playNeighborsSameAge: freq })}
                  >
                    <span>{freq}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 7: LOGISTICS, MEAL & TRAVEL (SECTION 16)
              =================================================================== */}
          {activeSection === 'logistics' && (
            <div>
              <div className="official-section-title">16.1 Has Meal Before Going To School &amp; 16.3 Has Baon</div>
              <div className="official-grid-2">
                <div>
                  <label className="input-label">16.1 Has Meal Before Going To School</label>
                  <div className="official-choice-group">
                    {['Always', 'Most of the time', 'Sometimes', 'Rarely', 'Never'].map((opt) => (
                      <div
                        key={opt}
                        className={`official-choice-item ${formData.hasMealBeforeSchool === opt ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, hasMealBeforeSchool: opt })}
                      >
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">16.3 Has Baon</label>
                  <div className="official-choice-group">
                    {['Money', 'Food', 'Both', 'None', 'Don’t Know'].map((opt) => (
                      <div
                        key={opt}
                        className={`official-choice-item ${formData.hasBaon === opt ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, hasBaon: opt })}
                      >
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="official-section-title">16.2 Food Normally Eaten by Child</div>
              <div className="official-grid-5">
                {[
                  { key: 'vegetable', label: 'Vegetable' },
                  { key: 'pork', label: 'Pork' },
                  { key: 'chicken', label: 'Chicken' },
                  { key: 'beef', label: 'Beef' },
                  { key: 'fish', label: 'Fish' },
                  { key: 'rice', label: 'Rice' },
                  { key: 'noodle', label: 'Noodle' },
                  { key: 'soup', label: 'Soup' },
                  { key: 'bread', label: 'Bread' },
                  { key: 'fruits', label: 'Fruits' },
                  { key: 'cereals', label: 'Cereals' },
                  { key: 'fruitJuice', label: 'Fruit Juice' },
                  { key: 'milk', label: 'Milk' },
                ].map((f) => (
                  <label key={f.key} className={`official-choice-item ${formData.foodEaten[f.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.foodEaten[f.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        foodEaten: { ...formData.foodEaten, [f.key]: e.target.checked },
                      })}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>

              <div className="official-section-title">16.4 &amp; 16.5 Travel Time &amp; Mode</div>
              <div className="official-grid-2">
                <div className="official-grid-2">
                  <Input
                    type="number"
                    label="16.4 Travel Time to DCC (mins)"
                    value={formData.travelTimeToDCC}
                    onChange={(e) => setFormData({ ...formData, travelTimeToDCC: e.target.value })}
                  />
                  <div>
                    <label className="input-label">Mode to DCC</label>
                    <select
                      className="select-sm"
                      value={formData.modeToDCC}
                      onChange={(e) => setFormData({ ...formData, modeToDCC: e.target.value })}
                    >
                      <option value="Walking">Walking</option>
                      <option value="Private Vehicle">Private Vehicle</option>
                      <option value="Public Transportation">Public Transportation</option>
                    </select>
                  </div>
                </div>

                <div className="official-grid-2">
                  <Input
                    type="number"
                    label="16.5 Travel Time to NCDC (mins)"
                    value={formData.travelTimeToNCDC}
                    onChange={(e) => setFormData({ ...formData, travelTimeToNCDC: e.target.value })}
                  />
                  <div>
                    <label className="input-label">Mode to NCDC</label>
                    <select
                      className="select-sm"
                      value={formData.modeToNCDC}
                      onChange={(e) => setFormData({ ...formData, modeToNCDC: e.target.value })}
                    >
                      <option value="Walking">Walking</option>
                      <option value="Private Vehicle">Private Vehicle</option>
                      <option value="Public Transportation">Public Transportation</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="official-section-title">16.6 Public Transportation &amp; Goes to School with</div>
              <div className="official-grid-2">
                <div>
                  <label className="input-label">Public Transportation Type (if applicable)</label>
                  <div className="official-choice-group">
                    {['School bus', 'Jeep', 'Bus', 'Banca', 'Calesa', 'Tricycle', 'Pedicab', 'Habal-Habal', 'Others'].map((t) => (
                      <div
                        key={t}
                        className={`official-choice-item ${formData.publicTransportationType === t ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, publicTransportationType: t })}
                      >
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Goes to School with</label>
                  <div className="official-choice-group">
                    {['Mother', 'Father', 'Both Parents', 'Siblings', 'Relatives', 'Grandparents', 'Maid', 'None'].map((g) => (
                      <div
                        key={g}
                        className={`official-choice-item ${formData.goesToSchoolWith === g ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, goesToSchoolWith: g })}
                      >
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="official-signature-block">
                <div>
                  <Input
                    label="Name of Respondent *"
                    uppercase
                    value={formData.nameOfRespondent}
                    onChange={(e) => setFormData({ ...formData, nameOfRespondent: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Input
                    label="Name and Signature of CDT *"
                    value={formData.nameOfCDT}
                    onChange={(e) => setFormData({ ...formData, nameOfCDT: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraft}>
                <Save size={14} /> Save Draft
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <CheckCircle2 size={14} /> Save Official Form 2
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
