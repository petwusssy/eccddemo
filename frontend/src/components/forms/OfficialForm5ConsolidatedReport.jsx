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
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { officialFormsService } from '../../services/officialFormsService';
import { useToast } from '../ui/Toast';
import { BARANGAY_OPTIONS } from '../../data/sanFernandoBarangays';

export function OfficialForm5ConsolidatedReport({ onClose } = {}) {
  const { addToast } = useToast();

  const [filterBarangay, setFilterBarangay] = useState('All');
  const [filterCenter, setFilterCenter] = useState('All');
  const [filterYear, setFilterYear] = useState('2026');
  const [refreshKey, setRefreshKey] = useState(0);

  // Compute live consolidation from central database
  const consolidation = useMemo(() => {
    return officialFormsService.generateForm5Consolidation({
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
      ['FORM 5 — CONSOLIDATED CHILDREN\'S PROFILE (June 2015)'],
      ['Barangay', filterBarangay, 'Center', filterCenter, 'Year', filterYear],
      ['Number of Children Surveyed', consolidation.metadata.totalChildrenSurveyed],
      [],
      ['1. AGE'],
      ['Category', 'Number', 'Percentage'],
      ...consolidation.age.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['2. SEX'],
      ...consolidation.sex.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['3. BIRTH ORDER'],
      ...consolidation.birthOrder.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['4. REGISTERED'],
      ...consolidation.registered.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['5. BORN AT'],
      ...consolidation.bornAt.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['6. MOTHER TONGUE'],
      ...consolidation.motherTongue.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['7. OTHER DIALECTS SPOKEN AT HOME'],
      ...consolidation.otherDialects.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['8. HEIGHT (CM)'],
      ['Age Category', 'No. of Children', 'Sum of Height (cm)', 'Average (cm)'],
      ...consolidation.heightTable.map((r) => [r.label, r.count, r.sum, r.avg]),
      [],
      ['9. WEIGHT (KG)'],
      ['Age Category', 'No. of Children', 'Sum of Weight (kg)', 'Average (kg)'],
      ...consolidation.weightTable.map((r) => [r.label, r.count, r.sum, r.avg]),
      [],
      ['10. DOES CHILD HAVE'],
      ...consolidation.cards.map((r) => [r.label, r.number, r.percentage]),
      [],
      ['11. VACCINATION AND OTHER HEALTH DATA'],
      ['Vaccine', 'Total Yes', 'Total No', 'Total Don\'t Know'],
      ...consolidation.vaccines.map((r) => [r.label, r.yes, r.no, r.dontKnow]),
      [],
      ['12. PHYSICAL ATTRIBUTES'],
      ...consolidation.deformities.map((r) => ['Deformity: ' + r.label, r.count]),
      ...consolidation.problemsWith.map((r) => ['Problems With: ' + r.label, r.count]),
      ['Left Handed - Yes', consolidation.leftHanded.yes],
      ['Left Handed - No', consolidation.leftHanded.no],
      [],
      ['13. SIBLINGS'],
      ['Age Bracket', 'Male', 'Female', 'In School', 'Out of School'],
      ...consolidation.siblings.map((r) => [r.age, r.male, r.female, r.inSchool, r.outOfSchool]),
      [],
      ['14. PRIOR EARLY CHILDHOOD EXPERIENCE'],
      ['Nursery', 'Count'],
      ...consolidation.priorExperience.nursery.map((r) => [r.label, r.count]),
      ['Kindergarten', 'Count'],
      ...consolidation.priorExperience.kindergarten.map((r) => [r.label, r.count]),
      ['Preparatory', 'Count'],
      ...consolidation.priorExperience.preparatory.map((r) => [r.label, r.count]),
      [],
      ['15. OTHER PERFORMANCE RELATED INPUTS'],
      ...consolidation.studiesAtHomeWith.map((r) => ['Studies at home with: ' + r.label, r.count]),
      ...consolidation.playOlderSiblings.map((r) => ['Play older siblings: ' + r.label, r.count]),
      ...consolidation.playYoungerSiblings.map((r) => ['Play younger siblings: ' + r.label, r.count]),
      ...consolidation.playNeighbors.map((r) => ['Play neighbors: ' + r.label, r.count]),
      [],
      ['16. LOGISTICS'],
      ...consolidation.mealBeforeSchool.map((r) => ['Meal before school: ' + r.label, r.count]),
      ...consolidation.foodsNormallyEaten.map((r) => ['Food eaten: ' + r.label, r.count]),
      ...consolidation.hasBaon.map((r) => ['Has baon: ' + r.label, r.count]),
      ['Travel time to DCC average', consolidation.travelTimeToDCC.avgMinutes],
      ['Travel time to DCC - Walking', consolidation.travelTimeToDCC.walking],
      ['Travel time to DCC - Private Vehicle', consolidation.travelTimeToDCC.privateVehicle],
      ['Travel time to DCC - Private Transportation', consolidation.travelTimeToDCC.privateTransportation],
      ['Travel time to NCDC average', consolidation.travelTimeToNCDC.avgMinutes],
      ['Travel time to NCDC - Walking', consolidation.travelTimeToNCDC.walking],
      ['Travel time to NCDC - Private Vehicle', consolidation.travelTimeToNCDC.privateVehicle],
      ['Travel time to NCDC - Private Transportation', consolidation.travelTimeToNCDC.privateTransportation],
      ...consolidation.publicTransportation.map((r) => ['Public transport: ' + r.label, r.count]),
      ['Average Fare', consolidation.averageFare],
      ...consolidation.goesToSchoolWith.map((r) => ['Goes to school with: ' + r.label, r.count]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECCD_Form_5_Consolidated_${filterBarangay}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Form 5 CSV exported successfully.', 'success');
  };

  return (
    <div className="official-form-5-view">
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
                />
              </div>

              <div style={{ width: '190px' }}>
                <Select
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Day Care Centers' },
                    { value: 'San Isidro Day Care Center', label: 'San Isidro DCC' },
                    { value: 'Calulut Child Development Center', label: 'Calulut CDC' },
                    { value: 'Dolores Day Care Center', label: 'Dolores DCC' },
                    { value: 'San Jose Child Development Center', label: 'San Jose CDC' },
                  ]}
                />
              </div>

              <div style={{ width: '120px' }}>
                <Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  options={[
                    { value: '2026', label: 'Year 2026' },
                    { value: '2025', label: 'Year 2025' },
                    { value: '2024', label: 'Year 2024' },
                  ]}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                Refresh
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={handlePrint}
              >
                Print Official Form 5
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handlePrint}
              >
                Export PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Official Form 5 Document Container (Exact Layout from June 2015 8-Page Form) */}
      <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: '960px', margin: '0 auto' }}>
        {/* Header Block */}
        <div className="official-doc-header">
          <div className="agency-title" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Early Childhood Care and Development Council
          </div>
          <div style={{ borderBottom: '2px solid #0f172a', margin: '6px 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>June 2015</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>Official ECCD Form</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Official Consolidated Record</span>
          </div>

          <h1 className="form-main-title" style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center', margin: '8px 0', letterSpacing: '0.02em', color: '#0f172a' }}>
            FORM 5- CONSOLIDATED CHILDREN’S PROFILE
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '12px 0 20px', fontSize: '13px', color: '#1e293b' }}>
            <span>Number of Children Surveyed:</span>
            <span style={{ borderBottom: '1px solid #0f172a', minWidth: '180px', display: 'inline-block', textAlign: 'center', fontWeight: 'bold' }}>
              {consolidation.metadata.totalChildrenSurveyed}
            </span>
          </div>
        </div>

        {/* Legal Notice */}
        <div style={{ background: 'var(--bg-subtle, #f8f2f2)', borderLeft: '4px solid #7e191b', padding: '10px 14px', fontSize: '11px', color: '#334155', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Consolidated Single-Source Intake:</strong> This profile aggregates live demographic, anthropometric, health, and logistical data directly from verified Form 2 Child Profiles without manual re-entry.
        </div>

        {/* 1. Age & 2. Sex in Grid */}
        <div className="official-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* 1. Age */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              1. Age
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Bracket</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.age.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Sex */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              2. Sex
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Category</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.sex.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px' }}>TOTAL</td>
                  <td style={{ textAlign: 'center', padding: '6px 8px' }}>{consolidation.metadata.totalChildrenSurveyed}</td>
                  <td style={{ textAlign: 'center', padding: '6px 8px' }}>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Birth Order & 4. Registered & 5. Born at in Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* 3. Birth Order */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              3. Birth Order
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px' }}>Order</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.birthOrder.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '4px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '4px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '4px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                  <td style={{ padding: '4px 8px' }}>Total</td>
                  <td style={{ textAlign: 'center', padding: '4px 8px' }}>{consolidation.metadata.totalChildrenSurveyed}</td>
                  <td style={{ textAlign: 'center', padding: '4px 8px' }}>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Registered & 5. Born At */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 4. Registered */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
                4. Registered
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '5px 8px' }}>Option</th>
                    <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                    <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.registered.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 8px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.number}</td>
                      <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.percentage}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td style={{ padding: '5px 8px' }}>Total</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{consolidation.metadata.totalChildrenSurveyed}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Born at */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
                5. Born at
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '5px 8px' }}>Place</th>
                    <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                    <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.bornAt.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 8px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.number}</td>
                      <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.percentage}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td style={{ padding: '5px 8px' }}>Total</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{consolidation.metadata.totalChildrenSurveyed}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Mother Tongue & 7. Other Dialects */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* 6. Mother Tongue */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              6. Mother Tongue
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px' }}>Language</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.motherTongue.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 7. Other dialects spoken at home */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              7. Other dialects spoken at home
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px' }}>Dialect</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.otherDialects.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. Height Table & 9. Weight Table (Full Width Tables matching Form 5 Page 2) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>8. Height (cm)</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total No. of Children: <strong>{consolidation.metadata.totalChildrenSurveyed}</strong></span>
          </div>
          <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Age Category</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>No. of Children</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Sum of Height (cm)</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Average (Sum of Height / No. of Children)</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.heightTable.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 10px' }}>{r.label}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px' }}>{r.count}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px' }}>{r.sum}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 'bold', color: '#7e191b' }}>{r.avg} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>9. Weight (kg)</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total No. of Children: <strong>{consolidation.metadata.totalChildrenSurveyed}</strong></span>
          </div>
          <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Age Category</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>No. of Children</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Sum of Weight (kg)</th>
                <th style={{ textAlign: 'center', padding: '6px 10px' }}>Average (Sum of Weight / No. of Children)</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.weightTable.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 10px' }}>{r.label}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px' }}>{r.count}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px' }}>{r.sum}</td>
                  <td style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 'bold', color: '#7e191b' }}>{r.avg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 10. Does Child Have & 11. Vaccination and Other Health Data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* 10. Does Child Have */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              10. Does the Child have:
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px' }}>Document</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Number</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.cards.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px' }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.number}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 11. Vaccines */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#0f172a' }}>
              11. Vaccination and Other Health Data
            </div>
            <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px' }}>Vaccine</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Total Yes</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Total No</th>
                  <th style={{ textAlign: 'center', padding: '5px 8px' }}>Total Don't Know</th>
                </tr>
              </thead>
              <tbody>
                {consolidation.vaccines.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.label}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.yes}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.no}</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.dontKnow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 12. Physical Attributes */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#0f172a' }}>
            12. Physical Attributes
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* 12.1 Physical Deformity */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                12.1 Physical Deformity
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Deformity</th>
                    <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.deformities.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 12.2 Problems with & 12.3 Left Handed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  12.2 Problems with:
                </div>
                <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Domain</th>
                      <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidation.problemsWith.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 6px' }}>{r.label}</td>
                        <td style={{ textAlign: 'center', padding: '4px 6px' }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  12.3 Left Handed
                </div>
                <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Handedness</th>
                      <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>Yes</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{consolidation.leftHanded.yes}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>No</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{consolidation.leftHanded.no}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 13. Siblings (Table with Age x Sex x Education) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#0f172a' }}>
            13. Siblings
          </div>
          <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Age</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Male</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Female</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>In School</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Out of School</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.siblings.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.age}</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.male}</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.female}</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.inSchool}</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px' }}>{r.outOfSchool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 14. Prior Early Childhood Experience (14.1 Nursery, 14.2 Kindergarten, 14.3 Preparatory) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#0f172a' }}>
            14. Prior Early Childhood Experience
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* 14.1 Nursery */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                14.1 Nursery
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Type</th>
                    <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.priorExperience.nursery.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 14.2 Kindergarten */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                14.2 Kindergarten
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Type</th>
                    <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.priorExperience.kindergarten.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 14.3 Preparatory */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                14.3 Preparatory
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Type</th>
                    <th style={{ textAlign: 'center', padding: '4px 6px' }}>Total No.</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidation.priorExperience.preparatory.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 15. Other Performance Related Inputs */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#0f172a' }}>
            15. Other Performance Related Inputs
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* 15.1 Studies at Home with */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                15.1 Studies at Home with
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.studiesAtHomeWith.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 15.2 Play/Interacts with Older Siblings */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                15.2 Older Siblings
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.playOlderSiblings.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 15.3 Play/Interacts with Younger Siblings */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                15.3 Younger Siblings
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.playYoungerSiblings.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 15.4 Play/Interacts with Neighbors of Same Age */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                15.4 Neighbors Same Age
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.playNeighbors.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 16. Logistics (Meal, Food, Baon, Travel, Transport, Goes with) */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '12px', color: '#0f172a' }}>
            16. Logistics
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* 16.1 Has Meal Before Going To School */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '4px', padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                16.1 Has Meal Before Going To School
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.mealBeforeSchool.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 16.3 Has Baon */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '4px', padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                16.3 Has Baon
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.hasBaon.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 16.7 Goes to School with */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '4px', padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                16.7 Goes to School with
              </div>
              <table className="official-table" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {consolidation.goesToSchoolWith.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '3px 6px' }}>{r.label}</td>
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 16.2 Food Normally Eaten by Child */}
          <div style={{ marginBottom: '16px', border: '1px solid #f1f5f9', borderRadius: '4px', padding: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              16.2 Food Normally Eaten by Child
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {consolidation.foodsNormallyEaten.map((f, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>{f.label}</span>
                  <strong style={{ color: '#7e191b' }}>{f.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* 16.4, 16.5, 16.6 Travel & Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>
                16.4 Travel Time to DCC (mins) - Average: <u>{consolidation.travelTimeToDCC.avgMinutes}</u>
              </div>
              <div style={{ marginTop: '6px' }}>
                <div>Walking: <strong>{consolidation.travelTimeToDCC.walking}</strong></div>
                <div>Private Vehicle: <strong>{consolidation.travelTimeToDCC.privateVehicle}</strong></div>
                <div>Private Transportation: <strong>{consolidation.travelTimeToDCC.privateTransportation}</strong></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>
                16.5 Travel Time to NCDC (mins) - Average: <u>{consolidation.travelTimeToNCDC.avgMinutes}</u>
              </div>
              <div style={{ marginTop: '6px' }}>
                <div>Walking: <strong>{consolidation.travelTimeToNCDC.walking}</strong></div>
                <div>Private Vehicle: <strong>{consolidation.travelTimeToNCDC.privateVehicle}</strong></div>
                <div>Private Transportation: <strong>{consolidation.travelTimeToNCDC.privateTransportation}</strong></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>
                16.6 Public Transportation & Fare: <u>{consolidation.averageFare}</u>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '6px' }}>
                {consolidation.publicTransportation.map((pt, i) => (
                  <div key={i}>{pt.label}: <strong>{pt.count}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures & CDT Certification Block */}
        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Date Accomplished:</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{consolidation.dateAccomplished}</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '260px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
              {consolidation.cdtName}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Name and Signature of CDT
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '24px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
          <span>Early Childhood Care and Development Council • June 2015</span>
          <span>Form 5 — Consolidated Children's Profile • Official Copy</span>
          <span>Page 1 of 8</span>
        </div>
      </div>
    </div>
  );
}

export default OfficialForm5ConsolidatedReport;
