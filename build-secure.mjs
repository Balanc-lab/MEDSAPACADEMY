#!/usr/bin/env node
// Encrypts the company-specific section into data/secure/company.json.
// The plain content lives outside the site (LOGI_PRIVATE folder, default ../private):
//   <private>/build/custom.json   transactions (from the authoring step)
//   <private>/build/screens.json  screen geometry, <private>/build/images/*.svg  screens
// Usage: LOGI_PRIVATE=/path/to/private ACCESS_CODE=XXXX node tools/build-secure.mjs
// Encryption: AES-256-GCM, key from PBKDF2-SHA256 (600 000 iterations) over the code, upper-cased
// with spaces removed. The site decrypts in the browser; without the code the file is unreadable.
// Protection is only as strong as the code: use a long one and share it privately.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.resolve(process.env.LOGI_PRIVATE || path.join(root, '..', 'private'));
const code = (process.env.ACCESS_CODE || '').replace(/\s+/g, '').toUpperCase();
if (!code) { console.error('Set ACCESS_CODE.'); process.exit(1); }
const ITER = 600000;

const build = path.join(PRIV, 'build');
const tx = JSON.parse(fs.readFileSync(path.join(build, 'custom.json'), 'utf8')).transactions;
const screens = JSON.parse(fs.readFileSync(path.join(build, 'screens.json'), 'utf8'));
for (const entry of Object.values(screens)) {
  for (const s of entry.screens) {
    const svg = fs.readFileSync(path.join(build, 'images', path.basename(s.src)));
    s.src = 'data:image/svg+xml;base64,' + svg.toString('base64');
  }
}
const bundle = { v: 1, transactions: tx, screens };
const plain = zlib.gzipSync(Buffer.from(JSON.stringify(bundle)), { level: 9 });

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
const b64 = (u) => Buffer.from(u).toString('base64');
const out = { v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), iv: b64(iv), enc: 'AES-GCM', gzip: true, ct: b64(ct) };
fs.mkdirSync(path.join(root, 'data', 'secure'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'secure', 'company.json'), JSON.stringify(out));
console.log(`Encrypted ${tx.length} company-specific transactions and ${Object.values(screens).reduce((n, e) => n + e.screens.length, 0)} screens → data/secure/company.json (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
