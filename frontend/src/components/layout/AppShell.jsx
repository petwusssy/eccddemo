import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { OfflineSyncBanner } from '../ui/OfflineSyncBanner';

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

  // Dedicated Frontline Offline capabilities exclusively for Child Development Teachers (CDTs)
  const isCDT = user?.role === 'cdt' || user?.role === 'daycare_worker' || user?.role === 'field_worker';

  return (
    <div className="app-root">
      {/* Main Flex Layout */}
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
            {/* Dedicated Frontline Offline Sync Indicator exclusively for Child Development Teachers */}
            {isCDT && <OfflineSyncBanner />}

            {/* Contextual Page Header */}
            {(pageTitle || pageActions) && (
              <div className="page-header">
                <div className="page-header-row">
                  {pageTitle && (
                    <div className="page-title-group">
                      <h1 className="page-title">{pageTitle}</h1>
                    </div>
                  )}

                  {pageActions && <div className="page-actions">{pageActions}</div>}
                </div>
              </div>
            )}

            {/* Page Body */}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
