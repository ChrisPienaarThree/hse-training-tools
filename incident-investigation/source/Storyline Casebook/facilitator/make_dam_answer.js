// Facilitator answer for training case CB-EX-02 (dam drowning), as a Storyline Casebook case package.
//   node make_dam_answer.js
// Starts from the learner case built into storyline-casebook.html (the @@CBP and @@DAM blocks), adds one
// reasonable full ECFA+ storyline and ICAM analysis, checks every link, and writes
//   CB-EX-02 Dam drowning - facilitator answer.casebook-case.json   (open with Import Case Package)
// Facilitator material: keep it out of the learner kit.
const fs = require('fs'), path = require('path');
const MASTER = path.resolve(__dirname, '../storyline-casebook.html');
const html = fs.readFileSync(MASTER, 'utf8');
const block = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); if (i < 0 || j < i) throw new Error('marker not found: ' + a); return html.slice(i, j + b.length); };
const todayISO = () => new Date().toISOString().slice(0, 10), nowISO = () => new Date().toISOString();
const newCaseDefaults = () => ({ caseTitle: '', facility: '', location: '', incidentType: 'Personal Injury', dateOccurred: todayISO(), timeOccurred: '', reportedBy: '', reportedAt: nowISO(), personsInvolved: '', initialDescription: '', refinedDescription: '', actualSeverity: 1, potentialSeverity: 1, immediateActionsTaken: '', sceneSecured: false, accessLogStarted: false, notificationsRequired: '', status: 'open', rootCause: { immediateCauses: '' } });
const ICAM_CATS = ['defences', 'actions', 'conditions', 'organizational'];
const { CBP, buildDamCase } = new Function('newCaseDefaults', 'ICAM_CATS', block('/* @@CBP-BEGIN', '/* @@CBP-END */') + '\n' + block('/* @@DAM-BEGIN', '/* @@DAM-END */') + '\nreturn { CBP, buildDamCase };')(newCaseDefaults, ICAM_CATS);
const L = buildDamCase();

/* ---------- full storyline: lane 0 the dam and the people on it, lane 1 the decisions ---------- */
const E = (id, time, text, status, ev, lane, order, mergeTo) => ({ id, time, text, status, evidenceIds: ev || [], lane, order, mergeTo: mergeTo || null });
const events = [
  E('d1', '13–14 Feb', 'Heavy rain falls in the upper catchment of the north return-water dam.', 'presumptive', ['EV-004'], 0, 0),
  E('d2', '~14:30', 'Inflow raises the dam level quickly and the dam overflows at the spillway.', 'presumptive', ['EV-003'], 0, 1),
  E('d5', '~15:20', 'Two contractor workers go out on the dam in an old boat; a third holds a line from the bank.', 'presumptive', [], 0, 2),
  E('d6', '~15:30', 'Boat drifts towards the spillway and the line is pulled from the shore attendant\'s hands.', 'presumptive', [], 0, 3),
  E('d7', '~15:35', 'Both workers leave the boat and try to swim to the bank.', 'presumptive', [], 0, 4),
  E('d8', '~15:40', 'Worker B reaches the bank.', 'presumptive', [], 0, 5),
  E('d9', '~15:40', 'Worker A goes under and drowns.', 'proven', ['EV-002'], 0, 6),
  E('d13', '~15:42', 'Shore attendant raises the alarm; nobody at the dam can reach Worker A.', 'presumptive', [], 0, 7),
  E('d10', '~17:30', 'Police divers recover the body of Worker A.', 'proven', ['EV-002'], 0, 8),
  E('d3', '~14:50', 'Control room operator sees the pump installation flooding and calls the engineering manager.', 'presumptive', ['EV-001'], 1, 0),
  E('d4', '~15:00', 'Engineering manager phones the contractor owner and asks him to help recover the pumps.', 'presumptive', [], 1, 1),
  E('d11', '~15:05', 'Contractor owner agrees and takes three of his workers to the dam.', 'presumptive', [], 1, 2),
  E('d12', '~15:15', 'The group takes the old boat from behind the pump station and carries it to the water.', 'presumptive', [], 1, 3, 'd5')
];
const C = (id, eventId, text, ev) => ({ id, eventId, text, status: 'presumptive', evidenceIds: ev || [] });
const conditions = [
  C('c1', 'd1', 'No monitoring of rainfall or inflow in the upper catchment is in place.'),
  C('c2', 'd2', 'The dam procedure has no flood trigger levels or flood actions.'),
  C('c3', 'd2', 'The pump installation sits below the maximum flood level of the dam.'),
  C('c4', 'd3', 'No dam-level alarm reaches the control room before the flooding (no alarm entry in the occurrence book).', ['EV-001']),
  C('c5', 'd4', 'There is no rule to stop all work on or near a dam while it overflows.'),
  C('c6', 'd4', 'The manager is under pressure to save the pumps and restore pumping.'),
  C('c7', 'd11', 'The work is outside the contractor\'s contract scope; no onboarding or competence check is done.'),
  C('c8', 'd11', 'No risk assessment, permit or job plan is made for the task.'),
  C('c9', 'd11', 'None of the group has worked on water or been trained in water safety or rescue.'),
  C('c10', 'd12', 'The boat has not been used or inspected for years and has no owner.'),
  C('c11', 'd5', 'No life jackets, ring buoys or throw lines are at the dam.'),
  C('c12', 'd5', 'The workers wear overalls and safety boots.'),
  C('c13', 'd6', 'A single hand-held line is the only way to control the boat.'),
  C('c14', 'd6', 'Strong current towards the spillway and wind across the dam (not yet measured).', ['EV-003']),
  C('c15', 'd7', 'The workers fear being carried over the spillway wall.'),
  C('c16', 'd7', 'The distance to the bank is underestimated (thought to be 15 to 20 m; not surveyed).'),
  C('c17', 'd9', 'Worker A cannot swim.'),
  C('c18', 'd13', 'No water-rescue equipment or trained rescuer at the dam, and no first-aid training for drowning.'),
  C('c19', null, 'The contractor management process is slow, so managers routinely ask contractors on site to do odd jobs outside their scope.'),
  C('c20', null, 'Disused equipment is left on site without an owner or control.'),
  C('c21', null, 'The site emergency plan does not cover water rescue at the dams.'),
  C('c22', null, 'PPE rules do not consider the drowning risk of work on or near water.')
];
/* ---------- ICAM coding ---------- */
const F = (id, category, description, linkedType, linkedId, code, codeLabel, codeStatus, defenceType) => Object.assign({ id, category, description, linkedType, linkedId }, code ? { code, codeLabel, codeStatus } : {}, defenceType ? { defenceType } : {});
const icamFactors = [
  F('i1', 'defences', 'Early warning of rising inflow from the upper catchment, with flood trigger levels', 'condition', 'c1', 'DF3', 'Warning systems / procedures', 'Absent', 'Engineering'),
  F('i2', 'defences', 'Dam-level alarm to the control room before the pump installation floods', 'condition', 'c4', 'DF1', 'Detection systems / procedures', 'Some failure', 'Engineering'),
  F('i3', 'defences', 'Stop-work rule: no work on or near the dam while it overflows', 'condition', 'c5', 'DF11', 'Safe work procedure', 'Absent', 'Administrative'),
  F('i4', 'defences', 'Contractor works only within an approved scope after onboarding and a competence check', 'condition', 'c7', 'DF10', 'Risk management', 'Complete failure', 'Administrative'),
  F('i5', 'defences', 'Pre-task risk assessment and job plan for work on water', 'condition', 'c8', 'DF9', 'Hazard identification', 'Absent', 'Administrative'),
  F('i6', 'defences', 'Supervision of the task by someone competent in work on water', 'event', 'd11', 'DF12', 'Supervision', 'Absent', 'Administrative'),
  F('i7', 'defences', 'Boat inspected and fit for the conditions before use', 'condition', 'c10', 'DF13', 'Other', 'Absent', 'Engineering'),
  F('i8', 'defences', 'Shore line and attendant able to hold and recover the boat', 'condition', 'c13', 'DF5', 'Recovery systems / procedures', 'Complete failure', 'Human'),
  F('i9', 'defences', 'Life jackets worn by everyone on the water', 'condition', 'c11', 'DF8', 'PPE', 'Absent', 'Human'),
  F('i10', 'defences', 'Water-rescue equipment (ring buoy, throw line) and a trained rescuer at the dam', 'condition', 'c18', 'DF7', 'Rescue systems / procedures', 'Absent', 'Emergency'),
  F('i11', 'actions', 'The engineering manager asked a contractor to recover the pumps from an overflowing dam (an exceptional, one-off decision under pressure).', 'event', 'd4', 'IT2', 'Authority', 'Unsuitable'),
  F('i12', 'actions', 'The contractor owner accepted work on water outside his scope and experience (routine scope creep on this site).', 'event', 'd11', 'IT11', 'Experience for task', 'Absent'),
  F('i13', 'actions', 'The group started the work with no risk assessment, permit or plan.', 'event', 'd11', 'IT8', 'Safety compliance', 'Absent'),
  F('i14', 'actions', 'The old boat was taken into use without any inspection.', 'event', 'd12', 'IT4', 'Equipment use', 'Unsuitable selection'),
  F('i15', 'actions', 'The workers went on the water without life jackets, in overalls and boots.', 'event', 'd5', 'IT5', 'PPE', 'Absent'),
  F('i16', 'actions', 'The shore attendant tried to hold the boat by hand against the current and the wind.', 'event', 'd6', 'IT7', 'Equip / material handling', 'Inadequate'),
  F('i17', 'actions', 'The workers left the boat to swim to the bank instead of staying with it.', 'event', 'd7', 'IT10', 'Training for task', 'Absent'),
  F('i18', 'conditions', 'Heavy rain upstream; strong current towards the spillway and wind across the dam.', 'condition', 'c14', 'WF2', 'Weather', 'Significant'),
  F('i19', 'conditions', 'Abnormal situation: dam overflowing and pump installation flooding.', 'event', 'd2', 'WF12', 'Abnormal operational situation / condition', 'Significant'),
  F('i20', 'conditions', 'No time taken to plan an unplanned emergency task.', 'condition', 'c8', 'WF10', 'Task planning / preparation', 'Significant'),
  F('i21', 'conditions', 'Work on water was new to everyone involved.', 'condition', 'c9', 'WF11', 'Routine / non-routine task', 'Significant'),
  F('i22', 'conditions', 'Old, uninspected boat controlled only by a hand-held line.', 'condition', 'c10', 'WF9', 'Tools / equipment condition / availability', 'Significant'),
  F('i23', 'conditions', 'Distance to the bank and strength of the current underestimated.', 'condition', 'c16', 'WF13', 'Risk perception / management', 'Significant'),
  F('i24', 'conditions', 'Pressure to save the pumps and restore pumping quickly.', 'condition', 'c6', 'HF5', 'Time pressure', 'Significant'),
  F('i25', 'conditions', 'Panic when the boat headed for the spillway.', 'condition', 'c15', 'HF10', 'Mental stress', 'Significant'),
  F('i26', 'conditions', 'Worker A could not swim; heavy clothing and boots in the water.', 'condition', 'c17', 'HF7', 'Physical capabilities', 'Significant'),
  F('i27', 'organizational', 'Contractor management process so slow that managers routinely bypass it; scope creep is normal on site.', 'condition', 'c19', 'CM', 'Contractor management', 'Contributing'),
  F('i28', 'organizational', 'No quick risk-assessment format for emergency or unplanned work.', 'condition', 'c8', 'RM', 'Risk management', 'Contributing'),
  F('i29', 'organizational', 'Dam procedure has no flood trigger levels or flood response; no procedure for a boat in distress.', 'condition', 'c2', 'PR', 'Procedures', 'Contributing'),
  F('i30', 'organizational', 'Pump installation not designed or sited for the maximum flood level.', 'condition', 'c3', 'DE', 'Design', 'Contributing'),
  F('i31', 'organizational', 'No guidance that people come before equipment in an emergency.', 'condition', 'c6', 'IG', 'Incompatible goals', 'Contributing'),
  F('i32', 'organizational', 'No water-safety, rescue or swimming check; contractor competence not checked against the task.', 'condition', 'c9', 'TR', 'Training', 'Contributing'),
  F('i33', 'organizational', 'No catchment monitoring, and no life-saving equipment provided at the dams.', 'condition', 'c1', 'HW', 'Hardware', 'Contributing'),
  F('i34', 'organizational', 'Disused equipment left on site without an owner, inspection or removal.', 'condition', 'c20', 'MM', 'Maintenance management', 'Contributing'),
  F('i35', 'organizational', 'Site emergency plan does not cover water rescue; PPE rules ignore drowning risk.', 'condition', 'c21', 'OR', 'Organisation', 'Contributing')
];
const contributingFactors = [
  { id: 'cf1', text: 'The dam overflow was not detected in time: no catchment monitoring, no flood trigger levels, and no level alarm before the pumps flooded.' },
  { id: 'cf2', text: 'The engineering manager asked a contractor to recover pumps from an overflowing dam (exceptional decision under pressure).' },
  { id: 'cf3', text: 'The contractor accepted work on water outside his scope and experience (routine scope creep).' },
  { id: 'cf4', text: 'The work started with no risk assessment, plan or competent supervision.' },
  { id: 'cf5', text: 'An old, uninspected boat was used, controlled only by a hand-held line.' },
  { id: 'cf6', text: 'No life jackets; the workers wore overalls and boots and Worker A could not swim.' },
  { id: 'cf7', text: 'The workers left the boat in panic and misjudged the distance to the bank.' },
  { id: 'cf8', text: 'No water-rescue equipment, trained rescuer or drowning first aid at the dam.' }
];
const R = (id, text, linkedFactorId, taprootCategory, taprootSubcategory) => ({ id, text, linkedFactorId, taprootCategory, taprootSubcategory: taprootSubcategory || null });
const rootCauses = [
  R('rc1', 'There is no flood management for the return-water dams: no catchment monitoring, no trigger levels, and a pump installation not designed for the flood level.', 'cf1', 'Management System', 'Standards, Policies or Admin Controls (SPAC) Needs Improvement'),
  R('rc2', 'There is no rule to stop work near an overflowing dam, and no guidance that people come before equipment in an emergency.', 'cf2', 'Management System', 'Standards, Policies or Admin Controls (SPAC) Needs Improvement'),
  R('rc3', 'The contractor management process is so slow that managers routinely bypass it, so scope, competence and risk checks are skipped.', 'cf3', 'Management System', 'SPAC Not Used'),
  R('rc4', 'There is no quick risk-assessment and planning format for emergency or unplanned work.', 'cf4', 'Work Direction', 'Preparation'),
  R('rc5', 'Disused equipment is not controlled or removed, and nothing requires an inspection before it is used.', 'cf5', 'Quality Control', 'No Inspection'),
  R('rc6', 'There is no site standard for work on or near water (life jackets, rescue equipment, competence, swimming check).', 'cf6', 'Management System', 'Standards, Policies or Admin Controls (SPAC) Needs Improvement'),
  R('rc7', 'Nobody is trained in water safety, staying with a boat in distress, water rescue or first aid for drowning.', 'cf7', 'Training', 'No Training'),
  R('rc8', 'The site emergency plan does not cover water rescue at the dams.', 'cf8', 'Management System', 'Standards, Policies or Admin Controls (SPAC) Needs Improvement')
];
const A = (id, linkedCauseType, linkedCauseId, finding, action, timeframe, hocLevel, owner) => ({ id, finding, linkedCauseType, linkedCauseId, action, timeframe, hocLevel, owner, targetDate: '' });
const correctiveActions = [
  A('a1', 'root', 'rc1', 'No early warning of inflow from the upper catchment.', 'Install rainfall and inflow monitoring in the upper catchment with alarms to the control room, and set flood trigger levels with actions in the dam operating procedure.', 'intermediate', 'engineering', 'Engineering manager'),
  A('a2', 'root', 'rc1', 'Pump installation floods before anyone can act.', 'Raise or relocate the pump installation above the maximum flood level, or fit it for remote isolation and recovery from the bank.', 'longterm', 'elimination', 'Engineering manager'),
  A('a3', 'root', 'rc2', 'Work went ahead on an overflowing dam.', 'Add a stop-work rule to the dam procedure and the site emergency standard: no person on or near the water while a dam overflows; equipment is recovered only after the level is safe.', 'immediate', 'administrative', 'Mine manager'),
  A('a4', 'root', 'rc3', 'Managers bypass the contractor process.', 'Introduce a fast-track contractor approval (same-day) that still checks scope, competence and risk, and report out-of-scope contractor work monthly to the mine manager.', 'intermediate', 'administrative', 'Contractor management officer'),
  A('a5', 'root', 'rc4', 'No planning for unplanned work.', 'Provide a one-page emergency task risk assessment with a stop point, signed off by the shift supervisor before any unplanned task starts.', 'immediate', 'administrative', 'SHE manager'),
  A('a6', 'root', 'rc5', 'Old boat available and used without inspection.', 'Remove the old boat from site; register all disused equipment with an owner and either remove it or lock it out of use.', 'immediate', 'elimination', 'Engineering superintendent'),
  A('a7', 'root', 'rc6', 'No standard for work on or near water.', 'Write a work on or near water standard: approved craft only, life jackets for everyone within 2 m of the water, a rescue plan and equipment at the point of work, and a swimming and competence check.', 'intermediate', 'administrative', 'SHE manager'),
  A('a8', 'root', 'rc6', 'No life-saving equipment at the dams.', 'Install ring buoys with throw lines and life-jacket stations at every dam access point, and add them to the monthly inspection.', 'immediate', 'engineering', 'Engineering superintendent'),
  A('a9', 'root', 'rc7', 'No water-safety or rescue training.', 'Train the people who may work at the dams (including contractors) in water safety, staying with a boat in distress, shore-based rescue and first aid for drowning; refresh every two years.', 'intermediate', 'administrative', 'Training manager'),
  A('a10', 'root', 'rc8', 'Emergency plan does not cover water rescue.', 'Add water rescue at the dams to the site emergency plan, agree response arrangements with the local rescue service, and test them with a drill.', 'intermediate', 'administrative', 'Emergency coordinator'),
  A('a11', 'contributing', 'cf7', 'The workers did not know to stay with the boat.', 'Put "stay with the boat, wait for rescue" signs at every launch point and in the work on water standard.', 'immediate', 'ppe', 'SHE manager'),
  A('a12', 'contributing', 'cf2', 'Pressure to save equipment in an emergency.', 'Brief all managers and supervisors on the stop-work rule and the "people before equipment" principle, and include it in the emergency standard.', 'immediate', 'administrative', 'Mine manager'),
  A('a13', 'additional', null, 'Other dams and water bodies on site.', 'Inspect all dams, sumps and ponds for access control, signs and life-saving equipment, and fix gaps.', 'intermediate', 'administrative', 'SHE manager'),
  A('a14', 'additional', null, 'Support for the people involved.', 'Offer trauma support to Worker B, Worker C, the contractor owner and the engineering manager, and to the family of Worker A.', 'immediate', 'administrative', 'Human resources manager')
];
const keyLearnings = [
  { id: 'kl1', text: 'Other dams and sumps on site also have no ring buoys, throw lines or signs (found during the walk-down after the event).' },
  { id: 'kl2', text: 'The disused-equipment yard behind the pump station holds other plant that nobody owns; a separate review is needed.' }
];

/* ---------- package ---------- */
const clone = v => JSON.parse(JSON.stringify(v));
const HEADER = ['caseTitle', 'facility', 'location', 'incidentType', 'dateOccurred', 'timeOccurred', 'reportedBy', 'reportedAt', 'personsInvolved', 'initialDescription', 'refinedDescription', 'actualSeverity', 'potentialSeverity', 'immediateActionsTaken', 'sceneSecured', 'accessLogStarted', 'notificationsRequired', 'status', 'rootCause'];
const head = {}; HEADER.forEach(k => { if (L[k] !== undefined) head[k] = clone(L[k]); });
head.caseTitle = 'Contractor worker drowned at an overflowing return-water dam (CB-EX-02 facilitator answer)';
head.status = 'review';
head.refinedDescription = 'On 14 February at about 15:40, a contract worker (Worker A) drowned in the north return-water dam. Heavy rain in the upper catchment raised the dam level quickly and it overflowed at about 14:30 (presumed); the control room noticed only when the pump installation was flooding (EV-001). The engineering manager asked the owner of a civils contractor on site to help recover the pumps. Two of his workers went out in an old boat that had stood unused behind the pump station for years, while a third held a line from the bank. The current and the wind carried the boat towards the spillway and the line was pulled from the attendant\'s hands. Both workers left the boat to swim to the bank, without life jackets and in overalls and boots. Worker B reached the bank; Worker A, who could not swim, drowned. Police divers recovered his body at about 17:30 (EV-002). No risk assessment, permit or job plan was made, and there was no rescue equipment at the dam. Times, distances and the wind are not yet confirmed.';
head.rootCause = { immediateCauses: 'Worker A, who could not swim, entered deep moving water without a life jacket after leaving a drifting boat, and could not be rescued.' };
const plan = clone(L.evidencePlan[0]); delete plan.id;
const pkg = {
  format: 'storyline-casebook-case', version: 1, source: 'CB-EX-02 facilitator answer (Istec Training)',
  case: head, evidence: clone(L.evidence), events, conditions, icamFactors, contributingFactors, rootCauses, keyLearnings, correctiveActions,
  investigationTeam: clone(L.investigationTeam), involvedPersons: clone(L.involvedPersons), photos: [], evidenceFiles: [], evidencePlan: plan
};

/* ---------- checks ---------- */
const errs = [], ev = new Set(pkg.evidence.map(e => e.id)), evId = new Set(events.map(e => e.id)), cdId = new Set(conditions.map(c => c.id)), cf = new Set(contributingFactors.map(x => x.id)), rc = new Set(rootCauses.map(x => x.id));
L.events.forEach(e => { if (!evId.has(e.id)) errs.push('learner event missing from the answer: ' + e.id); });
events.forEach(e => { e.evidenceIds.forEach(t => ev.has(t) || errs.push(e.id + ' cites unknown ' + t)); if (e.mergeTo && !evId.has(e.mergeTo)) errs.push(e.id + ' merges into unknown ' + e.mergeTo); });
conditions.forEach(c => { if (c.eventId && !evId.has(c.eventId)) errs.push(c.id + ' linked to unknown event'); c.evidenceIds.forEach(t => ev.has(t) || errs.push(c.id + ' cites unknown ' + t)); });
icamFactors.forEach(f => { if (f.linkedType === 'event' && !evId.has(f.linkedId)) errs.push(f.id + ' -> unknown event'); if (f.linkedType === 'condition' && !cdId.has(f.linkedId)) errs.push(f.id + ' -> unknown condition'); });
rootCauses.forEach(r => cf.has(r.linkedFactorId) || errs.push(r.id + ' -> unknown factor'));
correctiveActions.forEach(a => { if (a.linkedCauseType === 'root' && !rc.has(a.linkedCauseId)) errs.push(a.id + ' -> unknown root cause'); if (a.linkedCauseType === 'contributing' && !cf.has(a.linkedCauseId)) errs.push(a.id + ' -> unknown factor'); });
rootCauses.forEach(r => correctiveActions.some(a => a.linkedCauseId === r.id) || errs.push(r.id + ' has no action'));
ICAM_CATS.forEach(cat => icamFactors.some(f => f.category === cat) || errs.push('no ICAM factor in ' + cat));
plan.tests.forEach(t => { if (t.node) { const [k, id] = t.node.split(':'); if (k === 'event' ? !evId.has(id) : !cdId.has(id)) errs.push('plan test -> unknown ' + t.node); } });
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const out = path.join(__dirname, 'CB-EX-02 Dam drowning - facilitator answer.casebook-case.json');
fs.writeFileSync(out, JSON.stringify(pkg, null, 1));
const n = k => icamFactors.filter(f => f.category === k).length;
console.log('wrote', path.basename(out), { events: events.length, conditions: conditions.length, icam: icamFactors.length, defences: n('defences'), actions: n('actions'), conditions_: n('conditions'), org: n('organizational'), cf: contributingFactors.length, rc: rootCauses.length, actions_: correctiveActions.length, planItems: plan.items.length, photos: plan.photos.length, tests: plan.tests.length });
