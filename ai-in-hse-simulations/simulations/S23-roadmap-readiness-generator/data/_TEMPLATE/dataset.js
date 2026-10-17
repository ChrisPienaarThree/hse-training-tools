/* ============================================================================
   S23 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js computes, live: overall readiness = mean of the 5 current dimension
   scores (baseline or dragged), the band from `bands`, and a roadmap that
   sorts the 5 dimensions ascending by current score (weakest first), using
   each dimension's own generic `phase` text. Nothing about the score, band
   or roadmap order is authored — only `dimensions`, `useCases`, `bands`,
   `callouts` and `notes` are.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S23 = window.HSE_S23 || { scenarios: {} };
window.HSE_S23.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — one or two sentences framing who is doing this exercise and why.",
  /* Keep these 5 keys and their `phase` text IDENTICAL across every scenario in this sim —
     app.js reads them by name and the roadmap phase text is meant to be generic, not
     use-case-specific. Copy this array verbatim from an existing scenario. */
  dimensions: [
    { key: "dataQuality", label: "Data quality & availability", question: "Is there enough clean, representative, labelled historical data covering the failure modes you care about?", phase: "Start with a structured data audit: how much history exists, how representative it is of the failure modes you care about, and who owns cleaning it up. Nothing else in this roadmap is worth doing until this is credible." },
    { key: "governance", label: "Governance & accountability", question: "Is there a named owner, an incident/appeal process, and documented scope limits?", phase: "Name a single accountable owner and write down, in one page, what this system is and isn't allowed to decide, who can override it, and how someone raises a concern about it." },
    { key: "humanInLoop", label: "Human-in-the-loop design", question: "Is there a clear, trained, resourced role for a human reviewer before any AI output drives a decision?", phase: "Design and resource the specific human role that reviews this system's outputs before they become decisions — including what they're trained to look for and how much time they're actually given to do it." },
    { key: "successMetric", label: "Success metric definition", question: "Has anyone defined, in advance, what 'working' looks like — and what 'failing' looks like — in measurable terms?", phase: "Write down, before go-live, exactly what 'working' and 'failing' look like in numbers — not 'it seems to help', a specific measurable threshold everyone has agreed to in advance." },
    { key: "validationPlan", label: "Validation & monitoring plan", question: "Is there a plan to check performance before go-live, and monitor for drift after?", phase: "Define how you'll test this against a held-out, representative sample before go-live, and how you'll keep monitoring it — including a specific plan for what happens when performance drifts." }
  ],
  /* 3-5 candidate AI use cases relevant to this audience. Each baseline is a starting point the
     sliders begin at — spread the five scores out per use case (don't make every use case
     uniformly strong or weak, or the "roadmap reorders around the weakest" point is invisible). */
  useCases: [
    { id: "TODO-1", label: "TODO", baseline: { dataQuality: 60, governance: 40, humanInLoop: 50, successMetric: 50, validationPlan: 40 }, note: "TODO — one sentence naming this use case's typical weak spot and why." },
    { id: "TODO-2", label: "TODO", baseline: { dataQuality: 50, governance: 55, humanInLoop: 60, successMetric: 60, validationPlan: 45 }, note: "TODO" }
    /* 3-5 total. */
  ],
  /* Keep thresholds consistent with other scenarios in this sim for cross-scenario comparability
     unless you have a specific reason to diverge. */
  bands: [
    { max: 40, label: "Not ready", detail: "TODO" },
    { max: 70, label: "Pilot with guardrails", detail: "TODO" },
    { max: 101, label: "Ready to pilot with standard governance", detail: "TODO" }
  ],
  callouts: {
    scale: "TODO",
    reorders: "TODO — usually fine to copy verbatim, it describes the mechanism not the scenario.",
    notOmniscient: "TODO",
    stillMisses: "TODO",
    humanCall: "TODO"
  },
  notes: {
    what: "TODO",
    math: "Overall readiness = mean of the five dimension scores. Band = the first authored band whose `max` exceeds the overall score. Roadmap order = the five dimensions sorted ascending by current score — a live sort, not a per-use-case script.",
    real: "Authored: the five dimensions' generic phase text, each use case's baseline scores and note, and the band thresholds/text. Live and real: the current dimension scores (baseline or dragged), the overall readiness average, the band it falls into, and the roadmap's phase order."
  }
};
