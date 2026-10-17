/* RCA Fault Tree — engine: evaluation (probability / frequency), evidence conditioning, minimal cut sets,
   consistency checks, tidy top-down layout and SVG drawing. Pure functions; no DOM.
   Case: { meta, root, nodes:{id: node}, actions:[], libOverrides:{itemId: value}, customLib:[items] }
   Node: { id, code, kind:'gate'|'basic'|'undeveloped'|'house', label, gate:'OR'|'AND'|'INHIBIT'|'VOTE', k, children:[ids],
           status:'confirmed'|'likely'|'unverified'|'ruledout', evidence, test, testOwner, testDue, cause, category, why, notes, collapsed,
           prob:{ src, item, value, unit, note } } */
var RCAE = (function () {
  const LIB = (typeof RCALIB !== 'undefined') ? RCALIB : require('./library.js');
  const STATUS = {
    confirmed: { name: 'Confirmed', col: '#1f7a45', soft: '#e3f3e9' },
    likely: { name: 'Likely', col: '#a86200', soft: '#fff1d9' },
    unverified: { name: 'Unverified', col: '#64707e', soft: '#eef1f4' },
    ruledout: { name: 'Ruled out', col: '#b42318', soft: '#f6e3e1' }
  };
  const GATES = { OR: 'OR – any input causes it', AND: 'AND – all inputs needed', INHIBIT: 'INHIBIT – input plus enabling condition', VOTE: 'VOTE – k of n inputs' };
  const KINDS = { gate: 'Intermediate event (gate)', basic: 'Basic event', undeveloped: 'Undeveloped event', house: 'Condition / house event' };
  const CAUSE = { '': 'Not classified', causal: 'Causal factor', root: 'Root cause', contributing: 'Contributing factor' };
  const CATEGORIES = ['Equipment / hardware', 'Human performance', 'Procedures', 'Design / engineering', 'Maintenance', 'Training / competence', 'Organisation / management', 'Communication', 'Work environment', 'External'];

  const isGate = n => n && n.kind === 'gate';
  const kids = (c, n) => ((n && n.children) || []).map(id => c.nodes[id]).filter(Boolean);

  /* ---------- library lookup ---------- */
  function libItem(c, id) {
    if (!id) return null;
    const custom = (c.customLib || []).find(x => x.id === id);
    const base = custom || LIB.ITEMS.find(x => x.id === id);
    if (!base) return null;
    const ov = c.libOverrides && c.libOverrides[id] != null ? +c.libOverrides[id] : null;
    return Object.assign({}, base, { def: base.value, value: ov != null ? ov : base.value, overridden: ov != null });
  }
  function unitOf(c, n) {
    if (!n) return 'p';
    if (isGate(n)) {
      const ks = kids(c, n);
      if (n.gate === 'OR') return ks.length && ks.every(k => unitOf(c, k) === 'f') ? 'f' : (ks.some(k => unitOf(c, k) === 'f') ? 'mixed' : 'p');
      return ks.some(k => { const u = unitOf(c, k); return u === 'f' || u === 'mixed'; }) ? 'f' : 'p';
    }
    const p = n.prob || {};
    if (p.src === 'freq') return 'f';
    if ((p.src === 'manual' || p.src === 'site') && p.unit === 'f') return 'f';
    if (p.src === 'site') { const it = libItem(c, p.item); if (it && it.unit === 'f') return 'f'; }
    return 'p';
  }
  /* The event's own (prior) value, before evidence: NaN when not quantified. */
  function rawValue(c, n) {
    const p = n.prob || {};
    if (n.kind === 'house' && (!p.src || p.src === 'none')) return 1;
    if (!p.src || p.src === 'none') return NaN;
    const v = p.value;
    if (v === '' || v == null || isNaN(+v)) return NaN;
    return +v;
  }

  /* ---------- evaluation ----------
     mode 'prior'    : every event at its own value (what was likely before the investigation)
     mode 'evidence' : ruled out = 0, confirmed probability events = 1, the rest at their value
     force           : {id: value} overrides (used for conditioning). Returns {v, u, err[]} for the node. */
  function evaluate(c, mode, force) {
    const memo = {}, errs = [];
    const val = id => {
      if (memo[id]) return memo[id];
      const n = c.nodes[id]; if (!n) return { v: NaN, u: 'p' };
      const u = unitOf(c, n);
      let r;
      if (force && force[id] != null) r = { v: force[id], u };
      else if (mode === 'evidence' && n.status === 'ruledout') r = { v: 0, u };
      else if (!isGate(n)) {
        if (mode === 'evidence' && n.status === 'confirmed' && u === 'p') r = { v: 1, u };
        else r = { v: rawValue(c, n), u };
      } else {
        const ks = kids(c, n).map(k => val(k.id));
        if (!ks.length) r = { v: NaN, u };
        else if (n.gate === 'OR') {
          const nz = ks.filter(k => k.v !== 0);
          const hasF = nz.some(k => k.u === 'f'), hasP = nz.some(k => k.u === 'p');
          if (hasF && hasP) { errs.push({ id, code: 'U1' }); r = { v: NaN, u: 'mixed' }; }
          else if (hasF) r = { v: nz.some(k => isNaN(k.v)) ? NaN : nz.reduce((a, k) => a + k.v, 0), u: 'f' };
          else if (nz.some(k => k.v >= 1)) r = { v: 1, u: 'p' };
          else r = { v: nz.some(k => isNaN(k.v)) ? NaN : 1 - nz.reduce((a, k) => a * (1 - k.v), 1), u: 'p' };
        } else if (n.gate === 'VOTE') {
          const k = Math.max(1, Math.min(ks.length, +n.k || 2));
          if (ks.some(x => x.u === 'f')) { errs.push({ id, code: 'U3' }); r = { v: NaN, u: 'p' }; }
          else if (ks.some(x => isNaN(x.v))) r = { v: NaN, u: 'p' };
          else { // P(at least k of n)
            let dp = [1]; ks.forEach(x => { const nd = new Array(dp.length + 1).fill(0); dp.forEach((pv, j) => { nd[j] += pv * (1 - x.v); nd[j + 1] += pv * x.v; }); dp = nd; });
            r = { v: dp.slice(k).reduce((a, b) => a + b, 0), u: 'p' };
          }
        } else { // AND, INHIBIT
          if (ks.some(x => x.v === 0)) r = { v: 0, u };
          else {
            const nf = ks.filter(x => x.u === 'f').length;
            if (nf > 1) { errs.push({ id, code: 'U2' }); r = { v: NaN, u: 'f' }; }
            else r = { v: ks.some(x => isNaN(x.v)) ? NaN : ks.reduce((a, x) => a * x.v, 1), u: nf ? 'f' : 'p' };
          }
        }
      }
      memo[id] = r; return r;
    };
    const top = val(c.root);
    return { top, val, errs, memo };
  }

  /* Posterior share for every unresolved node: how likely it is that it contributed, given the top event and the
     evidence so far. Probability nodes: P(X | top) = p(X) * V(top | X=1) / V(top). Frequency nodes (initiators):
     share of the top frequency, (V(top) - V(top | X=0)) / V(top). */
  function posteriors(c) {
    const base = evaluate(c, 'evidence'), V = base.top.v, out = {};
    if (!(V > 0) || isNaN(V)) return { base, out, ok: false };
    const prior = evaluate(c, 'prior');
    walk(c).forEach(({ n }) => {
      if (n.id === c.root || n.status === 'ruledout') return;
      if (n.status === 'confirmed' && unitOf(c, n) === 'p') { out[n.id] = 1; return; }
      const u = unitOf(c, n);
      if (u === 'f') { const v0 = evaluate(c, 'evidence', { [n.id]: 0 }).top.v; out[n.id] = isNaN(v0) ? NaN : (V - v0) / V; }
      else {
        const p = isGate(n) ? evaluate(c, 'evidence').val(n.id).v : rawValue(c, n);
        const pv = n.status === 'confirmed' ? 1 : (isGate(n) ? p : prior.val(n.id).v);
        const vt = evaluate(c, 'evidence', { [n.id]: 1 }).top.v;
        out[n.id] = (isNaN(pv) || isNaN(vt)) ? NaN : Math.min(1, pv * vt / V);
      }
    });
    return { base, out, ok: true };
  }

  /* ---------- traversal ---------- */
  function walk(c, opts) {
    const out = [], seen = {};
    const go = (id, depth, parent) => {
      const n = c.nodes[id]; if (!n || seen[id]) return; seen[id] = 1;
      out.push({ n, depth, parent });
      if (isGate(n) && !(opts && opts.visibleOnly && n.collapsed)) (n.children || []).forEach(k => go(k, depth + 1, id));
    };
    go(c.root, 0, null);
    return out;
  }
  function parentOf(c, id) { for (const k in c.nodes) { const n = c.nodes[k]; if ((n.children || []).indexOf(id) >= 0) return n; } return null; }
  function descendants(c, id) { const out = []; const go = i => { const n = c.nodes[i]; if (!n) return; (n.children || []).forEach(k => { out.push(k); go(k); }); }; go(id); return out; }

  /* ---------- minimal cut sets ---------- */
  function cutSets(c, opts) {
    opts = opts || {}; const LIMIT = opts.limit || 4000; let truncated = false;
    const excl = n => opts.excludeRuledOut && n.status === 'ruledout';
    const cs = id => {
      const n = c.nodes[id]; if (!n || excl(n)) return [];
      if (!isGate(n)) return [[id]];
      const ks = kids(c, n).map(k => cs(k.id));
      if (n.gate === 'OR') return [].concat(...ks);
      const product = lists => lists.reduce((acc, L) => { const o = []; acc.forEach(a => L.forEach(b => { if (o.length < LIMIT) o.push(a.concat(b)); else truncated = true; })); return o; }, [[]]);
      if (n.gate === 'VOTE') {
        const k = Math.max(1, Math.min(ks.length, +n.k || 2)), out = [];
        const comb = (start, chosen) => { if (chosen.length === k) { out.push(...product(chosen)); return; } for (let i = start; i < ks.length; i++) comb(i + 1, chosen.concat([ks[i]])); };
        comb(0, []); return out;
      }
      return product(ks);
    };
    let sets = cs(c.root).map(s => Array.from(new Set(s)).sort());
    sets.sort((a, b) => a.length - b.length);
    const min = [];
    sets.forEach(s => { if (!min.some(m => m.every(x => s.indexOf(x) >= 0))) min.push(s); });
    return { sets: min, truncated };
  }
  function rankCutSets(c) {
    const { sets, truncated } = cutSets(c, { excludeRuledOut: true });
    const pri = evaluate(c, 'prior'), evd = evaluate(c, 'evidence');
    const prod = (s, E) => { let v = 1, nf = 0; s.forEach(id => { const r = E.val(id); if (r.u === 'f') nf++; v *= r.v; }); return { v: nf > 1 ? NaN : v, u: nf ? 'f' : 'p' }; };
    const rows = sets.map(s => {
      const st = s.map(id => c.nodes[id].status);
      const status = st.every(x => x === 'confirmed') ? 'confirmed' : st.every(x => x === 'confirmed' || x === 'likely') ? 'likely' : 'open';
      return { ids: s, status, prior: prod(s, pri), evid: prod(s, evd) };
    });
    const tot = rows.reduce((a, r) => a + (isNaN(r.evid.v) ? 0 : r.evid.v), 0);
    rows.forEach(r => { r.share = tot > 0 && !isNaN(r.evid.v) ? r.evid.v / tot : NaN; });
    const order = { confirmed: 0, likely: 1, open: 2 };
    rows.sort((a, b) => order[a.status] - order[b.status] || (isNaN(b.evid.v) ? -1 : isNaN(a.evid.v) ? 1 : b.evid.v - a.evid.v) || a.ids.length - b.ids.length);
    const all = cutSets(c, {}).sets.length;
    return { rows, truncated, eliminated: all - sets.length };
  }

  /* ---------- checks ---------- */
  function check(c) {
    const I = [], add = (sev, code, id, msg) => I.push({ sev, code, ids: id ? [].concat(id) : [], msg });
    const nm = n => (n.code ? n.code + ' ' : '') + '“' + ((n.label || '').trim() || 'no description') + '”';
    const root = c.nodes[c.root];
    if (!root) { add('error', 'T0', null, 'The tree has no top event.'); return I; }
    if (!isGate(root) || !(root.children || []).length) add('error', 'T1', root.id, 'Develop the top event: add the causes (gates and events) that could have produced it.');
    if (root.status !== 'confirmed') add('tip', 'T2', root.id, 'The top event is the incident that happened. Mark it Confirmed and record the evidence.');
    const E = evaluate(c, 'evidence');
    E.errs.forEach(e => {
      const n = c.nodes[e.id];
      if (e.code === 'U1') add('error', 'U1', e.id, 'OR gate ' + nm(n) + ' mixes frequencies (/yr) and probabilities. Every input of an OR must use the same unit.');
      if (e.code === 'U2') add('error', 'U2', e.id, 'AND gate ' + nm(n) + ' has more than one frequency input. Only one input may be a frequency; the others must be probabilities.');
      if (e.code === 'U3') add('error', 'U3', e.id, 'VOTE gate ' + nm(n) + ' can only combine probabilities.');
    });
    walk(c).forEach(({ n, parent }) => {
      const p = parent ? c.nodes[parent] : null, ks = kids(c, n);
      if (!(n.label || '').trim()) add('warning', 'Q1', n.id, (n.code || 'An element') + ' has no description.');
      if (isGate(n)) {
        if (!ks.length && n.id !== c.root) add('error', 'G1', n.id, 'Gate ' + nm(n) + ' has no inputs. Add its causes, or change it to an event.');
        if ((n.gate === 'AND' || n.gate === 'INHIBIT') && ks.length === 1) add('warning', 'G2', n.id, n.gate + ' gate ' + nm(n) + ' has only one input. Add the other condition(s), or use OR.');
        if (n.gate === 'INHIBIT' && ks.length && !ks.some(k => k.kind === 'house')) add('tip', 'G3', n.id, 'INHIBIT gate ' + nm(n) + ': show the enabling condition as a condition (house) event.');
        if (n.gate === 'VOTE' && (+n.k < 1 || +n.k > ks.length)) add('error', 'G4', n.id, 'VOTE gate ' + nm(n) + ': k must be between 1 and the number of inputs (' + ks.length + ').');
        if (n.status === 'confirmed' && ks.length) {
          if (ks.every(k => k.status === 'ruledout')) add('error', 'C1', n.id, nm(n) + ' is confirmed but every cause under it is ruled out. The tree is missing the real cause: add it.');
          else if ((n.gate === 'AND' || n.gate === 'INHIBIT') && ks.some(k => k.status === 'ruledout')) add('error', 'C2', n.id, 'AND gate ' + nm(n) + ' is confirmed, but an input it needs is ruled out. Either the input is not ruled out or the gate logic is wrong.');
          else if (n.gate === 'OR' && !ks.some(k => k.status === 'confirmed')) add('warning', 'C3', n.id, nm(n) + ' is confirmed but none of its causes is confirmed yet. Find which one occurred.');
        }
        if (n.status === 'ruledout' && ks.some(k => k.status === 'confirmed')) add('error', 'C4', n.id, nm(n) + ' is ruled out, but a cause under it is confirmed.');
        if ((n.gate === 'AND' || n.gate === 'INHIBIT') && n.status !== 'ruledout' && ks.length > 1 && ks.every(k => k.status === 'confirmed') && n.status !== 'confirmed') add('tip', 'C5', n.id, 'All inputs of ' + nm(n) + ' are confirmed, so the gate itself occurred: mark it Confirmed.');
      } else {
        const pr = n.prob || {};
        if (pr.src && pr.src !== 'none' && isNaN(rawValue(c, n))) add('warning', 'P1', n.id, 'Enter a value for ' + nm(n) + ', or set its source to Not quantified.');
        if (pr.src && pr.src !== 'none' && pr.src !== 'manual' && pr.src !== 'freq' && unitOf(c, n) === 'p' && rawValue(c, n) > 1) add('error', 'P2', n.id, nm(n) + ': a probability cannot be greater than 1.');
        const it = libItem(c, pr.item);
        if (it && pr.value != null && +pr.value !== it.value && !(pr.note || '').trim()) add('tip', 'P3', n.id, nm(n) + ': the value differs from the library value (' + fmt(it.value) + '). Record why in the value note.');
      }
      if (p && p.status === 'ruledout' && n.status === 'confirmed') add('error', 'C6', n.id, nm(n) + ' is confirmed under a branch that is ruled out.');
      if ((n.status === 'confirmed' || n.status === 'ruledout') && !(n.evidence || '').trim()) add('warning', 'V1', n.id, nm(n) + ' is ' + STATUS[n.status].name.toLowerCase() + ' without recorded evidence.');
      if ((n.status === 'unverified' || n.status === 'likely') && !(n.test || '').trim() && n.id !== c.root) add('tip', 'V2', n.id, 'Plan how to test ' + nm(n) + ' (inspection, record, interview, test).');
      if (n.cause === 'root' && n.status === 'ruledout') add('error', 'R1', n.id, nm(n) + ' is marked as a root cause but is ruled out.');
      if (n.cause === 'root' && !(c.actions || []).some(a => a.target === n.id && a.status !== 'Cancelled')) add('warning', 'R2', n.id, 'Root cause ' + nm(n) + ' has no corrective action.');
    });
    const roots = Object.values(c.nodes).filter(n => n.cause === 'root' && n.status !== 'ruledout');
    if (!roots.length && Object.values(c.nodes).some(n => n.status === 'confirmed' && !isGate(n))) add('tip', 'R3', null, 'Classify the confirmed causes: mark which are root causes, causal factors or contributing factors.');
    const o = { error: 0, warning: 1, tip: 2 };
    return I.sort((a, b) => o[a.sev] - o[b.sev]);
  }

  /* ---------- numbers ---------- */
  function fmt(v, u) {
    if (v == null || isNaN(v)) return '—';
    let s;
    if (v === 0) s = '0';
    else if (v >= 0.01 && v < 1000) s = String(+v.toPrecision(2));
    else { const e = v.toExponential(1).replace('e', 'E'); s = e.replace(/E\+?(-?)(\d)$/, 'E$10$2'); }
    return u === 'f' ? s + ' /yr' : s;
  }

  /* ---------- layout (top-down tidy tree) ---------- */
  const BW = 184, BH = 82, SYM = 34, LEVEL = 152, COL = 204;
  function layout(c) {
    const pos = {}; let leaf = 0;
    const place = (id, depth) => {
      const n = c.nodes[id]; if (!n) return 0;
      const ks = isGate(n) && !n.collapsed ? (n.children || []).filter(k => c.nodes[k]) : [];
      let x;
      if (!ks.length) { x = leaf * COL; leaf++; }
      else { const xs = ks.map(k => place(k, depth + 1)); x = (xs[0] + xs[xs.length - 1]) / 2; }
      pos[id] = { x, y: depth * LEVEL }; return x;
    };
    place(c.root, 0);
    return pos;
  }

  /* ---------- drawing ---------- */
  const FONT = 'Arial, Helvetica, sans-serif';
  const xml = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
  function wrap(t, max, lines) {
    const w = String(t || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean), out = []; let cur = '';
    w.forEach(x => { if (!cur) cur = x; else if ((cur + ' ' + x).length <= max) cur += ' ' + x; else { out.push(cur); cur = x; } });
    if (cur) out.push(cur);
    if (out.length > lines) { const cut = out.slice(0, lines); cut[lines - 1] = cut[lines - 1].replace(/.{0,2}$/, '') + '…'; return cut; }
    return out;
  }
  function symbol(n, cx, y) { // y = top of symbol area
    const s = '#22324a', f = '#ffffff', w = 1.6;
    if (isGate(n)) {
      const t = n.gate;
      if (t === 'OR' || t === 'VOTE') return `<path d="M${cx - 15},${y + 30} Q${cx - 13},${y + 10} ${cx},${y + 2} Q${cx + 13},${y + 10} ${cx + 15},${y + 30} Q${cx},${y + 21} ${cx - 15},${y + 30}Z" fill="${f}" stroke="${s}" stroke-width="${w}"/>` + (t === 'VOTE' ? `<text x="${cx}" y="${y + 24}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="${s}">${xml((n.k || 2) + '/' + (n.children || []).length)}</text>` : '');
      if (t === 'AND') return `<path d="M${cx - 14},${y + 30} V${y + 16} A14,14 0 0 1 ${cx + 14},${y + 16} V${y + 30}Z" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
      if (t === 'INHIBIT') return `<path d="M${cx},${y + 1} L${cx + 14},${y + 9} L${cx + 14},${y + 23} L${cx},${y + 31} L${cx - 14},${y + 23} L${cx - 14},${y + 9}Z" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
    }
    if (n.kind === 'basic') return `<circle cx="${cx}" cy="${y + 15}" r="13" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
    if (n.kind === 'undeveloped') return `<path d="M${cx},${y + 1} L${cx + 17},${y + 15} L${cx},${y + 29} L${cx - 17},${y + 15}Z" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
    if (n.kind === 'house') return `<path d="M${cx - 14},${y + 30} V${y + 12} L${cx},${y + 2} L${cx + 14},${y + 12} V${y + 30}Z" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
    return '';
  }
  /* ctx: {interactive, sel, issues:{id:{error,warning}}, show:'evidence'|'prior'|'none', post:{id:v}} */
  function render(c, ctx) {
    ctx = ctx || {};
    const pos = layout(c);
    const E = ctx.show && ctx.show !== 'none' ? evaluate(c, ctx.show) : null;
    let edges = '', nodes = '';
    let x0 = Infinity, x1 = -Infinity, y1 = 0;
    Object.keys(pos).forEach(id => {
      const n = c.nodes[id], p = pos[id], cx = p.x + BW / 2, top = p.y;
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x + BW); y1 = Math.max(y1, p.y + BH + SYM + 4);
      const ks = isGate(n) && !n.collapsed ? (n.children || []).filter(k => pos[k]) : [];
      if (ks.length) {
        const by = top + BH + SYM, mid = by + 18;
        edges += `<path d="M${cx},${by} V${mid}" fill="none" stroke="#5a6779" stroke-width="1.4"/>`;
        const xs = ks.map(k => pos[k].x + BW / 2);
        edges += `<path d="M${Math.min.apply(null, xs)},${mid} H${Math.max.apply(null, xs)}" fill="none" stroke="#5a6779" stroke-width="1.4"/>`;
        ks.forEach(k => { edges += `<path d="M${pos[k].x + BW / 2},${mid} V${pos[k].y}" fill="none" stroke="#5a6779" stroke-width="1.4"/>`; });
      }
      const st = STATUS[n.status] || STATUS.unverified, ro = n.status === 'ruledout';
      let s = '';
      s += `<line x1="${cx}" y1="${top + BH}" x2="${cx}" y2="${top + BH + 3}" stroke="#22324a" stroke-width="1.5"/>`;
      s += `<rect x="${p.x}" y="${top}" width="${BW}" height="${BH}" rx="4" fill="${ro ? '#f4f4f2' : '#ffffff'}" stroke="${n.id === c.root ? '#0f2a4d' : '#8a96a6'}" stroke-width="${n.id === c.root ? 2.2 : 1}"${ro ? ' stroke-dasharray="5 3"' : ''}/>`;
      s += `<rect x="${p.x}" y="${top}" width="6" height="${BH}" rx="2" fill="${st.col}"/>`;
      s += `<text x="${p.x + 13}" y="${top + 15}" font-family="${FONT}" font-size="10.5" font-weight="700" fill="${ro ? '#8a8a8a' : '#0f2a4d'}">${xml(n.code || '')}</text>`;
      const chip = st.name.toUpperCase(), cw = chip.length * 5.6 + 10;
      s += `<rect x="${p.x + BW - cw - 6}" y="${top + 5}" width="${cw}" height="14" rx="7" fill="${st.soft}"/><text x="${p.x + BW - cw / 2 - 6}" y="${top + 15}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" letter-spacing=".4" fill="${st.col}">${chip}</text>`;
      const lines = wrap(n.label, 30, 3);
      s += `<text font-family="${FONT}" font-size="11" fill="${ro ? '#8a8a8a' : '#17202b'}"${ro ? ' text-decoration="line-through"' : ''}>` + lines.map((l, i) => `<tspan x="${p.x + 13}" y="${top + 31 + i * 13}">${xml(l)}</tspan>`).join('') + '</text>';
      let foot = '';
      if (E) { const r = E.val(id); if (!isNaN(r.v)) foot = (r.u === 'f' ? 'f = ' : 'P = ') + fmt(r.v, r.u); else if (!isGate(n) && (!n.prob || !n.prob.src || n.prob.src === 'none')) foot = ''; }
      if (ctx.post && ctx.post[id] != null && !isNaN(ctx.post[id]) && id !== c.root && n.status !== 'confirmed' && n.status !== 'ruledout') foot += (foot ? '   ' : '') + 'given incident ' + Math.round(ctx.post[id] * 100) + '%';
      if (n.cause === 'root') foot = 'ROOT CAUSE' + (foot ? '  ·  ' + foot : '');
      if (foot) s += `<text x="${p.x + 13}" y="${top + BH - 8}" font-family="${FONT}" font-size="9.5" fill="${n.cause === 'root' ? '#8a1c12' : '#3d4a5c'}" font-weight="${n.cause === 'root' ? 700 : 400}">${xml(foot)}</text>`;
      s += symbol(n, cx, top + BH + 2);
      if (isGate(n) && n.collapsed && (n.children || []).length) {
        const cnt = descendants(c, id).length;
        s += `<path d="M${cx},${top + BH + SYM + 2} l-11,18 h22z" fill="#ffffff" stroke="#22324a" stroke-width="1.4"/><text x="${cx + 16}" y="${top + BH + SYM + 18}" font-family="${FONT}" font-size="9.5" fill="#3d4a5c">${cnt} hidden</text>`;
        y1 = Math.max(y1, top + BH + SYM + 24);
      }
      if (ctx.interactive) {
        const iss = ctx.issues && ctx.issues[id];
        if (iss) s += `<circle cx="${p.x + BW}" cy="${top}" r="8.5" fill="${iss.error ? '#b42318' : '#9a5b00'}"/><text x="${p.x + BW}" y="${top + 3.5}" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#fff">${iss.error || iss.warning}</text>`;
        const sel = ctx.sel === id;
        s = `<rect class="sel-ring" x="${p.x - 5}" y="${top - 5}" width="${BW + 10}" height="${BH + SYM + 8}" rx="7"${sel ? '' : ' style="display:none"'}/>` + s;
        nodes += `<g class="ftn${sel ? ' sel' : ''}" data-id="${xml(id)}">${s}</g>`;
      } else nodes += `<g>${s}</g>`;
    });
    if (x0 === Infinity) { x0 = 0; x1 = BW; }
    return { body: edges + nodes, bbox: { x: x0, y: 0, w: x1 - x0, h: y1 }, pos };
  }
  function treeSVG(c, opts) {
    opts = opts || {};
    const r = render(c, { show: opts.show || 'evidence', post: opts.post }), pad = 24, head = opts.noTitle ? 0 : 34;
    const W = Math.ceil(r.bbox.w + pad * 2), H = Math.ceil(r.bbox.h + pad * 2 + head), m = c.meta || {};
    const title = opts.noTitle ? '' : `<text x="${pad}" y="${pad + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="#0f2a4d">${xml(m.title || 'RCA fault tree')}</text><text x="${W - pad}" y="${pad + 4}" text-anchor="end" font-family="${FONT}" font-size="11" fill="#5b5b5b">${xml([m.ref, m.date, 'Cause-and-effect fault tree'].filter(Boolean).join('  ·  '))}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>${title}<g transform="translate(${pad - r.bbox.x},${pad + head})">${r.body}</g></svg>`;
  }

  return { STATUS, GATES, KINDS, CAUSE, CATEGORIES, isGate, kids, libItem, unitOf, rawValue, evaluate, posteriors, walk, parentOf, descendants, cutSets, rankCutSets, check, fmt, layout, render, treeSVG, symbol, BW, BH, SYM, LIB };
})();
if (typeof module !== 'undefined') module.exports = RCAE;
