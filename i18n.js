// UI strings and helpers for trilingual content (Arabic primary, English, French).
import { store } from './store.js';

export const LANGS = ['ar', 'en', 'fr'];
let strings = { ar: {}, en: {}, fr: {} };
let lang = 'ar';

export async function loadStrings() {
  const res = await fetch('data/i18n/ui.json');
  if (!res.ok) throw new Error('ui strings ' + res.status);
  strings = await res.json();
}
export function initLang() {
  const pref = store.state.prefs.lang;
  lang = LANGS.includes(pref) ? pref : 'ar';
  applyDir();
  return lang;
}
export function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  store.setPref('lang', l);
  applyDir();
}
function applyDir() {
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
export const getLang = () => lang;
export const isRTL = () => lang === 'ar';

function pluralKey(key, n) {
  if (typeof n !== 'number') return key;
  const tbl = strings[lang] || {};
  if (n === 1 && tbl[key + '#one']) return key + '#one';
  if (lang === 'ar') {
    if (n === 2 && tbl[key + '#two']) return key + '#two';
    const m = n % 100;
    if (m >= 3 && m <= 10 && tbl[key + '#few']) return key + '#few';
  }
  return key;
}
export function t(key, vars) {
  if (vars && typeof vars.n === 'number') key = pluralKey(key, vars.n);
  let s = (strings[lang] && strings[lang][key]) ?? (strings.en && strings.en[key.split('#')[0]]) ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return s;
}
// Pick the current-language value of a trilingual object, with graceful fallback.
export function L(obj, l = lang) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[l] ?? obj.en ?? obj.ar ?? obj.fr ?? '';
}
export function LL(obj, l = lang) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return obj[l] || obj.en || obj.ar || [];
}
const numLocale = () => (lang === 'ar' ? 'ar-MA-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-GB');
export function fmtNum(n, digits = 0) {
  try { return new Intl.NumberFormat(numLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n); } catch (e) { return String(n); }
}
export function fmtDate(ts, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  try { return new Intl.DateTimeFormat(numLocale(), opts).format(new Date(ts)); } catch (e) { return new Date(ts).toISOString().slice(0, 10); }
}
export function fmtTime(ts) { return fmtDate(ts, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }); }
