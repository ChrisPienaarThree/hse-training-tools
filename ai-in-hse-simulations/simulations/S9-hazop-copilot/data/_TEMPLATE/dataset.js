/* ============================================================================
   S9 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   An AI-assisted HAZOP for one node. For each deviation (guide word +
   parameter), author what the "co-pilot" would suggest — causes,
   consequences, expected safeguards with a status — and what a real site
   team would add that a generic model could never know (a maintenance-log
   fact, an audit finding, a near-miss, an informal workaround).

   RULES
   - Everything is PRE-AUTHORED. No model runs.
   - Keep 4-6 deviations per node; 3-5 causes, 2-3 consequences, 2-3
     safeguards each reads cleanly on a projector.
   - safeguard `status`: "present-verified" | "present-unverified" | "missing".
   - Give AT LEAST ONE cause across the deviations a `reviewFlag: true` +
     `flagNote` — a plausible-sounding suggestion that does not actually fit
     THIS deviation. The team must accept or reject it before the deviation
     can be marked reviewed. This is the honesty check: even in a narrow,
     checkable answer space, verify before you accept.
   - `humanAdds` must be genuinely site-specific — a fact about THIS
     equipment's history, THIS site's audits, or THIS crew's behaviour. If it
     could apply to any similar site, it belongs in `aiCauses` instead.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S9 = window.HSE_S9 || { scenarios: {} };
window.HSE_S9.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  node: "TODO — the HAZOP node (equipment / line / area)",
  nodeContext: "TODO — one or two sentences: what this node is, its normal operating condition.",

  screenedOut: [
    { gw: "TODO guide word", param: "TODO parameter", reason: "TODO — why this combination is not credible for this node." }
  ],

  deviations: [
    {
      id: "dev-1", guideWord: "TODO e.g. No / Not", parameter: "TODO e.g. Flow", statement: "TODO — the deviation in plain English",
      aiCauses: [
        { text: "TODO plausible cause" },
        { text: "TODO plausible cause" },
        { text: "TODO a cause that DOESN'T actually fit this deviation", reviewFlag: true, flagNote: "TODO — why it's a plausible pattern-match but wrong here; the team should reject it." }
      ],
      aiConsequences: [
        { text: "TODO plausible consequence" },
        { text: "TODO plausible consequence" }
      ],
      aiSafeguards: [
        { text: "TODO safeguard that exists and is confirmed", status: "present-verified" },
        { text: "TODO safeguard that exists but isn't confirmed working", status: "present-unverified", note: "TODO why it's unverified" },
        { text: "TODO safeguard you'd expect but this design doesn't have", status: "missing", note: "TODO" }
      ],
      humanAdds: {
        causes: ["TODO — a fact from THIS site's maintenance log / audit / near-miss report."],
        safeguards: ["TODO — optional: a safeguard-verification catch specific to this site, or leave empty."],
        summary: "TODO — one line on why this could only come from the site team, not a generic model."
      }
    }
    /* ...4-6 deviations total... */
  ],

  callouts: {
    breadth: "TODO — the co-pilot's speed/coverage value.",
    localKnowledge: "TODO — every human addition traces to a site-specific record.",
    narrowSpace: "TODO — bounded answer space keeps hallucination risk low, but not zero (name the reviewFlag example).",
    verifyNotIdentify: "TODO — listing a safeguard isn't confirming it works.",
    stillNeedsTheRoom: "TODO — this speeds up the chair/scribe; it does not replace the workshop."
  },
  notes: {
    what: "For a chosen node and deviation, the co-pilot proposes causes, consequences and the safeguards you would typically expect — the same categories a HAZOP worksheet already uses.",
    credible: "Only credible guide-word / parameter combinations are worked through here; a couple of screened-out combinations are shown for contrast.",
    gate: "A deviation cannot be marked reviewed until every safeguard has a verified/actioned status, any flagged AI suggestion has been accepted or rejected, and the team has looked at what a site team caught.",
    real: "Authored: the deviation content — causes, consequences, safeguards, the site-specific catches. Live and real: your checklist state, your own added entries, the running worksheet and tallies."
  }
};
