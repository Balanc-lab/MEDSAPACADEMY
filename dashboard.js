import { t, L, fmtNum } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, delegate, toast } from '../core/dom.js';
import { data, txHref, pathProgress } from '../core/data.js';
import { store } from '../core/store.js';
import { attachSearch } from './shell.js';
import { modBadge, progressRing, bar, txChip } from './common.js';

function greeting() {
  const h = new Date().getHours();
  return t(h < 12 ? 'dash.greet.morning' : h < 18 ? 'dash.greet.afternoon' : 'dash.greet.evening');
}
export function nextLesson() {
  return data.lessons.find((l) => !store.lessonDone(l.id) || !((store.quiz(l.id) || {}).best >= data.passScore));
}
export function overall() {
  const lessons = data.lessons.length; const tx = data.tx.length;
  const done = data.lessons.filter((l) => store.lessonDone(l.id)).length;
  const passed = data.lessons.filter((l) => (store.quiz(l.id) || {}).best >= data.passScore).length;
  const learned = data.tx.filter((x) => store.isLearned(x.code)).length;
  const denom = 2 * lessons + tx;
  return { pct: denom ? Math.round(((done + passed + learned) / denom) * 100) : 0, done, passed, learned, lessons, tx };
}

export default {
  name: 'dashboard',
  render() {
    const s = store.state;
    const name = (s.prefs.name || '').trim();
    const ov = overall();
    const nl = nextLesson();
    const recent = s.recent.map((c) => data.txMap.get(c)).filter(Boolean).slice(0, 6);
    const favs = s.favorites.map((c) => data.txMap.get(c)).filter(Boolean).slice(0, 8);
    const recs = data.lessons.filter((l) => !store.lessonDone(l.id)).slice(0, 3);
    const quizzes = Object.values(s.quizzes);
    const quizAvg = quizzes.length ? Math.round(quizzes.reduce((a, q) => a + (q.best || 0), 0) / quizzes.length) : 0;
    const stats = [
      ['layout-grid', Object.keys(s.viewed).length, t('stats.txViewed'), `/ ${data.tx.length}`],
      ['circle-check', ov.learned, t('stats.txLearned'), ''],
      ['graduation-cap', ov.done, t('stats.lessons'), `/ ${ov.lessons}`],
      ['target', quizAvg + '%', t('stats.quizAvg'), ''],
      ['flame', store.streak(), t('stats.streak'), ''],
      ['notebook-pen', Object.keys(s.notes).length, t('stats.notes'), '']
    ];
    const quick = ['MIGO', 'MMBE', 'MB51', 'ME21N', 'MD04', 'VL02N', 'LT01', '/SCWM/MON'].filter((c) => data.txMap.has(c));
    const stages = data.lifecycle?.stages || [];
    const html = `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-main">
          <p class="hero-greet">${esc(greeting())}${name ? esc(t('dash.nameSep')) + esc(name) : ''}</p>
          <h1 class="hero-title">${esc(t('dash.heroTitle'))}</h1>
          <p class="hero-sub">${esc(t('dash.heroSub'))}</p>
          <div class="cmdfield" role="search">
            <span class="cmd-prefix" dir="ltr">/n</span>
            <input id="heroSearch" type="search" autocomplete="off" spellcheck="false" placeholder="${attr(t('search.placeholder'))}" aria-label="${attr(t('search.placeholder'))}" aria-controls="heroResults">
            <span class="cmd-enter" dir="ltr">Enter</span>
          </div>
          <div class="hero-results" id="heroResults" role="listbox" hidden></div>
          <div class="hero-quick"><span>${esc(t('dash.quick'))}</span><div class="chip-row">${quick.map((c) => txChip(c)).join('')}</div></div>
        </div>
        <aside class="hero-side">
          ${progressRing(ov.pct, 96, t('dash.progress'))}
          <div>
            <p class="hero-side-title">${esc(t('dash.progress'))}</p>
            <p class="hero-side-sub">${esc(t('dash.progressDetail', { l: ov.done, lt: ov.lessons, x: ov.learned, xt: ov.tx }))}</p>
            ${nl ? `<a class="btn btn-primary" href="#/lesson/${nl.id}">${icon('play')}<span>${esc(ov.done ? t('dash.continue') : t('dash.start'))}</span></a>` : `<a class="btn btn-primary" href="#/learn">${icon('award')}<span>${esc(t('learn.certificate'))}</span></a>`}
          </div>
        </aside>
      </div>
    </section>

    <section class="band lifecycle-band" aria-labelledby="lcTitle">
      <div class="band-head"><h2 id="lcTitle" class="sec-title">${icon('workflow')}<span>${esc(t('dash.lifecycle'))}</span></h2><a class="link" href="#/lifecycle">${esc(t('common.open'))}</a></div>
      <p class="muted">${esc(t('dash.lifecycleSub'))}</p>
      <ol class="mini-track">${stages.map((st) => `<li><a href="#/lifecycle/${st.n}" class="mini-stage"><span class="mini-n">${st.n}</span>${icon(st.icon)}<span class="mini-name">${esc(L(st.name))}</span></a></li>`).join('')}</ol>
    </section>

    <div class="dash-grid">
      <section class="panel" aria-labelledby="recTitle">
        <h2 id="recTitle" class="sec-title">${icon('lightbulb')}<span>${esc(t('dash.recommended'))}</span></h2>
        ${recs.length ? `<ul class="lesson-list">${recs.map((l) => { const p = data.paths.find((x) => x.id === l.path); return `<li><a href="#/lesson/${l.id}" class="lesson-row"><span class="lesson-dot path-${p?.color || 'blue'}"></span><span class="lesson-row-text"><strong>${esc(L(l.title))}</strong><span class="muted">${esc(L(p?.name))} · ${esc(t('learn.minutes', { n: l.minutes }))}</span></span>${icon('chevron-' + (document.dir === 'rtl' ? 'left' : 'right'))}</a></li>`; }).join('')}</ul>` : `<p class="muted">${esc(t('dash.allDone'))}</p><a class="btn" href="#/scenarios">${esc(t('learn.scenarios'))}</a>`}
        <div class="path-bars">${data.paths.map((p) => { const pp = pathProgress(store, p); return `<a class="path-bar" href="#/learn/${p.id}"><span>${esc(L(p.name))}</span>${bar(pp.pct)}<span class="num">${pp.pct}%</span></a>`; }).join('')}</div>
      </section>

      <section class="panel" aria-labelledby="recentTitle">
        <h2 id="recentTitle" class="sec-title">${icon('history')}<span>${esc(t('dash.recent'))}</span></h2>
        ${recent.length ? `<ul class="tx-list">${recent.map((x) => `<li><a href="${txHref(x.code)}"><span class="tc" dir="ltr">${esc(x.code)}</span><span class="tx-list-name">${esc(L(x.name))}</span>${modBadge(x.module)}</a></li>`).join('')}</ul>` : `<p class="muted">${esc(t('dash.recentEmpty'))}</p>`}
      </section>

      <section class="panel" aria-labelledby="favTitle">
        <h2 id="favTitle" class="sec-title">${icon('star')}<span>${esc(t('dash.favorites'))}</span></h2>
        ${favs.length ? `<ul class="tx-list">${favs.map((x) => `<li><a href="${txHref(x.code)}"><span class="tc" dir="ltr">${esc(x.code)}</span><span class="tx-list-name">${esc(L(x.name))}</span>${modBadge(x.module)}</a></li>`).join('')}</ul>` : `<p class="muted">${esc(t('dash.favoritesEmpty'))}</p>`}
      </section>

      <section class="panel panel-wide" aria-labelledby="modTitle">
        <h2 id="modTitle" class="sec-title">${icon('boxes')}<span>${esc(t('dash.modules'))}</span></h2>
        <div class="mod-tiles">${data.modules.map((m) => { const n = data.tx.filter((x) => x.module === m.id).length; return n ? `<a class="mod-tile mod-edge-${m.id}" href="#/tx?m=${m.id}"><span class="mod-tile-id" dir="ltr">${esc(m.id)}</span><span class="mod-tile-name">${esc(L(m.name))}</span><span class="mod-tile-count">${esc(t('explorer.count', { n }))}</span></a>` : ''; }).join('')}</div>
        <h3 class="sub-title">${esc(t('dash.categories'))}</h3>
        <div class="chip-row">${data.areas.map((a) => { const n = data.tx.filter((x) => (x.areas || []).includes(a.id)).length; return n ? `<a class="chip" href="#/tx?a=${a.id}">${icon(a.icon)}<span>${esc(L(a.name))}</span><span class="chip-count">${n}</span></a>` : ''; }).join('')}</div>
      </section>

      <section class="panel panel-wide stats-panel" aria-labelledby="statTitle">
        <h2 id="statTitle" class="sec-title">${icon('chart-column')}<span>${esc(t('dash.stats'))}</span></h2>
        <dl class="stats">${stats.map(([ic, v, label, suffix]) => `<div class="stat">${icon(ic)}<dt>${esc(label)}</dt><dd><span class="num">${typeof v === 'number' ? fmtNum(v) : esc(v)}</span>${suffix ? `<span class="muted"> ${esc(suffix)}</span>` : ''}</dd></div>`).join('')}</dl>
      </section>
    </div>`;
    return { title: t('nav.home'), crumbs: [], nav: 'home', html };
  },
  mount(root) {
    const input = root.querySelector('#heroSearch');
    const panel = root.querySelector('#heroResults');
    attachSearch(input, panel, { compact: true, limit: 24 });
    const hide = (e) => { if (!e.target.closest('.hero-main')) panel.hidden = true; };
    document.addEventListener('click', hide);
    return () => document.removeEventListener('click', hide);
  }
};
export { toast };
