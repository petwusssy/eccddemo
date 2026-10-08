import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export function UnauthorizedView({
  attemptedModule,
  user,
  roleLabel,
  onReturnToAllowed,
  onSwitchRole,
}) {
  return (
    <div className="unauth-container">
      <div className="unauth-card">
        <div className="unauth-icon-circle">
          <ShieldAlert size={36} />
        </div>

        <div className="unauth-title">403 — Access Restricted</div>

        <div className="unauth-desc">
          Under CSWDO Prototype Security & Governance Controls, your assigned role lacks permission to access the <strong>{attemptedModule || 'requested'}</strong> module.
        </div>

        <div className="unauth-details-box">
          <div><strong>Active Account:</strong> {user?.name || 'Authorized Staff'}</div>
          <div><strong>Current Role:</strong> {roleLabel || user?.role || 'User'}</div>
          <div><strong>Security Scope:</strong> {user?.assignedBarangays || user?.assignedCenter || 'Restricted Scope'}</div>
          <div style={{ marginTop: '0.25rem', color: '#be123c' }}>
            <strong>Policy Rule:</strong>{' '}
            {attemptedModule === 'admin-console'
              ? 'The Admin Console (/admin) is exclusive to the CSFP System Administrator (sysadmin@csfp.gov.ph). ECCD Administrative staff and CDTs manage day care operations on the main ECCD portal.'
              : user?.role === 'cdt' || user?.role === 'field_worker' || user?.role === 'daycare_worker'
              ? 'Child Development Teachers (CDTs) serve as frontline implementers directly delivering activities and interventions to children and families. Consolidated dashboards, citywide reports, planning, and system administration are restricted to ECCD Administrative staff.'
              : 'ECCD Administrative access is required to consolidate data, coordinate requirements, plan and organize programs and services.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="primary"
            size="md"
            icon={ArrowLeft}
            onClick={onReturnToAllowed}
          >
            Return to Allowed Workspace
          </Button>

          {onSwitchRole && attemptedModule === 'admin-console' && (
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => onSwitchRole('sysadmin')}
            >
              Log In as CSFP System Administrator
            </Button>
          )}

          {onSwitchRole && attemptedModule !== 'admin-console' && (
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => onSwitchRole(user?.role === 'eccd_admin' ? 'cdt' : 'eccd_admin')}
            >
              Switch to {user?.role === 'eccd_admin' ? 'CDT (Frontline)' : 'ECCD Admin'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedView;
