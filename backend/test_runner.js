/**
 * Test Runner for ZAD Stock Backend
 * Automatically executes all individual test suites and reports summary.
 */

const { exec } = require('child_process');
const path = require('path');

const testSuites = [
  'test_alerts.js',
  'test_stock.js',
  'test_sync.js'
];

async function runSuite(suite) {
  return new Promise((resolve) => {
    const filePath = path.join(__dirname, suite);
    console.log(`Running suite: ${suite}...`);
    
    exec(`node "${filePath}"`, (error, stdout, stderr) => {
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());
      
      if (error) {
        console.error(`✗ ${suite} failed with exit code ${error.code}\n`);
        resolve(false);
      } else {
        console.log(`✓ ${suite} completed successfully.\n`);
        resolve(true);
      }
    });
  });
}

async function runAll() {
  console.log('========================================');
  console.log('Starting ZAD Stock backend test runner');
  console.log('========================================\n');
  
  let allPassed = true;
  for (const suite of testSuites) {
    const passed = await runSuite(suite);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('========================================');
  if (allPassed) {
    console.log('ALL TEST SUITES PASSED SUCCESSFULLY');
    process.exit(0);
  } else {
    console.error('SOME TEST SUITES FAILED');
    process.exit(1);
  }
}

runAll();
