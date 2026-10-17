/* RCA Fault Tree — report (HTML), Word (.docx, hand-built), CSV and Storyline Casebook package. Pure string builders. */
var RCAX = (function () {
  const E = (typeof RCAE !== 'undefined') ? RCAE : require('./engine.js');
  const LIB = E.LIB;
  const h = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const xml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const srcName = k => (LIB.SOURCES.find(s => s.k === k) || {}).name || '';

  function model(c) {
    const pri = E.evaluate(c, 'prior'), evd = E.evaluate(c, 'evidence'), post = E.posteriors(c).out, cs = E.rankCutSets(c), issues = E.check(c);
    const rows = E.walk(c).map(({ n, depth }) => {
      const it = E.libItem(c, n.prob && n.prob.item), u = E.unitOf(c, n);
      return { n, depth, type: E.isGate(n) ? n.gate + ' gate' : E.KINDS[n.kind], status: (E.STATUS[n.status] || E.STATUS.unverified).name,
        src: E.isGate(n) ? '' : srcName((n.prob || {}).src || 'none'), lib: it, value: E.isGate(n) ? NaN : E.rawValue(c, n), unit: u,
        prior: pri.val(n.id), evid: evd.val(n.id), post: post[n.id] };
    });
    const counts = {}; Object.keys(E.STATUS).forEach(k => counts[k] = rows.filter(r => r.n.status === k).length);
    const roots = rows.filter(r => r.n.cause === 'root' && r.n.status !== 'ruledout');
    const causal = rows.filter(r => r.n.cause === 'causal' && r.n.status !== 'ruledout');
    const contrib = rows.filter(r => r.n.cause === 'contributing' && r.n.status !== 'ruledout');
    const open = rows.filter(r => (r.n.status === 'unverified' || r.n.status === 'likely') && r.n.id !== c.root).sort((a, b) => (isNaN(b.post) ? -1 : b.post) - (isNaN(a.post) ? -1 : a.post));
    const acts = (c.actions || []).map((a, i) => { const t = c.nodes[a.target]; return Object.assign({ n: i + 1, tlabel: t ? (t.code + ' ' + t.label) : '(not linked)' }, a); });
    return { meta: c.meta || {}, rows, counts, roots, causal, contrib, open, cs, pri, evd, acts, issues };
  }

  const REPORT_CSS = `.rpt{font:14px/1.55 Arial,Helvetica,sans-serif;color:#141c26;background:#fff;max-width:1040px;margin:0 auto;padding:36px 40px 60px}
.rpt h1,.rpt h2,.rpt h3{font-family:Arial,Helvetica,sans-serif;letter-spacing:0}.rpt h1{font-size:27px;margin:6px 0 4px;color:#0f2a4d}.rpt h2{font-size:19px;color:#0f2a4d;border-bottom:2px solid #0f2a4d;padding-bottom:4px;margin:28px 0 10px}.rpt h3{font-size:15px;margin:16px 0 6px}
.rpt .brand{font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#1d4ea3;border-top:8px solid #0f2a4d;padding-top:16px}
.rpt .kv{display:grid;grid-template-columns:170px 1fr;gap:4px 14px;margin:14px 0}.rpt .kv b{color:#4b5563;font-weight:600}
.rpt table{border-collapse:collapse;width:100%;font-size:12.5px;margin:6px 0 10px}.rpt th,.rpt td{border:1px solid #b9c1cc;padding:5px 7px;text-align:left;vertical-align:top}.rpt th{background:#e4eaf3;font-weight:600}
.rpt .tree{overflow-x:auto;border:1px solid #d0d6de;padding:6px;margin:8px 0}.rpt .tree svg{max-width:100%;height:auto}.rpt .muted{color:#5b6573}
.rpt .st{display:inline-block;font-size:11px;font-weight:700;padding:0 6px;border-radius:8px}.rpt .st-confirmed{background:#e3f3e9;color:#1f7a45}.rpt .st-likely{background:#fff1d9;color:#a86200}.rpt .st-unverified{background:#eef1f4;color:#64707e}.rpt .st-ruledout{background:#f6e3e1;color:#b42318}
.rpt .bar{display:inline-block;height:10px;background:#1d4ea3;border-radius:2px;vertical-align:middle;margin-right:6px}
.rpt .sign{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px}.rpt .sign div{border-top:1px solid #333;padding-top:4px;font-size:12px;min-height:56px}
.rpt .foot{margin-top:36px;font-size:11px;color:#6b7280;border-top:1px solid #d0d6de;padding-top:8px}
@media print{.rpt{padding:0;max-width:none}.rpt h2{break-after:avoid}.rpt tr{break-inside:avoid}.rpt .pb{break-before:page}}`;

  function reportBody(c, svg) {
    const M = model(c), m = M.meta, F = E.fmt;
    const chip = k => `<span class="st st-${k}">${h((E.STATUS[k] || {}).name || k)}</span>`;
    const nodeLine = r => `<b>${h(r.n.code)}</b> ${h(r.n.label)}`;
    let s = `<div class="rpt"><div class="brand">Istec Training · Root cause analysis · Cause-and-effect fault tree</div><h1>${h(m.title || 'Untitled investigation')}</h1><div class="muted">${h([m.ref, m.site, m.client].filter(Boolean).join(' · '))}</div>`;
    s += `<div class="kv"><b>Date and time</b><span>${h(m.date || '–')}${m.time ? ', ' + h(m.time) : ''}</span><b>Location</b><span>${h(m.location || '–')}</span><b>Investigator</b><span>${h(m.investigator || '–')}</span><b>Team</b><span>${h(m.team || '–')}</span><b>Status</b><span>${h(m.status || 'Draft')}</span></div>`;
    s += `<h2>1. Description of the incident</h2><p>${h(m.description || '').replace(/\n/g, '<br>')}</p>`;
    s += `<h2>2. Conclusion</h2><p>${h(m.conclusion || 'Not yet written.').replace(/\n/g, '<br>')}</p>`;
    const list = (L, empty) => L.length ? `<ul>${L.map(r => `<li>${nodeLine(r)}${r.n.category ? ` <span class="muted">(${h(r.n.category)})</span>` : ''} ${chip(r.n.status)}${r.n.why ? `<br><span class="muted">Why: ${h(r.n.why)}</span>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${empty}</p>`;
    s += `<h3>Root causes</h3>${list(M.roots, 'None identified yet.')}<h3>Causal factors</h3>${list(M.causal, 'None classified.')}<h3>Contributing factors</h3>${list(M.contrib, 'None classified.')}`;
    s += `<h2 class="pb">3. Fault tree</h2><div class="tree">${svg || ''}</div><p class="muted">Values shown are given the evidence (ruled-out causes = 0, confirmed causes = 1). “Given incident” is the probability that an unresolved cause contributed, given that the top event happened. Status: ${Object.keys(M.counts).map(k => E.STATUS[k].name + ' ' + M.counts[k]).join(' · ')}.</p>`;
    s += `<h2>4. Hypotheses and evidence</h2><table><tr><th>Code</th><th>Cause / event</th><th>Type</th><th>Status</th><th>Evidence / test</th></tr>${M.rows.map(r => `<tr><td>${h(r.n.code)}</td><td style="padding-left:${7 + r.depth * 12}px">${h(r.n.label)}</td><td>${h(r.type)}</td><td>${chip(r.n.status)}</td><td>${h(r.n.evidence || '')}${r.n.test && r.n.status !== 'confirmed' && r.n.status !== 'ruledout' ? `<br><span class="muted">Test: ${h(r.n.test)}${r.n.testOwner ? ' (' + h(r.n.testOwner) + (r.n.testDue ? ', ' + h(r.n.testDue) : '') + ')' : ''}</span>` : ''}</td></tr>`).join('')}</table>`;
    if (M.open.length) {
      const mx = Math.max(0.0001, ...M.open.map(r => isNaN(r.post) ? 0 : r.post));
      s += `<h3>Open hypotheses ranked by likelihood given the incident</h3><table><tr><th>Cause</th><th>Status</th><th style="width:34%">P(contributed | incident)</th><th>Planned test</th></tr>${M.open.map(r => `<tr><td>${nodeLine(r)}</td><td>${chip(r.n.status)}</td><td>${isNaN(r.post) ? '<span class="muted">needs values</span>' : `<span class="bar" style="width:${Math.max(2, r.post / mx * 140)}px"></span>${Math.round(r.post * 100)} %`}</td><td>${h(r.n.test || '')}</td></tr>`).join('')}</table>`;
    }
    s += `<h2>5. Quantification</h2><p>Top event, before the evidence (all hypotheses at their screening values): <b>${F(M.pri.top.v, M.pri.top.u)}</b>. Given the evidence: <b>${F(M.evd.top.v, M.evd.top.u)}</b>.</p>`;
    const q = M.rows.filter(r => !E.isGate(r.n) && r.src && r.src !== 'Not quantified');
    s += q.length ? `<table><tr><th>Code</th><th>Event</th><th>Source</th><th>Library item / default</th><th>Value used</th><th>Note</th></tr>${q.map(r => `<tr><td>${h(r.n.code)}</td><td>${h(r.n.label)}</td><td>${h(r.src)}</td><td>${r.lib ? h(r.lib.name) + '<br><span class="muted">' + F(r.lib.value, r.lib.unit) + ' · ' + h(r.lib.ref) + '</span>' : ''}</td><td>${F(r.value, r.unit)}${r.lib && r.value !== r.lib.value ? ' <b>(edited)</b>' : ''}</td><td>${h((r.n.prob || {}).note || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No events quantified. The analysis is qualitative.</p>';
    const cs = M.cs.rows.slice(0, 15);
    s += `<h3>Credible causal combinations (minimal cut sets)</h3><p class="muted">Each row is a combination of causes that together produce the top event. ${M.cs.eliminated} combination(s) eliminated by ruled-out causes.${M.cs.truncated ? ' List truncated.' : ''}</p><table><tr><th>#</th><th>Causes</th><th>Status</th><th>Before evidence</th><th>Given evidence</th><th>Share</th></tr>${cs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.ids.map(id => h(c.nodes[id].code + ' ' + c.nodes[id].label)).join('<br>')}</td><td>${h(r.status)}</td><td>${F(r.prior.v, r.prior.u)}</td><td>${F(r.evid.v, r.evid.u)}</td><td>${isNaN(r.share) ? '—' : Math.round(r.share * 100) + ' %'}</td></tr>`).join('')}</table>`;
    s += `<h2>6. Corrective actions</h2>${M.acts.length ? `<table><tr><th>#</th><th>Addresses</th><th>Action</th><th>Control type</th><th>Owner</th><th>Due</th><th>Status</th></tr>${M.acts.map(a => `<tr><td>${a.n}</td><td>${h(a.tlabel)}</td><td>${h(a.text)}</td><td>${h(a.control || '')}</td><td>${h(a.owner || '')}</td><td>${h(a.due || '')}</td><td>${h(a.status || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No actions recorded.</p>'}`;
    if (m.lessons) s += `<h2>7. Lessons learned</h2><ul>${String(m.lessons).split('\n').filter(x => x.trim()).map(l => `<li>${h(l)}</li>`).join('')}</ul>`;
    const open = M.issues.filter(i => i.sev !== 'tip');
    s += `<h2>${m.lessons ? 8 : 7}. Tree consistency check</h2>${open.length ? `<ul>${open.map(i => `<li><b>${i.sev}</b> ${h(i.msg)}</li>`).join('')}</ul>` : '<p>No logic or evidence inconsistencies found.</p>'}`;
    s += `<h2>Review and sign-off</h2><div class="sign"><div>Lead investigator</div><div>Reviewer</div><div>Accountable manager</div></div>`;
    s += `<div class="foot">Prepared with the Istec Training RCA Fault Tree. Screening values from generic sources (${Object.values(LIB.REFS).join('; ')}). They rank hypotheses; they are not design data.</div></div>`;
    return s;
  }
  function reportHTML(c, svg) { const m = c.meta || {}; return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h((m.ref ? m.ref + ' ' : '') + (m.title || 'RCA report'))}</title><style>body{margin:0;background:#fff}${REPORT_CSS}</style></head><body>${reportBody(c, svg)}</body></html>`; }

  /* CSV of every node */
  function csv(c) {
    const M = model(c), q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['Code', 'Level', 'Description', 'Type', 'Status', 'Cause class', 'Category', 'Evidence', 'Test', 'Test owner', 'Test due', 'Source', 'Library item', 'Library value', 'Value used', 'Unit', 'Value note', 'Value given evidence', 'P(contributed|incident)', 'Why it occurred'];
    const rows = M.rows.map(r => [r.n.code, r.depth, r.n.label, r.type, r.status, E.CAUSE[r.n.cause || ''], r.n.category, r.n.evidence, r.n.test, r.n.testOwner, r.n.testDue, r.src, r.lib ? r.lib.name : '', r.lib ? r.lib.value : '', isNaN(r.value) ? '' : r.value, r.unit === 'f' ? '/yr' : 'probability', (r.n.prob || {}).note, isNaN(r.evid.v) ? '' : r.evid.v, isNaN(r.post) || r.post == null ? '' : r.post, r.n.why]);
    return '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
  }

  /* Storyline Casebook case package (events = confirmed chain, conditions = contributing, root causes) */
  function casebookPackage(c) {
    const M = model(c), m = M.meta;
    const confirmed = M.rows.filter(r => r.n.status === 'confirmed' && r.n.id !== c.root && !E.isGate(r.n));
    const rcs = M.roots.map((r, i) => ({ id: 'rc' + (i + 1), text: r.n.label + (r.n.why ? ' — ' + r.n.why : ''), _node: r.n.id }));
    const pkg = {
      format: 'storyline-casebook-case', version: 1, exportedAt: new Date().toISOString(), source: 'RCA Fault Tree (Istec Training)',
      case: { caseTitle: m.title || 'RCA investigation', facility: m.site || '', location: m.location || '', incidentType: '', dateOccurred: m.date || '', timeOccurred: m.time || '', reportedBy: m.investigator || '',
        initialDescription: m.description || '', refinedDescription: m.conclusion || '', actualSeverity: 1, potentialSeverity: 1, status: m.status === 'Final' ? 'closed' : 'review' },
      investigationTeam: String(m.team || '').split(/;|\n/).map(x => x.trim()).filter(Boolean).map((t, i) => ({ name: t, role: i ? 'Co-Investigator' : 'Lead Investigator', customRole: '', organization: m.site || '', contact: '', notes: '' })),
      involvedPersons: [], evidence: [],
      events: [{ id: 'e1', time: m.time || '', text: (c.nodes[c.root] || {}).label || m.title, status: 'proven', evidenceIds: [] }],
      conditions: confirmed.map((r, i) => ({ id: 'c' + (i + 1), eventId: 'e1', text: r.n.code + ' ' + r.n.label, status: 'proven', evidenceIds: [] })),
      icamFactors: [], contributingFactors: M.contrib.map((r, i) => ({ id: 'cf' + (i + 1), text: r.n.label })),
      rootCauses: rcs.map(r => ({ id: r.id, text: r.text })),
      keyLearnings: String(m.lessons || '').split('\n').filter(x => x.trim()).map((t, i) => ({ id: 'kl' + (i + 1), text: t.trim() })),
      correctiveActions: (c.actions || []).map((a, i) => { const rc = rcs.find(r => r._node === a.target); const t = c.nodes[a.target]; return { id: 'a' + (i + 1), finding: t ? 'Addresses ' + t.code + ': ' + t.label : '', linkedCauseType: rc ? 'root' : 'additional', linkedCauseId: rc ? rc.id : null, action: a.text, timeframe: rc ? 'longterm' : 'intermediate', hocLevel: ({ Elimination: 'elimination', Substitution: 'substitution', Engineering: 'engineering', Administrative: 'administrative', PPE: 'ppe' })[a.control] || 'administrative', owner: a.owner || '', targetDate: a.due || '' }; }),
      photos: []
    };
    return pkg;
  }

  /* ---------- zip + docx ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = s => new TextEncoder().encode(s);
  function zip(files) {
    const parts = [], cd = []; let off = 0; const d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(f => {
      const name = enc(f.name), data = typeof f.data === 'string' ? enc(f.data) : f.data, crc = crc32(data);
      const hd = new DataView(new ArrayBuffer(30));
      hd.setUint32(0, 0x04034b50, true); hd.setUint16(4, 20, true); hd.setUint16(6, 0x0800, true); hd.setUint16(10, time, true); hd.setUint16(12, date, true); hd.setUint32(14, crc, true); hd.setUint32(18, data.length, true); hd.setUint32(22, data.length, true); hd.setUint16(26, name.length, true);
      parts.push(new Uint8Array(hd.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cd.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
    });
    const cdSize = cd.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    const all = parts.concat(cd, [new Uint8Array(e.buffer)]), out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; });
    return out;
  }
  function docx(c, tree) {
    const M = model(c), m = M.meta, F = E.fmt;
    const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    const run = (t, o) => { o = o || {}; const rp = (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.color ? `<w:color w:val="${o.color}"/>` : '') + (o.sz ? `<w:sz w:val="${o.sz}"/>` : '');
      return String(t == null ? '' : t).split('\n').map((l, i) => (i ? '<w:r><w:br/></w:r>' : '') + `<w:r>${rp ? '<w:rPr>' + rp + '</w:rPr>' : ''}<w:t xml:space="preserve">${xml(l)}</w:t></w:r>`).join(''); };
    const para = (content, o) => { o = o || {}; const pp = (o.style ? `<w:pStyle w:val="${o.style}"/>` : '') + (o.ind ? `<w:ind w:left="${o.ind}"/>` : '');
      return `<w:p>${pp ? '<w:pPr>' + pp + '</w:pPr>' : ''}${typeof content === 'string' ? run(content, o) : content.join('')}</w:p>`; };
    const H1 = t => para(t, { style: 'Heading1' }), H2 = t => para(t, { style: 'Heading2' });
    const tableW = (head, rows, widths, CW) => {
      const tw = widths.reduce((a, b) => a + b, 0), ws = widths.map(x => Math.round(x / tw * CW));
      const border = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="A9B2BE"/>`).join('') + '</w:tblBorders>';
      const cell = (v, w, hd) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${hd ? '<w:shd w:val="clear" w:color="auto" w:fill="E4EAF3"/>' : ''}</w:tcPr>${para(String(v == null ? '' : v), { b: hd, sz: 17 })}</w:tc>`;
      return `<w:tbl><w:tblPr><w:tblW w:w="${CW}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="70" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((x, i) => cell(x, ws[i], true)).join('')}</w:tr>${rows.map(r => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((v, i) => cell(v, ws[i], false)).join('')}</w:tr>`).join('')}</w:tbl>` + para('');
    };
    const T = (hd, rows, w) => tableW(hd, rows, w, 9638), TL = (hd, rows, w) => tableW(hd, rows, w, 14570);
    const pic = (im, maxW, maxH) => { if (!im) return para('Tree image not available.'); const r = im.h / im.w; let wi = maxW, hi = wi * r; if (hi > maxH) { hi = maxH; wi = hi / r; } const cx = Math.round(wi * 914400), cy = Math.round(hi * 914400);
      return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="tree"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="tree.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdTree"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`; };
    const mar = '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>';
    const portrait = '<w:pgSz w:w="11906" w:h="16838"/>' + mar, landscape = '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' + mar;
    const st = n => (E.STATUS[n.status] || E.STATUS.unverified).name;
    let b = para('ISTEC TRAINING · ROOT CAUSE ANALYSIS · CAUSE-AND-EFFECT FAULT TREE', { b: true, color: '1D4EA3', sz: 18 });
    b += para(m.title || 'Untitled investigation', { style: 'Title' }) + para([m.ref, m.site, m.client].filter(Boolean).join(' · '), { color: '5B6573' });
    b += T(['Item', 'Detail'], [['Date and time', (m.date || '') + (m.time ? ', ' + m.time : '')], ['Location', m.location || ''], ['Investigator', m.investigator || ''], ['Team', m.team || ''], ['Status', m.status || 'Draft']], [3, 7]);
    b += H1('1. Description of the incident') + para(m.description || '');
    b += H1('2. Conclusion') + para(m.conclusion || 'Not yet written.');
    const li = (title, L) => H2(title) + (L.length ? L.map(r => para([run(r.n.code + ' ', { b: true }), run(r.n.label), r.n.category ? run(' (' + r.n.category + ')', { color: '5B6573' }) : '', run('  [' + st(r.n) + ']', { color: '5B6573' })], { ind: 240 }) + (r.n.why ? para('Why: ' + r.n.why, { ind: 480, color: '5B6573', sz: 18 }) : '')).join('') : para('None.', { color: '5B6573' }));
    b += li('Root causes', M.roots) + li('Causal factors', M.causal) + li('Contributing factors', M.contrib);
    b += `<w:p><w:pPr><w:sectPr>${portrait}</w:sectPr></w:pPr></w:p>`;
    b += H1('3. Fault tree') + pic(tree, 10.1, 5.7) + para('Values given the evidence (ruled out = 0, confirmed = 1). “Given incident” = probability that an unresolved cause contributed, given the top event happened.', { sz: 16, color: '5B6573' });
    b += H1('4. Hypotheses and evidence') + TL(['Code', 'Cause / event', 'Type', 'Status', 'Evidence', 'Test (open items)'], M.rows.map(r => [r.n.code, ' '.repeat(r.depth * 2) + r.n.label, r.type, st(r.n), r.n.evidence || '', r.n.status === 'confirmed' || r.n.status === 'ruledout' ? '' : (r.n.test || '') + (r.n.testOwner ? ' (' + r.n.testOwner + (r.n.testDue ? ', ' + r.n.testDue : '') + ')' : '')]), [0.8, 4, 1.6, 1.1, 4.5, 3]);
    if (M.open.length) b += H2('Open hypotheses ranked by likelihood given the incident') + TL(['Cause', 'Status', 'P(contributed | incident)', 'Planned test'], M.open.map(r => [r.n.code + ' ' + r.n.label, st(r.n), isNaN(r.post) ? 'needs values' : Math.round(r.post * 100) + ' %', r.n.test || '']), [5, 1.3, 2, 5]);
    b += `<w:p><w:pPr><w:sectPr>${landscape}</w:sectPr></w:pPr></w:p>`;
    b += H1('5. Quantification') + para(`Top event before the evidence: ${F(M.pri.top.v, M.pri.top.u)}. Given the evidence: ${F(M.evd.top.v, M.evd.top.u)}.`);
    const q = M.rows.filter(r => !E.isGate(r.n) && r.src && r.src !== 'Not quantified');
    b += q.length ? T(['Code', 'Event', 'Source', 'Library default', 'Value used', 'Note'], q.map(r => [r.n.code, r.n.label, r.src, r.lib ? r.lib.name + ' – ' + F(r.lib.value, r.lib.unit) + ' (' + r.lib.ref + ')' : '', F(r.value, r.unit) + (r.lib && r.value !== r.lib.value ? ' (edited)' : ''), (r.n.prob || {}).note || '']), [0.8, 2.6, 1.5, 2.6, 1.1, 2.4]) : para('No events quantified.');
    b += H2('Credible causal combinations (minimal cut sets)') + T(['#', 'Causes', 'Status', 'Before evidence', 'Given evidence', 'Share'], M.cs.rows.slice(0, 15).map((r, i) => [i + 1, r.ids.map(id => c.nodes[id].code + ' ' + c.nodes[id].label).join('\n'), r.status, F(r.prior.v, r.prior.u), F(r.evid.v, r.evid.u), isNaN(r.share) ? '—' : Math.round(r.share * 100) + ' %']), [0.5, 5, 1.1, 1.3, 1.3, 0.8]);
    b += H1('6. Corrective actions') + (M.acts.length ? T(['#', 'Addresses', 'Action', 'Control', 'Owner', 'Due', 'Status'], M.acts.map(a => [a.n, a.tlabel, a.text, a.control || '', a.owner || '', a.due || '', a.status || '']), [0.4, 2.4, 4, 1.3, 1.6, 1.1, 1]) : para('No actions recorded.'));
    let hn = 7;
    if (m.lessons) { b += H1(hn++ + '. Lessons learned'); String(m.lessons).split('\n').filter(x => x.trim()).forEach(l => { b += para('• ' + l, { ind: 240 }); }); }
    const open = M.issues.filter(i => i.sev !== 'tip');
    b += H1(hn + '. Tree consistency check') + (open.length ? open.map(i => para('• ' + i.sev.toUpperCase() + ': ' + i.msg, { ind: 240, sz: 18 })).join('') : para('No logic or evidence inconsistencies found.'));
    b += H1('Review and sign-off') + T(['Lead investigator', 'Reviewer', 'Accountable manager'], [['\n\nName, signature, date', '\n\nName, signature, date', '\n\nName, signature, date']], [1, 1, 1]);
    b += para('Screening values from generic sources: ' + Object.values(LIB.REFS).join('; ') + '. They rank hypotheses; they are not design data.', { sz: 15, color: '6B7280' });
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${b}<w:sectPr>${portrait}</w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="0F2A4D"/><w:sz w:val="42"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="2" w:color="0F2A4D"/></w:pBdr><w:spacing w:before="300" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="0F2A4D"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1D4EA3"/><w:sz w:val="23"/></w:rPr></w:style></w:styles>`;
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/document.xml', data: doc }, { name: 'word/styles.xml', data: styles },
      { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${tree ? '<Relationship Id="rIdTree" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tree.png"/>' : ''}</Relationships>` }
    ];
    if (tree) files.push({ name: 'word/media/tree.png', data: tree.bytes });
    return zip(files);
  }
  return { model, reportBody, reportHTML, REPORT_CSS, csv, casebookPackage, docx, zip };
})();
if (typeof module !== 'undefined') module.exports = RCAX;
