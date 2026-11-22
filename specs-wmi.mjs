import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv } from './kit.mjs';

function sel(file, tcode, title) { return new Screen(file, { tcode, title, appbar: [EXEC, { l: 'Get Variant' }, HELP] }); }
function opts(s, y, title, items, key) {
  s.group(12, y, 770, 44 + items.length * 34, title);
  const boxes = items.map(([l, v], i) => s.check(null, 28, y + 42 + i * 34, l, v));
  if (key) s.mark(key, union(...boxes), 'right');
}

export default {
  LX03() {
    const a = sel('lx03-1', 'LX03', 'Bin Status Report');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { k: 'sel_type', l: 'Storage Type', v: '001', to: '', w: 70 },
      { l: 'Storage Bin', v: '', to: '', w: 110 }
    ]);
    opts(a, 262, 'Bin status', [['Only empty bins', false], ['Only occupied bins', false], ['Only blocked bins', false], ['Only bins active in inventory', false]], 'sel_opts');
    const b = new Screen('lx03-2', { tcode: 'LX03', title: 'Bin Status Report: Warehouse 100, Storage Type 001', appbar: [{ l: 'Bin', icon: 'glasses' }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 104 }, { l: 'Material', w: 100 }, { l: 'Total Stock', w: 100, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'Empty', w: 60, align: 'c' }, { l: 'Putaway blk', w: 96, align: 'c' }, { l: 'Removal blk', w: 96, align: 'c' }, { l: 'Inv. active', w: 90, align: 'c' }],
      rows: [
        ['001', '01-02-03', 'RM-1001', '200', 'PC', '[ ]', '[ ]', '[ ]', '[ ]'],
        ['001', '01-04-01', 'RM-1001', '120', 'PC', '[ ]', '[ ]', '[ ]', '[ ]'],
        ['001', '01-06-04', '', '0', '', '[x]', '[ ]', '[ ]', '[ ]'],
        ['001', '01-07-01', '', '0', '', '[x]', '[ ]', '[ ]', '[ ]'],
        ['001', '01-08-02', 'RM-1003', '40', 'PC', '[ ]', '[ ]', '@r [x]', '[ ]'],
        ['001', '01-09-03', 'RM-1002', '600', 'PC', '[ ]', '[ ]', '[ ]', '@y [x]']
      ],
      sel: 4, k: 'res_list', dir: 'right', colKeys: { 7: 'res_block' }
    });
    return [a, b];
  },

  LI01N() {
    const s = new Screen('li01n', { tcode: 'LI01N', title: 'Create System Inventory Record', appbar: [{ l: 'Activate', icon: 'check', k: 'activate', dir: 'right', gap: 64 }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    s.group(12, 96, W - 24, 128, 'Header');
    const h1 = s.field(null, 28, 138, { l: 'Warehouse Number', lw: 160, v: '100', w: 80 });
    const h2 = s.field(null, 28, 174, { l: 'Storage Type', lw: 160, v: '001', w: 80 });
    s.mark('whse', union(h1, h2), 'right');
    const r1 = s.field(null, 600, 138, { l: 'Inventory Ref.', lw: 150, v: 'RM1001-CHK', w: 150 });
    const r2 = s.field(null, 600, 174, { l: 'Planned Count Date', lw: 150, v: '20.11.2026', w: 110 });
    s.mark('ref', union(r1, r2), 'bottom');
    s.text(16, 262, 'Storage bins', { weight: 700 });
    s.table(12, 272, {
      cols: [{ l: 'Storage Bin', w: 140 }, { l: 'Material', w: 120 }, { l: 'Batch', w: 110 }, { l: 'Book qty', w: 100, align: 'r' }, { l: 'BUn', w: 50 }],
      rows: [['01-02-03', 'RM-1001', 'B2026-10', '200', 'PC'], ['01-04-01', 'RM-1001', 'B2026-10', '120', 'PC'], ['01-05-02', 'RM-1001', 'B2026-10', '15', 'PC'], ['', '', '', '', '']],
      k: 'bins', dir: 'right'
    });
    s.text(16, 440, 'Book quantities are for information; activation blocks the bins for movements.', { fill: C.muted, size: 12.5 });
    s.status('success', 'Inventory record 0000000123 created and activated', null);
    return [s];
  },

  LI02N() {
    const s = new Screen('li02n', { tcode: 'LI02N', title: 'Change System Inventory Record', appbar: [{ l: 'Activate', icon: 'check', k: 'activate', dir: 'right', gap: 64 }, { l: 'Delete item' }, { l: 'Save', icon: 'save', primary: true }, HELP] });
    s.group(12, 96, W - 24, 92, '');
    const d1 = s.field(null, 28, 120, { l: 'Warehouse Number', lw: 160, v: '100', w: 80 });
    const d2 = s.field(null, 28, 154, { l: 'Inventory record', lw: 160, v: '0000000125', w: 130, mono: true });
    s.mark('doc', union(d1, d2), 'right');
    kv(s, 600, 136, [['Storage Type', '002   Shelf storage'], ['Count date', '20.11.2026']], { lw: 110, rowH: 22 });
    s.table(12, 230, {
      cols: [{ l: 'Item', w: 60, align: 'r' }, { l: 'Storage Bin', w: 140 }, { l: 'Material', w: 120 }, { l: 'Batch', w: 110 }, { l: 'Book qty', w: 100, align: 'r' }, { l: 'Status', w: 140 }],
      rows: [['1', '02-01-05', 'RM-1001', 'B2026-11', '100', '@g Active'], ['2', '02-02-04', 'RM-1002', '', '1,200', '@g Active'], ['3', '02-03-01', 'RM-1001', 'B2026-10', '20', '@g Active']],
      k: 'items', dir: 'right'
    });
    s.status('success', 'Inventory record 0000000125 activated');
    return [s];
  },

  LI03N() {
    const s = new Screen('li03n', { tcode: 'LI03N', title: 'Display System Inventory Record 0000000123', appbar: [{ l: 'Other record', icon: 'doc' }, { l: 'Transfer orders' }, HELP] });
    s.group(12, 96, 560, 92, '');
    const d1 = s.field(null, 28, 120, { l: 'Warehouse Number', lw: 160, v: '100', w: 80, type: 'display' });
    const d2 = s.field(null, 28, 154, { l: 'Inventory record', lw: 160, v: '0000000123', w: 130, mono: true, type: 'display' });
    s.mark('doc', union(d1, d2), 'right');
    s.group(588, 96, 520, 92, '');
    const hb = kv(s, 604, 120, [['Storage Type', '001   High rack storage'], ['Reference', 'RM1001-CHK'], ['Count date', '20.11.2026']], { lw: 110, rowH: 22 });
    s.mark('header', [592, 100, 510, 84], 'bottom');
    s.table(12, 250, {
      cols: [{ l: 'Item', w: 56, align: 'r' }, { l: 'Storage Bin', w: 120 }, { l: 'Material', w: 110 }, { l: 'Book qty', w: 96, align: 'r' }, { l: 'Counted', w: 96, align: 'r' }, { l: 'Difference', w: 100, align: 'r' }, { l: 'BUn', w: 50 }, { l: 'Status', w: 150 }],
      rows: [['1', '01-02-03', 'RM-1001', '200', '198', '-2', 'PC', '@y Counted, difference'], ['2', '01-04-01', 'RM-1001', '120', '120', '0', 'PC', '@g Counted'], ['3', '01-05-02', 'RM-1001', '15', '15', '0', 'PC', '@g Counted']],
      sel: 0, k: 'items', dir: 'right', colKeys: { 7: 'status_col' }
    });
    return [s];
  },

  LX15() {
    const a = sel('lx15-1', 'LX15', 'Annual Inventory: Select Storage Bins');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { k: 'sel_type', l: 'Storage Type', v: '001', w: 70 },
      { l: 'Storage Bin', v: '', to: '', w: 110 }
    ]);
    a.group(12, 262, 770, 180, 'Inventory data');
    const o1 = a.check(null, 28, 304, 'Test run', true);
    const o2 = a.field(null, 28, 338, { l: 'Planned Count Date', lw: 190, v: '28.11.2026', w: 110 });
    const o3 = a.field(null, 28, 372, { l: 'Max. bins per record', lw: 190, v: '3', w: 60 });
    a.field(null, 28, 406, { l: 'Inventory Ref.', lw: 190, v: 'ANNUAL-2026', w: 150 });
    a.mark('sel_opts', union(o1, o2, o3), 'right');
    const b = new Screen('lx15-2', { tcode: 'LX15', title: 'Annual Inventory: Proposed Storage Bins (Test Run)', appbar: [{ l: 'Create inventory record', icon: 'plus', k: 'res_create', dir: 'right', gap: 64 }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 110 }, { l: 'Last inventory', w: 120 }, { l: 'Material', w: 110 }, { l: 'Total Stock', w: 100, align: 'r' }, { l: 'Proposed record', w: 130 }],
      rows: [
        ['001', '01-07-01', '15.01.2025', '', '0', 'Record 1'], ['001', '01-07-02', '15.01.2025', 'RM-1003', '800', 'Record 1'], ['001', '01-08-01', '15.01.2025', 'RM-1002', '2,400', 'Record 1'],
        ['001', '01-08-02', '15.01.2025', 'RM-1003', '40', 'Record 2'], ['001', '01-08-03', '15.01.2025', '', '0', 'Record 2'], ['001', '01-09-01', '15.01.2025', 'RM-1002', '300', 'Record 2']
      ],
      k: 'res_list', dir: 'right'
    });
    b.text(16, 362, '6 bins selected, 2 inventory records proposed. Test run: nothing created.', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  LX16() {
    const a = sel('lx16-1', 'LX16', 'Continuous Inventory: Select Storage Bins');
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { k: 'sel_type', l: 'Storage Type', v: '002', w: 70 }
    ]);
    a.group(12, 228, 770, 146, 'Inventory data');
    const d1 = a.field(null, 28, 270, { l: 'Planned Count Date', lw: 190, v: '20.11.2026', w: 110 });
    const d2 = a.field(null, 28, 304, { l: 'Max. number of bins', lw: 190, v: '10', w: 60 });
    a.mark('sel_date', union(d1, d2), 'right');
    a.check('sel_test', 28, 340, 'Test run', true);
    const b = new Screen('lx16-2', { tcode: 'LX16', title: 'Continuous Inventory: Storage Type 002', appbar: [{ l: 'Create inventory record', icon: 'plus' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 110 }, { l: 'Last inventory', w: 120 }, { l: 'Material', w: 110 }, { l: 'Total Stock', w: 100, align: 'r' }, { l: 'Inventory record', w: 140 }],
      rows: [
        ['002', '02-01-05', '20.01.2025', 'RM-1001', '100', '0000000125'], ['002', '02-02-04', '20.01.2025', 'RM-1002', '1,200', '0000000125'], ['002', '02-03-01', '20.01.2025', 'RM-1001', '20', '0000000125'],
        ['002', '02-03-02', '20.01.2025', '', '0', '0000000125'], ['002', '02-04-01', '22.01.2025', 'RM-1003', '150', '0000000125']
      ],
      k: 'res_list', dir: 'right'
    });
    b.text(16, 336, '10 bins selected (5 shown). Inventory record 0000000125 created, not yet activated.', { fill: C.muted, size: 12.5 });
    return [a, b];
  },

  LI20() {
    const s = new Screen('li20', { tcode: 'LI20', title: 'Clear Inventory Differences in WM', appbar: [EXEC, { l: 'Clear', icon: 'check', primary: true, k: 'clear', dir: 'right', gap: 64 }, HELP] });
    s.group(12, 96, 770, 92, '');
    const a1 = s.field(null, 28, 120, { l: 'Warehouse Number', lw: 170, v: '100', w: 80 });
    const a2 = s.field(null, 28, 154, { l: 'Inventory record', lw: 170, v: '0000000123', w: 130, mono: true });
    s.mark('sel_whse', union(a1, a2), 'right');
    s.table(12, 240, {
      cols: [{ l: 'Typ', w: 50 }, { l: 'StorageBin', w: 104 }, { l: 'Material', w: 100 }, { l: 'Batch', w: 100 }, { l: 'Book qty', w: 90, align: 'r' }, { l: 'Counted', w: 90, align: 'r' }, { l: 'Difference', w: 96, align: 'r' }, { l: 'Value MAD', w: 104, align: 'r' }, { l: 'Interim bin', w: 130 }],
      rows: [['001', '01-02-03', 'RM-1001', 'B2026-10', '200', '198', '-2', '-25.00', '999 / 0000000123']],
      sel: 0, k: 'res_list', dir: 'top', colKeys: { 7: 'res_value' }
    });
    s.text(16, 320, 'After clearing, post the difference in Inventory Management with LI21 (movement type 711).', { fill: C.muted, size: 12.5 });
    s.status('success', 'Inventory difference cleared: transfer order 0000004630 created');
    return [s];
  }
};
