import { defineConfig } from 'vite';

// Vite config for the Café Timelapse.
// - base './' so the production bundle works when served from any sub-path.
// - server.host true so the dev server is reachable on the LAN / runner probe.
// - preview binds to the runner-provided $PORT (localhost) for smoke checks.
// - publicDir 'public' holds opt-in royalty-free audio overrides.
export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    strictPort: false
  },
  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
});
