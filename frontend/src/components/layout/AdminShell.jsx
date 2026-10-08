import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  KeyRound,
  FileClock,
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  Server,
  ChevronDown,
  Menu,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Lock,
  Layers,
  Settings,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import anacLogo from '../../assets/anac-logo.png';
import UserManagementView from '../views/UserManagementView';
import AdminRolesView from '../views/AdminRolesView';
import AuditLogsView from '../views/AuditLogsView';
import AdminSystemHealthView from '../views/AdminSystemHealthView';
import Tooltip from '../ui/Tooltip';
import { isBackendConnected } from '../../services/apiConfig';
import '../../styles/admin-console.css';

/**
 * AdminShell — Executive CSFP Administration Console Layout
 *
 * Implements the EXACT SAME layout structure as the main web app system
 * (AppContainer -> Collapsible Sidebar + AppMain -> AppHeader + MainContent)
 * with a distinct, commanding "CSFP SYSADMIN / ROOT IT AUTHORITY" visual identity.
 *
 * Designed for:
 * - CSFP MIS System Administrator (sysadmin@csfp.gov.ph)
 * - ECCD Administrative officers (admin@eccd.gov.ph)
 */
export default function AdminShell({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles' | 'audit-logs' | 'system-health'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dbConnected, setDbConnected] = useState(isBackendConnected());

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReturnToPortal = () => {
    navigate('/dashboard');
  };

  const navItems = [
    {
      id: 'users',
      label: 'User Directory & Staff',
      icon: Users,
      badge: 'Accounts',
    },
    {
      id: 'roles',
      label: 'Role Permissions Matrix',
      icon: KeyRound,
      badge: '3 Roles',
    },
    {
      id: 'audit-logs',
      label: 'Security Audit Trail',
      icon: FileClock,
      badge: 'Live',
    },
    {
      id: 'system-health',
      label: 'Infrastructure Diagnostics',
      icon: Activity,
      badge: 'Online',
    },
  ];

  const getPageInfo = () => {
    switch (activeTab) {
      case 'users':
        return { title: 'User Accounts & Staff Directory' };
      case 'roles':
        return { title: 'Role Permissions Matrix' };
      case 'audit-logs':
        return { title: 'Security Audit Trail' };
      case 'system-health':
        return { title: 'Server Infrastructure & Diagnostics' };
      default:
        return { title: 'CSFP System Administration Console' };
    }
  };

  const pageInfo = getPageInfo();

  const displayRoleLabel = 'CSFP System Administrator';
  const roleBadgeText = 'SYSADMIN ROOT';
  const avatarInitials = 'SA';
  const adminName = 'CSFP MIS System Administrator';
  const adminEmail = 'sysadmin@csfp.gov.ph';

  return (
    <div className="app-root admin-shell-root">
      <div className="app-container">
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            className="drawer-backdrop"
            onClick={() => setIsMobileOpen(false)}
            style={{ zIndex: 'calc(var(--z-sidebar) - 1)' }}
            aria-hidden="true"
          />
        )}

        {/* 1. Left SysAdmin Sidebar (Matches app-sidebar structure) */}
        <aside
          className={`app-sidebar admin-custom-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
            isMobileOpen ? 'is-mobile-open' : ''
          }`}
          aria-label="System Administration Sidebar"
        >
          {/* Sidebar Brand Header */}
          <div className="sidebar-header">
            <div className="sidebar-brand" onClick={handleReturnToPortal} style={{ cursor: 'pointer' }} title="Click to open ECCD Child Portal">
              <div className="sidebar-seal" title="City Information and Communications Technology">
                <img src={anacLogo} alt="ANÁC Seal" className="sidebar-brand-logo" />
              </div>

              {!isCollapsed && (
                <div className="sidebar-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="sidebar-title">ANÁC</span>
                    <span className="sysadmin-chip-badge">SYSADMIN</span>
                  </div>
                  <span className="sidebar-subtitle" style={{ color: '#fca5a5' }}>
                    CSFP MIS Root Console
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="sidebar-nav">
            {/* Section: System Administration */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="sidebar-section-title">
                {isCollapsed ? 'SYS' : 'SYSTEM ADMINISTRATION'}
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                const linkContent = (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-item admin-sidebar-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-item-icon">
                      <Icon size={18} />
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className="sidebar-item-text">{item.label}</span>
                        {item.badge && (
                          <span className="sidebar-item-badge admin-item-badge">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );

                return isCollapsed ? (
                  <Tooltip key={item.id} text={item.label} position="right">
                    {linkContent}
                  </Tooltip>
                ) : (
                  <React.Fragment key={item.id}>{linkContent}</React.Fragment>
                );
              })}
            </div>

            {/* Section: ECCD Application Bridge */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="sidebar-section-title">
                {isCollapsed ? 'PORT' : 'ECCD PORTAL BRIDGES'}
              </div>

              {/* Return to ECCD Child Portal Link */}
              <button
                type="button"
                className="sidebar-item admin-bridge-item"
                onClick={handleReturnToPortal}
                title={isCollapsed ? 'Return to ECCD Child Portal' : undefined}
              >
                <span className="sidebar-item-icon">
                  <ArrowLeft size={18} />
                </span>
                {!isCollapsed && (
                  <>
                    <span className="sidebar-item-text">Return to ECCD Portal</span>
                    <span className="sidebar-item-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                      Dashboard
                    </span>
                  </>
                )}
              </button>

              {/* Direct Link to Children */}
              <button
                type="button"
                className="sidebar-item"
                onClick={() => navigate('/children')}
                title={isCollapsed ? 'Child Profiles & Masterlist' : undefined}
                style={{ opacity: 0.85 }}
              >
                <span className="sidebar-item-icon">
                  <ExternalLink size={16} />
                </span>
                {!isCollapsed && (
                  <span className="sidebar-item-text" style={{ fontSize: '12.5px' }}>
                    Child Masterlist
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Sidebar Footer with Collapse Toggle */}
          <div className="sidebar-footer">
            {!isCollapsed && (
              <div className="sidebar-footer-text">
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>CSFP MIS Directorate</span>
                <span style={{ color: '#cbd5e1' }}>Root IT Authority • v2.6.0</span>
              </div>
            )}

            <button
              type="button"
              className="sidebar-footer-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </aside>

        {/* 2. Main Work Area (Matches app-main structure) */}
        <div className="app-main">
          {/* Top SysAdmin Header */}
          <header className="app-header admin-app-header">
            <div className="header-left">
              {/* Mobile menu toggle */}
              <button
                type="button"
                className="header-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>

              {/* Mini Brand for mobile screens */}
              <div className="header-brand-mini" title="CSFP MIS System Administration">
                <img src={anacLogo} alt="ANÁC Logo" className="header-mini-logo" />
                <span className="header-mini-title">SYSADMIN</span>
              </div>

              {/* Breadcrumb / Context Navigator */}
              <div className="admin-header-breadcrumbs">
                <span className="admin-crumb-parent">CSFP MIS</span>
                <span className="admin-crumb-separator">/</span>
                <span className="admin-crumb-parent">System Administration</span>
                <span className="admin-crumb-separator">/</span>
                <span className="admin-crumb-active">
                  {activeTab === 'users'
                    ? 'User Directory'
                    : activeTab === 'roles'
                    ? 'Role Matrix'
                    : activeTab === 'audit-logs'
                    ? 'Audit Trail'
                    : 'Infrastructure'}
                </span>
              </div>
            </div>

            {/* Header Right: Badges, Indicators, and Profile */}
            <div className="header-right">
              {/* Executive SysAdmin Authority Badge */}
              <div className="sysadmin-authority-badge" title="CSFP MIS Central Root Authority Active">
                <Shield size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span>CSFP SYSADMIN CONSOLE</span>
                <span className="sysadmin-pulse-dot" />
              </div>

              {/* Live Database Indicator */}
              <div className="sysadmin-status-pill" title="Connected to MySQL / MariaDB Relational Database">
                <Database size={13} style={{ color: '#22c55e' }} />
                <span>MySQL Live</span>
              </div>

              {/* Return to ECCD Portal Quick Button */}
              <button
                type="button"
                className="sysadmin-return-portal-btn"
                onClick={handleReturnToPortal}
                title="Switch back to ECCD Daycare Child Portal (/dashboard)"
              >
                <ArrowLeft size={14} />
                <span>Return to ECCD Portal</span>
              </button>

              {/* SysAdmin User Profile Dropdown */}
              <div className="header-action-wrapper" ref={profileRef}>
                <button
                  type="button"
                  className="user-profile-trigger admin-profile-trigger"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  aria-label="SysAdmin profile menu"
                  aria-expanded={showProfileMenu}
                >
                  <div className="user-avatar admin-avatar-circle">
                    {avatarInitials}
                  </div>
                  <div className="user-details">
                    <span className="user-name">
                      {adminName}
                    </span>
                    <span className="user-role-badge sysadmin-role-badge">
                      {roleBadgeText}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Profile Popover Menu */}
                {showProfileMenu && (
                  <div className="profile-dropdown admin-profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-950)' }}>
                        {adminName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {adminEmail}
                      </div>
                      <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '3px', fontWeight: 600 }}>
                        City Information &amp; Communications Technology Office
                      </div>
                    </div>

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('users');
                      }}
                    >
                      <Users size={15} />
                      <span>User Accounts Directory</span>
                    </button>

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('system-health');
                      }}
                    >
                      <Activity size={15} />
                      <span>Server Diagnostics &amp; Health</span>
                    </button>

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleReturnToPortal();
                      }}
                      style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}
                    >
                      <ArrowLeft size={15} />
                      <span>Return to ECCD Child Portal</span>
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                    <button
                      type="button"
                      className="profile-dropdown-item is-danger"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onLogout) onLogout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 3. Main Content Workspace */}
          <main className="main-content admin-main-workspace">
            {/* Contextual Page Header */}
            <div className="page-header admin-page-header">
              <div className="page-header-row">
                <div className="page-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 className="page-title">{pageInfo.title}</h1>
                    <span className="admin-root-pill">CSFP MIS</span>
                  </div>
                </div>

                <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleReturnToPortal}
                    style={{ fontWeight: 600 }}
                  >
                    <ArrowLeft size={14} style={{ marginRight: '6px' }} />
                    Back to Daycare Portal
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sub-View Body */}
            <div className="admin-view-container">
              {activeTab === 'users' && (
                <UserManagementView currentUser={user} onNavigate={navigate} />
              )}
              {activeTab === 'roles' && <AdminRolesView />}
              {activeTab === 'audit-logs' && (
                <AuditLogsView
                  user={user}
                  roleLabel={displayRoleLabel}
                  onSwitchRole={() => {}}
                  onTriggerSessionExpiry={() => {}}
                />
              )}
              {activeTab === 'system-health' && <AdminSystemHealthView />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
