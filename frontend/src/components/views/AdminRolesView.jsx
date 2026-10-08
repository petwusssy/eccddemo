import React from 'react';
import { Shield, Users, Check, X, Lock, Info, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * AdminRolesView - Displays official system roles, scope, and permissions matrix
 * for ECCD Administrative vs Child Development Teacher (CDT)
 */
export default function AdminRolesView() {
  const roles = [
    {
      id: 'eccd_admin',
      name: 'ECCD Administrative Officer',
      badge: 'System Administrator',
      badgeVariant: 'danger',
      scope: 'City-wide (All 35 Barangays of City of San Fernando, Pampanga)',
      description: 'Senior CSWDO official responsible for program management, city-wide consolidation, staff credential provisioning, and executive compliance reporting.',
      activeUsersCount: 1,
      permissions: [
        { feature: 'Access Dedicated Admin Console (/admin)', allowed: true, note: 'Exclusive root access' },
        { feature: 'Create & Provision Staff / Teacher Accounts', allowed: true, note: 'Generate initial passwords & assign centers' },
        { feature: 'Reset Staff Passwords & Issue Credentials', allowed: true, note: 'Instant credential recovery' },
        { feature: 'Assign Teachers to Day Care Centers', allowed: true, note: 'City-wide worker deployment' },
        { feature: 'View All 35 Barangays & Centers Data', allowed: true, note: 'Consolidated city registry' },
        { feature: 'Consolidated Form 8 & Form 9 Generation', allowed: true, note: 'City-wide submission export' },
        { feature: 'View Security Audit Logs & System Trails', allowed: true, note: 'Full compliance tracking' },
        { feature: 'Direct Child Profiling & Assessment Entry', allowed: true, note: 'Supervisory editing rights' },
      ],
    },
    {
      id: 'cdt',
      name: 'Child Development Teacher (CDT)',
      badge: 'Frontline Implementer',
      badgeVariant: 'primary',
      scope: 'Assigned Day Care Center & Target Barangay(s)',
      description: 'Frontline child development worker delivering early education, developmental screening, and nutritional monitoring directly to children and families.',
      activeUsersCount: 1,
      permissions: [
        { feature: 'Access Dedicated Admin Console (/admin)', allowed: false, note: 'Strictly restricted & blocked' },
        { feature: 'Create & Provision Staff / Teacher Accounts', allowed: false, note: 'No user management access' },
        { feature: 'Reset Staff Passwords & Issue Credentials', allowed: false, note: 'No credential authority' },
        { feature: 'Assign Teachers to Day Care Centers', allowed: false, note: 'Assigned by Admin only' },
        { feature: 'View All 35 Barangays & Centers Data', allowed: false, note: 'Filtered to assigned center' },
        { feature: 'Consolidated Form 8 & Form 9 Generation', allowed: false, note: 'Center-level only' },
        { feature: 'View Security Audit Logs & System Trails', allowed: false, note: 'Restricted' },
        { feature: 'Direct Child Profiling & Assessment Entry', allowed: true, note: 'Core frontline daily duty' },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          boxShadow: '0 4px 12px rgba(30, 27, 75, 0.2)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={20} style={{ color: '#fbbf24' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Official Role-Based Access Control (RBAC) Matrix
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#c7d2fe', maxWidth: '750px' }}>
            Defines the operational boundaries between Executive Administration (CSWDO Head / IT Admin) and Frontline Field Implementers (Child Development Teachers).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>2</div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#cbd5e1' }}>Standard Roles</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>35</div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#cbd5e1' }}>Barangays Covered</div>
          </div>
        </div>
      </div>

      {/* Role Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-5)' }}>
        {roles.map((r) => (
          <Card key={r.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-4) var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <CardTitle style={{ fontSize: '1.1rem', fontWeight: 700 }}>{r.name}</CardTitle>
                  </div>
                  <Badge variant={r.badgeVariant} size="sm">
                    {r.badge}
                  </Badge>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Role Key:</span>
                  <code style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-700)' }}>{r.id}</code>
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Jurisdiction / Scope */}
              <div style={{ background: 'var(--bg-canvas)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Operational Jurisdiction
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.scope}
                </div>
              </div>

              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {r.description}
              </p>

              {/* Permissions Checklist */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  Key Capabilities & Restrictions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {r.permissions.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: p.allowed ? 'var(--color-success-bg, #f0fdf4)' : 'var(--bg-surface-elevated)',
                        border: `1px solid ${p.allowed ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-subtle)'}`,
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.allowed ? (
                          <Check size={14} style={{ color: 'var(--color-success-primary)', flexShrink: 0 }} />
                        ) : (
                          <X size={14} style={{ color: 'var(--color-danger-primary)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: p.allowed ? 600 : 400, color: p.allowed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {p.feature}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: p.allowed ? 'var(--color-success-dark, #15803d)' : 'var(--text-muted)', fontStyle: 'italic' }}>
                        {p.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
