import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useToast } from './Toast';
import {
  getPendingSyncCount,
  syncPendingSurveysToBackend,
} from '../../services/offlineMappingStore';

/**
 * OfflineSyncBanner
 *
 * Prominent UI indicator for Community Mapping:
 * - Real-time Online / Offline status detection
 * - Live pending sync counter from IndexedDB
 * - Automatic background sync when network connection is restored
 * - Manual 'Sync Now' button pushing queued records via dynamic VITE_API_URL
 */
export function OfflineSyncBanner({ onSyncComplete }) {
  const { addToast } = useToast();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh pending count from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error checking pending count:', err);
    }
  }, []);

  // Perform sync
  const handleSyncNow = useCallback(async () => {
    if (!navigator.onLine) {
      addToast('Cannot sync while offline. Please connect to internet.', 'warning');
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    addToast('Pushing queued offline records to backend API...', 'info');

    try {
      const result = await syncPendingSurveysToBackend();
      await refreshPendingCount();

      if (result.synced > 0) {
        addToast(
          `Successfully synchronized ${result.synced} offline record(s) to database!`,
          'success'
        );
      } else if (result.failed > 0) {
        addToast(`Sync finished with ${result.failed} error(s). Please retry.`, 'error');
      } else {
        addToast('All records are already up to date.', 'info');
      }

      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Sync error:', err);
      addToast('Failed to sync records to backend: ' + (err.message || 'Network error'), 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [addToast, isSyncing, onSyncComplete, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      addToast('Internet connection restored! Checking pending records...', 'info');
      refreshPendingCount().then(() => {
        // Automatically sync queued records on network restore
        handleSyncNow();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Working offline. All new mapping data will save to IndexedDB.', 'warning');
      refreshPendingCount();
    };

    const handleStoreChange = () => {
      refreshPendingCount();
    };

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
  }, [addToast, handleSyncNow, refreshPendingCount]);

  return (
    <div
      className={`rounded-xl border p-4 mb-5 transition-all shadow-sm ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
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
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
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
                  : 'ONLINE — Connected to Backend'}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  !isOnline
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
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
                ? 'Walang internet connection. Ang mga bagong mapping, health, checklist, at enrollment records ay ligtas na naka-save sa iyong device (idb/IndexedDB).'
                : pendingCount > 0
                ? 'Mayroong naka-imbak na frontline offline records na handa nang i-sync pabalik sa backend API.'
                : 'All frontline records are fully synchronized with the centralized database.'}
            </p>
          </div>
        </div>

        {/* Right: Pending Counter & Sync Button */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
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

          <Button
            size="sm"
            variant={pendingCount > 0 && isOnline ? 'primary' : 'outline'}
            onClick={handleSyncNow}
            disabled={isSyncing || !isOnline || pendingCount === 0}
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OfflineSyncBanner;
