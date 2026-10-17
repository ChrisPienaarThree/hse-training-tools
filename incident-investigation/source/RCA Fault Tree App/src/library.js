/* RCA Fault Tree — generic reliability data library.
   Typical screening values from published generic sources. They are starting points for ranking RCA hypotheses,
   NOT design data: every value can be edited per event, overridden for the case on the Data library tab, or
   replaced with site data. Sources (short names used in `ref`):
     CCPS-LOPA   CCPS, Layer of Protection Analysis: Simplified Process Risk Assessment (2001) and
                 Guidelines for Initiating Events and Independent Protection Layers in LOPA (2015)
     IEC61511    IEC 61511-1 SIL bands (PFDavg upper bound of the band used)
     THERP       Swain & Guttmann, NUREG/CR-1278 Handbook of Human Reliability Analysis (1983)
     HEART       Williams, HEART generic task types (nominal human unreliability, 5th–95th bounds)
     GENERIC     Typical generic per-demand failure probabilities quoted in CCPS CPQRA / process-industry
                 reliability handbooks (order-of-magnitude screening values)
   unit 'p' = probability per demand / per occasion; 'f' = frequency per year. */
var RCALIB = (function () {
  const L = [];
  const add = (src, id, name, value, unit, range, ref, note) => L.push({ src, id, name, value, unit, range: range || '', ref, note: note || '' });

  /* ---- Independent protection layers / safeguards: PFD ---- */
  const I = (id, n, v, r, ref, note) => add('ipl', id, n, v, 'p', r, ref || 'CCPS-LOPA', note);
  I('ipl-bpcs', 'BPCS control loop acting as a safeguard (not the initiator)', 0.1, '0.1 (max credit)', 'CCPS-LOPA / IEC61511', 'Max credit for BPCS per IEC 61511');
  I('ipl-op10', 'Operator response to alarm, ≥10 min available, trained, procedure', 0.1, '0.1–1', 'CCPS-LOPA', 'Only if alarm independent of the initiator');
  I('ipl-op-short', 'Operator response to alarm, <10 min or complex diagnosis', 1, '1 (no credit)', 'CCPS-LOPA');
  I('ipl-sil1', 'Safety instrumented function, SIL 1', 0.1, '0.1–0.01', 'IEC61511');
  I('ipl-sil2', 'Safety instrumented function, SIL 2', 0.01, '0.01–0.001', 'IEC61511');
  I('ipl-sil3', 'Safety instrumented function, SIL 3', 0.001, '0.001–0.0001', 'IEC61511');
  I('ipl-prv', 'Pressure relief valve (clean service)', 0.01, '0.1–0.00001', 'CCPS-LOPA', 'Fouling, plugging or polymerising service: use 0.1');
  I('ipl-rd', 'Rupture disc', 0.01, '0.1–0.00001', 'CCPS-LOPA');
  I('ipl-bund', 'Dike / bund (secondary containment)', 0.01, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-drain', 'Underground drainage / spill collection system', 0.01, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-vent', 'Open vent (no valve)', 0.01, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-fireproof', 'Fireproofing / passive fire protection', 0.01, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-blast', 'Blast wall / bunker', 0.001, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-arrester', 'Flame or detonation arrester', 0.01, '0.1–0.001', 'CCPS-LOPA');
  I('ipl-check', 'Check valve, single (reverse flow)', 0.1, '1–0.1', 'CCPS-LOPA', 'Many companies give no IPL credit (PFD 1)');
  I('ipl-vacbrk', 'Vacuum breaker', 0.01, '0.1–0.01', 'CCPS-LOPA');
  I('ipl-ro', 'Restriction orifice (limits flow)', 0.01, '0.01–0.001', 'CCPS-LOPA');
  I('ipl-deluge', 'Automatic deluge / sprinkler system', 0.1, '0.1–0.01', 'CCPS-LOPA');
  I('ipl-gasdet', 'Gas detection with automatic action', 0.1, '1–0.1', 'CCPS-LOPA');
  I('ipl-interlock', 'Hard-wired mechanical / electrical interlock', 0.01, '0.1–0.001', 'CCPS-LOPA');

  /* ---- Human error probabilities ---- */
  const H = (id, n, v, r, ref, note) => add('hep', id, n, v, 'p', r, ref, note);
  H('hep-heartA', 'HEART A: totally unfamiliar task, performed at speed, no idea of consequences', 0.55, '0.35–0.97', 'HEART');
  H('hep-heartB', 'HEART B: shift or restore system to a new state at one attempt, no supervision or procedure', 0.26, '0.14–0.42', 'HEART');
  H('hep-heartC', 'HEART C: complex task needing high understanding and skill', 0.16, '0.12–0.28', 'HEART');
  H('hep-heartD', 'HEART D: fairly simple task performed rapidly or given scant attention', 0.09, '0.06–0.13', 'HEART');
  H('hep-heartE', 'HEART E: routine, highly practised, rapid task, low skill', 0.02, '0.007–0.045', 'HEART');
  H('hep-heartF', 'HEART F: restore or shift system following procedure, with some checking', 0.003, '0.0008–0.007', 'HEART');
  H('hep-heartG', 'HEART G: completely familiar, well-designed, highly practised routine task', 0.0004, '0.00008–0.009', 'HEART');
  H('hep-heartH', 'HEART H: respond correctly to command when an automated supervisory system is in place', 0.00002, '0.000006–0.0009', 'HEART');
  H('hep-omit-check', 'Omit a step from a written procedure that has check-off', 0.001, '0.0005–0.005', 'THERP');
  H('hep-omit-nocheck', 'Omit a step from a written procedure, no check-off', 0.003, '0.001–0.01', 'THERP');
  H('hep-omit-long', 'Omit a step from a long list (>10 items), no check-off', 0.01, '0.003–0.03', 'THERP');
  H('hep-wrong-ctrl', 'Select wrong control from a group of similar-looking controls', 0.003, '0.001–0.01', 'THERP');
  H('hep-wrong-ctrl-clear', 'Select wrong control, controls well delineated / labelled', 0.001, '0.0005–0.005', 'THERP');
  H('hep-read-meter', 'Misread an analogue meter / gauge', 0.003, '0.001–0.01', 'THERP');
  H('hep-checker', 'Second-person check fails to detect the error', 0.1, '0.05–0.5', 'THERP');
  H('hep-alarm-single', 'Fail to respond to a single clear alarm, low workload', 0.001, '0.0001–0.01', 'THERP');
  H('hep-alarm-flood', 'Fail to respond to an alarm, high workload / many alarms', 0.1, '0.05–0.5', 'THERP');
  H('hep-isolation', 'Isolation error: wrong valve or breaker isolated', 0.003, '0.001–0.01', 'THERP');
  H('hep-verbal', 'Error in recalling or passing on a verbal instruction (several items)', 0.003, '0.001–0.01', 'THERP');
  H('hep-restore', 'Fail to restore equipment (bypass, valve, guard) after maintenance', 0.003, '0.001–0.01', 'HEART F / THERP');

  /* ---- Equipment failure on demand ---- */
  const E = (id, n, v, r, note) => add('equip', id, n, v, 'p', r, 'GENERIC', note);
  E('eq-pump-start', 'Pump fails to start on demand', 0.003, '0.001–0.01');
  E('eq-firepump', 'Diesel fire pump fails to start', 0.01, '0.003–0.03');
  E('eq-edg', 'Emergency generator fails to start', 0.03, '0.01–0.1');
  E('eq-mov', 'Motor-operated valve fails to open / close on demand', 0.003, '0.001–0.01');
  E('eq-aov', 'Air-operated valve fails to operate on demand', 0.002, '0.001–0.01');
  E('eq-sov', 'Solenoid valve fails to operate on demand', 0.001, '0.0005–0.005');
  E('eq-manual-valve', 'Manual valve fails to operate (stuck)', 0.001, '0.0001–0.005');
  E('eq-checkv', 'Check valve fails to close (reverse flow)', 0.001, '0.0001–0.01');
  E('eq-prv', 'Relief valve fails to open at set pressure', 0.003, '0.001–0.01');
  E('eq-lswitch', 'Level / pressure switch fails on demand (annual test)', 0.01, '0.003–0.05', 'Longer test intervals scale the value up');
  E('eq-ltx', 'Transmitter fails, reading frozen or wrong (annual test)', 0.01, '0.003–0.05');
  E('eq-gasdet', 'Gas detector fails to detect (annual test)', 0.05, '0.01–0.1');
  E('eq-alarm', 'Alarm horn / beacon fails on demand', 0.01, '0.001–0.03');
  E('eq-relay', 'Relay fails to operate', 0.0001, '0.00003–0.001');
  E('eq-breaker', 'Circuit breaker fails to open on demand', 0.003, '0.001–0.01');
  E('eq-ups', 'UPS / battery fails to supply on demand', 0.01, '0.003–0.03');
  E('eq-hose', 'Flexible transfer hose ruptures (per transfer)', 0.0001, '0.00001–0.001');
  E('eq-sling', 'Lifting sling / wire rope fails under rated load (per lift, inspected)', 0.00001, '0.000001–0.0001');
  E('eq-hoistbrake', 'Hoist brake fails to hold on demand', 0.0001, '0.00003–0.001');
  E('eq-harness', 'Fall-arrest harness / lanyard fails on arrest', 0.0001, '0.00001–0.001');
  E('eq-guard-interlock', 'Machine guard interlock fails to stop machine on opening', 0.001, '0.0001–0.01');

  /* ---- Initiating event frequencies (/yr) ---- */
  const F = (id, n, v, r, note) => add('freq', id, n, v, 'f', r, 'CCPS-LOPA', note);
  F('ie-bpcs', 'BPCS instrument loop failure', 0.1, '1–0.1');
  F('ie-regulator', 'Pressure regulator failure', 0.1, '1–0.1');
  F('ie-pumpseal', 'Pump seal failure (leak)', 0.1, '1–0.01');
  F('ie-hose', 'Loading / unloading hose failure', 0.1, '1–0.01');
  F('ie-gasket', 'Gasket / packing blow-out', 0.01, '0.1–0.001');
  F('ie-pipe-leak', 'Piping leak (10 % section), 100 m', 0.001, '0.001–0.0001');
  F('ie-pipe-rupture', 'Piping full-bore rupture, 100 m', 0.00001, '0.00001–0.000001');
  F('ie-atmtank', 'Atmospheric tank catastrophic failure', 0.001, '0.001–0.0001');
  F('ie-vessel', 'Pressure vessel residual failure', 0.000001, '0.00001–0.0000001');
  F('ie-cw', 'Loss of cooling water', 0.1, '1–0.1');
  F('ie-power', 'Loss of power supply', 0.1, '1–0.1');
  F('ie-spurious-prv', 'Relief valve opens spuriously', 0.01, '0.1–0.001');
  F('ie-thirdparty', 'Third-party impact (vehicle, excavation)', 0.01, '0.1–0.001');
  F('ie-lightning', 'Lightning strike', 0.001, '0.001–0.0001');
  F('ie-extfire', 'Large external fire', 0.01, '0.1–0.001');
  F('ie-turbine', 'Turbine / diesel overspeed with casing breach', 0.0001, '0.001–0.00001');

  const SOURCES = [
    { k: 'none', name: 'Not quantified', unit: '' },
    { k: 'manual', name: 'Manual value', unit: '' },
    { k: 'ipl', name: 'Safeguard / IPL PFD', unit: 'p' },
    { k: 'hep', name: 'Human error probability', unit: 'p' },
    { k: 'equip', name: 'Equipment failure on demand', unit: 'p' },
    { k: 'freq', name: 'Initiating event frequency', unit: 'f' },
    { k: 'site', name: 'Site data (custom library item)', unit: '' }
  ];
  const REFS = {
    'CCPS-LOPA': 'CCPS, Layer of Protection Analysis (2001); Guidelines for Initiating Events and IPLs in LOPA (2015)',
    IEC61511: 'IEC 61511-1, safety instrumented systems for the process industry sector (SIL bands)',
    THERP: 'Swain & Guttmann, NUREG/CR-1278 Handbook of Human Reliability Analysis (1983)',
    HEART: 'Williams, HEART – Human Error Assessment and Reduction Technique (generic task types)',
    GENERIC: 'Typical generic process-industry per-demand failure values (CCPS CPQRA and reliability handbooks)'
  };
  return { ITEMS: L, SOURCES, REFS };
})();
if (typeof module !== 'undefined') module.exports = RCALIB;
