// Validates the JSON content: language completeness, list parity and cross-references.
// Usage: node tools/validate-data.mjs   (exit code 1 when errors are found)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const LANGS = ['ar', 'en', 'fr'];
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function tri(o, ctx, parity = true) {
  if (!o || typeof o !== 'object') return err(`${ctx}: missing trilingual value`);
  for (const l of LANGS) {
    const v = o[l];
    if (Array.isArray(v)) { if (!v.length || v.some((x) => typeof x !== 'string' || !x.trim())) err(`${ctx}.${l}: empty list item`); }
    else if (typeof v !== 'string' || !v.trim()) err(`${ctx}.${l}: empty`);
  }
  if (parity && Array.isArray(o.ar) && LANGS.some((l) => (o[l] || []).length !== o.ar.length)) err(`${ctx}: list lengths differ between languages`);
}

const catalog = read('data/catalog.json');
const txFiles = catalog.transactions || [];
const tables = read('data/tables.json').tables;
const mvts = read('data/movement-types.json').movementTypes;
const mvtSet = new Set(mvts.map((m) => m.code));
const screens = read('data/screens.json');
const tx = [];
for (const f of txFiles) {
  const file = typeof f === 'string' ? f : f.file;
  const d = read(path.join('data', file.replace(/^data\//, '')));
  tx.push(...d.transactions);
}
// Company-specific content (built outside the site, see build-secure.mjs) is validated when LOGI_PRIVATE is set.
const publicSet = new Set(tx.map((t) => t.code));
const PRIV = process.env.LOGI_PRIVATE;
if (PRIV) {
  const pread = (p) => JSON.parse(fs.readFileSync(path.join(PRIV, 'build', p), 'utf8'));
  tx.push(...pread('custom.json').transactions);
  Object.assign(screens, pread('screens.json'));
}
const txSet = new Set(tx.map((t) => t.code));
for (const t of tx) if (publicSet.has(t.code)) (t.related || []).forEach((r) => { if (!publicSet.has(r)) err(`${t.code}: public transaction links to company-specific ${r}`); });
if (txSet.size !== tx.length) err('Duplicate transaction codes');

for (const t of tx) {
  const c = t.code;
  ['name', 'summary', 'purpose', 'scenario', 'whenToUse', 'prerequisites', 'results', 'troubleshooting', 'example', 'availability'].forEach((k) => tri(t[k], `${c}.${k}`));
  tri(t.keywords, `${c}.keywords`, false);
  if (!t.steps?.length) err(`${c}: no steps`);
  const geo = screens[c];
  if (!geo) err(`${c}: no simulated screen`);
  (t.steps || []).forEach((s, i) => { tri(s.t, `${c}.steps[${i}].t`); tri(s.d, `${c}.steps[${i}].d`); if (geo && !geo.fields[s.f]) err(`${c}: step ${i + 1} key "${s.f}" not on any screen`); });
  (t.fields || []).forEach((f, i) => tri(f.d, `${c}.fields[${i}]`));
  (t.errors || []).forEach((e, i) => { tri(e.c, `${c}.errors[${i}].c`); tri(e.s, `${c}.errors[${i}].s`); });
  (t.exercises || []).forEach((e, i) => { tri(e.t, `${c}.exercises[${i}].t`); tri(e.s, `${c}.exercises[${i}].s`); });
  (t.related || []).forEach((r) => { if (!txSet.has(r)) err(`${c}: related ${r} not in database`); });
  (t.mvts || []).forEach((m) => { if (!mvtSet.has(m)) err(`${c}: movement type ${m} not in library`); });
  (t.tables || []).forEach((tb) => { if (!tables[tb]) err(`${c}: table ${tb} not described`); });
  if (!t.tables?.length) warn(`${c}: no tables listed`);
}

for (const m of mvts) {
  ['name', 'desc', 'use', 'dc', 'acc', 'scenario'].forEach((k) => tri(m[k], `mvt ${m.code}.${k}`));
  if (m.reversal && !mvtSet.has(m.reversal)) warn(`mvt ${m.code}: reversal ${m.reversal} missing`);
  if (m.reverses && !mvtSet.has(m.reverses)) err(`mvt ${m.code}: reverses ${m.reverses} missing`);
  (m.tx || []).forEach((x) => { if (!txSet.has(x)) warn(`mvt ${m.code}: transaction ${x} not in database (shown as plain chip)`); });
}

const paths = read('data/learning/paths.json');
const lessons = [];
for (const f of ['beginner', 'intermediate', 'advanced']) lessons.push(...read(`data/learning/${f}.json`).lessons);
const lessonIds = new Set(lessons.map((l) => l.id));
for (const p of paths.paths) for (const id of p.lessons) if (!lessonIds.has(id)) err(`path ${p.id}: lesson ${id} missing`);
for (const l of lessons) {
  ['title', 'summary', 'objectives', 'takeaways'].forEach((k) => tri(l[k], `lesson ${l.id}.${k}`));
  l.sections.forEach((s, i) => { tri(s.h, `lesson ${l.id}.sections[${i}].h`); tri(s.p, `lesson ${l.id}.sections[${i}].p`); });
  (l.tx || []).forEach((x) => { if (!txSet.has(x)) err(`lesson ${l.id}: transaction ${x} not in database`); });
  (l.mvts || []).forEach((x) => { if (!mvtSet.has(x)) err(`lesson ${l.id}: movement ${x} not in library`); });
  if (l.quiz.length < 4) err(`lesson ${l.id}: fewer than 4 questions`);
  l.quiz.forEach((q, i) => { tri(q.q, `lesson ${l.id}.quiz[${i}]`); tri(q.e, `lesson ${l.id}.quiz[${i}].e`); q.o.forEach((o, j) => tri(o, `lesson ${l.id}.quiz[${i}].o[${j}]`)); if (!(q.a >= 0 && q.a < q.o.length)) err(`lesson ${l.id}: quiz ${i} answer out of range`); });
}

const life = read('data/lifecycle.json');
for (const s of life.stages) (s.tx || []).forEach((x) => { const code = typeof x === 'string' ? x : x.code; if (code && !txSet.has(code)) warn(`lifecycle ${s.id}: ${code} not in database (shown as plain chip)`); });

console.log(`Transactions: ${tx.length} · Movement types: ${mvts.length} · Lessons: ${lessons.length} · Tables: ${Object.keys(tables).length}`);
warnings.forEach((w) => console.log('warn  ' + w));
errors.forEach((e) => console.log('ERROR ' + e));
console.log(errors.length ? `${errors.length} error(s)` : 'OK: no errors');
process.exit(errors.length ? 1 : 0);
