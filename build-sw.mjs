#!/usr/bin/env node
// Writes the precache list and a content-hash VERSION into service-worker.js.
// Run after changing any app file: node tools/build-sw.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const core = ['./', 'index.html', 'offline.html', 'studio.html', 'manifest.json',
  ...walk('css'), ...walk('js'), ...walk('assets/fonts'), ...walk('assets/icons')]
  .map((p) => p.split(path.sep).join('/'))
  .filter((p) => p === './' || fs.existsSync(path.join(root, p)));
const hash = crypto.createHash('sha256');
for (const f of [...core.filter((p) => p !== './'), ...walk('data').map((p) => p.split(path.sep).join('/')), ...walk('images').map((p) => p.split(path.sep).join('/'))].sort()) hash.update(f).update(fs.readFileSync(path.join(root, f)));
const version = new Date().toISOString().slice(0, 10) + '-' + hash.digest('hex').slice(0, 10);
const swPath = path.join(root, 'service-worker.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`).replace(/const CORE = \/\*__CORE__\*\/\[[^\]]*\];/, `const CORE = /*__CORE__*/${JSON.stringify(core)};`);
fs.writeFileSync(swPath, sw);
console.log(`service-worker.js: VERSION ${version}, ${core.length} core files`);
