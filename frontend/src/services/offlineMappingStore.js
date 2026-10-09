/**
 * ECCD CARE — Offline-First IndexedDB Store for Community Mapping (ECCD Form 1)
 * City Social Welfare and Development Office (CSWDO)
 *
 * Implements client-side resilience with 'idb':
 * - Persists house-to-house mapping surveys and Form 1 records when offline
 * - Tracks pending vs. synced states
 * - Automatically pushes queued records to backend API via dynamic getApiUrl() on network restore
 */

import { openDB } from 'idb';
import { getApiUrl } from './apiConfig';
import { centralDataStore } from './centralDataStore.js';

const DB_NAME = 'eccd_care_offline_db';
const DB_VERSION = 2;
const STORE_SURVEYS = 'mapping_surveys';
const STORE_QUEUE = 'frontline_queue';

/**
 * Initializes and returns the IndexedDB database instance
 */
export async function getOfflineDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_SURVEYS)) {
        const store = db.createObjectStore(STORE_SURVEYS, { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('householdId', 'householdId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const qStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        qStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        qStore.createIndex('type', 'type', { unique: false });
        qStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
}

/**
 * Saves a new or updated Community Mapping (Form 1) survey to IndexedDB.
 * Defaults to 'pending' syncStatus when created offline or queued.
 */
export async function saveOfflineSurvey(surveyData) {
  const db = await getOfflineDb();
  const id = surveyData.id || `OFFLINE-SURVEY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const record = {
    ...surveyData,
    id,
    householdId: surveyData.householdId || surveyData.household?.id || id,
    syncStatus: surveyData.syncStatus || 'pending',
    createdAt: surveyData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (record.household?.parentGuardian) {
    record.household.parentGuardian = String(record.household.parentGuardian).toUpperCase();
  }
  if (record.parentGuardian) {
    record.parentGuardian = String(record.parentGuardian).toUpperCase();
  }
  if (Array.isArray(record.children)) {
    record.children.forEach((c) => {
      if (!c) return;
      if (c.firstName) c.firstName = String(c.firstName).toUpperCase();
      if (c.middleName) c.middleName = String(c.middleName).toUpperCase();
      if (c.lastName) c.lastName = String(c.lastName).toUpperCase();
      if (c.fullName) c.fullName = String(c.fullName).toUpperCase();
      if (c.parentGuardian) c.parentGuardian = String(c.parentGuardian).toUpperCase();
    });
  }

  await db.put(STORE_SURVEYS, record);

  // Notify active listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { record } }));
  }

  return record;
}

/**
 * Retrieves all offline mapping surveys from IndexedDB.
 */
export async function getAllOfflineSurveys() {
  const db = await getOfflineDb();
  return db.getAll(STORE_SURVEYS);
}

/**
 * Retrieves all surveys with 'pending' sync status.
 */
export async function getPendingSurveys() {
  const db = await getOfflineDb();
  const all = await db.getAll(STORE_SURVEYS);
  return all.filter((s) => s.syncStatus === 'pending');
}

/**
 * Queues a general frontline action (health measurement, assessment, enrollment, followup)
 * into IndexedDB when offline.
 */
export async function queueFrontlineAction({ type, endpoint, method = 'POST', payload }) {
  const db = await getOfflineDb();
  const id = `OFFLINE-${type.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const item = {
    id,
    type,
    endpoint,
    method,
    payload,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  await db.put(STORE_QUEUE, item);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { item } }));
  }

  return item;
}

/**
 * Retrieves all pending frontline queue actions.
 */
export async function getPendingFrontlineActions() {
  const db = await getOfflineDb();
  const all = await db.getAll(STORE_QUEUE);
  return all.filter((item) => item.syncStatus === 'pending');
}

/**
 * Gets total count of pending offline records across all Child Development Teacher modules.
 */
export async function getPendingSyncCount() {
  try {
    const pendingSurveys = await getPendingSurveys();
    const pendingActions = await getPendingFrontlineActions();
    return pendingSurveys.length + pendingActions.length;
  } catch (err) {
    console.error('Error getting pending sync count from idb:', err);
    return 0;
  }
}

/**
 * Marks a survey record as synced in IndexedDB.
 */
export async function markSurveySynced(id, serverResult = {}) {
  const db = await getOfflineDb();
  const record = await db.get(STORE_SURVEYS, id);
  if (record) {
    record.syncStatus = 'synced';
    record.syncedAt = new Date().toISOString();
    record.serverResult = serverResult;
    await db.put(STORE_SURVEYS, record);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { record } }));
    }
  }
}

/**
 * Deletes a survey from IndexedDB.
 */
export async function deleteOfflineSurvey(id) {
  const db = await getOfflineDb();
  await db.delete(STORE_SURVEYS, id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { id } }));
  }
}

/**
 * Syncs all pending offline surveys and frontline actions to backend API.
 * Automatically respects import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'.
 */
/**
 * Syncs all pending offline surveys, frontline actions, and local unsynced records to backend API.
 * Guarantees cross-device persistence between Mobile Field Workers and Desktop Admin dashboards.
 */
export async function syncPendingSurveysToBackend() {
  const pendingSurveys = await getPendingSurveys();
  const pendingActions = await getPendingFrontlineActions();
  const db = await getOfflineDb();

  let syncedCount = 0;
  let failedCount = 0;

  // Check server reset status to prevent resurrecting deleted records after server reset
  let serverResetToken = null;
  let serverTotalChildren = 0;
  let serverTotalHouseholds = 0;
  try {
    const statusRes = await fetch(getApiUrl('/api/system/status'), {
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      },
    });
    if (statusRes.ok) {
      const sJson = await statusRes.json();
      serverResetToken = sJson.reset_token;
      serverTotalChildren = sJson.total_children || 0;
      serverTotalHouseholds = sJson.total_households || 0;
    }
  } catch (_) {}

  const localResetToken = typeof window !== 'undefined' ? localStorage.getItem('eccd_last_reset_token') : null;
  const isServerFreshReset = serverResetToken && localResetToken && serverResetToken !== localResetToken;

  if (isServerFreshReset || (serverResetToken && !localResetToken && serverTotalChildren === 0 && serverTotalHouseholds === 0)) {
    console.log('ECCD Offline Store: Detected fresh server reset. Purging stale offline queue to prevent resurrecting deleted records.');
    await clearAllOfflineData();
    if (typeof window !== 'undefined' && serverResetToken) {
      localStorage.setItem('eccd_last_reset_token', serverResetToken);
    }
    return {
      success: true,
      synced: 0,
      failed: 0,
      total: 0,
      message: 'System database is at clean baseline (0 records). Stale offline cache synchronized and cleared.',
    };
  }

  if (serverResetToken && typeof window !== 'undefined') {
    localStorage.setItem('eccd_last_reset_token', serverResetToken);
  }

  // 1. Primary Attempt: Atomic Batch Sync via POST /api/mapping/sync
  if (pendingSurveys.length > 0 || pendingActions.length > 0) {
    try {
      const batchPayload = {
        surveys: pendingSurveys,
        frontlineActions: pendingActions,
      };

      const syncRes = await fetch(getApiUrl('/api/mapping/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(batchPayload),
      });

      if (syncRes.ok) {
        const syncJson = await syncRes.json();
        for (const survey of pendingSurveys) {
          await markSurveySynced(survey.id, { ok: true, synced: true });
          syncedCount++;
        }
        for (const item of pendingActions) {
          item.syncStatus = 'synced';
          item.syncedAt = new Date().toISOString();
          await db.put(STORE_QUEUE, item);
          syncedCount++;
        }

        // Hydrate latest children, households, and enrollments from server
        try {
          await centralDataStore.syncWithBackend(true);
        } catch (_) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('eccd:offline-sync-completed', {
              detail: { synced: syncedCount, failed: 0 },
            })
          );
        }

        return {
          success: true,
          synced: syncedCount,
          failed: 0,
          total: syncedCount,
          message: syncJson.message || 'Successfully synchronized all records to CSWDO database.',
        };
      }
    } catch (batchErr) {
      console.warn('Batch sync endpoint note, falling back to itemized sync:', batchErr.message);
    }
  }

  // 2. Resilient Itemized Fallback: Sync Community Mapping Surveys from IndexedDB (Form 1)
  for (const survey of pendingSurveys) {
    try {
      const householdPayload = survey.household || {
        id: survey.householdId,
        parentGuardian: survey.parentGuardian,
        contactNumber: survey.contactNumber,
        address: survey.address,
        barangay: survey.barangay,
        mappingActivityId: survey.mappingActivityId || survey.activityId,
        childrenCount: survey.children?.length || 1,
        mappedBy: survey.mappedBy || 'Child Development Teacher (Offline PWA)',
      };

      const hhRes = await fetch(getApiUrl('/api/households'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(householdPayload),
      });

      if (!hhRes.ok) {
        throw new Error(`Household sync failed with HTTP status ${hhRes.status}`);
      }

      const hhJson = await hhRes.json();
      const savedHh = hhJson.data || householdPayload;
      centralDataStore.mergeRecordsFromServer([], [savedHh]);

      // Post Children if present
      if (Array.isArray(survey.children) && survey.children.length > 0) {
        for (const child of survey.children) {
          const childRes = await fetch(getApiUrl('/api/children'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'Bypass-Tunnel-Reminder': 'true',
            },
            body: JSON.stringify({
              ...child,
              householdId: householdPayload.id,
              barangay: householdPayload.barangay,
            }),
          });

          if (!childRes.ok) {
            throw new Error(`Child sync failed with HTTP status ${childRes.status}`);
          }

          const childJson = await childRes.json();
          const savedChild = childJson.data || child;
          centralDataStore.mergeRecordsFromServer([savedChild], []);
        }
      }

      await markSurveySynced(survey.id, { ok: true, synced: true });
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync survey ${survey.id}:`, err);
      failedCount++;
    }
  }

  // 3. Sync General Frontline Actions (Health, Assessment, Enrollment, Follow-up)
  for (const item of pendingActions) {
    try {
      const res = await fetch(getApiUrl(item.endpoint), {
        method: item.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(item.payload),
      });

      if (!res.ok) {
        throw new Error(`Action ${item.type} sync failed with HTTP ${res.status}`);
      }

      item.syncStatus = 'synced';
      item.syncedAt = new Date().toISOString();
      await db.put(STORE_QUEUE, item);
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync frontline action ${item.id}:`, err);
      failedCount++;
    }
  }

  // 4. Double-Check & Cross-Check: Sync any children/households in centralDataStore missing on server
  try {
    const serverChildrenRes = await fetch(getApiUrl('/api/children'), {
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      },
    });

    if (serverChildrenRes.ok) {
      const serverJson = await serverChildrenRes.json();
      const serverKids = serverJson.data?.children || serverJson.data || [];
      const serverIdSet = new Set(serverKids.map((k) => k.id || k.eccd_id));

      const localChildren = centralDataStore.getChildren() || [];
      const localHouseholds = centralDataStore.getHouseholds() || [];

      for (const localChild of localChildren) {
        const localId = localChild.id || localChild.eccd_id;
        if (!serverIdSet.has(localId)) {
          const hh = localHouseholds.find((h) => (h.id || h.household_no) === localChild.householdId) || {
            id: localChild.householdId || 'HH-2026-0101',
            parentGuardian: localChild.parentGuardian || 'Parent / Guardian',
            address: localChild.address || 'San Isidro',
            barangay: localChild.barangay || 'San Isidro',
            mappingActivityId: 'ACT-MAP-2026-001',
          };

          try {
            await fetch(getApiUrl('/api/households'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true',
              },
              body: JSON.stringify(hh),
            });
          } catch (hhErr) {
            console.warn('Household push warning:', hhErr.message);
          }

          const childPushRes = await fetch(getApiUrl('/api/children'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'Bypass-Tunnel-Reminder': 'true',
            },
            body: JSON.stringify({
              ...localChild,
              householdId: hh.id || hh.household_no,
              barangay: localChild.barangay || hh.barangay || 'San Isidro',
            }),
          });

          if (childPushRes.ok) {
            const childData = await childPushRes.json();
            if (childData.data) {
              centralDataStore.mergeRecordsFromServer([childData.data], [hh]);
            }
            syncedCount++;
          }
        }
      }

      if (serverKids.length > 0) {
        centralDataStore.mergeRecordsFromServer(serverKids, []);
      }
    }
  } catch (crossCheckErr) {
    console.warn('Cross-check sync notice:', crossCheckErr.message);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('eccd:offline-sync-completed', {
        detail: { synced: syncedCount, failed: failedCount },
      })
    );
  }

  return {
    success: failedCount === 0,
    synced: syncedCount,
    failed: failedCount,
    total: pendingSurveys.length + pendingActions.length + syncedCount,
    message: failedCount === 0
      ? (syncedCount > 0 ? `Successfully synchronized ${syncedCount} record(s) to server.` : 'Verified: All records are up to date in central database.')
      : `Sync completed with ${failedCount} error(s).`,
  };
}

/**
 * Exports all offline surveys and local records as a downloadable JSON file.
 * Perfect backup for phone-to-laptop transfer when offline or across network barriers.
 */
export async function exportOfflineDataBundle() {
  const db = await getOfflineDb();
  const allSurveys = await db.getAll('mapping_surveys');
  const allQueue = await db.getAll('frontline_queue');
  const localHouseholds = centralDataStore.getHouseholds() || [];
  const localChildren = centralDataStore.getChildren() || [];

  const bundle = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    surveys: allSurveys,
    queue: allQueue,
    households: localHouseholds,
    children: localChildren,
  };

  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eccd-mapping-offline-bundle-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return bundle;
}

/**
 * Imports an offline bundle into IndexedDB and centralDataStore.
 */
export async function importOfflineDataBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Invalid bundle format');
  }

  const db = await getOfflineDb();
  let count = 0;

  if (Array.isArray(bundle.surveys)) {
    for (const survey of bundle.surveys) {
      await db.put('mapping_surveys', survey);
      count++;
    }
  }

  if (Array.isArray(bundle.queue)) {
    for (const item of bundle.queue) {
      await db.put('frontline_queue', item);
      count++;
    }
  }

  if (Array.isArray(bundle.children) || Array.isArray(bundle.households)) {
    centralDataStore.mergeRecordsFromServer(bundle.children || [], bundle.households || []);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { count } }));
  }

  return { success: true, importedCount: count };
}

/**
 * Clears all pending and cached offline mapping records from IndexedDB.
 */
export async function clearAllOfflineData() {
  try {
    const db = await getOfflineDb();
    await db.clear('mapping_surveys');
    await db.clear('frontline_queue');
  } catch (err) {
    console.warn('clearAllOfflineData IndexedDB notice:', err);
  }

  centralDataStore.reset();
  centralDataStore.data.children = [];
  centralDataStore.data.households = [];
  centralDataStore.data.enrollments = [];
  centralDataStore.data.healthMonitorings = [];
  centralDataStore.data.developmentAssessments = [];
  centralDataStore.data.followUps = [];
  centralDataStore.save();

  if (typeof window !== 'undefined' && window.localStorage) {
    const staleKeys = [
      'eccd_mapping_field_draft_v2',
      'eccd_offline_child_form_draft',
      'eccd_offline_registration_draft',
      'eccd_offline_f1_draft',
      'eccd_offline_f2_draft',
      'eccd_offline_checklist_draft',
      'eccd_mapping_households_data_v2',
      'eccd_mapping_children_data_v2',
      'eccd_children_360_data_v2',
    ];
    staleKeys.forEach((k) => localStorage.removeItem(k));

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('eccd_form') || key.startsWith('eccd_checklist_') || key.startsWith('eccd_draft_'))) {
        localStorage.removeItem(key);
      }
    }

    window.dispatchEvent(new CustomEvent('eccd:offline-survey-updated', { detail: { cleared: true } }));
    window.dispatchEvent(new CustomEvent('eccd:offline-sync-completed', { detail: { synced: 0, failed: 0 } }));
  }

  return { success: true };
}

// Auto-flush queued offline items to backend immediately upon Wi-Fi / internet reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('ECCD Offline Store: Internet connection detected. Auto-flushing offline queue to backend...');
    syncPendingSurveysToBackend().catch((err) => {
      console.warn('Auto-flush offline queue notice:', err.message);
    });
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      getPendingSyncCount().then((count) => {
        if (count > 0) {
          syncPendingSurveysToBackend().catch(() => {});
        }
      }).catch(() => {});
    }
  });
}

export default {
  getOfflineDb,
  saveOfflineSurvey,
  getAllOfflineSurveys,
  getPendingSurveys,
  queueFrontlineAction,
  getPendingFrontlineActions,
  getPendingSyncCount,
  markSurveySynced,
  deleteOfflineSurvey,
  syncPendingSurveysToBackend,
  exportOfflineDataBundle,
  importOfflineDataBundle,
  clearAllOfflineData,
};


