import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  UserCheck,
  Search,
  MapPin,
  Eye,
  FileText,
  Phone,
  Mail,
  Award,
  Layers,
  X,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { communityService, WORKER_ROLES } from '../../services/communityService';
import Button from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { Modal } from '../ui/Modal';
import { OfficialForm6WorkerProfileModal } from '../forms/OfficialForm6WorkerProfileModal';
import { OfficialForm7CenterProfileModal } from '../forms/OfficialForm7CenterProfileModal';
import { OfficialForm8ConsolidatedReport } from '../forms/OfficialForm8ConsolidatedReport';
import { OfficialForm9ConsolidatedReport } from '../forms/OfficialForm9ConsolidatedReport';

/**
 * Centers & Workers View (/centers-workers)
 * Single Responsibility: Facility & Personnel Management
 * Tabs:
 *   1. Day Care Centers (Form 7: Day Care Center Profile)
 *   2. Child Development Workers (Form 6: Day Care Worker Profile)
 * Reports:
 *   - Form 9 (Consolidated CDC Profile)
 *   - Form 8 (Consolidated CDW Profile)
 */
export function CentersWorkersView({ initialTab = 'daycare-centers', onNavigate }) {
  const [activeTab, setActiveTab] = useState(
    initialTab === 'workers' ? 'workers' : 'daycare-centers'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'workers' ? 'workers' : 'daycare-centers');
    }
  }, [initialTab]);

  // Data states
  const [barangays, setBarangays] = useState([]);
  const [centers, setCenters] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState('all');

  // Selected item for modal inspect
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Official Forms 6, 7, 8, 9 States
  const [selectedWorkerForForm6, setSelectedWorkerForForm6] = useState(null);
  const [selectedCenterForForm7, setSelectedCenterForForm7] = useState(null);
  const [isForm8Open, setIsForm8Open] = useState(false);
  const [isForm9Open, setIsForm9Open] = useState(false);

  // Load initial data from API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bData, cData, wData] = await Promise.all([
          communityService.getBarangays(),
          communityService.getCenters(),
          communityService.getWorkers(),
        ]);
        setBarangays(bData || []);
        setCenters(cData || []);
        setWorkers(wData || []);
      } catch (err) {
        console.error('Failed to load centers and workers data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCenterSuccess = async () => {
    const cData = await communityService.getCenters();
    setCenters(cData || []);
    const bData = await communityService.getBarangays();
    setBarangays(bData || []);
    setSelectedCenterForForm7(null);
  };

  const handleWorkerSuccess = async () => {
    const wData = await communityService.getWorkers();
    setWorkers(wData || []);
    const cData = await communityService.getCenters();
    setCenters(cData || []);
    setSelectedWorkerForForm6(null);
  };

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchesBarangay =
        selectedBarangayFilter === 'all' || c.barangay === selectedBarangayFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.assignedWorkers &&
          c.assignedWorkers.some((w) =>
            w.toLowerCase().includes(searchQuery.toLowerCase())
          ));
      return matchesBarangay && matchesSearch;
    });
  }, [centers, selectedBarangayFilter, searchQuery]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesRole = selectedRole === 'all' || w.role === selectedRole;
      const matchesSearch =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.assignedBarangay.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [workers, selectedRole, searchQuery]);

  // Pagination states
  const [centersPage, setCentersPage] = useState(1);
  const [centersPageSize, setCentersPageSize] = useState(9);
  const [workersPage, setWorkersPage] = useState(1);
  const [workersPageSize, setWorkersPageSize] = useState(9);

  useEffect(() => {
    setCentersPage(1);
  }, [searchQuery, selectedBarangayFilter]);

  useEffect(() => {
    setWorkersPage(1);
  }, [searchQuery, selectedRole]);

  const paginatedCenters = useMemo(() => {
    const start = (centersPage - 1) * centersPageSize;
    return filteredCenters.slice(start, start + centersPageSize);
  }, [filteredCenters, centersPage, centersPageSize]);

  const paginatedWorkers = useMemo(() => {
    const start = (workersPage - 1) * workersPageSize;
    return filteredWorkers.slice(start, start + workersPageSize);
  }, [filteredWorkers, workersPage, workersPageSize]);

  return (
    <div className="comm-container">
      {/* --- Top Navigation Tabs: Facility & Personnel Management --- */}
      <div className="comm-nav-bar">
        <div className="comm-tabs-group">
          <button
            type="button"
            className={`comm-tab-btn ${activeTab === 'daycare-centers' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('daycare-centers');
              setSearchQuery('');
            }}
          >
            <School size={16} />
            <span>Day Care Centers (Form 7)</span>
            <span className="comm-tab-badge">{centers.length}</span>
          </button>

          <button
            type="button"
            className={`comm-tab-btn ${activeTab === 'workers' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('workers');
              setSearchQuery('');
            }}
          >
            <UserCheck size={16} />
            <span>Child Development Workers (Form 6)</span>
            <span className="comm-tab-badge">{workers.length}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DAY CARE CENTERS (FORM 7)
          ========================================================================= */}
      {activeTab === 'daycare-centers' && (
        <>
          {/* Filter Bar */}
          <div className="comm-filter-panel">
            <div className="comm-search-box">
              <Search className="comm-search-icon" size={16} />
              <input
                type="text"
                placeholder="Search center by name, barangay, or assigned worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="comm-search-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                  Filter Barangay:
                </span>
                <select
                  value={selectedBarangayFilter}
                  onChange={(e) => setSelectedBarangayFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Barangays ({centers.length})</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setSelectedCenterForForm7('new')}
              >
                + Register CDC
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={Layers}
                onClick={() => setIsForm9Open(true)}
              >
                Official Form 9 (Consolidated CDC Profile)
              </Button>
            </div>
          </div>

          {/* Day Care Centers Grid */}
          <div className="comm-cards-grid">
            {filteredCenters.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                }}
              >
                No day care centers found matching the filters.
              </div>
            ) : (
              paginatedCenters.map((center) => (
                <div key={center.id} className="comm-center-card">
                  {/* Header: Center Name, Barangay, Status */}
                  <div className="comm-center-header">
                    <div>
                      <div className="comm-center-title">{center.name}</div>
                      <div className="comm-center-brgy">
                        <MapPin size={13} />
                        <span>
                          {center.barangay} • {center.address}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`comm-status-badge ${
                        center.status.includes('Level 3') ? 'level3' : 'accredited'
                      }`}
                    >
                      <Award size={12} />
                      {center.status}
                    </span>
                  </div>

                  {/* Metadata Row: Enrolled Children, Capacity, Assigned Workers */}
                  <div className="comm-center-meta-row">
                    <div className="comm-meta-item">
                      <span className="comm-meta-label">Enrolled Children</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span
                          className="comm-meta-val"
                          style={{ fontSize: '1.125rem', color: '#16a34a' }}
                        >
                          {center.enrolledChildren}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          / {center.capacity} capacity
                        </span>
                      </div>
                    </div>

                    <div className="comm-meta-item">
                      <span className="comm-meta-label">Accreditation Validity</span>
                      <span className="comm-meta-val" style={{ fontSize: '0.8125rem' }}>
                        Valid until {center.accreditationValidUntil}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Workers */}
                  <div>
                    <span className="comm-meta-label">
                      Assigned Workers ({center.assignedWorkers.length})
                    </span>
                    <div className="comm-workers-tags">
                      {center.assignedWorkers.map((w, idx) => (
                        <span key={idx} className="comm-worker-tag">
                          <UserCheck size={12} color="#ba1607" />
                          <span>{w}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sessions Info */}
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <strong>Sessions:</strong> {center.sessions}
                  </div>

                  {/* Official ECCD Center Forms Integrated */}
                  <div
                    className="comm-integration-box"
                    style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                  >
                    <div className="comm-integration-banner" style={{ color: '#166534' }}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>OFFICIAL ECCD CENTER FORMS INTEGRATED</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #86efac',
                          background: '#ffffff',
                          color: '#15803d',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedCenterForForm7(center.id)}
                      >
                        <FileText size={12} />
                        <span>Form 7 (Center Profile)</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#7e191b',
                          color: '#ffffff',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => setIsForm9Open(true)}
                      >
                        <Layers size={12} />
                        <span>Form 9 (Consolidated)</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedCenter(center)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredCenters.length > 0 && (
            <div style={{ padding: '1rem 0' }}>
              <Pagination
                currentPage={centersPage}
                totalItems={filteredCenters.length}
                pageSize={centersPageSize}
                onPageChange={setCentersPage}
                onPageSizeChange={(newSize) => {
                  setCentersPageSize(newSize);
                  setCentersPage(1);
                }}
                pageSizeOptions={[6, 9, 15, 30]}
              />
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          TAB 2: CHILD DEVELOPMENT WORKERS (FORM 6)
          ========================================================================= */}
      {activeTab === 'workers' && (
        <>
          {/* Role Filter Chips & Search Bar */}
          <div className="comm-filter-panel">
            <div className="comm-search-box">
              <Search className="comm-search-icon" size={16} />
              <input
                type="text"
                placeholder="Search workers by name, role, or barangay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="comm-search-input"
              />
            </div>

            <div
              className="comm-role-chips"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`comm-chip-btn ${selectedRole === 'all' ? 'is-active' : ''}`}
                  onClick={() => setSelectedRole('all')}
                >
                  All Roles ({workers.length})
                </button>
                {WORKER_ROLES.map((role) => {
                  const count = workers.filter((w) => w.role === role).length;
                  return (
                    <button
                      key={role}
                      type="button"
                      className={`comm-chip-btn ${selectedRole === role ? 'is-active' : ''}`}
                      onClick={() => setSelectedRole(role)}
                    >
                      {role} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setSelectedWorkerForForm6('new')}
                >
                  + Register Worker
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Layers}
                  onClick={() => setIsForm8Open(true)}
                >
                  Official Form 8 (Consolidated CDW Profile)
                </Button>
              </div>
            </div>
          </div>

          {/* Workers Cards Grid */}
          <div className="comm-workers-grid">
            {filteredWorkers.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                }}
              >
                No workers found matching the selected criteria.
              </div>
            ) : (
              paginatedWorkers.map((worker) => {
                const roleClass =
                  worker.role === 'CSWDO Admin'
                    ? 'cswdo-admin'
                    : worker.role === 'Child Development Worker'
                    ? 'cdw'
                    : worker.role === 'Day Care Worker'
                    ? 'dcw'
                    : 'sp';

                const initials = worker.name
                  .split(' ')
                  .filter((n) => !n.includes('.') && n.length > 1)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('');

                return (
                  <div key={worker.id} className="comm-worker-card">
                    {/* Header: Avatar, Name, Designation, Role badge */}
                    <div className="comm-worker-header">
                      <div className="comm-worker-avatar">{initials || 'W'}</div>
                      <div className="comm-worker-info">
                        <div className="comm-worker-name">{worker.name}</div>
                        <div className="comm-worker-desig">{worker.designation}</div>
                        <span className={`comm-role-badge ${roleClass}`}>
                          {worker.role}
                        </span>
                      </div>
                    </div>

                    {/* Metadata List */}
                    <div className="comm-worker-meta-list">
                      <div className="comm-worker-meta-item">
                        <MapPin size={14} />
                        <span>
                          <strong>Assigned:</strong> {worker.assignedBarangay}
                        </span>
                      </div>
                      <div className="comm-worker-meta-item">
                        <School size={14} />
                        <span>
                          <strong>Centers:</strong> {worker.assignedCenters.join(', ')}
                        </span>
                      </div>
                      <div className="comm-worker-meta-item">
                        <Award size={14} />
                        <span>
                          <strong>Accreditation:</strong> {worker.accreditationNo}
                        </span>
                      </div>
                      <div className="comm-worker-meta-item">
                        <Phone size={14} />
                        <span>{worker.contactNumber}</span>
                      </div>
                      <div className="comm-worker-meta-item">
                        <Mail size={14} />
                        <span style={{ wordBreak: 'break-all' }}>{worker.email}</span>
                      </div>
                    </div>

                    {/* Official ECCD Worker Forms Integrated */}
                    <div
                      className="comm-integration-box"
                      style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                    >
                      <div className="comm-integration-banner" style={{ color: '#166534' }}>
                        <CheckCircle2 size={15} color="#16a34a" />
                        <span>OFFICIAL ECCD WORKER FORMS INTEGRATED</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #86efac',
                            background: '#ffffff',
                            color: '#15803d',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedWorkerForForm6(worker.id)}
                        >
                          <FileText size={12} />
                          <span>Form 6 (Worker Profile)</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#7e191b',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => setIsForm8Open(true)}
                        >
                          <Layers size={12} />
                          <span>Form 8 (Consolidated)</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedWorker(worker)}
                      >
                        Worker Profile
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredWorkers.length > 0 && (
            <div style={{ padding: '1rem 0' }}>
              <Pagination
                currentPage={workersPage}
                totalItems={filteredWorkers.length}
                pageSize={workersPageSize}
                onPageChange={setWorkersPage}
                onPageSizeChange={(newSize) => {
                  setWorkersPageSize(newSize);
                  setWorkersPage(1);
                }}
                pageSizeOptions={[6, 9, 15, 30]}
              />
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL: DAY CARE CENTER PROFILE INSPECTOR
          ========================================================================= */}
      {selectedCenter && (
        <div className="comm-modal-overlay" onClick={() => setSelectedCenter(null)}>
          <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="comm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <School size={20} color="#7e191b" />
                <span className="comm-modal-title">{selectedCenter.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCenter(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="comm-modal-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Barangay</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>{selectedCenter.barangay}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>{selectedCenter.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Enrolled Children</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>
                    {selectedCenter.enrolledChildren} / {selectedCenter.capacity} Capacity
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Accreditation Validity</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>
                    {selectedCenter.accreditationValidUntil}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Address:
                </div>
                <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{selectedCenter.address}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Assigned Workers:
                </div>
                <div className="comm-workers-tags">
                  {selectedCenter.assignedWorkers.map((w, idx) => (
                    <span key={idx} className="comm-worker-tag">
                      <UserCheck size={12} color="#ba1607" />
                      <span>{w}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Form 7 Profile Action */}
              <div
                className="comm-integration-box"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
              >
                <div className="comm-integration-banner" style={{ color: '#166534' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>OFFICIAL ECCD FORM 7 PROFILE INTEGRATED</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#14532d', margin: '6px 0 10px' }}>
                  Facility assessment, accredited early childhood services, and learning equipment audit verified under ECCD Council standards.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FileText}
                  onClick={() => setSelectedCenterForForm7(selectedCenter.id)}
                >
                  Open Official Form 7 Profile
                </Button>
              </div>
            </div>

            <div className="comm-modal-footer">
              <Button variant="outline" size="sm" onClick={() => setSelectedCenter(null)}>
                Close
              </Button>
              {onNavigate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedCenter(null);
                    onNavigate('enrollment');
                  }}
                >
                  Manage Enrollments
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: WORKER PROFILE INSPECTOR
          ========================================================================= */}
      {selectedWorker && (
        <div className="comm-modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="comm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <UserCheck size={20} color="#7e191b" />
                <span className="comm-modal-title">Worker Profile: {selectedWorker.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="comm-modal-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>{selectedWorker.role}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Designation</div>
                  <div style={{ fontWeight: 700, color: '#1e1112' }}>{selectedWorker.designation}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned Barangay</div>
                  <div style={{ fontWeight: 700, color: '#7e191b' }}>{selectedWorker.assignedBarangay}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Years of Service</div>
                  <div style={{ fontWeight: 700, color: '#1e1112' }}>{selectedWorker.yearsOfService} Years</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div>
                  <strong>Accreditation No:</strong> {selectedWorker.accreditationNo}
                </div>
                <div>
                  <strong>Contact Number:</strong> {selectedWorker.contactNumber}
                </div>
                <div>
                  <strong>Email:</strong> {selectedWorker.email}
                </div>
                <div>
                  <strong>Assigned Centers:</strong> {selectedWorker.assignedCenters.join(', ')}
                </div>
              </div>

              {/* Form 6 Profile Action */}
              <div
                className="comm-integration-box"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
              >
                <div className="comm-integration-banner" style={{ color: '#166534' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>OFFICIAL ECCD FORM 6 PROFILE INTEGRATED</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#14532d', margin: '6px 0 10px' }}>
                  Qualification records, civil service / LET eligibility, training history, and working conditions verified under ECCD Council standards.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FileText}
                  onClick={() => setSelectedWorkerForForm6(selectedWorker.id)}
                >
                  Open Official Form 6 Profile
                </Button>
              </div>
            </div>

            <div className="comm-modal-footer">
              <Button variant="outline" size="sm" onClick={() => setSelectedWorker(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official Form 6 (Worker Profile) Modal */}
      <OfficialForm6WorkerProfileModal
        isOpen={Boolean(selectedWorkerForForm6)}
        onClose={() => setSelectedWorkerForForm6(null)}
        workerId={selectedWorkerForForm6}
        onSuccess={handleWorkerSuccess}
      />

      {/* Official Form 7 (Center Profile) Modal */}
      <OfficialForm7CenterProfileModal
        isOpen={Boolean(selectedCenterForForm7)}
        onClose={() => setSelectedCenterForForm7(null)}
        centerId={selectedCenterForForm7}
        onSuccess={handleCenterSuccess}
      />

      {/* Official Form 8 (Consolidated CDW Profile) Modal */}
      {isForm8Open && (
        <Modal
          isOpen={isForm8Open}
          onClose={() => setIsForm8Open(false)}
          title=""
          size="xl"
          className="official-form-modal"
        >
          <div>
            <OfficialForm8ConsolidatedReport />
          </div>
        </Modal>
      )}

      {/* Official Form 9 (Consolidated CDC Profile) Modal */}
      {isForm9Open && (
        <Modal
          isOpen={isForm9Open}
          onClose={() => setIsForm9Open(false)}
          title=""
          size="xl"
          className="official-form-modal"
        >
          <div>
            <OfficialForm9ConsolidatedReport />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CentersWorkersView;
