// DOM and formatting helpers shared by all views.
import { isRTL, t } from './i18n.js';
import { icon } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export const attr = esc;

let linker = null;
export function setLinker(fn) { linker = fn; }

// Inline formatting for content strings: `code`, **bold**, auto-linked T-codes and
// bidi isolation of Latin/technical runs inside Arabic text.
export function rich(raw) {
  const s = String(raw ?? '');
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let out = ''; let last = 0; let m;
  while ((m = re.exec(s))) {
    out += plain(s.slice(last, m.index));
    out += m[1] != null ? `<code dir="ltr">${esc(m[1])}</code>` : `<strong>${plain(m[2])}</strong>`;
    last = re.lastIndex;
  }
  return out + plain(s.slice(last));
}
const RUN = /[A-Za-z0-9\/][A-Za-z0-9\/_.+\-]*(?:(?:, |[ :×=]|\s→\s|\s\/\s)[A-Za-z0-9\/][A-Za-z0-9\/_.+\-]*)*/g;
function plain(s) {
  let out = ''; let last = 0; let m;
  RUN.lastIndex = 0;
  while ((m = RUN.exec(s))) {
    out += esc(s.slice(last, m.index)) + wrapRun(m[0]);
    last = RUN.lastIndex;
  }
  return out + esc(s.slice(last));
}
function wrapRun(run) {
  const html = run.split(/(\s+|,)/).map((tok) => {
    if (!linker || !tok.trim()) return esc(tok);
    const mm = tok.match(/^(.*?)([.:;)]*)$/);
    const link = linker(mm[1]);
    return link ? link + esc(mm[2]) : esc(tok);
  }).join('');
  return isRTL() ? `<bdi>${html}</bdi>` : html;
}
export const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;

export function debounce(fn, ms = 150) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }
export function delegate(root, type, selector, handler) {
  const fn = (e) => { const el = e.target.closest(selector); if (el && root.contains(el)) handler(e, el); };
  root.addEventListener(type, fn);
  return () => root.removeEventListener(type, fn);
}

export function toast(msg, opts = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast' + (opts.tone ? ' toast-' + opts.tone : '');
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>${opts.action ? `<button type="button" class="toast-btn">${esc(opts.action.label)}</button>` : ''}`;
  if (opts.action) el.querySelector('button').addEventListener('click', () => { opts.action.fn(); el.remove(); });
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const ttl = opts.timeout ?? 3200;
  if (ttl > 0) setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); }, ttl);
  return el;
}

let modalStack = [];
export function openModal({ title = '', html = '', wide = false, onMount = null, onClose = null, label = '' }) {
  const host = document.getElementById('modals');
  const prev = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${attr(label || title)}"><div class="modal-head"><h2 class="modal-title">${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="${attr(t('common.close'))}">${icon('x')}</button></div><div class="modal-body">${html}</div></div>`;
  host.appendChild(wrap);
  document.body.classList.add('has-modal');
  const close = () => {
    wrap.remove();
    modalStack = modalStack.filter((m) => m !== close);
    if (!modalStack.length) document.body.classList.remove('has-modal');
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose();
    if (prev && prev.focus) prev.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape' && modalStack[modalStack.length - 1] === close) close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  modalStack.push(close);
  const focusable = wrap.querySelector('.modal-body input, .modal-body button, .modal-body a, .modal-head button');
  if (focusable) setTimeout(() => focusable.focus(), 30);
  if (onMount) onMount(wrap.querySelector('.modal'), close);
  return close;
}
export function confirmDialog(message, okLabel) {
  return new Promise((resolve) => {
    let done = false;
    const close = openModal({
      title: t('common.confirm'),
      html: `<p>${esc(message)}</p><div class="row-end"><button class="btn" data-no type="button">${esc(t('common.cancel'))}</button><button class="btn btn-danger" data-yes type="button">${esc(okLabel || t('common.confirm'))}</button></div>`,
      onMount: (m, c) => {
        m.querySelector('[data-yes]').addEventListener('click', () => { done = true; resolve(true); c(); });
        m.querySelector('[data-no]').addEventListener('click', () => c());
      },
      onClose: () => { if (!done) resolve(false); }
    });
    return close;
  });
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (er) { ok = false; }
    ta.remove(); return ok;
  }
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Code 39 barcode (start/stop "*") rendered as SVG bars. Supports A–Z, 0–9 and - . space $ / + %.
const C39 = { '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001', 'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000', 'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100', 'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011', 'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110', 'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001', 'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100', '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010' };
export function code39(text, { height = 46, narrow = 1.6, ratio = 2.6, label = '' } = {}) {
  const chars = ('*' + String(text).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '') + '*').split('');
  let x = 0; let bars = '';
  const wide = narrow * ratio;
  chars.forEach((ch, ci) => {
    const p = C39[ch];
    for (let i = 0; i < 9; i++) {
      const w = p[i] === '1' ? wide : narrow;
      if (i % 2 === 0) bars += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}"/>`;
      x += w;
    }
    if (ci < chars.length - 1) x += narrow;
  });
  return `<svg class="barcode" viewBox="0 0 ${x.toFixed(2)} ${height}" preserveAspectRatio="none" role="img" aria-label="${attr(label || 'Code 39: ' + text)}" fill="currentColor">${bars}</svg>`;
}
