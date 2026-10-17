/* ============================================================================
   S23 dataset — "manufacturing-hse-team"
   A closing-workshop wizard, not a model: pick a candidate AI use case (its
   baseline readiness scores are authored, illustrative starting points),
   then drag the five 0-100 dimension sliders yourself. app.js computes the
   overall readiness score, the readiness band, and a roadmap that is
   RE-ORDERED live — weakest dimension first — from the generic phase text
   in `dimensions` below. Nothing about the ordering or the score is
   pre-written per use case.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S23 = window.HSE_S23 || { scenarios: {} };
window.HSE_S23.scenarios["manufacturing-hse-team"] = {
  id: "manufacturing-hse-team",
  label: "Manufacturing HSE team",
  context: "Pick a candidate AI use case from this course, then score its readiness across five dimensions. The roadmap below reorders itself around whichever dimension is weakest — drag the sliders and watch it change.",
  /* Generic across every scenario in this sim — copy verbatim when adding a scenario. */
  dimensions: [
    { key: "dataQuality", label: "Data quality & availability", question: "Is there enough clean, representative, labelled historical data covering the failure modes you care about?", phase: "Start with a structured data audit: how much history exists, how representative it is of the failure modes you care about, and who owns cleaning it up. Nothing else in this roadmap is worth doing until this is credible." },
    { key: "governance", label: "Governance & accountability", question: "Is there a named owner, an incident/appeal process, and documented scope limits?", phase: "Name a single accountable owner and write down, in one page, what this system is and isn't allowed to decide, who can override it, and how someone raises a concern about it." },
    { key: "humanInLoop", label: "Human-in-the-loop design", question: "Is there a clear, trained, resourced role for a human reviewer before any AI output drives a decision?", phase: "Design and resource the specific human role that reviews this system's outputs before they become decisions — including what they're trained to look for and how much time they're actually given to do it." },
    { key: "successMetric", label: "Success metric definition", question: "Has anyone defined, in advance, what 'working' looks like — and what 'failing' looks like — in measurable terms?", phase: "Write down, before go-live, exactly what 'working' and 'failing' look like in numbers — not 'it seems to help', a specific measurable threshold everyone has agreed to in advance." },
    { key: "validationPlan", label: "Validation & monitoring plan", question: "Is there a plan to check performance before go-live, and monitor for drift after?", phase: "Define how you'll test this against a held-out, representative sample before go-live, and how you'll keep monitoring it — including a specific plan for what happens when performance drifts." }
  ],
  useCases: [
    { id: "ppe-detector", label: "PPE compliance detection (CV)", baseline: { dataQuality: 70, governance: 30, humanInLoop: 40, successMetric: 50, validationPlan: 35 }, note: "Camera footage is usually plentiful — the gap is almost always governance: who owns the alerts, and what happens to a worker who's flagged." },
    { id: "predictive-maintenance", label: "Predictive maintenance for critical equipment", baseline: { dataQuality: 55, governance: 60, humanInLoop: 65, successMetric: 70, validationPlan: 45 }, note: "Often the best-governed use case on the list — the gap is usually validation: has anyone actually tested it against a held-out failure history?" },
    { id: "nlp-coding", label: "NLP near-miss coding at volume", baseline: { dataQuality: 40, governance: 55, humanInLoop: 60, successMetric: 45, validationPlan: 50 }, note: "The data gap is usually the real story here — coding schemes drift, historical narratives are inconsistent, and 'volume' hides a lot of noise." },
    { id: "generative-docs", label: "Generative documentation drafting", baseline: { dataQuality: 75, governance: 35, humanInLoop: 30, successMetric: 40, validationPlan: 55 }, note: "Easy to pilot, easy to neglect the review gate — the gap is usually human-in-the-loop: who actually reads every draft before it goes out?" }
  ],
  bands: [
    { max: 40, label: "Not ready", detail: "Address fundamentals before piloting anything. A low overall score means more than one dimension needs real work, not just the weakest one." },
    { max: 70, label: "Pilot with guardrails", detail: "Proceed cautiously, starting with the weakest dimension below. A limited pilot with a named owner and a human reviewer can go ahead while the gaps are closed." },
    { max: 101, label: "Ready to pilot with standard governance", detail: "The fundamentals are in reasonable shape. Standard governance and monitoring should be enough — this doesn't mean skip them." }
  ],
  callouts: {
    scale: "Every use case in this course could plausibly be piloted somewhere in this room by the end of the year. The question this tool asks isn't 'is the technology good enough' — it's 'are we ready', which is a different, and usually more honest, question.",
    reorders: "Change which use case is selected, or just drag a slider, and watch the roadmap's phase order change with it. The weakest dimension is always Phase 1 — the generator doesn't know which use case you picked, only which number is lowest.",
    notOmniscient: "These are five dimensions someone chose because they come up constantly in AI-adoption failures. A real readiness assessment for your organisation might need a sixth, or might weight these five differently — treat this as a starting checklist, not a certified instrument.",
    stillMisses: "A high score on every slider does not mean the deployment will succeed — it means the obvious failure modes have been thought about in advance. Sliders are self-assessed; an honest 30 is far more useful than an optimistic 80.",
    humanCall: "The roadmap orders the work — it doesn't do it. Someone still has to actually run the data audit, write the one-page governance note, or define the success metric. The tool's job is to make sure the right thing gets done first."
  },
  notes: {
    what: "Pick a candidate AI use case (its baseline dimension scores are authored, illustrative starting points), then adjust five 0-100 readiness sliders. A roadmap re-orders live, weakest dimension first, using generic phase text shared across every use case.",
    math: "Overall readiness = mean of the five dimension scores. Band = the first authored band whose `max` exceeds the overall score. Roadmap order = the five dimensions sorted ascending by current score — a live sort, not a per-use-case script.",
    real: "Authored: the five dimensions' generic phase text, each use case's baseline scores and note, and the band thresholds/text. Live and real: the current dimension scores (baseline or dragged), the overall readiness average, the band it falls into, and the roadmap's phase order."
  }
};
