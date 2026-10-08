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
  isUsingLocalhostOnRemote,
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
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
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

  const isRemoteLocalhost = isUsingLocalhostOnRemote();

  return (
    <>
      <div
        className={`rounded-xl border p-4 mb-5 transition-all shadow-sm ${
          !isOnline
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-100'
            : pendingCount > 0
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Status Icon and Label */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                !isOnline
                  ? 'bg-amber-500/25 text-amber-700 dark:text-amber-300'
                  : pendingCount > 0
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
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
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {!isOnline
                    ? 'OFFLINE MODE (IndexedDB Active)'
                    : pendingCount > 0
                    ? 'ONLINE — Pending Queue Detected'
                    : 'ONLINE — Connected to CSWDO Server'}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    !isOnline
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 font-bold'
                      : pendingCount > 0
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  }`}
                >
                  {!isOnline ? 'Offline' : 'Connected'}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
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
          <div className="flex items-center flex-wrap gap-2 self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-medium">
              <span>Pending Sync:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-xs ${
                  pendingCount > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                }`}
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
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
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
              className="p-1.5 text-xs rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
              title="Backend Server Configuration"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Server</span>
            </button>
          </div>
        </div>

        {/* Remote Host Warning */}
        {isRemoteLocalhost && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
            <span>
              📱 <strong>Notice:</strong> Running on mobile/remote host while API URL is <code>127.0.0.1:8000</code>. To push data directly into your laptop's Laravel database, set your laptop IP or tunnel URL.
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline shrink-0 hover:text-amber-950 dark:hover:text-amber-100"
            >
              Configure Server URL &rarr;
            </button>
          </div>
        )}
      </div>

      {/* SERVER CONFIGURATION MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Backend Server Settings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect your phone browser to your laptop's Laravel database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Base URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrlInput}
                    onChange={(e) => setApiUrlInput(e.target.value)}
                    placeholder="http://192.168.1.XX:8000 or https://xxx.ngrok-free.app"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingUrl}
                    className="shrink-0"
                  >
                    {isTestingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: <code>http://127.0.0.1:8000</code>. On phone via Wi-Fi, use your laptop's Wi-Fi IP (e.g. <code>http://192.168.1.15:8000</code>) or ngrok HTTPS tunnel.
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
                  No Wi-Fi or tunnel? Download all offline records as a JSON bundle from your phone, and import it on your laptop web page.
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
                  setApiUrlInput('http://127.0.0.1:8000');
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
