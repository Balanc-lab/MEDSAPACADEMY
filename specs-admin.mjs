import { Screen, selection, union, W, C } from './lib.mjs';
import { EXEC, HELP, kv } from './kit.mjs';

export default {
  SE16N() {
    const a = new Screen('se16n-1', { tcode: 'SE16N', title: 'General Table Display', appbar: [EXEC, { l: 'Number of Entries' }, { l: 'Technical View' }, HELP] });
    a.field('table', 16, 100, { l: 'Table', lw: 110, v: 'MARD', w: 160, mono: true, suffix: 'Storage Location Data for Material' });
    a.field(null, 16, 134, { l: 'Text table', lw: 110, v: '', w: 160 });
    a.field('maxhits', 16, 168, { l: 'Max. no. of hits', lw: 110, v: '500', w: 80 });
    a.text(16, 222, 'Selection criteria', { weight: 700 });
    a.table(12, 232, {
      cols: [{ l: 'Fld name', w: 260 }, { l: 'Opt', w: 46, align: 'c' }, { l: 'From value', w: 150 }, { l: 'To value', w: 130 }, { l: 'More', w: 50, align: 'c' }, { l: 'Output', w: 66, align: 'c' }, { l: 'Technical name', w: 140 }],
      rows: [
        ['Client', '', '', '', '', '[x]', 'MANDT'],
        ['Material', '=', 'RM-1001', '', '', '[x]', 'MATNR'],
        ['Plant', '=', 'MA01', '', '', '[x]', 'WERKS'],
        ['Storage Location', '', '', '', '', '[x]', 'LGORT'],
        ['Unrestricted', '', '', '', '', '[x]', 'LABST'],
        ['In Quality Insp.', '', '', '', '', '[x]', 'INSME'],
        ['Blocked', '', '', '', '', '[x]', 'SPEME']
      ],
      sel: 1, k: 'criteria', dir: 'right'
    });
    const b = new Screen('se16n-2', { tcode: 'SE16N', title: 'Display of Entries Found: Table MARD', appbar: [{ l: 'Details', icon: 'glasses' }, { l: 'Export', icon: 'doc' }, HELP] });
    b.text(16, 116, 'Table to be searched: MARD   Number of hits: 2   Runtime: 0', { fill: C.muted });
    b.alvToolbar(12, 126);
    b.table(12, 176, {
      cols: [{ l: 'Material', w: 120 }, { l: 'Plant', w: 70 }, { l: 'SLoc', w: 70 }, { l: 'Unrestricted', w: 120, align: 'r' }, { l: 'In Qual. Insp.', w: 120, align: 'r' }, { l: 'Blocked', w: 100, align: 'r' }],
      rows: [['RM-1001', 'MA01', 'RM01', '420.000', '100.000', '15.000'], ['RM-1001', 'MA01', 'PR01', '0.000', '0.000', '0.000']],
      sel: 0, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  SU53() {
    const s = new Screen('su53', { tcode: 'SU53', title: 'Display Authorization Data for User TRAINEE01', appbar: [{ l: 'Other User' }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    s.group(12, 96, W - 24, 92, '');
    kv(s, 28, 120, [['User', 'TRAINEE01'], ['Date / Time', '20.11.2026   10:31:07'], ['Transaction', 'MIGO']], { lw: 120, rowH: 22 });
    s.mark('header', [18, 100, 400, 82], 'right');
    s.group(12, 200, W - 24, 196, 'Authorization check failed');
    s.rect(24, 236, 1072, 30, { fill: '#FDECEC', stroke: C.red, rx: 4 });
    s.text(36, 256, 'Authorization Object  M_MSEG_BWA   Goods Movements: Movement Type', { weight: 700, fill: C.red });
    s.reg('object', [22, 232, 1076, 38], 'bottom', [24, 236, 600, 30]);
    s.table(24, 286, {
      cols: [{ l: 'Field', w: 120 }, { l: 'Description', w: 240 }, { l: 'Requested value', w: 160 }],
      rows: [['ACTVT', 'Activity', '@r 01'], ['BWART', 'Movement Type', '@r 551']],
      k: 'fields', dir: 'right'
    });
    s.group(12, 408, W - 24, 196, 'Authorizations in user master for this object');
    s.table(24, 446, {
      cols: [{ l: 'Role', w: 220 }, { l: 'Field', w: 120 }, { l: 'Values', w: 220 }],
      rows: [['Z_MM_STOREKEEPER', 'ACTVT', '01, 03'], ['Z_MM_STOREKEEPER', 'BWART', '101 – 344']],
      k: 'user_auth', dir: 'right'
    });
    return [s];
  },

  SE93() {
    const a = new Screen('se93-1', { tcode: 'SE93', title: 'Maintain Transaction', appbar: [{ l: 'Display', icon: 'glasses', k: 'display', dir: 'right', gap: 64 }, { l: 'Change', icon: 'pencil' }, { l: 'Create', icon: 'plus' }, HELP] });
    a.group(12, 96, 600, 92, '');
    a.field('tcode', 28, 128, { l: 'Transaction Code', lw: 160, v: 'MB51', w: 140, mono: true });
    const b = new Screen('se93-2', { tcode: 'SE93', title: 'Display Report Transaction', appbar: [{ l: 'Where-Used List' }, HELP] });
    b.field(null, 16, 100, { l: 'Transaction code', lw: 150, v: 'MB51', w: 120, mono: true, type: 'display' });
    b.field(null, 16, 134, { l: 'Package', lw: 150, v: 'MB', w: 120, type: 'display' });
    b.field('text', 16, 168, { l: 'Transaction text', lw: 150, v: 'Material Doc. List', w: 260, type: 'display', suffix: 'Program and selection screen (report transaction)' });
    b.group(12, 210, 760, 150, 'Report');
    const p1 = b.field(null, 28, 252, { l: 'Program', lw: 150, v: 'RM07DOCS', w: 160, mono: true, type: 'display' });
    const p2 = b.field(null, 28, 286, { l: 'Selection screen', lw: 150, v: '1000', w: 80, type: 'display' });
    b.mark('program', union(p1, p2), 'right');
    b.field(null, 28, 320, { l: 'Authorization Object', lw: 150, v: '', w: 160, type: 'display' });
    b.group(12, 372, 760, 150, 'GUI support');
    const g1 = b.check(null, 28, 412, 'SAP GUI for HTML', true);
    b.check(null, 28, 444, 'SAP GUI for Java', true);
    const g3 = b.check(null, 28, 476, 'SAP GUI for Windows', true);
    b.mark('gui', union(g1, g3), 'right');
    return [a, b];
  },

  SM37() {
    const a = new Screen('sm37-1', { tcode: 'SM37', title: 'Simple Job Selection', appbar: [EXEC, { l: 'Extended Job Selection' }, HELP] });
    a.group(12, 96, 770, 120, '');
    a.field('jobname', 28, 128, { l: 'Job name', lw: 140, v: 'LX16*', w: 220, mono: true });
    a.field('user', 28, 164, { l: 'User name', lw: 140, v: '*', w: 220 });
    a.group(12, 228, 770, 110, 'Job status');
    const st = ['Sched.', 'Released', 'Ready', 'Active', 'Finished', 'Canceled'].map((l, i) => a.check(null, 28 + i * 122, 270, l, true));
    a.mark('status', union(...st), 'bottom');
    a.group(12, 350, 770, 92, 'Job start condition');
    a.field('dates', 28, 392, { l: 'From', lw: 60, v: '18.11.2026', w: 110, to: '20.11.2026', toW: 110 });
    const b = new Screen('sm37-2', { tcode: 'SM37', title: 'Job Overview', appbar: [{ l: 'Job Log', icon: 'doc', k: 'joblog', dir: 'right', gap: 64 }, { l: 'Spool', icon: 'print' }, { l: 'Refresh', icon: 'refresh' }, HELP] });
    b.alvToolbar(12, 96);
    b.table(12, 150, {
      cols: [{ l: 'Job', w: 230 }, { l: 'Created By', w: 110 }, { l: 'Status', w: 110 }, { l: 'Start date', w: 104 }, { l: 'Start time', w: 90 }, { l: 'Duration(sec.)', w: 110, align: 'r' }],
      rows: [['LX16_CONT_INV_002', 'BATCH_WM', '@g Finished', '18.11.2026', '22:00:04', '41'], ['LX16_CONT_INV_002', 'BATCH_WM', '@r Canceled', '19.11.2026', '22:00:03', '14'], ['LX16_CONT_INV_002', 'BATCH_WM', '@g Finished', '20.11.2026', '07:15:22', '38']],
      sel: 1, k: 'res_list', dir: 'right'
    });
    return [a, b];
  },

  SLG1() {
    const a = new Screen('slg1-1', { tcode: 'SLG1', title: 'Analyze Application Log', appbar: [EXEC, HELP] });
    a.group(12, 96, 770, 120, '');
    const o1 = a.field(null, 28, 128, { l: 'Object', lw: 140, v: '/SCWM/WME', w: 200, mono: true });
    const o2 = a.field(null, 28, 164, { l: 'Subobject', lw: 140, v: '*', w: 200 });
    a.mark('object', union(o1, o2), 'right');
    a.group(12, 228, 770, 92, '');
    a.field('extid', 28, 260, { l: 'External ID', lw: 140, v: '0100000123*', w: 200, mono: true });
    a.group(12, 332, 770, 110, 'Time restriction');
    const d1 = a.field(null, 28, 374, { l: 'From (Date/Time)', lw: 140, v: '20.11.2026', w: 110, suffix: '00:00:00' });
    const d2 = a.field(null, 28, 408, { l: 'To (Date/Time)', lw: 140, v: '20.11.2026', w: 110, suffix: '23:59:59' });
    a.mark('dates', union(d1, d2), 'right');
    const b = new Screen('slg1-2', { tcode: 'SLG1', title: 'Display Logs', appbar: [{ l: 'Technical Information' }, { l: 'Help', right: true }] });
    b.table(12, 100, {
      cols: [{ l: 'Date/Time/User', w: 280 }, { l: 'Number', w: 70, align: 'r' }, { l: 'Errors', w: 70, align: 'r' }, { l: 'Warn.', w: 70, align: 'r' }, { l: 'External ID', w: 160 }, { l: 'Transaction', w: 100 }],
      rows: [['▾0 20.11.2026  09:42:18  QMUSER01', '4', '@r 2', '@y 1', '0100000123', 'QA11']],
      sel: 0, k: 'res_tree', dir: 'right'
    });
    b.text(16, 194, 'Messages', { weight: 700 });
    b.table(12, 204, {
      cols: [{ l: 'Type', w: 60, align: 'c' }, { l: 'Message text', w: 760 }, { l: 'LTxt', w: 50, align: 'c' }],
      rows: [
        ['@r E', 'Quantity 100 PC of product RM-1001 not available in stock type Q2 for posting', '?'],
        ['@r E', 'Stock posting for inspection lot 010000000123 could not be completed', '?'],
        ['@y W', 'Inspection document will be processed again in the next run', '?'],
        ['@g I', 'Processing finished with errors', '']
      ],
      sel: 0, k: 'res_msgs', dir: 'right'
    });
    return [a, b];
  }
};
