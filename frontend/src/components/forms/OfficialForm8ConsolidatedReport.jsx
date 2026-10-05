import React, { useMemo } from 'react';
import {
  Printer,
  Download,
  Building,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { officialFormsService } from '../../services/officialFormsService';
import { useToast } from '../ui/Toast';

export function OfficialForm8ConsolidatedReport() {
  const { addToast } = useToast();

  const consolidation = useMemo(() => {
    return officialFormsService.generateForm8Consolidation();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['FORM 8 — CONSOLIDATED CHILD DEVELOPMENT WORKER PROFILE (April 2014)'],
      ['Total Barangays', consolidation.generalInfo.totalBarangays],
      ['Total CDWs', consolidation.generalInfo.totalCDWs],
      ['Total CDCs', consolidation.generalInfo.totalCDCs],
      ['Income Classification', consolidation.generalInfo.incomeClassification],
      ['Total Respondents', consolidation.totalRespondents],
      [],
      ['II. CDW PERSONAL INFORMATION'],
      ['Age Bracket', 'No. of Responses', 'Percentage'],
      ...consolidation.age.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Sex', 'No. of Responses', 'Percentage'],
      ...consolidation.sex.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Religion', 'No. of Responses', 'Percentage'],
      ...consolidation.religion.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Ethnicity', 'No. of Responses', 'Percentage'],
      ...consolidation.ethnicity.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Civil Status', 'No. of Responses', 'Percentage'],
      ...consolidation.civilStatus.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['No. of Children', 'No. of Responses', 'Percentage'],
      ...consolidation.noOfChildren.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Educational Background', 'No. of Responses', 'Percentage'],
      ...consolidation.educationalBackground.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Degree', 'No. of Responses', 'Percentage'],
      ...consolidation.degree.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Eligibility', 'No. of Responses', 'Percentage'],
      ...consolidation.eligibility.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['III. WORK RELATED INFORMATION'],
      ['No. of years as Day Care Worker', 'No. of Responses', 'Percentage'],
      ...consolidation.yearsOfService.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Monthly Compensation', 'No. of Responses', 'Percentage'],
      ...consolidation.monthlyCompensation.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Total Amount of Compensation', 'No. of Responses', 'Percentage'],
      ...consolidation.totalAmountOfCompensation.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Source of Compensation', 'No. of Responses', 'Percentage'],
      ...consolidation.sourceOfCompensation.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Terms of Employment', 'No. of Responses', 'Percentage'],
      ...consolidation.termsOfEmployment.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['ECCD Related Trainings', 'No. of Responses', 'Percentage'],
      ...consolidation.eccdRelatedTrainings.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Other Courses Attended', 'No. of Responses', 'Percentage'],
      ...consolidation.otherCoursesAttended.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Other Courses Completion Status', 'No. of Responses', 'Percentage'],
      ...consolidation.courseCompletionStatus.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Status as a Day Care Worker', 'No. of Responses', 'Percentage'],
      ...consolidation.accreditationStatus.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Level of Accreditation', 'No. of Responses', 'Percentage'],
      ...consolidation.accreditationLevel.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['IV. WORKING CONDITIONS'],
      ['Total Children Served in Municipality', consolidation.workingConditions.totalChildrenServedInMunicipality],
      ['Total Children Served per Worker', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.childrenServedBrackets.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Sessions per Day', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.sessionsPerDay.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Hours per Session', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.hoursPerSession.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Age of Children Handled', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.ageBeingHandled.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['Hours Staying in Center', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.hoursInCenter.map((r) => [r.label, r.count, r.percentage]),
      [],
      ['How Sessions Conducted', 'No. of Responses', 'Percentage'],
      ...consolidation.workingConditions.howSessionsConducted.map((r) => [r.label, r.count, r.percentage]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECCD_Form_8_Consolidated_CDW_Profile_San_Fernando.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Form 8 CSV exported successfully.', 'success');
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
    <div className="official-form-8-view">
      {/* Action Header */}
      <Card style={{ marginBottom: 'var(--space-4)' }} className="no-print">
        <CardBody style={{ padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                FORM 8 — CONSOLIDATED CHILD DEVELOPMENT WORKER PROFILE
              </span>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Live City-Wide Aggregation
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
                Print Official Form 8
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

      {/* Official Form 8 Document Container (Exact Layout from April 2014 6-Page Form) */}
      <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: '100%', margin: '0 auto' }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', fontWeight: 'bold' }}>
            Early Childhood Care and Development Council
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>April 2014</span>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              FORM 8 - CONSOLIDATED CHILD DEVELOPMENT WORKER PROFILE
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
              2. Total Number of CDWs in City: <strong>{consolidation.generalInfo.totalCDWs}</strong>
            </div>
            <div>
              3. Total Number of CDCs in City: <strong>{consolidation.generalInfo.totalCDCs}</strong>
            </div>
            <div>
              4. Income Classification: <strong>{consolidation.generalInfo.incomeClassification}</strong>
            </div>
          </div>
        </div>

        {/* II. CDW Personal Information */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
              II. CHILD DEVELOPMENT WORKER PERSONAL INFORMATION
            </span>
            <span style={{ fontSize: '12px', color: '#ba1607', fontWeight: 600 }}>
              5. Total No. Respondents: {consolidation.totalRespondents}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {renderSectionTable('Age', 6, consolidation.age, 'Age Bracket')}
            {renderSectionTable('Sex', 7, consolidation.sex, 'Sex')}
            {renderSectionTable('Religion', 8, consolidation.religion, 'Religion')}
            {renderSectionTable('Ethnicity', 9, consolidation.ethnicity, 'Ethnicity')}
            {renderSectionTable('Civil Status', 10, consolidation.civilStatus, 'Civil Status')}
            {renderSectionTable('No. of Children', 11, consolidation.noOfChildren, 'Children Range')}
            {renderSectionTable('Educational Background', 12, consolidation.educationalBackground, 'Education')}
            {renderSectionTable('Degree', 13, consolidation.degree, 'Degree Category')}
            {renderSectionTable('Eligibility', 14, consolidation.eligibility, 'Eligibility')}
          </div>
        </div>

        {/* III. Work Related Information */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
              III. WORK RELATED INFORMATION
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {renderSectionTable('No. of years as Day Care Worker', 15, consolidation.yearsOfService, 'Tenure')}
            {renderSectionTable('Monthly Compensation', 16, consolidation.monthlyCompensation, 'Compensation Type')}
            {renderSectionTable('Total Amount of Compensation', 17, consolidation.totalAmountOfCompensation, 'Amount Bracket')}
            {renderSectionTable('Source of Compensation', 18, consolidation.sourceOfCompensation, 'Funding Source')}
            {renderSectionTable('Terms of Employment', 19, consolidation.termsOfEmployment, 'Employment Terms')}
            {renderSectionTable('ECCD Related Trainings', 20, consolidation.eccdRelatedTrainings, 'Trainings Attended')}
            {renderSectionTable('Other Courses Attended', 21, consolidation.otherCoursesAttended, 'Course Domain')}
            {renderSectionTable('Course Completion', 22, consolidation.courseCompletionStatus, 'Completion Status')}
            {renderSectionTable('Status as a Day Care Worker', 23, consolidation.accreditationStatus, 'Status')}
            {renderSectionTable('Level of Accreditation', 24, consolidation.accreditationLevel, 'Level')}
          </div>
        </div>

        {/* IV. Working Conditions */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
              IV. WORKING CONDITIONS
            </span>
            <span style={{ fontSize: '12px', color: '#ba1607', fontWeight: 600 }}>
              25. Total Children Served in City: {consolidation.workingConditions.totalChildrenServedInMunicipality}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {renderSectionTable('Total Number of Children Served', 26, consolidation.workingConditions.childrenServedBrackets, 'Served per Worker')}
            {renderSectionTable('No. of Session/s Conducted per Day', 27, consolidation.workingConditions.sessionsPerDay, 'Sessions / Day')}
            {renderSectionTable('No. of Hour per Session', 28, consolidation.workingConditions.hoursPerSession, 'Hours / Session')}
            {renderSectionTable('Age of Children Being Handled', 29, consolidation.workingConditions.ageBeingHandled, 'Age Bracket')}
            {renderSectionTable('No. of Hours Staying in the Center', 30, consolidation.workingConditions.hoursInCenter, 'Center Hours')}
            {renderSectionTable('How Sessions are Conducted', 31, consolidation.workingConditions.howSessionsConducted, 'Methodology')}
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Date Accomplished:</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{consolidation.generalInfo.generatedAt}</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '240px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
              Maritess S. Pangilinan, CDT
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Name and Signature of CDT
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
          <span>Early Childhood Care and Development Council • April 2014</span>
          <span>Form 8 — Consolidated Child Development Worker Profile</span>
          <span>Page 1 of 6</span>
        </div>
      </div>
    </div>
  );
}

export default OfficialForm8ConsolidatedReport;
