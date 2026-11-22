// Simulated SAP GUI screen renderer (SVG) used by tools/generate-screens.mjs.
// Produces clearly labelled TRAINING SIMULATIONS — not real SAP screenshots.
export const W = 1120;
export const H = 700;
const FONT = 'Arial, Helvetica, sans-serif';
const MONO = 'Consolas, Menlo, monospace';
export const C = {
  shell: '#354A5F', bg: '#F5F6F7', panel: '#FFFFFF', border: '#D5D9DE', label: '#32363A', text: '#32363A',
  muted: '#6A6D70', inputBorder: '#8C949C', disp: '#EEF0F2', brand: '#0A6ED1', sel: '#E2EEFB', head: '#EEF1F4',
  green: '#107E3E', red: '#BB0000', amber: '#E9730C', blue: '#0A6ED1', row2: '#FAFBFC'
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const tw = (s, size = 13) => String(s).length * size * 0.56;

export class Screen {
  constructor(file, o) {
    this.file = file;
    this.o = Object.assign({ title: '', tcode: '', appbar: [], status: null }, o);
    this.parts = [];
    this.fields = {};
    this.chrome();
  }
  add(s) { this.parts.push(s); }
  reg(key, box, dir = 'top', inner) {
    if (!key) return;
    this.fields[key] = { box: box.map((n) => Math.round(n)), dir, inner: (inner || box).map((n) => Math.round(n)) };
  }
  mark(key, box, dir = 'top') { this.reg(key, box, dir); return box; }
  text(x, y, s, o = {}) {
    const { size = 13, weight = 400, fill = C.text, anchor = 'start', family = FONT } = o;
    this.add(`<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`);
  }
  rect(x, y, w, h, o = {}) {
    const { fill = 'none', stroke = 'none', sw = 1, rx = 0, extra = '' } = o;
    this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`);
  }
  line(x1, y1, x2, y2, stroke = C.border, sw = 1) { this.add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"/>`); }

  icon(name, x, y, color = C.text) {
    const s = { stroke: color, fill: 'none' };
    const P = (d, o = {}) => this.add(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || color}" stroke-width="${o.sw || 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`);
    switch (name) {
      case 'exec': this.add(`<circle cx="${x + 8}" cy="${y + 8}" r="6.5" fill="none" stroke="${color}" stroke-width="1.6"/>`); P(`M${x + 8} ${y + 4}v4l3 2`); break;
      case 'check': P(`M${x + 2} ${y + 8}l4 4l8 -8`); break;
      case 'save': this.rect(x + 2, y + 2, 12, 12, { stroke: color, sw: 1.5, rx: 1.5 }); this.rect(x + 5, y + 2, 6, 4, { fill: color }); break;
      case 'sum': this.text(x + 3, y + 13, 'Σ', { size: 15, weight: 700, fill: color }); break;
      case 'grid': for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) this.rect(x + 2 + i * 4.5, y + 2 + j * 4.5, 3.4, 3.4, { fill: color }); break;
      case 'filter': P(`M${x + 2} ${y + 3}h12l-4.5 5.5v5l-3 -1.5v-3.5z`); break;
      case 'sortA': P(`M${x + 5} ${y + 13}v-10m-3 3l3 -3l3 3`); P(`M${x + 11} ${y + 3}v10m-3 -3l3 3l3 -3`); break;
      case 'refresh': P(`M${x + 13} ${y + 8}a5 5 0 1 1 -1.5 -3.6`); P(`M${x + 13} ${y + 2}v3.5h-3.5`); break;
      case 'doc': P(`M${x + 4} ${y + 2}h6l3 3v9h-9z`); P(`M${x + 6} ${y + 8}h5M${x + 6} ${y + 11}h5`); break;
      case 'pencil': P(`M${x + 3} ${y + 13}l1 -4l7 -7l3 3l-7 7z`); break;
      case 'glasses': this.add(`<circle cx="${x + 4.5}" cy="${y + 9}" r="3" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="${x + 11.5}" cy="${y + 9}" r="3" fill="none" stroke="${color}" stroke-width="1.5"/>`); P(`M${x + 7.5} ${y + 9}h1`); break;
      case 'plus': P(`M${x + 8} ${y + 3}v10M${x + 3} ${y + 8}h10`); break;
      case 'truck': this.rect(x + 1, y + 4, 9, 7, { stroke: color, sw: 1.4 }); P(`M${x + 10} ${y + 6}h3l2 3v2h-5`); break;
      case 'folder': P(`M${x + 2} ${y + 4}h4l2 2h6v7h-12z`); break;
      case 'info': this.add(`<circle cx="${x + 8}" cy="${y + 8}" r="6.5" fill="none" stroke="${color}" stroke-width="1.5"/>`); P(`M${x + 8} ${y + 7}v4M${x + 8} ${y + 5}v0.2`); break;
      case 'flow': this.rect(x + 1, y + 2, 5, 4, { stroke: color, sw: 1.3 }); this.rect(x + 10, y + 10, 5, 4, { stroke: color, sw: 1.3 }); P(`M${x + 3.5} ${y + 6}v6h6.5`); break;
      case 'lock': this.rect(x + 3, y + 7, 10, 7, { stroke: color, sw: 1.4, rx: 1 }); P(`M${x + 5} ${y + 7}v-2a3 3 0 0 1 6 0v2`); break;
      case 'arrowR': P(`M${x + 3} ${y + 8}h10m-3 -3l3 3l-3 3`); break;
      case 'print': this.rect(x + 2, y + 6, 12, 6, { stroke: color, sw: 1.4 }); P(`M${x + 5} ${y + 6}v-3h6v3M${x + 5} ${y + 12}v2h6v-2`); break;
      default: break;
    }
  }

  chrome() {
    const o = this.o;
    this.rect(0, 0, W, H, { fill: C.bg });
    this.rect(0, 0, W, 44, { fill: C.shell });
    this.rect(12, 9, 70, 26, { fill: 'rgba(255,255,255,0.14)', rx: 4 });
    this.text(22, 27, 'Menu', { fill: '#FFFFFF', size: 13 });
    this.add(`<path d="M66 19l4 4l4 -4" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>`);
    this.add(`<path d="M104 22h-10m4 -4l-4 4l4 4" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`);
    this.add(`<path d="M120 16l10 12M130 16l-10 12" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>`);
    this.text(150, 28, o.title, { fill: '#FFFFFF', size: 15, weight: 600 });
    this.rect(W - 352, 9, 160, 26, { fill: '#FFFFFF', rx: 4 });
    this.text(W - 343, 27, '/n' + (o.tcode || ''), { size: 12.5, fill: '#4A5A6A', family: MONO });
    this.rect(W - 180, 10, 168, 24, { fill: C.amber, rx: 12 });
    this.text(W - 96, 26, 'Training simulation', { fill: '#FFFFFF', size: 12, weight: 700, anchor: 'middle' });
    this.rect(0, 44, W, 40, { fill: '#FFFFFF' });
    this.line(0, 84, W, 84, C.border);
    let x = 12;
    for (const b of o.appbar) {
      if (b.right) continue;
      const box = this.button(x, 51, b.l, b);
      x = box[0] + box[2] + 8 + (b.gap || 0);
    }
    let rx = W - 12;
    for (const b of [...o.appbar].filter((b) => b.right).reverse()) {
      const wdt = this.btnWidth(b.l, b);
      rx -= wdt;
      this.button(rx, 51, b.l, b);
      rx -= 8;
    }
    // faint diagonal watermark
    this.add(`<text x="${W / 2}" y="${H / 2 + 40}" font-family="${FONT}" font-size="92" font-weight="700" fill="#0A3D62" opacity="0.035" text-anchor="middle" transform="rotate(-16 ${W / 2} ${H / 2})">SIMULATION</text>`);
  }
  btnWidth(label, o = {}) { return Math.round((label ? tw(label, 13) + 22 : 10) + (o.icon ? (label ? 20 : 18) : 0)); }
  button(x, y, label, o = {}) {
    const { primary = false, icon = null, k = null, dir = 'bottom', h = 26 } = o;
    const w = this.btnWidth(label, o);
    this.rect(x, y, w, h, { fill: primary ? C.brand : '#FFFFFF', stroke: primary ? C.brand : '#9AA3AC', rx: 4 });
    let tx = x + 11;
    if (icon) { this.icon(icon, x + 7, y + 5, primary ? '#FFFFFF' : C.text); tx += label ? 18 : 0; }
    if (label) this.text(tx, y + 17.5, label, { fill: primary ? '#FFFFFF' : C.text, weight: primary ? 700 : 400 });
    const box = [x, y, w, h];
    if (k) this.reg(k, [x - 3, y - 3, w + 6, h + 6], dir, box);
    return box;
  }
  input(x, y, w, v = '', o = {}) {
    const { type = 'text', h = 24, mono = false } = o;
    const disp = type === 'display';
    this.rect(x, y, w, h, { fill: disp ? C.disp : '#FFFFFF', stroke: disp ? '#D3D8DD' : C.inputBorder, rx: 2 });
    if (!disp) this.line(x + 1, y + h - 0.5, x + w - 1, y + h - 0.5, '#5B6672', 1);
    if (v !== '' && v != null) this.text(x + 6, y + 16.5, v, { family: mono ? MONO : FONT, size: mono ? 12.5 : 13 });
    if (type === 'select') this.add(`<path d="M${x + w - 16} ${y + 10}l4 4l4 -4" fill="none" stroke="#5B6672" stroke-width="1.5"/>`);
    return [x, y, w, h];
  }
  field(k, x, y, o = {}) {
    const { l = '', lw = 160, v = '', w = 150, type = 'text', dir = 'right', to = null, toW = null, multi = false, mono = false, suffix = null } = o;
    if (l) this.text(x, y + 16.5, l, { fill: C.label });
    const ix = x + (l ? lw : 0);
    const inBox = this.input(ix, y, w, v, { type, mono });
    let right = ix + w;
    if (suffix) { this.text(right + 10, y + 16.5, suffix, { fill: C.muted }); right += 10 + tw(suffix); }
    if (to !== null) {
      this.text(right + 12, y + 16.5, 'to', { fill: C.label });
      this.input(right + 34, y, toW || w, to, { type, mono });
      right = right + 34 + (toW || w);
    }
    if (multi) {
      this.rect(right + 10, y + 2, 24, 20, { fill: '#FFFFFF', stroke: '#9AA3AC', rx: 3 });
      this.add(`<path d="M${right + 16} ${y + 12}h10m-3 -3l3 3l-3 3" fill="none" stroke="${C.text}" stroke-width="1.4"/>`);
      right += 34;
    }
    const box = [x - 5, y - 4, right - x + 10, 32];
    if (k) this.reg(k, box, dir, dir === 'right' ? [ix, y, right - ix, 24] : inBox);
    return box;
  }
  check(k, x, y, label, checked = false, dir = 'right') {
    this.rect(x, y + 4, 16, 16, { fill: '#FFFFFF', stroke: C.inputBorder, rx: 2 });
    if (checked) this.add(`<path d="M${x + 3.5} ${y + 12}l3.5 3.5l6 -7" fill="none" stroke="${C.brand}" stroke-width="2"/>`);
    this.text(x + 24, y + 16.5, label, { fill: C.label });
    const box = [x - 5, y - 2, 30 + tw(label), 28];
    if (k) this.reg(k, box, dir);
    return box;
  }
  radio(x, y, label, on = false) {
    this.add(`<circle cx="${x + 8}" cy="${y + 12}" r="7.5" fill="#FFFFFF" stroke="${C.inputBorder}" stroke-width="1"/>`);
    if (on) this.add(`<circle cx="${x + 8}" cy="${y + 12}" r="4" fill="${C.brand}"/>`);
    this.text(x + 24, y + 16.5, label, { fill: C.label });
    return [x - 4, y - 2, 30 + tw(label), 28];
  }
  group(x, y, w, h, title) {
    this.rect(x, y, w, h, { fill: C.panel, stroke: C.border, rx: 6 });
    if (title) { this.text(x + 14, y + 22, title, { weight: 700, size: 13.5 }); this.line(x + 1, y + 32, x + w - 1, y + 32, '#E8EBEE'); }
    return [x, y, w, h];
  }
  dialog(x, y, w, h, title) {
    this.rect(x + 4, y + 6, w, h, { fill: 'rgba(16,32,48,0.18)', rx: 8 });
    this.rect(x, y, w, h, { fill: '#FFFFFF', stroke: '#B9C0C7', rx: 8 });
    this.rect(x, y, w, 36, { fill: '#F2F4F6', rx: 8 });
    this.rect(x, y + 28, w, 8, { fill: '#F2F4F6' });
    this.line(x, y + 36, x + w, y + 36, C.border);
    this.text(x + 14, y + 23, title, { weight: 700, size: 14 });
    return [x, y, w, h];
  }
  tabs(x, y, labels, active = 0, keys = {}, dir = 'top') {
    let cx = x;
    const boxes = [];
    labels.forEach((l, i) => {
      const w = tw(l, 13) + 26;
      if (i === active) {
        this.rect(cx, y, w, 30, { fill: '#FFFFFF' });
        this.line(cx + 4, y + 29, cx + w - 4, y + 29, C.brand, 3);
        this.text(cx + 13, y + 20, l, { fill: C.brand, weight: 700 });
      } else this.text(cx + 13, y + 20, l, { fill: C.muted });
      const b = [cx, y, w, 30];
      boxes.push(b);
      if (keys[i]) this.reg(keys[i], [cx - 2, y - 2, w + 4, 34], dir, b);
      cx += w + 2;
    });
    this.line(x, y + 30, cx, y + 30, '#E1E5E9');
    return boxes;
  }
  cell(x, y, w, h, v, align) {
    if (v == null || v === '') return;
    const s = String(v);
    if (s === '[x]' || s === '[ ]') {
      this.rect(x + w / 2 - 7, y + h / 2 - 7, 14, 14, { fill: '#FFFFFF', stroke: C.inputBorder, rx: 2 });
      if (s === '[x]') this.add(`<path d="M${x + w / 2 - 4} ${y + h / 2}l3 3l5 -6" fill="none" stroke="${C.brand}" stroke-width="2"/>`);
      return;
    }
    const m = s.match(/^@(g|y|r)(?:\s(.*))?$/);
    if (m) {
      const col = { g: C.green, y: '#E5B000', r: C.red }[m[1]];
      this.add(`<circle cx="${x + 12}" cy="${y + h / 2}" r="5.5" fill="${col}"/>`);
      if (m[2]) this.text(x + 24, y + h / 2 + 4.5, m[2], { size: 12.5 });
      return;
    }
    const tri = s.match(/^([▾▸])(\d)\s(.*)$/);
    if (tri) {
      const ind = Number(tri[2]) * 16;
      this.add(`<path d="${tri[1] === '▾' ? `M${x + 8 + ind} ${y + h / 2 - 2}l4 4l4 -4` : `M${x + 10 + ind} ${y + h / 2 - 4}l4 4l-4 4`}" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`);
      this.text(x + 26 + ind, y + h / 2 + 4.5, tri[3], { size: 12.5 });
      return;
    }
    const ind = s.match(/^·(\d)\s(.*)$/);
    if (ind) { this.text(x + 26 + Number(ind[1]) * 16, y + h / 2 + 4.5, ind[2], { size: 12.5 }); return; }
    const neg = /^-[\d.,]/.test(s);
    if (align === 'r') this.text(x + w - 8, y + h / 2 + 4.5, s, { size: 12.5, anchor: 'end', fill: neg ? C.red : C.text });
    else if (align === 'c') this.text(x + w / 2, y + h / 2 + 4.5, s, { size: 12.5, anchor: 'middle' });
    else this.text(x + 8, y + h / 2 + 4.5, s, { size: 12.5 });
  }
  table(x, y, o) {
    const { cols, rows = [], rowH = 26, headH = 30, sel = -1, totals = null, k = null, dir = 'top', rowKeys = {}, colKeys = {}, rowDir = 'right', colDir = 'top', selector = true } = o;
    const sw = selector ? 18 : 0;
    const w = sw + cols.reduce((a, c) => a + c.w, 0);
    const n = rows.length + (totals ? 1 : 0);
    const h = headH + n * rowH;
    this.rect(x, y, w, h, { fill: '#FFFFFF', stroke: C.border });
    this.rect(x, y, w, headH, { fill: C.head });
    rows.forEach((r, i) => {
      const ry = y + headH + i * rowH;
      if (i === sel) this.rect(x, ry, w, rowH, { fill: C.sel });
      else if (i % 2 === 1) this.rect(x, ry, w, rowH, { fill: C.row2 });
    });
    if (totals) this.rect(x, y + headH + rows.length * rowH, w, rowH, { fill: '#FFF7E6' });
    if (selector) { this.line(x + sw, y, x + sw, y + h, '#E4E8EC'); rows.forEach((r, i) => { if (i === sel) this.rect(x + 4, y + headH + i * rowH + rowH / 2 - 5, 10, 10, { fill: C.brand, rx: 2 }); }); }
    let cx = x + sw;
    const colBoxes = [];
    cols.forEach((c, ci) => {
      this.text(c.align === 'r' ? cx + c.w - 8 : cx + 8, y + 19.5, c.l, { size: 12.5, weight: 700, anchor: c.align === 'r' ? 'end' : 'start' });
      rows.forEach((r, i) => this.cell(cx, y + headH + i * rowH, c.w, rowH, r[ci], c.align));
      if (totals) this.cell(cx, y + headH + rows.length * rowH, c.w, rowH, totals[ci], c.align);
      if (ci > 0) this.line(cx, y, cx, y + h, '#E4E8EC');
      colBoxes.push([cx, y, c.w, h]);
      if (colKeys[ci]) this.reg(colKeys[ci], [cx - 2, y - 2, c.w + 4, h + 4], colDir, [cx, y, c.w, headH]);
      cx += c.w;
    });
    for (let i = 1; i <= n; i++) this.line(x, y + headH + i * rowH - (i === n ? 0 : 0), x + w, y + headH + i * rowH, '#EEF0F2');
    this.line(x, y + headH, x + w, y + headH, '#CDD3D9');
    Object.entries(rowKeys).forEach(([i, key]) => { const ry = y + headH + Number(i) * rowH; this.reg(key, [x - 2, ry - 2, w + 4, rowH + 4], rowDir, [x, ry, w, rowH]); });
    if (k) this.reg(k, [x - 3, y - 3, w + 6, h + 6], dir, [x, y, w, headH]);
    return { box: [x, y, w, h], colBoxes, rowY: (i) => y + headH + i * rowH, w, h };
  }
  alvToolbar(x, y, k = null, dir = 'right') {
    const icons = ['glasses', 'sortA', 'filter', 'sum', 'grid', 'print', 'doc'];
    icons.forEach((ic, i) => { this.rect(x + i * 30, y, 26, 24, { fill: '#FFFFFF', stroke: '#C2C9D0', rx: 3 }); this.icon(ic, x + i * 30 + 5, y + 4, C.text); });
    const box = [x - 3, y - 3, icons.length * 30 + 2, 30];
    if (k) this.reg(k, box, dir);
    return box;
  }
  tree(x, y, w, nodes, o = {}) {
    const { rowH = 26, sel = -1, keys = {}, dir = 'right' } = o;
    nodes.forEach((n, i) => {
      const ry = y + i * rowH;
      if (i === sel) this.rect(x, ry, w, rowH, { fill: C.sel });
      const ind = x + 8 + n.lvl * 18;
      if (n.kids) this.add(`<path d="${n.open ? `M${ind} ${ry + 11}l4 4l4 -4` : `M${ind + 2} ${ry + 9}l4 4l-4 4`}" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`);
      this.icon(n.icon || 'folder', ind + 14, ry + 5, n.icon === 'doc' ? C.muted : '#C08A00');
      this.text(ind + 34, ry + 17.5, n.t, { size: 12.5, weight: i === sel ? 700 : 400 });
      if (keys[i]) this.reg(keys[i], [x, ry - 1, w, rowH + 2], dir, [ind, ry, Math.min(w - (ind - x), tw(n.t, 12.5) + 40), rowH]);
    });
    return [x, y, w, nodes.length * rowH];
  }
  status(type, msg, k = 'status', dir = 'top') {
    this.rect(0, H - 32, W, 32, { fill: '#EEF1F4' });
    this.line(0, H - 32, W, H - 32, C.border);
    const cy = H - 16;
    const col = { success: C.green, error: C.red, warning: '#E5B000', info: C.blue }[type] || C.blue;
    this.add(`<circle cx="22" cy="${cy}" r="8" fill="${col}"/>`);
    if (type === 'success') this.add(`<path d="M18 ${cy}l3 3l5 -6" fill="none" stroke="#FFFFFF" stroke-width="2"/>`);
    else if (type === 'error') this.add(`<path d="M19 ${cy - 3}l6 6M25 ${cy - 3}l-6 6" stroke="#FFFFFF" stroke-width="2"/>`);
    else this.add(`<path d="M22 ${cy - 4}v5M22 ${cy + 3}v0.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`);
    this.text(38, cy + 4.5, msg, { size: 13 });
    this.text(W - 14, cy + 4.5, 'SIM (100)  |  TRAINEE01', { size: 12, fill: C.muted, anchor: 'end' });
    const box = [8, H - 30, tw(msg) + 44, 28];
    if (k) this.reg(k, box, dir);
  }
  footer() {
    // keeps the status area visually consistent when no message is shown
    if (!this.parts.some((p) => p.includes('SIM (100)'))) {
      this.rect(0, H - 32, W, 32, { fill: '#EEF1F4' });
      this.line(0, H - 32, W, H - 32, C.border);
      this.text(W - 14, H - 11.5, 'SIM (100)  |  TRAINEE01', { size: 12, fill: C.muted, anchor: 'end' });
    }
  }
  svg() {
    this.footer();
    const label = `Training simulation of transaction ${this.o.tcode}: ${this.o.title}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${this.parts.join('')}</svg>`;
  }
  geometry() {
    const pct = (v, d) => Math.round((v / d) * 10000) / 100;
    const out = {};
    for (const [k, f] of Object.entries(this.fields)) {
      const [ix, iy, iw, ih] = f.inner;
      let t;
      if (f.dir === 'top') t = [ix + Math.min(iw / 2, 60), iy];
      else if (f.dir === 'bottom') t = [ix + Math.min(iw / 2, 60), iy + ih];
      else if (f.dir === 'left') t = [f.box[0], f.box[1] + f.box[3] / 2];
      else t = [ix + iw, iy + ih / 2];
      out[k] = { box: [pct(f.box[0], W), pct(f.box[1], H), pct(f.box[2], W), pct(f.box[3], H)], target: [pct(t[0], W), pct(t[1], H)], dir: f.dir };
    }
    return out;
  }
}

// Helper: standard selection screen inside a group box.
export function selection(s, x, y, w, title, rows, o = {}) {
  const lw = o.lw || 190;
  const rh = 34;
  const h = 44 + rows.length * rh;
  s.group(x, y, w, h, title);
  rows.forEach((r, i) => {
    const ry = y + 42 + i * rh;
    if (r.type === 'check') s.check(r.k, x + 16, ry, r.l, r.v, r.dir || 'right');
    else if (r.type === 'radio') {
      let rx = x + 16;
      const boxes = r.options.map((op, j) => { const b = s.radio(rx, ry, op, j === r.sel); rx += b[2] + 24; return b; });
      if (r.k) { const last = boxes[boxes.length - 1]; s.reg(r.k, [x + 10, ry - 3, last[0] + last[2] - x - 4, 30], r.dir || 'right'); }
    } else s.field(r.k, x + 16, ry, Object.assign({ lw, w: 150, multi: r.to !== undefined }, r));
  });
  return [x, y, w, h];
}
export function union(...boxes) {
  const x1 = Math.min(...boxes.map((b) => b[0])); const y1 = Math.min(...boxes.map((b) => b[1]));
  const x2 = Math.max(...boxes.map((b) => b[0] + b[2])); const y2 = Math.max(...boxes.map((b) => b[1] + b[3]));
  return [x1, y1, x2 - x1, y2 - y1];
}
