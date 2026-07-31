/**
 * QA gate: `npm run check:performance`
 *
 * Headless (no WebGL) verification of the performance & resource-cleanup
 * pass:
 *   - procedural textures are capped at MAX_TEXTURE_SIZE (512) and the
 *     TextureFactory clamps requested resolutions;
 *   - static-geometry merging collapses same-material meshes inside every
 *     era group (draw-call reduction) while preserving the per-category
 *     group structure and the world-space volume;
 *   - across 20+ era switches through the TransitionController + EraGroupHost
 *     the mounted Object3D count stays flat (no Object3D leaks) and the
 *     TextureFactory cache stays bounded (no texture leaks);
 *   - the AudioEngine tears down every voice on era swaps (no audio-node
 *     leaks) and dispose() releases the context;
 *   - the FPS counter (dev toggle) samples frame timestamps and reports a
 *     stable value (frame-budget accounting).
 *
 * Pure object-graph + DOM assertions only, so it runs in CI without a
 * browser. Exits non-zero on any failure.
 */
import * as THREE from 'three';
import { Window } from 'happy-dom';
import { ERAS, type EraYear } from '../data/eras';
import { registerAllEras } from '../registry';
import { buildEraFragmentGroup } from '../systems/SceneManager';
import { EraGroupHost } from '../systems/SceneHost';
import { TransitionController } from '../systems/TransitionController';
import {
  mergeStaticMeshes,
  countLiveObject3D,
  pruneFactoryTextures,
} from '../systems/optimize';
import { textureFactory, MAX_TEXTURE_SIZE, clampTextureSize } from '../assets/TextureFactory';
import { AudioEngine } from '../audio/AudioEngine';
import { FpsCounter } from '../ui/FpsCounter';

// ---------------------------------------------------------------------------
// Minimal Web Audio stub (headless) so the AudioEngine builds real graphs.
// ---------------------------------------------------------------------------

interface StubNode {
  kind: string;
  connections: unknown[];
  connect(target: unknown): void;
  disconnect(): void;
  start?(): void;
  stop?(): void;
}

const stubNodes: StubNode[] = [];

class StubParam {
  value = 0;
  setValueAtTime(v: number): void {
    this.value = v;
  }
  linearRampToValueAtTime(v: number): void {
    this.value = v;
  }
  setTargetAtTime(v: number): void {
    this.value = v;
  }
  connect(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
}

class StubNodeImpl implements StubNode {
  kind: string;
  connections: unknown[] = [];
  constructor(kind: string) {
    this.kind = kind;
    stubNodes.push(this);
  }
  connect(target: unknown): void {
    this.connections.push(target);
  }
  disconnect(): void {
    this.connections = [];
  }
}

class StubAudioBufferSourceNode extends StubNodeImpl {
  buffer: unknown = null;
  loop = false;
  constructor() {
    super('buffer-source');
  }
  start(): void {
    /* no-op */
  }
  stop(): void {
    /* no-op */
  }
}

class StubOscillatorNode extends StubNodeImpl {
  type = 'sine';
  frequency = new StubParam();
  detune = new StubParam();
  constructor() {
    super('oscillator');
  }
  start(): void {
    /* no-op */
  }
  stop(): void {
    /* no-op */
  }
}

class StubGainNode extends StubNodeImpl {
  gain = new StubParam();
  constructor() {
    super('gain');
  }
}

class StubBiquadFilterNode extends StubNodeImpl {
  type = 'lowpass';
  frequency = new StubParam();
  constructor() {
    super('filter');
  }
}

class StubPannerNode extends StubNodeImpl {
  panningModel = 'HRTF';
  distanceModel = 'inverse';
  refDistance = 1;
  maxDistance = 10;
  rolloffFactor = 1;
  positionX = new StubParam();
  positionY = new StubParam();
  positionZ = new StubParam();
  constructor() {
    super('panner');
  }
}

class StubAudioBuffer {
  length: number;
  sampleRate: number;
  private data: Float32Array;
  constructor(length: number, sampleRate: number) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.data = new Float32Array(length);
  }
  getChannelData(): Float32Array {
    return this.data;
  }
}

class StubAudioListener {
  positionX = new StubParam();
  positionY = new StubParam();
  positionZ = new StubParam();
  forwardX = new StubParam();
  forwardY = new StubParam();
  forwardZ = new StubParam();
  upX = new StubParam();
  upY = new StubParam();
  upZ = new StubParam();
}

class StubAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = new StubNodeImpl('destination');
  listener = new StubAudioListener();
  state: 'suspended' | 'running' = 'suspended';

  createGain(): StubGainNode {
    return new StubGainNode();
  }
  createOscillator(): StubOscillatorNode {
    return new StubOscillatorNode();
  }
  createBuffer(_channels: number, length: number, sampleRate: number): StubAudioBuffer {
    return new StubAudioBuffer(length, sampleRate);
  }
  createBufferSource(): StubAudioBufferSourceNode {
    return new StubAudioBufferSourceNode();
  }
  createBiquadFilter(): StubBiquadFilterNode {
    return new StubBiquadFilterNode();
  }
  createPanner(): StubPannerNode {
    return new StubPannerNode();
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

function installAudioStub(): void {
  Object.assign(globalThis, {
    AudioContext: StubAudioContext,
    webkitAudioContext: undefined,
  });
  stubNodes.length = 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countMeshes(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) n += 1;
  });
  return n;
}

function worldSphere(group: THREE.Object3D): THREE.Sphere {
  return new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
}

function categoryMeshCounts(group: THREE.Object3D): Map<string, number> {
  const counts = new Map<string, number>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = (mesh.parent as THREE.Object3D | null)?.name ?? '?';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return counts;
}

async function run(): Promise<void> {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  installAudioStub();

  // happy-dom globals so the FpsCounter (and TextureFactory canvas) run.
  const window = new Window();
  Object.assign(globalThis, {
    window,
    document: window.document,
    CustomEvent: window.CustomEvent,
  });

  await registerAllEras();

  // --- 1. Texture resolution caps -------------------------------------------
  console.log('\n[texture caps]');
  assert(MAX_TEXTURE_SIZE === 512, `procedural textures are capped at 512px (got ${MAX_TEXTURE_SIZE})`);
  assert(clampTextureSize(4096) === MAX_TEXTURE_SIZE, 'clampTextureSize caps oversized requests at 512');
  assert(clampTextureSize(256) === 256, 'clampTextureSize keeps in-range sizes');
  assert(clampTextureSize(1) === 8, 'clampTextureSize floors tiny sizes at 8');
  const oversized = textureFactory.get({ kind: 'tile', color: '#111111', color2: '#222222', size: 4096 });
  assert(
    (oversized.texture.image as HTMLCanvasElement).width <= MAX_TEXTURE_SIZE,
    'TextureFactory.get clamps the actual canvas resolution',
  );
  assert(
    (oversized.texture.image as HTMLCanvasElement).width === MAX_TEXTURE_SIZE,
    'oversized request produced a 512px canvas',
  );

  // --- 2. Static mesh merge --------------------------------------------------
  console.log('\n[static mesh merge]');
  let totalRaw = 0;
  let totalMerged = 0;
  for (const era of ERAS) {
    const group = buildEraFragmentGroup(era as EraYear);
    const before = countMeshes(group);
    const beforeCategories = categoryMeshCounts(group);
    const beforeSphere = worldSphere(group);
    const report = mergeStaticMeshes(group);
    const after = countMeshes(group);
    const afterCategories = categoryMeshCounts(group);
    const afterSphere = worldSphere(group);

    let categoryOK = true;
    for (const [name, count] of beforeCategories) {
      if ((afterCategories.get(name) ?? 0) < 1) {
        categoryOK = false;
        console.error(`    category ${name} lost all meshes (${count} -> ${afterCategories.get(name) ?? 0})`);
      }
    }
    const volumeOK =
      afterSphere.center.distanceTo(beforeSphere.center) < 0.02 &&
      Math.abs(afterSphere.radius - beforeSphere.radius) < 0.02;

    totalRaw += before;
    totalMerged += after;
    assert(report.mergedMeshes > 0, `era ${era} merges same-material meshes (${report.mergedMeshes} merged)`);
    assert(after < before, `era ${era} draw calls drop (${before} -> ${after})`);
    assert(categoryOK, `era ${era} preserves every category group's meshes`);
    assert(volumeOK, `era ${era} preserves the world-space volume`);
  }
  const reduction = totalRaw > 0 ? Math.round((1 - totalMerged / totalRaw) * 100) : 0;
  assert(reduction >= 30, `draw-call reduction across eras is meaningful (${reduction}%)`);

  // --- 3. Object3D leak detection across 20+ era switches --------------------
  console.log('\n[Object3D leak detection]');
  textureFactory.releaseAll();
  const root = new THREE.Group();
  const host = new EraGroupHost(root, { cloneMaterials: true });
  const controller = new TransitionController({ host, duration: 0.05, easing: 'linear' });

  const switchEra = (era: EraYear): void => {
    controller.goTo(era);
    controller.update(10);
  };

  // Two full cycles (12 switches) then continue to 24+ total switches.
  const nodeCounts: number[] = [];
  let cycles = 0;
  for (let i = 0; i < 24; i += 1) {
    switchEra(ERAS[i % ERAS.length] as EraYear);
    if (i >= ERAS.length - 1 && (i + 1) % ERAS.length === 0) {
      cycles += 1;
      nodeCounts.push(countLiveObject3D(root));
    }
  }
  assert(cycles >= 3, `completed ${cycles} full era cycles (>= 3 for a 20+ switch run)`);
  assert(root.children.length === 1, 'exactly one era group stays mounted after switches');
  assert(
    nodeCounts.length >= 2 && Math.abs(nodeCounts[nodeCounts.length - 1] - nodeCounts[0]) <= 0,
    `Object3D count is flat across era cycles (${nodeCounts.join(' -> ')})`,
  );

  // --- 4. Texture factory stays bounded across switches ----------------------
  console.log('\n[texture cache bound]');
  const factorySizeAfterCycles = textureFactory.size;
  assert(
    factorySizeAfterCycles < 300,
    `TextureFactory cache is bounded after 20+ switches (${factorySizeAfterCycles})`,
  );
  const pruned = pruneFactoryTextures([root]);
  assert(
    pruned >= 0 && textureFactory.size <= factorySizeAfterCycles,
    `pruneFactoryTextures keeps the cache bounded (pruned ${pruned}, size ${textureFactory.size})`,
  );

  controller.dispose();
  assert(root.children.length === 0, 'dispose unmounts every era group');

  // --- 5. Audio node cleanup across era swaps --------------------------------
  console.log('\n[audio node cleanup]');
  installAudioStub();
  const engine = new AudioEngine();
  engine.setEra(1945);
  engine.unlock();
  const voicesAfterFirst = (engine as unknown as { voices: unknown[] }).voices.length;
  assert(voicesAfterFirst > 0, 'unlock builds the first era bed');

  for (let i = 1; i <= 24; i += 1) {
    engine.setEra(ERAS[i % ERAS.length] as EraYear);
  }
  const voicesAfterSwaps = (engine as unknown as { voices: unknown[] }).voices.length;
  assert(
    voicesAfterSwaps <= voicesAfterFirst + 1,
    `era swaps keep the voice count bounded (${voicesAfterFirst} -> ${voicesAfterSwaps})`,
  );
  // The live voices (current era's bed) connect to the master bus; torn-down
  // voices must not linger. Locate the master gain (the node feeding the
  // destination) and count the gain nodes connected directly to it.
  const masterNode = stubNodes.find(
    (node) =>
      node.kind === 'gain' &&
      node.connections.some((connection) => connection instanceof StubNodeImpl && connection.kind === 'destination'),
  );
  const connectedVoiceGains = stubNodes.filter(
    (node) =>
      node.kind === 'gain' &&
      masterNode !== undefined &&
      node.connections.includes(masterNode),
  ).length;
  assert(
    connectedVoiceGains === voicesAfterSwaps,
    `only the live era bed stays connected (${connectedVoiceGains} of ${voicesAfterSwaps} voices)`,
  );
  engine.dispose();
  const voicesAfterDispose = (engine as unknown as { voices: unknown[] }).voices.length;
  assert(voicesAfterDispose === 0, 'dispose stops every voice (no audio-node leaks)');
  const connectedAfterDispose = stubNodes.filter((node) => node.connections.length > 0).length;
  assert(connectedAfterDispose === 0, 'dispose disconnects every audio node (no leaks)');

  // --- 6. FPS counter (dev toggle) -------------------------------------------
  console.log('\n[FPS counter]');
  const fps = new FpsCounter({ enabled: true });
  assert(fps.isEnabled, 'FPS counter starts enabled when requested');
  assert(fps.root.hidden === false, 'FPS chip is visible when enabled');

  // Simulate 120 frames at 60fps.
  let reported = 0;
  for (let i = 1; i <= 120; i += 1) {
    reported = fps.update(i * (1000 / 60));
  }
  assert(reported > 55 && reported < 65, `FPS counter reports ~60fps (got ${reported.toFixed(1)})`);
  assert(
    (fps.root.querySelector('.fps-counter__value')?.textContent ?? '') === `${Math.round(reported)}`,
    'FPS value label shows the smoothed frame rate',
  );

  fps.toggle();
  assert(!fps.isEnabled, 'toggle disables the counter');
  assert(fps.root.hidden === true, 'disabled counter hides the chip');

  if (failures > 0) {
    console.error(`\nPerformance check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll performance assertions passed.');
  }
}

void run();
