import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv, dim, buttons, findBar } from './kit.mjs';

function statusRow(s, x, y, items) {
  items.forEach(([l, v, tone], i) => {
    const cx = x + i * 210;
    s.text(cx, y, l, { fill: C.muted, size: 12 });
    s.text(cx, y + 20, v, { weight: 700, fill: tone === 'ok' ? C.green : tone === 'warn' ? C.amber : C.text, size: 13 });
  });
  return [x - 6, y - 16, items.length * 210, 44];
}

export default {
  '/SCWM/PRDI'() {
    const s = new Screen('scwm-prdi', { tcode: '/SCWM/PRDI', title: 'Maintain Inbound Delivery', appbar: [{ l: 'Goods Receipt', icon: 'check', primary: true, k: 'gr_btn', dir: 'right', gap: 64 }, { l: 'Unloading' }, { l: 'Create Warehouse Task' }, HELP] });
    findBar(s, 96, 'Inbound Delivery', '180000123', { k: 'find' });
    s.group(12, 150, W - 24, 132, 'Inbound Delivery 180000123');
    kv(s, 28, 192, [['Supplier', '100045  Atlas Steel SARL'], ['Reference', 'PO 4500012371 / ERP dlv 0180000045'], ['Warehouse', 'MA10']], { lw: 100, rowH: 24 });
    const st = statusRow(s, 560, 196, [['Unloading', 'Completed', 'ok'], ['Goods Receipt', 'Not Started', 'warn']]);
    s.reg('header', [18, 156, 1080, 120], 'top', [560, 156, 400, 120]);
    s.tabs(12, 296, ['Items', 'Status', 'Partners', 'Reference Documents', 'Handling Units'], 0);
    s.table(12, 342, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Product', w: 120 }, { l: 'Description', w: 180 }, { l: 'Quantity', w: 100, align: 'r' }, { l: 'UoM', w: 56 }, { l: 'Batch', w: 110 }, { l: 'Stock Type', w: 110 }, { l: 'Putaway status', w: 130 }],
      rows: [['10', 'RM-1001', 'Steel sheet 2 mm', '100', 'PC', 'B2026-13', 'Q1', 'Not Started']],
      sel: 0, k: 'items', dir: 'right'
    });
    s.status('success', 'Goods receipt posted for inbound delivery 180000123');
    return [s];
  },

  '/SCWM/PMR'() {
    const s = new Screen('scwm-pmr', { tcode: '/SCWM/PMR', title: 'Process Production Material Request', appbar: [{ l: 'Create Warehouse Task', icon: 'plus', primary: true, k: 'wt', dir: 'right', gap: 64 }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    findBar(s, 96, 'Manufacturing Order', '1000789', { k: 'find' });
    s.group(12, 150, W - 24, 108, 'Production Material Request 7000000312');
    kv(s, 28, 192, [['Order', '1000789   FG-2001 Cabinet assembly'], ['PSA', 'ASSY-01   Assembly line 1'], ['Start', '21.11.2026  07:00']], { lw: 80, rowH: 22 });
    s.reg('header', [18, 156, 1080, 96], 'top', [560, 156, 300, 96]);
    s.table(12, 290, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Product', w: 120 }, { l: 'Required', w: 100, align: 'r' }, { l: 'Staged', w: 100, align: 'r' }, { l: 'Open', w: 100, align: 'r' }, { l: 'UoM', w: 56 }, { l: 'Staging status', w: 150 }],
      rows: [['10', 'RM-1001', '80', '0', '80', 'PC', '@y In Process'], ['20', 'RM-1002', '400', '0', '400', 'PC', '@y In Process']],
      sel: 0, selector: true, k: 'items', dir: 'right', colKeys: { 6: 'status_col' }
    });
    s.status('success', '2 warehouse tasks created');
    return [s];
  },

  '/SCWM/MON'() {
    const a = new Screen('scwm-mon-1', { tcode: '/SCWM/MON', title: 'Warehouse Management Monitor', appbar: [HELP] });
    dim(a);
    a.dialog(320, 170, 480, 230, 'Warehouse Number and Monitor');
    const w1 = a.field(null, 344, 232, { l: 'Warehouse No.', lw: 130, v: 'MA10', w: 100 });
    const w2 = a.field(null, 344, 268, { l: 'Monitor', lw: 130, v: 'SAP', w: 100 });
    a.mark('whse', union(w1, w2), 'right');
    buttons(a, 344, 344, [{ l: 'Continue', icon: 'check', primary: true }, { l: 'Cancel' }]);
    const tree = [['Outbound', 0], ['Inbound', 0], ['Physical Inventory', 0], ['Documents', 0], ['Stock and Bin', 0, true], ['Physical Stock', 1], ['Available Stock', 1], ['Storage Bin', 1], ['Resource Management', 0], ['Alert', 0]];
    function drawTree(s, sel) {
      s.rect(12, 96, 300, 560, { fill: '#FFFFFF', stroke: C.border });
      tree.forEach(([l, lvl, open], i) => {
        const y = 120 + i * 28;
        if (i === sel) s.rect(14, y - 18, 296, 26, { fill: C.sel });
        s.text(28 + lvl * 20, y, (lvl ? '' : (open ? '▾ ' : '▸ ')) + l, { size: 13, weight: i === sel ? 700 : 400 });
      });
      return [14, 96 + 4 + 5 * 28 - 4, 296, 26];
    }
    const b = new Screen('scwm-mon-2', { tcode: '/SCWM/MON', title: 'Warehouse Management Monitor SAP - Warehouse Number MA10', appbar: [{ l: 'Show/Hide Node Hierarchy' }, HELP] });
    const nb = drawTree(b, 5);
    b.mark('tree', [14, 242, 296, 26], 'right');
    b.dialog(420, 170, 560, 260, 'Physical Stock');
    b.field(null, 444, 232, { l: 'Product', lw: 130, v: 'RM-1001', w: 160, mono: true });
    b.field(null, 444, 268, { l: 'Storage Type', lw: 130, v: '', w: 100 });
    b.field(null, 444, 304, { l: 'Storage Bin', lw: 130, v: '', w: 140 });
    b.reg('selection', [430, 222, 520, 120], 'right', [444, 226, 300, 110]);
    buttons(b, 444, 380, [{ l: 'Execute', icon: 'exec', primary: true }, { l: 'Cancel' }]);
    const c = new Screen('scwm-mon-3', { tcode: '/SCWM/MON', title: 'Warehouse Management Monitor SAP - Warehouse Number MA10', appbar: [{ l: 'Show/Hide Node Hierarchy' }, { l: 'More Methods', icon: 'grid', k: 'methods', dir: 'right', gap: 64 }, HELP] });
    drawTree(c, 5);
    c.table(326, 120, {
      cols: [{ l: 'Storage Bin', w: 130 }, { l: 'Product', w: 110 }, { l: 'Batch', w: 100 }, { l: 'Stock Type', w: 90 }, { l: 'Quantity', w: 90, align: 'r' }, { l: 'UoM', w: 50 }],
      rows: [['0010-01-02', 'RM-1001', 'B2026-10', 'F2', '300', 'PC'], ['0010-02-01', 'RM-1001', 'B2026-11', 'F2', '120', 'PC'], ['QINSP-01', 'RM-1001', 'B2026-13', '@y Q2', '100', 'PC']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b, c];
  },

  '/SCWM/PI'() {
    const a = new Screen('scwm-pi-1', { tcode: '/SCWM/PI', title: 'Create Physical Inventory Document', appbar: [{ l: 'Save and Activate', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, { l: 'Save' }, HELP] });
    a.field('proc', 16, 100, { l: 'PI Procedure', lw: 120, v: 'HL  Ad Hoc PI: Storage Bin-Specific', w: 320, type: 'select' });
    a.group(12, 140, 640, 120, 'Search criteria');
    a.field('sel', 28, 182, { l: 'Storage Bin', lw: 120, v: '0010-01-02', w: 160, mono: true });
    a.field(null, 28, 216, { l: 'Storage Type', lw: 120, v: '0010', w: 100 });
    a.table(12, 290, {
      cols: [{ l: 'Activity Area', w: 120 }, { l: 'Storage Bin', w: 130 }, { l: 'Product', w: 110 }, { l: 'Book Qty', w: 100, align: 'r' }, { l: 'Stock Type', w: 100 }, { l: 'Status', w: 140 }],
      rows: [['0010', '0010-01-02', 'RM-1001', '300', 'F2', 'Ready']],
      sel: 0, k: 'list', dir: 'right'
    });
    a.status('success', 'Physical inventory document 1000000045 created and activated', null);
    const b = new Screen('scwm-pi-2', { tcode: '/SCWM/PI', title: 'Process Physical Inventory Document 1000000045', appbar: [{ l: 'Post', icon: 'check', primary: true }, { l: 'Recount' }, HELP] });
    b.table(12, 120, {
      cols: [{ l: 'Storage Bin', w: 130 }, { l: 'Product', w: 110 }, { l: 'Book Qty', w: 100, align: 'r' }, { l: 'Counted Qty', w: 110, align: 'r' }, { l: 'Difference', w: 100, align: 'r' }, { l: 'UoM', w: 50 }, { l: 'Status', w: 160 }],
      rows: [['0010-01-02', 'RM-1001', '300', '297', '-3', 'PC', '@y Counted']],
      sel: 0, k: 'count', dir: 'right'
    });
    b.text(16, 220, 'After posting, the difference is sent to the difference analyzer for posting to S/4HANA.', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  '/SCWM/PRDO'() {
    const s = new Screen('scwm-prdo', { tcode: '/SCWM/PRDO', title: 'Maintain Outbound Delivery Order', appbar: [{ l: 'Goods Issue', icon: 'truck', primary: true, k: 'gi', dir: 'right', gap: 64 }, { l: 'Create Warehouse Task' }, HELP] });
    findBar(s, 96, 'Outbound Delivery Order', '4000000210', { k: 'find' });
    s.group(12, 150, W - 24, 132, 'Outbound Delivery Order 4000000210');
    kv(s, 28, 192, [['Ship-to', '200150  Casa Office Design'], ['ERP document', '80001250'], ['Warehouse', 'MA10']], { lw: 110, rowH: 24 });
    statusRow(s, 500, 196, [['Picking', 'Completed', 'ok'], ['Packing', 'Completed', 'ok'], ['Goods Issue', 'Not Started', 'warn']]);
    s.reg('header', [18, 156, 1080, 120], 'top', [500, 156, 400, 120]);
    s.table(12, 312, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Product', w: 120 }, { l: 'Description', w: 180 }, { l: 'Quantity', w: 100, align: 'r' }, { l: 'UoM', w: 56 }, { l: 'Stock Type', w: 110 }, { l: 'Picked', w: 100, align: 'r' }],
      rows: [['10', 'FG-2001', 'Cabinet assembly', '10', 'PC', 'F2', '10']],
      sel: 0, k: 'items', dir: 'right'
    });
    s.status('success', 'Goods issue posted for outbound delivery order 4000000210');
    return [s];
  },

  '/SCWM/PACK'() {
    const a = new Screen('scwm-pack-1', { tcode: '/SCWM/PACK', title: 'Packing - General', appbar: [HELP] });
    dim(a);
    a.dialog(320, 170, 480, 230, 'Work Center');
    const w1 = a.field(null, 344, 232, { l: 'Warehouse No.', lw: 130, v: 'MA10', w: 100 });
    const w2 = a.field(null, 344, 268, { l: 'Work Center', lw: 130, v: 'PACK-01', w: 120 });
    a.mark('wc', union(w1, w2), 'right');
    buttons(a, 344, 344, [{ l: 'Continue', icon: 'check', primary: true }, { l: 'Cancel' }]);
    const b = new Screen('scwm-pack-2', { tcode: '/SCWM/PACK', title: 'Packing - Work Center PACK-01', appbar: [{ l: 'Close HU', icon: 'lock', primary: true, k: 'close', dir: 'right', gap: 64 }, { l: 'Print', icon: 'print' }, HELP] });
    b.rect(12, 96, 360, 300, { fill: '#FFFFFF', stroke: C.border });
    const rows = [['▾ Work center PACK-01', 0], ['▸ ODO 4000000210', 1], ['FG-2001   10 PC  (to pack)', 2], ['▾ HU 1000000123  PAL-EUR', 1], ['FG-2001   10 PC', 2]];
    rows.forEach(([l, lvl], i) => b.text(26 + lvl * 18, 124 + i * 28, l, { size: 13, weight: i === 3 ? 700 : 400 }));
    b.mark('tree', [16, 102, 352, 150], 'right');
    b.group(392, 96, 716, 140, 'Create HU');
    b.field('pmat', 408, 138, { l: 'Packaging Material', lw: 160, v: 'PAL-EUR', w: 160, mono: true });
    b.field(null, 408, 174, { l: 'Handling Unit', lw: 160, v: '1000000123', w: 160, type: 'display', mono: true });
    b.group(392, 248, 716, 148, 'Pack Product');
    const r1 = b.field(null, 408, 290, { l: 'Product', lw: 160, v: 'FG-2001', w: 160, mono: true });
    const r2 = b.field(null, 408, 326, { l: 'Quantity', lw: 160, v: '10', w: 80, suffix: 'PC' });
    b.mark('repack', union(r1, r2), 'right');
    b.status('success', 'HU 1000000123 closed; gross weight 335 KG', null);
    return [a, b];
  }
};
