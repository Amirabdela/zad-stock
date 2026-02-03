-- ZAD Stock SQLite Database Schema

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    total_amount REAL NOT NULL,
    total_cost REAL NOT NULL,
    total_profit REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
);
