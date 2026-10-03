import React, { useState } from 'react';
import {
  Palette,
  Type,
  MousePointerClick,
  FormInput,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Layers,
  Table as TableIcon,
  Maximize2,
  Sparkles,
  Search,
  Calendar,
  Save,
  Trash2,
  Download,
  Share2,
  Plus,
  HelpCircle,
  Clock,
  RotateCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox, Radio, Switch } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Card, CardHeader, CardTitle, CardBody, CardFooter, MetricCard } from '../ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';
import { Tabs } from '../ui/Tabs';
import { Modal } from '../ui/Modal';
import { Drawer } from '../ui/Drawer';
import { Tooltip } from '../ui/Tooltip';
import { Pagination } from '../ui/Pagination';
import { EmptyState, Spinner, SkeletonText, SkeletonCard, SkeletonTableRows, ErrorState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

export function DesignSystemGallery() {
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState('tokens');

  // Interactive state tests
  const [inputText, setInputText] = useState('Juan Dela Cruz');
  const [inputError, setInputError] = useState('ECCD Control Number is required and cannot be empty.');
  const [selectVal, setSelectVal] = useState('BRGY-01');
  const [cb1, setCb1] = useState(true);
  const [cb2, setCb2] = useState(false);
  const [radioVal, setRadioVal] = useState('male');
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(false);

  // Modals & Drawers demo
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Pagination demo
  const [demoPage, setDemoPage] = useState(2);
  const [demoPageSize, setDemoPageSize] = useState(10);

  // Trigger loading simulation
  const triggerLoading = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      addToast({
        type: 'success',
        title: 'Action Completed',
        message: 'The asynchronous government process has finished successfully.',
      });
    }, 1800);
  };

  const galleryTabs = [
    { id: 'tokens', label: 'Color & Typography Tokens', icon: Palette },
    { id: 'buttons', label: 'Buttons & Triggers', icon: MousePointerClick },
    { id: 'forms', label: 'Form Controls & Inputs', icon: FormInput },
    { id: 'badges', label: 'Badges & Alerts', icon: CheckCircle2 },
    { id: 'containers', label: 'Cards, Tables & Pagination', icon: TableIcon },
    { id: 'overlays', label: 'Modals, Drawers & Navigation', icon: Layers },
    { id: 'states', label: 'Empty, Loading & Skeletons', icon: RotateCw },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Intro Hero Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-900)',
          color: '#ffffff',
          padding: '1.5rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-primary-950)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                backgroundColor: 'var(--color-accent-600)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              GovPH Design System
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-primary-200)' }}>v1.0.0 Specification</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            ECCD CARE UI System & Design Tokens
          </h2>
          <p style={{ margin: '0.375rem 0 0 0', fontSize: '13px', color: '#cbd5e1', maxWidth: '700px' }}>
            Official component catalog for CSWDO and Day Care Worker interfaces. Built strictly with deep navy authority, cyan accents, high legibility, and accessible standards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              addToast({
                type: 'info',
                title: 'System Tokens Active',
                message: 'All design variables are bound to standard CSS tokens in :root.',
              });
            }}
          >
            Tokens Verified
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={galleryTabs}
        activeTab={activeSection}
        onChange={setActiveSection}
        variant="pills"
      />

      {/* SECTION 1: TOKENS & FOUNDATIONS */}
      {activeSection === 'tokens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Curated palette adhering to Philippine Government digital trust principles">
                Color Palette Tokens
              </CardTitle>
            </CardHeader>
            <CardBody>
              <h4 className="text-h4" style={{ marginBottom: '0.75rem' }}>
                Primary: Deep Navy / Blue (Authority & Government Identity)
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                {[
                  { name: '--color-primary-950', hex: '#0a1628', desc: 'Gov Banner / Footers' },
                  { name: '--color-primary-900', hex: '#0f2240', desc: 'Sidebar / Brand' },
                  { name: '--color-primary-800', hex: '#15325b', desc: 'Primary Buttons' },
                  { name: '--color-primary-700', hex: '#1a4277', desc: 'Links / Focus rings' },
                  { name: '--color-primary-100', hex: '#dbeafe', desc: 'Subtle Tint' },
                  { name: '--color-primary-50', hex: '#eff6ff', desc: 'Surface Highlight' },
                ].map((c) => (
                  <div key={c.name} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '48px', backgroundColor: c.hex }} />
                    <div style={{ padding: '0.5rem', fontSize: '11px' }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{c.hex}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-h4" style={{ marginBottom: '0.75rem' }}>
                Secondary Accent: Teal & Cyan (Child Care, Health & Early Development)
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                {[
                  { name: '--color-accent-700', hex: '#0f766e', desc: 'Deep Accent' },
                  { name: '--color-accent-600', hex: '#0d9488', desc: 'Accent Buttons' },
                  { name: '--color-accent-500', hex: '#0891b2', desc: 'Cyan Brand' },
                  { name: '--color-accent-400', hex: '#06b6d4', desc: 'Active Marker' },
                  { name: '--color-accent-100', hex: '#cffafe', desc: 'Pill Background' },
                  { name: '--color-accent-50', hex: '#f0fdfa', desc: 'Muted Cyan' },
                ].map((c) => (
                  <div key={c.name} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '48px', backgroundColor: c.hex }} />
                    <div style={{ padding: '0.5rem', fontSize: '11px' }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{c.hex}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-h4" style={{ marginBottom: '0.75rem' }}>
                Semantic Functional Status Colors
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-success-text)' }}>Success / Completed</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success-primary)', marginTop: '2px' }}>Hex: #15803d</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Standard developmental age, complete cycle.</div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-warning-text)' }}>Warning / Pending / Due</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-warning-primary)', marginTop: '2px' }}>Hex: #b45309</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Assessment window due, pending validation.</div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-danger-text)' }}>Urgent / Risk / Error</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-danger-primary)', marginTop: '2px' }}>Hex: #b91c1c</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Severe domain delay, severe malnutrition flag.</div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-info-text)' }}>Information / Advisory</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-info-primary)', marginTop: '2px' }}>Hex: #1d4ed8</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>CDC intake scheduled, informational notices.</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Inter font scale calibrated for clear readability across CSWDO monitors and tablets">
                Typography Scale & Hierarchy
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <span className="text-caption">Display / Page Header (24px - Bold)</span>
                  <div className="text-h1">Child Assessment, Registration & Early-support System</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <span className="text-caption">Section Title / H2 (20px - Bold)</span>
                  <div className="text-h2">Standardized Philippine ECCD Developmental Checklist</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <span className="text-caption">Sub-section Title / H3 (18px - Semi-bold)</span>
                  <div className="text-h3">Gross Motor, Fine Motor & Receptive Language Domains</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <span className="text-caption">Default Body (14px - Regular)</span>
                  <div className="text-body">
                    The Early Childhood Care and Development (ECCD) Council mandates comprehensive tracking of Filipino children aged 0 to 4 to identify early developmental delays and ensure community-based interventions.
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <span className="text-caption">Monospace / Control Numbers (13px - JetBrains Mono)</span>
                  <div className="text-mono" style={{ color: 'var(--color-primary-800)', fontWeight: 600 }}>
                    ECCD-2026-00101 • PHILSYS-1928-3829-4829 • BARANGAY-SJ-004
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* SECTION 2: BUTTONS */}
      {activeSection === 'buttons' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Full set of button variants, sizes, and states for public-service operations">
              Action Buttons & Trigger Components
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  Standard Variants
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="accent">Accent Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Action</Button>
                  <Button variant="danger-outline">Danger Outline</Button>
                  <Button variant="success">Success Action</Button>
                </div>
              </div>

              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  Sizes (sm, md, lg)
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="primary" size="sm">
                    Small (sm - 12px)
                  </Button>
                  <Button variant="primary" size="md">
                    Medium Default (md - 14px)
                  </Button>
                  <Button variant="primary" size="lg">
                    Large (lg - 16px)
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  With Icons & Icon-Only
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="primary" icon={Plus}>
                    Register Child
                  </Button>
                  <Button variant="secondary" icon={Download}>
                    Export Data
                  </Button>
                  <Button variant="outline" iconRight={Share2}>
                    Share Case File
                  </Button>
                  <Button variant="secondary" size="md" className="btn-icon-only" title="Settings">
                    <Save size={16} />
                  </Button>
                  <Button variant="danger-outline" size="md" className="btn-icon-only" title="Delete">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  States: Loading & Disabled
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="primary"
                    isLoading={btnLoading}
                    onClick={triggerLoading}
                  >
                    {btnLoading ? 'Submitting to CSWDO...' : 'Test Async Loading State'}
                  </Button>
                  <Button variant="secondary" disabled>
                    Disabled Action
                  </Button>
                  <Button variant="danger" disabled>
                    Disabled Destructive
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* SECTION 3: FORMS & INPUTS */}
      {activeSection === 'forms' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Accessible inputs, validation states, helpers, and selection controls">
              Form Controls & Input System
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Left Column: Text & Date Inputs */}
              <div>
                <h4 className="text-h4" style={{ marginBottom: '1rem' }}>
                  Text, Search & Date Inputs
                </h4>

                <Input
                  label="Child Full Name"
                  required
                  placeholder="Enter full legal name as in PSA Birth Cert"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  helper="Follow standard Filipino naming (First Name, Middle Name, Last Name)."
                />

                <Input
                  label="Search Masterlist with Clear Trigger"
                  placeholder="Type to search child record..."
                  icon={Search}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onClear={() => setInputText('')}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  defaultValue="2023-04-12"
                  helper="Age in months will be auto-calculated against the current assessment date."
                />

                <Input
                  label="Field with Validation Error"
                  required
                  value=""
                  error={inputError}
                  placeholder="ECCD Control Number"
                  onChange={() => {}}
                />

                <Input
                  label="Disabled Read-only Field"
                  disabled
                  value="ECCD-AUTOGEN-2026-9999"
                  helper="Assigned automatically by the CSWDO central registry."
                />
              </div>

              {/* Right Column: Selects, Radios, Checkboxes */}
              <div>
                <h4 className="text-h4" style={{ marginBottom: '1rem' }}>
                  Selection & Multi-choice Controls
                </h4>

                <Select
                  label="Assigned Barangay"
                  required
                  value={selectVal}
                  onChange={(e) => setSelectVal(e.target.value)}
                  options={[
                    { value: 'BRGY-01', label: 'Barangay San Jose (3 CDCs)' },
                    { value: 'BRGY-02', label: 'Barangay Dolores (4 CDCs)' },
                    { value: 'BRGY-03', label: 'Barangay Lourdes (2 CDCs)' },
                    { value: 'BRGY-04', label: 'Barangay Sto. Rosario (3 CDCs)' },
                  ]}
                  helper="Determines which Child Development Worker (CDW) receives the case."
                />

                <Textarea
                  label="CSWDO Social Worker Assessment Notes"
                  placeholder="Enter developmental observations, behavioral markers, or family context..."
                  defaultValue="Child responds positively to verbal prompts and recognizes common primary colors."
                  rows={3}
                />

                <div className="form-group">
                  <label className="form-label">Checkboxes with Descriptive Text</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.25rem' }}>
                    <Checkbox
                      label="PSA Birth Certificate verified and on file"
                      description="Hardcopy or e-PSA verified by Barangay CDC worker."
                      checked={cb1}
                      onChange={(e) => setCb1(e.target.checked)}
                    />
                    <Checkbox
                      label="Enrolled in Supplementary Feeding Program (SFP)"
                      description="Flag for 120-day hot meals program."
                      checked={cb2}
                      onChange={(e) => setCb2(e.target.checked)}
                    />
                    <Checkbox
                      label="Disabled checkbox item"
                      checked={false}
                      disabled
                      description="Cannot be toggled at this access tier."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Radio Button Selection</label>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
                    <Radio
                      name="sex-demo"
                      value="female"
                      label="Female"
                      checked={radioVal === 'female'}
                      onChange={() => setRadioVal('female')}
                    />
                    <Radio
                      name="sex-demo"
                      value="male"
                      label="Male"
                      checked={radioVal === 'male'}
                      onChange={() => setRadioVal('male')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Toggle Switches</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <Switch
                      label="Automated SMS Assessment Reminders to Parent"
                      description="Sends notification 7 days before next ECCD cycle."
                      checked={switch1}
                      onChange={(e) => setSwitch1(e.target.checked)}
                    />
                    <Switch
                      label="Flag as High-Risk Household"
                      description="Requires home visit by Registered Social Worker."
                      checked={switch2}
                      onChange={(e) => setSwitch2(e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* SECTION 4: BADGES, ALERTS & TOASTS */}
      {activeSection === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Status pills, indicators, and dot badges for ECCD domains and nutritional classifications">
                Badges & Status Pills
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div className="text-caption" style={{ marginBottom: '0.5rem' }}>
                    Status Badges with Indicator Dot
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge variant="success">Completed (Standard)</Badge>
                    <Badge variant="warning">Due for Assessment</Badge>
                    <Badge variant="danger">Urgent: Domain Delay</Badge>
                    <Badge variant="info">Enrolled in Day Care</Badge>
                    <Badge variant="neutral">Draft Record</Badge>
                    <Badge variant="primary">CSWDO Verified</Badge>
                  </div>
                </div>

                <div>
                  <div className="text-caption" style={{ marginBottom: '0.5rem' }}>
                    Solid Badges (No Dot)
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge variant="success" dot={false}>Normal Weight</Badge>
                    <Badge variant="warning" dot={false}>Moderately Underweight</Badge>
                    <Badge variant="danger" dot={false}>Severely Wasted</Badge>
                    <Badge variant="info" dot={false}>Cycle 2 Scheduled</Badge>
                    <Badge variant="neutral" dot={false}>Archived 2025</Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Feedback banners and dismissible messages for administrative notices">
                Alert Banners
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Alert
                  variant="info"
                  title="DSWD Quarterly Submission Window Open"
                  onDismiss={() => {}}
                >
                  City-wide ECCD consolidation for Q1 2026 is due by April 30, 2026. Please ensure all 10 barangays complete their child profiling masterlists.
                </Alert>

                <Alert
                  variant="success"
                  title="Masterlist Verification Complete"
                  onDismiss={() => {}}
                >
                  342 child records from Barangay San Jose have been reconciled with PSA local civil registry records with 0 discrepancies found.
                </Alert>

                <Alert
                  variant="warning"
                  title="Approaching ECCD Assessment Deadline"
                  onDismiss={() => {}}
                >
                  84 registered children in 4 CDCs are scheduled for their 6-month developmental milestone checklist within the next 14 calendar days.
                </Alert>

                <Alert
                  variant="danger"
                  title="Urgent Child Case Management Flag"
                  onDismiss={() => {}}
                  action={
                    <Button variant="danger" size="sm">
                      Open Urgent Case File
                    </Button>
                  }
                >
                  Child ECCD-2026-00104 exhibits significant delay in Receptive Language domain and has been flagged as Severely Wasted. Immediate referral dispatched to City Health Office.
                </Alert>
              </div>
            </CardBody>
          </Card>

          {/* Toast Triggers */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Floating notifications with auto-dismiss and accessibility feedback">
                Toast Notification Trigger Lab
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button
                  variant="success"
                  onClick={() =>
                    addToast({
                      type: 'success',
                      title: 'Assessment Checklist Saved',
                      message: 'Raw scores tallied and scaled score calculated: 112 / 120 (Standard Development).',
                    })
                  }
                >
                  Trigger Success Toast
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    addToast({
                      type: 'warning',
                      title: 'Follow-up Due Reminder',
                      message: 'Child assessment due date is within 3 days.',
                    })
                  }
                >
                  Trigger Warning Toast
                </Button>

                <Button
                  variant="danger"
                  onClick={() =>
                    addToast({
                      type: 'danger',
                      title: 'Registry Sync Error',
                      message: 'Connection to Philippine Civil Registry system timed out. Please retry.',
                    })
                  }
                >
                  Trigger Danger Toast
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    addToast({
                      type: 'info',
                      title: 'Information Notice',
                      message: 'Barangay Dolores CDC masterlist updated by CDW Liza Cruz.',
                    })
                  }
                >
                  Trigger Info Toast
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* SECTION 5: CARDS & TABLES */}
      {activeSection === 'containers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metric Cards Showcase */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Executive metric summary cards with trend indicators and color tokens">
                Metric / KPI Cards
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <MetricCard
                  label="Total Children Monitored"
                  value="2,845"
                  delta="+148 this quarter"
                  trend="up"
                  icon={FormInput}
                  color="primary"
                />
                <MetricCard
                  label="Day Care Enrollment"
                  value="1,920"
                  delta="67.5% coverage"
                  trend="up"
                  icon={CheckCircle2}
                  color="accent"
                />
                <MetricCard
                  label="Checklists Due"
                  value="84"
                  delta="14 overdue"
                  trend="warning"
                  icon={AlertTriangle}
                  color="warning"
                />
                <MetricCard
                  label="Severe Nutrition Flags"
                  value="26"
                  delta="Requires CSWDO Action"
                  trend="urgent"
                  icon={AlertOctagon}
                  color="danger"
                />
              </div>
            </CardBody>
          </Card>

          {/* Table & Pagination Showcase */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Government-grade tabular layout with headers, status pills, and pagination controls">
                Data Table System
              </CardTitle>
            </CardHeader>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Center Code</TableHeader>
                  <TableHeader>Child Development Center</TableHeader>
                  <TableHeader>Barangay</TableHeader>
                  <TableHeader>Assigned Worker</TableHeader>
                  <TableHeader>Enrolled / Capacity</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>CDC-01</span></TableCell>
                  <TableCell><strong>San Jose Child Development Center I</strong></TableCell>
                  <TableCell>Barangay San Jose</TableCell>
                  <TableCell>Remedios D. Garcia, CDW I</TableCell>
                  <TableCell>38 / 40 (95%)</TableCell>
                  <TableCell><Badge variant="success">Fully Accredited</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>CDC-02</span></TableCell>
                  <TableCell><strong>Dolores Early Learning Center</strong></TableCell>
                  <TableCell>Barangay Dolores</TableCell>
                  <TableCell>Liza M. Cruz, CDW II</TableCell>
                  <TableCell>44 / 45 (98%)</TableCell>
                  <TableCell><Badge variant="success">Fully Accredited</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><span className="text-mono" style={{ fontWeight: 600 }}>CDC-03</span></TableCell>
                  <TableCell><strong>Lourdes Community CDC</strong></TableCell>
                  <TableCell>Barangay Lourdes</TableCell>
                  <TableCell>Corazon B. Reyes, CDW I</TableCell>
                  <TableCell>30 / 35 (85%)</TableCell>
                  <TableCell><Badge variant="warning">Renewal Pending</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Pagination
              currentPage={demoPage}
              totalItems={45}
              pageSize={demoPageSize}
              onPageChange={(p) => setDemoPage(p)}
              onPageSizeChange={(s) => setDemoPageSize(s)}
            />
          </Card>
        </div>
      )}

      {/* SECTION 6: OVERLAYS & NAVIGATION */}
      {activeSection === 'overlays' && (
        <Card>
          <CardHeader>
            <CardTitle subtitle="Dialogs, slide-over panels, breadcrumbs, and floating tooltips">
              Modals, Drawers & Overlays
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  Interactive Modal & Drawer Triggers
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button variant="primary" onClick={() => setDemoModalOpen(true)}>
                    Open Accessible Modal Dialog
                  </Button>
                  <Button variant="secondary" onClick={() => setDemoDrawerOpen(true)}>
                    Open Detail Slide-Over Drawer
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>
                  Tooltips
                </h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Tooltip text="City Social Welfare and Development Office">
                    <span style={{ textDecoration: 'underline dotted', cursor: 'help', fontWeight: 600 }}>
                      Hover for CSWDO acronym
                    </span>
                  </Tooltip>

                  <Tooltip text="Early Childhood Care and Development (RA 10410)">
                    <span style={{ textDecoration: 'underline dotted', cursor: 'help', fontWeight: 600 }}>
                      Hover for ECCD explanation
                    </span>
                  </Tooltip>

                  <Tooltip text="Child Development Worker (Accredited Daycare Teacher)">
                    <span style={{ textDecoration: 'underline dotted', cursor: 'help', fontWeight: 600 }}>
                      Hover for CDW definition
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardBody>

          {/* Test Modal */}
          <Modal
            isOpen={demoModalOpen}
            onClose={() => setDemoModalOpen(false)}
            title="Philippine ECCD Standards Confirmation"
            subtitle="Standardized early-support protocol confirmation"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDemoModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDemoModalOpen(false);
                    addToast({
                      type: 'success',
                      title: 'Protocol Confirmed',
                      message: 'Dialog action executed successfully with proper focus recovery.',
                    });
                  }}
                >
                  Confirm & Proceed
                </Button>
              </>
            }
          >
            <p className="text-body" style={{ margin: 0 }}>
              This dialog demonstrates the standardized government modal: accessible focus trap, subtle backdrop overlay, escape key listening, and distinct action buttons.
            </p>
          </Modal>

          {/* Test Drawer */}
          <Drawer
            isOpen={demoDrawerOpen}
            onClose={() => setDemoDrawerOpen(false)}
            title="Quick Household Profile Drawer"
            subtitle="HH-2026-PAMP-00482"
            footer={
              <Button variant="secondary" size="sm" onClick={() => setDemoDrawerOpen(false)}>
                Close Panel
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Alert variant="info" title="Household Verified">
                4Ps beneficiary registered in Barangay San Jose Purok 3.
              </Alert>
              <div style={{ fontSize: '13px' }}>
                <strong>Household Head:</strong> Juanito M. Dela Cruz
                <br />
                <strong>Number of 0-4 Children:</strong> 2
                <br />
                <strong>Assigned CDW:</strong> Remedios Garcia
              </div>
            </div>
          </Drawer>
        </Card>
      )}

      {/* SECTION 7: STATES & FALLBACKS */}
      {activeSection === 'states' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Skeletons */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Non-distracting shimmer loading placeholders for low-bandwidth connections">
                Skeleton States
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div className="text-caption" style={{ marginBottom: '0.5rem' }}>Text Skeleton</div>
                  <SkeletonText lines={4} />
                </div>
                <div>
                  <div className="text-caption" style={{ marginBottom: '0.5rem' }}>Card Skeleton</div>
                  <SkeletonCard />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Empty & Error States */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card>
              <CardHeader>
                <CardTitle subtitle="Clean guidance when no data is available">
                  Empty State
                </CardTitle>
              </CardHeader>
              <CardBody>
                <EmptyState
                  title="No Pending Follow-ups"
                  description="All scheduled ECCD home visits and nutritional reassessments for this barangay are up to date."
                  actionLabel="Schedule New Assessment"
                  onAction={() =>
                    addToast({
                      type: 'info',
                      title: 'Scheduler Opened',
                      message: 'Navigating to ECCD scheduling form...',
                    })
                  }
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle subtitle="Clear error reporting with retry capability">
                  Error State
                </CardTitle>
              </CardHeader>
              <CardBody>
                <ErrorState
                  title="Civil Registry Gateway Offline"
                  message="Could not connect to the local LGU PSA API endpoint. Cached records are displayed."
                  onRetry={() =>
                    addToast({
                      type: 'warning',
                      title: 'Connection Retry',
                      message: 'Attempting to reconnect to CSWDO gateway...',
                    })
                  }
                />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesignSystemGallery;
