const assert = require('assert');

// Simulate processing the sync queue
async function processSyncQueueMock(queue, serverMock) {
  let processedCount = 0;
  const processedItems = [];

  for (const item of queue) {
    try {
      const response = await serverMock(item);
      if (response.success) {
        processedItems.push(item.id);
        processedCount++;
      } else {
        // Halt queue processing to preserve chronological execution order
        console.log(`Halted sync processing at item ID ${item.id} due to server response failure.`);
        break;
      }
    } catch (err) {
      console.log(`Halted sync processing at item ID ${item.id} due to network exception.`);
      break;
    }
  }

  return { processedCount, processedItems };
}

console.log('Running test: Sync Queue Halting Mechanism...');

async function runTest() {
  const mockQueue = [
    { id: 1, action: 'CREATE_PRODUCT', payload: { id: 'p1', name: 'Milk' } },
    { id: 2, action: 'UPDATE_PRODUCT', payload: { id: 'p1', quantity: 50 } }, // This one will fail
    { id: 3, action: 'CREATE_SALE', payload: { id: 's1', amount: 15.00 } }
  ];

  // Mock server endpoint handler
  const serverMock = async (item) => {
    if (item.id === 2) {
      return { success: false, status: 500 }; // Simulate backend db lock error
    }
    return { success: true, status: 200 };
  };

  try {
    const result = await processSyncQueueMock(mockQueue, serverMock);

    // Verify that item 1 succeeded, item 2 failed, and item 3 was NOT processed
    assert.strictEqual(result.processedCount, 1);
    assert.deepStrictEqual(result.processedItems, [1]);
    
    console.log('✓ PASS: Halting mechanism verified. Action order is correctly preserved.');
    process.exit(0);
  } catch (err) {
    console.error('✗ FAIL: Halting mechanism assertion failed:', err.message);
    process.exit(1);
  }
}

runTest();
