import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Search,
  Eye,
  FileText,
  School,
  UserCheck,
  Award,
  Users,
  MapPin,
  List,
  LayoutGrid,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import Button from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { OfficialForm3CommunityProfileModal } from '../forms/OfficialForm3CommunityProfileModal';

/**
 * Community Network Page (/community-network)
 * Single Responsibility: Barangay Demographics & Geographic Directory (Form 3)
 *
 * Implements the official ECCD relational hierarchy:
 * Form 3 (Barangay Community Profile)
 *   └── Form 7 (Child Development Centers Profile)
 *         └── Form 6 (Child Development Workers Profile)
 *
 * Displays the 35 official Barangays of the City of San Fernando, Pampanga,
 * dynamically rolling up their active Form 7 CDCs and deployed Form 6 CDWs.
 */
export function CommunityView({ onNavigate }) {
  // Data states
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'table' | 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'with-workers' | 'with-enrolled'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection states
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [isForm3Open, setIsForm3Open] = useState(false);
  const [selectedBarangayForForm3, setSelectedBarangayForForm3] = useState('Sindalan');

  // Load barangay community data
  const loadData = useCallback(async () => {
    try {
      const bData = await communityService.getBarangays();
      setBarangays(bData || []);
    } catch (err) {
      console.error('Failed to load barangay community data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + reactive state sync across datastore mutations
  useEffect(() => {
    loadData();

    // Listen for reactive updates from centralDataStore (when Form 7, Form 6, or Form 3 change)
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('eccd:datastore-updated', handleUpdate);
    return () => {
      window.removeEventListener('eccd:datastore-updated', handleUpdate);
    };
  }, [loadData]);

  // Aggregated totals across all 35 barangays
  const totals = useMemo(() => {
    return barangays.reduce(
      (acc, b) => ({
        totalChildren: acc.totalChildren + (b.totalChildren || 0),
        mapped: acc.mapped + (b.mapped || 0),
        enrolled: acc.enrolled + (b.enrolled || 0),
        notEnrolled: acc.notEnrolled + (b.notEnrolled || 0),
        healthDue: acc.healthDue + (b.healthDue || 0),
        devFollowups: acc.devFollowups + (b.devFollowups || 0),
        totalCdcs: acc.totalCdcs + (b.total_cdcs ?? b.centersCount ?? 0),
        totalWorkers: acc.totalWorkers + (b.total_workers ?? b.workersCount ?? 0),
      }),
      {
        totalChildren: 0,
        mapped: 0,
        enrolled: 0,
        notEnrolled: 0,
        healthDue: 0,
        devFollowups: 0,
        totalCdcs: 0,
        totalWorkers: 0,
      }
    );
  }, [barangays]);

  // Filtered Barangays based on search query & quick filter chips
  const filteredBarangays = useMemo(() => {
    let list = barangays;

    if (quickFilter === 'with-workers') {
      list = list.filter((b) => (b.total_workers ?? b.workersCount ?? 0) > 0);
    } else if (quickFilter === 'with-enrolled') {
      list = list.filter((b) => (b.enrolled || 0) > 0);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.district && b.district.toLowerCase().includes(q)) ||
        (b.primaryWorker && b.primaryWorker.toLowerCase().includes(q)) ||
        (b.centers && b.centers.some((c) => c.toLowerCase().includes(q))) ||
        (b.workers_list && b.workers_list.some((w) => w.name.toLowerCase().includes(q)))
    );
  }, [barangays, searchQuery, quickFilter]);

  // Reset pagination to page 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, quickFilter]);

  // Paginated slice
  const paginatedBarangays = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBarangays.slice(start, start + pageSize);
  }, [filteredBarangays, currentPage, pageSize]);

  const handleOpenForm3 = (barangayName) => {
    setSelectedBarangayForForm3(barangayName);
    setIsForm3Open(true);
  };

  return (
    <div className="comm-container">
      {/* =========================================================================
          LGU HEADER BANNER
          ========================================================================= */}
      <div className="comm-lgu-banner">
        <div>
          <div className="comm-lgu-badge">
            <MapPin size={12} />
            <span>City of San Fernando, Pampanga • Region III</span>
          </div>
          <h1 className="comm-lgu-title">ECCD Community Network &amp; Barangay Directory</h1>
          <div className="comm-lgu-subtitle">
            Official Relational Hierarchy: Form 3 (Barangay Profile) → Form 7 (Day Care Centers) → Form 6 (Day Care Workers)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            icon={FileText}
            onClick={() => handleOpenForm3(barangays[0]?.name || 'Sindalan')}
          >
            Launch Official Form 3
          </Button>
        </div>
      </div>

      {/* Domain Navigation / Indicator */}
      <div className="comm-nav-bar">
        <div className="comm-tabs-group">
          <div className="comm-tab-btn is-active" style={{ cursor: 'default' }}>
            <Building2 size={16} />
            <span>Barangay Community Profiles (Form 3)</span>
            <span className="comm-tab-badge">{barangays.length || 35}</span>
          </div>
        </div>

        {/* View Switcher: Table vs Grid Cards */}
        <div className="comm-view-switch">
          <button
            type="button"
            className={`comm-view-switch-btn ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <List size={15} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            className={`comm-view-switch-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid Cards View"
          >
            <LayoutGrid size={15} />
            <span>Grid Cards</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          AGGREGATE KPI SUMMARY CARDS
          ========================================================================= */}
      <div className="comm-stats-grid">
        <div className="comm-stat-card blue">
          <span className="comm-stat-label">Barangays</span>
          <span className="comm-stat-value">{barangays.length || 35}</span>
          <span className="comm-stat-sub">Official LGU Barangays</span>
        </div>

        <div className="comm-stat-card teal">
          <span className="comm-stat-label">Form 7 CDCs</span>
          <span className="comm-stat-value">{totals.totalCdcs}</span>
          <span className="comm-stat-sub">Active Facilities</span>
        </div>

        <div className="comm-stat-card green">
          <span className="comm-stat-label">Form 6 CDWs</span>
          <span className="comm-stat-value">{totals.totalWorkers}</span>
          <span className="comm-stat-sub">Deployed Personnel</span>
        </div>

        <div className="comm-stat-card amber">
          <span className="comm-stat-label">Children 0–4</span>
          <span className="comm-stat-value">{totals.totalChildren.toLocaleString()}</span>
          <span className="comm-stat-sub">Across Community</span>
        </div>

        <div className="comm-stat-card rose">
          <span className="comm-stat-label">Enrolled</span>
          <span className="comm-stat-value">{totals.enrolled.toLocaleString()}</span>
          <span className="comm-stat-sub">In Day Care Centers</span>
        </div>

        <div className="comm-stat-card purple">
          <span className="comm-stat-label">Accreditation</span>
          <span className="comm-stat-value" style={{ fontSize: '1.25rem' }}>Level 3</span>
          <span className="comm-stat-sub">100% Citywide Standard</span>
        </div>
      </div>

      {/* =========================================================================
          SEARCH & FILTER PANEL
          ========================================================================= */}
      <div className="comm-filter-panel">
        <div className="comm-search-box">
          <Search className="comm-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by barangay name, CDC, or worker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="comm-search-input"
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="comm-role-chips">
          <button
            type="button"
            className={`comm-chip-btn ${quickFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setQuickFilter('all')}
          >
            All Barangays ({barangays.length})
          </button>
          <button
            type="button"
            className={`comm-chip-btn ${quickFilter === 'with-workers' ? 'is-active' : ''}`}
            onClick={() => setQuickFilter('with-workers')}
          >
            With Active Workers ({barangays.filter((b) => (b.total_workers ?? b.workersCount ?? 0) > 0).length})
          </button>
          <button
            type="button"
            className={`comm-chip-btn ${quickFilter === 'with-enrolled' ? 'is-active' : ''}`}
            onClick={() => setQuickFilter('with-enrolled')}
          >
            With Enrolled Children ({barangays.filter((b) => (b.enrolled || 0) > 0).length})
          </button>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Showing <strong>{filteredBarangays.length}</strong> of <strong>{barangays.length}</strong> barangays
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE: TABLE VIEW
          ========================================================================= */}
      {viewMode === 'table' ? (
        <div className="comm-table-card mobile-table-to-cards">
          <table className="comm-table">
            <thead>
              <tr>
                <th>Barangay &amp; LGU</th>
                <th>Form 7 Infrastructure</th>
                <th>Form 6 Personnel</th>
                <th>Accreditation</th>
                <th style={{ textAlign: 'center' }}>Children 0–4</th>
                <th style={{ textAlign: 'center' }}>Mapped</th>
                <th style={{ textAlign: 'center' }}>Enrolled</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    Loading barangay community profiles...
                  </td>
                </tr>
              ) : filteredBarangays.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No barangays match the search query "{searchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedBarangays.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#7e191b', fontSize: '0.9375rem' }}>
                        Barangay {b.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>City of San Fernando, Pampanga</span>
                      </div>
                    </td>

                    {/* Live Badge: Form 7 CDCs */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className="comm-badge-cdc">
                          <School size={12} />
                          {b.total_cdcs ?? b.centersCount ?? 0} CDC (Form 7)
                        </span>
                        {b.centers && b.centers.length > 0 && (
                          <span style={{ fontSize: '0.6875rem', color: '#64748b' }} title={b.centers.join(', ')}>
                            {b.centers[0]}
                            {b.centers.length > 1 && ` +${b.centers.length - 1} more`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Live Badge: Form 6 CDWs */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className="comm-badge-cdw">
                          <UserCheck size={12} />
                          {b.total_workers ?? b.workersCount ?? 0} CDW (Form 6)
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          {b.primaryWorker || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Accreditation overview pill */}
                    <td>
                      <span className="comm-badge-acc">
                        <Award size={12} />
                        {b.accreditationOverview || 'Level 3 Accredited'}
                      </span>
                    </td>

                    {/* Demographics counts */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="comm-badge-num gray">{b.totalChildren}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="comm-badge-num blue">{b.mapped}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="comm-badge-num green">{b.enrolled}</span>
                    </td>

                    {/* Primary Action: View Official Form 3 Profile */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedBarangay(b)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={FileText}
                          onClick={() => handleOpenForm3(b.name)}
                        >
                          View Official Form 3 Profile
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Standardized Pagination Controls */}
          {filteredBarangays.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9' }}>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredBarangays.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 20, 35, 50]}
              />
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE: GRID CARDS VIEW
            ========================================================================= */
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading barangay community profiles...
            </div>
          ) : filteredBarangays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No barangays match the search query "{searchQuery}".
            </div>
          ) : (
            <>
              <div className="comm-brgy-grid">
                {paginatedBarangays.map((b) => (
                  <div key={b.id} className="comm-brgy-card">
                    {/* Card Top Header */}
                    <div>
                      <div className="comm-brgy-card-header">
                        <div>
                          <h3 className="comm-brgy-card-name">{b.name}</h3>
                          <div className="comm-brgy-card-lgu">City of San Fernando, Pampanga</div>
                        </div>
                        <span className="comm-badge-acc">
                          <Award size={11} />
                          {b.accreditationOverview || 'Level 3'}
                        </span>
                      </div>

                      {/* Live Badges Strip */}
                      <div className="comm-brgy-badges-strip">
                        <span className="comm-badge-cdc">
                          <School size={12} />
                          {b.total_cdcs ?? b.centersCount ?? 0} CDC (Form 7)
                        </span>
                        <span className="comm-badge-cdw">
                          <UserCheck size={12} />
                          {b.total_workers ?? b.workersCount ?? 0} CDW (Form 6)
                        </span>
                      </div>
                    </div>

                    {/* Infrastructure Summary Preview */}
                    <div className="comm-brgy-infra-summary">
                      <div className="comm-brgy-infra-item">
                        <School size={14} color="#ba1607" />
                        <span style={{ fontWeight: 600 }}>
                          {b.centers && b.centers[0] ? b.centers[0] : `${b.name} Child Development Center`}
                        </span>
                      </div>
                      <div className="comm-brgy-infra-item">
                        <UserCheck size={14} color="#0d9488" />
                        <span>Worker: {b.primaryWorker || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Demographic Counts */}
                    <div className="comm-brgy-stats-row">
                      <div className="comm-brgy-stat-cell">
                        <div className="comm-brgy-stat-val" style={{ color: '#7e191b' }}>
                          {b.totalChildren}
                        </div>
                        <div className="comm-brgy-stat-lbl">Children 0–4</div>
                      </div>
                      <div className="comm-brgy-stat-cell">
                        <div className="comm-brgy-stat-val" style={{ color: '#1d4ed8' }}>
                          {b.mapped}
                        </div>
                        <div className="comm-brgy-stat-lbl">Mapped</div>
                      </div>
                      <div className="comm-brgy-stat-cell">
                        <div className="comm-brgy-stat-val" style={{ color: '#047857' }}>
                          {b.enrolled}
                        </div>
                        <div className="comm-brgy-stat-lbl">Enrolled</div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="comm-brgy-card-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedBarangay(b)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FileText}
                        style={{ flex: 1 }}
                        onClick={() => handleOpenForm3(b.name)}
                      >
                        View Official Form 3 Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Pagination */}
              {filteredBarangays.length > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredBarangays.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[9, 18, 35]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: BARANGAY DEMOGRAPHICS INSPECTOR
          ========================================================================= */}
      {selectedBarangay && (
        <div className="comm-modal-overlay" onClick={() => setSelectedBarangay(null)}>
          <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="comm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Building2 size={20} color="#7e191b" />
                <span className="comm-modal-title">
                  Barangay {selectedBarangay.name} Demographic Profile
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBarangay(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="comm-modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Barangay ID</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>{selectedBarangay.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>LGU Jurisdiction</div>
                  <div style={{ fontWeight: 700, color: '#1e1112' }}>
                    City of San Fernando, Pampanga
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Primary CDW</div>
                  <div style={{ fontWeight: 700, color: '#ba1607' }}>
                    {selectedBarangay.primaryWorker || '—'}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7e191b', margin: 0 }}>
                ECCD Demographic &amp; Monitoring Metrics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Children 0–4</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e191b' }}>
                    {selectedBarangay.totalChildren}
                  </div>
                </div>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Mapped</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>
                    {selectedBarangay.mapped}
                  </div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Enrolled</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                    {selectedBarangay.enrolled}
                  </div>
                </div>
                <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Not Enrolled</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                    {selectedBarangay.notEnrolled}
                  </div>
                </div>
                <div style={{ background: '#fff1f2', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9f1239' }}>Health Due</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#be123c' }}>
                    {selectedBarangay.healthDue}
                  </div>
                </div>
                <div style={{ background: '#f5f3ff', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#5b21b6' }}>Dev Follow-ups</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6d28d9' }}>
                    {selectedBarangay.devFollowups}
                  </div>
                </div>
              </div>

              {/* Day Care Centers in Barangay */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7e191b', marginBottom: '0.5rem' }}>
                  Accredited Centers in Barangay ({selectedBarangay.centers?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedBarangay.centers && selectedBarangay.centers.length > 0 ? (
                    selectedBarangay.centers.map((cName, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#f8fafc',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <School size={14} color="#ba1607" />
                        <span>{cName}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      No accredited centers registered under this barangay yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="comm-modal-footer">
              <Button variant="outline" size="sm" onClick={() => setSelectedBarangay(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={FileText}
                onClick={() => {
                  const bName = selectedBarangay.name;
                  setSelectedBarangay(null);
                  handleOpenForm3(bName);
                }}
              >
                View Official Form 3 Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OFFICIAL FORM 3 (COMMUNITY PROFILE) MODAL
          ========================================================================= */}
      <OfficialForm3CommunityProfileModal
        isOpen={isForm3Open}
        onClose={() => setIsForm3Open(false)}
        barangayName={selectedBarangayForForm3}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}

export default CommunityView;
