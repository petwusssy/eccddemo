import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  ChevronRight,
  Shield,
  Award,
} from 'lucide-react';
import { reportService, REPORT_CATEGORIES } from '../../services/reportService';
import { barangaysList, dayCareCentersList } from '../../data/mockData';
import Button from '../ui/Button';
import { OfficialForm4ConsolidatedReport } from '../forms/OfficialForm4ConsolidatedReport';
import { OfficialForm5ConsolidatedReport } from '../forms/OfficialForm5ConsolidatedReport';
import { OfficialForm8ConsolidatedReport } from '../forms/OfficialForm8ConsolidatedReport';
import { OfficialForm9ConsolidatedReport } from '../forms/OfficialForm9ConsolidatedReport';

export function ReportsView({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState(REPORT_CATEGORIES[0].id);
  const [reportViewMode, setReportViewMode] = useState('official'); // 'official' | 'standard'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    year: 'all',
    barangay: 'all',
    dayCareCenter: 'all',
    age: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Fetch report data
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.fetchReport(selectedCategory, filters);
      setReportData(data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      year: 'all',
      barangay: 'all',
      dayCareCenter: 'all',
      age: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (reportData) {
      reportService.exportToExcel(reportData);
    }
  };

  const currentCategoryObj = REPORT_CATEGORIES.find(c => c.id === selectedCategory) || REPORT_CATEGORIES[0];

  return (
    <div className="reports-layout">
      {/* =========================================================================
          1. REPORT CATEGORIES SELECTOR
          ========================================================================= */}
      <div className="reports-category-panel">
        <div className="reports-category-header">
          <div className="reports-category-title">
            <Layers size={16} />
            <span>Select Report Category ({REPORT_CATEGORIES.length})</span>
          </div>
        </div>

        <div className="reports-category-chips">
          {REPORT_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.id}
              type="button"
              className={`report-cat-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span className="report-cat-badge">{idx + 1}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          2. FILTERS & ACTIONS TOOLBAR
          ========================================================================= */}
      <div className="reports-toolbar">
        <div className="reports-filter-grid">
          {/* Year */}
          <div className="report-filter-item">
            <label className="report-filter-label">School Year</label>
            <select
              value={filters.year}
              onChange={e => handleFilterChange('year', e.target.value)}
              className="report-filter-select"
            >
              <option value="all">All School Years</option>
              <option value="SY 2026–2027">SY 2026–2027 (Active)</option>
              <option value="SY 2025–2026">SY 2025–2026</option>
              <option value="SY 2024–2025">SY 2024–2025</option>
            </select>
          </div>

          {/* Barangay */}
          <div className="report-filter-item">
            <label className="report-filter-label">Barangay</label>
            <select
              value={filters.barangay}
              onChange={e => handleFilterChange('barangay', e.target.value)}
              className="report-filter-select"
            >
              <option value="all">All Barangays</option>
              {barangaysList.map(b => {
                const name = typeof b === 'object' ? b.name : b;
                const id = typeof b === 'object' ? (b.id || b.name) : b;
                return (
                  <option key={id} value={name}>{name}</option>
                );
              })}
            </select>
          </div>

          {/* Day Care Center */}
          <div className="report-filter-item">
            <label className="report-filter-label">Day Care Center</label>
            <select
              value={filters.dayCareCenter}
              onChange={e => handleFilterChange('dayCareCenter', e.target.value)}
              className="report-filter-select"
            >
              <option value="all">All Day Care Centers</option>
              {dayCareCentersList.map(c => {
                const name = typeof c === 'object' ? c.name : c;
                const id = typeof c === 'object' ? (c.id || c.name) : c;
                return (
                  <option key={id} value={name}>{name}</option>
                );
              })}
            </select>
          </div>

          {/* Age */}
          <div className="report-filter-item">
            <label className="report-filter-label">Target Age</label>
            <select
              value={filters.age}
              onChange={e => handleFilterChange('age', e.target.value)}
              className="report-filter-select"
            >
              <option value="all">All Ages (0–4 Years)</option>
              <option value="0">0 Years (Infants &lt;12 mos)</option>
              <option value="1">1 Year Old</option>
              <option value="2">2 Years Old</option>
              <option value="3">3 Years Old</option>
              <option value="4">4 Years Old</option>
            </select>
          </div>

          {/* Status */}
          <div className="report-filter-item">
            <label className="report-filter-label">Status Filter</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="report-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="Enrolled">Enrolled in Day Care</option>
              <option value="Not Enrolled">Not Enrolled</option>
              <option value="Up to date">Health: Up to date</option>
              <option value="Due">Health: Due/Overdue</option>
              <option value="Completed">Development: Completed</option>
              <option value="Follow-up">Follow-up Required</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="report-filter-item">
            <label className="report-filter-label">Date Filter</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="report-filter-input"
                title="Start Date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="report-filter-input"
                title="End Date"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="reports-actions-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {reportData && reportData.table
                ? `Showing ${reportData.table.rowCount} records compiled`
                : 'Loading records...'}
            </span>
          </div>

          <div className="reports-action-buttons">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Print
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
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. GOVERNMENT REPORT DOCUMENT PREVIEW
          ========================================================================= */}
      {selectedCategory === 'consolidated-family' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', justifyContent: 'center' }} className="no-print">
          <Button
            variant={reportViewMode === 'official' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('official')}
          >
            <FileText size={14} /> Official ECCD Form 4 Document (April 2014)
          </Button>
          <Button
            variant={reportViewMode === 'standard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('standard')}
          >
            <Database size={14} /> Tabular Central Dataset
          </Button>
        </div>
      )}

      {selectedCategory === 'consolidated-children' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', justifyContent: 'center' }} className="no-print">
          <Button
            variant={reportViewMode === 'official' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('official')}
          >
            <FileText size={14} /> Official ECCD Form 5 Document (June 2015)
          </Button>
          <Button
            variant={reportViewMode === 'standard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('standard')}
          >
            <Database size={14} /> Tabular Central Dataset
          </Button>
        </div>
      )}

      {selectedCategory === 'consolidated-cdw' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', justifyContent: 'center' }} className="no-print">
          <Button
            variant={reportViewMode === 'official' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('official')}
          >
            <FileText size={14} /> Official ECCD Form 8 Document (April 2014)
          </Button>
          <Button
            variant={reportViewMode === 'standard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('standard')}
          >
            <Database size={14} /> Tabular Central Dataset
          </Button>
        </div>
      )}

      {selectedCategory === 'consolidated-cdc' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', justifyContent: 'center' }} className="no-print">
          <Button
            variant={reportViewMode === 'official' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('official')}
          >
            <FileText size={14} /> Official ECCD Form 9 Document (April 2014)
          </Button>
          <Button
            variant={reportViewMode === 'standard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setReportViewMode('standard')}
          >
            <Database size={14} /> Tabular Central Dataset
          </Button>
        </div>
      )}

      {selectedCategory === 'consolidated-family' && reportViewMode === 'official' ? (
        <OfficialForm4ConsolidatedReport />
      ) : selectedCategory === 'consolidated-children' && reportViewMode === 'official' ? (
        <OfficialForm5ConsolidatedReport />
      ) : selectedCategory === 'consolidated-cdw' && reportViewMode === 'official' ? (
        <OfficialForm8ConsolidatedReport />
      ) : selectedCategory === 'consolidated-cdc' && reportViewMode === 'official' ? (
        <OfficialForm9ConsolidatedReport />
      ) : (
      <div className="report-doc-wrapper">
        <div className="report-document">
          {/* Header */}
          <div className="report-gov-header">
            <div className="report-gov-seal-left">
              <span>LGU CSFP</span>
            </div>

            <div className="report-gov-titles">
              <div className="report-gov-republic">Republic of the Philippines</div>
              <div className="report-gov-province">Province of Pampanga</div>
              <div className="report-gov-city">CITY OF SAN FERNANDO</div>
              <div className="report-gov-office">City Social Welfare and Development Office (CSWDO)</div>
              <div className="report-gov-system">ECCD CARE — Child Assessment, Registration & Early-support System</div>
            </div>

            <div className="report-gov-seal-right">
              <span>CSWDO</span>
            </div>
          </div>

          {/* Report Title & Form Control Number */}
          <div className="report-title-section">
            <div>
              <div className="report-doc-title">
                {reportData?.meta?.title || currentCategoryObj.title}
              </div>
              <div className="report-doc-sub">
                {currentCategoryObj.description}
              </div>
            </div>
            <div className="report-form-code-badge">
              {reportData?.meta?.formCode || currentCategoryObj.formCode}
            </div>
          </div>

          {/* Centralized Concept & Generation Metadata */}
          <div className="report-concept-banner">
            <div className="report-concept-tag">
              <Database size={15} />
              <span>DATA ENCODED ONCE</span>
            </div>
            <div>
              Generated on: <strong>{reportData?.meta?.generatedDate || 'Generating...'}</strong>
            </div>
          </div>

          {/* Applied Filters Strip */}
          <div className="report-meta-filters">
            <span style={{ fontWeight: 700, color: '#7e191b' }}>Filters Active:</span>
            <span className="report-filter-pill">Year: <strong>{typeof reportData?.meta?.appliedFilters?.year === 'object' ? (reportData.meta.appliedFilters.year?.name || reportData.meta.appliedFilters.year?.id) : reportData?.meta?.appliedFilters?.year}</strong></span>
            <span className="report-filter-pill">Barangay: <strong>{typeof reportData?.meta?.appliedFilters?.barangay === 'object' ? (reportData.meta.appliedFilters.barangay?.name || reportData.meta.appliedFilters.barangay?.id) : reportData?.meta?.appliedFilters?.barangay}</strong></span>
            <span className="report-filter-pill">Center: <strong>{typeof reportData?.meta?.appliedFilters?.dayCareCenter === 'object' ? (reportData.meta.appliedFilters.dayCareCenter?.name || reportData.meta.appliedFilters.dayCareCenter?.id) : reportData?.meta?.appliedFilters?.dayCareCenter}</strong></span>
            <span className="report-filter-pill">Age: <strong>{typeof reportData?.meta?.appliedFilters?.age === 'object' ? (reportData.meta.appliedFilters.age?.name || reportData.meta.appliedFilters.age?.id) : reportData?.meta?.appliedFilters?.age}</strong></span>
            <span className="report-filter-pill">Status: <strong>{typeof reportData?.meta?.appliedFilters?.status === 'object' ? (reportData.meta.appliedFilters.status?.name || reportData.meta.appliedFilters.status?.id) : reportData?.meta?.appliedFilters?.status}</strong></span>
            <span className="report-filter-pill">Period: <strong>{typeof reportData?.meta?.appliedFilters?.dateRange === 'object' ? (reportData.meta.appliedFilters.dateRange?.name || reportData.meta.appliedFilters.dateRange?.id) : reportData?.meta?.appliedFilters?.dateRange}</strong></span>
          </div>

          {/* Summary Statistics Strip */}
          {reportData?.summary && (
            <div className="report-summary-strip">
              {Object.entries(reportData.summary).map(([key, val]) => {
                // Convert camelCase to readable label
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                const displayVal = (val !== null && typeof val === 'object')
                  ? (val.name || val.count || val.total || JSON.stringify(val))
                  : String(val ?? 0);
                return (
                  <div key={key} className="report-summary-box">
                    <div className="report-summary-label">{label}</div>
                    <div className="report-summary-val">{displayVal}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Table */}
          <div className="report-table-container mobile-table-to-cards">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  {reportData?.table?.columns?.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={(reportData?.table?.columns?.length || 5) + 1}
                      style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}
                    >
                      Compiling report from central child registry...
                    </td>
                  </tr>
                ) : !reportData?.table?.rows || reportData.table.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(reportData?.table?.columns?.length || 5) + 1}
                      style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}
                    >
                      No records found matching the specified report criteria.
                    </td>
                  </tr>
                ) : (
                  reportData.table.rows.map((row, index) => (
                    <tr key={index}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {index + 1}
                      </td>
                      {reportData?.table?.columns?.map(col => {
                        const cellVal = row[col.key];
                        const displayVal = (cellVal !== undefined && cellVal !== null)
                          ? (typeof cellVal === 'object' ? (cellVal.name || cellVal.id || cellVal.label || JSON.stringify(cellVal)) : String(cellVal))
                          : '—';
                        return (
                          <td key={col.key}>
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Official ECCD Integrated Forms Hub */}
          <div className="report-official-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="report-official-banner" style={{ color: '#166534' }}>
              <CheckCircle2 size={17} color="#16a34a" />
              <span>OFFICIAL ECCD CONSOLIDATED FORMS INTEGRATED (DSWD / ECCD COUNCIL)</span>
            </div>
            <div className="report-official-pills">
              <button
                type="button"
                className="report-official-pill"
                style={{ cursor: 'pointer', background: '#ffffff', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }}
                onClick={() => {
                  setSelectedCategory('consolidated-family');
                  setReportViewMode('official');
                }}
              >
                <FileText size={13} />
                <span>Form 4 — Consolidated Family Profile</span>
              </button>
              <button
                type="button"
                className="report-official-pill"
                style={{ cursor: 'pointer', background: '#ffffff', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }}
                onClick={() => {
                  setSelectedCategory('consolidated-children');
                  setReportViewMode('official');
                }}
              >
                <FileText size={13} />
                <span>Form 5 — Consolidated Children's Profile</span>
              </button>
              <button
                type="button"
                className="report-official-pill"
                style={{ cursor: 'pointer', background: '#ffffff', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }}
                onClick={() => {
                  setSelectedCategory('consolidated-cdw');
                  setReportViewMode('official');
                }}
              >
                <FileText size={13} />
                <span>Form 8 — Consolidated Worker Profile</span>
              </button>
              <button
                type="button"
                className="report-official-pill"
                style={{ cursor: 'pointer', background: '#ffffff', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }}
                onClick={() => {
                  setSelectedCategory('consolidated-cdc');
                  setReportViewMode('official');
                }}
              >
                <FileText size={13} />
                <span>Form 9 — Consolidated Center Profile</span>
              </button>
            </div>
            <div className="report-official-note" style={{ color: '#14532d' }}>
              Official DSWD / ECCD Council consolidated reports are compiled directly from the central child, worker, and day care center registries. No manual encoding required.
            </div>
          </div>

          {/* Signatures & Certification Block */}
          <div className="report-signatures">
            <div className="report-sig-block">
              <span className="report-sig-label">Prepared By:</span>
              <div className="report-sig-line">
                <div className="report-sig-name">{reportData?.meta?.preparedBy || 'Ma. Elena D. Santos, RSW'}</div>
                <div className="report-sig-title">Senior Social Worker / CSWDO ECCD Focal Officer</div>
              </div>
            </div>

            <div className="report-sig-block">
              <span className="report-sig-label">Certified Correct & Approved:</span>
              <div className="report-sig-line">
                <div className="report-sig-name">Atty. Carmela S. David</div>
                <div className="report-sig-title">City Social Welfare & Development Officer (CSWDO Head)</div>
              </div>
            </div>
          </div>

          {/* System Generated Notice Footer */}
          <div className="report-doc-footer">
            {reportData?.meta?.systemGeneratedNotice ||
              'This is an official system-generated report from ECCD CARE. Compliant with RA 10410 (Early Years Act) and RA 10173 (Data Privacy Act of 2012).'}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default ReportsView;
