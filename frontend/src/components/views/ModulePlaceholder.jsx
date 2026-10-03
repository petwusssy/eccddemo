import React from 'react';
import {
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Building2,
  Users,
  School,
  HeartPulse,
  CheckSquare,
  CalendarClock,
  FileBarChart,
  FileClock,
  Settings as SettingsIcon,
  Home,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';
import { mockAuditLogs, barangaysList, dayCareCentersList } from '../../data/mockData';

const moduleMeta = {
  children: {
    title: 'Children Registry',
    section: 'CHILD MANAGEMENT',
    icon: Users,
    desc: 'Comprehensive demographic profiling, PSA birth certificate records, and PhilSys linkage for 0–4 age bracket.',
    badge: 'Phase 2 Module',
  },
  households: {
    title: 'Households Profiling',
    section: 'CHILD MANAGEMENT',
    icon: Home,
    desc: 'Family profiling, 4Ps beneficiary tagging, socio-economic bracket, and primary guardian mapping.',
    badge: 'Phase 2 Module',
  },
  'community-mapping': {
    title: 'Community Mapping & Spot Maps',
    section: 'CHILD MANAGEMENT',
    icon: MapPin,
    desc: 'Purok-level spatial mapping of households with 0–4 children to identify unserved puroks and clusters.',
    badge: 'Phase 2 Module',
  },
  enrollment: {
    title: 'Day Care & CDC Enrollment Tracking',
    section: 'CHILD MANAGEMENT',
    icon: ClipboardCheck,
    desc: 'Tracking of early childhood development center admissions, attendance, and transition to Kindergarten.',
    badge: 'Phase 2 Module',
  },
  'health-monitoring': {
    title: 'Child Health & Nutrition Monitoring',
    section: 'MONITORING',
    icon: HeartPulse,
    desc: 'Operation Timbang Plus (OPT) integration, Weight-for-Age, Height-for-Age, and Supplementary Feeding tracking.',
    badge: 'Phase 3 Module',
  },
  'eccd-checklist': {
    title: 'Developmental / ECCD Checklist Assessment',
    section: 'MONITORING',
    icon: CheckSquare,
    desc: 'Standardized 7-domain ECCD Checklist scoring (Gross Motor, Fine Motor, Self-Help, Receptive, Expressive, Cognitive, Socio-Emotional).',
    badge: 'Phase 3 Module',
  },
  'follow-ups': {
    title: 'Intervention & Case Follow-ups',
    section: 'MONITORING',
    icon: CalendarClock,
    desc: 'CSWDO Registered Social Worker home visits, early referral to developmental pediatricians, and case monitoring.',
    badge: 'Phase 3 Module',
  },
  barangays: {
    title: 'Barangays Masterlist',
    section: 'COMMUNITY',
    icon: Building2,
    desc: 'LGU Barangay profiles, population demographics, and designated Day Care focal persons.',
    badge: 'Reference Data',
  },
  'daycare-centers': {
    title: 'Child Development Centers (CDCs)',
    section: 'COMMUNITY',
    icon: School,
    desc: 'Accreditation status, facility capacity, learning materials inventory, and sanitary compliance.',
    badge: 'Reference Data',
  },
  workers: {
    title: 'Child Development Workers (CDWs)',
    section: 'COMMUNITY',
    icon: Users,
    desc: 'Accreditation directory, civil service eligibility, training records, and assigned CDC stations.',
    badge: 'Personnel Masterlist',
  },
  reports: {
    title: 'Consolidated CSWDO & DSWD Reports',
    section: 'REPORTS',
    icon: FileBarChart,
    desc: 'Automated generation of ECCD Form 1, Form 2, DSWD Field Office regional submissions, and LGU annual investment plan metrics.',
    badge: 'Reporting Module',
  },
  'audit-logs': {
    title: 'System Audit Logs & Security Trace',
    section: 'SYSTEM',
    icon: FileClock,
    desc: 'Immutable audit trail of all data access, assessment modifications, and export operations pursuant to RA 10173.',
    badge: 'System Core',
  },
  settings: {
    title: 'System & Jurisdictional Settings',
    section: 'SYSTEM',
    icon: SettingsIcon,
    desc: 'LGU configuration, School Year active cycles, user role permissions, and database backup schedules.',
    badge: 'Administrative',
  },
};

export function ModulePlaceholder({ moduleId, onNavigate }) {
  const meta = moduleMeta[moduleId] || {
    title: 'CSWDO Module',
    section: 'ECCD CARE',
    icon: FileText,
    desc: 'This module is scheduled for implementation in subsequent phases.',
    badge: 'Foundation Ready',
  };

  const Icon = meta.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Module Overview Card */}
      <Card>
        <CardBody style={{ padding: '2rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-primary-100)',
                flexShrink: 0,
              }}
            >
              <Icon size={26} />
            </div>

            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {meta.section}
                </span>
                <Badge variant="primary" dot={false}>
                  {meta.badge}
                </Badge>
              </div>

              <h2 className="text-h2" style={{ marginBottom: '0.375rem' }}>
                {meta.title}
              </h2>

              <p className="text-body" style={{ margin: 0, maxWidth: '800px' }}>
                {meta.desc}
              </p>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Realistic Contextual Data Preview depending on module */}
      {moduleId === 'audit-logs' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Real-time security logs pursuant to RA 10173 (Data Privacy Act of 2012)">
              System Activity Audit Trail
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Log Reference</TableHeader>
                <TableHeader>Timestamp</TableHeader>
                <TableHeader>Officer / User</TableHeader>
                <TableHeader>Action Performed</TableHeader>
                <TableHeader>Target Record</TableHeader>
                <TableHeader>Terminal IP</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>{log.id}</span></TableCell>
                  <TableCell style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.timestamp}</TableCell>
                  <TableCell><strong>{log.user}</strong> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({log.role})</span></TableCell>
                  <TableCell><Badge variant="neutral">{log.action}</Badge></TableCell>
                  <TableCell style={{ fontSize: '12px' }}>{log.target}</TableCell>
                  <TableCell className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {moduleId === 'barangays' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="35 Barangays covered by CSWDO Early Childhood Program">
              LGU Barangay Jurisdictions
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Code</TableHeader>
                <TableHeader>Barangay</TableHeader>
                <TableHeader>Active CDCs</TableHeader>
                <TableHeader>Children Monitored (0–4)</TableHeader>
                <TableHeader>Accredited CDWs</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {barangaysList.map((b) => (
                <TableRow key={b.id}>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>{b.id}</span></TableCell>
                  <TableCell><strong>{b.name}</strong></TableCell>
                  <TableCell>{b.cdcs} Centers</TableCell>
                  <TableCell><strong>{b.childrenCount}</strong> children</TableCell>
                  <TableCell>{b.workers} Workers</TableCell>
                  <TableCell><Badge variant="success">Active Coverage</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {moduleId === 'daycare-centers' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Day Care and Early Childhood Development Centers">
              Child Development Centers Masterlist
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Center ID</TableHeader>
                <TableHeader>Center Name</TableHeader>
                <TableHeader>Barangay Location</TableHeader>
                <TableHeader>Assigned Worker</TableHeader>
                <TableHeader>Capacity & Enrolled</TableHeader>
                <TableHeader>Accreditation</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {dayCareCentersList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>{c.id}</span></TableCell>
                  <TableCell><strong>{c.name}</strong></TableCell>
                  <TableCell>{c.barangay}</TableCell>
                  <TableCell>{c.worker}</TableCell>
                  <TableCell>{c.enrolled} / {c.capacity}</TableCell>
                  <TableCell><Badge variant="success">Accredited (DSWD)</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Architecture & Next Phase Notice */}
      <Card>
        <CardHeader>
          <CardTitle subtitle="Foundation status and integration contract">
            Module Architecture & Scope
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '13px' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-primary-950)', marginBottom: '0.25rem' }}>
                Design System Bound
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                This module uses the standardized ECCD CARE UI token system, ensuring pixel-perfect layout and color harmony when screens are developed.
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-primary-950)', marginBottom: '0.25rem' }}>
                Role-Based Permission Ready
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Access boundaries configured for CSWDO Administrator, Social Worker, Nutrition Officer, and Day Care Worker roles.
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-primary-950)', marginBottom: '0.25rem' }}>
                Data Contract Ready
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Compatible with the Laravel REST API backend data schemas and DSWD standard reporting structures.
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default ModulePlaceholder;
