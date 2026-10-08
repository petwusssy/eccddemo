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
  Database,
  CheckCircle2,
  Activity,
  Server,
} from 'lucide-react';
import anacLogo from '../../assets/anac-logo.png';
import UserManagementView from '../views/UserManagementView';
import AdminRolesView from '../views/AdminRolesView';
import AuditLogsView from '../views/AuditLogsView';
import '../../styles/admin-console.css';

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
    <div className="admin-shell-container">
      {/* 1. Executive Masthead */}
      <header className="admin-masthead">
        <div className="admin-masthead-inner">
          {/* Left: Branding & Seal */}
          <div className="admin-brand" onClick={handleReturnToPortal} title="Click to view ECCD Child Portal">
            <div className="admin-logo-badge">
              <img src={anacLogo} alt="ANÁC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="admin-title-wrap">
              <div className="admin-title-row">
                <span className="admin-main-title">
                  CSFP SYSADMIN CONSOLE
                </span>
                <span className="admin-root-pill">
                  Root IT Authority
                </span>
              </div>
              <div className="admin-sub-title">
                City Information &amp; Communications Technology Office • CSFP MIS
              </div>
            </div>
          </div>

          {/* Center Status Indicators */}
          <div style={{ display: 'none', lg: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
              <span>Database Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block', boxShadow: '0 0 8px #38bdf8' }} />
              <span>CSFP Secure Tunnel</span>
            </div>
          </div>

          {/* Right: Actions & User Info */}
          <div className="admin-masthead-actions">
            {/* Return to ECCD Child Portal Button */}
            <button
              type="button"
              className="admin-return-btn"
              onClick={handleReturnToPortal}
              title="Switch to regular ECCD Child Daycare Portal"
            >
              <ArrowLeft size={15} />
              <span>Return to ECCD Portal</span>
            </button>

            {/* Admin Profile Pill */}
            <div className="admin-user-pill">
              <div className="admin-avatar">
                {user?.avatarInitials || (user?.role === 'sysadmin' ? 'SA' : 'ES')}
              </div>
              <div style={{ display: 'none', md: 'block' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                  {user?.name || (user?.role === 'sysadmin' ? 'CSFP MIS System Administrator' : 'Administrator')}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  {user?.email || (user?.role === 'sysadmin' ? 'sysadmin@csfp.gov.ph' : 'admin@eccd.gov.ph')}
                </div>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                className="admin-logout-btn"
                onClick={onLogout}
                title="Sign out of administrative session"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Admin Navigation Sub-bar */}
      <nav className="admin-subnav">
        <div className="admin-subnav-inner">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Accounts &amp; Staff Directory</span>
            <span className="admin-tab-badge">Active</span>
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'roles' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <KeyRound size={16} />
            <span>Role Permissions Matrix</span>
            <span className="admin-tab-badge">3 Roles</span>
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'audit-logs' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <FileClock size={16} />
            <span>Security Audit Trail</span>
            <span className="admin-tab-badge">Live</span>
          </button>
        </div>
      </nav>

      {/* 3. Main Admin Content Area */}
      <main className="admin-main-body">
        {activeTab === 'users' && <UserManagementView currentUser={user} onNavigate={navigate} />}
        {activeTab === 'roles' && <AdminRolesView />}
        {activeTab === 'audit-logs' && (
          <AuditLogsView
            user={user}
            roleLabel="ECCD Administrative"
            onSwitchRole={() => {}}
            onTriggerSessionExpiry={() => {}}
          />
        )}
      </main>
    </div>
  );
}
