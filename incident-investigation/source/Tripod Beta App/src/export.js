/* Tripod Beta Investigator — tree geometry, SVG rendering, tidy layout and exports
   (SVG, draw.io, Word .docx, HTML report, Storyline Casebook package). Pure string builders; no DOM. */
var TBX = (function () {
  const C = (typeof TBC !== 'undefined') ? TBC : require('./content.js');
  const R = (typeof TBR !== 'undefined') ? TBR : require('./rules.js');
  const T = C.TYPES;
  const FONT = 'Arial, Helvetica, sans-serif';
  const COL = { event: '#d7262e', object: '#1f8f4e', ic: '#9aa1a8', pc: '#2f6db5', uc: '#f2c230', stripeA: '#ffd200', stripeB: '#161616', ink: '#141414', cap: '#5b5b5b', edge: '#3a3f47' };

  const xml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const html = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- geometry ---------------------------------------------------- */
  function wrap(text, max, maxLines) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const lines = []; let cur = '';
    words.forEach(w => {
      while (w.length > max) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, max - 1) + '-'); w = w.slice(max - 1); }
      if (!cur) cur = w; else if ((cur + ' ' + w).length <= max) cur += ' ' + w; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { const cut = lines.slice(0, maxLines); cut[maxLines - 1] = cut[maxLines - 1].replace(/.{0,2}$/, '') + '…'; return cut; }
    return lines.length ? lines : [''];
  }
  const charsFor = px => Math.max(8, Math.floor(px / 6.2));
  function geom(n) {
    const t = T[n.type] || T.narrative, w = t.w;
    if (R.BARRIERS[n.type]) {
      const lines = wrap(n.label || '', charsFor(w - 16), 5);
      const boxH = 26 + lines.length * 14;
      return { w, h: 22 + boxH, ay: 11, lines, boxY: 22 };
    }
    const lines = wrap(n.label || '', charsFor(w - (n.type === 'narrative' ? 16 : 24)), n.type === 'narrative' ? 7 : 6);
    const h = Math.max(64, 12 + 14 + lines.length * 14 + 10);
    return { w, h, ay: h / 2, lines };
  }

  function caption(n, ctx) {
    let c = (T[n.type] || {}).name || '';
    if (R.EVENTS[n.type]) { if (ctx.potential && ctx.potential[n.id]) c = 'Potential ' + (n.type === 'event' ? 'Event' : c); else if (n.mainEvent) c = 'Main ' + c; }
    if (n.type === 'ic' && n.act === 'condition') c = 'Immediate Cause · condition';
    if (n.type === 'pc' && n.scope === 'external') c = 'Precondition · external';
    if (n.verified === false && n.type !== 'narrative') c += ' · assumed';
    return c.toUpperCase();
  }

  function defs(p) {
    p = p || 'tb';
    return `<defs><pattern id="${p}Stripe" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="11" height="11" fill="${COL.stripeA}"/><rect width="5.5" height="11" fill="${COL.stripeB}"/></pattern>` +
      `<clipPath id="${p}Top"><rect x="0" y="0" width="400" height="50%"/></clipPath></defs>`;
  }

  function textLines(lines, x, y0, opts) {
    opts = opts || {};
    return `<text font-family="${FONT}" font-size="${opts.size || 12}" fill="${opts.fill || COL.ink}"${opts.italic ? ' font-style="italic"' : ''}${opts.anchor ? ' text-anchor="' + opts.anchor + '"' : ''}>` +
      lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * 14}">${xml(l)}</tspan>`).join('') + '</text>';
  }

  function frameFill(type, p) {
    return { event: COL.event, object: COL.object, ic: COL.ic, pc: COL.pc, uc: COL.uc, agent: `url(#${p}Stripe)` }[type];
  }

  function nodeSVG(n, ctx) {
    const g = geom(n), p = ctx.p || 'tb', w = g.w, h = g.h;
    const pot = R.EVENTS[n.type] && ctx.potential && ctx.potential[n.id];
    const edgeStroke = ctx.interactive ? '' : ` stroke="${COL.edge}"`;
    let s = '';
    const cap = caption(n, ctx);
    if (R.BARRIERS[n.type]) {
      const cx = w / 2;
      s += `<line x1="0" y1="11" x2="${w}" y2="11" class="edge"${edgeStroke} stroke-width="1.6"/>`;
      if (n.type === 'failed') s += `<rect x="${cx - 18}" y="3" width="14" height="16" fill="${COL.ink}"/><rect x="${cx + 4}" y="3" width="14" height="16" fill="${COL.ink}"/>`;
      else if (n.type === 'effective') s += `<rect x="${cx - 18}" y="3" width="36" height="16" fill="${COL.ink}"/>`;
      else s += `<rect x="${cx - 18}" y="3" width="14" height="16" fill="#ffffff" stroke="${COL.ink}" stroke-width="1.5" stroke-dasharray="3 2"/><rect x="${cx + 4}" y="3" width="14" height="16" fill="#ffffff" stroke="${COL.ink}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      const dashed = (n.type === 'missing' || n.type === 'inadequate') ? ' stroke-dasharray="5 3"' : '';
      s += `<rect x="0" y="${g.boxY}" width="${w}" height="${h - g.boxY}" rx="3" fill="#ffffff" stroke="#3b3b3b" stroke-width="${n.type === 'effective' ? 2 : 1}"${dashed}/>`;
      s += `<text x="8" y="${g.boxY + 14}" font-family="${FONT}" font-size="8.5" letter-spacing=".6" fill="${COL.cap}">${xml(cap)}</text>`;
      s += textLines(g.lines, 8, g.boxY + 30);
    } else if (n.type === 'narrative') {
      s += `<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#fbfaf2" stroke="#8b8a7a" stroke-dasharray="5 3"/>`;
      s += `<text x="8" y="16" font-family="${FONT}" font-size="8.5" letter-spacing=".6" fill="${COL.cap}">NARRATIVE</text>`;
      s += textLines(g.lines, 8, 31, { italic: true, size: 11.5 });
    } else {
      const op = pot ? ' fill-opacity=".45"' : '';
      const st = pot ? ' stroke-dasharray="6 3"' : '';
      const sw = n.mainEvent && R.EVENTS[n.type] ? 2.4 : .8;
      if (n.type === 'eventAgent' || n.type === 'eventObject') {
        s += `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${COL.event}"${op}/>`;
        s += `<path d="M4 0 H${w - 4} Q${w} 0 ${w} 4 V${h / 2} H0 V4 Q0 0 4 0Z" fill="${n.type === 'eventAgent' ? `url(#${p}Stripe)` : COL.object}"${op}/>`;
        s += `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="none" stroke="#202020" stroke-width="${sw}"${st}/>`;
      } else {
        s += `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${frameFill(n.type, p)}"${op} stroke="#202020" stroke-width="${sw}"${st}/>`;
      }
      const assumed = n.verified === false ? ' stroke="#8a8a8a" stroke-dasharray="3 2"' : '';
      s += `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="2" fill="#ffffff"${assumed}/>`;
      s += `<text x="12" y="20" font-family="${FONT}" font-size="8.5" letter-spacing=".6" fill="${COL.cap}">${xml(cap)}</text>`;
      s += textLines(g.lines, 12, 35);
      if (n.type === 'uc' && n.brf) s += `<rect x="${w - 36}" y="${h - 19}" width="30" height="14" rx="2" fill="${COL.ink}"/><text x="${w - 21}" y="${h - 8.5}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="9.5" fill="${COL.uc}">${xml(n.brf)}</text>`;
    }
    if (ctx.interactive) {
      const iss = ctx.issues && ctx.issues[n.id];
      s = `<rect class="sel-ring" x="-5" y="-5" width="${w + 10}" height="${h + 10}" rx="6"/>` + s;
      if (iss) s += `<g class="badge"><circle cx="${w}" cy="0" r="9" fill="${iss.error ? '#b42318' : iss.warning ? '#9a5b00' : '#276a8a'}"/><text x="${w}" y="3.5" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="#fff">${iss.error || iss.warning || iss.tip}</text></g>`;
      s += `<circle class="port" data-port="${xml(n.id)}" cx="${w}" cy="${g.ay}" r="6"/>`;
      const cls = 'node' + (ctx.sel && ctx.sel.has(n.id) ? ' sel' : '') + (ctx.hl && ctx.hl.has(n.id) ? ' hl' : '');
      return `<g class="${cls}" data-id="${xml(n.id)}" transform="translate(${n.x || 0},${n.y || 0})">${s}</g>`;
    }
    return `<g transform="translate(${n.x || 0},${n.y || 0})">${s}</g>`;
  }

  function anchors(a, ga, b, gb, kind) {
    if (kind === 'trajectory') {
      if (b.x >= a.x + ga.w - 10) return { x1: a.x + ga.w, y1: a.y + ga.ay, x2: b.x, y2: b.y + gb.ay, hz: true };
      return { x1: a.x, y1: a.y + ga.ay, x2: b.x + gb.w, y2: b.y + gb.ay, hz: true };
    }
    const ca = { x: a.x + ga.w / 2, y: a.y + ga.h / 2 }, cb = { x: b.x + gb.w / 2, y: b.y + gb.h / 2 };
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    if (Math.abs(dy) > Math.abs(dx) * 0.45 || Math.abs(dx) < (ga.w + gb.w) / 2) {
      return dy < 0 ? { x1: ca.x, y1: a.y, x2: cb.x, y2: b.y + gb.h, hz: false } : { x1: ca.x, y1: a.y + ga.h, x2: cb.x, y2: b.y, hz: false };
    }
    return dx > 0 ? { x1: a.x + ga.w, y1: ca.y, x2: b.x, y2: cb.y, hz: true } : { x1: a.x, y1: ca.y, x2: b.x + gb.w, y2: cb.y, hz: true };
  }
  function pathD(an) {
    const { x1, y1, x2, y2, hz } = an;
    if (hz) { const k = Math.max(24, Math.abs(x2 - x1) / 2) * (x2 >= x1 ? 1 : -1); return `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`; }
    const k = Math.max(20, Math.abs(y2 - y1) / 2) * (y2 >= y1 ? 1 : -1);
    return `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}`;
  }

  function potentialMap(c) {
    const m = {};
    R.trios(c).forEach(t => { if (t.potential) m[t.event.id] = 1; });
    return m;
  }

  /* Render edges + nodes; returns {body, bbox}. ctx: {interactive, sel:Set, selEdge, issues, hl:Set, p} */
  function renderTree(c, ctx) {
    ctx = Object.assign({ p: 'tb' }, ctx || {});
    ctx.potential = potentialMap(c);
    const byId = {}; c.nodes.forEach(n => byId[n.id] = n);
    const G = {}; c.nodes.forEach(n => G[n.id] = geom(n));
    let edges = '';
    c.edges.forEach(e => {
      const a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      const kind = R.edgeKind(a.type, b.type);
      const d = pathD(anchors(a, G[a.id], b, G[b.id], kind));
      if (ctx.interactive) {
        edges += `<g data-edge="${xml(e.id)}"><path class="edge ${kind}${ctx.selEdge === e.id ? ' edge-sel' : ''}" d="${d}"/><path class="edge-hit" d="${d}"/></g>`;
      } else {
        const dash = kind === 'probable' ? ' stroke-dasharray="2 4" stroke-linecap="round" stroke-width="2"' : kind === 'note' ? ' stroke-dasharray="5 4" stroke-width="1"' : ' stroke-width="1.6"';
        edges += `<path d="${d}" fill="none" stroke="${COL.edge}"${dash}/>`;
      }
    });
    const nodes = c.nodes.map(n => nodeSVG(n, ctx)).join('');
    return { body: edges + nodes, bbox: bbox(c, G) };
  }
  function bbox(c, G) {
    if (!c.nodes.length) return { x: 0, y: 0, w: 600, h: 400 };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    c.nodes.forEach(n => { const g = G ? G[n.id] : geom(n); x0 = Math.min(x0, n.x || 0); y0 = Math.min(y0, n.y || 0); x1 = Math.max(x1, (n.x || 0) + g.w); y1 = Math.max(y1, (n.y || 0) + g.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* Standalone SVG file (literal colours, white ground, title strip). */
  function treeSVG(c, opts) {
    opts = opts || {};
    const r = renderTree(c, { p: 'tbx' }), b = r.bbox, pad = 28, head = opts.noTitle ? 0 : 34;
    const W = Math.ceil(b.w + pad * 2), H = Math.ceil(b.h + pad * 2 + head);
    const m = c.meta || {};
    const title = opts.noTitle ? '' : `<text x="${pad}" y="${pad + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="#0f2a4d">${xml(m.title || 'Tripod Beta tree')}</text><text x="${W - pad}" y="${pad + 4}" text-anchor="end" font-family="${FONT}" font-size="11" fill="#5b5b5b">${xml([m.ref, m.date, 'Tripod Beta tree'].filter(Boolean).join('  ·  '))}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs('tbx')}<rect width="${W}" height="${H}" fill="#ffffff"/>${title}<g transform="translate(${pad - b.x},${pad + head - b.y})">${r.body}</g></svg>`;
  }

  /* ---------- tidy layout ------------------------------------------------- */
  function tidy(c) {
    const ix = R.index(c), byId = ix.byId;
    const core = c.nodes.filter(n => R.isTraj(n.type) || R.EVENTS[n.type]);
    const coreSet = {}; core.forEach(n => coreSet[n.id] = 1);
    const trajIn = id => ix.inN(id, m => coreSet[m.id] && (R.isTraj(m.type) || R.EVENTS[m.type]));
    const rank = {}, busy = {};
    const rk = id => {
      if (rank[id] != null) return rank[id];
      if (busy[id]) return 0; busy[id] = 1;
      const ins = trajIn(id); const r = ins.length ? Math.max.apply(null, ins.map(m => rk(m.id))) + 1 : 0;
      busy[id] = 0; return (rank[id] = r);
    };
    core.forEach(n => rk(n.id));
    // as-late-as-possible: pull agents, objects and barriers right, next to the event they feed
    const trajOut = id => ix.outN(id, m => coreSet[m.id]);
    const alap = {}, busy2 = {};
    const al = id => {
      if (alap[id] != null) return alap[id];
      if (busy2[id]) return rank[id]; busy2[id] = 1;
      const outs = trajOut(id);
      const r = outs.length ? Math.min.apply(null, outs.map(m => al(m.id))) - 1 : rank[id];
      busy2[id] = 0; return (alap[id] = Math.max(rank[id], r));
    };
    core.forEach(n => al(n.id));
    core.forEach(n => rank[n.id] = alap[n.id]);
    const COLW = 205, ROWH = 118;
    const sinks = core.filter(n => !ix.outN(n.id, m => coreSet[m.id]).length);
    sinks.sort((a, b) => rank[b.id] - rank[a.id]);
    let slot = 0; const Y = {};
    const visit = (id, guard) => {
      if (Y[id] != null) return Y[id];
      guard = guard || {}; if (guard[id]) return slot * ROWH; guard[id] = 1;
      const n = byId[id];
      let ins = trajIn(id);
      if (R.EVENTS[n.type]) {
        // agent-side input first (upper), object-side second (lower)
        const side = m => { let x = m; const seen = {}; while (x && R.BARRIERS[x.type] && !seen[x.id]) { seen[x.id] = 1; x = trajIn(x.id)[0]; } return x && (x.type === 'agent' || x.type === 'eventAgent') ? 0 : 1; };
        ins = ins.slice().sort((a, b) => side(a) - side(b));
      }
      if (!ins.length) { Y[id] = slot * ROWH; slot++; return Y[id]; }
      const ys = ins.map(m => visit(m.id, guard));
      Y[id] = R.BARRIERS[n.type] ? ys[0] : ys.reduce((a, b) => a + b, 0) / ys.length;
      return Y[id];
    };
    sinks.forEach(s => visit(s.id));
    core.forEach(n => { if (Y[n.id] == null) visit(n.id); });
    core.forEach(n => { n.x = 40 + rank[n.id] * COLW; n.y = 40 + Y[n.id]; });
    // centre each node on its row line
    core.forEach(n => { const g = geom(n); n.y = Math.round(n.y - g.ay + 32); });
    // causation band below the core
    let coreBottom = 0; core.forEach(n => { coreBottom = Math.max(coreBottom, n.y + geom(n).h); });
    const placed = {}; core.forEach(n => placed[n.id] = 1);
    const row1 = coreBottom + 70, CW = 172;
    const rows = [row1, row1 + 130, row1 + 260];
    let cursor = 40;
    const bars = core.filter(n => n.type === 'failed' || n.type === 'missing' || n.type === 'inadequate').sort((a, b) => a.x - b.x || a.y - b.y);
    let maxY = row1;
    bars.forEach(b => {
      const gx = Math.max(cursor, b.x);
      let pcCur = gx, ucCur = gx;
      const putUC = (u, minX) => { if (placed[u.id]) return; ucCur = Math.max(ucCur, minX); u.x = ucCur; u.y = rows[2]; placed[u.id] = 1; ucCur += CW; };
      if (b.type === 'failed') {
        const ic = ix.inN(b.id, m => m.type === 'ic')[0];
        if (ic && !placed[ic.id]) { ic.x = gx; ic.y = rows[0]; placed[ic.id] = 1; }
        if (ic) ix.inN(ic.id, m => m.type === 'pc').forEach(pc => {
          if (!placed[pc.id]) { pc.x = pcCur; pc.y = rows[1]; placed[pc.id] = 1; pcCur += CW; }
          ix.inN(pc.id, m => m.type === 'uc').forEach(u => putUC(u, pc.x));
        });
        cursor = Math.max(gx + CW, pcCur, ucCur) + 24;
      } else {
        ix.inN(b.id, m => m.type === 'uc').forEach(u => { if (!placed[u.id]) { u.x = ucCur; u.y = rows[0]; placed[u.id] = 1; ucCur += CW; } });
        cursor = Math.max(gx + CW, ucCur) + 24;
      }
    });
    c.nodes.forEach(n => { if (placed[n.id]) maxY = Math.max(maxY, n.y + geom(n).h); });
    let lx = 40; const ly = maxY + 60;
    c.nodes.forEach(n => {
      if (placed[n.id]) return;
      if (n.type === 'narrative') {
        const tgt = ix.outs[n.id].map(e => byId[e.to]).concat(ix.ins[n.id].map(e => byId[e.from])).filter(Boolean)[0];
        if (tgt && placed[tgt.id]) { n.x = tgt.x; n.y = tgt.y - geom(n).h - 30; placed[n.id] = 1; return; }
      }
      n.x = lx; n.y = ly; lx += geom(n).w + 22; placed[n.id] = 1;
    });
    // resolve overlaps of nodes that landed on top of each other
    for (let pass = 0; pass < 3; pass++) {
      const list = c.nodes.slice().sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j], ga = geom(a), gb = geom(b);
        if (a.x < b.x + gb.w + 8 && b.x < a.x + ga.w + 8 && a.y < b.y + gb.h + 8 && b.y < a.y + ga.h + 8) b.y = a.y + ga.h + 14;
      }
    }
    c.nodes.forEach(n => { n.x = Math.round(n.x / 10) * 10; n.y = Math.round(n.y / 10) * 10; });
    return c;
  }

  /* ---------- report model (shared by HTML and Word) ---------------------- */
  const brfName = code => { const b = C.BRF.find(x => x.code === code); return b ? b.name : ''; };
  const errName = code => { const e = C.ERRORS.find(x => x.code === code); return e ? e.name : ''; };
  function model(c) {
    const ix = R.index(c), tr = R.trios(c, ix);
    tr.sort((a, b) => (a.event.x || 0) - (b.event.x || 0));
    const trioOf = {}; tr.forEach((t, i) => t.barriers.forEach(b => trioOf[b.id] = i + 1));
    const barrierRows = [];
    tr.forEach((t, i) => t.inputs.forEach(inp => inp.barriers.forEach(b => barrierRows.push({ trio: i + 1, event: t.event.label, side: inp.side === 'agent' ? 'Agent side' : inp.side === 'object' ? 'Object side' : '–', label: b.label, type: T[b.type].name, kind: b.type, id: b.id }))));
    const paths = barrierRows.filter(b => b.kind === 'failed').map(b => {
      const p = R.pathOf(c, b.id, ix);
      return { trio: b.trio, barrier: b.label, id: b.id, ic: p.ic ? { label: p.ic.label, kind: p.ic.act === 'condition' ? 'Sub-standard condition' : 'Sub-standard act', error: errName(p.ic.errorType), notes: p.ic.notes, justification: p.ic.justification } : null,
        pcs: p.pcs.map(x => ({ label: x.pc.label, scope: x.pc.scope === 'external' ? 'External' : 'Organisational', ucs: x.ucs.map(u => ({ label: u.label, brf: u.brf || '', brfName: brfName(u.brf) })) })) };
    });
    const missing = barrierRows.filter(b => b.kind === 'missing' || b.kind === 'inadequate').map(b => ({ trio: b.trio, barrier: b.label, type: b.type, ucs: R.pathOf(c, b.id, ix).ucs.map(u => ({ label: u.label, brf: u.brf || '', brfName: brfName(u.brf) })) }));
    const effective = barrierRows.filter(b => b.kind === 'effective');
    const ucs = c.nodes.filter(n => n.type === 'uc');
    const brf = C.BRF.map(b => ({ code: b.code, name: b.name, n: ucs.filter(u => u.brf === b.code).length, items: ucs.filter(u => u.brf === b.code).map(u => u.label) }));
    const byId = ix.byId;
    const acts = (c.actions || []).map((a, i) => { const t = byId[a.target]; return Object.assign({ n: i + 1, targetLabel: t ? t.label : '(not linked)', targetType: t ? T[t.type].name : '', smartOk: ['S', 'M', 'A', 'R', 'T'].every(k => a.smart && a.smart[k]) }, a); });
    const issues = R.check(c);
    return {
      meta: c.meta || {}, team: c.team || [], trios: tr.map((t, i) => ({ n: i + 1, agent: t.agents[0] ? t.agents[0].origin.label : '–', object: t.objects[0] ? t.objects[0].origin.label : '–', event: t.event.label, type: T[t.event.type].name, potential: t.potential, main: !!t.event.mainEvent, barriers: t.barriers.length })),
      barrierRows, paths, missing, effective, brf, actions: acts, issues,
      counts: { failed: barrierRows.filter(b => b.kind === 'failed').length, missing: missing.length, effective: effective.length, uc: ucs.length, actions: acts.length,
        errors: issues.filter(i => i.sev === 'error').length, warnings: issues.filter(i => i.sev === 'warning').length },
      narratives: c.nodes.filter(n => n.type === 'narrative').map(n => n.label)
    };
  }

  /* ---------- HTML report ------------------------------------------------- */
  const REPORT_CSS = `.rpt{font:14px/1.55 Arial,Helvetica,sans-serif;color:#141c26;background:#fff;max-width:1000px;margin:0 auto;padding:36px 40px 60px}
.rpt h1,.rpt h2,.rpt h3{font-family:Arial,Helvetica,sans-serif;letter-spacing:0}.rpt h1{font-size:28px;margin:6px 0 4px;color:#0f2a4d;line-height:1.2}.rpt h2{font-size:19px;color:#0f2a4d;border-bottom:2px solid #0f2a4d;padding-bottom:4px;margin:30px 0 10px}.rpt h3{font-size:15px;margin:18px 0 6px}
.rpt .cover{border-top:8px solid #0f2a4d;padding-top:18px;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.rpt .cover img{max-height:70px;max-width:200px}
.rpt .brand{font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#1d4ea3}.rpt .kv{display:grid;grid-template-columns:170px 1fr;gap:4px 14px;margin:14px 0}.rpt .kv b{color:#4b5563;font-weight:600}
.rpt table{border-collapse:collapse;width:100%;font-size:12.5px;margin:6px 0 10px}.rpt th,.rpt td{border:1px solid #b9c1cc;padding:5px 7px;text-align:left;vertical-align:top}.rpt th{background:#e4eaf3;font-weight:600}
.rpt .tree{overflow-x:auto;border:1px solid #d0d6de;padding:6px;margin:8px 0}.rpt .tree svg{max-width:100%;height:auto}.rpt .tag{display:inline-block;font-size:11px;font-weight:700;padding:0 5px;border-radius:3px;background:#141414;color:#f2c230}
.rpt .path{border-left:4px solid #9aa1a8;padding:4px 0 4px 12px;margin:10px 0}.rpt .path p{margin:2px 0}.rpt .muted{color:#5b6573}.rpt .bar{display:inline-block;height:11px;background:#1d4ea3;vertical-align:middle;border-radius:2px}
.rpt .sign{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px}.rpt .sign div{border-top:1px solid #333;padding-top:4px;font-size:12px;min-height:60px}
.rpt .foot{margin-top:40px;font-size:11px;color:#6b7280;border-top:1px solid #d0d6de;padding-top:8px}
@media print{.rpt{padding:0;max-width:none}.rpt h2{break-after:avoid}.rpt .tree{border:0}.rpt table{break-inside:auto}.rpt tr{break-inside:avoid}.rpt .pb{break-before:page}}`;

  function reportBody(c, treeSvg) {
    const M = model(c), m = M.meta, e = html;
    const fmt = d => d || '–';
    const sev = n => ['', 'Minor', 'Moderate', 'Serious', 'Major', 'Catastrophic'][+n] || '–';
    let s = `<div class="rpt"><div class="cover"><div><div class="brand">Istec Training · Tripod Beta incident analysis</div><h1>${e(m.title || 'Untitled investigation')}</h1><div class="muted">${e([m.ref, m.client].filter(Boolean).join(' · '))}</div></div>${m.logo ? `<img src="${e(m.logo)}" alt="Client logo">` : ''}</div>`;
    s += `<div class="kv"><b>Date and time</b><span>${e(fmt(m.date))}${m.time ? ', ' + e(m.time) : ''}</span><b>Location</b><span>${e(fmt(m.location))}</span><b>Site / business unit</b><span>${e(fmt(m.site))}</span><b>Loss category</b><span>${e(fmt(m.incidentType))}</span><b>Severity</b><span>Actual ${e(m.actualSeverity || '–')} (${sev(m.actualSeverity)}), potential ${e(m.potentialSeverity || '–')} (${sev(m.potentialSeverity)})</span><b>Tripod Beta practitioner</b><span>${e(fmt(m.practitioner))}</span><b>Report status</b><span>${e(m.status || 'Draft')}</span></div>`;
    s += `<h2>1. Summary</h2><p>${e(m.summary || m.description || '').replace(/\n/g, '<br>')}</p>`;
    s += `<p class="muted">${M.trios.length} trio(s) · ${M.counts.failed} failed, ${M.counts.missing} missing/inadequate and ${M.counts.effective} effective barrier(s) · ${M.counts.uc} underlying cause(s) · ${M.counts.actions} recommended action(s).</p>`;
    s += `<h2>2. Description of the incident</h2><p>${e(m.description || '').replace(/\n/g, '<br>')}</p>`;
    s += `<h2>3. Investigation team</h2>${M.team.length ? `<table><tr><th>Name</th><th>Role</th></tr>${M.team.map(t => `<tr><td>${e(t.name)}</td><td>${e(t.role)}</td></tr>`).join('')}</table>` : '<p class="muted">No team recorded.</p>'}`;
    s += `<h2 class="pb">4. Tripod Beta tree</h2><div class="tree">${treeSvg || ''}</div><p class="muted">Time runs left to right. Red: Event · striped: Agent of Change · green: Object · paired black blocks: failed barrier (gap) · dashed blocks: missing/inadequate barrier · solid bar: effective barrier · grey: Immediate Cause · blue: Precondition (dotted link) · yellow: Underlying Cause with BRF code.</p>`;
    s += `<h2>5. What happened: core diagram</h2><table><tr><th>#</th><th>Agent of Change</th><th>Object</th><th>Event</th><th>Barriers</th></tr>${M.trios.map(t => `<tr><td>${t.n}</td><td>${e(t.agent)}</td><td>${e(t.object)}</td><td>${e(t.event)}<br><span class="muted">${e(t.type)}${t.main ? ', main event' : ''}${t.potential ? ', potential event' : ''}</span></td><td>${t.barriers}</td></tr>`).join('')}</table>`;
    s += `<h2>6. How it happened: barriers</h2><table><tr><th>Trio</th><th>Trajectory</th><th>Barrier</th><th>Status</th></tr>${M.barrierRows.map(b => `<tr><td>${b.trio}</td><td>${e(b.side)}</td><td>${e(b.label)}</td><td>${e(b.type)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No barriers recorded.</td></tr>'}</table>`;
    s += `<h2>7. Why it happened: Tripod causation paths</h2>`;
    M.paths.forEach((p, i) => {
      s += `<div class="path"><h3>7.${i + 1} Failed barrier: ${e(p.barrier)}</h3>`;
      s += p.ic ? `<p><b>Immediate Cause:</b> ${e(p.ic.label)} <span class="muted">(${e(p.ic.kind)}${p.ic.error ? ', ' + e(p.ic.error) : ''})</span></p>${p.ic.notes ? `<p class="muted">${e(p.ic.notes)}</p>` : ''}` : '<p><b>Immediate Cause:</b> <i>not identified</i></p>';
      p.pcs.forEach(pc => { s += `<p><b>Precondition:</b> ${e(pc.label)} <span class="muted">(${pc.scope})</span></p>`; pc.ucs.forEach(u => { s += `<p style="margin-left:18px"><b>Underlying Cause:</b> ${e(u.label)} ${u.brf ? `<span class="tag">${e(u.brf)}</span> <span class="muted">${e(u.brfName)}</span>` : ''}</p>`; }); });
      if (p.ic && !p.pcs.length && p.ic.justification) s += `<p class="muted">No Precondition: ${e(p.ic.justification)}</p>`;
      s += '</div>';
    });
    if (M.missing.length) { s += `<h3>Missing and inadequate barriers</h3><table><tr><th>Barrier</th><th>Type</th><th>Underlying Causes</th></tr>${M.missing.map(b => `<tr><td>${e(b.barrier)}</td><td>${e(b.type)}</td><td>${b.ucs.map(u => e(u.label) + (u.brf ? ` <span class="tag">${e(u.brf)}</span>` : '')).join('<br>')}</td></tr>`).join('')}</table>`; }
    if (M.effective.length) { s += `<h3>Effective barriers</h3><p>These barriers worked and prevented further harm:</p><ul>${M.effective.map(b => `<li>${e(b.label)} (trio ${b.trio})</li>`).join('')}</ul>`; }
    if (M.narratives.length) s += `<h3>Notes</h3><ul>${M.narratives.map(t => `<li>${e(t)}</li>`).join('')}</ul>`;
    const mx = Math.max(1, ...M.brf.map(b => b.n));
    s += `<h2>8. Basic Risk Factor profile</h2><table><tr><th>BRF</th><th>Underlying Causes</th><th style="width:40%">Profile</th></tr>${M.brf.map(b => `<tr><td><b>${b.code}</b> ${e(b.name)}</td><td>${b.n}${b.items.length ? '<br><span class="muted">' + b.items.map(e).join('; ') + '</span>' : ''}</td><td><span class="bar" style="width:${(b.n / mx) * 100}%"></span></td></tr>`).join('')}</table>`;
    s += `<h2>9. Recommended actions</h2>${M.actions.length ? `<table><tr><th>#</th><th>Addresses</th><th>Action</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th></tr>${M.actions.map(a => `<tr><td>${a.n}</td><td>${e(a.targetLabel)}<br><span class="muted">${e(a.targetType)}</span></td><td>${e(a.text)}${a.smartOk ? '' : '<br><span class="muted">Not yet confirmed SMART</span>'}</td><td>${e(a.owner || '')}</td><td>${e(a.due || '')}</td><td>${e(a.priority || '')}</td><td>${e(a.status || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No actions recorded.</p>'}`;
    if (m.lessons) s += `<h2>10. Lessons learned</h2><ul>${String(m.lessons).split('\n').filter(x => x.trim()).map(l => `<li>${e(l)}</li>`).join('')}</ul>`;
    const open = M.issues.filter(i => i.sev !== 'tip');
    s += `<h2>${m.lessons ? 11 : 10}. Tree quality check</h2>${open.length ? `<p>${M.counts.errors} rule error(s) and ${M.counts.warnings} warning(s) remain against the Tripod Beta tree rules (User Guide Annex 2 and 6):</p><ul>${open.map(i => `<li><b>${i.sev}</b> ${e(i.msg)} <span class="muted">${e(i.ref)}</span></li>`).join('')}</ul>` : '<p>The tree meets the Tripod Beta tree rules checked by this tool, and every Failed/Missing Barrier and Underlying Cause has a recommended action.</p>'}`;
    s += `<h2>Management review and sign-off</h2><p>${m.reviewer ? 'Reviewed by ' + e(m.reviewer) + (m.reviewDate ? ' on ' + e(m.reviewDate) : '') + '.' : 'Management should check the appropriateness of the recommendations, especially those on Underlying Causes, and confirm resources for them.'}</p><div class="sign"><div>Investigation team leader</div><div>Tripod Beta practitioner</div><div>Accountable manager</div></div>`;
    s += `<div class="foot">Prepared with the Istec Training Tripod Beta Investigator. Method: Tripod Beta User Guide (Stichting Tripod Foundation). ${e(m.ref || '')}</div></div>`;
    return s;
  }
  function reportHTML(c, treeSvg) {
    const m = c.meta || {};
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html((m.ref ? m.ref + ' ' : '') + (m.title || 'Tripod Beta report'))}</title><style>body{margin:0;background:#fff}${REPORT_CSS}</style></head><body>${reportBody(c, treeSvg)}</body></html>`;
  }

  /* ---------- draw.io ----------------------------------------------------- */
  const DRAWIO_STYLE = {
    agent: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFF6BF;strokeColor=#161616;strokeWidth=5;dashed=1;dashPattern=3 2;',
    object: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#1F8F4E;strokeWidth=6;',
    event: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D7262E;strokeWidth=6;',
    eventAgent: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFD200;gradientColor=#D7262E;strokeColor=#202020;',
    eventObject: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#1F8F4E;gradientColor=#D7262E;strokeColor=#202020;fontColor=#FFFFFF;',
    failed: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111111;strokeWidth=3;',
    missing: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111111;strokeWidth=2;dashed=1;',
    inadequate: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111111;strokeWidth=2;dashed=1;dashPattern=8 4;',
    effective: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#111111;strokeWidth=4;',
    ic: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A8;strokeWidth=6;',
    pc: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#2F6DB5;strokeWidth=6;',
    uc: 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#F2C230;strokeWidth=6;',
    narrative: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FBFAF2;strokeColor=#8B8A7A;dashed=1;fontStyle=2;'
  };
  function drawioXML(c) {
    const pot = potentialMap(c);
    let cells = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
    c.nodes.forEach(n => {
      const g = geom(n);
      const cap = caption(n, { potential: pot });
      const label = `<font style="font-size:8px" color="#5b5b5b">${html(cap)}</font><br>${html(n.label || '')}${n.type === 'uc' && n.brf ? ` <b>[${html(n.brf)}]</b>` : ''}`;
      cells += `<object id="n_${xml(n.id)}" label="${xml(label)}" tb_type="${xml(n.type)}" tb_id="${xml(n.id)}"${n.brf ? ` tb_brf="${xml(n.brf)}"` : ''}><mxCell style="${DRAWIO_STYLE[n.type] || ''}fontFamily=Arial;fontSize=11;align=left;spacingLeft=6;verticalAlign=top;spacingTop=4;" vertex="1" parent="1"><mxGeometry x="${n.x || 0}" y="${n.y || 0}" width="${g.w}" height="${g.h}" as="geometry"/></mxCell></object>`;
    });
    const byId = {}; c.nodes.forEach(n => byId[n.id] = n);
    c.edges.forEach(e => {
      const a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      const k = R.edgeKind(a.type, b.type);
      const st = 'endArrow=none;html=1;rounded=0;curved=1;strokeColor=#3A3F47;' + (k === 'probable' ? 'dashed=1;dashPattern=1 4;strokeWidth=2;' : k === 'note' ? 'dashed=1;' : 'strokeWidth=1.5;');
      cells += `<mxCell id="e_${xml(e.id)}" style="${st}" edge="1" parent="1" source="n_${xml(e.from)}" target="n_${xml(e.to)}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
    });
    const m = c.meta || {};
    return `<mxfile host="TripodBetaInvestigator" type="device"><diagram id="tripod" name="${xml(m.ref || 'Tripod Beta tree')}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
  }
  /* Editable SVG: a picture with the mxfile embedded, which draw.io opens directly. */
  function drawioSVG(c) {
    const svg = treeSVG(c, { noTitle: true });
    return svg.replace('<svg ', `<svg content="${xml(drawioXML(c))}" `);
  }

  /* ---------- Storyline Casebook package ---------------------------------- */
  function casebookPackage(c) {
    const m = c.meta || {}, M = model(c), ix = R.index(c);
    const evs = R.trios(c, ix).sort((a, b) => (a.event.x || 0) - (b.event.x || 0)).map(t => t.event);
    const evidence = [], evIdx = {};
    const evFor = n => { const t = (n.evidence || '').trim(); if (!t) return []; if (!evIdx[t]) { const id = 'EV-' + String(evidence.length + 1).padStart(3, '0'); evIdx[t] = id; evidence.push({ id, type: 'Document', description: t, source: '', collectedBy: 'Investigation team', collectedAt: m.date || '', status: 'Logged' }); } return [evIdx[t]]; };
    const st = n => n.verified === false ? 'presumptive' : 'proven';
    const pcs = c.nodes.filter(n => n.type === 'pc'), ucs = c.nodes.filter(n => n.type === 'uc');
    const cid = {}; pcs.forEach((p, i) => cid[p.id] = 'c' + (i + 1));
    const rid = {}; ucs.forEach((u, i) => rid[u.id] = 'rc' + (i + 1));
    const icam = [];
    c.nodes.forEach(n => {
      const cat = { failed: 'defences', missing: 'defences', inadequate: 'defences', ic: 'actions', pc: 'conditions', uc: 'organizational' }[n.type];
      if (!cat) return;
      icam.push({ id: 'i' + (icam.length + 1), category: cat, description: n.label, linkedType: n.type === 'pc' ? 'condition' : 'general', linkedId: n.type === 'pc' ? cid[n.id] : null, code: n.type === 'uc' ? (n.brf || '') : '', codeLabel: n.type === 'uc' ? ('Tripod BRF: ' + (brfName(n.brf) || 'not assigned')) : T[n.type].name, codeStatus: n.type === 'uc' ? 'Contributing' : '' });
    });
    const byId = ix.byId;
    const pkg = {
      format: 'storyline-casebook-case', version: 1, exportedAt: new Date().toISOString(), source: 'Tripod Beta Investigator (Istec Training)',
      case: { caseTitle: m.title || 'Tripod Beta investigation', facility: m.site || m.client || '', location: m.location || '', incidentType: m.incidentType === 'People' ? 'Personal Injury' : (m.incidentType || ''),
        dateOccurred: m.date || '', timeOccurred: m.time || '', reportedBy: m.practitioner || '', initialDescription: m.description || '', refinedDescription: m.summary || '',
        actualSeverity: +m.actualSeverity || 1, potentialSeverity: +m.potentialSeverity || 1, status: m.status === 'Final' ? 'closed' : 'review',
        rootCause: { immediateCauses: c.nodes.filter(n => n.type === 'ic').map(n => n.label).join('; ') } },
      investigationTeam: (c.team || []).map(t => ({ name: t.name, role: /lead|leader/i.test(t.role) ? 'Lead Investigator' : 'Co-Investigator', customRole: t.role || '', organization: m.client || '', contact: '', notes: t.role || '' })),
      involvedPersons: [],
      evidence: [],
      events: evs.map((e, i) => ({ id: 'e' + (i + 1), time: '', text: e.label, status: st(e), evidenceIds: evFor(e) })),
      conditions: pcs.map(p => ({ id: cid[p.id], eventId: null, text: p.label, status: st(p), evidenceIds: evFor(p) })),
      icamFactors: icam, contributingFactors: [],
      rootCauses: ucs.map(u => ({ id: rid[u.id], text: u.label + (u.brf ? ' (BRF ' + u.brf + ': ' + brfName(u.brf) + ')' : '') })),
      keyLearnings: String(m.lessons || '').split('\n').filter(x => x.trim()).map((t, i) => ({ id: 'kl' + (i + 1), text: t.trim() })),
      correctiveActions: (c.actions || []).map((a, i) => { const t = byId[a.target]; const isUC = t && t.type === 'uc'; return { id: 'a' + (i + 1), finding: t ? 'Addresses ' + T[t.type].name + ': ' + t.label : '', linkedCauseType: isUC ? 'root' : 'additional', linkedCauseId: isUC ? rid[t.id] : null, action: a.text, timeframe: isUC ? 'longterm' : 'intermediate', hocLevel: 'administrative', owner: a.owner || '', targetDate: a.due || '' }; }),
      photos: []
    };
    pkg.evidence = evidence;
    return pkg;
  }

  /* ---------- zip + docx -------------------------------------------------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = s => new TextEncoder().encode(s);
  function zip(files) {
    const parts = [], cd = []; let off = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(f => {
      const name = enc(f.name), data = typeof f.data === 'string' ? enc(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cd.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    const cdSize = cd.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    const all = parts.concat(cd, [new Uint8Array(e.buffer)]);
    const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; });
    return out;
  }

  /* images: [{id:'tree'|'logo', bytes:Uint8Array, w, h}] (pixel sizes) */
  function docx(c, images) {
    const M = model(c), m = M.meta;
    const img = {}; (images || []).forEach(i => img[i.id] = i);
    const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    const run = (t, o) => { o = o || {}; const rp = (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.color ? `<w:color w:val="${o.color}"/>` : '') + (o.sz ? `<w:sz w:val="${o.sz}"/>` : '') + (o.hl ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.hl}"/>` : '');
      return String(t == null ? '' : t).split('\n').map((l, i) => (i ? '<w:r><w:br/></w:r>' : '') + `<w:r>${rp ? '<w:rPr>' + rp + '</w:rPr>' : ''}<w:t xml:space="preserve">${xml(l)}</w:t></w:r>`).join(''); };
    const para = (content, o) => { o = o || {}; const pp = (o.style ? `<w:pStyle w:val="${o.style}"/>` : '') + (o.ind ? `<w:ind w:left="${o.ind}"/>` : '') + (o.keep ? '<w:keepNext/>' : '');
      return `<w:p>${pp ? '<w:pPr>' + pp + '</w:pPr>' : ''}${typeof content === 'string' ? run(content, o) : content.join('')}</w:p>`; };
    const H1 = t => para(t, { style: 'Heading1' }), H2 = t => para(t, { style: 'Heading2' });
    const CW = 9638;
    const table = (head, rows, widths) => {
      const tw = widths.reduce((a, b) => a + b, 0), ws = widths.map(x => Math.round(x / tw * CW));
      const border = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="A9B2BE"/>`).join('') + '</w:tblBorders>';
      const cell = (content, w, hd) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${hd ? '<w:shd w:val="clear" w:color="auto" w:fill="E4EAF3"/>' : ''}</w:tcPr>${(Array.isArray(content) ? content : [content]).map(x => x && x.startsWith && x.startsWith('<w:p') ? x : para(String(x == null ? '' : x), { b: hd, sz: 18 })).join('')}</w:tc>`;
      return `<w:tbl><w:tblPr><w:tblW w:w="${CW}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
        `<w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h, i) => cell(h, ws[i], true)).join('')}</w:tr>` + rows.map(r => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((v, i) => cell(v, ws[i], false)).join('')}</w:tr>`).join('') + '</w:tbl>' + para('');
    };
    let pic = 0;
    const picture = (id, rid, maxWin, maxHin) => {
      const im = img[id]; if (!im) return '';
      const ratio = im.h / im.w; let wi = maxWin, hi = wi * ratio; if (hi > maxHin) { hi = maxHin; wi = hi / ratio; }
      const cx = Math.round(wi * 914400), cy = Math.round(hi * 914400); pic++;
      return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${pic}" name="${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${pic}" name="${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    };
    const portrait = '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>';
    const landscape = '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>';
    const sev = n => ['', 'Minor', 'Moderate', 'Serious', 'Major', 'Catastrophic'][+n] || '';
    let b = '';
    b += para('ISTEC TRAINING · TRIPOD BETA INCIDENT ANALYSIS', { b: true, color: '1D4EA3', sz: 18 });
    if (img.logo) b += picture('logo', 'rIdLogo', 2.2, 0.9);
    b += para(m.title || 'Untitled investigation', { style: 'Title' });
    b += para([m.ref, m.client].filter(Boolean).join(' · '), { color: '5B6573' });
    b += table(['Item', 'Detail'], [
      ['Date and time', (m.date || '') + (m.time ? ', ' + m.time : '')], ['Location', m.location || ''], ['Site / business unit', m.site || ''], ['Loss category', m.incidentType || ''],
      ['Severity', `Actual ${m.actualSeverity || '–'} (${sev(m.actualSeverity)}), potential ${m.potentialSeverity || '–'} (${sev(m.potentialSeverity)})`], ['Tripod Beta practitioner', m.practitioner || ''], ['Report status', m.status || 'Draft']], [3, 7]);
    b += H1('1. Summary') + para(m.summary || m.description || '');
    b += para(`${M.trios.length} trio(s), ${M.counts.failed} failed, ${M.counts.missing} missing/inadequate and ${M.counts.effective} effective barrier(s), ${M.counts.uc} underlying cause(s), ${M.counts.actions} recommended action(s).`, { color: '5B6573' });
    b += H1('2. Description of the incident') + para(m.description || '');
    b += H1('3. Investigation team') + (M.team.length ? table(['Name', 'Role'], M.team.map(t => [t.name, t.role]), [5, 5]) : para('No team recorded.'));
    b += `<w:p><w:pPr><w:sectPr>${portrait}</w:sectPr></w:pPr></w:p>`;
    b += H1('4. Tripod Beta tree') + (img.tree ? picture('tree', 'rIdTree', 10.1, 5.6) : para('Tree image not available.'));
    b += para('Time runs left to right. Red: Event. Striped: Agent of Change. Green: Object. Paired black blocks: failed barrier. Dashed blocks: missing/inadequate barrier. Solid bar: effective barrier. Grey: Immediate Cause. Blue: Precondition (dotted link). Yellow: Underlying Cause with BRF code.', { sz: 16, color: '5B6573' });
    b += `<w:p><w:pPr><w:sectPr>${landscape}</w:sectPr></w:pPr></w:p>`;
    b += H1('5. What happened: core diagram') + table(['#', 'Agent of Change', 'Object', 'Event', 'Barriers'], M.trios.map(t => [t.n, t.agent, t.object, t.event + '\n' + t.type + (t.main ? ', main event' : '') + (t.potential ? ', potential event' : ''), t.barriers]), [0.6, 3, 3, 3.4, 1]);
    b += H1('6. How it happened: barriers') + (M.barrierRows.length ? table(['Trio', 'Trajectory', 'Barrier', 'Status'], M.barrierRows.map(r => [r.trio, r.side, r.label, r.type]), [0.8, 1.8, 5, 2]) : para('No barriers recorded.'));
    b += H1('7. Why it happened: Tripod causation paths');
    M.paths.forEach((p, i) => {
      b += H2(`7.${i + 1} Failed barrier: ${p.barrier}`);
      b += p.ic ? para([run('Immediate Cause: ', { b: true }), run(p.ic.label), run(` (${p.ic.kind}${p.ic.error ? ', ' + p.ic.error : ''})`, { color: '5B6573' })]) : para('Immediate Cause: not identified', { i: true });
      if (p.ic && p.ic.notes) b += para(p.ic.notes, { color: '5B6573', ind: 360 });
      p.pcs.forEach(pc => { b += para([run('Precondition: ', { b: true }), run(pc.label), run(` (${pc.scope})`, { color: '5B6573' })], { ind: 360 }); pc.ucs.forEach(u => { b += para([run('Underlying Cause: ', { b: true }), run(u.label), u.brf ? run(`  [${u.brf} ${u.brfName}]`, { b: true, color: '7A5B00' }) : ''], { ind: 720 }); }); });
    });
    if (M.missing.length) b += H2('Missing and inadequate barriers') + table(['Barrier', 'Type', 'Underlying Causes'], M.missing.map(x => [x.barrier, x.type, x.ucs.map(u => u.label + (u.brf ? ' [' + u.brf + ']' : '')).join('\n')]), [4, 2, 5]);
    if (M.effective.length) { b += H2('Effective barriers'); M.effective.forEach(x => { b += para('• ' + x.label + ' (trio ' + x.trio + ')', { ind: 240 }); }); }
    if (M.narratives.length) { b += H2('Notes'); M.narratives.forEach(t => { b += para('• ' + t, { ind: 240 }); }); }
    b += H1('8. Basic Risk Factor profile') + table(['BRF', 'Count', 'Underlying Causes'], M.brf.map(x => [x.code + ' ' + x.name, x.n, x.items.join('; ')]), [3, 1, 6]);
    b += H1('9. Recommended actions') + (M.actions.length ? table(['#', 'Addresses', 'Action', 'Owner', 'Due', 'Priority', 'Status'], M.actions.map(a => [a.n, a.targetLabel + '\n(' + a.targetType + ')', a.text + (a.smartOk ? '' : '\nNot yet confirmed SMART'), a.owner || '', a.due || '', a.priority || '', a.status || '']), [0.5, 2.6, 4.4, 1.6, 1.2, 1, 1]) : para('No actions recorded.'));
    let hn = 10;
    if (m.lessons) { b += H1(hn++ + '. Lessons learned'); String(m.lessons).split('\n').filter(x => x.trim()).forEach(l => { b += para('• ' + l, { ind: 240 }); }); }
    const open = M.issues.filter(i => i.sev !== 'tip');
    b += H1(hn + '. Tree quality check') + (open.length ? para(`${M.counts.errors} rule error(s) and ${M.counts.warnings} warning(s) remain against the Tripod Beta tree rules.`) + open.map(i => para('• ' + i.sev.toUpperCase() + ': ' + i.msg + (i.ref ? ' (' + i.ref + ')' : ''), { ind: 240, sz: 18 })).join('') : para('The tree meets the Tripod Beta tree rules checked by this tool, and every Failed/Missing Barrier and Underlying Cause has a recommended action.'));
    b += H1('Management review and sign-off') + para(m.reviewer ? 'Reviewed by ' + m.reviewer + (m.reviewDate ? ' on ' + m.reviewDate : '') + '.' : 'Management should check the appropriateness of the recommendations, especially those on Underlying Causes, and confirm resources for them.');
    b += table(['Investigation team leader', 'Tripod Beta practitioner', 'Accountable manager'], [['\n\nName, signature, date', '\n\nName, signature, date', '\n\nName, signature, date']], [1, 1, 1]);
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${b}<w:sectPr>${portrait}</w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
      `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="0F2A4D"/><w:sz w:val="44"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="2" w:color="0F2A4D"/></w:pBdr><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="0F2A4D"/><w:sz w:val="30"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1D4EA3"/><w:sz w:val="23"/></w:rPr></w:style></w:styles>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${img.tree ? '<Relationship Id="rIdTree" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tree.png"/>' : ''}${img.logo ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : ''}</Relationships>`;
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(m.title || 'Tripod Beta report')}</dc:title><dc:creator>Istec Training Tripod Beta Investigator</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>` },
      { name: 'word/document.xml', data: doc },
      { name: 'word/styles.xml', data: styles },
      { name: 'word/_rels/document.xml.rels', data: rels }
    ];
    if (img.tree) files.push({ name: 'word/media/tree.png', data: img.tree.bytes });
    if (img.logo) files.push({ name: 'word/media/logo.png', data: img.logo.bytes });
    return zip(files);
  }

  return { geom, wrap, defs, nodeSVG, renderTree, treeSVG, tidy, anchors, pathD, model, reportBody, reportHTML, REPORT_CSS, drawioXML, drawioSVG, casebookPackage, docx, zip, crc32, potentialMap, caption, COL };
})();
if (typeof module !== 'undefined') module.exports = TBX;
