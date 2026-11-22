// Local learner state (progress, favorites, notes, preferences) persisted in localStorage.
const KEY = 'la:v1';
const DEFAULT = () => ({
  v: 1,
  prefs: { lang: null, theme: null, name: '', focus: null, showAll: true },
  recent: [], favorites: [], bookmarks: [], notes: {}, searches: [],
  learned: {}, viewed: {}, lessons: {}, quizzes: {}, exercises: {}, days: [], certs: []
});

let state = load();
const listeners = new Set();

function safeStorage() {
  try { const k = '__la_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; }
}
const ls = safeStorage();

function load() {
  try {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(KEY);
    if (!raw) return DEFAULT();
    const s = JSON.parse(raw);
    return Object.assign(DEFAULT(), s, { prefs: Object.assign(DEFAULT().prefs, s.prefs || {}) });
  } catch (e) { return DEFAULT(); }
}
function persist() {
  if (!ls) return;
  try { ls.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota or private mode: keep in memory */ }
}
function emit(change) { listeners.forEach((fn) => { try { fn(state, change); } catch (e) { /* listener errors must not break state */ } }); }
const today = () => new Date().toISOString().slice(0, 10);

export const store = {
  get state() { return state; },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  update(mut, change = 'state') { mut(state); persist(); emit(change); },
  replace(next) { state = Object.assign(DEFAULT(), next, { prefs: Object.assign(DEFAULT().prefs, next.prefs || {}) }); persist(); emit('all'); },
  reset() { const prefs = { ...state.prefs }; state = DEFAULT(); state.prefs = prefs; persist(); emit('all'); },
  setPref(k, v) { this.update((s) => { s.prefs[k] = v; }, 'prefs'); },

  touchDay() {
    const d = today();
    if (state.days[state.days.length - 1] === d) return;
    this.update((s) => { if (!s.days.includes(d)) s.days.push(d); if (s.days.length > 400) s.days = s.days.slice(-400); }, 'days');
  },
  streak() {
    const set = new Set(state.days);
    let n = 0; const dt = new Date();
    if (!set.has(dt.toISOString().slice(0, 10))) dt.setDate(dt.getDate() - 1);
    while (set.has(dt.toISOString().slice(0, 10))) { n++; dt.setDate(dt.getDate() - 1); }
    return n;
  },

  visitTx(code) {
    this.update((s) => {
      s.recent = [code, ...s.recent.filter((c) => c !== code)].slice(0, 12);
      s.viewed[code] = (s.viewed[code] || 0) + 1;
    }, 'recent');
  },
  isFav: (code) => state.favorites.includes(code),
  toggleFav(code) {
    let added = false;
    this.update((s) => { if (s.favorites.includes(code)) s.favorites = s.favorites.filter((c) => c !== code); else { s.favorites.unshift(code); added = true; } }, 'favorites');
    return added;
  },
  isBookmarked: (type, id) => state.bookmarks.some((b) => b.type === type && b.id === id),
  toggleBookmark(type, id) {
    let added = false;
    this.update((s) => {
      const i = s.bookmarks.findIndex((b) => b.type === type && b.id === id);
      if (i >= 0) s.bookmarks.splice(i, 1); else { s.bookmarks.unshift({ type, id, ts: Date.now() }); added = true; }
    }, 'bookmarks');
    return added;
  },
  isLearned: (code) => !!state.learned[code],
  toggleLearned(code) {
    let on = false;
    this.update((s) => { if (s.learned[code]) delete s.learned[code]; else { s.learned[code] = Date.now(); on = true; } }, 'learned');
    return on;
  },
  note: (key) => (state.notes[key] && state.notes[key].text) || '',
  noteTs: (key) => (state.notes[key] && state.notes[key].ts) || 0,
  setNote(key, text) {
    this.update((s) => { if (text.trim()) s.notes[key] = { text, ts: Date.now() }; else delete s.notes[key]; }, 'notes');
  },
  addSearch(q) {
    q = String(q || '').trim();
    if (q.length < 2) return;
    this.update((s) => { s.searches = [q, ...s.searches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 15); }, 'searches');
  },
  clearHistory() { this.update((s) => { s.searches = []; s.recent = []; }, 'history'); },
  lessonDone: (id) => !!(state.lessons[id] && state.lessons[id].done),
  setLessonDone(id, done = true) { this.update((s) => { if (done) s.lessons[id] = { done: Date.now() }; else delete s.lessons[id]; }, 'lessons'); },
  quiz: (id) => state.quizzes[id] || null,
  recordQuiz(id, score, pass) {
    this.update((s) => {
      const q = s.quizzes[id] || { best: 0, attempts: 0 };
      q.attempts += 1; q.last = score; q.best = Math.max(q.best, score);
      if (score >= pass && !q.passedAt) q.passedAt = Date.now();
      s.quizzes[id] = q;
    }, 'quizzes');
  },
  exerciseDone: (key) => !!state.exercises[key],
  toggleExercise(key) { this.update((s) => { if (s.exercises[key]) delete s.exercises[key]; else s.exercises[key] = Date.now(); }, 'exercises'); },
  addCert(cert) { this.update((s) => { s.certs = [cert, ...s.certs.filter((c) => c.path !== cert.path)]; }, 'certs'); }
};
