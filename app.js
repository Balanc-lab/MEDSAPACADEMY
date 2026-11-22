// LogiAcademy – application bootstrap.
import { loadStrings, initLang, t } from './core/i18n.js';
import { store } from './core/store.js';
import { loadData } from './core/data.js';
import { route, startRouter, run } from './core/router.js';
import { initPWA } from './core/pwa.js';
import { esc } from './core/dom.js';
import { renderShell, setPage, applyTheme, closePalette } from './views/shell.js';
import dashboard from './views/dashboard.js';
import explorer from './views/explorer.js';
import transaction from './views/transaction.js';
import lifecycle from './views/lifecycle.js';
import stock from './views/stock.js';
import movements from './views/movements.js';
import errors from './views/errors.js';
import { learnHome, pathView, lessonView, quizView, scenariosView } from './views/learn.js';
import { meView, reportView } from './views/me.js';
import company from './views/company.js';
import { glossaryView, searchView, knowledgeView, aboutView, notFoundView } from './views/misc.js';

const app = document.getElementById('app');
let cleanup = null;
let lastPath = null;
let lastKey = '#/';

route('/', dashboard);
route('/tx', explorer);
route('/tx/:code', transaction);
route('/tx/:code/:tab', transaction);
route('/company', company);
route('/lifecycle', lifecycle);
route('/lifecycle/:n', lifecycle);
route('/stock', stock);
route('/stock/:id', stock);
route('/movements', movements);
route('/movements/:code', movements);
route('/errors', errors);
route('/learn', learnHome);
route('/learn/:path', pathView);
route('/lesson/:id', lessonView);
route('/quiz/:id', quizView);
route('/scenarios', scenariosView);
route('/glossary', glossaryView);
route('/search', searchView);
route('/knowledge', knowledgeView);
route('/about', aboutView);
route('/me', meView);
route('/me/:tab', meView);
route('/report', reportView);

// History position, to restore the scroll position when the user goes back or forward.
const scrollMem = new Map();
let histMax = 0; let histPos = 0;
function historyStep() {
  const st = history.state;
  if (st && typeof st.i === 'number') { const back = st.i !== histPos; histPos = st.i; histMax = Math.max(histMax, st.i); return back; }
  histPos = ++histMax;
  history.replaceState({ i: histPos }, '', location.href);
  return false;
}

function render(r) {
  if (lastPath !== null) scrollMem.set(lastKey, window.scrollY);
  const traversed = historyStep();
  const key = location.hash || '#/';
  closePalette();
  document.body.classList.remove('nav-open');
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore view cleanup errors */ } cleanup = null; }
  const view = r.view || notFoundView;
  const el = document.getElementById('view');
  let out;
  try { out = view.render(r); } catch (e) {
    out = { title: t('error.title'), crumbs: [], nav: '', html: `<div class="empty"><h1>${esc(t('error.title'))}</h1><p>${esc(t('error.body'))}</p><a class="btn btn-primary" href="#/">${esc(t('notfound.home'))}</a></div>` };
    console.warn(e);
  }
  setPage(out);
  el.innerHTML = out.html;
  el.dataset.view = view.name || '';
  const samePage = lastPath && lastPath.split('/').slice(0, 3).join('/') === r.path.split('/').slice(0, 3).join('/');
  if (!samePage) {
    const y = traversed ? scrollMem.get(key) : undefined;
    window.scrollTo(0, y || 0);
    if (lastPath !== null) { el.classList.remove('v-enter'); void el.offsetWidth; el.classList.add('v-enter'); }
  }
  if (lastPath !== null && !samePage) document.getElementById('main').focus({ preventScroll: true });
  lastPath = r.path; lastKey = key;
  if (view.mount) { try { cleanup = view.mount(el, r) || null; } catch (e) { console.warn(e); } }
}

function fatal(msg) {
  app.innerHTML = `<div class="fatal"><h1>LogiAcademy</h1><p>${esc(msg)}</p><button type="button" class="btn btn-primary">↻</button></div>`;
  app.querySelector('.fatal button').addEventListener('click', () => location.reload());
}

async function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const prefTheme = store.state.prefs.theme;
  applyTheme(prefTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  initLang();
  try { await loadStrings(); } catch (e) { fatal('Content could not be loaded. Check your connection and reload. / تعذّر تحميل المحتوى.'); return; }
  renderShell(app);
  document.getElementById('view').innerHTML = `<div class="loading" role="status"><span class="spinner"></span><span>${esc(t('app.loading'))}</span></div>`;
  try { await loadData(); } catch (e) { document.getElementById('view').innerHTML = `<div class="empty"><p>${esc(t('error.data'))}</p></div>`; return; }
  store.touchDay();
  startRouter(render);
  initPWA();
  window.addEventListener('la:lang', () => { renderShell(app); lastPath = null; run(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!store.state.prefs.theme) applyTheme(e.matches ? 'dark' : 'light'); });
}
boot();
