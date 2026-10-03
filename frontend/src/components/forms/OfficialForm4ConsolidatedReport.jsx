import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Building,
  School,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { officialFormsService } from '../../services/officialFormsService';
import { useToast } from '../ui/Toast';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';

export function OfficialForm4ConsolidatedReport() {
  const { addToast } = useToast();

  const [filterBarangay, setFilterBarangay] = useState('All');
  const [filterCenter, setFilterCenter] = useState('All');
  const [filterYear, setFilterYear] = useState('2026');
  const [refreshKey, setRefreshKey] = useState(0);

  // Compute live consolidation from central database
  const consolidation = useMemo(() => {
    return officialFormsService.generateForm4Consolidation({
      barangay: filterBarangay,
      center: filterCenter,
      year: filterYear,
    });
  }, [filterBarangay, filterCenter, filterYear, refreshKey]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['FORM 4 — CONSOLIDATED FAMILY PROFILE'],
      ['Barangay', filterBarangay, 'Center', filterCenter, 'Year', filterYear],
      ['Total Households / Respondents', consolidation.metadata.totalHouseholds],
      [],
      ['FORM 4A FATHER PROFILE'],
      ['Category', 'Item', 'Count', 'Percentage'],
      ...consolidation.form4A.ageOfRespondents.map((r) => ['Age', r.label, r.count, r.percentage]),
      ...consolidation.form4A.civilStatus.map((r) => ['Civil Status', r.label, r.count, r.percentage]),
      ...consolidation.form4A.educationalAttainment.map((r) => ['Education', r.label, r.count, r.percentage]),
      ...consolidation.form4A.occupationalStatus.map((r) => ['Occupation', r.label, r.count, r.percentage]),
      [],
      ['FORM 4B MOTHER PROFILE'],
      ['Pregnant Yes', consolidation.form4B.pregnant.yesCount, consolidation.form4B.pregnant.yesPercentage],
      ['Pregnant No', consolidation.form4B.pregnant.noCount, consolidation.form4B.pregnant.noPercentage],
      ...consolidation.form4B.interestedAgeInDayCare.map((r) => ['Interested DCC Age', r.label, r.count, r.percentage]),
      [],
      ['FORM 4C FAMILY PROFILE'],
      ...consolidation.form4C.ownership.map((r) => ['Ownership', r.label, r.count, r.percentage]),
      ...consolidation.form4C.materials.map((r) => ['Materials', r.label, r.count, r.percentage]),
      ...consolidation.form4C.utilities.map((r) => ['Utility', r.label, r.count, r.percentage]),
      ...consolidation.form4C.recreation.map((r) => ['Recreation', r.label, r.count, r.percentage]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECCD_Form_4_Consolidated_${filterBarangay}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Form 4 CSV exported successfully.', 'success');
  };

  return (
    <div className="official-form-4-view">
      {/* Control & Filter Strip */}
      <Card style={{ marginBottom: 'var(--space-4)' }} className="no-print">
        <CardBody style={{ padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                FILTER AGGREGATION:
              </span>
              <div style={{ width: '160px' }}>
                <Select
                  value={filterBarangay}
                  onChange={(e) => setFilterBarangay(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Barangays' },
                    ...BARANGAY_OPTIONS,
                  ]}
                  className="select-sm"
                />
              </div>

              <div style={{ width: '220px' }}>
                <Select
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Day Care Centers' },
                    { value: 'San Isidro Child Development Center I', label: 'San Isidro CDC I' },
                    { value: 'San Jose Child Development Center I', label: 'San Jose CDC I' },
                    { value: 'Dolores CDC Central', label: 'Dolores CDC Central' },
                  ]}
                  className="select-sm"
                />
              </div>

              <div style={{ width: '110px' }}>
                <Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  options={[
                    { value: '2026', label: 'Year 2026' },
                    { value: '2025', label: 'Year 2025' },
                  ]}
                  className="select-sm"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Re-aggregate from active database"
              >
                <RefreshCw size={13} />
                Refresh
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                <Download size={14} />
                Export CSV
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Printer size={14} />
                Print Official Form 4
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Official Form 4 Document Container */}
      <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: '960px', margin: '0 auto' }}>
        {/* Header Block */}
        <div className="official-doc-header">
          <div className="agency-title">Early Childhood Care and Development Council</div>
          <span className="form-code-badge">FORM 4</span>
          <h1 className="form-main-title">CONSOLIDATED FAMILY PROFILE</h1>
          <div style={{ fontSize: 'var(--font-size-xs)', color: '#475569', marginTop: '4px' }}>
            City Social Welfare and Development Office • City of San Fernando, Pampanga
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Barangay Scope: <strong>{filterBarangay}</strong> • Center Scope: <strong>{filterCenter}</strong> • As of: <strong>{consolidation.metadata.generatedAt}</strong>
          </div>
        </div>

        {/* Legal Instruction Notice */}
        <div className="official-instruction-banner">
          <strong>Official Consolidation Notice:</strong> In accordance with ECCD Council guidelines, this report consolidates Father Profile (4A), Mother Profile (4B), and Family Profile (4C) directly from the centralized child and household registry.
        </div>

        {/* =====================================================================
            FORM 4A: FATHER'S PROFILE
            ===================================================================== */}
        <div style={{ marginTop: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              FORM 4A — FATHER'S PROFILE
            </h2>
            <Badge variant="primary" size="sm">
              1. No. of Respondents: {consolidation.form4A.totalRespondents}
            </Badge>
          </div>

          {/* 2. Age of Respondents */}
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
            2. Age of Respondents
          </div>
          <table className="official-table">
            <thead>
              <tr>
                <th>Age Bracket</th>
                <th className="text-center" style={{ width: '120px' }}>No. of Responses</th>
                <th className="text-center" style={{ width: '120px' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.form4A.ageOfRespondents.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td className="text-center">{r.count}</td>
                  <td className="text-center">{r.percentage}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                <td>Total</td>
                <td className="text-center">{consolidation.form4A.totalRespondents}</td>
                <td className="text-center">100.0%</td>
              </tr>
            </tbody>
          </table>

          {/* 3. Civil Status & 4. Mother Tongue in Grid */}
          <div className="official-grid-2">
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                3. Civil Status
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4A.civilStatus.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                4. Mother Tongue
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Language</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4A.motherTongue.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Educational Attainment & 7. Occupational Status */}
          <div className="official-grid-2">
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                6. Educational Attainment
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4A.educationalAttainment.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                7. Occupational Status
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4A.occupationalStatus.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FORM 4B: MOTHER'S PROFILE
            ===================================================================== */}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '2px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              FORM 4B — MOTHER'S PROFILE
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Badge variant="primary" size="sm">
                1. No. of Respondents: {consolidation.form4B.totalRespondents}
              </Badge>
              <Badge variant="warning" size="sm">
                2. Pregnant: {consolidation.form4B.pregnant.yesCount} ({consolidation.form4B.pregnant.yesPercentage})
              </Badge>
            </div>
          </div>

          <div className="official-grid-2">
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                3. Civil Status
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4B.civilStatus.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                4. Mother Tongue
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Language</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4B.motherTongue.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="official-grid-2">
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                6. Educational Attainment
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4B.educationalAttainment.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                8. Age mother is interested to put child in Day Care Center
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4B.interestedAgeInDayCare.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FORM 4C: FAMILY PROFILE
            ===================================================================== */}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '2px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              FORM 4C — FAMILY PROFILE
            </h2>
            <Badge variant="primary" size="sm">
              1. No. of Respondents: {consolidation.form4C.totalRespondents}
            </Badge>
          </div>

          <div className="official-grid-2">
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                2. Ownership
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4C.ownership.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
                3. Materials
              </div>
              <table className="official-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th className="text-center">Number</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.form4C.materials.map((r, i) => (
                    <tr key={i}>
                      <td>{r.label}</td>
                      <td className="text-center">{r.count}</td>
                      <td className="text-center">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Utilities and Appliances */}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
              5. Utilities and Appliances
            </div>
            <table className="official-table">
              <thead>
                <tr>
                  <th>Utility / Appliance</th>
                  <th className="text-center" style={{ width: '140px' }}>Number of Responses</th>
                  <th className="text-center" style={{ width: '140px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.form4C.utilities.map((u, i) => (
                  <tr key={i}>
                    <td>{u.label}</td>
                    <td className="text-center">{u.count}</td>
                    <td className="text-center">{u.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 7. Persons Staying in the Same Household */}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px', color: '#334155' }}>
              7. Persons Staying in the Same Household
            </div>
            <table className="official-table">
              <thead>
                <tr>
                  <th>Relationship Category</th>
                  <th className="text-center" style={{ width: '160px' }}>Total Persons Count</th>
                  <th className="text-center" style={{ width: '160px' }}>Average per Household</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.form4C.personsStaying.map((p, i) => (
                  <tr key={i}>
                    <td>{p.label}</td>
                    <td className="text-center">{p.count}</td>
                    <td className="text-center">{p.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signatures */}
        <div className="official-signature-block">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: '#334155' }}>Prepared By:</div>
            <div className="official-sig-line">
              <strong>Maria C. Santos, CDW I</strong><br />
              Child Development Worker / Field Focal
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: '#334155' }}>Approved / Attested By:</div>
            <div className="official-sig-line">
              <strong>Atty. Bernadette M. Ronquillo, RSW</strong><br />
              City Social Welfare and Development Officer (CSWDO)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
