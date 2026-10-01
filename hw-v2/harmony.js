// harmony.js — VT-4 harmony driver: progression, clock-locked auto-advance,
// note output. The core of v2's musical intelligence.
//
// VT-4 Harmony mode interprets incoming MIDI notes as the key/scale center for
// its harmony generation, not as specific pitches to play. Sending C4+E4+G4
// sets a C-major harmonic context.

// Chord quality -> interval sets (semitones above root).
export const CHORD_QUALITIES = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  min9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14],
};

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

export function chordName(root, quality) {
  return NOTE_NAMES[((root % 12) + 12) % 12] + ' ' + quality;
}

export function midiNoteName(note) {
  const n = NOTE_NAMES[((note % 12) + 12) % 12];
  const oct = Math.floor(note / 12) - 1;
  return n + oct;
}

export class HarmonyEngine {
  constructor(clockEngine, midiEngine) {
    this.clock = clockEngine;
    this.midi = midiEngine;

    this.channel = 1; // VT-4 default
    this.voiceCount = 2;
    this.octave = 4;
    this.inversion = 0; // 0 root, 1 first, 2 second
    this.mode = 'auto';

    this.progression = [];
    this._stepIndex = 0;
    this._barsRemaining = 0;
    this._lastBar = -1;
    this._running = false;
    this._locked = false;
    this._activeNotes = [];

    // --- Follow mode state ---
    this.followChannel = 0; // 0 = omni (any channel)
    this._heldNotes = new Set(); // currently held MIDI notes from the Keystep
    this._followDebounce = null; // timer handle for 40ms chord-change debounce
    this._lastDetected = null; // last {root, quality} sent in follow mode

    this._stepChangeCallbacks = [];
    this._barsRemainingCallbacks = [];
    this._followChordCallbacks = [];

    this.clock.onTick((t) => this._onTick(t));
    if (this.midi && this.midi.onKeyboardNote) {
      this.midi.onKeyboardNote((evt) => this._onKeyboardNote(evt));
    }
  }

  // --- Configuration ---

  setChannel(ch) {
    this.channel = Math.max(1, Math.min(16, Math.round(ch)));
  }

  setVoiceCount(n) {
    this.voiceCount = Math.max(1, Math.min(3, Math.round(n)));
  }

  setOctave(n) {
    this.octave = Math.max(3, Math.min(5, Math.round(n)));
  }

  setInversion(n) {
    this.inversion = Math.max(0, Math.min(2, Math.round(n)));
  }

  setMode(mode) {
    if (mode !== 'auto' && mode !== 'lock' && mode !== 'manual' && mode !== 'follow') return;
    const prev = this.mode;
    if (mode === prev) return;
    this.mode = mode;

    if (mode === 'lock') {
      this._locked = true;
    } else if (prev === 'lock') {
      this._locked = false;
    }

    if (mode === 'follow') {
      // Pause the progression (do NOT reset _stepIndex). Release the
      // progression chord so follow output takes over cleanly.
      this._releaseActive();
      this._lastDetected = null;
      this._heldNotes.clear();
    } else if (prev === 'follow') {
      // Leaving follow: release any follow-derived chord, then resume the
      // progression from where it paused if it was running.
      this._releaseActive();
      this._lastDetected = null;
      if (this._followDebounce) { clearTimeout(this._followDebounce); this._followDebounce = null; }
      if (this._running && mode === 'auto') {
        this._applyStep(this._stepIndex, true);
      }
    }
  }

  getMode() {
    return this.mode;
  }

  setFollowChannel(ch) {
    this.followChannel = Math.max(0, Math.min(16, Math.round(ch)));
  }

  // --- Progression ---

  setProgression(steps) {
    this.progression = (steps || []).slice(0, 8).map((s) => ({
      root: ((Math.round(s.root) % 12) + 12) % 12,
      quality: CHORD_QUALITIES[s.quality] ? s.quality : 'maj',
      bars: Math.max(1, Math.min(8, Math.round(s.bars || 1))),
    }));
    if (this._stepIndex >= this.progression.length) this._stepIndex = 0;
  }

  getProgression() {
    return this.progression.map((s) => Object.assign({}, s));
  }

  startProgression() {
    if (this.progression.length === 0) return;
    this._running = true;
    this._stepIndex = 0;
    this._lastBar = -1;
    this._applyStep(this._stepIndex, true);
  }

  stopProgression() {
    this._running = false;
    this._releaseActive();
    this._stepIndex = 0;
    this._barsRemaining = 0;
  }

  // Manual advance in 'manual' mode, or forced jump.
  jumpToStep(index) {
    if (this.progression.length === 0) return;
    const i = ((index % this.progression.length) + this.progression.length) % this.progression.length;
    this._stepIndex = i;
    this._applyStep(i, true);
  }

  lock() {
    this._locked = true;
    this.mode = 'lock';
  }

  unlock() {
    this._locked = false;
    // Resume auto from current step.
    if (this.mode === 'lock') this.mode = 'auto';
  }

  // --- Output / inspection ---

  getActiveNotes() {
    return this._activeNotes.slice();
  }

  getCurrentStep() {
    if (this.mode === 'follow') return null;
    const s = this.progression[this._stepIndex];
    if (!s) return null;
    return {
      index: this._stepIndex,
      root: s.root,
      quality: s.quality,
      bars: s.bars,
      barsRemaining: this._barsRemaining,
    };
  }

  getNextStep() {
    if (this.mode === 'follow') return null;
    if (this.progression.length === 0) return null;
    const ni = (this._stepIndex + 1) % this.progression.length;
    const s = this.progression[ni];
    return { index: ni, root: s.root, quality: s.quality };
  }

  isRunning() {
    return this._running;
  }

  // --- Events ---

  onStepChange(callback) {
    this._stepChangeCallbacks.push(callback);
  }

  onBarsRemaining(callback) {
    this._barsRemainingCallbacks.push(callback);
  }

  onFollowChordChange(callback) {
    this._followChordCallbacks.push(callback);
  }

  // --- Follow mode ---

  _onKeyboardNote(evt) {
    if (this.mode !== 'follow') return;
    // Channel filter: 0 = omni.
    if (this.followChannel !== 0 && evt.ch !== this.followChannel) return;
    if (evt.type === 'on') this._heldNotes.add(evt.note);
    else this._heldNotes.delete(evt.note);

    // Debounce: wait 40ms after the last note event before recomputing and
    // sending to the VT-4. Prevents noteOff/noteOn floods during fast playing.
    if (this._followDebounce) clearTimeout(this._followDebounce);
    this._followDebounce = setTimeout(() => {
      this._followDebounce = null;
      this._recomputeFollow();
    }, 40);
  }

  _recomputeFollow() {
    const pitchClasses = Array.from(new Set(Array.from(this._heldNotes).map((n) => n % 12)));
    // No notes held → hold the last chord (do not send noteOff).
    if (pitchClasses.length === 0) return;

    const detected = this.detectChord(pitchClasses);
    if (!detected) return;

    const notes = this.computeNotes(detected.root, detected.quality);
    const changed =
      !this._lastDetected ||
      this._lastDetected.root !== detected.root ||
      this._lastDetected.quality !== detected.quality;

    if (changed) {
      this._releaseActive();
      notes.forEach((n) => this.midi.harmonyNoteOn(this.channel, n, 100));
      this._activeNotes = notes;
      this._lastDetected = { root: detected.root, quality: detected.quality };
      this._followChordCallbacks.forEach((cb) =>
        cb({ root: detected.root, quality: detected.quality, notes, confidence: detected.confidence })
      );
    }
  }

  getFollowState() {
    if (this.mode !== 'follow') return null;
    const pitchClasses = Array.from(new Set(Array.from(this._heldNotes).map((n) => n % 12)));
    return {
      heldNotes: Array.from(this._heldNotes).sort((a, b) => a - b),
      pitchClasses: pitchClasses.sort((a, b) => a - b),
      detectedChord: pitchClasses.length ? this.detectChord(pitchClasses) : null,
    };
  }

  // Best-match chord from a set of pitch classes (0–11). Exported behaviour
  // for testing. Returns { root, quality, confidence } or null if empty.
  //
  // Scoring is a Jaccard ratio: matched tones / |held ∪ chordTones|. Unlike a
  // plain coverage ratio, this rewards a candidate for explaining the held
  // notes *fully*, so a held C7 (C E G Bb) scores dom7 = 1.0 but maj = 0.75 —
  // the seventh is recognised instead of being shadowed by its own triad.
  // When no extension is held, the triad still wins (C E G → maj 1.0, dom7
  // 0.75). Ties break to the simpler quality (earlier in CHORD_QUALITIES).
  detectChord(pitchClasses) {
    if (!pitchClasses || pitchClasses.length === 0) return null;
    const pcSet = new Set(pitchClasses.map((p) => ((p % 12) + 12) % 12));
    if (pcSet.size === 1) {
      return { root: ((pitchClasses[0] % 12) + 12) % 12, quality: 'maj', confidence: 0.33 };
    }
    // Quality keys in simplicity order (earlier = simpler) for tie-breaking.
    const qualities = Object.keys(CHORD_QUALITIES);
    let best = null;
    for (let root = 0; root < 12; root++) {
      for (let qi = 0; qi < qualities.length; qi++) {
        const quality = qualities[qi];
        const tones = CHORD_QUALITIES[quality].map((iv) => (root + iv) % 12);
        const toneSet = new Set(tones);
        let hit = 0;
        toneSet.forEach((t) => { if (pcSet.has(t)) hit++; });
        // Jaccard: intersection / union. union = |tones| + (held not in tones).
        const unionSize = toneSet.size + (pcSet.size - hit);
        const score = unionSize === 0 ? 0 : hit / unionSize;
        if (
          !best ||
          score > best.score ||
          // Tie-break: prefer simpler quality (lower index in qualities list).
          (score === best.score && qi < best.qi)
        ) {
          best = { root, quality, score, qi, confidence: score };
        }
      }
    }
    return best ? { root: best.root, quality: best.quality, confidence: best.confidence } : null;
  }

  // --- Note computation ---

  // Given a chord (root, quality), select voiceCount notes near the center
  // octave, applying the configured inversion. Returns MIDI note numbers.
  computeNotes(root, quality) {
    const intervals = CHORD_QUALITIES[quality] || CHORD_QUALITIES.maj;
    // Base MIDI note for root at the chosen octave. MIDI octave: C4 = 60.
    const base = (this.octave + 1) * 12 + root;
    let chosen = intervals.slice(0, this.voiceCount).map((iv) => base + iv);

    // Apply inversion by lifting the lowest notes up an octave.
    for (let inv = 0; inv < this.inversion && inv < chosen.length; inv++) {
      chosen[inv] = chosen[inv] + 12;
    }
    chosen.sort((a, b) => a - b);
    // Clamp into MIDI range.
    return chosen.map((n) => Math.max(0, Math.min(127, n)));
  }

  // --- Internal clock handler ---

  _onTick(t) {
    if (!this._running) return;
    if (this.mode === 'follow') return; // progression paused in follow mode
    if (this.progression.length === 0) return;

    // Only act on bar boundaries — never advance mid-bar.
    if (!t.isBarBoundary) return;
    if (t.bar === this._lastBar) return;
    this._lastBar = t.bar;

    // A new bar elapsed.
    if (this._barsRemaining > 0) {
      this._barsRemaining--;
      this._emitBarsRemaining(this._barsRemaining);
    }

    // Lock / manual: hold the current chord, do not advance.
    if (this.mode === 'lock' || this._locked) return;
    if (this.mode === 'manual') return;

    // Auto mode: advance when the current step's bars are exhausted.
    if (this._barsRemaining <= 0) {
      this._advance();
    }
  }

  _advance() {
    const nextIndex = (this._stepIndex + 1) % this.progression.length;
    this._stepIndex = nextIndex;
    this._applyStep(nextIndex, true);
  }

  // Send noteOff for the previous chord, compute and send the new chord.
  _applyStep(index, isChange) {
    const step = this.progression[index];
    if (!step) return;
    this._releaseActive();

    const notes = this.computeNotes(step.root, step.quality);
    notes.forEach((n) => this.midi.harmonyNoteOn(this.channel, n, 100));
    this._activeNotes = notes;

    this._barsRemaining = step.bars;
    this._emitBarsRemaining(this._barsRemaining);

    if (isChange) {
      const cur = this.getCurrentStep();
      const next = this.getNextStep();
      this._stepChangeCallbacks.forEach((cb) => cb(cur, next));
    }
  }

  _releaseActive() {
    this._activeNotes.forEach((n) => this.midi.harmonyNoteOff(this.channel, n));
    this._activeNotes = [];
  }

  _emitBarsRemaining(n) {
    this._barsRemainingCallbacks.forEach((cb) => cb(n));
  }

  // Release all notes (panic / port change).
  releaseAll() {
    this._releaseActive();
  }
}
