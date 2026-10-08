import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  KeyRound,
  FileClock,
  ArrowLeft,
  LogOut,
  Building2,
  Lock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import anacLogo from '../../assets/anac-logo.png';
import UserManagementView from '../views/UserManagementView';
import AdminRolesView from '../views/AdminRolesView';
import AuditLogsView from '../views/AuditLogsView';

/**
 * AdminShell — Dedicated Administration Console Layout
 * Accessible exclusively by Administrators at /admin
 */
export default function AdminShell({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles' | 'audit-logs'

  const handleReturnToPortal = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* 1. Admin Console Masthead */}
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0 var(--space-6)',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Branding & Seal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={handleReturnToPortal}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                }}
              >
                <img src={anacLogo} alt="ANÁC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em', color: '#ffffff' }}>
                    ANÁC ADMIN CONSOLE
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Root Admin
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  CSWDO • City Social Welfare & Development Office
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Return to ECCD Child Portal Button */}
            <button
              type="button"
              onClick={handleReturnToPortal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              title="Switch back to standard ECCD Daycare Child Portal"
            >
              <ArrowLeft size={15} />
              <span>Return to ECCD Portal</span>
            </button>

            {/* Admin Profile pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingLeft: 'var(--space-3)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {user?.avatarInitials || 'AD'}
              </div>
              <div style={{ display: 'none', md: 'block' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{user?.name || 'Administrator'}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{user?.email || 'admin@eccd.gov.ph'}</div>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  padding: '6px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Sign out of administrative session"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Admin Navigation Sub-bar */}
      <nav
        style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '0 var(--space-6)',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: activeTab === 'users' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'users' ? '#38bdf8' : '#94a3b8',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'users' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>User &amp; Staff Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: activeTab === 'roles' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'roles' ? '#38bdf8' : '#94a3b8',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'roles' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <KeyRound size={16} />
            <span>Role Permissions Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit-logs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: activeTab === 'audit-logs' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'audit-logs' ? '#38bdf8' : '#94a3b8',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'audit-logs' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileClock size={16} />
            <span>Security Audit Trail</span>
          </button>
        </div>
      </nav>

      {/* 3. Main Admin Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-6)',
        }}
      >
        {activeTab === 'users' && <UserManagementView currentUser={user} onNavigate={navigate} />}
        {activeTab === 'roles' && <AdminRolesView />}
        {activeTab === 'audit-logs' && (
          <AuditLogsView user={user} roleLabel="ECCD Administrative" onSwitchRole={() => {}} onTriggerSessionExpiry={() => {}} />
        )}
      </main>
    </div>
  );
}
