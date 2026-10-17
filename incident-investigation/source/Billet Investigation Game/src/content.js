/* =====================================================================
   THE FALLING BILLET — case content
   Based on a real 2008 ICAM investigation (billet falls from a truck
   during forklift offloading). All people, companies and documents are
   anonymised; documents are recreated for training. Edit this file to
   change the case, then run build.py.
   ===================================================================== */
const GAME = {};

GAME.meta = {
  title: 'The Falling Billet',
  company: 'Steel Inc.',
  site: 'Steel Inc. rolling mill — billet yard',
  supplier: 'Metro Billet Supplies',
  haulier: 'Swartland Haulage',
  date: '2008-09-15',
  dateLabel: 'Monday 15 September 2008',
  caseRef: 'SI-2008-031',
  facilitatorCode: 'ICAM'
};

/* ---------- people ------------------------------------------------- */
GAME.people = {
  mokoena: { name: 'Lucas Mokoena', role: 'Truck driver, Swartland Haulage (injured)', initials: 'LM' },
  ndlovu:  { name: 'Sizwe Ndlovu', role: 'Forklift operator, despatch', initials: 'SN' },
  visser:  { name: 'Gerrit Visser', role: 'Area supervisor, billet yard', initials: 'GV' },
  adams:   { name: 'Kevin Adams', role: 'Site paramedic', initials: 'KA' },
  fortuin: { name: 'Neville Fortuin', role: 'Forklift operator, reheat furnace', initials: 'NF' },
  jansen:  { name: 'Clive Jansen', role: 'Despatch co-ordinator', initials: 'CJ' },
  steyn:   { name: 'Danie Steyn', role: 'SHERQ co-ordinator', initials: 'DS' },
  weber:   { name: 'Franz Weber', role: 'Meltshop manager', initials: 'FW' },
  dewet:   { name: 'Johan de Wet', role: 'Engineering manager', initials: 'JW' },
  patel:   { name: 'Rashid Patel', role: 'Transport manager, Swartland Haulage', initials: 'RP' },
  crew:    { name: 'Despatch forklift crew', role: 'Three operators from the other shifts (group)', initials: 'FC' }
};

/* ---------- initial notification ----------------------------------- */
GAME.initialReport = {
  from: 'Gerrit Visser, area supervisor (phone call to the SHERQ office)',
  time: '12:50',
  text: 'A truck driver from Swartland Haulage has been hurt in the billet yard. A billet fell off his truck while we were offloading. He was trapped under it; we lifted it off. Kevin is with him and an ambulance is coming. He is conscious but it looks bad: his arm and his back. Offloading has stopped for now.',
  known: [
    ['When', 'Mon 15 Sep 2008, about 12:35'],
    ['Where', 'Billet yard offloading area'],
    ['Who', 'Contract truck driver, Swartland Haulage'],
    ['What', 'Struck by a falling steel billet'],
    ['Injury', 'Serious; being taken to hospital']
  ],
  unknown: ['How the billet came to fall', 'Who else was involved', 'What the load and equipment looked like', 'Whether anything has been moved']
};

/* ---------- Stage 1: immediate actions ------------------------------ */
GAME.callout = [
  { id: 'care', text: 'Confirm the casualty is being cared for and the ambulance is on its way', good: true, flag: null,
    fb: 'Always first. People before evidence: the paramedic is already on scene and you confirm the hand-over to the ambulance.' },
  { id: 'secure', text: 'Barricade the offloading area and stop all work in the yard until released', good: true, flag: 'sceneSecured',
    fb: 'Securing the scene keeps the positions of the billet, forklift and load intact for your examination.' },
  { id: 'photos', text: 'Have someone photograph the scene now, before anything else is moved', good: true, flag: 'photosEarly',
    fb: 'Scene photos are the most perishable evidence. The rescue already moved the billet and the casualty, so record what is left straight away.' },
  { id: 'holdtruck', text: 'Hold the truck and its remaining load on site', good: true, flag: 'truckHeld',
    fb: 'The load, dunnage and tie-downs are primary physical evidence. Once the truck leaves, they are gone.' },
  { id: 'holdfork', text: 'Take the Henley forklift out of service and tag it, with the forks as they are', good: true, flag: 'forkliftHeld',
    fb: 'Quarantining the forklift preserves the fork position and lets you measure and check it.' },
  { id: 'separate', text: 'Ask the witnesses for short written accounts before they talk it over among themselves', good: true, flag: 'witnessesSeparated',
    fb: 'Witness memory changes quickly, especially after people discuss what happened. Get first accounts early.' },
  { id: 'notify', text: 'Notify management, the haulier, and the Department of Labour (serious injury, OHS Act s24)', good: true, flag: 'notified',
    fb: 'A serious injury is reportable. The haulier must also know because their employee is injured and their load is involved.' },
  { id: 'alcohol', text: 'Arrange post-incident alcohol testing for the people involved, per site policy', good: null, flag: 'alcoholTest',
    fb: 'Acceptable when site policy requires it for everyone involved. It must not become a way of looking for someone to blame.' },
  { id: 'clear', text: 'Get the billets restacked so the yard can start offloading again', good: false, flag: 'sceneCleared',
    fb: 'This destroys the scene. Production pressure is real, but the yard stays closed until the investigator releases it.' },
  { id: 'suspend', text: 'Send the forklift operator home and start a disciplinary process', good: false, flag: 'operatorSuspended',
    fb: 'This decides blame before you have any facts, and your key witness will now be guarded and defensive. ICAM looks for system failures, not a scapegoat.' },
  { id: 'release', text: 'Let the truck leave once it is empty so the haulier is not charged waiting time', good: false, flag: 'truckReleased',
    fb: 'The truck, its tie-downs and the dunnage leave with it. That is evidence you cannot get back.' }
];

/* ---------- Stage 2: team, severity --------------------------------- */
GAME.team = [
  { id: 'lead', name: 'You: lead investigator / ICAM facilitator', ok: 'req', fb: 'Required. ICAM needs a trained facilitator who is independent of the area.' },
  { id: 'ops', name: 'Hennie Kruger, operations manager (sponsor)', ok: 'yes', fb: 'Good. Gives the team authority and access, and owns the actions.' },
  { id: 'sherq', name: 'SHERQ manager', ok: 'yes', fb: 'Good. Knows the risk management and reporting systems.' },
  { id: 'despatch', name: 'Clive Jansen, despatch co-ordinator', ok: 'yes', fb: 'Good. Knows the receiving process and the hauliers. He is also a witness to the process, so interview him separately.' },
  { id: 'operator', name: 'Experienced forklift operator from another shift', ok: 'yes', fb: 'Good. Brings work-as-done knowledge and represents the workforce.' },
  { id: 'haulier', name: 'Haulier representative (Swartland Haulage)', ok: 'yes', fb: 'Good. Their employee was injured and their loading practices are part of the story.' },
  { id: 'eng', name: 'Johan de Wet, engineering manager (first day only)', ok: 'yes', fb: 'Useful for the equipment questions, even if he can only spare the first day.' },
  { id: 'scribe', name: 'Personal assistant as scribe / minutes', ok: 'yes', fb: 'Good. Frees the team to think and gives you a record.' },
  { id: 'ndlovu', name: 'Sizwe Ndlovu, the forklift operator involved', ok: 'no', fb: 'No. He is a key witness. Putting him on the team compromises his account and the team\'s independence.' },
  { id: 'visser', name: 'Gerrit Visser, the supervisor on duty', ok: 'no', fb: 'No. He was involved in the event and its aftermath. Interview him instead.' },
  { id: 'lawyer', name: 'Company lawyer to approve every statement', ok: 'no', fb: 'No. It makes people defensive and closes them down. Get legal advice separately if you need it.' },
  { id: 'hr', name: 'HR officer to prepare disciplinary charges', ok: 'no', fb: 'No. A blame focus stops people telling you what really happens.' }
];
GAME.severity = { actual: 4, potential: 5,
  fbActual: 'Actual: multiple fractures (skull base, spine, arm, ribs), so Major (4). This is a serious, lost-time and reportable injury.',
  fbPotential: 'Potential: an 800 kg billet falling onto a person can kill, so Catastrophic (5). Potential severity drives the investigation level, here Level 4.' };

/* ---------- Stage 3: data collection plan (PEEPO) -------------------- */
GAME.peepo = [
  { k: 'P', name: 'People', tip: 'Who saw, did, decided or knows the normal way of working? Interview early, one at a time, using open questions.' },
  { k: 'E', name: 'Environment', tip: 'Scene layout, positions, weather, lighting, ground and access. This is the most perishable evidence: record it first.' },
  { k: 'Eq', name: 'Equipment', tip: 'Machines, tools, loads and materials. Check their condition, suitability and limits; measure and test.' },
  { k: 'Pr', name: 'Procedures', tip: 'What should have happened: procedures, training, licences, permits, rules and contracts. Check dates and versions.' },
  { k: 'O', name: 'Organisation', tip: 'Systems behind the work: risk management, incident history, resources, contractor control, change management.' }
];
/* distractors that appear only in the plan */
GAME.planDistractors = [
  { id: 'x_furnace', cat: 'Eq', title: 'Reheat furnace temperature logs', fb: 'Not relevant to the event. It costs time and gives you nothing.' },
  { id: 'x_disc', cat: 'Pr', title: 'Disciplinary history of the forklift operator', fb: 'Blame-seeking. Past discipline says nothing about why the system allowed this.' },
  { id: 'x_finance', cat: 'P', title: 'Truck driver\'s personal and financial background', fb: 'An invasion of privacy and irrelevant to the cause.' },
  { id: 'x_cctv', cat: 'E', title: 'CCTV footage of the yard', fb: 'A sensible thing to ask for. On this site no camera covers the billet yard, so it yields nothing, but planning for it was reasonable.', neutral: true }
];

/* ---------- facts --------------------------------------------------- */
/* kind: event | condition.  icam: accepted codes ('NONE' = sequence only / not a factor).
   attach: acceptable events for a condition ('G' = general / underlying). key: core fact. */
GAME.facts = {
  E01: { kind: 'event', order: 1, time: '~10:00', text: 'Truck is loaded with billets at the supplier (Metro Billet Supplies).', icam: ['NONE'] },
  E02: { kind: 'event', order: 2, time: '10:15–12:25', text: 'Truck carries the load about 40 km by road to Steel Inc.', icam: ['NONE'] },
  E03: { kind: 'event', order: 3, time: 'en route', text: 'Rear upper layer of billets and its dunnage shift forward during transport.', icam: ['NONE', 'WF12'], presumptive: true },
  E04: { kind: 'event', order: 4, time: '12:30', text: 'Truck arrives at the billet yard offloading area.', icam: ['NONE'], key: true },
  E05: { kind: 'event', order: 5, time: '12:30', text: 'Truck driver gets out of the cab and releases the load straps.', icam: ['IT12', 'IT6'], key: true },
  E06: { kind: 'event', order: 6, time: '12:31', text: 'Forklift operator sees that the rear upper layer has shifted and there is no gap between layers.', icam: ['NONE', 'WF12'], key: true },
  E07: { kind: 'event', order: 7, time: '12:32', text: 'Operator offloads the front stack, which is in normal condition.', icam: ['NONE'] },
  E08: { kind: 'event', order: 8, time: '12:34', text: 'Operator decides to lift the end of the rear stack to insert dunnage, without calling the supervisor.', icam: ['IT1', 'WF11', 'DF12', 'IT6'], key: true },
  E09: { kind: 'event', order: 9, time: '12:35', text: 'Operator pushes the Henley forks in at an angle under the upper layer and lifts the end of about 16 billets.', icam: ['IT4', 'IT7', 'IT6'], key: true },
  E10: { kind: 'event', order: 10, time: '12:35', text: 'Truck driver goes to the far side, out of the operator\'s sight, and pushes a dunnage block in at the front.', icam: ['IT12', 'IT13'], key: true },
  E11: { kind: 'event', order: 11, time: '12:35', text: 'Operator sees the dunnage appear and realises the driver is on the far side.', icam: ['NONE'] },
  E12: { kind: 'event', order: 12, time: '12:36', text: 'Operator hoots and gives hand signals for the driver to come round to his side.', icam: ['NONE', 'IT13'], key: true },
  E13: { kind: 'event', order: 13, time: '12:36', text: 'A billet slides off the far side of the lifted stack.', icam: ['NONE'], presumptive: true, key: true },
  E14: { kind: 'event', order: 14, time: '12:36', text: 'The billet strikes the truck driver and pins him to the ground.', icam: ['NONE'], key: true },
  E15: { kind: 'event', order: 15, time: '12:38', text: 'Operator waits, puts the forklift in neutral and climbs out to look for the driver.', icam: ['NONE'] },
  E16: { kind: 'event', order: 16, time: '12:39', text: 'Operator finds the driver under the billet and runs to alert the area supervisor.', icam: ['NONE'] },
  E17: { kind: 'event', order: 17, time: '12:41', text: 'Supervisor radios the clinic and has the reheat forklift lift the billet off the driver\'s arms.', icam: ['NONE', 'DF5', 'DF7'] },
  E18: { kind: 'event', order: 18, time: '12:48', text: 'Paramedic moves the casualty clear of the unstable load and stabilises him.', icam: ['NONE', 'DF7'] },
  E19: { kind: 'event', order: 19, time: '13:30', text: 'Driver is taken to hospital with multiple fractures (skull base, spine, left forearm, ribs).', icam: ['NONE'] },

  C01: { kind: 'condition', text: 'The load was restrained with nylon straps, not chains. Chains are only a verbal standard.', attach: ['E01', 'E02', 'E03'], icam: ['DF2', 'CM'] },
  C02: { kind: 'condition', text: 'The trailer is a flat deck with no side stanchions or uprights.', attach: ['E03', 'E13'], icam: ['DF4'], key: true },
  C03: { kind: 'condition', text: 'The supplier places dunnage on the rounded edges of the billets, where it can roll out.', attach: ['E01', 'E03'], icam: ['DF13', 'CM'] },
  C04: { kind: 'condition', text: 'The haulage and supply arrangements set no loading or securing standard.', attach: ['E01', 'E02', 'E03', 'G'], icam: ['DF2', 'CM'], key: true },
  C05: { kind: 'condition', text: 'Billets have fallen off haulier trucks on the highway before.', attach: ['E03', 'G'], icam: ['WF13', 'CO', 'CM'] },
  C06: { kind: 'condition', text: 'Hauliers are paid per load, so drivers push for fast turnaround and help with offloading.', attach: ['E05', 'E10'], icam: ['HF5', 'IG'], key: true },
  C07: { kind: 'condition', text: 'The rear upper layer overhangs the lower layer and has no dunnage gap under it.', attach: ['E06', 'E08'], icam: ['WF12'], key: true },
  C08: { kind: 'condition', text: 'It is overcast and raining. Billets, dunnage and forks are wet and slippery.', attach: ['E09', 'E13'], icam: ['WF2'], key: true },
  C09: { kind: 'condition', text: 'The uneven yard surface and pools of water limit where people can stand around the truck.', attach: ['E10', 'E14'], icam: ['WF6'] },
  C10: { kind: 'condition', text: 'Rain on the windscreen and the raised load block the operator\'s view of the far side.', attach: ['E10', 'E11', 'E12'], icam: ['WF2', 'WF7', 'DF3'], key: true },
  C11: { kind: 'condition', text: 'The Hyster, with thinner forks suited to billets, is on standby for the Meltshop, so the Henley is used.', attach: ['E08', 'E09'], icam: ['WF9', 'IT4'], key: true },
  C12: { kind: 'condition', text: 'The Henley\'s forks are thicker than the gap that standard dunnage creates.', attach: ['E08', 'E09'], icam: ['DF13', 'WF9', 'DE'], key: true },
  C13: { kind: 'condition', text: 'About 16 billets were lifted. The forks fit about 15, and standard practice is 8 per lift.', attach: ['E09'], icam: ['IT4', 'IT6', 'IT7'], key: true },
  C14: { kind: 'condition', text: 'The operator\'s certificate covers 3 t counterbalance trucks; the Henley is an 8 t machine.', attach: ['E09', 'E08', 'G'], icam: ['IT10', 'TR'], key: true },
  C15: { kind: 'condition', text: 'The operator learned billet handling and abnormal loads only through informal on-the-job coaching.', attach: ['E08'], icam: ['IT6', 'IT10', 'TR'] },
  C16: { kind: 'condition', text: 'There was no written procedure for offloading billets. WI 044 was written the day after.', attach: ['E08', 'E09', 'G'], icam: ['DF11', 'PR'], key: true },
  C17: { kind: 'condition', text: 'Billet offloading had never been risk-assessed. The HIRA is dated the day after.', attach: ['E08', 'G'], icam: ['WF10', 'DF9', 'RM', 'PR'], key: true },
  C18: { kind: 'condition', text: 'Training says to call the supervisor for abnormal loads, but shifted loads were treated as normal.', attach: ['E08'], icam: ['DF12', 'IT1', 'DF1'], key: true },
  C19: { kind: 'condition', text: 'The rules conflict: drivers must stay in the cab, yet they are expected to untie their own loads.', attach: ['E05', 'E10'], icam: ['DF14', 'IT12', 'CM', 'PR'], key: true },
  C20: { kind: 'condition', text: 'Truck drivers are not inducted before they enter the yard.', attach: ['E05', 'E10', 'G'], icam: ['DF14', 'CM'], key: true },
  C21: { kind: 'condition', text: 'The truck driver wore a cap, not a hard hat.', attach: ['E10', 'E14'], icam: ['DF8', 'IT5'], key: true },
  C22: { kind: 'condition', text: 'The operator and driver had not agreed who places dunnage or where the driver should stand.', attach: ['E10', 'E12'], icam: ['IT13', 'CO'], key: true },
  C23: { kind: 'condition', text: 'Billets had fallen during offloading before but were never reported because nobody was hurt.', attach: ['E08', 'G'], icam: ['WF13', 'HF1', 'CO', 'DF10'], key: true },
  C24: { kind: 'condition', text: 'Risk management is new and focused on molten metal and cranes. High-consequence, low-probability risks are not singled out.', attach: ['G'], icam: ['RM', 'PR', 'DF10'], key: true },
  C25: { kind: 'condition', text: 'The forklift fleet is old and short; replacements are still on order or in the capex budget.', attach: ['E08', 'E09', 'G'], icam: ['HW'], key: true },
  C26: { kind: 'condition', text: 'There is no traffic management plan; vehicles and people mix in the yard.', attach: ['E10', 'G'], icam: ['OR', 'PR', 'DF14'] },
  C27: { kind: 'condition', text: 'There is no management-of-change process for abnormal loads or substitute equipment.', attach: ['E08', 'G'], icam: ['MC'], key: true },
  C28: { kind: 'condition', text: 'The Henley\'s pre-shift check on 15 Sep records no defects.', attach: ['E09'], icam: ['NONE'], elim: true },
  C29: { kind: 'condition', text: 'The Henley\'s load test (8,000 kg SWL, Oct 2007) is current.', attach: ['E09'], icam: ['NONE'], elim: true },
  C31: { kind: 'condition', text: 'The operator\'s site induction records cannot be found.', attach: ['G'], icam: ['TR', 'DF14'] },
  C32: { kind: 'condition', text: 'Each billet is about 6 m long and weighs about 800 kg. A hard hat cannot protect against that energy.', attach: ['E13', 'E14'], icam: ['NONE'] },
  C33: { kind: 'condition', text: 'No exclusion zone or safe waiting position is defined for drivers during offloading.', attach: ['E10', 'E05'], icam: ['DF4', 'DF14', 'OR'], key: true },
  C34: { kind: 'condition', text: 'The rescue disturbed the scene (billet lifted off, casualty moved), and rightly so, to protect life.', attach: ['E17', 'E18'], icam: ['NONE'] },
  C35: { kind: 'condition', text: 'There is no check of incoming loads, and no way to reject a substandard load on arrival.', attach: ['E04', 'E06'], icam: ['DF1'], key: true },
  C36: { kind: 'condition', text: 'There is no sign of alcohol or drug use (paramedic\'s observation).', attach: ['E14'], icam: ['NONE'], elim: true },
  C37: { kind: 'condition', text: 'The fallen billet lay on the far side beside the rear axles, about 1 m from the trailer.', attach: ['E14'], icam: ['NONE'] }
};

/* ---------- photos -------------------------------------------------- */
GAME.photos = {
  p118: 'The Henley forklift at the rear stack, the position the operator was in while lifting.',
  p119: 'The fallen billet on the far side of the trailer, beside the rear axle group, with pools of water.',
  p121: 'The fallen billet (foreground) and dunnage on the ground beside the trailer.',
  p124: 'Billet and a dunnage block lying beside the rear wheels. The rear upper layer still overhangs.',
  p125: 'Reconstruction: forks pushed in at an angle under the upper layer, with no dunnage gap.',
  p126: 'Reconstruction: the raised load from beside the forklift. The far side cannot be seen.',
  p127: 'Reconstruction: the operator\'s view through the wet windscreen.',
  p128: 'Reconstruction: rain on the windscreen; the mast and carriage block the view.',
  p129: 'Reconstruction: about 16 billets on the Henley forks. The standard is 8.',
  p131: 'Another delivery: a flat deck with no side stanchions, billets in rows on dunnage.',
  p132: 'A different haulier\'s trailer with headboard uprights and the load strapped down.',
  p133: 'Scene overview: the truck, the yard with standing water, and responders in the background.',
  p134: 'A dark cap lying beside the billet stack. No hard hat was found near the casualty.',
  p135: 'Splintered dunnage on the rounded edge of the billets, between the layers of the rear stack.'
};

/* ---------- documents (recreated for training) ------------------------ */
GAME.docs = {
  licence: { title: 'Certificate of competence: S. Ndlovu', type: 'Documentary', html: `
    <div class="doc-cert"><div class="doc-org">SkillsFirst Training (accredited provider)</div>
    <h3>CERTIFICATE OF COMPETENCE</h3><p>This is to certify that</p><p class="doc-big">Sizwe Ndlovu</p>
    <p>has successfully completed a training course in</p><p class="doc-big">Counterbalance Lift Truck</p>
    <p><b>Code 01A, Capacity 3T</b></p>
    <table class="doc-kv"><tr><td>Training period</td><td>2 days</td></tr><tr><td>Unit standard</td><td>8038 (6 credits)</td></tr>
    <tr><td>Date of issue</td><td>22 May 2007</td></tr><tr><td>Expiry date</td><td>22 May 2009</td></tr><tr><td>Restrictions</td><td>None</td></tr>
    <tr><td>Certificate no.</td><td>A0131/07</td></tr></table></div>`,
    obs: [
      { t: 'The certificate covers a 3 t counterbalance truck only', ok: true, fact: 'C14', fb: 'Correct. Now compare this with the machine he was driving: the Henley load test shows 8,000 kg.' },
      { t: 'The certificate had expired on the day of the incident', ok: false, fb: 'Check the dates: it is valid until 22 May 2009.' },
      { t: 'The provider is not accredited', ok: false, fb: 'Nothing on the certificate says that. Do not assume it.' }
    ] },
  loadtest: { title: 'Load test report: Henley No. 2', type: 'Technical / Data Record', html: `
    <div class="doc-org">Cape Lift Inspections, Milnerton</div><h3>LOAD TEST REPORT No. 10/038/07</h3>
    <table class="doc-kv"><tr><td>Customer</td><td>Steel Inc.</td></tr><tr><td>Plant</td><td>HENLEY No. 2, serial 27 HDL</td></tr><tr><td>Location</td><td>Yard</td></tr></table>
    <table class="doc-grid"><tr><th>Test</th><th>SWL</th><th>O/load</th><th>Result</th></tr><tr><td>Static</td><td>8,000 kg</td><td>10%</td><td>ACCEPT</td></tr><tr><td>Dynamic</td><td>n/a</td><td>n/a</td><td>n/a</td></tr></table>
    <p>Lifting equipment may be used. Note: inspection only.</p><p>Witnessed 26/10/2007. Competent person: D. Carter.</p>`,
    obs: [
      { t: 'The Henley is rated 8,000 kg, well above the 3 t on the operator\'s certificate', ok: true, needs: 'licence', fact: 'C14', fb: 'Correct. A licensing gap: the operator was competent in practice, but not certified for this machine.' },
      { t: 'The load test is current, so there is no sign of a lifting-equipment defect', ok: true, fact: 'C29', fb: 'Correct. This rules out a cause. Recording eliminated causes is part of a good investigation.' },
      { t: 'The forklift was overloaded at the time of the incident', ok: false, fb: 'Sixteen billets of about 800 kg is about 12.8 t if fully lifted, but he lifted one end only. You have no evidence of overload; do not speculate.' }
    ] },
  preshift: { title: 'Pre-shift inspection: Henley No. 2, 15/09/08', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Inspection schedule, forklift No. 2 (Henley) · Rev 01 Feb 08</div>
    <table class="doc-kv"><tr><td>Date</td><td>15/09/08 — morning shift</td></tr><tr><td>Driver</td><td>S. Ndlovu</td></tr></table>
    <table class="doc-grid"><tr><th>Item</th><th>M</th></tr>
    <tr><td>Engine, radiator, hydraulic and gearbox oil levels</td><td>✓</td></tr><tr><td>Wheel nuts, water and oil leaks</td><td>✓</td></tr>
    <tr><td>Windows cracked or broken</td><td>✓</td></tr><tr><td>Forks, mast and chains</td><td>✓</td></tr><tr><td>Hooter, reverse alarm, lights</td><td>✓</td></tr>
    <tr><td>Brakes and steering</td><td>✓</td></tr><tr><td>Driver's licence</td><td>✓</td></tr></table><p>Brake fluid added. Diesel 105 L.</p>`,
    obs: [
      { t: 'No defects were recorded, so a mechanical failure of the forklift is unlikely', ok: true, fact: 'C28', fb: 'Correct. You can now rule out equipment failure as a cause.' },
      { t: '"Driver\'s licence" is ticked, but the checklist does not ask whether the licence covers this machine', ok: true, needs: 'licence', fb: 'Good catch. The check exists only on paper; it cannot detect the 3 t / 8 t gap.' },
      { t: 'Adding brake fluid shows the brakes were faulty', ok: false, fb: 'Topping up fluid is routine. Brakes are ticked OK and played no part in the event.' }
    ] },
  wi044: { title: 'WI 044: Safe offloading of billets', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Safe Work Instruction · WI 044 · Rev 0</div><h3>Safe off-loading of billets from road transport</h3>
    <ol><li>PPE must be worn at all times.</li><li>Before offloading, the forklift driver shall ensure that the load is safe and properly secured. <i>Nobody should deal with an unstable load.</i></li>
    <li>Offload only in the designated offloading zone.</li><li>A maximum of eight (8) billets may be handled at a time.</li>
    <li>Only the forklift driver and billet assistant may take part in offloading.</li><li>If conditions become unsafe at any time, stop immediately and report to the supervisor.</li></ol>
    <table class="doc-kv"><tr><td>Compiled by</td><td>D. Steyn</td></tr><tr><td>Approved by</td><td>F. Weber</td></tr><tr><td>Date</td><td><b>16/09/08</b></td></tr></table>`,
    obs: [
      { t: 'It is dated 16/09/08, the day after the incident, so no written procedure existed at the time', ok: true, fact: 'C16', fb: 'Correct, and easy to miss. Always check that a document was in force on the day of the event.' },
      { t: 'The operator breached WI 044 by lifting 16 billets', ok: false, fb: 'Be careful: WI 044 did not exist on 15 Sep. You cannot breach a procedure that had not been written.' },
      { t: 'It limits handling to 8 billets, which matches the established practice operators describe', ok: true, fb: 'Yes. It writes down the informal norm, which is useful for your corrective actions.' }
    ] },
  hira: { title: 'HIRA 000 Rev 1: Offloading of billets', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Hazard Identification & Risk Assessment · Date: <b>2008/09/16</b></div>
    <div class="tbl-wrap"><table class="doc-grid"><tr><th>Hazard</th><th>Outcome</th><th>P</th><th>S</th><th>R</th><th>Control</th></tr>
    <tr><td>Pedestrians</td><td>Injury to people</td><td>1</td><td>3</td><td>3</td><td>—</td></tr>
    <tr><td>Forklift not visible</td><td>Accident / falling billets</td><td>2</td><td>4</td><td>8</td><td>Headlights on</td></tr>
    <tr><td>Unsafe load / incorrect stacking</td><td>Serious injury / falling billets</td><td>2</td><td>5</td><td>10</td><td>Insecure loads not to be offloaded</td></tr>
    <tr><td>Damaged dunnage</td><td>Difficulty loading / injuries</td><td>2</td><td>5</td><td>10</td><td>Notify supervisor</td></tr>
    <tr><td>Unqualified drivers</td><td>Accident</td><td>1</td><td>5</td><td>5</td><td>Only qualified drivers</td></tr>
    <tr><td>Faulty forklift</td><td>Accident</td><td>2</td><td>3</td><td>6</td><td>Pre-shift checklist QA065</td></tr></table></div>
    <p>Participants: S. Nortje, D. Steyn</p>`,
    obs: [
      { t: 'It is dated 16/09/08, so offloading had not been risk-assessed before the incident', ok: true, fact: 'C17', fb: 'Correct. The risk assessment came after the injury.' },
      { t: 'Falling billets rate only 10, even with severity 5: a P × S matrix plays down fatal risks', ok: true, fact: 'C24', fb: 'Exactly. A high-consequence, low-probability hazard needs a separate fatal-risk process, not just a P × S score.' },
      { t: 'The HIRA covers the truck driver\'s position beside the load', ok: false, fb: 'Look again. Nothing addresses where truck drivers or other people stand during offloading.' }
    ] },
  manual: { title: 'Forklift operator training manual (extract)', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Forklift operator training manual, section 7 "Loads"</div>
    <p>7.4 <b>Abnormal loads.</b> If a load is damaged, unstable, leaning or has shifted, do not attempt to handle it. Stop and call your supervisor, who will decide how the load is to be handled.</p>
    <p>7.5 Never lift a load that exceeds the rated capacity of the truck or the length of the forks.</p>
    <p>7.6 Keep all persons clear of the load while lifting.</p>`,
    obs: [
      { t: 'The manual tells operators to call the supervisor for a shifted load. This was not done', ok: true, fact: 'C18', fb: 'Correct. Now ask why: interviews show shifted loads were seen as routine.' },
      { t: 'The manual sets a clear exclusion zone around the truck', ok: false, fb: '"Keep persons clear" gives no distance, position or method, and it is aimed only at operators.' },
      { t: 'The manual proves the operator was trained in this rule', ok: false, fb: 'It shows what the manual says, not what was taught. Check the training records.' }
    ] },
  rules: { title: 'Gate rules for truck drivers + haulier delivery instruction', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Gate card handed to drivers</div>
    <ul><li><b>Remain in your cab at all times while in the yard.</b></li><li>Wear PPE (hard hat, safety shoes, vest) when out of your vehicle.</li><li>Speed limit 10 km/h.</li></ul>
    <hr><div class="doc-org">Swartland Haulage — Driver delivery instruction</div>
    <ul><li>At destination, <b>release the load restraints</b> when instructed by the customer and assist with dunnage if required.</li></ul>`,
    obs: [
      { t: 'The two documents conflict: stay in the cab vs. release restraints and help with dunnage', ok: true, fact: 'C19', fb: 'Correct. Conflicting rules make violation normal; the driver could not obey both.' },
      { t: 'The driver broke the gate rules, so the cause is driver misconduct', ok: false, fb: 'Not enough. ICAM records the individual action (IT12) but asks what made it normal and expected.' },
      { t: 'Hard hats are required when out of the vehicle', ok: true, fact: 'C21', needs: 'adams', fb: 'Yes. Witnesses say he wore a cap. Note that a hard hat would not stop an 800 kg billet.' }
    ] },
  induct: { title: 'Gate register + induction records', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Visitor and contractor gate register, 15/09/08</div>
    <div class="tbl-wrap"><table class="doc-grid"><tr><th>Time in</th><th>Name</th><th>Company</th><th>Vehicle</th><th>Inducted (Y/N)</th></tr>
    <tr><td>09:40</td><td>P. Moos</td><td>Western Scrap</td><td>CA 551-203</td><td></td></tr>
    <tr><td>12:24</td><td>L. Mokoena</td><td>Swartland Haulage</td><td>CK 41 882</td><td></td></tr></table></div>
    <p>Induction file search: no induction record found for <b>S. Ndlovu</b> (employee, despatch). Forklift certificate on file.</p>`,
    obs: [
      { t: 'The induction column is blank for the drivers, so drivers are not inducted', ok: true, fact: 'C20', fb: 'Correct. External drivers enter the hazardous yard without an induction.' },
      { t: 'No induction record can be found for the forklift operator', ok: true, fact: 'C31', fb: 'Correct. Gaps in the paperwork matter even when a person is competent.' },
      { t: 'The driver arrived late, which shows he was rushing', ok: false, fb: 'There is no appointment time to compare with. Do not read time pressure into a gate entry.' }
    ] },
  contract: { title: 'Haulage purchase order (billets, Metro → Steel Inc.)', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Purchase order 4410872 · Supplier: Swartland Haulage</div>
    <table class="doc-kv"><tr><td>Service</td><td>Transport of billets, Metro Billet Supplies → Steel Inc. billet yard</td></tr>
    <tr><td>Rate</td><td>R 3,450.00 per load (ex VAT)</td></tr><tr><td>Waiting time</td><td>R 380.00 per hour after the first hour on site</td></tr>
    <tr><td>Load securing</td><td>—</td></tr><tr><td>Vehicle specification</td><td>—</td></tr><tr><td>Safety requirements</td><td>—</td></tr></table>`,
    obs: [
      { t: 'No load-securing, vehicle or safety requirements are specified', ok: true, fact: 'C04', fb: 'Correct. Contractor management stopped at price and logistics.' },
      { t: 'Payment per load plus waiting charges builds pressure on everyone for fast turnaround', ok: true, fact: 'C06', fb: 'Yes. This is an incompatible goal built into the commercial terms.' },
      { t: 'The haulier is in breach of contract', ok: false, fb: 'There was nothing in the contract to breach. That is the finding.' }
    ] },
  increg: { title: 'Incident register Jan–Sep 2008 (extract)', type: 'Technical / Data Record', html: `
    <div class="doc-org">Steel Inc. — Incident register</div>
    <div class="tbl-wrap"><table class="doc-grid"><tr><th>Date</th><th>Area</th><th>Description</th><th>Class</th></tr>
    <tr><td>14/01</td><td>Meltshop</td><td>Metal splash on boot</td><td>FAC</td></tr><tr><td>02/03</td><td>Rolling mill</td><td>Finger caught in guide</td><td>LTI</td></tr>
    <tr><td>19/04</td><td>Cranes</td><td>Hook block struck handrail</td><td>Damage</td></tr><tr><td>28/05</td><td>Meltshop</td><td>Ladle spill, no injury</td><td>NM</td></tr>
    <tr><td>11/07</td><td>Workshop</td><td>Grinder kickback, cut hand</td><td>MTC</td></tr><tr><td>…</td><td colspan="3">14 entries in total. <b>None relates to the billet yard or to falling billets.</b></td></tr></table></div>`,
    obs: [
      { t: 'There are no billet-yard entries, yet operators say billets have fallen before, so those events went unreported', ok: true, fact: 'C23', needs: 'any:crew,visser,ndlovu,steyn,fortuin', fb: 'Correct. The silence in the register is itself evidence once you set it against the witness accounts.' },
      { t: 'The billet yard is a low-risk area because there are no incidents', ok: false, fb: 'That is the trap the organisation fell into: no reports does not mean no risk.' }
    ] },
  rms: { title: 'Risk register summary + SHERQ system status', type: 'Documentary', html: `
    <div class="doc-org">Steel Inc. — Baseline risk register (started Feb 2008)</div>
    <table class="doc-kv"><tr><td>Activities assessed</td><td>31 (Meltshop 14, Cranes 9, Rolling mill 8)</td></tr><tr><td>Despatch / billet yard</td><td><b>Not yet assessed</b></td></tr>
    <tr><td>Method</td><td>P × S (5 × 5); no separate fatal-risk or critical-control process</td></tr><tr><td>Management of change</td><td><b>No procedure</b></td></tr>
    <tr><td>Traffic management plan</td><td>Draft, not approved</td></tr></table>`,
    obs: [
      { t: 'The despatch and billet yard area had not been assessed; priorities were the Meltshop and cranes', ok: true, fact: 'C24', fb: 'Correct. A young risk management system with blind spots.' },
      { t: 'There is no management-of-change procedure', ok: true, fact: 'C27', fb: 'Correct. A shifted load or a substitute forklift is a change that nobody managed.' },
      { t: 'The traffic management plan is only a draft', ok: true, fact: 'C26', fb: 'Correct. Vehicles and people are not formally separated.' }
    ] },
  medical: { title: 'Hospital medical report (with consent)', type: 'Documentary', html: `
    <div class="doc-org">Regional hospital — summary released with the patient\'s consent</div>
    <p>Patient: L. Mokoena (41). Admitted 15/09/08 at 13:55.</p>
    <p>Multiple fractures: bilateral base of skull; cervical spine C6; thoracic T2 and T3; lumbar L1; left radius and ulna; right ribs 3–9. Soft-tissue injuries. Admitted to high care. Blood alcohol: not detected.</p>`,
    obs: [
      { t: 'The injuries match a heavy object striking him from above and the side, which could have been fatal', ok: true, fact: 'E19', fb: 'Correct. This confirms Catastrophic potential severity.' },
      { t: 'Alcohol was not a factor', ok: true, fact: 'C36', fb: 'Correct. Rule it out and record it as eliminated.' }
    ] },
  fleet: { title: 'Forklift fleet register + capex status', type: 'Technical / Data Record', html: `
    <div class="doc-org">Steel Inc. — Engineering: mobile equipment</div>
    <div class="tbl-wrap"><table class="doc-grid"><tr><th>Unit</th><th>Type</th><th>Year</th><th>Main use</th><th>Status</th></tr>
    <tr><td>FL1</td><td>Hyster 8 t (thin forks)</td><td>1994</td><td>Meltshop priority / billets</td><td>In service</td></tr>
    <tr><td>FL2</td><td>Henley 8 t</td><td>1989</td><td>Yard</td><td>In service; high hours</td></tr>
    <tr><td>FL3</td><td>3 t counterbalance</td><td>1998</td><td>Stores</td><td>In service</td></tr>
    <tr><td>FL4</td><td>Reheat forklift</td><td>2008</td><td>Reheat furnace</td><td>New, May 2008</td></tr>
    <tr><td>—</td><td>8 t billet forklift</td><td>—</td><td>Yard</td><td>On order (Nov 2008)</td></tr>
    <tr><td>—</td><td>8 t forklift</td><td>—</td><td>Despatch</td><td>Capex FY2009</td></tr></table></div>`,
    obs: [
      { t: 'The fleet is old and short; the suitable billet machine is shared with the Meltshop', ok: true, fact: 'C25', fb: 'Correct. A hardware (HW) organisational factor.' },
      { t: 'The Henley was not fit to operate', ok: false, fb: 'Its age is high, but the pre-shift check and load test show it was serviceable. It was unsuitable for this task, not defective.' }
    ] },
  hyster: { title: 'Forklift allocation board (transcribed), 15/09/08', type: 'Technical / Data Record', html: `
    <div class="doc-org">Despatch office whiteboard, photographed 15/09 at 15:10</div>
    <table class="doc-grid"><tr><th>Unit</th><th>AM</th><th>PM</th></tr><tr><td>Hyster</td><td>Billets</td><td><b>MELTSHOP STANDBY: ladle change 11:00–15:00</b></td></tr>
    <tr><td>Henley</td><td>Yard</td><td>Yard / billets</td></tr></table>`,
    obs: [
      { t: 'The Hyster was on Meltshop standby at the time, so the Henley was the only option for billets', ok: true, fact: 'C11', fb: 'Correct. Production priorities decided the equipment selection.' },
      { t: 'The operator chose the wrong forklift on his own initiative', ok: false, fb: 'The board shows the allocation was made for him. Look at the system, not the person.' }
    ] },
  weather: { title: 'Weather record, 15/09/08', type: 'Technical / Data Record', html: `
    <div class="doc-org">Weather station record (recreated for training)</div>
    <table class="doc-kv"><tr><td>Conditions 12:00–13:00</td><td>Overcast, light to moderate rain</td></tr><tr><td>Rainfall (24 h)</td><td>11.6 mm</td></tr><tr><td>Temperature</td><td>14 °C</td></tr><tr><td>Wind</td><td>NW 15 km/h</td></tr></table>`,
    obs: [
      { t: 'Wet steel, dunnage and forks reduce friction, so the billets can slide more easily', ok: true, fact: 'C08', fb: 'Correct. A workplace factor (WF2) behind the billet sliding.' },
      { t: 'The weather caused the incident', ok: false, fb: 'Weather is a condition, not a cause. People offload in the rain every winter.' }
    ] }
};

/* ---------- investigation actions ---------------------------------- */
/* cat: PEEPO key. cost in hours. days: [first,last]. needs: flag/condition.
   gives: facts, photos, doc. essential/perishable used for plan scoring. */
GAME.actions = [
  // People
  { id: 'i_ndlovu', cat: 'P', kind: 'interview', who: 'ndlovu', title: 'Interview Sizwe Ndlovu (forklift operator)', cost: 1, days: [1, 3], essential: true, perishable: true },
  { id: 'i_visser', cat: 'P', kind: 'interview', who: 'visser', title: 'Interview Gerrit Visser (area supervisor)', cost: 1, days: [1, 3], essential: true, perishable: true },
  { id: 'i_adams', cat: 'P', kind: 'interview', who: 'adams', title: 'Interview Kevin Adams (paramedic)', cost: 1, days: [1, 3], essential: true, perishable: true },
  { id: 'i_fortuin', cat: 'P', kind: 'interview', who: 'fortuin', title: 'Interview Neville Fortuin (reheat forklift operator)', cost: 1, days: [1, 3] },
  { id: 'i_jansen', cat: 'P', kind: 'interview', who: 'jansen', title: 'Interview Clive Jansen (despatch co-ordinator)', cost: 1, days: [1, 3], essential: true },
  { id: 'i_steyn', cat: 'P', kind: 'interview', who: 'steyn', title: 'Interview Danie Steyn (SHERQ co-ordinator)', cost: 1, days: [1, 3], essential: true },
  { id: 'i_weber', cat: 'P', kind: 'interview', who: 'weber', title: 'Interview Franz Weber (Meltshop manager)', cost: 1, days: [1, 3] },
  { id: 'i_dewet', cat: 'P', kind: 'interview', who: 'dewet', title: 'Interview Johan de Wet (engineering manager)', cost: 1, days: [1, 2], note: 'Available days 1–2 only' },
  { id: 'i_patel', cat: 'P', kind: 'interview', who: 'patel', title: 'Interview Rashid Patel (haulier transport manager)', cost: 1, days: [2, 3], essential: true, note: 'Travelling from the Swartland: from day 2' },
  { id: 'i_crew', cat: 'P', kind: 'interview', who: 'crew', title: 'Group discussion with the other despatch forklift operators', cost: 1, days: [2, 3], essential: true, note: 'Other shifts: from day 2' },
  { id: 'i_mokoena', cat: 'P', kind: 'interview', who: 'mokoena', title: 'Interview Lucas Mokoena (injured driver) in hospital', cost: 0.5, days: [3, 3], essential: true, note: 'Medically cleared for a short visit on day 3 only' },
  // Environment
  { id: 's_scene', cat: 'E', kind: 'site', title: 'Examine and photograph the scene', cost: 1.5, days: [1, 1], essential: true, perishable: true, note: 'Day 1 only: the yard reopens on day 2' },
  { id: 's_weather', cat: 'E', kind: 'doc', doc: 'weather', title: 'Get the weather record for 15 Sep', cost: 0.25, days: [1, 3] },
  { id: 's_yard', cat: 'E', kind: 'site', title: 'Survey the yard layout, traffic routes and other trailers', cost: 1, days: [1, 3] },
  { id: 's_observe', cat: 'E', kind: 'site', title: 'Observe a normal billet offload (work as done)', cost: 1.5, days: [2, 3], essential: true, note: 'Next delivery is on day 2' },
  { id: 's_cctv', cat: 'E', kind: 'site', title: 'Request CCTV footage of the yard', cost: 0.5, days: [1, 3] },
  // Equipment
  { id: 'q_load', cat: 'Eq', kind: 'site', title: 'Inspect the truck, the remaining load, dunnage and tie-downs', cost: 1, days: [1, 2], essential: true, perishable: true, note: 'Only while the truck is on site' },
  { id: 'q_fork', cat: 'Eq', kind: 'site', title: 'Inspect and measure the Henley\'s forks and fork setting', cost: 1, days: [1, 3], essential: true, perishable: true },
  { id: 'q_recon', cat: 'Eq', kind: 'site', title: 'Reconstruct the lift with the Henley and a loaded trailer', cost: 2, days: [2, 3], essential: true, note: 'Needs a loaded trailer: from day 2' },
  { id: 'q_preshift', cat: 'Eq', kind: 'doc', doc: 'preshift', title: 'Get the Henley pre-shift checklist for 15 Sep', cost: 0.5, days: [1, 3], essential: true },
  { id: 'q_loadtest', cat: 'Eq', kind: 'doc', doc: 'loadtest', title: 'Get the Henley load test certificate', cost: 0.5, days: [1, 3], essential: true },
  { id: 'q_hyster', cat: 'Eq', kind: 'doc', doc: 'hyster', title: 'Get the forklift allocation board / Hyster log', cost: 0.5, days: [1, 3], essential: true, perishable: true },
  { id: 'q_fleet', cat: 'Eq', kind: 'doc', doc: 'fleet', title: 'Get the forklift fleet register and capex plan', cost: 0.5, days: [1, 3] },
  // Procedures
  { id: 'p_licence', cat: 'Pr', kind: 'doc', doc: 'licence', title: 'Get the operator\'s competence certificate', cost: 0.5, days: [1, 3], essential: true },
  { id: 'p_wi', cat: 'Pr', kind: 'doc', doc: 'wi044', title: 'Get the procedure for offloading billets', cost: 0.5, days: [2, 3], essential: true, note: 'SHERQ office: from day 2' },
  { id: 'p_hira', cat: 'Pr', kind: 'doc', doc: 'hira', title: 'Get the risk assessment for billet offloading', cost: 0.5, days: [2, 3], essential: true, note: 'SHERQ office: from day 2' },
  { id: 'p_manual', cat: 'Pr', kind: 'doc', doc: 'manual', title: 'Get the forklift operator training manual', cost: 0.5, days: [1, 3] },
  { id: 'p_rules', cat: 'Pr', kind: 'doc', doc: 'rules', title: 'Get the gate rules and the haulier\'s driver instructions', cost: 0.5, days: [1, 3], essential: true },
  { id: 'p_induct', cat: 'Pr', kind: 'doc', doc: 'induct', title: 'Get the gate register and induction records', cost: 0.5, days: [1, 3], essential: true },
  { id: 'p_contract', cat: 'Pr', kind: 'doc', doc: 'contract', title: 'Get the haulage purchase order / contract', cost: 0.5, days: [1, 3], essential: true },
  // Organisation
  { id: 'o_increg', cat: 'O', kind: 'doc', doc: 'increg', title: 'Get the incident register and previous reports', cost: 0.5, days: [1, 3], essential: true },
  { id: 'o_rms', cat: 'O', kind: 'doc', doc: 'rms', title: 'Review the risk register and SHERQ system status', cost: 0.5, days: [1, 3], essential: true },
  { id: 'o_medical', cat: 'O', kind: 'doc', doc: 'medical', title: 'Request the medical report (with consent)', cost: 0.5, days: [2, 3] }
];

/* site action outcomes */
GAME.site = {
  s_scene: {
    good: { photos: ['p118', 'p119', 'p121', 'p124', 'p134', 'p133'], facts: ['C37', 'C07', 'C09', 'C34'],
      text: 'The scene has been kept as it was after the rescue. The billet lies on the far side by the rear axles, about 1 m from the trailer. A dunnage block is on the ground nearby. The Henley stands at the rear stack with its forks still under the upper layer. A dark cap lies beside the stack. Standing water covers much of the ground on the far side.' },
    poor: { photos: ['p124', 'p133'], facts: ['C07', 'C09', 'C34'],
      text: 'The yard has been partly cleared. The billet has been moved and restacked, and the forklift has been driven away. You photograph what remains: the overhanging rear stack and the wet, uneven ground. The billet\'s final position is now known only from witness accounts.' },
    early: { photos: ['p119', 'p121', 'p134'], facts: ['C37'], text: 'The photos taken early by the in-loco team show the billet where it came to rest and a cap beside the stack.' }
  },
  s_yard: { photos: ['p131', 'p132'], facts: ['C26', 'C02'],
    text: 'The yard has no marked walkways or waiting bays; trucks, forklifts and people share the same open ground. The trailers in the yard are flat decks with no side stanchions. One trailer from another haulier has headboard uprights at the front. The rail sidings cross the yard.' },
  s_observe: { photos: [], facts: ['C19', 'C33', 'C23'],
    text: 'On day 2 a Metro delivery arrives with the top row shifted forward again. The driver climbs out at once, releases the straps and stands beside the trailer while the operator lifts. There is no marked waiting position. The operator tells you: "This one is a good load, last week three fell off the back." Nobody calls a supervisor.' },
  s_cctv: { photos: [], facts: [], text: 'Security confirms that no camera covers the billet yard. The nearest camera faces the weighbridge.' },
  q_load: {
    ok: { photos: ['p135'], facts: ['C07', 'C01', 'C03', 'C02'],
      text: 'The rear stack\'s upper layer has slid forward by about 150 mm and overhangs the lower layer. The dunnage between the layers is splintered; it was placed on the rounded edges of the billets, not on a flat face. The load was held by two nylon straps; there are no chains. The flat deck has no side stanchions.' },
    gone: { photos: [], facts: [], text: 'The truck left the site at 16:10 to return to the depot and has since been reloaded. The load, the dunnage and the tie-downs are gone. Only the haulier can tell you how the load was secured.' }
  },
  q_fork: {
    held: { facts: ['C12', 'C13', 'E09'], text: 'The forks are still set as they were. They are about 80 mm thick at the heel and are angled up under the upper layer. Standard dunnage leaves a gap of about 75 mm, which is not enough for these forks. The fork length takes about 15 billets side by side.' },
    free: { facts: ['C12', 'C13'], text: 'The forklift went back into service after the incident, so its setting at the time is lost. Measurements show the forks are about 80 mm thick at the heel against a standard dunnage gap of about 75 mm. The fork length takes about 15 billets.' }
  },
  q_recon: { photos: ['p125', 'p126', 'p127', 'p128', 'p129'], facts: ['E09', 'C10', 'C13', 'C08'],
    text: 'With the Henley and a similar loaded trailer you reconstruct the lift. The forks have to enter at an angle under the upper layer, and the end of about 16 billets comes up together. From the cab, rain on the windscreen and the raised load hide the far side completely. Wet steel moves easily on wet dunnage.' }
};

/* ---------- interviews --------------------------------------------- */
/* type: open | probe | closed | leading | blame.  facts given unless rapport broken & guarded set. */
GAME.interviews = {
  ndlovu: { setting: 'Despatch office, door closed. Sizwe is shaken and keeps looking at his hands.', max: 5, qs: [
    { type: 'open', q: 'Take me through what happened, from when the truck arrived, in your own words.', a: 'The truck came at about half past twelve. The driver was already taking off the straps. The front stack was fine, so I took it off first. At the back the top row had moved forward and the wood between the rows was gone, so there was no gap for my forks. I thought I\'d lift the end a bit and put a block in. While I was lifting I saw a piece of wood come in at the front. That\'s when I knew he was on the other side. I hooted and waved for him to come round. He didn\'t come. I waited, then I got down and went round, and he was lying there under a billet.', facts: ['E04', 'E05', 'E06', 'E07', 'E08', 'E10', 'E11', 'E12', 'E15', 'E16'], guarded: 'The truck came, I took off the front, then the back was a problem and the billet fell. That\'s all.' },
    { type: 'probe', q: 'When you saw the rear stack had moved, what options did you consider?', a: 'Normally the Hyster: its forks are thinner and they go in. But the Hyster was standing by for the Meltshop. If I wait, the truck waits an hour or more. I\'ve done moved loads before; you lift the end a little, put a block in, then take them off. Call the supervisor for that? No. It happens all the time.', facts: ['C11', 'C18', 'C23'], guarded: 'I did what we always do.' },
    { type: 'probe', q: 'How many billets were on the forks, and how did the forks go in?', a: 'The whole row, about sixteen. The forks went in at an angle under the top row because there was no gap. Normally we take eight at a time.', facts: ['E09', 'C13'], guarded: 'I lifted the row.' },
    { type: 'open', q: 'What could you see from the cab while you were lifting?', a: 'The mast and the billets block the other side. And it was raining, the windscreen was wet. I only saw the wood coming through at the front, that\'s how I knew he was there.', facts: ['C10', 'C08'], guarded: 'Not much.' },
    { type: 'open', q: 'What had you and the driver agreed before you started?', a: 'Nothing really. The drivers usually help with the wood. I didn\'t ask him to. I wanted him on my side where I can see him, but we didn\'t talk about it.', facts: ['C22', 'C19'], guarded: 'Nothing.' },
    { type: 'probe', q: 'What training have you had for this forklift and for billets?', a: 'Two-day forklift course at SkillsFirst. For the billets, the older guys showed me on the job. My certificate is for the small forklift, I think three ton. But I drive the Henley every week; the foreman knows.', facts: ['C15', 'C14'], guarded: 'I\'m trained. I have a certificate.', presumptiveFacts: ['C14'] },
    { type: 'open', q: 'What was the driver wearing when he got out?', a: 'Overalls and a black cap. No hard hat. It was raining.', facts: ['C21'], guarded: 'I didn\'t look.' },
    { type: 'closed', q: 'Were you wearing your PPE?', a: 'Yes. Hard hat, boots, reflective vest.', facts: [], coach: 'A closed question is fine for confirming a detail, but it gives you nothing new.' },
    { type: 'leading', q: 'The driver walked into the danger zone on his own, didn\'t he?', a: 'Ja… I suppose. He shouldn\'t have been there.', facts: [], coach: 'A leading question: he just agreed with your premise. The answer is contaminated and tells you nothing reliable.' },
    { type: 'blame', q: 'Why didn\'t you stop when you knew someone could be on the other side? You should have known better.', a: '(Long silence.) I did hoot. I did everything I could… I don\'t want to talk any more.', facts: [], breaks: true, coach: 'A blaming question. Rapport is damaged and his later answers will be guarded. ICAM investigations ask "what" and "how", not "why didn\'t you".' }
  ] },
  visser: { setting: 'Supervisor\'s office overlooking the yard.', max: 5, qs: [
    { type: 'open', q: 'Tell me what you did from the moment Sizwe called you.', a: 'He came running in and said the driver was under a billet. I went out; the billet was across his arms and he was talking. I radioed the clinic and called Neville over with the reheat forklift to lift it off. Kevin came and pulled him away from the truck; the back stack was hanging over.', facts: ['E16', 'E17', 'E18', 'C34'], guarded: 'I called the clinic and we got it off him.' },
    { type: 'probe', q: 'How are shifted or abnormal loads meant to be handled here?', a: 'In their training they\'re told to call the supervisor. But a shifted load… they handle those all the time; I don\'t get called. There\'s nothing written for billets.', facts: ['C18', 'C16'], guarded: 'They know to call me.' },
    { type: 'open', q: 'What part do truck drivers play during offloading?', a: 'Officially they stay in the cab. But only the driver unties the load, and they help with the wood to get going faster. That\'s how it\'s always been.', facts: ['C19', 'C06'], guarded: 'They\'re supposed to stay in the cab.' },
    { type: 'probe', q: 'Why was the Henley used and not the Hyster?', a: 'The Hyster was on standby for the Meltshop, a ladle change. We\'re short of forklifts; the new one isn\'t here yet.', facts: ['C11', 'C25'], guarded: 'It was available.' },
    { type: 'probe', q: 'Have billets fallen during offloading before?', a: 'A few times, onto the ground. Nobody got hurt, so it wasn\'t written up. It\'s not something we\'d report.', facts: ['C23'], guarded: 'Not that I know of.' },
    { type: 'open', q: 'Who moves around the yard while trucks are being offloaded?', a: 'Anyone, really. There\'s no barrier; trucks, forklifts and people all mix. The traffic plan is still a draft.', facts: ['C26', 'C33'], guarded: 'People know to keep clear.' },
    { type: 'closed', q: 'Is Sizwe licensed for the Henley?', a: 'He\'s competent. He drives it all the time.', facts: [], coach: 'The closed question got an opinion, not a fact. Check the certificate itself.' },
    { type: 'blame', q: 'Your operator broke the rules on your shift. How do you explain that?', a: 'Which rules? Show me where it\'s written. (Folds his arms.)', facts: [], breaks: true, coach: 'Blame makes the supervisor defend himself. You lose the system information he holds.' }
  ] },
  adams: { setting: 'Site clinic.', max: 4, qs: [
    { type: 'open', q: 'Describe what you found when you got there.', a: 'The driver was on his back on the far side of the trailer. The billet had already been lifted off by the forklift. He was conscious, with pain in the neck, back, left arm and chest. The ground was wet, with pools everywhere. No hard hat; there was a cap lying near the stack.', facts: ['E18', 'C21', 'C09'] },
    { type: 'probe', q: 'What made you move him before he was fully stabilised?', a: 'The back stack was hanging over the side and another billet could have come down. I judged that staying there was a bigger risk than moving him carefully on a scoop.', facts: ['C34'] },
    { type: 'open', q: 'What injuries did you identify?', a: 'I suspected spinal injury, a fractured left forearm and rib fractures. The hospital later confirmed fractures of the skull base, C6, T2, T3, L1, the left radius and ulna, and ribs 3 to 9.', facts: ['E19'] },
    { type: 'closed', q: 'Was there any sign of alcohol?', a: 'No, nothing like that.', facts: ['C36'], coach: 'A good use of a closed question: you have ruled out a factor.' },
    { type: 'leading', q: 'So he must have been standing right under the load?', a: 'Probably, yes.', facts: [], coach: 'Leading. Mr Adams arrived afterwards and cannot know where the driver stood.' }
  ] },
  fortuin: { setting: 'Reheat furnace control room.', max: 3, qs: [
    { type: 'open', q: 'What did you see and do when Gerrit called you?', a: 'The billet was across his arms, near the back wheels on the far side. I slid the forks under it, lifted it off him and put it down away from him. That billet is about 6 metres, maybe 800 kilos.', facts: ['E17', 'C37', 'C32'] },
    { type: 'probe', q: 'How often do loads arrive shifted?', a: 'Every week or so. The Metro loads especially: they put the wood on the round side and it rolls out. Billets have come off on the highway too; the drivers talk about it.', facts: ['C03', 'C05'] },
    { type: 'open', q: 'Where would you expect a truck driver to stand during offloading?', a: 'On the operator\'s side where he can be seen, or in the cab. Nobody tells them; you just learn it.', facts: ['C33'] }
  ] },
  jansen: { setting: 'Despatch office.', max: 4, qs: [
    { type: 'open', q: 'Walk me through how billet deliveries are booked and received.', a: 'Metro loads them, Swartland brings them, and we offload in the yard. Nobody inspects a load on arrival; the operator looks at it. There\'s no specification for how the load must be stacked or tied.', facts: ['C35', 'C04'] },
    { type: 'probe', q: 'How are the hauliers paid, and what pressures do drivers face?', a: 'Per load. Turnaround is everything to them; they want in and out. That\'s why they help with the wood.', facts: ['C06'] },
    { type: 'probe', q: 'How should billet loads be tied down?', a: 'Danie says chains, but that\'s only verbal; it\'s not written anywhere. Most come in with nylon straps.', facts: ['C01'], presumptiveFacts: ['C01'] },
    { type: 'closed', q: 'Do you keep a record of rejected loads?', a: 'We\'ve never rejected one.', facts: ['C35'], coach: 'A useful closed question: the answer confirms there is no acceptance check.' },
    { type: 'open', q: 'What happens with truck drivers when they come on site?', a: 'They sign the register at the gate and get the gate card. No induction as such.', facts: ['C20'] }
  ] },
  steyn: { setting: 'SHERQ office.', max: 5, qs: [
    { type: 'open', q: 'What risk assessments covered billet offloading before the 15th?', a: 'Honestly, nothing specific. I drew up the HIRA and WI 044 after the incident, on the 16th. Our focus has been the Meltshop: molten metal and the cranes.', facts: ['C17', 'C16', 'C24'] },
    { type: 'probe', q: 'How does your risk process treat low-probability, high-consequence tasks?', a: 'We use P times S. A billet falling, the probability is low, so it scores medium. We don\'t have a separate fatal-risk process yet. Formal risk management only started this year.', facts: ['C24'] },
    { type: 'probe', q: 'How are incidents reported and learned from?', a: 'People report injuries. Near misses, they think only if someone was nearly hurt. A billet falling with nobody around didn\'t count.', facts: ['C23'] },
    { type: 'open', q: 'How are changes such as an abnormal load or a different forklift managed?', a: 'We don\'t have a management-of-change procedure.', facts: ['C27'] },
    { type: 'open', q: 'What are truck drivers told when they come on site?', a: 'The gate rules: stay in the cab, PPE. No induction. I know it conflicts with them untying loads.', facts: ['C19', 'C20'] },
    { type: 'leading', q: 'So the operator just ignored the procedure?', a: 'Well… there wasn\'t one written, to be fair.', facts: [], coach: 'Leading, but the honest answer exposes your assumption. Ask open questions to avoid this.' }
  ] },
  weber: { setting: 'Meltshop office.', max: 3, qs: [
    { type: 'probe', q: 'Why was the Hyster on standby for the Meltshop?', a: 'Ladle change. The Meltshop has priority on the Hyster; we can\'t have it tied up in the yard when steel is ready.', facts: ['C11'] },
    { type: 'open', q: 'How are forklifts shared between areas?', a: 'A phone call between foremen. There\'s no formal allocation, and the fleet is short.', facts: ['C25'] },
    { type: 'closed', q: 'Did you approve WI 044?', a: 'Yes, I signed it on the 16th when Danie brought it.', facts: ['C16'] }
  ] },
  dewet: { setting: 'Engineering office.', max: 4, qs: [
    { type: 'open', q: 'Tell me about the forklift fleet.', a: 'Old and over-used. One new one arrived, one is on order and one is in capex for next year. The Henley was load-tested last October; mechanically it\'s fine.', facts: ['C25', 'C29'] },
    { type: 'probe', q: 'How do the Henley\'s forks compare with the Hyster\'s for billets?', a: 'The Henley\'s forks are thicker. Standard dunnage gives about 75 mm; the Henley\'s fork heel is about 80. The Hyster\'s are thinner and slide in.', facts: ['C12'] },
    { type: 'closed', q: 'Was anything wrong with the Henley?', a: 'The pre-shift check was clean. Brakes and hydraulics are fine.', facts: ['C28'] },
    { type: 'open', q: 'Have trailers with stanchions ever been considered?', a: 'Some haulier trailers have headboard uprights. Side stanchions on flat decks have never been specified.', facts: ['C02'] }
  ] },
  patel: { setting: 'Phone call, then a visit on day 2.', max: 5, qs: [
    { type: 'open', q: 'Tell me about Lucas and this trip.', a: 'He\'s experienced, twelve years with us. He loaded at Metro at about ten and it\'s about 40 km. No report of a problem on the road.', facts: ['E01', 'E02'] },
    { type: 'probe', q: 'How do your drivers secure a billet load?', a: 'Dunnage between the layers and straps over each stack. Metro places the dunnage. That trailer has no stanchions.', facts: ['C01', 'C02', 'C03'] },
    { type: 'probe', q: 'What do your drivers do at a customer\'s site?', a: 'They untie and help with the dunnage. Steel Inc. never told us the drivers mustn\'t.', facts: ['C19', 'C20'] },
    { type: 'open', q: 'How are the drivers paid?', a: 'A basic wage plus a trip bonus.', facts: ['C06'] },
    { type: 'open', q: 'Has a load shifted on this route before?', a: 'Billets have come off on the road. Two years ago one fell on the highway. Braking, traffic lights, the bridge…', facts: ['C05', 'E03'], presumptiveFacts: ['E03'] },
    { type: 'leading', q: 'Lucas should have known not to go to the far side, shouldn\'t he?', a: 'Don\'t put this on my driver. Your people never told him anything.', facts: [], breaks: true, coach: 'Leading and blaming at once. The contractor closes ranks.' }
  ] },
  crew: { setting: 'Canteen, three operators from the other shifts.', max: 4, qs: [
    { type: 'open', q: 'Tell us about the billet offloads you do.', a: 'Shifted loads come every week. We lift the end and put wood in. The drivers help. Billets have fallen a few times, onto the ground only.', facts: ['C23', 'C19'] },
    { type: 'probe', q: 'What makes the job difficult?', a: 'The Henley\'s forks are too fat for the dunnage. Waiting for the Hyster takes long. When it rains the steel slides.', facts: ['C12', 'C11', 'C08'] },
    { type: 'open', q: 'Who showed you how to do it?', a: 'The older guys. There\'s no written way.', facts: ['C15', 'C16'] },
    { type: 'blame', q: 'Who here has dropped billets and not reported it?', a: '(Silence. One shrugs.) We don\'t know about that.', facts: [], breaks: true, coach: 'You just taught the group that honesty gets punished.' }
  ] },
  mokoena: { setting: 'Hospital ward, high care. The nurse allows ten minutes.', max: 3, qs: [
    { type: 'open', q: 'Can you tell me in your own words what happened?', a: 'The forklift lifted the back. I saw a gap open, so I took a block and pushed it in at the front from my side, to help. Then I heard the steel moving… then I was on the ground.', facts: ['E10', 'E13', 'E14'] },
    { type: 'probe', q: 'Did you hear or see the operator signalling?', a: 'I heard a hoot. I thought he meant it\'s OK. I couldn\'t see him.', facts: ['C22', 'E12'] },
    { type: 'open', q: 'What are you normally told to do at Steel Inc.?', a: 'Nobody tells us anything. I untie, I help. I\'ve done it many times.', facts: ['C20', 'C19'] },
    { type: 'closed', q: 'Were you wearing your hard hat?', a: 'No. It was in the truck. It was raining, so I wore my cap.', facts: ['C21'] },
    { type: 'open', q: 'How was the load on the road?', a: 'Fine. I checked the straps at Metro. Maybe a bump on the bridge… I don\'t know when it moved.', facts: ['E03', 'C01'], presumptiveFacts: ['E03'] }
  ] }
};
GAME.qtypes = {
  open: { label: 'Open', tip: 'Invites a free account. Best for discovering facts.' },
  probe: { label: 'Probing', tip: 'Follows up on a specific point without suggesting the answer.' },
  closed: { label: 'Closed', tip: 'Yes/no. Good for confirming a detail, weak for discovery.' },
  leading: { label: 'Leading', tip: 'Suggests the answer. Contaminates the account.' },
  blame: { label: 'Blaming', tip: 'Puts the person on the defensive. Damages rapport.' }
};

/* ---------- 5-Why chains ------------------------------------------- */
/* each level: options; ok:true options need facts (all) to count as supported */
GAME.whys = [
  { id: 'w_fall', title: 'Why was the driver struck by the billet?', levels: [
    { q: 'Why was the driver struck?', opts: [
      { t: 'A billet slid off the far side of the lifted stack while he was there, out of the operator\'s sight', ok: true, needs: ['E10', 'E13'] },
      { t: 'He was careless', ok: false, fb: 'A judgement, not a cause, and it has no evidence behind it. ICAM looks for what made the action make sense.' },
      { t: 'The forklift malfunctioned', ok: false, fb: 'The pre-shift check and the load test show the Henley was serviceable.', contra: ['C28', 'C29'] } ] },
    { q: 'Why was the stack being lifted with a person on the far side?', opts: [
      { t: 'The operator improvised a lift to re-insert dunnage under a shifted load, with no agreement on who does what or where the driver stands', ok: true, needs: ['E08', 'C22'] },
      { t: 'The driver disobeyed the instruction to stay in his cab', ok: false, fb: 'Partly true (IT12), but the rules also told him to untie his load. Go deeper than the violation.' },
      { t: 'The hooter was not loud enough', ok: false, fb: 'There is no evidence for that. The driver heard the hoot but misread it, which is a communication issue.' } ] },
    { q: 'Why did he improvise instead of stopping and calling the supervisor?', opts: [
      { t: 'Shifted loads were treated as routine, and there was no written procedure for abnormal loads', ok: true, needs: ['C18', 'C16'] },
      { t: 'He did not care about the rules', ok: false, fb: 'Blame. The evidence says he did what everyone did.' } ] },
    { q: 'Why was a shifted load seen as normal?', opts: [
      { t: 'Billets had fallen before without injury, were never reported, and offloading was never risk-assessed', ok: true, needs: ['C23', 'C17'] },
      { t: 'Operators are poorly educated', ok: false, fb: 'Not evidenced, and it misses the system.' } ] },
    { q: 'Why was this never picked up by the organisation?', opts: [
      { t: 'Risk management was new and focused on molten metal and cranes, with no process for high-consequence, low-probability risks', ok: true, needs: ['C24'], root: true },
      { t: 'Bad luck: it was always going to happen eventually', ok: false, fb: 'Fatalism is not a finding.' } ] }
  ] },
  { id: 'w_fork', title: 'Why was an unsuitable forklift used?', levels: [
    { q: 'Why was the Henley used for billets?', opts: [
      { t: 'The Hyster, which is better suited, was on standby for the Meltshop', ok: true, needs: ['C11'] },
      { t: 'The operator preferred the Henley', ok: false, fb: 'The allocation board shows the choice was made for him.' } ] },
    { q: 'Why was there no other suitable machine?', opts: [
      { t: 'The fleet is old and short; replacements are on order or in capex', ok: true, needs: ['C25'] },
      { t: 'The maintenance department was slow', ok: false, fb: 'There is no evidence of a maintenance delay; the machines were serviceable.' } ] },
    { q: 'Why did nobody stop to assess the change of equipment?', opts: [
      { t: 'There is no management-of-change process, and the operator\'s certificate (3 t) was never matched against the machine (8 t)', ok: true, needs: ['C27', 'C14'], root: true },
      { t: 'The supervisor was negligent', ok: false, fb: 'Blame. Nothing in the system asked anyone to check.' } ] }
  ] },
  { id: 'w_driver', title: 'Why was the truck driver out of his cab beside the load?', levels: [
    { q: 'Why was he out of his cab?', opts: [
      { t: 'He has to release the straps, and drivers usually help with dunnage', ok: true, needs: ['E05', 'C19'] },
      { t: 'He wanted to stretch his legs', ok: false, fb: 'Speculation.' } ] },
    { q: 'Why is helping expected when the gate rule says stay in the cab?', opts: [
      { t: 'The rules conflict, drivers are not inducted, and the per-load payment rewards fast turnaround', ok: true, needs: ['C19', 'C20', 'C06'] },
      { t: 'Truck drivers ignore rules', ok: false, fb: 'A stereotype, not evidence.' } ] },
    { q: 'Why was this not controlled?', opts: [
      { t: 'Contractor management covered only price and logistics: no securing standard, no induction, no rules for drivers on site', ok: true, needs: ['C04', 'C20'], root: true },
      { t: 'The haulier is a bad company', ok: false, fb: 'The client sets the requirements on its own site.' } ] }
  ] }
];

/* ---------- ICAM code list ------------------------------------------ */
GAME.icamCodes = {
  DF: { name: 'Absent / failed defences', codes: { DF1: 'Detection systems / procedures', DF2: 'Protection systems / procedures', DF3: 'Warning systems', DF4: 'Guards or barriers', DF5: 'Recovery systems', DF6: 'Escape systems', DF7: 'Rescue systems', DF8: 'PPE', DF9: 'Hazard identification', DF10: 'Risk management', DF11: 'Safe work procedure', DF12: 'Supervision', DF13: 'Dunnage', DF14: 'Access control' } },
  IT: { name: 'Individual / team actions', codes: { IT1: 'Supervision (not called)', IT2: 'Authority', IT3: 'Operating speed', IT4: 'Equipment use', IT5: 'PPE use', IT6: 'Work procedure followed', IT7: 'Equipment / material handling', IT8: 'Safety compliance', IT9: 'Instructions given', IT10: 'Training for task', IT11: 'Experience for task', IT12: 'Misconduct / violation', IT13: 'Communication' } },
  TC: { name: 'Task / environmental conditions', codes: { WF2: 'Weather', WF6: 'Surface gradient / conditions', WF7: 'Workspace access / visibility', WF9: 'Tools / equipment availability', WF10: 'Task planning / preparation', WF11: 'Routine / non-routine task', WF12: 'Abnormal operational condition', WF13: 'Risk perception', HF1: 'Complacency', HF5: 'Time pressure', HF3: 'Familiarity with task' } },
  OF: { name: 'Organisational factors', codes: { HW: 'Hardware', TR: 'Training', OR: 'Organisation', CO: 'Communication', IG: 'Incompatible goals', PR: 'Procedures', MM: 'Maintenance management', DE: 'Design', RM: 'Risk management', MC: 'Management of change', CM: 'Contractor management' } }
};
GAME.codeLevel = c => c === 'NONE' ? 'NONE' : /^DF/.test(c) ? 'DF' : /^IT/.test(c) ? 'IT' : /^(WF|HF)/.test(c) ? 'TC' : 'OF';

/* ---------- root causes & actions ---------------------------------- */
GAME.rootOptions = [
  { id: 'r1', t: 'The risk management system was immature: billet offloading was never risk-assessed, and high-consequence, low-probability (fatal) risks were not identified or prioritised.', score: 2, of: ['RM', 'PR'] },
  { id: 'r2', t: 'Repeated falls of billets were never reported because nobody was hurt, so the hazard became normal and nobody learned from it.', score: 2, of: ['CO'] },
  { id: 'r3', t: 'Contractor management covered only price and logistics: no load-securing standard, no driver induction, and conflicting rules for drivers on site.', score: 2, of: ['CM'] },
  { id: 'r4', t: 'Abnormal conditions (a shifted load, a substitute forklift) were never treated as a change that needed managing.', score: 1, of: ['MC'] },
  { id: 'r5', t: 'The forklift fleet was too small to keep the suitable machine available for billet offloading.', score: 1, of: ['HW'] },
  { id: 'd1', t: 'The truck driver ignored the rule to stay in his cab.', score: -1, fb: 'An individual action (IT12), not a root cause, and the rules conflicted.' },
  { id: 'd2', t: 'The forklift operator was careless.', score: -2, fb: 'Blame. The evidence shows he followed the established practice.' },
  { id: 'd3', t: 'The truck driver did not wear a hard hat.', score: -1, fb: 'A failed defence (DF8), but a hard hat cannot stop an 800 kg billet, and it is not a root cause.' },
  { id: 'd4', t: 'It was raining.', score: -1, fb: 'A workplace condition (WF2), not a root cause.' }
];
GAME.actionOptions = [
  { id: 'a1', hoc: 'Engineering', t: 'Assess side stanchions or uprights on billet trailers, and specify them in the haulage contract if the risk assessment supports it.', covers: ['DF4', 'CM'], good: true },
  { id: 'a2', hoc: 'Substitution', t: 'Dedicate a suitable thin-fork forklift (or a billet clamp attachment) to offloading, and finish the fleet replacement by April 2009.', covers: ['HW', 'WF9', 'DF13'], good: true },
  { id: 'a3', hoc: 'Isolation', t: 'Mark a driver waiting bay in the operator\'s view, and allow no person on the far side or within 3 m of a load while it is lifted.', covers: ['DF4', 'DF14', 'OR'], good: true },
  { id: 'a4', hoc: 'Administrative', t: 'Write an abnormal-load procedure: define a "normal" load; for anything else stop, call the supervisor, and agree a method or reject the load.', covers: ['DF1', 'DF11', 'MC', 'PR'], good: true },
  { id: 'a5', hoc: 'Administrative', t: 'Contractor management: put loading and securing standards in supply and haulage contracts, induct drivers, and resolve the conflicting rule about untying loads.', covers: ['CM', 'DF2', 'DF14'], good: true },
  { id: 'a6', hoc: 'Administrative', t: 'Review all material-handling risk assessments with a fatal-risk screen, and train supervisors in high-risk assessment.', covers: ['RM', 'PR', 'DF9'], good: true },
  { id: 'a7', hoc: 'Administrative', t: 'Run an incident-reporting drive: report every falling load and near miss, and give feedback to the workforce.', covers: ['CO'], good: true },
  { id: 'a8', hoc: 'Administrative', t: 'Audit licences against machine capacity, re-certify operators at the higher capacity, and control access to forklift keys.', covers: ['TR'], good: true },
  { id: 'a9', hoc: 'Administrative', t: 'Approve and implement a yard traffic management plan that separates vehicles and pedestrians.', covers: ['OR'], good: true },
  { id: 'a10', hoc: 'PPE', t: 'Enforce PPE rules for everyone on site, including hauliers.', covers: ['DF8'], good: true, weak: true },
  { id: 'w1', hoc: 'Discipline', t: 'Give the forklift operator a final written warning.', covers: [], good: false, fb: 'Punishes the person and leaves every system failure in place. Others will stop reporting.' },
  { id: 'w2', hoc: 'Awareness', t: 'Remind truck drivers to be careful around billets.', covers: [], good: false, fb: 'A weak, unmeasurable action that does not change the system.' },
  { id: 'w3', hoc: 'Awareness', t: 'Put up a "Beware of falling billets" poster in the yard.', covers: [], good: false, fb: 'This is the lowest level of control. A poster cannot stop a billet.' },
  { id: 'w4', hoc: 'Administrative', t: 'Ban all offloading when it rains.', covers: ['WF2'], good: false, fb: 'Impractical in a Cape winter. It treats a condition rather than the cause.' }
];
GAME.hocRank = { Elimination: 5, Substitution: 4, Engineering: 4, Isolation: 3, Administrative: 2, PPE: 1, Awareness: 0, Discipline: 0 };

/* ---------- model answer (debrief) ------------------------------------ */
GAME.model = {
  rootCause: 'Steel Inc.\'s risk management system was in its infancy. Not all high-risk activities had been identified, so loading and offloading billets with forklifts was not seen as a high-risk task. The immature SHERQ system had not yet ensured that high-potential incidents, including falling billets, were reported, that controls for high-risk tasks were formalised, or that offloading was strictly controlled. Under these circumstances the truck driver and the forklift operator relied on their experience and on informally developed methods for handling the shifted load. These did not address all the risks: billets that could slip and fall, an unsuitable forklift doing a task it was not suited to, and the driver\'s position when inserting dunnage. These failures, together with a billet falling while the driver stood in an unsafe position, led to a serious injury that could have been fatal.',
  learnings: [
    'Set clear limits for what counts as normal operation. Outside those limits, stop and escalate.',
    'Match every operator\'s certification to the capacity of the machines they actually drive, and control access to those machines.',
    'Every change carries risk, even a subtle one such as a shifted load or a substitute forklift. Manage it.',
    'A silent incident register is not evidence of safety. Unreported "no-injury" events can hide a fatal risk.',
    'Training records and documents must reflect real practice. Check that a document was in force on the day.'
  ]
};

if (typeof module !== 'undefined') module.exports = GAME;
