/* RCA Fault Tree — worked example (fictional): diesel overfill of tank T-101 during a night transfer.
   Mixes all value sources: an initiating frequency, IPL PFDs, human error probabilities, equipment failure on demand,
   a manual value and a condition (house) event; two looked-up values are edited with a recorded reason. */
var RCAEX = (function () {
  const N = (id, code, kind, label, o) => Object.assign({ id, code, kind, label, gate: kind === 'gate' ? 'OR' : '', k: 2, children: [], status: 'unverified', evidence: '', test: '', testOwner: '', testDue: '', cause: '', category: '', why: '', notes: '', collapsed: false, prob: { src: 'none', item: '', value: null, unit: 'p', note: '' } }, o || {});
  const P = (src, item, value, note, unit) => ({ src, item: item || '', value, unit: unit || (src === 'freq' ? 'f' : 'p'), note: note || '' });
  const nodes = [
    N('top', 'TOP', 'gate', 'Diesel overflowed from tank T-101 into the bund during a night transfer', { gate: 'AND', children: ['e0', 'g2', 'g3'], status: 'confirmed',
      evidence: 'About 14 m³ diesel in bund B-1 at 03:40 (shift log, CCTV, photos P1–P9). Bund held; no off-site release.' }),
    N('e0', 'E-01', 'basic', 'Ship-to-tank transfer into T-101 under way (demand on the overfill controls)', { status: 'confirmed', prob: P('manual', '', 52, 'About one transfer a week into T-101 (2025 transfer records).', 'f'),
      evidence: 'Transfer TR-2611 from MV Coral started 22:10.' }),
    N('g2', 'G-02', 'gate', 'Transfer not stopped before the tank was full', { gate: 'OR', children: ['g4', 'e5'], status: 'confirmed', evidence: 'Pumping continued until 03:38, when the ship stopped on radio call.' }),
    N('g4', 'G-04', 'gate', 'Operator unaware the tank was nearly full', { gate: 'AND', children: ['g8', 'g7'], status: 'confirmed', evidence: 'Operator interview: believed level was 78 % at 03:20.' }),
    N('g8', 'G-08', 'gate', 'Level gauge LT-101 indicated lower than the actual level', { gate: 'OR', children: ['e4', 'e9'], status: 'confirmed', evidence: 'DCS trend flat at 78 % from 01:55 while dip showed 100 %.' }),
    N('e4', 'E-04', 'basic', 'LT-101 servo gauge displacer stuck (frozen reading)', { status: 'confirmed', cause: 'causal', category: 'Equipment / hardware', prob: P('equip', 'eq-ltx', 0.01),
      evidence: 'Gauge found stuck at 78 % on inspection; displacer wire fouled with wax (photo P12).', why: 'Gauge not in the planned maintenance system after the 2024 replacement.' }),
    N('e9', 'E-09', 'undeveloped', 'LT-101 calibration drift', { status: 'ruledout', prob: P('manual', '', 0.001, 'Screening estimate.'), evidence: 'Calibration certificate 6 weeks old; as-found check within 2 mm.' }),
    N('g7', 'G-07', 'gate', 'Operator did not cross-check the level by an independent means', { gate: 'INHIBIT', children: ['e3', 'h1'], status: 'confirmed', evidence: 'No radar or dip cross-check recorded in the 4-hourly round.' }),
    N('e3', 'E-03', 'basic', 'Level cross-check not done during the transfer', { status: 'confirmed', cause: 'causal', category: 'Human performance', prob: P('hep', 'hep-heartD', 0.2, 'HEART D nominal 0.09 raised for night shift, single operator handling a ship arrival (EPCs: time shortage, high workload).'),
      evidence: 'Round sheet blank for 02:00; operator was at jetty 2 for MV Delta arrival.', why: 'Transfer procedure has no hold point for cross-checking level near the end of a transfer.' }),
    N('h1', 'H-01', 'house', 'Single operator on night shift, also handling a ship arrival', { status: 'confirmed', category: 'Organisation / management', cause: 'contributing', evidence: 'Roster: one operator 18:00–06:00; MV Delta berthed 01:50.', why: 'Night manning reduced from two to one in 2025 without a management-of-change review.' }),
    N('e5', 'E-05', 'basic', 'Transfer nomination larger than available ullage (planning error)', { status: 'ruledout', prob: P('hep', 'hep-omit-nocheck', 0.003), evidence: 'Nomination 2 400 m³ against 2 610 m³ ullage: calculation checked and correct.' }),
    N('g3', 'G-03', 'gate', 'Independent overfill protection did not stop the transfer', { gate: 'AND', children: ['g5', 'g9'], status: 'confirmed', evidence: 'No trip of XV-101 recorded; LAH-102 alarm acknowledged at 03:12.' }),
    N('g9', 'G-09', 'gate', 'High-level alarm LAH-102 did not lead to the transfer being stopped', { gate: 'OR', children: ['e8', 'e10'], status: 'confirmed', evidence: 'Alarm at 03:12; pumping stopped 03:38 (26 min later).' }),
    N('g5', 'G-05', 'gate', 'High-high level trip LSHH-101 / XV-101 failed', { gate: 'OR', children: ['e6', 'e7'], status: 'confirmed', evidence: 'XV-101 stayed open; LSHH-101 did not change state when flooded.' }),
    N('e6', 'E-06', 'basic', 'LSHH-101 level switch failed on demand (float stuck)', { status: 'confirmed', cause: 'root', category: 'Maintenance', prob: P('equip', 'eq-lswitch', 0.05, 'Library 0.01 assumes an annual proof test; LSHH-101 test was 18 months overdue, so PFD scaled up about ×5.'),
      evidence: 'Float found seized by corrosion product (photo P15). Last proof test 30 months ago (CMMS).', why: 'Proof testing of tank overfill switches dropped from the CMMS schedule; no tracking of overdue SIS tests.' }),
    N('e7', 'E-07', 'basic', 'Trip left bypassed after maintenance', { status: 'ruledout', prob: P('hep', 'hep-restore', 0.003), evidence: 'Bypass log and DCS event list: no bypass active on LSHH-101.' }),
    N('e8', 'E-08', 'basic', 'Control-room operator did not respond to the independent high-level alarm LAH-102', { status: 'likely', cause: 'causal', category: 'Human performance', prob: P('ipl', 'ipl-op10', 0.1),
      test: 'Retrieve alarm journal 02:30–03:40 and interview control-room operator about alarm load.', testOwner: 'Lead investigator', testDue: '2026-10-20',
      evidence: 'LAH-102 acknowledged at 03:12; 41 other alarms in the same 20 minutes (preliminary journal).', why: 'Alarm flood during ship arrival; LAH-102 has the same priority as nuisance alarms.' }),
    N('e10', 'E-10', 'basic', 'Stop instruction to the ship by radio not received or delayed', { status: 'unverified', category: 'Communication', prob: P('hep', 'hep-verbal', 0.003),
      test: 'Obtain the jetty and ship VHF recordings for 03:10–03:40; interview the ship duty officer.', testOwner: 'HSE adviser', testDue: '2026-10-22' })
  ];
  const map = {}; nodes.forEach(n => { map[n.id] = n; });
  const actions = [
    ['e6', 'Restore proof testing of all tank overfill switches (LSHH) in the CMMS and test LSHH-101/201/301 within 14 days.', 'Maintenance Manager', '2026-10-31', 'High', 'Engineering'],
    ['e6', 'Add an overdue-SIS-test KPI to the monthly management review.', 'Terminal Manager', '2026-12-15', 'Medium', 'Administrative'],
    ['e4', 'Add servo gauge LT-101 (and sister gauges) to the planned maintenance system with a 6-monthly displacer inspection.', 'Instrument Supervisor', '2026-11-15', 'High', 'Engineering'],
    ['e3', 'Add a level cross-check hold point (radar vs servo, at 85 % and 95 %) to the transfer procedure.', 'Operations Superintendent', '2026-11-01', 'Medium', 'Administrative'],
    ['h1', 'Carry out a management-of-change review of single-operator night manning during ship arrivals.', 'Terminal Manager', '2026-11-30', 'High', 'Administrative'],
    ['e8', 'Re-prioritise LAH-102 and other independent overfill alarms as high priority; rationalise nuisance alarms.', 'Control Systems Engineer', '2027-01-31', 'Medium', 'Engineering']
  ].map((a, i) => ({ id: 'a' + (i + 1), target: a[0], text: a[1], owner: a[2], due: a[3], priority: a[4], control: a[5], status: 'Open', closeNote: '' }));
  return {
    id: 'rca-example-t101', example: true, format: 'rca-fault-tree', version: 1,
    meta: { title: 'Diesel overfill of tank T-101 during night transfer', ref: 'RCA-EX-01', date: '2026-09-18', time: '03:40', location: 'Tank T-101, bund B-1', site: 'Coastal Fuel Terminal (fictional)', client: 'Worked example', investigator: 'Lead investigator', team: 'Lead investigator; Operations superintendent; Instrument technician; HSE adviser',
      status: 'In review', description: 'During a night ship-to-tank transfer, diesel overflowed from tank T-101 into bund B-1. About 14 m³ was contained in the bund and recovered; no injuries and no off-site release.',
      conclusion: 'The transfer was not stopped because the level gauge LT-101 froze at 78 % and the single night-shift operator, busy with a ship arrival, did not cross-check the level. The independent high-high trip LSHH-101 failed because its float was seized; proof testing had dropped out of the maintenance system. The independent alarm LAH-102 was probably missed in an alarm flood (still being confirmed).',
      lessons: 'Independent overfill protection is only independent if it is tested.\nManning changes need a management-of-change review that covers peak workload, such as a ship arrival during a transfer.' },
    root: 'top', nodes: map, actions, libOverrides: {}, customLib: [], log: []
  };
})();
if (typeof module !== 'undefined') module.exports = RCAEX;
