// Annotated screen viewer: numbered markers, arrows, highlighted fields, zoom/pan and
// two-way synchronisation with the step list. Coordinates are stored as percentages.
import { t, L, isRTL } from '../core/i18n.js';
import { icon } from '../core/icons.js';
import { esc, attr } from '../core/dom.js';
import { store } from '../core/store.js';

const DIRS = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createViewer(root, model, opts = {}) {
  const st = { screen: model.steps[0] ? model.steps[0].s || 0 : 0, active: opts.initial ?? 0, scale: 1, cx: 50, cy: 50, fw: 0, fh: 0, anim: null, loaded: false };
  st.focus = store.state.prefs.focus ?? !window.matchMedia('(min-width: 900px)').matches;
  st.showAll = store.state.prefs.showAll !== false;
  const listeners = new Set();
  const multi = model.screens.length > 1;
  const badge = model.simulated === true ? ['sim', t('viewer.simulated'), 'triangle-alert'] : model.simulated === 'supplied' ? ['sup', t('viewer.supplied'), 'image'] : ['real', t('viewer.authentic'), 'badge-check'];

  root.innerHTML = `
  <div class="sv" tabindex="-1" aria-roledescription="${attr(t('viewer.role'))}">
    <div class="sv-bar">
      ${multi ? `<div class="sv-tabs" role="tablist">${model.screens.map((s, i) => `<button type="button" role="tab" data-scr="${i}" aria-selected="${i === st.screen}">${i + 1}. ${esc(s.label ? L(s.label) : t('viewer.screen.' + (s.kind || 'main')))}</button>`).join('')}</div>` : ''}
      <span class="sv-badge sv-badge-${badge[0]}">${icon(badge[2])}<span>${esc(badge[1])}</span></span>
      <div class="sv-tools" role="toolbar" aria-label="${attr(t('viewer.tools'))}">
        <button type="button" class="icon-btn sm" data-sv="out" aria-label="${attr(t('viewer.zoomOut'))}" title="${attr(t('viewer.zoomOut'))}">${icon('zoom-out')}</button>
        <button type="button" class="icon-btn sm" data-sv="in" aria-label="${attr(t('viewer.zoomIn'))}" title="${attr(t('viewer.zoomIn'))}">${icon('zoom-in')}</button>
        <button type="button" class="icon-btn sm" data-sv="fit" aria-label="${attr(t('viewer.fit'))}" title="${attr(t('viewer.fit'))}">${icon('scan-line')}</button>
        <button type="button" class="icon-btn sm" data-sv="focus" aria-pressed="${st.focus}" aria-label="${attr(t('viewer.focus'))}" title="${attr(t('viewer.focus'))}">${icon('crosshair')}</button>
        <button type="button" class="icon-btn sm" data-sv="all" aria-pressed="${st.showAll}" aria-label="${attr(t('viewer.showAll'))}" title="${attr(t('viewer.showAll'))}">${icon('eye')}</button>
        <button type="button" class="icon-btn sm" data-sv="full" aria-label="${attr(t('viewer.fullscreen'))}" title="${attr(t('viewer.fullscreen'))}">${icon('maximize')}</button>
      </div>
    </div>
    <div class="sv-frame">
      <div class="sv-stage"><img class="sv-img" alt="" draggable="false" decoding="async"></div>
      <svg class="sv-ov" aria-hidden="false"></svg>
      <div class="sv-msg" hidden></div>
    </div>
    <div class="sv-cap">
      <button type="button" class="icon-btn sm" data-sv="prev" aria-label="${attr(t('viewer.prev'))}">${icon(isRTL() ? 'chevron-right' : 'chevron-left')}</button>
      <div class="sv-cap-text" aria-live="polite"></div>
      <button type="button" class="icon-btn sm" data-sv="next" aria-label="${attr(t('viewer.next'))}">${icon(isRTL() ? 'chevron-left' : 'chevron-right')}</button>
    </div>
  </div>`;
  const sv = root.querySelector('.sv');
  const frame = root.querySelector('.sv-frame');
  const stage = root.querySelector('.sv-stage');
  const img = root.querySelector('.sv-img');
  const ov = root.querySelector('.sv-ov');
  const msg = root.querySelector('.sv-msg');
  const cap = root.querySelector('.sv-cap-text');

  function scr() { return model.screens[st.screen]; }
  function setAspect() { const s = scr(); frame.style.aspectRatio = `${s.w || 16} / ${s.h || 10}`; }
  function loadScreen() {
    const s = scr();
    st.loaded = false; msg.hidden = true; img.hidden = false;
    setAspect();
    img.onload = () => {
      if (!s.w || !s.h) { s.w = img.naturalWidth; s.h = img.naturalHeight; setAspect(); }
      st.loaded = true; measure(); render();
    };
    img.onerror = () => { img.hidden = true; msg.hidden = false; msg.textContent = t('viewer.error'); ov.innerHTML = ''; };
    img.alt = `${t('viewer.screenAlt')} ${opts.code || ''} – ${s.label ? L(s.label) : t('viewer.screen.' + (s.kind || 'main'))}`;
    img.decoding = 'async';
    img.src = s.src;
    root.querySelectorAll('[data-scr]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.scr) === st.screen)));
  }
  function measure() { const r = frame.getBoundingClientRect(); st.fw = r.width; st.fh = r.height; }
  function offsets(v = st) {
    const { fw, fh } = st;
    let tx = fw / 2 - v.scale * fw * v.cx / 100;
    let ty = fh / 2 - v.scale * fh * v.cy / 100;
    tx = Math.min(0, Math.max(fw - v.scale * fw, tx));
    ty = Math.min(0, Math.max(fh - v.scale * fh, ty));
    return { tx, ty };
  }
  const proj = (x, y, o) => [o.tx + st.scale * st.fw * x / 100, o.ty + st.scale * st.fh * y / 100];

  function stepGeom(step, o, r) {
    if (step.s !== st.screen) return null;
    let tp = null; let mp = null; let box = null;
    if (step.box) { const [bx, by, bw, bh] = step.box; const a = proj(bx, by, o); box = [a[0], a[1], st.scale * st.fw * bw / 100, st.scale * st.fh * bh / 100]; }
    if (step.target) {
      tp = proj(step.target[0], step.target[1], o);
      const d = DIRS[step.dir] || DIRS.top;
      const gap = r + 14;
      mp = [tp[0] + d[0] * gap, tp[1] + d[1] * gap];
    } else if (step.x != null) {
      mp = proj(step.x, step.y, o);
      if (step.arrow && step.arrow.enabled) tp = proj(step.arrow.targetX, step.arrow.targetY, o);
    } else return null;
    mp = [Math.min(st.fw - r - 2, Math.max(r + 2, mp[0])), Math.min(st.fh - r - 2, Math.max(r + 2, mp[1]))];
    return { tp, mp, box };
  }

  function render() {
    if (!st.fw) measure();
    const o = offsets();
    stage.style.transform = `translate(${o.tx}px, ${o.ty}px) scale(${st.scale})`;
    const small = st.fw < 520;
    const R = small ? 11 : 13;
    const RA = R + 3;
    ov.setAttribute('viewBox', `0 0 ${st.fw} ${st.fh}`);
    ov.setAttribute('width', st.fw); ov.setAttribute('height', st.fh);
    let defs = `<defs><marker id="svA" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="sv-arrowhead"/></marker><marker id="svAa" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="sv-arrowhead-active"/></marker></defs>`;
    let spot = ''; let boxes = ''; let arrows = ''; let marks = ''; let hits = '';
    model.steps.forEach((step, i) => {
      const active = i === st.active;
      if (!active && !st.showAll) return;
      const g = stepGeom(step, o, active ? RA : R);
      if (!g) return;
      if (g.box) {
        hits += `<rect class="sv-hit" data-i="${i}" x="${g.box[0]}" y="${g.box[1]}" width="${g.box[2]}" height="${g.box[3]}" rx="6"/>`;
        if (active) {
          const pad = 3; const [x, y, w, h] = [g.box[0] - pad, g.box[1] - pad, g.box[2] + pad * 2, g.box[3] + pad * 2];
          spot = `<path class="sv-spot" fill-rule="evenodd" d="M0 0H${st.fw}V${st.fh}H0Z M${x + 6} ${y}H${x + w - 6}Q${x + w} ${y} ${x + w} ${y + 6}V${y + h - 6}Q${x + w} ${y + h} ${x + w - 6} ${y + h}H${x + 6}Q${x} ${y + h} ${x} ${y + h - 6}V${y + 6}Q${x} ${y} ${x + 6} ${y}Z"/>`;
          boxes += `<rect class="sv-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
        }
      }
      if (g.tp) {
        const [mx, my] = g.mp; const [tx, ty] = g.tp;
        const dx = tx - mx; const dy = ty - my; const len = Math.hypot(dx, dy);
        const rr = active ? RA : R;
        if (len > rr + 6) {
          const sx = mx + dx / len * (rr + 1); const sy = my + dy / len * (rr + 1);
          const ex = tx - dx / len * 2; const ey = ty - dy / len * 2;
          arrows += `<line class="sv-arrow${active ? ' active' : ''}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" marker-end="url(#${active ? 'svAa' : 'svA'})"/>`;
        }
      }
      const r = active ? RA : R;
      const cls = active ? 'active' : i < st.active ? 'done' : '';
      marks += `<g class="sv-mark ${cls}" data-i="${i}" role="button" tabindex="0" aria-label="${attr(t('viewer.step', { n: step.n }) + ': ' + L(step.title))}" transform="translate(${g.mp[0]} ${g.mp[1]})">${active ? `<circle class="sv-pulse" r="${r}"/>` : ''}<circle class="sv-dot" r="${r}"/><text class="sv-num" y="${small ? 4 : 4.6}" font-size="${active ? (small ? 13 : 14) : (small ? 11.5 : 12.5)}">${step.n}</text></g>`;
    });
    ov.innerHTML = defs + spot + hits + boxes + arrows + marks;
    const s = model.steps[st.active];
    cap.innerHTML = s ? `<span class="sv-cap-num">${s.n}</span><span class="sv-cap-body"><strong>${esc(L(s.title))}</strong><span class="sv-cap-desc">${esc(L(s.desc))}</span></span><span class="sv-cap-count">${t('viewer.of', { a: st.active + 1, b: model.steps.length })}</span>` : '';
    root.querySelector('[data-sv="prev"]').disabled = st.active <= 0;
    root.querySelector('[data-sv="next"]').disabled = st.active >= model.steps.length - 1;
  }

  function focusTarget(step) {
    const o0 = { tx: 0, ty: 0 };
    const sc = st.scale; st.scale = 1;
    const g = stepGeom(step, o0, 13);
    st.scale = sc;
    if (!g) return { scale: 1, cx: 50, cy: 50 };
    const pts = [g.mp, g.tp].filter(Boolean);
    if (g.box) pts.push([g.box[0], g.box[1]], [g.box[0] + g.box[2], g.box[1] + g.box[3]]);
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const x1 = Math.min(...xs) - 30; const x2 = Math.max(...xs) + 30; const y1 = Math.min(...ys) - 30; const y2 = Math.max(...ys) + 30;
    const max = st.fw < 600 ? 2.9 : 2.0;
    const scale = Math.max(1, Math.min(max, st.fw * 0.92 / (x2 - x1), st.fh * 0.86 / (y2 - y1)));
    return { scale, cx: ((x1 + x2) / 2) / st.fw * 100, cy: ((y1 + y2) / 2) / st.fh * 100 };
  }
  function animateTo(v) {
    cancelAnimationFrame(st.anim);
    if (reduceMotion()) { Object.assign(st, v); render(); return; }
    const from = { scale: st.scale, cx: st.cx, cy: st.cy };
    // keep the visual centre continuous when currently at scale 1
    if (from.scale === 1) { from.cx = v.cx; from.cy = v.cy; }
    const t0 = performance.now(); const dur = 380;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur); const e = ease(p);
      st.scale = from.scale + (v.scale - from.scale) * e;
      st.cx = from.cx + (v.cx - from.cx) * e; st.cy = from.cy + (v.cy - from.cy) * e;
      render();
      if (p < 1) st.anim = requestAnimationFrame(tick);
    };
    st.anim = requestAnimationFrame(tick);
  }
  function zoom(factor, cx, cy) {
    const ns = Math.max(1, Math.min(4, st.scale * factor));
    if (cx != null) {
      // keep the point under the cursor stable
      const o = offsets();
      const ix = (cx - o.tx) / (st.scale * st.fw) * 100; const iy = (cy - o.ty) / (st.scale * st.fh) * 100;
      st.scale = ns;
      st.cx = ix + (st.fw / 2 - cx) / (ns * st.fw) * 100; st.cy = iy + (st.fh / 2 - cy) / (ns * st.fh) * 100;
    } else st.scale = ns;
    if (ns === 1) { st.cx = 50; st.cy = 50; }
    render();
  }

  function setActive(i, { silent = false, scroll = false } = {}) {
    if (i < 0 || i >= model.steps.length) return;
    st.active = i;
    const step = model.steps[i];
    const switching = step.s !== st.screen;
    if (switching) { st.screen = step.s; st.scale = 1; st.cx = 50; st.cy = 50; loadScreen(); }
    const after = () => { if (st.focus) animateTo(focusTarget(step)); else render(); };
    if (switching) { const prevOnload = img.onload; img.onload = (e) => { prevOnload && prevOnload(e); after(); }; } else if (st.loaded) after();
    if (scroll) { const r = sv.getBoundingClientRect(); if (r.bottom < 80 || r.top > window.innerHeight - 80) sv.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); }
    if (!silent) listeners.forEach((fn) => fn(i));
  }

  // ---------- interactions ----------
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sv]');
    if (b) {
      const a = b.dataset.sv;
      if (a === 'in') zoom(1.4); else if (a === 'out') zoom(1 / 1.4);
      else if (a === 'fit') { st.scale = 1; st.cx = 50; st.cy = 50; render(); }
      else if (a === 'focus') { st.focus = !st.focus; b.setAttribute('aria-pressed', st.focus); store.setPref('focus', st.focus); if (st.focus) animateTo(focusTarget(model.steps[st.active])); else animateTo({ scale: 1, cx: 50, cy: 50 }); }
      else if (a === 'all') { st.showAll = !st.showAll; b.setAttribute('aria-pressed', st.showAll); store.setPref('showAll', st.showAll); render(); }
      else if (a === 'full') toggleFull();
      else if (a === 'prev') setActive(st.active - 1);
      else if (a === 'next') setActive(st.active + 1);
      return;
    }
    const tab = e.target.closest('[data-scr]');
    if (tab) { st.screen = Number(tab.dataset.scr); st.scale = 1; st.cx = 50; st.cy = 50; loadScreen(); const first = model.steps.findIndex((s) => s.s === st.screen); if (first >= 0 && model.steps[st.active].s !== st.screen) setActive(first); return; }
  });
  ov.addEventListener('click', (e) => {
    if (moved) return;
    const el = e.target.closest('[data-i]');
    if (el) setActive(Number(el.dataset.i));
  });
  ov.addEventListener('keydown', (e) => {
    const el = e.target.closest('.sv-mark');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setActive(Number(el.dataset.i)); }
  });
  sv.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea')) return;
    const fwd = isRTL() ? 'ArrowLeft' : 'ArrowRight'; const back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) { e.preventDefault(); setActive(st.active + 1); }
    else if (e.key === back) { e.preventDefault(); setActive(st.active - 1); }
    else if (e.key === '+' || e.key === '=') zoom(1.4); else if (e.key === '-') zoom(1 / 1.4); else if (e.key === '0') { st.scale = 1; st.cx = 50; st.cy = 50; render(); }
  });
  // drag / pinch
  const pts = new Map(); let moved = false; let start = null;
  frame.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    start = { scale: st.scale, cx: st.cx, cy: st.cy, pts: new Map(pts) };
    if (st.scale > 1 || pts.size > 1) frame.setPointerCapture(e.pointerId);
  });
  frame.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1 && st.scale > 1) {
      const p0 = start.pts.get(e.pointerId); if (!p0) return;
      const dx = e.clientX - p0.x; const dy = e.clientY - p0.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) { cancelAnimationFrame(st.anim); st.cx = start.cx - dx / (st.scale * st.fw) * 100; st.cy = start.cy - dy / (st.scale * st.fh) * 100; clampCenter(); render(); }
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const [a0, b0] = [...start.pts.values()];
      if (!a0 || !b0) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y); const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1;
      moved = true; st.scale = Math.max(1, Math.min(4, start.scale * d / d0)); clampCenter(); render();
    }
  });
  const end = (e) => { pts.delete(e.pointerId); if (!pts.size) setTimeout(() => { moved = false; }, 0); start = pts.size ? { scale: st.scale, cx: st.cx, cy: st.cy, pts: new Map(pts) } : null; };
  frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
  frame.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const r = frame.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  frame.addEventListener('dblclick', (e) => { const r = frame.getBoundingClientRect(); if (st.scale > 1.2) { st.scale = 1; st.cx = 50; st.cy = 50; render(); } else zoom(2.2, e.clientX - r.left, e.clientY - r.top); });
  function clampCenter() { const h = 50 / st.scale; st.cx = Math.min(100 - h, Math.max(h, st.cx)); st.cy = Math.min(100 - h, Math.max(h, st.cy)); }

  function toggleFull() {
    const btn = root.querySelector('[data-sv="full"]');
    if (document.fullscreenElement === sv) { document.exitFullscreen(); return; }
    if (sv.requestFullscreen && !sv.classList.contains('sv-max')) {
      sv.requestFullscreen().catch(() => { sv.classList.toggle('sv-max'); afterResize(); });
    } else { sv.classList.toggle('sv-max'); document.body.classList.toggle('has-modal', sv.classList.contains('sv-max')); afterResize(); }
    btn.innerHTML = icon('minimize');
  }
  const onFs = () => { const btn = root.querySelector('[data-sv="full"]'); if (btn) btn.innerHTML = icon(document.fullscreenElement === sv || sv.classList.contains('sv-max') ? 'minimize' : 'maximize'); setTimeout(afterResize, 60); };
  document.addEventListener('fullscreenchange', onFs);
  function afterResize() { measure(); render(); }
  const ro = new ResizeObserver(() => { const w = st.fw; measure(); if (Math.abs(w - st.fw) > 1 || !w) render(); });
  ro.observe(frame);

  loadScreen();
  const firstStep = model.steps[st.active];
  if (firstStep && firstStep.s !== st.screen) { st.screen = firstStep.s; loadScreen(); }
  img.addEventListener('load', () => { if (st.focus && model.steps[st.active] && st.scale === 1) animateTo(focusTarget(model.steps[st.active])); }, { once: true });

  return {
    setActive,
    get active() { return st.active; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() { ro.disconnect(); cancelAnimationFrame(st.anim); document.removeEventListener('fullscreenchange', onFs); listeners.clear(); if (sv.classList.contains('sv-max')) document.body.classList.remove('has-modal'); }
  };
}

// Build a viewer model from a transaction + generated geometry, or from an administrator annotation file.
export function builtInModel(tx, geo) {
  if (!geo) return null;
  return {
    simulated: true,
    screens: geo.screens.map((s) => ({ ...s })),
    steps: tx.steps.map((s, i) => {
      const g = geo.fields[s.f];
      return g ? { n: i + 1, s: g.s, box: g.box, target: g.target, dir: g.dir, title: s.t, desc: s.d } : { n: i + 1, s: 0, title: s.t, desc: s.d };
    })
  };
}
export function annotationModel(json, lang) {
  return {
    simulated: json.source === 'authentic' ? false : json.source === 'simulated' ? true : 'supplied',
    screens: [{ src: json.screenshot.startsWith('data:') || json.screenshot.includes('/') ? json.screenshot : 'images/screens/' + json.screenshot, w: json.width || 0, h: json.height || 0, kind: 'main', label: json.title ? { [lang]: json.title } : null }],
    steps: (json.steps || []).map((s) => ({ n: s.id, s: 0, x: s.x, y: s.y, arrow: s.arrow, box: s.box ? [s.box.x, s.box.y, s.box.w, s.box.h] : null, title: { [json.language || lang]: s.title }, desc: { [json.language || lang]: s.description } }))
  };
}
