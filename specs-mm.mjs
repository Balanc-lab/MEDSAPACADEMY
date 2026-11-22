import { Screen, selection, union, W } from './lib.mjs';

const EXEC = { l: 'Execute', icon: 'exec', k: 'exec', dir: 'right', gap: 60 };

export default {
  MIGO() {
    const s = new Screen('migo', {
      tcode: 'MIGO', title: 'Goods Receipt Purchase Order 4500012345 - TRAINEE01',
      appbar: [{ l: 'Show Overview' }, { l: 'Hold' }, { l: 'Check', icon: 'check' }, { l: 'Post', icon: 'save', primary: true, k: 'post', dir: 'right' }, { l: 'Help', right: true }]
    });
    s.input(16, 98, 200, 'A01 Goods Receipt', { type: 'select' }); s.reg('action', [12, 94, 208, 32], 'bottom', [16, 98, 200, 24]);
    s.input(228, 98, 190, 'R01 Purchase Order', { type: 'select' }); s.reg('ref', [224, 94, 198, 32], 'bottom', [228, 98, 190, 24]);
    s.input(430, 98, 140, '4500012345', { mono: true }); s.reg('po', [426, 94, 148, 32], 'bottom', [430, 98, 140, 24]);
    s.text(586, 115, 'Plant', { fill: '#6A6D70' }); s.input(626, 98, 110, 'MA01');
    s.input(840, 98, 264, 'GR goods receipt  101', { type: 'select' }); s.reg('mvt', [836, 94, 272, 32], 'bottom', [840, 98, 264, 24]);
    s.group(12, 158, W - 24, 132, '');
    s.tabs(24, 162, ['General', 'Vendor'], 0);
    s.field(null, 32, 206, { l: 'Document Date', lw: 120, v: '15.11.2026', w: 110 });
    s.field(null, 32, 244, { l: 'Delivery Note', lw: 120, v: 'DN-77812', w: 150 });
    s.field(null, 330, 206, { l: 'Posting Date', lw: 110, v: '15.11.2026', w: 110 });
    s.field(null, 330, 244, { l: 'Bill of Lading', lw: 110, v: '', w: 150 });
    s.mark('hdr', [24, 200, 590, 74], 'right');
    s.field(null, 700, 206, { l: 'HeaderText', lw: 100, v: 'Steel sheets truck 2', w: 280 });
    s.field(null, 700, 244, { l: 'Individual Slip', lw: 100, v: '', w: 120, type: 'select' });
    s.text(16, 318, 'Item overview', { weight: 700 });
    s.table(12, 328, {
      cols: [{ l: 'Line', w: 44 }, { l: 'Mat. Short Text', w: 230 }, { l: 'OK', w: 40, align: 'c' }, { l: 'Qty in UnE', w: 100, align: 'r' }, { l: 'EUn', w: 50 }, { l: 'SLoc', w: 70 }, { l: 'Stock Type', w: 150 }, { l: 'Plant', w: 64 }, { l: 'Batch', w: 100 }, { l: 'MvT', w: 56 }],
      rows: [['1', 'Steel sheet 2 mm  RM-1001', '[x]', '100', 'PC', 'RM01', 'Unrestricted use', 'MA01', 'B2026-11', '101'], ['2', 'Bolt M8 x 40  RM-1002', '[ ]', '250', 'PC', 'RM01', 'Quality inspection', 'MA01', '', '101']],
      sel: 0, colKeys: { 3: 'qty' }
    });
    s.group(12, 428, W - 24, 230, '');
    s.tabs(24, 432, ['Material', 'Quantity', 'Where', 'PO Data', 'Partner', 'Account Assignment'], 2);
    s.field(null, 32, 478, { l: 'Movement Type', lw: 130, v: '101', w: 60, suffix: '+  GR goods receipt' });
    const st = s.field(null, 32, 514, { l: 'Stock type', lw: 130, v: 'Unrestricted use', w: 210, type: 'select' });
    s.field(null, 32, 550, { l: 'Plant', lw: 130, v: 'MA01  Casablanca', w: 210, type: 'display' });
    const sl = s.field(null, 32, 586, { l: 'Storage location', lw: 130, v: 'RM01  Raw materials', w: 210, type: 'select' });
    s.mark('where', union(st, sl), 'right');
    s.field(null, 600, 514, { l: 'Goods recipient', lw: 130, v: '', w: 200 });
    s.field(null, 600, 550, { l: 'Unloading Point', lw: 130, v: 'Gate 3', w: 200 });
    s.check('itemok', 32, 624, 'Item OK', true, 'right');
    s.text(W - 120, 640, 'Line  1  of  2', { fill: '#6A6D70' });
    s.status('success', 'Material document 5000004711 posted');
    return [s];
  },

  MMBE() {
    const a = new Screen('mmbe-1', { tcode: 'MMBE', title: 'Stock Overview: Company Code/Plant/Storage Location/Batch', appbar: [EXEC, { l: 'Get Variant' }, { l: 'Help', right: true }] });
    selection(a, 12, 96, 760, 'Database Selections', [
      { k: 'mat', l: 'Material', v: 'RM-1001', w: 200 },
      { k: 'plant', l: 'Plant', v: 'MA01', to: '' },
      { l: 'Storage Location', v: '', to: '' },
      { l: 'Batch', v: '', to: '' }
    ]);
    selection(a, 12, 290, 760, 'Stock Type Selection', [
      { type: 'check', l: 'Also Select Special Stocks', v: false },
      { type: 'check', l: 'Also Select Stock Commitments', v: true }
    ]);
    selection(a, 12, 420, 760, 'List Display', [
      { l: 'Display Version', v: '1', w: 60 },
      { type: 'check', l: 'Display Unit = Base Unit', v: true },
      { type: 'check', l: 'No Zero Stock Lines', v: true }
    ]);
    const b = new Screen('mmbe-2', { tcode: 'MMBE', title: 'Stock Overview: Basic List', appbar: [{ l: 'Detailed Display', icon: 'glasses' }, { l: 'Expand All' }, { l: 'Collapse All' }, { l: 'Help', right: true }] });
    b.group(12, 96, W - 24, 92, 'Selection');
    b.text(28, 154, 'Material', { fill: '#6A6D70' }); b.text(128, 154, 'RM-1001   Steel sheet 2 mm', { weight: 700 });
    b.text(28, 178, 'Material Type', { fill: '#6A6D70' }); b.text(128, 178, 'ROH   Raw material');
    b.text(560, 154, 'Base Unit of Measure', { fill: '#6A6D70' }); b.text(720, 154, 'PC');
    b.text(560, 178, 'Unit of Measure', { fill: '#6A6D70' }); b.text(720, 178, 'PC');
    b.table(12, 210, {
      cols: [{ l: 'Client/Company Code/Plant/Storage Location/Batch', w: 380 }, { l: 'Unrestricted use', w: 130, align: 'r' }, { l: 'Qual. inspection', w: 130, align: 'r' }, { l: 'Blocked', w: 100, align: 'r' }, { l: 'Reserved', w: 100, align: 'r' }, { l: 'On-order stock', w: 120, align: 'r' }],
      rows: [
        ['▾0 Full', '420.000', '100.000', '15.000', '80.000', '100.000'],
        ['▾1 1000  LogiCorp Maroc SA', '420.000', '100.000', '15.000', '80.000', '100.000'],
        ['▾2 MA01  Casablanca', '420.000', '100.000', '15.000', '80.000', '100.000'],
        ['▾3 RM01  Raw materials', '420.000', '100.000', '15.000', '', ''],
        ['·4 B2026-10', '320.000', '', '15.000', '', ''],
        ['·4 B2026-11', '100.000', '', '', '', ''],
        ['·4 B2026-12', '', '100.000', '', '', '']
      ],
      sel: 3, colKeys: { 0: 'tree' }, rowKeys: { 3: 'detail' }, rowDir: 'right', selector: true
    });
    b.mark('cols', [b.fields.tree.box[0] + 398, 207, 584, 36], 'top');
    return [a, b];
  },

  MB51() {
    const a = new Screen('mb51-1', { tcode: 'MB51', title: 'Material Document List', appbar: [EXEC, { l: 'Get Variant' }, { l: 'Data Sources' }, { l: 'Help', right: true }] });
    selection(a, 12, 96, 770, 'Item Data', [
      { k: 'sel_mat', l: 'Material', v: 'RM-1001', to: '' },
      { k: 'sel_plant', l: 'Plant', v: 'MA01', to: '' },
      { l: 'Storage Location', v: 'RM01', to: '' },
      { l: 'Batch', v: '', to: '' },
      { k: 'sel_mvt', l: 'Movement Type', v: '', to: '' }
    ]);
    selection(a, 12, 330, 770, 'Header Data', [
      { k: 'sel_date', l: 'Posting Date', v: '01.11.2026', to: '30.11.2026' },
      { l: 'User Name', v: '', to: '' },
      { l: 'Transaction Code', v: '', to: '' }
    ]);
    selection(a, 12, 494, 770, 'Display Options', [
      { type: 'radio', options: ['Hierarchical Representation', 'Non-Hierarchical Representation'], sel: 1 },
      { l: 'Layout', v: '/STANDARD', w: 150 }
    ]);
    const b = new Screen('mb51-2', { tcode: 'MB51', title: 'Material Document List', appbar: [{ l: 'Details', icon: 'glasses' }, { l: 'Material Document', icon: 'doc' }, { l: 'Accounting Documents' }, { l: 'Help', right: true }] });
    b.alvToolbar(12, 96);
    b.table(12, 132, {
      cols: [{ l: 'Material Doc.', w: 120 }, { l: 'Item', w: 50, align: 'r' }, { l: 'Pstng Date', w: 100 }, { l: 'MvT', w: 56 }, { l: 'Material', w: 100 }, { l: 'SLoc', w: 60 }, { l: 'Batch', w: 96 }, { l: 'Quantity', w: 96, align: 'r' }, { l: 'EUn', w: 50 }, { l: 'Amount LC', w: 110, align: 'r' }, { l: 'User Name', w: 120 }],
      rows: [
        ['5000004711', '1', '15.11.2026', '101', 'RM-1001', 'RM01', 'B2026-11', '100', 'PC', '1,250.00', 'TRAINEE01'],
        ['5000004730', '1', '18.11.2026', '261', 'RM-1001', 'RM01', 'B2026-10', '-80', 'PC', '-1,000.00', 'PRODOP02'],
        ['5000004752', '1', '19.11.2026', '101', 'RM-1001', 'RM01', 'B2026-12', '100', 'PC', '1,250.00', 'TRAINEE01']
      ],
      sel: 1, k: 'res_list', dir: 'top', rowKeys: { 1: 'res_row' }, rowDir: 'right'
    });
    b.text(16, 262, '3 entries displayed', { fill: '#6A6D70', size: 12.5 });
    return [a, b];
  },

  MB52() {
    const a = new Screen('mb52-1', { tcode: 'MB52', title: 'Display Warehouse Stocks of Material', appbar: [EXEC, { l: 'Get Variant' }, { l: 'Help', right: true }] });
    a.group(12, 96, 770, 214, 'Database Selections');
    const m1 = a.field(null, 28, 138, { l: 'Material', lw: 190, v: '', w: 150, to: '', multi: true });
    a.field('sel_plant', 28, 172, { l: 'Plant', lw: 190, v: 'MA01', w: 150, to: '', multi: true });
    a.field(null, 28, 206, { l: 'Storage Location', lw: 190, v: '', w: 150, to: '', multi: true });
    const m2 = a.field(null, 28, 240, { l: 'Material Type', lw: 190, v: 'ROH', w: 150, to: '', multi: true });
    a.field(null, 28, 274, { l: 'Material Group', lw: 190, v: '', w: 150, to: '', multi: true });
    a.mark('sel_mat', union(m1, m2), 'right');
    selection(a, 12, 330, 770, 'Selection', [
      { type: 'check', k: 'sel_zero', l: 'Hide Zero Stock Lines', v: true },
      { type: 'check', l: 'Display Batch Stocks', v: false },
      { type: 'check', l: 'Also Select Special Stocks', v: false }
    ]);
    selection(a, 12, 494, 770, 'Display Version', [
      { type: 'radio', options: ['Hierarchical', 'Non-Hierarchical'], sel: 1 },
      { l: 'Layout', v: '', w: 150 }
    ]);
    const b = new Screen('mb52-2', { tcode: 'MB52', title: 'Display Warehouse Stocks of Material', appbar: [{ l: 'Details', icon: 'glasses' }, { l: 'Stock Overview' }, { l: 'Help', right: true }] });
    b.alvToolbar(12, 96, 'res_total', 'right');
    b.table(12, 132, {
      cols: [{ l: 'Material', w: 170 }, { l: 'Plnt', w: 54 }, { l: 'SLoc', w: 56 }, { l: 'BUn', w: 46 }, { l: 'Unrestricted', w: 104, align: 'r' }, { l: 'Value Unrestr.', w: 116, align: 'r' }, { l: 'Transit/Transf.', w: 112, align: 'r' }, { l: 'In Qual. Insp.', w: 108, align: 'r' }, { l: 'Value in QI', w: 104, align: 'r' }, { l: 'Blocked', w: 82, align: 'r' }],
      rows: [
        ['RM-1001 Steel sheet', 'MA01', 'RM01', 'PC', '420', '5,250.00', '0', '100', '1,250.00', '15'],
        ['RM-1002 Bolt M8x40', 'MA01', 'RM01', 'PC', '2,400', '720.00', '0', '250', '75.00', '0'],
        ['RM-1003 Hinge set', 'MA01', 'RM01', 'PC', '800', '1,920.00', '0', '0', '0.00', '12'],
        ['FG-2001 Cabinet', 'MA01', 'FG01', 'PC', '50', '2,000.00', '0', '0', '0.00', '0']
      ],
      totals: ['Σ', '', '', '', '', '9,890.00', '', '', '1,325.00', ''],
      sel: 0
    });
    b.mark('res_cols', [12 + 18 + 326 - 2, 128, 626, 36], 'top');
    return [a, b];
  },

  MB5B() {
    const a = new Screen('mb5b-1', { tcode: 'MB5B', title: 'Stock on Posting Date', appbar: [EXEC, { l: 'Get Variant' }, { l: 'Help', right: true }] });
    selection(a, 12, 96, 770, 'Database Selections', [
      { k: 'sel_mat', l: 'Material', v: 'RM-1001', to: '' },
      { l: 'Company Code', v: '', to: '' },
      { k: 'sel_plant', l: 'Plant', v: 'MA01', to: '' },
      { l: 'Storage Location', v: 'RM01', to: '' },
      { k: 'sel_dates', l: 'Posting Date', v: '01.11.2026', to: '19.11.2026' }
    ]);
    selection(a, 12, 330, 770, 'Stock Type', [
      { type: 'radio', k: 'sel_type', options: ['Storage Loc./Batch Stock', 'Valuated Stock', 'Special Stock'], sel: 0 }
    ]);
    selection(a, 12, 426, 770, 'List Scope', [
      { type: 'check', l: 'Totals Only - Non-Hierarchical Representation', v: false },
      { type: 'check', l: 'No Reversal Movements', v: false }
    ]);
    const b = new Screen('mb5b-2', { tcode: 'MB5B', title: 'Stock on Posting Date', appbar: [{ l: 'Material Document', icon: 'doc' }, { l: 'Help', right: true }] });
    b.group(12, 96, 640, 186, 'Plant MA01  /  Material RM-1001  /  Storage Location RM01');
    const rows = [['Opening Stock 01.11.2026', '415.000 PC'], ['Total Receipt Quantities', '200.000 PC'], ['Total Issue Quantities', '-80.000 PC'], ['Closing Stock 19.11.2026', '535.000 PC']];
    rows.forEach((r, i) => { const y = 148 + i * 30; b.text(30, y, r[0], { weight: i === 0 || i === 3 ? 700 : 400 }); b.text(430, y, r[1], { anchor: 'end', weight: i === 3 ? 700 : 400, fill: r[1].startsWith('-') ? '#BB0000' : '#32363A' }); });
    b.mark('res_balance', [22, 128, 420, 128], 'right');
    b.text(680, 150, 'Closing stock includes all stock types:', { fill: '#6A6D70', size: 12.5 });
    b.text(680, 172, '420 unrestricted + 100 quality insp. + 15 blocked', { size: 12.5 });
    b.table(12, 306, {
      cols: [{ l: 'Pstng Date', w: 110 }, { l: 'MvT', w: 60 }, { l: 'Material Doc.', w: 130 }, { l: 'Batch', w: 100 }, { l: 'Quantity', w: 110, align: 'r' }, { l: 'EUn', w: 50 }],
      rows: [['15.11.2026', '101', '5000004711', 'B2026-11', '100.000', 'PC'], ['18.11.2026', '261', '5000004730', 'B2026-10', '-80.000', 'PC'], ['19.11.2026', '101', '5000004752', 'B2026-12', '100.000', 'PC']],
      k: 'res_moves', dir: 'right'
    });
    return [a, b];
  },

  MB5T() {
    const a = new Screen('mb5t-1', { tcode: 'MB5T', title: 'Stock in Transit', appbar: [EXEC, { l: 'Get Variant' }, { l: 'Help', right: true }] });
    selection(a, 12, 96, 770, 'Database Selections', [
      { k: 'sel_mat', l: 'Material', v: '', to: '' },
      { k: 'sel_plant', l: 'Receiving Plant', v: 'MA02', to: '' },
      { k: 'sel_supp', l: 'Supplying Plant', v: 'MA01', to: '' },
      { l: 'Purchasing Document', v: '', to: '' }
    ]);
    selection(a, 12, 296, 770, 'Output', [
      { type: 'check', l: 'Only Items with Stock in Transit', v: true },
      { l: 'Layout', v: '', w: 150 }
    ]);
    const b = new Screen('mb5t-2', { tcode: 'MB5T', title: 'Stock in Transit', appbar: [{ l: 'Purchase Order', icon: 'doc' }, { l: 'PO History' }, { l: 'Help', right: true }] });
    b.alvToolbar(12, 96);
    b.table(12, 132, {
      cols: [{ l: 'Purch.Doc.', w: 116 }, { l: 'Item', w: 50, align: 'r' }, { l: 'Material', w: 110 }, { l: 'Plnt', w: 56 }, { l: 'SPlt', w: 56 }, { l: 'Stock in Transit', w: 130, align: 'r' }, { l: 'BUn', w: 50 }, { l: 'Value in Transit', w: 130, align: 'r' }, { l: 'Crcy', w: 56 }, { l: 'GI Date', w: 104 }],
      rows: [['4500020011', '10', 'RM-1001', 'MA02', 'MA01', '200', 'PC', '2,500.00', 'MAD', '15.11.2026'], ['4500020011', '20', 'RM-1002', 'MA02', 'MA01', '1,000', 'PC', '300.00', 'MAD', '15.11.2026'], ['4500020015', '10', 'FG-2001', 'MA02', 'MA01', '20', 'PC', '800.00', 'MAD', '18.11.2026']],
      sel: 0, k: 'res_list', dir: 'top'
    });
    b.mark('res_doc', [28, 160, 120, 30], 'bottom');
    return [a, b];
  }
};
