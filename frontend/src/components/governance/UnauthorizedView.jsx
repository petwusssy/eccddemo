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
            {user?.role === 'field_worker'
              ? 'Field Workers / Service Providers cannot access system administration, settings, or audit logs.'
              : user?.role === 'daycare_worker'
              ? 'Day Care Workers are restricted to assigned center operations and cohort records.'
              : 'Access to this route requires elevated administrative permissions.'}
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

          {onSwitchRole && (
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => onSwitchRole('cswdo_admin')}
            >
              Switch to CSWDO Admin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedView;
