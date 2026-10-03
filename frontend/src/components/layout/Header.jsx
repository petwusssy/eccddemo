import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  User,
  Shield,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { mockNotifications } from '../../data/mockData';
import { ROLE_LABELS } from '../../services/authService';

/**
 * ECCD CARE — Application Header
 *
 * Now receives `user`, `onLogout`, and `roleLabel` from AuthProvider
 * via AppShell props rather than the hardcoded `currentUser`.
 *
 * auth-implementation-patterns skill:
 *   - Logout button in profile dropdown triggers real session destroy
 *   - Display authenticated user's name, agency, designation from session
 *
 * ui-a11y skill:
 *   - aria-expanded on popover triggers
 *   - aria-label on all icon-only buttons
 *   - focus-visible rings on interactive elements
 */
export function Header({
  onToggleSidebar,
  onOpenGlobalSearch,
  searchQuery,
  onSearchChange,
  activeView,
  user,
  onLogout,
  roleLabel,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fallback if user prop is missing (shouldn't happen in auth flow)
  const displayUser = user || {
    name: 'ECCD User',
    avatarInitials: 'EU',
    lgu: 'LGU',
    agency: 'CSWDO',
    activeSchoolYear: 'SY 2026–2027',
    email: '',
    designation: '',
    assignedBarangays: '',
  };

  // Unread notifications count
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Handle outside clicks to close popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-location-badge">
          <MapPin size={13} style={{ color: 'var(--color-primary-700)' }} />
          <span>{displayUser.lgu}</span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ color: 'var(--color-accent-700)', fontWeight: 600 }}>{displayUser.activeSchoolYear}</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="header-search">
        <span className="header-search-icon">
          <Search size={15} />
        </span>
        <input
          type="search"
          className="input"
          placeholder="Search child, PhilSys ID, barangay..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search ECCD CARE records"
        />
        <span className="header-search-kbd">Ctrl K</span>
      </div>

      <div className="header-right">
        {/* Notifications Popover */}
        <div className="header-action-wrapper" ref={notifRef}>
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="header-badge-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="header-popover">
              <div className="popover-header">
                <div>
                  <h4>CSWDO Alerts</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {unreadCount} unread actionable notices
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                    onClick={markAllRead}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="popover-body">
                {notifications.map((notif) => {
                  const Icon =
                    notif.type === 'danger'
                      ? AlertOctagon
                      : notif.type === 'warning'
                      ? AlertTriangle
                      : notif.type === 'success'
                      ? CheckCircle2
                      : Shield;

                  const iconColor =
                    notif.type === 'danger'
                      ? 'var(--color-danger-primary)'
                      : notif.type === 'warning'
                      ? 'var(--color-warning-primary)'
                      : notif.type === 'success'
                      ? 'var(--color-success-primary)'
                      : 'var(--color-info-primary)';

                  return (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.unread ? 'is-unread' : ''}`}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
                        );
                      }}
                    >
                      <div className="notification-item-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: iconColor }}>
                        <Icon size={15} />
                      </div>
                      <div className="notification-item-text">
                        <div className="notification-item-title">{notif.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: '4px' }}>
                          {notif.description}
                        </div>
                        <div className="notification-item-time">{notif.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="header-action-wrapper" ref={profileRef}>
          <button
            type="button"
            className="user-profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="user-avatar">{displayUser.avatarInitials}</div>
            <div className="user-details">
              <span className="user-name">{displayUser.name}</span>
              <span className="user-role-badge">{roleLabel || ROLE_LABELS[displayUser.role] || 'ECCD User'}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-950)' }}>
                  {displayUser.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{displayUser.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-accent-700)', marginTop: '2px', fontWeight: 500 }}>
                  {displayUser.designation || displayUser.agency}
                </div>
              </div>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  alert(`Logged in as: ${displayUser.name}\nDesignation: ${displayUser.designation}\nAgency: ${displayUser.agency}\nStation: ${displayUser.lgu}`);
                }}
              >
                <User size={15} />
                <span>My CSWDO Profile</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  alert(`Barangay Assignments: ${displayUser.assignedBarangays}`);
                }}
              >
                <MapPin size={15} />
                <span>Barangay Jurisdiction</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  alert("ECCD System Configuration & User Access Management");
                }}
              >
                <Settings size={15} />
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  alert("Philippine ECCD Checklist Manual & CSWDO Protocols (2026 Edition)");
                }}
              >
                <HelpCircle size={15} />
                <span>ECCD Guidelines & Help</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                type="button"
                className="profile-dropdown-item is-danger"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) {
                    onLogout();
                  }
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
  );
}

export default Header;
