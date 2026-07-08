// Test setup for Vitest + Testing Library
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the WebGL / Three.js environment for jsdom
// (Three.js components need canvas/WebGL which jsdom doesn't provide)

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

// Mock AudioContext
class AudioContextMock {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }
  createOscillator() {
    return { connect: () => {}, start: () => {}, frequency: { value: 0 } };
  }
  createGain() {
    return { connect: () => {}, gain: { value: 0, linearRampToValueAtTime: () => {} } };
  }
  createBiquadFilter() {
    return { connect: () => {}, frequency: { value: 0 }, type: '', Q: { value: 0 } };
  }
  destination = {};
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}
(globalThis as unknown as { AudioContext: typeof AudioContextMock }).AudioContext =
  AudioContextMock;

// Mock HTMLCanvasElement.getContext for texture generation tests
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type: string) => {
  if (type === '2d') {
    return {
      fillRect: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      closePath: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      canvas: { width: 512, height: 512 },
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 10 }),
      ellipse: () => {},
      strokeRect: () => {},
      textAlign: 'left',
      textBaseline: 'alphabetic',
      font: '',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as never;
