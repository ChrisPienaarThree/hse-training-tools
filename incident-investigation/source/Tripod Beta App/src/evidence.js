/* Tripod Beta Investigator — evidence plan.
   The investigator's free-text account (with assumptions and early conclusions) becomes an evidence collection
   checklist, a photography schedule and a list of statements to test. Claude writes the plan in the artifact;
   offline, a rule-based starter plan or a copy/paste round trip to Claude does the same job. Also writes the .xlsx. */
var TBE = (function () {
  'use strict';
  const CATS = [
    ['position', 'Position (scene)'], ['people', 'People'], ['parts', 'Parts (equipment, materials)'],
    ['paper', 'Paper (documents, records)'], ['electronic', 'Electronic data']
  ];
  const CAT_NAME = Object.fromEntries(CATS);
  const PRIORITY = ['Urgent', 'High', 'Normal'];
  const METHODS = ['Preserve', 'Collect', 'Photograph', 'Measure', 'Interview', 'Request copy', 'Download', 'Test / analyse', 'Observe'];
  const ITEM_STATUS = ['To collect', 'Collected', 'Not available', 'Not needed'];
  const VIEWS = ['Overview', 'Mid-range', 'Close-up', 'Detail with scale', 'Elevated / aerial'];
  const KINDS = ['Assumption', 'Conclusion', 'Open question'];
  const TEST_STATUS = ['Untested', 'Supported', 'Refuted', 'Inconclusive'];
  const PHOTO_TIPS = [
    'Photograph before anything is moved; if something must be moved for safety, photograph it first and record who moved it.',
    'Work from the outside in: overview from all sides, then mid-range, then close-ups of each item.',
    'Put a scale (ruler or tape) and a photo ID card in every close-up; take a second close-up without them.',
    'Keep the date and time setting correct on the camera or phone; note the time of the first photo.',
    'Log every photo: number, subject, camera position and direction. Never delete or edit originals; work on copies.',
    'Mark camera positions on the scene sketch, with a north arrow.'
  ];

  const uid = p => (p || '') + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 600);
  const pick = (v, list, dflt) => { const s = str(v, 60).toLowerCase(); return list.find(x => x.toLowerCase() === s) || list.find(x => s && x.toLowerCase().startsWith(s.split(/[\s/]/)[0])) || dflt; };
  const catKey = v => { const s = str(v, 60).toLowerCase(); const k = CATS.find(([k, n]) => s === k || s === n.toLowerCase() || s.startsWith(k) || n.toLowerCase().startsWith(s)); return k ? k[0] : (/(record|document|procedure|permit|training)/.test(s) ? 'paper' : /(cctv|data|log|electronic)/.test(s) ? 'electronic' : /(witness|interview|person)/.test(s) ? 'people' : /(equipment|tool|material|part)/.test(s) ? 'parts' : 'position'); };

  function blank() { return { narrative: '', useTree: true, notes: '', source: '', generatedAt: '', items: [], photos: [], tests: [] }; }
  const mkItem = o => ({ id: uid('ev'), cat: catKey(o.cat), item: str(o.item, 400), source: str(o.source, 300), purpose: str(o.purpose, 400), priority: pick(o.priority, PRIORITY, 'Normal'), method: pick(o.method, METHODS, 'Collect'), owner: str(o.owner, 80), due: str(o.due, 10), status: pick(o.status, ITEM_STATUS, 'To collect'), ref: str(o.ref, 60), notes: str(o.notes, 400) });
  const mkPhoto = o => ({ id: uid('ph'), subject: str(o.subject, 300), position: str(o.position, 300), view: pick(o.view, VIEWS, 'Overview'), purpose: str(o.purpose, 400), taken: !!o.taken, ref: str(o.ref, 60), notes: str(o.notes, 300) });
  const mkTest = o => ({ id: uid('as'), statement: str(o.statement, 500), kind: pick(o.kind, KINDS, 'Assumption'), evidence: str(o.evidence, 500), status: pick(o.status, TEST_STATUS, 'Untested'), node: str(o.node, 40) });

  function normalise(e) {
    const b = Object.assign(blank(), e || {});
    b.items = (Array.isArray(b.items) ? b.items : []).filter(x => x && x.item).map(x => Object.assign(mkItem(x), x.id ? { id: x.id } : {}));
    b.photos = (Array.isArray(b.photos) ? b.photos : []).filter(x => x && x.subject).map(x => Object.assign(mkPhoto(x), x.id ? { id: x.id } : {}));
    b.tests = (Array.isArray(b.tests) ? b.tests : []).filter(x => x && x.statement).map(x => Object.assign(mkTest(x), x.id ? { id: x.id } : {}));
    b.useTree = b.useTree !== false;
    return b;
  }

  /* ---------- what Claude reads ------------------------------------------- */
  function treeLines(c, names) {
    const order = ['event', 'agent', 'object', 'failed', 'missing', 'inadequate', 'effective', 'ic', 'pc', 'uc'];
    return (c.nodes || []).filter(n => n.label).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)).slice(0, 80)
      .map(n => `- [${n.id}] ${names(n.type)}: ${str(n.label, 200)}${n.verified === false ? ' (ASSUMED, not yet confirmed)' : ''}${n.evidence ? ' | evidence so far: ' + str(n.evidence, 160) : ''}`);
  }
  function prompt(c, narrative, names) {
    const m = c.meta || {}, E = c.evidence || {};
    const tree = E.useTree !== false ? treeLines(c, names || (t => t)) : [];
    return [
      'You are an experienced workplace incident investigator who uses the Tripod Beta method. Write the evidence collection plan for the investigation below.',
      '',
      'INCIDENT',
      `Title: ${str(m.title, 200)}`, `Date and time: ${str(m.date, 20)} ${str(m.time, 20)}`, `Location: ${str(m.location, 200)}${m.site ? ', ' + str(m.site, 120) : ''}`,
      `Loss category: ${str(m.incidentType, 60)}`, m.description ? `Initial report: ${str(m.description, 2500)}` : '',
      '',
      "INVESTIGATOR'S ACCOUNT (may include assumptions and early conclusions; treat them as things to test, not facts)",
      String(narrative || '').slice(0, 12000),
      tree.length ? '\nTRIPOD TREE SO FAR (element id in brackets)\n' + tree.join('\n') : '',
      '',
      'WHAT TO PRODUCE',
      '1. items: the evidence to collect, specific to THIS incident (name the actual equipment, documents, people roles and places mentioned). Group by category: position (the scene: positions, conditions, measurements), people (interviews, statements, roles), parts (equipment, tools, materials, PPE, samples), paper (procedures, permits, risk assessments, training, maintenance and inspection records, rosters), electronic (CCTV, telemetry, PLC/alarm logs, access control, phone and radio records). Mark perishable evidence priority "Urgent" (scene conditions, witness memory, CCTV that overwrites, weather, anything that will be repaired, cleaned or moved). Say where to find each item and why it matters (which question or assumption it tests). 15 to 40 items.',
      '2. photos: a photography schedule in shooting order: overview shots from all sides first, then mid-range, then close-ups and details with a scale. Name the subject, the camera position and what the photo must show. 10 to 30 photos.',
      '3. tests: every assumption, conclusion or uncertain point in the account, and every ASSUMED tree element, as a statement to test, with the evidence that would confirm or refute it. Use kind "Assumption", "Conclusion" or "Open question". For a tree element put its id in "node". Up to 20.',
      '4. notes: 2 to 4 sentences of practical advice on preserving the scene and the order of collection for this incident.',
      'Do not invent facts that are not in the information above; where something is unknown, say what to find out.',
      '',
      'Reply with only this JSON object:',
      '{"items":[{"cat":"position|people|parts|paper|electronic","item":"...","source":"where or from whom","purpose":"why / what it tests","priority":"Urgent|High|Normal","method":"Preserve|Collect|Photograph|Measure|Interview|Request copy|Download|Test / analyse|Observe"}],',
      ' "photos":[{"subject":"...","position":"camera position / direction","view":"Overview|Mid-range|Close-up|Detail with scale|Elevated / aerial","purpose":"what it must show"}],',
      ' "tests":[{"statement":"...","kind":"Assumption|Conclusion|Open question","evidence":"evidence that would confirm or refute it","node":"tree element id or empty"}],',
      ' "notes":"..."}'
    ].filter(x => x !== '').join('\n');
  }

  /* Claude's reply (already parsed JSON, or raw text) -> plan parts */
  function parseText(t) {
    let s = String(t || '').trim();
    const f = s.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) s = f[1].trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('No JSON object found in the answer.');
    return JSON.parse(s.slice(a, b + 1));
  }
  function fromAnswer(o, nodeIds) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('The answer is not a plan object.');
    const ids = new Set(nodeIds || []);
    const items = (Array.isArray(o.items) ? o.items : []).filter(x => x && x.item).slice(0, 80).map(mkItem);
    const photos = (Array.isArray(o.photos) ? o.photos : []).filter(x => x && x.subject).slice(0, 60).map(mkPhoto);
    const tests = (Array.isArray(o.tests) ? o.tests : []).filter(x => x && x.statement).slice(0, 40).map(x => { const t = mkTest(x); if (!ids.has(t.node)) t.node = ''; return t; });
    if (!items.length && !photos.length && !tests.length) throw new Error('The answer holds no checklist items, photos or tests.');
    return { items, photos, tests, notes: str(o.notes, 1200) };
  }

  /* ---------- draft Tripod tree ---------------------------------------------- */
  /* C = TBC content (BRF and error-type codes). The draft is a hypothesis: every element is marked assumed. */
  function treePrompt(c, narrative, C) {
    const m = c.meta || {}, E = c.evidence || {};
    const tested = (E.tests || []).filter(t => t.statement).slice(0, 30).map(t => `- ${t.status}: ${str(t.statement, 200)}`);
    const got = (E.items || []).filter(x => x.status === 'Collected').slice(0, 30).map(x => `- ${str(x.item, 160)}${x.notes ? ' (' + str(x.notes, 120) + ')' : ''}`);
    return [
      'You are an experienced Tripod Beta practitioner. Draft a first Tripod Beta tree for the incident below, using the current Tripod Beta User Guide terms. This is an early hypothesis to be tested with evidence, so include plausible theoretical causes where the facts are not yet known, but keep every element specific to this incident.',
      '',
      'INCIDENT',
      `Title: ${str(m.title, 200)}`, `Date and time: ${str(m.date, 20)} ${str(m.time, 20)}`, `Location: ${str(m.location, 200)}`, `Loss category: ${str(m.incidentType, 60)}`,
      m.description ? `Initial report: ${str(m.description, 2500)}` : '',
      '',
      "INVESTIGATOR'S ACCOUNT",
      String(narrative || '').slice(0, 12000),
      tested.length ? '\nSTATEMENTS ALREADY TESTED\n' + tested.join('\n') : '',
      got.length ? '\nEVIDENCE ALREADY COLLECTED\n' + got.join('\n') : '',
      '',
      'TRIPOD BETA RULES',
      '- A trio is an Agent of Change acting on an Object to produce an Event. Give 2 to 5 trios in time order; the last trio is the main event (the injury, damage or loss).',
      '- An earlier Event can be the Agent or the Object of the next trio: set "agentFrom":"previous" or "objectFrom":"previous" on the later trio instead of naming a new agent/object.',
      '- Barriers sit on the agent-side or object-side trajectory. Types: failed (existed but failed), missing (should have existed), inadequate (existed but could never have worked), effective (worked; makes it a potential event). Describe barriers specifically (the actual control or procedure step, not "PPE" or "training").',
      '- Every failed barrier has exactly one Immediate Cause (ic): the act or condition that defeated it. act "act" (human act, give errorType) or "condition" (technical, no errorType).',
      '- Each Immediate Cause has 1 to 3 Preconditions (the situation that made the act likely or acceptable). scope "org" needs at least one Underlying Cause; scope "external" only for natural or outside factors beyond the company.',
      '- Underlying Causes are organisational weaknesses; give each a Basic Risk Factor code. Missing and inadequate barriers link straight to 1 to 3 Underlying Causes (no ic). Reuse the same Underlying Cause wording where one cause drives several preconditions.',
      'BRF codes: ' + C.BRF.map(b => b.code + ' ' + b.name).join(', '),
      'errorType codes: ' + C.ERRORS.map(e => e.code + ' (' + e.name + ')').join(', '),
      '',
      'Reply with only this JSON object:',
      '{"trios":[{"event":"...","agent":"...","object":"...","agentFrom":"","objectFrom":"",',
      '  "barriers":[{"side":"agent|object","type":"failed|missing|inadequate|effective","label":"...",',
      '    "ic":{"label":"...","act":"act|condition","errorType":"code"},',
      '    "preconditions":[{"label":"...","scope":"org|external","ucs":[{"label":"...","brf":"CODE"}]}],',
      '    "ucs":[{"label":"...","brf":"CODE"}]}]}],',
      ' "notes":"2 to 4 sentences: which parts of the draft are weakest and what evidence would settle them"}',
      '"ic" and "preconditions" only on failed barriers; "ucs" only on missing or inadequate barriers.'
    ].filter(x => x !== '').join('\n');
  }
  function treeFromAnswer(o, C) {
    if (!o || !Array.isArray(o.trios) || !o.trios.length) throw new Error('The answer holds no trios.');
    const BRFS = C.BRF.map(b => b.code), ERRS = C.ERRORS.map(e => e.code);
    const NOTE = 'Draft: a possible cause, not yet confirmed. Test it with evidence before relying on it.';
    const nodes = [], edges = [], ucs = {};
    const mk = (type, label, extra) => { const n = Object.assign({ id: uid('d'), type, label: str(label, 220) || '(describe)', notes: NOTE, evidence: '', verified: false, x: 0, y: 0 }, extra || {}); nodes.push(n); return n; };
    const link = (a, b) => { if (!edges.some(e => e.from === a.id && e.to === b.id)) edges.push({ id: uid('x'), from: a.id, to: b.id }); };
    const ucNode = u => { const key = str(u && u.label, 220).toLowerCase(); if (!key) return null; if (!ucs[key]) { const code = str(u.brf, 4).toUpperCase(); ucs[key] = mk('uc', u.label, { brf: BRFS.indexOf(code) >= 0 ? code : '' }); } return ucs[key]; };
    const prev = v => /^prev/i.test(str(v, 20));
    const T = o.trios.filter(t => t && t.event).slice(0, 6);
    if (!T.length) throw new Error('The answer holds no trios with an event.');
    const evs = T.map((t, i) => {
      const nx = T[i + 1], last = i === T.length - 1;
      const type = last ? 'event' : nx && prev(nx.agentFrom) ? 'eventAgent' : nx && prev(nx.objectFrom) ? 'eventObject' : 'event';
      return mk(type, t.event, last ? { mainEvent: true } : {});
    });
    T.forEach((t, i) => {
      const ev = evs[i], before = evs[i - 1];
      const ag = i && prev(t.agentFrom) && before.type === 'eventAgent' ? before : mk('agent', t.agent);
      const ob = i && prev(t.objectFrom) && before.type === 'eventObject' ? before : mk('object', t.object);
      const chain = { agent: [], object: [] };
      (Array.isArray(t.barriers) ? t.barriers : []).filter(b => b && b.label).slice(0, 8).forEach(b => {
        const ty = str(b.type, 20).toLowerCase(), type = ['failed', 'missing', 'inadequate', 'effective'].indexOf(ty) >= 0 ? ty : 'failed';
        const bn = mk(type, b.label); chain[/obj/i.test(str(b.side, 20)) ? 'object' : 'agent'].push(bn);
        if (type === 'failed') {
          const i0 = b.ic || {}, act = /cond/i.test(str(i0.act, 20)) ? 'condition' : 'act';
          const ic = mk('ic', i0.label || 'Immediate Cause still to be established', { act, errorType: act === 'act' && ERRS.indexOf(str(i0.errorType, 30)) >= 0 ? str(i0.errorType, 30) : '', justification: '' });
          link(ic, bn);
          (Array.isArray(b.preconditions) ? b.preconditions : []).filter(p => p && p.label).slice(0, 4).forEach(p => {
            const pc = mk('pc', p.label, { scope: /ext|nat/i.test(str(p.scope, 20)) ? 'external' : 'org' }); link(pc, ic);
            (Array.isArray(p.ucs) ? p.ucs : []).slice(0, 3).map(ucNode).filter(Boolean).forEach(u => link(u, pc));
          });
        } else if (type !== 'effective') {
          (Array.isArray(b.ucs) ? b.ucs : []).slice(0, 4).map(ucNode).filter(Boolean).forEach(u => link(u, bn));
        }
      });
      [['agent', ag], ['object', ob]].forEach(([side, src]) => { let p = src; chain[side].forEach(b => { link(p, b); p = b; }); link(p, ev); });
    });
    return { nodes, edges, notes: str(o.notes, 1200) };
  }

  /* ---------- offline starter plan ------------------------------------------ */
  const BASE = {
    items: [
      ['position', 'Scene as found: barricade and keep it undisturbed until the investigation lead releases it', 'Incident scene', 'Positions and conditions change quickly once work resumes', 'Urgent', 'Preserve'],
      ['position', 'Measured sketch of the scene: positions of people, equipment, materials and distances, with a north arrow', 'Incident scene', 'Fixes the layout for the timeline and the tree', 'Urgent', 'Measure'],
      ['position', 'Conditions at the time: lighting, weather, noise, housekeeping, floor or ground surface', 'Incident scene; shift log', 'Tests whether conditions contributed (Preconditions)', 'Urgent', 'Observe'],
      ['people', 'List of everyone involved, witnesses and first responders, with contact details and shift', 'Supervisor; access records', 'Nobody is missed for interview', 'Urgent', 'Collect'],
      ['people', 'Interview the injured or involved person(s) individually, as soon as they are fit', 'Involved persons', 'First-hand account of the sequence and their understanding of the task', 'Urgent', 'Interview'],
      ['people', 'Interview witnesses separately, before they compare accounts', 'Witnesses', 'Independent accounts of what happened', 'Urgent', 'Interview'],
      ['people', 'Interview the supervisor: how the task was planned, instructed and supervised', 'Supervisor on duty', 'Tests planning, instructions and supervision (Underlying Causes)', 'High', 'Interview'],
      ['people', 'First-aid, medical and emergency response records', 'Clinic; first aider; emergency team', 'Confirms injury, time line and response', 'High', 'Request copy'],
      ['parts', 'Equipment, tools and materials involved: quarantine, tag and record make, model and serial or asset numbers', 'Incident scene; workshop', 'Physical evidence of condition and failure', 'Urgent', 'Preserve'],
      ['parts', 'PPE worn by the people involved: retain it and record its condition', 'Involved persons; clinic', 'Tests whether PPE was worn, suitable and in good condition', 'High', 'Collect'],
      ['paper', 'Risk assessment / JSA / HIRA for the task', 'SHE office; work pack', 'Was the hazard identified and controlled?', 'High', 'Request copy'],
      ['paper', 'Work permit, authorisation and isolation records for the task', 'Permit office; control room', 'Tests whether the permit and isolation barriers were in place', 'High', 'Request copy'],
      ['paper', 'Procedure or work instruction in force at the time (with version and date)', 'Document control', 'Was there a procedure, and was it followed and adequate?', 'High', 'Request copy'],
      ['paper', 'Training, competence and appointment records of the people involved', 'Training department; HR', 'Tests competence (Training BRF)', 'High', 'Request copy'],
      ['paper', 'Inspection and maintenance history of the equipment involved', 'Maintenance system; engineering', 'Tests equipment condition (Hardware / Maintenance BRFs)', 'High', 'Request copy'],
      ['paper', 'Shift roster and hours worked by the people involved (last 7 days)', 'Time and attendance; HR', 'Tests fatigue as a Precondition', 'Normal', 'Request copy'],
      ['paper', 'Previous incidents, near misses and audit findings for this task or area', 'SHE incident database', 'Shows whether the problem was known before', 'Normal', 'Request copy'],
      ['electronic', 'CCTV footage covering the area and the time: secure a copy before it is overwritten', 'Security; control room', 'Independent record of the sequence', 'Urgent', 'Download'],
      ['electronic', 'Access control, radio and phone records around the time of the incident', 'Security; IT; control room', 'Fixes the time line and communications', 'High', 'Download']
    ],
    photos: [
      ['Overview of the scene from the first side (e.g. north)', 'At the edge of the barricaded area, facing the point of the event', 'Overview', 'The whole scene and its surroundings as found'],
      ['Overview of the scene from the opposite side', 'Opposite the first overview', 'Overview', 'The scene from the other direction'],
      ['Overview from the remaining two sides', 'Left and right of the first overview', 'Overview', 'Complete coverage; nothing hidden behind equipment'],
      ['Access route to the point of the event', 'Along the route the people took', 'Mid-range', 'What the people saw on approach; obstructions, signs'],
      ['Point of contact, injury or failure', '1 to 3 m from the point', 'Mid-range', 'Relative positions of people, equipment and materials'],
      ['Point of contact, injury or failure, with scale', 'Close up, square to the surface', 'Detail with scale', 'Marks, damage, residues; with a scale and photo ID card'],
      ['Equipment involved and its ID / rating plate', 'Close up', 'Close-up', 'Make, model, serial or asset number, ratings'],
      ['Controls, guards, isolation points and their state', 'At each control or isolation point', 'Close-up', 'Positions of switches, valves, locks and tags; guards fitted or not'],
      ['Signs, barricades and warnings in the area', 'From where a worker would see them', 'Mid-range', 'Whether warnings were present and visible'],
      ['Housekeeping, floor or ground surface', 'At working height and close to the surface', 'Mid-range', 'Slip/trip hazards, spills, obstructions'],
      ['Lighting and visibility', 'From the worker\'s position, without flash, then with', 'Mid-range', 'Light levels and glare at the time'],
      ['PPE involved', 'Laid out on a neutral background', 'Detail with scale', 'Type and condition of the PPE'],
      ['Anything moved or changed before the investigation team arrived', 'Where it is now, and where it was', 'Mid-range', 'Record the change and who made it']
    ]
  };
  const PACKS = [
    { re: /\b(vehicle|truck|ldv|bakkie|car|bus|forklift|loader|haul|tipper|dump truck|trailer|roll ?over|collision|reversing|driver)\b/i,
      items: [['parts', 'Vehicle involved: quarantine; record tyres, brakes, steering, lights, seat belt and warning devices', 'Vehicle', 'Tests vehicle condition as a Failed Barrier or Precondition', 'Urgent', 'Preserve'],
        ['electronic', 'Vehicle tracking / telemetry / dash camera data (speed, braking, location)', 'Fleet management; tracking provider', 'Fixes speed and manoeuvres before the event', 'Urgent', 'Download'],
        ['paper', 'Driver licence, medical fitness, permit to operate and pre-use inspection checklist', 'HR; fleet office', 'Tests driver competence and fitness', 'High', 'Request copy'],
        ['position', 'Tyre marks, gouges, final positions and road or haul-road condition, with measurements', 'Road / haul road', 'Reconstructs the path and speed', 'Urgent', 'Measure']],
      photos: [['Final position of the vehicle(s)', 'All four sides and elevated if possible', 'Overview', 'Rest positions relative to road edges and objects'], ['Tyre marks and road surface', 'Along the path of travel', 'Detail with scale', 'Length and direction of marks; surface condition'], ['Driver\'s view from the cab', 'Driver\'s seat, at eye height', 'Mid-range', 'Visibility and blind spots']] },
    { re: /\b(conveyor|pulley|conveyor belt|belt conveyor|machine guard|guarding|nip ?point|rotating|machinery|machine|lathe|press|crusher|mill|pump|gearbox)\b/i,
      items: [['parts', 'Machine guards and safety devices: fitted, removed or bypassed; condition of interlocks and pull-wires', 'Machine', 'Tests the guarding barrier', 'Urgent', 'Observe'],
        ['paper', 'Isolation / lockout records: lock register, isolation certificate, test-for-dead', 'Control room; permit office', 'Tests whether energy was isolated and verified', 'Urgent', 'Request copy'],
        ['electronic', 'PLC, SCADA or alarm logs for start/stop and trip events around the time', 'Control system; engineering', 'Fixes when the machine moved', 'Urgent', 'Download']],
      photos: [['Guard positions and openings', 'At the nip point / danger zone', 'Close-up', 'Gaps, missing or opened guards'], ['Isolation points, locks and tags', 'At each isolator', 'Close-up', 'Lock and tag placement and identity']] },
    { re: /\b(isolat|lock ?out|loto|energ|electric|shock|arc|cable|switchgear|substation|live)\b/i,
      items: [['paper', 'Electrical isolation certificate, switching programme and test-for-dead record', 'Electrical control room', 'Tests the isolation barrier', 'Urgent', 'Request copy'],
        ['parts', 'Test instruments used: retain and check calibration', 'Electrician', 'Tests whether the test-for-dead was valid', 'High', 'Collect']],
      photos: [['Switchgear / isolator position and labelling', 'Front of the panel', 'Close-up', 'Switch positions, labels and locks']] },
    { re: /\b(height|fall|fell|ladder|scaffold|roof|platform|harness|lanyard|edge|elevated|cherry ?picker|mewp)\b/i,
      items: [['parts', 'Fall-protection equipment: harness, lanyard, anchor point, ladder or scaffold; retain and tag', 'Scene; equipment store', 'Tests the fall-protection barrier', 'Urgent', 'Preserve'],
        ['paper', 'Scaffold tag / inspection register, fall-protection plan and ladder inspection records', 'Scaffold supervisor; SHE office', 'Tests inspection and planning', 'High', 'Request copy'],
        ['position', 'Height of fall, landing surface and distances, measured', 'Scene', 'Severity and mechanism of the fall', 'Urgent', 'Measure']],
      photos: [['Working position and edge from above', 'From the working platform', 'Mid-range', 'Edge protection and anchor points'], ['Landing area', 'From the working position looking down, and at ground level', 'Overview', 'Height and landing surface']] },
    { re: /\b(chemical|spill|leak|gas|fume|vapour|vapor|acid|caustic|toxic|h2s|ammonia|chlorine|hazchem|exposure)\b/i,
      items: [['parts', 'Samples of the substance involved, in suitable sealed containers, labelled', 'Scene; laboratory', 'Identifies the substance and concentration', 'Urgent', 'Collect'],
        ['paper', 'Safety data sheet (SDS) and the chemical register entry', 'SHE office', 'Hazards and required controls', 'High', 'Request copy'],
        ['electronic', 'Gas detector readings and logs (fixed and portable) around the time', 'Control room; gas detector', 'Measures the exposure', 'Urgent', 'Download']],
      photos: [['Source of the release and extent of the spill', 'Overview and close-up', 'Detail with scale', 'Size, flow direction and the leak point']] },
    { re: /\b(fire|explosion|burn(s|t|ed)?|ignit\w*|flammable|hot work|welding|gas cutting|flare)\b/i,
      items: [['paper', 'Hot work permit, gas test records and fire watch log', 'Permit office', 'Tests the hot-work barriers', 'Urgent', 'Request copy'],
        ['position', 'Burn patterns and the probable point of origin; do not clean up', 'Scene', 'Identifies the ignition source', 'Urgent', 'Preserve']],
      photos: [['Burn patterns from all sides', 'Around the fire area', 'Overview', 'Spread and point of origin'], ['Possible ignition sources', 'Close up', 'Detail with scale', 'Condition of each possible source']] },
    { re: /\b(crane|lifting|rigging|sling|shackle|suspended load|dropped load|load fell|hoist|chain block)\b/i,
      items: [['parts', 'Lifting gear (slings, shackles, hooks): retain and tag, record SWL markings', 'Scene', 'Tests rigging condition and selection', 'Urgent', 'Preserve'],
        ['paper', 'Lift plan, crane load chart, operator and rigger competence, lifting gear inspection register', 'Lifting supervisor', 'Tests planning and competence', 'High', 'Request copy'],
        ['electronic', 'Crane load-moment indicator / data logger records', 'Crane', 'Load and radius at the time', 'Urgent', 'Download']],
      photos: [['Crane set-up and outriggers', 'Around the crane', 'Overview', 'Set-up, ground conditions and radius'], ['Rigging and SWL markings', 'Close up', 'Detail with scale', 'Condition and ratings of each item']] },
    { re: /\b(hand|finger|cut|laceration|knife|grinder|tool|pinch|crush)\b/i,
      items: [['parts', 'The hand tool or power tool involved: condition, guards, and whether it was the right tool', 'Scene; tool store', 'Tests tool selection and condition', 'High', 'Collect']],
      photos: [['Tool involved', 'On a neutral background', 'Detail with scale', 'Condition, guards and markings']] },
    { re: /\b(slip\w*|tripp\w*|trip hazard|stair\w*|walkway|wet floor|oily|floor|uneven)\b/i,
      items: [['position', 'Floor or walkway condition: contamination, wear, level differences; measure them', 'Scene', 'Tests the walking-surface barrier', 'Urgent', 'Measure']],
      photos: [['Walking surface at the point of the slip or trip', 'Low angle and close up', 'Detail with scale', 'Contamination, defects and level differences']] },
    { re: /\b(contractor|sub-?contractor|vendor)\b/i,
      items: [['paper', 'Contractor appointment, induction records and contractor safety file', 'Contractor management office', 'Tests contractor management (Organisation BRF)', 'High', 'Request copy']] },
    { re: /\b(night|fatigue|tired|overtime|long shift|sleep)\b/i,
      items: [['paper', 'Hours of work and rest for the 14 days before the event', 'Time and attendance', 'Tests fatigue as a Precondition', 'High', 'Request copy']] },
    { re: /\b(alcohol|drug|substance|intoxicat|breathalys)\b/i,
      items: [['paper', 'Alcohol and drug test results taken after the event (with time of test)', 'Clinic; security', 'Tests impairment as a Precondition', 'Urgent', 'Request copy']] },
    { re: /\b(rain|wind|storm|weather|heat|cold|lightning|dust|visibility|fog)\b/i,
      items: [['electronic', 'Weather data for the time and place (site station or weather service)', 'Site weather station; weather service', 'Tests weather as a Precondition', 'High', 'Download']] },
    { re: /\b(radio|communicat|instruction|handover|toolbox|briefing|misunderst)\b/i,
      items: [['paper', 'Shift handover notes, toolbox talk record and instructions given for the task', 'Supervisor; shift log', 'Tests communication (Communication BRF)', 'High', 'Request copy']] }
  ];
  const TEST_RE = /\b(assum\w*|believe\w*|probabl\w*|likely|seem\w*|appear\w*|i think|we think|possibl\w*|suspect\w*|might|may have|could have|concluded?|conclusion|therefore|caused by|because|due to|unclear|not sure|unknown)\b/i;
  const ASSUME_RE = /\b(assum\w*|believe\w*|probabl\w*|likely|seem\w*|appear\w*|i think|we think|possibl\w*|suspect\w*|might|may have|could have)\b/i;
  const CONC_RE = /\b(conclu\w*|therefore|caused by|because|due to|the cause)\b/i, OPEN_RE = /\?|\b(unclear|not sure|unknown|whether)\b/i;

  function starter(c, narrative, names) {
    const text = [narrative, (c.meta || {}).description, (c.meta || {}).title, (c.nodes || []).map(n => n.label).join(' ')].join(' ');
    const items = BASE.items.map(r => mkItem({ cat: r[0], item: r[1], source: r[2], purpose: r[3], priority: r[4], method: r[5] }));
    const photos = BASE.photos.map(r => mkPhoto({ subject: r[0], position: r[1], view: r[2], purpose: r[3] }));
    const hit = PACKS.filter(p => p.re.test(text));
    hit.forEach(p => {
      (p.items || []).forEach(r => items.push(mkItem({ cat: r[0], item: r[1], source: r[2], purpose: r[3], priority: r[4], method: r[5] })));
      (p.photos || []).forEach(r => photos.splice(Math.max(0, photos.length - 1), 0, mkPhoto({ subject: r[0], position: r[1], view: r[2], purpose: r[3] })));
    });
    const order = { position: 0, people: 1, parts: 2, paper: 3, electronic: 4 }, pr = { Urgent: 0, High: 1, Normal: 2 };
    items.sort((a, b) => order[a.cat] - order[b.cat] || pr[a.priority] - pr[b.priority]);
    const sentences = String(narrative || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).map(s => s.trim()).filter(s => s.length > 12);
    const tests = sentences.filter(s => TEST_RE.test(s)).slice(0, 20).map(s => mkTest({
      statement: s, kind: OPEN_RE.test(s) ? 'Open question' : ASSUME_RE.test(s) ? 'Assumption' : CONC_RE.test(s) ? 'Conclusion' : 'Assumption',
      evidence: 'Find independent evidence (records, physical evidence, CCTV, a second witness) that confirms or rules this out.' }));
    (c.nodes || []).filter(n => n.verified === false && n.label).slice(0, 20).forEach(n => tests.push(mkTest({
      statement: (names ? names(n.type) : n.type) + ': ' + n.label, kind: 'Assumption', node: n.id,
      evidence: n.evidence ? 'Evidence so far: ' + str(n.evidence, 200) + '. Confirm it independently.' : 'Find evidence that confirms or rules out this tree element.' })));
    return { items, photos, tests, notes: 'Starter plan built on this device from standard evidence lists' + (hit.length ? ' and ' + hit.length + ' incident-specific pack' + (hit.length > 1 ? 's' : '') : '') + '. Edit it to fit the incident: remove what does not apply and add what is specific to this case.' };
  }

  /* ---------- Excel workbook (.xlsx, hand-built) ----------------------------- */
  const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const xe = s => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  // styles: 0 normal, 1 header, 2 body (wrap, border), 3 title, 4 label, 5 note (wrap), 6 urgent body, 7 centred body
  const STYLES = XML_HEAD + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="5"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF0F2A4D"/><name val="Calibri"/></font><font><b/><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFB42318"/><name val="Calibri"/></font></fonts>' +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F2A4D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDECEA"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFC9D1DA"/></left><right style="thin"><color rgb="FFC9D1DA"/></right><top style="thin"><color rgb="FFC9D1DA"/></top><bottom style="thin"><color rgb="FFC9D1DA"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function cell(ref, v, s) {
    if (typeof v === 'number') return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
    if (v == null || v === '') return `<c r="${ref}" s="${s}"/>`;
    return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xe(v)}</t></is></c>`;
  }
  /* spec: {name, title, sub:[lines], cols:[{h, w, k(row)=>value, s?, list?:[]}], rows:[...], headRow} */
  function tableSheet(spec) {
    const top = [spec.title].concat(spec.sub || []), hr = top.length + 1, n = spec.cols.length, last = colL(n - 1);
    let rows = top.map((t, i) => `<row r="${i + 1}"${i === 0 ? ' ht="22" customHeight="1"' : ''}>${cell('A' + (i + 1), t, i === 0 ? 3 : 5)}</row>`).join('');
    rows += `<row r="${hr}" ht="28" customHeight="1">${spec.cols.map((c, j) => cell(colL(j) + hr, c.h, 1)).join('')}</row>`;
    spec.rows.forEach((r, i) => {
      const rn = hr + 1 + i, vals = spec.cols.map(c => c.k(r, i));
      const lines = Math.max(1, ...vals.map((v, j) => Math.ceil(String(v == null ? '' : v).length / Math.max(4, spec.cols[j].w * 1.15))));
      rows += `<row r="${rn}" ht="${Math.min(160, 14 * lines + 2)}" customHeight="1">${vals.map((v, j) => cell(colL(j) + rn, v, spec.cols[j].s ? spec.cols[j].s(r) : 2)).join('')}</row>`;
    });
    const lastRow = hr + Math.max(1, spec.rows.length);
    const merges = top.map((t, i) => `<mergeCell ref="A${i + 1}:${last}${i + 1}"/>`).join('');
    const dv = spec.cols.map((c, j) => c.list ? `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${colL(j)}${hr + 1}:${colL(j)}${hr + 300}"><formula1>"${xe(c.list.join(','))}"</formula1></dataValidation>` : '').filter(Boolean);
    return XML_HEAD + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${hr}" topLeftCell="A${hr + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
      '<sheetFormatPr defaultRowHeight="14"/>' +
      `<cols>${spec.cols.map((c, j) => `<col min="${j + 1}" max="${j + 1}" width="${c.w}" customWidth="1"/>`).join('')}</cols>` +
      `<sheetData>${rows}</sheetData>` +
      `<autoFilter ref="A${hr}:${last}${lastRow}"/>` +
      `<mergeCells count="${top.length}">${merges}</mergeCells>` +
      (dv.length ? `<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>` : '') +
      '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
      `<headerFooter><oddFooter>${xe('&L' + spec.name + '&RPage &P of &N')}</oddFooter></headerFooter></worksheet>`;
  }
  function planSheet(c) {
    const m = c.meta || {}, E = c.evidence || {};
    const kv = [['Incident', (m.ref ? m.ref + ' · ' : '') + (m.title || '')], ['Date and time', [m.date, m.time].filter(Boolean).join(' ')], ['Location', [m.location, m.site].filter(Boolean).join(', ')],
      ['Client / company', m.client || ''], ['Investigator / practitioner', m.practitioner || ''],
      ['Plan prepared', E.generatedAt ? E.generatedAt.slice(0, 10) + (E.source ? ' (' + E.source + ')' : '') : ''],
      ['Progress', `${(E.items || []).filter(x => x.status === 'Collected').length} of ${(E.items || []).length} evidence items collected · ${(E.photos || []).filter(p => p.taken).length} of ${(E.photos || []).length} photos taken · ${(E.tests || []).filter(t => t.status !== 'Untested').length} of ${(E.tests || []).length} statements tested`]];
    let r = 1, rows = `<row r="1" ht="22" customHeight="1">${cell('A1', 'Evidence collection plan', 3)}</row>`;
    r = 3;
    kv.forEach(([k, v]) => { rows += `<row r="${r}">${cell('A' + r, k, 4)}${cell('B' + r, v, 5)}</row>`; r++; });
    const block = (label, text) => {
      r++; rows += `<row r="${r}">${cell('A' + r, label, 4)}</row>`; r++;
      const lines = Math.ceil(String(text || '').length / 120) + String(text || '').split('\n').length;
      rows += `<row r="${r}" ht="${Math.min(409, Math.max(15, 13.5 * lines))}" customHeight="1">${cell('A' + r, text || '', 5)}</row>`; r++;
    };
    block("Investigator's account", E.narrative || '');
    if (E.notes) block('Advice on preserving the scene and order of collection', E.notes);
    block('Photography good practice', PHOTO_TIPS.map(t => '• ' + t).join('\n'));
    r++; rows += `<row r="${r}">${cell('A' + r, 'Prepared with the Istec Training Tripod Beta Investigator. A planning aid: the investigation lead decides what is collected.', 5)}</row>`;
    const merges = [], seen = new Set();
    rows.replace(/<row r="(\d+)"[^>]*><c r="A\d+" s="5"/g, (x, n) => { if (!seen.has(n) && +n > 9) { merges.push(`<mergeCell ref="A${n}:B${n}"/>`); seen.add(n); } return x; });
    return XML_HEAD + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="14"/>' +
      '<cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/></cols>' +
      `<sheetData>${rows}</sheetData>` + (merges.length ? `<mergeCells count="${merges.length}">${merges.join('')}</mergeCells>` : '') +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>';
  }
  function xlsx(c, zip, names) {
    const m = c.meta || {}, E = normalise(c.evidence);
    const caseLine = (m.ref ? m.ref + ' · ' : '') + (m.title || '') + (m.date ? ' · ' + m.date : '');
    const nodeName = id => { const n = (c.nodes || []).find(x => x.id === id); return n ? (names ? names(n.type) : n.type) + ': ' + n.label : ''; };
    const urgent = r => r.priority === 'Urgent' ? 6 : 2;
    const sheets = [
      { name: 'Plan', xml: planSheet(Object.assign({}, c, { evidence: E })) },
      { name: 'Evidence checklist', xml: tableSheet({ name: 'Evidence checklist', title: 'Evidence collection checklist', sub: [caseLine, 'Urgent = perishable: collect first. Categories: Position (scene), People, Parts, Paper, Electronic data.'],
        rows: E.items, cols: [
          { h: 'No.', w: 5, k: (r, i) => i + 1, s: () => 7 }, { h: 'Category', w: 16, k: r => CAT_NAME[r.cat], list: CATS.map(x => x[1]) },
          { h: 'Evidence to collect', w: 46, k: r => r.item, s: urgent }, { h: 'Where / from whom', w: 26, k: r => r.source }, { h: 'Why (what it tests)', w: 34, k: r => r.purpose },
          { h: 'Priority', w: 9, k: r => r.priority, list: PRIORITY, s: urgent }, { h: 'Method', w: 13, k: r => r.method, list: METHODS }, { h: 'Owner', w: 14, k: r => r.owner },
          { h: 'Due', w: 11, k: r => r.due }, { h: 'Status', w: 12, k: r => r.status, list: ITEM_STATUS }, { h: 'Evidence ref', w: 12, k: r => r.ref }, { h: 'Notes', w: 28, k: r => r.notes }] }) },
      { name: 'Photography schedule', xml: tableSheet({ name: 'Photography schedule', title: 'Photography schedule', sub: [caseLine, 'Shoot in this order: overviews first, then mid-range, then close-ups with a scale. Log every photo number against its line.'],
        rows: E.photos, cols: [
          { h: 'Shot', w: 6, k: (r, i) => i + 1, s: () => 7 }, { h: 'Subject', w: 38, k: r => r.subject }, { h: 'Camera position / direction', w: 34, k: r => r.position },
          { h: 'View', w: 15, k: r => r.view, list: VIEWS }, { h: 'What it must show', w: 40, k: r => r.purpose }, { h: 'Taken', w: 8, k: r => r.taken ? 'Yes' : 'No', list: ['Yes', 'No'], s: () => 7 },
          { h: 'Photo no. / file', w: 16, k: r => r.ref }, { h: 'Notes', w: 26, k: r => r.notes }] }) },
      { name: 'Assumptions to test', xml: tableSheet({ name: 'Assumptions to test', title: 'Assumptions and conclusions to test', sub: [caseLine, 'Nothing goes into the report as a fact until the evidence supports it.'],
        rows: E.tests, cols: [
          { h: 'No.', w: 5, k: (r, i) => i + 1, s: () => 7 }, { h: 'Statement', w: 50, k: r => r.statement }, { h: 'Type', w: 14, k: r => r.kind, list: KINDS },
          { h: 'Evidence that would confirm or refute it', w: 50, k: r => r.evidence }, { h: 'Tripod tree element', w: 30, k: r => nodeName(r.node) },
          { h: 'Status', w: 13, k: r => r.status, list: TEST_STATUS }] }) }
    ];
    const files = [
      { name: '[Content_Types].xml', data: XML_HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { name: '_rels/.rels', data: XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { name: 'docProps/core.xml', data: XML_HEAD + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe('Evidence collection plan - ' + (m.title || ''))}</dc:title><dc:creator>Istec Training Tripod Beta Investigator</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>` },
      { name: 'xl/workbook.xml', data: XML_HEAD + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="1"/></bookViews><sheets>' +
        sheets.map((s, i) => `<sheet name="${xe(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets><definedNames>' +
        sheets.slice(1).map((s, i) => { const hr = 4, n = [12, 8, 6][i], rows = [E.items, E.photos, E.tests][i].length; return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i + 1}" hidden="1">'${xe(s.name)}'!$A$${hr}:$${colL(n - 1)}$${hr + Math.max(1, rows)}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="${i + 1}">'${xe(s.name)}'!$${hr}:$${hr}</definedName>`; }).join('') +
        '</definedNames></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: STYLES }
    ].concat(sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })));
    return zip(files);
  }

  return { CATS, CAT_NAME, PRIORITY, METHODS, ITEM_STATUS, VIEWS, KINDS, TEST_STATUS, PHOTO_TIPS, blank, normalise, mkItem, mkPhoto, mkTest, prompt, parseText, fromAnswer, starter, xlsx, treePrompt, treeFromAnswer };
})();
if (typeof module !== 'undefined') module.exports = TBE;
