// lfo.js — LFO engine: shapes, CC targeting, rate/depth. Synced to clock.
// Each LFO continuously modulates a CC. Output computed per clock tick.

// Rate -> number of quarter notes per full LFO cycle.
// '4/1' = 4 bars (16 quarters at 4/4), '1/4' = one quarter, etc.
const RATE_QUARTERS = {
  '4/1': 16,
  '2/1': 8,
  '1/1': 4,
  '1/2': 2,
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/4t': 2 / 3,
  '1/8t': 1 / 3,
};

const PPQ = 24;

function clamp7(v) {
  v = Math.round(v);
  if (v < 0) return 0;
  if (v > 127) return 127;
  return v;
}

// Shape math: pos is normalized 0.0–1.0 position within the LFO cycle.
// Each returns a normalized 0.0–1.0 amplitude.
function shapeValue(shape, pos, lfo) {
  switch (shape) {
    case 'sine':
      return Math.sin(pos * 2 * Math.PI) * 0.5 + 0.5;
    case 'triangle':
      return 1 - Math.abs(pos * 2 - 1);
    case 'sawtooth':
      return pos;
    case 'ramp':
      return 1 - pos;
    case 'square':
      return pos < 0.5 ? 1 : 0;
    case 'random':
      // New random value each cycle start; held across the cycle.
      return lfo._randomHold;
    case 's&h':
      // New random value each clock tick (handled at sample time).
      return lfo._shHold;
    default:
      return 0.5;
  }
}

export class LFOEngine {
  constructor(clockEngine, midiEngine) {
    this.clock = clockEngine;
    this.midi = midiEngine;
    this.lfos = new Map();
    this._idCounter = 0;
    this.clock.onTick((t) => this._onTick(t));
  }

  _genId() {
    this._idCounter++;
    return 'lfo_' + this._idCounter;
  }

  addLFO(config = {}) {
    const id = config.id || this._genId();
    // Keep the counter ahead of any explicit id restored from saved state.
    const m = /^lfo_(\d+)$/.exec(id);
    if (m) this._idCounter = Math.max(this._idCounter, parseInt(m[1], 10));
    const lfo = Object.assign(
      {
        id,
        label: 'LFO',
        shape: 'sine',
        rate: '1/4',
        depth: 64,
        center: 64,
        channel: 1,
        ccNumber: 80,
        phase: 0.0,
        active: true,
      },
      config,
      { id }
    );
    lfo._lastCycle = -1;
    lfo._randomHold = Math.random();
    lfo._shHold = Math.random();
    lfo._currentValue = lfo.center;
    lfo._lastSent = null; // throttle: last CC value actually transmitted
    this.lfos.set(id, lfo);
    return id;
  }

  removeLFO(id) {
    this.lfos.delete(id);
  }

  updateLFO(id, partial) {
    const lfo = this.lfos.get(id);
    if (!lfo) return;
    Object.assign(lfo, partial);
  }

  setActive(id, bool) {
    const lfo = this.lfos.get(id);
    if (lfo) lfo.active = !!bool;
  }

  getCurrentValue(id) {
    const lfo = this.lfos.get(id);
    return lfo ? lfo._currentValue : 0;
  }

  // Park every LFO target at its center value. Called on stop/panic so CC
  // targets are never left wherever the last cycle happened to die.
  parkAtCenter() {
    this.lfos.forEach((l) => {
      this.midi.cc(l.channel, l.ccNumber, clamp7(l.center));
    });
  }

  getLFOs() {
    return Array.from(this.lfos.values()).map((l) => {
      const c = Object.assign({}, l);
      delete c._lastCycle;
      delete c._randomHold;
      delete c._shHold;
      delete c._currentValue;
      return c;
    });
  }

  // Compute normalized position within an LFO cycle from absolute tick count.
  _positionFor(lfo, tickIndex) {
    const quartersPerCycle = RATE_QUARTERS[lfo.rate] || 1;
    const ticksPerCycle = quartersPerCycle * PPQ;
    const raw = (tickIndex / ticksPerCycle + lfo.phase) % 1;
    return raw < 0 ? raw + 1 : raw;
  }

  _onTick(t) {
    if (!this.clock.isRunning()) return;
    this.lfos.forEach((lfo) => {
      if (!lfo.active) return;
      const pos = this._positionFor(lfo, t.tick);

      // Detect cycle boundary for 'random' (new value each cycle start).
      const quartersPerCycle = RATE_QUARTERS[lfo.rate] || 1;
      const ticksPerCycle = quartersPerCycle * PPQ;
      const cycle = Math.floor((t.tick / ticksPerCycle + lfo.phase));
      if (cycle !== lfo._lastCycle) {
        lfo._lastCycle = cycle;
        lfo._randomHold = Math.random();
      }
      // s&h: new random value each tick.
      lfo._shHold = Math.random();

      const norm = shapeValue(lfo.shape, pos, lfo); // 0..1
      // Map to CC range around center with peak-to-peak depth.
      const value = clamp7(lfo.center + (norm - 0.5) * lfo.depth);
      // Compute every tick (keeps _currentValue smooth for the UI cursor),
      // but throttle MIDI: send at most once per 16th note (6 ticks @ 24 PPQ)
      // and skip if the value has not changed since the last send. This avoids
      // CC zipper noise from emitting ~96 messages/beat.
      lfo._currentValue = value;
      const isSixteenth = t.tick % 6 === 0;
      if (isSixteenth && value !== lfo._lastSent) {
        this.midi.cc(lfo.channel, lfo.ccNumber, value);
        lfo._lastSent = value;
      }
    });
  }

  // Compute a preview value at a given normalized position (for UI waveform).
  // Pure function of shape + pos; does not touch MIDI.
  static previewShape(shape, pos) {
    switch (shape) {
      case 'sine':
        return Math.sin(pos * 2 * Math.PI) * 0.5 + 0.5;
      case 'triangle':
        return 1 - Math.abs(pos * 2 - 1);
      case 'sawtooth':
        return pos;
      case 'ramp':
        return 1 - pos;
      case 'square':
        return pos < 0.5 ? 1 : 0;
      case 'random':
        return 0.5; // preview shows midline; randomness is per-cycle live
      case 's&h':
        return 0.5;
      default:
        return 0.5;
    }
  }
}
