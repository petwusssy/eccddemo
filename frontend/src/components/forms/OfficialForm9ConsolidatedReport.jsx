import React, { useMemo } from 'react';
import {
  Printer,
  Download,
  Building,
  School,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { officialFormsService } from '../../services/officialFormsService';
import { useToast } from '../ui/Toast';

export function OfficialForm9ConsolidatedReport({ initialBarangay = 'All' } = {}) {
  const { addToast } = useToast();

  const [filterBarangay, setFilterBarangay] = React.useState(
    initialBarangay && initialBarangay !== 'all' ? initialBarangay : 'All'
  );

  React.useEffect(() => {
    if (initialBarangay && initialBarangay !== 'all') {
      setFilterBarangay(initialBarangay);
    } else if (initialBarangay === 'all') {
      setFilterBarangay('All');
    }
  }, [initialBarangay]);

  const consolidation = useMemo(() => {
    return officialFormsService.generateForm9Consolidation({
      barangay: filterBarangay,
    });
  }, [filterBarangay]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['FORM 9 — CONSOLIDATED CHILD DEVELOPMENT CENTER PROFILE (April 2014)'],
      ['Total Barangays', consolidation.generalInfo.totalBarangays],
      ['Total CDCs', consolidation.generalInfo.totalCDCs],
      ['Total CDWs', consolidation.generalInfo.totalCDWs],
      ['Income Classification', consolidation.generalInfo.incomeClassification],
      ['Total Respondents', consolidation.totalRespondents],
      [],
      ['5. YEAR ESTABLISHED'],
      ['Category', 'No. of Responses', 'Percentage'],
      ...consolidation.yearEstablished.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['6. STATUS AS A CHILD DEVELOPMENT CENTER'],
      ...consolidation.status.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['7. LEVEL OF ACCREDITATION'],
      ...consolidation.level.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['8. NO. OF CDW IN THE CENTER'],
      ...consolidation.cdwInCenter.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['9. SERVICES OFFERED'],
      ...consolidation.servicesOffered.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['10. AVAILABLE FACILITIES'],
      ...consolidation.facilities.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['11. UTILITIES & SERVICES OFFERED'],
      ...consolidation.utilities.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['12. AVAILABLE EQUIPMENT & LEARNING MATERIALS'],
      ...consolidation.learningMaterials.map((r) => [r.label, r.count, r.percentage]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECCD_Form_9_Consolidated_CDC_Profile_San_Fernando.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Form 9 CSV exported successfully.', 'success');
  };

  const renderSectionTable = (title, number, rows, labelCol = 'Category') => (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
        {number ? `${number}. ` : ''}{title}
      </div>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
            <th style={{ textAlign: 'left', padding: '5px 8px' }}>{labelCol}</th>
            <th style={{ textAlign: 'center', padding: '5px 8px', width: '110px' }}>No. of Responses</th>
            <th style={{ textAlign: 'center', padding: '5px 8px', width: '90px' }}>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '4px 8px' }}>{r.label}</td>
              <td style={{ textAlign: 'center', padding: '4px 8px' }}>{r.count}</td>
              <td style={{ textAlign: 'center', padding: '4px 8px' }}>{r.percentage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="official-form-9-view">
      {/* Action Header */}
      <Card style={{ marginBottom: 'var(--space-4)' }} className="no-print">
        <CardBody style={{ padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                FORM 9 — CONSOLIDATED CHILD DEVELOPMENT CENTER PROFILE
              </span>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Live City-Wide Aggregation
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
                Print Official Form 9
              </Button>
              <Button variant="secondary" size="sm" icon={Download} onClick={handlePrint}>
                Export PDF
              </Button>
              <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Official Form 9 Document Container (Exact Layout from April 2014 3-Page Form) */}
      <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: '100%', margin: '0 auto' }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', fontWeight: 'bold' }}>
            Early Childhood Care and Development Council
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>April 2014</span>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Form 9 - CONSOLIDATED CHILD DEVELOPMENT CENTER PROFILE
            </h1>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Official LGU Masterlist</span>
          </div>
          <div style={{ fontSize: '11px', color: '#ba1607', fontWeight: 600 }}>
            City Social Welfare and Development Office • City of San Fernando, Pampanga
          </div>
        </div>

        {/* I. General Information */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '10px' }}>
            I. GENERAL INFORMATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div>
              1. Total Number of Barangays in City: <strong>{consolidation.generalInfo.totalBarangays}</strong>
            </div>
            <div>
              2. Total Number of CDCs in City: <strong>{consolidation.generalInfo.totalCDCs}</strong>
            </div>
            <div>
              3. Total Number of CDWs in City: <strong>{consolidation.generalInfo.totalCDWs}</strong>
            </div>
            <div>
              4. Income Classification: <strong>{consolidation.generalInfo.incomeClassification}</strong>
            </div>
          </div>
        </div>

        {/* Section 5: Year Established & Section 6: Status & Section 7: Level */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {renderSectionTable('Year Established', 5, consolidation.yearEstablished, 'Period Established')}
          {renderSectionTable('Status as a Child Development Center', 6, consolidation.status, 'Accreditation Status')}
          {renderSectionTable('Level of Accreditation', 7, consolidation.level, 'Level')}
          {renderSectionTable('No. Of CDW in the Center', 8, consolidation.cdwInCenter, 'Assigned Workers')}
        </div>

        {/* Section 9: Services Offered & Section 10: Available Facilities */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {renderSectionTable('Services Offered', 9, consolidation.servicesOffered, 'Service Domain')}
          {renderSectionTable('Available Facilities', 10, consolidation.facilities, 'Facility Type')}
        </div>

        {/* Section 11: Utilities & Section 12: Learning Materials */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {renderSectionTable('Available Equipment & Learning Materials / Utilities', 11, consolidation.utilities, 'Utility / Fixture')}
          {renderSectionTable('Available Eqpt & Learning Materials', 12, consolidation.learningMaterials, 'Learning Material')}
        </div>

        {/* Signatures & Certification Block */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Date:</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{consolidation.generalInfo.generatedAt}</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '240px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
              Maritess S. Pangilinan, CDT
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              CDT Signature
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
          <span>Early Childhood Care and Development Council • April 2014</span>
          <span>Form 9 — Consolidated Child Development Center Profile</span>
          <span>Page 1 of 3</span>
        </div>
      </div>
    </div>
  );
}

export default OfficialForm9ConsolidatedReport;
