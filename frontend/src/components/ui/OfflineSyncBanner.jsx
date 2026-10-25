import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Settings,
  Download,
  Upload,
  Server,
  Check,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './Toast';
import {
  getPendingSyncCount,
  syncPendingSurveysToBackend,
  exportOfflineDataBundle,
  importOfflineDataBundle,
  clearAllOfflineData,
} from '../../services/offlineMappingStore';
import {
  getApiBaseUrl,
  setCustomApiUrl,
  clearCustomApiUrl,
} from '../../services/apiConfig';
import { centralDataStore } from '../../services/centralDataStore';

/**
 * OfflineSyncBanner
 *
 * Prominent UI indicator for Community Mapping & Frontline Field Workers:
 * - Real-time Online / Offline status detection (never disappears when offline)
 * - Live pending sync counter from IndexedDB
 * - Automatic background sync when network connection is restored
 * - Sync Now button is ALWAYS clickable when online for force-sync / double-check
 * - Server Settings modal to configure laptop IP / tunnel URL on mobile devices
 * - Export / Import offline bundle fallback for physical/file data sync
 */
export function OfflineSyncBanner({ onSyncComplete }) {
  const { addToast } = useToast();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);

  // Server Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }

  const fileInputRef = useRef(null);

  // Refresh pending count from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error checking pending count:', err);
    }
  }, []);

  // Perform sync (isManual = true when user clicks 'Sync Now')
  const handleSyncNow = useCallback(async (isManual = true) => {
    if (!navigator.onLine) {
      if (isManual) {
        addToast('Cannot sync while offline. Please connect to Wi-Fi or cellular network.', 'warning');
      }
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    if (isManual) {
      addToast('Synchronizing records with CSWDO backend server...', 'info');
    }

    try {
      const result = await syncPendingSurveysToBackend();
      // Pull latest server records for multi-device sync
      await centralDataStore.syncWithBackend(true).catch(() => {});
      await refreshPendingCount();
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      if (isManual) {
        if (result.synced > 0) {
          addToast(
            `Successfully synchronized ${result.synced} offline record(s) to central database!`,
            'success'
          );
        } else if (result.failed > 0) {
          addToast(`Sync finished with ${result.failed} error(s). Please retry.`, 'error');
        } else {
          addToast('Double-Check Complete: All records are verified and in sync with backend database.', 'success');
        }
      }

      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Sync error:', err);
      if (isManual) {
        addToast('Failed to sync records to backend: ' + (err.message || 'Network error'), 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [addToast, isSyncing, onSyncComplete, refreshPendingCount]);

  const handleSyncRef = useRef(handleSyncNow);
  handleSyncRef.current = handleSyncNow;

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount().then((count) => {
        // Automatically sync queued records silently only when pending records exist
        if (count && count > 0) {
          handleSyncRef.current(false);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    const handleStoreChange = () => {
      refreshPendingCount();
    };

    const handleApiUrlChange = () => {
      setApiUrlInput(getApiBaseUrl());
      setTestResult(null);
    };

    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('eccd:offline-survey-updated', handleStoreChange);
    window.addEventListener('eccd:offline-sync-completed', handleStoreChange);
    window.addEventListener('eccd:api-url-changed', handleApiUrlChange);
    window.addEventListener('eccd:open-server-settings', handleOpenSettings);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('eccd:offline-survey-updated', handleStoreChange);
      window.removeEventListener('eccd:offline-sync-completed', handleStoreChange);
      window.removeEventListener('eccd:api-url-changed', handleApiUrlChange);
      window.removeEventListener('eccd:open-server-settings', handleOpenSettings);
    };
  }, [refreshPendingCount]);

  // Handle Export Bundle
  const handleExport = async () => {
    try {
      await exportOfflineDataBundle();
      addToast('Downloaded offline bundle (.json) successfully!', 'success');
    } catch (err) {
      addToast('Failed to export offline bundle: ' + err.message, 'error');
    }
  };

  // Handle Import Bundle
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await importOfflineDataBundle(parsed);
      addToast(`Imported ${res.importedCount} record(s) from bundle!`, 'success');
      await refreshPendingCount();
      if (navigator.onLine) {
        await handleSyncNow();
      }
    } catch (err) {
      addToast('Failed to import file: ' + err.message, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Test Server URL
  const handleTestConnection = async () => {
    if (!apiUrlInput || !apiUrlInput.trim()) {
      setTestResult({ ok: false, message: 'Please enter a valid URL' });
      return;
    }

    setIsTestingUrl(true);
    setTestResult(null);

    const testUrl = apiUrlInput.trim().replace(/\/+$/, '') + '/api/dashboard/summary';
    try {
      const res = await fetch(testUrl, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        setTestResult({ ok: true, message: 'Connected to backend server successfully!' });
      } else {
        setTestResult({ ok: false, message: `Server responded with HTTP ${res.status}` });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: 'Could not connect: ' + (err.message || 'Network unreachable'),
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleSaveApiUrl = () => {
    if (!apiUrlInput || !apiUrlInput.trim()) {
      clearCustomApiUrl();
      addToast('Reset backend URL to default', 'info');
    } else {
      setCustomApiUrl(apiUrlInput);
      addToast('Updated backend server URL!', 'success');
    }
    setIsSettingsOpen(false);
    if (navigator.onLine) {
      handleSyncNow();
    }
  };

  const handleClearAllLocalData = async () => {
    if (window.confirm('Delete all offline cached records and reset local store on this device?')) {
      try {
        await clearAllOfflineData();
        await refreshPendingCount();
        addToast('All offline records and local data cleared on this device.', 'success');
        setIsSettingsOpen(false);
      } catch (e) {
        addToast('Failed to clear local data: ' + e.message, 'error');
      }
    }
  };


  return (
    <>
      <div
        style={{
          borderRadius: '12px',
          border: !isOnline
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : pendingCount > 0
            ? '1px solid rgba(59, 130, 246, 0.3)'
            : '1px solid rgba(16, 185, 129, 0.25)',
          padding: '14px 18px',
          marginBottom: '20px',
          backgroundColor: !isOnline
            ? 'rgba(245, 158, 11, 0.1)'
            : pendingCount > 0
            ? 'rgba(59, 130, 246, 0.08)'
            : 'rgba(16, 185, 129, 0.08)',
          color: 'var(--text-primary, #0f172a)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left: Status Icon and Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: !isOnline
                  ? 'rgba(245, 158, 11, 0.25)'
                  : pendingCount > 0
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
                color: !isOnline ? '#b45309' : pendingCount > 0 ? '#2563eb' : '#059669',
              }}
            >
              {!isOnline ? (
                <WifiOff className="w-5 h-5 animate-pulse" />
              ) : pendingCount > 0 ? (
                <Database className="w-5 h-5" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {!isOnline
                    ? 'OFFLINE MODE (IndexedDB Active)'
                    : pendingCount > 0
                    ? 'ONLINE — Pending Queue Detected'
                    : 'ONLINE — Connected to CSWDO Server'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: !isOnline
                      ? '#fde68a'
                      : pendingCount > 0
                      ? '#dbeafe'
                      : '#d1fae5',
                    color: !isOnline
                      ? '#78350f'
                      : pendingCount > 0
                      ? '#1e40af'
                      : '#065f46',
                  }}
                >
                  {!isOnline ? 'Offline' : 'Connected'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: '2px 0 0 0' }}>
                {!isOnline
                  ? 'Walang internet connection. Ang mga bagong mapping, health, at enrollment records ay ligtas na naka-save sa iyong device (IndexedDB).'
                  : pendingCount > 0
                  ? `Mayroong ${pendingCount} frontline record(s) na naka-imbak. Handa nang i-sync pabalik sa backend database.`
                  : lastSyncedTime
                  ? `All frontline records are fully synchronized with the centralized database. (Last verified: ${lastSyncedTime})`
                  : 'All frontline records are fully synchronized with the centralized database.'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem', fontWeight: 500 }}>
              <span>Pending Sync:</span>
              <span
                style={{
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: pendingCount > 0 ? '#f59e0b' : 'rgba(16, 185, 129, 0.2)',
                  color: pendingCount > 0 ? '#ffffff' : '#059669',
                }}
              >
                {pendingCount}
              </span>
            </div>

            {/* SYNC BUTTON — Always clickable when online */}
            <Button
              size="sm"
              variant={pendingCount > 0 && isOnline ? 'primary' : 'outline'}
              onClick={() => handleSyncNow(true)}
              disabled={isSyncing || !isOnline}
              title={!isOnline ? 'Connect to Wi-Fi to sync records' : 'Sync pending records or double-check server synchronization'}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing
                ? 'Syncing...'
                : !isOnline
                ? 'Offline (Wi-Fi Needed)'
                : pendingCount > 0
                ? `Sync Now (${pendingCount})`
                : 'Sync (Double-Check)'}
            </Button>

            {/* Server Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'transparent',
                cursor: 'pointer',
              }}
              title="Backend Server Configuration"
            >
              <Server size={14} />
              <span>Server</span>
            </button>
          </div>
        </div>


      </div>

      {/* SERVER CONFIGURATION MODAL */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              color: 'var(--text-primary, #0f172a)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                    Backend Server Settings
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                    Configure connection to Render Cloud Backend
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0', fontSize: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                  API Base URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={apiUrlInput}
                    onChange={(e) => setApiUrlInput(e.target.value)}
                    placeholder="https://eccd-backend-cpal.onrender.com"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      background: 'var(--bg-canvas, #ffffff)',
                      color: 'inherit',
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingUrl}
                    style={{ shrink: 0 }}
                  >
                    {isTestingUrl ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                  Connected to Render Cloud Backend: <code>https://eccd-backend-cpal.onrender.com</code>
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {testResult.ok ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Data Bundle Export/Import Backup */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Offline File Sync (Fail-safe Backup)
                </h4>
                <p className="text-[11px] text-slate-500 mb-2">
                  No internet connection? Download all offline records as a JSON bundle to sync later.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    className="flex items-center gap-1.5 flex-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export (.json)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 flex-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import (.json)
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Wipe Local Device Records */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-rose-600 dark:text-rose-400">
                      Clear Device Records
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Wipes local IndexedDB and cache on this device for a fresh test.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllLocalData}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearCustomApiUrl();
                  setApiUrlInput('https://eccd-backend-cpal.onrender.com');
                  setTestResult(null);
                }}
              >
                Reset Default
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveApiUrl}>
                Save & Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OfflineSyncBanner;
