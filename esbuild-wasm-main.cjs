// esbuild WASM drop-in replacement
// This replaces esbuild's lib/main.js with a WASM-based implementation
// that Vite can use without spawning native binaries.

const esbuildWasm = require('esbuild-wasm');
const fs = require('fs');

let initialized = false;
let initPromise = null;

function ensureInit() {
  if (initialized) return Promise.resolve();
  if (initPromise) return initPromise;
  
  // Find the wasm file
  const wasmPath = require.resolve('esbuild-wasm/esbuild.wasm');
  initPromise = esbuildWasm.initialize({ 
    wasmBinary: fs.readFileSync(wasmPath),
    // Disable workers to avoid additional process spawning
    worker: false,
  }).then(() => {
    initialized = true;
  });
  return initPromise;
}

// Synchronous stubs that throw (Vite should use async versions)
function buildSync() {
  throw new Error('buildSync not supported in WASM esbuild');
}

function transformSync() {
  throw new Error('transformSync not supported in WASM esbuild');
}

// Async API (the ones Vite actually uses)
async function build(options) {
  await ensureInit();
  return esbuildWasm.build(options);
}

async function context(options) {
  await ensureInit();
  const ctx = await esbuildWasm.context(options);
  return ctx;
}

async function transform(input, options = {}) {
  await ensureInit();
  // esbuild-wasm transform expects (input, options) 
  // but esbuild transform expects (input, options). Same API.
  return esbuildWasm.transform(input, options);
}

async function formatMessages(messages, options) {
  await ensureInit();
  return esbuildWasm.formatMessages(messages, options);
}

// Service API (older Vite versions)
async function startService() {
  await ensureInit();
  return {
    build: async (opts) => esbuildWasm.build(opts),
    transform: async (input, opts) => esbuildWasm.transform(input, opts),
    stop: async () => {},
  };
}

function stopService() {}

// Export version so Vite knows it's available
const version = '0.21.5';

module.exports = {
  build,
  buildSync,
  context,
  transform,
  transformSync,
  formatMessages,
  startService,
  stopService,
  version,
  
  // Also match older esbuild API
  analyzeMetafile: esbuildWasm.analyzeMetafile,
  analyzeMetafileSync: (...args) => { throw new Error('not supported'); },
};
