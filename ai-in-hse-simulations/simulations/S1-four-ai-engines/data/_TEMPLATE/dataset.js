/* ============================================================================
   S1 dataset TEMPLATE  —  copy this folder to data/<your-scenario-id>/

   RULES
   - Every value is PRE-AUTHORED. Nothing here runs a model. Write numbers that
     are realistic and internally consistent; their job is to show mechanism and
     failure modes, not to be a benchmark.
   - Label any external figure as "(independent)" or "(vendor-reported)".
   - conditions[0] / outputs[0] / states[0] are the "best case / as-shipped"
     state. Later entries get progressively worse or add a planted defect.
   - Keep the object shape below EXACTLY. The app reads these keys by name.

   AFTER FILLING IN:
   1. add  <script src="data/<your-id>/dataset.js"></script>  to index.html
   2. add  { id: "<your-id>", label: "..." }  to data/manifest.js
   ============================================================================ */
window.HSE_S1 = window.HSE_S1 || { scenarios: {} };
window.HSE_S1.scenarios["TEMPLATE-ID"] = {

  id: "TEMPLATE-ID",
  label: "TODO — short label shown in the scenario picker",

  situation: {
    headline: "TODO — one sentence: what nearly happened.",
    facts: [
      "TODO — bullet fact (where, when, who).",
      "TODO — bullet fact (equipment / conditions).",
      "TODO — bullet fact (context: pressure, training, housekeeping...)."
    ]
  },

  /* -------- VISION ------------------------------------------------------- */
  vision: {
    engine: "Computer vision — <what it detects> on <what feed>",
    sceneImage: "scene.svg",              // sits next to this file
    sceneCaption: "Synthetic still (illustration, not a photo).",
    dayMap: "Day 1 Topic 2 · Day 2 Topic 4",
    conditions: [
      {
        name: "Good — matches training site",
        // box: [x%, y%, width%, height%] over the scene image
        detections: [
          { label: "person", conf: 0.95, box: [45, 25, 12, 34] },
          { label: "TODO hazard state", conf: 0.65, box: [40, 20, 18, 42], alert: true }
        ],
        matrix: { tp: 0, fp: 0, fn: 0, tn: 0 },   // for the headline alert, on a labelled set
        alertFatigueNote: "TODO — what the false-alarm rate does to the desk."
      },
      { name: "Fair — TODO", detections: [], matrix: { tp: 0, fp: 0, fn: 0, tn: 0 }, alertFatigueNote: "TODO" },
      { name: "Poor — TODO", detections: [], matrix: { tp: 0, fp: 0, fn: 0, tn: 0 }, alertFatigueNote: "TODO" },
      { name: "Very poor — different site / not in training set", detections: [], matrix: { tp: 0, fp: 0, fn: 0, tn: 0 }, alertFatigueNote: "TODO" }
    ],
    validation: {
      method: "TODO — confusion matrix on a site-specific labelled set; report precision / recall / false-alarm rate.",
      independentNote: "TODO — (independent) finding, if any.",
      humanRole: "TODO — who acts on alerts and re-labels."
    },
    failure: "TODO — one line: how it fails in the field."
  },

  /* -------- PREDICTIVE ------------------------------------------------------- */
  predictive: {
    engine: "Predictive model — logistic-regression-style risk score",
    dayMap: "Day 1 Topic 2b · Day 2 Topic 3",
    target: "P(<event> at <scope> in the next <window>)",
    features: [
      { name: "TODO leading indicator", value: "TODO", contribution: 0.30 },   // contribution = log-odds weight, +/-
      { name: "TODO leading indicator", value: "TODO", contribution: -0.10 }
    ],
    states: [
      { name: "As reported", probability: 0.00, band: "TODO", note: "TODO — baseline, name the top drivers." },
      { name: "If under-reported", probability: 0.00, band: "TODO", note: "TODO — score drops, risk does not." },
      { name: "After a site change (drift)", probability: 0.00, band: "TODO (stated)", note: "TODO — observed now exceeds predicted; AUD decayed; needs retrain." }
    ],
    validation: {
      method: "TODO — backtest AUC + calibration on the org's own history.",
      independentNote: "TODO — (independent) caveat about unvalidated predictive-safety claims.",
      humanRole: "TODO — read drivers, own the retrain trigger."
    },
    failure: "TODO — under-reporting + silent drift + not portable."
  },

  /* -------- NLP ------------------------------------------------------- */
  nlp: {
    engine: "NLP classifier — auto-codes a free-text incident narrative",
    dayMap: "Day 1 Topic 2 · Day 3 Topic 1",
    narratives: {
      clean: "TODO — the incident written up properly.",
      poor: "TODO — the SAME incident, terse / second-language / rushed."
    },
    codes: [
      { field: "Event type",          clean: { value: "TODO", conf: 0.88 }, poor: { value: "TODO", conf: 0.70 } },
      { field: "Actual vs near-miss", clean: { value: "TODO", conf: 0.93 }, poor: { value: "TODO", conf: 0.85 } },
      { field: "Primary source",      clean: { value: "TODO", conf: 0.90 }, poor: { value: "TODO", conf: 0.78 } },
      { field: "Secondary source",    clean: { value: "TODO", conf: 0.66 }, poor: { value: "TODO", conf: 0.55, miscode: true } }
    ],
    contributingTags: ["TODO", "TODO"],
    lowConfidenceThreshold: 0.70,
    validation: {
      method: "TODO — per-class P/R vs expert coders; route sub-threshold fields to a human.",
      independentNote: "NIOSH / BLS injury-narrative auto-coding (independent): ~82% → ~90% agreement with expert coders as the labelled set grew.",
      humanRole: "TODO — code the low-confidence fields; watch for vivid-word bias."
    },
    failure: "TODO — output quality tracks input quality; second-language penalty."
  },

  /* -------- GENERATIVE ------------------------------------------------------- */
  generative: {
    engine: "Generative model (LLM) — drafts safety communications",
    dayMap: "Day 1 Topic 2a · Day 4 Topic 1 & 6",
    prompt: "TODO — the exact prompt, including a 'do not cite rules I did not give you' instruction.",
    outputs: [
      { temperature: "Low — sticks close to the facts",
        body: ["TODO — a genuinely good, grounded draft, one string per paragraph / talking point."],
        issues: [] },
      { temperature: "Medium — smoother, drifting",
        body: ["TODO — mostly fine draft with 1–2 planted defects."],
        issues: [
          { text: "EXACT substring from body above", tag: "Unsourced statistic", why: "TODO" }
        ] },
      { temperature: "High — confident and inventing",
        body: ["TODO — fluent draft riddled with invention."],
        issues: [
          { text: "EXACT substring", tag: "Fabricated citation", why: "TODO" },
          { text: "EXACT substring", tag: "Assumed fact / outcome", why: "TODO" }
        ] }
    ],
    hallucinationRate: "Independent testing: ~3–5% of factual claims confidently wrong for mainstream content, up to ~27% for niche topics.",
    reviewChecklist: [
      "Every factual claim traces back to the input I provided.",
      "No regulation, standard or statistic is cited that I did not supply.",
      "No outcome, cause or blame is asserted that was not in the facts.",
      "Tone is instructive and non-punitive, and the one action is doable today."
    ],
    validation: {
      method: "No single accuracy score — validation IS the review checklist plus a named sign-off. Low temperature + grounding reduce, not remove, invention.",
      independentNote: "Systematic reviews: generative-AI safety tools are almost never evaluated on real-world outcomes.",
      humanRole: "Author of record — verify every line, your name on it."
    },
    failure: "TODO — fluent fabrication in the same voice as the correct parts."
  },

  /* -------- SYNTHESIS TABLE (bottom of the page) --------------------------- */
  synthesis: {
    rows: [
      ["Input",         "Pixels / video frames",          "Structured site metrics",        "Free-text narrative",              "A prompt + the facts"],
      ["Output",        "Boxes + class + confidence",      "One probability + a band",       "Field codes + confidence",         "Drafted prose"],
      ["Validate with", "Confusion matrix, P/R, false-alarm rate, on YOUR site's labelled set", "Backtest AUC + calibration on YOUR history", "Per-class P/R vs expert coders; review low-confidence", "Human review checklist — no single accuracy number"],
      ["Main failure",  "False alarms → alert fatigue; drift", "Under-reporting; silent drift", "Degrades on poor / translated text", "Confident fabrication"],
      ["Human's job",   "Act on / dismiss alerts; re-label", "Read drivers; own retrain",     "Code low-confidence fields",       "Verify every claim; sign off"],
      ["Day 1 topic",   "Topic 2 — computer vision",       "Topic 2b — predictive models",   "Topic 2 — NLP",                    "Topic 2a — how LLMs generate text"]
    ]
  }
};
