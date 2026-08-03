import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      // Use SWC for everything including TypeScript stripping
      tsDecorators: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: false,       // Don't use esbuild for minification
    target: 'esnext',    // Minimal transpilation
    rollupOptions: {
      // Let SWC/React plugin handle all transforms
    },
  },
  // Try to use esbuild from WASM if possible
  esbuild: false,
});
