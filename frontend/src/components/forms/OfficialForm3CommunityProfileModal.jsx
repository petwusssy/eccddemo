import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  X,
  Building2,
  Users,
  ShieldCheck,
  Trees,
  School,
  UserCheck,
  Printer,
  ExternalLink,
  Award,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { OfficialForm7CenterProfileModal } from './OfficialForm7CenterProfileModal';
import { OfficialForm6WorkerProfileModal } from './OfficialForm6WorkerProfileModal';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { communityService } from '../../services/communityService';
import { useToast } from '../ui/Toast';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';
import { getPhilippinesDate } from '../../utils/phTime';

/**
 * Official Form 3 — Community Profile Modal
 * ECCD Council Official Standard Template (April 2014 Edition)
 *
 * Relational Aggregation Hierarchy:
 * Form 3 (Barangay Community Profile)
 *   └── Form 7 (Child Development Centers Profile)
 *         └── Form 6 (Child Development Workers Profile)
 */
export function OfficialForm3CommunityProfileModal({
  isOpen,
  onClose,
  barangayName = 'Sindalan',
  onSuccess,
}) {
  const { addToast } = useToast();

  // Active shortcut modal state (Form 7 & Form 6)
  const [activeForm7CenterId, setActiveForm7CenterId] = useState(null);
  const [activeForm6WorkerId, setActiveForm6WorkerId] = useState(null);

  // Form State adhering to Official ECCD Council Form 3
  const [formData, setFormData] = useState({
    // Section I: Community Identification
    barangayName: barangayName || 'Sindalan',
    cityMunicipality: 'City of San Fernando',
    province: 'Pampanga',
    region: 'Region III - Central Luzon',
    totalPuroks: '7 Puroks / Sitios',
    punongBarangay: 'Hon. Barangay Captain',
    barangayHallAddress: `Barangay Hall Compound, ${barangayName || 'Sindalan'}`,

    // Section II: Demographic & Household Summary
    totalPopulation: '3,850',
    numberOfHouseholds: '420',

    // 3. Children 0-4 Breakdown
    childrenUnder1: '0',
    children1Year: '0',
    children2Years: '0',
    children3Years: '0',
    children4Years: '0',

    // 4. Population Density
    populationDensity: 'Moderately Crowded', // Very Crowded, Moderately Crowded, Not Crowded
    hasOpenGreenAreas: true,

    // 5. Public Services
    withDayCareCenter: true,
    withHealthCenter: true,
    withEccdCenter: true,
    withPlaygroundPark: true,

    // 6. Health and Safety Conditions
    clean: true,
    hasUncollectedTrash: false,
    hasFecalMatters: false,
    hasOpenSewers: false,
    peacefulAndOrderly: true,
    hasActiveBrgyTanod: true,

    // Signatures & Metadata
    nameOfCDT: 'Remedios D. Garcia, CDT',
    dateConducted: getPhilippinesDate(),
  });

  // Dynamic Relational Rollup (derived from Form 7 & Form 6)
  const [infraData, setInfraData] = useState({
    centers: [],
    workers: [],
    totalCapacity: 0,
    totalEnrolledInCdcs: 0,
  });

  const norm = (v) => String(v || '').toLowerCase().trim();

  // Helper to query and rollup Form 7 and Form 6 child entities dynamically
  const loadInfrastructure = useCallback((targetBarangay) => {
    const allCenters = centralDataStore.getDayCareCenters() || [];
    const allWorkers = centralDataStore.getWorkers() || [];
    const target = norm(targetBarangay);

    // Rollup Form 7 CDCs assigned to this Barangay
    const matchedCenters = allCenters.filter(
      (c) => norm(c.barangay || c.barangayName) === target || norm(c.name).includes(target)
    );

    // Rollup Form 6 CDWs assigned to this Barangay or operating in these CDCs
    const matchedWorkers = allWorkers.filter((w) => {
      const assignedBrgys = Array.isArray(w.assignedBarangays) ? w.assignedBarangays : [];
      const assignedBrgy = w.assignedBarangay || '';
      const inBrgy = assignedBrgys.some((b) => norm(b) === target) || norm(assignedBrgy) === target;
      const inCenters = matchedCenters.some((bc) =>
        (w.assignedCenters || []).some((ac) => norm(ac) === norm(bc.name)) ||
        norm(w.dayCareCenterName) === norm(bc.name) ||
        (Array.isArray(bc.assignedWorkers) &&
          bc.assignedWorkers.some((aw) => norm(aw).includes(norm(w.name)) || norm(w.name).includes(norm(aw))))
      );
      return inBrgy || inCenters;
    });

    const totalCapacity = matchedCenters.reduce((acc, c) => acc + (Number(c.capacity) || 60), 0);
    const totalEnrolled = matchedCenters.reduce(
      (acc, c) => acc + (Number(c.enrolledChildren ?? c.enrolledCount) || 0),
      0
    );

    return {
      centers: matchedCenters,
      workers: matchedWorkers,
      totalCapacity,
      totalEnrolledInCdcs: totalEnrolled,
    };
  }, []);

  // Calculate sum of 0-4 children
  const totalChildren0to4 =
    (parseInt(formData.childrenUnder1, 10) || 0) +
    (parseInt(formData.children1Year, 10) || 0) +
    (parseInt(formData.children2Years, 10) || 0) +
    (parseInt(formData.children3Years, 10) || 0) +
    (parseInt(formData.children4Years, 10) || 0);

  // Initialize data on modal open or when barangay changes
  useEffect(() => {
    if (!isOpen) return;

    const currentBrgy = barangayName || 'Sindalan';
    const rolledUpInfra = loadInfrastructure(currentBrgy);
    setInfraData(rolledUpInfra);

    const existing = officialFormsService.getForm3Data(currentBrgy);

    // Dynamic child records & households from centralDataStore
    const children = (centralDataStore.getChildren() || []).filter(
      (c) => norm(c.barangay) === norm(currentBrgy)
    );
    const households = (centralDataStore.getHouseholds() || []).filter(
      (h) => norm(h.barangay) === norm(currentBrgy)
    );

    let u1 = 0, y1 = 0, y2 = 0, y3 = 0, y4 = 0;
    children.forEach((c) => {
      if (c.ageYears === 0) u1++;
      else if (c.ageYears === 1) y1++;
      else if (c.ageYears === 2) y2++;
      else if (c.ageYears === 3) y3++;
      else y4++;
    });

    const defaultCDT =
      rolledUpInfra.workers[0]?.name ||
      rolledUpInfra.centers[0]?.assignedWorkers?.[0] ||
      'Remedios D. Garcia, CDT';

    if (existing) {
      setFormData((prev) => ({
        ...prev,
        ...existing,
        barangayName: currentBrgy,
        cityMunicipality: 'City of San Fernando',
        province: 'Pampanga',
        region: 'Region III - Central Luzon',
        withDayCareCenter: rolledUpInfra.centers.length > 0,
        withEccdCenter: rolledUpInfra.centers.length > 0,
      }));
    } else {
      setFormData({
        barangayName: currentBrgy,
        cityMunicipality: 'City of San Fernando',
        province: 'Pampanga',
        region: 'Region III - Central Luzon',
        totalPuroks: '7 Puroks / Sitios',
        punongBarangay: `Hon. Punong Barangay (${currentBrgy})`,
        barangayHallAddress: `Barangay Hall Compound, ${currentBrgy}, City of San Fernando, Pampanga`,
        totalPopulation: String(Math.max(households.length * 4 + children.length, 3450)),
        numberOfHouseholds: String(Math.max(households.length, 380)),
        childrenUnder1: String(u1),
        children1Year: String(y1),
        children2Years: String(y2),
        children3Years: String(y3),
        children4Years: String(y4),
        populationDensity: 'Moderately Crowded',
        hasOpenGreenAreas: true,
        withDayCareCenter: rolledUpInfra.centers.length > 0,
        withHealthCenter: true,
        withEccdCenter: rolledUpInfra.centers.length > 0,
        withPlaygroundPark: true,
        clean: true,
        hasUncollectedTrash: false,
        hasFecalMatters: false,
        hasOpenSewers: false,
        peacefulAndOrderly: true,
        hasActiveBrgyTanod: true,
        nameOfCDT: defaultCDT,
        dateConducted: getPhilippinesDate(),
      });
    }
  }, [isOpen, barangayName, loadInfrastructure]);

  // Handle switching barangay within the modal
  const handleBarangayChange = (newBrgy) => {
    const rolledUp = loadInfrastructure(newBrgy);
    setInfraData(rolledUp);

    const existing = officialFormsService.getForm3Data(newBrgy);
    const children = (centralDataStore.getChildren() || []).filter(
      (c) => norm(c.barangay) === norm(newBrgy)
    );
    const households = (centralDataStore.getHouseholds() || []).filter(
      (h) => norm(h.barangay) === norm(newBrgy)
    );

    let u1 = 0, y1 = 0, y2 = 0, y3 = 0, y4 = 0;
    children.forEach((c) => {
      if (c.ageYears === 0) u1++;
      else if (c.ageYears === 1) y1++;
      else if (c.ageYears === 2) y2++;
      else if (c.ageYears === 3) y3++;
      else y4++;
    });

    const defaultCDT =
      rolledUp.workers[0]?.name ||
      rolledUp.centers[0]?.assignedWorkers?.[0] ||
      'Remedios D. Garcia, CDT';

    if (existing) {
      setFormData((prev) => ({
        ...prev,
        ...existing,
        barangayName: newBrgy,
        cityMunicipality: 'City of San Fernando',
        province: 'Pampanga',
        region: 'Region III - Central Luzon',
        withDayCareCenter: rolledUp.centers.length > 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        barangayName: newBrgy,
        punongBarangay: `Hon. Punong Barangay (${newBrgy})`,
        barangayHallAddress: `Barangay Hall Compound, ${newBrgy}, City of San Fernando, Pampanga`,
        totalPopulation: String(Math.max(households.length * 4 + children.length, 3450)),
        numberOfHouseholds: String(Math.max(households.length, 380)),
        childrenUnder1: String(u1),
        children1Year: String(y1),
        children2Years: String(y2),
        children3Years: String(y3),
        children4Years: String(y4),
        withDayCareCenter: rolledUp.centers.length > 0,
        withEccdCenter: rolledUp.centers.length > 0,
        nameOfCDT: defaultCDT,
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    officialFormsService.saveForm3Data(formData.barangayName, formData);
    addToast(
      `Official Form 3 (Community Profile) saved for Barangay ${formData.barangayName}.`,
      'success'
    );
    if (onSuccess) onSuccess(formData);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const refreshHierarchy = () => {
    const rolledUp = loadInfrastructure(formData.barangayName);
    setInfraData(rolledUp);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        size="2xl"
        className="official-form-modal"
      >
        <div style={{ padding: 'var(--space-2)' }}>
          {/* Document Header matching ECCD Council Form 3 */}
          <div className="official-doc-header">
            <div className="agency-title">Early Childhood Care and Development Council</div>
            <span className="form-code-badge">FORM 3</span>
            <h2 className="form-main-title">COMMUNITY PROFILE</h2>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              City Social Welfare and Development Office (CSWDO) • City of San Fernando, Pampanga
              <span style={{ margin: '0 8px' }}>•</span>
              April 2014 Edition • Page 1 of 1
            </div>

            {/* Quick Barangay Switcher Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                background: '#f8fafc',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
              }}
            >
              <MapPin size={14} color="#ba1607" />
              <span style={{ fontWeight: 600, color: '#475569' }}>Selected Barangay:</span>
              <select
                value={formData.barangayName}
                onChange={(e) => handleBarangayChange(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  color: '#7e191b',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {BARANGAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Barangay {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* =========================================================================
                SECTION I: COMMUNITY IDENTIFICATION
                ========================================================================= */}
            <div className="official-section-title">
              <Building2 size={16} />
              <span>Section I: Community Identification &amp; Geographic Profile</span>
            </div>

            <div className="official-grid-3">
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Name of Barangay *
                </label>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#fff1f0',
                    border: '1px solid #ffccc7',
                    borderRadius: '6px',
                    fontWeight: 700,
                    color: '#7e191b',
                    fontSize: '0.875rem',
                  }}
                >
                  {formData.barangayName}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  City / Municipality
                </label>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontSize: '0.875rem',
                  }}
                >
                  City of San Fernando
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Province &amp; Region
                </label>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontSize: '0.875rem',
                  }}
                >
                  Pampanga (Region III - Central Luzon)
                </div>
              </div>
            </div>

            <div className="official-grid-2" style={{ marginTop: '0.75rem' }}>
              <Input
                label="Total Puroks / Sitios *"
                value={formData.totalPuroks}
                onChange={(e) => setFormData({ ...formData, totalPuroks: e.target.value })}
                placeholder="e.g. 7 Puroks"
                required
              />
              <Input
                label="Punong Barangay / Barangay Captain *"
                value={formData.punongBarangay}
                onChange={(e) => setFormData({ ...formData, punongBarangay: e.target.value })}
                placeholder="e.g. Hon. Barangay Captain"
                required
              />
            </div>

            {/* =========================================================================
                SECTION II: DEMOGRAPHIC & HOUSEHOLD SUMMARY
                ========================================================================= */}
            <div className="official-section-title">
              <Users size={16} />
              <span>Section II: Demographic &amp; Household Summary</span>
            </div>

            <div className="official-grid-2">
              <Input
                type="number"
                label="1. Total Population *"
                value={formData.totalPopulation}
                onChange={(e) => setFormData({ ...formData, totalPopulation: e.target.value })}
                required
              />
              <Input
                type="number"
                label="2. Number of Households / Families Mapped *"
                value={formData.numberOfHouseholds}
                onChange={(e) => setFormData({ ...formData, numberOfHouseholds: e.target.value })}
                required
              />
            </div>

            {/* Children 0-4 Breakdown */}
            <div style={{ marginTop: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                  3. Number of Children 0–4 years old
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  Total 0–4: {totalChildren0to4} Children
                </span>
              </div>
              <div className="official-grid-5">
                <Input
                  type="number"
                  label="< 1 year old"
                  value={formData.childrenUnder1}
                  onChange={(e) => setFormData({ ...formData, childrenUnder1: e.target.value })}
                />
                <Input
                  type="number"
                  label="1 year old"
                  value={formData.children1Year}
                  onChange={(e) => setFormData({ ...formData, children1Year: e.target.value })}
                />
                <Input
                  type="number"
                  label="2 years old"
                  value={formData.children2Years}
                  onChange={(e) => setFormData({ ...formData, children2Years: e.target.value })}
                />
                <Input
                  type="number"
                  label="3 years old"
                  value={formData.children3Years}
                  onChange={(e) => setFormData({ ...formData, children3Years: e.target.value })}
                />
                <Input
                  type="number"
                  label="4 years old"
                  value={formData.children4Years}
                  onChange={(e) => setFormData({ ...formData, children4Years: e.target.value })}
                />
              </div>
            </div>

            {/* Population Density */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                4. Population Density
              </span>
              <div className="official-choice-group" style={{ marginTop: '0.375rem' }}>
                {['Very Crowded', 'Moderately Crowded', 'Not Crowded'].map((d) => (
                  <div
                    key={d}
                    className={`official-choice-item ${formData.populationDensity === d ? 'is-selected' : ''}`}
                    onClick={() => setFormData({ ...formData, populationDensity: d })}
                  >
                    <span>{d}</span>
                  </div>
                ))}
                <label className={`official-choice-item ${formData.hasOpenGreenAreas ? 'is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.hasOpenGreenAreas}
                    onChange={(e) => setFormData({ ...formData, hasOpenGreenAreas: e.target.checked })}
                  />
                  <span>Has Lots of Open / Green Areas</span>
                </label>
              </div>
            </div>

            {/* Public Services */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                5. Public Services Available in Community
              </span>
              <div className="official-grid-2" style={{ marginTop: '0.375rem' }}>
                {[
                  { key: 'withDayCareCenter', label: 'With Day Care Center (Form 7 Connected)' },
                  { key: 'withHealthCenter', label: 'With Barangay Health Center / Clinic' },
                  { key: 'withEccdCenter', label: 'With ECCD Center' },
                  { key: 'withPlaygroundPark', label: 'With Playground / Park' },
                ].map((srv) => (
                  <label key={srv.key} className={`official-choice-item ${formData[srv.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData[srv.key])}
                      onChange={(e) => setFormData({ ...formData, [srv.key]: e.target.checked })}
                    />
                    <span>{srv.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Health and Safety Conditions */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                6. Health and Safety Conditions
              </span>
              <div className="official-grid-3" style={{ marginTop: '0.375rem' }}>
                {[
                  { key: 'clean', label: 'Clean Environment' },
                  { key: 'hasUncollectedTrash', label: 'Has Uncollected Trash' },
                  { key: 'hasFecalMatters', label: 'Has Fecal Matters' },
                  { key: 'hasOpenSewers', label: 'Has Open Sewers' },
                  { key: 'peacefulAndOrderly', label: 'Peaceful and Orderly' },
                  { key: 'hasActiveBrgyTanod', label: 'Has Active Brgy. Tanod' },
                ].map((cond) => (
                  <label key={cond.key} className={`official-choice-item ${formData[cond.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData[cond.key])}
                      onChange={(e) => setFormData({ ...formData, [cond.key]: e.target.checked })}
                    />
                    <span>{cond.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* =========================================================================
                SECTION III: ECCD PHYSICAL & PERSONNEL INFRASTRUCTURE (CONNECTED)
                ========================================================================= */}
            <div className="official-section-title">
              <School size={16} />
              <span>Section III: ECCD Physical &amp; Personnel Infrastructure (Derived from Forms 7 &amp; 6)</span>
            </div>

            {/* Live KPI Rollup Mini-Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ background: '#f8fafc', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Form 7 CDCs Active
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e191b' }}>
                  {infraData.centers.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Operating Centers</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Form 6 CDWs Deployed
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0d9488' }}>
                  {infraData.workers.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Active Practitioners</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Infrastructure Capacity
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                  {infraData.totalCapacity}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Max Student Slots</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Current Enrolled
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                  {infraData.totalEnrolledInCdcs}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Children in Sessions</div>
              </div>
            </div>

            {/* Connected Centers & Workers Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
              <table className="official-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Child Development Center (Form 7)</th>
                    <th>Accreditation Level</th>
                    <th>Capacity &amp; Sessions</th>
                    <th>Assigned CDWs (Form 6)</th>
                    <th style={{ textAlign: 'right' }}>Shortcuts &amp; Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {infraData.centers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No Day Care Centers currently registered under Barangay {formData.barangayName}.
                        <div style={{ marginTop: '0.5rem' }}>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            icon={School}
                            onClick={() => setActiveForm7CenterId('new')}
                          >
                            + Register CDC in {formData.barangayName} (Form 7)
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    infraData.centers.map((cdc) => {
                      // Find CDWs assigned to this center
                      const assignedWorkersForThisCdc = infraData.workers.filter(
                        (w) =>
                          (w.assignedCenters || []).some((c) => norm(c) === norm(cdc.name)) ||
                          norm(w.dayCareCenterName) === norm(cdc.name) ||
                          (Array.isArray(cdc.assignedWorkers) &&
                            cdc.assignedWorkers.some(
                              (aw) => norm(aw).includes(norm(w.name)) || norm(w.name).includes(norm(aw))
                            ))
                      );

                      return (
                        <tr key={cdc.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#7e191b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <School size={15} color="#ba1607" />
                              <span>{cdc.name}</span>
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>
                              Code: {cdc.code || cdc.id} • {cdc.address || 'Barangay Hall Compound'}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ecfdf5',
                                color: '#065f46',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              <Award size={12} />
                              {cdc.accreditationLevel || 'Level 3'} Accredited
                            </span>
                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '2px' }}>
                              {cdc.accreditationNo || 'CDC-2024-001'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
                              {cdc.capacity || 60} slots
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                              {cdc.sessions || 'Morning & Afternoon'}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {assignedWorkersForThisCdc.length > 0 ? (
                                assignedWorkersForThisCdc.map((w) => (
                                  <div
                                    key={w.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: '#f1f5f9',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: '#334155',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <UserCheck size={12} color="#0d9488" />
                                    <span>{w.name}</span>
                                    <button
                                      type="button"
                                      title="View Form 6 Profile"
                                      onClick={() => setActiveForm6WorkerId(w.id)}
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#2563eb',
                                        cursor: 'pointer',
                                        padding: '0 2px',
                                        fontSize: '0.6875rem',
                                      }}
                                    >
                                      [Form 6]
                                    </button>
                                  </div>
                                ))
                              ) : cdc.assignedWorkers && cdc.assignedWorkers.length > 0 ? (
                                cdc.assignedWorkers.map((aw, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: '#f1f5f9',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: '#334155',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <UserCheck size={12} color="#0d9488" />
                                    <span>{aw}</span>
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  No CDW assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                icon={School}
                                onClick={() => setActiveForm7CenterId(cdc.id)}
                              >
                                Form 7 Profile
                              </Button>
                              {assignedWorkersForThisCdc[0] && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  icon={UserCheck}
                                  onClick={() => setActiveForm6WorkerId(assignedWorkersForThisCdc[0].id)}
                                >
                                  Form 6 Profile
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* =========================================================================
                SIGNATURE & DATE BLOCK
                ========================================================================= */}
            <div className="official-signature-block">
              <div>
                <Input
                  label="Name and Signature of CDT *"
                  value={formData.nameOfCDT}
                  onChange={(e) => setFormData({ ...formData, nameOfCDT: e.target.value })}
                  placeholder="e.g. Remedios D. Garcia, CDT"
                  required
                />
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '4px' }}>
                  Child Development Teacher / Worker in-charge of Community Profile
                </div>
              </div>
              <div>
                <Input
                  type="date"
                  label="Date Conducted *"
                  value={formData.dateConducted}
                  onChange={(e) => setFormData({ ...formData, dateConducted: e.target.value })}
                  required
                />
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '4px' }}>
                  Official Barangay Community Survey Validation Date
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-color)',
                gap: 'var(--space-2)',
              }}
            >
              <Button type="button" variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
                Print Form 3
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 size={14} /> Save Official Form 3 (Community Profile)
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========================================================================
          EMBEDDED SHORTCUT MODALS (WITHOUT LEAVING FORM 3 CONTEXT)
          ========================================================================= */}
      {activeForm7CenterId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
          <OfficialForm7CenterProfileModal
            isOpen={Boolean(activeForm7CenterId)}
            centerId={activeForm7CenterId}
            onClose={() => {
              setActiveForm7CenterId(null);
              refreshHierarchy();
            }}
            onSuccess={() => {
              refreshHierarchy();
            }}
          />
        </div>
      )}

      {activeForm6WorkerId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
          <OfficialForm6WorkerProfileModal
            isOpen={Boolean(activeForm6WorkerId)}
            workerId={activeForm6WorkerId}
            onClose={() => {
              setActiveForm6WorkerId(null);
              refreshHierarchy();
            }}
            onSuccess={() => {
              refreshHierarchy();
            }}
          />
        </div>
      )}
    </>
  );
}

export default OfficialForm3CommunityProfileModal;
