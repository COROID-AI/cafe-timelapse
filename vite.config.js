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
    // Bind to IPv4 loopback explicitly so the smoke-check harness (which probes
    // 127.0.0.1) can always reach the server. `host: 'localhost'` can resolve
    // to IPv6 '::1' on some systems, causing "fetch failed" probe timeouts.
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
    strictPort: true
  },
  preview: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 4173,
    strictPort: true
  },
  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
});
