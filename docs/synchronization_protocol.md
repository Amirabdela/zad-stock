# ZAD Stock - Offline Synchronization Protocol

ZAD Stock operates under an **Offline-First / Local-First** paradigm. This document explains the synchronization flow, IndexedDB queue design, and data conflict resolution protocols.

---

## 1. Local Database Architecture (Dexie.js)

The client uses IndexedDB, wrapped by Dexie.js, as its primary operational database. 

* All user actions (CRUD on inventory, sales transactions checkouts) write **immediately and synchronously** to IndexedDB.
* The application is fully functional offline; it queries IndexedDB tables directly for UI metrics, catalogs, and history.

---

## 2. Sync Queue Design

Every mutation made locally is queued in the `syncQueue` table:

```json
{
  "id": 12,
  "action": "CREATE_PRODUCT",
  "payload": { ... },
  "timestamp": 1771485600000
}
```

### Mutex Execution (Order Preservation)
- Mutex locks are not required because Dexie guarantees queue records are stored with auto-incrementing integer IDs.
- During processing, the client reads the queue in ascending ID order (chronological execution).
- If any request fails due to temporary server issues or a connection drop, **queue processing is immediately halted**. This guarantees that a "Delete Product" action does not get executed before a failed "Create Product" action.

---

## 3. Sync Sequence (Push & Pull)

When the browser detects it is online (triggered by the window `online` event or a 30-second interval check), it launches the `syncWithServer()` routine:

### Phase 1: Push Local Changes
1. Fetch all items from `syncQueue`.
2. For each action:
   - Call REST API (`POST /products`, `PUT /products/:id`, `DELETE /products/:id`, `POST /sales`).
   - If response is `OK` (or client error `400` / `404` / `409` showing conflict already handled), delete this item from the local queue.
   - If response fails (500 server error or network timeout), break out of loop immediately (keeping the remaining queue items).

### Phase 2: Pull Latest Server Data
1. Fetch remote products:
   - For each remote product, if it does not exist locally OR its remote `updated_at` timestamp > local `updated_at` timestamp, update local IndexedDB.
2. Fetch remote sales:
   - For each remote sale, if it does not exist locally, add it and its corresponding sale items to local IndexedDB.

---

## 4. Conflict Resolution Strategy

- **Products**: Last-Write-Wins (LWW). Conflict resolution relies on comparing the `updated_at` milliseconds timestamp. The database version containing the highest timestamp overrides the older version.
- **Sales**: Append-Only. Sales transactions are immutable, meaning they cannot be modified. They are simply merged in IndexedDB, resolving conflicts by adding missing IDs.
