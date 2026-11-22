import { t, L, LL, fmtNum, isRTL } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, delegate, toast } from '../core/dom.js';
import { data, getMvt, getStatus } from '../core/data.js';
import { setHashSilently, navigate } from '../core/router.js';
import { txChip, mvtChip, list } from './common.js';

const VBW = 1080; const VBH = 540; const NW = 168; const NH = 54;

function statusDetail(s) {
  return `<header class="st-head tone-${s.color}">${icon(s.icon)}<div><h2>${esc(L(s.name))}</h2><p class="st-tags"><span class="tag">${esc(t('stock.kind.' + s.kind))}</span><span class="tag">${esc(t(s.valuated ? 'stock.valuated' : 'stock.notValuated'))}</span><span class="tag">${esc(t(s.usable ? 'stock.usable' : 'stock.notUsable'))}</span></p></div></header>
  <div class="st-grid">
    <section><h3 class="h-side">${esc(t('stock.definition'))}</h3><p>${rich(L(s.definition))}</p></section>
    <section><h3 class="h-side">${esc(t('stock.meaning'))}</h3><p>${rich(L(s.meaning))}</p></section>
    <section><h3 class="h-side">${icon('arrow-down')}<span>${esc(t('stock.enters'))}</span></h3>${list(LL(s.enters))}</section>
    <section><h3 class="h-side">${icon('arrow-up')}<span>${esc(t('stock.leaves'))}</span></h3>${list(LL(s.leaves))}</section>
    <section><h3 class="h-side">${esc(t('stock.tx'))}</h3><div class="chip-row">${s.tx.map((c) => txChip(c)).join('')}</div></section>
    <section><h3 class="h-side">${esc(t('stock.mvts'))}</h3><div class="chip-row">${s.mvts.length ? s.mvts.map(mvtChip).join('') : `<span class="muted small">${esc(t('stock.noMvt'))}</span>`}</div></section>
    <section class="callout callout-ledger"><h3 class="h-side">${icon('scale')}<span>${esc(t('stock.accounting'))}</span></h3><p>${rich(L(s.accounting))}</p></section>
    <section class="callout callout-scenario"><h3 class="h-side">${icon('lightbulb')}<span>${esc(t('stock.example'))}</span></h3><p>${rich(L(s.example))}</p></section>
  </div>`;
}

function nodeLabel(id) {
  const s = getStatus(id);
  if (s) return L(s.name);
  return L(data.flowNodes[id]?.name) || id;
}
function wrap2(text) {
  if (text.length <= 18) return [text];
  const mid = Math.floor(text.length / 2);
  let cut = text.lastIndexOf(' ', mid); const after = text.indexOf(' ', mid);
  if (cut < 0 || (after > 0 && after - mid < mid - cut)) cut = after;
  return cut > 0 ? [text.slice(0, cut), text.slice(cut + 1)] : [text];
}
function diagram(active) {
  const d = data.stock.diagram;
  const rtl = isRTL();
  const pos = {};
  d.nodes.forEach((n) => { pos[n.id] = { x: rtl ? VBW - n.x : n.x, y: n.y }; });
  const edgePath = (e) => {
    const a = pos[e.from]; const b = pos[e.to];
    const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len; const ny = dx / len;
    const bend = e.bend ? 34 : 0;
    const mx = (a.x + b.x) / 2 + nx * bend; const my = (a.y + b.y) / 2 + ny * bend;
    const clip = (p, q) => { const ddx = q.x - p.x; const ddy = q.y - p.y; const sx = ddx ? (NW / 2 + 6) / Math.abs(ddx) : Infinity; const sy = ddy ? (NH / 2 + 6) / Math.abs(ddy) : Infinity; const s = Math.min(sx, sy); return { x: p.x + ddx * s, y: p.y + ddy * s }; };
    const s = clip(a, { x: mx, y: my }); const tEnd = clip(b, { x: mx, y: my });
    const lx = 0.25 * s.x + 0.5 * mx + 0.25 * tEnd.x; const ly = 0.25 * s.y + 0.5 * my + 0.25 * tEnd.y;
    return { d: `M${s.x} ${s.y} Q${mx} ${my} ${tEnd.x} ${tEnd.y}`, lx, ly };
  };
  const edges = d.edges.map((e, i) => {
    const p = edgePath(e); const hot = active && (e.from === active || e.to === active);
    const w = Math.max(38, e.label.length * 7.4 + 14);
    return `<g class="dg-edge${hot ? ' hot' : ''}"><path d="${p.d}" marker-end="url(#dgA)"/><g class="dg-label" role="button" tabindex="0" data-edge="${i}" aria-label="${attr(t('stock.edgeAria', { label: e.label, from: nodeLabel(e.from), to: nodeLabel(e.to) }))}"><rect x="${p.lx - w / 2}" y="${p.ly - 11}" width="${w}" height="22" rx="11"/><text x="${p.lx}" y="${p.ly + 4.5}" text-anchor="middle" direction="ltr">${esc(e.label)}</text></g></g>`;
  }).join('');
  const nodes = d.nodes.map((n) => {
    const p = pos[n.id]; const s = getStatus(n.id); const lines = wrap2(nodeLabel(n.id));
    const tone = s ? s.color : 'ext';
    return `<g class="dg-node tone-${tone}${n.id === active ? ' on' : ''}${s ? ' is-status' : ''}" ${s ? `role="button" tabindex="0" data-node="${n.id}" aria-label="${attr(L(s.name))}"` : ''} transform="translate(${p.x - NW / 2} ${p.y - NH / 2})"><rect width="${NW}" height="${NH}" rx="12"/>${lines.map((ln, i) => `<text x="${NW / 2}" y="${NH / 2 + (lines.length === 1 ? 5 : i === 0 ? -3 : 14)}" text-anchor="middle">${esc(ln)}</text>`).join('')}</g>`;
  }).join('');
  return `<svg class="dg" viewBox="0 0 ${VBW} ${VBH}" role="group" aria-label="${attr(t('stock.diagram'))}"><defs><marker id="dgA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>${edges}${nodes}</svg>`;
}

// ---- stock journey simulator ----
function journeyState(upTo) {
  const j = data.stock.journey;
  const b = { rm_onorder: 0, rm_qi: 0, rm_unr: 0, fg_unr: 0 };
  const entries = [];
  for (let i = 0; i <= upTo; i++) { const s = j.steps[i]; Object.entries(s.delta).forEach(([k, v]) => { b[k] += v; }); s.entries.forEach((e) => entries.push({ ...e, step: i })); }
  const value = (b.rm_qi + b.rm_unr) * j.prices.rm + b.fg_unr * j.prices.fg;
  return { b, entries, value };
}
function journeyBody(i) {
  const j = data.stock.journey; const s = j.steps[i]; const { b, entries, value } = journeyState(i);
  const buckets = [['rm_onorder', 100, 'violet'], ['rm_qi', 100, 'amber'], ['rm_unr', 100, 'green'], ['fg_unr', 50, 'blue']];
  const acc = (k) => L(data.accounts[k]);
  return `<div class="j-card"><p class="j-step-n">${esc(t('common.of', { a: i + 1, b: j.steps.length }))}</p><h3>${esc(L(s.title))}</h3><p>${rich(L(s.desc))}</p><div class="chip-row">${s.tx ? txChip(s.tx) : ''}${s.mvt ? mvtChip(s.mvt) : ''}</div></div>
  <div class="j-buckets">${buckets.map(([k, max, tone]) => `<div class="j-bucket"><span class="j-label">${esc(t('stock.bucket.' + k))}</span><span class="j-bar tone-${tone}"><span style="width:${Math.min(100, (b[k] / max) * 100)}%"></span></span><span class="num j-qty" dir="ltr">${fmtNum(b[k])} PC</span></div>`).join('')}
    <p class="j-value">${esc(t('stock.inventoryValue'))} <strong class="num" dir="ltr">${fmtNum(value, 2)} MAD</strong></p></div>
  <div class="j-journal"><h4>${esc(t('stock.journal'))}</h4>${entries.length ? `<table class="data-table compact"><thead><tr><th>${esc(t('stock.dr'))}</th><th>${esc(t('stock.cr'))}</th><th class="num">${esc(t('mvt.amount'))}</th></tr></thead><tbody>${entries.map((e) => `<tr class="${e.step === i ? 'fresh' : ''}"><td>${esc(acc(e.dr))}</td><td>${esc(acc(e.cr))}</td><td class="num" dir="ltr">${fmtNum(e.amt, 2)}</td></tr>`).join('')}</tbody></table>` : `<p class="muted small">${esc(t('stock.noEntry'))}</p>`}</div>`;
}

export default {
  name: 'stock',
  render({ params }) {
    const st = data.stock;
    const sel = params.id && getStatus(params.id) ? params.id : 'unrestricted';
    const s = getStatus(sel);
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('stock.title'))}</h1><p class="page-sub">${esc(t('stock.sub'))}</p></header>
    <section class="concepts">
      <div class="concept concept-main">${icon('scale')}<div><h2>${esc(t('stock.concepts'))}</h2><p>${rich(L(st.concepts.quantityVsStatus))}</p></div></div>
      <div class="concept">${icon('info')}<p>${rich(L(st.concepts.reservationNote))}</p></div>
      <div class="concept">${icon('badge-check')}<p>${rich(L(st.concepts.valuationNote))}</p></div>
    </section>
    <div class="st-tiles" role="tablist" aria-label="${attr(t('stock.title'))}">${st.statuses.map((x) => `<button type="button" role="tab" class="st-tile tone-${x.color}" data-st="${x.id}" aria-selected="${x.id === sel}" aria-controls="stDetail">${icon(x.icon)}<span class="st-tile-name">${esc(L(x.name))}</span><span class="st-tile-kind">${esc(t('stock.kind.' + x.kind))}</span></button>`).join('')}</div>
    <section class="st-detail" id="stDetail" role="tabpanel">${statusDetail(s)}</section>
    <section class="panel dg-panel"><div class="band-head"><h2 class="sec-title">${icon('network')}<span>${esc(t('stock.diagram'))}</span></h2></div><p class="muted small">${esc(t('stock.diagramHint'))}</p><div class="dg-wrap" id="dgWrap">${diagram(sel)}</div><p class="dg-info small" id="dgInfo" aria-live="polite"></p></section>
    <section class="panel journey" id="journey"><div class="band-head"><h2 class="sec-title">${icon('route')}<span>${esc(t('stock.journey'))}</span></h2></div><p class="muted">${esc(t('stock.journeySub'))}</p>
      <ol class="j-steps">${st.journey.steps.map((x, i) => `<li><button type="button" data-j="${i}" class="${i === 0 ? 'on' : ''}" aria-pressed="${i === 0}"><span class="j-dot">${i + 1}</span><span>${esc(L(x.title))}</span></button></li>`).join('')}</ol>
      <div class="j-body" id="jBody">${journeyBody(0)}</div>
      <div class="row-end"><button type="button" class="btn" data-jr>${icon('rotate-ccw')}<span>${esc(t('stock.reset'))}</span></button><button type="button" class="btn btn-primary" data-jn>${icon('play')}<span>${esc(t('stock.postNext'))}</span></button></div>
      <p class="small muted">${esc(L(data.mvtNote))}</p>
    </section>`;
    return { title: t('stock.title'), crumbs: [{ label: t('nav.stock') }], nav: 'stock', html };
  },
  mount(root) {
    let sel = root.querySelector('[data-st][aria-selected="true"]')?.dataset.st || 'unrestricted';
    let ji = 0;
    const steps = data.stock.journey.steps.length;
    const select = (id, scroll) => {
      sel = id;
      root.querySelectorAll('[data-st]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.st === id)));
      root.querySelector('#stDetail').innerHTML = statusDetail(getStatus(id));
      root.querySelector('#dgWrap').innerHTML = diagram(id);
      setHashSilently('#/stock/' + id);
      if (scroll) root.querySelector('#stDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const setJ = (i) => {
      ji = Math.max(0, Math.min(steps - 1, i));
      root.querySelectorAll('[data-j]').forEach((b, k) => { b.classList.toggle('on', k <= ji); b.setAttribute('aria-pressed', String(k === ji)); });
      root.querySelector('#jBody').innerHTML = journeyBody(ji);
      root.querySelector('[data-jn]').disabled = ji >= steps - 1;
    };
    const edgeClick = (i) => {
      const e = data.stock.diagram.edges[i];
      const known = e.mts.filter((m) => getMvt(m));
      const info = root.querySelector('#dgInfo');
      if (known.length === 1 && e.mts.length === 1) { navigate('#/movements/' + known[0]); return; }
      info.innerHTML = `${icon('info')} ${esc(t('stock.edgeInfo', { label: e.label, from: nodeLabel(e.from), to: nodeLabel(e.to) }))} ${known.map(mvtChip).join(' ')}`;
    };
    const offs = [
      delegate(root, 'click', '[data-st]', (e, el) => select(el.dataset.st)),
      delegate(root, 'click', '[data-node]', (e, el) => select(el.dataset.node, true)),
      delegate(root, 'click', '[data-edge]', (e, el) => edgeClick(Number(el.dataset.edge))),
      delegate(root, 'keydown', '[data-node],[data-edge]', (e, el) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (el.dataset.node) select(el.dataset.node, true); else edgeClick(Number(el.dataset.edge)); } }),
      delegate(root, 'click', '[data-j]', (e, el) => setJ(Number(el.dataset.j))),
      delegate(root, 'click', '[data-jn]', () => setJ(ji + 1)),
      delegate(root, 'click', '[data-jr]', () => setJ(0))
    ];
    return () => offs.forEach((f) => f());
  }
};
export { toast };
