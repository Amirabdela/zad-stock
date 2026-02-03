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
