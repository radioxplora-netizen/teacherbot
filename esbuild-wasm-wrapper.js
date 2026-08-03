#!/usr/bin/env node
// Wrapper that uses esbuild-wasm instead of the native binary
const esbuild = require('esbuild-wasm');
const args = process.argv.slice(2);

async function main() {
  await esbuild.initialize({ wasmURL: '' });  // Use bundled wasm
  // Forward to esbuild's CLI
  await esbuild.build({});  // This won't work directly
}

// Actually, just require the esbuild main and monkey-patch
const path = require('path');
const realMain = path.join(__dirname, 'node_modules', '.pnpm', 'esbuild@0.21.5', 'node_modules', 'esbuild', 'lib', 'main.js');

// Simpler approach: use esbuild-wasm's buildSync or build
try {
  const wasmBuild = require('esbuild-wasm');
  // Redirect to esbuild's JS API through wasm
  process.argv = ['node', 'esbuild', ...args];
  require(realMain);
} catch(e) {
  console.error('Wrapper error:', e.message);
}
