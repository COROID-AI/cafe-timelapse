/**
 * QA gate: `npm run check:audio`
 *
 * Headless (no Web Audio hardware) verification of the procedural AudioEngine:
 *   - every canonical era has a full audio profile whose music source kind
 *     matches the era's EraData.musicSource and whose spatial positions stay
 *     inside the café shell bounds;
 *   - unlock() creates a running AudioContext (simulated user gesture), starts
 *     the murmur/hiss/music beds, and is idempotent;
 *   - setEra() crossfades layers and switches the generative music bed's
 *     source object and sonic character per era;
 *   - update() drives the lookahead schedulers (music notes, crackle, coffee
 *     clatter) and keeps the audio listener glued to the camera;
 *   - the coffee machine and music source are spatialised via PannerNodes at
 *     their in-scene positions;
 *   - the mute toggle ramps the master gain; dispose() stops sources and
 *     closes the context.
 *
 * Exits non-zero on any assertion failure.
 */
import { ERAS, type EraYear } from '../data/eras';
import { era1945, era1965, era1985, era2005, era2025, era2055 } from '../data/eras/all';
import type { EraData } from '../data/EraData';
import { AUDIO_ERA_PROFILES, DEFAULT_ERA, getAudioProfile } from '../systems/audioProfiles';
import { AudioEngine } from '../systems/AudioEngine';
import { CAFÉ_BOUNDS } from '../systems/cafeShell';

const ERA_DATA: Record<EraYear, EraData> = {
  1945: era1945,
  1965: era1965,
  1985: era1985,
  2005: era2005,
  2025: era2025,
  2055: era2055,
};

// --- Minimal fake Web Audio graph ------------------------------------------

interface ParamEvent {
  t: number;
  v: number;
}

class FakeParam {
  value: number;
  events: ParamEvent[] = [];

  constructor(value = 0) {
    this.value = value;
  }

  setValueAtTime(v: number, t: number): FakeParam {
    this.value = v;
    this.events.push({ t, v });
    return this;
  }

  linearRampToValueAtTime(v: number, t: number): FakeParam {
    this.value = v;
    this.events.push({ t, v });
    return this;
  }

  exponentialRampToValueAtTime(v: number, _t: number): FakeParam {
    this.value = v;
    return this;
  }

  setTargetAtTime(v: number, _t: number, _c: number): FakeParam {
    this.value = v;
    return this;
  }

  cancelScheduledValues(_t: number): FakeParam {
    return this;
  }
}

class FakeNode {
  connections: FakeNode[] = [];

  connect(dest: FakeNode): FakeNode {
    this.connections.push(dest);
    return dest;
  }

  disconnect(): void {
    this.connections.length = 0;
  }
}

class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  playbackRate = new FakeParam(1);
  started: number[] = [];
  stopped: number[] = [];

  start(t = 0): void {
    this.started.push(t);
  }

  stop(t = 0): void {
    this.stopped.push(t);
  }
}

class FakeOscillator extends FakeSource {
  type: OscillatorType = 'sine';
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
}

class FakeGain extends FakeNode {
  gain = new FakeParam(0);
}

class FakeFilter extends FakeNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new FakeParam(350);
  Q = new FakeParam(1);
}

class FakePanner extends FakeNode {
  panningModel: PanningModelType = 'equalpower';
  distanceModel: DistanceModelType = 'inverse';
  refDistance = 1;
  maxDistance = 18;
  rolloffFactor = 1;
  position: [number, number, number] = [0, 0, 0];

  setPosition(x: number, y: number, z: number): void {
    this.position = [x, y, z];
  }
}

class FakeConvolver extends FakeNode {
  buffer: unknown = null;
}

class FakeStereoPanner extends FakeNode {
  pan = new FakeParam(0);
}

class FakeBuffer {
  private readonly channels: Float32Array[];

  constructor(channelCount: number, length: number) {
    this.channels = Array.from({ length: channelCount }, () => new Float32Array(length));
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel];
  }
}

class FakeListener {
  lastPosition: [number, number, number] | null = null;

  setPosition(x: number, y: number, z: number): void {
    this.lastPosition = [x, y, z];
  }
}

class FakeContext {
  readonly destination = new FakeNode();
  readonly listener = new FakeListener();
  readonly sampleRate = 44100;
  currentTime = 0;
  state: AudioContextState = 'suspended';
  closed = false;
  readonly nodes: FakeNode[] = [];

  createGain(): FakeGain {
    const node = new FakeGain();
    this.nodes.push(node);
    return node;
  }

  createBiquadFilter(): FakeFilter {
    const node = new FakeFilter();
    this.nodes.push(node);
    return node;
  }

  createPanner(): FakePanner {
    const node = new FakePanner();
    this.nodes.push(node);
    return node;
  }

  createConvolver(): FakeConvolver {
    const node = new FakeConvolver();
    this.nodes.push(node);
    return node;
  }

  createStereoPanner(): FakeStereoPanner {
    const node = new FakeStereoPanner();
    this.nodes.push(node);
    return node;
  }

  createBufferSource(): FakeSource {
    const node = new FakeSource();
    this.nodes.push(node);
    return node;
  }

  createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.nodes.push(node);
    return node;
  }

  createBuffer(channelCount: number, length: number): FakeBuffer {
    return new FakeBuffer(channelCount, length);
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async close(): Promise<void> {
    this.closed = true;
    this.state = 'closed';
  }

  advance(seconds: number): void {
    this.currentTime += seconds;
  }
}

// --- Helpers ----------------------------------------------------------------

function startedOscillators(ctx: FakeContext): number {
  return ctx.nodes.filter(
    (node): node is FakeOscillator => node instanceof FakeOscillator && node.started.length > 0,
  ).length;
}

function startedSources(ctx: FakeContext): number {
  return ctx.nodes.filter(
    (node): node is FakeSource => node instanceof FakeSource && node.started.length > 0,
  ).length;
}

function loopedSources(ctx: FakeContext): FakeSource[] {
  return ctx.nodes.filter(
    (node): node is FakeSource => node instanceof FakeSource && node.loop,
  );
}

function positionsEqual(a: [number, number, number], b: [number, number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function insideBounds(position: [number, number, number]): boolean {
  const b = CAFÉ_BOUNDS;
  return (
    position[0] >= b.minX &&
    position[0] <= b.maxX &&
    position[1] >= b.minY &&
    position[1] <= b.maxY &&
    position[2] >= b.minZ &&
    position[2] <= b.maxZ
  );
}

function run(): void {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  // 1. Every canonical era has a complete audio profile aligned with EraData.
  {
    assert(DEFAULT_ERA === 1945, 'default era is 1945');
    for (const era of ERAS) {
      const profile = getAudioProfile(era);
      assert(profile.era === era, `getAudioProfile(${era}) returns the ${era} profile`);
      assert(
        profile.music.kind === ERA_DATA[era].musicSource.kind,
        `era ${era} music source kind matches EraData (${profile.music.kind})`,
      );
      assert(
        insideBounds(profile.musicPosition),
        `era ${era} music position inside café bounds`,
      );
      assert(
        insideBounds(profile.coffee.position),
        `era ${era} coffee position inside café bounds`,
      );
      assert(
        profile.murmur.level >= 0 && profile.murmur.level <= 1,
        `era ${era} murmur level in [0,1]`,
      );
      assert(
        profile.coffee.hissLevel >= 0 && profile.coffee.hissLevel <= 1,
        `era ${era} hiss level in [0,1]`,
      );
      assert(
        profile.music.bpm > 0 && profile.music.rootFrequency > 0,
        `era ${era} music tempo/root are positive`,
      );
    }
    const kinds = new Set(ERAS.map((era) => AUDIO_ERA_PROFILES[era].music.kind));
    assert(kinds.size >= 5, `music source object changes across eras (${kinds.size} distinct kinds)`);
  }

  // 2. Engine lifecycle: unlock on a simulated gesture, idempotent resume.
  let factoryCalls = 0;
  const ctx = new FakeContext();
  const engine = new AudioEngine({
    audioContextFactory: () => {
      factoryCalls += 1;
      return ctx as unknown as AudioContext;
    },
  });
  assert(engine.activeEra === 1945, 'engine starts on the default era');
  assert(!engine.isUnlocked, 'engine is locked before the first gesture');
  assert(!engine.muted, 'engine starts unmuted');

  void (async () => {
    await engine.unlock();
    assert(factoryCalls === 1, 'unlock creates exactly one AudioContext');
    assert(engine.isUnlocked, 'unlock() marks the engine unlocked');
    assert(ctx.state === 'running', 'AudioContext resumes to running');
    await engine.unlock();
    assert(factoryCalls === 1, 'second unlock reuses the existing context');

    // 3. Audio graph is wired: master -> destination, beds -> master, panners
    //    spatialised at the era's in-scene objects.
    const master = ctx.nodes.find((node) => node.connections.includes(ctx.destination));
    assert(master !== undefined, 'master gain feeds the destination');
    const coffeePanner = ctx.nodes.find(
      (node): node is FakePanner =>
        node instanceof FakePanner && node.connections.includes(master!),
    );
    assert(coffeePanner !== undefined, 'coffee panner feeds the master gain');
    assert(
      coffeePanner !== undefined &&
        positionsEqual(coffeePanner.position, AUDIO_ERA_PROFILES[1945].coffee.position),
      'coffee panner positioned at the 1945 brewing equipment',
    );
    assert(
      coffeePanner !== undefined &&
        coffeePanner.panningModel === 'equalpower' &&
        coffeePanner.distanceModel === 'inverse',
      'panner uses equalpower inverse-distance spatialisation',
    );
    const musicPanner = ctx.nodes.find(
      (node): node is FakePanner =>
        node instanceof FakePanner &&
        positionsEqual(node.position, AUDIO_ERA_PROFILES[1945].musicPosition),
    );
    assert(musicPanner !== undefined, 'music panner positioned at the 1945 wireless set');

    const looped = loopedSources(ctx);
    assert(looped.length >= 2, 'murmur + hiss loop beds are running');
    assert(
      looped.every((source) => source.started.length > 0),
      'every looped bed has started',
    );

    engine.update({ x: 1, y: 2, z: 3 });
    assert(
      ctx.listener.lastPosition !== null && positionsEqual(ctx.listener.lastPosition, [1, 2, 3]),
      'update() keeps the listener at the camera position',
    );

    // 4. Generative music + coffee clatter schedule ahead of the clock.
    const oscBefore = startedOscillators(ctx);
    const sourcesBefore = startedSources(ctx);
    assert(oscBefore >= 2, `music scheduler starts notes (${oscBefore} oscillators)`);
    ctx.advance(2);
    engine.update({ x: 1, y: 2, z: 3 });
    assert(
      startedOscillators(ctx) > oscBefore,
      'music scheduler keeps scheduling as time advances',
    );
    assert(startedSources(ctx) > sourcesBefore, 'coffee clatter/crackle sources are scheduled');

    // 5. Era change crossfades and swaps the source object / character.
    engine.setEra(1965);
    assert(engine.activeEra === 1965, 'setEra switches the active era');
    assert(engine.musicSourceKind === 'jukebox', '1965 music source is a jukebox');
    assert(
      engine.musicSourceLabel.toLowerCase().includes('jukebox'),
      'music source label describes the jukebox',
    );
    engine.update({ x: 1, y: 2, z: 3 });
    assert(
      startedOscillators(ctx) > oscBefore,
      'new era music chain schedules its own generative loop',
    );
    const t0 = 2;
    const crossfade = ctx.nodes.some(
      (node): node is FakeGain =>
        node instanceof FakeGain &&
        node.gain.events.some((e) => e.t >= t0 && e.v === 0) &&
        node.gain.events.some((e) => e.t >= t0 && e.v === 1),
    );
    assert(crossfade, 'era change crossfades the music layers (0 -> 1 -> 0)');
    ctx.advance(2);
    engine.update({ x: 1, y: 2, z: 3 });
    assert(
      engine.musicSourceKind === 'jukebox' && engine.activeEra === 1965,
      'music source stays on the active era after more updates',
    );

    // 6. Mute toggle ramps the master gain.
    engine.setMuted(true);
    assert(engine.muted, 'setMuted(true) reports muted');
    engine.setMuted(false);
    assert(!engine.muted, 'setMuted(false) unmutes');
    assert(
      master instanceof FakeGain && master.gain.events.some((e) => e.v === 0),
      'muting ramps the master gain to silence',
    );

    // 7. Spatial repositioning hooks.
    engine.setCoffeeMachinePosition(1, 2, 3);
    assert(
      coffeePanner !== undefined && positionsEqual(coffeePanner.position, [1, 2, 3]),
      'setCoffeeMachinePosition repositions the coffee panner',
    );
    const activeMusicPanner = ctx.nodes.find(
      (node): node is FakePanner =>
        node instanceof FakePanner &&
        positionsEqual(node.position, AUDIO_ERA_PROFILES[1965].musicPosition),
    );
    assert(
      activeMusicPanner !== undefined,
      'active music panner sits at the 1965 jukebox position after the era switch',
    );
    engine.setMusicPosition(-2, 1, 1);
    assert(
      activeMusicPanner !== undefined &&
        positionsEqual(activeMusicPanner.position, [-2, 1, 1]),
      'setMusicPosition repositions the music panner',
    );

    // 8. Era can be selected before unlock; it is applied on unlock.
    {
      let factoryCalls2 = 0;
      const ctx2 = new FakeContext();
      const engine2 = new AudioEngine({
        initialEra: 2005,
        audioContextFactory: () => {
          factoryCalls2 += 1;
          return ctx2 as unknown as AudioContext;
        },
      });
      assert(engine2.activeEra === 2005, 'initialEra is honoured');
      engine2.setEra(2025);
      assert(engine2.activeEra === 2025, 'setEra before unlock updates the active era');
      await engine2.unlock();
      assert(engine2.musicSourceKind === 'streaming-speaker', 'pre-unlock era applied on unlock');
      const master2 = ctx2.nodes.find((node) => node.connections.includes(ctx2.destination));
      assert(master2 !== undefined, 'second engine builds its own graph');
      engine2.dispose();
      assert(ctx2.closed, 'dispose() closes the AudioContext');
      assert(!engine2.isUnlocked, 'dispose() relocks the engine');
    }

    // 9. dispose() stops every looped bed.
    engine.dispose();
    assert(ctx.closed, 'dispose() closes the primary AudioContext');
    assert(!engine.isUnlocked, 'dispose() relocks the primary engine');
    assert(
      loopedSources(ctx).every((source) => source.stopped.length > 0),
      'dispose() stops every looped bed',
    );

    if (failures > 0) {
      console.error(`\nAudio engine check FAILED: ${failures} assertion(s)`);
      process.exitCode = 1;
    } else {
      console.log('\nAll audio engine assertions passed.');
    }
  })();
}

void run();
