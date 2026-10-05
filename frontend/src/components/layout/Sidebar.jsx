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
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import anacLogo from '../../assets/anac-logo.png';

const navigationSections = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CHILD MANAGEMENT',
    items: [
      { id: 'children', label: 'Children', path: '/children', icon: Users },
      { id: 'community-mapping', label: 'Community Mapping', path: '/mapping', icon: MapPin },
      { id: 'enrollment', label: 'Enrollment', path: '/enrollment', icon: ClipboardCheck },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { id: 'health-monitoring', label: 'Health Monitoring', path: '/health-monitoring', icon: HeartPulse },
      { id: 'eccd-checklist', label: 'Development Assessment', path: '/development-assessment', icon: CheckSquare },
      { id: 'follow-ups', label: 'Follow-ups', path: '/follow-ups', icon: CalendarClock },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { id: 'community-network', label: 'Community Network', path: '/community-network', icon: Building2 },
    ],
  },
  {
    title: 'REPORTS',
    items: [{ id: 'reports', label: 'Reports', path: '/reports', icon: FileBarChart }],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: FileClock },
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
        {/* Sidebar Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-seal" title="ANÁC - City Social Welfare and Development Office">
              <img src={anacLogo} alt="ANÁC Logo" className="sidebar-brand-logo" />
            </div>

            {!isCollapsed && (
              <div className="sidebar-title-group">
                <span className="sidebar-title">ANÁC</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {navigationSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '0.75rem' }}>
              <div className="sidebar-section-title">
                {isCollapsed ? section.title.slice(0, 3) : section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isItemActive =
                  location.pathname === item.path ||
                  activeItem === item.id ||
                  (item.id === 'community-mapping' && (location.pathname === '/mapping' || location.pathname === '/community-mapping' || location.pathname === '/households')) ||
                  (item.id === 'eccd-checklist' && (location.pathname === '/development-assessment' || location.pathname === '/eccd-checklist')) ||
                  (item.id === 'community-network' &&
                    ['/community-network', '/barangays', '/daycare-centers', '/workers'].includes(location.pathname));

                const isAllowed = checkPermission
                  ? item.id === 'community-network'
                    ? checkPermission('community-network') ||
                      checkPermission('barangays') ||
                      checkPermission('daycare-centers') ||
                      checkPermission('workers')
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

        {/* Sidebar Footer with Collapse Toggle */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-footer-text">
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>CSWDO Information System</span>
              <span>GovPH Standard • v1.0.0</span>
            </div>
          )}

          <button
            type="button"
            className="sidebar-footer-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
