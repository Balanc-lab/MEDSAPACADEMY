// Company-specific section: unlock with the access code, then list its transactions.
import { t } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr, toast } from '../core/dom.js';
import { data, unlockCompany, lockCompany, txHref } from '../core/data.js';
import { navigate, run } from '../core/router.js';
import { canDecrypt } from '../core/secure.js';
import { txCard, emptyState } from './common.js';

const companyTx = () => data.tx.filter((x) => data.company.codes.has(x.code));

function lockedHTML() {
  if (!canDecrypt()) return emptyState('company.unsupported', 'lock');
  return `<form class="panel unlock-card" id="unlockForm" novalidate>
    <div class="unlock-icon">${icon('lock')}</div>
    <h2 class="unlock-title">${esc(t('company.lockedTitle'))}</h2>
    <p class="muted">${esc(t('company.lockedBody'))}</p>
    <label class="field-label" for="accessCode">${esc(t('company.codeLabel'))}</label>
    <div class="code-row">
      <input id="accessCode" name="code" type="password" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr" required aria-describedby="codeMsg">
      <button type="button" class="icon-btn" data-reveal aria-label="${attr(t('company.show'))}" aria-pressed="false">${icon('eye')}</button>
    </div>
    <p id="codeMsg" class="field-msg" aria-live="polite"></p>
    <label class="check"><input type="checkbox" id="rememberCode" checked><span>${esc(t('company.remember'))}</span></label>
    <button type="submit" class="btn btn-primary unlock-btn">${icon('lock-open')}<span>${esc(t('company.unlock'))}</span></button>
  </form>`;
}

function unlockedHTML() {
  const list = companyTx();
  return `<div class="panel company-bar">
      <p>${icon('lock-open')}<span>${esc(t('company.unlockedNote', { n: list.length }))}</span></p>
      <button type="button" class="btn btn-quiet" data-lock>${icon('lock')}<span>${esc(t('company.lock'))}</span></button>
    </div>
    <div class="tx-grid">${list.map(txCard).join('')}</div>`;
}

export default {
  name: 'company',
  render() {
    const html = !data.company.available
      ? emptyState('company.none', 'lock', null, `<a class="btn btn-primary" href="#/tx">${esc(t('nav.tx'))}</a>`)
      : `<header class="page-head"><h1 class="page-title">${esc(t('company.title'))}</h1><p class="page-sub">${esc(t('company.sub'))}</p></header>
        ${data.company.unlocked ? unlockedHTML() : lockedHTML()}`;
    return { title: t('company.title'), crumbs: [{ label: t('nav.company') }], nav: 'company', html };
  },
  mount(root, r) {
    const form = root.querySelector('#unlockForm');
    if (form) {
      const input = form.querySelector('#accessCode');
      const msg = form.querySelector('#codeMsg');
      const btn = form.querySelector('.unlock-btn');
      if (window.matchMedia('(hover: hover)').matches) input.focus();
      form.querySelector('[data-reveal]').addEventListener('click', (e) => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        e.currentTarget.setAttribute('aria-pressed', String(show));
        e.currentTarget.innerHTML = icon(show ? 'eye-off' : 'eye');
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = input.value.trim();
        if (!code) { msg.textContent = t('company.empty'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
        btn.disabled = true; btn.classList.add('busy'); msg.textContent = t('company.checking'); msg.classList.remove('err');
        try {
          await unlockCompany(code, form.querySelector('#rememberCode').checked);
          toast(t('company.unlocked'));
          const next = r.query.next;
          if (next && data.txMap.has(next)) navigate(txHref(next)); else run();
        } catch (err) {
          btn.disabled = false; btn.classList.remove('busy');
          msg.textContent = t(err.wrong ? 'company.wrong' : 'company.failed');
          msg.classList.add('err');
          input.setAttribute('aria-invalid', 'true');
          input.select();
        }
      });
      input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); msg.textContent = ''; msg.classList.remove('err'); });
    }
    const lockBtn = root.querySelector('[data-lock]');
    if (lockBtn) lockBtn.addEventListener('click', () => { lockCompany(); toast(t('company.locked')); run(); });
  }
};
