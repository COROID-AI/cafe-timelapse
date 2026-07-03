#!/usr/bin/env python3
"""
Café Timelapse — Procedural Audio Asset Generator
==================================================
Synthesises all music tracks and SFX for the café timelapse scene.

Every sound is 100% procedurally generated (no third-party samples),
so all assets are original works released under CC0 (Public Domain).

Output: public/assets/audio/{1945,1965,1985,2005,2025}/  +  /sfx/
"""

import os
import wave
import struct
import math
import random
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SAMPLE_RATE = 44100
BIT_DEPTH = 16  # 16-bit PCM
MASTER_AMP = 0.85

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "audio")

YEARS = [1945, 1965, 1985, 2005, 2025]

random.seed(42)
np.random.seed(42)

# ---------------------------------------------------------------------------
# WAV writer
# ---------------------------------------------------------------------------
def save_wav(path, samples):
    """Write a mono numpy float array [-1, 1] as a 16-bit WAV file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Clip and convert
    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())
    dur = len(samples) / SAMPLE_RATE
    print(f"  ✓ {os.path.relpath(path, BASE_DIR)}  ({dur:.1f}s)")

# ---------------------------------------------------------------------------
# DSP Primitives
# ---------------------------------------------------------------------------
def t_axis(duration):
    """Return a time array for *duration* seconds."""
    n = int(SAMPLE_RATE * duration)
    return np.linspace(0, duration, n, endpoint=False)

def sine(freq, duration, amp=1.0):
    t = t_axis(duration)
    return amp * np.sin(2 * np.pi * freq * t)

def square(freq, duration, amp=1.0):
    t = t_axis(duration)
    return amp * np.sign(np.sin(2 * np.pi * freq * t))

def saw(freq, duration, amp=1.0):
    t = t_axis(duration)
    return amp * (2 * (freq * t - np.floor(0.5 + freq * t)))

def triangle(freq, duration, amp=1.0):
    t = t_axis(duration)
    return amp * (2 * np.abs(2 * (freq * t - np.floor(freq * t + 0.5))) - 1)

def white_noise(duration, amp=1.0):
    n = int(SAMPLE_RATE * duration)
    return amp * (np.random.rand(n) * 2 - 1)

def pink_noise(duration, amp=1.0):
    """Approximate pink noise via filtered white noise (1/f)."""
    n = int(SAMPLE_RATE * duration)
    white = np.random.rand(n) * 2 - 1
    # Simple 1-pole low-pass to tilt the spectrum toward pink
    out = np.zeros(n)
    a = 0.97
    for i in range(1, n):
        out[i] = a * out[i - 1] + (1 - a) * white[i]
    peak = np.max(np.abs(out)) + 1e-9
    return amp * (out / peak)

def brown_noise(duration, amp=1.0):
    """Brown noise (integrated white noise)."""
    n = int(SAMPLE_RATE * duration)
    white = np.random.rand(n) * 2 - 1
    out = np.cumsum(white)
    out -= np.mean(out)
    peak = np.max(np.abs(out)) + 1e-9
    return amp * (out / peak)

def adsr(duration, attack=0.01, decay=0.1, sustain=0.6, release=0.2, sr=SAMPLE_RATE):
    """ADSR envelope of given total *duration* in seconds."""
    n = int(sr * duration)
    env = np.zeros(n)
    a = int(sr * attack)
    d = int(sr * decay)
    r = int(sr * release)
    s = max(n - a - d - r, 0)
    if a > 0:
        env[:a] = np.linspace(0, 1, a)
    if d > 0:
        env[a:a + d] = np.linspace(1, sustain, d)
    env[a + d:a + d + s] = sustain
    if r > 0:
        start = a + d + s
        end = min(start + r, n)
        env[start:end] = np.linspace(sustain, 0, end - start)
    return env

def linear_env(duration, start=0.0, end=1.0, sr=SAMPLE_RATE):
    n = int(sr * duration)
    return np.linspace(start, end, n)

def exponential_env(duration, start=1.0, end=0.001, sr=SAMPLE_RATE):
    n = int(sr * duration)
    return np.geomspace(max(start, 1e-6), max(end, 1e-6), n)

def fade_in_out(samples, fade=0.05, sr=SAMPLE_RATE):
    """Apply short fade-in and fade-out to avoid clicks."""
    n = len(samples)
    out = samples.copy()
    f = int(sr * fade)
    if f > 0 and n > 2 * f:
        out[:f] *= np.linspace(0, 1, f)
        out[-f:] *= np.linspace(1, 0, f)
    return out

def mix(*arrays):
    """Sum multiple arrays of the same length (or pad shorter ones)."""
    max_len = max(len(a) for a in arrays)
    result = np.zeros(max_len)
    for a in arrays:
        padded = np.zeros(max_len)
        padded[:len(a)] = a
        result += padded
    return result

def concat(*arrays):
    """Concatenate arrays end-to-end."""
    return np.concatenate(arrays)

def one_pole_lp(signal, cutoff, sr=SAMPLE_RATE):
    """Simple one-pole low-pass filter."""
    rc = 1.0 / (2 * np.pi * cutoff)
    dt = 1.0 / sr
    alpha = dt / (rc + dt)
    out = np.zeros_like(signal)
    out[0] = signal[0] * alpha
    for i in range(1, len(signal)):
        out[i] = out[i - 1] + alpha * (signal[i] - out[i - 1])
    return out

def one_pole_hp(signal, cutoff, sr=SAMPLE_RATE):
    """Simple one-pole high-pass filter (DC blocker)."""
    rc = 1.0 / (2 * np.pi * cutoff)
    dt = 1.0 / sr
    alpha = rc / (rc + dt)
    out = np.zeros_like(signal)
    for i in range(1, len(signal)):
        out[i] = alpha * (out[i - 1] + signal[i] - signal[i - 1])
    return out

def bandpass(signal, low, high, sr=SAMPLE_RATE):
    """Cascade LP + HP for a crude band-pass."""
    return one_pole_hp(one_pole_lp(signal, high), low)

def stereo_to_mono_pseudo(signal, sr=SAMPLE_RATE, width=0.03):
    """Apply a subtle pseudo-stereo width via short delay (returns mono sum)."""
    delay = int(sr * width)
    delayed = np.zeros_like(signal)
    delayed[delay:] = signal[:-delay]
    return (signal + delayed) * 0.5

def note_freq(midi):
    """MIDI note number to frequency."""
    return 440.0 * (2 ** ((midi - 69) / 12.0))

def reverb_simple(signal, sr=SAMPLE_RATE, decay=0.3, mixes=(0.41, 0.37, 0.29, 0.23)):
    """Schroeder-style reverb (simplified, comb + allpass)."""
    out = signal.copy()
    for ms in mixes:
        d = int(sr * ms / 1000.0)
        if d < 1:
            continue
        comb = np.zeros(len(signal) + d)
        comb[:len(signal)] = signal
        for i in range(d, len(comb)):
            comb[i] += decay * comb[i - d]
        out += 0.25 * comb[:len(signal)]
    # Allpass
    for ms in (5.0, 1.7):
        d = max(int(sr * ms / 1000.0), 1)
        tmp = np.zeros(len(out))
        for i in range(len(out)):
            delayed = out[i - d] if i >= d else 0.0
            tmp[i] = 0.7 * out[i] + 0.7 * delayed
            if i + d < len(out):
                pass
        out = tmp
    peak = np.max(np.abs(out)) + 1e-9
    return out / peak * (np.max(np.abs(signal)) + 1e-9)

# ---------------------------------------------------------------------------
# Helper: place a short sound at a specific time offset in a buffer
# ---------------------------------------------------------------------------
def place(buffer, sound, offset_samples):
    """Mix *sound* into *buffer* starting at *offset_samples* (clamped)."""
    n = len(buffer)
    start = max(offset_samples, 0)
    end = min(start + len(sound), n)
    if end > start:
        buffer[start:end] += sound[:end - start]

# ---------------------------------------------------------------------------
# Chord / scale helpers
# ---------------------------------------------------------------------------
# Major scale degrees (semitone offsets from root)
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
DORIAN = [0, 2, 3, 5, 7, 9, 10]

# Common chord shapes (relative to root)
CHORD_MAJOR = [0, 4, 7]
CHORD_MINOR = [0, 3, 7]
CHORD_DOM7 = [0, 4, 7, 10]
CHORD_MAJ7 = [0, 4, 7, 11]
CHORD_MIN7 = [0, 3, 7, 10]
CHORD_DIM = [0, 3, 6]

def chord_notes(root_midi, shape):
    return [root_midi + s for s in shape]

def play_chord(root_midi, shape, duration, waveform=sine, amp=0.15):
    """Play a chord for *duration* seconds."""
    notes = chord_notes(root_midi, shape)
    parts = [waveform(note_freq(n), duration, amp=amp) for n in notes]
    return mix(*parts)

def melody_note(midi, duration, waveform=sine, amp=0.2, env_type="adsr"):
    """Single note with envelope."""
    tone = waveform(note_freq(midi), duration, amp=amp)
    if env_type == "adsr":
        env = adsr(duration, attack=0.02, decay=0.08, sustain=0.7, release=0.15)
    elif env_type == "pluck":
        env = exponential_env(duration, start=1.0, end=0.001)
    elif env_type == "pad":
        env = adsr(duration, attack=0.3, decay=0.2, sustain=0.8, release=0.5)
    else:
        env = np.ones(int(SAMPLE_RATE * duration))
    # Pad env to match tone length
    if len(env) < len(tone):
        env = np.pad(env, (0, len(tone) - len(env)))
    else:
        env = env[:len(tone)]
    return tone * env

def rest(duration):
    return np.zeros(int(SAMPLE_RATE * duration))

print("=" * 60)
print("Café Timelapse — Audio Asset Generator")
print("=" * 60)
print(f"Sample rate: {SAMPLE_RATE} Hz  |  Format: 16-bit mono WAV")
print(f"Output dir: {BASE_DIR}")
print()

# ===========================================================================
# MUSIC TRACK GENERATORS
# ===========================================================================
# Each track is a short (~30s) looping piece evocative of its era.
# All tracks are original compositions generated procedurally.

# ---------------------------------------------------------------------------
# 1945 — Post-war coffee bar: gentle swing / big-band ballad
# Piano melody, upright bass, brushed snare, warm vinyl crackle
# Key: C major, moderate swing tempo (~90 BPM)
# ---------------------------------------------------------------------------
def generate_1945_music():
    duration = 30.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    bpm = 90
    beat = 60.0 / bpm  # seconds per beat
    bar = beat * 4

    # Chord progression: C  -  Am  -  Dm7  -  G7  (ii-V-I-ish jazz loop)
    progression = [
        (60, CHORD_MAJ7),   # Cmaj7
        (57, CHORD_MIN7),   # Am7
        (62, CHORD_MIN7),   # Dm7
        (55, CHORD_DOM7),   # G7
    ]

    # --- Upright bass: walking quarter notes ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        bass_notes = [root_midi - 12, root_midi - 12 + 5, root_midi - 12 + 7, root_midi - 12 + 5]
        for i, bn in enumerate(bass_notes):
            note = melody_note(bn, beat * 0.9, waveform=sine, amp=0.18, env_type="adsr")
            note = note * adsr(beat * 0.9, attack=0.01, decay=0.05, sustain=0.6, release=0.1)
            place(buf, note, int((bar_start + i * beat) * sr))

    # --- Piano comping: block chords on beats 1 and 3 ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        for beat_pos in (0, 2):
            chord = play_chord(root_midi, shape, beat * 0.8, waveform=triangle, amp=0.06)
            chord = chord * adsr(beat * 0.8, attack=0.02, decay=0.1, sustain=0.5, release=0.15)
            place(buf, chord, int((bar_start + beat_pos * beat) * sr))

    # --- Melody: simple swing melody over the progression ---
    # Notes as (midi, start_beat_in_bar, duration_beats)
    melody_phrases = [
        [(72, 0, 1), (76, 1, 1), (79, 2, 1), (76, 3, 1)],
        [(72, 0, 2), (71, 2, 1), (69, 3, 1)],
        [(67, 0, 1), (69, 1, 1), (71, 2, 2)],
        [(72, 0, 3), (67, 3, 1)],
    ]
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        phrase = melody_phrases[bar_idx % len(melody_phrases)]
        for midi, start_beat, dur_beats in phrase:
            note = melody_note(midi, dur_beats * beat * 0.9, waveform=sine, amp=0.14, env_type="adsr")
            place(buf, note, int((bar_start + start_beat * beat) * sr))

    # --- Brushed snare: filtered noise swishes on beats 2 and 4 ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        for beat_pos in (1, 3):
            swish = white_noise(beat * 0.3, amp=0.08)
            swish = bandpass(swish, 2000, 8000)
            swish = swish * adsr(beat * 0.3, attack=0.02, decay=0.05, sustain=0.3, release=0.1)
            place(buf, swish, int((bar_start + beat_pos * beat) * sr))

    # --- Vinyl crackle: sparse pink noise impulses ---
    crackle = pink_noise(duration, amp=0.015)
    # Make it sparse by thresholding
    crackle = crackle * (np.abs(crackle) > 0.3)
    buf += crackle

    buf = fade_in_out(buf, fade=0.1)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * MASTER_AMP
    save_wav(os.path.join(BASE_DIR, "1945", "music-1945.wav"), buf)

# ---------------------------------------------------------------------------
# 1965 — Mod coffeehouse: British Invasion jangle, garage-organ
# Electric guitar arpeggios, Farfisa-style organ, tambourine
# Key: A minor / C major, ~120 BPM
# ---------------------------------------------------------------------------
def generate_1965_music():
    duration = 30.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    bpm = 120
    beat = 60.0 / bpm
    bar = beat * 4

    # Progression: Am  -  F  -  C  -  G  (classic I-V-vi-IV variant)
    progression = [
        (57, CHORD_MINOR),   # Am
        (53, CHORD_MAJOR),   # F
        (60, CHORD_MAJOR),   # C
        (55, CHORD_MAJOR),   # G
    ]

    # --- Farfisa organ: sustained chords ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        chord = play_chord(root_midi, shape, bar * 0.95, waveform=square, amp=0.05)
        chord = chord * adsr(bar * 0.95, attack=0.05, decay=0.1, sustain=0.7, release=0.2)
        # Slight tremolo
        trem_lfo = 1 + 0.3 * np.sin(2 * np.pi * 6 * t_axis(bar * 0.95))
        chord = chord * trem_lfo
        place(buf, chord, int(bar_start * sr))

    # --- Jangle guitar: arpeggiated eighth notes ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        arp_notes = chord_notes(root_midi, shape) * 2  # two octaves
        eighth = beat * 0.5
        for i in range(8):
            n = arp_notes[i % len(arp_notes)]
            note = melody_note(n, eighth * 0.9, waveform=triangle, amp=0.07, env_type="pluck")
            place(buf, note, int((bar_start + i * eighth) * sr))

    # --- Tambourine: on beats 2 and 4 ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        for beat_pos in (1, 3):
            tamb = white_noise(0.08, amp=0.12)
            tamb = one_pole_hp(tamb, 5000)
            tamb = tamb * exponential_env(0.08, start=1.0, end=0.01)
            place(buf, tamb, int((bar_start + beat_pos * beat) * sr))

    # --- Bass: root notes, eighth-note pulse ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, _ = progression[bar_idx % len(progression)]
        eighth = beat * 0.5
        for i in range(8):
            note = melody_note(root_midi - 12, eighth * 0.9, waveform=saw, amp=0.08, env_type="pluck")
            note = one_pole_lp(note, 800)
            place(buf, note, int((bar_start + i * eighth) * sr))

    buf = fade_in_out(buf, fade=0.1)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * MASTER_AMP
    save_wav(os.path.join(BASE_DIR, "1965", "music-1965.wav"), buf)

# ---------------------------------------------------------------------------
# 1985 — Neon synthwave cafe: FM synth, drum machine, arpeggiator
# LinnDrum-style drums, DX7 electric piano, synth bass, gated reverb
# Key: D minor, ~110 BPM
# ---------------------------------------------------------------------------
def generate_1985_music():
    duration = 30.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    bpm = 110
    beat = 60.0 / bpm
    bar = beat * 4

    # Progression: Dm  -  Bb  -  F  -  C  (i-VI-III-VII in D minor)
    progression = [
        (62, CHORD_MINOR),   # Dm
        (58, CHORD_MAJOR),   # Bb
        (65, CHORD_MAJOR),   # F
        (60, CHORD_MAJOR),   # C
    ]

    # --- Synth bass: pulsing sixteenth notes ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, _ = progression[bar_idx % len(progression)]
        sixteenth = beat * 0.25
        for i in range(16):
            if i % 2 == 0:  # play on even sixteenths
                note = melody_note(root_midi - 12, sixteenth * 0.9, waveform=saw, amp=0.12, env_type="pluck")
                note = one_pole_lp(note, 600)
                place(buf, note, int((bar_start + i * sixteenth) * sr))

    # --- DX7-style electric piano chords: bell-like FM ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        chord = play_chord(root_midi, shape, bar * 0.95, waveform=sine, amp=0.08)
        # FM modulation for bell timbre
        mod = sine(note_freq(root_midi) * 2, bar * 0.95, amp=0.3)
        chord = chord * (1 + 0.2 * mod)
        chord = chord * adsr(bar * 0.95, attack=0.02, decay=0.3, sustain=0.4, release=0.3)
        place(buf, chord, int(bar_start * sr))

    # --- Arpeggiator: rapid sixteenth-note sine arpeggios ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        arp_notes = chord_notes(root_midi, shape)
        arp_notes = [n + 12 for n in arp_notes]  # one octave up
        sixteenth = beat * 0.25
        for i in range(16):
            n = arp_notes[i % len(arp_notes)]
            note = melody_note(n, sixteenth * 0.9, waveform=sine, amp=0.06, env_type="pluck")
            place(buf, note, int((bar_start + i * sixteenth) * sr))

    # --- LinnDrum-style drum machine ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        # Kick on beats 1 and 3
        for beat_pos in (0, 2):
            kick = sine(60, beat * 0.3, amp=0.3)
            kick = kick * exponential_env(beat * 0.3, start=1.0, end=0.001)
            # Pitch sweep down
            t_kick = t_axis(beat * 0.3)
            freq_sweep = 120 - 80 * (t_kick / (beat * 0.3))
            kick = 0.3 * np.sin(2 * np.pi * freq_sweep * t_kick)
            kick = kick * exponential_env(beat * 0.3, start=1.0, end=0.001)
            place(buf, kick, int((bar_start + beat_pos * beat) * sr))
        # Snare on beats 2 and 4
        for beat_pos in (1, 3):
            snare = white_noise(beat * 0.15, amp=0.15)
            snare = bandpass(snare, 1500, 8000)
            snare = snare * exponential_env(beat * 0.15, start=1.0, end=0.01)
            # Add a tonal component
            tone_comp = sine(180, beat * 0.15, amp=0.05)
            snare = mix(snare, tone_comp)
            place(buf, snare, int((bar_start + beat_pos * beat) * sr))
        # Hi-hat on every eighth
        for i in range(8):
            hat = white_noise(0.04, amp=0.06)
            hat = one_pole_hp(hat, 7000)
            hat = hat * exponential_env(0.04, start=1.0, end=0.01)
            place(buf, hat, int((bar_start + i * beat * 0.5) * sr))

    # --- Gated reverb on the snare (wash of reverb that cuts off) ---
    # Already partially handled by short envelope; add subtle reverb wash
    buf = reverb_simple(buf, decay=0.2)

    buf = fade_in_out(buf, fade=0.1)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * MASTER_AMP
    save_wav(os.path.join(BASE_DIR, "1985", "music-1985.wav"), buf)

# ---------------------------------------------------------------------------
# 2005 — Third-wave indie cafe: acoustic guitar, Rhodes, brushed drums
# Warm, intimate, lo-fi hip-hop vibe. Fingerpicked guitar, soft Rhodes,
# gentle brushed drums, vinyl crackle.
# Key: G major, ~85 BPM
# ---------------------------------------------------------------------------
def generate_2005_music():
    duration = 30.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    bpm = 85
    beat = 60.0 / bpm
    bar = beat * 4

    # Progression: G  -  Em  -  C  -  D  (I-vi-IV-V)
    progression = [
        (67, CHORD_MAJOR),   # G
        (64, CHORD_MINOR),   # Em
        (60, CHORD_MAJOR),   # C
        (62, CHORD_MAJOR),   # D
    ]

    # --- Fingerpicked acoustic guitar: arpeggio pattern ---
    # Pattern: thumb(index) - high - mid - high - thumb - high - mid - high
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        notes = chord_notes(root_midi, shape)
        # Bass note (thumb) on beats 1 and 3
        bass = melody_note(notes[0] - 12, beat * 0.9, waveform=triangle, amp=0.1, env_type="pluck")
        place(buf, bass, int(bar_start * sr))
        bass2 = melody_note(notes[0] - 12, beat * 0.9, waveform=triangle, amp=0.1, env_type="pluck")
        place(buf, bass2, int((bar_start + 2 * beat) * sr))
        # Fingers: high notes on offbeats
        eighth = beat * 0.5
        for i in range(8):
            if i % 2 == 1:
                n = notes[(i // 2) % len(notes)] + 12
                note = melody_note(n, eighth * 0.9, waveform=triangle, amp=0.07, env_type="pluck")
                place(buf, note, int((bar_start + i * eighth) * sr))

    # --- Rhodes electric piano: soft sustained chords ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        chord = play_chord(root_midi, shape, bar * 0.95, waveform=sine, amp=0.06)
        chord = chord * adsr(bar * 0.95, attack=0.1, decay=0.2, sustain=0.6, release=0.4)
        # Tremolo
        trem = 1 + 0.15 * np.sin(2 * np.pi * 5 * t_axis(bar * 0.95))
        chord = chord * trem
        place(buf, chord, int(bar_start * sr))

    # --- Brushed drums: soft kick + brush swish ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        # Soft kick on beat 1
        kick = sine(50, beat * 0.2, amp=0.1)
        kick = kick * exponential_env(beat * 0.2, start=1.0, end=0.01)
        place(buf, kick, int(bar_start * sr))
        # Brush swish on beats 2 and 4
        for beat_pos in (1, 3):
            swish = white_noise(beat * 0.25, amp=0.04)
            swish = bandpass(swish, 3000, 9000)
            swish = swish * adsr(beat * 0.25, attack=0.03, decay=0.05, sustain=0.3, release=0.12)
            place(buf, swish, int((bar_start + beat_pos * beat) * sr))

    # --- Vinyl crackle ---
    crackle = pink_noise(duration, amp=0.01)
    crackle = crackle * (np.abs(crackle) > 0.35)
    buf += crackle

    buf = fade_in_out(buf, fade=0.1)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * MASTER_AMP
    save_wav(os.path.join(BASE_DIR, "2005", "music-2005.wav"), buf)

# ---------------------------------------------------------------------------
# 2025 — Modern specialty cafe: ambient electronic, minimal piano
# Clean sine plucks, soft pad, minimal percussion, field-recording texture
# Key: C major, ~70 BPM (ambient, slow)
# ---------------------------------------------------------------------------
def generate_2025_music():
    duration = 30.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    bpm = 70
    beat = 60.0 / bpm
    bar = beat * 4

    # Progression: C  -  G  -  Am  -  F  (I-V-vi-IV)
    progression = [
        (60, CHORD_MAJ7),   # Cmaj7
        (55, CHORD_MAJ7),   # Gmaj7
        (57, CHORD_MIN7),   # Am7
        (53, CHORD_MAJ7),   # Fmaj7
    ]

    # --- Minimal piano: sparse single notes ---
    melody_phrases = [
        [(72, 0, 2), (76, 2, 2)],
        [(74, 0, 2), (77, 2, 2)],
        [(72, 0, 1), (74, 1, 1), (72, 2, 2)],
        [(69, 0, 4)],
    ]
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        phrase = melody_phrases[bar_idx % len(melody_phrases)]
        for midi, start_beat, dur_beats in phrase:
            note = melody_note(midi, dur_beats * beat * 0.95, waveform=sine, amp=0.1, env_type="pad")
            place(buf, note, int((bar_start + start_beat * beat) * sr))

    # --- Soft pad: sustained chord wash ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        root_midi, shape = progression[bar_idx % len(progression)]
        pad = play_chord(root_midi, shape, bar * 0.95, waveform=sine, amp=0.04)
        pad = pad * adsr(bar * 0.95, attack=0.5, decay=0.3, sustain=0.7, release=0.5)
        # Low-pass for warmth
        pad = one_pole_lp(pad, 2000)
        place(buf, pad, int(bar_start * sr))

    # --- Subtle electronic percussion: rim click on beat 3 ---
    for bar_idx in range(int(duration / bar)):
        bar_start = bar_idx * bar
        click = sine(800, 0.03, amp=0.08)
        click = click * exponential_env(0.03, start=1.0, end=0.001)
        place(buf, click, int((bar_start + 2 * beat) * sr))
        # Soft shaker on offbeats
        for i in (1, 3):
            shaker = white_noise(0.05, amp=0.02)
            shaker = one_pole_hp(shaker, 6000)
            shaker = shaker * exponential_env(0.05, start=1.0, end=0.01)
            place(buf, shaker, int((bar_start + i * beat) * sr))

    # --- Field-recording texture: very soft filtered noise (room tone) ---
    room = pink_noise(duration, amp=0.008)
    room = one_pole_lp(room, 1500)
    buf += room

    buf = fade_in_out(buf, fade=0.2)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * MASTER_AMP
    save_wav(os.path.join(BASE_DIR, "2025", "music-2025.wav"), buf)

# ===========================================================================
# SFX GENERATORS
# ===========================================================================
# All SFX are stored under /sfx/ and are shared across all eras.

# ---------------------------------------------------------------------------
# Murmur of conversation: layered filtered noise blobs that sound like
# distant talking. ~10 second loopable.
# ---------------------------------------------------------------------------
def generate_murmur():
    duration = 10.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    # Multiple "voice" layers: each is a band of filtered noise that fades
    # in and out at different rates, simulating overlapping conversation.
    num_voices = 6
    for v in range(num_voices):
        voice = brown_noise(duration, amp=0.15)
        # Each voice has a different formant center
        center = 400 + v * 200 + random.randint(-50, 50)
        voice = bandpass(voice, center - 150, center + 200)
        # Amplitude modulation: slow LFO to simulate words/sentences
        t = t_axis(duration)
        lfo_freq = 0.3 + random.uniform(0, 0.5)
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * lfo_freq * t + random.uniform(0, 6.28))
        # Add faster modulation for syllable rate
        syllable = 0.7 + 0.3 * np.sin(2 * np.pi * (3 + random.uniform(0, 2)) * t)
        voice = voice * lfo * syllable
        buf += voice

    buf = fade_in_out(buf, fade=0.3)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.5
    save_wav(os.path.join(BASE_DIR, "sfx", "murmur.wav"), buf)

# ---------------------------------------------------------------------------
# Espresso hiss: steam wand noise. Filtered high-frequency noise with
# periodic bursts. ~6 second loopable.
# ---------------------------------------------------------------------------
def generate_espresso_hiss():
    duration = 6.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    # Base hiss: high-passed white noise
    hiss = white_noise(duration, amp=0.3)
    hiss = one_pole_hp(hiss, 4000)

    # Periodic steam bursts (every ~2 seconds)
    t = t_axis(duration)
    for burst_start in (0.5, 2.5, 4.5):
        burst_env = np.zeros(len(t))
        start_idx = int(burst_start * sr)
        end_idx = min(start_idx + int(1.5 * sr), len(t))
        if end_idx > start_idx:
            env_segment = adsr(1.5, attack=0.1, decay=0.3, sustain=0.6, release=0.5)
            burst_env[start_idx:end_idx] = env_segment[:end_idx - start_idx]
        hiss = hiss * (0.3 + 0.7 * burst_env)

    # Add a low rumble component (machine vibration)
    rumble = brown_noise(duration, amp=0.05)
    rumble = one_pole_lp(rumble, 200)

    buf = mix(hiss, rumble)
    buf = fade_in_out(buf, fade=0.1)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.6
    save_wav(os.path.join(BASE_DIR, "sfx", "espresso-hiss.wav"), buf)

# ---------------------------------------------------------------------------
# Cup clatter: ceramic cups hitting saucers and surfaces.
# Short transient clicks with resonant body. ~5 second loopable.
# ---------------------------------------------------------------------------
def generate_cup_clatter():
    duration = 5.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    # Random clatter events at irregular intervals
    events = [0.2, 0.8, 1.5, 1.9, 2.7, 3.3, 4.1, 4.6]
    for event_time in events:
        # Each clatter: short noise burst + resonant tone
        click = white_noise(0.02, amp=0.3)
        click = bandpass(click, 2000, 8000)
        click = click * exponential_env(0.02, start=1.0, end=0.001)
        place(buf, click, int(event_time * sr))

        # Resonant body: a couple of high ceramic ring tones
        for freq in (1200 + random.randint(-200, 200), 2400 + random.randint(-300, 300)):
            ring = sine(freq, 0.15, amp=0.1)
            ring = ring * exponential_env(0.15, start=1.0, end=0.001)
            place(buf, ring, int(event_time * sr))

        # Secondary smaller clink slightly after
        if random.random() > 0.4:
            delay = 0.05 + random.uniform(0, 0.05)
            clink = sine(3000 + random.randint(-500, 500), 0.08, amp=0.08)
            clink = clink * exponential_env(0.08, start=1.0, end=0.001)
            place(buf, clink, int((event_time + delay) * sr))

    buf = fade_in_out(buf, fade=0.05)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.5
    save_wav(os.path.join(BASE_DIR, "sfx", "cup-clatter.wav"), buf)

# ---------------------------------------------------------------------------
# Register ding: classic cash register bell. Single strike with decay.
# ---------------------------------------------------------------------------
def generate_register_ding():
    duration = 1.5
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    # Bell partials (inharmonic, like a real bell)
    partials = [
        (523, 0.3, 1.0),    # fundamental C5
        (1047, 0.15, 0.8),  # 2x
        (1568, 0.1, 0.5),   # ~3x
        (2100, 0.08, 0.3),  # inharmonic
        (3200, 0.05, 0.2),  # inharmonic
    ]
    for freq, amp, decay_mult in partials:
        tone = sine(freq, duration, amp=amp)
        env = exponential_env(duration, start=1.0, end=0.0001)
        env = env ** decay_mult
        buf += tone * env

    # Initial transient click
    click = white_noise(0.01, amp=0.2)
    click = one_pole_hp(click, 5000)
    place(buf, click, 0)

    buf = fade_in_out(buf, fade=0.02)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.7
    save_wav(os.path.join(BASE_DIR, "sfx", "register-ding.wav"), buf)

# ---------------------------------------------------------------------------
# Jukebox clack: mechanical switching sound of a jukebox selecting a record.
# ---------------------------------------------------------------------------
def generate_jukebox_clack():
    duration = 1.0
    sr = SAMPLE_RATE
    buf = np.zeros(int(sr * duration))

    # Mechanical clack: low thud + mid click + high tick
    # Low thud
    thud = sine(80, 0.1, amp=0.4)
    thud = thud * exponential_env(0.1, start=1.0, end=0.001)
    place(buf, thud, 0)

    # Mid-frequency click (the mechanism)
    click = white_noise(0.03, amp=0.3)
    click = bandpass(click, 1000, 3000)
    click = click * exponential_env(0.03, start=1.0, end=0.001)
    place(buf, click, 0)

    # High tick
    tick = white_noise(0.01, amp=0.2)
    tick = one_pole_hp(tick, 6000)
    tick = tick * exponential_env(0.01, start=1.0, end=0.001)
    place(buf, tick, int(0.05 * sr))

    # Secondary mechanism sound slightly later
    mech2 = white_noise(0.04, amp=0.15)
    mech2 = bandpass(mech2, 800, 2500)
    mech2 = mech2 * exponential_env(0.04, start=1.0, end=0.001)
    place(buf, mech2, int(0.15 * sr))

    # Record drop thud
    drop = sine(60, 0.08, amp=0.3)
    drop = drop * exponential_env(0.08, start=1.0, end=0.001)
    place(buf, drop, int(0.3 * sr))

    buf = fade_in_out(buf, fade=0.02)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.7
    save_wav(os.path.join(BASE_DIR, "sfx", "jukebox-clack.wav"), buf)

# ===========================================================================
# MAIN
# ===========================================================================
if __name__ == "__main__":
    print("Generating music tracks...")
    generate_1945_music()
    generate_1965_music()
    generate_1985_music()
    generate_2005_music()
    generate_2025_music()

    print()
    print("Generating SFX...")
    generate_murmur()
    generate_espresso_hiss()
    generate_cup_clatter()
    generate_register_ding()
    generate_jukebox_clack()

    print()
    print("=" * 60)
    print("Done! All audio assets generated under:")
    print(f"  {BASE_DIR}")
    print("=" * 60)







