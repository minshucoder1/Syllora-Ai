/**
 * Syllora AI — Client-Side IndexedDB Storage for Offline Study Mode
 * Isolated by authenticated user ID; tracks downloaded materials and pending offline progress
 */

const DB_NAME = 'syllora_offline_study_v1';
const DB_VERSION = 1;

export interface OfflineMaterialItem {
  id: string;
  userId: string;
  type: 'note' | 'question' | 'flashcard' | 'cheatsheet' | 'mocktest' | 'problem' | 'pdf';
  subjectId?: string;
  subjectName?: string;
  title: string;
  data: any;
  sizeBytes: number;
  savedAt: string;
}

export interface OfflineSyncItem {
  id: string;
  userId: string;
  operationType: 'quiz_attempt' | 'flashcard_learned' | 'note_read' | 'problem_saved';
  contentId: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount?: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;

      if (!db.objectStoreNames.contains('materials')) {
        const store = db.createObjectStore('materials', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('subjectName', 'subjectName', { unique: false });
      }

      if (!db.objectStoreNames.contains('pending_sync')) {
        const syncStore = db.createObjectStore('pending_sync', { keyPath: 'id' });
        syncStore.createIndex('userId', 'userId', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a study artifact for offline access
 */
export async function saveMaterialOffline(item: OfflineMaterialItem): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const req = store.put(item);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[IndexedDB] saveMaterialOffline error:', err);
    return false;
  }
}

/**
 * Retrieves all offline materials for the active user
 */
export async function getOfflineMaterials(
  userId: string,
  typeFilter?: string
): Promise<OfflineMaterialItem[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readonly');
      const store = tx.objectStore('materials');
      const userIndex = store.index('userId');
      const req = userIndex.getAll(userId);

      req.onsuccess = () => {
        let items: OfflineMaterialItem[] = req.result || [];
        if (typeFilter) {
          items = items.filter((i) => i.type === typeFilter);
        }
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[IndexedDB] getOfflineMaterials error:', err);
    return [];
  }
}

/**
 * Removes a single material from offline storage
 */
export async function removeOfflineMaterial(id: string): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

/**
 * Calculates current offline storage usage
 */
export async function getOfflineStorageUsage(userId: string): Promise<{
  totalItems: number;
  totalSizeBytes: number;
  formattedSize: string;
}> {
  try {
    const items = await getOfflineMaterials(userId);
    let totalSizeBytes = 0;
    items.forEach((i) => (totalSizeBytes += i.sizeBytes || 1024));

    let formattedSize = `${(totalSizeBytes / 1024).toFixed(1)} KB`;
    if (totalSizeBytes > 1024 * 1024) {
      formattedSize = `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return {
      totalItems: items.length,
      totalSizeBytes,
      formattedSize,
    };
  } catch {
    return { totalItems: 0, totalSizeBytes: 0, formattedSize: '0 KB' };
  }
}

/**
 * Clears all offline materials for an account upon logout
 */
export async function clearUserOfflineMaterials(userId: string): Promise<boolean> {
  try {
    const db = await openDb();
    const items = await getOfflineMaterials(userId);
    return new Promise((resolve) => {
      const tx = db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      items.forEach((i) => store.delete(i.id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Records offline exercise progress for subsequent sync
 */
export async function recordPendingSync(item: OfflineSyncItem): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_sync', 'readwrite');
      const store = tx.objectStore('pending_sync');
      const req = store.put(item);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

/**
 * Gets all pending sync records for a user
 */
export async function getPendingSyncRecords(userId: string): Promise<OfflineSyncItem[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_sync', 'readonly');
      const store = tx.objectStore('pending_sync');
      const userIndex = store.index('userId');
      const req = userIndex.getAll(userId);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Clears synced records after successful server flush
 */
export async function clearSyncedRecords(ids: string[]): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction('pending_sync', 'readwrite');
    const store = tx.objectStore('pending_sync');
    ids.forEach((id) => store.delete(id));
  } catch (err) {
    console.warn('[IndexedDB] clearSyncedRecords notice:', err);
  }
}
