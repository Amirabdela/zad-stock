# ZAD Stock - Database & API Specification

This document details the database schema and REST API specifications for the ZAD Stock Management System.

---

## 1. Database Schema (SQLite)

The system uses SQLite (stored in `/database/zad_stock.db`) to persist products and sales data.

### `products` Table
Stores details of the inventory items.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Unique product identifier (`prod_*` or UUID) |
| `name` | TEXT | Product name |
| `category` | TEXT | Product category classification |
| `cost_price` | REAL | Cost price per unit (COGS) |
| `selling_price` | REAL | Selling price per unit to customers |
| `quantity` | INTEGER | Current stock count |
| `updated_at` | INTEGER | Timestamp in milliseconds of last change |

### `sales` Table
Stores high-level transaction records.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Transaction identifier (`sale_*` or UUID) |
| `total_amount` | REAL | Total sales checkout value |
| `total_cost` | REAL | Total cost value of checkout items |
| `total_profit` | REAL | Net profit calculated (`amount - cost`) |
| `timestamp` | INTEGER | Checkout timestamp in milliseconds |
| `updated_at` | INTEGER | Timestamp in milliseconds of last sync/change |

### `sale_items` Table
Stores individual line items for transactions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Line item identifier |
| `sale_id` | TEXT (FK) | Reference to `sales(id)` (CASCADE ON DELETE) |
| `product_id` | TEXT | ID of the purchased product |
| `product_name` | TEXT | Snapshot of the product name at checkout |
| `quantity` | INTEGER | Number of items purchased |
| `cost_price` | REAL | Cost price snapshot at checkout |
| `selling_price` | REAL | Selling price snapshot at checkout |

---

## 2. Express Backend API Endpoints

All endpoints are prefixed with `/api`.

### Products Router

* **Get All Products**
  * `GET /products`
  * Returns: `200 OK` JSON array of products.

* **Create Product**
  * `POST /products`
  * Body: JSON object containing all columns.
  * Returns: `201 Created` JSON object of created product.

* **Update Product**
  * `PUT /products/:id`
  * Body: JSON object containing columns to update.
  * Returns: `200 OK` JSON object of updated product.

* **Delete Product**
  * `DELETE /products/:id`
  * Returns: `200 OK` JSON confirmation.

### Sales Router

* **Get All Sales**
  * `GET /sales`
  * Returns: `200 OK` JSON array of sales, each nested with its corresponding `items` array.

* **Create Sale**
  * `POST /sales`
  * Body: JSON transaction payload with item details. Auto-decreases inventory stock levels inside the transaction block.
  * Returns: `201 Created` JSON of sale.
