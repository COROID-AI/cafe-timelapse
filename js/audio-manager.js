class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();
    this.ambientGain = this.audioContext.createGain();

    // Connect gain nodes
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Volume controls (0.0 to 1.0)
    this.musicVolume = 0.5;
    this.sfxVolume = 0.5;
    this.ambientVolume = 0.5;
    this.masterGain.gain.value = 1.0;
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;
    this.ambientGain.gain.value = this.ambientVolume;

    // Audio buffers
    this.musicBuffers = new Map();
    this.sfxBuffers = new Map();
    this.ambientBuffers = new Map();

    // Era-specific ambient sounds (at least 3 distinct types per era)
    this.ambientSoundsByEra = new Map([
      [1945, ['distant-train', 'am-radio-static', 'coffee-urn-boiling', 'conversation-murmur-1945']],
      [1965, ['jukebox-coin-drop', 'mechanical-arm', 'milk-bottles-clink', '60s-music-bed']],
      [1985, ['cash-register-beeps', 'cassette-tape-hiss', 'new-wave-music-hum', 'soda-machine-sounds']],
      [2005, ['espresso-machine-auto-steam', 'indoor-chatter', 'espresso-grinder']],
      [2025, ['future-hum', 'ambient-music', 'robot-chatter']] // placeholder
    ]);

    // Current audio sources
    this.currentMusicSource = null;
    this.currentMusicGainNode = null;
    this.ambientSources = new Map(); // { name: { source, gainNode } }

    // Crossfade settings
    this.crossfadeDuration = 1.0; // seconds
    this.isCrossfading = false;

    // Era mapping
    this.eras = [1945, 1965, 1985, 2005, 2025];
    this.sfxSounds = ['milk-steamer', 'cups-clatter'];

    // State
    this.initialized = false;
    this.currentEra = null;
  }

  async init() {
    try {
      await this.loadAllAudio();
      this.setupAmbient();
      this.initialized = true;
      // Play the current era if set
      if (this.currentEra !== null) {
        await this.playEraMusic(this.currentEra, false);
        this.setupAmbientForEra(this.currentEra);
      }
      console.log('AudioManager initialized');
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
    }
  }

  async loadAllAudio() {
    // Load era music
    for (const era of this.eras) {
      try {
        const buffer = await this.loadAudioFile(`public/assets/audio/${era}/track.mp3`);
        this.musicBuffers.set(era, buffer);
      } catch (e) {
        console.warn(`Failed to load music for era ${era}:`, e);
      }
    }

    // Load SFX
    for (const sfx of this.sfxSounds) {
      try {
        const buffer = await this.loadAudioFile(`public/assets/audio/sfx/${sfx}.mp3`);
        this.sfxBuffers.set(sfx, buffer);
      } catch (e) {
        console.warn(`Failed to load SFX ${sfx}:`, e);
      }
    }

    // Load ambient sounds for all eras
    for (const [_era, soundNames] of this.ambientSoundsByEra) {
      for (const soundName of soundNames) {
        try {
          const buffer = await this.loadAudioFile(`public/assets/audio/sfx/${soundName}.mp3`);
          this.ambientBuffers.set(soundName, buffer);
        } catch (e) {
          console.warn(`Failed to load ambient sound ${soundName}:`, e);
        }
      }
    }
  }

  loadAudioFile(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      request.onload = () => {
        if (request.status === 200) {
          this.audioContext.decodeAudioData(request.response)
            .then(buffer => resolve(buffer))
            .catch(err => reject(err));
        } else {
          reject(`Failed to load audio file: ${url}`);
        }
      };

      request.onerror = () => reject(`Network error loading: ${url}`);
      request.send();
    });
  }

  setupAmbient() {
    // Start ambient sounds (looping) for the current era
    if (this.currentEra !== null) {
      this.setupAmbientForEra(this.currentEra);
    }
  }

  setupAmbientForEra(era) {
    // Stop any existing ambient sounds
    for (const [_name, node] of this.ambientSources) {
      node.source.stop();
      node.source.disconnect();
      node.gainNode.disconnect();
    }
    this.ambientSources.clear();

    const ambienceNames = this.ambientSoundsByEra.get(era) || [];
    for (const name of ambienceNames) {
      const buffer = this.ambientBuffers.get(name);
      if (!buffer) {
        console.warn(`Ambient sound buffer not found for ${name} in era ${era}`);
        continue;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.ambientVolume; // initial volume
      source.connect(gainNode).connect(this.ambientGain);
      source.start(0);
      this.ambientSources.set(name, { source, gainNode });
    }
  }

  async playEraMusic(era, crossfade = true) {
    if (!this.musicBuffers.has(era)) {
      console.warn(`No music buffer for era ${era}`);
      return;
    }

    if (this.isCrossfading) {
      // If already crossfading, wait for completion
      return new Promise(resolve => {
        const check = () => {
          if (!this.isCrossfading) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      }).then(() => this.playEraMusic(era, crossfade));
    }

    const buffer = this.musicBuffers.get(era);

    if (!this.currentMusicSource) {
      // Initial play
      await this.createAndPlayMusicSource(buffer, 0);
      return;
    }

    if (crossfade) {
      await this.crossfadeTo(buffer);
    } else {
      // Stop current and play new immediately
      this.stopCurrentMusic();
      await this.createAndPlayMusicSource(buffer, 0);
    }
  }

  async createAndPlayMusicSource(buffer, volume = 0) {
    return new Promise((resolve) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      source.connect(gainNode).connect(this.musicGain);
      source.start(0);
      
      // Fade in
      gainNode.gain.exponentialRampToValueAtTime(
        volume * this.musicVolume,
        this.audioContext.currentTime + 0.01
      );
      
      // Store for potential crossfade
      this.musicSource = source;
      this.musicGainNode = gainNode;
      resolve();
    });
  }

  async crossfadeTo(newBuffer) {
    this.isCrossfading = true;
    const currentTime = this.audioContext.currentTime;

    // Create new source
    const newSource = this.audioContext.createBufferSource();
    newSource.buffer = newBuffer;
    newSource.loop = true;
    const newGain = this.audioContext.createGain();
    newGain.gain.setValueAtTime(0, currentTime);
    newSource.connect(newGain).connect(this.musicGain);
    newSource.start(currentTime);

    // Fade out current source
    if (this.currentMusicSource && this.currentMusicGainNode) {
      this.currentMusicGainNode.gain.exponentialRampToValueAtTime(
        0.001, // Nearly silent
        currentTime + this.crossfadeDuration
      );

      // Stop current source after fade
      setTimeout(() => {
        if (this.currentMusicSource) {
          this.currentMusicSource.stop();
          this.currentMusicSource.disconnect();
          this.currentMusicSource = null;
          this.currentMusicGainNode.disconnect();
          this.currentMusicGainNode = null;
        }
      }, this.crossfadeDuration * 1000);
    }

    // Fade in new source
    newGain.gain.exponentialRampToValueAtTime(
      this.musicVolume,
      currentTime + this.crossfadeDuration
    );

    // Update current sources
    this.currentMusicSource = newSource;
    this.currentMusicGainNode = newGain;

    // End crossfade
    setTimeout(() => {
      this.isCrossfading = false;
    }, this.crossfadeDuration * 1000);
  }

  stopCurrentMusic() {
    if (this.currentMusicSource) {
      this.currentMusicSource.stop();
      this.currentMusicSource.disconnect();
      this.currentMusicSource = null;
    }
    if (this.currentMusicGainNode) {
      this.currentMusicGainNode.disconnect();
      this.currentMusicGainNode = null;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicGain.gain.value = this.musicVolume;
    // Apply to current source if exists
    if (this.currentMusicGainNode) {
      this.currentMusicGainNode.gain.value = this.musicVolume;
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfxGain.gain.value = this.sfxVolume;
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.ambientGain.gain.value = this.ambientVolume;
    // Update ambient sources
    for (const { gainNode } of this.ambientSources.values()) {
      gainNode.gain.value = this.ambientVolume;
    }
  }

  playSfx(name) {
    const buffer = this.sfxBuffers.get(name);
    if (!buffer) {
      console.warn(`SFX not found: ${name}`);
      return;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.sfxVolume;
    source.connect(gainNode).connect(this.sfxGain);
    source.start(0);
    
    // Clean up after playback
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  // Method to be called by PeriodManager on era change
  onEraChange(era) {
    this.currentEra = era;
    if (this.initialized) {
      this.playEraMusic(era, true);
      this.transitionAmbiance(era);
    }
  }

  transitionAmbiance(newEra) {
    // Crossfade ambient sounds when era changes
    const now = this.audioContext.currentTime;
    const fadeDuration = this.crossfadeDuration;
    const currentVolume = this.ambientGain.gain.value;

    // Fade out current ambiance
    this.ambientGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);

    // After fade out, switch ambiance and fade in
    setTimeout(() => {
      this.setupAmbientForEra(newEra);
      // Fade in to target volume
      this.ambientGain.gain.setValueAtTime(0.001, now + fadeDuration);
      this.ambientGain.gain.exponentialRampToValueAtTime(currentVolume, now + 2 * fadeDuration);
    }, fadeDuration * 1000);
  }

  // Resume audio context if suspended (required for autoplay policies)
  resume() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Export for use in main.js
export { AudioManager };