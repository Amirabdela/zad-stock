import { db } from './db';

const BACKEND_URL = 'http://localhost:5000/api';

/**
 * Checks if the system is currently online.
 * @returns {boolean}
 */
export function checkOnlineStatus() {
  return navigator.onLine;
}

/**
 * Processes all pending synchronization items in the IndexedDB syncQueue.
 * Pushes local additions, updates, deletions and sales to the Express server.
 */
export async function processSyncQueue() {
  if (!checkOnlineStatus()) {
    console.log('Offline: Sync queue processing deferred.');
    return { success: false, reason: 'offline' };
  }

  // Load all items in the queue order (chronological by primary key autoincrement)
  const queueItems = await db.syncQueue.toArray();
  if (queueItems.length === 0) {
    return { success: true, processedCount: 0 };
  }

  console.log(`Online: Processing ${queueItems.length} items from sync queue...`);
  let processedCount = 0;

  for (const item of queueItems) {
    try {
      let response;
      const { action, payload, id } = item;

      switch (action) {
        case 'CREATE_PRODUCT':
          response = await fetch(`${BACKEND_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          break;

        case 'UPDATE_PRODUCT':
          response = await fetch(`${BACKEND_URL}/products/${payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          break;

        case 'DELETE_PRODUCT':
          response = await fetch(`${BACKEND_URL}/products/${payload.id}`, {
            method: 'DELETE'
          });
          break;

        case 'CREATE_SALE':
          response = await fetch(`${BACKEND_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          break;

        default:
          console.warn(`Unknown sync action: ${action}`);
          // Remove unknown action to prevent blockages
          await db.syncQueue.delete(id);
          continue;
      }

      if (response && (response.ok || response.status === 409 || response.status === 400 || response.status === 404)) {
        // If success or a client error (e.g. product already exists or already deleted),
        // we can remove it from the queue as it cannot be processed further.
        await db.syncQueue.delete(id);
        processedCount++;
      } else {
        // Server error or network block, halt queue processing to maintain order
        console.error(`Temporary server error for action ${action}. Halting sync.`);
        break;
      }
    } catch (err) {
      console.error('Network error during sync queue processing. Halting sync:', err);
      break;
    }
  }

  return { success: true, processedCount };
}
