import React from 'react';
import {
  LayoutDashboard,
  Users,
  Home,
  MapPin,
  ClipboardCheck,
  HeartPulse,
  CheckSquare,
  CalendarClock,
  Building2,
  School,
  UserCheck,
  FileBarChart,
  FileClock,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export const navigationSections = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CHILD MANAGEMENT',
    items: [
      { id: 'children', label: 'Children', icon: Users },
      { id: 'community-mapping', label: 'Community Mapping', icon: MapPin },
      { id: 'enrollment', label: 'Enrollment', icon: ClipboardCheck },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { id: 'health-monitoring', label: 'Health Monitoring', icon: HeartPulse },
      { id: 'eccd-checklist', label: 'Development Assessment', icon: CheckSquare },
      { id: 'follow-ups', label: 'Follow-ups', icon: CalendarClock },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { id: 'community-network', label: 'Community Network', icon: Building2 },
    ],
  },
  {
    title: 'REPORTS',
    items: [{ id: 'reports', label: 'Reports', icon: FileBarChart }],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'audit-logs', label: 'Audit Logs', icon: FileClock },
      { id: 'settings', label: 'Settings', icon: Settings },
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
            <div className="sidebar-seal" title="City Social Welfare and Development Office">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>

            {!isCollapsed && (
              <div className="sidebar-title-group">
                <span className="sidebar-title">ECCD CARE</span>
                <span className="sidebar-subtitle">CSWDO System</span>
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
                const isActive =
                  activeItem === item.id ||
                  (item.id === 'community-mapping' && activeItem === 'households') ||
                  (item.id === 'community-network' &&
                    ['barangays', 'daycare-centers', 'workers', 'community-network'].includes(activeItem));
                const isAllowed = checkPermission
                  ? item.id === 'community-network'
                    ? checkPermission('community-network') ||
                      checkPermission('barangays') ||
                      checkPermission('daycare-centers') ||
                      checkPermission('workers')
                    : checkPermission(item.id)
                  : true;

                const buttonContent = (
                  <button
                    type="button"
                    className={`sidebar-item ${isActive ? 'is-active' : ''} ${!isAllowed ? 'is-restricted' : ''}`}
                    onClick={() => {
                      onSelectItem(item.id);
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
                  </button>
                );

                return isCollapsed ? (
                  <Tooltip key={item.id} text={isAllowed ? item.label : `${item.label} (Access Restricted)`} position="right">
                    {buttonContent}
                  </Tooltip>
                ) : (
                  <React.Fragment key={item.id}>{buttonContent}</React.Fragment>
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
