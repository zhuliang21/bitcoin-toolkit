'use strict';

// Test for browser bundle
const fs = require('fs');
const vm = require('vm');

console.log('Running browserify bundle test...');

const bundle = fs.readFileSync(require('path').resolve(__dirname, '../dist/bundle.js'), 'utf8');

const crypto = require('crypto');
// Shim browser crypto for bip39
const sandbox = { module: {}, exports: {}, console, crypto: { getRandomValues: (arr) => {
      const buf = crypto.randomBytes(arr.length);
      for (let i = 0; i < buf.length; i++) arr[i] = buf[i];
      return arr;
    } } };
vm.runInNewContext(bundle, sandbox);

// After bundling, bip39 should be available from module.exports or global export
const bip39 = sandbox.module && sandbox.module.exports ? sandbox.module.exports : sandbox.bip39;
if (typeof bip39 !== 'object' || typeof bip39.generateMnemonic !== 'function') {
  console.error('✗ bip39 not correctly exported in bundle.');
  process.exit(1);
}

// Test a simple mnemonic generation
const mnemonic = bip39.generateMnemonic(128);
if (typeof mnemonic === 'string' && mnemonic.split(' ').length >= 12) {
  console.log('✓ browserify bundle test passed');
} else {
  console.error('✗ browserify bundle test failed. Generated mnemonic:', mnemonic);
  process.exit(1);
}

console.log('All tests passed!');
