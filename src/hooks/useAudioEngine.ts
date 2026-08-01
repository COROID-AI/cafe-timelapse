import { useCallback, useEffect, useRef, useState } from 'react';
import type { EraConfig } from '../types/era';

interface EngineRefs {
  ctx: AudioContext | null;
  master: GainNode | null;
  musicGain: GainNode | null;
  ambienceGain: GainNode | null;
  nodes: { stop: () => void }[];
  interval: number | null;
}

/**
 * Generative per-era audio engine.
 *
 * - The AudioContext is created lazily on the first user gesture only
 *   (autoplay policies require it): `unlock()` is the only entry point
 *   that creates the context; `playForEra`/`startAmbience` are no-ops
 *   before the first gesture.
 * - Music is a small generative loop built from an era's mood: chord pads
 *   plus a gentle melodic pattern seeded by the era.
 * - Ambience adds a filtered noise bed (conversation murmur) and periodic
 *   coffee-machine hiss/clatter bursts.
 * - Mute toggles the master gain; all nodes/timers are torn down on unmount.
 */
export function useAudioEngine() {
  const [muted, setMuted] = useState(false);
  const refs = useRef<EngineRefs>({
    ctx: null,
    master: null,
    musicGain: null,
    ambienceGain: null,
    nodes: [],
    interval: null,
  });
  const mutedRef = useRef(false);
  const unlockedRef = useRef(false);
  const pendingEraRef = useRef<EraConfig | null>(null);

  const stopNodes = useCallback(() => {
    const r = refs.current;
    r.nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    });
    r.nodes = [];
    if (r.interval !== null) {
      window.clearInterval(r.interval);
      r.interval = null;
    }
  }, []);

  const createContext = useCallback((): AudioContext | null => {
    const r = refs.current;
    if (r.ctx) {
      return r.ctx;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    const ctx = new Ctor();
    r.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.9;
    master.connect(ctx.destination);
    r.master = master;

    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(master);
    r.musicGain = musicGain;

    const ambienceGain = ctx.createGain();
    ambienceGain.gain.value = 0.16;
    ambienceGain.connect(master);
    r.ambienceGain = ambienceGain;
    return ctx;
  }, []);

  const note = useCallback(
    (ctx: AudioContext, out: GainNode, freq: number, start: number, dur: number, type: OscillatorType, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(out);
      osc.start(start);
      osc.stop(start + dur + 0.05);
      refs.current.nodes.push(osc);
    },
    [],
  );

  const startEraMusic = useCallback(
    (era: EraConfig) => {
      const r = refs.current;
      const ctx = r.ctx;
      if (!ctx || !r.musicGain) {
        return;
      }
      stopNodes();
      const out = r.musicGain;
      // Pick a scale/mood from the era seed.
      const base = 196 + (era.seed % 5) * 16; // G3-ish region
      const roots = [1, 1.25, 1.5, 2];
      const padTypes: OscillatorType[] = ['sine', 'triangle'];
      const now = ctx.currentTime;
      // Drone pad: soft fifth.
      note(ctx, out, base, now, 8, padTypes[era.seed % 2], 0.045);
      note(ctx, out, base * 1.5, now, 8, padTypes[(era.seed + 1) % 2], 0.03);
      // Gentle melodic plucks seeded by the era.
      const step = era.seed % 2 === 0 ? 0.42 : 0.5;
      const melody = [1, 1.25, 1.5, 1.33, 1, 1.5, 1.78, 2];
      for (let i = 0; i < 8; i++) {
        const idx = (era.seed + i * 3) % melody.length;
        const f = base * roots[era.seed % roots.length] * melody[idx];
        note(ctx, out, f, now + 0.1 + i * step, 0.9, 'sine', 0.035);
      }
      // Schedule a repeating gentle arpeggio while the era plays.
      let beat = 0;
      r.interval = window.setInterval(() => {
        const c = refs.current.ctx;
        if (!c) {
          return;
        }
        const t = c.currentTime + 0.05;
        const idx = (era.seed + beat * 5) % melody.length;
        const f = base * melody[idx];
        note(c, out, f, t, 0.6, 'sine', 0.02);
        beat += 1;
      }, 900);
    },
    [note, stopNodes],
  );

  const startAmbience = useCallback(() => {
    const r = refs.current;
    const ctx = r.ctx;
    if (!ctx || !r.ambienceGain) {
      return;
    }
    const out = r.ambienceGain;
    const now = ctx.currentTime;

    // Conversation murmur: filtered noise.
    const len = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      // Simple one-pole low-pass to dull the noise into a murmur.
      last = last * 0.985 + white * 0.015;
      data[i] = last * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(lp);
    lp.connect(g);
    g.connect(out);
    src.start(now);
    refs.current.nodes.push(src);

    // Coffee machine hiss / clatter bursts.
    const burst = () => {
      const c = refs.current.ctx;
      if (!c) {
        return;
      }
      const t = c.currentTime;
      const len2 = 0.5;
      const b = c.createBuffer(1, c.sampleRate * len2, c.sampleRate);
      const d = b.getChannelData(0);
      let l2 = 0;
      for (let i = 0; i < d.length; i++) {
        const white = Math.random() * 2 - 1;
        l2 = l2 * 0.92 + white * 0.08;
        d[i] = l2 * 0.6;
      }
      const s = c.createBufferSource();
      s.buffer = b;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2400;
      const bg = c.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + len2);
      s.connect(hp);
      hp.connect(bg);
      bg.connect(out);
      s.start(t);
      refs.current.nodes.push(s);
    };
    burst();
    const iv = window.setInterval(burst, 5200 + (Math.random() * 1800));
    r.interval = iv;
  }, []);

  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      return;
    }
    unlockedRef.current = true;
    const ctx = createContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
    startAmbience();
    if (pendingEraRef.current) {
      const era = pendingEraRef.current;
      pendingEraRef.current = null;
      if (!mutedRef.current) {
        startEraMusic(era);
      }
    }
  }, [createContext, startAmbience, startEraMusic]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      const r = refs.current;
      if (r.master) {
        r.master.gain.setTargetAtTime(next ? 0 : 0.9, r.ctx?.currentTime ?? 0, 0.02);
      }
      return next;
    });
  }, []);

  const playForEra = useCallback(
    (era: EraConfig) => {
      if (!unlockedRef.current) {
        // Remember the era so music starts on the first gesture.
        pendingEraRef.current = era;
        return;
      }
      if (!mutedRef.current) {
        startEraMusic(era);
      }
    },
    [startEraMusic],
  );

  useEffect(() => {
    const r = refs.current;
    return () => {
      stopNodes();
      if (r.ctx) {
        void r.ctx.close().catch(() => undefined);
        r.ctx = null;
      }
    };
  }, [stopNodes]);

  return { muted, toggleMute, unlock, playForEra, startAmbience };
}
