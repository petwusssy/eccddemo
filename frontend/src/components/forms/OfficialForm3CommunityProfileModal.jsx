import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  X,
  Building2,
  Users,
  ShieldCheck,
  Trees,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { officialFormsService } from '../../services/officialFormsService';
import { centralDataStore } from '../../services/centralDataStore';
import { useToast } from '../ui/Toast';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';
import { getPhilippinesDate } from '../../utils/phTime';

export function OfficialForm3CommunityProfileModal({
  isOpen,
  onClose,
  barangayName = 'San Isidro',
  onSuccess,
}) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    barangayName: barangayName || 'Alasas',
    totalPopulation: '0',
    numberOfHouseholds: '0',

    // 3. Children 0-4 breakdown
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
    withPlaygroundPark: false,

    // 6. Health and Safety Conditions
    clean: true,
    hasUncollectedTrash: false,
    hasFecalMatters: false,
    hasOpenSewers: false,
    peacefulAndOrderly: true,
    hasActiveBrgyTanod: true,

    // Metadata
    nameOfCDT: 'Maria C. Santos (CDW I)',
    dateConducted: getPhilippinesDate(),
  });

  // Calculate sum of 0-4 children
  const totalChildren0to4 =
    (parseInt(formData.childrenUnder1, 10) || 0) +
    (parseInt(formData.children1Year, 10) || 0) +
    (parseInt(formData.children2Years, 10) || 0) +
    (parseInt(formData.children3Years, 10) || 0) +
    (parseInt(formData.children4Years, 10) || 0);

  // Load existing or compute from central store
  useEffect(() => {
    if (isOpen && barangayName) {
      const existing = officialFormsService.getForm3Data(barangayName);
      if (existing) {
        setFormData(existing);
      } else {
        // Auto-count mapped children in this barangay from central store
        const children = centralDataStore.getChildren().filter((c) => c.barangay === barangayName);
        const households = centralDataStore.getHouseholds().filter((h) => h.barangay === barangayName);

        let u1 = 0, y1 = 0, y2 = 0, y3 = 0, y4 = 0;
        children.forEach((c) => {
          if (c.ageYears === 0) u1++;
          else if (c.ageYears === 1) y1++;
          else if (c.ageYears === 2) y2++;
          else if (c.ageYears === 3) y3++;
          else y4++;
        });

        setFormData((prev) => ({
          ...prev,
          barangayName,
          totalPopulation: String(children.length + households.length * 4),
          numberOfHouseholds: String(households.length),
          childrenUnder1: String(u1),
          children1Year: String(y1),
          children2Years: String(y2),
          children3Years: String(y3),
          children4Years: String(y4),
        }));
      }
    }
  }, [isOpen, barangayName]);

  const handleSave = (e) => {
    e.preventDefault();
    officialFormsService.saveForm3Data(formData.barangayName, formData);
    addToast(`Official Form 3 (Community Profile) saved for Barangay ${formData.barangayName}.`, 'success');
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
          <span className="form-code-badge">FORM 3</span>
          <h2 className="form-main-title">COMMUNITY PROFILE</h2>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Barangay Community Mapping Module • April 2014 Edition
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="official-section-title">Barangay Identification &amp; Population</div>
          <div className="official-grid-3">
            <Select
              label="Name of Barangay *"
              value={formData.barangayName}
              onChange={(e) => setFormData({ ...formData, barangayName: e.target.value })}
              options={[
                ...BARANGAY_OPTIONS,
              ]}
            />
            <Input
              type="number"
              label="1. Total Population *"
              value={formData.totalPopulation}
              onChange={(e) => setFormData({ ...formData, totalPopulation: e.target.value })}
              required
            />
            <Input
              type="number"
              label="2. Number of Households *"
              value={formData.numberOfHouseholds}
              onChange={(e) => setFormData({ ...formData, numberOfHouseholds: e.target.value })}
              required
            />
          </div>

          <div className="official-section-title">
            3. Number of Children 0–4 years old (Total: {totalChildren0to4})
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

          <div className="official-section-title">4. Population Density</div>
          <div className="official-choice-group">
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

          <div className="official-section-title">5. Public Services</div>
          <div className="official-grid-2">
            {[
              { key: 'withDayCareCenter', label: 'With Day Care Center' },
              { key: 'withHealthCenter', label: 'With Barangay Health Center / Clinic' },
              { key: 'withEccdCenter', label: 'With ECCD Center' },
              { key: 'withPlaygroundPark', label: 'With Playground / Park' },
            ].map((srv) => (
              <label key={srv.key} className={`official-choice-item ${formData[srv.key] ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData[srv.key]}
                  onChange={(e) => setFormData({ ...formData, [srv.key]: e.target.checked })}
                />
                <span>{srv.label}</span>
              </label>
            ))}
          </div>

          <div className="official-section-title">6. Health and Safety Conditions</div>
          <div className="official-grid-3">
            {[
              { key: 'clean', label: 'Clean' },
              { key: 'hasUncollectedTrash', label: 'Has Uncollected Trash' },
              { key: 'hasFecalMatters', label: 'Has Fecal Matters' },
              { key: 'hasOpenSewers', label: 'Has Open Sewers' },
              { key: 'peacefulAndOrderly', label: 'Peaceful and Orderly' },
              { key: 'hasActiveBrgyTanod', label: 'Has Active Brgy. Tanod' },
            ].map((cond) => (
              <label key={cond.key} className={`official-choice-item ${formData[cond.key] ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData[cond.key]}
                  onChange={(e) => setFormData({ ...formData, [cond.key]: e.target.checked })}
                />
                <span>{cond.label}</span>
              </label>
            ))}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', gap: 'var(--space-2)' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <CheckCircle2 size={14} /> Save Official Form 3 (Community Profile)
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
