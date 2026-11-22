#!/usr/bin/env node
// Regenerates the simulated SAP screens (images/screens/*.svg) and their annotation
// geometry (data/screens.json) from the specs in tools/screens/specs-*.mjs.
// Usage: node tools/generate-screens.mjs
// Optional: LOGI_PRIVATE=<folder> also builds the company-specific screens from <folder>/screens/specs-*.mjs
// into <folder>/build (never into the public site); tools/build-secure.mjs then encrypts them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specDir = path.join(root, 'tools', 'screens');
const outDir = path.join(root, 'images', 'screens');
fs.mkdirSync(outDir, { recursive: true });

const PRIV = process.env.LOGI_PRIVATE ? path.resolve(process.env.LOGI_PRIVATE) : null;
const specFiles = fs.readdirSync(specDir).filter((f) => /^specs-.*\.mjs$/.test(f)).sort();
const all = {};
const privateCodes = new Set();
for (const f of specFiles) {
  const mod = await import(pathToFileURL(path.join(specDir, f)).href);
  Object.assign(all, mod.default);
}
if (PRIV) {
  const pdir = path.join(PRIV, 'screens');
  for (const f of fs.readdirSync(pdir).filter((f) => /^specs-.*\.mjs$/.test(f)).sort()) {
    const mod = await import(pathToFileURL(path.join(pdir, f)).href);
    Object.keys(mod.default).forEach((k) => privateCodes.add(k));
    Object.assign(all, mod.default);
  }
  fs.mkdirSync(path.join(PRIV, 'build', 'images'), { recursive: true });
}

const out = {};
const privOut = {};
let files = 0;
for (const [code, fn] of Object.entries(all)) {
  const screens = fn();
  const entry = { screens: [], fields: {} };
  const isPriv = privateCodes.has(code);
  screens.forEach((s, i) => {
    const file = `images/screens/${s.file}.svg`;
    if (isPriv) { fs.writeFileSync(path.join(PRIV, 'build', 'images', `${s.file}.svg`), s.svg()); fs.rmSync(path.join(root, file), { force: true }); }
    else fs.writeFileSync(path.join(root, file), s.svg());
    files++;
    const kind = s.o.kind || (screens.length === 1 ? 'main' : i === 0 ? 'selection' : 'result');
    entry.screens.push({ src: file, w: 1120, h: 700, kind });
    for (const [k, g] of Object.entries(s.geometry())) {
      if (entry.fields[k]) console.warn(`! duplicate field key ${code}.${k}`);
      entry.fields[k] = Object.assign({ s: i }, g);
    }
  });
  (isPriv ? privOut : out)[code] = entry;
}
fs.writeFileSync(path.join(root, 'data', 'screens.json'), JSON.stringify(out));
if (PRIV) fs.writeFileSync(path.join(PRIV, 'build', 'screens.json'), JSON.stringify(privOut));

// Cross-check step field keys against the transaction database.
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'catalog.json'), 'utf8'));
const txFiles = catalog.transactions.map((f) => path.join(root, f));
if (PRIV && fs.existsSync(path.join(PRIV, 'build', 'custom.json'))) txFiles.push(path.join(PRIV, 'build', 'custom.json'));
const both = { ...out, ...privOut };
let missing = 0;
for (const p of txFiles) {
  if (!fs.existsSync(p)) continue;
  for (const t of JSON.parse(fs.readFileSync(p, 'utf8')).transactions) {
    if (!both[t.code]) { console.warn(`! no screen spec for ${t.code}`); missing++; continue; }
    for (const st of t.steps) if (!both[t.code].fields[st.f]) { console.warn(`! ${t.code}: step field "${st.f}" not found`); missing++; }
  }
}
console.log(`Generated ${files} SVG screens for ${Object.keys(both).length} transactions (${Object.keys(privOut).length} company-specific, kept private). Issues: ${missing}`);
