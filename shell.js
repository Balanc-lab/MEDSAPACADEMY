// Application frame: shell bar, side navigation, bottom navigation, search palette.
import { t, L, getLang, setLang } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, $, $$, debounce, delegate, toast } from '../core/dom.js';
import { store } from '../core/store.js';
import { data, search, txHref } from '../core/data.js';
import { pwa } from '../core/pwa.js';

export const LOGO = `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B4F9C"/><stop offset="1" stop-color="#1C8FE6"/></linearGradient></defs><rect width="40" height="40" rx="10" fill="url(#lgA)"/><path d="M20 8.5l10.5 5.8v11.4L20 31.5 9.5 25.7V14.3z" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/><path d="M9.5 14.3L20 20.1l10.5-5.8M20 20.1v11.4" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/><path d="M25.3 11.2l-10.4 5.9" stroke="#F5B400" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const NAV = [
  { g: 'nav.groupLearn', items: [['home', '#/', 'house'], ['tx', '#/tx', 'layout-grid'], ['company', '#/company', 'lock'], ['learn', '#/learn', 'graduation-cap'], ['me', '#/me', 'user']] },
  { g: 'nav.groupProcess', items: [['lifecycle', '#/lifecycle', 'workflow'], ['stock', '#/stock', 'boxes'], ['movements', '#/movements', 'arrow-left-right']] },
  { g: 'nav.groupRef', items: [['errors', '#/errors', 'triangle-alert'], ['glossary', '#/glossary', 'languages'], ['about', '#/about', 'info']] }
];
const BOTTOM = [['home', '#/', 'house'], ['tx', '#/tx', 'layout-grid'], ['knowledge', '#/knowledge', 'workflow'], ['learn', '#/learn', 'graduation-cap'], ['me', '#/me', 'user']];
const FILTERS = [['m', 'MM'], ['m', 'WM'], ['m', 'LE'], ['m', 'EWM'], ['a', 'inventory'], ['a', 'procurement'], ['a', 'production'], ['a', 'shipping'], ['a', 'administration'], ['a', 'custom'], ['m', 'QM'], ['m', 'PP'], ['m', 'SD']];

export const filterLabel = (kind, id) => (kind === 'm' ? id : L(data.areaMap.get(id)?.name) || id);

function initials() {
  const n = (store.state.prefs.name || '').trim();
  if (!n) return icon('user');
  return esc(n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase());
}

export function renderShell(app) {
  const lang = getLang();
  app.innerHTML = `
  <a class="skip" href="#main">${esc(t('common.skip'))}</a>
  <header class="shellbar">
    <button type="button" class="icon-btn nav-btn" data-act="nav" aria-label="${attr(t('nav.menu'))}" aria-controls="sidenav">${icon('menu')}</button>
    <a class="brand" href="#/" aria-label="LogiAcademy">${LOGO}<span class="brand-text"><span class="brand-name">LogiAcademy</span><span class="brand-tag">${esc(t('app.tagline'))}</span></span></a>
    <button type="button" class="cmd" data-act="search" aria-label="${attr(t('search.placeholder'))}"><span class="cmd-prefix" dir="ltr">/n</span><span class="cmd-ph">${esc(t('search.placeholder'))}</span><kbd dir="ltr">Ctrl K</kbd></button>
    <div class="shell-actions">
      <button type="button" class="icon-btn only-narrow" data-act="search" aria-label="${attr(t('search.open'))}">${icon('search')}</button>
      <button type="button" class="btn btn-quiet install-btn" data-act="install" hidden>${icon('download')}<span>${esc(t('install.button'))}</span></button>
      <div class="seg lang-seg" role="group" aria-label="${attr(t('lang.label'))}">
        ${[['ar', 'AR', 'العربية'], ['en', 'EN', 'English'], ['fr', 'FR', 'Français']].map(([k, lbl, full]) => `<button type="button" data-lang="${k}" lang="${k}" aria-label="${attr(full)}" aria-pressed="${k === lang}">${lbl}</button>`).join('')}
      </div>
      <button type="button" class="icon-btn" data-act="theme" aria-label="${attr(t('theme.toggle'))}">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      <a class="avatar" href="#/me" aria-label="${attr(t('nav.me'))}">${initials()}</a>
    </div>
  </header>
  <aside class="sidenav" id="sidenav" aria-label="${attr(t('nav.main'))}">
    <div class="nav-filter">${icon('search')}<input type="search" id="navFilter" placeholder="${attr(t('nav.filter'))}" aria-label="${attr(t('nav.filter'))}" autocomplete="off"></div>
    <nav class="nav-groups">${NAV.map((g) => `<div class="nav-group"><p class="nav-group-title">${esc(t(g.g))}</p>${g.items.map(([k, href, ic]) => `<a class="nav-item" href="${href}" data-nav="${k}" data-label="${attr(t('nav.' + k))}">${icon(ic)}<span>${esc(t('nav.' + k))}</span></a>`).join('')}</div>`).join('')}</nav>
    <div class="nav-quick" id="navQuick" hidden></div>
    <div class="nav-foot" id="navFoot"></div>
  </aside>
  <div class="drawer-backdrop" data-act="nav-close"></div>
  <main id="main" class="main" tabindex="-1">
    <nav class="crumbs" id="crumbs" aria-label="${attr(t('nav.breadcrumb'))}"></nav>
    <div id="view" class="view"></div>
    <footer class="page-foot"><p>${esc(t('footer.trademark'))}</p><p>${esc(t('footer.simulation'))} <a href="#/about">${esc(t('nav.about'))}</a></p></footer>
  </main>
  <nav class="bottomnav" aria-label="${attr(t('nav.main'))}">${BOTTOM.map(([k, href, ic]) => `<a href="${href}" data-nav="${k}">${icon(ic)}<span>${esc(t('nav.' + k))}</span></a>`).join('')}</nav>
  <div id="toasts" class="toasts" aria-live="polite"></div>
  <div id="modals"></div>`;
  bindShell(app);
  updateNetwork();
  updateInstall();
}

let bound = false;
function bindShell(app) {
  delegate(app, 'click', '[data-act]', (e, el) => {
    const act = el.dataset.act;
    if (act === 'search') openSearch();
    else if (act === 'nav') toggleNav();
    else if (act === 'nav-close') toggleNav(false);
    else if (act === 'theme') toggleTheme();
    else if (act === 'install') pwa.install();
  });
  delegate(app, 'click', '[data-lang]', (e, el) => {
    if (el.dataset.lang === getLang()) return;
    setLang(el.dataset.lang);
    window.dispatchEvent(new CustomEvent('la:lang'));
  });
  delegate(app, 'click', '.sidenav a', () => toggleNav(false));
  const filter = $('#navFilter', app);
  filter.addEventListener('input', debounce(() => filterNav(filter.value), 80));
  filter.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const first = $('#navQuick a, .nav-item:not([hidden])', app); if (first) { location.hash = first.getAttribute('href'); filter.value = ''; filterNav(''); toggleNav(false); } } });
  if (!bound) {
    bound = true;
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.body.classList.contains('has-modal')) { e.preventDefault(); openSearch(); }
    });
    pwa.on(() => { updateNetwork(); updateInstall(); });
  }
}

function filterNav(q) {
  const qn = q.trim().toLowerCase();
  $$('.nav-item').forEach((a) => { a.hidden = !!qn && !a.dataset.label.toLowerCase().includes(qn); });
  $$('.nav-group').forEach((g) => { g.hidden = !!qn && !g.querySelector('.nav-item:not([hidden])'); });
  const quick = $('#navQuick');
  if (!qn) { quick.hidden = true; quick.innerHTML = ''; return; }
  const res = search(q, { limit: 6, types: ['tx', 'mvt', 'stage', 'status'] });
  quick.hidden = !res.length;
  quick.innerHTML = res.map((e) => `<a href="${e.route}" class="quick-item">${e.code ? `<span class="tc" dir="ltr">${esc(e.code)}</span>` : icon(typeIcon(e.type))}<span>${esc(L(e.title))}</span></a>`).join('');
}

export function toggleNav(force) {
  const wide = window.matchMedia('(min-width: 1024px)').matches;
  if (wide) {
    const collapsed = force === false ? document.body.classList.contains('nav-collapsed') : !document.body.classList.contains('nav-collapsed');
    if (force !== false) document.body.classList.toggle('nav-collapsed', collapsed);
  } else {
    const open = force === undefined ? !document.body.classList.contains('nav-open') : force;
    document.body.classList.toggle('nav-open', open);
    if (open) setTimeout(() => $('#navFilter')?.focus(), 50);
  }
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  store.setPref('theme', next);
}
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.querySelector('[data-act="theme"]');
  if (btn) btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F1419' : '#FFFFFF');
}

function updateNetwork() {
  const foot = $('#navFoot');
  if (!foot) return;
  const state = !pwa.online ? ['wifi-off', t('offline.offline'), 'warn'] : pwa.offlineReady ? ['cloud-off', t('offline.ready'), 'ok'] : ['refresh-cw', t('offline.preparing'), ''];
  foot.innerHTML = `<span class="net net-${state[2]}">${icon(state[0])}<span>${esc(state[1])}</span></span>`;
}
function updateInstall() {
  $$('[data-act="install"]').forEach((b) => { b.hidden = !pwa.canInstall; });
}

export function setPage({ title, crumbs = [], nav = '' }) {
  document.title = title ? `${title} · LogiAcademy` : 'LogiAcademy';
  const c = $('#crumbs');
  if (c) {
    const items = [{ label: t('nav.home'), href: '#/' }, ...crumbs];
    c.innerHTML = crumbs.length ? `<ol>${items.map((it, i) => `<li>${i < items.length - 1 && it.href ? `<a href="${it.href}">${it.code ? `<bdi dir="ltr">${esc(it.label)}</bdi>` : esc(it.label)}</a>` : `<span aria-current="page">${it.code ? `<bdi dir="ltr">${esc(it.label)}</bdi>` : esc(it.label)}</span>`}</li>`).join('')}</ol>` : '';
    c.hidden = !crumbs.length;
  }
  $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === nav; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}

// ---------------- search ----------------
export const typeIcon = (type) => ({ tx: 'layout-grid', mvt: 'arrow-left-right', status: 'boxes', stage: 'workflow', error: 'triangle-alert', lesson: 'graduation-cap', scenario: 'lightbulb', term: 'languages' }[type] || 'search');
const TYPE_ORDER = ['tx', 'mvt', 'status', 'stage', 'error', 'lesson', 'scenario', 'term'];

export function resultsHTML(results, q, { compact = false } = {}) {
  if (!results.length) return `<div class="search-empty">${icon('search')}<p>${esc(t('search.noResults', { q }))}</p></div>`;
  const groups = {};
  results.forEach((e) => { (groups[e.type] = groups[e.type] || []).push(e); });
  return TYPE_ORDER.filter((tp) => groups[tp]).map((tp) => `<div class="sr-group"><p class="sr-title">${esc(t('search.type.' + tp))}</p>${groups[tp].slice(0, compact ? 5 : 50).map((e) => `
    <a class="sr-item" href="${e.route}" role="option" data-route="${attr(e.route)}">
      ${e.code && (tp === 'tx' || tp === 'mvt') ? `<span class="tc sr-code" dir="ltr">${esc(e.code)}</span>` : `<span class="sr-ico">${icon(typeIcon(tp))}</span>`}
      <span class="sr-text"><span class="sr-name"${tp === 'error' ? ' dir="ltr"' : ''}>${esc(L(e.title))}</span>${e.sub ? `<span class="sr-sub">${esc(trim(L(e.sub), 110))}</span>` : ''}</span>
      ${e.module ? `<span class="badge mod-${e.module}">${esc(e.module)}</span>` : ''}
    </a>`).join('')}</div>`).join('');
}
const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function filterFn(active) {
  if (!active) return null;
  const [kind, id] = active.split(':');
  return (e) => {
    if (kind === 'm') return (e.type === 'tx' || e.type === 'error') && e.module === id;
    return e.type === 'tx' && (e.areas || []).includes(id);
  };
}

export function attachSearch(input, panel, { onPick, filterGetter, limit = 40, compact = false } = {}) {
  let sel = -1;
  const render = () => {
    const q = input.value.trim();
    if (!q) { panel.innerHTML = recentHTML(); sel = -1; panel.hidden = !panel.innerHTML; return; }
    const res = search(q, { limit, filter: filterFn(filterGetter ? filterGetter() : null) });
    panel.innerHTML = resultsHTML(res, q, { compact }) + (compact && res.length ? `<a class="sr-all" href="#/search?q=${encodeURIComponent(q)}">${esc(t('search.viewAll'))}</a>` : '');
    panel.hidden = false; sel = -1;
  };
  const items = () => $$('.sr-item, .sr-recent', panel);
  const highlight = () => items().forEach((el, i) => { el.classList.toggle('kbd', i === sel); if (i === sel) el.scrollIntoView({ block: 'nearest' }); });
  input.addEventListener('input', debounce(render, 90));
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (e) => {
    const list = items();
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); highlight(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(-1, sel - 1); highlight(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      const target = sel >= 0 ? list[sel] : list.find((x) => x.classList.contains('sr-item'));
      if (sel >= 0 && list[sel]?.classList.contains('sr-recent')) { input.value = list[sel].dataset.q; render(); return; }
      if (q) store.addSearch(q);
      if (target && target.classList.contains('sr-item')) { location.hash = target.getAttribute('href'); onPick && onPick(); }
      else if (q) { location.hash = '#/search?q=' + encodeURIComponent(q); onPick && onPick(); }
    }
  });
  panel.addEventListener('click', (e) => {
    const rec = e.target.closest('.sr-recent');
    if (rec) { e.preventDefault(); input.value = rec.dataset.q; input.focus(); render(); return; }
    const a = e.target.closest('a');
    if (a) { if (input.value.trim()) store.addSearch(input.value.trim()); onPick && onPick(); }
  });
  return { render };
}
function recentHTML() {
  const s = store.state.searches.slice(0, 6);
  const quick = ['MIGO', 'MMBE', 'MB51', 'ME21N', 'VL02N', 'LT01', '/SCWM/MON'].filter((c) => data.txMap.has(c));
  return `${s.length ? `<div class="sr-group"><p class="sr-title">${esc(t('search.recent'))}</p>${s.map((q) => `<button type="button" class="sr-recent" data-q="${attr(q)}">${icon('history')}<span>${esc(q)}</span></button>`).join('')}</div>` : ''}
    <div class="sr-group"><p class="sr-title">${esc(t('search.suggest'))}</p><div class="chip-row">${quick.map((c) => `<a class="chip chip-code" href="${txHref(c)}" dir="ltr">${esc(c)}</a>`).join('')}</div></div>`;
}

let closeSearch = null;
export function openSearch(initial = '') {
  if (closeSearch) return;
  const host = $('#modals');
  const wrap = document.createElement('div');
  wrap.className = 'palette-wrap';
  wrap.innerHTML = `<div class="modal-backdrop" data-close></div>
  <div class="palette" role="dialog" aria-modal="true" aria-label="${attr(t('search.open'))}">
    <div class="palette-bar"><span class="cmd-prefix" dir="ltr">/n</span><input type="search" class="palette-input" placeholder="${attr(t('search.placeholder'))}" aria-label="${attr(t('search.placeholder'))}" autocomplete="off" spellcheck="false" value="${attr(initial)}"><button type="button" class="icon-btn" data-close aria-label="${attr(t('common.close'))}">${icon('x')}</button></div>
    <div class="chip-row palette-filters" role="group" aria-label="${attr(t('filters.title'))}">${FILTERS.map(([k, id]) => `<button type="button" class="chip" data-f="${k}:${id}" aria-pressed="false">${esc(filterLabel(k, id))}</button>`).join('')}</div>
    <div class="palette-results" role="listbox"></div>
  </div>`;
  host.appendChild(wrap);
  document.body.classList.add('has-modal');
  const input = $('.palette-input', wrap);
  const panel = $('.palette-results', wrap);
  let active = null;
  const close = () => { wrap.remove(); closeSearch = null; if (!$('#modals .modal-wrap')) document.body.classList.remove('has-modal'); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  const s = attachSearch(input, panel, { onPick: close, filterGetter: () => active });
  $$('.palette-filters .chip', wrap).forEach((b) => b.addEventListener('click', () => {
    active = active === b.dataset.f ? null : b.dataset.f;
    $$('.palette-filters .chip', wrap).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.f === active)));
    if (!input.value.trim() && active) { const [k, id] = active.split(':'); close(); location.hash = '#/tx?' + (k === 'm' ? 'm=' : 'a=') + id; return; }
    s.render(); input.focus();
  }));
  closeSearch = close;
  setTimeout(() => { input.focus(); s.render(); }, 20);
}
export function closePalette() { if (closeSearch) closeSearch(); }
export { toast };
