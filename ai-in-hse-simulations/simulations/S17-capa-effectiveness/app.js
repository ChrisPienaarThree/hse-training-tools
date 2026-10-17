/* ============================================================================
   S17 — CAPA effectiveness tracker. app.js
   Nothing here runs a model. Every CAPA's dates and recurrences are authored;
   "overdue" and "closed but ineffective" are two plain rules evaluated with
   real Date arithmetic, live, on every slider change.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  const STATE = {
    scenarioId: null,
    graceDays: null,
    windowDays: null,
    theme: (function () { try { return localStorage.getItem("s17-theme") || "system"; } catch (e) { return "system"; } })()
  };

  function scenarioList() { return (window.HSE_S17 && window.HSE_S17.manifest) || []; }
  function scenario(id) { return window.HSE_S17.scenarios[id]; }

  /* ---------- real date arithmetic ---------- */
  const DAY_MS = 24 * 60 * 60 * 1000;
  function parseDate(s) { return new Date(s + "T00:00:00Z"); }
  function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / DAY_MS); }

  function evaluate(sc, graceDays, windowDays) {
    const today = sc.referenceDate;
    return sc.capas.map((c) => {
      const daysOpen = c.status === "open" ? daysBetween(c.raisedDate, today) : daysBetween(c.raisedDate, c.closedDate);
      const daysPastDue = c.status === "open" ? daysBetween(c.dueDate, today) : daysBetween(c.dueDate, c.closedDate);
      const isOverdue = c.status === "open" && daysPastDue > graceDays;
      const closedLate = c.status === "closed" && daysPastDue > 0;
      let ineffective = false;
      let recurrenceDays = null;
      if (c.status === "closed") {
        for (const r of c.recurrences) {
          const d = daysBetween(c.closedDate, r);
          if (d >= 0 && d <= windowDays) { ineffective = true; recurrenceDays = recurrenceDays === null ? d : Math.min(recurrenceDays, d); }
        }
      }
      return Object.assign({}, c, { daysOpen, daysPastDue, isOverdue, closedLate, ineffective, recurrenceDays });
    });
  }

  /* ---------- rendering ---------- */
  function render() {
    const sc = scenario(STATE.scenarioId);
    const root = $("#app");
    if (!sc) { root.innerHTML = "<p>Scenario not found.</p>"; return; }

    const graceDays = STATE.graceDays != null ? STATE.graceDays : sc.overdueGraceDays.default;
    const windowDays = STATE.windowDays != null ? STATE.windowDays : sc.recurrenceWindowDays.default;
    const rows = evaluate(sc, graceDays, windowDays);

    const total = rows.length;
    const openCount = rows.filter((r) => r.status === "open").length;
    const closedCount = total - openCount;
    const overdueCount = rows.filter((r) => r.isOverdue).length;
    const ineffectiveCount = rows.filter((r) => r.ineffective).length;
    const effectiveClosedCount = closedCount - ineffectiveCount;
    const effectivePct = closedCount > 0 ? Math.round((100 * effectiveClosedCount) / closedCount) : 0;

    const tiles = `
      <div class="tiles">
        <div class="tile"><div class="tl">Register</div><div class="big">${total}</div><div class="small">${openCount} open · ${closedCount} closed</div></div>
        <div class="tile"><div class="tl">Overdue (open, past grace)</div><div class="big ${overdueCount > 0 ? "bad" : "ok"}">${overdueCount}</div><div class="small">grace period: ${graceDays} day${graceDays === 1 ? "" : "s"}</div></div>
        <div class="tile"><div class="tl">Closed but ineffective</div><div class="big ${ineffectiveCount > 0 ? "warn" : "ok"}">${ineffectiveCount}</div><div class="small">recurrence within ${windowDays} days of closure</div></div>
        <div class="tile"><div class="tl">Closed &amp; effective</div><div class="big ${effectivePct >= 70 ? "ok" : effectivePct >= 40 ? "warn" : "bad"}">${effectiveClosedCount} <span style="font-size:.55em;font-weight:600;">(${effectivePct}%)</span></div><div class="small">of ${closedCount} closed actions</div></div>
      </div>`;

    const tableRows = rows.map((r) => {
      const statusBadge = `<span class="badge ${r.status}">${r.status}</span>`;
      const flagBadges = [];
      if (r.isOverdue) flagBadges.push(`<span class="badge overdue">overdue ${r.daysPastDue}d</span>`);
      if (r.status === "open" && !r.isOverdue && r.daysPastDue > 0) flagBadges.push(`<span class="badge overdue" style="opacity:.55;">${r.daysPastDue}d past due (within grace)</span>`);
      if (r.status === "closed" && r.closedLate) flagBadges.push(`<span class="badge" style="background:var(--line);color:var(--ink-soft);">closed ${r.daysPastDue}d late</span>`);
      if (r.status === "closed") {
        if (r.ineffective) flagBadges.push(`<span class="badge ineffective">ineffective — recurred ${r.recurrenceDays}d later</span>`);
        else flagBadges.push(`<span class="badge effective">effective</span>`);
      }
      return `<tr>
        <td>${esc(r.id)}</td>
        <td>${esc(r.description)}<br><span style="color:var(--ink-soft);font-size:.76rem;">${esc(r.source)}</span></td>
        <td>${statusBadge}</td>
        <td class="num">${esc(r.dueDate)}</td>
        <td class="num">${r.daysOpen}${r.status === "open" ? " (ongoing)" : ""}</td>
        <td>${flagBadges.join(" ")}</td>
      </tr>`;
    }).join("");

    root.innerHTML = `
      <div class="banner"><strong>Teaching simulation.</strong> Every CAPA's dates and recurrences below are authored, illustrative data. "Overdue" and "closed but ineffective" are two plain date-arithmetic rules, evaluated live from the sliders — not a model's judgement.</div>
      <div class="context"><strong>${esc(sc.label)}.</strong> ${esc(sc.context)} <span style="color:var(--ink-soft);">Reference date: ${esc(sc.referenceDate)}.</span></div>
      ${tiles}
      <div class="card">
        <h2>Controls</h2>
        <div class="ctl"><div class="ch"><label class="field" style="margin:0;">Overdue grace period (days)</label><span class="cv" id="graceVal">${graceDays}</span></div>
          <input type="range" id="graceRange" min="${sc.overdueGraceDays.min}" max="${sc.overdueGraceDays.max}" step="1" value="${graceDays}"></div>
        <div class="ctl"><div class="ch"><label class="field" style="margin:0;">Recurrence window (days after closure)</label><span class="cv" id="windowVal">${windowDays}</span></div>
          <input type="range" id="windowRange" min="${sc.recurrenceWindowDays.min}" max="${sc.recurrenceWindowDays.max}" step="1" value="${windowDays}"></div>
      </div>
      <div class="card">
        <h2>CAPA register</h2>
        <div style="overflow-x:auto;">
        <table class="capas">
          <thead><tr><th>ID</th><th>Description</th><th>Status</th><th>Due</th><th>Days open</th><th>Flags</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        </div>
      </div>
      <div class="callouts">
        <div class="callout"><b>Why it matters —</b> ${esc(sc.callouts.scale)}</div>
        <div class="callout"><b>Just two rules —</b> ${esc(sc.callouts.twoRules)}</div>
        <div class="callout"><b>The window matters —</b> ${esc(sc.callouts.windowMatters)}</div>
        <div class="callout"><b>Still misses things —</b> ${esc(sc.callouts.stillMisses)}</div>
        <div class="callout"><b>Human call —</b> ${esc(sc.callouts.humanCall)}</div>
      </div>
      <details class="drawer"><summary>Facilitator notes</summary>
        <div class="dbody">
          <p><strong>What this is:</strong> ${esc(sc.notes.what)}</p>
          <p><strong>The maths:</strong> ${esc(sc.notes.math)}</p>
          <p><strong>What's real vs authored:</strong> ${esc(sc.notes.real)}</p>
        </div>
      </details>
    `;

    $("#graceRange").addEventListener("input", (e) => { STATE.graceDays = parseInt(e.target.value, 10); $("#graceVal").textContent = STATE.graceDays; render(); });
    $("#windowRange").addEventListener("input", (e) => { STATE.windowDays = parseInt(e.target.value, 10); $("#windowVal").textContent = STATE.windowDays; render(); });
  }

  function buildScenarioPicker() {
    const sel = $("#scenarioSelect");
    sel.innerHTML = scenarioList().map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("");
    sel.value = STATE.scenarioId;
    sel.addEventListener("change", (e) => {
      STATE.scenarioId = e.target.value;
      STATE.graceDays = null; STATE.windowDays = null;
      render();
    });
  }

  function applyTheme() {
    const root = document.documentElement;
    if (STATE.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", STATE.theme);
    $("#themeBtn").textContent = "Theme: " + STATE.theme;
  }
  function cycleTheme() {
    STATE.theme = STATE.theme === "system" ? "light" : STATE.theme === "light" ? "dark" : "system";
    try { localStorage.setItem("s17-theme", STATE.theme); } catch (e) {}
    applyTheme();
  }

  function init() {
    const list = scenarioList();
    STATE.scenarioId = list.length ? list[0].id : null;
    buildScenarioPicker();
    applyTheme();
    $("#themeBtn").addEventListener("click", cycleTheme);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
