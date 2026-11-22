// Screenshot Annotation Studio (administration tool, not linked from learner navigation).
// Everything runs in the browser: projects are kept in IndexedDB on this device only.
import { loadStrings, initLang, setLang, getLang, LANGS } from '../core/i18n.js';
import { store } from '../core/store.js';
import { esc, attr, toast, openModal, confirmDialog, copyText, downloadBlob } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { createViewer, annotationModel } from '../views/viewer.js';

// ---------------------------------------------------------------- strings
const S = {
  title: ['استوديو تعليق لقطات الشاشة', 'Screenshot Annotation Studio', "Studio d'annotation des captures"],
  back: ['العودة إلى المنصة', 'Back to the platform', 'Retour à la plateforme'],
  gateTitle: ['دخول الاستوديو', 'Studio access', 'Accès au studio'],
  gateSet: ['اختر رمز PIN للاستوديو على هذا الجهاز (4 أرقام على الأقل).', 'Choose a studio PIN for this device (at least 4 digits).', 'Choisissez un code PIN pour cet appareil (4 chiffres minimum).'],
  gateEnter: ['أدخل رمز PIN للاستوديو.', 'Enter the studio PIN.', 'Saisissez le code PIN du studio.'],
  gateNote: ['هذا الرمز يخفي أدوات الإدارة على هذا الجهاز فقط. إنه حماية من جهة المتصفح وليس مصادقة آمنة: أي شخص يصل إلى ملفات الموقع المنشور يستطيع قراءتها. لا تضع في المشاريع بيانات سرية.', 'This PIN only hides the admin tools on this device. It is browser-side protection, not secure authentication: anyone who can reach the published site files can read them. Do not put confidential data in projects.', "Ce code masque seulement les outils d'administration sur cet appareil. C'est une protection côté navigateur, pas une authentification sécurisée : toute personne ayant accès aux fichiers publiés peut les lire. N'y mettez aucune donnée confidentielle."],
  pin: ['رمز PIN', 'PIN', 'Code PIN'], pin2: ['تأكيد الرمز', 'Confirm PIN', 'Confirmer le code'],
  unlock: ['فتح', 'Unlock', 'Déverrouiller'], setPin: ['حفظ الرمز والدخول', 'Save PIN and enter', 'Enregistrer et entrer'],
  pinShort: ['الرمز قصير جدًا.', 'The PIN is too short.', 'Code trop court.'], pinMismatch: ['الرمزان غير متطابقين.', 'The PINs do not match.', 'Les codes ne correspondent pas.'], pinWrong: ['رمز غير صحيح.', 'Wrong PIN.', 'Code incorrect.'],
  lock: ['قفل', 'Lock', 'Verrouiller'],
  newP: ['جديد', 'New', 'Nouveau'], open: ['فتح مشروع', 'Open', 'Ouvrir'], save: ['حفظ', 'Save', 'Enregistrer'],
  importJ: ['استيراد JSON', 'Import JSON', 'Importer JSON'], exportJ: ['تصدير JSON', 'Export JSON', 'Exporter JSON'], exportH: ['تصدير HTML', 'Export HTML', 'Exporter HTML'], exportP: ['تنزيل الصورة', 'Download image', "Télécharger l'image"],
  preview: ['معاينة', 'Preview', 'Aperçu'], undo: ['تراجع', 'Undo', 'Annuler'],
  modeSelect: ['تحديد وسحب', 'Select & drag', 'Sélection'], modeAdd: ['إضافة علامة', 'Add marker', 'Ajouter un repère'], modeBox: ['رسم إطار', 'Draw box', 'Tracer un cadre'],
  zoom: ['تكبير', 'Zoom', 'Zoom'], fit: ['ملاءمة', 'Fit', 'Ajuster'],
  dropTitle: ['ابدأ بصورة', 'Start with an image', 'Commencez par une image'],
  dropText: ['اسحب صورة PNG أو JPG أو WebP إلى هنا، أو اختر ملفًا، أو استخدم إحدى شاشات المحاكاة المضمنة.', 'Drop a PNG, JPG or WebP image here, choose a file, or use one of the built-in simulated screens.', 'Déposez une image PNG, JPG ou WebP, choisissez un fichier ou utilisez un écran simulé intégré.'],
  chooseFile: ['اختيار ملف', 'Choose file', 'Choisir un fichier'], builtIn: ['شاشة محاكاة مضمنة', 'Built-in simulated screen', 'Écran simulé intégré'], sample: ['تحميل مثال', 'Load sample', "Charger l'exemple"],
  replaceImg: ['تغيير الصورة', 'Replace image', "Remplacer l'image"],
  steps: ['الخطوات', 'Steps', 'Étapes'], project: ['المشروع', 'Project', 'Projet'], publish: ['النشر', 'Publishing', 'Publication'],
  noSteps: ['لا توجد خطوات بعد. اختر «إضافة علامة» ثم انقر على الصورة.', 'No steps yet. Choose “Add marker”, then click the image.', 'Aucune étape. Choisissez « Ajouter un repère » puis cliquez sur l’image.'],
  stepTitle: ['العنوان', 'Title', 'Titre'], stepDesc: ['الوصف', 'Description', 'Description'], number: ['الرقم', 'Number', 'Numéro'],
  arrow: ['سهم', 'Arrow', 'Flèche'], box: ['إطار', 'Box', 'Cadre'], up: ['أعلى', 'Move up', 'Monter'], down: ['أسفل', 'Move down', 'Descendre'], del: ['حذف', 'Delete', 'Supprimer'],
  renumber: ['إعادة الترقيم', 'Renumber', 'Renuméroter'],
  tx: ['رمز المعاملة', 'Transaction code', 'Code transaction'], ptitle: ['عنوان الشاشة', 'Screen title', "Titre de l'écran"], plang: ['لغة النصوص', 'Text language', 'Langue des textes'],
  source: ['مصدر الصورة', 'Image source', "Source de l'image"], srcSim: ['محاكاة تدريبية', 'Training simulation', 'Simulation de formation'], srcSup: ['لقطة مقدمة من فريق التدريب', 'Screenshot supplied by the training team', "Capture fournie par l'équipe de formation"], srcAuth: ['لقطة من نظام حقيقي', 'Screenshot from a real system', "Capture d'un système réel"],
  srcNote: ['لا تختر «نظام حقيقي» لصورة محاكاة. المنصة تعرض نوع المصدر للمتعلم دائمًا.', 'Never mark a simulated image as a real system. The platform always shows the source type to learners.', 'Ne marquez jamais une simulation comme système réel. La source est toujours affichée.'],
  fileName: ['اسم ملف الصورة', 'Image file name', "Nom du fichier image"], embed: ['تضمين الصورة داخل JSON', 'Embed the image in the JSON', "Intégrer l'image dans le JSON"],
  imgInfo: ['الصورة', 'Image', 'Image'],
  regTitle: ['إدخال السجل', 'Registry entry', 'Entrée du registre'],
  regNote: ['لعرض هذا التعليق للمتعلمين: احفظ ملف JSON المصدَّر في مجلد data/annotations/ وأضف هذا الإدخال إلى data/annotations/registry.json. التفاصيل في README.', 'To show this annotation to learners: put the exported JSON in data/annotations/ and add this entry to data/annotations/registry.json. Details are in the README.', "Pour l'afficher aux apprenants : placez le JSON exporté dans data/annotations/ et ajoutez cette entrée à data/annotations/registry.json. Détails dans le README."],
  copy: ['نسخ', 'Copy', 'Copier'], copied: ['نُسخ', 'Copied', 'Copié'],
  saved: ['حُفظ المشروع على هذا الجهاز', 'Project saved on this device', 'Projet enregistré sur cet appareil'],
  projects: ['المشاريع المحفوظة', 'Saved projects', 'Projets enregistrés'], noProjects: ['لا توجد مشاريع محفوظة.', 'No saved projects.', 'Aucun projet enregistré.'],
  confirmDel: ['حذف هذا المشروع نهائيًا من الجهاز؟', 'Delete this project from this device permanently?', 'Supprimer définitivement ce projet ?'],
  confirmNew: ['بدء مشروع جديد؟ التغييرات غير المحفوظة ستضيع.', 'Start a new project? Unsaved changes will be lost.', 'Nouveau projet ? Les modifications non enregistrées seront perdues.'],
  importErr: ['تعذر الاستيراد', 'Import failed', 'Import impossible'], imported: ['تم الاستيراد', 'Imported', 'Importé'],
  needImage: ['أضف صورة أولًا.', 'Add an image first.', "Ajoutez d'abord une image."], needSteps: ['أضف خطوة واحدة على الأقل.', 'Add at least one step.', 'Ajoutez au moins une étape.'],
  pickImage: ['الملف يشير إلى صورة غير متاحة هنا. اختر ملف الصورة.', 'The file refers to an image not available here. Choose the image file.', "L'image référencée est introuvable. Choisissez le fichier."],
  bigImage: ['الصورة كبيرة؛ قد يبطئ ذلك الحفظ والتصدير.', 'Large image; saving and export may be slow.', 'Image volumineuse ; enregistrement plus lent.'],
  badType: ['نوع غير مدعوم. استخدم PNG أو JPG أو WebP.', 'Unsupported type. Use PNG, JPG or WebP.', 'Type non pris en charge (PNG, JPG, WebP).'],
  choose: ['اختر', 'Choose', 'Choisir'], cancel: ['إلغاء', 'Cancel', 'Annuler'], close: ['إغلاق', 'Close', 'Fermer'], updated: ['آخر تعديل', 'Updated', 'Modifié'],
  stepN: ['الخطوة', 'Step', 'Étape'], untitled: ['مشروع بلا عنوان', 'Untitled project', 'Projet sans titre'],
  hintAdd: ['انقر على الصورة لإضافة علامة مرقمة.', 'Click the image to add a numbered marker.', "Cliquez sur l'image pour ajouter un repère."],
  hintBox: ['اسحب على الصورة لرسم إطار للخطوة المحددة.', 'Drag on the image to draw a box for the selected step.', "Glissez sur l'image pour tracer le cadre de l'étape."],
  hintSel: ['اسحب العلامات ورؤوس الأسهم والإطارات لتعديل مواضعها.', 'Drag markers, arrow heads and boxes to reposition them.', 'Glissez repères, pointes de flèche et cadres.'],
  selectStep: ['حدد خطوة أولًا.', 'Select a step first.', "Sélectionnez d'abord une étape."]
};
const s = (k) => { const v = S[k]; return v ? v[Math.max(0, LANGS.indexOf(getLang()))] : k; };

// ---------------------------------------------------------------- state
const PIN_KEY = 'la:studio:pin';
const SESSION_KEY = 'la:studio:unlocked';
let proj = blank();
let sel = -1;
let mode = 'select';
let zoom = 0; // 0 = fit
let history = [];
let dirty = false;
let previewViewer = null;

function blank() {
  return { id: null, name: '', transaction: '', title: '', language: getLang() || 'ar', source: 'supplied', screenshot: '', image: null, width: 0, height: 0, embed: true, steps: [] };
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const r2 = (n) => Math.round(n * 100) / 100;
const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, n));
function snapshot() { history.push(JSON.stringify(proj)); if (history.length > 60) history.shift(); dirty = true; }
function undo() { const last = history.pop(); if (!last) return; proj = JSON.parse(last); if (sel >= proj.steps.length) sel = proj.steps.length - 1; renderAll(); }

// ---------------------------------------------------------------- IndexedDB
const DB_NAME = 'la-studio';
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function dbDo(mode2, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction('projects', mode2);
    const out = fn(tx.objectStore('projects'));
    tx.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
    tx.onerror = () => rej(tx.error);
  });
}
const dbPut = (p) => dbDo('readwrite', (st) => st.put(p));
const dbDel = (id) => dbDo('readwrite', (st) => st.delete(id));
const dbAll = () => dbDo('readonly', (st) => st.getAll());

// ---------------------------------------------------------------- crypto gate
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('logiacademy-studio:' + text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function renderGate() {
  const has = !!localStorage.getItem(PIN_KEY);
  root.innerHTML = `<main class="st-gate">
    <form class="st-gate-card" autocomplete="off">
      <div class="st-gate-logo">${icon('crosshair')}</div>
      <h1>${esc(s('title'))}</h1>
      <p>${esc(s(has ? 'gateEnter' : 'gateSet'))}</p>
      <label class="st-f"><span>${esc(s('pin'))}</span><input type="password" inputmode="numeric" name="pin" required minlength="4" autocomplete="off"></label>
      ${has ? '' : `<label class="st-f"><span>${esc(s('pin2'))}</span><input type="password" inputmode="numeric" name="pin2" required minlength="4" autocomplete="off"></label>`}
      <p class="st-err" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">${esc(s(has ? 'unlock' : 'setPin'))}</button>
      <p class="st-note">${icon('info')}<span>${esc(s('gateNote'))}</span></p>
      <a class="st-back" href="./">${esc(s('back'))}</a>
    </form>
    ${langSeg()}
  </main>`;
  const f = root.querySelector('form');
  const errEl = f.querySelector('.st-err');
  f.pin.focus();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = f.pin.value.trim();
    const fail = (k) => { errEl.textContent = s(k); errEl.hidden = false; };
    if (pin.length < 4) return fail('pinShort');
    if (!has) {
      if (pin !== f.pin2.value.trim()) return fail('pinMismatch');
      localStorage.setItem(PIN_KEY, await sha256(pin));
    } else if ((await sha256(pin)) !== localStorage.getItem(PIN_KEY)) return fail('pinWrong');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderApp();
  });
  bindLang();
}
function langSeg() {
  return `<div class="seg st-lang" role="group" aria-label="Language">${LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === getLang()}">${{ ar: 'ع', en: 'EN', fr: 'FR' }[l]}</button>`).join('')}</div>`;
}
function bindLang() {
  root.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    setLang(b.dataset.lang); store.setPref('lang', b.dataset.lang);
    sessionStorage.getItem(SESSION_KEY) ? renderApp() : renderGate();
  }));
}

// ---------------------------------------------------------------- app shell
const root = document.getElementById('studio');
let els = {};
function renderApp() {
  root.innerHTML = `<div class="st-app">
    <header class="st-bar">
      <a class="st-brand" href="./" title="${attr(s('back'))}">${icon('crosshair')}<span>${esc(s('title'))}</span></a>
      <input class="st-name" id="st-name" value="${attr(proj.name)}" placeholder="${attr(s('untitled'))}" aria-label="${attr(s('untitled'))}">
      <div class="st-actions">
        <button class="btn btn-sm" data-act="new">${icon('file-text')}<span>${esc(s('newP'))}</span></button>
        <button class="btn btn-sm" data-act="open">${icon('folder-open')}<span>${esc(s('open'))}</span></button>
        <button class="btn btn-sm btn-primary" data-act="save">${icon('save')}<span>${esc(s('save'))}</span></button>
        <span class="st-sep"></span>
        <button class="btn btn-sm" data-act="import">${icon('upload')}<span>${esc(s('importJ'))}</span></button>
        <button class="btn btn-sm" data-act="export">${icon('download')}<span>${esc(s('exportJ'))}</span></button>
        <button class="btn btn-sm" data-act="html">${icon('file-code')}<span>${esc(s('exportH'))}</span></button>
        <button class="btn btn-sm" data-act="png">${icon('image')}<span>${esc(s('exportP'))}</span></button>
        <button class="btn btn-sm" data-act="preview">${icon('eye')}<span>${esc(s('preview'))}</span></button>
        <span class="st-sep"></span>
        ${langSeg()}
        <button class="btn btn-sm btn-quiet" data-act="lock" title="${attr(s('lock'))}">${icon('lock')}<span class="sr-only">${esc(s('lock'))}</span></button>
      </div>
    </header>
    <div class="st-tools">
      <div class="seg" role="group" id="st-modes">
        <button type="button" data-mode="select">${icon('mouse-pointer-2')}<span>${esc(s('modeSelect'))}</span></button>
        <button type="button" data-mode="add">${icon('plus')}<span>${esc(s('modeAdd'))}</span></button>
        <button type="button" data-mode="box">${icon('square-dashed')}<span>${esc(s('modeBox'))}</span></button>
      </div>
      <button class="btn btn-sm" data-act="undo" title="Ctrl+Z">${icon('undo-2')}<span>${esc(s('undo'))}</span></button>
      <label class="st-zoom">${esc(s('zoom'))}
        <select id="st-zoom"><option value="0">${esc(s('fit'))}</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select>
      </label>
      <span class="st-hint" id="st-hint"></span>
    </div>
    <main class="st-main">
      <section class="st-stage" id="st-stage" aria-label="Canvas"></section>
      <aside class="st-side">
        <div class="st-tabs" role="tablist">
          <button role="tab" data-tab="steps" aria-selected="true">${esc(s('steps'))}</button>
          <button role="tab" data-tab="project" aria-selected="false">${esc(s('project'))}</button>
          <button role="tab" data-tab="publish" aria-selected="false">${esc(s('publish'))}</button>
        </div>
        <div class="st-panel" id="st-panel"></div>
      </aside>
    </main>
    <input type="file" id="st-file-img" accept="image/png,image/jpeg,image/webp" hidden>
    <input type="file" id="st-file-json" accept="application/json,.json" hidden>
  </div>`;
  els = { stage: root.querySelector('#st-stage'), panel: root.querySelector('#st-panel'), hint: root.querySelector('#st-hint'), name: root.querySelector('#st-name'), fileImg: root.querySelector('#st-file-img'), fileJson: root.querySelector('#st-file-json'), zoom: root.querySelector('#st-zoom') };
  els.zoom.value = String(zoom);
  bindApp();
  bindLang();
  renderAll();
}
let tab = 'steps';
function renderAll() {
  els.name.value = proj.name;
  root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  els.hint.textContent = s(mode === 'add' ? 'hintAdd' : mode === 'box' ? 'hintBox' : 'hintSel');
  renderStage();
  renderPanel();
}

// ---------------------------------------------------------------- stage
function renderStage() {
  if (!proj.image) {
    els.stage.innerHTML = `<div class="st-drop" id="st-drop">
      ${icon('image')}<h2>${esc(s('dropTitle'))}</h2><p>${esc(s('dropText'))}</p>
      <div class="st-drop-actions">
        <button class="btn btn-primary" data-act="pick">${icon('upload')}<span>${esc(s('chooseFile'))}</span></button>
        <button class="btn" data-act="builtin">${icon('monitor-smartphone')}<span>${esc(s('builtIn'))}</span></button>
        <button class="btn btn-quiet" data-act="sample">${icon('sparkles')}<span>${esc(s('sample'))}</span></button>
      </div></div>`;
    return;
  }
  const w = zoom ? Math.round(proj.width * zoom) : null;
  els.stage.innerHTML = `<div class="st-canvas mode-${mode}" id="st-canvas" style="${w ? `width:${w}px` : ''}">
      <img src="${attr(proj.image)}" alt="" draggable="false" id="st-img">
      <svg class="st-ov" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="stAh" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>
        <g id="st-boxes"></g><g id="st-arrows"></g><rect id="st-draft" class="st-box draft" x="0" y="0" width="0" height="0" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="st-layer" id="st-layer"></div>
    </div>`;
  drawOverlay();
}
function drawOverlay() {
  const layer = root.querySelector('#st-layer'); if (!layer) return;
  const boxes = root.querySelector('#st-boxes'); const arrows = root.querySelector('#st-arrows');
  let b = ''; let a = ''; let h = '';
  proj.steps.forEach((st, i) => {
    const on = i === sel;
    if (st.box) {
      b += `<rect class="st-box${on ? ' on' : ''}" x="${st.box.x}" y="${st.box.y}" width="${st.box.w}" height="${st.box.h}" vector-effect="non-scaling-stroke"/>`;
      if (on) h += `<span class="st-h st-h-box" data-h="boxmove" data-i="${i}" style="left:${st.box.x + st.box.w / 2}%;top:${st.box.y}%" title="move"></span><span class="st-h st-h-size" data-h="boxsize" data-i="${i}" style="left:${st.box.x + st.box.w}%;top:${st.box.y + st.box.h}%"></span>`;
    }
    if (st.arrow && st.arrow.enabled) {
      a += `<line class="st-arrow${on ? ' on' : ''}" x1="${st.x}" y1="${st.y}" x2="${st.arrow.targetX}" y2="${st.arrow.targetY}" marker-end="url(#stAh)" vector-effect="non-scaling-stroke"/>`;
      h += `<span class="st-h st-h-arrow${on ? ' on' : ''}" data-h="arrow" data-i="${i}" style="left:${st.arrow.targetX}%;top:${st.arrow.targetY}%"></span>`;
    }
    h += `<button type="button" class="st-mk${on ? ' on' : ''}" data-h="mark" data-i="${i}" style="left:${st.x}%;top:${st.y}%" aria-label="${attr(s('stepN') + ' ' + st.id)}">${esc(st.id)}</button>`;
  });
  boxes.innerHTML = b; arrows.innerHTML = a; layer.innerHTML = h;
}
function pointPct(e) {
  const img = root.querySelector('#st-img'); const r = img.getBoundingClientRect();
  return [clamp(((e.clientX - r.left) / r.width) * 100), clamp(((e.clientY - r.top) / r.height) * 100)];
}
let drag = null;
function onPointerDown(e) {
  const canvas = e.target.closest('#st-canvas'); if (!canvas || e.button > 0) return;
  const hEl = e.target.closest('[data-h]');
  const [px, py] = pointPct(e);
  if (hEl) {
    const i = +hEl.dataset.i; const kind = hEl.dataset.h;
    if (sel !== i) { sel = i; renderPanel(); drawOverlay(); }
    snapshot();
    const st = proj.steps[i];
    drag = { kind, i, sx: px, sy: py, orig: clone(st), moved: false };
    canvas.setPointerCapture(e.pointerId); e.preventDefault();
    return;
  }
  if (mode === 'add') {
    snapshot();
    const id = proj.steps.reduce((m, x) => Math.max(m, +x.id || 0), 0) + 1;
    proj.steps.push({ id, title: s('stepN') + ' ' + id, description: '', x: r2(px), y: r2(py), arrow: { enabled: false, targetX: r2(clamp(px + 6)), targetY: r2(clamp(py + 6)) }, box: null });
    sel = proj.steps.length - 1;
    drawOverlay(); renderPanel();
    const t = els.panel.querySelector(`[data-step="${sel}"] [data-k="title"]`); if (t) { t.focus(); t.select(); }
  } else if (mode === 'box') {
    if (sel < 0) { toast(s('selectStep')); return; }
    snapshot();
    drag = { kind: 'draw', i: sel, sx: px, sy: py, moved: false };
    canvas.setPointerCapture(e.pointerId); e.preventDefault();
  } else if (e.target.closest('.st-box')) {
    // nothing: boxes are moved with their handle
  }
}
function onPointerMove(e) {
  if (!drag) return;
  const [px, py] = pointPct(e); const dx = px - drag.sx; const dy = py - drag.sy;
  if (Math.abs(dx) + Math.abs(dy) > 0.15) drag.moved = true;
  const st = proj.steps[drag.i]; const o = drag.orig;
  if (drag.kind === 'mark') {
    st.x = r2(clamp(o.x + dx)); st.y = r2(clamp(o.y + dy));
    if (st.arrow && st.arrow.enabled && e.shiftKey) { st.arrow.targetX = r2(clamp(o.arrow.targetX + dx)); st.arrow.targetY = r2(clamp(o.arrow.targetY + dy)); }
  } else if (drag.kind === 'arrow') { st.arrow.targetX = r2(px); st.arrow.targetY = r2(py); }
  else if (drag.kind === 'boxmove') { st.box.x = r2(clamp(o.box.x + dx, 0, 100 - o.box.w)); st.box.y = r2(clamp(o.box.y + dy, 0, 100 - o.box.h)); }
  else if (drag.kind === 'boxsize') { st.box.w = r2(clamp(px - o.box.x, 0.5, 100 - o.box.x)); st.box.h = r2(clamp(py - o.box.y, 0.5, 100 - o.box.y)); }
  else if (drag.kind === 'draw') {
    const x = Math.min(px, drag.sx); const y = Math.min(py, drag.sy);
    const d = root.querySelector('#st-draft');
    d.setAttribute('x', x); d.setAttribute('y', y); d.setAttribute('width', Math.abs(dx)); d.setAttribute('height', Math.abs(dy));
    drag.rect = { x: r2(x), y: r2(y), w: r2(Math.abs(dx)), h: r2(Math.abs(dy)) };
    return;
  }
  drawOverlay();
}
function onPointerUp() {
  if (!drag) return;
  if (drag.kind === 'draw') {
    const d = root.querySelector('#st-draft'); d.setAttribute('width', 0); d.setAttribute('height', 0);
    if (drag.rect && drag.rect.w > 0.8 && drag.rect.h > 0.8) proj.steps[drag.i].box = drag.rect; else history.pop();
    drawOverlay(); renderPanel();
  } else if (!drag.moved) history.pop();
  else renderPanel();
  drag = null;
}

// ---------------------------------------------------------------- side panel
function renderPanel() {
  if (tab === 'steps') renderSteps();
  else if (tab === 'project') renderProject();
  else renderPublish();
}
function renderSteps() {
  if (!proj.steps.length) { els.panel.innerHTML = `<div class="st-empty">${icon('circle-dot')}<p>${esc(s('noSteps'))}</p></div>`; return; }
  els.panel.innerHTML = `<div class="st-row-end"><button class="btn btn-sm btn-quiet" data-act="renumber">${icon('list-ordered')}<span>${esc(s('renumber'))}</span></button></div>
  <ol class="st-steps">${proj.steps.map((st, i) => `<li class="st-step${i === sel ? ' on' : ''}" data-step="${i}">
    <div class="st-step-head">
      <label class="st-num"><span class="sr-only">${esc(s('number'))}</span><input type="number" min="1" data-k="id" value="${attr(st.id)}"></label>
      <input class="st-step-title" data-k="title" value="${attr(st.title)}" placeholder="${attr(s('stepTitle'))}" aria-label="${attr(s('stepTitle'))}">
      <div class="st-step-btns">
        <button type="button" class="st-ib" data-op="up" title="${attr(s('up'))}" ${i === 0 ? 'disabled' : ''}>${icon('chevron-up')}</button>
        <button type="button" class="st-ib" data-op="down" title="${attr(s('down'))}" ${i === proj.steps.length - 1 ? 'disabled' : ''}>${icon('chevron-down')}</button>
        <button type="button" class="st-ib danger" data-op="del" title="${attr(s('del'))}">${icon('trash-2')}</button>
      </div>
    </div>
    ${i === sel ? `<textarea data-k="description" rows="3" placeholder="${attr(s('stepDesc'))}" aria-label="${attr(s('stepDesc'))}">${esc(st.description)}</textarea>
    <div class="st-step-opts">
      <label class="st-check"><input type="checkbox" data-k="arrow" ${st.arrow && st.arrow.enabled ? 'checked' : ''}> ${esc(s('arrow'))}</label>
      <label class="st-check"><input type="checkbox" data-k="box" ${st.box ? 'checked' : ''}> ${esc(s('box'))}</label>
      <span class="st-coords" dir="ltr">x ${st.x} · y ${st.y}</span>
    </div>` : ''}
  </li>`).join('')}</ol>`;
}
function renderProject() {
  const opt = (v, k) => `<option value="${v}" ${proj.source === v ? 'selected' : ''}>${esc(s(k))}</option>`;
  els.panel.innerHTML = `<div class="st-form">
    <label class="st-f"><span>${esc(s('tx'))}</span><input data-p="transaction" value="${attr(proj.transaction)}" placeholder="MIGO" dir="ltr" class="mono"></label>
    <label class="st-f"><span>${esc(s('ptitle'))}</span><input data-p="title" value="${attr(proj.title)}"></label>
    <label class="st-f"><span>${esc(s('plang'))}</span><select data-p="language">${['ar', 'en', 'fr', '*'].map((l) => `<option value="${l}" ${proj.language === l ? 'selected' : ''}>${{ ar: 'العربية', en: 'English', fr: 'Français', '*': '*' }[l]}</option>`).join('')}</select></label>
    <label class="st-f"><span>${esc(s('source'))}</span><select data-p="source">${opt('simulated', 'srcSim')}${opt('supplied', 'srcSup')}${opt('authentic', 'srcAuth')}</select></label>
    <p class="st-note">${icon('triangle-alert')}<span>${esc(s('srcNote'))}</span></p>
    <label class="st-f"><span>${esc(s('fileName'))}</span><input data-p="screenshot" value="${attr(proj.screenshot)}" dir="ltr" class="mono"></label>
    <label class="st-check"><input type="checkbox" data-p="embed" ${proj.embed ? 'checked' : ''}> ${esc(s('embed'))}</label>
    ${proj.image ? `<div class="st-imginfo"><span>${esc(s('imgInfo'))}: <bdi dir="ltr">${proj.width} × ${proj.height}px</bdi></span><button class="btn btn-sm" data-act="pick">${icon('refresh-cw')}<span>${esc(s('replaceImg'))}</span></button></div>` : ''}
  </div>`;
}
function registryEntry() {
  const slug = (proj.transaction || 'screen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + (proj.language === '*' ? 'all' : proj.language);
  return { transaction: proj.transaction || 'MIGO', file: `data/annotations/${slug}.json`, language: proj.language, title: proj.title || proj.name || '' };
}
function renderPublish() {
  const entry = JSON.stringify(registryEntry(), null, 2);
  els.panel.innerHTML = `<div class="st-form">
    <h3>${esc(s('regTitle'))}</h3>
    <pre class="st-code" dir="ltr">${esc(entry)}</pre>
    <button class="btn btn-sm" data-act="copyreg">${icon('copy')}<span>${esc(s('copy'))}</span></button>
    <p class="st-note">${icon('info')}<span>${esc(s('regNote'))}</span></p>
  </div>`;
}

// ---------------------------------------------------------------- export model
function exportJSON() {
  return {
    transaction: proj.transaction.trim(),
    title: proj.title.trim(),
    language: proj.language,
    source: proj.source,
    screenshot: proj.embed && proj.image && proj.image.startsWith('data:') ? proj.image : proj.screenshot || proj.image || '',
    width: proj.width, height: proj.height,
    steps: proj.steps.map((st) => {
      const o = { id: +st.id, title: st.title, description: st.description, x: r2(st.x), y: r2(st.y), arrow: { enabled: !!(st.arrow && st.arrow.enabled), targetX: r2(st.arrow ? st.arrow.targetX : st.x), targetY: r2(st.arrow ? st.arrow.targetY : st.y) } };
      if (st.box) o.box = { x: r2(st.box.x), y: r2(st.box.y), w: r2(st.box.w), h: r2(st.box.h) };
      return o;
    })
  };
}
export function validate(j) {
  const e = [];
  const num = (v) => typeof v === 'number' && isFinite(v);
  const inR = (v) => num(v) && v >= 0 && v <= 100;
  if (!j || typeof j !== 'object' || Array.isArray(j)) return ['Root must be a JSON object.'];
  if (typeof j.transaction !== 'string' || !j.transaction.trim()) e.push('"transaction" must be a non-empty string.');
  if (typeof j.screenshot !== 'string' || !j.screenshot.trim()) e.push('"screenshot" must be a file name, a path or a data URL.');
  if (j.language !== undefined && !['ar', 'en', 'fr', '*'].includes(j.language)) e.push('"language" must be ar, en, fr or *.');
  if (j.source !== undefined && !['simulated', 'supplied', 'authentic'].includes(j.source)) e.push('"source" must be simulated, supplied or authentic.');
  if (!Array.isArray(j.steps) || !j.steps.length) e.push('"steps" must be a non-empty array.');
  else {
    const ids = new Set();
    j.steps.forEach((st, i) => {
      const p = `steps[${i}]`;
      if (!st || typeof st !== 'object') { e.push(`${p} must be an object.`); return; }
      if (!Number.isInteger(st.id) || st.id < 1) e.push(`${p}.id must be a positive integer.`);
      else if (ids.has(st.id)) e.push(`${p}.id ${st.id} is duplicated.`); else ids.add(st.id);
      if (typeof st.title !== 'string') e.push(`${p}.title must be a string.`);
      if (st.description !== undefined && typeof st.description !== 'string') e.push(`${p}.description must be a string.`);
      if (!inR(st.x) || !inR(st.y)) e.push(`${p}.x and .y must be numbers between 0 and 100 (percent).`);
      if (st.arrow !== undefined) {
        if (typeof st.arrow !== 'object' || typeof st.arrow.enabled !== 'boolean') e.push(`${p}.arrow.enabled must be true or false.`);
        else if (st.arrow.enabled && (!inR(st.arrow.targetX) || !inR(st.arrow.targetY))) e.push(`${p}.arrow.targetX/targetY must be between 0 and 100.`);
      }
      if (st.box !== undefined && st.box !== null) {
        const b = st.box;
        if (!inR(b.x) || !inR(b.y) || !num(b.w) || !num(b.h) || b.w <= 0 || b.h <= 0 || b.x + b.w > 100.5 || b.y + b.h > 100.5) e.push(`${p}.box must have x, y, w, h inside 0–100.`);
      }
    });
  }
  return e;
}
function fromJSON(j) {
  const p = blank();
  p.name = j.title || j.transaction; p.transaction = j.transaction; p.title = j.title || ''; p.language = j.language || 'ar'; p.source = j.source || 'supplied';
  p.width = j.width || 0; p.height = j.height || 0;
  if (j.screenshot.startsWith('data:')) { p.image = j.screenshot; p.embed = true; p.screenshot = ''; }
  else { p.screenshot = j.screenshot; p.image = j.screenshot.includes('/') ? j.screenshot : 'images/screens/' + j.screenshot; p.embed = false; }
  p.steps = j.steps.map((st) => ({ id: st.id, title: st.title || '', description: st.description || '', x: st.x, y: st.y, arrow: st.arrow ? { enabled: !!st.arrow.enabled, targetX: st.arrow.targetX ?? clamp(st.x + 6), targetY: st.arrow.targetY ?? clamp(st.y + 6) } : { enabled: false, targetX: clamp(st.x + 6), targetY: clamp(st.y + 6) }, box: st.box || null }));
  return p;
}

// ---------------------------------------------------------------- images
function measure(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res([im.naturalWidth || 1120, im.naturalHeight || 700, im]); im.onerror = rej; im.src = src; });
}
async function setImage(src, name) {
  try {
    const [w, h] = await measure(src);
    snapshot();
    proj.image = src; proj.width = w; proj.height = h;
    if (name) proj.screenshot = name;
    if (!proj.name) proj.name = name || '';
    renderAll();
  } catch { toast(s('pickImage'), { tone: 'bad' }); }
}
function readFile(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast(s('badType'), { tone: 'bad' }); return; }
  if (file.size > 4 * 1024 * 1024) toast(s('bigImage'));
  const fr = new FileReader();
  fr.onload = () => { proj.embed = true; setImage(fr.result, file.name); };
  fr.readAsDataURL(file);
}
async function toDataURL(src) {
  if (src.startsWith('data:')) return src;
  const blob = await (await fetch(src)).blob();
  return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
}
async function chooseBuiltIn() {
  let map = {};
  try { map = await (await fetch('data/screens.json')).json(); } catch { /* offline without cache */ }
  const items = [];
  Object.entries(map).forEach(([code, v]) => v.screens.forEach((sc) => items.push({ code, src: sc.src })));
  openModal({
    title: s('builtIn'), wide: true,
    html: `<div class="st-pick-grid">${items.map((it, i) => `<button type="button" class="st-pick" data-i="${i}"><img src="${attr(it.src)}" alt="" loading="lazy"><span dir="ltr">${esc(it.code)} · ${esc(it.src.split('/').pop())}</span></button>`).join('')}</div>`,
    onMount: (m, close) => m.addEventListener('click', (e) => {
      const b = e.target.closest('.st-pick'); if (!b) return;
      const it = items[+b.dataset.i];
      proj.source = 'simulated'; proj.embed = false; if (!proj.transaction) proj.transaction = it.code;
      setImage(it.src, it.src.split('/').pop()); close();
    })
  });
}

// ---------------------------------------------------------------- export: HTML + PNG
function standaloneHTML(json, imgData) {
  const label = { simulated: 'Training simulation — not an SAP screenshot', supplied: 'Annotated screenshot supplied by the training team', authentic: 'Screenshot from a real system, annotated for training' }[json.source] || '';
  const dir = json.language === 'ar' ? 'rtl' : 'ltr';
  const data = JSON.stringify({ ...json, screenshot: '' }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="${json.language === '*' ? 'en' : json.language}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(json.transaction)} – ${esc(json.title || 'Annotated screen')}</title>
<style>
:root{--b:#0064D9;--s:#E58A00;--ink:#1D2D3E;--line:#D8DFE6}*{box-sizing:border-box}body{margin:0;font-family:system-ui,'Segoe UI',Tahoma,Arial,sans-serif;color:var(--ink);background:#F3F5F8}
header{padding:16px 20px;background:#0E2A47;color:#fff}header h1{margin:0;font-size:1.15rem}header p{margin:.3em 0 0;font-size:.85rem;opacity:.85}
.wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;padding:16px;max-width:1500px;margin:auto}@media(max-width:900px){.wrap{grid-template-columns:1fr}}
.stage{position:relative;background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}.stage img{display:block;width:100%;height:auto}
svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.box{fill:rgba(229,138,0,.12);stroke:var(--s);stroke-width:2}.ar{stroke:var(--b);stroke-width:2.5}.ar.on{stroke:var(--s);stroke-width:3}
.mk{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px solid #fff;background:var(--b);color:#fff;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)}.mk.on{background:var(--s);width:36px;height:36px;margin:-18px 0 0 -18px;font-size:15px}
.badge{position:absolute;top:8px;inset-inline-start:8px;background:#FFF3DF;color:#8A4B00;border:1px solid #F0C27A;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:600}
ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}li{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer}li.on{border-color:var(--s);box-shadow:0 0 0 2px rgba(229,138,0,.25)}
li b{display:flex;gap:8px;align-items:center}li b span{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:50%;background:var(--b);color:#fff;font-size:12px}li.on b span{background:var(--s)}li p{margin:.4em 0 0;font-size:.92rem;color:#475E75}
nav{display:flex;gap:8px;margin-bottom:10px}nav button{flex:1;padding:8px;border:1px solid var(--line);background:#fff;border-radius:8px;font:inherit;cursor:pointer}
</style></head><body>
<header><h1 dir="ltr">${esc(json.transaction)}${json.title ? ' – ' + esc(json.title) : ''}</h1><p>${esc(label)}</p></header>
<div class="wrap"><div class="stage" id="stage"><img src="${imgData}" alt=""><svg viewBox="0 0 100 100" preserveAspectRatio="none" id="ov"></svg><span class="badge">${esc(label)}</span></div>
<aside><nav><button id="prev">‹</button><button id="next">›</button></nav><ol id="list"></ol></aside></div>
<script>
const D=${data};let a=0;const st=document.getElementById('stage'),ov=document.getElementById('ov'),list=document.getElementById('list');
const e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function draw(){let svg='<defs><marker id="h" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#E58A00"/></marker></defs>';
st.querySelectorAll('.mk').forEach(m=>m.remove());D.steps.forEach((s,i)=>{const on=i===a;if(s.box&&on)svg+='<rect class="box" x="'+s.box.x+'" y="'+s.box.y+'" width="'+s.box.w+'" height="'+s.box.h+'" vector-effect="non-scaling-stroke"/>';
if(s.arrow&&s.arrow.enabled)svg+='<line class="ar'+(on?' on':'')+'" x1="'+s.x+'" y1="'+s.y+'" x2="'+s.arrow.targetX+'" y2="'+s.arrow.targetY+'" vector-effect="non-scaling-stroke"'+(on?' marker-end="url(#h)"':'')+'/>';
const b=document.createElement('button');b.className='mk'+(on?' on':'');b.style.left=s.x+'%';b.style.top=s.y+'%';b.textContent=s.id;b.onclick=()=>go(i);st.appendChild(b)});ov.innerHTML=svg;
list.innerHTML=D.steps.map((s,i)=>'<li class="'+(i===a?'on':'')+'" data-i="'+i+'"><b><span>'+e(s.id)+'</span>'+e(s.title)+'</b>'+(i===a&&s.description?'<p>'+e(s.description)+'</p>':'')+'</li>').join('');}
function go(i){a=Math.max(0,Math.min(D.steps.length-1,i));draw();const li=list.querySelector('.on');li&&li.scrollIntoView({block:'nearest'})}
list.onclick=ev=>{const li=ev.target.closest('li');li&&go(+li.dataset.i)};document.getElementById('prev').onclick=()=>go(a-1);document.getElementById('next').onclick=()=>go(a+1);
document.addEventListener('keydown',ev=>{if(ev.key==='ArrowRight')go(a+(document.dir==='rtl'?-1:1));if(ev.key==='ArrowLeft')go(a+(document.dir==='rtl'?1:-1))});draw();
<\/script></body></html>`;
}
async function exportPNG() {
  const src = await toDataURL(proj.image);
  const [w, h, im] = await measure(src);
  const scale = w < 1600 ? 2 : 1;
  const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
  const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(im, 0, 0, w, h);
  const R = Math.max(12, w * 0.013);
  proj.steps.forEach((st) => {
    const x = (st.x / 100) * w; const y = (st.y / 100) * h;
    if (st.box) { g.fillStyle = 'rgba(229,138,0,.12)'; g.strokeStyle = '#E58A00'; g.lineWidth = 2; const bx = (st.box.x / 100) * w; const by = (st.box.y / 100) * h; g.fillRect(bx, by, (st.box.w / 100) * w, (st.box.h / 100) * h); g.strokeRect(bx, by, (st.box.w / 100) * w, (st.box.h / 100) * h); }
    if (st.arrow && st.arrow.enabled) {
      const tx = (st.arrow.targetX / 100) * w; const ty = (st.arrow.targetY / 100) * h; const ang = Math.atan2(ty - y, tx - x);
      g.strokeStyle = '#0064D9'; g.fillStyle = '#0064D9'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x + Math.cos(ang) * R, y + Math.sin(ang) * R); g.lineTo(tx, ty); g.stroke();
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - 11 * Math.cos(ang - 0.4), ty - 11 * Math.sin(ang - 0.4)); g.lineTo(tx - 11 * Math.cos(ang + 0.4), ty - 11 * Math.sin(ang + 0.4)); g.closePath(); g.fill();
    }
    g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fillStyle = '#0064D9'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#fff'; g.font = `700 ${Math.round(R * 1.05)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(st.id), x, y + 1);
  });
  c.toBlob((b) => downloadBlob(b, fileBase() + '.png'), 'image/png');
}
const fileBase = () => (registryEntry().file.split('/').pop() || 'annotation.json').replace(/\.json$/, '');

// ---------------------------------------------------------------- preview
function openPreview() {
  if (!proj.image) return toast(s('needImage'));
  if (!proj.steps.length) return toast(s('needSteps'));
  const json = exportJSON();
  if (!json.screenshot.startsWith('data:') && !json.screenshot.includes('/')) json.screenshot = proj.image;
  const model = annotationModel(json, getLang());
  openModal({
    title: s('preview'), wide: true,
    html: `<div class="st-preview"><div class="st-prev-viewer"></div><ol class="st-prev-steps">${proj.steps.map((st, i) => `<li data-i="${i}"><b><span>${esc(st.id)}</span>${esc(st.title)}</b><p>${esc(st.description)}</p></li>`).join('')}</ol></div>`,
    onMount: (m) => {
      const host = m.querySelector('.st-prev-viewer'); const list = m.querySelector('.st-prev-steps');
      const mark = (i) => list.querySelectorAll('li').forEach((li) => li.classList.toggle('on', +li.dataset.i === i));
      previewViewer = createViewer(host, model, { code: proj.transaction || 'PREVIEW', initial: 0 });
      previewViewer.onChange((i) => { mark(i); const li = list.querySelector('.on'); if (li) li.scrollIntoView({ block: 'nearest' }); });
      mark(0);
      list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) previewViewer.setActive(+li.dataset.i); });
    },
    onClose: () => { if (previewViewer) { previewViewer.destroy(); previewViewer = null; } }
  });
}

// ---------------------------------------------------------------- actions
async function act(a) {
  if (a === 'new') { if (proj.steps.length && dirty && !(await confirmDialog(s('confirmNew'), s('newP')))) return; proj = blank(); sel = -1; history = []; dirty = false; renderAll(); }
  else if (a === 'pick') els.fileImg.click();
  else if (a === 'builtin') chooseBuiltIn();
  else if (a === 'sample') loadSample();
  else if (a === 'save') saveProject();
  else if (a === 'open') openProjects();
  else if (a === 'import') els.fileJson.click();
  else if (a === 'export') {
    if (!proj.image) return toast(s('needImage'));
    const json = exportJSON();
    if (proj.embed) json.screenshot = await toDataURL(proj.image);
    downloadBlob(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }), fileBase() + '.json');
  } else if (a === 'html') {
    if (!proj.image) return toast(s('needImage'));
    if (!proj.steps.length) return toast(s('needSteps'));
    const json = exportJSON(); const img = await toDataURL(proj.image);
    downloadBlob(new Blob([standaloneHTML(json, img)], { type: 'text/html' }), fileBase() + '.html');
  } else if (a === 'png') { if (!proj.image) return toast(s('needImage')); exportPNG(); }
  else if (a === 'preview') openPreview();
  else if (a === 'undo') undo();
  else if (a === 'renumber') { snapshot(); proj.steps.forEach((st, i) => { st.id = i + 1; }); renderAll(); }
  else if (a === 'copyreg') { await copyText(JSON.stringify(registryEntry(), null, 2)); toast(s('copied')); }
  else if (a === 'lock') { sessionStorage.removeItem(SESSION_KEY); renderGate(); }
}
async function saveProject() {
  if (!proj.image) return toast(s('needImage'));
  if (!proj.id) proj.id = 'p' + Date.now().toString(36);
  const rec = clone(proj); rec.updated = Date.now();
  try { await dbPut(rec); dirty = false; toast(s('saved'), { tone: 'ok' }); } catch (e) { toast(String(e), { tone: 'bad' }); }
}
async function openProjects() {
  let list = [];
  try { list = (await dbAll()).sort((a, b) => b.updated - a.updated); } catch { /* private mode */ }
  openModal({
    title: s('projects'),
    html: list.length ? `<ul class="st-plist">${list.map((p) => `<li data-id="${attr(p.id)}"><button type="button" class="st-plink" data-open="${attr(p.id)}"><b>${esc(p.name || p.title || p.transaction || s('untitled'))}</b><span dir="ltr">${esc(p.transaction)} · ${p.steps.length} · ${new Date(p.updated).toLocaleString()}</span></button><button type="button" class="st-ib danger" data-del="${attr(p.id)}" title="${attr(s('del'))}">${icon('trash-2')}</button></li>`).join('')}</ul>` : `<p class="muted">${esc(s('noProjects'))}</p>`,
    onMount: (m, close) => m.addEventListener('click', async (e) => {
      const o = e.target.closest('[data-open]'); const d = e.target.closest('[data-del]');
      if (o) { const p = list.find((x) => x.id === o.dataset.open); proj = clone(p); delete proj.updated; sel = proj.steps.length ? 0 : -1; history = []; dirty = false; close(); renderAll(); }
      if (d && (await confirmDialog(s('confirmDel'), s('del')))) { await dbDel(d.dataset.del); d.closest('li').remove(); }
    })
  });
}
async function importFile(file) {
  let j;
  try { j = JSON.parse(await file.text()); } catch (e) { return showErrors(['Invalid JSON: ' + e.message]); }
  const errs = validate(j);
  if (errs.length) return showErrors(errs);
  const p = fromJSON(j);
  try { await measure(p.image); } catch { proj = p; proj.image = null; sel = 0; renderAll(); toast(s('pickImage')); els.fileImg.click(); return; }
  if (!p.width) { const [w, h] = await measure(p.image); p.width = w; p.height = h; }
  proj = p; sel = 0; history = []; renderAll(); toast(s('imported'), { tone: 'ok' });
}
function showErrors(list) {
  openModal({ title: s('importErr'), html: `<ul class="st-errs" dir="ltr">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` });
}
async function loadSample() {
  try { const j = await (await fetch('data/annotations/samples/migo-sample.json')).json(); const f = new File([JSON.stringify(j)], 'migo-sample.json', { type: 'application/json' }); await importFile(f); } catch { toast(s('importErr'), { tone: 'bad' }); }
}

function bindApp() {
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (a) { act(a.dataset.act); return; }
    const m = e.target.closest('[data-mode]'); if (m) { mode = m.dataset.mode; renderAll(); return; }
    const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; renderAll(); return; }
    const op = e.target.closest('[data-op]');
    if (op) {
      const i = +op.closest('[data-step]').dataset.step; snapshot();
      if (op.dataset.op === 'del') { proj.steps.splice(i, 1); sel = Math.min(sel, proj.steps.length - 1); }
      else { const j = op.dataset.op === 'up' ? i - 1 : i + 1; [proj.steps[i], proj.steps[j]] = [proj.steps[j], proj.steps[i]]; sel = j; }
      drawOverlay(); renderPanel(); return;
    }
    const li = e.target.closest('[data-step]');
    if (li && !e.target.closest('input,textarea,button,label')) { sel = +li.dataset.step; drawOverlay(); renderPanel(); }
  });
  root.addEventListener('focusin', (e) => {
    const li = e.target.closest('[data-step]');
    if (li && +li.dataset.step !== sel && e.target.matches('[data-k="title"],[data-k="id"]')) { sel = +li.dataset.step; drawOverlay(); const keep = e.target.dataset.k; renderPanel(); const el = els.panel.querySelector(`[data-step="${sel}"] [data-k="${keep}"]`); if (el) el.focus(); }
  });
  let typing = null;
  root.addEventListener('input', (e) => {
    const k = e.target.dataset.k; const p = e.target.dataset.p;
    if (e.target.id === 'st-name') { proj.name = e.target.value; dirty = true; return; }
    if (k) {
      const i = +e.target.closest('[data-step]').dataset.step; const st = proj.steps[i];
      if (!typing) { snapshot(); typing = setTimeout(() => { typing = null; }, 800); }
      if (k === 'title' || k === 'description') st[k] = e.target.value;
      else if (k === 'id') { const v = parseInt(e.target.value, 10); if (v > 0) { st.id = v; drawOverlay(); } }
    }
    if (p && p !== 'embed') { proj[p] = e.target.value; dirty = true; if (p === 'transaction' && tab === 'publish') renderPublish(); }
  });
  root.addEventListener('change', (e) => {
    const k = e.target.dataset.k; const p = e.target.dataset.p;
    if (k === 'arrow' || k === 'box') {
      const i = +e.target.closest('[data-step]').dataset.step; const st = proj.steps[i]; snapshot();
      if (k === 'arrow') st.arrow = { enabled: e.target.checked, targetX: st.arrow ? st.arrow.targetX : clamp(st.x + 6), targetY: st.arrow ? st.arrow.targetY : clamp(st.y + 6) };
      else st.box = e.target.checked ? { x: r2(clamp(st.x + 2, 0, 90)), y: r2(clamp(st.y - 2, 0, 94)), w: 10, h: 5 } : null;
      drawOverlay();
    }
    if (p === 'embed') { proj.embed = e.target.checked; dirty = true; }
    if (p === 'source' || p === 'language') { proj[p] = e.target.value; dirty = true; }
    if (e.target === els.zoom) { zoom = +els.zoom.value; renderStage(); }
    if (e.target === els.fileImg && e.target.files[0]) { readFile(e.target.files[0]); e.target.value = ''; }
    if (e.target === els.fileJson && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; }
  });
  els.stage.addEventListener('pointerdown', onPointerDown);
  els.stage.addEventListener('pointermove', onPointerMove);
  els.stage.addEventListener('pointerup', onPointerUp);
  els.stage.addEventListener('pointercancel', onPointerUp);
  els.stage.addEventListener('dragover', (e) => { e.preventDefault(); els.stage.classList.add('drag'); });
  els.stage.addEventListener('dragleave', () => els.stage.classList.remove('drag'));
  els.stage.addEventListener('drop', (e) => { e.preventDefault(); els.stage.classList.remove('drag'); const f = e.dataTransfer.files[0]; if (!f) return; if (/json/.test(f.type) || f.name.endsWith('.json')) importFile(f); else readFile(f); });
}
document.addEventListener('keydown', (e) => {
  if (!els.stage || !sessionStorage.getItem(SESSION_KEY)) return;
  const inField = e.target.matches('input, textarea, select');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inField) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); }
  if (inField || sel < 0) return;
  const st = proj.steps[sel]; const step = e.shiftKey ? 1 : 0.2;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv && document.activeElement && document.activeElement.closest('#st-canvas')) { e.preventDefault(); snapshot(); st.x = r2(clamp(st.x + mv[0])); st.y = r2(clamp(st.y + mv[1])); drawOverlay(); const b = root.querySelector(`.st-mk[data-i="${sel}"]`); if (b) b.focus(); }
  if ((e.key === 'Delete') && document.activeElement && document.activeElement.classList.contains('st-mk')) { snapshot(); proj.steps.splice(sel, 1); sel = Math.min(sel, proj.steps.length - 1); drawOverlay(); renderPanel(); }
});
window.addEventListener('beforeunload', (e) => { if (dirty && proj.steps.length) { e.preventDefault(); e.returnValue = ''; } });

// ---------------------------------------------------------------- boot
(async function boot() {
  initLang();
  try { await loadStrings(); } catch { /* viewer labels fall back to keys */ }
  if (sessionStorage.getItem(SESSION_KEY) && localStorage.getItem(PIN_KEY)) renderApp(); else renderGate();
})();
