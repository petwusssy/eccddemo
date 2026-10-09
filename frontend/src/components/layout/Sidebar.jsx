import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardCheck,
  HeartPulse,
  CheckSquare,
  CalendarClock,
  Building2,
  FileBarChart,
  FileClock,
  Settings,
  UserCog,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import anacLogo from '../../assets/anac-logo.png';

const navigationSections = [
  {
    title: 'MAIN',
    shortTitle: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'SYSTEM SETUP & NETWORK',
    shortTitle: 'SETUP',
    items: [
      { id: 'centers-workers', label: 'Centers & Workers', path: '/centers-workers', icon: School },
      { id: 'community-network', label: 'Community Network', path: '/community-network', icon: Building2 },
    ],
  },
  {
    title: 'REGISTRATION & MAPPING',
    shortTitle: 'REG',
    items: [
      { id: 'community-mapping', label: 'Community Mapping', path: '/mapping', icon: MapPin },
      { id: 'enrollment', label: 'Enrollment', path: '/enrollment', icon: ClipboardCheck },
      { id: 'children', label: 'Children Records', path: '/children', icon: Users },
    ],
  },
  {
    title: 'ASSESSMENT & MONITORING',
    shortTitle: 'EVAL',
    items: [
      { id: 'development-assessment', label: 'Development Assessment', path: '/development-assessment', icon: CheckSquare },
      { id: 'health-monitoring', label: 'Health Monitoring', path: '/health-monitoring', icon: HeartPulse },
      { id: 'follow-ups', label: 'Follow-ups', path: '/follow-ups', icon: CalendarClock },
    ],
  },
  {
    title: 'REPORTS & GOVERNANCE',
    shortTitle: 'REP',
    items: [
      { id: 'reports', label: 'Consolidated Reports', path: '/reports', icon: FileBarChart },
    ],
  },
  {
    title: 'SYSTEM',
    shortTitle: 'SYS',
    items: [
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeItem,
  onSelectItem,
  checkPermission,
}) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={onCloseMobile}
          style={{ zIndex: 'calc(var(--z-sidebar) - 1)' }}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        {/* Sidebar Brand Header with Burger Toggle */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <>
              <div className="sidebar-brand">
                <div className="sidebar-seal" title="ANÁC - City Social Welfare and Development Office">
                  <img src={anacLogo} alt="ANÁC Logo" className="sidebar-brand-logo" />
                </div>

                <div className="sidebar-title-group">
                  <span className="sidebar-title">ANÁC</span>
                </div>
              </div>

              <button
                type="button"
                className="sidebar-header-toggle"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Menu size={18} />
              </button>
            </>
          ) : (
            <Tooltip text="Expand sidebar" position="right">
              <button
                type="button"
                className="sidebar-header-toggle is-collapsed-toggle"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Menu size={20} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {navigationSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '0.75rem' }}>
              <div className="sidebar-section-title">
                {isCollapsed ? (section.shortTitle || section.title.slice(0, 3)) : section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isItemActive =
                  location.pathname === item.path ||
                  activeItem === item.id ||
                  (item.id === 'centers-workers' &&
                    ['/centers-workers', '/daycare-centers', '/workers'].includes(location.pathname)) ||
                  (item.id === 'community-network' &&
                    ['/community-network', '/barangays'].includes(location.pathname)) ||
                  ((item.id === 'community-mapping' || item.id === 'mapping') &&
                    ['/mapping', '/community-mapping', '/households'].includes(location.pathname)) ||
                  ((item.id === 'development-assessment' || item.id === 'eccd-checklist') &&
                    ['/development-assessment', '/eccd-checklist'].includes(location.pathname));

                const isAllowed = checkPermission
                  ? item.id === 'community-network'
                    ? checkPermission('community-network') || checkPermission('barangays')
                    : item.id === 'centers-workers'
                    ? checkPermission('centers-workers') ||
                      checkPermission('community-network') ||
                      checkPermission('daycare-centers') ||
                      checkPermission('workers')
                    : item.id === 'community-mapping' || item.id === 'mapping'
                    ? checkPermission('mapping') || checkPermission('community-mapping') || checkPermission('households')
                    : item.id === 'development-assessment' || item.id === 'eccd-checklist'
                    ? checkPermission('development-assessment') || checkPermission('eccd-checklist')
                    : checkPermission(item.id)
                  : true;

                const linkContent = (
                  <NavLink
                    to={item.path}
                    className={`sidebar-item ${isItemActive ? 'is-active' : ''} ${!isAllowed ? 'is-restricted' : ''}`}
                    onClick={() => {
                      if (onSelectItem) onSelectItem(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? (isAllowed ? item.label : `${item.label} (Access Restricted)`) : undefined}
                    style={!isAllowed ? { opacity: 0.65 } : undefined}
                  >
                    <span className="sidebar-item-icon">
                      <Icon size={18} />
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className="sidebar-item-text">{item.label}</span>
                        {!isAllowed && (
                          <Lock size={12} style={{ color: '#f59e0b', marginLeft: 'auto' }} />
                        )}
                        {isAllowed && item.badge && (
                          <span className={`sidebar-item-badge ${item.badgeUrgent ? 'badge-urgent' : ''}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                return isCollapsed ? (
                  <Tooltip key={item.id} text={isAllowed ? item.label : `${item.label} (Access Restricted)`} position="right">
                    {linkContent}
                  </Tooltip>
                ) : (
                  <React.Fragment key={item.id}>{linkContent}</React.Fragment>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>CSWDO Information System</span>
              <span>GovPH Standard • v1.0.0</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
