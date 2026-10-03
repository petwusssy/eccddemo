/**
 * ECCD CARE — System Configuration & Settings View
 * City Social Welfare and Development Office (CSWDO)
 */

import React, { useState } from 'react';
import {
  Settings,
  Building,
  Shield,
  Calendar,
  Database,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  UserCheck,
  FileCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { centralDataStore } from '../../services/centralDataStore';
import { apiClient } from '../../services/apiClient';

export function SettingsView({ onNavigate }) {
  const { addToast } = useToast();
  const [activeSchoolYear, setActiveSchoolYear] = useState('SY 2026–2027');
  const [apiMockMode, setApiMockMode] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo data to official CSWDO factory defaults? Any local field edits will be refreshed.')) {
      setIsResetting(true);
      setTimeout(() => {
        centralDataStore.reset();
        setIsResetting(false);
        addToast('ECCD CARE demo database reset to factory state', 'success');
      }, 800);
    }
  };

  const handleToggleMock = () => {
    const nextState = !apiMockMode;
    setApiMockMode(nextState);
    apiClient.setMockMode(nextState);
    addToast(
      nextState
        ? 'Switched to Centralized Mock Store (Reliable Prototype Mode)'
        : 'Switched to Live Backend API endpoint (/api)',
      'info'
    );
  };

  return (
    <div className="settings-view" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. LGU & Mandatory Legal Framework Card */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building size={20} color="var(--color-primary-800)" />
            <CardTitle subtitle="Official Mandate & Jurisdictional Authority">
              LGU Agency & Mandated Framework
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                LOCAL GOVERNMENT UNIT
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                City of San Fernando, Pampanga
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Province of Pampanga • Region III (Central Luzon)
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                IMPLEMENTING AGENCY
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                City Social Welfare and Development Office (CSWDO)
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Early Childhood Care and Development Focal Division
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                STATUTORY MANDATE
              </span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary-800)', marginTop: '0.25rem' }}>
                Republic Act No. 10410
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Early Years Act of 2013 (Ages 0 to 4 Years)
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Operational System Parameters */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={20} color="var(--color-primary-800)" />
            <CardTitle subtitle="Academic cohorts, demographic windows, and deduplication rules">
              Operational Parameters
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--bg-canvas)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                ACTIVE SCHOOL YEAR
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeSchoolYear}
                </span>
                <Badge variant="success">Current</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                Controls active CDC admissions and standard evaluation periods.
              </p>
            </div>

            <div style={{ background: 'var(--bg-canvas)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                TARGET COHORT AGE WINDOW
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                  0 to 4 Years, 11 Months
                </span>
                <Badge variant="primary">Mandated</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                Children aged 5+ are automatically flagged for DepEd Kindergarten transition.
              </p>
            </div>

            <div style={{ background: 'var(--bg-canvas)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                DEDUPLICATION ALGORITHM
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-success-primary)' }}>
                  Exact PhilSys + Fuzzy Soundex
                </span>
                <Badge variant="success">Active</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                Prevents duplicate child entries during mapping, enrollment, or health intake.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Data Privacy & Governance Controls */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={20} color="var(--color-primary-800)" />
            <CardTitle subtitle="Compliance with Republic Act No. 10173 (Data Privacy Act of 2012)">
              Data Privacy & Security Controls
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Immutable Audit Logging</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  All user modifications, child records, and system logins are cryptographically timestamped.
                </p>
              </div>
              <Badge variant="success">Enforced</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Role-Based Access Control (RBAC)</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Strict boundaries for CSWDO Admin, Service Providers (Field Workers), and Day Care Workers.
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Session Inactivity Auto-Lock</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Workstations lock after period of inactivity to prevent unauthorized access to sensitive child records.
                </p>
              </div>
              <Badge variant="success">15 Minutes</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Database & Storage Maintenance */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HardDrive size={20} color="var(--color-primary-800)" />
            <CardTitle subtitle="Relational cache and local client persistence">
              Database & Offline Storage
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Centralized Relational Store</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Persistent schema holding 14 interconnected ECCD entities with offline local cache.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleMock}
              >
                Mode: {apiMockMode ? 'Centralized Store' : 'Live /api'}
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleResetDemoData}
                disabled={isResetting}
              >
                <RefreshCw size={14} className={isResetting ? 'spin' : ''} />
                <span>Reset Demo Database</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default SettingsView;
