/**
 * vitest-setup.ts — test-environment shims for the jsdom environment.
 *
 * jsdom does not implement `HTMLCanvasElement.getContext('2d')` (it logs
 * "Not implemented" and returns null), which breaks any test that builds a
 * Three.js scene whose materials carry procedural canvas textures — e.g. the
 * 1985 patron avatars, whose fabric/material requests hit TextureFactory's
 * canvas generators. This setup stubs the 2D context with no-op methods so
 * texture generation completes under jsdom without pulling in the heavyweight
 * `canvas` native package.
 *
 * The stub is deliberately permissive: every CanvasRenderingContext2D method
 * / property used by TextureFactory is a no-op or a benign default, which is
 * sufficient because tests assert scene-graph structure (presence, position,
 * era-scoping), not rendered pixels.
 */
import { vi } from 'vitest';

/** Methods + properties used by TextureFactory's canvas generators. */
const ctxStub = {
  // Drawing state
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  // Paths + stroking/filling
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  fillText: vi.fn(),
  // Style properties (assignable)
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  shadowColor: 'transparent',
  shadowBlur: 0,
  // Gradients (return a truthy object so assignment to fillStyle works)
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
};

// Patch HTMLCanvasElement.prototype.getContext to return the stub for '2d'.
// Cast through a loose type: the stub only implements the subset of the 2D
// context API that TextureFactory uses, which is sufficient under jsdom
// (tests assert scene-graph structure, not rendered pixels).
HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxStub) as unknown as
  typeof HTMLCanvasElement.prototype.getContext;
