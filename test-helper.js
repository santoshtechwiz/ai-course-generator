#!/usr/bin/env node
const { exec } = require('child_process');
const path = require('path');

// Function to normalize and escape file paths for Jest
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()\[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function normalizeTestPath(testPath) {
  // Convert Windows backslashes to forward slashes for Jest
  const normalizedPath = testPath.replace(/\\/g, '/');
  // Escape special characters
  const escapedPath = escapeRegExp(normalizedPath);
  return escapedPath;
}

// Get the test path from command line args
const args = process.argv.slice(2);
const testPath = args.length > 0 ? args[0] : null;

if (!testPath) {
  console.error('Please provide a test path');
  process.exit(1);
}

// Normalize the test path
const normalizedTestPath = normalizeTestPath(testPath);

// Build the Jest command
const jestCommand = `npx jest --testPathPattern="${normalizedTestPath}" --no-cache --runInBand`;

console.log(`Running: ${jestCommand}`);

// Execute Jest with the normalized path
exec(jestCommand, (error, stdout, stderr) => {
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  if (stdout) {
    console.log(`stdout: ${stdout}`);
  }
  if (error) {
    console.error(`exec error: ${error}`);
    process.exit(1);
  }
});
