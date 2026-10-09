import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  X,
  User,
  Home,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { saveOfflineSurvey } from '../../services/offlineMappingStore';
import { useToast } from '../ui/Toast';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialForm1HomeProfileModal({
  isOpen,
  onClose,
  householdId,
  householdNo,
  onSuccess,
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('1a'); // '1a' (Father) | '1b' (Mother) | '1c' (Family)

  const [formData, setFormData] = useState({
    householdId: '',
    // -----------------------------------------------------------------------
    // FORM 1.A FATHER'S PROFILE
    // -----------------------------------------------------------------------
    father: {
      lastName: '',
      firstName: '',
      middleInitial: '',
      birthDate: '',
      age: '',
      civilStatus: 'Married', // Single, Married, Separated, Widower, Live-in
      district: 'District 1',
      purok: 'Purok 1',
      motherTongue: 'Tagalog', // Tagalog, Visayan, Ilocano, Bicolnon, Others
      motherTongueOthers: '',
      otherDialects: 'Kapampangan',
      educationalAttainment: 'High School /Graduate', // Elem./Graduate, High School /Graduate, College /Graduate, Technical/Vocational Graduate, Masteral Unit/Degree, Doctoral Unit/Degree
      occupationalStatus: 'Employed', // Employed, Unemployed, Retired, OFW, Others
      occupationalStatusOthers: '',
    },

    // -----------------------------------------------------------------------
    // FORM 1.B MOTHER'S PROFILE
    // -----------------------------------------------------------------------
    mother: {
      lastName: '',
      firstName: '',
      middleInitial: '',
      birthDate: '',
      age: '',
      district: 'District 1',
      purok: 'Purok 1',
      pregnant: 'No', // Yes / No
      civilStatus: 'Married',
      motherTongue: 'Tagalog',
      motherTongueOthers: '',
      otherDialects: 'Kapampangan',
      educationalAttainment: 'College /Graduate',
      occupationalStatus: 'Employed',
      occupationalStatusOthers: '',
      interestedAge: '3 years old', // Below 1 year old, 1 year old, 2 years old, 3 years old, 4 years old
    },

    // -----------------------------------------------------------------------
    // FORM 1.C FAMILY PROFILE (Home Profile)
    // -----------------------------------------------------------------------
    family: {
      ownership: 'Owned', // Owned, Rented, With parents, With relatives
      materials: 'Concrete', // Nipa, Wood, Concrete, Make shift
      nature: 'Multiple Rooms', // One Room, Multiple Rooms
      // Nature facilities
      withToilet: true,
      withOpenPlayArea: true,
      bedroom: true,
      diningRoom: true,
      sala: true,
      kitchen: true,

      // Utilities & Appliances
      runningWater: true,
      electricity: true,
      aircon: false,
      mobilePhone: true,
      computer: true,
      internet: true,
      cdDvdPlayer: false,
      television: true,
      radio: true,

      // Learning and Recreation
      magazinesComics: false,
      newspaper: false,
      books: true,
      storyBooks: true,
      boardGames: true,
      puzzles: true,
      toys: true,
      pets: true,

      // Persons Staying in Household
      immediateMembersCount: 4,
      relativesCount: 0,
      nonRelativesCount: 0,
    },

    // Metadata
    nameOfCDT: 'Maria C. Santos (CDW I)',
    dateConducted: getPhilippinesDate(),
  });

  // Load existing Form 1 data or prefill from Household / Children in store
  useEffect(() => {
    if (isOpen && householdId) {
      const existing = officialFormsService.getForm1Data(householdId);
      const household = centralDataStore.getHouseholdById(householdId);

      if (existing) {
        const existingMother = existing.mother || existing.motherProfile || {};
        const sanitizedMother = {
          ...existingMother,
          firstName: (existingMother.firstName === 'Rosa' || existingMother.firstName === 'ROSA') ? '' : (existingMother.firstName || ''),
        };
        setFormData((prev) => ({
          ...prev,
          ...existing,
          father: { ...prev.father, ...(existing.father || existing.fatherProfile) },
          mother: { ...prev.mother, ...sanitizedMother },
          family: { ...prev.family, ...(existing.family || existing.familyProfile) },
          householdId,
        }));
      } else if (household) {
        // Auto pre-populate: CAPTURE ONCE → REUSE EVERYWHERE!
        const parentName = household.parentGuardian || '';
        const nameParts = parentName.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const firstName = nameParts.length > 0 ? nameParts[0] : '';

        setFormData((prev) => ({
          ...prev,
          householdId,
          father: {
            ...prev.father,
            lastName,
            firstName: firstName,
            district: household.barangay || prev.father.district,
            purok: household.purok || prev.father.purok,
          },
          mother: {
            ...prev.mother,
            lastName: '',
            firstName: '',
            middleInitial: '',
            district: household.barangay || prev.mother.district,
            purok: household.purok || prev.mother.purok,
          },
          family: {
            ...prev.family,
            ownership: household.is4Ps ? 'Rented' : 'Owned',
          },
        }));
      }
    }
  }, [isOpen, householdId]);

  const handleSaveDraft = () => {
    officialFormsService.saveDraft(`FORM_1_${householdId}`, formData);
    addToast('Official Form 1 draft saved locally.', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    officialFormsService.saveForm1Data(householdId, formData);

    try {
      await saveOfflineSurvey({
        id: `FORM1-${householdId}`,
        householdId,
        type: 'official_form_1_home_profile',
        formData,
        syncStatus: isOnline ? 'synced' : 'pending',
      });
    } catch (err) {
      console.warn('Could not save Form 1 to IndexedDB:', err);
    }

    if (isOnline) {
      addToast('Official Form 1 (Home Profile) saved and synced to centralized records.', 'success');
    } else {
      addToast('Working offline: Official Form 1 saved to IndexedDB.', 'info');
    }
    if (onSuccess) onSuccess(formData);
    onClose();
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
          <h2 className="form-main-title">HOME PROFILE</h2>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Household Reference: <strong>{householdNo || householdId}</strong> • April 2014 Edition
          </div>
        </div>

        {/* Tab Stepper Bar */}
        <div className="official-stepper-bar">
          <button
            type="button"
            className={`official-step-btn ${activeTab === '1a' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('1a')}
          >
            <User size={14} />
            FORM 1.A FATHER'S PROFILE
          </button>
          <button
            type="button"
            className={`official-step-btn ${activeTab === '1b' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('1b')}
          >
            <User size={14} />
            FORM 1.B MOTHER'S PROFILE
          </button>
          <button
            type="button"
            className={`official-step-btn ${activeTab === '1c' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('1c')}
          >
            <Home size={14} />
            FORM 1.C FAMILY PROFILE
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* ===================================================================
              FORM 1.A FATHER'S PROFILE
              =================================================================== */}
          {activeTab === '1a' && (
            <div>
              <div className="official-section-title">1. Personal Information</div>
              <div className="official-grid-5">
                <Input
                  label="Last Name"
                  uppercase
                  value={formData.father.lastName}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, lastName: e.target.value.toUpperCase() } })}
                />
                <Input
                  label="First Name"
                  uppercase
                  value={formData.father.firstName}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, firstName: e.target.value.toUpperCase() } })}
                />
                <Input
                  label="Middle Initial"
                  uppercase
                  value={formData.father.middleInitial}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, middleInitial: e.target.value.toUpperCase() } })}
                />
                <Input
                  type="date"
                  label="Date of Birth"
                  value={formData.father.birthDate}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, birthDate: e.target.value } })}
                />
                <Input
                  type="number"
                  label="Age"
                  value={formData.father.age}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, age: e.target.value } })}
                />
              </div>

              <div className="official-section-title">2. Civil Status</div>
              <div className="official-choice-group">
                {['Single', 'Married', 'Separated', 'Widower', 'Live-in'].map((status) => (
                  <div
                    key={status}
                    className={`official-choice-item ${formData.father.civilStatus === status ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, father: { ...formData.father, civilStatus: status } })}
                  >
                    <span>{status}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">3. Address</div>
              <div className="official-grid-2">
                <Input
                  label="District"
                  value={formData.father.district}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, district: e.target.value } })}
                />
                <Input
                  label="Purok / Zone"
                  value={formData.father.purok}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, purok: e.target.value } })}
                />
              </div>

              <div className="official-section-title">4. Mother Tongue &amp; 5. Other Dialects</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-2)' }}>
                {['Tagalog', 'Visayan', 'Ilocano', 'Bicolnon', 'Others'].map((lang) => (
                  <div
                    key={lang}
                    className={`official-choice-item ${formData.father.motherTongue === lang ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, father: { ...formData.father, motherTongue: lang } })}
                  >
                    <span>{lang}</span>
                  </div>
                ))}
              </div>
              {formData.father.motherTongue === 'Others' && (
                <Input
                  label="Others, please specify"
                  value={formData.father.motherTongueOthers}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, motherTongueOthers: e.target.value } })}
                />
              )}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Input
                  label="5. Other dialects spoken at home. Please specify"
                  value={formData.father.otherDialects}
                  onChange={(e) => setFormData({ ...formData, father: { ...formData.father, otherDialects: e.target.value } })}
                  placeholder="e.g. Kapampangan"
                />
              </div>

              <div className="official-section-title">6. Educational Attainment</div>
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
                    className={`official-choice-item ${formData.father.educationalAttainment === edu ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, father: { ...formData.father, educationalAttainment: edu } })}
                  >
                    <span>{edu}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">7. Occupational Status</div>
              <div className="official-choice-group">
                {['Employed', 'Unemployed', 'Retired', 'OFW', 'Others'].map((occ) => (
                  <div
                    key={occ}
                    className={`official-choice-item ${formData.father.occupationalStatus === occ ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, father: { ...formData.father, occupationalStatus: occ } })}
                  >
                    <span>{occ}</span>
                  </div>
                ))}
              </div>
              {formData.father.occupationalStatus === 'Others' && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Input
                    label="Others, please specify"
                    value={formData.father.occupationalStatusOthers}
                    onChange={(e) => setFormData({ ...formData, father: { ...formData.father, occupationalStatusOthers: e.target.value } })}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              FORM 1.B MOTHER'S PROFILE
              =================================================================== */}
          {activeTab === '1b' && (
            <div>
              <div className="official-section-title">1. Personal Information</div>
              <div className="official-grid-5">
                <Input
                  label="Last Name"
                  uppercase
                  value={formData.mother.lastName}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, lastName: e.target.value.toUpperCase() } })}
                />
                <Input
                  label="First Name"
                  uppercase
                  value={formData.mother.firstName}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, firstName: e.target.value.toUpperCase() } })}
                />
                <Input
                  label="Middle Initial"
                  uppercase
                  value={formData.mother.middleInitial}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, middleInitial: e.target.value.toUpperCase() } })}
                />
                <Input
                  type="date"
                  label="Date of Birth"
                  value={formData.mother.birthDate}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, birthDate: e.target.value } })}
                />
                <Input
                  type="number"
                  label="Age"
                  value={formData.mother.age}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, age: e.target.value } })}
                />
              </div>

              <div className="official-grid-2" style={{ marginTop: 'var(--space-3)' }}>
                <div>
                  <label className="input-label">2. Pregnant?</label>
                  <div className="official-choice-group">
                    <div
                      className={`official-choice-item ${formData.mother.pregnant === 'Yes' ? 'is-selected' : ''}`}
                      onClick={() => setFormData({ ...formData, mother: { ...formData.mother, pregnant: 'Yes' } })}
                    >
                      <span>Yes</span>
                    </div>
                    <div
                      className={`official-choice-item ${formData.mother.pregnant === 'No' ? 'is-selected' : ''}`}
                      onClick={() => setFormData({ ...formData, mother: { ...formData.mother, pregnant: 'No' } })}
                    >
                      <span>No</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">3. Civil Status</label>
                  <div className="official-choice-group">
                    {['Single', 'Married', 'Separated', 'Widower', 'Live-in'].map((status) => (
                      <div
                        key={status}
                        className={`official-choice-item ${formData.mother.civilStatus === status ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, mother: { ...formData.mother, civilStatus: status } })}
                      >
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="official-section-title">Address</div>
              <div className="official-grid-2">
                <Input
                  label="District"
                  value={formData.mother.district}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, district: e.target.value } })}
                />
                <Input
                  label="Purok / Zone"
                  value={formData.mother.purok}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, purok: e.target.value } })}
                />
              </div>

              <div className="official-section-title">4. Mother Tongue &amp; 5. Other Dialects</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-2)' }}>
                {['Tagalog', 'Visayan', 'Ilocano', 'Bicolano', 'Others'].map((lang) => (
                  <div
                    key={lang}
                    className={`official-choice-item ${formData.mother.motherTongue === lang ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mother: { ...formData.mother, motherTongue: lang } })}
                  >
                    <span>{lang}</span>
                  </div>
                ))}
              </div>
              {formData.mother.motherTongue === 'Others' && (
                <Input
                  label="Others, please specify"
                  value={formData.mother.motherTongueOthers}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, motherTongueOthers: e.target.value } })}
                />
              )}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Input
                  label="5. Other dialects spoken at home. Please specify"
                  value={formData.mother.otherDialects}
                  onChange={(e) => setFormData({ ...formData, mother: { ...formData.mother, otherDialects: e.target.value } })}
                  placeholder="e.g. Kapampangan"
                />
              </div>

              <div className="official-section-title">6. Educational Attainment</div>
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
                    className={`official-choice-item ${formData.mother.educationalAttainment === edu ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mother: { ...formData.mother, educationalAttainment: edu } })}
                  >
                    <span>{edu}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">7. Occupational Status</div>
              <div className="official-choice-group">
                {['Employed', 'Unemployed', 'Retired', 'OFW', 'Others'].map((occ) => (
                  <div
                    key={occ}
                    className={`official-choice-item ${formData.mother.occupationalStatus === occ ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mother: { ...formData.mother, occupationalStatus: occ } })}
                  >
                    <span>{occ}</span>
                  </div>
                ))}
              </div>

              <div className="official-section-title">8. At what age are you interested to put your child in a Day Care Center?</div>
              <div className="official-choice-group">
                {['Below 1 year old', '1 year old', '2 years old', '3 years old', '4 years old'].map((ageOption) => (
                  <div
                    key={ageOption}
                    className={`official-choice-item ${formData.mother.interestedAge === ageOption ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mother: { ...formData.mother, interestedAge: ageOption } })}
                  >
                    <span>{ageOption}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              FORM 1.C FAMILY PROFILE (Home Profile)
              =================================================================== */}
          {activeTab === '1c' && (
            <div>
              <div className="official-section-title">1. Ownership &amp; 2. Materials</div>
              <div className="official-grid-2">
                <div>
                  <label className="input-label">1. Ownership</label>
                  <div className="official-choice-group">
                    {['Owned', 'Rented', 'With parents', 'With relatives'].map((opt) => (
                      <div
                        key={opt}
                        className={`official-choice-item ${formData.family.ownership === opt ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, family: { ...formData.family, ownership: opt } })}
                      >
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">2. Materials</label>
                  <div className="official-choice-group">
                    {['Nipa', 'Wood', 'Concrete', 'Make shift'].map((mat) => (
                      <div
                        key={mat}
                        className={`official-choice-item ${formData.family.materials === mat ? 'is-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, family: { ...formData.family, materials: mat } })}
                      >
                        <span>{mat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="official-section-title">3. Nature of House &amp; Rooms</div>
              <div className="official-choice-group" style={{ marginBottom: 'var(--space-3)' }}>
                {['One Room', 'Multiple Rooms'].map((roomType) => (
                  <div
                    key={roomType}
                    className={`official-choice-item ${formData.family.nature === roomType ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, family: { ...formData.family, nature: roomType } })}
                  >
                    <strong>{roomType}</strong>
                  </div>
                ))}
              </div>

              <div className="official-grid-3">
                <label className="official-choice-item is-selected">
                  <input
                    type="checkbox"
                    checked={formData.family.withToilet}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, withToilet: e.target.checked } })}
                  />
                  <span>With Toilet</span>
                </label>
                <label className="official-choice-item is-selected">
                  <input
                    type="checkbox"
                    checked={formData.family.withOpenPlayArea}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, withOpenPlayArea: e.target.checked } })}
                  />
                  <span>With Open Play Area</span>
                </label>
                <label className="official-choice-item">
                  <input
                    type="checkbox"
                    checked={formData.family.bedroom}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, bedroom: e.target.checked } })}
                  />
                  <span>With Bedroom</span>
                </label>
                <label className="official-choice-item">
                  <input
                    type="checkbox"
                    checked={formData.family.diningRoom}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, diningRoom: e.target.checked } })}
                  />
                  <span>With Dining Room</span>
                </label>
                <label className="official-choice-item">
                  <input
                    type="checkbox"
                    checked={formData.family.sala}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, sala: e.target.checked } })}
                  />
                  <span>With Sala</span>
                </label>
                <label className="official-choice-item">
                  <input
                    type="checkbox"
                    checked={formData.family.kitchen}
                    onChange={(e) => setFormData({ ...formData, family: { ...formData.family, kitchen: e.target.checked } })}
                  />
                  <span>With Kitchen</span>
                </label>
              </div>

              <div className="official-section-title">4. Utilities and Appliances</div>
              <div className="official-grid-3">
                {[
                  { key: 'runningWater', label: 'With running water' },
                  { key: 'electricity', label: 'With electricity' },
                  { key: 'aircon', label: 'With aircon' },
                  { key: 'mobilePhone', label: 'With mobile phone' },
                  { key: 'computer', label: 'With computer' },
                  { key: 'internet', label: 'With internet' },
                  { key: 'cdDvdPlayer', label: 'With CD/DVD player' },
                  { key: 'television', label: 'With Television' },
                  { key: 'radio', label: 'With radio' },
                ].map((item) => (
                  <label key={item.key} className={`official-choice-item ${formData.family[item.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.family[item.key]}
                      onChange={(e) => setFormData({ ...formData, family: { ...formData.family, [item.key]: e.target.checked } })}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="official-section-title">5. Learning and Recreation / Fun &amp; Games</div>
              <div className="official-grid-4">
                {[
                  { key: 'magazinesComics', label: 'Magazines/comics' },
                  { key: 'newspaper', label: 'Newspaper' },
                  { key: 'books', label: 'Books' },
                  { key: 'storyBooks', label: 'Story/picture books' },
                  { key: 'boardGames', label: 'Board Games' },
                  { key: 'puzzles', label: 'Puzzles' },
                  { key: 'toys', label: 'Toys' },
                  { key: 'pets', label: 'Pets' },
                ].map((item) => (
                  <label key={item.key} className={`official-choice-item ${formData.family[item.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!formData.family[item.key]}
                      onChange={(e) => setFormData({ ...formData, family: { ...formData.family, [item.key]: e.target.checked } })}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="official-section-title">6. Persons Staying in the Same Household</div>
              <div className="official-grid-3">
                <Input
                  type="number"
                  label="Immediate Family Member (Father, Mother, Siblings)"
                  value={formData.family.immediateMembersCount}
                  onChange={(e) => setFormData({ ...formData, family: { ...formData.family, immediateMembersCount: parseInt(e.target.value) || 0 } })}
                />
                <Input
                  type="number"
                  label="Relatives (Aunts, Uncles, Grandparents)"
                  value={formData.family.relativesCount}
                  onChange={(e) => setFormData({ ...formData, family: { ...formData.family, relativesCount: parseInt(e.target.value) || 0 } })}
                />
                <Input
                  type="number"
                  label="Non-Relatives (Household help / Nanny)"
                  value={formData.family.nonRelativesCount}
                  onChange={(e) => setFormData({ ...formData, family: { ...formData.family, nonRelativesCount: parseInt(e.target.value) || 0 } })}
                />
              </div>

              <div className="official-signature-block">
                <div>
                  <Input
                    label="Name and Signature of CDT *"
                    value={formData.nameOfCDT}
                    onChange={(e) => setFormData({ ...formData, nameOfCDT: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    label="Date Conducted *"
                    value={formData.dateConducted}
                    onChange={(e) => setFormData({ ...formData, dateConducted: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {activeTab === '1b' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('1a')}>
                  <ArrowLeft size={14} /> Back to Father's Profile
                </Button>
              )}
              {activeTab === '1c' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('1b')}>
                  <ArrowLeft size={14} /> Back to Mother's Profile
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraft}>
                <Save size={14} /> Save Draft
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {activeTab === '1a' && (
                <Button type="button" variant="primary" size="sm" onClick={() => setActiveTab('1b')}>
                  Next: Mother's Profile <ArrowRight size={14} />
                </Button>
              )}
              {activeTab === '1b' && (
                <Button type="button" variant="primary" size="sm" onClick={() => setActiveTab('1c')}>
                  Next: Family Profile <ArrowRight size={14} />
                </Button>
              )}
              {activeTab === '1c' && (
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 size={14} /> Save Official Form 1 (Home Profile)
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
