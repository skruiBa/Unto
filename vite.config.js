// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Add any custom configuration here
  root: './',
  // Build configuration
  build: {
    outDir: 'dist', // Output directory for the build files
    sourcemap: true // Generate source maps for easier debugging of production code
  },
  publicDir: 'public' // Where static assets live
});
