import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv } from './kit.mjs';

export default {
  QA32() {
    const a = new Screen('qa32-1', { tcode: 'QA32', title: 'Data for Inspection Lot: Selection', appbar: [EXEC, { l: 'Get Variant' }, HELP] });
    selection(a, 12, 96, 770, 'Inspection lot selection', [
      { k: 'sel_plant', l: 'Plant', v: 'MA01', w: 80 },
      { k: 'sel_origin', l: 'Inspection Lot Origin', v: '01', w: 60 },
      { k: 'sel_dates', l: 'Lot Created On', v: '01.11.2026', to: '20.11.2026', w: 110 },
      { l: 'Material', v: '', to: '', w: 140 }
    ]);
    selection(a, 12, 296, 770, 'Additional criteria', [{ type: 'check', l: 'Inspection lot without usage decision', v: true }]);
    const b = new Screen('qa32-2', { tcode: 'QA32', title: 'Change Data for Inspection Lot: Worklist', appbar: [{ l: 'Usage Decision', icon: 'check', primary: true, k: 'ud', dir: 'right', gap: 64 }, { l: 'Results' }, { l: 'Display Lot', icon: 'glasses' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Inspection Lot', w: 130 }, { l: 'Material', w: 100 }, { l: 'Batch', w: 100 }, { l: 'Lot Qty', w: 84, align: 'r' }, { l: 'BUn', w: 46 }, { l: 'Origin', w: 60 }, { l: 'Created', w: 100 }, { l: 'System Status', w: 150 }],
      rows: [['010000000123', 'RM-1001', 'B2026-12', '100', 'PC', '01', '19.11.2026', '@y REL CALC'], ['010000000124', 'RM-1002', '', '250', 'PC', '01', '15.11.2026', '@y REL CALC'], ['010000000119', 'RM-1001', 'B2026-11', '100', 'PC', '01', '15.11.2026', '@g UD SPCO']],
      sel: 0, k: 'res_list', dir: 'right', colKeys: { 7: 'res_status' }
    });
    return [a, b];
  },

  QA11() {
    const a = new Screen('qa11-1', { tcode: 'QA11', title: 'Record Usage Decision: Characteristic Overview', appbar: [{ l: 'Save', icon: 'save', primary: true }, HELP] });
    a.field('lot', 16, 100, { l: 'Inspection Lot', lw: 120, v: '010000000123', w: 140, mono: true, suffix: 'RM-1001  Steel sheet 2 mm   100 PC' });
    a.tabs(12, 140, ['Defects', 'Characteristics', 'Inspection Lot Stock'], 0);
    a.group(12, 186, W - 24, 160, 'Usage decision');
    a.field('udcode', 28, 228, { l: 'UD Code', lw: 140, v: 'A', w: 60, type: 'select', suffix: 'Accepted (OK)' });
    a.field(null, 28, 264, { l: 'Code group', lw: 140, v: '01', w: 60, type: 'display' });
    a.field(null, 28, 300, { l: 'Quality Score', lw: 140, v: '100', w: 60, type: 'display' });
    a.group(12, 358, W - 24, 110, 'Inspection lot');
    kv(a, 28, 396, [['Origin', '01  Goods receipt'], ['Batch', 'B2026-12']], { lw: 100, rowH: 24 });
    const b = new Screen('qa11-2', { tcode: 'QA11', title: 'Record Usage Decision: Stock Data', appbar: [{ l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.field(null, 16, 100, { l: 'Inspection Lot', lw: 120, v: '010000000123', w: 140, mono: true, type: 'display' });
    b.tabs(12, 140, ['Defects', 'Characteristics', 'Inspection Lot Stock'], 2, { 2: 'tab_stock' }, 'right');
    b.group(12, 186, W - 24, 300, 'Stock postings');
    const p1 = b.field(null, 28, 228, { l: 'To unrestricted use', lw: 200, v: '100', w: 100, suffix: 'PC' });
    b.field(null, 28, 264, { l: 'To scrap', lw: 200, v: '', w: 100 });
    b.field(null, 28, 300, { l: 'To sample usage', lw: 200, v: '', w: 100 });
    b.field(null, 28, 336, { l: 'To blocked stock', lw: 200, v: '', w: 100 });
    b.field(null, 28, 372, { l: 'Return delivery', lw: 200, v: '', w: 100 });
    b.mark('stock_post', [23, 224, 340, 182], 'right');
    b.field(null, 600, 228, { l: 'Open quantity', lw: 140, v: '100', w: 100, type: 'display' });
    b.field(null, 600, 264, { l: 'Movement type', lw: 140, v: '321', w: 70, type: 'display' });
    b.status('success', 'Usage decision for inspection lot 010000000123 saved; material document 5000004780', null);
    return [a, b];
  },

  MF60() {
    const a = new Screen('mf60-1', { tcode: 'MF60', title: 'Pull List: Initial Screen', appbar: [EXEC, HELP] });
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_plant', l: 'Plant', v: 'MA01', w: 80 },
      { k: 'sel_psa', l: 'Supply Area', v: 'ASSY-01', w: 120 },
      { k: 'sel_dates', l: 'Requirements Date', v: '20.11.2026', to: '22.11.2026', w: 110 }
    ]);
    selection(a, 12, 262, 770, 'Requirement type', [{ type: 'radio', options: ['Planned orders', 'Production orders', 'Reservations'], sel: 1 }]);
    const b = new Screen('mf60-2', { tcode: 'MF60', title: 'Pull List: Missing Parts Overview', appbar: [{ l: 'Replenishment Proposal', icon: 'flow', k: 'proposal', dir: 'right', gap: 64 }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.table(12, 120, {
      cols: [{ l: 'Material', w: 110 }, { l: 'Supply Area', w: 110 }, { l: 'Req. Qty', w: 96, align: 'r' }, { l: 'Stock in SLoc', w: 110, align: 'r' }, { l: 'Missing Qty', w: 104, align: 'r' }, { l: 'Repl. Qty', w: 96, align: 'r' }, { l: 'From SLoc', w: 90 }, { l: 'Repl. element', w: 130 }],
      rows: [['RM-1001', 'ASSY-01', '80', '0', '-80', '80', 'RM01', 'Stock transfer'], ['RM-1002', 'ASSY-01', '400', '150', '-250', '250', 'RM01', 'Stock transfer']],
      sel: 0, k: 'list', dir: 'right'
    });
    b.status('success', 'Replenishment elements created: 2 stock transfers (movement type 311)', null);
    return [a, b];
  },

  CO15() {
    const a = new Screen('co15-1', { tcode: 'CO15', title: 'Enter Production Order Confirmation: Initial Screen', appbar: [{ l: 'Actual Data' }, { l: 'Goods Movements' }, HELP] });
    a.group(12, 96, 600, 92, '');
    a.field('order', 28, 128, { l: 'Order', lw: 120, v: '1000789', w: 120, mono: true });
    const b = new Screen('co15-2', { tcode: 'CO15', title: 'Confirmation of Production Order Create: Actual Data', appbar: [{ l: 'Goods Movements', icon: 'flow', k: 'gm', dir: 'right', gap: 64 }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Order', '1000789    FG-2001 Cabinet assembly'], ['Plant', 'MA01   Total quantity 20 PC']], { lw: 80, bold: [0], rowH: 22 });
    b.group(12, 170, 540, 168, 'Quantities');
    const y1 = b.field(null, 28, 212, { l: 'Yield to Confirm', lw: 160, v: '20', w: 100, suffix: 'PC' });
    const y2 = b.field(null, 28, 248, { l: 'Confirmed Scrap', lw: 160, v: '0', w: 100 });
    b.mark('yield', union(y1, y2), 'right');
    b.field(null, 28, 284, { l: 'Rework', lw: 160, v: '0', w: 100 });
    b.group(568, 170, 540, 168, 'Confirmation type');
    const r1 = b.radio(584, 212, 'Partial confirmation', false);
    const r2 = b.radio(584, 244, 'Final confirmation', true);
    const r3 = b.radio(584, 276, 'Automatic final confirmation', false);
    b.mark('final', union(r1, r2, r3), 'right');
    b.group(12, 350, W - 24, 140, 'Goods movements (preview)');
    b.table(24, 388, {
      cols: [{ l: 'Material', w: 120 }, { l: 'Quantity', w: 90, align: 'r' }, { l: 'Un', w: 46 }, { l: 'Plnt', w: 60 }, { l: 'SLoc', w: 60 }, { l: 'MvT', w: 60 }],
      rows: [['FG-2001', '20', 'PC', 'MA01', 'FG01', '101'], ['RM-1001', '80', 'PC', 'MA01', 'PR01', '261'], ['RM-1002', '400', 'PC', 'MA01', 'PR01', '261']]
    });
    b.status('success', 'Confirmation of order 1000789 saved (3 goods movements, 0 with errors)', null);
    return [a, b];
  },

  HU02() {
    const s = new Screen('hu02', { tcode: 'HU02', title: 'Create and Change Handling Units', appbar: [{ l: 'Pack', icon: 'plus', primary: true, k: 'pack', dir: 'right', gap: 64 }, { l: 'Unpack' }, { l: 'Save', icon: 'save', k: 'save', dir: 'right', gap: 64 }, HELP] });
    s.text(16, 112, 'Packaging Materials', { weight: 700 });
    s.table(12, 122, {
      cols: [{ l: 'Packaging Material', w: 170 }, { l: 'Description', w: 200 }, { l: 'Quantity', w: 80, align: 'r' }, { l: 'Plant', w: 70 }],
      rows: [['PAL-EUR', 'Euro pallet 1200 x 800', '1', 'MA01']], k: 'pmat', dir: 'right'
    });
    s.text(16, 218, 'Handling units', { weight: 700 });
    s.rect(12, 228, W - 24, 132, { fill: '#FFFFFF', stroke: C.border });
    s.rect(14, 236, W - 28, 26, { fill: C.sel });
    s.text(28, 254, '▾ HU 1000000131   PAL-EUR   Gross weight 1,595 KG   SLoc RM01', { weight: 700, size: 13 });
    s.text(52, 284, 'RM-1001   Steel sheet 2 mm   100 PC   Batch B2026-11', { size: 13 });
    s.mark('hus', [14, 232, 700, 64], 'right');
    s.text(16, 394, 'Material to Be Packed', { weight: 700 });
    s.table(12, 404, {
      cols: [{ l: 'Material', w: 120 }, { l: 'Quantity', w: 90, align: 'r' }, { l: 'Un', w: 46 }, { l: 'Plant', w: 70 }, { l: 'SLoc', w: 70 }, { l: 'Batch', w: 110 }, { l: 'Stock', w: 110 }],
      rows: [['RM-1001', '100', 'PC', 'MA01', 'RM01', 'B2026-11', 'Unrestricted']], sel: 0, k: 'content', dir: 'right'
    });
    s.status('success', 'Handling unit 1000000131 saved', null);
    return [s];
  },

  MI01() {
    const a = new Screen('mi01-1', { tcode: 'MI01', title: 'Create Physical Inventory Document: Initial Screen', appbar: [{ l: 'Continue', icon: 'check' }, HELP] });
    a.group(12, 96, 760, 200, '');
    a.field(null, 28, 128, { l: 'Document Date', lw: 180, v: '20.11.2026', w: 110 });
    const p0 = a.field(null, 28, 162, { l: 'Planned Count Date', lw: 180, v: '30.11.2026', w: 110 });
    const p1 = a.field(null, 28, 196, { l: 'Plant', lw: 180, v: 'MA01', w: 80 });
    const p2 = a.field(null, 28, 230, { l: 'Storage Location', lw: 180, v: 'FG01', w: 80 });
    a.mark('plant', union(p0, p1, p2), 'right');
    a.group(12, 308, 760, 140, 'Other information');
    a.check('block', 28, 348, 'Posting Block', true);
    a.field('ref', 28, 386, { l: 'Phys. Inventory Ref.', lw: 180, v: 'FG-NOV26', w: 160 });
    const b = new Screen('mi01-2', { tcode: 'MI01', title: 'Create Physical Inventory Document: New Items', appbar: [{ l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.group(12, 96, W - 24, 62, '');
    kv(b, 28, 120, [['Plant / SLoc', 'MA01 / FG01'], ['Count date', '30.11.2026   Posting block active']], { lw: 110, rowH: 22 });
    b.table(12, 180, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Material', w: 130 }, { l: 'Batch', w: 110 }, { l: 'Stock Type', w: 140 }, { l: 'Book qty (info)', w: 120, align: 'r' }],
      rows: [['1', 'FG-2001', '', 'Unrestricted', '40'], ['', '', '', '', '']], sel: 0, k: 'items', dir: 'right'
    });
    b.status('success', 'Phys. inventory document 100000123 created', null);
    return [a, b];
  },

  VA01() {
    const a = new Screen('va01-1', { tcode: 'VA01', title: 'Create Sales Documents', appbar: [{ l: 'Create with Reference' }, { l: 'Sales' }, { l: 'Item Overview' }, HELP] });
    a.group(12, 96, 700, 92, '');
    a.field('type', 28, 128, { l: 'Order Type', lw: 160, v: 'OR', w: 70, suffix: 'Standard Order' });
    a.group(12, 200, 700, 160, 'Organizational Data');
    const o1 = a.field(null, 28, 242, { l: 'Sales Organization', lw: 160, v: '1000', w: 80 });
    a.field(null, 28, 276, { l: 'Distribution Channel', lw: 160, v: '10', w: 80 });
    const o3 = a.field(null, 28, 310, { l: 'Division', lw: 160, v: '00', w: 80 });
    a.mark('org', union(o1, o3), 'right');
    const b = new Screen('va01-2', { tcode: 'VA01', title: 'Create Standard Order: Overview', appbar: [{ l: 'Header Output Preview' }, { l: 'Orders' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.field('soldto', 16, 100, { l: 'Sold-To Party', lw: 140, v: '200100', w: 110, suffix: 'Maghreb Office Furniture SARL' });
    b.field(null, 16, 134, { l: 'Ship-To Party', lw: 140, v: '200100', w: 110 });
    b.field('ref', 560, 100, { l: 'Cust. Reference', lw: 130, v: 'PO-MOF-7781', w: 160 });
    b.tabs(12, 176, ['Sales', 'Item Overview', 'Item Detail', 'Ordering Party', 'Procurement', 'Shipping'], 0);
    b.field('date', 28, 228, { l: 'Req. Deliv. Date', lw: 140, v: '21.11.2026', w: 110 });
    b.field(null, 560, 228, { l: 'Net Value', lw: 130, v: '2,050.00', w: 120, type: 'display', suffix: 'MAD' });
    b.table(12, 270, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Material', w: 110 }, { l: 'Order Quantity', w: 110, align: 'r' }, { l: 'Un', w: 46 }, { l: 'Description', w: 200 }, { l: 'Confirmed', w: 96, align: 'r' }, { l: 'Net Value', w: 100, align: 'r' }],
      rows: [['10', 'FG-2001', '20', 'PC', 'Cabinet assembly', '20', '1,900.00'], ['20', 'RM-1003', '30', 'PC', 'Hinge set', '30', '150.00']],
      sel: 0, k: 'items', dir: 'right'
    });
    b.status('success', 'Standard Order 12000345 has been saved', null);
    return [a, b];
  }
};
