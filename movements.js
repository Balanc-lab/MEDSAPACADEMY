import { t, L, fmtNum } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, debounce, delegate } from '../core/dom.js';
import { data, getMvt, getStatus, norm } from '../core/data.js';
import { setHashSilently } from '../core/router.js';
import { txChip, mvtChip, emptyState } from './common.js';

const CATS = ['receipt', 'issue', 'transfer', 'reversal'];
const nodeName = (id) => L(getStatus(id)?.name) || L(data.flowNodes[id]?.name) || id;
const nodeIcon = (id) => getStatus(id)?.icon || data.flowNodes[id]?.icon || 'box';
const nodeTone = (id) => getStatus(id)?.color || 'ext';
const accBadge = (m) => `<span class="acc acc-${m.accDoc}">${icon(m.accDoc === 'yes' ? 'check' : m.accDoc === 'no' ? 'minus' : 'circle-help')}<span>${esc(t('mvt.acc.' + m.accDoc))}</span></span>`;

function listHTML(items) {
  if (!items.length) return emptyState('mvt.empty', 'search');
  return `<div class="mvt-table" role="list">${items.map((m) => `<a role="listitem" class="mvt-row" href="#/movements/${m.code}">
    <span class="tc mvt-code" dir="ltr">${m.code}</span>
    <span class="mvt-name"><strong>${esc(L(m.name))}</strong><span class="muted small">${esc(L(m.desc))}</span></span>
    <span class="mvt-flow small">${esc(nodeName(m.flow[0]))} ${icon(document.dir === 'rtl' ? 'arrow-left' : 'arrow-right')} ${esc(nodeName(m.flow[1]))}</span>
    <span class="mvt-cat-badge cat-${m.cat}">${esc(t('mvt.cat.' + m.cat))}</span>
    ${accBadge(m)}
  </a>`).join('')}</div>`;
}
function filter(q, cat) {
  const qn = norm(q);
  return data.mvts.filter((m) => (!cat || m.cat === cat) && (!qn || m.code.includes(q.trim()) || norm([m.name.ar, m.name.en, m.name.fr, m.desc.ar, m.desc.en, m.desc.fr].join(' ')).includes(qn)));
}

function detailHTML(m) {
  const idx = data.mvts.indexOf(m);
  const prev = data.mvts[idx - 1]; const next = data.mvts[idx + 1];
  const arrow = icon(document.dir === 'rtl' ? 'arrow-left' : 'arrow-right');
  return `<article class="mvt-detail">
    <header class="binlabel mvt-label cat-edge-${m.cat}">
      <div class="bl-id"><span class="bl-code" dir="ltr">${m.code}</span><span class="mvt-cat-badge cat-${m.cat}">${esc(t('mvt.cat.' + m.cat))}</span></div>
      <div class="bl-body"><h1 class="bl-name">${esc(L(m.name))}</h1><p class="bl-alt">${['ar', 'en', 'fr'].filter((l) => l !== document.documentElement.lang).map((l) => `<span lang="${l}">${esc(m.name[l])}</span>`).join('')}</p></div>
    </header>
    <div class="mvt-flowbox">
      <div class="flow-node tone-${nodeTone(m.flow[0])}">${icon(nodeIcon(m.flow[0]))}<span>${esc(nodeName(m.flow[0]))}</span></div>
      <div class="flow-arrow"><span class="flow-qty" dir="ltr">${esc(m.qty)}</span>${arrow}</div>
      <div class="flow-node tone-${nodeTone(m.flow[1])}">${icon(nodeIcon(m.flow[1]))}<span>${esc(nodeName(m.flow[1]))}</span></div>
    </div>
    <div class="ov-grid">
      <div class="ov-main prose">
        <section><h2 class="h-sec">${esc(t('mvt.desc'))}</h2><p>${rich(L(m.desc))}</p></section>
        <section><h2 class="h-sec">${esc(t('mvt.use'))}</h2><p>${rich(L(m.use))}</p></section>
        <section><h2 class="h-sec">${esc(t('mvt.dc'))}</h2><p>${rich(L(m.dc))}</p>
          ${m.entries.length ? `<div class="table-wrap"><table class="data-table ledger"><thead><tr><th>${esc(t('stock.dr'))}</th><th>${esc(t('stock.cr'))}</th><th class="num">${esc(t('mvt.amount'))}</th><th>${esc(t('mvt.key'))}</th></tr></thead><tbody>${m.entries.map((e) => `<tr><td>${esc(L(data.accounts[e.dr]))}</td><td>${esc(L(data.accounts[e.cr]))}</td><td class="num" dir="ltr">${fmtNum(e.amt, 2)} MAD</td><td dir="ltr"><code>${esc(e.key)}</code></td></tr>`).join('')}</tbody></table></div>` : `<p class="muted small">${esc(t('stock.noEntry'))}</p>`}
        </section>
        <section class="callout callout-scenario"><h2 class="h-sec">${icon('lightbulb')}<span>${esc(t('mvt.scenario'))}</span></h2><p>${rich(L(m.scenario))}</p></section>
      </div>
      <aside class="ov-side">
        <section class="side-card"><h2 class="h-side">${esc(t('mvt.stock'))}</h2><p>${esc(nodeName(m.flow[0]))} ${arrow} ${esc(nodeName(m.flow[1]))}</p><p class="num" dir="ltr">${esc(m.qty)}</p></section>
        <section class="side-card"><h2 class="h-side">${esc(t('mvt.matDoc'))}</h2><p>${icon('check')} ${esc(t('mvt.always'))}</p></section>
        <section class="side-card"><h2 class="h-side">${esc(t('mvt.accDoc'))}</h2>${accBadge(m)}<p class="small">${rich(L(m.acc))}</p></section>
        ${m.reversal ? `<section class="side-card"><h2 class="h-side">${esc(t('mvt.reversal'))}</h2>${mvtChip(m.reversal)}</section>` : ''}
        ${m.reverses ? `<section class="side-card"><h2 class="h-side">${esc(t('mvt.reverses'))}</h2>${mvtChip(m.reverses)}</section>` : ''}
        <section class="side-card"><h2 class="h-side">${esc(t('mvt.tx'))}</h2><div class="chip-row">${m.tx.map((c) => txChip(c)).join('')}</div></section>
      </aside>
    </div>
    <p class="note">${icon('info')}<span>${esc(L(data.mvtNote))}</span></p>
    <nav class="pager">${prev ? `<a class="btn" href="#/movements/${prev.code}">${icon(document.dir === 'rtl' ? 'chevron-right' : 'chevron-left')}<span dir="ltr">${prev.code}</span></a>` : '<span></span>'}${next ? `<a class="btn" href="#/movements/${next.code}"><span dir="ltr">${next.code}</span>${icon(document.dir === 'rtl' ? 'chevron-left' : 'chevron-right')}</a>` : ''}</nav>
  </article>`;
}

export default {
  name: 'movements',
  render({ params, query }) {
    if (params.code) {
      const m = getMvt(params.code);
      if (!m) return { title: params.code, crumbs: [{ label: t('nav.movements'), href: '#/movements' }, { label: params.code, code: true }], nav: 'movements', html: emptyState('mvt.notFound', 'search', { code: params.code }, `<a class="btn" href="#/movements">${esc(t('nav.movements'))}</a>`) };
      return { title: `${m.code} – ${L(m.name)}`, crumbs: [{ label: t('nav.movements'), href: '#/movements' }, { label: m.code, code: true }], nav: 'movements', html: detailHTML(m) };
    }
    const q = query.q || ''; const cat = query.cat || '';
    const items = filter(q, cat);
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('mvt.title'))}</h1><p class="page-sub">${esc(t('mvt.sub', { n: data.mvts.length }))}</p></header>
    <div class="toolbar"><label class="search-field">${icon('search')}<input id="mq" type="search" value="${attr(q)}" placeholder="${attr(t('mvt.placeholder'))}" aria-label="${attr(t('mvt.placeholder'))}"></label></div>
    <div class="chip-row" role="group" aria-label="${attr(t('filters.title'))}"><button type="button" class="chip" data-cat="" aria-pressed="${!cat}">${esc(t('filters.all'))}</button>${CATS.map((c) => `<button type="button" class="chip" data-cat="${c}" aria-pressed="${cat === c}"><span class="dot cat-${c}"></span>${esc(t('mvt.cat.' + c))}</button>`).join('')}</div>
    <p class="result-count" id="mcount">${esc(t('mvt.count', { n: items.length }))}</p>
    <div id="mlist">${listHTML(items)}</div>
    <p class="note">${icon('info')}<span>${esc(L(data.mvtNote))}</span></p>`;
    return { title: t('mvt.title'), crumbs: [{ label: t('nav.movements') }], nav: 'movements', html };
  },
  mount(root, r) {
    if (r.params.code) return null;
    const st = { q: r.query.q || '', cat: r.query.cat || '' };
    const upd = () => {
      const items = filter(st.q, st.cat);
      root.querySelector('#mlist').innerHTML = listHTML(items);
      root.querySelector('#mcount').textContent = t('mvt.count', { n: items.length });
      const qs = new URLSearchParams(Object.entries(st).filter(([, v]) => v)).toString();
      setHashSilently('#/movements' + (qs ? '?' + qs : ''));
    };
    const input = root.querySelector('#mq');
    input.addEventListener('input', debounce(() => { st.q = input.value; upd(); }, 100));
    const off = delegate(root, 'click', '[data-cat]', (e, el) => { st.cat = el.dataset.cat; root.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === st.cat))); upd(); });
    return off;
  }
};
