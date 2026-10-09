import React, { useState, useEffect } from 'react';
import {
  School,
  Save,
  CheckCircle2,
  X,
  Building,
  Award,
  BookOpen,
  Printer,
  Calendar,
  Users,
  Layers,
  MapPin,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { communityService } from '../../services/communityService';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';
import { useToast } from '../ui/Toast';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialForm7CenterProfileModal({
  isOpen,
  onClose,
  centerId,
  onSuccess,
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('centerInfo'); // 'centerInfo' | 'services' | 'facilities'

  // Form State matching Official Form 7 (April 2014, 2 pages)
  const [formData, setFormData] = useState({
    // 1. Name & Year Established
    centerName: '',
    yearEstablished: '2015',

    // 2. Address & Contacts
    addressNo: '',
    addressStreet: '',
    addressBarangay: 'San Isidro',
    addressCity: 'City of San Fernando',
    addressProvince: 'Pampanga',
    addressRegion: 'Region III - Central Luzon',
    telephoneNos: '(045) 961-4567',
    faxNo: '',
    emailAdd: '',

    // 3. Status of the Center
    centerStatus: 'Accredited', // Accredited, Not Accredited, Accredited but Expired
    dateAccredited: '2024-01-10',
    accreditationNo: 'CDC-2024-012',
    accreditationLevel: '3', // 1, 2, 3

    // 4. Number of Child Development Workers
    numberOfCDWs: '2',

    // 5. Services Offered
    servicesOffered: {
      supplementalParentalCare: true,
      guidingChildrenBehavior: true,
      healthRelatedActivities: true,
      nutritionalCare: true,
      supplementalFeeding: true,
      inculcatingCharacterValues: true,
      earlyLearning: true,
      playSocialization: true,
      childSafetyProtection: true,
      others: '',
    },

    // 6. Available Facilities
    facilities: {
      cdwTable: true,
      toilet: true,
      playArea: true,
      napArea: true,
      classroom: true,
      others: '',
    },

    // 7. Utilities / Services Offered
    utilities: {
      electricity: true,
      runningWater: true,
      potableWater: true,
      growthMeasurement: true,
      feedingFacilities: true,
      playground: true,
      securedDoorsWindows: true,
      firstAidKit: true,
      pwdAccessibility: true,
      computer: true,
      others: '',
    },

    // 8. Available Equipment and Learning Materials
    learningMaterials: {
      audioVideo: true,
      musicalInstrument: true,
      manipulativeToys: true,
      childrensBooks: true,
      readingMaterials: true,
      coloringBooks: true,
      others: '',
    },

    // Signatures
    cdwNamePrint: 'Maritess S. Pangilinan',
    dateConducted: getPhilippinesDate(),
  });

  // Load existing data if centerId provided, or reset for registration
  useEffect(() => {
    if (centerId && centerId !== 'new' && isOpen) {
      const center = centralDataStore.getDayCareCenterById(centerId);
      const existingForm7 = officialFormsService.getForm7Data(centerId);

      if (existingForm7) {
        setFormData(existingForm7);
      } else if (center) {
        // Pre-fill from central Day Care Center record (Capture Once -> Reuse Everywhere)
        setFormData((prev) => ({
          ...prev,
          centerName: center.name,
          addressBarangay: center.barangay || 'San Isidro',
          numberOfCDWs: String(center.assignedWorkers?.length || 2),
          accreditationNo: center.accreditationNo || 'CDC-2024-012',
          accreditationLevel: String(center.accreditationLevel?.replace(/\D/g, '') || '3'),
          cdwNamePrint: center.assignedWorkers?.[0] || 'Maritess S. Pangilinan',
        }));
      }
    } else if (isOpen && (!centerId || centerId === 'new')) {
      // Clean form for registering a new CDC
      setFormData((prev) => ({
        ...prev,
        centerName: '',
        yearEstablished: '2020',
        addressNo: '',
        addressStreet: '',
        addressBarangay: 'Sindalan',
        telephoneNos: '',
        faxNo: '',
        emailAdd: '',
        accreditationNo: `CDC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        accreditationLevel: '3',
        centerStatus: 'Accredited',
        dateAccredited: getPhilippinesDate(),
        numberOfCDWs: '1',
      }));
    }
  }, [centerId, isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedToggle = (parent, field) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: !prev[parent][field],
      },
    }));
  };

  const handleNestedText = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!formData.centerName.trim()) {
      addToast('Please enter the Child Development Center Name.', 'error');
      return;
    }

    const targetId = centerId && centerId !== 'new' ? centerId : `CDC-${Date.now()}`;

    // Save to centralDataStore
    const savedCenter = centralDataStore.createDayCareCenter({
      id: targetId,
      name: formData.centerName.trim(),
      barangay: formData.addressBarangay,
      barangayName: formData.addressBarangay,
      address: formData.addressStreet
        ? `${formData.addressNo || ''} ${formData.addressStreet}, ${formData.addressBarangay}, ${formData.addressCity}`.trim()
        : `Barangay Hall Compound, ${formData.addressBarangay}, City of San Fernando, Pampanga`,
      capacity: 60,
      status: `${formData.centerStatus} (Level ${formData.accreditationLevel || '3'})`,
      accreditationLevel: `Level ${formData.accreditationLevel || '3'}`,
      accreditationNo: formData.accreditationNo,
      accreditationValidUntil: '2027-12-31',
    });

    officialFormsService.saveForm7Data(targetId, formData);

    // Sync with backend API
    communityService.createCenter({
      id: targetId,
      centerName: formData.centerName.trim(),
      addressBarangay: formData.addressBarangay,
      address: savedCenter.address,
      centerStatus: formData.centerStatus,
      accreditationLevel: `Level ${formData.accreditationLevel || '3'}`,
    }).catch(() => {});

    addToast('Official Form 7 (CDC Profile) saved successfully.', 'success');
    if (onSuccess) onSuccess(savedCenter);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="official-form-modal"
    >
      <div className="official-form7-modal" style={{ padding: '0.25rem' }}>
        {/* Government Header Banner */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #7e191b', paddingBottom: '12px', marginBottom: '16px', paddingRight: '40px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#795d5f', fontWeight: 'bold' }}>
            Early Childhood Care and Development Council
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
            <span style={{ fontSize: '11px', color: '#795d5f' }}>April 2014</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1112', margin: 0 }}>
              FORM 7 – CHILD DEVELOPMENT CENTER PROFILE
            </h2>
            <span style={{ fontSize: '11px', color: '#795d5f' }}>Page {activeTab === 'centerInfo' ? '1' : '2'} of 2</span>
          </div>
          <div style={{ fontSize: '11px', color: '#ba1607' }}>
            DSWD / CSWDO San Fernando Child Development Center Accreditation & Facility Profile
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f0e4e3', paddingBottom: '8px' }} className="no-print">
          <button
            type="button"
            className={`btn-tab ${activeTab === 'centerInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('centerInfo')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'centerInfo' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'centerInfo' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'centerInfo' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'centerInfo' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            1. Center Details & Accreditation
          </button>
          <button
            type="button"
            className={`btn-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'services' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'services' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'services' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'services' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            2. Services & Facilities
          </button>
          <button
            type="button"
            className={`btn-tab ${activeTab === 'facilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('facilities')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'facilities' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'facilities' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'facilities' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'facilities' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            3. Utilities & Learning Materials
          </button>
        </div>

        {/* Form Body Content Area */}
        <div style={{ paddingRight: '6px' }}>
          {/* =========================================================================
              TAB 1: CENTER DETAILS & ACCREDITATION (Form 7 Page 1 Top)
              ========================================================================= */}
          {activeTab === 'centerInfo' && (
            <div>
              {/* 1. Name & Year Established */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    1. Name of Child Development Center *
                  </label>
                  <Input
                    value={formData.centerName}
                    onChange={(e) => handleFieldChange('centerName', e.target.value)}
                    placeholder="Name of Center"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    Year Established
                  </label>
                  <Input
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => handleFieldChange('yearEstablished', e.target.value)}
                    placeholder="YYYY"
                  />
                </div>
              </div>

              {/* 2. Address */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                  2. Address & Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                  <Input
                    placeholder="No."
                    value={formData.addressNo}
                    onChange={(e) => handleFieldChange('addressNo', e.target.value)}
                  />
                  <Input
                    placeholder="Street"
                    value={formData.addressStreet}
                    onChange={(e) => handleFieldChange('addressStreet', e.target.value)}
                  />
                  <Select
                    value={formData.addressBarangay}
                    onChange={(e) => handleFieldChange('addressBarangay', e.target.value)}
                    options={SAN_FERNANDO_BARANGAYS.map((b) => ({ value: b, label: b }))}
                  />
                  <Input
                    placeholder="City / Municipality"
                    value={formData.addressCity}
                    onChange={(e) => handleFieldChange('addressCity', e.target.value)}
                  />
                  <Input
                    placeholder="Province"
                    value={formData.addressProvince}
                    onChange={(e) => handleFieldChange('addressProvince', e.target.value)}
                  />
                  <Input
                    placeholder="Region"
                    value={formData.addressRegion}
                    onChange={(e) => handleFieldChange('addressRegion', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Telephone Nos."
                    value={formData.telephoneNos}
                    onChange={(e) => handleFieldChange('telephoneNos', e.target.value.replace(/\D/g, ''))}
                  />
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Fax No."
                    value={formData.faxNo}
                    onChange={(e) => handleFieldChange('faxNo', e.target.value.replace(/\D/g, ''))}
                  />
                  <Input
                    placeholder="Email Add."
                    value={formData.emailAdd}
                    onChange={(e) => handleFieldChange('emailAdd', e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Status of the Center & 4. Number of CDWs */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                    3. Status of the Center
                  </label>
                  <Select
                    value={formData.centerStatus}
                    onChange={(e) => handleFieldChange('centerStatus', e.target.value)}
                    options={[
                      { value: 'Accredited', label: 'Accredited' },
                      { value: 'Not Accredited', label: 'Not Accredited' },
                      { value: 'Accredited but Expired', label: 'Accredited but Expired' },
                    ]}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                    <Input
                      type="date"
                      value={formData.dateAccredited}
                      onChange={(e) => handleFieldChange('dateAccredited', e.target.value)}
                      title="Date Accredited"
                    />
                    <Input
                      placeholder="Accreditation No."
                      value={formData.accreditationNo}
                      onChange={(e) => handleFieldChange('accreditationNo', e.target.value)}
                    />
                    <Select
                      value={formData.accreditationLevel}
                      onChange={(e) => handleFieldChange('accreditationLevel', e.target.value)}
                      options={[
                        { value: '1', label: 'Level 1' },
                        { value: '2', label: 'Level 2' },
                        { value: '3', label: 'Level 3' },
                      ]}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                    4. Number of CDWs in Center
                  </label>
                  <Input
                    type="number"
                    value={formData.numberOfCDWs}
                    onChange={(e) => handleFieldChange('numberOfCDWs', e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Centralized roster assigns verified CDWs to this accredited site.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SERVICES OFFERED & FACILITIES (Form 7 Page 1 Bottom)
              ========================================================================= */}
          {activeTab === 'services' && (
            <div>
              {/* 5. Services Offered */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                  5. Services Offered:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.supplementalParentalCare}
                      onChange={() => handleNestedToggle('servicesOffered', 'supplementalParentalCare')}
                    />
                    Supplemental Parental Care
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.nutritionalCare}
                      onChange={() => handleNestedToggle('servicesOffered', 'nutritionalCare')}
                    />
                    Nutritional Care
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.earlyLearning}
                      onChange={() => handleNestedToggle('servicesOffered', 'earlyLearning')}
                    />
                    Early Learning
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.guidingChildrenBehavior}
                      onChange={() => handleNestedToggle('servicesOffered', 'guidingChildrenBehavior')}
                    />
                    Guiding Children’s Behavior
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.supplementalFeeding}
                      onChange={() => handleNestedToggle('servicesOffered', 'supplementalFeeding')}
                    />
                    Supplemental Feeding
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.playSocialization}
                      onChange={() => handleNestedToggle('servicesOffered', 'playSocialization')}
                    />
                    Play & Socialization
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.healthRelatedActivities}
                      onChange={() => handleNestedToggle('servicesOffered', 'healthRelatedActivities')}
                    />
                    Health Related Activities
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.inculcatingCharacterValues}
                      onChange={() => handleNestedToggle('servicesOffered', 'inculcatingCharacterValues')}
                    />
                    Inculcating Character & Values
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.servicesOffered.childSafetyProtection}
                      onChange={() => handleNestedToggle('servicesOffered', 'childSafetyProtection')}
                    />
                    Child Safety & Protection
                  </label>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Others, pls. specify"
                    value={formData.servicesOffered.others}
                    onChange={(e) => handleNestedText('servicesOffered', 'others', e.target.value)}
                  />
                </div>
              </div>

              {/* 6. Available Facilities */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                  6. Available Facilities:
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.cdwTable}
                      onChange={() => handleNestedToggle('facilities', 'cdwTable')}
                    />
                    CDW Table
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.toilet}
                      onChange={() => handleNestedToggle('facilities', 'toilet')}
                    />
                    Toilet
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.playArea}
                      onChange={() => handleNestedToggle('facilities', 'playArea')}
                    />
                    Play Area
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.napArea}
                      onChange={() => handleNestedToggle('facilities', 'napArea')}
                    />
                    Nap Area
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.classroom}
                      onChange={() => handleNestedToggle('facilities', 'classroom')}
                    />
                    Classroom
                  </label>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Others, pls. specify"
                    value={formData.facilities.others}
                    onChange={(e) => handleNestedText('facilities', 'others', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: UTILITIES & LEARNING MATERIALS (Form 7 Page 2)
              ========================================================================= */}
          {activeTab === 'facilities' && (
            <div>
              {/* 7. Utilities / Services Offered */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                  7. Utilities / Services Offered:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.electricity}
                      onChange={() => handleNestedToggle('utilities', 'electricity')}
                    />
                    Electricity
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.feedingFacilities}
                      onChange={() => handleNestedToggle('utilities', 'feedingFacilities')}
                    />
                    Feeding Facilities & Utensils
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.firstAidKit}
                      onChange={() => handleNestedToggle('utilities', 'firstAidKit')}
                    />
                    First Aid Kit
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.runningWater}
                      onChange={() => handleNestedToggle('utilities', 'runningWater')}
                    />
                    Running Water
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.playground}
                      onChange={() => handleNestedToggle('utilities', 'playground')}
                    />
                    Playground w/ Equipment
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.pwdAccessibility}
                      onChange={() => handleNestedToggle('utilities', 'pwdAccessibility')}
                    />
                    Structure for Accessibility - PWD
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.potableWater}
                      onChange={() => handleNestedToggle('utilities', 'potableWater')}
                    />
                    Potable Water
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.securedDoorsWindows}
                      onChange={() => handleNestedToggle('utilities', 'securedDoorsWindows')}
                    />
                    Secured Doors & Windows
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.computer}
                      onChange={() => handleNestedToggle('utilities', 'computer')}
                    />
                    Computer
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.utilities.growthMeasurement}
                      onChange={() => handleNestedToggle('utilities', 'growthMeasurement')}
                    />
                    Facilities & Eqpt. To Measure Child’s Growth
                  </label>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Others, pls. specify"
                    value={formData.utilities.others}
                    onChange={(e) => handleNestedText('utilities', 'others', e.target.value)}
                  />
                </div>
              </div>

              {/* 8. Available Equipment and Learning Materials */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                  8. Available Equipment and Learning Materials:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.audioVideo}
                      onChange={() => handleNestedToggle('learningMaterials', 'audioVideo')}
                    />
                    Audio/Video Materials
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.manipulativeToys}
                      onChange={() => handleNestedToggle('learningMaterials', 'manipulativeToys')}
                    />
                    Manipulative Toys
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.readingMaterials}
                      onChange={() => handleNestedToggle('learningMaterials', 'readingMaterials')}
                    />
                    Reading Materials
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.musicalInstrument}
                      onChange={() => handleNestedToggle('learningMaterials', 'musicalInstrument')}
                    />
                    Musical Instrument
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.childrensBooks}
                      onChange={() => handleNestedToggle('learningMaterials', 'childrensBooks')}
                    />
                    Children’s Books
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.learningMaterials.coloringBooks}
                      onChange={() => handleNestedToggle('learningMaterials', 'coloringBooks')}
                    />
                    Coloring Books
                  </label>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Other CDC Learning Materials, pls. specify"
                    value={formData.learningMaterials.others}
                    onChange={(e) => handleNestedText('learningMaterials', 'others', e.target.value)}
                  />
                </div>
              </div>

              {/* Signatures */}
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ minWidth: '220px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Name in Print (CDW):</label>
                  <Input
                    value={formData.cdwNamePrint}
                    onChange={(e) => handleFieldChange('cdwNamePrint', e.target.value)}
                  />
                </div>
                <div style={{ minWidth: '160px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Date Conducted:</label>
                  <Input
                    type="date"
                    value={formData.dateConducted}
                    onChange={(e) => handleFieldChange('dateConducted', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }} className="no-print">
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print Form 7
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>
              Save Center Profile
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default OfficialForm7CenterProfileModal;
