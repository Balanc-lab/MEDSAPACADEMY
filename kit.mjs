// Reusable building blocks for the simulated screens (training simulations only).
import { W, H, C, tw, union } from './lib.mjs';

export const EXEC = { l: 'Execute', icon: 'exec', k: 'exec', dir: 'right', gap: 60 };
export const HELP = { l: 'Help', right: true };

// Light veil behind a modal dialog.
export function dim(s) { s.rect(0, 85, W, H - 85 - 32, { fill: 'rgba(30,45,60,0.10)' }); }

// Buttons laid out from x to the right; returns the boxes.
export function buttons(s, x, y, list) {
  const out = [];
  let cx = x;
  for (const b of list) { const box = s.button(cx, y, b.l, b); out.push(box); cx += box[2] + 8; }
  return out;
}

// Vertical list of checkable rows inside a white panel (e.g. "Select View(s)").
export function pickList(s, x, y, w, items, selected = [], o = {}) {
  const rowH = o.rowH || 25;
  const h = items.length * rowH + 8;
  s.rect(x, y, w, h, { fill: '#FFFFFF', stroke: C.border });
  items.forEach((it, i) => {
    const ry = y + 4 + i * rowH;
    const on = selected.includes(i);
    if (on) s.rect(x + 1, ry, w - 2, rowH, { fill: C.sel });
    s.rect(x + 10, ry + 6, 13, 13, { fill: on ? C.brand : '#FFFFFF', stroke: on ? C.brand : C.inputBorder, rx: 2 });
    if (on) s.add(`<path d="M${x + 13} ${ry + 12.5}l3 3l5 -6" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>`);
    s.text(x + 34, ry + 17, it, { size: 12.5, weight: on ? 700 : 400 });
  });
  return [x, y, w, h];
}

// Label/value pairs written as plain display text (header blocks).
export function kv(s, x, y, pairs, o = {}) {
  const lw = o.lw || 120;
  const rowH = o.rowH || 24;
  pairs.forEach(([l, v], i) => {
    s.text(x, y + i * rowH, l, { fill: C.muted, size: 12.5 });
    s.text(x + lw, y + i * rowH, v, { size: 12.5, weight: o.bold && o.bold.includes(i) ? 700 : 400 });
  });
  return [x - 6, y - 17, lw + (o.vw || 200), pairs.length * rowH + 6];
}

// Collapsed header bar ("▸ Header").
export function collapsed(s, x, y, w, label) {
  s.rect(x, y, w, 30, { fill: C.panel, stroke: C.border, rx: 6 });
  s.add(`<path d="M${x + 14} ${y + 10}l5 5l-5 5" fill="none" stroke="${C.muted}" stroke-width="1.6"/>`);
  s.text(x + 30, y + 20, label, { weight: 700, size: 13 });
  return [x, y, w, 30];
}

// Small rounded status pill.
export function pill(s, x, y, label, tone = 'info') {
  const col = { ok: C.green, warn: C.amber, error: C.red, info: C.blue, neutral: C.muted }[tone];
  const w = tw(label, 12) + 18;
  s.rect(x, y, w, 20, { fill: '#FFFFFF', stroke: col, rx: 10 });
  s.text(x + 9, y + 14, label, { size: 12, fill: col, weight: 700 });
  return [x, y, w, 20];
}

// EWM-style "Find" bar used by the warehouse UI framework.
export function findBar(s, y, objectLabel, value, o = {}) {
  s.rect(12, y, W - 24, 40, { fill: C.panel, stroke: C.border, rx: 6 });
  s.text(26, y + 25, 'Find', { fill: C.label });
  const a = s.input(66, y + 8, 210, objectLabel, { type: 'select' });
  const b = s.input(286, y + 8, 200, value, { mono: true });
  const g = s.button(496, y + 7, 'Go', { icon: 'arrowR' });
  if (o.k) s.reg(o.k, [a[0] - 4, y + 3, g[0] + g[2] - a[0] + 8, 34], o.dir || 'bottom', [a[0], a[1], g[0] + g[2] - a[0], 24]);
  if (o.extra) s.text(600, y + 25, o.extra, { fill: C.muted, size: 12.5 });
  return [12, y, W - 24, 40];
}

export { union };
