/**
 * Backend server for ZAD Stock application.
 * Provides REST API endpoints for products, sales, and health checks.
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'zad_stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Run Schema SQL
function initializeDatabase() {
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schemaSql, (err) => {
    if (err) {
      console.error('Error initializing database tables:', err.message);
    } else {
      console.log('Database tables verified/initialized successfully.');
    }
  });
}

// Product CRUD APIs
/**
 * Get all products.
 * Responds with an array of product objects sorted by name.
 */
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * Create a new product.
 * Expects product fields in request body and returns the created product.
 */
app.post('/api/products', (req, res) => {
  const { id, name, category, cost_price, selling_price, quantity, updated_at } = req.body;
  if (!id || !name || cost_price === undefined || selling_price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const timestamp = updated_at || Date.now();
  db.run(
    `INSERT INTO products (id, name, category, cost_price, selling_price, quantity, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, category, cost_price, selling_price, quantity, timestamp],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, name, category, cost_price, selling_price, quantity, updated_at: timestamp });
    }
  );
});

/**
 * Update an existing product by ID.
 * Requires all product fields in request body; updates the record and returns the updated product.
 */
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, cost_price, selling_price, quantity, updated_at } = req.body;
  if (!name || cost_price === undefined || selling_price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const timestamp = updated_at || Date.now();
  db.run(
    `UPDATE products
     SET name = ?, category = ?, cost_price = ?, selling_price = ?, quantity = ?, updated_at = ?
     WHERE id = ?`,
    [name, category, cost_price, selling_price, quantity, timestamp, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ id, name, category, cost_price, selling_price, quantity, updated_at: timestamp });
    }
  );
});

/**
 * Delete a product by ID.
 * Returns a success message if deletion occurs.
 */
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', id });
  });
});

// Sales APIs
/**
 * Retrieve all sales records with their items.
 * Returns an empty array if no sales exist.
 */
app.get('/api/sales', (req, res) => {
  db.all('SELECT * FROM sales ORDER BY timestamp DESC', [], (err, salesRows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!salesRows.length) {
      return res.json([]);
    }
    db.all('SELECT * FROM sale_items', [], (err, itemsRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const salesMap = salesRows.map(sale => ({
        ...sale,
        items: itemsRows.filter(item => item.sale_id === sale.id)
      }));
      res.json(salesMap);
    });
  });
});

/**
 * Record a new sale.
 * Expects total amounts and items array in request body; creates sale and associated items, updates product stock.
 */
app.post('/api/sales', (req, res) => {
  const { id, total_amount, total_cost, total_profit, timestamp, updated_at, items } = req.body;
  if (!id || total_amount === undefined || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const time = timestamp || Date.now();
  const updateTime = updated_at || Date.now();
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const salesStmt = db.prepare(
      `INSERT INTO sales (id, total_amount, total_cost, total_profit, timestamp, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    
    salesStmt.run(id, total_amount, total_cost, total_profit, time, updateTime, function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      const itemsStmt = db.prepare(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, cost_price, selling_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      
      let itemsError = null;
      for (const item of items) {
        const itemId = 'item_' + Math.random().toString(36).substr(2, 9);
        itemsStmt.run(
          itemId, id, item.product_id, item.product_name, item.quantity, item.cost_price, item.selling_price,
          (err) => {
            if (err) itemsError = err;
          }
        );
      }
      
      itemsStmt.finalize(() => {
        if (itemsError) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: itemsError.message });
        }
        
        // Auto-decrease stock in backend database
        const stockStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
        for (const item of items) {
          stockStmt.run(item.quantity, item.product_id);
        }
        
        stockStmt.finalize(() => {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id, total_amount, total_cost, total_profit, timestamp: time, items });
          });
        });
      });
    });
    salesStmt.finalize();
  });
});

// Health Check API
/**
 * Health check endpoint.
 * Returns service status and timestamp.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ZAD Stock Backend Server is running',
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('SQLite database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, db };
