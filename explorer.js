import { t, L } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, debounce, delegate, toast } from '../core/dom.js';
import { data, search } from '../core/data.js';
import { store } from '../core/store.js';
import { setHashSilently } from '../core/router.js';
import { txCard, emptyState } from './common.js';

const MODULES = ['MM', 'WM', 'LE', 'EWM', 'QM', 'PP', 'SD', 'BC'];

function filtered(q, m, a) {
  let list = data.tx;
  if (q) { const hits = search(q, { types: ['tx'], limit: 200 }).map((e) => e.id); list = hits.map((c) => data.txMap.get(c)).filter(Boolean); }
  if (m) list = list.filter((x) => x.module === m);
  if (a) list = list.filter((x) => (x.areas || []).includes(a));
  return list;
}
function sorted(list, sort, q) {
  if (q && sort === 'relevance') return list;
  const arr = [...list];
  if (sort === 'code') arr.sort((x, y) => x.code.replace(/^\//, '').localeCompare(y.code.replace(/^\//, '')));
  else if (sort === 'level') arr.sort((x, y) => x.level - y.level);
  return arr;
}
function resultsHTML(list, sort) {
  if (!list.length) return emptyState('explorer.empty', 'funnel', null, `<button type="button" class="btn" data-clear>${esc(t('explorer.clear'))}</button>`);
  if (sort === 'module') {
    return MODULES.map((m) => { const items = list.filter((x) => x.module === m); if (!items.length) return ''; const mod = data.moduleMap.get(m);
      return `<section class="tx-group"><h2 class="group-title"><span class="badge mod-${m}">${m}</span><span>${esc(L(mod?.name))}</span><span class="muted">${items.length}</span></h2><div class="tx-grid">${items.map(txCard).join('')}</div></section>`; }).join('');
  }
  return `<div class="tx-grid">${list.map(txCard).join('')}</div>`;
}

export default {
  name: 'explorer',
  render({ query }) {
    const q = query.q || ''; const m = query.m || ''; const a = query.a || ''; const sort = query.sort || (q ? 'relevance' : 'module');
    const list = sorted(filtered(q, m, a), sort, q);
    const html = `
    <header class="page-head">
      <h1 class="page-title">${esc(t('explorer.title'))}</h1>
      <p class="page-sub">${esc(t('explorer.sub', { n: data.tx.length }))}</p>
    </header>
    <div class="toolbar">
      <label class="search-field">${icon('search')}<input id="txq" type="search" value="${attr(q)}" placeholder="${attr(t('explorer.placeholder'))}" aria-label="${attr(t('explorer.placeholder'))}" autocomplete="off"></label>
      <label class="select-field"><span>${esc(t('explorer.sort'))}</span><select id="txsort">${(q ? ['relevance'] : []).concat(['module', 'code', 'level']).map((s) => `<option value="${s}"${s === sort ? ' selected' : ''}>${esc(t('sort.' + s))}</option>`).join('')}</select></label>
    </div>
    <div class="filter-rows">
      <div class="chip-row" role="group" aria-label="${attr(t('explorer.filterModule'))}"><span class="chip-label">${esc(t('explorer.filterModule'))}</span>
        <button type="button" class="chip" data-m="" aria-pressed="${!m}">${esc(t('filters.all'))}</button>
        ${MODULES.filter((x) => data.tx.some((tx) => tx.module === x)).map((x) => `<button type="button" class="chip" data-m="${x}" aria-pressed="${m === x}" dir="ltr">${x}</button>`).join('')}
      </div>
      <div class="chip-row" role="group" aria-label="${attr(t('explorer.filterArea'))}"><span class="chip-label">${esc(t('explorer.filterArea'))}</span>
        <button type="button" class="chip" data-a="" aria-pressed="${!a}">${esc(t('filters.all'))}</button>
        ${data.areas.filter((ar) => data.tx.some((tx) => (tx.areas || []).includes(ar.id))).map((ar) => `<button type="button" class="chip" data-a="${ar.id}" aria-pressed="${a === ar.id}">${icon(ar.icon)}<span>${esc(L(ar.name))}</span></button>`).join('')}
        ${data.company.available && !data.company.unlocked ? `<a class="chip chip-locked" href="#/company">${icon('lock')}<span>${esc(t('company.chip'))}</span></a>` : ''}
      </div>
    </div>
    <p class="result-count" id="txcount" aria-live="polite">${esc(t('explorer.count', { n: list.length }))}</p>
    <div id="txresults">${resultsHTML(list, sort)}</div>`;
    return { title: t('explorer.title'), crumbs: [{ label: t('nav.tx') }], nav: 'tx', html };
  },
  mount(root, r) {
    const state = { q: r.query.q || '', m: r.query.m || '', a: r.query.a || '', sort: r.query.sort || '' };
    const update = () => {
      const sort = state.sort || (state.q ? 'relevance' : 'module');
      const list = sorted(filtered(state.q, state.m, state.a), sort, state.q);
      root.querySelector('#txresults').innerHTML = resultsHTML(list, sort);
      root.querySelector('#txcount').textContent = t('explorer.count', { n: list.length });
      const qs = new URLSearchParams(Object.entries(state).filter(([, v]) => v)).toString();
      setHashSilently('#/tx' + (qs ? '?' + qs : ''));
      const sel = root.querySelector('#txsort');
      const opts = (state.q ? ['relevance'] : []).concat(['module', 'code', 'level']);
      sel.innerHTML = opts.map((s) => `<option value="${s}"${s === sort ? ' selected' : ''}>${esc(t('sort.' + s))}</option>`).join('');
    };
    const input = root.querySelector('#txq');
    input.addEventListener('input', debounce(() => { state.q = input.value.trim(); if (!state.q && state.sort === 'relevance') state.sort = ''; update(); }, 120));
    input.addEventListener('change', () => store.addSearch(input.value));
    root.querySelector('#txsort').addEventListener('change', (e) => { state.sort = e.target.value; update(); });
    const offs = [
      delegate(root, 'click', '[data-m]', (e, el) => { state.m = el.dataset.m; root.querySelectorAll('[data-m]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === state.m))); update(); }),
      delegate(root, 'click', '[data-a]', (e, el) => { state.a = el.dataset.a; root.querySelectorAll('[data-a]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.a === state.a))); update(); }),
      delegate(root, 'click', '[data-clear]', () => { Object.assign(state, { q: '', m: '', a: '', sort: '' }); input.value = ''; root.querySelectorAll('[data-m],[data-a]').forEach((b) => b.setAttribute('aria-pressed', String(!b.dataset.m && !b.dataset.a))); update(); }),
      delegate(root, 'click', '[data-fav]', (e, el) => { e.preventDefault(); const on = store.toggleFav(el.dataset.fav); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.setAttribute('aria-label', t(on ? 'tx.fav.remove' : 'tx.fav.add')); toast(t(on ? 'toast.favAdded' : 'toast.favRemoved')); })
    ];
    if (!state.q && window.matchMedia('(min-width: 900px)').matches) { /* keep focus on page for keyboard users */ }
    return () => offs.forEach((f) => f());
  }
};
