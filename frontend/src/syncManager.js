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

/**
 * Main synchronization engine that pushes local changes and pulls latest server data.
 */
export async function syncWithServer() {
  if (!checkOnlineStatus()) {
    return { success: false, reason: 'offline' };
  }

  try {
    // 1. Push local changes
    const pushResult = await processSyncQueue();
    if (!pushResult.success) {
      return { success: false, reason: 'push_failed' };
    }

    // 2. Pull remote products
    const prodRes = await fetch(`${BACKEND_URL}/products`);
    if (prodRes.ok) {
      const serverProducts = await prodRes.json();
      for (const prod of serverProducts) {
        const localProd = await db.products.get(prod.id);
        if (!localProd || prod.updated_at > localProd.updated_at) {
          await db.products.put(prod);
        }
      }
    }

    // 3. Pull remote sales
    const salesRes = await fetch(`${BACKEND_URL}/sales`);
    if (salesRes.ok) {
      const serverSales = await salesRes.json();
      for (const sale of serverSales) {
        const localSale = await db.sales.get(sale.id);
        if (!localSale) {
          const { items, ...saleInfo } = sale;
          await db.sales.put(saleInfo);
          if (items && items.length) {
            for (const item of items) {
              await db.sale_items.put({
                id: item.id || 'sitem_' + Math.random().toString(36).substr(2, 9),
                sale_id: sale.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                cost_price: item.cost_price,
                selling_price: item.selling_price
              });
            }
          }
        }
      }
    }

    console.log('Synchronization complete!');
    return { success: true };
  } catch (err) {
    console.error('Error during full synchronization:', err);
    return { success: false, reason: 'network_error' };
  }
}
