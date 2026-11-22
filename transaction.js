import { t, L, LL, getLang, fmtTime } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, delegate, toast, copyText, code39, debounce } from '../core/dom.js';
import { data, txHref, getMvt } from '../core/data.js';
import { store } from '../core/store.js';
import { setHashSilently } from '../core/router.js';
import { createViewer, builtInModel, annotationModel } from './viewer.js';
import { modBadge, levelBadge, sysBadges, txChip, list, emptyState } from './common.js';

const TABS = [['overview', 'info'], ['steps', 'list-ordered'], ['fields', 'table-2'], ['errors', 'triangle-alert'], ['practice', 'target'], ['notes', 'notebook-pen']];

function actionBtn(act, on, ic, labelOn, labelOff) {
  return `<button type="button" class="act-btn${on ? ' on' : ''}" data-act-tx="${act}" aria-pressed="${on}">${icon(ic)}<span>${esc(on ? labelOn : labelOff)}</span></button>`;
}

function overview(tx) {
  const mvts = (tx.mvts || []).map(getMvt).filter(Boolean);
  const tables = (tx.tables || []);
  return `<div class="ov-grid">
    <div class="ov-main prose">
      <section><h2 class="h-sec">${esc(t('tx.purpose'))}</h2><p>${rich(L(tx.purpose))}</p></section>
      <section class="callout callout-scenario"><h2 class="h-sec">${icon('lightbulb')}<span>${esc(t('tx.scenario'))}</span></h2><p>${rich(L(tx.scenario))}</p></section>
      <section><h2 class="h-sec">${esc(t('tx.whenToUse'))}</h2>${list(LL(tx.whenToUse))}</section>
      <section><h2 class="h-sec">${esc(t('tx.prerequisites'))}</h2>${list(LL(tx.prerequisites), 'list-check')}</section>
      <section><h2 class="h-sec">${esc(t('tx.results'))}</h2>${list(LL(tx.results), 'list-result')}</section>
      <section class="callout"><h2 class="h-sec">${icon('scale')}<span>${esc(t('tx.example'))}</span></h2><p>${rich(L(tx.example))}</p></section>
    </div>
    <aside class="ov-side">
      <section class="side-card"><h2 class="h-side">${esc(t('tx.availability'))}</h2><div class="sys-row">${sysBadges(tx.systems)}</div><p class="small">${rich(L(tx.availability))}</p></section>
      ${mvts.length ? `<section class="side-card"><h2 class="h-side">${esc(t('tx.mvtCard'))}</h2><ul class="mvt-mini">${mvts.map((m) => `<li><a href="#/movements/${m.code}"><span class="tc" dir="ltr">${m.code}</span><span>${esc(L(m.name))}</span><span class="mvt-cat cat-${m.cat}" title="${attr(t('mvt.cat.' + m.cat))}"></span></a></li>`).join('')}</ul></section>` : ''}
      <section class="side-card"><h2 class="h-side">${esc(t('tx.related'))}</h2><div class="chip-row">${(tx.related || []).map((c) => txChip(c, { withName: true })).join('')}</div></section>
      ${(tx.fiori || []).length ? `<section class="side-card"><h2 class="h-side">${esc(t('tx.fiori'))}</h2><ul class="fiori-list">${tx.fiori.map((f) => `<li><span class="fiori-id" dir="ltr">${esc(f.id || '')}</span><span dir="ltr">${esc(f.n)}</span></li>`).join('')}</ul><p class="small muted">${esc(t('tx.fioriNote'))}</p></section>` : ''}
      ${tables.length ? `<section class="side-card"><h2 class="h-side">${esc(t('tx.tables'))}</h2><dl class="tables">${tables.map((tb) => `<div><dt dir="ltr">${esc(tb)}</dt><dd>${esc(L(data.tables[tb]) || '')}</dd></div>`).join('')}</dl></section>` : ''}
    </aside>
  </div>`;
}

function stepsPanel(tx) {
  return `<div class="steps-layout">
    <div class="steps-col">
      <h2 class="h-sec">${esc(t('tx.steps.title'))}</h2>
      <p class="muted small">${esc(t('tx.steps.hint'))}</p>
      <ol class="steplist">${tx.steps.map((s, i) => `<li class="step${i === 0 ? ' active' : ''}" data-i="${i}">
        <button type="button" class="step-head" aria-expanded="${i === 0}" aria-controls="sd-${i}"><span class="step-n">${i + 1}</span><span class="step-t">${esc(L(s.t))}</span></button>
        <div class="step-d" id="sd-${i}">${rich(L(s.d))}</div></li>`).join('')}</ol>
    </div>
    <div class="viewer-col"><div class="viewer-switch" hidden></div><div class="viewer-host"></div></div>
  </div>`;
}

function fieldsPanel(tx) {
  return `<h2 class="h-sec">${esc(t('tx.tabs.fields'))}</h2>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>${esc(t('tx.fields.label'))}</th><th>${esc(t('tx.fields.tech'))}</th><th>${esc(t('tx.fields.desc'))}</th></tr></thead>
  <tbody>${(tx.fields || []).map((f) => `<tr><td dir="ltr" class="f-label">${esc(f.l)}</td><td><code dir="ltr">${esc(f.tech)}</code></td><td>${rich(L(f.d))}</td></tr>`).join('')}</tbody></table></div>`;
}

function errorsPanel(tx) {
  return `<h2 class="h-sec">${esc(t('tx.tabs.errors'))}</h2>
  <div class="err-list">${(tx.errors || []).map((e) => `<article class="err-card">
    <header class="err-head">${icon('circle-x')}<code class="err-msg" dir="ltr">${esc(e.msg)}</code>${e.id ? `<span class="err-id" dir="ltr">${esc(e.id)}</span>` : ''}</header>
    <dl class="err-body"><div><dt>${esc(t('tx.errors.cause'))}</dt><dd>${rich(L(e.c))}</dd></div><div><dt>${esc(t('tx.errors.solution'))}</dt><dd>${rich(L(e.s))}</dd></div></dl>
  </article>`).join('')}</div>
  <p class="small muted">${esc(t('tx.errors.note'))}</p>
  <h2 class="h-sec">${esc(t('tx.troubleshooting'))}</h2>${list(LL(tx.troubleshooting), 'list-check')}`;
}

function practicePanel(tx) {
  const lessons = data.lessons.filter((l) => (l.tx || []).includes(tx.code));
  return `<h2 class="h-sec">${esc(t('tx.tabs.practice'))}</h2>
  <div class="ex-list">${(tx.exercises || []).map((ex, i) => { const key = `${tx.code}:${i}`; const done = store.exerciseDone(key); return `<article class="ex-card${done ? ' done' : ''}">
    <header><span class="ex-n">${esc(t('tx.exercise', { n: i + 1 }))}</span><button type="button" class="chip chip-toggle" data-ex="${attr(key)}" aria-pressed="${done}">${icon('check')}<span>${esc(t('tx.exerciseDone'))}</span></button></header>
    <p>${rich(L(ex.t))}</p>
    <details><summary>${esc(t('tx.showSolution'))}</summary><p>${rich(L(ex.s))}</p></details>
  </article>`; }).join('')}</div>
  ${lessons.length ? `<h2 class="h-sec">${esc(t('tx.lessons'))}</h2><ul class="lesson-list">${lessons.map((l) => `<li><a class="lesson-row" href="#/lesson/${l.id}"><span class="lesson-dot"></span><span class="lesson-row-text"><strong>${esc(L(l.title))}</strong><span class="muted">${esc(t('learn.minutes', { n: l.minutes }))}</span></span></a></li>`).join('')}</ul>` : ''}`;
}

function notesPanel(tx) {
  const key = 'tx:' + tx.code; const ts = store.noteTs(key);
  return `<h2 class="h-sec">${esc(t('tx.tabs.notes'))}</h2>
  <label class="sr-only" for="txnote">${esc(t('tx.tabs.notes'))}</label>
  <textarea id="txnote" class="note-area" rows="10" placeholder="${attr(t('tx.notes.placeholder'))}">${esc(store.note(key))}</textarea>
  <p class="small muted" id="notestatus">${ts ? esc(t('tx.notes.saved', { time: fmtTime(ts) })) : esc(t('tx.notes.local'))}</p>`;
}

export default {
  name: 'transaction',
  render({ params }) {
    const tx = data.txMap.get(params.code);
    if (!tx) {
      return { title: params.code, crumbs: [{ label: t('nav.tx'), href: '#/tx' }, { label: params.code, code: true }], nav: 'tx',
        html: data.company.available && !data.company.unlocked && /^Z/i.test(params.code)
          ? emptyState('company.lockedTx', 'lock', { code: params.code }, `<a class="btn btn-primary" href="#/company?next=${encodeURIComponent(params.code)}">${esc(t('company.unlock'))}</a>`)
          : emptyState('tx.notFound', 'search', { code: params.code }, `<a class="btn btn-primary" href="#/tx">${esc(t('nav.tx'))}</a>`) };
    }
    const tab = TABS.some(([k]) => k === params.tab) ? params.tab : 'overview';
    const lang = getLang();
    const others = ['ar', 'en', 'fr'].filter((l) => l !== lang).map((l) => `<span lang="${l}"${l === 'ar' ? ' dir="rtl"' : ''}>${esc(tx.name[l])}</span>`).join('');
    const fav = store.isFav(tx.code); const bm = store.isBookmarked('tx', tx.code); const learned = store.isLearned(tx.code);
    const areas = (tx.areas || []).map((a) => data.areaMap.get(a)).filter(Boolean);
    const html = `<article class="txpage" data-code="${attr(tx.code)}">
      <header class="binlabel mod-edge-${esc(tx.module)}">
        <div class="bl-id"><span class="bl-code" dir="ltr">${esc(tx.code)}</span><span class="bl-bars">${code39(tx.code, { label: t('tx.barcode', { code: tx.code }) })}</span></div>
        <div class="bl-body">
          <h1 class="bl-name">${esc(L(tx.name))}</h1>
          <p class="bl-alt">${others}</p>
          <div class="bl-meta">${modBadge(tx.module)}<span class="muted">${esc(L(data.moduleMap.get(tx.module)?.name))}</span>${levelBadge(tx.level)}${areas.map((a) => `<a class="mini-chip" href="#/tx?a=${a.id}">${esc(L(a.name))}</a>`).join('')}</div>
        </div>
        <div class="bl-actions">
          ${actionBtn('fav', fav, 'star', t('tx.fav.on'), t('tx.fav.add'))}
          ${actionBtn('bm', bm, 'bookmark', t('tx.bookmark.on'), t('tx.bookmark.add'))}
          ${actionBtn('learned', learned, 'circle-check', t('tx.learned.done'), t('tx.learned.mark'))}
          <button type="button" class="act-btn" data-act-tx="share">${icon('share-2')}<span>${esc(t('common.share'))}</span></button>
        </div>
      </header>
      <p class="tx-summary">${rich(L(tx.summary))}</p>
      <div class="tabs" role="tablist" aria-label="${attr(t('tx.tabsLabel'))}">${TABS.map(([k, ic]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="tp-${k}" aria-selected="${k === tab}" tabindex="${k === tab ? 0 : -1}" data-tab="${k}">${icon(ic)}<span>${esc(t('tx.tabs.' + k))}</span>${k === 'errors' ? `<span class="tab-count">${(tx.errors || []).length}</span>` : ''}</button>`).join('')}</div>
      <section class="tabpanel" id="tp-overview" role="tabpanel" aria-labelledby="tab-overview"${tab !== 'overview' ? ' hidden' : ''}>${overview(tx)}</section>
      <section class="tabpanel" id="tp-steps" role="tabpanel" aria-labelledby="tab-steps"${tab !== 'steps' ? ' hidden' : ''}>${stepsPanel(tx)}</section>
      <section class="tabpanel" id="tp-fields" role="tabpanel" aria-labelledby="tab-fields"${tab !== 'fields' ? ' hidden' : ''}>${fieldsPanel(tx)}</section>
      <section class="tabpanel" id="tp-errors" role="tabpanel" aria-labelledby="tab-errors"${tab !== 'errors' ? ' hidden' : ''}>${errorsPanel(tx)}</section>
      <section class="tabpanel" id="tp-practice" role="tabpanel" aria-labelledby="tab-practice"${tab !== 'practice' ? ' hidden' : ''}>${practicePanel(tx)}</section>
      <section class="tabpanel" id="tp-notes" role="tabpanel" aria-labelledby="tab-notes"${tab !== 'notes' ? ' hidden' : ''}>${notesPanel(tx)}</section>
    </article>`;
    return { title: `${tx.code} – ${L(tx.name)}`, crumbs: [{ label: t('nav.tx'), href: '#/tx' }, { label: L(data.moduleMap.get(tx.module)?.name), href: '#/tx?m=' + tx.module }, { label: tx.code, code: true }], nav: 'tx', html };
  },

  mount(root, r) {
    const tx = data.txMap.get(r.params.code);
    if (!tx) return null;
    store.visitTx(tx.code);
    const geo = data.screens[tx.code];
    if (geo) {
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
      idle(() => geo.screens.forEach((x) => { if (!x.src.startsWith('data:')) { const im = new Image(); im.decoding = 'async'; im.src = x.src; } }));
    }
    let viewer = null; let unsub = null;
    const steps = [...root.querySelectorAll('.step')];
    const markStep = (i, scrollList) => {
      steps.forEach((li, j) => { const on = j === i; li.classList.toggle('active', on); li.querySelector('.step-head').setAttribute('aria-expanded', String(on)); });
      if (scrollList && steps[i]) {
        const rect = steps[i].getBoundingClientRect();
        const narrow = !window.matchMedia('(min-width: 900px)').matches;
        const topLimit = narrow ? (root.querySelector('.viewer-col')?.getBoundingClientRect().bottom || 0) : 70;
        if (rect.top < topLimit || rect.bottom > window.innerHeight - 70) steps[i].scrollIntoView({ block: narrow ? 'end' : 'nearest', behavior: 'smooth' });
      }
    };
    const host = root.querySelector('.viewer-host');
    const switcher = root.querySelector('.viewer-switch');
    const ann = (data.annotations || []).filter((a) => a.transaction === tx.code);
    const pick = ann.find((a) => a.language === getLang()) || ann.find((a) => !a.language || a.language === '*') || ann[0];
    let custom = null; let useCustom = false;

    const buildViewer = (model, initial = 0) => {
      if (viewer) { viewer.destroy(); viewer = null; }
      if (!model) { host.innerHTML = `<div class="empty small">${icon('image')}<p>${esc(t('viewer.none'))}</p></div>`; return; }
      viewer = createViewer(host, model, { code: tx.code, initial });
      unsub = viewer.onChange((i) => markStep(i, true));
      markStep(initial, false);
    };
    const ensureViewer = () => {
      if (viewer || root.querySelector('#tp-steps').hidden) return;
      const base = builtInModel(tx, data.screens[tx.code]);
      if (pick && !custom) {
        fetch(pick.file).then((res) => (res.ok ? res.json() : null)).then((json) => {
          if (!json) { buildViewer(base); return; }
          custom = annotationModel(json, getLang());
          useCustom = true;
          switcher.hidden = false;
          switcher.innerHTML = `<div class="seg" role="group"><button type="button" data-view="custom" aria-pressed="true">${esc(t('viewer.useAdmin'))}</button><button type="button" data-view="sim" aria-pressed="false">${esc(t('viewer.useSim'))}</button></div>`;
          buildViewer(custom);
        }).catch(() => buildViewer(base));
      } else buildViewer(useCustom ? custom : base);
    };
    switcher.addEventListener('click', (e) => {
      const b = e.target.closest('[data-view]'); if (!b) return;
      useCustom = b.dataset.view === 'custom';
      switcher.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (viewer) { viewer.destroy(); viewer = null; }
      buildViewer(useCustom ? custom : builtInModel(tx, data.screens[tx.code]));
    });

    const showTab = (k, focus) => {
      root.querySelectorAll('[role="tab"]').forEach((b) => { const on = b.dataset.tab === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      root.querySelectorAll('.tabpanel').forEach((p) => { p.hidden = p.id !== 'tp-' + k; });
      setHashSilently(txHref(tx.code, k === 'overview' ? '' : k));
      if (k === 'steps') ensureViewer();
    };
    const tablist = root.querySelector('[role="tablist"]');
    tablist.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
    tablist.addEventListener('keydown', (e) => {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')]; const i = tabs.indexOf(document.activeElement); if (i < 0) return;
      const rtl = document.dir === 'rtl';
      let n = null;
      if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) n = (i + 1) % tabs.length;
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
      if (n != null) { e.preventDefault(); showTab(tabs[n].dataset.tab, true); }
    });
    const offs = [
      delegate(root, 'click', '.step-head', (e, el) => { const i = Number(el.closest('.step').dataset.i); markStep(i, false); if (viewer) viewer.setActive(i, { silent: true, scroll: true }); }),
      delegate(root, 'click', '[data-act-tx]', async (e, el) => {
        const a = el.dataset.actTx;
        const set = (on, lOn, lOff) => { el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.querySelector('span').textContent = on ? lOn : lOff; };
        if (a === 'fav') { const on = store.toggleFav(tx.code); set(on, t('tx.fav.on'), t('tx.fav.add')); toast(t(on ? 'toast.favAdded' : 'toast.favRemoved')); }
        else if (a === 'bm') { const on = store.toggleBookmark('tx', tx.code); set(on, t('tx.bookmark.on'), t('tx.bookmark.add')); toast(t(on ? 'toast.bookmarkAdded' : 'toast.bookmarkRemoved')); }
        else if (a === 'learned') { const on = store.toggleLearned(tx.code); set(on, t('tx.learned.done'), t('tx.learned.mark')); toast(t(on ? 'toast.learned' : 'toast.unlearned')); }
        else if (a === 'share') {
          const url = location.href.split('#')[0] + txHref(tx.code);
          const text = `${tx.code} – ${L(tx.name)}`;
          if (navigator.share) { try { await navigator.share({ title: text, text, url }); } catch (er) { /* dismissed */ } }
          else if (await copyText(url)) toast(t('toast.copied'));
        }
      }),
      delegate(root, 'click', '[data-ex]', (e, el) => { store.toggleExercise(el.dataset.ex); const on = store.exerciseDone(el.dataset.ex); el.setAttribute('aria-pressed', on); el.closest('.ex-card').classList.toggle('done', on); })
    ];
    const note = root.querySelector('#txnote');
    const status = root.querySelector('#notestatus');
    const save = debounce(() => { store.setNote('tx:' + tx.code, note.value); status.textContent = note.value.trim() ? t('tx.notes.saved', { time: fmtTime(Date.now()) }) : t('tx.notes.local'); }, 400);
    note.addEventListener('input', save);
    if (!root.querySelector('#tp-steps').hidden) ensureViewer();
    return () => { offs.forEach((f) => f()); if (unsub) unsub(); if (viewer) viewer.destroy(); };
  }
};
