import { defineConfig } from 'vite';

// Vite config for the Café Timelapse.
// - base './' so the production bundle works when served from any sub-path.
// - server.host 'localhost' so the dev server binds to localhost (required by
//   the smoke-check harness; wildcard hosts are rejected).
// - preview binds to localhost on the runner-provided $PORT for smoke checks.
// - publicDir 'public' holds opt-in royalty-free audio overrides.
export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    host: 'localhost',
    port: Number(process.env.PORT) || 5173,
    strictPort: false
  },
  preview: {
    host: 'localhost',
    port: Number(process.env.PORT) || 4173,
    strictPort: false
  },
  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
});
