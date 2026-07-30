import { defineConfig } from 'vite';

// Minimal Vite config. The dev-server smoke harness owns localhost/PORT
// compatibility, so no fixed port is declared here. Later tasks extend this
// file (e.g. asset-handling, base path) but never recreate it.
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
