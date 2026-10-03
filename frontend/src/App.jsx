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

import React, { useState, useEffect } from 'react';
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
import { ROLE_LANDING } from './services/authService';
import auditService from './services/auditService';

import ModulePlaceholder from './components/views/ModulePlaceholder';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { Button } from './components/ui/Button';
import { Printer, Loader2 } from 'lucide-react';

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
    getLandingPage,
    checkPermission,
    logout,
    roleLabel,
    switchRole,
    triggerSessionExpiry,
    unlockSession,
    isExpired,
  } = useAuth();
  const [activeItem, setActiveItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Set initial page to role-based landing on first render
  useEffect(() => {
    if (!hasInitialized && user) {
      setActiveItem(getLandingPage());
      setHasInitialized(true);
    }
  }, [user, getLandingPage, hasInitialized]);

  // Navigation handler with role-based permission enforcement & audit logging
  const handleSelectItem = (itemId) => {
    setActiveItem(itemId);
    if (!checkPermission(itemId)) {
      auditService.logActivity({
        user: user?.name || 'Authorized Staff',
        role: roleLabel || user?.role,
        action: 'Attempted Access to Restricted Section',
        module: 'System Governance',
        record: `/${itemId}`,
        status: 'Unauthorized Attempt',
        details: `${roleLabel} role lacks permission for ${itemId}.`,
      });
    }
  };

  // Determine page titles and breadcrumbs based on navigation item
  const getPageInfo = () => {
    switch (activeItem) {
      case 'dashboard':
        return {
          title: 'CSWDO ECCD Monitoring Dashboard',
          subtitle: 'Centralized registry for children aged 0–4 • City Social Welfare & Development Office',
          breadcrumbs: [
            { label: 'ECCD CARE', onClick: () => handleSelectItem('dashboard') },
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
            { label: 'Child Management', onClick: () => handleSelectItem('children') },
            { label: 'Children Masterlist' },
          ],
        };

      case 'households':
        return {
          title: 'Households & Families Profiling',
          subtitle: 'Community profiling, 4Ps beneficiary tagging, and household mapping',
          breadcrumbs: [
            { label: 'Child Management' },
            { label: 'Households' },
          ],
        };

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
        return {
          title: 'Barangays',
          subtitle: 'Jurisdictional masterlist of barangays and community focal points',
          breadcrumbs: [
            { label: 'Community' },
            { label: 'Barangays' },
          ],
        };

      case 'daycare-centers':
        return {
          title: 'Day Care Centers',
          subtitle: 'Accredited public Day Care Centers and early childhood learning facilities',
          breadcrumbs: [
            { label: 'Community' },
            { label: 'Day Care Centers' },
          ],
        };

      case 'workers':
        return {
          title: 'Day Care Workers & Service Providers',
          subtitle: 'Accredited daycare teachers and CSWDO community case officers',
          breadcrumbs: [
            { label: 'Community' },
            { label: 'Workers' },
          ],
        };

      case 'community-network':
        return {
          title: 'Community Network',
          subtitle: 'ECCD Barangay coverage (Form 3), accredited Day Care Centers (Form 7), and Workers (Form 6)',
          breadcrumbs: [
            { label: 'Community', onClick: () => handleSelectItem('community-network') },
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
          breadcrumbs: [{ label: 'ECCD CARE' }],
        };
    }
  };

  if (!activeItem) return null; // Wait for role-based landing page to initialize

  const pageInfo = getPageInfo();

  return (
    <AppShell
      activeItem={activeItem}
      onSelectItem={handleSelectItem}
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
          onReturnToAllowed={() => setActiveItem(getLandingPage())}
          onSwitchRole={(newRole) => {
            switchRole(newRole);
            setActiveItem(ROLE_LANDING[newRole] || 'dashboard');
          }}
        />
      ) : (
        <ErrorBoundary key={activeItem} onNavigate={handleSelectItem}>
          {activeItem === 'dashboard' && <DashboardOverview onNavigate={handleSelectItem} />}
          {(activeItem === 'community-mapping' || activeItem === 'households') && (
            <CommunityMappingView
              initialTab={activeItem === 'households' ? 'households' : undefined}
              onNavigate={handleSelectItem}
            />
          )}
          {activeItem === 'children' && <ChildManagementView onNavigate={handleSelectItem} />}
          {activeItem === 'enrollment' && <EnrollmentView onNavigate={handleSelectItem} />}
          {activeItem === 'health-monitoring' && <HealthMonitoringView onNavigate={handleSelectItem} />}
          {activeItem === 'eccd-checklist' && <DevelopmentView onNavigate={handleSelectItem} />}
          {activeItem === 'follow-ups' && <FollowUpView onNavigate={handleSelectItem} />}
          {(activeItem === 'barangays' || activeItem === 'daycare-centers' || activeItem === 'workers' || activeItem === 'community-network') && (
            <CommunityView initialTab={activeItem === 'community-network' ? 'barangays' : activeItem} onNavigate={handleSelectItem} />
          )}
          {activeItem === 'reports' && <ReportsView onNavigate={handleSelectItem} />}
          {activeItem === 'audit-logs' && (
            <AuditLogsView
              user={user}
              roleLabel={roleLabel}
              onSwitchRole={(newRole) => {
                switchRole(newRole);
                setActiveItem(ROLE_LANDING[newRole] || 'dashboard');
              }}
              onTriggerSessionExpiry={triggerSessionExpiry}
            />
          )}
          {activeItem === 'settings' && <SettingsView onNavigate={handleSelectItem} />}
          {activeItem !== 'dashboard' &&
            activeItem !== 'community-mapping' &&
            activeItem !== 'households' &&
            activeItem !== 'children' &&
            activeItem !== 'enrollment' &&
            activeItem !== 'health-monitoring' &&
            activeItem !== 'eccd-checklist' &&
            activeItem !== 'follow-ups' &&
            activeItem !== 'barangays' &&
            activeItem !== 'daycare-centers' &&
            activeItem !== 'workers' &&
            activeItem !== 'community-network' &&
            activeItem !== 'reports' &&
            activeItem !== 'audit-logs' &&
            activeItem !== 'settings' && (
              <ModulePlaceholder moduleId={activeItem} onNavigate={handleSelectItem} />
            )}
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
 * react-patterns: provider tree at root (AuthProvider → ToastProvider → Router).
 */
export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
