// Audio Manager with Era-Specific Playback & Crossfading
// Central Web Audio system for period music, era-specific ambient noise, and SFX.
//
// Expected integration:
//  - Import and instantiate: const audioManager = new AudioManager({ periodManager });
//  - The manager subscribes to PeriodManager's onEraChange event and crossfades when eras switch.
//
// Audio assets (preferred):
//  - Music: public/assets/audio/{era}/
//  - Ambient: public/assets/audio/{era}/ambient/
//  - SFX: public/assets/audio/sfx/
//
// If assets are missing/unavailable (e.g., in sandboxed environments), the manager falls back to
// procedural Web Audio sources so that the experience still works.

export default class AudioManager {
  /**
   * @param {{
   *   periodManager: { onEraChange: (cb: (era:any)=>void)=>void },
   *   initialEraYear?: number,
   *   crossfadeDurationMs?: number,
   *   userGestureToStart?: boolean
   * }} config
   */
  constructor(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('AudioManager: config is required');
    }
    const { periodManager, initialEraYear, crossfadeDurationMs = 1800, userGestureToStart = true } = config;
    if (!periodManager || typeof periodManager.onEraChange !== 'function') {
      throw new Error('AudioManager: periodManager with onEraChange(callback) is required');
    }

    /** @type {any} */
    this._periodManager = periodManager;

    this._crossfadeDurationMs = crossfadeDurationMs;

    // Gains (volume controls) - all are multipliers (0..1) applied to their respective channels
    this._musicGain = null;
    this._sfxGain = null;
    this._ambientGain = null;

    this._master = null;

    // We need two music layers to crossfade.
    this._musicLayers = [this._createMusicLayer(), this._createMusicLayer()];
    this._activeMusicLayerIndex = 0;

    // Ambient and SFX are single-layer (no crossfade required; ambient is faded).
    this._ambient = {
      current: { sourceNode: null, gain: null, stopFn: null, isProcedural: false, eraKey: null },
      next: { sourceNode: null, gain: null, stopFn: null, isProcedural: false, eraKey: null }
    };

    this._sfx = {
      loaded: new Map(), // key -> AudioBuffer
      lastPlayAt: new Map() // key -> number (throttle)
    };

    /**
     * Era-specific bookkeeping
     * @type {{ eraKey: string, music: any, ambientNoise: string }}
     */
    this._currentEraAudio = null;

    this._isStarted = false;
    this._isStarting = false;

    // When autoplay is blocked, we wait for user gesture.
    this._userGestureToStart = userGestureToStart;

    // Bind handlers
    this._boundStartOnGesture = () => {
      this.start().catch(() => {
        // Ignore startup failure (autoplay policy, etc.)
      });
      window.removeEventListener('pointerdown', this._boundStartOnGesture);
      window.removeEventListener('keydown', this._boundStartOnGesture);
    };

    // Subscribe to era changes
    this._periodManager.onEraChange((era) => {
      // Fire and forget; we never throw from event handlers.
      this._handleEraChange(era).catch(() => {
        // Intentionally ignore; audio should never break the app.
      });
    });

    // Optionally, start immediately if not requiring user gesture.
    if (!this._userGestureToStart) {
      this.start().catch(() => {
        // ignore
      });
    } else {
      window.addEventListener('pointerdown', this._boundStartOnGesture, { once: false });
      window.addEventListener('keydown', this._boundStartOnGesture, { once: false });
    }

    // Initialize volumes with sensible defaults.
    this.setMusicVolume(0.6);
    this.setSfxVolume(0.7);
    this.setAmbientVolume(0.35);

    // If an initial era is provided, try to prime.
    if (typeof initialEraYear === 'number') {
      // We can't set era directly because PeriodManager drives it; but we can eagerly prepare audio.
      this._primeEraAudio(String(initialEraYear)).catch(() => {
        // ignore
      });
    }
  }

  /**
   * Ensure AudioContext and nodes are created.
   * @returns {Promise<void>}
   */
  async start() {
    if (this._isStarted || this._isStarting) return;
    this._isStarting = true;

    try {
      if (!this._audioContext) {
        // eslint-disable-next-line no-undef
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          throw new Error('Web Audio API is not supported in this browser.');
        }
        this._audioContext = new AudioCtx();

        // Master gain allows overall pause/stop safety.
        this._master = this._audioContext.createGain();
        this._master.gain.value = 1;
        this._master.connect(this._audioContext.destination);

        // Channel gains
        this._musicGain = this._audioContext.createGain();
        this._sfxGain = this._audioContext.createGain();
        this._ambientGain = this._audioContext.createGain();

        this._musicGain.gain.value = 0.6;
        this._sfxGain.gain.value = 0.7;
        this._ambientGain.gain.value = 0.35;

        this._musicGain.connect(this._master);
        this._sfxGain.connect(this._master);
        this._ambientGain.connect(this._master);

        // Some browsers require resuming.
        if (this._audioContext.state === 'suspended') {
          await this._audioContext.resume();
        }

        // Ensure layers connect to channel gain
        for (const layer of this._musicLayers) {
          if (!layer.gain) {
            layer.gain = this._audioContext.createGain();
            layer.gain.gain.value = 0;
            layer.gain.connect(this._musicGain);
          }
        }
      } else if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

      this._isStarted = true;
    } finally {
      this._isStarting = false;
    }
  }

  /**
   * @param {number} value 0..1
   */
  setMusicVolume(value) {
    const v = this._clamp01(value);
    if (this._musicGain) this._musicGain.gain.value = v;
  }

  /**
   * @param {number} value 0..1
   */
  setSfxVolume(value) {
    const v = this._clamp01(value);
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }

  /**
   * @param {number} value 0..1
   */
  setAmbientVolume(value) {
    const v = this._clamp01(value);
    if (this._ambientGain) this._ambientGain.gain.value = v;
  }

  /**
   * @returns {number}
   */
  getMusicVolume() {
    return this._musicGain ? this._musicGain.gain.value : 0.6;
  }

  /**
   * @returns {number}
   */
  getSfxVolume() {
    return this._sfxGain ? this._sfxGain.gain.value : 0.7;
  }

  /**
   * @returns {number}
   */
  getAmbientVolume() {
    return this._ambientGain ? this._ambientGain.gain.value : 0.35;
  }

  /**
   * Subscribe volumes to existing DOM sliders if present.
   * This function is optional; it won't fail if elements are absent.
   */
  bindVolumeSliders() {
    const bind = (id, setter) => {
      const el = document.getElementById(id);
      if (!el) return;
      const update = () => {
        const raw = Number(el.value);
        if (Number.isFinite(raw)) setter(raw / 100);
      };
      el.addEventListener('input', update);
      update();
    };

    bind('music-volume', (v) => this.setMusicVolume(v));
    bind('sfx-volume', (v) => this.setSfxVolume(v));
    bind('ambient-volume', (v) => this.setAmbientVolume(v));
  }

  /**
   * @param {any} era
   */
  async _handleEraChange(era) {
    if (!era || typeof era !== 'object') return;

    // Ensure WebAudio started.
    await this.start();

    const eraYear = era.year;
    const eraKey = this._eraKeyFromYear(eraYear);

    // Determine music + ambient metadata from era contract
    const musicMeta = era.audio?.music;
    const sfxMeta = era.audio?.sfx;
    const ambientNoise = era.audio?.ambientNoise;

    if (!musicMeta || typeof musicMeta !== 'object') {
      throw new Error('AudioManager: era.audio.music is required');
    }
    if (!Array.isArray(sfxMeta)) {
      throw new Error('AudioManager: era.audio.sfx must be an array');
    }
    if (typeof ambientNoise !== 'string') {
      throw new Error('AudioManager: era.audio.ambientNoise must be a string');
    }

    this._currentEraAudio = { eraKey, music: musicMeta, ambientNoise };

    // Crossfade music (two layers)
    await this._crossfadeToEraMusic({ era, eraKey, musicMeta });

    // Ambient: fade out previous, then fade in new.
    await this._switchAmbientForEra({ eraKey, ambientNoise });

    // Prime SFX: attempt to load a handful of SFX buffers; failures are non-fatal.
    // Also play a light ambient SFX if desired (we keep it subtle; no autoplay for each click).
    void this._primeEraSfx({ eraKey, sfxMeta }).catch(() => {
      // ignore
    });
  }

  /**
   * @param {{era:any, eraKey:string, musicMeta:any}} param0
   */
  async _crossfadeToEraMusic({ era, eraKey, musicMeta }) {
    const nextIndex = (this._activeMusicLayerIndex + 1) % this._musicLayers.length;
    const nextLayer = this._musicLayers[nextIndex];
    const currentLayer = this._musicLayers[this._activeMusicLayerIndex];

    // Ensure next layer has source.
    await this._ensureMusicLayerForEra(nextLayer, { eraKey, musicMeta });

    // Crossfade: current -> 0, next -> desired.
    const now = this._audioContext.currentTime;
    const fadeSeconds = this._crossfadeDurationMs / 1000;
    const desiredVolume = this._clamp01(Number(musicMeta.volume) || 0.5);

    // Cancel scheduled values
    nextLayer.gain.gain.cancelScheduledValues(now);
    currentLayer.gain.gain.cancelScheduledValues(now);

    nextLayer.gain.gain.setValueAtTime(nextLayer.gain.gain.value, now);
    currentLayer.gain.gain.setValueAtTime(currentLayer.gain.gain.value, now);

    nextLayer.gain.gain.linearRampToValueAtTime(desiredVolume * this.getMusicVolume(), now + fadeSeconds);
    currentLayer.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);

    // Stop current layer source after fade.
    window.setTimeout(() => {
      this._stopMusicLayerSource(currentLayer);
    }, Math.max(0, this._crossfadeDurationMs - 50));

    this._activeMusicLayerIndex = nextIndex;
  }

  /**
   * @param {{ eraKey: string, musicMeta: any }} param0
   */
  async _ensureMusicLayerForEra(layer, { eraKey, musicMeta }) {
    // If layer already has correct era, reuse.
    if (layer.eraKey === eraKey && layer.isReady) {
      return;
    }

    // Stop any existing source.
    this._stopMusicLayerSource(layer);

    layer.eraKey = eraKey;
    layer.isReady = false;

    // Preferred: load an audio file from public/assets/audio/{era}/
    // We intentionally do not depend on a specific filename to keep assets flexible.
    // Expected conventions (if present):
    //  - music.mp3 / music.ogg / music.wav
    //  - playlist.* (first matching)
    const preferredFilenames = [
      'music.mp3',
      'music.ogg',
      'music.wav',
      'track.mp3',
      'track.ogg',
      'track.wav',
      'playlist.mp3',
      'playlist.ogg',
      'playlist.wav'
    ];

    const candidates = preferredFilenames.map((name) => `/assets/audio/${eraKey}/${name}`);

    const buffer = await this._tryLoadFirstAudioBuffer(candidates);
    if (buffer) {
      const source = this._audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(layer.gain);
      source.start();
      layer.sourceNode = source;
      layer.isProcedural = false;
      layer.isReady = true;
      return;
    }

    // Fallback: procedural music based on musicMeta.type
    const type = typeof musicMeta.type === 'string' ? musicMeta.type : '';
    const procedural = this._createProceduralMusicSource({ type, eraKey });
    procedural.node.connect(layer.gain);
    layer.sourceNode = procedural.node;
    layer.isProcedural = true;
    layer.isReady = true;
  }

  _createMusicLayer() {
    return {
      eraKey: null,
      gain: null,
      sourceNode: null,
      isProcedural: false,
      isReady: false
    };
  }

  _stopMusicLayerSource(layer) {
    try {
      if (layer && layer.sourceNode) {
        // BufferSource cannot be stopped twice.
        if (typeof layer.sourceNode.stop === 'function') {
          layer.sourceNode.stop();
        }
        if (layer.sourceNode.disconnect) layer.sourceNode.disconnect();
      }
    } catch {
      // ignore
    } finally {
      if (layer) {
        layer.sourceNode = null;
        layer.isProcedural = false;
        layer.isReady = false;
        if (layer.gain) layer.gain.gain.value = 0;
      }
    }
  }

  /**
   * @param {{eraKey:string, ambientNoise:string}} param0
   */
  async _switchAmbientForEra({ eraKey, ambientNoise }) {
    const now = this._audioContext.currentTime;
    const fadeSeconds = this._crossfadeDurationMs / 1000;

    // If ambient is already correct and active, do nothing.
    if (this._ambient.current.eraKey === eraKey) return;

    // Fade out current immediately.
    if (this._ambient.current.gain && typeof this._ambient.current.gain.gain !== 'undefined') {
      this._ambient.current.gain.gain.cancelScheduledValues(now);
      this._ambient.current.gain.gain.setValueAtTime(this._ambient.current.gain.gain.value, now);
      this._ambient.current.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);

      window.setTimeout(() => {
        this._stopAmbientSource(this._ambient.current);
      }, Math.max(0, this._crossfadeDurationMs - 50));
    }

    // Prepare next ambient gain + source.
    const nextGain = this._audioContext.createGain();
    nextGain.gain.value = 0;
    nextGain.connect(this._ambientGain);

    const nextAmbient = {
      sourceNode: null,
      gain: nextGain,
      stopFn: null,
      isProcedural: false,
      eraKey
    };

    // Try load ambient audio file from public/assets/audio/{era}/ambient/
    // Convention: ambient.* or ambientNoise.*
    const normalizedNoise = this._normalizeNoiseKey(ambientNoise);
    const candidates = [
      `/assets/audio/${eraKey}/ambient/ambient.mp3`,
      `/assets/audio/${eraKey}/ambient/ambient.ogg`,
      `/assets/audio/${eraKey}/ambient/ambient.wav`,
      `/assets/audio/${eraKey}/ambient/${normalizedNoise}.mp3`,
      `/assets/audio/${eraKey}/ambient/${normalizedNoise}.ogg`,
      `/assets/audio/${eraKey}/ambient/${normalizedNoise}.wav`
    ];

    const buffer = await this._tryLoadFirstAudioBuffer(candidates);
    if (buffer) {
      const source = this._audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(nextGain);
      source.start();

      nextAmbient.sourceNode = source;
      nextAmbient.isProcedural = false;
      nextAmbient.stopFn = () => {
        try {
          source.stop();
        } catch {
          // ignore
        }
      };
    } else {
      // Procedural fallback: layered filtered noise with low-frequency tremolo.
      const procedural = this._createProceduralAmbient({ eraKey, ambientNoise });
      procedural.node.connect(nextGain);
      nextAmbient.sourceNode = procedural.node;
      nextAmbient.isProcedural = true;
      nextAmbient.stopFn = () => {
        try {
          procedural.stop?.();
        } catch {
          // ignore
        }
      };
    }

    this._ambient.next = nextAmbient;

    // Fade in
    nextGain.gain.cancelScheduledValues(now);
    nextGain.gain.setValueAtTime(nextGain.gain.value, now);
    const target = this.getAmbientVolume() * 1.0;
    nextGain.gain.linearRampToValueAtTime(target, now + fadeSeconds);

    this._ambient.current = nextAmbient;
  }

  _stopAmbientSource(ambient) {
    try {
      if (!ambient) return;
      if (ambient.stopFn) ambient.stopFn();
      if (ambient.sourceNode && ambient.sourceNode.disconnect) ambient.sourceNode.disconnect();
    } catch {
      // ignore
    }
  }

  /**
   * @param {{eraKey:string, sfxMeta:Array<{type:string,id:any}>}} param0
   */
  async _primeEraSfx({ eraKey, sfxMeta }) {
    // Load a small subset - we don't want to fetch everything.
    const toLoad = sfxMeta.slice(0, 6);

    // Map each sfx to a key, and attempt to preload.
    await Promise.all(
      toLoad.map(async (sfx) => {
        const key = `${eraKey}:${sfx.type}:${String(sfx.id)}`;
        if (this._sfx.loaded.has(key)) return;

        // Prefer era-specific SFX folders? Spec says public/assets/audio/sfx/.
        const candidates = this._sfxCandidatePaths(sfx);
        const buffer = await this._tryLoadFirstAudioBuffer(candidates);
        if (buffer) this._sfx.loaded.set(key, buffer);
      })
    );
  }

  _sfxCandidatePaths(sfx) {
    const id = String(sfx.id);
    const normalized = this._normalizeNoiseKey(id);

    // We support several naming conventions.
    //  - /assets/audio/sfx/<id>.mp3
    //  - /assets/audio/sfx/<type>/<id>.mp3
    //  - /assets/audio/sfx/<type>-<id>.mp3
    const base = '/assets/audio/sfx';
    return [
      `${base}/${id}.mp3`,
      `${base}/${id}.ogg`,
      `${base}/${id}.wav`,
      `${base}/${normalized}.mp3`,
      `${base}/${normalized}.ogg`,
      `${base}/${normalized}.wav`,
      `${base}/${sfx.type}/${id}.mp3`,
      `${base}/${sfx.type}/${id}.ogg`,
      `${base}/${sfx.type}/${id}.wav`,
      `${base}/${sfx.type}-${id}.mp3`,
      `${base}/${sfx.type}-${id}.ogg`,
      `${base}/${sfx.type}-${id}.wav`
    ];
  }

  /**
   * Attempt to load first working audio buffer among candidates.
   * @param {string[]} urls
   * @returns {Promise<AudioBuffer|null>}
   */
  async _tryLoadFirstAudioBuffer(urls) {
    const AudioCtx = this._audioContext;
    if (!AudioCtx) return null;

    for (const url of urls) {
      try {
        const buffer = await this._loadAudioBuffer(url);
        if (buffer) return buffer;
      } catch {
        // keep trying
      }
    }
    return null;
  }

  /**
   * @param {string} url
   * @returns {Promise<AudioBuffer|null>}
   */
  async _loadAudioBuffer(url) {
    // Fetch + decode
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`AudioManager: failed to fetch ${url}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this._audioContext.decodeAudioData(arrayBuffer);
    return buffer;
  }

  /**
   * Play a specific SFX.
   * Not required by acceptance criteria explicitly, but it is useful for future integration.
   * @param {{type:string,id:any,pan?:number}} sfx
   */
  playSfx(sfx) {
    if (!sfx || typeof sfx !== 'object') return;
    if (!this._isStarted) return;

    const eraKey = this._currentEraAudio?.eraKey || 'unknown';
    const key = `${eraKey}:${sfx.type}:${String(sfx.id)}`;

    const buffer = this._sfx.loaded.get(key);
    if (!buffer) {
      // fallback: procedural short noise burst
      this._playProceduralSfx({ sfx });
      return;
    }

    const source = this._audioContext.createBufferSource();
    source.buffer = buffer;

    // Pan (spatial positioning) - optional.
    const panNode = this._audioContext.createStereoPanner();
    const pan = Number.isFinite(sfx.pan) ? this._clamp(sfx.pan, -1, 1) : 0;
    panNode.pan.value = pan;

    const gainNode = this._audioContext.createGain();
    // Slight randomization for life.
    const volume = 0.9 + Math.random() * 0.2;
    gainNode.gain.value = this.getSfxVolume() * volume;

    source.connect(panNode);
    panNode.connect(gainNode);
    gainNode.connect(this._sfxGain);

    // Start/stop
    source.start();
    source.onended = () => {
      try {
        source.disconnect();
        panNode.disconnect();
        gainNode.disconnect();
      } catch {
        // ignore
      }
    };
  }

  _playProceduralSfx({ sfx }) {
    // Create a short burst matching rough SFX category.
    const type = String(sfx.type || '');
    const now = this._audioContext.currentTime;

    const osc = this._audioContext.createOscillator();
    const filter = this._audioContext.createBiquadFilter();
    const gain = this._audioContext.createGain();

    const panNode = this._audioContext.createStereoPanner();
    panNode.pan.value = 0;

    filter.type = 'bandpass';

    if (type === 'radio') {
      osc.type = 'triangle';
      osc.frequency.value = 900;
      filter.frequency.value = 700;
      filter.Q.value = 8;
    } else if (type === 'ambient') {
      osc.type = 'sawtooth';
      osc.frequency.value = 140;
      filter.frequency.value = 250;
      filter.Q.value = 2;
    } else if (type === 'jukebox' || type === 'arcade') {
      osc.type = 'square';
      osc.frequency.value = 320;
      filter.frequency.value = 420;
      filter.Q.value = 5;
    } else {
      osc.type = 'sine';
      osc.frequency.value = 220;
      filter.frequency.value = 300;
      filter.Q.value = 1.5;
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.getSfxVolume() * 0.8, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(panNode);
    panNode.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * @param {{ type: string, eraKey: string }} param0
   * @returns {{node: AudioNode}}
   */
  _createProceduralMusicSource({ type }) {
    // A simple synthesizer generating an endless loop-like pattern.
    // We create a chord pad + a lead riff; both are modulated.
    const now = this._audioContext.currentTime;

    const master = this._audioContext.createGain();
    master.gain.value = 1;

    // Rhythm
    const tempo = this._tempoForMusicType(type);

    const chordOsc1 = this._audioContext.createOscillator();
    const chordOsc2 = this._audioContext.createOscillator();
    const leadOsc = this._audioContext.createOscillator();

    chordOsc1.type = this._waveForType(type, 'pad1');
    chordOsc2.type = this._waveForType(type, 'pad2');
    leadOsc.type = this._waveForType(type, 'lead');

    const filter = this._audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.6;

    const lfo = this._audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = this._lfoFrequencyForType(type);

    const lfoGain = this._audioContext.createGain();
    lfoGain.gain.value = this._lfoGainForType(type);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Gain envelopes
    const chordGain = this._audioContext.createGain();
    chordGain.gain.value = 0.15;

    const leadGain = this._audioContext.createGain();
    leadGain.gain.value = 0.18;

    // Connect
    chordOsc1.connect(chordGain);
    chordOsc2.connect(chordGain);
    chordGain.connect(filter);

    leadOsc.connect(leadGain);
    leadGain.connect(filter);

    filter.connect(master);

    // Start oscillators
    chordOsc1.start(now);
    chordOsc2.start(now);
    leadOsc.start(now);
    lfo.start(now);

    // Scheduling: update frequencies/gains in a repeating pattern.
    const sequenceLengthBeats = 8;
    const beat = 60 / tempo;

    const setChord = (step) => {
      const base = this._baseFreqForType(type);
      const chordTable = this._chordTableForType(type);
      const chord = chordTable[step % chordTable.length];
      // chord = [root, third, fifth]
      chordOsc1.frequency.setValueAtTime(base * chord[0], this._audioContext.currentTime);
      chordOsc2.frequency.setValueAtTime(base * chord[1], this._audioContext.currentTime);
    };

    const setLead = (step) => {
      const base = this._baseFreqForType(type);
      const leadTable = this._leadTableForType(type);
      const note = leadTable[step % leadTable.length];
      leadOsc.frequency.setValueAtTime(base * note, this._audioContext.currentTime);

      const t = this._audioContext.currentTime;
      leadGain.gain.cancelScheduledValues(t);
      leadGain.gain.setValueAtTime(leadGain.gain.value, t);
      leadGain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      leadGain.gain.linearRampToValueAtTime(0.08, t + beat * 0.35);
    };

    const tick = () => {
      const t = this._audioContext.currentTime;
      // Steps (quarter-beat like)
      const stepCount = sequenceLengthBeats * 2; // eighth-note steps
      for (let i = 0; i < stepCount; i++) {
        const stepTime = t + i * (beat / 2);
        // We can only schedule in the future with setValueAtTime.
        const localStep = i;
        // Chord change every 2 steps (~quarter note)
        if (i % 2 === 0) {
          const base = this._baseFreqForType(type);
          const chordTable = this._chordTableForType(type);
          const chord = chordTable[(localStep / 2) % chordTable.length];
          chordOsc1.frequency.setValueAtTime(base * chord[0], stepTime);
          chordOsc2.frequency.setValueAtTime(base * chord[1], stepTime);
        }

        // Lead on every step
        const base = this._baseFreqForType(type);
        const leadTable = this._leadTableForType(type);
        const note = leadTable[localStep % leadTable.length];
        leadOsc.frequency.setValueAtTime(base * note, stepTime);
        leadGain.gain.setValueAtTime(0.08, stepTime);
        leadGain.gain.linearRampToValueAtTime(0.22, stepTime + 0.01);
      }
    };

    // Initial schedule and periodic re-scheduling.
    tick();
    const intervalMs = (sequenceLengthBeats * beat * 1000) - 50;
    window.setInterval(() => {
      if (!this._audioContext || this._audioContext.state === 'closed') return;
      tick();
    }, Math.max(600, intervalMs));

    // master is the node connected to layer gain.
    return { node: master };
  }

  /**
   * @param {{ eraKey: string, ambientNoise: string }} param0
   * @returns {{node: AudioNode, stop?: ()=>void}}
   */
  _createProceduralAmbient({ ambientNoise }) {
    const type = ambientNoise || '';
    const now = this._audioContext.currentTime;

    const output = this._audioContext.createGain();
    output.gain.value = 1;

    // Brown-ish noise
    const noiseBuffer = this._createNoiseBuffer(2.0);
    const noiseSource = this._audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this._audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = this._ambientFilterHzForType(type);
    filter.Q.value = 0.6;

    const tremolo = this._audioContext.createOscillator();
    tremolo.type = 'sine';
    tremolo.frequency.value = this._ambientTremoloHzForType(type);

    const tremGain = this._audioContext.createGain();
    tremGain.gain.value = 0.25;

    tremolo.connect(tremGain);
    tremGain.connect(output.gain);

    // Subtle "conversation" tone by adding quiet harmonics.
    const convOsc = this._audioContext.createOscillator();
    convOsc.type = 'triangle';
    convOsc.frequency.value = this._ambientConversationHzForType(type);

    const convGain = this._audioContext.createGain();
    convGain.gain.value = 0.06;

    noiseSource.connect(filter);
    filter.connect(output);

    convOsc.connect(convGain);
    convGain.connect(output);

    noiseSource.start(now);
    convOsc.start(now);
    tremolo.start(now);

    const stop = () => {
      try {
        noiseSource.stop();
      } catch {
        // ignore
      }
      try {
        convOsc.stop();
      } catch {
        // ignore
      }
      try {
        tremolo.stop();
      } catch {
        // ignore
      }
    };

    return { node: output, stop };
  }

  _createNoiseBuffer(seconds) {
    const sampleRate = this._audioContext.sampleRate;
    const length = sampleRate * seconds;
    const buffer = this._audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      const pink = b0 + b1 + b2 + white * 0.1848;
      data[i] = pink * 0.07;
    }

    return buffer;
  }

  _eraKeyFromYear(year) {
    if (![1945, 1965, 1985, 2005, 2025].includes(year)) {
      throw new Error(`AudioManager: invalid era year ${year}`);
    }
    return String(year);
  }

  _primeEraAudio(eraKey) {
    // Prime by subscribing will happen; this just tries to reduce perceived latency.
    // We keep it simple: no-op placeholder for now since it doesn't fetch.
    // Procedural playback doesn't need priming.
    return Promise.resolve();
  }

  _normalizeNoiseKey(str) {
    return String(str)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  _clamp01(v) {
    return this._clamp(v, 0, 1);
  }

  _clamp(v, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  _tempoForMusicType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('swing')) return 112;
    if (t.includes('rock')) return 130;
    if (t.includes('motown')) return 118;
    if (t.includes('new wave') || t.includes('synth')) return 122;
    if (t.includes('lo-fi') || t.includes('electronic')) return 90;
    if (t.includes('alternative') || t.includes('indie')) return 105;
    return 110;
  }

  _waveForType(type, which) {
    const t = String(type).toLowerCase();
    if (which === 'pad1') {
      if (t.includes('lo-fi') || t.includes('electronic')) return 'sawtooth';
      if (t.includes('swing')) return 'triangle';
      if (t.includes('rock')) return 'square';
      return 'triangle';
    }
    if (which === 'pad2') {
      return t.includes('rock') ? 'triangle' : 'sine';
    }
    // lead
    if (t.includes('lo-fi') || t.includes('electronic')) return 'sine';
    if (t.includes('new wave') || t.includes('synth')) return 'square';
    if (t.includes('swing')) return 'triangle';
    return 'sawtooth';
  }

  _lfoFrequencyForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('swing')) return 0.85;
    if (t.includes('rock')) return 1.1;
    if (t.includes('new wave') || t.includes('synth')) return 1.35;
    if (t.includes('lo-fi') || t.includes('electronic')) return 0.45;
    return 0.8;
  }

  _lfoGainForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('lo-fi') || t.includes('electronic')) return 450;
    if (t.includes('swing')) return 700;
    if (t.includes('rock')) return 950;
    if (t.includes('new wave') || t.includes('synth')) return 1200;
    return 800;
  }

  _baseFreqForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('swing')) return 110;
    if (t.includes('rock')) return 98;
    if (t.includes('new wave') || t.includes('synth')) return 116;
    if (t.includes('alternative') || t.includes('indie')) return 103;
    if (t.includes('lo-fi') || t.includes('electronic')) return 90;
    return 104;
  }

  _chordTableForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('swing')) return [[1, 1.2], [1.1, 1.3], [1.25, 1.5], [0.95, 1.18]];
    if (t.includes('rock')) return [[1, 1.15], [1.05, 1.22], [0.95, 1.13], [1.1, 1.25]];
    if (t.includes('new wave') || t.includes('synth')) return [[1, 1.25], [1.2, 1.35], [0.9, 1.05], [1.1, 1.28]];
    if (t.includes('alternative') || t.includes('indie')) return [[1, 1.18], [1.08, 1.25], [0.96, 1.12], [1.12, 1.32]];
    if (t.includes('lo-fi') || t.includes('electronic')) return [[1, 1.22], [0.98, 1.18], [1.07, 1.26], [0.92, 1.1]];
    return [[1, 1.2]];
  }

  _leadTableForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('swing')) return [1, 1.125, 1.25, 1.375, 1.5, 1.25, 1.125, 1.375];
    if (t.includes('rock')) return [1, 1.1, 1.2, 1.3, 1.4, 1.2, 1.1, 1.3];
    if (t.includes('new wave') || t.includes('synth')) return [1, 1.18, 1.25, 1.37, 1.5, 1.25, 1.18, 1.37];
    if (t.includes('alternative') || t.includes('indie')) return [1, 1.15, 1.3, 1.2, 1.35, 1.25, 1.4, 1.3];
    if (t.includes('lo-fi') || t.includes('electronic')) return [1, 1.05, 1.12, 1.2, 1.18, 1.1, 1.15, 1.22];
    return [1, 1.1, 1.2];
  }

  _ambientFilterHzForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('street') || t.includes('traffic') || t.includes('radio')) return 450;
    if (t.includes('jukebox') || t.includes('espresso')) return 520;
    if (t.includes('arcade') || t.includes('boombox')) return 620;
    if (t.includes('ipod') || t.includes('dialup')) return 680;
    if (t.includes('lofi') || t.includes('modern') || t.includes('cafe')) return 520;
    return 500;
  }

  _ambientTremoloHzForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('lofi') || t.includes('modern') || t.includes('cafe')) return 0.32;
    if (t.includes('street') || t.includes('traffic')) return 0.42;
    if (t.includes('arcade') || t.includes('boombox')) return 0.55;
    return 0.45;
  }

  _ambientConversationHzForType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('street')) return 210;
    if (t.includes('jukebox')) return 250;
    if (t.includes('arcade')) return 190;
    if (t.includes('ipod')) return 230;
    if (t.includes('lofi') || t.includes('modern')) return 200;
    return 220;
  }
}
