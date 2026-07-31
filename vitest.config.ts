/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The navigation rig attaches keyboard listeners to `window`, so the test
    // environment needs a DOM. jsdom provides one without a full browser.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    // jsdom does not implement HTMLCanvasElement.getContext('2d'); the setup
    // stubs it so Three.js CanvasTexture generation (used by era materials)
    // completes under jsdom without the native `canvas` package.
    setupFiles: ['src/test/vitest-setup.ts'],
  },
});
