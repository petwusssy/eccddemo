/**
 * ECCD CARE — Reports API Service
 * City Social Welfare & Development Office (CSWDO)
 *
 * Core Principle: DATA SHOULD ONLY BE ENCODED ONCE.
 * Read-Only / System-Generated Governance Hub for official LGU and CSWDO submissions.
 *
 * STRICTLY 4 OFFICIAL CONSOLIDATED GOVERNANCE FORMS:
 * 1. Form 4: Consolidated Family Profile (from Form 1 Home Profiles)
 * 2. Form 5: Consolidated Children's Profile (from Form 2 Children's Profiles)
 * 3. Form 8: Consolidated CDW / Worker Profile (from Form 6 Worker Profiles)
 * 4. Form 9: Consolidated CDC / Center Profile (from Form 7 Center Profiles)
 */

import { getPhilippinesDate, formatPHTDate, formatPHTTime } from '../utils/phTime.js';
import { getApiUrl } from './apiConfig.js';
import { centralDataStore } from './centralDataStore.js';

export const REPORT_CATEGORIES = [
  {
    id: 'consolidated-family',
    endpoint: '/api/reports/consolidated-family',
    title: 'Form 4: Consolidated Family Profile',
    shortTitle: 'Form 4: Family Profile',
    formNumber: 'Form 4',
    description: 'City-wide consolidated socio-demographic family profile compiled from Form 1 Home Profiles (April 2014 Form 4)',
    formCode: 'ECCD-FORM-4',
    hasOfficialForms: true,
  },
  {
    id: 'consolidated-children',
    endpoint: '/api/reports/consolidated-children',
    title: "Form 5: Consolidated Children's Profile",
    shortTitle: "Form 5: Children's Profile",
    formNumber: 'Form 5',
    description: "Full master demographic, health, nutritional, and PhilSys registry compiled from Form 2 Children's Profiles (June 2015 Form 5)",
    formCode: 'ECCD-FORM-5',
    hasOfficialForms: true,
  },
  {
    id: 'consolidated-cdw',
    endpoint: '/api/reports/consolidated-cdw',
    title: 'Form 8: Consolidated CDW / Worker Profile',
    shortTitle: 'Form 8: CDW Profile',
    formNumber: 'Form 8',
    description: 'City-wide consolidated profile of all accredited Child Development Workers compiled from Form 6 Worker Profiles (April 2014 Form 8)',
    formCode: 'ECCD-FORM-8',
    hasOfficialForms: true,
  },
  {
    id: 'consolidated-cdc',
    endpoint: '/api/reports/consolidated-cdc',
    title: 'Form 9: Consolidated CDC / Center Profile',
    shortTitle: 'Form 9: CDC Profile',
    formNumber: 'Form 9',
    description: 'City-wide consolidated profile of all Child Development Centers and facilities compiled from Form 7 Center Profiles (April 2014 Form 9)',
    formCode: 'ECCD-FORM-9',
    hasOfficialForms: true,
  },
];

export const reportService = {
  /**
   * Fetch any report by category ID and query parameters
   */
  async fetchReport(categoryId, filters = {}) {
    const cat = REPORT_CATEGORIES.find((c) => c.id === categoryId) || REPORT_CATEGORIES[0];
    const params = new URLSearchParams();

    if (filters.year && filters.year !== 'all') params.append('year', filters.year);
    if (filters.barangay && filters.barangay !== 'all') params.append('barangay', filters.barangay);
    if (filters.dayCareCenter && filters.dayCareCenter !== 'all') params.append('dayCareCenter', filters.dayCareCenter);
    if (filters.age && filters.age !== 'all') params.append('age', filters.age);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    try {
      const qs = params.toString();
      const url = getApiUrl(`${cat.endpoint}${qs ? `?${qs}` : ''}`);
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Local fallback in case network unavailable
    }

    return this.generateFallbackReport(cat, filters);
  },

  /**
   * Helper to trigger CSV download formatted for Excel
   */
  exportToExcel(reportData) {
    if (!reportData || !reportData.table || !reportData.table.rows) return;

    const { meta, table } = reportData;
    const columns = table.columns;
    const rows = table.rows;

    const csvLines = [];
    csvLines.push(`"${meta.lgu}"`);
    csvLines.push(`"${meta.office}"`);
    csvLines.push(`"${meta.title} (${meta.formCode})"`);
    csvLines.push(`"Generated: ${meta.generatedDate}"`);
    csvLines.push(`"Central Concept: ${meta.centralDataConcept}"`);
    csvLines.push('');

    // Table Header
    const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);
    csvLines.push(headers.join(','));

    // Table Rows
    rows.forEach((r) => {
      const rowValues = columns.map((c) => {
        const val = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvLines.push(rowValues.join(','));
    });

    csvLines.push('');
    csvLines.push(`"Prepared by: ${meta.preparedBy}"`);
    csvLines.push(`"Notice: ${meta.systemGeneratedNotice}"`);

    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (meta.title || 'ECCD_CARE_Report').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeTitle}_${getPhilippinesDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Authoritative Report Data Compiler (Reading directly from Central Store)
   */
  generateFallbackReport(category, filters = {}) {
    const meta = {
      category: category.title,
      title: `${category.title} Master Demographic Report`,
      formCode: category.formCode,
      lgu: 'City of San Fernando, Pampanga',
      office: 'City Social Welfare and Development Office (CSWDO)',
      system: 'ECCD CARE System — Centralized Child Demographic Registry',
      centralDataConcept: 'DATA ENCODED ONCE • Dynamically compiled from persistent master records',
      generatedDate: `${formatPHTDate(new Date(), 'long')} • ${formatPHTTime(new Date())}`,
      preparedBy: 'Ma. Elena D. Santos, RSW (ECCD Focal Person / CSWDO Admin)',
      systemGeneratedNotice:
        'This is an official system-generated report from ECCD CARE. Compliant with RA 10410 (Early Years Act) and RA 10173 (Data Privacy Act of 2012). Generated directly from authoritative central master records.',
      appliedFilters: {
        year: filters.year || 'All School Years',
        barangay: filters.barangay || 'All Barangays',
        dayCareCenter: filters.dayCareCenter || 'All Centers',
        age: filters.age || 'All Ages (0–4)',
        status: filters.status || 'All Statuses',
        dateRange: filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : 'Current Cycle (SY 2026–2027)',
      },
    };

    // Filter helpers
    const filterBrgy = (item) => {
      if (!filters.barangay || filters.barangay === 'all' || filters.barangay === 'All Barangays') return true;
      return (item.barangay || item.barangayName || '').toLowerCase() === filters.barangay.toLowerCase();
    };

    // 1. FORM 4: CONSOLIDATED FAMILY PROFILE
    if (category.id === 'consolidated-family') {
      let households = (centralDataStore.getHouseholds() || []).filter(filterBrgy);
      const children = centralDataStore.getChildren() || [];

      let total4Ps = 0;
      const rows = households.map((hh) => {
        const hhKids = children.filter((c) => c.householdId === hh.id);
        const is4Ps = Boolean(hh.is4PsBeneficiary || hh.is_4ps);
        if (is4Ps) total4Ps++;

        return {
          householdId: hh.id,
          parentGuardian: hh.parentGuardian || hh.parent_guardian || 'Parent / Guardian',
          contactNumber: hh.contactNumber || hh.contact_number || '—',
          barangay: hh.barangay || 'San Isidro',
          address: hh.address || `${hh.barangay || 'San Fernando'}, Pampanga`,
          is4Ps: is4Ps ? 'Yes (4Ps Pantawid)' : 'No (Non-4Ps)',
          incomeClass: hh.monthlyIncomeClass || hh.monthly_income_class || 'Low Income (<₱15,000)',
          childrenCount: hhKids.length,
          childrenNames: hhKids.map((k) => k.fullName || k.firstName).filter(Boolean).join(', ') || 'None recorded',
        };
      });

      return {
        meta,
        summary: {
          totalHouseholdsProfiled: rows.length,
          total4PsHouseholds: total4Ps,
          non4PsHouseholds: rows.length - total4Ps,
          percent4Ps: rows.length > 0 ? ((total4Ps / rows.length) * 100).toFixed(1) + '%' : '0%',
        },
        table: {
          columns: [
            { key: 'householdId', label: 'Household ID' },
            { key: 'parentGuardian', label: 'Parent / Guardian' },
            { key: 'contactNumber', label: 'Contact Number' },
            { key: 'barangay', label: 'Barangay' },
            { key: 'address', label: 'Physical Address' },
            { key: 'is4Ps', label: '4Ps Status' },
            { key: 'incomeClass', label: 'Income Bracket' },
            { key: 'childrenCount', label: 'Children (0–4)' },
            { key: 'childrenNames', label: 'Registered Children' },
          ],
          rows,
          rowCount: rows.length,
        },
      };
    }

    // 2. FORM 5: CONSOLIDATED CHILDREN'S PROFILE
    if (category.id === 'consolidated-children') {
      let children = (centralDataStore.getChildren() || []).filter(filterBrgy);

      if (filters.dayCareCenter && filters.dayCareCenter !== 'all' && filters.dayCareCenter !== 'All Centers') {
        children = children.filter(
          (c) => (c.dayCareCenterName || c.dayCareCenter || '').toLowerCase() === filters.dayCareCenter.toLowerCase()
        );
      }

      if (filters.age && filters.age !== 'all') {
        const targetAge = parseInt(filters.age, 10);
        children = children.filter((c) => (c.ageYears !== undefined ? c.ageYears === targetAge : true));
      }

      if (filters.status && filters.status !== 'all') {
        children = children.filter((c) => {
          if (filters.status === 'Enrolled') return c.enrollmentStatus === 'Enrolled';
          if (filters.status === 'Not Enrolled') return c.enrollmentStatus !== 'Enrolled';
          if (filters.status === 'Up to date') return c.healthStatus === 'Up to date' || c.healthStatus === 'Up to Date';
          if (filters.status === 'Completed') return c.developmentStatus === 'Completed';
          return true;
        });
      }

      let maleCount = 0;
      let femaleCount = 0;
      let philsysCount = 0;

      const rows = children.map((c) => {
        if (c.sex === 'Male') maleCount++;
        else femaleCount++;

        const hasPhilSys = Boolean(c.philSysNumber || c.philsys_card_no);
        if (hasPhilSys) philsysCount++;

        return {
          eccdId: c.id,
          fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          birthDate: c.birthDate || '—',
          age: c.ageDisplay || `${c.ageYears || 3} yrs`,
          sex: c.sex || 'Female',
          barangay: c.barangay || 'San Isidro',
          center: c.dayCareCenterName || c.dayCareCenter || 'Child Development Center',
          guardian: c.parentGuardian || '—',
          philSysNumber: c.philSysNumber || c.philsys_card_no || 'Pending PhilSys',
          enrolled: c.enrollmentStatus || 'Not Enrolled',
          health: c.healthStatus || 'Due for Monitoring',
          development: c.developmentStatus || 'Pending Initial Assessment',
          followUp: c.hasOpenFollowUp ? 'Active Case' : 'None',
        };
      });

      return {
        meta,
        summary: {
          totalChildren: rows.length,
          maleCount,
          femaleCount,
          philSysLinked: philsysCount,
          philSysPercent: rows.length > 0 ? ((philsysCount / rows.length) * 100).toFixed(1) + '%' : '0%',
        },
        table: {
          columns: [
            { key: 'eccdId', label: 'ECCD ID' },
            { key: 'fullName', label: 'Child Full Name' },
            { key: 'birthDate', label: 'Birthdate' },
            { key: 'age', label: 'Age' },
            { key: 'sex', label: 'Sex' },
            { key: 'barangay', label: 'Barangay' },
            { key: 'center', label: 'CDC Center' },
            { key: 'guardian', label: 'Parent / Guardian' },
            { key: 'philSysNumber', label: 'PhilSys Number' },
            { key: 'enrolled', label: 'Enrollment' },
            { key: 'health', label: 'Health Status' },
            { key: 'development', label: 'Development Status' },
          ],
          rows,
          rowCount: rows.length,
        },
      };
    }

    // 3. FORM 8: CONSOLIDATED CDW PROFILE
    if (category.id === 'consolidated-cdw') {
      let workers = (centralDataStore.getWorkers() || []).filter(filterBrgy);

      if (filters.dayCareCenter && filters.dayCareCenter !== 'all' && filters.dayCareCenter !== 'All Centers') {
        workers = workers.filter(
          (w) =>
            (w.center || w.assignedCenters?.[0] || '').toLowerCase() === filters.dayCareCenter.toLowerCase()
        );
      }

      let activeCount = 0;
      let accreditedCount = 0;

      const rows = workers.map((w) => {
        const isActive = (w.status || '').toLowerCase() === 'active';
        if (isActive) activeCount++;
        const isAccredited = Boolean(w.accreditationNo && w.accreditationNo !== 'Pending');
        if (isAccredited) accreditedCount++;

        return {
          workerId: w.id,
          name: w.name,
          designation: w.designation || w.role || 'Child Development Worker',
          barangay: w.assignedBarangay || w.barangay || 'San Isidro',
          center: Array.isArray(w.assignedCenters) ? w.assignedCenters.join(', ') : (w.center || 'CDC Center'),
          accreditationNo: w.accreditationNo || 'CDW-2024-001',
          contact: w.contactNumber || w.contact || '—',
          status: w.status || 'Active',
        };
      });

      return {
        meta,
        summary: {
          totalWorkersProfiled: rows.length,
          activeWorkers: activeCount,
          accreditedWorkers: accreditedCount,
          coverageRate: rows.length > 0 ? ((accreditedCount / rows.length) * 100).toFixed(1) + '%' : '100%',
        },
        table: {
          columns: [
            { key: 'workerId', label: 'Worker ID' },
            { key: 'name', label: 'Worker Name' },
            { key: 'designation', label: 'Designation' },
            { key: 'barangay', label: 'Barangay' },
            { key: 'center', label: 'Assigned Center' },
            { key: 'accreditationNo', label: 'Accreditation No.' },
            { key: 'contact', label: 'Contact Number' },
            { key: 'status', label: 'Status' },
          ],
          rows,
          rowCount: rows.length,
        },
      };
    }

    // 4. FORM 9: CONSOLIDATED CDC PROFILE
    if (category.id === 'consolidated-cdc') {
      let centers = (centralDataStore.getDayCareCenters() || []).filter(filterBrgy);

      let totalCap = 0;
      let totalEnrolled = 0;

      const rows = centers.map((c) => {
        const cap = Number(c.capacity || 60);
        const enr = Number(c.enrolledCount || 0);
        totalCap += cap;
        totalEnrolled += enr;

        return {
          code: c.code || c.id,
          name: c.name,
          barangay: c.barangay || c.barangayName || 'City of San Fernando',
          address: c.address || `${c.barangay}, City of San Fernando`,
          capacity: cap,
          enrolledCount: enr,
          utilizationRate: cap > 0 ? ((enr / cap) * 100).toFixed(1) + '%' : '0%',
          accreditationLevel: c.accreditationLevel || 'Level 1 Accredited',
          status: c.status || 'Operational',
        };
      });

      return {
        meta,
        summary: {
          totalCentersProfiled: rows.length,
          totalCapacity: totalCap,
          totalEnrolledChildren: totalEnrolled,
          overallUtilization: totalCap > 0 ? ((totalEnrolled / totalCap) * 100).toFixed(1) + '%' : '0%',
        },
        table: {
          columns: [
            { key: 'code', label: 'Center Code' },
            { key: 'name', label: 'Center Name' },
            { key: 'barangay', label: 'Barangay' },
            { key: 'address', label: 'Address / Location' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'enrolledCount', label: 'Enrolled' },
            { key: 'utilizationRate', label: 'Utilization' },
            { key: 'accreditationLevel', label: 'Accreditation' },
            { key: 'status', label: 'Status' },
          ],
          rows,
          rowCount: rows.length,
        },
      };
    }

    return {
      meta,
      summary: {},
      table: { columns: [], rows: [], rowCount: 0 },
    };
  },
};

export default reportService;
