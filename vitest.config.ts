/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The navigation rig attaches keyboard listeners to `window`, so the test
    // environment needs a DOM. jsdom provides one without a full browser.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
