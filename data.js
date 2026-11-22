// Loads the JSON knowledge base, builds lookup maps and the trilingual search index.
import { L, LANGS, getLang } from './i18n.js';
import { setLinker, esc } from './dom.js';
import { unlockRemembered, unlockWithCode, forget } from './secure.js';

export const data = {
  ready: false, catalog: null,
  tx: [], txMap: new Map(),
  mvts: [], mvtMap: new Map(), mvtNote: null,
  stock: null, statusMap: new Map(),
  lifecycle: null,
  paths: [], lessons: [], lessonMap: new Map(), scenarios: [], passScore: 70,
  glossary: [], tables: {}, errors: [], modules: [], moduleMap: new Map(), areas: [], areaMap: new Map(),
  systems: [], systemMap: new Map(), levels: [], accounts: {}, flowNodes: {},
  screens: {}, annotations: [], index: [],
  company: { available: false, unlocked: false, codes: new Set() }
};

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(url + ' ' + res.status);
  return res.json();
}

export async function loadData() {
  const cat = await getJSON('data/catalog.json');
  data.catalog = cat;
  const single = ['movementTypes', 'stockStatuses', 'lifecycle', 'glossary', 'tables', 'errors', 'modules', 'screens', 'annotations'];
  const jobs = [
    ...cat.transactions.map((u) => getJSON(u).then((d) => ({ k: 'tx', d })).catch(() => null)),
    ...cat.learning.map((u) => getJSON(u).then((d) => ({ k: 'learning', d })).catch(() => null)),
    ...single.map((k) => getJSON(cat[k]).then((d) => ({ k, d })).catch(() => null))
  ];
  const results = (await Promise.all(jobs)).filter(Boolean);
  for (const { k, d } of results) {
    if (k === 'tx') data.tx.push(...d.transactions);
    else if (k === 'learning') {
      if (d.paths) { data.paths = d.paths; data.passScore = d.passScore || 70; data.scenarios = d.scenarios || []; }
      if (d.lessons) data.lessons.push(...d.lessons);
    } else if (k === 'movementTypes') { data.mvts = d.movementTypes; data.mvtNote = d.note; }
    else if (k === 'stockStatuses') data.stock = d;
    else if (k === 'lifecycle') data.lifecycle = d;
    else if (k === 'glossary') data.glossary = d.terms;
    else if (k === 'tables') data.tables = d.tables;
    else if (k === 'errors') data.generalErrors = d.errors;
    else if (k === 'modules') Object.assign(data, { modules: d.modules, areas: d.areas, systems: d.systems, levels: d.levels, accounts: d.accounts, flowNodes: d.flowNodes, org: d.org });
    else if (k === 'screens') data.screens = d;
    else if (k === 'annotations') data.annotations = d.annotations || [];
  }
  data.company.available = !!cat.secure;
  if (cat.secure) {
    const bundle = await unlockRemembered(cat.secure).catch(() => null);
    if (bundle) addCompany(bundle);
  }
  finalize();
  data.ready = true;
  return data;
}

const modOrder = ['MM', 'WM', 'LE', 'EWM', 'QM', 'PP', 'SD', 'BC'];
function finalize() {
  data.tx.sort((a, b) => (modOrder.indexOf(a.module) - modOrder.indexOf(b.module)) || 0);
  data.txMap.clear(); data.mvtMap.clear(); data.statusMap.clear(); data.moduleMap.clear(); data.areaMap.clear(); data.systemMap.clear(); data.lessonMap.clear();
  data.tx.forEach((t) => data.txMap.set(t.code, t));
  data.mvts.forEach((m) => data.mvtMap.set(m.code, m));
  (data.stock?.statuses || []).forEach((s) => data.statusMap.set(s.id, s));
  data.modules.forEach((m) => data.moduleMap.set(m.id, m));
  data.areas.forEach((a) => data.areaMap.set(a.id, a));
  data.systems.forEach((s) => data.systemMap.set(s.id, s));
  const order = data.paths.flatMap((p) => p.lessons);
  data.lessons.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  data.lessons.forEach((l) => data.lessonMap.set(l.id, l));
  data.errors = [];
  data.tx.forEach((t) => (t.errors || []).forEach((e, i) => data.errors.push({ ...e, module: t.module, tx: [t.code], key: `${t.code}-${i}` })));
  (data.generalErrors || []).forEach((e, i) => data.errors.push({ ...e, key: `gen-${i}` }));
  buildIndex();
  setLinker((tok) => (data.txMap.has(tok) ? `<a class="tc-link" href="${txHref(tok)}" dir="ltr">${esc(tok)}</a>` : null));
}

function addCompany(bundle) {
  for (const t of bundle.transactions || []) {
    if (data.company.codes.has(t.code)) continue;
    data.company.codes.add(t.code);
    data.tx.push(t);
  }
  Object.assign(data.screens, bundle.screens || {});
  data.company.unlocked = true;
}

// Unlocks the company-specific section with the access code. Throws err.wrong for a wrong code.
export async function unlockCompany(code, remember) {
  const bundle = await unlockWithCode(data.catalog.secure, code, remember);
  addCompany(bundle);
  finalize();
  window.dispatchEvent(new CustomEvent('la:company'));
}

export function lockCompany() {
  forget();
  data.tx = data.tx.filter((t) => !data.company.codes.has(t.code));
  data.company.codes.forEach((c) => { delete data.screens[c]; });
  data.company.codes.clear();
  data.company.unlocked = false;
  finalize();
  window.dispatchEvent(new CustomEvent('la:company'));
}

export const txHref = (code, tab) => '#/tx/' + encodeURIComponent(code) + (tab ? '/' + tab : '');
export const getTx = (code) => data.txMap.get(code);
export const getMvt = (code) => data.mvtMap.get(code);
export const getStatus = (id) => data.statusMap.get(id);
export const screenFile = (code) => code.replace(/^\//, '').replace(/\//g, '-').toLowerCase();

// ---------- search ----------
export function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟـ]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export const codeKey = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const all3 = (o) => (o ? LANGS.map((l) => (Array.isArray(o[l]) ? o[l].join(' ') : o[l] || '')).join(' ') : '');

function buildIndex() {
  const idx = [];
  for (const t of data.tx) {
    idx.push({ type: 'tx', id: t.code, code: t.code, ck: codeKey(t.code), title: t.name, sub: t.summary, module: t.module, areas: t.areas, route: txHref(t.code),
      words: norm([all3(t.name), (t.fiori || []).map((f) => f.id + ' ' + f.n).join(' ')].join(' ')),
      hay: norm([t.code, all3(t.name), all3(t.keywords), all3(t.summary), t.module, (t.tables || []).join(' '), (t.mvts || []).join(' ')].join(' ')) });
  }
  for (const m of data.mvts) {
    idx.push({ type: 'mvt', id: m.code, code: m.code, ck: m.code, title: m.name, sub: m.desc, route: '#/movements/' + m.code, words: norm(all3(m.name)), hay: norm([m.code, all3(m.name), all3(m.desc), all3(m.use)].join(' ')) });
  }
  for (const s of data.stock?.statuses || []) {
    idx.push({ type: 'status', id: s.id, title: s.name, sub: s.definition, route: '#/stock/' + s.id, words: norm(all3(s.name)), hay: norm([all3(s.name), all3(s.definition)].join(' ')) });
  }
  for (const st of data.lifecycle?.stages || []) {
    idx.push({ type: 'stage', id: String(st.n), title: st.name, sub: st.tagline, route: '#/lifecycle/' + st.n, words: norm(all3(st.name)), hay: norm([all3(st.name), all3(st.tagline), st.tx.join(' ')].join(' ')) });
  }
  for (const e of data.errors) {
    idx.push({ type: 'error', id: e.key, code: e.id || '', ck: e.id ? codeKey(e.id) : '', title: { ar: e.msg, en: e.msg, fr: e.msg }, sub: e.c, module: e.module, route: '#/errors?e=' + encodeURIComponent(e.key), words: norm(e.msg), hay: norm([e.id || '', e.msg, all3(e.c), all3(e.s), (e.tx || []).join(' ')].join(' ')) });
  }
  for (const l of data.lessons) {
    idx.push({ type: 'lesson', id: l.id, title: l.title, sub: l.summary, route: '#/lesson/' + l.id, words: norm(all3(l.title)), hay: norm([all3(l.title), all3(l.summary), (l.tx || []).join(' ')].join(' ')) });
  }
  for (const sc of data.scenarios) {
    idx.push({ type: 'scenario', id: sc.id, title: sc.title, sub: sc.context, route: '#/scenarios?s=' + sc.id, words: norm(all3(sc.title)), hay: norm([all3(sc.title), all3(sc.context)].join(' ')) });
  }
  data.glossary.forEach((g, i) => {
    idx.push({ type: 'term', id: String(i), title: { ar: g.ar, en: g.en, fr: g.fr }, sub: g.d, route: '#/glossary?t=' + i, words: norm([g.ar, g.en, g.fr].join(' ')), hay: norm([g.ar, g.en, g.fr, all3(g.d)].join(' ')) });
  });
  data.index = idx;
}

const TYPE_W = { tx: 40, mvt: 30, status: 25, stage: 20, error: 10, lesson: 15, scenario: 5, term: 12 };
export function search(q, { limit = 40, types = null, filter = null } = {}) {
  const qn = norm(q);
  const qk = codeKey(q);
  if (!qn && !qk) return [];
  const tokens = qn.split(' ').filter(Boolean);
  const res = [];
  for (const e of data.index) {
    if (types && !types.includes(e.type)) continue;
    if (filter && !filter(e)) continue;
    let score = 0;
    if (e.ck && qk) {
      if (e.ck === qk) score += 1000;
      else if (e.ck.startsWith(qk) && qk.length >= 2) score += 700 - (e.ck.length - qk.length) * 10;
      else if (qk.length >= 3 && e.ck.includes(qk)) score += 300;
    }
    let all = true;
    for (const tk of tokens) {
      const inWords = (' ' + e.words).includes(' ' + tk);
      if (inWords) score += 120;
      else if (e.hay.includes(tk)) score += 45;
      else if (!(e.ck && qk && e.ck.includes(qk))) { all = false; break; }
    }
    if (!all && score < 300) continue;
    if (score <= 0) continue;
    score += TYPE_W[e.type] || 0;
    res.push({ e, score });
  }
  res.sort((a, b) => b.score - a.score);
  return res.slice(0, limit).map((r) => r.e);
}
export function titleOf(e) { return L(e.title); }
export function lessonProgress(store) {
  const done = data.lessons.filter((l) => store.lessonDone(l.id)).length;
  return { done, total: data.lessons.length, pct: data.lessons.length ? Math.round((done / data.lessons.length) * 100) : 0 };
}
export function pathProgress(store, p) {
  const lessons = p.lessons.map((id) => data.lessonMap.get(id)).filter(Boolean);
  const done = lessons.filter((l) => store.lessonDone(l.id)).length;
  const passed = lessons.filter((l) => { const q = store.quiz(l.id); return q && q.best >= data.passScore; }).length;
  const total = lessons.length;
  const pct = total ? Math.round(((done + passed) / (2 * total)) * 100) : 0;
  const scores = lessons.map((l) => (store.quiz(l.id) || {}).best || 0);
  const avg = total ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
  return { done, passed, total, pct, complete: total > 0 && done === total && passed === total, avg };
}
export const currentLangName = () => getLang();
