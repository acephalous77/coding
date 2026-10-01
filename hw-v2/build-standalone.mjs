// build-standalone.mjs — bundle the v2 app into one self-contained HTML file
// that runs by double-clicking (no server, no modules). Vanilla, no deps.
//
//   node build-standalone.mjs   →   ../hw-v2-standalone.html
//
// Each module is wrapped in its own IIFE (so per-file helpers like clamp7/PPQ
// don't collide) and its exports are published on window; ui.js reads them back.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

// Modules in dependency order; entry last.
const MODULES = ['midi.js', 'clock.js', 'euclidean.js', 'lfo.js', 'harmony.js', 'listener.js'];
const ENTRY = 'ui.js';

// Collect `export class/function/const NAME` identifiers from a source.
function exportedNames(src) {
  const names = [];
  const re = /^export\s+(?:class|function|const)\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

// Strip the `export ` keyword (keeps the declaration).
const stripExports = (src) => src.replace(/^export\s+/gm, '');

function wrapModule(file) {
  const src = read(file);
  const names = exportedNames(src);
  const body = stripExports(src);
  const publish = names.length ? `\nObject.assign(window, { ${names.join(', ')} });\n` : '';
  return `/* ===== ${file} ===== */\n(function(){\n"use strict";\n${body}${publish}})();\n`;
}

function wrapEntry(file) {
  let src = read(file);
  // Remove import statements (single- or multi-line); names are read from
  // window instead.
  src = src.replace(/import\s+[\s\S]*?from\s*['"][^'"]+['"];?/g, '');
  const needed = [
    'MidiEngine', 'ClockEngine', 'EuclideanEngine', 'LFOEngine', 'HarmonyEngine',
    'CHORD_QUALITIES', 'NOTE_NAMES', 'chordName', 'midiNoteName',
  ];
  const destructure = `const { ${needed.join(', ')} } = window;\n`;
  return `/* ===== ${file} (entry) ===== */\n(function(){\n"use strict";\n${destructure}${src}\n})();\n`;
}

const bundle = [...MODULES.map(wrapModule), wrapEntry(ENTRY)].join('\n');
const css = read('style.css');

// Start from index.html and inline CSS + JS; drop the file:// fallback (the
// standalone has no modules to fail) and point the v1 link at a sibling file.
let html = read('index.html');
html = html.replace(
  /<link rel="stylesheet" href="style.css"\s*\/>/,
  `<style>\n${css}\n</style>`
);
// Remove the module-load fallback banner + its detection script.
html = html.replace(/<!-- ============ FILE:\/\/ MODULE-LOAD FALLBACK ============ -->[\s\S]*?<\/script>\n/, '');
// v1 lives next to the standalone file on the desktop.
html = html.replace('href="../hw-707-control.html"', 'href="hw-707-control.html"');
html = html.replace(
  /<script type="module" src="ui.js"><\/script>/,
  `<script>\n${bundle}\n</script>`
);

const out = join(here, '..', 'hw-v2-standalone.html');
writeFileSync(out, html);
console.log('Wrote', out, '(' + Math.round(html.length / 1024) + ' KB)');
