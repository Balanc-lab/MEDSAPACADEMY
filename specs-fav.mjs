// Shipment, group, WM stock and WM inventory transactions added from common favorites lists.
import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv } from './kit.mjs';

const sel = (file, tcode, title) => new Screen(file, { tcode, title, appbar: [EXEC, { l: 'Get Variant' }, HELP] });
const list = (file, tcode, title, extra = []) => new Screen(file, { tcode, title, appbar: [...extra, { l: 'Refresh', icon: 'refresh' }, HELP] });
const SAVE = { l: 'Save', icon: 'save', k: 'save', dir: 'right', gap: 60 };

export default {
  VT02N() {
    const a = new Screen('vt02n-1', { tcode: 'VT02N', title: 'Change Shipment: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, HELP] });
    selection(a, 12, 96, 640, 'Shipment', [{ k: 'shp', l: 'Shipment Number', v: '1000123', w: 120, mono: true }]);
    const b = new Screen('vt02n-2', { tcode: 'VT02N', title: 'Change Shipment 1000123: Overview', appbar: [SAVE, { l: 'Shipment contents', icon: 'truck' }, HELP] });
    b.group(12, 96, 700, 150, 'Identification');
    const h = kv(b, 30, 150, [['Shipment Number', '1000123'], ['Shipment type', '0001  Individual shipment'], ['Transportation plng pt', '1000'], ['Forwarding agent', '300010  Demo Carrier'], ['Route', 'R0001']], { lw: 180, vw: 280, rowH: 19 });
    b.reg('hdr', h, 'right');
    b.group(12, 256, W - 24, 130, 'Deadlines');
    const stages = ['Planning', 'Check-in', 'Loading start', 'Loading end', 'Shipment completion', 'Shipment start', 'Shipment end'];
    const done = 2;
    const bx = [];
    let x = 26;
    stages.forEach((l, i) => {
      const box = b.button(x, 300, l, { icon: i < done ? 'check' : 'exec', primary: i === done });
      b.text(x + 4, 348, i < done ? (i === 0 ? '20.11.2026 07:40' : '21.11.2026 08:10') : '', { size: 11.5, fill: C.muted });
      bx.push(box); x = box[0] + box[2] + 8;
    });
    b.reg('stages', union(...bx), 'bottom', bx[done]);
    b.table(12, 400, {
      cols: [{ l: 'Delivery', w: 110 }, { l: 'Ship-to party', w: 200 }, { l: 'Weight', w: 90, align: 'r' }, { l: 'WUn', w: 50 }, { l: 'Pick st.', w: 70 }, { l: 'GI st.', w: 70 }],
      rows: [['80001234', 'Demo Customer A', '381.5', 'KG', 'C', 'A'], ['80001235', 'Demo Customer B', '230.5', 'KG', 'C', 'A'], ['80001240', 'Demo Customer A', '88.0', 'KG', 'B', 'A']],
      sel: 0, k: 'dlv', dir: 'right'
    });
    return [a, b];
  },

  VT11() {
    const a = sel('vt11-1', 'VT11', 'Select Shipments: Materials Planning');
    selection(a, 12, 96, 760, 'Selection', [
      { k: 'sel_tpp', l: 'Transportation plng pt', v: '1000', w: 70 },
      { l: 'Shipment type', v: '', to: '', w: 70 },
      { l: 'Forwarding agent', v: '', to: '', w: 110 }
    ]);
    selection(a, 12, 262, 760, 'Status', [
      { type: 'radio', k: 'sel_status', options: ['Planned', 'Checked in', 'Loading started', 'All'], sel: 0 }
    ]);
    selection(a, 12, 360, 760, 'Dates', [
      { k: 'sel_dates', l: 'Planned date', v: '21.11.2026', to: '22.11.2026', w: 110 }
    ]);
    const b = list('vt11-2', 'VT11', 'Shipments: Materials Planning', [{ l: 'Shipment', icon: 'truck' }]);
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Shipment', w: 100 }, { l: 'ShTy', w: 60 }, { l: 'Forwarding agent', w: 190 }, { l: 'Route', w: 80 }, { l: 'Status', w: 110 }, { l: 'Planned date', w: 110 }, { l: 'Time', w: 70 }, { l: 'Deliveries', w: 90, align: 'r' }],
      rows: [['1000123', '0001', 'Demo Carrier', 'R0001', 'Planned', '21.11.2026', '09:00', '3'], ['1000124', '0001', 'Demo Carrier', 'R0002', 'Planned', '21.11.2026', '13:30', '2'], ['1000127', '0002', 'Demo Freight', 'R0001', 'Planned', '22.11.2026', '08:00', '5']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  VT12() {
    const a = sel('vt12-1', 'VT12', 'Select Shipments: Transportation Processing');
    selection(a, 12, 96, 760, 'Selection', [
      { k: 'sel_tpp', l: 'Transportation plng pt', v: '1000', w: 70 },
      { l: 'Planned date', v: '21.11.2026', to: '21.11.2026', w: 110 }
    ]);
    selection(a, 12, 228, 760, 'Status', [
      { type: 'radio', k: 'sel_status', options: ['Planned', 'Checked in', 'Loading started', 'All'], sel: 0 }
    ]);
    const b = new Screen('vt12-2', { tcode: 'VT12', title: 'Shipments: Transportation Processing', appbar: [{ l: 'Check-in', icon: 'check', k: 'res_act', dir: 'right', gap: 60 }, { l: 'Loading start' }, { l: 'Loading end' }, HELP] });
    b.alvToolbar(12, 110);
    b.table(12, 164, {
      cols: [{ l: 'Shipment', w: 100 }, { l: 'Forwarding agent', w: 190 }, { l: 'Status', w: 110 }, { l: 'Planned date', w: 110 }, { l: 'Check-in', w: 120 }, { l: 'Loading start', w: 120 }],
      rows: [['1000123', 'Demo Carrier', 'Planned', '21.11.2026', '', ''], ['1000124', 'Demo Carrier', 'Planned', '21.11.2026', '', ''], ['1000125', 'Demo Freight', 'Planned', '21.11.2026', '', '']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  VG02() {
    const a = new Screen('vg02-1', { tcode: 'VG02', title: 'Change Group: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, HELP] });
    selection(a, 12, 96, 640, 'Group', [{ k: 'group', l: 'Group', v: '4711', w: 120, mono: true }]);
    const b = new Screen('vg02-2', { tcode: 'VG02', title: 'Change Group 4711: Overview', appbar: [SAVE, { l: 'Delete line' }, HELP] });
    b.group(12, 96, 700, 128, 'Group data');
    b.reg('hdr', kv(b, 30, 150, [['Group', '4711'], ['Group type', 'K  WM group'], ['Description', 'Noon wave'], ['Warehouse number', '100']], { lw: 170, vw: 260, rowH: 19 }), 'right');
    b.table(12, 240, {
      cols: [{ l: 'Document', w: 120 }, { l: 'Doc. type', w: 90 }, { l: 'Ship-to party', w: 200 }, { l: 'Shipping pt', w: 100 }, { l: 'GI date', w: 110 }],
      rows: [['80001234', 'LF', 'Demo Customer A', '1000', '21.11.2026'], ['80001235', 'LF', 'Demo Customer B', '1000', '21.11.2026'], ['80001240', 'LF', 'Demo Customer A', '1000', '21.11.2026'], ['', '', '', '', '']],
      sel: 2, k: 'docs', dir: 'right'
    });
    return [a, b];
  },

  LT26() {
    const a = sel('lt26-1', 'LT26', 'Transfer Orders for Storage Bin');
    selection(a, 12, 96, 760, 'Storage bin', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Storage Type', v: '001', w: 70 },
      { k: 'sel_bin', l: 'Storage Bin', v: '01-03-02', w: 120, mono: true },
      { l: 'Creation date', v: '', to: '', w: 110 }
    ]);
    const b = list('lt26-2', 'LT26', 'Transfer Orders for Storage Bin 01-03-02', [{ l: 'Display TO', icon: 'glasses' }]);
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'TO Number', w: 96 }, { l: 'Item', w: 46, align: 'r' }, { l: 'Material', w: 100 }, { l: 'Src Typ', w: 64 }, { l: 'Source Bin', w: 104 }, { l: 'Dst Typ', w: 64 }, { l: 'Dest. Bin', w: 104 }, { l: 'Qty', w: 70, align: 'r' }, { l: 'Confirmed', w: 100 }, { l: 'User', w: 96 }],
      rows: [['4602', '1', 'DEMO-1001', '902', 'GR-AREA', '001', '01-03-02', '100', '18.11.2026', 'TRAINEE02'], ['4611', '1', 'DEMO-1001', '001', '01-03-02', '916', '80001234', '30', '20.11.2026', 'TRAINEE03'], ['4630', '1', 'DEMO-1001', '001', '01-03-02', '916', '80001240', '30', '', '']],
      sel: 1, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  LQ01() {
    const a = sel('lq01-1', 'LQ01', 'Posting Change Stor. Loc. to Stor. Loc. in Inventory Management');
    a.group(12, 96, 760, 260, 'Selections');
    const f = [
      a.field(null, 28, 136, { l: 'Warehouse Number', lw: 210, v: '100', w: 60 }),
      a.field(null, 28, 166, { l: 'Storage Type', lw: 210, v: '916', w: 60, to: '', toW: 60 }),
      a.field(null, 28, 196, { l: 'Plant', lw: 210, v: '1000', w: 60 }),
      a.field(null, 28, 226, { l: 'Quant', lw: 210, v: '', w: 100, to: '', toW: 100 }),
      a.field(null, 28, 256, { l: 'Storage Bin', lw: 210, v: '', w: 100, to: '', toW: 100 }),
      a.field(null, 28, 286, { l: 'Material Number', lw: 210, v: '', w: 130, to: '', toW: 130 })
    ];
    const q = a.check(null, 28, 318, 'Quantity Selection', false);
    a.mark('sel_whse', union(f[0], f[2]), 'right');
    a.mark('sel_quant', union(f[3], f[5], q), 'right');
    a.group(12, 368, 760, 150, 'Additional Info for Posting');
    const p = [
      a.field(null, 28, 408, { l: 'Document Date', lw: 210, v: '21.11.2026', w: 100 }),
      a.field(null, 28, 438, { l: 'Posting Date', lw: 210, v: '21.11.2026', w: 100 }),
      a.field(null, 28, 468, { l: 'No. of Material Document Items', lw: 210, v: '', w: 50 })
    ];
    const m = a.check(null, 400, 470, 'Create Mail', false);
    a.mark('sel_post', union(...p, m), 'right');
    a.group(12, 530, 760, 110, 'Screen Control');
    const c = [a.check(null, 28, 568, 'Foreground/Background Control', false), a.field(null, 28, 600, { l: 'Layout', lw: 210, v: '', w: 100 })];
    a.mark('sel_ctrl', union(...c), 'right');
    const b = new Screen('lq01-2', { tcode: 'LQ01', title: 'Posting Change Stor. Loc. to Stor. Loc.: Quants', appbar: [{ l: 'Post', icon: 'save', k: 'post', dir: 'right', gap: 60 }, { l: 'Select all' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Material', w: 110 }, { l: 'Plant', w: 60 }, { l: 'Typ', w: 50 }, { l: 'Storage Bin', w: 110 }, { l: 'Quant', w: 80, align: 'r' }, { l: 'Batch', w: 100 }, { l: 'Qty', w: 80, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'Current SLoc', w: 100 }, { l: 'Target SLoc', w: 100 }],
      rows: [['DEMO-1001', '1000', '916', '80001234', '5521', 'B2026-11', '30', 'PC', '0001', '0005'], ['DEMO-1003', '1000', '916', '80001240', '5530', 'B2026-09', '12', 'PC', '0001', '0005']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  LM01() {
    const s = new Screen('lm01', { tcode: 'LM01', title: 'Dynamic Menu (RF device view)', appbar: [HELP] });
    const x = 380; const y = 100; const w = 360; const h = 520;
    s.rect(x - 14, y - 10, w + 28, h + 20, { fill: '#2A3440', rx: 26 });
    s.rect(x, y + 14, w, h - 28, { fill: '#F4F7F9', stroke: '#9AA3AC', rx: 6 });
    s.text(x + w / 2, y + 44, 'Main Menu', { anchor: 'middle', weight: 700, size: 15 });
    const opts = ['1  Inbound processing', '2  Outbound processing', '3  Stock transfer', '4  Physical inventory', '5  Inquiry', '6  Packing'];
    const rowsB = opts.map((o, i) => {
      const by = y + 64 + i * 46;
      const on = i === 1;
      s.rect(x + 20, by, w - 40, 36, { fill: on ? C.sel : '#FFFFFF', stroke: on ? C.brand : '#C2C9D0', rx: 5 });
      s.text(x + 34, by + 23, o, { size: 14, weight: on ? 700 : 400, family: "'IBM Plex Mono', monospace" });
      return [x + 20, by, w - 40, 36];
    });
    s.reg('menu', union(...rowsB), 'right');
    s.text(x + 22, y + 368, 'Choice', { fill: C.label });
    const inp = s.input(x + 90, y + 352, 60, '2', { mono: true });
    s.reg('select', [inp[0] - 4, inp[1] - 4, inp[2] + 8, inp[3] + 8], 'right', inp);
    const f7 = s.button(x + 20, y + 420, 'F7 Back');
    s.button(x + 140, y + 420, 'Enter', { primary: true });
    s.reg('back', [f7[0] - 3, f7[1] - 3, f7[2] + 6, f7[3] + 6], 'left', f7);
    s.text(40, 140, 'The menu depends on the', { fill: C.muted, size: 12.5 });
    s.text(40, 160, 'RF user settings of your', { fill: C.muted, size: 12.5 });
    s.text(40, 180, 'company and warehouse.', { fill: C.muted, size: 12.5 });
    return [s];
  },

  LX25() {
    const a = sel('lx25-1', 'LX25', 'Inventory Status');
    selection(a, 12, 96, 760, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Storage Type', v: '001', to: '005', w: 70 }
    ]);
    selection(a, 12, 228, 760, 'Options', [
      { k: 'sel_opt', l: 'Fiscal year', v: '2026', w: 70 },
      { type: 'check', l: 'List bins not yet counted', v: false }
    ]);
    const b = list('lx25-2', 'LX25', 'Inventory Status: Warehouse 100');
    b.table(12, 110, {
      cols: [{ l: 'Typ', w: 60 }, { l: 'Description', w: 190 }, { l: 'Bins', w: 80, align: 'r' }, { l: 'Active', w: 80, align: 'r' }, { l: 'Counted', w: 90, align: 'r' }, { l: 'Cleared', w: 90, align: 'r' }, { l: 'Remaining', w: 100, align: 'r' }, { l: '% done', w: 80, align: 'r' }],
      rows: [['001', 'High rack', '420', '12', '18', '350', '40', '90'], ['002', 'Shelf storage', '260', '0', '0', '260', '0', '100'], ['005', 'Bulk storage', '48', '6', '0', '20', '22', '54']],
      totals: ['', 'Total', '728', '18', '18', '630', '62', '91'], sel: 2, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  LX22() {
    const a = sel('lx22-1', 'LX22', 'Process Inventory from Overview');
    selection(a, 12, 96, 760, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Storage Type', v: '001', w: 70 }
    ]);
    selection(a, 12, 228, 760, 'Status of inventory documents', [
      { type: 'check', k: 'sel_status', l: 'Active', v: true }, { type: 'check', l: 'Counted', v: true }, { type: 'check', l: 'Recount', v: true }, { type: 'check', l: 'Cleared', v: false }
    ]);
    const b = new Screen('lx22-2', { tcode: 'LX22', title: 'Inventory Overview: Warehouse 100', appbar: [{ l: 'Count', k: 'res_act', dir: 'right', gap: 60 }, { l: 'Recount' }, { l: 'Clear differences' }, HELP] });
    b.table(12, 120, {
      cols: [{ l: 'Inv. record', w: 110 }, { l: 'Typ', w: 60 }, { l: 'Status', w: 120 }, { l: 'Bins', w: 70, align: 'r' }, { l: 'Created', w: 110 }, { l: 'Counted', w: 110 }, { l: 'Diff. items', w: 100, align: 'r' }],
      rows: [['1201', '001', 'Counted', '10', '18.11.2026', '20.11.2026', '0'], ['1202', '001', 'Counted', '12', '18.11.2026', '20.11.2026', '1'], ['1210', '005', 'Active', '6', '21.11.2026', '', '']],
      sel: 1, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  LI04() {
    const s = sel('li04', 'LI04', 'Print System Inventory Record');
    selection(s, 12, 96, 760, 'Inventory record', [
      { k: 'sel_doc', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Inventory record', v: '1202', w: 100, mono: true }
    ]);
    selection(s, 12, 228, 760, 'Print options', [
      { k: 'sel_print', l: 'Output device', v: 'WH01', w: 100 },
      { type: 'radio', options: ['Sort by storage bin', 'Sort by material'], sel: 0 },
      { type: 'check', l: 'Do not print book quantities', v: true }
    ]);
    s.status('success', 'Spool request 4711 sent to output device WH01', 'status');
    return [s];
  },

  LI14() {
    const a = new Screen('li14-1', { tcode: 'LI14', title: 'Start Inventory Recount: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, HELP] });
    selection(a, 12, 96, 640, 'Inventory record', [
      { k: 'sel_doc', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Inventory record', v: '1202', w: 100, mono: true }
    ]);
    const b = new Screen('li14-2', { tcode: 'LI14', title: 'Start Recount: Inventory Record 1202', appbar: [{ l: 'Recount', icon: 'refresh', k: 'recount', dir: 'right', gap: 60 }, HELP] });
    b.table(12, 110, {
      cols: [{ l: 'Item', w: 60, align: 'r' }, { l: 'Storage Bin', w: 110 }, { l: 'Material', w: 110 }, { l: 'Book qty', w: 90, align: 'r' }, { l: 'Counted', w: 90, align: 'r' }, { l: 'Difference', w: 100, align: 'r' }, { l: 'BUn', w: 50 }],
      rows: [['1', '01-03-01', 'DEMO-1002', '80', '80', '0', 'PC'], ['2', '01-03-02', 'DEMO-1001', '70', '30', '-40', 'PC'], ['3', '01-03-03', 'DEMO-1004', '15', '15', '0', 'PC']],
      sel: 1, k: 'res_items', dir: 'right'
    });
    b.status('success', 'Recount document 1215 created', 'status');
    return [a, b];
  },

  LI16() {
    const a = new Screen('li16-1', { tcode: 'LI16', title: 'Cancel Inventory Item: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, HELP] });
    selection(a, 12, 96, 640, 'Inventory record', [
      { k: 'sel_doc', l: 'Warehouse Number', v: '100', w: 70 },
      { l: 'Inventory record', v: '1210', w: 100, mono: true }
    ]);
    const b = new Screen('li16-2', { tcode: 'LI16', title: 'Cancel Inventory Items: Record 1210', appbar: [{ l: 'Cancel item', k: 'cancel', dir: 'right', gap: 60 }, { l: 'Save', icon: 'save' }, HELP] });
    b.table(12, 110, {
      cols: [{ l: 'Item', w: 60, align: 'r' }, { l: 'Typ', w: 60 }, { l: 'Storage Bin', w: 110 }, { l: 'Status', w: 110 }, { l: 'Material', w: 110 }],
      rows: [['1', '005', '03-01-01', 'Active', 'DEMO-1005'], ['2', '005', '03-01-02', 'Active', 'DEMO-1006'], ['3', '005', '03-02-01', 'Active', 'DEMO-1005']],
      sel: 0, k: 'res_items', dir: 'right'
    });
    return [a, b];
  }
};
