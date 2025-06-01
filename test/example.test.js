'use strict';

// Simple test file - you might want to replace with a proper testing framework later
const example = require('../src/example');

console.log('Running tests...');

// Test the greet function
const greeting = example.greet('World');
const expected = 'Hello, World!';

if (greeting === expected) {
  console.log('✓ greet test passed');
} else {
  console.error(`✗ greet test failed. Expected "${expected}", got "${greeting}"`);
  process.exit(1);
}

console.log('All tests passed!');
