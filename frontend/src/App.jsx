/**
 * ECCD CARE — Main Application Entry
 *
 * react-patterns skill:
 *   - Context provider tree at root (AuthProvider → ToastProvider → AppContent)
 *   - Container/Presentational split: App handles auth routing logic
 *   - Status-based conditional rendering (no prop drilling for auth)
 *
 * auth-implementation-patterns skill:
 *   - Protected routes: only render AppShell when AUTHENTICATED
 *   - Session expired state: redirect back to login with message
 *   - Role-based landing page on first login
 *
 * api-and-interface-design skill:
 *   - Role permissions filter navigation items
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth, AUTH_STATUS } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import DashboardOverview from './components/views/DashboardOverview';
import CommunityMappingView from './components/views/CommunityMappingView';
import ChildManagementView from './components/views/ChildManagementView';
import EnrollmentView from './components/views/EnrollmentView';
import HealthMonitoringView from './components/views/HealthMonitoringView';
import DevelopmentView from './components/views/DevelopmentView';
import FollowUpView from './components/views/FollowUpView';
import CommunityView from './components/views/CommunityView';
import ReportsView from './components/views/ReportsView';
import AuditLogsView from './components/views/AuditLogsView';
import SettingsView from './components/views/SettingsView';
import UnauthorizedView from './components/governance/UnauthorizedView';
import SessionExpiryModal from './components/governance/SessionExpiryModal';
import { ROLES } from './services/authService';
import auditService from './services/auditService';

import ModulePlaceholder from './components/views/ModulePlaceholder';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { Button } from './components/ui/Button';
import { Printer, Loader2 } from 'lucide-react';

const ROUTE_MAP = {
  dashboard: '/dashboard',
  children: '/children',
  'community-mapping': '/mapping',
  mapping: '/mapping',
  households: '/mapping',
  enrollment: '/enrollment',
  'health-monitoring': '/health-monitoring',
  'eccd-checklist': '/development-assessment',
  'development-assessment': '/development-assessment',
  'follow-ups': '/follow-ups',
  'community-network': '/community-network',
  barangays: '/community-network',
  'daycare-centers': '/community-network',
  workers: '/community-network',
  reports: '/reports',
  'audit-logs': '/audit-logs',
  settings: '/settings',
};

const PATH_TO_SECTION = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/children': 'children',
  '/mapping': 'community-mapping',
  '/community-mapping': 'community-mapping',
  '/households': 'community-mapping',
  '/enrollment': 'enrollment',
  '/health-monitoring': 'health-monitoring',
  '/development-assessment': 'eccd-checklist',
  '/eccd-checklist': 'eccd-checklist',
  '/follow-ups': 'follow-ups',
  '/community-network': 'community-network',
  '/barangays': 'community-network',
  '/daycare-centers': 'community-network',
  '/workers': 'community-network',
  '/reports': 'reports',
  '/audit-logs': 'audit-logs',
  '/settings': 'settings',
};

const ROLE_LANDING_ROUTE = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.FIELD_WORKER]: '/mapping',
  [ROLES.DAYCARE_WORKER]: '/enrollment',
};

/**
 * Loading screen shown during initial session validation.
 * design-taste-frontend: subtle, no flashy spinner, clean branded screen.
 */
function AuthLoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-seal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="auth-loading-text">Verifying session...</div>
      <Loader2
        size={18}
        style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }}
      />
    </div>
  );
}

/**
 * Authenticated Application Content
 * Only renders when user is verified by AuthProvider.
 */
function AuthenticatedApp() {
  const {
    user,
    checkPermission,
    logout,
    roleLabel,
    switchRole,
    triggerSessionExpiry,
    unlockSession,
    isExpired,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Active navigation section derived directly from URL
  const activeItem = PATH_TO_SECTION[location.pathname] || 'dashboard';

  // Centralized navigation handler accepting route key or path
  const handleNavigate = (target) => {
    const route = ROUTE_MAP[target] || (target?.startsWith('/') ? target : `/${target}`);
    navigate(route);
  };

  // Log unauthorized access attempts
  useEffect(() => {
    if (!checkPermission(activeItem)) {
      auditService.logActivity({
        user: user?.name || 'Authorized Staff',
        role: roleLabel || user?.role,
        action: 'Attempted Access to Restricted Section',
        module: 'System Governance',
        record: location.pathname,
        status: 'Unauthorized Attempt',
        details: `${roleLabel} role lacks permission for ${activeItem}.`,
      });
    }
  }, [activeItem, checkPermission, user, roleLabel, location.pathname]);

  // Determine page titles and breadcrumbs based on active item
  const getPageInfo = () => {
    switch (activeItem) {
      case 'dashboard':
        return {
          title: 'CSWDO ECCD Monitoring Dashboard',
          subtitle: 'Centralized registry for children aged 0–4 • City Social Welfare & Development Office',
          breadcrumbs: [
            { label: 'ECCD CARE', onClick: () => navigate('/dashboard') },
            { label: 'Executive Dashboard' },
          ],
          actions: (
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print Summary
            </Button>
          ),
        };

      case 'children':
        return {
          title: 'Children Demographic Registry (0–4)',
          subtitle: 'Masterlist of children registered with PSA Civil Registry and PhilSys linkage',
          breadcrumbs: [
            { label: 'Child Management', onClick: () => navigate('/children') },
            { label: 'Children Masterlist' },
          ],
        };

      case 'households':
      case 'community-mapping':
        return {
          title: 'Community Mapping',
          subtitle: 'Purok and Sitio-level visual spot mapping of 0–4 age cohorts',
          breadcrumbs: [
            { label: 'Child Management' },
            { label: 'Community Mapping' },
          ],
        };

      case 'enrollment':
        return {
          title: 'Enrollment',
          subtitle: 'Child Development Center admissions, capacity, and attendance records',
          breadcrumbs: [
            { label: 'Child Management' },
            { label: 'Enrollment' },
          ],
        };

      case 'health-monitoring':
        return {
          title: 'Health Monitoring',
          subtitle: 'Monthly height, weight, and nutritional status tracking',
          breadcrumbs: [
            { label: 'Monitoring' },
            { label: 'Health Monitoring' },
          ],
        };

      case 'eccd-checklist':
        return {
          title: 'Development Assessment',
          subtitle: 'Standardized 7 developmental domains assessment framework for Filipino children',
          breadcrumbs: [
            { label: 'Monitoring' },
            { label: 'Development Assessment' },
          ],
        };

      case 'follow-ups':
        return {
          title: 'Follow-ups',
          subtitle: 'Specialized interventions, home visits, and early support referrals',
          breadcrumbs: [
            { label: 'Monitoring' },
            { label: 'Follow-ups' },
          ],
        };

      case 'barangays':
      case 'daycare-centers':
      case 'workers':
      case 'community-network':
        return {
          title: 'Community Network',
          subtitle: 'ECCD Barangay coverage (Form 3), accredited Day Care Centers (Form 7), and Workers (Form 6)',
          breadcrumbs: [
            { label: 'Community', onClick: () => navigate('/community-network') },
            { label: 'Community Network' },
          ],
        };

      case 'reports':
        return {
          title: 'ECCD Reports & DSWD Consolidated Submissions',
          subtitle: 'Standard Form 1, Form 2, nutritional summaries, and executive reports',
          breadcrumbs: [
            { label: 'Reports' },
            { label: 'Consolidated Reports' },
          ],
        };

      case 'resources':
        return {
          title: 'Resources, Policies & Toolkits',
          subtitle: 'ECCD manuals, standardized rating scales, and parent orientation guides',
          breadcrumbs: [
            { label: 'Resources' },
            { label: 'ECCD Guidelines' },
          ],
        };

      case 'audit-logs':
        return {
          title: 'System Security & Audit Trail',
          subtitle: 'Immutable record of system operations in compliance with RA 10173',
          breadcrumbs: [
            { label: 'System' },
            { label: 'Audit Logs' },
          ],
        };

      case 'settings':
        return {
          title: 'System Configuration & Settings',
          subtitle: 'LGU details, active school years, and administrative user controls',
          breadcrumbs: [
            { label: 'System' },
            { label: 'Settings' },
          ],
        };

      default:
        return {
          title: 'ECCD CARE System',
          subtitle: 'City Social Welfare and Development Office',
          breadcrumbs: [{ label: 'ECCD CARE', onClick: () => navigate('/dashboard') }],
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <AppShell
      activeItem={activeItem}
      onSelectItem={handleNavigate}
      breadcrumbs={pageInfo.breadcrumbs}
      pageTitle={pageInfo.title}
      pageSubtitle={pageInfo.subtitle}
      pageActions={pageInfo.actions}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      user={user}
      onLogout={logout}
      roleLabel={roleLabel}
      checkPermission={checkPermission}
    >
      {!checkPermission(activeItem) ? (
        <UnauthorizedView
          attemptedModule={activeItem}
          user={user}
          roleLabel={roleLabel}
          onReturnToAllowed={() => navigate(ROLE_LANDING_ROUTE[user?.role] || '/dashboard')}
          onSwitchRole={(newRole) => {
            switchRole(newRole);
            navigate(ROLE_LANDING_ROUTE[newRole] || '/dashboard');
          }}
        />
      ) : (
        <ErrorBoundary key={location.pathname} onNavigate={handleNavigate}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverview onNavigate={handleNavigate} />} />
            <Route path="/children" element={<ChildManagementView onNavigate={handleNavigate} />} />
            <Route path="/mapping" element={<CommunityMappingView onNavigate={handleNavigate} />} />
            <Route path="/community-mapping" element={<Navigate to="/mapping" replace />} />
            <Route path="/households" element={<CommunityMappingView initialTab="households" onNavigate={handleNavigate} />} />
            <Route path="/enrollment" element={<EnrollmentView onNavigate={handleNavigate} />} />
            <Route path="/health-monitoring" element={<HealthMonitoringView onNavigate={handleNavigate} />} />
            <Route path="/development-assessment" element={<DevelopmentView onNavigate={handleNavigate} />} />
            <Route path="/eccd-checklist" element={<Navigate to="/development-assessment" replace />} />
            <Route path="/follow-ups" element={<FollowUpView onNavigate={handleNavigate} />} />
            <Route path="/community-network" element={<CommunityView initialTab="barangays" onNavigate={handleNavigate} />} />
            <Route path="/barangays" element={<Navigate to="/community-network" replace />} />
            <Route path="/daycare-centers" element={<Navigate to="/community-network" replace />} />
            <Route path="/workers" element={<Navigate to="/community-network" replace />} />
            <Route path="/reports" element={<ReportsView onNavigate={handleNavigate} />} />
            <Route
              path="/audit-logs"
              element={
                <AuditLogsView
                  user={user}
                  roleLabel={roleLabel}
                  onSwitchRole={(newRole) => {
                    switchRole(newRole);
                    navigate(ROLE_LANDING_ROUTE[newRole] || '/dashboard');
                  }}
                  onTriggerSessionExpiry={triggerSessionExpiry}
                />
              }
            />
            <Route path="/settings" element={<SettingsView onNavigate={handleNavigate} />} />
            <Route path="/resources" element={<ModulePlaceholder moduleId="resources" onNavigate={handleNavigate} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      )}
      {isExpired && (
        <SessionExpiryModal
          user={user}
          roleLabel={roleLabel}
          onUnlock={unlockSession}
          onSignOut={logout}
        />
      )}
    </AppShell>
  );
}

/**
 * Auth Router — shows login or app based on auth status.
 * react-patterns: container component handles logic routing.
 */
function AuthRouter() {
  const { status } = useAuth();

  switch (status) {
    case AUTH_STATUS.LOADING:
      return <AuthLoadingScreen />;

    case AUTH_STATUS.AUTHENTICATED:
    case AUTH_STATUS.EXPIRED:
      return <AuthenticatedApp />;

    case AUTH_STATUS.UNAUTHENTICATED:
    default:
      return <LoginPage />;
  }
}

/**
 * Root App Component
 * react-patterns: provider tree at root (Router → AuthProvider → ToastProvider).
 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
