import { defineConfig } from 'vitest/config';

// Vitest config. Tests run in the Node environment (no DOM/canvas) and exercise
// the transition controller against a real SceneManager instance, driving the
// animation manually via `update(now)` rather than requestAnimationFrame.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
