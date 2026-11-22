// Company-specific section: decrypts data/secure/company.json in the browser with the access code.
// The derived key (not the code) can be remembered on this device.
const KEY_STORE = 'la.companyKey';
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u) => btoa(String.fromCharCode(...new Uint8Array(u)));
export const normCode = (c) => String(c || '').replace(/\s+/g, '').toUpperCase();

let envelope = null;
export async function getEnvelope(url) {
  if (envelope) return envelope;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('secure ' + res.status);
  envelope = await res.json();
  return envelope;
}

async function deriveRaw(code, env) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normCode(code)), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(env.salt), iterations: env.iter }, base, 256);
}

async function decryptWith(raw, env) {
  const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(env.iv) }, key, b64(env.ct));
  let bytes = plain;
  if (env.gzip) bytes = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(bytes));
}

export const canDecrypt = () => !!(window.crypto && crypto.subtle && 'DecompressionStream' in window);

// Returns the bundle, or throws { wrong: true } when the code is wrong.
export async function unlockWithCode(url, code, remember) {
  const env = await getEnvelope(url);
  const raw = await deriveRaw(code, env);
  let bundle;
  try { bundle = await decryptWith(raw, env); } catch (e) { const err = new Error('wrong code'); err.wrong = true; throw err; }
  try {
    if (remember) localStorage.setItem(KEY_STORE, JSON.stringify({ salt: env.salt, k: toB64(raw) }));
    else localStorage.removeItem(KEY_STORE);
  } catch (e) { /* storage unavailable */ }
  return bundle;
}

// Silent unlock with a remembered key; returns null when there is none or it no longer fits.
export async function unlockRemembered(url) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY_STORE) || 'null'); } catch (e) { saved = null; }
  if (!saved) return null;
  try {
    const env = await getEnvelope(url);
    if (env.salt !== saved.salt) { forget(); return null; }
    return await decryptWith(b64(saved.k), env);
  } catch (e) { forget(); return null; }
}

export function forget() { try { localStorage.removeItem(KEY_STORE); } catch (e) { /* ignore */ } }
export function isRemembered() { try { return !!localStorage.getItem(KEY_STORE); } catch (e) { return false; } }
