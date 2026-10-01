// midi.js — MIDI plumbing: port management, send helpers, activity flash.
// Web MIDI API only. No SysEx. No backend.

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CONTROL_CHANGE = 0xb0;
const PROGRAM_CHANGE = 0xc0;

// Clamp a value into a valid MIDI 7-bit range.
function clamp7(v) {
  v = Math.round(v);
  if (v < 0) return 0;
  if (v > 127) return 127;
  return v;
}

// Channel is exposed to callers as 1-16; on the wire it is 0-15.
function chNibble(ch) {
  const c = Math.round(ch) - 1;
  if (c < 0) return 0;
  if (c > 15) return 15;
  return c;
}

export class MidiEngine {
  constructor() {
    this.access = null;
    this.output = null;
    // Second output for harmony notes (VT-4 USB). Null = follow the main output.
    this.harmonyOutput = null;
    // Two independent inputs, kept separate so clock and note streams never
    // interfere: clock comes from the 707, notes come from the Keystep.
    this.clockInput = null;
    this.keyboardInput = null;
    this._stateCallbacks = [];
    this._clockCallbacks = [];
    this._keyboardCallbacks = [];
    this._activityCallbacks = [];
    this._available = false;
  }

  // Request access and populate ports. Returns true on success.
  async init() {
    if (!navigator.requestMIDIAccess) {
      this._available = false;
      const err = new Error('Web MIDI API not available in this browser.');
      err.code = 'NO_WEB_MIDI';
      throw err;
    }
    // sysex:false is a hard constraint of the project.
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this._available = true;
    this.access.onstatechange = (e) => {
      this._stateCallbacks.forEach((cb) => cb(e));
    };
    return true;
  }

  isAvailable() {
    return this._available;
  }

  onStateChange(callback) {
    this._stateCallbacks.push(callback);
  }

  // --- Port enumeration ---

  getOutputPorts() {
    if (!this.access) return [];
    const out = [];
    this.access.outputs.forEach((p) => out.push({ id: p.id, name: p.name }));
    return out;
  }

  getInputPorts() {
    if (!this.access) return [];
    const out = [];
    this.access.inputs.forEach((p) => out.push({ id: p.id, name: p.name }));
    return out;
  }

  setOutputPort(id) {
    if (!this.access) return;
    this.output = id ? this.access.outputs.get(id) || null : null;
  }

  getOutputPortId() {
    return this.output ? this.output.id : null;
  }

  // --- Harmony output (VT-4 USB) --- second output; falls back to OUT when unset.
  setHarmonyOutputPort(id) {
    if (!this.access) return;
    this.harmonyOutput = id ? this.access.outputs.get(id) || null : null;
  }

  getHarmonyOutputPortId() {
    return this.harmonyOutput ? this.harmonyOutput.id : null;
  }

  // --- Clock input (707 USB) — for ClockEngine slave mode ---
  setClockInputPort(id) {
    if (!this.access) return;
    if (this.clockInput) this.clockInput.onmidimessage = null;
    this.clockInput = id ? this.access.inputs.get(id) || null : null;
    if (this.clockInput) {
      this.clockInput.onmidimessage = (msg) => {
        const status = msg.data[0];
        // Filter to realtime transport bytes only: clock/start/continue/stop.
        if (status === 0xf8 || status === 0xfa || status === 0xfb || status === 0xfc) {
          this._clockCallbacks.forEach((cb) => cb(msg.data, msg.timeStamp));
        }
      };
    }
  }

  onClockMessage(callback) {
    this._clockCallbacks.push(callback);
  }

  getClockInputPortId() {
    return this.clockInput ? this.clockInput.id : null;
  }

  // --- Keyboard input (Keystep USB) — for HarmonyEngine follow mode ---
  setKeyboardInputPort(id) {
    if (!this.access) return;
    if (this.keyboardInput) this.keyboardInput.onmidimessage = null;
    this.keyboardInput = id ? this.access.inputs.get(id) || null : null;
    if (this.keyboardInput) {
      this.keyboardInput.onmidimessage = (msg) => {
        const d = msg.data;
        const type = d[0] & 0xf0;
        const ch = (d[0] & 0x0f) + 1; // expose 1-16
        if (type === 0x90 && d[2] > 0) {
          this._keyboardCallbacks.forEach((cb) => cb({ type: 'on', ch, note: d[1], vel: d[2] }));
        } else if (type === 0x80 || (type === 0x90 && d[2] === 0)) {
          // noteOff, or noteOn with velocity 0 (treated as noteOff).
          this._keyboardCallbacks.forEach((cb) => cb({ type: 'off', ch, note: d[1], vel: 0 }));
        }
      };
    }
  }

  onKeyboardNote(callback) {
    this._keyboardCallbacks.push(callback);
  }

  getKeyboardInputPortId() {
    return this.keyboardInput ? this.keyboardInput.id : null;
  }

  // Heuristic default-port detection by name. Returns suggested ids.
  detectDefaultPorts() {
    const outs = this.getOutputPorts();
    const ins = this.getInputPorts();
    const roland = /mc-?707|roland/i;
    const arturia = /keystep|arturia/i;
    const vt4 = /vt-?4/i;
    const tr6s = /tr-?6s/i;
    const out = (outs.find((p) => roland.test(p.name)) || outs[0] || {}).id || null;
    const clockIn = (ins.find((p) => roland.test(p.name)) || {}).id || null;
    const keysIn = (ins.find((p) => arturia.test(p.name)) || {}).id || null;
    const harmOut = (outs.find((p) => vt4.test(p.name)) || {}).id || null;
    const auxOut = (outs.find((p) => tr6s.test(p.name) && !/ctrl/i.test(p.name)) || {}).id || null;
    return { out, clockIn, keysIn, harmOut, auxOut };
  }

  // --- Activity flash registration ---
  onActivity(callback) {
    this._activityCallbacks.push(callback);
  }

  _flash(direction) {
    this._activityCallbacks.forEach((cb) => cb(direction));
  }

  // --- Send helpers ---

  send(bytes) {
    if (!this.output) return false;
    this.output.send(bytes);
    this._flash('out');
    return true;
  }

  // Harmony-path send: dedicated port when set, otherwise the main output.
  sendHarmony(bytes) {
    const port = this.harmonyOutput || this.output;
    if (!port) return false;
    port.send(bytes);
    this._flash('out');
    return true;
  }

  harmonyNoteOn(ch, note, vel) {
    this.sendHarmony([NOTE_ON | chNibble(ch), clamp7(note), clamp7(vel)]);
  }

  harmonyNoteOff(ch, note) {
    this.sendHarmony([NOTE_OFF | chNibble(ch), clamp7(note), 0]);
  }

  // --- Generic per-port sends (Quick Deck) ---
  sendTo(portId, bytes) {
    if (!this.access || !portId) return false;
    const port = this.access.outputs.get(portId);
    if (!port) return false;
    port.send(bytes);
    this._flash('out');
    return true;
  }

  noteOnTo(portId, ch, note, vel) { this.sendTo(portId, [NOTE_ON | chNibble(ch), clamp7(note), clamp7(vel)]); }
  noteOffTo(portId, ch, note) { this.sendTo(portId, [NOTE_OFF | chNibble(ch), clamp7(note), 0]); }
  ccTo(portId, ch, number, value) { this.sendTo(portId, [CONTROL_CHANGE | chNibble(ch), clamp7(number), clamp7(value)]); }
  pcTo(portId, ch, program) { this.sendTo(portId, [PROGRAM_CHANGE | chNibble(ch), clamp7(program)]); }

  noteOn(ch, note, vel) {
    this.send([NOTE_ON | chNibble(ch), clamp7(note), clamp7(vel)]);
  }

  noteOff(ch, note) {
    this.send([NOTE_OFF | chNibble(ch), clamp7(note), 0]);
  }

  cc(ch, number, value) {
    this.send([CONTROL_CHANGE | chNibble(ch), clamp7(number), clamp7(value)]);
  }

  pc(ch, program) {
    this.send([PROGRAM_CHANGE | chNibble(ch), clamp7(program)]);
  }

  // Realtime bytes: 0xF8 clock, 0xFA start, 0xFB continue, 0xFC stop.
  rt(byte) {
    this.send([byte]);
  }

  // Panic helpers — used on stop, mode switch, port change.
  allNotesOff() {
    for (let ch = 1; ch <= 16; ch++) this.cc(ch, 123, 0);
    if (this.harmonyOutput && this.harmonyOutput !== this.output) {
      for (let ch = 1; ch <= 16; ch++) this.sendHarmony([CONTROL_CHANGE | chNibble(ch), 123, 0]);
    }
  }

  allSoundOff() {
    for (let ch = 1; ch <= 16; ch++) this.cc(ch, 120, 0);
    if (this.harmonyOutput && this.harmonyOutput !== this.output) {
      for (let ch = 1; ch <= 16; ch++) this.sendHarmony([CONTROL_CHANGE | chNibble(ch), 120, 0]);
    }
  }
}
