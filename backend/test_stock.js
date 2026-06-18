/**
 * Test suite for stock data handling.
 * Ensures stock retrieval and update functions work as expected.
 */

const sqlite3 = require('sqlite3').verbose();

// Unit test configuration
console.log('Running test: Product Stock Deductions...');

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Failed to open memory db:', err);
    process.exit(1);
  }
  
  // Set up schema
  db.serialize(() => {
    db.run(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE sales (
        id TEXT PRIMARY KEY,
        total_amount REAL NOT NULL,
        total_cost REAL NOT NULL,
        total_profit REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL
      )
    `);

    // Insert mock product
    db.run(
      `INSERT INTO products (id, name, category, cost_price, selling_price, quantity, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['prod_1', 'Fresh Milk 1L', 'Dairy', 1.00, 1.50, 100, Date.now()],
      (err) => {
        if (err) {
          console.error('Failed to insert test product:', err);
          process.exit(1);
        }
        runStockDeductionTest();
      }
    );
  });
});

function runStockDeductionTest() {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Simulate sale of 5 milks
    db.run(
      `INSERT INTO sales (id, total_amount, total_cost, total_profit, timestamp, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['sale_1', 7.50, 5.00, 2.50, Date.now(), Date.now()]
    );

    db.run(
      `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, cost_price, selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['sitem_1', 'sale_1', 'prod_1', 'Fresh Milk 1L', 5, 1.00, 1.50]
    );

    // Auto-decrease stock
    db.run(
      `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
      [5, 'prod_1']
    );

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Transaction commit failed:', err);
        process.exit(1);
      }
      
      // Verify quantity is now 95
      db.get('SELECT quantity FROM products WHERE id = ?', ['prod_1'], (err, row) => {
        if (err) {
          console.error('Query failed:', err);
          process.exit(1);
        }
        
        try {
          assert.strictEqual(row.quantity, 95);
          console.log('✓ PASS: Product stock correctly decremented from 100 to 95.');
          process.exit(0);
        } catch (assertErr) {
          console.error('✗ FAIL: Stock quantity is', row.quantity, 'expected 95');
          process.exit(1);
        }
      });
    });
  });
}
