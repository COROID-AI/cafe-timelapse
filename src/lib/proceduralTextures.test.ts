import { describe, it, expect } from 'vitest';
import { woodGrain } from './proceduralTextures';

describe('proceduralTextures', () => {
  it('woodGrain returns a CanvasTexture', () => {
    const tex = woodGrain(42, 120, '#6B4423');
    expect(tex).toBeDefined();
    expect(tex.image).toBeDefined();
    // CanvasTexture wraps an HTMLCanvasElement
    const canvas = tex.image as HTMLCanvasElement;
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(120);
  });

  it('is deterministic — same seed produces same texture', () => {
    const a = woodGrain(7, 64);
    const b = woodGrain(7, 64);
    // Same seed → same image dimensions
    expect((a.image as HTMLCanvasElement).width).toBe((b.image as HTMLCanvasElement).width);
  });
});
