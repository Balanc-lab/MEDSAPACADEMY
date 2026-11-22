import { t, L, getLang } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, debounce } from '../core/dom.js';
import { data, search, norm } from '../core/data.js';
import { store } from '../core/store.js';
import { resultsHTML, filterFn, filterLabel } from './shell.js';
import { txChip, emptyState } from './common.js';

function glossaryRows(q) {
  const qn = norm(q);
  const lang = getLang();
  const items = data.glossary.map((g, i) => ({ g, i })).filter(({ g }) => !qn || norm([g.ar, g.en, g.fr, g.d.ar, g.d.en, g.d.fr].join(' ')).includes(qn));
  if (!items.length) return emptyState('glossary.empty', 'search');
  return `<div class="gloss-list">${items.map(({ g, i }) => `<article class="gloss" id="term-${i}">
    <div class="gloss-terms"><span lang="ar" dir="rtl" class="${lang === 'ar' ? 'primary' : ''}">${esc(g.ar)}</span><span lang="en" dir="ltr" class="${lang === 'en' ? 'primary' : ''}">${esc(g.en)}</span><span lang="fr" dir="ltr" class="${lang === 'fr' ? 'primary' : ''}">${esc(g.fr)}</span></div>
    <p>${rich(L(g.d))}</p>
    ${g.rel && g.rel.length ? `<div class="chip-row">${g.rel.map((c) => txChip(c)).join('')}</div>` : ''}
  </article>`).join('')}</div>`;
}

export const glossaryView = {
  name: 'glossary',
  render({ query }) {
    const q = query.q || '';
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('glossary.title'))}</h1><p class="page-sub">${esc(t('glossary.sub', { n: data.glossary.length }))}</p></header>
    <div class="toolbar"><label class="search-field">${icon('search')}<input id="gq" type="search" value="${attr(q)}" placeholder="${attr(t('glossary.search'))}" aria-label="${attr(t('glossary.search'))}"></label></div>
    <div class="gloss-head" aria-hidden="true"><span>العربية</span><span>English</span><span>Français</span></div>
    <div id="glist">${glossaryRows(q)}</div>`;
    return { title: t('glossary.title'), crumbs: [{ label: t('nav.glossary') }], nav: 'glossary', html };
  },
  mount(root, r) {
    const input = root.querySelector('#gq');
    input.addEventListener('input', debounce(() => { root.querySelector('#glist').innerHTML = glossaryRows(input.value); }, 120));
    if (r.query.t) { const el = root.querySelector('#term-' + CSS.escape(r.query.t)); if (el) { el.classList.add('flash'); setTimeout(() => el.scrollIntoView({ block: 'center' }), 50); } }
    return null;
  }
};

export const searchView = {
  name: 'search',
  render({ query }) {
    const q = query.q || ''; const f = query.f || '';
    const res = q ? search(q, { limit: 120, filter: filterFn(f) }) : [];
    const chips = [['m', 'MM'], ['m', 'WM'], ['m', 'LE'], ['m', 'EWM'], ['a', 'inventory'], ['a', 'procurement'], ['a', 'production'], ['a', 'shipping'], ['a', 'administration'], ['a', 'custom']];
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('search.title'))}</h1></header>
    <form class="toolbar" id="sform" role="search"><label class="search-field">${icon('search')}<input id="sq" type="search" name="q" value="${attr(q)}" placeholder="${attr(t('search.placeholder'))}" aria-label="${attr(t('search.placeholder'))}"></label><button class="btn btn-primary" type="submit">${esc(t('search.go'))}</button></form>
    <div class="chip-row" role="group" aria-label="${attr(t('filters.title'))}"><a class="chip" href="#/search?q=${encodeURIComponent(q)}" aria-pressed="${!f}">${esc(t('filters.all'))}</a>${chips.map(([k, id]) => `<a class="chip" aria-pressed="${f === k + ':' + id}" href="#/search?q=${encodeURIComponent(q)}&f=${k}:${id}">${esc(filterLabel(k, id))}</a>`).join('')}</div>
    ${q ? `<p class="result-count">${esc(t('search.results', { n: res.length }))}</p><div class="search-page-results">${resultsHTML(res, q)}</div>` : emptyState('search.start', 'search')}`;
    return { title: t('search.title'), crumbs: [{ label: t('search.title') }], nav: '', html };
  },
  mount(root) {
    root.querySelector('#sform').addEventListener('submit', (e) => { e.preventDefault(); const q = root.querySelector('#sq').value.trim(); if (q) { store.addSearch(q); location.hash = '#/search?q=' + encodeURIComponent(q); } });
    return null;
  }
};

export const knowledgeView = {
  name: 'knowledge',
  render() {
    const tiles = [['lifecycle', '#/lifecycle', 'workflow'], ['stock', '#/stock', 'boxes'], ['movements', '#/movements', 'arrow-left-right'], ['errors', '#/errors', 'triangle-alert'], ['glossary', '#/glossary', 'languages'], ['scenarios', '#/scenarios', 'lightbulb'], ['about', '#/about', 'info']];
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('knowledge.title'))}</h1><p class="page-sub">${esc(t('knowledge.sub'))}</p></header>
    <div class="hub">${tiles.map(([k, href, ic]) => `<a class="hub-tile" href="${href}">${icon(ic)}<span class="hub-name">${esc(k === 'scenarios' ? t('learn.scenarios') : t('nav.' + k))}</span><span class="hub-desc">${esc(t('knowledge.' + k))}</span></a>`).join('')}</div>`;
    return { title: t('knowledge.title'), crumbs: [{ label: t('nav.knowledge') }], nav: 'knowledge', html };
  }
};

export const aboutView = {
  name: 'about',
  render() {
    const html = `<article class="prose about">
      <header class="page-head"><h1 class="page-title">${esc(t('about.title'))}</h1><p class="page-sub">${esc(t('app.tagline'))}</p></header>
      <section><h2>${esc(t('about.whatTitle'))}</h2><p>${esc(t('about.what'))}</p></section>
      <section class="callout"><h2>${icon('triangle-alert')}<span>${esc(t('about.simTitle'))}</span></h2><p>${esc(t('about.sim'))}</p></section>
      <section><h2>${esc(t('about.dataTitle'))}</h2><p>${esc(t('about.data'))}</p><dl class="org">${Object.entries(data.org || {}).map(([k, v]) => `<div><dt>${esc(t('about.org.' + k))}</dt><dd dir="ltr">${esc(Array.isArray(v) ? v.join(', ') : v)}</dd></div>`).join('')}</dl></section>
      <section><h2>${esc(t('about.accuracyTitle'))}</h2><p>${esc(t('about.accuracy'))}</p></section>
      <section><h2>${esc(t('about.offlineTitle'))}</h2><p>${esc(t('about.offline'))}</p></section>
      <section><h2>${esc(t('about.privacyTitle'))}</h2><p>${esc(t('about.privacy'))}</p></section>
      <section class="small muted"><p>${esc(t('footer.trademark'))}</p><p>${esc(t('about.credits'))}</p></section>
    </article>`;
    return { title: t('about.title'), crumbs: [{ label: t('nav.about') }], nav: 'about', html };
  }
};

export const notFoundView = {
  name: 'notfound',
  render() {
    return { title: t('notfound.title'), crumbs: [{ label: t('notfound.title') }], nav: '', html: `<div class="empty">${icon('compass')}<h1>${esc(t('notfound.title'))}</h1><p>${esc(t('notfound.body'))}</p><a class="btn btn-primary" href="#/">${esc(t('notfound.home'))}</a></div>` };
  }
};
