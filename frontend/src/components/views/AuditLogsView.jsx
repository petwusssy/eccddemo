import React, { useState, useEffect, useMemo } from 'react';
import {
  FileClock,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Eye,
  KeyRound,
  Download,
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import Button from '../ui/Button';
import ConfirmationDialog from '../governance/ConfirmationDialog';
import SensitiveDataWarning from '../governance/SensitiveDataWarning';

export function AuditLogsView({
  user,
  roleLabel,
  onSwitchRole,
  onTriggerSessionExpiry,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');

  // Governance interactive test state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);

  // Fetch logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs({
        role: selectedRole,
        status: selectedStatus,
        module: selectedModule,
        search: searchQuery,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedRole, selectedStatus, selectedModule, searchQuery]);

  // Log simulated event
  const handleSimulatedAction = async (actionName, moduleName, recordName, status = 'Successful') => {
    await auditService.logActivity({
      user: user?.name || 'Authorized Staff',
      role: roleLabel || user?.role || 'Staff',
      action: actionName,
      module: moduleName,
      record: recordName,
      status,
      details: 'Automated prototype governance testing trigger.',
    });
    loadLogs();
  };

  return (
    <div className="gov-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Audit Logs &amp; System Governance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-1) 0 0 0' }}>
            Role-based boundary enforcement, security logs, and operational audit trail
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ROLE SIMULATOR & GOVERNANCE TESTING BAR
          Allows testing role behavior:
          - Field Worker: Cannot access system administration.
          - Day Care Worker: Can only access assigned center and assigned children.
          - CSWDO Admin: Can access organization-wide monitoring and reports.
          ========================================================================= */}
      <div className="gov-sim-bar">
        <div className="gov-sim-info">
          <UserCheck size={16} color="#0284c7" />
          <span>Role-Based Access Testing Simulator:</span>
        </div>

        <div className="gov-sim-buttons">
          <button
            type="button"
            className={`gov-sim-btn ${user?.role === 'cswdo_admin' ? 'is-active' : ''}`}
            onClick={() => {
              if (onSwitchRole) onSwitchRole('cswdo_admin');
              handleSimulatedAction('Switched Role to CSWDO Admin', 'Governance', 'USR-CSWDO-001');
            }}
          >
            CSWDO Admin (Full Org Access)
          </button>

          <button
            type="button"
            className={`gov-sim-btn ${user?.role === 'field_worker' ? 'is-active' : ''}`}
            onClick={() => {
              if (onSwitchRole) onSwitchRole('field_worker');
              handleSimulatedAction('Switched Role to Field Worker', 'Governance', 'USR-CSWDO-014');
            }}
          >
            Service Provider / Field Worker
          </button>

          <button
            type="button"
            className={`gov-sim-btn ${user?.role === 'daycare_worker' ? 'is-active' : ''}`}
            onClick={() => {
              if (onSwitchRole) onSwitchRole('daycare_worker');
              handleSimulatedAction('Switched Role to Day Care Worker', 'Governance', 'USR-CDC-027');
            }}
          >
            Day Care Worker (Center Scoped)
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. GOVERNANCE CONTROLS TRIGGER BAR
          Test Session Expiry, Confirmations, Sensitive Data Warning
          ========================================================================= */}
      <div className="gov-sim-bar" style={{ background: '#f8fafc' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
          Interactive Governance Demonstrations:
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            icon={Lock}
            onClick={() => {
              handleSimulatedAction('Session Expiration Triggered', 'Authentication', user?.name, 'Warning');
              if (onTriggerSessionExpiry) onTriggerSessionExpiry();
            }}
          >
            Simulate Session Expiry
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={AlertTriangle}
            onClick={() => setShowConfirmModal(true)}
          >
            Test Confirmation Dialog
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => setShowSensitiveWarning(!showSensitiveWarning)}
          >
            {showSensitiveWarning ? 'Hide Sensitive Data Tool' : 'Test Sensitive-Data Warning'}
          </Button>
        </div>
      </div>

      {/* Sensitive Data Warning Interactive Test */}
      {showSensitiveWarning && (
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem' }}>
          <SensitiveDataWarning
            label="PhilSys Card & Civil Registry Number (Juan Bautista Dela Cruz)"
            maskedValue="••••-••••-••••-8912"
            actualValue="9412-4019-2041-8912"
            onLogAccess={(act) => handleSimulatedAction(act, 'Child Management', 'Juan Bautista Dela Cruz', 'Successful')}
          />
        </div>
      )}

      {/* =========================================================================
          4. AUDIT LOG TOOLBAR & FILTERS
          ========================================================================= */}
      <div className="gov-toolbar">
        <div className="gov-search-box">
          <Search className="gov-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search audit trail by user, action, record, or details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="gov-search-input"
          />
        </div>

        <div className="gov-filter-selects">
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="gov-select"
          >
            <option value="all">All Roles</option>
            <option value="CSWDO Admin">CSWDO Admin</option>
            <option value="Service Provider">Service Provider</option>
            <option value="Day Care Worker">Day Care Worker</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="gov-select"
          >
            <option value="all">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Unauthorized Attempt">Unauthorized Attempt</option>
            <option value="Access Restricted">Access Restricted</option>
          </select>

          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="gov-select"
          >
            <option value="all">All Modules</option>
            <option value="Child Management">Child Management</option>
            <option value="Community Mapping">Community Mapping</option>
            <option value="Health Monitoring">Health Monitoring</option>
            <option value="Development Assessment">Development Assessment</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Reports">Reports</option>
            <option value="System Governance">System Governance</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadLogs}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* =========================================================================
          5. AUDIT LOG DATA TABLE
          Show: Date/Time, User, Role, Action, Module, Record, Status
          Example: Maria Santos | Service Provider | Created Child Record | Juan Dela Cruz | Successful
          ========================================================================= */}
      <div className="gov-table-card mobile-table-to-cards">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Loading audit log events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No audit log entries match the selected filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSuccess = log.status === 'Successful';
                const isUnauthorized = log.status === 'Unauthorized Attempt';

                return (
                  <tr key={log.id}>
                    <td>
                      <span className="gov-timestamp">{log.timestamp}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f2744' }}>{log.user}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>{log.role}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{log.action}</div>
                      {log.details && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {log.details}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {log.module}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>{log.record}</span>
                    </td>
                    <td>
                      <span className={`gov-status-badge ${isSuccess ? 'success' : isUnauthorized ? 'danger' : 'warning'}`}>
                        {isSuccess && <CheckCircle2 size={11} />}
                        {isUnauthorized && <AlertTriangle size={11} />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog Component Test */}
      <ConfirmationDialog
        isOpen={showConfirmModal}
        title="Confirm Data Export / Sensitive Action"
        message="You are about to export identifiable demographic records for children in San Fernando. This action will be permanently recorded in the system audit log."
        confirmLabel="Proceed & Log Action"
        onConfirm={() => {
          setShowConfirmModal(false);
          handleSimulatedAction('Confirmed Sensitive Data Export', 'Reports', 'Consolidated Children Export', 'Successful');
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

export default AuditLogsView;
