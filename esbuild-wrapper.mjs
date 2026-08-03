import { build, buildSync } from 'esbuild-wasm';
import { readFileSync } from 'fs';

// Initialize WASM
const wasmBinary = readFileSync(
  new URL('node_modules/esbuild-wasm/esbuild.wasm', import.meta.url).pathname
);
await buildWasm.initialize({ wasmBinary });

// Parse CLI args the same way esbuild does
const args = process.argv.slice(2);
const options = {};

// Minimal CLI parsing
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--bundle') options.bundle = true;
  else if (arg === '--minify') options.minify = true;
  else if (arg === '--sourcemap') options.sourcemap = true;
  else if (arg === '--format' || arg === '--format=') options.format = args[++i];
  else if (arg === '--outfile' || arg === '--outfile=') options.outfile = args[++i];
  else if (arg === '--target' || arg === '--target=') options.target = args[++i];
  else if (arg.startsWith('--outfile=')) options.outfile = arg.split('=')[1];
  else if (arg.startsWith('--')) continue; // skip unknown flags
  else if (!arg.startsWith('-')) {
    // It's an entry point
    if (!options.entryPoints) options.entryPoints = [];
    options.entryPoints.push(arg);
  }
}

try {
  await build(options);
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
}
