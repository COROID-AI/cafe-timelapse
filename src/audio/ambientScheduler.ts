import { ERA_MAP } from '../data/eras';
import type { Era, EraId } from '../types';
import {
  playBell,
  playChatter,
  playClatter,
  playEraPhrase,
  playFroth,
  playMurmur,
  playPour,
  playSteamHiss,
  type AudioBus,
} from './audioEngine';

export interface AmbientScheduler {
  start: () => void;
  stop: () => void;
  setEra: (era: EraId) => void;
  setVolume: (v: number) => void;
  /** Schedule a burst of café SFX (hiss, pour, clatter). */
  scheduleSfx: () => void;
}

/**
 * Schedules looping, era-aware ambient audio with Web Audio clocks.
 * The music is a short melodic phrase that repeats, the murmur is a
 * continuous low bed, and café SFX fire on randomized intervals.
 */
export function createAmbientScheduler(bus: AudioBus): AmbientScheduler {
  let era: Era = ERA_MAP.e2025;
  let running = false;
  let musicTimer: number | null = null;
  let sfxTimer: number | null = null;
  let murmurTimer: number | null = null;

  const scheduleMusic = () => {
    if (!running) return;
    playEraPhrase(bus, era, 0);
    const bpm = era.music.tempo;
    const phraseBeats = 12;
    const ms = ((phraseBeats * 60) / bpm) * 1000;
    musicTimer = window.setTimeout(scheduleMusic, ms);
  };

  const scheduleSfxLoop = () => {
    if (!running) return;
    playSfxBurst();
    const ms = 4000 + Math.random() * 6000;
    sfxTimer = window.setTimeout(scheduleSfxLoop, ms);
  };

  const playSfxBurst = () => {
    if (!running) return;
    const pick = Math.random();
    if (pick < 0.3) {
      playSteamHiss(bus);
      playPour(bus, 0.35);
    } else if (pick < 0.6) {
      playClatter(bus);
      playFroth(bus, 0.5);
    } else if (pick < 0.8) {
      playSteamHiss(bus);
      playClatter(bus, 0.8);
    } else {
      playBell(bus);
    }
  };

  const scheduleMurmur = () => {
    if (!running) return;
    const dur = 4.5 + Math.random() * 3;
    playChatter(bus, dur);
    murmurTimer = window.setTimeout(scheduleMurmur, dur * 1000);
  };

  const start = () => {
    if (running) return;
    running = true;
    playMurmur(bus, 2.5, 0);
    scheduleMusic();
    scheduleSfxLoop();
    scheduleMurmur();
  };

  const stop = () => {
    running = false;
    if (musicTimer !== null) window.clearTimeout(musicTimer);
    if (sfxTimer !== null) window.clearTimeout(sfxTimer);
    if (murmurTimer !== null) window.clearTimeout(murmurTimer);
    musicTimer = null;
    sfxTimer = null;
    murmurTimer = null;
  };

  return {
    start,
    stop,
    setEra: (next) => {
      era = ERA_MAP[next];
    },
    setVolume: (v) => {
      bus.musicGain.gain.setTargetAtTime(0.7 * v, bus.ctx.currentTime, 0.1);
      bus.sfxGain.gain.setTargetAtTime(0.85 * v, bus.ctx.currentTime, 0.1);
    },
    scheduleSfx: () => {
      playSfxBurst();
    },
  };
}
