import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Eye,
  FileText,
  School,
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
 * Displays the official 35 Barangays of the City of San Fernando, Pampanga,
 * with real-time aggregated metrics:
 * - Children 0–4
 * - Mapped
 * - Enrolled
 * - Not Enrolled
 * - Health Due
 * - Development Follow-ups
 */
export function CommunityView({ onNavigate }) {
  // Data states
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection states
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [isForm3Open, setIsForm3Open] = useState(false);
  const [selectedBarangayForForm3, setSelectedBarangayForForm3] = useState('San Isidro');

  // Load initial barangay data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const bData = await communityService.getBarangays();
        setBarangays(bData || []);
      } catch (err) {
        console.error('Failed to load barangay community data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Aggregated totals across all barangays
  const totals = useMemo(() => {
    return barangays.reduce(
      (acc, b) => ({
        totalChildren: acc.totalChildren + (b.totalChildren || 0),
        mapped: acc.mapped + (b.mapped || 0),
        enrolled: acc.enrolled + (b.enrolled || 0),
        notEnrolled: acc.notEnrolled + (b.notEnrolled || 0),
        healthDue: acc.healthDue + (b.healthDue || 0),
        devFollowups: acc.devFollowups + (b.devFollowups || 0),
      }),
      { totalChildren: 0, mapped: 0, enrolled: 0, notEnrolled: 0, healthDue: 0, devFollowups: 0 }
    );
  }, [barangays]);

  // Filtered Barangays based on search query
  const filteredBarangays = useMemo(() => {
    if (!searchQuery.trim()) return barangays;
    const q = searchQuery.toLowerCase().trim();
    return barangays.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        (b.primaryWorker && b.primaryWorker.toLowerCase().includes(q))
    );
  }, [barangays, searchQuery]);

  // Reset pagination to page 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated slice
  const paginatedBarangays = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBarangays.slice(start, start + pageSize);
  }, [filteredBarangays, currentPage, pageSize]);

  return (
    <div className="comm-container">
      {/* Top Header / Domain Directory Indicator */}
      <div className="comm-nav-bar">
        <div className="comm-tabs-group">
          <div className="comm-tab-btn is-active" style={{ cursor: 'default' }}>
            <Building2 size={16} />
            <span>Barangay Directory (Form 3: Community Profile)</span>
            <span className="comm-tab-badge">{barangays.length || 35}</span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="comm-stats-grid">
        <div className="comm-stat-card blue">
          <span className="comm-stat-label">Children 0–4</span>
          <span className="comm-stat-value">{totals.totalChildren.toLocaleString()}</span>
          <span className="comm-stat-sub">Across {barangays.length || 35} Barangays</span>
        </div>

        <div className="comm-stat-card teal">
          <span className="comm-stat-label">Mapped</span>
          <span className="comm-stat-value">{totals.mapped.toLocaleString()}</span>
          <span className="comm-stat-sub">
            {totals.totalChildren > 0
              ? Math.round((totals.mapped / totals.totalChildren) * 100)
              : 0}
            % coverage
          </span>
        </div>

        <div className="comm-stat-card green">
          <span className="comm-stat-label">Enrolled</span>
          <span className="comm-stat-value">{totals.enrolled.toLocaleString()}</span>
          <span className="comm-stat-sub">Active in Day Care / CDC</span>
        </div>

        <div className="comm-stat-card amber">
          <span className="comm-stat-label">Not Enrolled</span>
          <span className="comm-stat-value">{totals.notEnrolled.toLocaleString()}</span>
          <span className="comm-stat-sub">Eligible for admission</span>
        </div>

        <div className="comm-stat-card rose">
          <span className="comm-stat-label">Health Due</span>
          <span className="comm-stat-value">{totals.healthDue.toLocaleString()}</span>
          <span className="comm-stat-sub">Growth check pending</span>
        </div>

        <div className="comm-stat-card purple">
          <span className="comm-stat-label">Dev Follow-ups</span>
          <span className="comm-stat-value">{totals.devFollowups.toLocaleString()}</span>
          <span className="comm-stat-sub">Interventions queued</span>
        </div>
      </div>

      {/* Search and Filter Panel */}
      <div className="comm-filter-panel">
        <div className="comm-search-box">
          <Search className="comm-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search barangay by name, district, or primary worker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="comm-search-input"
          />
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Showing <strong>{filteredBarangays.length}</strong> of{' '}
          <strong>{barangays.length}</strong> barangays
        </div>
      </div>

      {/* Barangays Directory Table */}
      <div className="comm-table-card mobile-table-to-cards">
        <table className="comm-table">
          <thead>
            <tr>
              <th>Barangay</th>
              <th>District</th>
              <th style={{ textAlign: 'center' }}>Children 0–4</th>
              <th style={{ textAlign: 'center' }}>Mapped</th>
              <th style={{ textAlign: 'center' }}>Enrolled</th>
              <th style={{ textAlign: 'center' }}>Not Enrolled</th>
              <th style={{ textAlign: 'center' }}>Health Due</th>
              <th style={{ textAlign: 'center' }}>Dev Follow-ups</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}
                >
                  Loading barangay demographic data...
                </td>
              </tr>
            ) : filteredBarangays.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}
                >
                  No barangays match the search query "{searchQuery}".
                </td>
              </tr>
            ) : (
              paginatedBarangays.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#7e191b' }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {b.centersCount} Centers • {b.workersCount} Workers
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                      {b.district}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num gray">{b.totalChildren}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num blue">{b.mapped}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num green">{b.enrolled}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num amber">{b.notEnrolled}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num rose">{b.healthDue}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="comm-badge-num purple">{b.devFollowups}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedBarangay(b)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={FileText}
                        onClick={() => {
                          setSelectedBarangayForForm3(b.name);
                          setIsForm3Open(true);
                        }}
                      >
                        Form 3
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

      {/* =========================================================================
          MODAL: BARANGAY DETAILS INSPECTOR
          ========================================================================= */}
      {selectedBarangay && (
        <div
          className="comm-modal-overlay"
          onClick={() => setSelectedBarangay(null)}
        >
          <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="comm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Building2 size={20} color="#7e191b" />
                <span className="comm-modal-title">
                  Barangay {selectedBarangay.name} Profile
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
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>
                    {selectedBarangay.id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>District</div>
                  <div style={{ fontWeight: 700, color: '#1e1112' }}>
                    {selectedBarangay.district}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Primary CDW</div>
                  <div style={{ fontWeight: 700, color: '#ba1607' }}>
                    {selectedBarangay.primaryWorker}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <h4
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#7e191b',
                  margin: 0,
                }}
              >
                ECCD Demographic & Monitoring Metrics
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                }}
              >
                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Children 0–4</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#7e191b',
                    }}
                  >
                    {selectedBarangay.totalChildren}
                  </div>
                </div>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Mapped</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#1d4ed8',
                    }}
                  >
                    {selectedBarangay.mapped}
                  </div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Enrolled</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#047857',
                    }}
                  >
                    {selectedBarangay.enrolled}
                  </div>
                </div>
                <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Not Enrolled</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#b45309',
                    }}
                  >
                    {selectedBarangay.notEnrolled}
                  </div>
                </div>
                <div style={{ background: '#fff1f2', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9f1239' }}>Health Due</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#be123c',
                    }}
                  >
                    {selectedBarangay.healthDue}
                  </div>
                </div>
                <div style={{ background: '#f5f3ff', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#5b21b6' }}>Dev Follow-ups</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#6d28d9',
                    }}
                  >
                    {selectedBarangay.devFollowups}
                  </div>
                </div>
              </div>

              {/* Day Care Centers in Barangay */}
              <div>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#7e191b',
                    marginBottom: '0.5rem',
                  }}
                >
                  Accredited Centers in Barangay (
                  {selectedBarangay.centers?.length || 0})
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBarangay(null)}
              >
                Close
              </Button>
              {onNavigate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedBarangay(null);
                    onNavigate('children');
                  }}
                >
                  View Children in Barangay
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Form 3 (Community Profile) Modal */}
      <OfficialForm3CommunityProfileModal
        isOpen={isForm3Open}
        onClose={() => setIsForm3Open(false)}
        barangayName={selectedBarangayForForm3}
      />
    </div>
  );
}

export default CommunityView;
