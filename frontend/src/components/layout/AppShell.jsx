import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { OfflineSyncBanner } from '../ui/OfflineSyncBanner';
import { getPendingSyncCount } from '../../services/offlineMappingStore';

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
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [hasPendingRecords, setHasPendingRecords] = useState(false);

  // Frontline role detection
  const isCDT = user?.role === 'cdt' || user?.role === 'daycare_worker' || user?.role === 'field_worker';

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof navigator !== 'undefined') {
        setIsOffline(!navigator.onLine);
      }
      try {
        const count = await getPendingSyncCount();
        setHasPendingRecords(count > 0);
      } catch (_) {}
    };

    checkStatus();

    const handleOnline = () => { setIsOffline(false); checkStatus(); };
    const handleOffline = () => { setIsOffline(true); checkStatus(); };
    const handleStoreChange = () => { checkStatus(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('eccd:offline-survey-updated', handleStoreChange);
    window.addEventListener('eccd:offline-sync-completed', handleStoreChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('eccd:offline-survey-updated', handleStoreChange);
      window.removeEventListener('eccd:offline-sync-completed', handleStoreChange);
    };
  }, []);

  // Show banner whenever: device is offline, has pending records, or in frontline/mapping workflows
  const showOfflineBanner = isOffline || hasPendingRecords || isCDT || ['mapping', 'community-mapping', 'households'].includes(activeItem);

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
            isOffline={isOffline}
            pendingCount={hasPendingRecords ? 1 : 0}
          />

          {/* Main Workspace */}
          <main className="main-content">
            {/* Frontline Offline Sync Indicator */}
            {showOfflineBanner && <OfflineSyncBanner />}

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
