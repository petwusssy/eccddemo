import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { mockNotifications } from '../../data/mockData';
import { ROLE_LABELS } from '../../services/authService';
import anacLogo from '../../assets/anac-logo.png';
import {
  getPendingSyncCount,
  syncPendingSurveysToBackend,
} from '../../services/offlineMappingStore';
import { checkBackendHealth, isBackendConnected } from '../../services/apiConfig';

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
  isOffline: initialIsOffline,
}) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendOk, setBackendOk] = useState(isBackendConnected());

  useEffect(() => {
    const updateStatus = async () => {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
      try {
        const count = await getPendingSyncCount();
        setPendingCount(count);
      } catch (_) {}

      checkBackendHealth().then((ok) => setBackendOk(ok)).catch(() => setBackendOk(false));
    };

    updateStatus();

    const handleOnline = () => { setIsOnline(true); updateStatus(); };
    const handleOffline = () => { setIsOnline(false); updateStatus(); };
    const handleStore = () => { updateStatus(); };
    const handleBackendStatus = (e) => {
      if (e.detail?.connected !== undefined) {
        setBackendOk(e.detail.connected);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('eccd:offline-survey-updated', handleStore);
    window.addEventListener('eccd:offline-sync-completed', handleStore);
    window.addEventListener('eccd:backend-status', handleBackendStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('eccd:offline-survey-updated', handleStore);
      window.removeEventListener('eccd:offline-sync-completed', handleStore);
      window.removeEventListener('eccd:backend-status', handleBackendStatus);
    };
  }, []);

  const handleHeaderSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingSurveysToBackend();
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch (e) {
      console.warn('Header sync notice:', e);
    } finally {
      setIsSyncing(false);
    }
  };

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

        <div className="header-brand-mini" title="ANÁC CSWDO System">
          <img src={anacLogo} alt="ANÁC Logo" className="header-mini-logo" />
          <span className="header-mini-title">ANÁC</span>
        </div>

        <div className="header-location-badge">
          <MapPin size={13} style={{ color: 'var(--color-primary-700)' }} />
          <span>{displayUser.lgu}</span>
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
        {/* Network & Offline Status Indicator */}
        <div className="header-action-wrapper">
          {!isOnline ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
              }}
              title="Walang internet connection. Naka-save ang bagong data sa device (IndexedDB)."
            >
              <WifiOff size={13} className="animate-pulse" style={{ color: '#d97706' }} />
              <span>Offline Mode</span>
            </span>
          ) : pendingCount > 0 ? (
            <button
              type="button"
              onClick={handleHeaderSync}
              disabled={isSyncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                cursor: 'pointer',
              }}
              title="Click to sync pending records to backend server"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>Sync ({pendingCount})</span>
            </button>
          ) : !backendOk ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('eccd:open-server-settings'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#fff1f2',
                color: '#be123c',
                border: '1px solid #fecdd3',
                cursor: 'pointer',
              }}
              title="CSWDO backend is offline or tunnel disconnected. Click to open Server Settings."
            >
              <AlertTriangle size={12} style={{ color: '#e11d48' }} />
              <span>Backend Offline</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('eccd:open-server-settings'))}
              disabled={isSyncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                cursor: 'pointer',
              }}
              title="Connected to live CSWDO backend. Click to view Server Settings."
            >
              <Wifi size={12} style={{ color: '#059669' }} />
              <span>Live Cloud Sync</span>
            </button>
          )}

          {/* Admin Console Switcher (Visible ONLY to Administrators) */}
          {(displayUser.role === 'eccd_admin' || displayUser.role === 'cswdo_admin' || displayUser.role === 'admin') && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 11px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 5px rgba(49, 46, 129, 0.3)',
                cursor: 'pointer',
              }}
              title="Open Dedicated CSWDO Admin Console (/admin)"
            >
              <Shield size={12} style={{ color: '#fbbf24' }} />
              <span>Admin Console</span>
            </button>
          )}
        </div>

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
                  window.dispatchEvent(new CustomEvent('eccd:open-server-settings'));
                }}
              >
                <Wifi size={15} />
                <span>Backend Server Connection</span>
              </button>

              {(displayUser.role === 'eccd_admin' || displayUser.role === 'cswdo_admin' || displayUser.role === 'admin') && (
                <button
                  type="button"
                  className="profile-dropdown-item"
                  style={{ color: '#4338ca', fontWeight: 600 }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/admin');
                  }}
                >
                  <Shield size={15} style={{ color: '#4338ca' }} />
                  <span>Open Admin Console (/admin)</span>
                </button>
              )}

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
