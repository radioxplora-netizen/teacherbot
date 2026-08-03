// Proxy that wraps esbuild-wasm with an esbuild-compatible API for Vite
const esbuildWasm = require('esbuild-wasm');
const fs = require('fs');

let initialized = false;
let initPromise = null;

async function ensureInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;
  const wasmPath = require.resolve('esbuild-wasm/esbuild.wasm');
  initPromise = esbuildWasm.initialize({ wasmBinary: fs.readFileSync(wasmPath) });
  await initPromise;
  initialized = true;
}

// Synchronous build is NOT possible with WASM, but Vite tries buildSync first
// We override this at the Vite level
function buildSync(options) {
  // This will fail, but we'll handle it
  throw new Error('buildSync not available - use async build');
}

async function build(options) {
  await ensureInitialized();
  return esbuildWasm.build(options);
}

// Vite uses context() for dev server
async function context(options) {
  await ensureInitialized();
  return {
    rebuild: async () => esbuildWasm.build(options),
    dispose: async () => {},
    cancel: () => {},
    watch: () => {},
    serve: () => { throw new Error('serve not supported'); },
  };
}

async function transform(input, options) {
  await ensureInitialized();
  return esbuildWasm.transform(input, options);
}

function transformSync(input, options) {
  throw new Error('transformSync not supported');
}

async function formatMessages(messages, options) {
  await ensureInitialized();
  return esbuildWasm.formatMessages(messages, options);
}

module.exports = {
  build,
  buildSync,
  context,
  transform,
  transformSync,
  formatMessages,
  version: '0.21.5',
  // Vite esbuild service API
  startService: async () => ({
    build: async (opts) => { await ensureInitialized(); return esbuildWasm.build(opts); },
    transform: async (input, opts) => { await ensureInitialized(); return esbuildWasm.transform(input, opts); },
    stop: async () => {},
  }),
  stopService: async () => {},
};
