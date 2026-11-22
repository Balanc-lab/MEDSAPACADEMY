import { t, L } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, debounce, delegate } from '../core/dom.js';
import { data, norm } from '../core/data.js';
import { setHashSilently } from '../core/router.js';
import { txChip, modBadge, emptyState } from './common.js';

function filter(q, m) {
  const qn = norm(q);
  return data.errors.filter((e) => (!m || e.module === m) && (!qn || norm([e.id || '', e.msg, e.c.ar, e.c.en, e.c.fr, e.s.ar, e.s.en, e.s.fr, (e.tx || []).join(' ')].join(' ')).includes(qn)));
}
const card = (e, open) => `<details class="err-card err-lib" id="err-${attr(e.key)}"${open ? ' open' : ''}>
  <summary class="err-head">${icon('circle-x')}<code class="err-msg" dir="ltr">${esc(e.msg)}</code>${e.id ? `<span class="err-id" dir="ltr">${esc(e.id)}</span>` : ''}${e.module ? modBadge(e.module) : ''}</summary>
  <dl class="err-body"><div><dt>${esc(t('tx.errors.cause'))}</dt><dd>${rich(L(e.c))}</dd></div><div><dt>${esc(t('tx.errors.solution'))}</dt><dd>${rich(L(e.s))}</dd></div></dl>
  <div class="chip-row">${(e.tx || []).map((c) => txChip(c, { withName: true })).join('')}</div>
</details>`;
const listHTML = (items, openKey) => (items.length ? items.map((e) => card(e, e.key === openKey)).join('') : emptyState('errors.empty', 'search'));

export default {
  name: 'errors',
  render({ query }) {
    const q = query.q || ''; const m = query.m || ''; const open = query.e || '';
    const items = filter(q, m);
    const mods = [...new Set(data.errors.map((e) => e.module).filter(Boolean))];
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('errors.title'))}</h1><p class="page-sub">${esc(t('errors.sub', { n: data.errors.length }))}</p></header>
    <div class="toolbar"><label class="search-field">${icon('search')}<input id="eq" type="search" value="${attr(q)}" placeholder="${attr(t('errors.placeholder'))}" aria-label="${attr(t('errors.placeholder'))}"></label></div>
    <div class="chip-row" role="group" aria-label="${attr(t('explorer.filterModule'))}"><button type="button" class="chip" data-em="" aria-pressed="${!m}">${esc(t('filters.all'))}</button>${mods.map((x) => `<button type="button" class="chip" data-em="${x}" aria-pressed="${m === x}" dir="ltr">${x}</button>`).join('')}</div>
    <p class="result-count" id="ecount">${esc(t('errors.count', { n: items.length }))}</p>
    <div class="err-list" id="elist">${listHTML(items, open)}</div>
    <p class="small muted">${esc(t('tx.errors.note'))}</p>`;
    return { title: t('errors.title'), crumbs: [{ label: t('nav.errors') }], nav: 'errors', html };
  },
  mount(root, r) {
    const st = { q: r.query.q || '', m: r.query.m || '' };
    if (r.query.e) { const el = root.querySelector('#err-' + CSS.escape(r.query.e)); if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50); }
    const upd = () => {
      const items = filter(st.q, st.m);
      root.querySelector('#elist').innerHTML = listHTML(items);
      root.querySelector('#ecount').textContent = t('errors.count', { n: items.length });
      const qs = new URLSearchParams(Object.entries(st).filter(([, v]) => v)).toString();
      setHashSilently('#/errors' + (qs ? '?' + qs : ''));
    };
    const input = root.querySelector('#eq');
    input.addEventListener('input', debounce(() => { st.q = input.value; upd(); }, 120));
    return delegate(root, 'click', '[data-em]', (e, el) => { st.m = el.dataset.em; root.querySelectorAll('[data-em]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.em === st.m))); upd(); });
  }
};
