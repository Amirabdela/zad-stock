#!/usr/bin/env node

/**
 * Command Line Interface (CLI) for ZAD Stock Backend
 * Supports custom ports and help instructions.
 */

const path = require('path');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
ZAD Stock Backend CLI
Usage:
  node cli.js [options]

Options:
  -p, --port <number>   Specify custom port (default: 5000)
  -h, --help            Show this help information
  `);
}

let port = 5000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  } else if (arg === '-p' || arg === '--port') {
    const nextArg = args[i + 1];
    const parsedPort = parseInt(nextArg, 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
      i++; // skip next arg
    } else {
      console.error('Error: Please provide a valid port number.');
      process.exit(1);
    }
  } else {
    console.error(`Unknown argument: ${arg}`);
    printHelp();
    process.exit(1);
  }
}

// Set port in environment so server.js picks it up
process.env.PORT = port;

console.log(`Starting ZAD Stock Backend via CLI on port ${port}...`);
require('./server');
