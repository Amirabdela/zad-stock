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
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

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

// Health Check API
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
