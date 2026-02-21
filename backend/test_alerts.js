const assert = require('assert');

// Alert classification helper
function getStockStatus(quantity) {
  const LOW_STOCK_THRESHOLD = 10;
  if (quantity === 0) {
    return 'OUT_OF_STOCK';
  } else if (quantity < LOW_STOCK_THRESHOLD) {
    return 'LOW_STOCK';
  } else {
    return 'IN_STOCK';
  }
}

console.log('Running test: Product Stock Alerts Classification...');

try {
  // Test case 1: Healthy stock level
  assert.strictEqual(getStockStatus(25), 'IN_STOCK');
  
  // Test case 2: Threshold boundary level
  assert.strictEqual(getStockStatus(10), 'IN_STOCK');

  // Test case 3: Low stock level
  assert.strictEqual(getStockStatus(9), 'LOW_STOCK');
  assert.strictEqual(getStockStatus(1), 'LOW_STOCK');

  // Test case 4: Out of stock level
  assert.strictEqual(getStockStatus(0), 'OUT_OF_STOCK');

  console.log('✓ PASS: All product stock alert thresholds verified successfully.');
  process.exit(0);
} catch (err) {
  console.error('✗ FAIL: Alert classification assertion failed:', err.message);
  process.exit(1);
}
