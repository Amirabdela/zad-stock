import Dexie from 'dexie';

// Initialize the IndexedDB database
export const db = new Dexie('ZADStockDB');

// Define database schema
// Note: We only index fields we intend to query/filter by.
db.version(1).stores({
  products: 'id, name, category, updated_at',
  sales: 'id, timestamp, updated_at',
  sale_items: 'id, sale_id, product_id',
  syncQueue: '++id, action, timestamp'
});

/**
 * Helper to queue an action for background synchronization when online.
 * @param {string} action - Action type e.g., 'SAVE_PRODUCT', 'DELETE_PRODUCT', 'SAVE_SALE'
 * @param {object} payload - The data associated with the action
 */
export async function queueSyncAction(action, payload) {
  await db.syncQueue.add({
    action,
    payload,
    timestamp: Date.now()
  });
}
