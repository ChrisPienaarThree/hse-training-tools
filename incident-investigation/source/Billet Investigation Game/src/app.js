/* =====================================================================
   THE FALLING BILLET — game engine (vanilla JS, no dependencies)
   Runs offline from a single HTML file, and as a claude.ai artifact where
   the db capability adds facilitator-led class sessions.
   ===================================================================== */
(function () {
'use strict';
const G = GAME;
const STORE_KEY = 'falling-billet-v1';
const STAGES = [
  { key: 'brief', label: 'Briefing' },
  { key: 'callout', label: 'Call-out' },
  { key: 'team', label: 'Team & severity' },
  { key: 'plan', label: 'Data plan' },
  { key: 'invest', label: 'Investigate' },
  { key: 'story', label: 'Storyline' },
  { key: 'icam', label: 'ICAM analysis' },
  { key: 'root', label: 'Root cause & actions' },
  { key: 'debrief', label: 'Debrief' }
];
const DAY_HOURS = { 1: 4, 2: 8, 3: 8 };
const DAY_START = { 1: 14 * 60, 2: 7 * 60 + 30, 3: 7 * 60 + 30 };
const DAY_DATE = { 1: '15 Sep', 2: '16 Sep', 3: '17 Sep' };
const DAY_ISO = { 1: '2008-09-15', 2: '2008-09-16', 3: '2008-09-17' };
const CAT_NAME = { P: 'People', E: 'Environment', Eq: 'Equipment', Pr: 'Procedures', O: 'Organisation' };
const LEVEL_NAME = { DF: 'Absent / failed defence', IT: 'Individual / team action', TC: 'Task / environmental condition', OF: 'Organisational factor', NONE: 'Sequence only (not a factor)' };
const UNPLANNED_PENALTY = 0.5;

/* ---------- state ----------------------------------------------------- */
function freshState() {
  return {
    v: 1, stage: 0, maxStage: 0, mode: null, teamName: '', klass: null, facilitator: false, showKey: false,
    flags: {}, callout: [], calloutDone: false,
    team: ['lead'], sevA: 0, sevP: 0, teamDone: false,
    plan: {}, planDone: false,
    day: 1, used: { 1: 0, 2: 0, 3: 0 }, done: [], investClosed: false,
    facts: {}, evidence: [], photos: [], docsSeen: [], obs: {}, obsWrong: 0,
    interviews: {}, activeInterview: null, qStats: { open: 0, probe: 0, closed: 0, leading: 0, blame: 0 },
    whys: {}, investTab: 'actions',
    story: { cls: {}, order: [], attach: {}, status: {}, checked: false },
    icam: {}, icamChecked: false,
    roots: [], rootText: '', acts: [], rootChecked: false,
    log: [], startedAt: new Date().toISOString()
  };
}
let S = freshState();

/* ---------- per-stage reset ------------------------------------------- */
/* fields each stage owns, and the later stages whose work is built on it:
   call-out flags change what witnesses and the site give up, the plan sets
   unplanned-action costs, the facts found feed the storyline, and the
   storyline decides which facts get ICAM-coded. */
const STAGE_FIELDS = {
  1: ['flags', 'callout', 'calloutDone'],
  2: ['team', 'sevA', 'sevP', 'teamDone'],
  3: ['plan', 'planDone'],
  4: ['day', 'used', 'done', 'investClosed', 'facts', 'evidence', 'photos', 'docsSeen', 'obs', 'obsWrong',
      'interviews', 'activeInterview', 'qStats', 'whys', 'investTab'],
  5: ['story'],
  6: ['icam', 'icamChecked'],
  7: ['roots', 'rootText', 'acts', 'rootChecked']
};
const STAGE_DEPS = { 1: [4, 5, 6], 2: [], 3: [4, 5, 6], 4: [5, 6], 5: [6], 6: [], 7: [] };
function stageHasProgress(i) {
  return i === 1 ? S.calloutDone || S.callout.length > 0
    : i === 2 ? S.teamDone || S.team.length > 1 || !!(S.sevA || S.sevP)
    : i === 3 ? S.planDone || Object.keys(S.plan).length > 0
    : i === 4 ? S.done.length > 0 || S.day > 1 || Object.keys(S.whys).length > 0
    : i === 5 ? Object.keys(S.story.cls).length > 0 || S.story.checked
    : i === 6 ? Object.keys(S.icam).length > 0
    : i === 7 ? S.roots.length > 0 || S.acts.length > 0 || !!S.rootText.trim() : false;
}
// header button: shown on every working stage, live as soon as there is something to clear
function refreshReset() {
  const b = $('#hdr-reset'); if (!b) return;
  b.hidden = !STAGE_FIELDS[S.stage];
  b.disabled = !b.hidden && !stageHasProgress(S.stage);
  b.title = b.disabled ? 'Nothing to reset in this stage yet' : 'Clear this stage and do it again';
}
// legacy log entries carry no stage; only the call-out entry predates the investigation
const logStage = l => l.stage != null ? l.stage : l.text === 'Call-out instructions given' ? 1 : 4;
function resetStage(i) {
  const fresh = freshState(), clear = [i].concat(STAGE_DEPS[i].filter(stageHasProgress));
  clear.forEach(k => STAGE_FIELDS[k].forEach(f => { S[f] = fresh[f]; }));
  S.log = S.log.filter(l => !has(clear, logStage(l)));
  // later stages built on this one must be redone in order; independent ones stay reachable
  S.stage = i; if (clear.length > 1) S.maxStage = i;
  logIt('Stage reset: ' + STAGES[i].label + (clear.length > 1 ? ' (also ' + clear.slice(1).map(k => STAGES[k].label).join(', ') + ')' : ''));
}
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const o = JSON.parse(raw); if (o && o.v === 1) S = Object.assign(freshState(), o); } } catch (e) {}
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
  queueProgress();
}

/* ---------- helpers ----------------------------------------------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const has = (arr, x) => arr.indexOf(x) >= 0;
const pct = x => Math.max(0, Math.min(100, Math.round(x)));
const fmtTime = mins => String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(Math.round(mins % 60)).padStart(2, '0');
const hoursLeft = () => DAY_HOURS[S.day] - S.used[S.day];
const clock = () => DAY_START[S.day] + S.used[S.day] * 60;
const fmtH = h => (Math.round(h * 100) / 100).toString().replace(/\.?0+$/, '') + ' h';
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100);
}
function logIt(text) { S.log.push({ day: S.day, time: fmtTime(clock()), text, stage: S.stage }); }

/* source index: which actions can reveal each fact */
const SOURCES = {};
function addSrc(fid, label) { (SOURCES[fid] = SOURCES[fid] || []); if (!has(SOURCES[fid], label)) SOURCES[fid].push(label); }
(function buildSources() {
  const actByWho = {}, actByDoc = {};
  G.actions.forEach(a => { if (a.who) actByWho[a.who] = a; if (a.doc) actByDoc[a.doc] = a; });
  Object.keys(G.interviews).forEach(w => G.interviews[w].qs.forEach(q => (q.facts || []).forEach(f => addSrc(f, 'Interview: ' + G.people[w].name))));
  Object.keys(G.docs).forEach(d => G.docs[d].obs.forEach(o => { if (o.fact && o.ok) addSrc(o.fact, 'Document: ' + G.docs[d].title); }));
  Object.keys(G.site).forEach(k => {
    const a = G.actions.find(x => x.id === k); const s = G.site[k];
    [s, s.good, s.poor, s.ok, s.held, s.free, s.early].forEach(o => o && (o.facts || []).forEach(f => addSrc(f, a.title)));
  });
})();

/* ---------- facts & evidence ------------------------------------------- */
function newEvidence(type, desc, source) {
  const n = 'EV-' + String(S.evidence.length + 1).padStart(3, '0');
  S.evidence.push({ id: n, type, desc, source, day: S.day, time: fmtTime(clock()) });
  return n;
}
function evFor(key, type, desc, source) {
  const e = S.evidence.find(x => x.key === key); if (e) return e.id;
  const id = newEvidence(type, desc, source); S.evidence[S.evidence.length - 1].key = key; return id;
}
function discover(fid, evId, presumptive) {
  const def = G.facts[fid]; if (!def) return false;
  const f = S.facts[fid]; let isNew = false;
  if (!f) { S.facts[fid] = { ev: evId ? [evId] : [], presumptive: !!(def.presumptive || presumptive), day: S.day }; isNew = true; }
  else {
    if (evId && !has(f.ev, evId)) f.ev.push(evId);
    if (!presumptive && !def.presumptive && f.presumptive && f.ev.length > 1) f.presumptive = false;
  }
  return isNew;
}
const known = fid => !!S.facts[fid];
function factChip(fid, isNew) {
  const d = G.facts[fid];
  return `<span class="fact-chip ${d.kind}${isNew ? ' new' : ''}" title="${esc(d.text)}"><b>${d.kind === 'event' ? 'Event' : 'Condition'}</b> ${esc(d.text)}</span>`;
}

/* ---------- class session (artifact db) -------------------------------- */
let DB = null, USER = null, SESSION = null, sessUnsub = null, teamsUnsub = null, TEAMS = [];
const HAS_RUNTIME = !!(window.claude && typeof window.claude.use === 'function');
async function initRuntime() {
  if (!HAS_RUNTIME) return;
  try { DB = await window.claude.use('db'); } catch (e) { DB = null; }
  try { USER = await window.claude.use('user'); } catch (e) { USER = null; }
  if (S.klass) subscribeSession(S.klass.code);
  render();
}
function subscribeSession(code) {
  if (!DB) return;
  if (sessUnsub) { try { sessUnsub(); } catch (e) {} }
  sessUnsub = DB.doc('sessions/' + code).onSnapshot(snap => {
    SESSION = snap.exists ? snap.data() : null; render();
  }, err => { SESSION = null; toast('Lost the class session connection (' + (err && err.code || 'error') + ').'); });
  if (S.facilitator) {
    if (teamsUnsub) { try { teamsUnsub(); } catch (e) {} }
    teamsUnsub = DB.collection('teams').where('code', '==', code).onSnapshot(s => {
      TEAMS = s.docs.map(d => d.data()); if (S.stage === -1 || $('#fac-board')) renderFacBoard();
    }, () => {});
  }
}
const stageGate = i => !(S.klass && !S.facilitator) || !SESSION || i <= (SESSION.stage || 0);
const dayGate = d => !(S.klass && !S.facilitator) || !SESSION || d <= (SESSION.day || 1);
let progTimer = null, lastProg = '';
function queueProgress() {
  if (!DB || !S.klass || S.facilitator) return;
  clearTimeout(progTimer);
  progTimer = setTimeout(() => {
    const sc = scores();
    const doc = { code: S.klass.code, team: S.klass.team, stage: S.stage, stageLabel: STAGES[S.stage].label, day: S.day,
      hours: S.used[1] + S.used[2] + S.used[3], facts: Object.keys(S.facts).length,
      keyFacts: keyFound().length, keyTotal: keyFacts().length, total: sc.total, updatedAt: new Date().toISOString() };
    const j = JSON.stringify(Object.assign({}, doc, { updatedAt: 0 }));
    if (j === lastProg) return; lastProg = j;
    DB.doc('teams/' + S.klass.code + '-' + S.klass.slug).set(doc).catch(e => toast('Progress not shared: ' + (e && e.code || 'error')));
  }, 1500);
}

/* ---------- scoring ---------------------------------------------------- */
const keyFacts = () => Object.keys(G.facts).filter(f => G.facts[f].key);
const keyFound = () => keyFacts().filter(known);
function scoreCallout() {
  const good = G.callout.filter(c => c.good === true), bad = G.callout.filter(c => c.good === false);
  const g = good.filter(c => has(S.callout, c.id)).length, b = bad.filter(c => has(S.callout, c.id)).length;
  return pct(g / good.length * 100 - b * 15);
}
function scoreTeam() {
  const yes = G.team.filter(t => t.ok === 'yes').length;
  const picked = S.team.map(id => G.team.find(t => t.id === id));
  const g = picked.filter(t => t.ok === 'yes').length, b = picked.filter(t => t.ok === 'no').length;
  let s = 60 * Math.min(1, g / Math.min(yes, 6)) - 20 * b;
  s += S.sevA === G.severity.actual ? 20 : (Math.abs(S.sevA - G.severity.actual) === 1 ? 10 : 0);
  s += S.sevP === G.severity.potential ? 20 : (Math.abs(S.sevP - G.severity.potential) === 1 ? 5 : 0);
  return pct(s);
}
function scorePlan() {
  const ess = G.actions.filter(a => a.essential), per = G.actions.filter(a => a.perishable);
  const inc = id => S.plan[id] && S.plan[id].inc, pri = id => S.plan[id] && S.plan[id].pri;
  const e = ess.filter(a => inc(a.id)).length / ess.length;
  const p = per.filter(a => inc(a.id) && pri(a.id)).length / per.length;
  const bad = G.planDistractors.filter(d => !d.neutral && inc(d.id)).length;
  return pct(e * 60 + p * 30 + 10 - bad * 10);
}
function scoreInvest() {
  const k = keyFound().length / keyFacts().length;
  const q = S.qStats, asked = q.open + q.probe + q.closed + q.leading + q.blame;
  const tech = asked ? Math.max(0, (q.open + q.probe + 0.5 * q.closed - q.leading - 2 * q.blame) / asked) : 0;
  return pct(k * 70 + tech * 30 - S.obsWrong * 2);
}
function scoreWhy() {
  let tot = 0;
  G.whys.forEach(w => { const st = S.whys[w.id]; if (!st) return; const done = st.level >= w.levels.length; const prog = st.level / w.levels.length; tot += Math.max(0, prog * 100 - (st.wrong || 0) * 8) * (done ? 1 : 0.8); });
  return pct(tot / G.whys.length);
}
function storyEval() {
  const disc = Object.keys(S.facts);
  let clsOk = 0;
  disc.forEach(f => {
    const c = S.story.cls[f], d = G.facts[f];
    if (!c) return;
    if (c === d.kind) clsOk++;
    else if (c === 'irrelevant' && (d.elim || f === 'C34' || f === 'C36' || f === 'C32')) clsOk++;
  });
  const ord = S.story.order.filter(f => G.facts[f] && G.facts[f].kind === 'event' && S.story.cls[f] === 'event');
  let conc = 0, pairs = 0;
  for (let i = 0; i < ord.length; i++) for (let j = i + 1; j < ord.length; j++) { pairs++; if (G.facts[ord[i]].order < G.facts[ord[j]].order) conc++; }
  const conds = disc.filter(f => S.story.cls[f] === 'condition' && G.facts[f].kind === 'condition');
  let attOk = 0;
  conds.forEach(f => { const a = S.story.attach[f]; if (a && has(G.facts[f].attach, a)) attOk++; });
  const pres = ['E03', 'E13'].filter(known);
  const presOk = pres.filter(f => storyStatus(f) === 'presumptive').length;
  return { disc: disc.length, clsOk, conc, pairs, conds: conds.length, attOk, pres: pres.length, presOk,
    score: disc.length ? pct((clsOk / disc.length) * 35 + (pairs ? conc / pairs : 0) * 35 + (conds.length ? attOk / conds.length : 0) * 25 + (pres.length ? presOk / pres.length : 1) * 5) : 0 };
}
function storyStatus(f) { return S.story.status[f] || (S.facts[f] && S.facts[f].presumptive ? 'presumptive' : 'proven'); }
function icamEval() {
  // same facts as the ICAM table: the learner does not code facts they ruled irrelevant
  const disc = Object.keys(S.facts).filter(f => S.story.cls[f] !== 'irrelevant'); let tot = 0, full = 0, part = 0;
  disc.forEach(f => {
    const pick = S.icam[f]; const acc = G.facts[f].icam;
    if (!pick) return;
    if (has(acc, pick)) { tot += 1; full++; }
    else if (acc.some(c => G.codeLevel(c) === G.codeLevel(pick))) { tot += 0.5; part++; }
  });
  return { n: disc.length, full, part, score: disc.length ? pct(tot / disc.length * 100) : 0 };
}
function rootEval() {
  const rs = S.roots.map(id => G.rootOptions.find(r => r.id === id));
  const rScore = Math.max(0, rs.reduce((a, r) => a + r.score, 0)) / 6;
  const acts = S.acts.map(id => G.actionOptions.find(a => a.id === id));
  const need = ['RM', 'CO', 'CM', 'HW', 'MC', 'TR', 'DF4'];
  const cov = need.filter(c => acts.some(a => a.good && has(a.covers, c))).length / need.length;
  const strong = acts.some(a => a.good && G.hocRank[a.hoc] >= 3) ? 1 : 0;
  const weak = acts.filter(a => !a.good).length;
  const txt = S.rootText.trim().length > 60 ? 1 : 0;
  return { rScore, cov, strong, weak, score: pct(rScore * 40 + cov * 40 + strong * 10 + txt * 10 - weak * 10) };
}
function scores() {
  const parts = [
    ['Call-out', scoreCallout(), 10], ['Team & severity', scoreTeam(), 10], ['Data plan', scorePlan(), 10],
    ['Evidence & interviews', scoreInvest(), 20], ['5-Why', scoreWhy(), 10], ['Storyline', storyEval().score, 15],
    ['ICAM coding', icamEval().score, 15], ['Root cause & actions', rootEval().score, 10]
  ];
  const total = Math.round(parts.reduce((a, p) => a + p[1] * p[2], 0) / 100);
  return { parts, total };
}

/* ---------- rendering: shell ------------------------------------------ */
function render() {
  renderHeader();
  const m = $('#main'); if (!m) return;
  const focusId = document.activeElement && document.activeElement.id;
  const fn = ['renderBrief', 'renderCallout', 'renderTeam', 'renderPlan', 'renderInvest', 'renderStory', 'renderIcam', 'renderRoot', 'renderDebrief'][S.stage];
  m.innerHTML = R[fn]();
  if (R[fn + 'After']) R[fn + 'After']();
  renderBanner();
  if (focusId) { const el = document.getElementById(focusId); if (el && el.focus) el.focus({ preventScroll: true }); }
}
function renderHeader() {
  const h = $('#hdr-stages'); if (!h) return;
  h.innerHTML = STAGES.map((s, i) => {
    const can = i <= S.maxStage && stageGate(i);
    return `<button class="stg ${i === S.stage ? 'on' : ''} ${i < S.maxStage ? 'done' : ''}" ${can ? '' : 'disabled'} data-act="goto" data-i="${i}"><span class="stg-n">${i}</span>${esc(s.label)}</button>`;
  }).join('');
  const c = $('#hdr-clock');
  if (S.stage >= 4) {
    const left = hoursLeft();
    c.innerHTML = `<div class="clk"><span class="clk-day">Day ${S.day} · ${DAY_DATE[S.day]}</span><span class="clk-time">${fmtTime(clock())}</span></div>
      <div class="gauge" title="Hours left today"><i style="width:${pct(left / DAY_HOURS[S.day] * 100)}%"></i></div><span class="clk-left">${fmtH(left)} left</span>`;
  } else c.innerHTML = `<span class="clk-day">${esc(G.meta.dateLabel)}</span>`;
  $('#hdr-file').hidden = S.stage < 4;
  refreshReset();
  $('#hdr-fac').textContent = S.facilitator ? 'Facilitator ✓' : 'Facilitator';
  const who = $('#hdr-who');
  who.textContent = S.klass ? (S.facilitator ? 'Class ' + S.klass.code : S.klass.team + ' · ' + S.klass.code) : (S.teamName || '');
}
function renderBanner() {
  const b = $('#banner');
  const parts = [];
  if (S.klass && SESSION && SESSION.inject) parts.push(`<div class="inject"><b>Facilitator:</b> ${esc(SESSION.inject)}</div>`);
  if (S.klass && !S.facilitator && SESSION === null && DB) parts.push(`<div class="inject warn">Class ${esc(S.klass.code)} was not found or has been closed. You can keep playing on your own.</div>`);
  b.innerHTML = parts.join('');
}
function go(i) {
  if (!stageGate(i)) { toast('Waiting for the facilitator to open this stage.'); return; }
  S.stage = i; S.maxStage = Math.max(S.maxStage, i); save(); render(); window.scrollTo(0, 0);
}
const R = {};
function nextBtn(label, ok, why) {
  const gate = stageGate(S.stage + 1);
  return `<div class="next-row">${!gate ? '<span class="muted">Waiting for the facilitator to open the next stage…</span>' : ''}${why && !ok ? `<span class="muted">${esc(why)}</span>` : ''}
    <button class="btn primary" data-act="next" ${ok && gate ? '' : 'disabled'}>${esc(label)} →</button></div>`;
}
function keyBox(html) { return S.facilitator && S.showKey ? `<div class="keybox"><b>Answer key</b>${html}</div>` : ''; }

/* ---------- stage 0: briefing ----------------------------------------- */
R.renderBrief = () => `
  <section class="hero">
    <div class="hero-text">
      <p class="eyebrow">ICAM investigation game · Case ${esc(G.meta.caseRef)}</p>
      <h1>The Falling Billet</h1>
      <p class="lede">A steel billet has fallen from a truck during forklift offloading and a contract driver is badly hurt. You lead the investigation. Start with a few lines on a phone call; finish with an ECFA+ storyline, an ICAM analysis and corrective actions you can defend.</p>
      <ol class="flow">${STAGES.slice(1).map((s, i) => `<li><span>${i + 1}</span>${esc(s.label)}</li>`).join('')}</ol>
    </div>
    <figure class="hero-fig"><img src="${G.photoData.p119}" alt="A steel billet lying in a puddle beside a flat-deck trailer"><figcaption>Billet yard, ${esc(G.meta.dateLabel)}</figcaption></figure>
  </section>
  <section class="card">
    <h2>How to play</h2>
    <div class="grid3">
      <div><h3>Time is evidence</h3><p>You have 20 investigation hours over three days. Every interview, document request and inspection costs time. Some evidence disappears: scenes get cleared, trucks leave, memories merge.</p></div>
      <div><h3>Ask, don't accuse</h3><p>Choose your interview questions carefully. Open and probing questions bring out facts. Leading or blaming questions contaminate accounts and shut people down.</p></div>
      <div><h3>Build the case</h3><p>Every fact you collect becomes a card. You turn the cards into the storyline, code them against ICAM, and drill down with 5-Why to find the organisational factors.</p></div>
    </div>
    <div class="btnrow"><button class="btn" data-act="openGuide" data-t="overview">Overview</button><button class="btn" data-act="openGuide" data-t="play">Full game instructions</button><button class="btn" data-act="openGuide" data-t="fac">Facilitator guide</button></div>
  </section>
  <section class="card">
    <h2>Start</h2>
    <div class="start-grid">
      <div class="start-opt"><h3>Play on your own or as a team</h3><label for="tname">Team or player name</label><input id="tname" value="${esc(S.teamName)}" placeholder="e.g. Team 2 — Despatch">
        <button class="btn primary" data-act="startSolo">${S.maxStage > 0 ? 'Continue' : 'Start the investigation'}</button></div>
      <div class="start-opt"><h3>Join a class session</h3>${DB ? `<label for="jcode">Session code</label><input id="jcode" placeholder="e.g. B4821" autocapitalize="characters"><label for="jteam">Team name</label><input id="jteam" placeholder="e.g. Team 2">
        <button class="btn" data-act="joinClass">Join class</button>` : `<p class="muted">Class sessions work when the game is opened on claude.ai. In this offline copy the facilitator runs the class from the front of the room.</p>`}</div>
      <div class="start-opt"><h3>Facilitator</h3><p class="muted">Answer keys, unlock controls${DB ? ', and live class sessions with a team progress board' : ''}.</p><button class="btn" data-act="openFac">Open facilitator panel</button></div>
    </div>
    ${S.maxStage > 0 ? `<p class="muted small">Progress is saved in this browser. <button class="linkbtn" data-act="restart">Restart from scratch</button></p>` : ''}
  </section>
  <p class="small muted disclaimer">Based on a real ICAM investigation. Names, companies and documents are anonymised and recreated for training.</p>`;

/* ---------- stage 1: call-out ------------------------------------------ */
R.renderCallout = () => {
  const r = G.initialReport, done = S.calloutDone;
  return `<section class="stage-head"><p class="eyebrow">Stage 1 · ${esc(r.time)}, ${esc(G.meta.dateLabel)}</p><h1>The call-out</h1></section>
  <div class="two">
    <section class="card phone"><p class="eyebrow">Initial notification · ${esc(r.from)}</p><blockquote>"${esc(r.text)}"</blockquote>
      <table class="kv">${r.known.map(k => `<tr><th>${esc(k[0])}</th><td>${esc(k[1])}</td></tr>`).join('')}</table>
      <p class="small"><b>Not yet known:</b> ${r.unknown.map(esc).join(' · ')}</p></section>
    <section class="card"><h2>What do you instruct in the next 15 minutes?</h2><p class="muted">Select every instruction you would give. Some are good practice, some are traps.</p>
      <div class="checks">${G.callout.map(c => {
        const on = has(S.callout, c.id); const cls = done ? (c.good === true ? (on ? 'ok' : 'miss') : c.good === false ? (on ? 'bad' : 'avoid') : 'neutral') : '';
        return `<label class="check ${cls}"><input type="checkbox" data-act="toggleCallout" data-id="${c.id}" ${on ? 'checked' : ''} ${done ? 'disabled' : ''}><span>${esc(c.text)}${done ? `<em>${esc(c.fb)}</em>` : ''}</span></label>`;
      }).join('')}</div>
      ${done ? `<div class="score-line">Score <b>${scoreCallout()}</b> / 100</div>${calloutConsequences()}` : `<button class="btn primary" data-act="submitCallout" ${S.callout.length ? '' : 'disabled'}>Give instructions</button>`}
    </section>
  </div>${done ? nextBtn('Set up the investigation', true) : ''}`;
};
function calloutConsequences() {
  const f = S.flags, out = [];
  out.push(f.sceneSecured && !f.sceneCleared ? 'The scene is kept as it was. You can examine it this afternoon.' : 'Nobody kept the scene. By the time you get there the yard will be partly cleared.');
  out.push(f.truckReleased ? 'The truck has already left with the dunnage and tie-downs.' : f.truckHeld ? 'The truck and its load are held on site until you release them.' : 'Nobody told the driver\'s company to keep the truck. It will leave at about 16:10.');
  out.push(f.forkliftHeld ? 'The Henley is tagged out with its forks as they were.' : 'The Henley goes back to work this afternoon.');
  if (f.operatorSuspended) out.push('Sizwe Ndlovu has been sent home. He will only talk to you from day 2, and warily.');
  if (!f.witnessesSeparated) out.push('The witnesses have talked it over at the canteen. Accounts gathered later may have merged.');
  return `<div class="consequences"><h3>Consequences</h3><ul>${out.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>`;
}

/* ---------- stage 2: team & severity ----------------------------------- */
R.renderTeam = () => {
  const done = S.teamDone; const sevs = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
  return `<section class="stage-head"><p class="eyebrow">Stage 2</p><h1>Team and severity</h1><p class="lede">Classify the incident to set the investigation level, then pick an ICAM team that is competent, independent and small enough to work (5 to 8 people).</p></section>
  <div class="two">
    <section class="card"><h2>Severity classification</h2>
      ${['A', 'P'].map(k => `<div class="sev-row"><span class="sev-lbl">${k === 'A' ? 'Actual' : 'Potential'}</span>${[1, 2, 3, 4, 5].map(n => `<button class="sev ${S['sev' + k] === n ? 'on' : ''} s${n}" data-act="sev" data-k="${k}" data-n="${n}" ${done ? 'disabled' : ''}><b>${n}</b>${sevs[n]}</button>`).join('')}</div>`).join('')}
      ${done ? `<p class="fb">${esc(G.severity.fbActual)}</p><p class="fb">${esc(G.severity.fbPotential)}</p>` : ''}
    </section>
    <section class="card"><h2>Investigation team <span class="pill">${S.team.length} selected</span></h2>
      <div class="checks">${G.team.map(t => {
        const on = has(S.team, t.id); const cls = done ? (t.ok === 'no' ? (on ? 'bad' : 'avoid') : (on ? 'ok' : 'miss')) : '';
        return `<label class="check ${cls}"><input type="checkbox" data-act="toggleTeam" data-id="${t.id}" ${on ? 'checked' : ''} ${done || t.ok === 'req' ? 'disabled' : ''}><span>${esc(t.name)}${done ? `<em>${esc(t.fb)}</em>` : ''}</span></label>`;
      }).join('')}</div>
      ${done ? `<div class="score-line">Score <b>${scoreTeam()}</b> / 100</div>` : `<button class="btn primary" data-act="submitTeam" ${S.sevA && S.sevP ? '' : 'disabled'}>Confirm team and classification</button>`}
    </section>
  </div>${done ? nextBtn('Plan the data collection', true) : ''}`;
};

/* ---------- stage 3: data collection plan ------------------------------- */
R.renderPlan = () => {
  const done = S.planDone;
  const items = G.actions.map(a => ({ id: a.id, cat: a.cat, title: a.title, note: a.note, a })).concat(G.planDistractors.map(d => ({ id: d.id, cat: d.cat, title: d.title, d })));
  const cols = G.peepo.map(p => {
    const list = items.filter(i => i.cat === p.k).sort((x, y) => x.title.localeCompare(y.title));
    return `<div class="peepo"><h3><span class="peepo-k">${p.k}</span>${esc(p.name)}</h3><p class="small muted">${esc(p.tip)}</p>
      ${list.map(i => {
        const st = S.plan[i.id] || {}; let fb = '';
        if (done) {
          if (i.d) fb = `<em class="${i.d.neutral ? '' : (st.inc ? 'bad' : 'ok')}">${esc(i.d.fb)}</em>`;
          else if (i.a.essential && !st.inc) fb = '<em class="bad">Essential: missing from your plan.</em>';
          else if (i.a.perishable && st.inc && !st.pri) fb = '<em class="warn">Perishable: should be a priority.</em>';
          else if (i.a.perishable && st.inc) fb = '<em class="ok">Perishable and prioritised.</em>';
        }
        return `<div class="plan-item ${st.inc ? 'inc' : ''}"><label><input type="checkbox" data-act="planInc" data-id="${i.id}" ${st.inc ? 'checked' : ''} ${done ? 'disabled' : ''}> ${esc(i.title)}</label>
          <button class="star ${st.pri ? 'on' : ''}" data-act="planPri" data-id="${i.id}" ${done || !st.inc ? 'disabled' : ''} title="Mark as priority: collect first" aria-label="Priority">★</button>${fb}</div>`;
      }).join('')}</div>`;
  }).join('');
  const n = Object.keys(S.plan).filter(k => S.plan[k].inc).length;
  return `<section class="stage-head"><p class="eyebrow">Stage 3 · ICAM data collection (PEEPO)</p><h1>Data collection plan</h1>
    <p class="lede">Choose what you intend to collect and mark the perishable items as priorities ★. Planned actions are quicker to do: anything unplanned costs an extra ${UNPLANNED_PENALTY} h to arrange. You will have about 20 hours.</p></section>
    <div class="peepo-grid">${cols}</div>
    ${done ? `<div class="card"><div class="score-line">Plan score <b>${scorePlan()}</b> / 100</div></div>${nextBtn('Start day 1 of the investigation', true)}` :
      `<div class="next-row"><span class="muted">${n} items planned</span><button class="btn primary" data-act="submitPlan" ${n >= 5 ? '' : 'disabled'}>Approve plan</button></div>`}`;
};

/* ---------- stage 4: investigation -------------------------------------- */
function actionState(a) {
  if (has(S.done, a.id)) return { ok: false, why: 'Done' };
  if (S.investClosed) return { ok: false, why: 'Data collection closed' };
  if (S.day < a.days[0]) return { ok: false, why: 'From day ' + a.days[0] };
  if (S.day > a.days[1]) return { ok: false, why: 'No longer available', lost: true };
  const f = S.flags;
  if (a.id === 'i_ndlovu' && f.operatorSuspended && S.day === 1) return { ok: false, why: 'Sent home: from day 2' };
  if (a.id === 'q_load') {
    if (f.truckReleased) return { ok: false, why: 'The truck has left the site', lost: true };
    if (!f.truckHeld && (S.day > 1 || clock() >= 16 * 60)) return { ok: false, why: 'The truck left at 16:10', lost: true };
  }
  const cost = actionCost(a);
  if (cost > hoursLeft() + 1e-9) return { ok: false, why: 'Not enough time today' };
  return { ok: true };
}
const planned = a => !!(S.plan[a.id] && S.plan[a.id].inc);
const actionCost = a => a.cost + (planned(a) ? 0 : UNPLANNED_PENALTY);

R.renderInvest = () => {
  const tabs = [['actions', 'Actions'], ['file', 'Case file'], ['why', '5-Why'], ['log', 'Log']];
  const kf = keyFound().length, kt = keyFacts().length;
  return `<section class="stage-head row"><div><p class="eyebrow">Stage 4 · Day ${S.day} of 3 · ${DAY_DATE[S.day]} 2008</p><h1>Investigate</h1></div>
    <div class="stats"><div><b>${Object.keys(S.facts).length}</b><span>facts</span></div><div><b>${S.evidence.length}</b><span>evidence items</span></div><div><b>${S.photos.length}</b><span>photos</span></div>${S.facilitator ? `<div><b>${kf}/${kt}</b><span>key facts</span></div>` : ''}</div></section>
  <div class="tabs">${tabs.map(t => `<button class="tab ${S.investTab === t[0] ? 'on' : ''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div id="tabbody">${S.investTab === 'actions' ? investActions() : S.investTab === 'file' ? caseFileHTML() : S.investTab === 'why' ? whyHTML() : logHTML()}</div>
  <div class="next-row">
    ${S.day < 3 && !S.investClosed ? `<button class="btn" data-act="endDay" ${dayGate(S.day + 1) ? '' : 'disabled'}>End day ${S.day} → day ${S.day + 1}${dayGate(S.day + 1) ? '' : ' (waiting for facilitator)'}</button>` : ''}
    <button class="btn primary" data-act="closeInvest" ${stageGate(5) ? '' : 'disabled'}>${S.investClosed ? 'Go to the storyline' : 'Close data collection and build the storyline'} →</button>
  </div>`;
};
function investActions() {
  return `<div class="act-grid">${G.peepo.map(p => {
    const list = G.actions.filter(a => a.cat === p.k);
    return `<div class="act-col"><h3><span class="peepo-k">${p.k}</span>${esc(p.name)}</h3>${list.map(a => {
      const st = actionState(a), done = has(S.done, a.id), pl = planned(a);
      return `<div class="act ${done ? 'done' : ''} ${st.lost && !done ? 'lost' : ''}">
        <div class="act-t">${pl ? '<span class="pl" title="In your plan">●</span>' : ''}${S.plan[a.id] && S.plan[a.id].pri ? '<span class="pri" title="Priority">★</span>' : ''}${esc(a.title)}</div>
        <div class="act-m"><span class="cost">${fmtH(actionCost(a))}</span>${a.note ? `<span class="small muted">${esc(a.note)}</span>` : ''}</div>
        ${done ? `<button class="btn tiny" data-act="review" data-id="${a.id}">Review</button>` : st.ok ? `<button class="btn tiny primary" data-act="doAction" data-id="${a.id}">Do it</button>` : `<span class="small why">${esc(st.why)}</span>`}
      </div>`;
    }).join('')}</div>`;
  }).join('')}</div>`;
}
function logHTML() {
  if (!S.log.length) return '<p class="muted">Nothing done yet.</p>';
  return `<ol class="log">${S.log.map(l => `<li><span class="mono">D${l.day} ${l.time}</span> ${esc(l.text)}</li>`).join('')}</ol>`;
}

function doAction(id) {
  const a = G.actions.find(x => x.id === id); const st = actionState(a);
  if (!st.ok) { toast(st.why); return; }
  const cost = actionCost(a);
  logIt(a.title + ' (' + fmtH(cost) + ')');
  S.used[S.day] = Math.round((S.used[S.day] + cost) * 100) / 100;
  S.done.push(a.id);
  if (a.kind === 'interview') startInterview(a.who);
  else if (a.kind === 'doc') openDoc(a.doc, true);
  else runSite(a);
  save(); render();
}
function runSite(a) {
  const s = G.site[a.id]; const f = S.flags; let out;
  if (a.id === 's_scene') {
    out = (f.sceneSecured && !f.sceneCleared) ? s.good : s.poor;
    if (f.photosEarly && out === s.poor) out = { photos: out.photos.concat(s.early.photos), facts: out.facts.concat(s.early.facts), text: out.text + ' ' + s.early.text };
  } else if (a.id === 'q_load') out = s.ok;
  else if (a.id === 'q_fork') out = f.forkliftHeld ? s.held : s.free;
  else out = s;
  out = { text: out.text, facts: out.facts || [], photos: out.photos || [] };
  const type = a.cat === 'Eq' ? 'Physical Evidence' : 'Physical Evidence';
  const ev = (out.facts.length || !out.photos.length) ? evFor('site:' + a.id, a.id === 's_cctv' ? 'Technical / Data Record' : type, a.title, 'Site examination, day ' + S.day) : null;
  const newF = out.facts.filter(fid => discover(fid, ev));
  const newP = [];
  out.photos.forEach(p => { if (!S.photos.find(x => x.id === p)) { const pe = newEvidence('Photograph / Video', G.photos[p], a.title); S.photos.push({ id: p, ev: pe }); newP.push(p); } });
  showModal(`<p class="eyebrow">${esc(CAT_NAME[a.cat])} · ${esc(a.title)}</p><h2>Findings</h2><p>${esc(out.text)}</p>
    ${newP.length ? `<div class="thumbs">${newP.map(p => photoThumb(p)).join('')}</div>` : ''}
    ${newF.length ? `<h3>New facts</h3><div class="chips">${newF.map(x => factChip(x, true)).join('')}</div>` : '<p class="muted">No new facts.</p>'}`);
}
function photoThumb(p) {
  const rec = S.photos.find(x => x.id === p);
  return `<button class="thumb" data-act="photo" data-id="${p}"><img src="${G.photoData[p]}" alt="${esc(G.photos[p])}"><span class="mono">${rec ? rec.ev : ''}</span></button>`;
}

/* interviews */
function startInterview(who) {
  if (!S.interviews[who]) S.interviews[who] = { asked: [], broken: !!(who === 'ndlovu' && S.flags.operatorSuspended), day: S.day, ev: null };
  S.activeInterview = who; openInterview(who);
}
function openInterview(who) {
  const iv = G.interviews[who], st = S.interviews[who], p = G.people[who];
  const left = iv.max - st.asked.length; const done = has(S.done, 'i_' + who);
  const transcript = st.asked.map(i => { const q = iv.qs[i]; const ans = answerFor(who, i);
    return `<div class="qa"><p class="q"><span class="qt ${q.type}">${G.qtypes[q.type].label}</span>${esc(q.q)}</p><p class="a">${esc(ans.text)}</p>${q.coach ? `<p class="coach">${esc(q.coach)}</p>` : ''}</div>`; }).join('');
  const remaining = iv.qs.map((q, i) => ({ q, i })).filter(x => !has(st.asked, x.i));
  const conferred = !S.flags.witnessesSeparated && st.day >= 2 && has(['ndlovu', 'visser', 'fortuin', 'adams'], who);
  showModal(`<div class="iv-head"><span class="avatar">${esc(p.initials)}</span><div><h2>${esc(p.name)}</h2><p class="muted">${esc(p.role)}</p></div></div>
    <p class="setting">${esc(iv.setting)}</p>
    ${st.broken ? '<p class="warnbox">Rapport is damaged. Answers are guarded.</p>' : ''}
    ${conferred ? '<p class="warnbox">This witness has discussed the event with others. Treat the details with care.</p>' : ''}
    <div class="transcript">${transcript || '<p class="muted">Choose your first question. Think about which kind of question gets the most reliable information.</p>'}</div>
    ${left > 0 && remaining.length ? `<h3>Your next question <span class="pill">${left} left</span></h3><div class="qcards">${remaining.map(x => `<button class="qcard" data-act="ask" data-who="${who}" data-i="${x.i}">${esc(x.q.q)}</button>`).join('')}</div>`
      : `<p class="muted">${left <= 0 ? 'Time is up for this interview.' : 'You have asked everything you prepared.'}</p>`}
    <div class="modal-foot"><button class="btn" data-act="closeModal">End interview</button></div>`, 'wide');
}
function answerFor(who, i) {
  const q = G.interviews[who].qs[i], st = S.interviews[who];
  const brokenAtAsk = st.brokenFrom != null && st.asked.indexOf(i) > st.asked.indexOf(st.brokenFrom);
  const guarded = (st.brokenFrom == null && st.broken) || brokenAtAsk;
  if (guarded && !q.breaks) return { text: q.guarded || 'I\'ve told you what I know.', facts: [] };
  return { text: q.a, facts: q.facts || [] };
}
function ask(who, i) {
  const st = S.interviews[who]; const iv = G.interviews[who];
  if (has(st.asked, i) || st.asked.length >= iv.max) return;
  const q = iv.qs[i];
  st.asked.push(i); S.qStats[q.type]++;
  const ans = answerFor(who, i);
  if (q.breaks && !st.broken) { st.broken = true; st.brokenFrom = i; }
  if (ans.facts.length) {
    const ev = evFor('iv:' + who, 'Witness Statement', 'Interview: ' + G.people[who].name + ' (' + G.people[who].role + ')', 'Interview, day ' + S.day);
    const conferred = !S.flags.witnessesSeparated && st.day >= 2 && has(['ndlovu', 'visser', 'fortuin', 'adams'], who);
    const newF = ans.facts.filter(f => discover(f, ev, conferred || has(q.presumptiveFacts || [], f)));
    if (newF.length) toast(newF.length + ' new fact' + (newF.length > 1 ? 's' : '') + ' recorded');
  }
  save(); openInterview(who);
}

/* documents */
function docAvailable(o) {
  if (!o.needs) return true;
  if (o.needs.indexOf('any:') === 0) return o.needs.slice(4).split(',').some(w => S.interviews[w] && S.interviews[w].asked.length);
  if (G.docs[o.needs]) return has(S.docsSeen, o.needs);
  return !!(S.interviews[o.needs] && S.interviews[o.needs].asked.length);
}
function openDoc(id, fresh) {
  const d = G.docs[id];
  if (!has(S.docsSeen, id)) S.docsSeen.push(id);
  evFor('doc:' + id, d.type, d.title, 'Document request, day ' + S.day);
  const o = S.obs[id] = S.obs[id] || {};
  const opts = d.obs.map((x, i) => ({ x, i })).filter(z => docAvailable(z.x));
  const pending = opts.filter(z => o[z.i] == null);
  showModal(`<p class="eyebrow">Document · ${esc(d.type)} · <span class="mono">${esc(evId('doc:' + id))}</span></p><h2>${esc(d.title)}</h2>
    <div class="paper">${d.html}</div>
    <h3>What do you notice?</h3><p class="small muted">Tick every statement the document supports. Wrong ticks cost points.</p>
    <div class="checks">${opts.map(z => {
      const ans = o[z.i]; const answered = ans != null;
      const cls = answered ? ((z.x.ok && ans) ? 'ok' : (!z.x.ok && ans) ? 'bad' : (z.x.ok && !ans) ? 'miss' : 'avoid') : '';
      return `<label class="check ${cls}"><input type="checkbox" class="obs" data-i="${z.i}" ${ans ? 'checked' : ''} ${answered ? 'disabled' : ''}><span>${esc(z.x.t)}${answered ? `<em>${esc(z.x.fb)}</em>` : ''}</span></label>`;
    }).join('')}</div>
    <div class="modal-foot">${pending.length ? `<button class="btn primary" data-act="recordObs" data-id="${id}">Record observations</button>` : ''}<button class="btn" data-act="closeModal">Close</button></div>`, 'wide');
}
function evId(key) { const e = S.evidence.find(x => x.key === key); return e ? e.id : ''; }
function recordObs(id) {
  const d = G.docs[id], o = S.obs[id]; const ev = evId('doc:' + id); const newF = [];
  document.querySelectorAll('.modal input.obs:not([disabled])').forEach(cb => {
    const i = +cb.dataset.i, x = d.obs[i]; o[i] = cb.checked;
    if (cb.checked && x.ok && x.fact && discover(x.fact, ev)) newF.push(x.fact);
    if (cb.checked && !x.ok) S.obsWrong++;
  });
  save(); openDoc(id); render();
  if (newF.length) toast(newF.length + ' new fact' + (newF.length > 1 ? 's' : '') + ' recorded');
}

/* case file */
function caseFileHTML() {
  const facts = Object.keys(S.facts).sort((a, b) => (a[0] === b[0] ? (a < b ? -1 : 1) : a[0] === 'E' ? -1 : 1));
  const ivs = Object.keys(S.interviews);
  return `<div class="file-grid">
    <section><h3>Facts (${facts.length})</h3>${facts.length ? `<ul class="facts">${facts.map(f => { const d = G.facts[f], s = S.facts[f];
      return `<li class="${d.kind}"><span class="kind">${d.kind === 'event' ? 'E' : 'C'}</span><div>${esc(d.text)}<div class="small muted">${s.ev.map(e => `<span class="mono">${e}</span>`).join(' ')}${s.presumptive ? ' · <i>presumptive</i>' : ''}</div></div></li>`; }).join('')}</ul>` : '<p class="muted">No facts yet. Interview people, inspect and request documents.</p>'}</section>
    <section><h3>Evidence register (${S.evidence.length})</h3>${S.evidence.length ? `<div class="tbl-wrap"><table class="reg"><tr><th>ID</th><th>Type</th><th>Description</th></tr>${S.evidence.map(e => `<tr><td class="mono">${e.id}</td><td>${esc(e.type)}</td><td>${e.key && e.key.indexOf('doc:') === 0 ? `<button class="linkbtn" data-act="openDoc" data-id="${e.key.slice(4)}">${esc(e.desc)}</button>` : e.key && e.key.indexOf('iv:') === 0 ? `<button class="linkbtn" data-act="openIv" data-id="${e.key.slice(3)}">${esc(e.desc)}</button>` : esc(e.desc)}</td></tr>`).join('')}</table></div>` : '<p class="muted">Empty.</p>'}
      <h3>Photographs (${S.photos.length})</h3>${S.photos.length ? `<div class="thumbs">${S.photos.map(p => photoThumb(p.id)).join('')}</div>` : '<p class="muted">None yet.</p>'}
      <h3>Interviews (${ivs.length})</h3>${ivs.length ? `<ul class="plain">${ivs.map(w => `<li><button class="linkbtn" data-act="openIv" data-id="${w}">${esc(G.people[w].name)}</button> <span class="muted small">${S.interviews[w].asked.length} questions${S.interviews[w].broken ? ' · rapport damaged' : ''}</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}
    </section></div>`;
}

/* 5-why */
function whyHTML() {
  return `<p class="lede">Ask "why" until you reach something the organisation controls. A plausible answer only counts once your evidence supports it. If it doesn't yet, you'll get a pointer on where to look.</p>
  ${G.whys.map(w => {
    const st = S.whys[w.id] = S.whys[w.id] || { level: 0, path: [], wrong: 0, hint: '' };
    const done = st.level >= w.levels.length;
    return `<section class="card why"><h3>${esc(w.title)}</h3><ol class="why-chain">${st.path.map((p, i) => `<li><span class="why-q">${esc(w.levels[i].q)}</span><span class="why-a">${esc(w.levels[i].opts[p].t)}</span>${w.levels[i].opts[p].root ? '<span class="pill ok">Organisational factor reached</span>' : ''}</li>`).join('')}</ol>
      ${done ? '' : `<p class="why-q now">${esc(w.levels[st.level].q)}</p><div class="qcards">${w.levels[st.level].opts.map((o, i) => `<button class="qcard" data-act="why" data-w="${w.id}" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`}
      ${st.hint ? `<p class="fb">${esc(st.hint)}</p>` : ''}</section>`;
  }).join('')}`;
}
function answerWhy(wid, i) {
  const w = G.whys.find(x => x.id === wid), st = S.whys[wid], o = w.levels[st.level].opts[i];
  if (!o.ok) { st.wrong++; st.hint = o.fb; }
  else {
    const missing = (o.needs || []).filter(f => !known(f));
    if (missing.length) {
      st.hint = 'Plausible, but your evidence does not support it yet. Look for: ' + missing.map(f => '"' + G.facts[f].text + '" (try ' + (SOURCES[f] || ['further enquiry']).slice(0, 2).join(' or ') + ')').join('; ');
    } else { st.path.push(i); st.level++; st.hint = st.level >= w.levels.length ? 'Chain complete.' : ''; }
  }
  save(); render();
}

/* ---------- stage 5: storyline ------------------------------------------ */
R.renderStory = () => {
  const disc = Object.keys(S.facts);
  const tray = disc.filter(f => !S.story.cls[f]);
  const events = S.story.order.filter(f => S.story.cls[f] === 'event');
  const conds = disc.filter(f => S.story.cls[f] === 'condition');
  const irr = disc.filter(f => S.story.cls[f] === 'irrelevant');
  const chk = S.story.checked; const ev = chk ? storyEval() : null;
  const optEv = sel => `<option value="">— attach to —</option><option value="G" ${sel === 'G' ? 'selected' : ''}>Underlying / general condition</option>` + events.map((e, i) => `<option value="${e}" ${sel === e ? 'selected' : ''}>${i + 1}. ${esc(G.facts[e].text.slice(0, 60))}</option>`).join('');
  const mark = (f, good) => chk ? `<span class="mk ${good ? 'ok' : 'bad'}">${good ? '✓' : '✗'}</span>` : '';
  return `<section class="stage-head"><p class="eyebrow">Stage 5 · ECFA+</p><h1>Build the storyline</h1>
    <p class="lede">Sort every fact card. <b>Events</b> are things that happened, in order. <b>Conditions</b> are states that influenced an event: attach each one to that event, or mark it as underlying. Mark anything you cannot prove as <i>presumptive</i>.</p></section>
  ${tray.length ? `<section class="card"><h2>Card tray <span class="pill">${tray.length} to sort</span></h2><div class="tray">${tray.map(f => `<div class="sl-card"><p>${esc(G.facts[f].text)}</p><div class="btns"><button class="btn tiny" data-act="cls" data-f="${f}" data-c="event">Event</button><button class="btn tiny" data-act="cls" data-f="${f}" data-c="condition">Condition</button><button class="btn tiny ghost" data-act="cls" data-f="${f}" data-c="irrelevant">Not relevant</button></div></div>`).join('')}</div></section>` : ''}
  <section class="card"><h2>Events in sequence <span class="pill">${events.length}</span></h2>
    <ol class="ev-list">${events.map((f, i) => { const d = G.facts[f];
      const okCls = d.kind === 'event';
      return `<li class="ev-item"><div class="ev-ord"><button class="iconbtn" data-act="mv" data-f="${f}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Move up">▲</button><span>${i + 1}</span><button class="iconbtn" data-act="mv" data-f="${f}" data-d="1" ${i < events.length - 1 ? '' : 'disabled'} aria-label="Move down">▼</button></div>
        <div class="ev-body"><p>${mark(f, okCls)}${esc(d.text)}</p><div class="ev-meta"><button class="status ${storyStatus(f)}" data-act="stat" data-f="${f}">${storyStatus(f)}</button><button class="linkbtn small" data-act="uncls" data-f="${f}">Back to tray</button></div>
        ${conds.filter(c => S.story.attach[c] === f).map(c => `<div class="cond-mini">◇ ${esc(G.facts[c].text)}</div>`).join('')}</div></li>`; }).join('')}</ol>
    ${chk && ev.pairs ? `<p class="fb">Order: ${ev.conc} of ${ev.pairs} event pairs in the right sequence.</p>` : ''}
  </section>
  <section class="card"><h2>Conditions <span class="pill">${conds.length}</span></h2>
    <div class="cond-list">${conds.map(c => { const d = G.facts[c]; const a = S.story.attach[c];
      return `<div class="cond-item"><p>${chk ? mark(c, d.kind === 'condition') : ''}${esc(d.text)}</p><div class="cond-ctl"><label class="sr" for="att-${c}">Attach</label><select id="att-${c}" data-act="attach" data-f="${c}">${optEv(a)}</select>
        ${chk && d.kind === 'condition' ? (has(d.attach, a) ? '<span class="mk ok">✓</span>' : `<span class="small muted">Expected: ${d.attach.map(x => x === 'G' ? 'underlying' : 'event "' + esc(G.facts[x].text.slice(0, 40)) + '…"').join(' or ')}</span>`) : ''}
        <button class="status ${storyStatus(c)}" data-act="stat" data-f="${c}">${storyStatus(c)}</button><button class="linkbtn small" data-act="uncls" data-f="${c}">Back to tray</button></div></div>`; }).join('')}</div></section>
  ${irr.length ? `<section class="card"><h2>Set aside as not relevant</h2><ul class="plain">${irr.map(f => `<li>${chk ? mark(f, G.facts[f].elim || f === 'C34' || f === 'C36' || f === 'C32') : ''}${esc(G.facts[f].text)} <button class="linkbtn small" data-act="uncls" data-f="${f}">Back to tray</button></li>`).join('')}</ul><p class="small muted">Tip: eliminated causes (such as "no defects on the pre-shift check") are often worth keeping as conditions, because they show what you ruled out.</p></section>` : ''}
  <section class="card"><div class="row-between"><h2>Storyline chart</h2><button class="btn tiny" data-act="tab5chart">Redraw</button></div><div class="chart-wrap" id="chart">${storyChart()}</div></section>
  ${chk ? `<section class="card"><div class="score-line">Storyline score <b>${ev.score}</b> / 100 · classification ${ev.clsOk}/${ev.disc} · attachments ${ev.attOk}/${ev.conds}</div>
     <details><summary>Show the reference storyline (2008 investigation)</summary><ol class="ref">${Object.keys(G.facts).filter(f => G.facts[f].kind === 'event').sort((a, b) => G.facts[a].order - G.facts[b].order).map(f => `<li class="${known(f) ? '' : 'missed'}">${esc(G.facts[f].time)} · ${esc(G.facts[f].text)}${known(f) ? '' : ' <span class="small">(not found)</span>'}</li>`).join('')}</ol></details></section>` : ''}
  ${!chk ? `<div class="next-row"><button class="btn primary" data-act="checkStory" ${tray.length ? 'disabled' : ''}>${tray.length ? 'Sort all cards first' : 'Check my storyline'}</button></div>` : nextBtn('Code the ICAM analysis', true)}`;
};
function storyChart() {
  const events = S.story.order.filter(f => S.story.cls[f] === 'event');
  if (!events.length) return '<p class="muted">Classify some events to see the chart.</p>';
  const W = 170, gap = 34, top = 30, eh = 86;
  const conds = Object.keys(S.facts).filter(f => S.story.cls[f] === 'condition');
  const byEv = {}; conds.forEach(c => { const a = S.story.attach[c] || 'G'; (byEv[a] = byEv[a] || []).push(c); });
  const maxC = Math.max(1, ...events.map(e => (byEv[e] || []).length));
  const ch = 70, condTop = top + eh + 40, H = condTop + maxC * (ch + 12) + 20;
  const width = 20 + events.length * (W + gap);
  const wrap = (t, n) => { const w = t.split(' '), out = []; let l = ''; w.forEach(x => { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x; } else l += ' ' + x; }); if (l.trim()) out.push(l.trim()); return out; };
  let s = `<svg class="story-svg" viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" role="img" aria-label="Storyline chart"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>`;
  events.forEach((e, i) => {
    const x = 20 + i * (W + gap), pres = storyStatus(e) === 'presumptive';
    const lines = wrap(G.facts[e].text, 26).slice(0, 5);
    s += `<rect x="${x}" y="${top}" width="${W}" height="${eh}" rx="3" class="ev-box${pres ? ' pres' : ''}"/>`;
    s += `<text x="${x + 8}" y="${top - 8}" class="ev-t">${esc(G.facts[e].time)}</text>`;
    lines.forEach((l, k) => s += `<text x="${x + 8}" y="${top + 16 + k * 14}" class="ev-tx">${esc(l)}</text>`);
    if (i < events.length - 1) s += `<line x1="${x + W}" y1="${top + eh / 2}" x2="${x + W + gap - 2}" y2="${top + eh / 2}" class="arrow" marker-end="url(#ah)"/>`;
    (byEv[e] || []).forEach((c, k) => {
      const cy = condTop + k * (ch + 12), cp = storyStatus(c) === 'presumptive';
      s += `<line x1="${x + W / 2}" y1="${cy}" x2="${x + W / 2}" y2="${top + eh}" class="link"/>`;
      s += `<ellipse cx="${x + W / 2}" cy="${cy + ch / 2}" rx="${W / 2 + 4}" ry="${ch / 2}" class="cond-ell${cp ? ' pres' : ''}"/>`;
      wrap(G.facts[c].text, 30).slice(0, 4).forEach((l, j) => s += `<text x="${x + W / 2}" y="${cy + 18 + j * 12}" class="cond-tx" text-anchor="middle">${esc(l)}</text>`);
    });
  });
  s += '</svg>';
  const gen = byEv.G || [];
  return s + (gen.length ? `<div class="gen-conds"><b>Underlying conditions:</b> ${gen.map(c => `<span class="cond-pill">${esc(G.facts[c].text)}</span>`).join('')}</div>` : '');
}

/* ---------- stage 6: ICAM ----------------------------------------------- */
R.renderIcam = () => {
  const facts = Object.keys(S.facts).filter(f => S.story.cls[f] !== 'irrelevant')
    .sort((a, b) => (G.facts[a].kind === G.facts[b].kind ? (G.facts[a].order || 99) - (G.facts[b].order || 99) || (a < b ? -1 : 1) : G.facts[a].kind === 'event' ? -1 : 1));
  const chk = S.icamChecked, ev = chk ? icamEval() : null;
  const opts = sel => `<option value="">— choose —</option><option value="NONE" ${sel === 'NONE' ? 'selected' : ''}>Sequence only / not a factor</option>` +
    Object.keys(G.icamCodes).map(k => `<optgroup label="${esc(G.icamCodes[k].name)}">${Object.keys(G.icamCodes[k].codes).map(c => `<option value="${c}" ${sel === c ? 'selected' : ''}>${c} · ${esc(G.icamCodes[k].codes[c])}</option>`).join('')}</optgroup>`).join('');
  const done = facts.filter(f => S.icam[f]).length;
  return `<section class="stage-head"><p class="eyebrow">Stage 6 · ICAM</p><h1>ICAM analysis</h1>
    <p class="lede">Code each fact with the ICAM classification that fits best. Work from the sharp end back: absent or failed <b>defences</b>, <b>individual/team actions</b>, <b>task/environmental conditions</b>, then <b>organisational factors</b>. Events that are only part of the sequence are coded "sequence only".</p></section>
  <section class="card icam-legend"><div class="lg df">DF · Defences</div><div class="lg it">IT · Individual / team actions</div><div class="lg tc">WF/HF · Task / environment</div><div class="lg of">OF · Organisational factors</div></section>
  <section class="card"><div class="tbl-wrap"><table class="icam"><thead><tr><th>Fact</th><th>ICAM code</th>${chk ? '<th>Check</th>' : ''}</tr></thead><tbody>
    ${facts.map(f => { const d = G.facts[f], pick = S.icam[f];
      let res = '';
      if (chk) { const full = pick && has(d.icam, pick), part = !full && pick && d.icam.some(c => G.codeLevel(c) === G.codeLevel(pick));
        res = `<td class="${full ? 'ok' : part ? 'warn' : 'bad'}">${full ? '✓' : part ? '½ right level' : '✗'}<div class="small">Accepted: ${d.icam.map(c => c === 'NONE' ? 'sequence only' : c).join(', ')}</div></td>`; }
      const lvl = pick ? G.codeLevel(pick) : '';
      return `<tr class="lvl-${lvl.toLowerCase()}"><td><span class="kind ${d.kind}">${d.kind === 'event' ? 'E' : 'C'}</span> ${esc(d.text)}</td><td><label class="sr" for="ic-${f}">Code</label><select id="ic-${f}" data-act="icam" data-f="${f}" ${chk ? 'disabled' : ''}>${opts(pick)}</select></td>${res}</tr>`; }).join('')}
  </tbody></table></div></section>
  ${chk ? `<section class="card"><div class="score-line">ICAM score <b>${ev.score}</b> / 100 · ${ev.full} exact, ${ev.part} right level, of ${ev.n} facts</div>${icamSummary()}</section>${nextBtn('Root cause and actions', true)}` :
    `<div class="next-row"><span class="muted" id="icam-count">${done} of ${facts.length} coded</span><button class="btn primary" data-act="checkIcam" ${done === facts.length && facts.length ? '' : 'disabled'}>Check my ICAM coding</button></div>`}`;
};
function icamSummary() {
  const groups = { DF: [], IT: [], TC: [], OF: [] };
  Object.keys(S.icam).forEach(f => { const c = S.icam[f]; const l = G.codeLevel(c); if (groups[l]) groups[l].push([c, f]); });
  return `<div class="icam-sum">${Object.keys(groups).map(k => `<div class="col ${k.toLowerCase()}"><h3>${LEVEL_NAME[k]}</h3><ul>${groups[k].sort().map(([c, f]) => `<li><b>${c}</b> ${esc(G.facts[f].text)}</li>`).join('') || '<li class="muted">None coded</li>'}</ul></div>`).join('')}</div>`;
}

/* ---------- stage 7: root cause & actions --------------------------------- */
R.renderRoot = () => {
  const chk = S.rootChecked, ev = chk ? rootEval() : null;
  return `<section class="stage-head"><p class="eyebrow">Stage 7</p><h1>Root cause and corrective actions</h1>
    <p class="lede">Pick up to three root cause statements that are supported by your organisational factors, then write the root cause statement in your own words. Choose corrective actions that fix the system, and aim as high up the hierarchy of controls as you can.</p></section>
  <div class="two">
  <section class="card"><h2>Root causes <span class="pill">${S.roots.length}/3</span></h2><div class="checks">${G.rootOptions.map(r => { const on = has(S.roots, r.id);
    const cls = chk ? (r.score > 0 ? (on ? 'ok' : 'miss') : (on ? 'bad' : 'avoid')) : '';
    return `<label class="check ${cls}"><input type="checkbox" data-act="root" data-id="${r.id}" ${on ? 'checked' : ''} ${chk || (!on && S.roots.length >= 3) ? 'disabled' : ''}><span>${esc(r.t)}${chk ? `<em>${r.score > 1 ? 'A root cause.' : r.score === 1 ? 'Contributing organisational factor; acceptable.' : esc(r.fb)}</em>` : ''}</span></label>`; }).join('')}</div>
    <label for="rtext"><b>Root cause statement</b> (in your words)</label><textarea id="rtext" rows="6" data-act="rtext" ${chk ? 'disabled' : ''} placeholder="Explain how the organisational factors created the conditions under which the people involved acted as they did…">${esc(S.rootText)}</textarea>
  </section>
  <section class="card"><h2>Corrective actions <span class="pill">${S.acts.length} selected</span></h2><div class="checks">${G.actionOptions.map(a => { const on = has(S.acts, a.id);
    const cls = chk ? (a.good ? (on ? 'ok' : 'miss') : (on ? 'bad' : 'avoid')) : '';
    return `<label class="check ${cls}"><input type="checkbox" data-act="actpick" data-id="${a.id}" ${on ? 'checked' : ''} ${chk ? 'disabled' : ''}><span><span class="hoc h${G.hocRank[a.hoc]}">${esc(a.hoc)}</span> ${esc(a.t)}${chk ? `<em>${a.good ? (a.weak ? 'Valid but weak: PPE is the last line of defence.' : 'Addresses: ' + a.covers.join(', ')) : esc(a.fb)}</em>` : ''}</span></label>`; }).join('')}</div></section>
  </div>
  ${chk ? `<section class="card"><div class="score-line">Score <b>${ev.score}</b> / 100 · organisational factors covered ${Math.round(ev.cov * 100)}% · ${ev.strong ? 'includes higher-order controls' : 'no higher-order controls'}${ev.weak ? ' · ' + ev.weak + ' weak action(s)' : ''}</div>
    <details open><summary>Model root cause statement (2008 investigation)</summary><p>${esc(G.model.rootCause)}</p></details></section>${nextBtn('See the debrief', true)}` :
    `<div class="next-row"><button class="btn primary" data-act="checkRoot" ${S.roots.length && S.acts.length ? '' : 'disabled'}>Submit findings</button></div>`}`;
};

/* ---------- stage 8: debrief -------------------------------------------- */
R.renderDebrief = () => {
  const sc = scores();
  const missed = keyFacts().filter(f => !known(f));
  const grade = sc.total >= 85 ? 'Lead investigator' : sc.total >= 70 ? 'Competent investigator' : sc.total >= 50 ? 'Developing investigator' : 'Needs more practice';
  return `<section class="stage-head row"><div><p class="eyebrow">Stage 8 · Debrief</p><h1>${esc(grade)}</h1><p class="lede">${esc(S.klass ? S.klass.team : S.teamName || 'Your team')} · ${keyFound().length} of ${keyFacts().length} key facts · ${fmtH(S.used[1] + S.used[2] + S.used[3])} used</p></div><div class="big-score"><b>${sc.total}</b><span>/ 100</span></div></section>
  <section class="card"><h2>Score by stage</h2><div class="bars">${sc.parts.map(p => `<div class="bar"><span class="bl">${esc(p[0])}</span><span class="bt"><i style="width:${p[1]}%"></i></span><span class="bv">${p[1]}</span></div>`).join('')}</div>
    <p class="small muted">Weighting: evidence and interviews 20%; storyline and ICAM coding 15% each; the other five stages 10% each.</p></section>
  <div class="two">
    <section class="card"><h2>Interview technique</h2><div class="qstats">${Object.keys(S.qStats).map(k => `<div class="qs ${k}"><b>${S.qStats[k]}</b><span>${G.qtypes[k].label}</span></div>`).join('')}</div>
      <p class="small">${S.qStats.blame ? 'You asked blaming questions. In ICAM the aim is to understand why the actions made sense at the time, not to judge them.' : 'No blaming questions. Well done.'} ${S.qStats.leading ? 'Leading questions put your assumptions into witnesses\' mouths.' : ''}</p></section>
    <section class="card"><h2>Key facts you missed (${missed.length})</h2>${missed.length ? `<ul class="missed">${missed.map(f => `<li>${esc(G.facts[f].text)}<span class="small muted">Where: ${esc((SOURCES[f] || ['—']).slice(0, 3).join(' · '))}</span></li>`).join('')}</ul>` : '<p>None. You found every key fact.</p>'}</section>
  </div>
  <section class="card"><h2>Key learnings from the real investigation</h2><ul>${G.model.learnings.map(l => `<li>${esc(l)}</li>`).join('')}</ul></section>
  <section class="card"><h2>Take your case further</h2><p>Download your investigation as a <b>Storyline Casebook case package</b> and import it into the Storyline Casebook to finish the report with your team. You can also download the full investigation report.</p>
    <div class="btnrow"><button class="btn primary" data-act="exportCase">Download Casebook package (.json)</button><button class="btn" data-act="exportReport">Download report (.html)</button></div></section>
  <div class="next-row"><button class="btn ghost" data-act="restartAsk">Play again</button></div>`;
};

/* ---------- guide: overview, how to play, facilitator ------------------- */
const GUIDE_TABS = [['overview', 'Overview'], ['play', 'How to play'], ['fac', 'Facilitator guide']];
const GUIDE_STAGES = [
  ['Call-out', '10–15 min', 'Read the supervisor\'s phone report and choose your immediate instructions.', 'Your choices decide which evidence survives: an unsecured scene gets cleared, a truck nobody holds leaves at 16:10 with its load, and a suspended operator is guarded in interview.'],
  ['Team & severity', '10–15 min', 'Pick the investigation team and rate actual and potential severity.', 'Look for independence and the right knowledge. People involved in the event are witnesses, not team members.'],
  ['Data plan', '15–20 min', 'Plan what you will collect under PEEPO (People, Environment, Equipment, Procedures, Organisation) and star the perishable items.', `Planned actions cost their listed time. Anything you did not plan costs an extra ${UNPLANNED_PENALTY} h to arrange.`],
  ['Investigate', '60–120 min', 'Spend 20 hours over three days on interviews, site work, documents and 5-Why chains.', 'Day 1 has 4 h (from 14:00), days 2 and 3 have 8 h each. There is more to do than time allows, so prioritise. Some actions are only possible on certain days.'],
  ['Storyline', '30–45 min', 'Sort your fact cards into events and conditions, put events in time order, attach conditions, and mark each as proven or presumptive.', 'Facts you never found are not in your deck. Cards that turn out to be irrelevant can be set aside.'],
  ['ICAM analysis', '30–45 min', 'Code each fact as an absent or failed defence, individual or team action, task or environmental condition, or organisational factor.', 'Some facts are only part of the sequence and need no code. Use the “sequence only” option for them.'],
  ['Root cause & actions', '20–30 min', 'Choose up to three root causes, write a root-cause statement and pick corrective actions.', 'Actions are rated on the hierarchy of controls. Discipline and “be more careful” are weak.'],
  ['Debrief', '20–30 min', 'See your scores by stage, the facts you missed and where to find them, and the model answer.', 'Download your report or a package for the Storyline Casebook.']
];
let guideTab = 'overview';
function guideHTML() {
  const body = guideTab === 'play' ? guidePlay() : guideTab === 'fac' ? guideFac() : guideOverview();
  return `<p class="eyebrow">Guide · ${esc(G.meta.caseRef)}</p><h2>The Falling Billet</h2>
    <div class="tabs guide-tabs">${GUIDE_TABS.map(t => `<button class="tab ${guideTab === t[0] ? 'on' : ''}" data-act="guideTab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="guide">${body}</div>
    <div class="modal-foot">${S.stage === 0 ? '<button class="btn primary" data-act="closeModal">Back to the briefing</button>' : '<button class="btn" data-act="closeModal">Close</button>'}</div>`;
}
function guideOverview() {
  return `<p class="lede">An incident investigation game built on a real 2008 case. A steel billet fell from a contract truck during forklift offloading at a steel mill and seriously injured the driver. You take the role of lead investigator, from the first phone call to the corrective actions.</p>
    <h3>What you will practise</h3>
    <ul><li>Securing and preserving evidence in the first hour</li>
      <li>Forming an independent team and rating severity</li>
      <li>Planning data collection with PEEPO and prioritising perishable evidence</li>
      <li>Interviewing with open and probing questions, and avoiding leading or blaming ones</li>
      <li>Reading documents critically: dates, versions, licences and ratings</li>
      <li>Drilling down with 5-Why</li>
      <li>Building an ECFA+ storyline of events and conditions</li>
      <li>Coding the facts with ICAM and finding the organisational factors</li>
      <li>Writing a root cause and choosing strong corrective actions</li></ul>
    <h3>The case</h3>
    <p>${esc(G.meta.company)}, rolling mill billet yard, ${esc(G.meta.dateLabel)}. Billets are delivered by ${esc(G.meta.haulier)} from ${esc(G.meta.supplier)} and offloaded by forklift. Everything you learn has to come from your own investigation, just as it would on site.</p>
    <h3>How long it takes</h3>
    <p>About 4 to 6 hours as a class, including discussion; 2 to 3 hours played alone. Progress saves in your browser, so you can stop and come back.</p>
    <h3>Ways to play</h3>
    <ul><li><b>On your own or as a team</b>: enter a name on the briefing screen and start.</li>
      <li><b>In a class session</b> (claude.ai version only): join with the code from your facilitator, who releases stages and days and sees each team's progress.</li>
      <li><b>Led from the front</b>: the facilitator plays on a projector while the class decides each step.</li></ul>
    <p class="small muted">Names, companies and documents are anonymised and recreated for training. Photographs of the casualty are left out.</p>`;
}
function guidePlay() {
  return `<h3>The basics</h3>
    <ul><li>Work through the stages in order using the stage bar at the top. You can go back to finished stages to look again.</li>
      <li>Each stage ends with a button that submits your work (for example <b>Give instructions</b> or <b>Check my storyline</b>). You then get feedback and a score, and can move on.</li>
      <li><b>↺ Reset stage</b> in the header clears the current stage so you can try it again.</li>
      <li>From the investigation on, <b>Case file</b> in the header shows the facts, evidence, photos and interviews you have gathered so far.</li></ul>
    <h3>The stages</h3>
    <div class="tbl-wrap"><table class="reg guide-tbl"><tr><th>Stage</th><th>What you do</th><th>Good to know</th></tr>
      ${GUIDE_STAGES.map((s, i) => `<tr><td><b>${i + 1} · ${esc(s[0])}</b><br><span class="muted small">${esc(s[1])}</span></td><td>${esc(s[2])}</td><td>${esc(s[3])}</td></tr>`).join('')}</table></div>
    <h3>Interviewing</h3>
    <ul><li><b>Open</b> questions (“Tell me what happened…”) and <b>probes</b> (“What did you see then?”) bring out the most facts.</li>
      <li><b>Closed</b> questions confirm details but add little.</li>
      <li><b>Leading</b> questions put words in the witness's mouth. Answers become unreliable.</li>
      <li><b>Blaming</b> questions damage rapport. From then on the witness gives guarded answers and holds back.</li>
      <li>Some witnesses are only available on certain days or for a limited number of questions.</li></ul>
    <h3>Time</h3>
    <ul><li>The clock in the header shows the day, time and hours left. Each action shows its cost.</li>
      <li>Use <b>End day</b> to move to the next day. Unused hours are lost.</li>
      <li>Evidence can disappear: a truck leaves, a scene is cleared, a forklift goes back into service.</li></ul>
    <h3>Documents and photos</h3>
    <p>Read each document carefully and tick what you observe. Correct observations become facts; wrong ones count against you. Photos are released by site work and the reconstruction.</p>
    <h3>Scoring</h3>
    <p>Your total out of 100 is weighted: call-out 10, team &amp; severity 10, data plan 10, evidence &amp; interviews 20, 5-Why 10, storyline 15, ICAM coding 15, root cause &amp; actions 10. Interview technique counts within evidence &amp; interviews.</p>`;
}
function guideFac() {
  const notes = [
    ['Call-out', 'What is the first priority? What is perishable here? What message does an early suspension send?'],
    ['Team & severity', 'Why not include the operator or the supervisor on duty? Why does potential severity, not actual, set the investigation level?'],
    ['Data plan', 'Which items did teams star, and why? What would you collect in the first hour on a real site?'],
    ['Investigate', 'Compare question types across teams. Who spotted the dates on WI 044 and the HIRA, and the licence class against the machine rating? What did each team run out of time for?'],
    ['Storyline', 'Where do teams disagree on event versus condition? Which facts are presumptive, and what would prove them?'],
    ['ICAM analysis', 'Which facts were coded as individual actions when they are really conditions or organisational factors?'],
    ['Root cause & actions', 'Would each action have prevented this event? Where does it sit on the hierarchy of controls?'],
    ['Debrief', 'What would you do differently on your next investigation?']
  ];
  return `<h3>Before the session</h3>
    <ul><li>Play through once yourself, ideally twice, to learn where the key facts are.</li>
      <li>For a live class, open the claude.ai version, share it with the learners from the page's Share menu and give them <b>can interact</b> access so their progress reaches your board.</li>
      <li>Offline, give each team the HTML file (USB, LMS or email). Everything works except the live class board.</li>
      <li>Teams of 3 to 5 work best: one person drives the screen, one keeps notes, the rest question.</li></ul>
    <h3>Facilitator mode</h3>
    <p>Open <b>Facilitator</b> (top right) and enter the facilitator code from your printed facilitator guide. Facilitator mode lets you:</p>
    <ul><li>show the answer keys on each stage screen</li><li>unlock all stages, add 4 hours to the current day, or reveal all facts for a demonstration</li>
      <li>see the reference storyline, the key facts and where to find them, and the model root cause</li>
      <li>start a class session (claude.ai only), release stages and days, send injects to every team, and watch the team board</li></ul>
    <h3>Running a class session</h3>
    <ol><li>Facilitator → <b>Start class session</b>. Give teams the session code.</li>
      <li>Teams choose <b>Join a class session</b> on the briefing screen and enter the code and a team name.</li>
      <li>Release one stage at a time. Hold everyone at the end of each stage for a short plenary debrief before releasing the next.</li>
      <li>In the investigation, release one day at a time. Use injects for pressure, e.g. “Production wants the yard reopened by 15:00.”</li>
      <li>The board shows each team's stage, day, hours used, key facts found and score.</li></ol>
    <h3>Suggested timetable (one day)</h3>
    <div class="tbl-wrap"><table class="reg guide-tbl"><tr><th>Stage</th><th>Time</th></tr>${GUIDE_STAGES.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td></tr>`).join('')}<tr><td>Plenary debriefs between stages</td><td>5–10 min each</td></tr></table></div>
    <h3>Debrief questions</h3>
    ${S.facilitator ? `<div class="tbl-wrap"><table class="reg guide-tbl"><tr><th>Stage</th><th>Ask the class</th></tr>${notes.map(n => `<tr><td><b>${esc(n[0])}</b></td><td>${esc(n[1])}</td></tr>`).join('')}</table></div>
      <p class="small">The answer keys, reference storyline and model root cause are in the <button class="linkbtn" data-act="openFac">facilitator panel</button>.</p>`
      : '<p class="muted">Debrief questions and teaching points open in facilitator mode, so learners do not see the answers. <button class="linkbtn" data-act="openFac">Open the facilitator panel</button></p>'}
    <h3>Teaching tips</h3>
    <ul><li>Let teams make mistakes. Losing the truck or damaging rapport teaches more than any slide.</li>
      <li>Keep the focus on systems, not on the operator or the driver. ICAM asks why the defences allowed this.</li>
      <li>Use the Casebook export to carry a team's case into the Storyline Casebook for a report-writing exercise.</li></ul>`;
}

/* ---------- facilitator ------------------------------------------------- */
function openFac() {
  if (!S.facilitator) {
    showModal(`<h2>Facilitator panel</h2><p class="muted">Enter the facilitator code from the facilitator guide.</p><label for="faccode">Code</label><input id="faccode" autocomplete="off"><div class="modal-foot"><button class="btn primary" data-act="facLogin">Open</button><button class="btn" data-act="closeModal">Cancel</button></div>`);
    setTimeout(() => { const i = $('#faccode'); if (i) i.focus(); }, 50); return;
  }
  const canClass = !!DB;
  showModal(`<h2>Facilitator panel</h2>
    <div class="fac-grid"><section><h3>This screen</h3>
      <label class="check"><input type="checkbox" data-act="facKey" ${S.showKey ? 'checked' : ''}><span>Show answer keys on stage screens</span></label>
      <div class="btnrow"><button class="btn tiny" data-act="facUnlock">Unlock all stages</button><button class="btn tiny" data-act="facDay">Add 4 h to today</button><button class="btn tiny" data-act="facReveal">Reveal all facts (demo)</button></div>
      <h3>Answer key</h3><details><summary>Reference storyline</summary><ol class="ref small">${Object.keys(G.facts).filter(f => G.facts[f].kind === 'event').sort((a, b) => G.facts[a].order - G.facts[b].order).map(f => `<li>${esc(G.facts[f].text)}</li>`).join('')}</ol></details>
      <details><summary>Key facts and where to find them</summary><ul class="small">${keyFacts().map(f => `<li>${esc(G.facts[f].text)} <i>${esc((SOURCES[f] || []).slice(0, 2).join(' · '))}</i></li>`).join('')}</ul></details>
      <details><summary>Model root cause</summary><p class="small">${esc(G.model.rootCause)}</p></details>
      <p class="small"><button class="linkbtn" data-act="facLogout">Leave facilitator mode</button></p></section>
    <section><h3>Class session</h3>${canClass ? facClassHTML() : '<p class="muted small">Live class sessions need the claude.ai version of the game. Offline, run the class from the front: release each day verbally and use the answer keys during the debriefs.</p>'}</section></div>
    <div class="modal-foot"><button class="btn" data-act="closeModal">Close</button></div>`, 'wide');
  if (canClass && S.klass) renderFacBoard();
}
function facClassHTML() {
  if (!S.klass) return `<p class="small">Start a session, give teams the code, and control which stage and day they can reach.</p><label for="cname">Class name</label><input id="cname" placeholder="e.g. Lead Investigator, Oct 2026"><div class="btnrow"><button class="btn primary" data-act="facStart">Start class session</button></div>
    <p class="small muted">Or reconnect to an existing session:</p><input id="ccode" placeholder="Session code"><button class="btn tiny" data-act="facReconnect">Reconnect</button>`;
  const ss = SESSION || {};
  return `<p>Session code <b class="code">${esc(S.klass.code)}</b></p>
    <label for="relstage">Teams may go up to</label><select id="relstage" data-act="facStage">${STAGES.map((s, i) => `<option value="${i}" ${(ss.stage || 0) === i ? 'selected' : ''}>${i} · ${esc(s.label)}</option>`).join('')}</select>
    <label for="relday">Investigation day released</label><select id="relday" data-act="facRelDay">${[1, 2, 3].map(d => `<option value="${d}" ${(ss.day || 1) === d ? 'selected' : ''}>Day ${d}</option>`).join('')}</select>
    <label for="inject">Message / inject to all teams</label><textarea id="inject" rows="2" placeholder="e.g. Day 2: a new Metro delivery arrives at 10:00.">${esc(ss.inject || '')}</textarea><button class="btn tiny" data-act="facInject">Send</button>
    <h3>Teams</h3><div id="fac-board"></div><p class="small"><button class="linkbtn" data-act="facEnd">Disconnect from this session</button></p>`;
}
function renderFacBoard() {
  const b = $('#fac-board'); if (!b) return;
  if (!TEAMS.length) { b.innerHTML = '<p class="muted small">No teams yet.</p>'; return; }
  b.innerHTML = `<div class="tbl-wrap"><table class="reg"><tr><th>Team</th><th>Stage</th><th>Day</th><th>Hours</th><th>Key facts</th><th>Score</th></tr>${TEAMS.sort((a, c) => (c.total || 0) - (a.total || 0)).map(t => `<tr><td>${esc(t.team)}</td><td>${esc(t.stageLabel)}</td><td>${t.day}</td><td>${t.hours}</td><td>${t.keyFacts}/${t.keyTotal}</td><td><b>${t.total}</b></td></tr>`).join('')}</table></div>`;
}
async function facWrite(patch) {
  if (!DB || !S.klass) return;
  try { await DB.doc('sessions/' + S.klass.code).set(Object.assign({}, SESSION || {}, patch, { updatedAt: new Date().toISOString() })); }
  catch (e) { toast(e && e.code === 'permission_denied' ? 'Only editors of this page can run a class session.' : 'Could not update the session (' + (e && e.code || 'error') + ').'); }
}

/* ---------- exports ----------------------------------------------------- */
function casebookPackage() {
  const hoc = { Elimination: 'elimination', Substitution: 'substitution', Engineering: 'engineering', Isolation: 'engineering', Administrative: 'administrative', PPE: 'ppe', Awareness: 'ppe', Discipline: 'administrative' };
  const cat = { DF: 'defences', IT: 'actions', TC: 'conditions', OF: 'organizational' };
  const events = S.story.order.filter(f => S.story.cls[f] === 'event');
  const conds = Object.keys(S.facts).filter(f => S.story.cls[f] === 'condition');
  const eid = {}; events.forEach((f, i) => eid[f] = 'e' + (i + 1));
  const cid = {}; conds.forEach((f, i) => cid[f] = 'c' + (i + 1));
  const codeLabel = c => { for (const k in G.icamCodes) if (G.icamCodes[k].codes[c]) return G.icamCodes[k].codes[c]; return ''; };
  const team = S.team.map(id => G.team.find(t => t.id === id)).filter(t => t && t.ok !== 'no');
  const roots = S.roots.map(id => G.rootOptions.find(r => r.id === id));
  const rc = roots.map((r, i) => ({ id: 'rc' + (i + 1), text: r.t }));
  if (S.rootText.trim()) rc.unshift({ id: 'rc0', text: S.rootText.trim() });
  return {
    format: 'storyline-casebook-case', version: 1, exportedAt: new Date().toISOString(), source: 'The Falling Billet (ICAM investigation game)',
    case: {
      caseTitle: 'Falling billet seriously injures contract truck driver (training case ' + G.meta.caseRef + ')',
      facility: 'Steel Inc. rolling mill', location: 'Billet yard offloading area', incidentType: 'Personal Injury',
      dateOccurred: G.meta.date, timeOccurred: '12:36', reportedBy: G.initialReport.from, reportedAt: G.meta.date + 'T12:50:00',
      personsInvolved: 'Lucas Mokoena (contract truck driver, injured); Sizwe Ndlovu (forklift operator); Gerrit Visser (area supervisor); Kevin Adams (paramedic); Neville Fortuin (reheat forklift operator).',
      initialDescription: G.initialReport.text,
      refinedDescription: events.map(f => G.facts[f].text).join(' '),
      actualSeverity: S.sevA || 4, potentialSeverity: S.sevP || 5,
      immediateActionsTaken: S.callout.map(id => G.callout.find(c => c.id === id)).filter(c => c.good !== false).map(c => c.text).join('; '),
      sceneSecured: !!(S.flags.sceneSecured && !S.flags.sceneCleared), accessLogStarted: !!S.flags.sceneSecured,
      notificationsRequired: S.flags.notified ? 'Department of Labour (OHS Act s24), haulier, management' : '',
      status: 'review', rootCause: { immediateCauses: 'A billet slid off the far side of a partly lifted, shifted load and struck the truck driver, who was out of the operator\'s sight.' }
    },
    investigationTeam: team.map(t => ({ name: t.name.split(',')[0].replace(/^You: /, 'Lead investigator: '), role: t.id === 'lead' ? 'Lead Investigator' : 'Co-Investigator', customRole: '', organization: t.id === 'haulier' ? G.meta.haulier : G.meta.company, contact: '', notes: t.name })),
    involvedPersons: ['mokoena', 'ndlovu', 'visser', 'adams', 'fortuin'].map(k => ({ name: G.people[k].name, role: k === 'mokoena' ? 'Injured Party' : k === 'adams' ? 'First Responder / Medic' : k === 'visser' ? 'Supervisor' : k === 'ndlovu' ? 'Equipment Operator' : 'Witness / Eyewitness', customRole: '', organization: k === 'mokoena' ? G.meta.haulier : G.meta.company, contact: '', notes: G.people[k].role })),
    evidence: S.evidence.map(e => ({ id: e.id, type: e.type, description: e.desc, source: e.source, collectedBy: 'Investigation team', collectedAt: DAY_ISO[e.day], status: 'Logged' })),
    events: events.map(f => ({ id: eid[f], time: G.facts[f].time, text: G.facts[f].text, status: storyStatus(f), evidenceIds: S.facts[f].ev })),
    conditions: conds.map(f => ({ id: cid[f], eventId: S.story.attach[f] && S.story.attach[f] !== 'G' ? eid[S.story.attach[f]] || null : null, text: G.facts[f].text, status: storyStatus(f), evidenceIds: S.facts[f].ev })),
    icamFactors: Object.keys(S.icam).filter(f => S.icam[f] !== 'NONE' && S.facts[f] && (eid[f] || cid[f])).map((f, i) => {
      const c = S.icam[f], l = G.codeLevel(c);
      return { id: 'i' + (i + 1), category: cat[l], description: G.facts[f].text, linkedType: eid[f] ? 'event' : 'condition', linkedId: eid[f] || cid[f], code: c, codeLabel: codeLabel(c), codeStatus: l === 'OF' ? 'Contributing' : '' };
    }),
    contributingFactors: [], rootCauses: rc,
    keyLearnings: G.model.learnings.map((t, i) => ({ id: 'kl' + (i + 1), text: t })),
    correctiveActions: S.acts.map(id => G.actionOptions.find(a => a.id === id)).filter(a => a.good).map((a, i) => ({ id: 'a' + (i + 1), finding: 'Addresses ' + a.covers.join(', '), linkedCauseType: rc.length ? 'root' : 'additional', linkedCauseId: rc.length ? rc[0].id : null, action: a.t, timeframe: G.hocRank[a.hoc] >= 3 ? 'longterm' : 'intermediate', hocLevel: hoc[a.hoc] || 'administrative', owner: '', targetDate: '' })),
    photos: S.photos.map((p, i) => ({ dataUrl: G.photoData[p.id], caption: G.photos[p.id], category: /Reconstruction/.test(G.photos[p.id]) ? 'evidence' : 'scene', linkedEvidenceId: p.ev, includeInReport: i < 6, order: i + 1, fileName: p.id + '.jpg' }))
  };
}
function reportHTML() {
  const pkg = casebookPackage(); const sc = scores();
  const css = 'body{font:15px/1.5 Georgia,serif;max-width:900px;margin:32px auto;padding:0 20px;color:#1b1f23}h1,h2{font-family:Arial Narrow,Arial,sans-serif}h2{border-bottom:2px solid #333;padding-bottom:4px;margin-top:32px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #bbb;padding:5px;text-align:left;vertical-align:top}th{background:#eee}.svg{overflow-x:auto}img{max-width:100%}figure{display:inline-block;width:31%;margin:0 1% 12px;vertical-align:top;font-size:12px}';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Investigation report ${G.meta.caseRef}</title><style>${css}</style></head><body>
  <h1>Serious Incident Investigation Report (ICAM)</h1><p><b>${esc(pkg.case.caseTitle)}</b><br>${esc(G.meta.dateLabel)}, about 12:36 · ${esc(pkg.case.location)}<br>Prepared by: ${esc(S.klass ? S.klass.team : S.teamName || 'Investigation team')} · Training exercise score ${sc.total}/100</p>
  <h2>1. Description</h2><p>${esc(pkg.case.refinedDescription)}</p><p><b>Severity:</b> actual ${pkg.case.actualSeverity}, potential ${pkg.case.potentialSeverity}.</p>
  <h2>2. Investigation team</h2><ul>${pkg.investigationTeam.map(t => `<li>${esc(t.notes)}</li>`).join('')}</ul>
  <h2>3. Evidence register</h2><table><tr><th>ID</th><th>Type</th><th>Description</th><th>Collected</th></tr>${pkg.evidence.map(e => `<tr><td>${e.id}</td><td>${esc(e.type)}</td><td>${esc(e.description)}</td><td>${e.collectedAt}</td></tr>`).join('')}</table>
  <h2>4. Storyline (ECFA+)</h2><div class="svg">${storyChart()}</div><table><tr><th>#</th><th>Time</th><th>Event</th><th>Status</th><th>Evidence</th></tr>${pkg.events.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.time)}</td><td>${esc(e.text)}</td><td>${e.status}</td><td>${e.evidenceIds.join(', ')}</td></tr>`).join('')}</table>
  <h3>Conditions</h3><table><tr><th>Condition</th><th>Linked event</th><th>Status</th></tr>${pkg.conditions.map(c => `<tr><td>${esc(c.text)}</td><td>${c.eventId || 'underlying'}</td><td>${c.status}</td></tr>`).join('')}</table>
  <h2>5. ICAM analysis</h2><table><tr><th>Level</th><th>Code</th><th>Finding</th></tr>${pkg.icamFactors.sort((a, b) => a.category < b.category ? -1 : 1).map(f => `<tr><td>${esc(f.category)}</td><td>${f.code} ${esc(f.codeLabel)}</td><td>${esc(f.description)}</td></tr>`).join('')}</table>
  <h2>6. Root cause</h2>${pkg.rootCauses.map(r => `<p>${esc(r.text)}</p>`).join('')}
  <h2>7. Corrective actions</h2><table><tr><th>#</th><th>Action</th><th>Control level</th><th>Addresses</th></tr>${pkg.correctiveActions.map((a, i) => `<tr><td>${i + 1}</td><td>${esc(a.action)}</td><td>${a.hocLevel}</td><td>${esc(a.finding)}</td></tr>`).join('')}</table>
  <h2>8. Key learnings</h2><ul>${G.model.learnings.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
  <h2>9. Photographs</h2>${S.photos.map(p => `<figure><img src="${G.photoData[p.id]}" alt=""><figcaption>${p.ev} · ${esc(G.photos[p.id])}</figcaption></figure>`).join('')}
  <p style="font-size:12px;color:#666">Training case based on a real ICAM investigation; all names and documents anonymised.</p></body></html>`;
}
async function saveFile(name, text, mime) {
  if (HAS_RUNTIME) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: new Blob([text], { type: mime }) }); return; } }
    catch (e) { if (e && e.code === 'cancelled') return; }
  }
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) { toast('This view cannot save files.'); }
}

/* ---------- modal --------------------------------------------------------- */
function showModal(html, size) {
  closeModal(true);
  const w = document.createElement('div'); w.className = 'modal-bg'; w.innerHTML = `<div class="modal ${size || ''}" role="dialog" aria-modal="true"><button class="modal-x" data-act="closeModal" aria-label="Close">×</button>${html}</div>`;
  document.body.appendChild(w); document.body.classList.add('noscroll');
}
function closeModal(silent) { const m = $('.modal-bg'); if (m) m.remove(); document.body.classList.remove('noscroll'); if (!silent) { S.activeInterview = null; } }

/* ---------- actions ------------------------------------------------------- */
const A = {
  goto: d => go(+d.i),
  next: () => go(S.stage + 1),
  startSolo: () => { const n = ($('#tname') || {}).value; S.teamName = (n || '').trim(); S.mode = 'solo'; go(Math.max(1, S.maxStage)); },
  joinClass: async () => {
    const code = ($('#jcode').value || '').trim().toUpperCase(), team = ($('#jteam').value || '').trim();
    if (!code || !team) { toast('Enter the session code and your team name.'); return; }
    try { const snap = await DB.doc('sessions/' + code).get(); if (!snap.exists) { toast('No class session with code ' + code + '.'); return; } }
    catch (e) { toast('Could not reach the class session (' + (e && e.code || 'error') + ').'); return; }
    S.klass = { code, team, slug: team.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'team' }; S.teamName = team; S.mode = 'class';
    subscribeSession(code); go(1);
  },
  openFac: openFac,
  openGuide: d => { if (d && d.t) guideTab = d.t; showModal(guideHTML(), 'wide'); },
  guideTab: d => { guideTab = d.t; const m = $('.modal'); if (m) { m.innerHTML = '<button class="modal-x" data-act="closeModal" aria-label="Close">×</button>' + guideHTML(); const t = m.querySelector('.guide-tabs .tab.on'); if (t) t.focus(); } },
  fileModal: () => showModal(`<h2>Case file</h2>${caseFileHTML()}`, 'wide'),
  facLogin: () => { if ((($('#faccode') || {}).value || '').trim().toUpperCase() === G.meta.facilitatorCode) { S.facilitator = true; save(); render(); openFac(); } else toast('That code is not right.'); },
  facLogout: () => { S.facilitator = false; S.showKey = false; save(); closeModal(); render(); },
  facKey: (d, el) => { S.showKey = el.checked; save(); render(); },
  facUnlock: () => { S.maxStage = STAGES.length - 1; save(); render(); toast('All stages unlocked.'); },
  facDay: () => { S.used[S.day] = Math.max(0, S.used[S.day] - 4); save(); render(); toast('Added 4 hours to today.'); },
  facReveal: () => { Object.keys(G.facts).forEach(f => discover(f, null)); save(); render(); toast('All facts revealed for demonstration.'); },
  facStart: async () => {
    const code = 'B' + Math.floor(1000 + Math.random() * 9000);
    S.klass = { code, team: 'Facilitator', slug: 'facilitator' }; SESSION = null;
    await facWrite({ name: ($('#cname').value || '').trim() || 'Class', stage: 1, day: 1, inject: '', createdAt: new Date().toISOString() });
    subscribeSession(code); save(); openFac();
  },
  facReconnect: () => { const code = ($('#ccode').value || '').trim().toUpperCase(); if (!code) return; S.klass = { code, team: 'Facilitator', slug: 'facilitator' }; subscribeSession(code); save(); setTimeout(openFac, 400); },
  facEnd: () => { if (sessUnsub) sessUnsub(); if (teamsUnsub) teamsUnsub(); S.klass = null; SESSION = null; TEAMS = []; save(); openFac(); render(); },
  facInject: () => facWrite({ inject: ($('#inject').value || '').trim() }).then(() => toast('Sent to all teams.')),
  resetStageAsk: () => {
    if (!STAGE_FIELDS[S.stage] || !stageHasProgress(S.stage)) { toast('Nothing to reset in this stage yet.'); return; }
    const i = S.stage, deps = STAGE_DEPS[i].filter(stageHasProgress).map(k => STAGES[k].label);
    showModal(`<h2>Reset ${esc(STAGES[i].label)}?</h2><p>This clears your answers for this stage so you can do it again. Other stages keep their work.</p>` +
      (deps.length ? `<p><b>This also clears ${esc(deps.join(', ').replace(/, ([^,]*)$/, ' and $1'))}</b>, because ${i === 4 ? 'they are built on the facts you found' : i === 5 ? 'ICAM codes only the facts your storyline keeps' : 'what you find in the investigation depends on this stage'}.</p>` : '') +
      `<div class="modal-foot"><button class="btn primary" data-act="resetStageYes">Reset stage</button><button class="btn" data-act="closeModal">Cancel</button></div>`);
  },
  resetStageYes: () => { const i = S.stage; resetStage(i); save(); closeModal(); render(); window.scrollTo(0, 0); toast(STAGES[i].label + ' reset.'); },
  restart: () => A.restartAsk(),
  restartAsk: () => showModal('<h2>Start again?</h2><p>This clears all progress in this browser.</p><div class="modal-foot"><button class="btn primary" data-act="restartYes">Clear and restart</button><button class="btn" data-act="closeModal">Cancel</button></div>'),
  restartYes: () => { const fac = S.facilitator, k = S.klass, t = S.teamName; S = freshState(); S.facilitator = fac; S.klass = k; S.teamName = t; save(); closeModal(); render(); },
  toggleCallout: (d, el) => { S.callout = el.checked ? S.callout.concat(d.id) : S.callout.filter(x => x !== d.id); save(); render(); },
  submitCallout: () => { S.calloutDone = true; S.callout.forEach(id => { const c = G.callout.find(x => x.id === id); if (c.flag) S.flags[c.flag] = true; }); logIt('Call-out instructions given'); save(); render(); },
  sev: d => { S['sev' + d.k] = +d.n; save(); render(); },
  toggleTeam: (d, el) => { S.team = el.checked ? S.team.concat(d.id) : S.team.filter(x => x !== d.id); save(); render(); },
  submitTeam: () => { S.teamDone = true; save(); render(); },
  planInc: (d, el) => { const p = S.plan[d.id] = S.plan[d.id] || {}; p.inc = el.checked; if (!el.checked) p.pri = false; save(); render(); },
  planPri: d => { const p = S.plan[d.id]; if (p && p.inc) { p.pri = !p.pri; save(); render(); } },
  submitPlan: () => { S.planDone = true; save(); render(); },
  tab: d => { S.investTab = d.t; save(); render(); },
  doAction: d => doAction(d.id),
  review: d => { const a = G.actions.find(x => x.id === d.id); if (a.kind === 'interview') openInterview(a.who); else if (a.kind === 'doc') openDoc(a.doc); else showModal(`<h2>${esc(a.title)}</h2><p>${esc(reviewText(a))}</p><div class="thumbs">${S.photos.filter(p => S.evidence.find(e => e.id === p.ev && e.source === a.title)).map(p => photoThumb(p.id)).join('')}</div>`); },
  ask: d => ask(d.who, +d.i),
  openDoc: d => openDoc(d.id),
  openIv: d => openInterview(d.id),
  recordObs: d => recordObs(d.id),
  photo: d => { const rec = S.photos.find(x => x.id === d.id); showModal(`<figure class="big-photo"><img src="${G.photoData[d.id]}" alt="${esc(G.photos[d.id])}"><figcaption><span class="mono">${rec ? rec.ev : ''}</span> ${esc(G.photos[d.id])}</figcaption></figure>`, 'wide'); },
  why: d => answerWhy(d.w, +d.i),
  endDay: () => { if (!dayGate(S.day + 1)) { toast('Waiting for the facilitator to release the next day.'); return; } logIt('End of day ' + S.day); S.day++; save(); render(); toast('Day ' + S.day + ' · ' + DAY_DATE[S.day] + ', 07:30'); },
  closeInvest: () => { if (!S.investClosed) { S.investClosed = true; logIt('Data collection closed'); } go(5); },
  cls: d => { S.story.cls[d.f] = d.c; if (d.c === 'event' && !has(S.story.order, d.f)) S.story.order.push(d.f); save(); render(); },
  uncls: d => { delete S.story.cls[d.f]; delete S.story.attach[d.f]; S.story.order = S.story.order.filter(x => x !== d.f); S.story.checked = false; save(); render(); },
  mv: d => { const o = S.story.order.filter(f => S.story.cls[f] === 'event'); const i = o.indexOf(d.f), j = i + (+d.d); if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; S.story.order = o; save(); render(); },
  stat: d => { S.story.status[d.f] = storyStatus(d.f) === 'proven' ? 'presumptive' : 'proven'; save(); render(); },
  tab5chart: () => { $('#chart').innerHTML = storyChart(); },
  checkStory: () => { S.story.checked = true; save(); render(); },
  checkIcam: () => { S.icamChecked = true; save(); render(); },
  root: (d, el) => { S.roots = el.checked ? S.roots.concat(d.id).slice(0, 3) : S.roots.filter(x => x !== d.id); save(); render(); },
  actpick: (d, el) => { S.acts = el.checked ? S.acts.concat(d.id) : S.acts.filter(x => x !== d.id); save(); render(); },
  checkRoot: () => { S.rootText = ($('#rtext') || {}).value || S.rootText; S.rootChecked = true; save(); render(); },
  exportCase: () => saveFile('falling-billet-' + (S.teamName || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.casebook.json', JSON.stringify(casebookPackage(), null, 1), 'application/json'),
  exportReport: () => saveFile('falling-billet-report.html', reportHTML(), 'text/html'),
  closeModal: () => { closeModal(); render(); }
};
function reviewText(a) { const s = G.site[a.id]; if (!s) return ''; if (s.text) return s.text; const f = S.flags;
  if (a.id === 's_scene') return ((f.sceneSecured && !f.sceneCleared) ? s.good : s.poor).text; if (a.id === 'q_load') return s.ok.text; if (a.id === 'q_fork') return (f.forkliftHeld ? s.held : s.free).text; return ''; }
const CHANGE = {
  attach: (d, el) => { S.story.attach[d.f] = el.value || undefined; if (!el.value) delete S.story.attach[d.f]; save(); render(); },
  icam: (d, el) => {
    if (el.value) S.icam[d.f] = el.value; else delete S.icam[d.f]; save();
    const tr = el.closest('tr'); if (tr) tr.className = el.value ? 'lvl-' + G.codeLevel(el.value).toLowerCase() : '';
    const sels = [...document.querySelectorAll('select[data-act=icam]')], n = sels.filter(x => x.value).length;
    const c = $('#icam-count'); if (c) c.textContent = n + ' of ' + sels.length + ' coded';
    const b = document.querySelector('[data-act=checkIcam]'); if (b) b.disabled = n !== sels.length;
    refreshReset();
  },
  facStage: (d, el) => facWrite({ stage: +el.value }),
  facRelDay: (d, el) => facWrite({ day: +el.value })
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  if (b.tagName === 'SELECT' || b.tagName === 'TEXTAREA') return;
  if (b.tagName === 'INPUT' && b.type === 'checkbox') return; // handled on change
  const fn = A[b.dataset.act]; if (fn) { e.preventDefault(); fn(b.dataset, b, e); }
});
document.addEventListener('change', e => {
  const el = e.target; const act = el.dataset && el.dataset.act; if (!act) return;
  if (CHANGE[act]) CHANGE[act](el.dataset, el);
  else if (A[act] && el.type === 'checkbox') A[act](el.dataset, el);
});
document.addEventListener('input', e => { if (e.target.id === 'rtext') { S.rootText = e.target.value; save(); refreshReset(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.modal-bg')) { closeModal(); render(); } });
document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('modal-bg')) { closeModal(); render(); } });

/* ---------- boot ---------------------------------------------------------- */
function start(hot) {
  if (hot && hot.S) S = hot.S; else load();
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S }));
  render();
  initRuntime();
}
window.__billet = { get S() { return S; }, A, scores, storyEval, icamEval, casebookPackage, render };
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
})();
