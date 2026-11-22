import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv } from './kit.mjs';

const LIST_BAR = [{ l: 'Details', icon: 'glasses' }, { l: 'Refresh', icon: 'refresh' }, HELP];

function sel(file, tcode, title) { return new Screen(file, { tcode, title, appbar: [EXEC, { l: 'Get Variant' }, HELP] }); }

export default {
  LS24() {
    const a = sel('ls24-1', 'LS24', 'Display Quants for Material');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { l: 'Material', v: 'RM-1001', w: 200, mono: true },
      { l: 'Plant', v: 'MA01', w: 80 },
      { l: 'Batch', v: '', w: 120 },
      { l: 'Stock Category', v: '', w: 50 },
      { l: 'Storage Type', v: '', to: '', w: 70 }
    ]);
    a.mark('sel_mat', [23, 168, 404, 66], 'right');
    const b = new Screen('ls24-2', { tcode: 'LS24', title: 'Stock Overview per Material: Quants', appbar: LIST_BAR });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Material', 'RM-1001    Steel sheet 2 mm'], ['Plant', 'MA01    Warehouse 100']], { lw: 80, bold: [0], rowH: 22 });
    b.table(12, 230, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 110 }, { l: 'S', w: 34, align: 'c' }, { l: 'Batch', w: 96 }, { l: 'GR Date', w: 100 }, { l: 'Avail. stock', w: 104, align: 'r' }, { l: 'Pick qty', w: 84, align: 'r' }, { l: 'Putaway stk', w: 96, align: 'r' }, { l: 'Total stock', w: 100, align: 'r' }, { l: 'BUn', w: 46 }],
      rows: [
        ['001', '01-02-03', '', 'B2026-10', '02.10.2026', '200', '', '', '200', 'PC'],
        ['001', '01-04-01', '', 'B2026-10', '02.10.2026', '100', '20', '', '120', 'PC'],
        ['001', '01-05-02', 'S', 'B2026-10', '02.10.2026', '15', '', '', '15', 'PC'],
        ['001', '01-06-04', 'Q', 'B2026-12', '', '', '', '100', '0', 'PC'],
        ['002', '02-01-05', '', 'B2026-11', '15.11.2026', '100', '', '', '100', 'PC'],
        ['002', '02-03-01', '', 'B2026-10', '', '', '', '20', '0', 'PC'],
        ['902', '4500012371', 'Q', 'B2026-12', '19.11.2026', '', '100', '', '100', 'PC']
      ],
      totals: ['Σ', '', '', '', '', '', '', '', '535', ''],
      sel: 0, k: 'res_list', dir: 'top', colKeys: { 2: 'res_cat' }, rowKeys: { 0: 'res_row' }, rowDir: 'right'
    });
    b.text(16, 494, 'Interim storage type 902 = GR area for external receipts (dynamic bin = purchase order).', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  LS22() {
    const a = new Screen('ls22-1', { tcode: 'LS22', title: 'Change Quant: Initial Screen', appbar: [{ l: 'Stock', icon: 'grid' }, HELP] });
    a.group(12, 96, 620, 170, 'Quant');
    const w1 = a.field(null, 28, 140, { l: 'Warehouse Number', lw: 180, v: '100', w: 80 });
    const w2 = a.field(null, 28, 176, { l: 'Quant', lw: 180, v: '3401', w: 120, mono: true });
    a.mark('whse', union(w1, w2), 'right');
    a.text(28, 236, 'Or enter Storage Type and Storage Bin, then choose Stock.', { fill: C.muted, size: 12.5 });
    const b = new Screen('ls22-2', { tcode: 'LS22', title: 'Change Quant 3401: Quant Data', appbar: [{ l: 'Storage Bin' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Warehouse', '100    Quant 3401'], ['Storage bin', '001  /  01-02-03']], { lw: 100, bold: [0], rowH: 22 });
    b.group(12, 170, 540, 200, 'Material');
    b.field(null, 28, 212, { l: 'Material', lw: 150, v: 'RM-1001', w: 140, type: 'display', mono: true });
    b.field(null, 28, 248, { l: 'Plant', lw: 150, v: 'MA01', w: 80, type: 'display' });
    b.field(null, 28, 284, { l: 'Batch', lw: 150, v: 'B2026-10', w: 120, type: 'display' });
    b.field(null, 28, 320, { l: 'Stock category', lw: 150, v: '', w: 50, type: 'display' });
    b.group(568, 170, 540, 200, 'Stock');
    b.field(null, 584, 212, { l: 'Total stock', lw: 150, v: '200', w: 100, type: 'display', suffix: 'PC' });
    b.field(null, 584, 248, { l: 'Available stock', lw: 150, v: '200', w: 100, type: 'display' });
    b.field(null, 584, 284, { l: 'Pick quantity', lw: 150, v: '0', w: 100, type: 'display' });
    b.field(null, 584, 320, { l: 'Stock for putaway', lw: 150, v: '0', w: 100, type: 'display' });
    b.reg('quant', [18, 176, 1084, 188], 'top', [700, 176, 200, 188]);
    b.group(12, 382, 540, 240, 'Blocking');
    const k1 = b.check(null, 28, 422, 'Putaway block', false);
    const k2 = b.check(null, 28, 456, 'Stock removal block', true);
    b.mark('blocks', union(k1, k2), 'right');
    b.field('reason', 28, 500, { l: 'Blocking reason', lw: 150, v: '01', w: 60, type: 'select' });
    b.field(null, 28, 536, { l: 'Block date', lw: 150, v: '19.11.2026', w: 110, type: 'display' });
    b.group(568, 382, 540, 240, 'Dates');
    b.field(null, 584, 422, { l: 'GR Date', lw: 150, v: '02.10.2026', w: 110 });
    b.field(null, 584, 458, { l: 'Last movement', lw: 150, v: '18.11.2026', w: 110, type: 'display' });
    b.field(null, 584, 494, { l: 'Last inventory', lw: 150, v: '15.01.2026', w: 110, type: 'display' });
    b.status('success', 'Quant 3401 changed', null);
    return [a, b];
  },

  LS26() {
    const a = sel('ls26-1', 'LS26', 'Warehouse Stocks per Material');
    selection(a, 12, 96, 770, 'Selection', [
      { l: 'Material', v: 'RM-1001', w: 200, mono: true },
      { l: 'Plant', v: 'MA01', w: 80 },
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { l: 'Storage Location', v: '', w: 80 }
    ]);
    a.mark('sel_mat', [23, 134, 404, 66], 'right');
    const b = new Screen('ls26-2', { tcode: 'LS26', title: 'Warehouse Stocks per Material', appbar: [{ l: 'Bin Stock', icon: 'grid' }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Material', 'RM-1001    Steel sheet 2 mm'], ['Plant', 'MA01    Warehouse 100']], { lw: 80, bold: [0], rowH: 22 });
    b.table(12, 230, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'Storage type description', w: 220 }, { l: 'Total stock', w: 110, align: 'r' }, { l: 'Available', w: 110, align: 'r' }, { l: 'Pick qty', w: 96, align: 'r' }, { l: 'Putaway stk', w: 104, align: 'r' }, { l: 'BUn', w: 50 }],
      rows: [
        ['001', 'High rack storage', '335', '315', '20', '100', 'PC'],
        ['002', 'Shelf storage', '100', '100', '', '20', 'PC'],
        ['902', 'GR Area External Rcpts', '100', '0', '100', '', 'PC']
      ],
      totals: ['Σ', '', '535', '415', '120', '120', ''],
      sel: 0, k: 'res_types', dir: 'top', rowKeys: { 0: 'res_drill' }, rowDir: 'right'
    });
    return [a, b];
  },

  LT24() {
    const a = sel('lt24-1', 'LT24', 'Transfer Orders for Material');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { l: 'Material', v: 'RM-1001', w: 200, mono: true },
      { l: 'Plant', v: 'MA01', w: 80 },
      { l: 'Creation date', v: '01.11.2026', to: '19.11.2026', w: 110 }
    ]);
    a.mark('sel_mat', [23, 168, 404, 66], 'right');
    selection(a, 12, 296, 770, 'Status', [
      { type: 'radio', k: 'sel_status', options: ['Only open TO items', 'Only confirmed TO items', 'All TO items'], sel: 2 }
    ]);
    const b = new Screen('lt24-2', { tcode: 'LT24', title: 'Transfer Orders for Material RM-1001', appbar: [{ l: 'Display TO', icon: 'glasses' }, { l: 'Confirm', icon: 'check' }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'TO Number', w: 96 }, { l: 'Item', w: 46, align: 'r' }, { l: 'MvT', w: 50 }, { l: 'Src Typ', w: 66 }, { l: 'Source Bin', w: 106 }, { l: 'Dst Typ', w: 66 }, { l: 'Dest. Bin', w: 100 }, { l: 'Target qty', w: 90, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'C', w: 36, align: 'c' }, { l: 'Created on', w: 100 }],
      rows: [
        ['4581', '1', '101', '902', '4500012345', '002', '02-01-05', '100', 'PC', '[x]', '15.11.2026'],
        ['4590', '1', '261', '001', '01-02-03', '914', '1000789', '80', 'PC', '[x]', '18.11.2026'],
        ['4602', '1', '101', '902', '4500012371', '001', '01-06-04', '100', 'PC', '[ ]', '19.11.2026'],
        ['4605', '1', '999', '001', '01-04-01', '002', '02-03-01', '20', 'PC', '[ ]', '19.11.2026']
      ],
      sel: 2, k: 'res_list', dir: 'right', rowKeys: { 2: 'res_row' }, rowDir: 'right'
    });
    b.text(16, 340, 'C = confirmed. Open items still reserve stock at source and destination.', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  LT22() {
    const a = sel('lt22-1', 'LT22', 'Transfer Orders for Storage Type');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { k: 'sel_type', l: 'Storage Type', v: '001', w: 70 },
      { l: 'Creation date', v: '', to: '', w: 110 }
    ]);
    selection(a, 12, 262, 770, 'Status', [
      { type: 'radio', k: 'sel_status', options: ['Open TO items', 'Confirmed TO items', 'All TO items'], sel: 0 }
    ]);
    const b = new Screen('lt22-2', { tcode: 'LT22', title: 'Transfer Orders for Storage Type 001', appbar: [{ l: 'Display TO', icon: 'glasses' }, { l: 'Confirm', icon: 'check' }, { l: 'Print', icon: 'print' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'TO Number', w: 96 }, { l: 'Item', w: 46, align: 'r' }, { l: 'Material', w: 96 }, { l: 'MvT', w: 50 }, { l: 'Src Typ', w: 64 }, { l: 'Source Bin', w: 104 }, { l: 'Dst Typ', w: 64 }, { l: 'Dest. Bin', w: 104 }, { l: 'Target qty', w: 90, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'C', w: 40, align: 'c' }],
      rows: [
        ['4602', '1', 'RM-1001', '101', '902', '4500012371', '001', '01-06-04', '100', 'PC', '[ ]'],
        ['4605', '1', 'RM-1001', '999', '001', '01-04-01', '002', '02-03-01', '20', 'PC', '[ ]'],
        ['4611', '1', 'RM-1003', '601', '001', '01-07-02', '916', '80001234', '30', 'PC', '[ ]']
      ],
      sel: 0, k: 'res_list', dir: 'right', colKeys: { 10: 'res_conf' }
    });
    return [a, b];
  },

  LT01() {
    const a = new Screen('lt01-1', { tcode: 'LT01', title: 'Create Transfer Order: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, { l: 'Stock Overview' }, HELP] });
    a.group(12, 96, 760, 112, 'Header');
    const h1 = a.field(null, 28, 138, { l: 'Warehouse Number', lw: 170, v: '100', w: 80 });
    const h2 = a.field(null, 28, 172, { l: 'Movement Type', lw: 170, v: '999', w: 80, suffix: 'Manual stock transfer' });
    a.mark('whse', union(h1, h2), 'right');
    a.group(12, 220, 760, 260, 'Item');
    const i1 = a.field(null, 28, 262, { l: 'Requested Qty', lw: 170, v: '20', w: 100, suffix: 'PC' });
    const i2 = a.field(null, 28, 296, { l: 'Material', lw: 170, v: 'RM-1001', w: 200, mono: true });
    a.mark('mat', union(i1, i2), 'right');
    const p1 = a.field(null, 28, 340, { l: 'Plant / Storage Loc.', lw: 170, v: 'MA01', w: 80, suffix: 'RM01' });
    const p2 = a.field(null, 28, 374, { l: 'Batch', lw: 170, v: 'B2026-10', w: 120 });
    a.mark('plant', union(p1, p2), 'right');
    a.field(null, 28, 418, { l: 'Stock Category', lw: 170, v: '', w: 50 });
    a.group(12, 492, 760, 92, 'Control');
    a.field(null, 28, 534, { l: 'Foreground/Backgrnd', lw: 170, v: 'Foreground', w: 160, type: 'select' });
    const b = new Screen('lt01-2', { tcode: 'LT01', title: 'Create Transfer Order: Generate 999 Item', appbar: [{ l: 'Stock Overview' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Material', 'RM-1001    Steel sheet 2 mm    Batch B2026-10'], ['Quantity', '20 PC    Plant MA01 / RM01']], { lw: 90, bold: [0], rowH: 22 });
    b.group(12, 172, 520, 190, 'Source Storage Bin');
    b.field(null, 28, 214, { l: 'Storage Type', lw: 140, v: '001', w: 70 });
    b.field(null, 28, 250, { l: 'Storage Section', lw: 140, v: '001', w: 70 });
    b.field(null, 28, 286, { l: 'Storage Bin', lw: 140, v: '01-04-01', w: 140, mono: true });
    b.mark('src', [20, 206, 312, 112], 'right');
    b.group(588, 172, 520, 190, 'Destination Storage Bin');
    b.field(null, 604, 214, { l: 'Storage Type', lw: 140, v: '002', w: 70 });
    b.field(null, 604, 250, { l: 'Storage Section', lw: 140, v: '001', w: 70 });
    b.field(null, 604, 286, { l: 'Storage Bin', lw: 140, v: '02-03-01', w: 140, mono: true });
    b.mark('dest', [596, 206, 312, 112], 'right');
    b.text(28, 400, 'Source and destination are entered manually for movement type 999.', { fill: C.muted, size: 12.5 });
    b.status('success', 'Transfer order 0000004605 created', null);
    return [a, b];
  },

  LX02() {
    const a = sel('lx02-1', 'LX02', 'Warehouse Stock List');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { k: 'sel_type', l: 'Storage Type', v: '001', to: '', w: 70 },
      { l: 'Storage Bin', v: '', to: '', w: 110 },
      { k: 'sel_mat', l: 'Material', v: '', to: '', w: 140 },
      { l: 'Plant', v: 'MA01', w: 80 }
    ]);
    selection(a, 12, 330, 770, 'List Output', [{ l: 'Layout', v: '/STANDARD', w: 150 }]);
    const b = new Screen('lx02-2', { tcode: 'LX02', title: 'Warehouse Stock List: Warehouse 100', appbar: [{ l: 'Details', icon: 'glasses' }, { l: 'Export', icon: 'doc' }, HELP] });
    b.alvToolbar(12, 96);
    const t = b.table(12, 150, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 104 }, { l: 'Material', w: 100 }, { l: 'Plnt', w: 56 }, { l: 'Batch', w: 96 }, { l: 'S', w: 32, align: 'c' }, { l: 'Total Stock', w: 104, align: 'r' }, { l: 'Avail. Stock', w: 104, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'GR Date', w: 100 }],
      rows: [
        ['001', '01-02-03', 'RM-1001', 'MA01', 'B2026-10', '', '200', '200', 'PC', '02.10.2026'],
        ['001', '01-04-01', 'RM-1001', 'MA01', 'B2026-10', '', '120', '100', 'PC', '02.10.2026'],
        ['001', '01-05-02', 'RM-1001', 'MA01', 'B2026-10', 'S', '15', '15', 'PC', '02.10.2026'],
        ['001', '01-06-04', 'RM-1001', 'MA01', 'B2026-12', 'Q', '0', '0', 'PC', ''],
        ['001', '01-07-02', 'RM-1003', 'MA01', '', '', '800', '770', 'PC', '28.09.2026'],
        ['001', '01-08-01', 'RM-1002', 'MA01', '', '', '2,400', '2,400', 'PC', '05.11.2026']
      ],
      sel: 1, k: 'res_list', dir: 'right'
    });
    b.mark('res_cols', [t.colBoxes[6][0] - 2, 147, 212, 36], 'top');
    return [a, b];
  }
};
