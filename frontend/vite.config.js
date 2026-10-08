import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the browser calls /api on the Vite server, which forwards to Spring Boot.
    // Same origin for the browser, so no CORS setup is needed locally.
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // "junit" writes the XML that scripts/test-report.mjs reads for docs/EVIDENCE.md
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-results/junit.xml' },
  },
});
