import type { Era } from '../types';

/** Tempo map (BPM) used to scale all era music; swing-era feels quicker. */
export function eraBpm(era: Era): number {
  return era.music.tempo;
}

/** Musical note frequency helpers. */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface AudioBus {
  ctx: AudioContext;
  master: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
}

/**
 * Create the audio graph. No nodes start until resume() is called.
 * All sounds are synthesized procedurally — no external assets.
 */
export function createAudioBus(): AudioBus {
  const Ctx: typeof AudioContext =
    typeof window !== 'undefined'
      ? window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : (undefined as unknown as typeof AudioContext);

  if (!Ctx) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.0;
  const musicGain = ctx.createGain();
  musicGain.gain.value = 0.7;
  const sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.85;

  musicGain.connect(master);
  sfxGain.connect(master);
  master.connect(ctx.destination);

  return { ctx, master, musicGain, sfxGain };
}

export function resumeBus(bus: AudioBus): void {
  if (bus.ctx.state === 'suspended') {
    void bus.ctx.resume();
  }
  const now = bus.ctx.currentTime;
  bus.master.gain.cancelScheduledValues(now);
  bus.master.gain.setTargetAtTime(0.9, now, 0.15);
}

export function suspendBus(bus: AudioBus): void {
  const now = bus.ctx.currentTime;
  bus.master.gain.cancelScheduledValues(now);
  bus.master.gain.setTargetAtTime(0.0, now, 0.1);
}

function playTone(
  bus: AudioBus,
  opts: {
    freq: number;
    type?: OscillatorType;
    start?: number;
    dur: number;
    gain?: number;
    dest?: AudioNode;
    glideTo?: number;
    glideTime?: number;
  },
): void {
  const { ctx } = bus;
  const start = opts.start ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.glideTo !== undefined && opts.glideTime !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.glideTo), start + opts.glideTime);
  }
  const g = ctx.createGain();
  const peak = opts.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + opts.dur);
  osc.connect(g);
  g.connect(opts.dest ?? bus.sfxGain);
  osc.start(start);
  osc.stop(start + opts.dur + 0.05);
}

function noiseBurst(
  bus: AudioBus,
  opts: {
    start?: number;
    dur: number;
    gain?: number;
    freq?: number;
    q?: number;
    dest?: AudioNode;
  },
): void {
  const { ctx } = bus;
  const start = opts.start ?? ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * opts.dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = opts.freq ?? 2200;
  filter.Q.value = opts.q ?? 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(opts.gain ?? 0.18, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + opts.dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(opts.dest ?? bus.sfxGain);
  src.start(start);
}

/** Coffee machine hiss — a filtered noise swell. */
export function playSteamHiss(bus: AudioBus, at = 0): void {
  noiseBurst(bus, { start: bus.ctx.currentTime + at, dur: 1.4, gain: 0.09, freq: 5200, q: 0.5 });
}

/** Espresso pour — descending gurgle. */
export function playPour(bus: AudioBus, at = 0): void {
  const t = bus.ctx.currentTime + at;
  playTone(bus, { freq: 420, glideTo: 140, glideTime: 0.4, dur: 0.5, gain: 0.08, type: 'triangle', start: t });
  noiseBurst(bus, { start: t, dur: 0.45, gain: 0.06, freq: 800, q: 1.4 });
}

/** Cup clatter. */
export function playClatter(bus: AudioBus, at = 0): void {
  const t = bus.ctx.currentTime + at;
  playTone(bus, { freq: 2100, dur: 0.09, gain: 0.05, type: 'triangle', start: t });
  playTone(bus, { freq: 2900, dur: 0.07, gain: 0.035, type: 'triangle', start: t + 0.02 });
  noiseBurst(bus, { start: t, dur: 0.08, gain: 0.03, freq: 4000, q: 2 });
}

/** Milk froth — a soft hiss with a rising pitch. */
export function playFroth(bus: AudioBus, at = 0): void {
  noiseBurst(bus, { start: bus.ctx.currentTime + at, dur: 0.8, gain: 0.07, freq: 3500, q: 0.9 });
}

/** Door bell ding. */
export function playBell(bus: AudioBus, at = 0): void {
  const t = bus.ctx.currentTime + at;
  playTone(bus, { freq: 1318, dur: 0.5, gain: 0.07, type: 'sine', start: t });
  playTone(bus, { freq: 1976, dur: 0.4, gain: 0.045, type: 'sine', start: t + 0.02 });
}

/** A warm chord pad for a moment of music. */
export function playChord(bus: AudioBus, freqs: number[], dur: number, at = 0, gain = 0.05): void {
  const t = bus.ctx.currentTime + at;
  for (const f of freqs) {
    playTone(bus, { freq: f, dur, gain, type: 'sine', start: t, dest: bus.musicGain });
  }
}

/** Two-bar melodic phrase for the era, parameterized by tempo & mode. */
export function playEraPhrase(bus: AudioBus, era: Era, at = 0): void {
  const t = bus.ctx.currentTime + at;
  const bpm = eraBpm(era);
  const beat = 60 / bpm;
  const root = era.id === 'e1985' || era.id === 'e2055' ? 45 : 50;
  const phrase = eraPhraseFor(era.id, root);
  for (const n of phrase) {
    if (n.freq > 0) {
      playTone(bus, {
        freq: n.freq,
        dur: n.dur * beat * 1.8,
        gain: n.gain ?? 0.07,
        type: era.id === 'e1985' || era.id === 'e2055' ? 'sawtooth' : 'sine',
        start: t + n.start * beat,
        dest: bus.musicGain,
      });
    } else {
      noiseBurst(bus, {
        start: t + n.start * beat,
        dur: n.dur * beat,
        gain: 0.03,
        freq: era.id === 'e1985' ? 2500 : 1400,
        q: 1,
        dest: bus.musicGain,
      });
    }
  }
  // soft bass root pulse
  playTone(bus, {
    freq: midiToFreq(root - 12),
    dur: beat * 4,
    gain: 0.05,
    type: 'triangle',
    start: t,
    dest: bus.musicGain,
  });
}

interface Note {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
}

function phraseScale(rootMidi: number): number[] {
  const scale = [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5];
  return scale.map((s) => midiToFreq(rootMidi + s));
}

function eraPhraseFor(era: Era['id'], root: number): Note[] {
  const scale = phraseScale(root);
  const notes: Note[] = [];
  const step = (i: number, start: number, dur = 1, gain?: number) => {
    notes.push({ freq: scale[i % scale.length], start, dur, gain });
  };
  switch (era) {
    case 'e1945':
      step(0, 0, 1.5);
      step(2, 1.5, 1);
      step(4, 2.5, 1);
      step(5, 3.5, 2);
      step(4, 5.5, 1);
      step(2, 6.5, 1.5);
      step(1, 8, 1);
      step(2, 9, 1);
      step(0, 10, 2);
      break;
    case 'e1965':
      step(0, 0, 1);
      step(1, 1, 1);
      step(2, 2, 1.5);
      step(1, 3.5, 0.5);
      step(2, 4, 1);
      step(4, 5, 1);
      step(2, 6, 1.5);
      step(1, 7.5, 0.5);
      step(0, 8, 2);
      break;
    case 'e1985':
      step(0, 0, 0.5);
      step(0, 0.5, 0.5);
      step(2, 1, 0.5);
      step(2, 1.5, 0.5);
      step(4, 2, 1);
      step(2, 3, 0.5);
      step(4, 3.5, 0.5);
      step(5, 4, 1.5);
      step(4, 5.5, 0.5);
      step(2, 6, 1);
      step(0, 7, 1);
      step(0, 8, 2);
      break;
    case 'e2005':
      step(0, 0, 1);
      step(2, 1, 1);
      step(4, 2, 1.5);
      step(5, 3.5, 0.5);
      step(4, 4, 1);
      step(2, 5, 1);
      step(1, 6, 1);
      step(2, 7, 1);
      step(4, 8, 2);
      break;
    case 'e2025':
      step(0, 0, 1.5);
      step(3, 1.5, 1);
      step(2, 2.5, 0.5);
      step(1, 3, 0.5);
      step(0, 4, 1.5);
      step(1, 5.5, 1);
      step(2, 6.5, 1.5);
      step(3, 8, 2);
      break;
    case 'e2055':
      step(0, 0, 2);
      step(5, 2, 1.5);
      step(7, 3.5, 1);
      step(5, 4.5, 1);
      step(4, 5.5, 1);
      step(2, 6.5, 1.5);
      step(0, 8, 2);
      step(9, 10, 1);
      break;
  }
  return notes;
}

/** Random ambient murmur — a low filtered noise bed with slow swells. */
export function playMurmur(bus: AudioBus, dur: number, at = 0): void {
  const { ctx } = bus;
  const start = ctx.currentTime + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    phase += 0.4 + 0.5 * Math.sin(i / 6000);
    data[i] = (Math.random() * 2 - 1) * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(i / 9000))) * 0.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 480;
  filter.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.05, start + 1.5);
  g.gain.setValueAtTime(0.05, start + dur - 1.5);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(bus.sfxGain);
  src.start(start);
  src.stop(start + dur + 0.1);
}

/** Era-appropriate background chatter (filtered noise + a few soft tones). */
export function playChatter(bus: AudioBus, dur: number): void {
  playMurmur(bus, dur);
  const t = bus.ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    playTone(bus, {
      freq: 180 + Math.random() * 160,
      dur: 0.08 + Math.random() * 0.08,
      gain: 0.012,
      type: 'sine',
      start: t + Math.random() * dur * 0.5,
    });
  }
}
