import { t, L, fmtDate, fmtTime, getLang, setLang } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, delegate, toast, confirmDialog, downloadBlob } from '../core/dom.js';
import { data, txHref, pathProgress } from '../core/data.js';
import { store } from '../core/store.js';
import { pwa } from '../core/pwa.js';
import { setHashSilently, navigate } from '../core/router.js';
import { modBadge, bar, emptyState, progressRing } from './common.js';
import { overall } from './dashboard.js';
import { showCertificate } from './learn.js';
import { applyTheme } from './shell.js';

const TABS = [['overview', 'gauge'], ['favorites', 'star'], ['bookmarks', 'bookmark'], ['notes', 'notebook-pen'], ['history', 'history'], ['certificates', 'award'], ['settings', 'settings']];

function bookmarkLink(b) {
  if (b.type === 'tx') { const x = data.txMap.get(b.id); return x ? `<a href="${txHref(x.code)}"><span class="tc" dir="ltr">${esc(x.code)}</span><span>${esc(L(x.name))}</span></a>` : ''; }
  if (b.type === 'lesson') { const l = data.lessonMap.get(b.id); return l ? `<a href="#/lesson/${l.id}">${icon('graduation-cap')}<span>${esc(L(l.title))}</span></a>` : ''; }
  return '';
}
function noteLink(key) {
  const [type, id] = key.split(/:(.+)/);
  if (type === 'tx') { const x = data.txMap.get(id); return x ? { href: txHref(x.code, 'notes'), label: `${x.code} – ${L(x.name)}` } : null; }
  if (type === 'lesson') { const l = data.lessonMap.get(id); return l ? { href: '#/lesson/' + l.id, label: L(l.title) } : null; }
  return null;
}

function panel(tab) {
  const s = store.state;
  if (tab === 'overview') {
    const ov = overall();
    return `<div class="me-overview">${progressRing(ov.pct, 120)}<div><h2>${esc(t('me.overall'))}</h2><p class="muted">${esc(t('dash.progressDetail', { l: ov.done, lt: ov.lessons, x: ov.learned, xt: ov.tx }))}</p><p>${icon('flame')} ${esc(t('me.streak', { n: store.streak() }))}</p></div></div>
      <div class="path-bars">${data.paths.map((p) => { const pp = pathProgress(store, p); return `<a class="path-bar" href="#/learn/${p.id}"><span>${esc(L(p.name))}</span>${bar(pp.pct)}<span class="num">${pp.pct}%</span></a>`; }).join('')}</div>
      <div class="row-end"><a class="btn" href="#/report">${icon('printer')}<span>${esc(t('me.report'))}</span></a></div>`;
  }
  if (tab === 'favorites') {
    const favs = s.favorites.map((c) => data.txMap.get(c)).filter(Boolean);
    return favs.length ? `<ul class="tx-list">${favs.map((x) => `<li><a href="${txHref(x.code)}"><span class="tc" dir="ltr">${esc(x.code)}</span><span class="tx-list-name">${esc(L(x.name))}</span>${modBadge(x.module)}</a><button type="button" class="icon-btn sm" data-unfav="${attr(x.code)}" aria-label="${attr(t('tx.fav.remove'))}">${icon('x')}</button></li>`).join('')}</ul>` : emptyState('me.noFavorites', 'star');
  }
  if (tab === 'bookmarks') {
    const items = s.bookmarks.map((b) => ({ b, html: bookmarkLink(b) })).filter((x) => x.html);
    return items.length ? `<ul class="link-list">${items.map(({ b, html }) => `<li>${html}<button type="button" class="icon-btn sm" data-unbm="${attr(b.type + '|' + b.id)}" aria-label="${attr(t('tx.bookmark.remove'))}">${icon('x')}</button></li>`).join('')}</ul>` : emptyState('me.noBookmarks', 'bookmark');
  }
  if (tab === 'notes') {
    const keys = Object.keys(s.notes).sort((a, b) => s.notes[b].ts - s.notes[a].ts);
    const items = keys.map((k) => ({ k, link: noteLink(k), n: s.notes[k] })).filter((x) => x.link);
    return items.length ? `<div class="note-cards">${items.map(({ link, n }) => `<article class="note-card"><a href="${link.href}"><strong>${esc(link.label)}</strong></a><p>${esc(n.text.length > 280 ? n.text.slice(0, 279) + '…' : n.text)}</p><p class="small muted">${esc(fmtTime(n.ts))}</p></article>`).join('')}</div>` : emptyState('me.noNotes', 'notebook-pen');
  }
  if (tab === 'history') {
    const rec = s.recent.map((c) => data.txMap.get(c)).filter(Boolean);
    return `<div class="two-col"><section><h2 class="h-sec">${esc(t('me.recentTx'))}</h2>${rec.length ? `<ul class="tx-list">${rec.map((x) => `<li><a href="${txHref(x.code)}"><span class="tc" dir="ltr">${esc(x.code)}</span><span class="tx-list-name">${esc(L(x.name))}</span></a></li>`).join('')}</ul>` : `<p class="muted">${esc(t('dash.recentEmpty'))}</p>`}</section>
      <section><h2 class="h-sec">${esc(t('me.searchHistory'))}</h2>${s.searches.length ? `<div class="chip-row">${s.searches.map((q) => `<a class="chip" href="#/search?q=${encodeURIComponent(q)}">${icon('history')}<span>${esc(q)}</span></a>`).join('')}</div>` : `<p class="muted">${esc(t('me.noSearches'))}</p>`}</section></div>
      <div class="row-end"><button type="button" class="btn" data-clearhist>${icon('trash-2')}<span>${esc(t('me.clearHistory'))}</span></button></div>`;
  }
  if (tab === 'certificates') {
    return `<ul class="cert-list">${data.paths.map((p) => { const c = s.certs.find((x) => x.path === p.id); const pp = pathProgress(store, p); return `<li><span>${icon(c ? 'award' : 'lock')}</span><span><strong>${esc(L(p.name))}</strong><span class="muted small">${c ? `${esc(fmtDate(c.date))} · ${esc(c.code)}` : esc(t('learn.certLocked', { score: data.passScore }))}</span></span>${c || pp.complete ? `<button type="button" class="btn btn-sm" data-cert="${p.id}">${esc(t(c ? 'common.open' : 'learn.getCertificate'))}</button>` : `<a class="btn btn-sm" href="#/learn/${p.id}">${esc(t('common.open'))}</a>`}</li>`; }).join('')}</ul>`;
  }
  // settings
  const theme = document.documentElement.dataset.theme;
  return `<div class="settings">
    <label class="field"><span>${esc(t('me.name'))}</span><input id="setName" maxlength="60" value="${attr(s.prefs.name || '')}" placeholder="${attr(t('me.namePh'))}"></label>
    <div class="field"><span>${esc(t('lang.label'))}</span><div class="seg" role="group">${[['ar', 'العربية'], ['en', 'English'], ['fr', 'Français']].map(([k, n]) => `<button type="button" data-setlang="${k}" aria-pressed="${getLang() === k}" lang="${k}">${n}</button>`).join('')}</div></div>
    <div class="field"><span>${esc(t('me.theme'))}</span><div class="seg" role="group"><button type="button" data-settheme="light" aria-pressed="${theme === 'light'}">${icon('sun')}<span>${esc(t('theme.light'))}</span></button><button type="button" data-settheme="dark" aria-pressed="${theme === 'dark'}">${icon('moon')}<span>${esc(t('theme.dark'))}</span></button></div></div>
    <div class="field"><span>${esc(t('me.offline'))}</span><p class="net net-${pwa.offlineReady ? 'ok' : ''}">${icon(pwa.offlineReady ? 'cloud-off' : 'refresh-cw')}<span>${esc(pwa.offlineReady ? t('offline.ready') : t('offline.preparing'))}</span></p>${pwa.canInstall ? `<button type="button" class="btn" data-install>${icon('download')}<span>${esc(t('install.button'))}</span></button>` : ''}</div>
    <div class="field"><span>${esc(t('me.backup'))}</span><p class="small muted">${esc(t('me.backupHint'))}</p><div class="row"><button type="button" class="btn" data-export>${icon('download')}<span>${esc(t('me.export'))}</span></button><label class="btn">${icon('upload')}<span>${esc(t('me.import'))}</span><input type="file" accept="application/json,.json" data-import hidden></label></div></div>
    <div class="field danger-zone"><span>${esc(t('me.reset'))}</span><p class="small muted">${esc(t('me.resetHint'))}</p><button type="button" class="btn btn-danger" data-reset>${icon('trash-2')}<span>${esc(t('me.reset'))}</span></button></div>
    <p class="small muted">${esc(t('me.version', { v: data.catalog?.version || '1.0.0' }))}</p>
  </div>`;
}

export const meView = {
  name: 'me',
  render({ params }) {
    const tab = TABS.some(([k]) => k === params.tab) ? params.tab : 'overview';
    const name = store.state.prefs.name;
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('me.title'))}</h1><p class="page-sub">${esc(name ? t('me.subNamed', { name }) : t('me.sub'))}</p></header>
    <div class="tabs" role="tablist">${TABS.map(([k, ic]) => `<button type="button" role="tab" data-mtab="${k}" aria-selected="${k === tab}" aria-controls="mePanel">${icon(ic)}<span>${esc(t('me.tabs.' + k))}</span></button>`).join('')}</div>
    <section id="mePanel" class="tabpanel" role="tabpanel">${panel(tab)}</section>`;
    return { title: t('me.title'), crumbs: [{ label: t('nav.me') }], nav: 'me', html };
  },
  mount(root, r) {
    let tab = TABS.some(([k]) => k === r.params.tab) ? r.params.tab : 'overview';
    const refresh = () => { root.querySelector('#mePanel').innerHTML = panel(tab); };
    const offs = [
      delegate(root, 'click', '[data-mtab]', (e, el) => { tab = el.dataset.mtab; root.querySelectorAll('[data-mtab]').forEach((b) => b.setAttribute('aria-selected', String(b === el))); setHashSilently('#/me' + (tab === 'overview' ? '' : '/' + tab)); refresh(); }),
      delegate(root, 'click', '[data-unfav]', (e, el) => { store.toggleFav(el.dataset.unfav); refresh(); }),
      delegate(root, 'click', '[data-unbm]', (e, el) => { const [type, id] = el.dataset.unbm.split('|'); store.toggleBookmark(type, id); refresh(); }),
      delegate(root, 'click', '[data-clearhist]', () => { store.clearHistory(); refresh(); toast(t('toast.historyCleared')); }),
      delegate(root, 'click', '[data-cert]', (e, el) => showCertificate(el.dataset.cert)),
      delegate(root, 'click', '[data-setlang]', (e, el) => { setLang(el.dataset.setlang); window.dispatchEvent(new CustomEvent('la:lang')); }),
      delegate(root, 'click', '[data-settheme]', (e, el) => { applyTheme(el.dataset.settheme); store.setPref('theme', el.dataset.settheme); refresh(); }),
      delegate(root, 'click', '[data-install]', () => pwa.install()),
      delegate(root, 'click', '[data-export]', () => { const blob = new Blob([JSON.stringify({ app: 'LogiAcademy', exported: new Date().toISOString(), state: store.state }, null, 2)], { type: 'application/json' }); downloadBlob(blob, `logiacademy-progress-${new Date().toISOString().slice(0, 10)}.json`); }),
      delegate(root, 'change', '[data-import]', async (e, el) => {
        const f = el.files && el.files[0]; if (!f) return;
        try { const j = JSON.parse(await f.text()); const st = j.state || j; if (!st || typeof st !== 'object' || !('prefs' in st)) throw new Error('bad'); store.replace(st); toast(t('me.importOk')); window.dispatchEvent(new CustomEvent('la:lang')); }
        catch (er) { toast(t('me.importBad'), { tone: 'warn' }); }
        el.value = '';
      }),
      delegate(root, 'click', '[data-reset]', async () => { if (await confirmDialog(t('me.resetConfirm'), t('me.reset'))) { store.reset(); toast(t('me.resetDone')); refresh(); } }),
      delegate(root, 'change', '#setName', (e, el) => { store.setPref('name', el.value.trim()); toast(t('common.saved')); const av = document.querySelector('.avatar'); if (av) av.textContent = el.value.trim() ? el.value.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : ''; })
    ];
    return () => offs.forEach((f) => f());
  }
};

export const reportView = {
  name: 'report',
  render() {
    const s = store.state; const ov = overall();
    const html = `<article class="report">
      <header class="report-head"><div><h1 class="page-title">${esc(t('report.title'))}</h1><p class="muted">${esc(t('report.generated', { date: fmtDate(Date.now()) }))}${s.prefs.name ? ' · ' + esc(s.prefs.name) : ''}</p></div><button type="button" class="btn btn-primary no-print" data-print>${icon('printer')}<span>${esc(t('common.print'))}</span></button></header>
      <section><h2 class="h-sec">${esc(t('report.summary'))}</h2><p>${esc(t('dash.progressDetail', { l: ov.done, lt: ov.lessons, x: ov.learned, xt: ov.tx }))} — ${ov.pct}%</p></section>
      <section><h2 class="h-sec">${esc(t('report.paths'))}</h2><table class="data-table"><thead><tr><th>${esc(t('learn.path'))}</th><th>${esc(t('report.lessonsDone'))}</th><th>${esc(t('report.quizzesPassed'))}</th><th>${esc(t('report.avg'))}</th><th>${esc(t('learn.certificate'))}</th></tr></thead><tbody>${data.paths.map((p) => { const pp = pathProgress(store, p); const c = s.certs.find((x) => x.path === p.id); return `<tr><td>${esc(L(p.name))}</td><td class="num">${pp.done}/${pp.total}</td><td class="num">${pp.passed}/${pp.total}</td><td class="num">${pp.avg}%</td><td>${c ? esc(c.code) : '—'}</td></tr>`; }).join('')}</tbody></table></section>
      <section><h2 class="h-sec">${esc(t('report.quizzes'))}</h2><table class="data-table"><thead><tr><th>${esc(t('report.lesson'))}</th><th>${esc(t('report.best'))}</th><th>${esc(t('report.attempts'))}</th></tr></thead><tbody>${data.lessons.map((l) => { const q = s.quizzes[l.id]; return `<tr><td>${esc(L(l.title))}</td><td class="num">${q ? q.best + '%' : '—'}</td><td class="num">${q ? q.attempts : 0}</td></tr>`; }).join('')}</tbody></table></section>
      <section><h2 class="h-sec">${esc(t('report.tx'))}</h2><p>${data.tx.filter((x) => store.isLearned(x.code)).map((x) => `<span class="chip chip-code chip-static" dir="ltr">${esc(x.code)}</span>`).join(' ') || '—'}</p></section>
    </article>`;
    return { title: t('report.title'), crumbs: [{ label: t('nav.me'), href: '#/me' }, { label: t('report.title') }], nav: 'me', html };
  },
  mount(root) { return delegate(root, 'click', '[data-print]', () => window.print()); }
};
export { navigate };
