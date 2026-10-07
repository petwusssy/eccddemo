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
const DB_VERSION = 1;
const STORE_SURVEYS = 'mapping_surveys';

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
 * Gets count of pending offline records waiting for sync.
 */
export async function getPendingSyncCount() {
  try {
    const pending = await getPendingSurveys();
    return pending.length;
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
 * Syncs all pending offline surveys to backend API using dynamic URL.
 * Automatically respects import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'.
 */
export async function syncPendingSurveysToBackend() {
  const pending = await getPendingSurveys();
  if (pending.length === 0) {
    return { success: true, synced: 0, failed: 0, total: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const survey of pending) {
    try {
      // 1. Post Household to Backend API
      const householdPayload = survey.household || {
        id: survey.householdId,
        parentGuardian: survey.parentGuardian,
        contactNumber: survey.contactNumber,
        address: survey.address,
        barangay: survey.barangay,
        mappingActivityId: survey.mappingActivityId || survey.activityId,
        childrenCount: survey.children?.length || 1,
        mappedBy: survey.mappedBy || 'Field Worker (Offline PWA)',
      };

      const hhRes = await fetch(getApiUrl('/api/households'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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

      // 2. Post Children if present
      if (Array.isArray(survey.children) && survey.children.length > 0) {
        for (const child of survey.children) {
          const childRes = await fetch(getApiUrl('/api/children'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
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

      // Mark this survey as synced in IndexedDB
      await markSurveySynced(survey.id, { ok: true, synced: true });
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync survey ${survey.id}:`, err);
      failedCount++;
    }
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
    total: pending.length,
  };
}

export default {
  getOfflineDb,
  saveOfflineSurvey,
  getAllOfflineSurveys,
  getPendingSurveys,
  getPendingSyncCount,
  markSurveySynced,
  deleteOfflineSurvey,
  syncPendingSurveysToBackend,
};
