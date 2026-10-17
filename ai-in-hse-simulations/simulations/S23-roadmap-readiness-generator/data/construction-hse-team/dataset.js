/* ============================================================================
   S23 dataset — "construction-hse-team"
   Same wizard as manufacturing-hse-team, four different candidate use cases.
   `dimensions` copied verbatim per the sharing rule in the sibling dataset.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S23 = window.HSE_S23 || { scenarios: {} };
window.HSE_S23.scenarios["construction-hse-team"] = {
  id: "construction-hse-team",
  label: "Construction HSE team",
  context: "Pick a candidate AI use case from this course, then score its readiness across five dimensions. The roadmap below reorders itself around whichever dimension is weakest — drag the sliders and watch it change.",
  /* Generic across every scenario in this sim — copied verbatim from manufacturing-hse-team. */
  dimensions: [
    { key: "dataQuality", label: "Data quality & availability", question: "Is there enough clean, representative, labelled historical data covering the failure modes you care about?", phase: "Start with a structured data audit: how much history exists, how representative it is of the failure modes you care about, and who owns cleaning it up. Nothing else in this roadmap is worth doing until this is credible." },
    { key: "governance", label: "Governance & accountability", question: "Is there a named owner, an incident/appeal process, and documented scope limits?", phase: "Name a single accountable owner and write down, in one page, what this system is and isn't allowed to decide, who can override it, and how someone raises a concern about it." },
    { key: "humanInLoop", label: "Human-in-the-loop design", question: "Is there a clear, trained, resourced role for a human reviewer before any AI output drives a decision?", phase: "Design and resource the specific human role that reviews this system's outputs before they become decisions — including what they're trained to look for and how much time they're actually given to do it." },
    { key: "successMetric", label: "Success metric definition", question: "Has anyone defined, in advance, what 'working' looks like — and what 'failing' looks like — in measurable terms?", phase: "Write down, before go-live, exactly what 'working' and 'failing' look like in numbers — not 'it seems to help', a specific measurable threshold everyone has agreed to in advance." },
    { key: "validationPlan", label: "Validation & monitoring plan", question: "Is there a plan to check performance before go-live, and monitor for drift after?", phase: "Define how you'll test this against a held-out, representative sample before go-live, and how you'll keep monitoring it — including a specific plan for what happens when performance drifts." }
  ],
  useCases: [
    { id: "hardhat-detector", label: "Hard-hat / PPE compliance detection (CV)", baseline: { dataQuality: 65, governance: 25, humanInLoop: 35, successMetric: 45, validationPlan: 30 }, note: "Site camera footage piles up fast on a live job — the gap is almost always governance: who owns an alert on a subcontractor's crew, and what happens to a worker who's flagged." },
    { id: "plant-failure-risk", label: "Predictive plant/equipment failure risk", baseline: { dataQuality: 50, governance: 55, humanInLoop: 60, successMetric: 65, validationPlan: 40 }, note: "Telemetry from hired plant is often patchy across different fleets and operators — the gap is usually validation: has this actually been checked against a held-out breakdown history on this site's own equipment mix?" },
    { id: "permit-crosscheck", label: "Permit-to-work / SIMOPs cross-check", baseline: { dataQuality: 60, governance: 45, humanInLoop: 70, successMetric: 55, validationPlan: 35 }, note: "Human-in-the-loop is usually decent here because a permit officer already signs off everything — the real gap is a validation plan: nobody has measured how often the cross-check actually catches a real conflict versus how often it's ignored." },
    { id: "induction-drafting", label: "Generative site-induction / toolbox-talk drafting", baseline: { dataQuality: 70, governance: 30, humanInLoop: 25, successMetric: 35, validationPlan: 45 }, note: "Easy to pilot on one site office laptop and easy to neglect the review gate — the gap is usually human-in-the-loop: who actually reads every drafted toolbox talk before it's read out to a crew?" }
  ],
  bands: [
    { max: 40, label: "Not ready", detail: "Address fundamentals before piloting anything. A low overall score means more than one dimension needs real work, not just the weakest one." },
    { max: 70, label: "Pilot with guardrails", detail: "Proceed cautiously, starting with the weakest dimension below. A limited pilot with a named owner and a human reviewer can go ahead while the gaps are closed." },
    { max: 101, label: "Ready to pilot with standard governance", detail: "The fundamentals are in reasonable shape. Standard governance and monitoring should be enough — this doesn't mean skip them." }
  ],
  callouts: {
    scale: "Every use case in this course could plausibly be piloted somewhere on this site by the end of the year. The question this tool asks isn't 'is the technology good enough' — it's 'are we ready', which is a different, and usually more honest, question.",
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
