# husband & wife · generative engine · v2

A generative MIDI engine for the Roland MC-707 + VT-4 (+ Arturia Keystep). It
drives them algorithmically: Euclidean rhythm sequencing with probability gates,
clock-synced LFO CC automation, and a clock-locked harmony driver that
auto-advances through a chord progression — or, in **follow mode**, derives the
chord live from notes played on the Keystep — sending MIDI notes to the VT-4 to
control its Harmony voices.

Companion to v1 (`hw-707-control.html`) — the v2 header links to it. v1 is not
modified by v2. Tone/patch/effect editing is B67's domain and is intentionally
absent here.

## MIDI routing (four ports)

| Header selector | Cable | Purpose |
|---|---|---|
| `OUT` | 707 USB | app → 707 (CC, PC, transport); harmony notes too while HARM OUT is unset |
| `CLOCK IN` | 707 USB | 707 → app, MIDI clock for slave mode |
| `KEYS IN` | Keystep USB | Keystep → app, note input for follow mode |
| `HARM OUT` | VT-4 USB | app → VT-4 directly, harmony notes. "— follow OUT —" routes them via the main OUT (707 DIN OUT2 path) instead |

Hardware (707 owns tempo): `707 MIDI OUT1 → Keystep MIDI IN` (clock),
`Keystep MIDI OUT → 707 MIDI IN` (notes/arp), `707 MIDI OUT2 → VT-4 MIDI IN`
(harmony). Ports auto-detect by name on launch (Roland/707, Arturia/Keystep, VT-4 for HARM OUT);
override from the dropdowns.

## Harmony modes

- **auto** — progression advances on its per-step bar count (default).
- **lock** — holds the current chord; press again to resume.
- **manual** — tap NEXT to advance one step.
- **follow** — chord is detected live from held Keystep notes (40ms debounced)
  and sent to the VT-4; the progression pauses and resumes where it left off.

## Running it

Web MIDI runs in **Chrome or Edge on desktop only** (not Safari/Firefox).

Because v2 is built as ES modules, Chrome blocks loading it from a `file://`
URL (CORS). Serve the folder over HTTP:

```
cd hw-v2
python3 -m http.server 8080
```

Then open <http://localhost:8080> in Chrome or Edge and allow MIDI access.

## Signal chain

```
condenser mic (XLR) → VT-4 (phantom ON, rear jack)
  → L OUT (wet) → 707 EXT IN L
  → R OUT (dry/bypass) → 707 EXT IN R
  → 707 master FX → MIX OUT
```

On the 707: `SHIFT + INPUT` → set EXT IN type = **LINE** (not MIC).
For USB MIDI to the VT-4 harmony driver, enable TxUSB MIDI on the 707
(`SHIFT + TRACK SEL` per track) and reconnect USB.

## Standalone desktop app (double-click, no server)

`hw-v2-standalone.html` (repo root) is a single self-contained file — all CSS
and JS inlined — so it runs by double-clicking, no local server needed. Keep it
on your desktop next to `hw-707-control.html` (the v1 link expects it there) and
open it in Chrome/Edge.

For an app-like window with its own icon: open the file in Chrome → ⋮ menu →
*Cast, save, and share* → **Create shortcut…** → tick **Open as window**.

Rebuild it after changing any module:

```
cd hw-v2
node build-standalone.mjs   # → ../hw-v2-standalone.html
```

The build just inlines the existing modules (each wrapped in its own scope); the
shipped app stays vanilla JS — no framework, no runtime dependencies.

## Files

| File | Role |
|---|---|
| `index.html` | shell: layout, panels, font imports — no logic |
| `style.css` | design tokens + all CSS (v1 palette) |
| `midi.js` | port management, send helpers, activity |
| `clock.js` | AudioContext lookahead scheduler + MIDI clock slave |
| `euclidean.js` | Bjorklund generator + probability gate |
| `lfo.js` | LFO shapes, CC targeting, rate/depth |
| `harmony.js` | VT-4 harmony driver: progression, auto-advance, notes |
| `ui.js` | wires all modules to the DOM (entry point) |

State auto-saves to `localStorage` (`hw_v2_state`) and restores on load.

## Scope

MIDI controller only. No SysEx, no patch/tone editing, no audio DSP — that
territory belongs to B67 and v1.
