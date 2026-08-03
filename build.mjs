// Minimal Vite build script - provides config directly (no file bundling needed)
import { build } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting Vite build...');

try {
  await build({
    configFile: false,  // Skip config file loading entirely
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: false,       // skip esbuild minification  
      target: 'esnext',    // no transpilation needed
    },
    // Disable esbuild for dependency optimization
    optimizeDeps: {
      disabled: true,      // Only affects dev, but just in case
    },
  });
  console.log('Build completed successfully!');
} catch(e) {
  console.error('Build failed:', e.message);
  console.error(e.stack);
  process.exit(1);
}
