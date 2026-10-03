import React, { useState } from 'react';
import TopGovBanner from './TopGovBanner';
import Header from './Header';
import Sidebar from './Sidebar';
import { Breadcrumb } from '../ui/Tabs';

export function AppShell({
  children,
  activeItem,
  onSelectItem,
  breadcrumbs = [],
  pageTitle,
  pageSubtitle,
  pageActions,
  searchQuery,
  onSearchChange,
  user,
  onLogout,
  roleLabel,
  checkPermission,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-root">
      {/* 1. Official Philippine GovPH Masthead */}
      <TopGovBanner />

      {/* 2. Main Flex Layout */}
      <div className="app-container">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeItem={activeItem}
          onSelectItem={onSelectItem}
          checkPermission={checkPermission}
        />

        {/* Main Content Column */}
        <div className="app-main">
          {/* Top Header */}
          <Header
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            activeView={activeItem}
            user={user}
            onLogout={onLogout}
            roleLabel={roleLabel}
          />

          {/* Main Workspace */}
          <main className="main-content">
            {/* Breadcrumb Navigation */}
            {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

            {/* Contextual Page Header */}
            {(pageTitle || pageActions) && (
              <div className="page-header">
                <div className="page-header-row">
                  <div className="page-title-group">
                    <h1 className="page-title">{pageTitle}</h1>
                    {pageSubtitle && <p className="page-subtitle">{pageSubtitle}</p>}
                  </div>

                  {pageActions && <div className="page-actions">{pageActions}</div>}
                </div>
              </div>
            )}

            {/* Page Body */}
            {children}
          </main>

          {/* Government Standard Footer */}
          <footer className="app-footer">
            <div>
              <strong>ECCD CARE</strong> — Child Assessment, Registration & Early-support System
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                City Social Welfare & Development Office • Mandated under RA 10410 (Early Years Act of 2013)
              </div>
            </div>

            <div className="footer-trust-notes">
              <span>Data Privacy Act Compliant (RA 10173)</span>
              <span>•</span>
              <span>GovPH Design Standard</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
