import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // The whole café (three.js included) ships as one eager bundle on purpose:
    // the animated loading overlay covers the synchronous scene build, so
    // code-splitting would delay first paint for no user-facing benefit.
    chunkSizeWarningLimit: 900,
  },
});
