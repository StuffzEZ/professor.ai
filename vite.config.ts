import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// GitHub Pages serves from https://<user>.github.io/<repo>/
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/professor.ai/';

// All Firebase config values are public by design — they are safe to ship in
// the client bundle. The only truly secret value is the Professor AI endpoint
// API key, which is injected at build time and never written to disk.
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Strip debug-only code from the production bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // removes console.log/debug calls
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  // Ensure the base path is always set for GitHub Pages
  base: BASE_PATH,
});