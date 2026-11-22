import { Screen, W, C, union } from './lib.mjs';
import { HELP, dim, buttons, pickList, kv, collapsed } from './kit.mjs';

const VIEWS = ['Basic Data 1', 'Basic Data 2', 'Classification', 'Purchasing', 'MRP 1', 'MRP 2', 'MRP 3', 'MRP 4', 'Plant data / stor. 1', 'Warehouse Mgmt 1', 'Accounting 1', 'Accounting 2', 'Costing 1'];

function matInitial(file, tcode, title, selected, change) {
  const s = new Screen(file, { tcode, title, appbar: [{ l: 'Select View(s)' }, { l: 'Org. Levels' }, { l: 'Data' }, HELP] });
  s.group(12, 96, 560, change ? 128 : 96, '');
  s.field('mat', 28, 116, { l: 'Material', lw: 130, v: 'RM-1001', w: 200, mono: true });
  if (change) s.field(null, 28, 156, { l: 'Change Number', lw: 130, v: '', w: 200 });
  dim(s);
  s.dialog(600, 104, 380, 452, 'Select View(s)');
  const box = pickList(s, 616, 152, 348, VIEWS, selected);
  s.reg('views', [box[0] - 4, box[1] - 4, box[2] + 8, box[3] + 8], 'left');
  buttons(s, 616, 514, [{ l: 'Continue', icon: 'check', primary: true }, { l: 'Default Values' }, { l: 'Cancel' }]);
  return s;
}

function orgLevels(file, tcode, title, key, sloc) {
  const s = new Screen(file, { tcode, title, appbar: [{ l: 'Select View(s)' }, { l: 'Org. Levels' }, { l: 'Data' }, HELP] });
  s.group(12, 96, 560, 96, '');
  s.field(null, 28, 116, { l: 'Material', lw: 130, v: 'RM-1001', w: 200, mono: true });
  dim(s);
  s.dialog(300, 150, 520, 330, 'Organizational Levels');
  s.text(320, 212, 'Organizational levels', { weight: 700 });
  const p = s.field(null, 320, 228, { l: 'Plant', lw: 150, v: 'MA01', w: 90 });
  const l = s.field(null, 320, 264, { l: 'Stor. Location', lw: 150, v: sloc, w: 90 });
  s.field(null, 320, 300, { l: 'Valuation Type', lw: 150, v: '', w: 90 });
  s.field(null, 320, 336, { l: 'Warehouse No.', lw: 150, v: '', w: 90 });
  s.field(null, 320, 372, { l: 'Storage Type', lw: 150, v: '', w: 90 });
  s.mark(key, union(p, l), 'right');
  s.check(null, 320, 410, 'Org. levels/profiles only on request', false);
  buttons(s, 320, 444, [{ l: 'Continue', icon: 'check', primary: true }, { l: 'Select View(s)' }, { l: 'Cancel' }]);
  return s;
}

export default {
  MM03() {
    const a = matInitial('mm03-1', 'MM03', 'Display Material (Initial Screen)', [0, 10]);
    const b = orgLevels('mm03-2', 'MM03', 'Display Material (Initial Screen)', 'orglev', 'RM01');
    const c = new Screen('mm03-3', { tcode: 'MM03', title: 'Display Material RM-1001 (Raw material)', appbar: [{ l: 'Additional Data' }, { l: 'Org. Levels' }, { l: 'Check Screen Data', icon: 'check' }, HELP] });
    c.tabs(12, 92, ['Basic data 1', 'Purchasing', 'MRP 1', 'MRP 2', 'Plant data / stor. 1', 'Warehouse Mgmt 1', 'Accounting 1', 'Accounting 2', 'Costing 1'], 6, {}, 'bottom');
    c.reg('tabs', [10, 90, 1010, 34], 'bottom', [676, 92, 112, 30]);
    c.group(12, 134, W - 24, 64, '');
    kv(c, 28, 160, [['Material', 'RM-1001    Steel sheet 2 mm'], ['Plant', 'MA01    Casablanca']], { lw: 90, bold: [0] });
    c.group(12, 210, W - 24, 132, 'General Valuation Data');
    c.field(null, 28, 252, { l: 'Base Unit of Measure', lw: 170, v: 'PC', w: 70, type: 'display' });
    c.field(null, 28, 288, { l: 'Currency', lw: 170, v: 'MAD', w: 70, type: 'display' });
    c.field(null, 560, 252, { l: 'Valuation Category', lw: 160, v: '', w: 70, type: 'display' });
    c.field(null, 560, 288, { l: 'Current period', lw: 160, v: '11   2026', w: 110, type: 'display' });
    c.group(12, 354, W - 24, 272, 'Current valuation');
    c.field('valclass', 28, 396, { l: 'Valuation Class', lw: 170, v: '3000', w: 80, type: 'display' });
    c.field(null, 560, 396, { l: 'VC: Sales order stk', lw: 160, v: '', w: 80, type: 'display' });
    const pc = c.field(null, 28, 440, { l: 'Price control', lw: 170, v: 'V', w: 40, type: 'display', suffix: 'Moving average price' });
    const mp = c.field(null, 28, 476, { l: 'Moving price', lw: 170, v: '12.50', w: 110, type: 'display', suffix: 'MAD' });
    c.field(null, 560, 440, { l: 'Price Unit', lw: 160, v: '1', w: 60, type: 'display' });
    c.field(null, 560, 476, { l: 'Standard price', lw: 160, v: '0.00', w: 110, type: 'display' });
    c.mark('price', union(pc, mp), 'right');
    const ts = c.field(null, 28, 532, { l: 'Total Stock', lw: 170, v: '535', w: 110, type: 'display', suffix: 'PC' });
    const tv = c.field(null, 28, 568, { l: 'Total Value', lw: 170, v: '6,687.50', w: 110, type: 'display', suffix: 'MAD' });
    c.mark('stock', union(ts, tv), 'right');
    c.field(null, 560, 532, { l: 'Valuated Un', lw: 160, v: '', w: 60, type: 'display' });
    return [a, b, c];
  },

  MM02() {
    const a = matInitial('mm02-1', 'MM02', 'Change Material (Initial Screen)', [4, 5], true);
    const b = orgLevels('mm02-2', 'MM02', 'Change Material (Initial Screen)', 'org', '');
    const c = new Screen('mm02-3', { tcode: 'MM02', title: 'Change Material RM-1001 (Raw material)', appbar: [{ l: 'Additional Data' }, { l: 'Org. Levels' }, { l: 'Check Screen Data', icon: 'check' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'bottom' }, HELP] });
    c.tabs(12, 92, ['MRP 1', 'MRP 2'], 1, { 1: 'tab' }, 'right');
    c.group(12, 134, W - 24, 64, '');
    kv(c, 28, 160, [['Material', 'RM-1001    Steel sheet 2 mm'], ['Plant', 'MA01    Casablanca']], { lw: 90, bold: [0] });
    c.group(12, 210, 540, 200, 'Procurement');
    c.field(null, 28, 252, { l: 'Procurement type', lw: 180, v: 'F', w: 50 });
    c.field(null, 28, 288, { l: 'Special procurement', lw: 180, v: '', w: 50 });
    c.field(null, 28, 324, { l: 'Storage loc. for EP', lw: 180, v: 'RM01', w: 80 });
    c.check(null, 28, 362, 'Backflush', false);
    c.group(568, 210, 540, 200, 'Scheduling');
    c.field(null, 584, 252, { l: 'In-house production', lw: 190, v: '0', w: 60, suffix: 'days' });
    c.field('pdt', 584, 288, { l: 'Planned Deliv. Time', lw: 190, v: '14', w: 60, suffix: 'days' });
    c.field(null, 584, 324, { l: 'GR Processing Time', lw: 190, v: '1', w: 60, suffix: 'days' });
    c.field(null, 584, 360, { l: 'SchedMargin key', lw: 190, v: '000', w: 60 });
    c.group(12, 422, W - 24, 200, 'Net requirements calculation');
    c.field('safety', 28, 464, { l: 'Safety Stock', lw: 180, v: '150', w: 110 });
    c.field(null, 28, 500, { l: 'Min safety stock', lw: 180, v: '', w: 110 });
    c.field(null, 28, 536, { l: 'Service level (%)', lw: 180, v: '', w: 60 });
    c.field(null, 584, 464, { l: 'Coverage profile', lw: 190, v: '', w: 80 });
    c.field(null, 584, 500, { l: 'Safety time ind.', lw: 190, v: '', w: 50 });
    c.field(null, 584, 536, { l: 'Safety time/act.cov.', lw: 190, v: '', w: 60, suffix: 'days' });
    c.status('success', 'Material RM-1001 changed', null);
    return [a, b, c];
  },

  MD04() {
    const a = new Screen('md04-1', { tcode: 'MD04', title: 'Stock/Requirements List: Initial Screen', appbar: [{ l: 'Continue', icon: 'check', k: 'exec', dir: 'right' }, HELP] });
    a.group(12, 96, 700, 220, '');
    a.tabs(24, 102, ['Individual Access', 'Collective Access'], 0);
    a.field('mat', 36, 156, { l: 'Material', lw: 140, v: 'RM-1001', w: 200, mono: true });
    a.field(null, 36, 196, { l: 'MRP Area', lw: 140, v: 'MA01', w: 120 });
    a.field('plant', 36, 236, { l: 'Plant', lw: 140, v: 'MA01', w: 80 });
    a.text(36, 296, 'Press Enter to build the list with the current data.', { fill: C.muted, size: 12.5 });

    const b = new Screen('md04-2', { tcode: 'MD04', title: 'Stock/Requirements List as of 10:24 Hrs', appbar: [{ l: 'Refresh', icon: 'refresh' }, { l: 'Show Overview Tree' }, { l: 'Element Details', icon: 'glasses' }, HELP] });
    b.group(12, 96, W - 24, 84, '');
    kv(b, 28, 120, [['Material', 'RM-1001    Steel sheet 2 mm'], ['MRP area', 'MA01    Casablanca'], ['Plant', 'MA01']], { lw: 80, bold: [0], rowH: 22 });
    kv(b, 420, 120, [['MRP type', 'PD'], ['Material Type', 'ROH'], ['Unit', 'PC']], { lw: 110, rowH: 22 });
    b.text(700, 116, 'Exception groups', { fill: C.muted, size: 12.5 });
    [0, 0, 0, 1, 0, 1, 0, 0].forEach((n, i) => {
      const x = 700 + i * 46;
      b.rect(x, 124, 40, 36, { fill: n ? '#FFF4E5' : '#FFFFFF', stroke: n ? C.amber : '#C2C9D0', rx: 4 });
      b.text(x + 20, 139, String(i + 1), { size: 11.5, anchor: 'middle', fill: C.muted });
      b.text(x + 20, 155, String(n), { size: 13, anchor: 'middle', weight: 700, fill: n ? C.amber : C.text });
    });
    b.reg('header', [18, 100, 1080, 76], 'top', [420, 100, 400, 76]);
    b.table(12, 240, {
      cols: [{ l: 'Date', w: 104 }, { l: 'MRP element', w: 104 }, { l: 'MRP element data', w: 210 }, { l: 'Rescheduling date', w: 136 }, { l: 'E', w: 44, align: 'c' }, { l: 'Rec./reqd qty', w: 120, align: 'r' }, { l: 'Available qty', w: 120, align: 'r' }, { l: 'Stor. loc.', w: 86 }],
      rows: [
        ['19.11.2026', 'Stock', '', '', '', '', '420', 'RM01'],
        ['19.11.2026', 'SafeSt', 'Safety stock', '', '', '-100', '320', ''],
        ['21.11.2026', 'OrdRes', '1000789/0010', '', '', '-80', '240', 'RM01'],
        ['25.11.2026', 'DepReq', 'FG-2001  PldOrd 0000045123', '', '', '-300', '-60', 'RM01'],
        ['02.12.2026', 'PchOrd', '4500012390/00010', '25.11.2026', '10', '500', '440', 'RM01'],
        ['10.12.2026', 'PurRqs', '0010023456/00010', '', '20', '200', '640', 'RM01']
      ],
      sel: 4, k: 'list', dir: 'right', colKeys: { 4: 'exceptions', 6: 'avail' }
    });
    b.text(16, 452, '10  Bring process forward (reschedule in)     20  Cancel process     96  Stock fallen below safety stock level', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  ME21N() {
    const s = new Screen('me21n', { tcode: 'ME21N', title: 'Create Purchase Order', appbar: [{ l: 'Document Overview On' }, { l: 'Hold' }, { l: 'Check', icon: 'check', k: 'check', dir: 'right', gap: 64 }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, { l: 'Print Preview' }, HELP] });
    const dt = s.input(16, 98, 200, 'NB Standard PO', { type: 'select' }); s.reg('doctype', [12, 94, 208, 32], 'bottom', dt);
    s.field('vendor', 236, 98, { l: 'Vendor', lw: 60, v: '100045  Atlas Steel SARL', w: 240, dir: 'bottom' });
    s.field(null, 600, 98, { l: 'Doc. date', lw: 80, v: '12.11.2026', w: 110 });
    s.group(12, 158, W - 24, 156, '');
    s.tabs(24, 162, ['Delivery/Invoice', 'Conditions', 'Texts', 'Address', 'Communication', 'Partners', 'Additional Data', 'Org. Data', 'Status'], 7);
    const o1 = s.field(null, 36, 208, { l: 'Purch. Org.', lw: 120, v: '1000   LogiCorp Purchasing', w: 260 });
    s.field(null, 36, 242, { l: 'Purch. Group', lw: 120, v: '001    Raw materials', w: 260 });
    const o3 = s.field(null, 36, 276, { l: 'Company Code', lw: 120, v: '1000   LogiCorp Maroc SA', w: 260 });
    s.mark('orgdata', union(o1, o3), 'right');
    s.text(16, 340, 'Item overview', { weight: 700 });
    s.table(12, 350, {
      cols: [{ l: 'Itm', w: 40 }, { l: 'A', w: 26 }, { l: 'I', w: 26 }, { l: 'Material', w: 110 }, { l: 'Short Text', w: 170 }, { l: 'PO Quantity', w: 96, align: 'r' }, { l: 'OUn', w: 46 }, { l: 'C', w: 26 }, { l: 'Deliv. Date', w: 100 }, { l: 'Net Price', w: 90, align: 'r' }, { l: 'Curr', w: 50 }, { l: 'Matl Group', w: 80 }, { l: 'Plnt', w: 56 }, { l: 'SLoc', w: 56 }],
      rows: [['10', '', '', 'RM-1001', 'Steel sheet 2 mm', '500', 'PC', 'D', '02.12.2026', '12.50', 'MAD', '001', 'MA01', 'RM01'], ['', '', '', '', '', '', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', '', '', '', '', '', '']],
      sel: 0, colKeys: { 3: 'item_mat', 5: 'item_qty', 9: 'item_price', 12: 'item_plant' }
    });
    s.group(12, 476, W - 24, 180, 'Item  [ 10 ]  RM-1001, Steel sheet 2 mm');
    s.tabs(24, 514, ['Material Data', 'Quantities/Weights', 'Delivery Schedule', 'Delivery', 'Invoice', 'Conditions', 'Account Assignment', 'Texts'], 0);
    s.field(null, 36, 562, { l: 'Material Group', lw: 140, v: '001', w: 80 });
    s.field(null, 36, 600, { l: 'Info Record', lw: 140, v: '5300000123', w: 120, mono: true });
    s.field(null, 520, 562, { l: 'Vendor Mat. No.', lw: 140, v: 'AS-SH2', w: 140 });
    s.field(null, 520, 600, { l: 'Revision Level', lw: 140, v: '', w: 60 });
    s.status('success', 'Standard PO created under the number 4500012390', null);
    return [s];
  },

  ME22N() {
    const s = new Screen('me22n', { tcode: 'ME22N', title: 'Standard PO 4500012390 Created by TRAINEE01', appbar: [{ l: 'Document Overview On' }, { l: 'Display/Change', icon: 'pencil', k: 'mode', dir: 'right', gap: 64 }, { l: 'Other Purchase Order', icon: 'doc', k: 'otherpo', dir: 'right', gap: 64 }, { l: 'Check', icon: 'check' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    s.input(16, 98, 200, 'NB Standard PO', { type: 'select' });
    s.input(226, 98, 120, '4500012390', { mono: true, type: 'display' });
    s.field(null, 370, 98, { l: 'Vendor', lw: 60, v: '100045  Atlas Steel SARL', w: 240 });
    s.field(null, 700, 98, { l: 'Doc. date', lw: 80, v: '12.11.2026', w: 110 });
    collapsed(s, 12, 136, W - 24, 'Header');
    s.text(16, 196, 'Item overview', { weight: 700 });
    s.table(12, 206, {
      cols: [{ l: 'Itm', w: 40 }, { l: 'A', w: 26 }, { l: 'I', w: 26 }, { l: 'Material', w: 110 }, { l: 'Short Text', w: 170 }, { l: 'PO Quantity', w: 100, align: 'r' }, { l: 'OUn', w: 46 }, { l: 'C', w: 26 }, { l: 'Deliv. Date', w: 110 }, { l: 'Net Price', w: 90, align: 'r' }, { l: 'Curr', w: 50 }, { l: 'Plnt', w: 56 }, { l: 'SLoc', w: 56 }],
      rows: [['10', '', '', 'RM-1001', 'Steel sheet 2 mm', '500', 'PC', 'D', '25.11.2026', '12.50', 'MAD', 'MA01', 'RM01'], ['', '', '', '', '', '', '', '', '', '', '', '', '']],
      sel: 0, colKeys: { 5: 'item_qty', 8: 'item_date' }
    });
    s.group(12, 312, W - 24, 316, 'Item  [ 10 ]  RM-1001, Steel sheet 2 mm');
    s.tabs(24, 350, ['Material Data', 'Quantities/Weights', 'Delivery Schedule', 'Delivery', 'Invoice', 'Conditions', 'Texts', 'Confirmations'], 2, { 2: 'tab_delivery' });
    s.table(24, 398, {
      cols: [{ l: 'C', w: 30 }, { l: 'Delivery Date', w: 120 }, { l: 'Scheduled Qty', w: 120, align: 'r' }, { l: 'Time', w: 70 }, { l: 'Stat.-Rel. Del. Date', w: 160 }, { l: 'GR Qty', w: 90, align: 'r' }, { l: 'Purchase Req.', w: 130 }, { l: 'Req. Item', w: 90, align: 'r' }],
      rows: [['D', '25.11.2026', '500', '', '02.12.2026', '0', '0010023401', '10'], ['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '']],
      sel: 0
    });
    s.text(28, 538, 'The statistical delivery date keeps the original date for supplier evaluation.', { fill: C.muted, size: 12.5 });
    s.status('success', 'Standard PO 4500012390 changed', null);
    return [s];
  },

  ME23N() {
    const s = new Screen('me23n', { tcode: 'ME23N', title: 'Standard PO 4500012345 Created by TRAINEE01', appbar: [{ l: 'Document Overview On' }, { l: 'Display/Change', icon: 'pencil' }, { l: 'Other Purchase Order', icon: 'doc', k: 'otherpo', dir: 'right', gap: 64 }, { l: 'Print Preview' }, { l: 'Messages' }, HELP] });
    s.input(16, 98, 200, 'NB Standard PO', { type: 'select' });
    s.input(226, 98, 120, '4500012345', { mono: true, type: 'display' });
    s.field(null, 370, 98, { l: 'Vendor', lw: 60, v: '100045  Atlas Steel SARL', w: 240, type: 'display' });
    s.field(null, 700, 98, { l: 'Doc. date', lw: 80, v: '05.11.2026', w: 110, type: 'display' });
    s.group(12, 136, W - 24, 112, '');
    s.tabs(24, 140, ['Delivery/Invoice', 'Conditions', 'Texts', 'Address', 'Communication', 'Partners', 'Additional Data', 'Org. Data', 'Status'], 0);
    s.field(null, 36, 184, { l: 'Payment Terms', lw: 130, v: '0001', w: 80, type: 'display' });
    s.field(null, 36, 214, { l: 'Incoterms', lw: 130, v: 'DAP   Casablanca', w: 200, type: 'display' });
    s.field(null, 560, 184, { l: 'Currency', lw: 110, v: 'MAD', w: 80, type: 'display' });
    s.field(null, 560, 214, { l: 'Exchange Rate', lw: 110, v: '1.00000', w: 100, type: 'display' });
    s.mark('header', [14, 92, 976, 158], 'right');
    s.table(12, 262, {
      cols: [{ l: 'Itm', w: 40 }, { l: 'A', w: 26 }, { l: 'I', w: 26 }, { l: 'Material', w: 110 }, { l: 'Short Text', w: 190 }, { l: 'PO Quantity', w: 100, align: 'r' }, { l: 'OUn', w: 46 }, { l: 'Deliv. Date', w: 110 }, { l: 'Net Price', w: 90, align: 'r' }, { l: 'Curr', w: 50 }, { l: 'Plnt', w: 56 }, { l: 'SLoc', w: 56 }],
      rows: [['10', '', '', 'RM-1001', 'Steel sheet 2 mm', '100', 'PC', '15.11.2026', '12.50', 'MAD', 'MA01', 'RM01'], ['20', '', '', 'RM-1002', 'Bolt M8 x 40', '250', 'PC', '15.11.2026', '0.30', 'MAD', 'MA01', 'RM01']],
      sel: 0, k: 'items', dir: 'right'
    });
    s.group(12, 356, W - 24, 272, 'Item  [ 10 ]  RM-1001, Steel sheet 2 mm');
    s.tabs(24, 394, ['Material Data', 'Quantities/Weights', 'Delivery Schedule', 'Delivery', 'Invoice', 'Conditions', 'Purchase Order History'], 6, { 6: 'tab_history' });
    s.table(24, 440, {
      cols: [{ l: 'Sh. Text', w: 150 }, { l: 'MvT', w: 56 }, { l: 'Material Document', w: 150 }, { l: 'Item', w: 50, align: 'r' }, { l: 'Posting Date', w: 110 }, { l: 'Quantity', w: 100, align: 'r' }, { l: 'OUn', w: 50 }, { l: 'Amount in LC', w: 120, align: 'r' }, { l: 'L.cur', w: 60 }],
      rows: [['WE', '101', '5000004711', '1', '15.11.2026', '100', 'PC', '1,250.00', 'MAD'], ['Tot.Goods receipt', '', '', '', '', '100', 'PC', '1,250.00', 'MAD'], ['RE-L', '', '5105600221', '1', '17.11.2026', '100', 'PC', '1,250.00', 'MAD'], ['Tot.Invoice receipt', '', '', '', '', '100', 'PC', '1,250.00', 'MAD']],
      sel: 0, rowKeys: { 0: 'hist_row' }
    });
    return [s];
  }
};
