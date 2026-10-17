/* Tripod Beta tree rules (User Guide Annex 5 + 6) and quality checks (Annex 2, section 6.5/6.6).
   Pure functions over a case: { nodes:[{id,type,...}], edges:[{id,from,to}], actions:[{target,...}] }.
   Edges always run cause -> effect: Agent/Object -> Barrier -> Event, IC -> Failed Barrier, PC -> IC, UC -> PC or Missing/Inadequate Barrier. */
var TBR = (function () {
  const AGENTISH = { agent: 1, eventAgent: 1 };
  const OBJECTISH = { object: 1, eventObject: 1 };
  const EVENTS = { event: 1, eventAgent: 1, eventObject: 1 };
  const BARRIERS = { failed: 1, missing: 1, inadequate: 1, effective: 1 };
  const SOURCES = { agent: 1, object: 1, eventAgent: 1, eventObject: 1 };
  const ACTIONABLE = { failed: 1, missing: 1, inadequate: 1, uc: 1 };

  const isEvent = t => !!EVENTS[t], isBarrier = t => !!BARRIERS[t];
  const isTraj = t => !!(SOURCES[t] || BARRIERS[t]);
  const edgeKind = (ft, tt) => {
    if (ft === 'narrative' || tt === 'narrative') return 'note';
    if (ft === 'pc' && tt === 'ic') return 'probable';
    if (ft === 'ic' || ft === 'pc' || ft === 'uc') return 'cause';
    return 'trajectory';
  };

  /* Which connections the canvas allows. Returns {ok, reason}. */
  function canConnect(ft, tt) {
    if (ft === 'narrative' || tt === 'narrative') return { ok: true };
    if (tt === 'agent' || tt === 'object') return { ok: false, reason: 'Agents and Objects have no inputs. They are the start of a trajectory.' };
    if (tt === 'uc') return { ok: false, reason: 'An Underlying Cause is an end node; nothing feeds into it.' };
    if (ft === 'event') return { ok: false, reason: 'A plain Event is the end of a trio. To carry it into the next trio, change it to an Event-Agent or Event-Object.' };
    if (SOURCES[ft] || BARRIERS[ft]) {
      if (BARRIERS[tt] || EVENTS[tt]) return { ok: true };
      return { ok: false, reason: 'A trajectory runs from an Agent or Object, through Barriers, to an Event.' };
    }
    if (ft === 'ic') {
      if (tt === 'failed') return { ok: true };
      if (tt === 'missing' || tt === 'inadequate') return { ok: false, reason: 'A Missing or Inadequate Barrier has no Immediate Cause; link it to an Underlying Cause. If someone can be identified who should have provided it, make it a Failed Barrier.' };
      if (tt === 'effective') return { ok: false, reason: 'An Effective Barrier did not fail, so it has no causation path.' };
      return { ok: false, reason: 'An Immediate Cause links to the Failed Barrier it defeated.' };
    }
    if (ft === 'pc') {
      if (tt === 'ic') return { ok: true };
      if (BARRIERS[tt]) return { ok: false, reason: 'A Precondition links to an Immediate Cause, not directly to a barrier.' };
      return { ok: false, reason: 'A Precondition links to the Immediate Cause it promoted.' };
    }
    if (ft === 'uc') {
      if (tt === 'pc' || tt === 'missing' || tt === 'inadequate') return { ok: true };
      if (tt === 'ic') return { ok: false, reason: 'An Underlying Cause links to a Precondition, which in turn links to the Immediate Cause.' };
      if (tt === 'failed') return { ok: false, reason: 'A Failed Barrier must be linked through an Immediate Cause. Use a Missing or Inadequate Barrier if nobody could have prevented the failure.' };
      if (tt === 'effective') return { ok: false, reason: 'An Effective Barrier did not fail, so it has no causation path.' };
      return { ok: false, reason: 'An Underlying Cause links to a Precondition or to a Missing/Inadequate Barrier.' };
    }
    return { ok: false, reason: 'These two elements cannot be linked.' };
  }

  /* Try both directions; returns {ok, from, to, reason}. */
  function orient(a, b) {
    if (a.id === b.id) return { ok: false, reason: 'A node cannot link to itself.' };
    const f = canConnect(a.type, b.type);
    if (f.ok) return { ok: true, from: a.id, to: b.id };
    const r = canConnect(b.type, a.type);
    if (r.ok) return { ok: true, from: b.id, to: a.id };
    return { ok: false, reason: f.reason };
  }

  function index(c) {
    const byId = {}, ins = {}, outs = {};
    c.nodes.forEach(n => { byId[n.id] = n; ins[n.id] = []; outs[n.id] = []; });
    c.edges.forEach(e => { if (byId[e.from] && byId[e.to]) { outs[e.from].push(e); ins[e.to].push(e); } });
    const inN = (id, pred) => ins[id].map(e => byId[e.from]).filter(n => n && n.type !== 'narrative' && (!pred || pred(n)));
    const outN = (id, pred) => outs[id].map(e => byId[e.to]).filter(n => n && n.type !== 'narrative' && (!pred || pred(n)));
    return { byId, ins, outs, inN, outN };
  }

  /* Walk upstream through barriers to the source of a trajectory. */
  function trajectoryOrigin(ix, id, seen) {
    seen = seen || {};
    let n = ix.byId[id], path = [];
    while (n && BARRIERS[n.type]) {
      if (seen[n.id]) return { origin: null, barriers: path, loop: true };
      seen[n.id] = 1; path.push(n);
      const up = ix.inN(n.id, m => isTraj(m.type));
      if (up.length !== 1) return { origin: null, barriers: path };
      n = up[0];
    }
    return { origin: n || null, barriers: path };
  }

  /* For each event-type node: its agent-side and object-side inputs with the barriers on them. */
  function trios(c, ix) {
    ix = ix || index(c);
    return c.nodes.filter(n => EVENTS[n.type]).map(ev => {
      const inputs = ix.inN(ev.id, m => isTraj(m.type)).map(m => {
        const t = trajectoryOrigin(ix, m.id);
        const side = t.origin ? (AGENTISH[t.origin.type] ? 'agent' : OBJECTISH[t.origin.type] ? 'object' : null) : null;
        return { side, origin: t.origin, barriers: t.barriers.slice().reverse(), loop: t.loop };
      });
      const agents = inputs.filter(i => i.side === 'agent'), objects = inputs.filter(i => i.side === 'object');
      const allBarriers = inputs.reduce((a, i) => a.concat(i.barriers), []);
      const potential = allBarriers.some(b => b.type === 'effective');
      return { event: ev, inputs, agents, objects, barriers: allBarriers, potential };
    });
  }

  function findCycle(c, ix) {
    const color = {}; let hit = null;
    const visit = id => {
      color[id] = 1;
      for (const e of ix.outs[id]) {
        if (hit) return;
        if (color[e.to] === 1) { hit = e.to; return; }
        if (!color[e.to]) visit(e.to);
      }
      color[id] = 2;
    };
    c.nodes.forEach(n => { if (!color[n.id] && !hit) visit(n.id); });
    return hit;
  }

  /* Underlying Causes reachable from an Immediate Cause through its Preconditions. */
  function ucsOfIC(ix, icId) {
    const out = [];
    ix.inN(icId, m => m.type === 'pc').forEach(pc => ix.inN(pc.id, m => m.type === 'uc').forEach(u => { if (out.indexOf(u) < 0) out.push(u); }));
    return out;
  }

  /* Causation path for a barrier: {ic, pcs:[{pc, ucs}], ucs(direct)} */
  function pathOf(c, barrierId, ix) {
    ix = ix || index(c);
    const b = ix.byId[barrierId];
    if (!b) return null;
    if (b.type === 'failed') {
      const ic = ix.inN(b.id, m => m.type === 'ic')[0] || null;
      const pcs = ic ? ix.inN(ic.id, m => m.type === 'pc').map(pc => ({ pc, ucs: ix.inN(pc.id, m => m.type === 'uc') })) : [];
      return { barrier: b, ic, pcs, ucs: [] };
    }
    return { barrier: b, ic: null, pcs: [], ucs: ix.inN(b.id, m => m.type === 'uc') };
  }

  const GENERIC = /^(procedures?|ptw|permit( to work)?|training|ppe|risk assessments?|supervision|jsa|jha|jra|induction|signage|inspection|maintenance|guarding|competence)$/i;

  function check(c) {
    const ix = index(c), I = [];
    const add = (sev, code, ids, msg, ref) => I.push({ sev, code, ids: [].concat(ids), msg, ref: ref || '' });
    const nm = n => '“' + ((n.label || '').trim() || '(no label)') + '”';
    const T = c.nodes.length;

    if (!T) { add('tip', 'Q0', [], 'The tree is empty. Start with the Main Event, then add the Object it changed and the Agent that changed it.', 'Annex 2 A1'); return I; }

    const cyc = findCycle(c, ix);
    if (cyc) add('error', 'T1', [cyc], 'The tree contains a loop through ' + nm(ix.byId[cyc]) + '. Links must run one way, from cause to effect.', 'Annex 6');

    c.edges.forEach(e => {
      const f = ix.byId[e.from], t = ix.byId[e.to];
      if (!f || !t) return;
      const ok = canConnect(f.type, t.type);
      if (!ok.ok) add('error', 'L1', [f.id, t.id], 'Invalid link from ' + TYPE_NAME(f.type) + ' ' + nm(f) + ' to ' + TYPE_NAME(t.type) + ' ' + nm(t) + '. ' + ok.reason, 'Annex 6');
    });

    const tr = trios(c, ix);
    tr.forEach(t => {
      const ev = t.event;
      if (t.agents.length !== 1) add('error', 'E1', [ev.id], TYPE_NAME(ev.type) + ' ' + nm(ev) + ' needs exactly one Agent of Change input; it has ' + t.agents.length + '.', 'Annex 6.1 A–C');
      if (t.objects.length !== 1) add('error', 'E2', [ev.id], TYPE_NAME(ev.type) + ' ' + nm(ev) + ' needs exactly one Object input; it has ' + t.objects.length + '.', 'Annex 6.1 A–C');
      t.inputs.filter(i => !i.side && !i.loop).forEach(i => { const b = i.barriers[0]; if (b) add('error', 'E3', [b.id, ev.id], 'The trajectory into ' + nm(ev) + ' through ' + nm(b) + ' does not start at an Agent or Object.', 'Annex 5'); });
      if (!t.barriers.length && t.inputs.length) add('warning', 'Q2', [ev.id], 'No barrier on either trajectory into ' + nm(ev) + '. If no barrier can be found for a trio, merge it with a trio that has one.', 'Annex 2 B11');
      if (ev.type !== 'event' && !ix.outN(ev.id).length) add('warning', 'E4', [ev.id], TYPE_NAME(ev.type) + ' ' + nm(ev) + ' does not act on a later Event. Link it on, or change it to a plain Event.', 'Annex 5');
    });
    const nTrio = tr.length;
    if (nTrio && (nTrio < 2 || nTrio > 5)) add('tip', 'Q1', [], 'The core diagram has ' + nTrio + ' trio' + (nTrio === 1 ? '' : 's') + '. A final core diagram normally has 2 to 5; ' + (nTrio < 2 ? 'look for prior and subsequent events.' : 'consider collapsing trios that add little.'), 'Annex 2 A6');

    c.nodes.forEach(n => {
      const ins = ix.inN(n.id), outs = ix.outN(n.id);
      const label = (n.label || '').trim();
      if (n.type !== 'narrative' && !label) add('warning', 'Q4', [n.id], 'A ' + TYPE_NAME(n.type) + ' has no description.', '');
      if (n.type !== 'narrative' && !ins.length && !outs.length && T > 1) add('warning', 'Q5', [n.id], TYPE_NAME(n.type) + ' ' + nm(n) + ' is not linked to anything.', '');
      switch (n.type) {
        case 'agent': case 'object':
          if (outs.length && !reachesEvent(ix, n.id)) add('error', 'A1', [n.id], TYPE_NAME(n.type) + ' ' + nm(n) + ' does not reach an Event. A trajectory must end at an Event.', 'Annex 5');
          break;
        case 'failed': case 'missing': case 'inadequate': case 'effective': {
          const tin = ins.filter(m => isTraj(m.type)), tout = outs.filter(m => isTraj(m.type) || EVENTS[m.type]);
          if (tin.length !== 1 || tout.length !== 1) add('error', 'B1', [n.id], TYPE_NAME(n.type) + ' ' + nm(n) + ' must sit on one trajectory: one line in from the Agent/Object side and one line out toward the Event (now ' + tin.length + ' in, ' + tout.length + ' out).', 'Annex 5');
          const ics = ins.filter(m => m.type === 'ic'), ucs = ins.filter(m => m.type === 'uc');
          if (n.type === 'failed') {
            if (!ics.length) add('error', 'B2', [n.id], 'Failed Barrier ' + nm(n) + ' has no Immediate Cause. Every Failed Barrier is defeated by exactly one Immediate Cause.', 'Annex 6.3');
            if (ics.length > 1) add('error', 'B3', [n.id].concat(ics.map(m => m.id)), 'Failed Barrier ' + nm(n) + ' has ' + ics.length + ' Immediate Causes. There can only be one.', 'Annex 6.3 C');
          }
          if ((n.type === 'missing' || n.type === 'inadequate') && !ucs.length) add('error', 'B4', [n.id], TYPE_NAME(n.type) + ' ' + nm(n) + ' must be linked to at least one Underlying Cause.', 'Annex 6.2 / 6.4');
          if (label && n.type !== 'effective' && (GENERIC.test(label) || label.split(/\s+/).length < 2)) add('tip', 'Q6', [n.id], 'Describe barrier ' + nm(n) + ' in specific terms: the relevant step of the procedure or the specific control, not its title or type.', 'Annex 2 B9');
          break;
        }
        case 'ic': {
          const fb = outs.filter(m => m.type === 'failed');
          if (!fb.length) add('error', 'I1', [n.id], 'Immediate Cause ' + nm(n) + ' is not linked to a Failed Barrier.', 'Annex 5');
          const pcs = ins.filter(m => m.type === 'pc');
          const reach = ucsOfIC(ix, n.id).length;
          if (!pcs.length || !reach) {
            if ((n.justification || '').trim()) add('tip', 'I2', [n.id], 'Immediate Cause ' + nm(n) + ' has no ' + (!pcs.length ? 'Precondition' : 'Underlying Cause') + '. Justification recorded: ' + n.justification.trim(), 'Annex 6.3 E');
            else if (!pcs.length) add('warning', 'I2', [n.id], 'Immediate Cause ' + nm(n) + ' has no Precondition. Ask why the person thought the act was normal or acceptable. Only an uncontrollable outside party justifies leaving it out: record the reason.', 'Annex 6.3 E');
          }
          if ((n.act || 'act') === 'act' && !n.errorType) add('tip', 'I3', [n.id], 'Classify the error type of ' + nm(n) + ' (slip, lapse, mistake or violation). It points to the likely Preconditions.', 'Annex 3');
          break;
        }
        case 'pc': {
          if (!outs.filter(m => m.type === 'ic').length) add('error', 'P1', [n.id], 'Precondition ' + nm(n) + ' is not linked to an Immediate Cause.', 'Annex 5');
          if ((n.scope || 'org') === 'org' && !ins.filter(m => m.type === 'uc').length) add('error', 'P2', [n.id], 'Organisational Precondition ' + nm(n) + ' needs an Underlying Cause. If it is outside the company’s influence (a natural phenomenon, for example), mark it as external.', 'Annex 5');
          break;
        }
        case 'uc': {
          if (!outs.filter(m => m.type === 'pc' || m.type === 'missing' || m.type === 'inadequate').length) add('error', 'U1', [n.id], 'Underlying Cause ' + nm(n) + ' is not linked to a Precondition or a Missing/Inadequate Barrier.', 'Annex 6.6');
          if (!n.brf) add('warning', 'U2', [n.id], 'Assign a Basic Risk Factor to Underlying Cause ' + nm(n) + '.', 'Annex 4');
          break;
        }
      }
    });

    const acts = c.actions || [];
    c.nodes.filter(n => ACTIONABLE[n.type]).forEach(n => {
      if (!acts.some(a => a.target === n.id && a.status !== 'Cancelled')) add('warning', 'R1', [n.id], 'No recommended action yet for ' + TYPE_NAME(n.type) + ' ' + nm(n) + '. Each Failed or Missing Barrier and each Underlying Cause should have at least one.', '6.5');
    });
    acts.forEach(a => {
      const t = ix.byId[a.target];
      if (!t) add('warning', 'R2', [], 'Action “' + (a.text || '').slice(0, 60) + '” is not linked to a barrier or Underlying Cause in the tree.', '6.6');
      else if (!ACTIONABLE[t.type]) add('warning', 'R2', [t.id], 'Action “' + (a.text || '').slice(0, 60) + '” is linked to a ' + TYPE_NAME(t.type) + '. Actions belong on Failed/Missing Barriers or Underlying Causes.', '6.6');
      const sm = a.smart || {};
      const miss = ['S', 'M', 'A', 'R', 'T'].filter(k => !sm[k]);
      if (miss.length || !a.owner || !a.due) add('tip', 'R3', t ? [t.id] : [], 'Action “' + (a.text || '').slice(0, 60) + '”' + (miss.length ? ' is not yet SMART (' + miss.join(', ') + ')' : '') + (!a.owner ? (miss.length ? ';' : '') + ' has no owner' : '') + (!a.due ? ' has no due date' : '') + '.', '6.6');
    });
    const order = { error: 0, warning: 1, tip: 2 };
    return I.sort((a, b) => order[a.sev] - order[b.sev]);
  }

  function reachesEvent(ix, id, seen) {
    seen = seen || {};
    if (seen[id]) return false; seen[id] = 1;
    return ix.outN(id).some(m => EVENTS[m.type] || (BARRIERS[m.type] && reachesEvent(ix, m.id, seen)));
  }

  let TYPE_NAME = t => t;
  function setNames(fn) { TYPE_NAME = fn; }

  return { canConnect, orient, index, trios, pathOf, check, edgeKind, isEvent, isBarrier, isTraj, setNames, ucsOfIC, EVENTS, BARRIERS, SOURCES, ACTIONABLE };
})();
if (typeof module !== 'undefined') module.exports = TBR;
