/* ============================================================================
   S3 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   The idea: ONE question about a specific standard / procedure, answered two
   ways by the same (notional) model at the same temperature —
     (a) UNGROUNDED: no source text in the prompt, answering "from memory";
     (b) GROUNDED:   the actual extract pasted in, told to answer only from it.
   The demo tallies each answer claim-by-claim and shows how much reviewer
   effort each one really needs. (Day 1 T2a; also Day 3 T2, Day 4 T1/T6.)

   RULES
   - Everything is PRE-AUTHORED. No model runs.
   - Write a real-sounding but FICTIONAL source so nobody memorises a fake
     real-world figure. Put "[FICTIONAL ...]" in the title.
   - Each claim is one object: { text, cite, verdict, note }.
       cite    = 1-based paragraph number in source.paragraphs, or null
       verdict = one of:
         "supported"    backed by the cited paragraph                (green)
         "partly"       half right, half invented                    (amber)
         "unsupported"  no basis; invented detail                    (red)
         "contradicts"  the source says otherwise                    (red)
         "fabricated"   invented citation / clause / standard ref    (red)
         "hedge"        (grounded, good) "the source doesn't cover X" (blue)
         "gap"          (grounded, good) "outside the supplied text"  (blue)
         "inference"    (grounded) reasoned beyond the text, flagged (purple)
   - Ungrounded "Common topic" variant should be MOSTLY right with 1–2 planted
     errors — the lesson is "you can't tell which lines are the wrong ones".
     The "Niche" variant should be badly wrong.
   - Grounded "full" should be almost all "supported" + 1 "inference" + 1–2
     "hedge". Grounded "snippet" answers only from source.paragraphs[0 ..
     snippetParas-1] and uses "gap" for the rest.

   AFTER FILLING IN
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S3 = window.HSE_S3 || { scenarios: {} };
window.HSE_S3.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — short label for the scenario picker",

  question: "TODO — one specific question about a standard/procedure (asks for a number, an order, a duration, a role...).",

  source: {
    title: "TODO — Standard / Procedure name + [FICTIONAL, for demonstration only]",
    paragraphs: [
      "TODO ¶1 — scope / what this text does and does not cover.",
      "TODO ¶2 — a clause that answers part of the question.",
      "TODO ¶3 — another clause (acceptance criteria / numbers).",
      "TODO ¶4 — a clause the 'snippet' mode will withhold.",
      "TODO ¶5 — a boundary clause ('see Section X, not reproduced')."
    ],
    snippetParas: 3   /* "Snippet only" mode supplies paragraphs 1..snippetParas */
  },

  ungrounded: {
    baseRate: ["~3–5% of claims (mainstream topic)", "~10–15% of claims", "up to ~27% of claims (niche topic)"],
    variants: [
      { familiarity: "Common topic — TODO",
        claims: [
          { text: "TODO — a claim that is actually correct.", cite: null, verdict: "supported", note: "TODO — note that you can't tell it's right without a source." },
          { text: "TODO — a claim with an invented clause number.", cite: null, verdict: "fabricated", note: "TODO" },
          { text: "TODO — an invented specific (interval, credential...).", cite: null, verdict: "unsupported", note: "TODO" }
        ] },
      { familiarity: "Less common — TODO",
        claims: [
          { text: "TODO", cite: null, verdict: "contradicts", note: "TODO" },
          { text: "TODO", cite: null, verdict: "partly", note: "TODO" }
        ] },
      { familiarity: "Niche / obscure — TODO",
        claims: [
          { text: "TODO — badly wrong claim.", cite: null, verdict: "contradicts", note: "TODO" },
          { text: "TODO — fabricated annex / exemption.", cite: null, verdict: "fabricated", note: "TODO" }
        ] }
    ]
  },

  grounded: {
    full: [
      { text: "TODO — claim quoted from ¶2.", cite: 2, verdict: "supported", note: "TODO" },
      { text: "TODO — claim quoted from ¶3.", cite: 3, verdict: "supported", note: "TODO" },
      { text: "TODO — the model correctly declines to invent a detail.", cite: 4, verdict: "hedge", note: "TODO" },
      { text: "TODO — a reasonable inference beyond the text, flagged.", cite: 2, verdict: "inference", note: "TODO — a human should confirm." }
    ],
    snippet: [
      { text: "TODO — claim from ¶2 (in the snippet).", cite: 2, verdict: "supported", note: "TODO" },
      { text: "TODO — the model says the rest is outside the supplied text.", cite: null, verdict: "gap", note: "TODO — retrieval was incomplete; the model says so." }
    ]
  },

  notes: {
    grounding: "TODO — grounding = the real text in the prompt + 'answer only from it'; same model, only the source differs.",
    verifiableFormat: "TODO — one claim per line, each tagged with its clause, explicit 'not in the source' where true.",
    reviewGate: "TODO — ungrounded needs every line checked against a doc the model never had; grounded needs only its inference lines confirmed.",
    hallucination: "Independent estimates: ~3–5% of claims wrong on mainstream topics, up to ~27% on niche ones; these examples concentrate the failures on purpose; wrong lines are never flagged by the model."
  }
};
