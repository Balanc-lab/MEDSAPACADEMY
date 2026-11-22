import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv, buttons } from './kit.mjs';

const DLV_ROWS = [['10', 'FG-2001', 'Cabinet assembly', '20', 'PC', 'TAN', 'FG01'], ['20', 'RM-1003', 'Hinge set', '30', 'PC', 'TAN', 'RM01']];

function dlvHeader(s, ro) {
  const t = ro ? 'display' : 'text';
  const d = s.field(null, 16, 98, { l: 'Outbound Delivery', lw: 140, v: '80001234', w: 120, mono: true, type: t });
  s.field(null, 300, 98, { l: 'Document Date', lw: 120, v: '20.11.2026', w: 110, type: 'display' });
  s.field(null, 16, 132, { l: 'Ship-to Party', lw: 140, v: '200100   Maghreb Office Furniture SARL', w: 360, type: 'display' });
  return d;
}

export default {
  VL01N() {
    const a = new Screen('vl01n-1', { tcode: 'VL01N', title: 'Create Outbound Delivery with Order Reference', appbar: [{ l: 'With Order Reference' }, { l: 'Without Order Reference' }, HELP] });
    a.group(12, 96, 700, 150, 'Shipping');
    a.field('shpt', 28, 138, { l: 'Shipping Point', lw: 160, v: 'MA01', w: 80 });
    a.field('date', 28, 172, { l: 'Selection Date', lw: 160, v: '20.11.2026', w: 110 });
    a.field(null, 28, 206, { l: 'Delivery Type', lw: 160, v: 'LF', w: 60 });
    a.group(12, 258, 700, 150, 'Order Data');
    a.field('order', 28, 300, { l: 'Order', lw: 160, v: '12000345', w: 120, mono: true });
    a.field(null, 28, 334, { l: 'From Item', lw: 160, v: '', w: 70 });
    a.field(null, 28, 368, { l: 'To Item', lw: 160, v: '', w: 70 });
    const b = new Screen('vl01n-2', { tcode: 'VL01N', title: 'Outbound Delivery Create: Overview', appbar: [{ l: 'Header Details' }, { l: 'Document Flow' }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.field(null, 16, 98, { l: 'Outbound Delivery', lw: 140, v: '', w: 120, type: 'display' });
    b.field(null, 300, 98, { l: 'Planned GI', lw: 90, v: '21.11.2026', w: 110 });
    b.field(null, 16, 132, { l: 'Ship-to Party', lw: 140, v: '200100   Maghreb Office Furniture SARL', w: 360, type: 'display' });
    b.tabs(12, 176, ['Item Overview', 'Picking', 'Loading', 'Transport', 'Status Overview', 'Goods Movement Data'], 0);
    b.table(12, 222, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Material', w: 110 }, { l: 'Description', w: 200 }, { l: 'Deliv. Qty', w: 100, align: 'r' }, { l: 'Un', w: 50 }, { l: 'ItCa', w: 66 }, { l: 'SLoc', w: 66 }],
      rows: DLV_ROWS, k: 'items', dir: 'right'
    });
    b.status('success', 'Outbound Delivery 80001234 has been saved', null);
    return [a, b];
  },

  VL02N() {
    const s = new Screen('vl02n', { tcode: 'VL02N', title: 'Outbound Delivery 80001234 Change: Overview', appbar: [{ l: 'Header Details' }, { l: 'Document Flow' }, { l: 'Post Goods Issue', icon: 'truck', primary: true, k: 'pgi', dir: 'right', gap: 64 }, HELP] });
    const d = dlvHeader(s, false); s.mark('delivery', d, 'right');
    s.tabs(12, 176, ['Item Overview', 'Picking', 'Loading', 'Transport', 'Status Overview', 'Goods Movement Data'], 1, { 1: 'tab_picking' });
    s.table(12, 222, {
      cols: [{ l: 'Item', w: 56 }, { l: 'Material', w: 104 }, { l: 'Deliv. Qty', w: 96, align: 'r' }, { l: 'Un', w: 46 }, { l: 'SLoc', w: 70 }, { l: 'Picked Qty', w: 100, align: 'r' }, { l: 'WM', w: 50, align: 'c' }, { l: 'Batch', w: 100 }],
      rows: [['10', 'FG-2001', '20', 'PC', 'FG01', '20', '', ''], ['20', 'RM-1003', '30', 'PC', 'RM01', '30', 'C', '']],
      colKeys: { 4: 'sloc', 5: 'picked' }
    });
    s.text(16, 330, 'Item 20 picked quantity comes from confirmed WM transfer order 4611.', { fill: C.muted, size: 12.5 });
    s.status('success', 'Outbound Delivery 80001234 has been saved');
    return [s];
  },

  VL03N() {
    const a = new Screen('vl03n-1', { tcode: 'VL03N', title: 'Outbound Delivery 80001234 Display: Overview', appbar: [{ l: 'Header Details' }, { l: 'Document Flow', icon: 'flow', k: 'docflow', dir: 'right', gap: 64 }, HELP] });
    const d = dlvHeader(a, true); a.mark('delivery', d, 'right');
    a.tabs(12, 176, ['Item Overview', 'Picking', 'Loading', 'Transport', 'Status Overview', 'Goods Movement Data'], 0);
    a.table(12, 222, {
      cols: [{ l: 'Item', w: 60 }, { l: 'Material', w: 110 }, { l: 'Description', w: 200 }, { l: 'Deliv. Qty', w: 100, align: 'r' }, { l: 'Un', w: 50 }, { l: 'ItCa', w: 66 }, { l: 'SLoc', w: 66 }],
      rows: DLV_ROWS, k: 'overview', dir: 'right'
    });
    const b = new Screen('vl03n-2', { tcode: 'VL03N', title: 'Document Flow', appbar: [{ l: 'Display Document', icon: 'glasses' }, { l: 'Status Overview' }, HELP] });
    b.text(16, 116, 'Business partner 200100 Maghreb Office Furniture SARL', { fill: C.muted });
    b.table(12, 136, {
      cols: [{ l: 'Document', w: 420 }, { l: 'Quantity', w: 90, align: 'r' }, { l: 'Unit', w: 50 }, { l: 'On', w: 110 }, { l: 'Status', w: 160 }],
      rows: [
        ['▾0 Standard Order 12000345', '50', 'PC', '18.11.2026', '@g Completed'],
        ['▾1 Outbound Delivery 80001234', '50', 'PC', '20.11.2026', '@g Completed'],
        ['·2 WMS transfer order 4611', '30', 'PC', '20.11.2026', '@g Completed'],
        ['·2 GD goods issue:delvy 4900012345', '50', 'PC', '21.11.2026', '@g Completed'],
        ['·2 Invoice 90004567', '50', 'PC', '21.11.2026', '@g Completed']
      ],
      sel: 3, k: 'flow_list', dir: 'right', rowKeys: { 3: 'flow_gi' }, rowDir: 'right'
    });
    return [a, b];
  },

  VL06O() {
    const a = new Screen('vl06o-1', { tcode: 'VL06O', title: 'Outbound Delivery Monitor', appbar: [{ l: 'Display Variants' }, { l: 'Only Inbound Deliveries' }, { l: 'Only Outbound Deliveries' }, { l: 'All Deliveries' }, HELP] });
    a.group(12, 96, 520, 420, 'Outbound deliveries');
    const labels = ['For Checking', 'For Distribution', 'For Picking', 'For Confirmation', 'For Loading', 'For Goods Issue', 'For Transport. Planning', 'List Outbound Deliveries'];
    labels.forEach((l, i) => {
      const box = a.button(28, 136 + i * 44, l, { icon: i === 5 ? 'truck' : null });
      a.rect(box[0], box[1], 300, 26, { fill: 'none', stroke: 'none' });
      if (i === 5) a.mark('btn_gi', [box[0] - 4, box[1] - 4, box[2] + 8, 34], 'right');
    });
    const b = new Screen('vl06o-2', { tcode: 'VL06O', title: 'Outbound Deliveries for Goods Issue', appbar: [EXEC, { l: 'Get Variant' }, HELP] });
    selection(b, 12, 96, 770, 'Selection', [
      { k: 'sel_shpt', l: 'Shipping Point', v: 'MA01', w: 80 },
      { l: 'Planned GI date', v: '', to: '21.11.2026', w: 110 },
      { l: 'Route', v: '', to: '', w: 90 }
    ]);
    const c = new Screen('vl06o-3', { tcode: 'VL06O', title: 'List of Outbound Deliveries for Goods Issue', appbar: [{ l: 'Item View' }, { l: 'Post Goods Issue', icon: 'truck', primary: true, k: 'pgi', dir: 'right', gap: 64 }, HELP] });
    c.alvToolbar(12, 96);
    c.table(12, 150, {
      cols: [{ l: 'Delivery', w: 104 }, { l: 'ShPt', w: 60 }, { l: 'GI Date', w: 104 }, { l: 'Ship-to', w: 90 }, { l: 'Total Weight', w: 104, align: 'r' }, { l: 'WUn', w: 50 }, { l: 'OvPickStat', w: 96, align: 'c' }, { l: 'GM Status', w: 90, align: 'c' }],
      rows: [['80001234', 'MA01', '21.11.2026', '200100', '612.0', 'KG', '@g C', 'A'], ['80001235', 'MA01', '21.11.2026', '200140', '230.5', 'KG', '@g C', 'A'], ['80001240', 'MA01', '21.11.2026', '200100', '88.0', 'KG', '@y B', 'A']],
      sel: 0, selector: true, k: 'res_list', dir: 'right', rowKeys: { 1: 'select' }, rowDir: 'right'
    });
    return [a, b, c];
  },

  VL06P() {
    const a = new Screen('vl06p-1', { tcode: 'VL06P', title: 'Outbound Deliveries for Picking', appbar: [EXEC, { l: 'Create TO in Background', icon: 'exec' }, HELP] });
    a.group(12, 96, 770, 60, 'Organizat. Data');
    a.field('sel_shpt', 28, 122, { l: 'Shipping Point/Receiving Pt', lw: 210, v: 'MA01', w: 60, to: '', toW: 60 });
    a.group(12, 166, 770, 60, 'Time Data');
    a.field('sel_date', 28, 192, { l: 'Picking Date', lw: 210, v: '20.11.2026', w: 100, to: '21.11.2026', toW: 100 });
    a.group(12, 236, 770, 240, 'Picking Data');
    a.radio(28, 272, 'Only Picking Without WM', false);
    a.radio(28, 300, 'Only WM Picking', false);
    a.radio(28, 328, 'Both Picking Types', true);
    a.field('sel_whse', 28, 356, { l: 'Warehouse Number', lw: 210, v: '100', w: 60, to: '', toW: 60 });
    a.radio(28, 396, 'Check at Header Level', false);
    a.radio(28, 424, 'Check at Item Level', true);
    a.check(null, 28, 448, 'Exclude Existing WM Groups', false);
    a.group(12, 486, 770, 60, 'Doc. Data');
    a.field(null, 28, 512, { l: 'Group', lw: 210, v: '', w: 100, to: '', toW: 100 });
    a.group(12, 556, 770, 96, 'Shipment Data');
    a.field(null, 28, 582, { l: 'Route', lw: 210, v: '', w: 70, to: '', toW: 70 });
    a.field(null, 28, 614, { l: 'Shipment Number', lw: 210, v: '', w: 100, to: '', toW: 100 });
    const b = new Screen('vl06p-2', { tcode: 'VL06P', title: 'List of Outbound Deliveries for Picking', appbar: [{ l: 'TO in Background', icon: 'exec', primary: true, k: 'create_to', dir: 'right', gap: 64 }, { l: 'TO in Foreground' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Delivery', w: 104 }, { l: 'ShPt', w: 60 }, { l: 'Pick Date', w: 104 }, { l: 'WhN', w: 56 }, { l: 'Ship-to', w: 90 }, { l: 'Total Weight', w: 104, align: 'r' }, { l: 'WM status', w: 100, align: 'c' }],
      rows: [['80001234', 'MA01', '20.11.2026', '100', '200100', '612.0', '@r A'], ['80001235', 'MA01', '20.11.2026', '100', '200140', '230.5', '@r A']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  VL06C() {
    const a = new Screen('vl06c-1', { tcode: 'VL06C', title: 'Outbound Deliveries for Confirmation', appbar: [EXEC, { l: 'Get Variant' }, HELP] });
    selection(a, 12, 96, 770, 'Selection', [
      { k: 'sel_shpt', l: 'Shipping Point', v: 'MA01', w: 80 },
      { k: 'sel_whse', l: 'Warehouse Number', v: '100', w: 80 },
      { l: 'Picking Date', v: '', to: '', w: 110 }
    ]);
    const b = new Screen('vl06c-2', { tcode: 'VL06C', title: 'List of Outbound Deliveries for Confirmation', appbar: [{ l: 'Confirm in Background', icon: 'check', primary: true, k: 'confirm', dir: 'right', gap: 64 }, { l: 'Confirm in Foreground' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Delivery', w: 104 }, { l: 'ShPt', w: 60 }, { l: 'WhN', w: 56 }, { l: 'Transfer Order', w: 120 }, { l: 'Ship-to', w: 90 }, { l: 'WM status', w: 100, align: 'c' }],
      rows: [['80001234', 'MA01', '100', '4611', '200100', '@y B'], ['80001235', 'MA01', '100', '4612', '200140', '@y B']],
      sel: 0, k: 'res_list', dir: 'right', colKeys: { 5: 'res_status' }
    });
    return [a, b];
  },

  VT01N() {
    const a = new Screen('vt01n-1', { tcode: 'VT01N', title: 'Create Shipment: Initial Screen', appbar: [{ l: 'Select Outbound Deliveries', icon: 'filter' }, HELP] });
    a.group(12, 96, 700, 120, 'Shipment');
    a.field('tpp', 28, 138, { l: 'TransportPlanningPt', lw: 170, v: '1000', w: 80, suffix: 'Casablanca transport' });
    a.field('type', 28, 172, { l: 'Shipment type', lw: 170, v: '0001', w: 80, suffix: 'Individual shipment' });
    const b = new Screen('vt01n-2', { tcode: 'VT01N', title: 'Create Shipment: Overview', appbar: [{ l: 'Select Outbound Deliveries', icon: 'filter', k: 'select', dir: 'right', gap: 64 }, { l: 'Save', icon: 'save', primary: true, k: 'save', dir: 'right', gap: 64 }, HELP] });
    b.group(12, 96, W - 24, 120, 'Shipment 1000123');
    b.field(null, 28, 138, { l: 'Shipment type', lw: 150, v: '0001  Individual shipment', w: 240, type: 'display' });
    b.field('agent', 28, 174, { l: 'Forwarding agent', lw: 150, v: '300010   Trans Atlas Logistique', w: 300 });
    b.group(12, 228, W - 24, 140, 'Deadlines');
    const names = ['Planning', 'Check-in', 'Loading start', 'Loading end', 'Shipm. completion', 'Shipment start'];
    const vals = ['21.11.2026 08:00', '21.11.2026 09:40', '21.11.2026 10:15', '', '', ''];
    const bx = [];
    names.forEach((n, i) => {
      const x = 28 + i * 178;
      bx.push(b.button(x, 268, n, { primary: !!vals[i] }));
      b.text(x, 320, vals[i] || '—', { size: 12.5, fill: vals[i] ? C.text : C.muted });
    });
    b.mark('deadlines', union(bx[0], bx[2]), 'right');
    b.text(16, 404, 'Assigned outbound deliveries', { weight: 700 });
    b.table(12, 414, {
      cols: [{ l: 'Delivery', w: 110 }, { l: 'Ship-to', w: 260 }, { l: 'GI Date', w: 110 }, { l: 'Weight', w: 90, align: 'r' }, { l: 'WUn', w: 50 }],
      rows: [['80001234', '200100  Maghreb Office Furniture', '21.11.2026', '612.0', 'KG'], ['80001235', '200140  Atlas Bureau', '21.11.2026', '230.5', 'KG']]
    });
    b.status('success', 'Shipment 1000123 has been saved', null);
    return [a, b];
  }
};
