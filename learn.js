import { t, L, LL, fmtDate, fmtTime, getLang } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, delegate, toast, openModal, downloadBlob, debounce } from '../core/dom.js';
import { data, pathProgress } from '../core/data.js';
import { store } from '../core/store.js';
import { txChip, mvtChip, list, bar, progressRing, emptyState, levelBadge } from './common.js';
import { LOGO } from './shell.js';

const chev = () => icon(document.dir === 'rtl' ? 'chevron-left' : 'chevron-right');
const quizBest = (id) => (store.quiz(id) || {}).best;
const pathOf = (lesson) => data.paths.find((p) => p.lessons.includes(lesson.id));

function lessonStatus(l) {
  const done = store.lessonDone(l.id); const best = quizBest(l.id);
  const passed = best >= data.passScore;
  return `<span class="ls-status">${done ? `<span class="ok" title="${attr(t('learn.done'))}">${icon('circle-check')}</span>` : `<span class="todo">${icon('circle-dot')}</span>`}${best != null ? `<span class="score ${passed ? 'pass' : 'fail'}">${best}%</span>` : ''}</span>`;
}

export const learnHome = {
  name: 'learn',
  render() {
    const certs = store.state.certs;
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('learn.title'))}</h1><p class="page-sub">${esc(t('learn.sub'))}</p></header>
    <div class="path-cards">${data.paths.map((p) => { const pp = pathProgress(store, p); const mins = p.lessons.reduce((a, id) => a + (data.lessonMap.get(id)?.minutes || 0), 0); return `<a class="path-card path-${p.color}" href="#/learn/${p.id}">
      <span class="path-icon">${icon(p.icon)}</span>
      <span class="path-level">${levelBadge(p.level)}</span>
      <h2>${esc(L(p.name))}</h2><p>${esc(L(p.desc))}</p>
      <span class="path-meta">${esc(t('learn.lessons', { n: p.lessons.length }))} · ${esc(t('learn.minutes', { n: mins }))}</span>
      <span class="path-progress">${bar(pp.pct)}<span class="num">${pp.pct}%</span></span>
      ${pp.complete ? `<span class="path-done">${icon('award')}<span>${esc(t('learn.completed'))}</span></span>` : ''}
    </a>`; }).join('')}</div>
    <section class="panel"><div class="band-head"><h2 class="sec-title">${icon('lightbulb')}<span>${esc(t('learn.scenarios'))}</span></h2><a class="link" href="#/scenarios">${esc(t('common.open'))}</a></div><p class="muted">${esc(t('learn.scenariosSub'))}</p>
      <ul class="lesson-list">${data.scenarios.slice(0, 3).map((s) => `<li><a class="lesson-row" href="#/scenarios?s=${s.id}"><span class="lesson-dot"></span><span class="lesson-row-text"><strong>${esc(L(s.title))}</strong><span class="muted">${esc(L(data.levels.find((x) => x.id === s.level)?.name))}</span></span>${chev()}</a></li>`).join('')}</ul></section>
    <section class="panel"><h2 class="sec-title">${icon('award')}<span>${esc(t('learn.certificates'))}</span></h2>
      ${certs.length ? `<ul class="cert-list">${certs.map((c) => `<li><span>${icon('award')}</span><span><strong>${esc(L(data.paths.find((p) => p.id === c.path)?.name))}</strong><span class="muted small">${esc(fmtDate(c.date))} · ${esc(c.code)}</span></span><button type="button" class="btn btn-sm" data-cert="${attr(c.path)}">${esc(t('common.open'))}</button></li>`).join('')}</ul>` : `<p class="muted">${esc(t('learn.noCerts'))}</p>`}
    </section>`;
    return { title: t('learn.title'), crumbs: [{ label: t('nav.learn') }], nav: 'learn', html };
  },
  mount(root) { return delegate(root, 'click', '[data-cert]', (e, el) => showCertificate(el.dataset.cert)); }
};

export const pathView = {
  name: 'path',
  render({ params }) {
    const p = data.paths.find((x) => x.id === params.path);
    if (!p) return { title: '', crumbs: [{ label: t('nav.learn'), href: '#/learn' }], nav: 'learn', html: emptyState('notfound.body', 'search') };
    const pp = pathProgress(store, p);
    const lessons = p.lessons.map((id) => data.lessonMap.get(id)).filter(Boolean);
    const html = `<header class="path-head path-${p.color}">${progressRing(pp.pct, 84)}<div><p class="muted">${esc(t('learn.path'))}</p><h1 class="page-title">${esc(L(p.name))}</h1><p class="page-sub">${esc(L(p.desc))}</p></div></header>
    <ol class="path-lessons">${lessons.map((l, i) => `<li><a class="pl-row" href="#/lesson/${l.id}"><span class="pl-n">${i + 1}</span><span class="pl-text"><strong>${esc(L(l.title))}</strong><span class="muted small">${esc(L(l.summary))}</span><span class="muted small">${esc(t('learn.minutes', { n: l.minutes }))}</span></span>${lessonStatus(l)}${chev()}</a></li>`).join('')}</ol>
    <section class="cert-box${pp.complete ? ' unlocked' : ''}">${icon(pp.complete ? 'award' : 'lock')}<div><h2>${esc(t('learn.certificate'))}</h2><p>${esc(pp.complete ? t('learn.certReady', { score: pp.avg }) : t('learn.certLocked', { score: data.passScore }))}</p><p class="small muted">${esc(t('learn.pathStats', { done: pp.done, passed: pp.passed, total: pp.total }))}</p></div>${pp.complete ? `<button type="button" class="btn btn-primary" data-getcert="${p.id}">${icon('award')}<span>${esc(t('learn.getCertificate'))}</span></button>` : ''}</section>`;
    return { title: L(p.name), crumbs: [{ label: t('nav.learn'), href: '#/learn' }, { label: L(p.name) }], nav: 'learn', html };
  },
  mount(root) { return delegate(root, 'click', '[data-getcert]', (e, el) => showCertificate(el.dataset.getcert)); }
};

export const lessonView = {
  name: 'lesson',
  render({ params }) {
    const l = data.lessonMap.get(params.id);
    if (!l) return { title: '', crumbs: [{ label: t('nav.learn'), href: '#/learn' }], nav: 'learn', html: emptyState('notfound.body', 'search') };
    const p = pathOf(l); const idx = data.lessons.indexOf(l);
    const prev = data.lessons[idx - 1]; const next = data.lessons[idx + 1];
    const done = store.lessonDone(l.id); const best = quizBest(l.id); const bm = store.isBookmarked('lesson', l.id);
    const html = `<article class="lesson">
      <header class="lesson-head">
        <a class="mini-chip path-${p?.color}" href="#/learn/${p?.id}">${esc(L(p?.name))}</a>
        <h1 class="page-title">${esc(L(l.title))}</h1>
        <p class="page-sub">${esc(L(l.summary))}</p>
        <p class="lesson-meta">${icon('timer')}<span>${esc(t('learn.minutes', { n: l.minutes }))}</span>${done ? `<span class="ok">${icon('circle-check')}${esc(t('learn.done'))}</span>` : ''}${best != null ? `<span>${esc(t('learn.quizBest', { score: best }))}</span>` : ''}
          <button type="button" class="act-btn${bm ? ' on' : ''}" data-lbm aria-pressed="${bm}">${icon('bookmark')}<span>${esc(t(bm ? 'tx.bookmark.on' : 'tx.bookmark.add'))}</span></button></p>
      </header>
      <section class="objectives"><h2 class="h-sec">${icon('target')}<span>${esc(t('learn.objectives'))}</span></h2>${list(LL(l.objectives), 'list-check')}</section>
      <div class="prose lesson-body">${l.sections.map((s) => `<section><h2>${esc(L(s.h))}</h2><p>${rich(L(s.p))}</p></section>`).join('')}</div>
      ${(l.tx || []).length || (l.mvts || []).length ? `<section class="lesson-links">${(l.tx || []).length ? `<div><h3 class="h-side">${esc(t('learn.relatedTx'))}</h3><div class="chip-row">${l.tx.map((c) => txChip(c, { withName: true })).join('')}</div></div>` : ''}${(l.mvts || []).length ? `<div><h3 class="h-side">${esc(t('learn.relatedMvt'))}</h3><div class="chip-row">${l.mvts.map(mvtChip).join('')}</div></div>` : ''}</section>` : ''}
      <section class="callout takeaways"><h2 class="h-sec">${icon('sparkles')}<span>${esc(t('learn.takeaways'))}</span></h2>${list(LL(l.takeaways))}</section>
      <section class="lesson-actions">
        <button type="button" class="btn${done ? '' : ' btn-primary'}" data-done aria-pressed="${done}">${icon('circle-check')}<span>${esc(t(done ? 'learn.done' : 'learn.markDone'))}</span></button>
        <a class="btn${done ? ' btn-primary' : ''}" href="#/quiz/${l.id}">${icon('list-checks')}<span>${esc(t(best != null ? 'learn.retakeQuiz' : 'learn.takeQuiz'))}</span></a>
      </section>
      <section class="lesson-notes"><h2 class="h-sec">${icon('notebook-pen')}<span>${esc(t('learn.lessonNotes'))}</span></h2><textarea class="note-area" id="lnote" rows="5" placeholder="${attr(t('tx.notes.placeholder'))}">${esc(store.note('lesson:' + l.id))}</textarea><p class="small muted" id="lnstatus">${esc(t('tx.notes.local'))}</p></section>
      <nav class="pager">${prev ? `<a class="btn" href="#/lesson/${prev.id}">${icon(document.dir === 'rtl' ? 'chevron-right' : 'chevron-left')}<span>${esc(t('learn.prevLesson'))}</span></a>` : '<span></span>'}${next ? `<a class="btn" href="#/lesson/${next.id}"><span>${esc(t('learn.nextLesson'))}</span>${chev()}</a>` : ''}</nav>
    </article>`;
    return { title: L(l.title), crumbs: [{ label: t('nav.learn'), href: '#/learn' }, { label: L(p?.name), href: '#/learn/' + p?.id }, { label: L(l.title) }], nav: 'learn', html };
  },
  mount(root, r) {
    const l = data.lessonMap.get(r.params.id); if (!l) return null;
    const note = root.querySelector('#lnote'); const st = root.querySelector('#lnstatus');
    note.addEventListener('input', debounce(() => { store.setNote('lesson:' + l.id, note.value); st.textContent = t('tx.notes.saved', { time: fmtTime(Date.now()) }); }, 400));
    const offs = [
      delegate(root, 'click', '[data-done]', (e, el) => { const on = !store.lessonDone(l.id); store.setLessonDone(l.id, on); el.setAttribute('aria-pressed', on); el.classList.toggle('btn-primary', !on); el.querySelector('span').textContent = t(on ? 'learn.done' : 'learn.markDone'); if (on) toast(t('toast.lessonDone')); }),
      delegate(root, 'click', '[data-lbm]', (e, el) => { const on = store.toggleBookmark('lesson', l.id); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.querySelector('span').textContent = t(on ? 'tx.bookmark.on' : 'tx.bookmark.add'); })
    ];
    return () => offs.forEach((f) => f());
  }
};

function shuffle(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const quizView = {
  name: 'quiz',
  render({ params }) {
    const l = data.lessonMap.get(params.id);
    if (!l) return { title: '', crumbs: [{ label: t('nav.learn'), href: '#/learn' }], nav: 'learn', html: emptyState('notfound.body', 'search') };
    const html = `<section class="quiz" aria-live="polite"><header class="quiz-head"><p class="muted">${esc(t('quiz.title'))}</p><h1 class="page-title">${esc(L(l.title))}</h1><div class="quiz-progress">${bar(0)}<span class="num quiz-count"></span></div></header><div class="quiz-body"></div></section>`;
    return { title: t('quiz.title') + ' – ' + L(l.title), crumbs: [{ label: t('nav.learn'), href: '#/learn' }, { label: L(l.title), href: '#/lesson/' + l.id }, { label: t('quiz.title') }], nav: 'learn', html };
  },
  mount(root, r) {
    const l = data.lessonMap.get(r.params.id); if (!l) return null;
    const qs = l.quiz; let i = 0; let correct = 0; const answers = [];
    const orders = qs.map((q) => shuffle(q.o.length));
    const body = root.querySelector('.quiz-body'); const count = root.querySelector('.quiz-count'); const pbar = root.querySelector('.quiz-progress .bar span');
    const showQ = () => {
      const q = qs[i]; const order = orders[i];
      count.textContent = t('quiz.question', { a: i + 1, b: qs.length }); pbar.style.width = `${(i / qs.length) * 100}%`;
      body.innerHTML = `<fieldset class="quiz-card"><legend class="quiz-q">${rich(L(q.q))}</legend><div class="quiz-opts" role="radiogroup">${order.map((oi, k) => `<label class="quiz-opt"><input type="radio" name="opt" value="${oi}"><span class="opt-key">${String.fromCharCode(65 + k)}</span><span>${rich(L(q.o[oi]))}</span></label>`).join('')}</div><div class="quiz-feedback" hidden></div><div class="row-end"><button type="button" class="btn btn-primary" data-check disabled>${esc(t('quiz.check'))}</button></div></fieldset>`;
      const btn = body.querySelector('[data-check]');
      body.querySelectorAll('input[name="opt"]').forEach((inp) => inp.addEventListener('change', () => { btn.disabled = false; }));
      btn.addEventListener('click', () => {
        const chosen = Number(body.querySelector('input[name="opt"]:checked').value);
        const ok = chosen === q.a; if (ok) correct++; answers.push({ chosen, ok });
        body.querySelectorAll('.quiz-opt').forEach((lab) => { const v = Number(lab.querySelector('input').value); lab.classList.toggle('right', v === q.a); lab.classList.toggle('wrong', v === chosen && !ok); lab.querySelector('input').disabled = true; });
        const fb = body.querySelector('.quiz-feedback'); fb.hidden = false; fb.className = 'quiz-feedback ' + (ok ? 'ok' : 'bad');
        fb.innerHTML = `${icon(ok ? 'circle-check' : 'circle-x')}<div><strong>${esc(t(ok ? 'quiz.correct' : 'quiz.incorrect'))}</strong><p>${rich(L(q.e))}</p></div>`;
        btn.textContent = i < qs.length - 1 ? t('quiz.next') : t('quiz.finish');
        btn.replaceWith(btn.cloneNode(true));
        body.querySelector('[data-check]').addEventListener('click', () => { i++; if (i < qs.length) showQ(); else finish(); });
        body.querySelector('[data-check]').focus();
      });
    };
    const finish = () => {
      const score = Math.round((correct / qs.length) * 100); const pass = score >= data.passScore;
      store.recordQuiz(l.id, score, data.passScore);
      if (pass && !store.lessonDone(l.id)) store.setLessonDone(l.id, true);
      pbar.style.width = '100%'; count.textContent = '';
      const next = data.lessons[data.lessons.indexOf(l) + 1];
      body.innerHTML = `<div class="quiz-result ${pass ? 'pass' : 'fail'}">${progressRing(score, 110)}<div><h2>${esc(t('quiz.score', { score }))}</h2><p>${esc(pass ? t('quiz.passed') : t('quiz.failed', { pass: data.passScore }))}</p></div></div>
      <ol class="quiz-review">${qs.map((q, k) => `<li class="${answers[k].ok ? 'ok' : 'bad'}">${icon(answers[k].ok ? 'circle-check' : 'circle-x')}<div><p>${rich(L(q.q))}</p><p class="small muted">${esc(t('quiz.answer', { a: L(q.o[q.a]) }))}</p></div></li>`).join('')}</ol>
      <div class="row-end"><button type="button" class="btn" data-retry>${icon('rotate-ccw')}<span>${esc(t('quiz.retry'))}</span></button><a class="btn" href="#/lesson/${l.id}">${esc(t('quiz.backToLesson'))}</a>${pass && next ? `<a class="btn btn-primary" href="#/lesson/${next.id}">${esc(t('learn.nextLesson'))}</a>` : ''}</div>`;
      body.querySelector('[data-retry]').addEventListener('click', () => { i = 0; correct = 0; answers.length = 0; orders.forEach((o, k) => { orders[k] = shuffle(qs[k].o.length); }); showQ(); });
    };
    showQ();
    return null;
  }
};

export const scenariosView = {
  name: 'scenarios',
  render({ query }) {
    const open = query.s || '';
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('learn.scenarios'))}</h1><p class="page-sub">${esc(t('learn.scenariosSub'))}</p></header>
    <div class="scenario-list">${data.scenarios.map((s) => `<article class="scenario" id="sc-${s.id}">
      <header>${levelBadge(s.level)}<h2>${esc(L(s.title))}</h2></header>
      <div class="sc-context"><h3 class="h-side">${esc(t('learn.scenario.context'))}</h3><p>${rich(L(s.context))}</p></div>
      <div><h3 class="h-side">${esc(t('learn.scenario.tasks'))}</h3><ol class="list">${LL(s.tasks).map((x) => `<li>${rich(x)}</li>`).join('')}</ol></div>
      <details${open === s.id ? ' open' : ''}><summary>${esc(t('learn.scenario.show'))}</summary><ol class="list">${LL(s.solution).map((x) => `<li>${rich(x)}</li>`).join('')}</ol></details>
      <div class="chip-row">${s.tx.map((c) => txChip(c)).join('')}</div>
    </article>`).join('')}</div>`;
    return { title: t('learn.scenarios'), crumbs: [{ label: t('nav.learn'), href: '#/learn' }, { label: t('learn.scenarios') }], nav: 'learn', html };
  },
  mount(root, r) { if (r.query.s) { const el = root.querySelector('#sc-' + CSS.escape(r.query.s)); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 50); } return null; }
};

// ---------------- certificate ----------------
function hashCode(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().padStart(7, '0'); }
function certSVG(c, p, embedCss = '') {
  const lang = getLang(); const rtl = lang === 'ar'; const W = 1123; const H = 794;
  const anchor = 'middle';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" direction="${rtl ? 'rtl' : 'ltr'}" font-family="'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif">${embedCss ? `<style>${embedCss}</style>` : ''}
  <rect width="${W}" height="${H}" fill="#FFFFFF"/><rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#0B4F9C" stroke-width="3"/><rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#C9D6E6" stroke-width="1"/>
  <rect x="36" y="36" width="${W - 72}" height="10" fill="#0B4F9C"/><rect x="36" y="46" width="${(W - 72) * 0.28}" height="4" fill="#F5B400"/>
  <g transform="translate(${W / 2 - 28} 92) scale(1.4)">${LOGO.replace('<svg class="logo"', '<svg width="40" height="40"')}</g>
  <text x="${W / 2}" y="190" text-anchor="${anchor}" font-size="22" fill="#4A5D72">LogiAcademy</text>
  <text x="${W / 2}" y="258" text-anchor="${anchor}" font-size="46" font-weight="700" fill="#10324F">${esc(t('cert.title'))}</text>
  <text x="${W / 2}" y="320" text-anchor="${anchor}" font-size="20" fill="#4A5D72">${esc(t('cert.awarded'))}</text>
  <text x="${W / 2}" y="388" text-anchor="${anchor}" font-size="44" font-weight="600" fill="#0B4F9C">${esc(c.name)}</text>
  <line x1="${W / 2 - 260}" y1="410" x2="${W / 2 + 260}" y2="410" stroke="#C9D6E6"/>
  <text x="${W / 2}" y="458" text-anchor="${anchor}" font-size="20" fill="#4A5D72">${esc(t('cert.forCompleting'))}</text>
  <text x="${W / 2}" y="506" text-anchor="${anchor}" font-size="30" font-weight="600" fill="#10324F">${esc(L(p.name))}</text>
  <text x="${W / 2}" y="546" text-anchor="${anchor}" font-size="17" fill="#4A5D72">${esc(L(p.desc))}</text>
  <g font-size="17" fill="#10324F">
    <text x="${W * 0.22}" y="650" text-anchor="middle">${esc(t('cert.score'))}</text><text x="${W * 0.22}" y="680" text-anchor="middle" font-weight="700" direction="ltr">${c.score}%</text>
    <text x="${W * 0.5}" y="650" text-anchor="middle">${esc(t('cert.date'))}</text><text x="${W * 0.5}" y="680" text-anchor="middle" font-weight="700">${esc(fmtDate(c.date))}</text>
    <text x="${W * 0.78}" y="650" text-anchor="middle">${esc(t('cert.code'))}</text><text x="${W * 0.78}" y="680" text-anchor="middle" font-weight="700" direction="ltr">${esc(c.code)}</text>
  </g>
  <text x="${W / 2}" y="740" text-anchor="middle" font-size="13" fill="#6A7C8F">${esc(t('cert.note'))}</text>
  </svg>`;
}
async function fontCSS() {
  const files = [['plex-arabic-400-arabic', 400], ['plex-arabic-400-latin', 400], ['plex-arabic-600-arabic', 600], ['plex-arabic-600-latin', 600], ['plex-arabic-700-arabic', 700], ['plex-arabic-700-latin', 700]];
  const parts = await Promise.all(files.map(async ([f, w]) => {
    try { const b = await (await fetch(`assets/fonts/${f}.woff2`)).blob(); const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); return `@font-face{font-family:'IBM Plex Sans Arabic';font-weight:${w};src:url(${url}) format('woff2');}`; } catch (e) { return ''; }
  }));
  return parts.join('');
}
async function downloadPNG(c, p) {
  const svg = certSVG(c, p, await fontCSS());
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const canvas = document.createElement('canvas'); canvas.width = 2246; canvas.height = 1588;
  const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  canvas.toBlob((blob) => downloadBlob(blob, `logiacademy-certificate-${p.id}.png`), 'image/png');
}
export function showCertificate(pathId) {
  const p = data.paths.find((x) => x.id === pathId); if (!p) return;
  const pp = pathProgress(store, p);
  const existing = store.state.certs.find((c) => c.path === pathId);
  const nameVal = existing?.name || store.state.prefs.name || '';
  openModal({
    title: t('cert.title'), wide: true,
    html: `<form class="cert-form"><label class="field"><span>${esc(t('cert.namePrompt'))}</span><input id="certName" required maxlength="60" value="${attr(nameVal)}"></label><button class="btn btn-primary" type="submit">${icon('award')}<span>${esc(t('cert.generate'))}</span></button></form>
      <div class="cert-preview" id="certPreview" hidden></div>
      <div class="row-end cert-actions" hidden><button type="button" class="btn" data-png>${icon('download')}<span>${esc(t('cert.downloadPng'))}</span></button><button type="button" class="btn btn-primary" data-print>${icon('printer')}<span>${esc(t('cert.print'))}</span></button></div>`,
    onMount: (m) => {
      let cert = existing || null;
      const show = () => {
        const prev = m.querySelector('#certPreview'); prev.hidden = false; prev.innerHTML = `<div class="cert-sheet">${certSVG(cert, p)}</div>`;
        m.querySelector('.cert-actions').hidden = false;
      };
      if (cert) show();
      m.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = m.querySelector('#certName').value.trim(); if (!name) return;
        store.setPref('name', name);
        const date = cert && cert.name === name ? cert.date : Date.now();
        cert = { path: p.id, name, date, score: pp.avg, code: 'LA-' + hashCode(`${name}|${p.id}|${date}|${pp.avg}`).slice(0, 4) + '-' + hashCode(`${date}|${name}`).slice(0, 4) };
        store.addCert(cert); show();
      });
      m.querySelector('[data-png]').addEventListener('click', () => downloadPNG(cert, p).catch(() => toast(t('cert.pngFail'), { tone: 'warn' })));
      m.querySelector('[data-print]').addEventListener('click', () => { document.body.classList.add('printing-cert'); window.print(); setTimeout(() => document.body.classList.remove('printing-cert'), 500); });
    }
  });
}
