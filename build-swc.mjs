// Custom build script that uses SWC to pre-transform TSX before Vite
import { build } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { transformFile } from '@swc/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin: transform TS/TSX to JS using SWC before esbuild sees them
function swcTransformPlugin() {
  const tsRegex = /\.(tsx?|jsx)$/;
  
  return {
    name: 'swc-transform',
    enforce: 'pre',  // Run BEFORE vite's esbuild transform
    async transform(code, id) {
      if (!tsRegex.test(id)) return null;
      
      // Skip node_modules
      if (id.includes('node_modules')) return null;
      
      try {
        const result = await transformFile(id, {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
            target: 'es2022',
          },
          module: { type: 'es6' },
        });
        
        return {
          code: result.code,
          map: result.map,
        };
      } catch (e) {
        console.error(`SWC transform error in ${id}:`, e.message);
        return null;
      }
    },
  };
}

console.log('Starting Vite build with SWC pre-transform...');

try {
  await build({
    configFile: false,
    root: __dirname,
    plugins: [
      swcTransformPlugin(),  // Must come before react plugin
      react(),               // Handles HMR and Fast Refresh
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: false,
      target: 'esnext',
    },
    // Tell Vite not to use esbuild for transforms (hopefully)
    esbuild: {
      include: /\.js$/,
      exclude: /\.tsx?$/,   // Don't process TS files with esbuild
    },
  });
  console.log('Build successful!');
  console.log('Files in dist:', fs.readdirSync(path.join(__dirname, 'dist')).length);
} catch(e) {
  console.error('Build failed:', e.message);
  // Don't exit with error - show partial results
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('Partial dist exists with', 
      fs.readdirSync(path.join(__dirname, 'dist')).length, 'entries');
  }
}
