import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  X,
  UserCheck,
  Award,
  BookOpen,
  Briefcase,
  Clock,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { useToast } from '../ui/Toast';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialForm6WorkerProfileModal({
  isOpen,
  onClose,
  workerId,
  onSuccess,
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'work' | 'conditions'

  // Form State matching Official Form 6 (April 2014, 3 pages)
  const [formData, setFormData] = useState({
    // I. CDW Personal Information
    lastName: '',
    firstName: '',
    middleName: '',
    age: '',
    sex: 'Female',
    birthday: '',
    religion: 'Roman Catholic',
    ethnicity: 'Tagalog',
    civilStatus: 'Married', // Single, Married, Separated, Widow/Widower, Live in
    noChildren: '2',
    addressNo: '',
    addressStreet: '',
    addressBarangay: 'San Isidro',
    addressCity: 'City of San Fernando',
    addressProvince: 'Pampanga',
    addressRegion: 'Region III - Central Luzon',
    contactHome: '',
    contactOffice: '(045) 961-2345',
    contactMobile: '0917-123-4567',
    contactFax: '',
    email: '',
    educationalBackground: 'College Graduate', // Elem. Undergrad, Elem. Grad, HS Undergrad, HS Grad, College Undergrad, College Grad, With Masteral Units, Post Grad, Vocational
    degree: 'Bachelor of Elementary Education (BEED) - Early Childhood Education',
    eligibility: 'Licensure Examination for Teachers', // CS Sub-Prof, CS Prof, LET, None, Others
    eligibilityOthers: '',

    // II. Work-Related Information
    yearsAsCDW: '5',
    centerBeingServed: 'San Isidro Day Care Center',
    monthlyCompensation: {
      salary: false,
      honoraria: true,
      allowance: true,
      parentsContribution: false,
    },
    totalAmountCompensation: '12,500',
    sourceCompensation: {
      barangay: '3,500',
      cityMunicipal: '8,000',
      ngos: '',
      parents: '1,000',
      others: '',
    },
    termsOfEmployment: 'Contract of Service', // Plantilla, Contract of Service, Casual, Co-Terminus w/ Hiring Authority, Voluntary
    trainings: [
      { title: 'Standard ECCD Curriculum Training', dates: 'May 12-16, 2024', hours: '40', sponsoredBy: 'ECCD Council / CSWDO' },
      { title: 'Early Language and Literacy Instruction', dates: 'Oct 04-06, 2024', hours: '24', sponsoredBy: 'DepEd Pampanga' },
      { title: 'Positive Child Guidance & Safeguarding', dates: 'Jan 18, 2025', hours: '8', sponsoredBy: 'CSWDO San Fernando' },
      { title: 'Growth Monitoring & Nutrition Assessment', dates: 'Mar 15, 2025', hours: '8', sponsoredBy: 'City Health Office' },
    ],
    otherCourses: [
      { course: 'Certificate in Pre-School Education', yearCompleted: '2021' },
      { course: 'First Aid & Pediatric CPR', yearCompleted: '2023' },
    ],
    accreditationStatus: 'Accredited', // Accredited, Not Accredited, Accredited but Expired
    dateAccredited: '2024-03-15',
    accreditationNo: 'CDW-2024-089',
    accreditationLevel: '2', // 1, 2, 3

    // III. Working Conditions
    childrenBeingServed: '42',
    sessionsPerDay: '2', // 1, 2, 3, 4
    hoursPerSession: '2 ½', // 1 hr., 2 hrs., 2 ½, 3
    agesHandled: {
      below1: false,
      age1: false,
      age2: false,
      age3: true,
      age4: true,
    },
    hoursStayingInCenter: '8 hours', // 1-2 hrs., 2 ½ - 3 hrs., 4-5 hrs., 6-7 hrs., 8 hours
    howSessionsConducted: 'With reference materials', // With reference materials, Without reference materials
    cdwNamePrint: '',
    dateConducted: getPhilippinesDate(),
  });

  // Load existing worker data if workerId provided
  useEffect(() => {
    if (workerId && isOpen) {
      const worker = centralDataStore.getWorkerById(workerId);
      const existingForm6 = officialFormsService.getForm6Data(workerId);

      if (existingForm6) {
        setFormData(existingForm6);
      } else if (worker) {
        // Pre-fill from central worker profile (Capture Once -> Reuse Everywhere)
        const nameParts = worker.name.split(' ');
        const lName = nameParts[nameParts.length - 1] || '';
        const fName = nameParts.slice(0, nameParts.length - 1).join(' ') || worker.name;

        setFormData((prev) => ({
          ...prev,
          lastName: lName,
          firstName: fName,
          centerBeingServed: worker.assignedCenters?.[0] || 'San Isidro Day Care Center',
          addressBarangay: worker.assignedBarangay || 'San Isidro',
          contactMobile: worker.contactNumber || prev.contactMobile,
          email: worker.email || prev.email,
          yearsAsCDW: String(worker.yearsOfService || 5),
          accreditationNo: worker.accreditationNo || 'CDW-2024-089',
          cdwNamePrint: worker.name,
        }));
      }
    }
  }, [workerId, isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedFieldChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleTrainingChange = (index, field, value) => {
    setFormData((prev) => {
      const newTrainings = [...prev.trainings];
      newTrainings[index] = { ...newTrainings[index], [field]: value };
      return { ...prev, trainings: newTrainings };
    });
  };

  const handleSave = () => {
    // Prevent duplicate worker records: check by name and barangay if new
    if (!workerId) {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim().toLowerCase();
      const existing = centralDataStore.getWorkers().find(
        (w) => w.name.toLowerCase() === fullName && w.assignedBarangay.toLowerCase() === formData.addressBarangay.toLowerCase()
      );
      if (existing) {
        addToast(`Worker record already exists for ${formData.firstName} ${formData.lastName}. Updated existing profile.`, 'info');
        officialFormsService.saveForm6Data(existing.id, formData);
        if (onSuccess) onSuccess(existing);
        onClose();
        return;
      }
    }

    const targetId = workerId || `WKR-${Date.now()}`;
    officialFormsService.saveForm6Data(targetId, formData);
    addToast('Official Form 6 (CDW Profile) saved successfully.', 'success');
    if (onSuccess) onSuccess(formData);
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
      <div className="official-form6-modal" style={{ padding: '0.25rem' }}>
        {/* Government Header Banner */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #7e191b', paddingBottom: '12px', marginBottom: '16px', paddingRight: '40px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#795d5f', fontWeight: 'bold' }}>
            Early Childhood Care and Development Council
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
            <span style={{ fontSize: '11px', color: '#795d5f' }}>April 2014</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1112', margin: 0 }}>
              FORM 6 – CHILD DEVELOPMENT WORKER PROFILE
            </h2>
            <span style={{ fontSize: '11px', color: '#795d5f' }}>Page {activeTab === 'personal' ? '1' : activeTab === 'work' ? '2' : '3'} of 3</span>
          </div>
          <div style={{ fontSize: '11px', color: '#ba1607' }}>
            DSWD / CSWDO San Fernando Child Development Worker Official Accreditation Record
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f0e4e3', paddingBottom: '8px' }} className="no-print">
          <button
            type="button"
            className={`btn-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'personal' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'personal' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'personal' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'personal' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            I. Personal Information
          </button>
          <button
            type="button"
            className={`btn-tab ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'work' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'work' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'work' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'work' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            II. Work-Related Information
          </button>
          <button
            type="button"
            className={`btn-tab ${activeTab === 'conditions' ? 'active' : ''}`}
            onClick={() => setActiveTab('conditions')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === 'conditions' ? '1px solid #7e191b' : '1px solid #dfcecd',
              background: activeTab === 'conditions' ? 'linear-gradient(135deg, #7e191b, #ba1607)' : '#f8f2f2',
              color: activeTab === 'conditions' ? '#fff' : '#4a3436',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === 'conditions' ? '0 2px 6px rgba(126, 25, 27, 0.25)' : 'none',
            }}
          >
            III. Working Conditions
          </button>
        </div>

        {/* Form Body Content Area */}
        <div style={{ paddingRight: '6px' }}>
          {/* =========================================================================
              TAB 1: PERSONAL INFORMATION (Page 1)
              ========================================================================= */}
          {activeTab === 'personal' && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '12px', borderLeft: '3px solid #7e191b', paddingLeft: '8px' }}>
                I. Child Development Worker Personal Information
              </div>

              {/* Name & Basic Demographics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Last Name *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>First Name *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Middle Name</label>
                  <Input
                    value={formData.middleName}
                    onChange={(e) => handleFieldChange('middleName', e.target.value)}
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Age</label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleFieldChange('age', e.target.value)}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Sex</label>
                  <Select
                    value={formData.sex}
                    onChange={(e) => handleFieldChange('sex', e.target.value)}
                    options={[
                      { value: 'Female', label: 'Female' },
                      { value: 'Male', label: 'Male' },
                    ]}
                  />
                </div>
              </div>

              {/* Birthday, Religion, Ethnicity, Civil Status, No. Children */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Birthday</label>
                  <Input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleFieldChange('birthday', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Religion</label>
                  <Input
                    value={formData.religion}
                    onChange={(e) => handleFieldChange('religion', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Ethnicity</label>
                  <Input
                    value={formData.ethnicity}
                    onChange={(e) => handleFieldChange('ethnicity', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Civil Status</label>
                  <Select
                    value={formData.civilStatus}
                    onChange={(e) => handleFieldChange('civilStatus', e.target.value)}
                    options={[
                      { value: 'Single', label: 'Single' },
                      { value: 'Married', label: 'Married' },
                      { value: 'Separated', label: 'Separated' },
                      { value: 'Widow/Widower', label: 'Widow/Widower' },
                      { value: 'Live in', label: 'Live in' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>No. Children</label>
                  <Input
                    type="number"
                    value={formData.noChildren}
                    onChange={(e) => handleFieldChange('noChildren', e.target.value)}
                  />
                </div>
              </div>

              {/* Address (No, Street, Subdivision/Barangay, City, Province, Region) */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>Address</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
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
                  <Input
                    placeholder="Subdivision / Barangay"
                    value={formData.addressBarangay}
                    onChange={(e) => handleFieldChange('addressBarangay', e.target.value)}
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
              </div>

              {/* Contact Details */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>Contact Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  <Input
                    placeholder="Home Nos."
                    value={formData.contactHome}
                    onChange={(e) => handleFieldChange('contactHome', e.target.value)}
                  />
                  <Input
                    placeholder="Office Nos."
                    value={formData.contactOffice}
                    onChange={(e) => handleFieldChange('contactOffice', e.target.value)}
                  />
                  <Input
                    placeholder="Mobile Nos."
                    value={formData.contactMobile}
                    onChange={(e) => handleFieldChange('contactMobile', e.target.value)}
                  />
                  <Input
                    placeholder="Fax Number"
                    value={formData.contactFax}
                    onChange={(e) => handleFieldChange('contactFax', e.target.value)}
                  />
                  <Input
                    placeholder="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Educational Background & Eligibility */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>Educational Background</label>
                  <Select
                    value={formData.educationalBackground}
                    onChange={(e) => handleFieldChange('educationalBackground', e.target.value)}
                    options={[
                      { value: 'Elem. Undergraduate', label: 'Elem. Undergraduate' },
                      { value: 'Elem. Graduate', label: 'Elem. Graduate' },
                      { value: 'HS Undergraduate', label: 'HS Undergraduate' },
                      { value: 'HS Graduate', label: 'HS Graduate' },
                      { value: 'College Undergraduate', label: 'College Undergraduate' },
                      { value: 'College Graduate', label: 'College Graduate' },
                      { value: 'With Masteral Units', label: 'With Masteral Units' },
                      { value: 'Post Graduate', label: 'Post Graduate' },
                      { value: 'Vocational', label: 'Vocational' },
                    ]}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Degree (if College Graduate)</label>
                    <Input
                      value={formData.degree}
                      onChange={(e) => handleFieldChange('degree', e.target.value)}
                      placeholder="e.g., BEED Early Childhood Education"
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>Civil Service / Professional Eligibility</label>
                  <Select
                    value={formData.eligibility}
                    onChange={(e) => handleFieldChange('eligibility', e.target.value)}
                    options={[
                      { value: 'Civil Service Sub-Professional', label: 'Civil Service Sub-Professional' },
                      { value: 'Civil Service Professional', label: 'Civil Service Professional' },
                      { value: 'Licensure Examination for Teachers', label: 'Licensure Examination for Teachers (LET)' },
                      { value: 'None', label: 'None' },
                      { value: 'Others', label: 'Others, please specify' },
                    ]}
                  />
                  {formData.eligibility === 'Others' && (
                    <div style={{ marginTop: '8px' }}>
                      <Input
                        placeholder="Please specify eligibility"
                        value={formData.eligibilityOthers}
                        onChange={(e) => handleFieldChange('eligibilityOthers', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: WORK-RELATED INFORMATION (Page 2)
              ========================================================================= */}
          {activeTab === 'work' && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '12px', borderLeft: '3px solid #7e191b', paddingLeft: '8px' }}>
                II. Work-Related Information
              </div>

              {/* 1. Years & 2. Center */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    1. Number of Years as CDW
                  </label>
                  <Input
                    type="number"
                    value={formData.yearsAsCDW}
                    onChange={(e) => handleFieldChange('yearsAsCDW', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    2. Name of Child Development Center Being Served
                  </label>
                  <Input
                    value={formData.centerBeingServed}
                    onChange={(e) => handleFieldChange('centerBeingServed', e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Monthly Compensation & 4. Total Amount */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                  3. Monthly Compensation & 4. Total Amount
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.monthlyCompensation.salary}
                      onChange={(e) => handleNestedFieldChange('monthlyCompensation', 'salary', e.target.checked)}
                    />
                    Salary
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.monthlyCompensation.honoraria}
                      onChange={(e) => handleNestedFieldChange('monthlyCompensation', 'honoraria', e.target.checked)}
                    />
                    Honoraria
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.monthlyCompensation.allowance}
                      onChange={(e) => handleNestedFieldChange('monthlyCompensation', 'allowance', e.target.checked)}
                    />
                    Allowance
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.monthlyCompensation.parentsContribution}
                      onChange={(e) => handleNestedFieldChange('monthlyCompensation', 'parentsContribution', e.target.checked)}
                    />
                    Parents’ Monthly Contribution/Pledges
                  </label>
                </div>
                <div style={{ maxWidth: '280px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    4. Total Amount of Compensation per Month (₱)
                  </label>
                  <Input
                    value={formData.totalAmountCompensation}
                    onChange={(e) => handleFieldChange('totalAmountCompensation', e.target.value)}
                    placeholder="e.g., 12,500"
                  />
                </div>
              </div>

              {/* 5. Source of Compensation & 6. Terms of Employment */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                    5. Source of Compensation
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <Input
                      placeholder="Barangay Amount"
                      value={formData.sourceCompensation.barangay}
                      onChange={(e) => handleNestedFieldChange('sourceCompensation', 'barangay', e.target.value)}
                    />
                    <Input
                      placeholder="City / Municipal Amount"
                      value={formData.sourceCompensation.cityMunicipal}
                      onChange={(e) => handleNestedFieldChange('sourceCompensation', 'cityMunicipal', e.target.value)}
                    />
                    <Input
                      placeholder="NGOs / NGAs Amount"
                      value={formData.sourceCompensation.ngos}
                      onChange={(e) => handleNestedFieldChange('sourceCompensation', 'ngos', e.target.value)}
                    />
                    <Input
                      placeholder="Parents Amount"
                      value={formData.sourceCompensation.parents}
                      onChange={(e) => handleNestedFieldChange('sourceCompensation', 'parents', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                    6. Terms of Employment
                  </label>
                  <Select
                    value={formData.termsOfEmployment}
                    onChange={(e) => handleFieldChange('termsOfEmployment', e.target.value)}
                    options={[
                      { value: 'Plantilla', label: 'Plantilla' },
                      { value: 'Contract of Service', label: 'Contract of Service' },
                      { value: 'Casual', label: 'Casual' },
                      { value: 'Co-Terminus w/ Hiring Authority', label: 'Co-Terminus w/ Hiring Authority' },
                      { value: 'Voluntary', label: 'Voluntary' },
                    ]}
                  />

                  {/* 9. Status as CDW */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                      9. Status as a Child Development Worker
                    </label>
                    <Select
                      value={formData.accreditationStatus}
                      onChange={(e) => handleFieldChange('accreditationStatus', e.target.value)}
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
                </div>
              </div>

              {/* 7. ECCD-Related Trainings Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                  7. ECCD-Related Trainings
                </label>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginTop: '6px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Title of Training</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px', width: '120px' }}>Inclusive Dates</th>
                      <th style={{ textAlign: 'center', padding: '4px 6px', width: '80px' }}>No. Hours</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px', width: '160px' }}>Conducted / Sponsored</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.trainings.map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={t.title}
                            onChange={(e) => handleTrainingChange(idx, 'title', e.target.value)}
                            style={{ width: '100%', fontSize: '11px', padding: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={t.dates}
                            onChange={(e) => handleTrainingChange(idx, 'dates', e.target.value)}
                            style={{ width: '100%', fontSize: '11px', padding: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="number"
                            value={t.hours}
                            onChange={(e) => handleTrainingChange(idx, 'hours', e.target.value)}
                            style={{ width: '100%', fontSize: '11px', padding: '3px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={t.sponsoredBy}
                            onChange={(e) => handleTrainingChange(idx, 'sponsoredBy', e.target.value)}
                            style={{ width: '100%', fontSize: '11px', padding: '3px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: WORKING CONDITIONS (Page 3)
              ========================================================================= */}
          {activeTab === 'conditions' && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '12px', borderLeft: '3px solid #7e191b', paddingLeft: '8px' }}>
                III. Working Conditions
              </div>

              {/* 1. Total Children & 2. Sessions Per Day & 3. Hours per session */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    1. Total No. of Children Being Served
                  </label>
                  <Input
                    type="number"
                    value={formData.childrenBeingServed}
                    onChange={(e) => handleFieldChange('childrenBeingServed', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    2. No. of Sessions Conducted per Day
                  </label>
                  <Select
                    value={formData.sessionsPerDay}
                    onChange={(e) => handleFieldChange('sessionsPerDay', e.target.value)}
                    options={[
                      { value: '1', label: '1 session' },
                      { value: '2', label: '2 sessions' },
                      { value: '3', label: '3 sessions' },
                      { value: '4', label: '4 sessions' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    3. No. of Hour/s per session
                  </label>
                  <Select
                    value={formData.hoursPerSession}
                    onChange={(e) => handleFieldChange('hoursPerSession', e.target.value)}
                    options={[
                      { value: '1 hr.', label: '1 hr.' },
                      { value: '2 hrs.', label: '2 hrs.' },
                      { value: '2 ½', label: '2 ½ hrs.' },
                      { value: '3', label: '3 hrs.' },
                    ]}
                  />
                </div>
              </div>

              {/* 4. Age of Children Handled */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                  4. Age of Children Being Handled
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.agesHandled.below1}
                      onChange={(e) => handleNestedFieldChange('agesHandled', 'below1', e.target.checked)}
                    />
                    Below 1 y/o
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.agesHandled.age1}
                      onChange={(e) => handleNestedFieldChange('agesHandled', 'age1', e.target.checked)}
                    />
                    1 year old
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.agesHandled.age2}
                      onChange={(e) => handleNestedFieldChange('agesHandled', 'age2', e.target.checked)}
                    />
                    2 years old
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.agesHandled.age3}
                      onChange={(e) => handleNestedFieldChange('agesHandled', 'age3', e.target.checked)}
                    />
                    3 years old
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.agesHandled.age4}
                      onChange={(e) => handleNestedFieldChange('agesHandled', 'age4', e.target.checked)}
                    />
                    4 years old
                  </label>
                </div>
              </div>

              {/* 5. Hours in Center & 6. How sessions conducted */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    5. No. of Hours staying in the Center
                  </label>
                  <Select
                    value={formData.hoursStayingInCenter}
                    onChange={(e) => handleFieldChange('hoursStayingInCenter', e.target.value)}
                    options={[
                      { value: '1-2 hrs.', label: '1-2 hrs.' },
                      { value: '2 ½ - 3 hrs.', label: '2 ½ - 3 hrs.' },
                      { value: '4-5 hrs.', label: '4-5 hrs.' },
                      { value: '6-7 hrs.', label: '6-7 hrs.' },
                      { value: '8 hours', label: '8 hours' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    6. How sessions are conducted
                  </label>
                  <Select
                    value={formData.howSessionsConducted}
                    onChange={(e) => handleFieldChange('howSessionsConducted', e.target.value)}
                    options={[
                      { value: 'With reference materials', label: 'With reference materials' },
                      { value: 'Without reference materials', label: 'Without reference materials' },
                    ]}
                  />
                </div>
              </div>

              {/* Signatures */}
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ minWidth: '220px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Name in Print (CDW):</label>
                  <Input
                    value={formData.cdwNamePrint || `${formData.firstName} ${formData.lastName}`}
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
            Print Form 6
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>
              Save Worker Profile
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default OfficialForm6WorkerProfileModal;
