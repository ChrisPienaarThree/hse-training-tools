/* Tripod Beta Investigator — method content.
   Source: Tripod Beta User Guide 02a (Stichting Tripod Foundation / Energy Institute),
   Annex 1 (glossary), 2 (quality tips), 3 (error types), 4 (BRFs), 5 (symbols), 6 (tree rules), 8 (worked example).
   Terminology: current User Guide terms only (Agent of Change / Object / Event; Immediate Cause → Precondition → Underlying Cause). */
var TBC = (function () {

  const TYPES = {
    agent:       { name: 'Agent of Change', short: 'Agent', group: 'core', w: 150,
      def: 'Anything with the potential to change, harm or damage an Object upon which it is acting: an energy source, material condition, change of plan, and so on.',
      tips: ['It has no inputs and always connects to an Event, usually through one or more Barriers.', 'Ask: did this Agent have the potential to change the Object to the state described in the Event?', 'If the Agent was itself the outcome of an earlier happening, add a prior trio and turn that Event into an Event-Agent.'] },
    object:      { name: 'Object', short: 'Object', group: 'core', w: 150,
      def: 'The item harmed (injured, damaged or lost) or changed by an Agent of Change: a person, equipment, the environment, reputation, a project schedule.',
      tips: ['It has no inputs and always connects to an Event, usually through one or more Barriers.', 'Describe the Object as it was before its condition changed.', 'If the Object only existed because of an earlier happening, add a prior trio and turn that Event into an Event-Object.'] },
    event:       { name: 'Event', short: 'Event', group: 'core', w: 150,
      def: 'An unplanned and unwanted happening involving the release or exposure of an Agent of Change: damage, injury or loss to the Object.',
      tips: ['An Event has exactly two inputs: one from an Agent and one from an Object.', 'Define the Event first, then the Object it changed, then the Agent that changed it. Reasoning runs back in time; the tree runs left to right.', 'If an Effective Barrier stopped the trio, the Event becomes a Potential Event (near miss).'] },
    eventAgent:  { name: 'Event-Agent', short: 'Event-Agent', group: 'core', w: 150,
      def: 'An Event that goes on to act as the Agent of Change in a later trio. Example: an explosion weakens a structure, which falls on rescue workers.',
      tips: ['It takes one Agent input and one Object input, like an Event.', 'Its output acts as an Agent in the next trio.'] },
    eventObject: { name: 'Event-Object', short: 'Event-Object', group: 'core', w: 150,
      def: 'An Event that creates a new Object for a later trio. Example: a man falls 30 m into the sea; the fall creates a new Object (the man) for a new Agent (the sea).',
      tips: ['It takes one Agent input and one Object input, like an Event.', 'Its output acts as an Object in the next trio.'] },
    failed:      { name: 'Failed Barrier', short: 'Failed Barrier', group: 'barrier', w: 160,
      def: 'A Barrier that was in place but was made ineffective by an Immediate Cause, letting the Agent and Object meet.',
      tips: ['Exactly one Immediate Cause per Failed Barrier.', 'Describe it specifically: the relevant step of a procedure, not the title of the procedure.', 'Had it worked, would it have prevented the next Event?', 'Check the management system, JRA/JSA, Permit to Work and BowTie for barriers you may have missed.'] },
    missing:     { name: 'Missing Barrier', short: 'Missing Barrier', group: 'barrier', w: 160,
      def: 'A Barrier it was reasonable to expect, but which was never established, and nobody can be identified who should have designed or implemented it.',
      tips: ['Linked directly to one or more Underlying Causes. No Immediate Cause and no Precondition.', 'Rare. If a Barrier was removed, or you can identify who should have provided it, it is a Failed Barrier: make that human error the Immediate Cause.'] },
    inadequate:  { name: 'Inadequate Barrier', short: 'Inadequate Barrier', group: 'barrier', w: 160,
      def: 'A Barrier that was in place and in proper condition but could not do its job (a fence intact but built too low). Treated the same way as a Missing Barrier.',
      tips: ['Linked directly to one or more Underlying Causes. No Immediate Cause and no Precondition.', 'Drawn with the same symbol as a Missing Barrier.'] },
    effective:   { name: 'Effective Barrier', short: 'Effective Barrier', group: 'barrier', w: 160,
      def: 'A Barrier that did not fail: it contained the Agent or protected the Object, so further injury, damage or loss was averted.',
      tips: ['It has no Immediate Cause, Precondition or Underlying Cause.', 'The Event it protects becomes a Potential Event. It shows how close the incident came to something worse.'] },
    ic:          { name: 'Immediate Cause', short: 'Immediate Cause', group: 'cause', w: 150,
      def: 'The act, omission or technical failure that made the Barrier fail. A sub-standard act by a person or, by exception, a sub-standard condition.',
      tips: ['Who caused the barrier to fail? Only when you know the person can you find the Precondition.', 'Word it as the opposite of the Failed Barrier: a positive barrier gives a negative Immediate Cause.', 'Close to the Failed Barrier in logic, not necessarily in time or place.', 'Classify the error type: it points you to the likely Preconditions.'] },
    pc:          { name: 'Precondition', short: 'Precondition', group: 'cause', w: 150,
      def: 'The environmental, situational or psychological system state or state of mind that caused or promoted the Immediate Cause.',
      tips: ['It explains why the person thought their act was normal, acceptable or even commendable.', 'It influences behaviour. If it directly caused the barrier to fail it is not a Precondition.', 'Every organisational Precondition needs an Underlying Cause. Natural phenomena and conditions outside the company may be end nodes.', 'The link to the Immediate Cause is probabilistic, so it is drawn dotted.'] },
    uc:          { name: 'Underlying Cause', short: 'Underlying Cause', group: 'cause', w: 150,
      def: 'The organisational deficiency or anomaly that created the Precondition. A failure at system level, remote from the event in time or place.',
      tips: ['It is an end node: nothing feeds into it.', 'Assign a Basic Risk Factor (BRF).', 'Can the organisation take responsibility for it and improve it? If it lies outside, word the action to influence the other party.', 'One Underlying Cause can feed several Preconditions: link it rather than repeating it.'] },
    narrative:   { name: 'Narrative', short: 'Narrative', group: 'other', w: 170,
      def: 'A note that clarifies a connection or a decision the model cannot show by itself. It plays no part in the tree rules.',
      tips: ['Use sparingly, for example to record why a barrier was excluded.'] }
  };

  const PALETTE = [
    { title: 'What happened', note: 'Core diagram: 2 to 5 trios', types: ['agent', 'object', 'event', 'eventAgent', 'eventObject'] },
    { title: 'How it happened', note: 'Barriers on the trajectories', types: ['failed', 'missing', 'inadequate', 'effective'] },
    { title: 'Why it happened', note: 'Tripod causation path', types: ['ic', 'pc', 'uc'] },
    { title: 'Notes', note: '', types: ['narrative'] }
  ];

  const BRF = [
    { code: 'HW', name: 'Hardware', def: 'Failures due to inadequate quality of materials or construction, non-availability of hardware, and failures due to ageing (position in the life cycle). Excludes poorly designed equipment (Design) and failures from inadequate maintenance (Maintenance Management).' },
    { code: 'DE', name: 'Design', def: 'Deficiencies in layout or design of facilities, plant, equipment or tools that lead to misuse or sub-standard acts, increasing the chance of particular errors and violations.' },
    { code: 'MM', name: 'Maintenance Management', def: 'Failures in the systems for ensuring technical integrity of facilities, plant, equipment and tools: condition surveys, corrosion barriers, function testing of safety and emergency equipment.' },
    { code: 'PR', name: 'Procedures', def: 'Unclear, unavailable, incorrect or otherwise unusable standardised task information established to achieve a desired result.' },
    { code: 'EC', name: 'Error-enforcing Conditions', def: 'Time pressure, changes in work patterns, physical working conditions (hot, cold, noisy) and similar factors acting on the individual or workplace that promote errors or violations.' },
    { code: 'HK', name: 'Housekeeping', def: 'Tolerance of deficiencies in tidiness and cleanliness of facilities and work spaces, or in the provision of resources for cleaning and waste removal.' },
    { code: 'IG', name: 'Incompatible Goals', def: 'Failure to manage conflict between organisational goals (safety and production), between formal rules and informal work-group rules, or between task demands and personal preoccupations.' },
    { code: 'CO', name: 'Communication', def: 'Failure to transmit information needed for safe and effective functioning to the right recipients in a clear, unambiguous and intelligible form.' },
    { code: 'OR', name: 'Organisation', def: 'Deficiencies in company structure or in the way it conducts its business that allow responsibilities to become ill-defined and warning signs to be overlooked.' },
    { code: 'TR', name: 'Training', def: 'Deficiencies in the system for providing awareness, knowledge or skill, including on-the-job coaching by mentors and supervisors as well as formal courses.' },
    { code: 'DF', name: 'Defences', def: 'Failures in the systems, facilities and equipment for control or containment of the source of harm, or for mitigating the consequences of human or component failures.' }
  ];

  const ERRORS = [
    { code: 'slip', name: 'Slip', group: 'Unintended action', def: 'Unintended deviation from a correct plan of action.', pre: ['Attention failure', 'Mistiming', 'Distraction from task', 'Preoccupation with other tasks'] },
    { code: 'lapse', name: 'Lapse', group: 'Unintended action', def: 'Omission or repetition of a planned action.', pre: ['Memory failure', 'Change in nature of task', 'Change in task environment'] },
    { code: 'mistakeRule', name: 'Mistake (rule-based)', group: 'Intended action', def: 'Intended action inappropriate to the circumstances.', pre: ['Sound rule applied in inappropriate circumstances', 'Application of unsound rule', 'Failure to recognise correct area of application', 'Failure to appreciate rule deficiencies'] },
    { code: 'mistakeKnow', name: 'Mistake (knowledge-based)', group: 'Intended action', def: 'Erroneous judgement in a situation not covered by a rule.', pre: ['Insufficient knowledge or experience (immaturity)', 'Time or emotional pressures', 'Inadequate training'] },
    { code: 'uvUnderstanding', name: 'Unintentional violation (understanding)', group: 'Violation', def: 'People not knowing how to apply the procedures.', pre: ['Poor writing', 'Complexity', 'Failure to understand users'] },
    { code: 'uvAwareness', name: 'Unintentional violation (awareness)', group: 'Violation', def: 'People acting as if there is no procedure.', pre: ['Poor training', 'Procedure not available on site'] },
    { code: 'routine', name: 'Routine violation', group: 'Violation', def: 'Rules broken because they are felt to be irrelevant or people no longer appreciate the dangers.', pre: ['Unnecessary rules', 'Poor attitude to compliance', 'Weak supervision'] },
    { code: 'situational', name: 'Situational violation (no-can-do)', group: 'Violation', def: 'Impossible to get the job done by following the procedures strictly.', pre: ['Lack of resources (people, equipment, tools)', 'Failure to understand working conditions'] },
    { code: 'optOrg', name: 'Optimising violation (organisational benefit)', group: 'Violation', def: 'Rules not followed to get the job done faster or with less disturbance.', pre: ['Wanting to do a good job for the boss or company'] },
    { code: 'optPersonal', name: 'Optimising violation (personal benefit)', group: 'Violation', def: 'Rules not followed for convenience or a thrill.', pre: ['Personal convenience', 'Opportunity for personal satisfaction from the act'] },
    { code: 'exceptional', name: 'Exceptional violation', group: 'Violation', def: 'Solving a problem for the first time and failing to follow good practice.', pre: ['Unexpected situation with no obvious rule', 'Pressure to solve the problem'] }
  ];

  const OBJECT_KINDS = ['People', 'Assets', 'Environment', 'Reputation', 'Production schedule', 'Product quality', 'Financial target', 'IT system', 'Project plan', 'System integrity', 'Security'];

  const STAGES = [
    { n: 1, title: 'What happened?', body: 'Build the core diagram. Start with the Main Event (the reason for the investigation), then the Object it changed and the Agent that changed it. Look for prior and subsequent events and chain them with Event-Agent or Event-Object nodes. Two to five trios describe most incidents.' },
    { n: 2, title: 'How did it happen?', body: 'Place Barriers on the trajectories. Barriers that contain the Agent go on the Agent-to-Event line; barriers that protect the Object go on the Object-to-Event line. Start by calling them Failed; reclassify as Missing, Inadequate or Effective as the facts come in.' },
    { n: 3, title: 'Why did it happen?', body: 'For each Failed Barrier, add the Immediate Cause, the Preconditions that promoted it and the Underlying Causes that created them. Classify each Underlying Cause with a Basic Risk Factor. Then write SMART actions for every Failed or Missing Barrier and every Underlying Cause.' }
  ];

  const TIPS = {
    'A. Creating the core diagram': [
      'Define the Event first, then the Object which has been changed, then the Agent which acted on it. Reasoning is back in time; the diagram reads left to right.',
      'Does the Event describe a happening to the Object?',
      'Does the Object describe the item before its condition changed?',
      'Does the Agent describe something with the potential to change the Object to the state in the Event?',
      'Start with many trios to capture the scenarios; collapse them later as facts emerge.',
      'A final core diagram normally has 2 to 5 trios.',
      'Time moves left to right: the tree starts with an Agent and an Object and ends with an Event.'],
    'B. Identifying barriers': [
      'Check the management system, Job Risk Analysis and Permit to Work so that all relevant barriers are considered.',
      'Had the Failed Barrier been effective, would it have prevented the next Event? Is it described specifically (the relevant part of a procedure, not its title)?',
      'Missing or Inadequate Barriers are rare. Look for the human error in planning or design and make that the Immediate Cause of a Failed Barrier.',
      'If no barrier can be found for a trio, merge that trio with one that has a barrier.'],
    'C. Identifying Immediate Causes': [
      'Did the Immediate Cause lead to the failure of the barrier?',
      'Who caused the barrier to fail? Only when you know the individuals can you find the Precondition.',
      'Is it close to the Failed Barrier in logic (not necessarily in time or location)?',
      'Does it describe doing, or not doing, something?',
      'There is only one Immediate Cause for each Failed Barrier.',
      'Barrier and Immediate Cause form a duo: if the barrier is worded positively the Immediate Cause is worded negatively.'],
    'D. Identifying Preconditions': [
      'Does it explain why the individual thought the act was normal, acceptable or even commendable?',
      'Does it influence the behaviour of the person whose error led to the Immediate Cause?',
      'If it directly caused the barrier to fail it is an Immediate Cause, not a Precondition.'],
    'E. Identifying Underlying Causes': [
      'Is it a valid reason for the perceptions and beliefs (Preconditions) that led the person to think they were doing the right thing?',
      'Is it a failure at system level, remote in time or location from the event?',
      'Can the organisation take responsibility for it and improve it? If not directly, can it influence those outside who can?',
      'Underlying Causes relate to management systems.'],
    'F. Recommended actions': [
      'SMART: Specific, Measurable, Appropriate, Realistic, Time-based.',
      'Developed by someone within the organisation and agreed by the action party.',
      'Likely to improve the business culture, solve the problem effectively and efficiently, last a long time, and apply beyond the local scene.']
  };

  const SMART = [
    { k: 'S', name: 'Specific', q: 'A clearly identified action, understood and agreed by the action taker.' },
    { k: 'M', name: 'Measurable', q: 'The result can be measured and close-out verified.' },
    { k: 'A', name: 'Appropriate', q: 'It addresses a Failed Barrier or Underlying Cause in the report.' },
    { k: 'R', name: 'Realistic', q: 'Achievable with the resources the organisation has.' },
    { k: 'T', name: 'Time-based', q: 'States the period in which it must be completed.' }
  ];

  const GLOSSARY = [
    ['Agent of Change', 'Anything with the potential to change, harm or damage an object upon which it is acting.'],
    ['Barrier', 'A measure which reduces the probability of releasing an Agent’s potential for harm and of reducing its consequences.'],
    ['Basic Risk Factors', 'A system for categorising Underlying Causes: an indicator of the part of a management system where a failure exists, and by implication where the remedy lies.'],
    ['Core Diagram', 'A Tripod Beta tree containing only the Agent-Object-Event trios.'],
    ['Effective Barrier', 'A barrier that was effective in restoring control or preventing further consequential injury or damage following an actual event.'],
    ['Errors', 'Actions by people which result in the Immediate Cause of a Failed Barrier.'],
    ['Event', 'An unplanned and unwanted happening involving the release or exposure of an Agent of Change.'],
    ['Failed Barrier', 'A Barrier rendered ineffective by an Immediate Cause.'],
    ['Immediate Cause', 'An action, omission or occurrence that causes a barrier to fail: sub-standard acts by people and, by exception, sub-standard conditions. Close to the failed barrier in time, space or causal relationship.'],
    ['Inadequate Barrier', 'A Barrier established by the organisation which failed not because of an Immediate Cause but because of its inadequacy. Treated as a Missing Barrier.'],
    ['Lapse', 'Omission or repetition of a planned action, possibly caused by memory failure.'],
    ['Missing Barrier', 'A barrier identified by the organisation as a control measure but not established. Treated as an Inadequate Barrier.'],
    ['Object', 'The item harmed (injured, damaged or lost) or changed by an Agent of Change.'],
    ['Precondition', 'The environmental, situational or psychological system states or states of mind that cause or promote Immediate Causes.'],
    ['Slip', 'Unintended deviation from a correct plan of action, possibly caused by attention failure or mistiming.'],
    ['Sub-standard Act', 'An action, error or omission by a person that causes a barrier to fail.'],
    ['Sub-standard Condition', 'A technical condition that makes a barrier fail, not attributable to an erroneous human action.'],
    ['Trio', 'The linked combination of an Agent of Change, an Object and an Event. Trios link through Event-Agent or Event-Object nodes.'],
    ['Underlying Cause', 'The organisational deficiency or anomaly creating the Precondition that caused or influenced an Immediate Cause.']
  ];

  /* ---- Annex 8 worked example: vehicle roll-over ------------------------- */
  const N = (id, type, label, extra) => Object.assign({ id, type, label, notes: '', evidence: '', verified: true }, extra || {});
  const EXAMPLE = {
    id: 'example-annex8', example: true, version: 1,
    meta: {
      title: 'Driver injured in vehicle roll-over on delivery run', ref: 'TB-EX-08', date: '2026-03-12', time: '08:00 to 18:30',
      location: 'Remote delivery route, 40 km from the Area Production Centre', site: 'Area Production Centre, Logistics', client: 'Worked example (Tripod Beta User Guide, Annex 8)',
      incidentType: 'People', actualSeverity: 4, potentialSeverity: 5, status: 'Final', practitioner: 'Course facilitator',
      description: 'A driver delivering goods to a remote location left the Area Production Centre on schedule at 08:00 and was due back at 12:30. His failure to return was not reported until 15:00. A search along his Journey Management route started at 16:30 without success; he was found off the designated route at 18:30. The vehicle had left the road and rolled over. Local villagers had pulled the driver from the vehicle while he waited for rescue; doctors believe this contributed to a spinal injury that will probably cause permanent disability.',
      summary: 'Five trios describe the incident, from the need to transport goods to the permanent disability of the driver. Seven barriers failed. The Tripod causation paths point to weaknesses in journey management, driver fitness and rest control, driver training, seat-belt enforcement and emergency response staffing.',
      lessons: 'Journey management must cover driver fitness and rest, not only the route.\nUrgency on transport requisitions should be challenged and loads combined.\nSeat-belt use is a company rule regardless of local law and must be enforced from induction onwards.',
      reviewer: '', reviewDate: '', logo: ''
    },
    team: [
      { name: 'Lead investigator (Tripod Beta Practitioner)', role: 'Team leader' },
      { name: 'Logistics superintendent', role: 'Process knowledge' },
      { name: 'HSE adviser', role: 'Investigator' },
      { name: 'Driver representative', role: 'Workforce representative' }
    ],
    nodes: [
      N('a1', 'agent', 'Need for transportation of goods'),
      N('o1', 'object', 'Vehicle in parking lot'),
      N('eo1', 'eventObject', 'Vehicle on the road'),
      N('b1', 'failed', 'Combining load with other loads'),
      N('b2', 'failed', 'Stop non-rested driver to drive'),
      N('a2', 'agent', 'Sideways forces on vehicle from wind or convex road'),
      N('b3', 'failed', 'Alert and correct steering'),
      N('ea2', 'eventAgent', 'Tyres hit shoulder of road'),
      N('o3', 'object', 'Vehicle stability'),
      N('b4', 'failed', 'Correct reaction on hitting shoulder of road'),
      N('ea3', 'eventAgent', 'Roll-over of vehicle'),
      N('o4', 'object', 'Driver'),
      N('b5', 'failed', 'Use of seatbelt'),
      N('eo4', 'eventObject', 'Driver with back injury', { mainEvent: true }),
      N('a5', 'agent', '(potential for) Incorrect extraction of driver'),
      N('b7', 'failed', 'Effective search'),
      N('b6', 'failed', 'Rapid mobilisation of search team'),
      N('e5', 'event', 'Permanent disability from spinal injury'),

      N('ic1', 'ic', 'Journey manager misses opportunity to combine loads', { act: 'act', errorType: 'mistakeKnow', notes: 'A knowledge-based mistake that has become commonplace.' }),
      N('ic2', 'ic', 'Journey manager does not stop non-rested driver', { act: 'act', errorType: 'routine' }),
      N('ic3', 'ic', 'Driver fades on and off behind the wheel', { act: 'act', errorType: 'lapse', notes: 'A lapse and possible violation of the "pull off and stop" policy.' }),
      N('ic4', 'ic', 'Driver over-steers vehicle', { act: 'act', errorType: 'slip', notes: 'An instinctive reaction on waking, difficult to resolve by training alone.' }),
      N('ic5', 'ic', 'Driver refuses to wear seatbelt', { act: 'act', errorType: 'routine', evidence: 'Driver statement; induction trainer interview' }),
      N('ic6', 'ic', 'Emergency team mobilises after 75 minutes', { act: 'act', errorType: 'situational', notes: 'Journey Management Procedure requires a search within 45 minutes of the overdue alert.' }),
      N('ic7', 'ic', 'Search team makes detour before finding crashed vehicle', { act: 'act', errorType: 'uvAwareness' }),

      N('pc1', 'pc', 'Belief that delivery cannot wait', { scope: 'org', notes: 'Requisition stated "immediate"; almost all requests do.' }),
      N('pc2', 'pc', 'Checking driver on fitness not common practice', { scope: 'org' }),
      N('pc3', 'pc', 'Driver believes he is rested with few hours pre-trip sleep', { scope: 'org' }),
      N('pc4', 'pc', 'Driver does not know of the need for a 20 minute nap', { scope: 'org' }),
      N('pc5', 'pc', 'Driver does not know how to steer out of trouble', { scope: 'org' }),
      N('pc6', 'pc', 'Drivers consider use of seatbelts as "childish"', { scope: 'org' }),
      N('pc7', 'pc', 'Control-room operator charged with outdoor duties', { scope: 'org' }),
      N('pc8', 'pc', 'Emergency room team not on call due to company party', { scope: 'org' }),
      N('pc9', 'pc', 'Search team not sure about actual incident site', { scope: 'org' }),

      N('uc1', 'uc', 'Inadequate communication about urgency of the delivery', { brf: 'CO' }),
      N('uc2', 'uc', 'Fitness of drivers is no issue in journey management procedure', { brf: 'PR' }),
      N('uc3', 'uc', 'Resting is not controlled; drivers are on call', { brf: 'OR' }),
      N('uc4', 'uc', 'Too few drivers on this job', { brf: 'IG' }),
      N('uc5', 'uc', 'Company does not require advanced driving course', { brf: 'TR' }),
      N('uc6', 'uc', 'Local culture stimulates "macho driving"', { brf: 'EC' }),
      N('uc7', 'uc', 'Management does not enforce use of seatbelts', { brf: 'IG' }),
      N('uc8', 'uc', 'Shortage of operators due to cost-cutting drive', { brf: 'OR' }),
      N('uc9', 'uc', 'Management does not enforce duty procedures', { brf: 'IG' }),
      N('uc10', 'uc', 'Ineffective tracking system for road transport', { brf: 'DF' }),

      N('n1', 'narrative', 'Vehicle design excluded: fit for purpose, did well in crash tests; rollover write-off is rare (fewer than 1 in 20).')
    ],
    edges: [
      ['a1', 'b1'], ['b1', 'b2'], ['b2', 'eo1'], ['o1', 'eo1'],
      ['a2', 'ea2'], ['eo1', 'b3'], ['b3', 'ea2'],
      ['ea2', 'b4'], ['b4', 'ea3'], ['o3', 'ea3'],
      ['ea3', 'eo4'], ['o4', 'b5'], ['b5', 'eo4'],
      ['a5', 'b7'], ['b7', 'b6'], ['b6', 'e5'], ['eo4', 'e5'],
      ['ic1', 'b1'], ['ic2', 'b2'], ['ic3', 'b3'], ['ic4', 'b4'], ['ic5', 'b5'], ['ic6', 'b6'], ['ic7', 'b7'],
      ['pc1', 'ic1'], ['pc1', 'ic2'], ['pc2', 'ic2'], ['pc3', 'ic3'], ['pc4', 'ic3'], ['pc5', 'ic4'], ['pc6', 'ic5'], ['pc7', 'ic6'], ['pc8', 'ic6'], ['pc9', 'ic7'],
      ['uc1', 'pc1'], ['uc2', 'pc2'], ['uc3', 'pc3'], ['uc4', 'pc3'], ['uc5', 'pc4'], ['uc5', 'pc5'], ['uc6', 'pc6'], ['uc7', 'pc6'], ['uc8', 'pc7'], ['uc9', 'pc8'], ['uc10', 'pc9'],
      ['n1', 'o4']
    ].map((e, i) => ({ id: 'x' + (i + 1), from: e[0], to: e[1] })),
    actions: [
      ['b1', 'Logistics planners to check delivery urgency with the requester before dispatch and combine non-urgent loads with scheduled truck runs.', 'Logistics Superintendent', 30, 'High'],
      ['b2', 'Add a documented driver fitness and rest check to the journey management pre-departure briefing; Journey Manager to stop any driver who fails it.', 'Journey Management owner', 30, 'High'],
      ['b3', 'Brief every driver before departure on fatigue: when drowsy, pull off and take a 20-minute nap. Record the briefing on the Journey Management Plan.', 'Transport Manager', 14, 'High'],
      ['b4', 'Add recovery from running off the road (slow down, steer back gently) to the practical module of the advanced driving course.', 'Training Manager', 90, 'Medium'],
      ['b7', 'Require the planned route to be written on the Journey Management Plan and any deviation to be reported to base before it is taken.', 'Journey Management owner', 30, 'High'],
      ['b5', 'Make seat-belt use a stated condition of driving company vehicles and check it at gate exits for three months.', 'Transport Manager', 14, 'High'],
      ['b6', 'Rehearse overdue-vehicle search mobilisation against the 45-minute target at random times, quarterly.', 'Emergency Response Coordinator', 90, 'Medium'],
      ['uc1', 'Agree delivery priority definitions with customers and hold a monthly delivery planning meeting.', 'Logistics Superintendent', 60, 'Medium'],
      ['uc2', 'Revise the Journey Management Procedure to include driver fitness, rest and alertness criteria.', 'HSE Manager', 60, 'High'],
      ['uc3', 'Introduce duty-hour and minimum-rest rules for drivers and monitor them through the roster.', 'Transport Manager', 90, 'High'],
      ['uc4', 'Review driver numbers against trip demand and recruit or reschedule to remove the shortfall.', 'Operations Manager', 120, 'Medium'],
      ['uc5', 'Require an advanced driving course (alertness, fatigue and vehicle recovery skills) for all drivers.', 'Training Manager', 180, 'Medium'],
      ['uc7', 'Correct the induction material on seat belts and brief all induction trainers on the company rule.', 'HSE Manager', 30, 'High'],
      ['uc6', 'Run a line-manager-led driving culture programme with recognition for compliant driving and visible follow-up of risk-taking.', 'Operations Manager', 120, 'Medium'],
      ['uc9', 'Audit compliance with emergency duty and on-call procedures monthly and report results to the management team.', 'Operations Manager', 60, 'Medium'],
      ['uc8', 'Remove outdoor duties from control-room operators while on emergency watch, or add a relief operator.', 'Operations Manager', 60, 'Medium'],
      ['uc10', 'Fit in-vehicle tracking to field vehicles and monitor positions from the control room.', 'Transport Manager', 180, 'Medium']
    ].map((a, i) => ({ id: 'act' + (i + 1), target: a[0], text: a[1], owner: a[2], due: '+' + a[3], priority: a[4], status: 'Open', smart: { S: true, M: true, A: true, R: true, T: true }, agreed: true, closeNote: '' })),
    log: []
  };

  EXAMPLE.exampleNote = 'The vehicle roll-over case from Annex 8 of the Tripod Beta User Guide, read only.';

  /* ---- Training case: drowning at a return-water dam (anonymised, based on a real event) ----------
     Learner version: core diagram (four trios) and a pre-filled evidence plan only. Learners add the barriers and the
     causation paths in a practice copy. The full answer is facilitator material (facilitator/dam_full.js), not in the app. */
  const I = (cat, item, source, purpose, priority, method) => ({ cat, item, source, purpose, priority, method, status: 'To collect' });
  const PH = (subject, position, view, purpose) => ({ subject, position, view, purpose, taken: false });
  const TS = (statement, kind, evidence, node) => ({ statement, kind, evidence, status: 'Untested', node: node || '' });
  const DAM = {
    id: 'example-dam-drowning', example: true, version: 1,
    exampleNote: 'Training case (anonymised, based on a real event): the core diagram and evidence plan are given. Make a practice copy, then add the barriers, Immediate Causes, Preconditions, Underlying Causes and actions.',
    meta: {
      title: 'Contractor worker drowned at an overflowing return-water dam', ref: 'TB-EX-09', date: '2026-02-14', time: 'about 15:40',
      location: 'North return-water dam and pump installation', site: 'Ridgeview Vanadium Mine (fictional), Mpumalanga', client: 'Training case study (anonymised; based on a real event)',
      incidentType: 'People', actualSeverity: 5, potentialSeverity: 5, status: 'Draft', practitioner: '',
      description: 'After heavy rain higher up in the catchment, the mine\'s north return-water dam rose quickly and began to overflow. The mine became aware of the rising level too late, and the pump installation at the dam was being flooded. The engineering manager asked the owner of a small contracting company working on site to help save the pumps. The contractor brought three of his workers, none of whom had done work on water before. Two of them took an old boat that had been stored on site unused for many years to reach the flooded equipment, while the third held a line from the bank. The current and wind pushed the boat away faster than the shore attendant could hold it, and it drifted towards the high overflow. Afraid of being carried over the wall, the two workers left the boat to reach the bank. They underestimated the distance to the dam side and their work clothes and boots hampered them. One worker reached the bank; the other, who could not swim, drowned. There was no pre-task risk assessment or job plan, no life jackets or rescue equipment at the dam, and the workers had no training for work on or near water, water rescue or first aid for drowning.',
      summary: '', lessons: '', reviewer: '', reviewDate: '', logo: ''
    },
    team: [
      { name: 'Lead investigator (Tripod Beta practitioner)', role: 'Team leader' },
      { name: 'Engineering superintendent (not involved in the event)', role: 'Process knowledge: dam and pumps' },
      { name: 'Contractor management officer', role: 'Contractor process' },
      { name: 'Workforce safety representative', role: 'Workforce representative' }
    ],
    nodes: [
      N('d_a1', 'agent', 'Heavy rainfall higher up in the dam\'s catchment area'),
      N('d_o1', 'object', 'North return-water dam and its pump installation'),
      N('d_ea1', 'eventAgent', 'Dam overflows with strong flow towards the spillway; pump installation flooded', { notes: 'The mine became aware of the rising level too late. The time of the first alert is not yet known.' }),
      N('d_o2', 'object', 'Old boat with two contractor workers on the dam, held by a line from the bank'),
      N('d_ea2', 'eventAgent', 'Boat drifts out of control towards the overflowing spillway', { verified: false, notes: 'Current and wind direction reported by the shore attendant; not measured.' }),
      N('d_o3', 'object', 'Two contractor workers in the boat (non-swimmers, in work clothes and boots)'),
      N('d_eo3', 'eventObject', 'Workers leave the boat and enter the water', { verified: false, notes: 'Shore attendant\'s account only. Whether they jumped or were thrown out is not confirmed.' }),
      N('d_a4', 'agent', 'Deep, moving water between the boat and the bank'),
      N('d_e4', 'event', 'One worker drowns; the other reaches the bank', { mainEvent: true }),
      N('d_n1', 'narrative', 'Evidence is sparse: no dam drawings, measurements, positions of the boat and people, or wind direction yet. Treat distances and timings as assumed until surveyed.')
    ],
    edges: [['d_a1', 'd_ea1'], ['d_o1', 'd_ea1'], ['d_ea1', 'd_ea2'], ['d_o2', 'd_ea2'], ['d_ea2', 'd_eo3'], ['d_o3', 'd_eo3'], ['d_eo3', 'd_e4'], ['d_a4', 'd_e4'], ['d_n1', 'd_ea2']]
      .map((e, i) => ({ id: 'dx' + (i + 1), from: e[0], to: e[1] })),
    actions: [],
    evidence: {
      useTree: true, source: 'Worked example', generatedAt: '2026-02-15T08:00:00.000Z',
      narrative: 'On the afternoon of 14 February, after heavy rain higher up in the catchment, the north return-water dam rose fast and started to overflow. As far as I can tell the control room only noticed when the pump installation was already being flooded; I assume there was no warning from upstream. The engineering manager phoned the owner of the civils contractor who was on site for other work and asked him to help get the pumps out. I believe this was a one-off request in the emergency, but contractors here are often asked to do odd jobs outside their scope because the contractor process is slow.\n\nThe contractor brought three of his workers. Two of them went out in an old aluminium boat that had been lying behind the pump station for years; nobody I spoke to knows when it was last used or checked. The third worker stayed on the bank holding a rope tied to the boat. The shore attendant says the current and the wind pushed the boat towards the spillway and the rope was pulled out of his hands. The two in the boat probably panicked when they saw they were heading for the overflow wall, and they went into the water to swim to the bank. One of them made it to the bank; the other could not swim and drowned. I think they misjudged the distance to the bank, which looks like 15 to 20 m, and their overalls and safety boots would have dragged them down. The surviving worker was taken to hospital and has not been interviewed yet. There were no life jackets, ring buoys or throw lines at the dam. Nobody did a risk assessment or planned the job, and as far as we know none of them had any training for working on water, rescue or first aid for drowning.\n\nWhat we do not have yet: drawings of the dam with depths and levels, the spillway height, the positions of the boat and the people, the time line of the alarm and the phone calls, and the wind direction and speed at the time.',
      notes: 'The scene changes fast once the dam level drops: survey the water line, the debris line and the boat position first. Secure the control room level records, phone records and any CCTV today. Interview the shore attendant, the contractor owner and the engineering manager separately and as soon as possible, and record the time line before anything else.',
      items: [
        I('position', 'Surveyed plan and cross-section of the dam: depths, water levels, spillway crest height, pump station position and the bank where the line was held', 'Survey team; dam design drawings', 'There are no drawings or measurements yet; needed for distances and the drift path', 'Urgent', 'Measure'),
        I('position', 'Flood debris line and high-water marks around the dam, spillway and pump station', 'Dam walls and banks', 'Fixes the peak level; disappears as the water drops', 'Urgent', 'Measure'),
        I('position', 'Position where the boat was found, where the line was held, and where the surviving worker came ashore and where the deceased was recovered, with distances', 'Recovery team; shore attendant; police', 'Reconstructs the drift path and the swim distance (assumed 15 to 20 m)', 'Urgent', 'Measure'),
        I('position', 'Wind direction and speed, and flow at the spillway at the time', 'Site weather station; national weather service; pump records', 'Tests the account that current and wind pushed the boat', 'Urgent', 'Download'),
        I('people', 'Interview the surviving worker (separately, as soon as medically fit)', 'Surviving worker; hospital', 'The only person who was in the boat: why they left it, what they could see, how he reached the bank', 'Urgent', 'Interview'),
        I('people', 'Interview the shore attendant (separately, as soon as fit)', 'Shore attendant', 'Eyewitness from the bank to the drift and to the workers leaving the boat', 'Urgent', 'Interview'),
        I('people', 'Interview the contractor owner', 'Contractor owner', 'What was asked, what he agreed to, how the boat was chosen, briefing given', 'Urgent', 'Interview'),
        I('people', 'Interview the engineering manager', 'Engineering manager', 'Why the request was made, what alternatives were considered, who else knew', 'Urgent', 'Interview'),
        I('people', 'Interview the control room operator(s) on shift', 'Control room', 'When the rising level and the flooding were first noticed and reported', 'Urgent', 'Interview'),
        I('people', 'Interview the recovery and emergency team and the first responders', 'Emergency team; security', 'Response times, rescue equipment available, first aid given', 'High', 'Interview'),
        I('people', 'Post-mortem results and medical reports', 'SAPS; mortuary; clinic', 'Confirms cause of death; any other factors', 'High', 'Request copy'),
        I('parts', 'The boat: quarantine it; record condition, leaks, oars or motor, capacity plate, rope attachment point', 'Recovery site', 'Was the boat fit for use? Was it ever inspected?', 'Urgent', 'Preserve'),
        I('parts', 'The rope or line used from the bank: length, type, condition, how it was held or tied', 'Recovery site; shore attendant', 'Tests whether the shore control could ever have held the boat', 'Urgent', 'Preserve'),
        I('parts', 'Clothing, boots and PPE worn by both workers in the boat', 'SAPS; mortuary; family', 'Tests the account that PPE hampered swimming; compare survivor and deceased', 'High', 'Collect'),
        I('parts', 'Any life jackets, ring buoys or throw lines anywhere on site, and where they are kept', 'Stores; emergency team', 'Was life-saving equipment available at all?', 'High', 'Observe'),
        I('paper', 'Dam operating manual or procedure, including flood trigger levels and the emergency plan for the dam', 'Engineering; document control', 'Was a flood response defined?', 'High', 'Request copy'),
        I('paper', 'Contract, scope of work, site appointment and induction records of the contractor and the two workers', 'Contractor management office', 'Tests scope creep: was this work within the contract?', 'High', 'Request copy'),
        I('paper', 'Records of other jobs asked of contractors outside their scope in the last 12 months', 'Contractor management office; purchase orders; job cards', 'Tests the belief that scope creep is routine', 'Normal', 'Request copy'),
        I('paper', 'Contractor management procedure and how long onboarding and approval normally take', 'Contractor management office', 'Tests "the contractor process is slow"', 'Normal', 'Request copy'),
        I('paper', 'Any risk assessment, permit or job plan for the task, and the site rule for work on or near water', 'SHE office; permit office', 'Confirms that no pre-task risk assessment was done', 'High', 'Request copy'),
        I('paper', 'Training records of the contractor and workers: water safety, rescue, first aid, swimming ability', 'Contractor; training department', 'Tests the account that nobody was trained', 'High', 'Request copy'),
        I('paper', 'Asset or stores records for the old boat: when it came to site, last use, any inspection', 'Stores; engineering', 'Why was an unused boat available for use?', 'Normal', 'Request copy'),
        I('paper', 'Previous incidents, near misses or audit findings for the dam, the pump station or work on water', 'SHE incident database', 'Was the risk known before?', 'Normal', 'Request copy'),
        I('electronic', 'Dam level, pump and alarm logs (SCADA/telemetry) for the day', 'Control room; engineering', 'Time line: when the level rose and when the alarm (if any) went off', 'Urgent', 'Download'),
        I('electronic', 'Phone and radio records of the calls between the control room, engineering manager and contractor owner', 'IT; mobile records; radio logs', 'Time line of the request and the response', 'Urgent', 'Download'),
        I('electronic', 'Rainfall data for the upper catchment for the 24 hours before (weather service, upstream gauges)', 'Weather service; water authority', 'Tests the assumption that no upstream warning was available', 'High', 'Download'),
        I('electronic', 'CCTV covering the dam, pump station or access road', 'Security', 'Independent record of the boat drift and the time line', 'Urgent', 'Download'),
        I('electronic', 'Photos or videos taken by anyone on site during the event, on phones', 'Witnesses; recovery team', 'May show positions, conditions and wind', 'High', 'Collect')
      ].map(o => Object.assign({ owner: '', due: '', ref: '', notes: '' }, o)),
      photos: [
        PH('Overview of the whole dam from the highest point available', 'Elevated point above the dam (or drone)', 'Elevated / aerial', 'Dam, spillway, pump station, bank where the line was held, and where the boat ended up'),
        PH('Overview from the bank where the line was held, looking towards the spillway', 'At the shore attendant\'s position', 'Overview', 'What the shore attendant saw; distance to the spillway'),
        PH('Overview from the spillway back towards the pump station', 'On the spillway side, safely back from the edge', 'Overview', 'The drift path in reverse'),
        PH('Overview of the pump installation and the flooded equipment', 'From the access road', 'Overview', 'What the job was meant to recover'),
        PH('Spillway crest and the drop on the downstream side', 'Beside the spillway, and from downstream', 'Mid-range', 'Height of the wall the workers feared going over'),
        PH('Flood debris line and high-water marks, with a scale', 'At the pump station and on the dam wall', 'Detail with scale', 'Peak water level'),
        PH('Where the line was held or tied on the bank', 'Close to the bank', 'Mid-range', 'Anchor point, ground conditions, footing for the attendant'),
        PH('Distance from the boat\'s last position to the nearest bank (with a person or pole for scale)', 'From the bank', 'Mid-range', 'The swim distance the workers misjudged'),
        PH('The boat as recovered, all four sides', 'Around the boat on land', 'Overview', 'General condition'),
        PH('Boat details: capacity plate, hull damage or leaks, rope attachment, oars', 'Close up', 'Detail with scale', 'Fitness for use'),
        PH('Rope or line used, laid out full length with a tape', 'On a clean surface', 'Detail with scale', 'Length, type and condition'),
        PH('Where the boat was stored before the event', 'Behind the pump station', 'Mid-range', 'How accessible and uncontrolled it was'),
        PH('Clothing, boots and PPE of the workers', 'On a neutral background', 'Detail with scale', 'Type and weight of clothing; any buoyancy'),
        PH('Location of the nearest life-saving equipment (or its absence) at the dam', 'At the dam access points', 'Mid-range', 'Shows no ring buoy or throw line at the dam'),
        PH('Signs and access control at the dam (warnings, fences, gates)', 'At each access point', 'Mid-range', 'Whether access to the water was controlled'),
        PH('Weather station or wind indicator, and the sky and water surface conditions on the day after', 'At the weather station; across the dam', 'Mid-range', 'Supports the wind and current account')
      ].map(o => Object.assign({ ref: '', notes: '' }, o)),
      tests: [
        TS('There was no early warning of the inflow from the upper catchment', 'Assumption', 'Weather service and upstream gauge data; control room log; any flood warning sent'),
        TS('The control room noticed the rising level only when the pumps were already flooding', 'Assumption', 'SCADA level and alarm log; control room interview; time line'),
        TS('The request to the contractor was a one-off decision in the emergency (exceptional violation)', 'Conclusion', 'Engineering manager and contractor owner interviews; phone records'),
        TS('Contractors are routinely asked to do work outside their scope because the contractor process is slow (routine scope creep)', 'Assumption', 'Records of out-of-scope jobs; contractor management procedure and approval times; interviews with other contractors'),
        TS('The boat had not been used or inspected for years', 'Assumption', 'Stores and asset records; boat condition; interviews'),
        TS('The current and wind pushed the boat faster than the shore attendant could hold it', 'Assumption', 'Wind data; spillway flow; rope condition and anchor; shore attendant interview; phone video', 'd_ea2'),
        TS('The workers left the boat because they feared going over the spillway', 'Assumption', 'Surviving worker and shore attendant accounts; position of the boat when found; any video', 'd_eo3'),
        TS('The swim distance to the bank was 15 to 20 m', 'Open question', 'Survey of the boat position and the bank', ''),
        TS('Their clothing and boots hampered swimming', 'Assumption', 'Clothing and boots recovered; post-mortem; expert opinion'),
        TS('The worker who drowned could not swim; none of them had water-safety, rescue or first-aid training', 'Assumption', 'Training records; surviving worker, contractor and family interviews'),
        TS('How the surviving worker reached the bank (swam, held the boat, was pulled out?)', 'Open question', 'Surviving worker and shore attendant interviews; recovery team'),
        TS('No risk assessment, permit or job plan was made for the task', 'Conclusion', 'Permit office and SHE records; interviews'),
        TS('No life jackets, ring buoys or throw lines were available at the dam', 'Conclusion', 'Site inspection; stores records; emergency team interview')
      ]
    },
    log: []
  };
  const EXAMPLES = [EXAMPLE, DAM];

  return { TYPES, PALETTE, BRF, ERRORS, OBJECT_KINDS, STAGES, TIPS, SMART, GLOSSARY, EXAMPLE, DAM, EXAMPLES };
})();
if (typeof module !== 'undefined') module.exports = TBC;
