# Audio Asset Credits

All audio assets for the Café Timelapse project are **100% procedurally generated**
using the script `scripts/generate-audio.py`. No third-party samples, recordings,
or loops are used. Every sound is synthesised from first principles using
NumPy and the Python `wave` module.

Because all assets are original works created specifically for this project,
they are released under **CC0 (Public Domain)**.

---

## Music Tracks

Each track is a ~30-second loop, one per era, designed to evoke the musical
style of its decade.

| # | Year | Track Name | Artist | Source | License |
|---|------|------------|--------|--------|---------|
| 1 | 1945 | `music-1945.wav` — "Post-War Swing" | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_1945_music()` | CC0 (Public Domain) |
| 2 | 1965 | `music-1965.wav` — "Mod Coffeehouse" | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_1965_music()` | CC0 (Public Domain) |
| 3 | 1985 | `music-1985.wav` — "Neon Synthwave" | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_1985_music()` | CC0 (Public Domain) |
| 4 | 2005 | `music-2005.wav` — "Third-Wave Indie" | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_2005_music()` | CC0 (Public Domain) |
| 5 | 2025 | `music-2025.wav` — "Modern Ambient" | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_2025_music()` | CC0 (Public Domain) |

### Musical Descriptions

- **1945 — Post-War Swing**: Gentle swing ballad in C major (90 BPM). Features
  walking upright bass, piano comping on block chords, a simple swing melody,
  brushed snare on beats 2 and 4, and warm vinyl crackle for atmosphere.

- **1965 — Mod Coffeehouse**: British Invasion jangle in A minor (120 BPM).
  Farfisa-style sustained organ chords with tremolo, arpeggiated jangle guitar,
  tambourine on beats 2 and 4, and eighth-note bass pulse.

- **1985 — Neon Synthwave**: FM synth track in D minor (110 BPM). Pulsing
  sixteenth-note synth bass, DX7-style bell-tone electric piano chords, rapid
  sine arpeggiator, LinnDrum-style drum machine (kick, snare, hi-hat), and
  gated reverb.

- **2005 — Third-Wave Indie**: Warm lo-fi in G major (85 BPM). Fingerpicked
  acoustic guitar arpeggios, soft Rhodes electric piano with tremolo, gentle
  brushed drums, and vinyl crackle.

- **2025 — Modern Ambient**: Minimalist ambient in C major (70 BPM). Sparse
  piano single notes, soft sustained pad wash, rim-click percussion, gentle
  shaker, and field-recording room tone texture.

---

## SFX Library

All sound effects are shared across all eras and stored under `assets/audio/sfx/`.

| # | SFX Name | File | Artist | Source | License |
|---|----------|------|--------|--------|---------|
| 1 | Murmur of conversation | `sfx/murmur.wav` | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_murmur()` | CC0 (Public Domain) |
| 2 | Espresso hiss | `sfx/espresso-hiss.wav` | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_espresso_hiss()` | CC0 (Public Domain) |
| 3 | Cup clatter | `sfx/cup-clatter.wav` | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_cup_clatter()` | CC0 (Public Domain) |
| 4 | Register ding | `sfx/register-ding.wav` | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_register_ding()` | CC0 (Public Domain) |
| 5 | Jukebox clack | `sfx/jukebox-clack.wav` | Café Timelapse (procedural) | `scripts/generate-audio.py` `generate_jukebox_clack()` | CC0 (Public Domain) |

### SFX Descriptions

- **Murmur**: Layered filtered brown-noise "voice" blobs with independent
  formant centers, slow LFO amplitude modulation (word rate), and faster
  syllable-rate modulation. Simulates overlapping distant conversation. 10s loop.

- **Espresso hiss**: High-passed white noise (steam wand) with periodic ADSR
  bursts every 2 seconds, plus a low-frequency rumble for machine vibration.
  6s loop.

- **Cup clatter**: Irregular transient events combining filtered noise clicks,
  resonant ceramic ring tones, and secondary clinks. 5s loop.

- **Register ding**: Classic bell with five inharmonic partials (C5 fundamental)
  with independent exponential decays, plus an initial transient click. 1.5s.

- **Jukebox clack**: Mechanical switching sound: low-frequency thud, mid-band
  mechanism click, high-frequency tick, secondary mechanism, and record-drop
  thud. 1s.

---

## License Summary

All audio assets are original procedural synthesises created for this project.

- **License**: [CC0 1.0 Universal (Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/)
- **Author**: Café Timelapse project
- **Generator**: `scripts/generate-audio.py` (Python 3 + NumPy)
- **Format**: 16-bit PCM WAV, 44100 Hz, mono

No attribution is required, though a link back to the project is appreciated.
