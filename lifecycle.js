import { t, L, LL } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich, delegate } from '../core/dom.js';
import { data, getStatus } from '../core/data.js';
import { setHashSilently } from '../core/router.js';
import { txChip, mvtChip } from './common.js';

function stockImpact(st) {
  if (!st.stock.length) return `<p class="muted small">${esc(t('lifecycle.noStock'))}</p>`;
  return `<div class="impact">${st.stock.map((x) => { const s = getStatus(x.s); return `<span class="impact-chip tone-${s?.color || 'slate'}"><b dir="ltr">${esc(x.d)}</b>${esc(L(s?.name))}</span>`; }).join('')}</div>`;
}
function detail(st) {
  return `<header class="lc-head">
      <span class="lc-head-n">${esc(t('lifecycle.stage', { n: st.n }))}</span>
      <h2 class="lc-head-title">${icon(st.icon)}<span>${esc(L(st.name))}</span></h2>
      <p class="lc-tagline">${esc(L(st.tagline))}</p>
    </header>
    <p class="lc-overview">${rich(L(st.overview))}</p>
    <div class="lc-facts">
      <div><h3 class="h-side">${esc(t('lifecycle.tx'))}</h3><div class="chip-row">${st.tx.map((c) => txChip(c, { withName: true })).join('')}</div></div>
      <div><h3 class="h-side">${esc(t('lifecycle.mvts'))}</h3><div class="chip-row">${st.mvts.map(mvtChip).join('')}</div></div>
      <div><h3 class="h-side">${esc(t('lifecycle.stock'))}</h3>${stockImpact(st)}</div>
    </div>
    <div class="lc-cols">
      <section class="lc-topics"><h3 class="h-sec">${esc(t('lifecycle.topics'))}</h3>
        ${st.topics.map((tp, i) => `<details class="acc"${i === 0 ? ' open' : ''}><summary>${esc(L(tp.t))}</summary><p>${rich(L(tp.d))}</p></details>`).join('')}
      </section>
      <section><h3 class="h-sec">${esc(t('lifecycle.docs'))}</h3>
        <ol class="doc-chain">${st.docs.map((d) => `<li>${icon('file-text')}<span>${esc(L(d))}</span></li>`).join('')}</ol>
        <div class="compare">
          <div class="compare-col"><h4>${icon('warehouse')}<span>${esc(t('lifecycle.classic'))}</span></h4><p>${rich(L(st.classic))}</p></div>
          <div class="compare-col"><h4>${icon('forklift')}<span>${esc(t('lifecycle.ewm'))}</span></h4><p>${rich(L(st.ewm))}</p></div>
        </div>
        <div class="callout callout-ledger"><h4>${icon('scale')}<span>${esc(t('lifecycle.accounting'))}</span></h4><p>${rich(L(st.accounting))}</p></div>
      </section>
    </div>`;
}

export default {
  name: 'lifecycle',
  render({ params }) {
    const stages = data.lifecycle?.stages || [];
    const n = Math.min(stages.length, Math.max(1, Number(params.n) || 1));
    const st = stages[n - 1];
    const html = `<header class="page-head"><h1 class="page-title">${esc(t('lifecycle.title'))}</h1><p class="page-sub">${esc(L(data.lifecycle?.intro))}</p></header>
    <div class="lc-controls">
      <button type="button" class="icon-btn" data-lc="prev" aria-label="${attr(t('common.prev'))}">${icon(document.dir === 'rtl' ? 'chevron-right' : 'chevron-left')}</button>
      <button type="button" class="btn btn-primary" data-lc="play" aria-pressed="false">${icon('play')}<span>${esc(t('lifecycle.play'))}</span></button>
      <button type="button" class="icon-btn" data-lc="next" aria-label="${attr(t('common.next'))}">${icon(document.dir === 'rtl' ? 'chevron-left' : 'chevron-right')}</button>
      <span class="lc-count" aria-live="polite">${esc(t('common.of', { a: n, b: stages.length }))}</span>
    </div>
    <ol class="lc-track" role="tablist" aria-label="${attr(t('lifecycle.title'))}">${stages.map((s) => `<li role="presentation" class="lc-node${s.n === n ? ' active' : ''}${s.n < n ? ' passed' : ''}">
      <button type="button" role="tab" aria-selected="${s.n === n}" data-stage="${s.n}" id="lct-${s.n}" aria-controls="lcDetail">
        <span class="lc-dot"><span class="lc-n">${s.n}</span>${icon(s.icon)}</span>
        <span class="lc-name">${esc(L(s.name))}</span>
        <span class="lc-tx" dir="ltr">${esc(s.tx.slice(0, 3).join('  '))}</span>
      </button></li>`).join('')}</ol>
    <section class="lc-detail" id="lcDetail" role="tabpanel" aria-labelledby="lct-${n}">${st ? detail(st) : ''}</section>`;
    return { title: t('lifecycle.title'), crumbs: [{ label: t('nav.lifecycle') }], nav: 'lifecycle', html };
  },
  mount(root, r) {
    const stages = data.lifecycle?.stages || [];
    let n = Math.min(stages.length, Math.max(1, Number(r.params.n) || 1));
    let timer = null;
    const playBtn = root.querySelector('[data-lc="play"]');
    const go = (k, { fromPlay = false } = {}) => {
      n = Math.min(stages.length, Math.max(1, k));
      root.querySelectorAll('.lc-node').forEach((li, i) => { li.classList.toggle('active', i + 1 === n); li.classList.toggle('passed', i + 1 < n); li.querySelector('[role="tab"]').setAttribute('aria-selected', String(i + 1 === n)); });
      const d = root.querySelector('#lcDetail');
      d.classList.remove('swap'); void d.offsetWidth; d.classList.add('swap');
      d.innerHTML = detail(stages[n - 1]);
      d.setAttribute('aria-labelledby', 'lct-' + n);
      root.querySelector('.lc-count').textContent = t('common.of', { a: n, b: stages.length });
      setHashSilently('#/lifecycle/' + n);
      const node = root.querySelector(`#lct-${n}`);
      if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      if (!fromPlay) stop();
    };
    const stop = () => { clearInterval(timer); timer = null; playBtn.setAttribute('aria-pressed', 'false'); playBtn.innerHTML = `${icon('play')}<span>${esc(t('lifecycle.play'))}</span>`; };
    const play = () => {
      if (timer) { stop(); return; }
      if (n >= stages.length) go(1, { fromPlay: true });
      playBtn.setAttribute('aria-pressed', 'true'); playBtn.innerHTML = `${icon('pause')}<span>${esc(t('lifecycle.pause'))}</span>`;
      timer = setInterval(() => { if (n >= stages.length) { stop(); return; } go(n + 1, { fromPlay: true }); }, 4500);
    };
    const offs = [
      delegate(root, 'click', '[data-stage]', (e, el) => go(Number(el.dataset.stage))),
      delegate(root, 'click', '[data-lc]', (e, el) => { const a = el.dataset.lc; if (a === 'prev') go(n - 1); else if (a === 'next') go(n + 1); else play(); })
    ];
    const track = root.querySelector('.lc-track');
    track.addEventListener('keydown', (e) => {
      const rtl = document.dir === 'rtl';
      if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { e.preventDefault(); go(n + 1); root.querySelector(`#lct-${n}`).focus(); }
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); go(n - 1); root.querySelector(`#lct-${n}`).focus(); }
    });
    return () => { offs.forEach((f) => f()); clearInterval(timer); };
  }
};
export { LL };
