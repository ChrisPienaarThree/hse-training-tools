/* Facilitator answer for the TB-EX-09 training case (drowning at an overflowing return-water dam).
   Builds the full tree from the learner case in content.js by adding barriers, causation paths and actions.
   Not part of the app: build.py checks it against the tree rules and writes facilitator/*.tripod.json. */
module.exports = function damFull(C) {
  const c = JSON.parse(JSON.stringify(C.DAM));
  c.id = 'facilitator-dam-drowning'; delete c.example; delete c.exampleNote;
  c.meta.title += ' (facilitator answer)'; c.meta.status = 'Final'; c.meta.practitioner = 'Course facilitator';
  c.meta.summary = 'Four trios describe the event: the catchment flood overflows the dam and floods the pumps; the decision to recover the pumps puts an old boat with two inexperienced contractor workers on the overflowing dam; the boat drifts towards the spillway and the workers leave it; and, with no life-saving equipment, swimming ability or rescue capability, both drown. Six barriers failed and seven were missing or inadequate. The Underlying Causes sit in flood defences and dam procedures, competing goals in an emergency, a contractor management process so cumbersome that managers routinely bypass it, uncontrolled disused equipment, and the absence of any requirement, training or equipment for work on or near water.';
  c.meta.lessons = 'In a flood emergency, stop work on or near the water; protect people before equipment.\nA slow contractor process does not stop contractors being used: it pushes the work outside the process.\nWork on or near water needs a plan, life jackets, a rescue capability and people who have been trained, every time.\nDisused equipment left on site will be used: remove it or control it.';
  const N = (id, type, label, extra) => Object.assign({ id, type, label, notes: 'Facilitator answer: one reasonable model, not the only one.', evidence: '', verified: true }, extra || {});
  const add = c.nodes.push.bind(c.nodes);
  // ---- barriers on the trajectories
  add(N('f_mb1', 'missing', 'Early warning of rising inflow from the upper catchment, with flood trigger levels at the dam'));
  add(N('f_ib1', 'inadequate', 'Pump installation sited and protected for the dam\'s flood level'));
  add(N('f_fb1', 'failed', 'All work on or near the dam stopped while it overflows, with an exclusion zone at the spillway'));
  add(N('f_fb2', 'failed', 'Contractor works only within an approved scope, after onboarding, a competence check and site authorisation'));
  add(N('f_fb3', 'failed', 'Pre-task risk assessment and job plan for work on water, approved before the boat goes out'));
  add(N('f_fb4', 'failed', 'Boat inspected and confirmed fit for the conditions before use'));
  add(N('f_fb5', 'failed', 'Shore line, anchor point and attendant able to hold the boat against the current and wind'));
  add(N('f_fb6', 'failed', 'Workers stay with the boat and wait for rescue, as briefed for a boat in distress'));
  add(N('f_mb2', 'missing', 'Life jackets worn by everyone in the boat'));
  add(N('f_ib2', 'inadequate', 'Clothing and PPE suited to work on water (no heavy boots and overalls in the boat)'));
  add(N('f_mb3', 'missing', 'Water rescue equipment and a trained rescuer at the dam (throw line, ring buoy, rescue boat)'));
  add(N('f_mb4', 'missing', 'First aid for drowning (rescue breathing and CPR) available at the dam'));
  // ---- Immediate Causes
  add(N('f_ic1', 'ic', 'Engineering manager asks the contractor owner to recover the pumps from the overflowing dam', { act: 'act', errorType: 'exceptional', justification: '', notes: 'Exceptional violation: a first-time emergency with no obvious rule and pressure to solve it.' }));
  add(N('f_ic2', 'ic', 'Contractor owner accepts and starts water work outside his scope and experience', { act: 'act', errorType: 'routine', justification: '', notes: 'Routine violation: asking contractors to do odd jobs outside their scope is normal practice on this site.' }));
  add(N('f_ic3', 'ic', 'Work on the dam starts with no pre-task risk assessment or job planning', { act: 'act', errorType: 'routine', justification: '' }));
  add(N('f_ic4', 'ic', 'Old boat, unused for years, taken into use without any inspection', { act: 'act', errorType: 'mistakeKnow', justification: '' }));
  add(N('f_ic5', 'ic', 'Shore attendant underestimates the current and wind and loses control of the boat', { act: 'act', errorType: 'mistakeKnow', justification: '' }));
  add(N('f_ic6', 'ic', 'Workers leave the drifting boat in panic to swim to the bank', { act: 'act', errorType: 'mistakeKnow', justification: '', notes: 'Knowledge-based mistake under extreme time and emotional pressure.' }));
  // ---- Preconditions
  add(N('f_pc1', 'pc', 'Pressure to restore pumping and save the flooded equipment', { scope: 'org' }));
  add(N('f_pc2', 'pc', 'Calling in a contractor directly is quicker than the formal process', { scope: 'org' }));
  add(N('f_pc3', 'pc', 'Doing odd jobs for the client is normal and keeps the relationship', { scope: 'org' }));
  add(N('f_pc4', 'pc', 'Seen as an emergency, so "no time" to plan', { scope: 'org' }));
  add(N('f_pc5', 'pc', 'Nobody involved had worked on water, so the hazards were not recognised', { scope: 'org' }));
  add(N('f_pc6', 'pc', 'The boat was on site and looked like the quickest way to the pumps', { scope: 'org' }));
  add(N('f_pc7', 'pc', 'Current and wind forces on the dam not assessed; no measurements of flow or wind', { scope: 'org' }));
  add(N('f_pc8', 'pc', 'Fear of being carried over the spillway wall', { scope: 'org' }));
  add(N('f_pc9', 'pc', 'Workers misjudge the distance to the bank and cannot swim', { scope: 'org' }));
  // ---- Underlying Causes
  add(N('f_uc1', 'uc', 'No catchment rainfall or inflow monitoring linked to the dam', { brf: 'DF' }));
  add(N('f_uc2', 'uc', 'Dam operating procedure has no flood trigger levels or response actions', { brf: 'PR' }));
  add(N('f_uc3', 'uc', 'Pump station design did not consider the dam\'s maximum flood level', { brf: 'DE' }));
  add(N('f_uc4', 'uc', 'No guidance on putting people before equipment in an emergency', { brf: 'IG' }));
  add(N('f_uc5', 'uc', 'Contractor management process is so cumbersome that managers routinely bypass it (scope creep)', { brf: 'OR' }));
  add(N('f_uc6', 'uc', 'Contractor competence and experience not checked against the task', { brf: 'TR' }));
  add(N('f_uc7', 'uc', 'No requirement or quick format for risk assessment of emergency or unplanned work', { brf: 'PR' }));
  add(N('f_uc8', 'uc', 'Disused equipment (the old boat) left on site, uncontrolled and available for use', { brf: 'HK' }));
  add(N('f_uc9', 'uc', 'No emergency procedure or briefing for a boat in distress', { brf: 'PR' }));
  add(N('f_uc10', 'uc', 'No training or swimming-ability check for work on or near water', { brf: 'TR' }));
  add(N('f_uc11', 'uc', 'No life-saving equipment required or provided for work on or near water', { brf: 'DF' }));
  add(N('f_uc12', 'uc', 'PPE selection does not consider the drowning risk', { brf: 'PR' }));
  add(N('f_uc13', 'uc', 'Emergency response plan does not cover water rescue', { brf: 'DF' }));
  add(N('f_uc14', 'uc', 'First-aid training and procedure do not cover drowning', { brf: 'TR' }));
  // ---- links: put barriers on the trajectories (replacing the direct core links), then the causation paths
  const drop = (f, t) => { c.edges = c.edges.filter(e => !(e.from === f && e.to === t)); };
  drop('d_a1', 'd_ea1'); drop('d_o1', 'd_ea1'); drop('d_ea1', 'd_ea2'); drop('d_o2', 'd_ea2'); drop('d_o3', 'd_eo3'); drop('d_eo3', 'd_e4');
  const L = [
    ['d_a1', 'f_mb1'], ['f_mb1', 'd_ea1'], ['d_o1', 'f_ib1'], ['f_ib1', 'd_ea1'],
    ['d_ea1', 'f_fb1'], ['f_fb1', 'd_ea2'],
    ['d_o2', 'f_fb2'], ['f_fb2', 'f_fb3'], ['f_fb3', 'f_fb4'], ['f_fb4', 'f_fb5'], ['f_fb5', 'd_ea2'],
    ['d_o3', 'f_fb6'], ['f_fb6', 'd_eo3'],
    ['d_eo3', 'f_mb2'], ['f_mb2', 'f_ib2'], ['f_ib2', 'f_mb3'], ['f_mb3', 'f_mb4'], ['f_mb4', 'd_e4'],
    ['f_ic1', 'f_fb1'], ['f_ic2', 'f_fb2'], ['f_ic3', 'f_fb3'], ['f_ic4', 'f_fb4'], ['f_ic5', 'f_fb5'], ['f_ic6', 'f_fb6'],
    ['f_pc1', 'f_ic1'], ['f_pc2', 'f_ic1'], ['f_pc3', 'f_ic2'], ['f_pc2', 'f_ic2'], ['f_pc4', 'f_ic3'], ['f_pc5', 'f_ic3'], ['f_pc6', 'f_ic4'], ['f_pc7', 'f_ic5'], ['f_pc8', 'f_ic6'], ['f_pc9', 'f_ic6'],
    ['f_uc4', 'f_pc1'], ['f_uc2', 'f_pc1'], ['f_uc5', 'f_pc2'], ['f_uc5', 'f_pc3'], ['f_uc7', 'f_pc4'], ['f_uc6', 'f_pc5'], ['f_uc8', 'f_pc6'], ['f_uc7', 'f_pc7'], ['f_uc9', 'f_pc8'], ['f_uc10', 'f_pc9'],
    ['f_uc1', 'f_mb1'], ['f_uc2', 'f_mb1'], ['f_uc3', 'f_ib1'], ['f_uc11', 'f_mb2'], ['f_uc12', 'f_ib2'], ['f_uc13', 'f_mb3'], ['f_uc14', 'f_mb4']
  ];
  L.forEach((e, i) => c.edges.push({ id: 'fx' + (i + 1), from: e[0], to: e[1] }));
  const A = (target, text, owner, days, priority) => ({ target, text, owner, due: '+' + days, priority, status: 'Open', smart: { S: true, M: true, A: true, R: true, T: true }, agreed: true, closeNote: '' });
  c.actions = [
    A('f_mb1', 'Subscribe the control room to the weather service and upstream gauge alerts for the dam catchment; set level and rainfall trigger alarms and test them monthly.', 'Engineering Manager', 60, 'High'),
    A('f_ib1', 'Raise or flood-protect the pump installation above the assessed maximum flood level, or fit remote isolation so nobody needs to approach it in a flood.', 'Engineering Manager', 180, 'Medium'),
    A('f_fb1', 'Add a "stop work on or near the dam" rule and spillway exclusion zone to the dam flood procedure; brief all supervisors and the control room.', 'Mine Manager', 30, 'High'),
    A('f_fb2', 'Contractors may only start work covered by an approved scope; any new task needs a scope variation signed by the contract owner and SHE before work starts.', 'Contractor Management Officer', 30, 'High'),
    A('f_fb3', 'Require a written task risk assessment and job plan, approved by the responsible supervisor, before any work on or near water, including emergencies.', 'SHE Manager', 30, 'High'),
    A('f_fb4', 'Remove the old boat from site; any boat used on site must be registered, inspected before each use and fit for the water conditions.', 'Engineering Manager', 14, 'High'),
    A('f_fb5', 'Define shore-control requirements for boat work (anchored line, winch or second boat, maximum wind and flow) in the water-work standard.', 'SHE Manager', 60, 'High'),
    A('f_fb6', 'Include "stay with the boat, signal and wait for rescue" in the pre-task briefing and in the water-work training.', 'Training Manager', 60, 'Medium'),
    A('f_mb2', 'Issue certified life jackets for all work on or near water and make wearing them a condition of access to the dam water edge.', 'SHE Manager', 14, 'High'),
    A('f_ib2', 'Specify PPE for work on water (life jacket, light footwear) in the PPE matrix and the water-work standard.', 'SHE Manager', 60, 'Medium'),
    A('f_mb3', 'Install rescue points (ring buoy and throw line) at every dam access point and inspect them monthly.', 'Emergency Response Coordinator', 30, 'High'),
    A('f_mb4', 'Train the dam area first aiders and emergency team in drowning first aid (rescue breathing and CPR) and refresh it yearly.', 'Training Manager', 90, 'Medium'),
    A('f_uc1', 'Install a rain gauge and upstream level sensor in the upper catchment with telemetry to the control room.', 'Engineering Manager', 180, 'Medium'),
    A('f_uc2', 'Revise the dam operating procedure with flood trigger levels, actions per level and who is called; exercise it before the next rainy season.', 'Engineering Manager', 90, 'High'),
    A('f_uc3', 'Include maximum flood levels in the design review checklist for all installations at dams and water courses.', 'Engineering Manager', 120, 'Medium'),
    A('f_uc4', 'Add "people before equipment" decision rules to the emergency management procedure and brief all managers.', 'Mine Manager', 60, 'High'),
    A('f_uc5', 'Review the contractor management process with users; introduce a fast-track route for urgent work that still checks scope, competence and risk; monitor out-of-scope requests monthly.', 'Contractor Management Officer', 120, 'High'),
    A('f_uc6', 'Check contractor competence for each new task type against the task requirements before approval, and keep the record.', 'Contractor Management Officer', 90, 'High'),
    A('f_uc7', 'Introduce a one-page quick risk assessment for emergency and unplanned work, with a required second signature.', 'SHE Manager', 60, 'High'),
    A('f_uc8', 'Survey the site for disused equipment and either remove it or tag it out of service in a register; repeat yearly.', 'Engineering Manager', 90, 'Medium'),
    A('f_uc9', 'Write an emergency procedure for a boat in distress and for persons in the water, and brief it to everyone working on water.', 'Emergency Response Coordinator', 60, 'High'),
    A('f_uc10', 'Introduce water-safety training with a swimming-ability check for anyone who works on or near water.', 'Training Manager', 90, 'High'),
    A('f_uc11', 'Write a site standard for work on or near water that requires life jackets, rescue equipment and a rescuer for every task.', 'SHE Manager', 60, 'High'),
    A('f_uc12', 'Review the PPE matrix for all water-related tasks and update it.', 'SHE Manager', 60, 'Medium'),
    A('f_uc13', 'Add water rescue scenarios to the emergency response plan and hold a water rescue drill at the dam within six months.', 'Emergency Response Coordinator', 120, 'High'),
    A('f_uc14', 'Add drowning to the first-aid training content and the site first-aid procedure.', 'Training Manager', 90, 'Medium')
  ].map((a, i) => Object.assign({ id: 'fa' + (i + 1) }, a));
  return c;
};
