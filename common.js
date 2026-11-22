// Small rendering helpers shared by several views.
import { t, L, LL } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, rich } from '../core/dom.js';
import { data, txHref, getMvt } from '../core/data.js';
import { store } from '../core/store.js';

export const modBadge = (m) => `<span class="badge mod-${esc(m)}" title="${attr(L(data.moduleMap.get(m)?.name))}">${esc(m)}</span>`;
export const levelBadge = (lv) => `<span class="lvl lvl-${lv}" title="${attr(t('tx.level'))}">${'<i></i>'.repeat(lv)}${'<i class="off"></i>'.repeat(3 - lv)}<span>${esc(L(data.levels.find((x) => x.id === lv)?.name))}</span></span>`;
export function sysBadges(list = []) {
  return list.map((id) => { const s = data.systemMap.get(id); return s ? `<span class="sys sys-${s.tone}" title="${attr(L(s.desc))}">${esc(s.label)}</span>` : ''; }).join('');
}
export function txChip(code, { withName = false } = {}) {
  const tx = data.txMap.get(code);
  if (!tx) return `<span class="chip chip-code chip-static" dir="ltr" title="${attr(t('tx.notInAcademy'))}">${esc(code)}</span>`;
  return `<a class="chip chip-code" href="${txHref(code)}"><bdi dir="ltr">${esc(code)}</bdi>${withName ? `<span class="chip-sub">${esc(L(tx.name))}</span>` : ''}</a>`;
}
export function mvtChip(code) {
  const m = getMvt(code);
  if (!m) return `<span class="chip chip-mvt chip-static" dir="ltr">${esc(code)}</span>`;
  return `<a class="chip chip-mvt" href="#/movements/${esc(code)}" title="${attr(L(m.name))}"><bdi dir="ltr">${esc(code)}</bdi><span class="chip-sub">${esc(L(m.name))}</span></a>`;
}
export const list = (arr, cls = '') => (arr && arr.length ? `<ul class="list ${cls}">${arr.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>` : '');
export const sectionTitle = (k, ic) => `<h2 class="sec-title">${ic ? icon(ic) : ''}<span>${esc(t(k))}</span></h2>`;
export function txCard(tx) {
  const fav = store.isFav(tx.code); const learned = store.isLearned(tx.code);
  return `<article class="txcard mod-edge-${esc(tx.module)}">
    <a class="txcard-link" href="${txHref(tx.code)}">
      <span class="tc txcard-code" dir="ltr">${esc(tx.code)}</span>
      <span class="txcard-name">${esc(L(tx.name))}</span>
      <span class="txcard-sum">${esc(L(tx.summary))}</span>
    </a>
    <div class="txcard-foot">${modBadge(tx.module)}${levelBadge(tx.level)}${learned ? `<span class="learned-dot" title="${attr(t('tx.learned.done'))}">${icon('circle-check')}</span>` : ''}
      <button type="button" class="icon-btn sm fav-btn${fav ? ' on' : ''}" data-fav="${attr(tx.code)}" aria-pressed="${fav}" aria-label="${attr(t(fav ? 'tx.fav.remove' : 'tx.fav.add'))}">${icon('star')}</button>
    </div>
  </article>`;
}
export function emptyState(msgKey, ic = 'search', vars, action = '') {
  return `<div class="empty">${icon(ic)}<p>${esc(t(msgKey, vars))}</p>${action}</div>`;
}
export function progressRing(pct, size = 64, label = '') {
  const r = (size - 8) / 2; const c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${attr(label || pct + '%')}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" dy="0.35em" text-anchor="middle" class="ring-txt">${pct}%</text></svg>`;
}
export const bar = (pct) => `<span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></span>`;
export { LL };
