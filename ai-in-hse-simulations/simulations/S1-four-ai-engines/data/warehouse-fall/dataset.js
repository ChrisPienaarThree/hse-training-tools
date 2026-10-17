/* ============================================================================
   S1 dataset — "warehouse-fall"
   Fall from height near-miss in a high-bay distribution centre.

   Every value below is PRE-AUTHORED for teaching. No model runs. The numbers
   are realistic and internally consistent, chosen to show how each of the four
   AI families produces output, how you would validate it, and how it fails.

   Shape of this object is documented in ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S1 = window.HSE_S1 || { scenarios: {} };
window.HSE_S1.scenarios["warehouse-fall"] = {

  id: "warehouse-fall",
  label: "Warehouse — fall from height (near-miss)",

  /* The single situation, described once, then fed to all four engines. */
  situation: {
    headline: "Picker over-reached from a leaning ladder at 4.1 m — lost balance, grabbed a beam, dropped the carton. No injury.",
    facts: [
      "Site DC-3 high-bay, aisle 14, 07:20, early shift.",
      "Task: retrieve one slow-moving carton stored at 4.1 m.",
      "The MEWP (order-picker) was in use two aisles away, so the picker used a leaning warehouse ladder against the racking.",
      "Picker is 3 weeks into the role. Pick-rate target was running at 108% of plan.",
      "Shrink-wrap offcuts were on the floor at the foot of the ladder.",
      "A second worker walked past ~2 m away as the carton fell. Not struck."
    ]
  },

  /* ---------------------------------------------------------------- VISION -- */
  vision: {
    engine: "Computer vision — object / state detection on CCTV frames",
    sceneImage: "scene.svg",
    sceneCaption: "Synthetic still from a fixed aisle camera (illustration, not a photo).",
    dayMap: "Day 1 Topic 2 (computer vision) · Day 2 Topic 4 (CV for hazard detection)",

    /* conditions[0] is the 'as shipped by the vendor demo' state.
       Higher index = worse image / less like the training data. */
    conditions: [
      {
        name: "Good — bright, clear, camera matches training site",
        detections: [
          { label: "person", conf: 0.97, box: [46, 22, 12, 34] },
          { label: "ladder", conf: 0.93, box: [40, 30, 20, 52] },
          { label: "no fall protection (person + elevation + no harness)", conf: 0.68, box: [44, 20, 16, 40], alert: true },
          { label: "ladder at unsafe angle", conf: 0.55, box: [39, 40, 22, 42], alert: true },
          { label: "floor obstruction at ladder foot", conf: 0.61, box: [38, 78, 16, 12] },
          { label: "person in fall / drop zone", conf: 0.74, box: [64, 46, 12, 34], alert: true }
        ],
        /* Confusion matrix for the headline alert: "unsafe work at height".
           Measured on a 250-frame hand-labelled validation clip from THIS site. */
        matrix: { tp: 38, fp: 11, fn: 9, tn: 192 },
        alertFatigueNote: "≈ 1 false alert per camera per 3 h at this false-alarm rate. Supervisors start dismissing without looking after a shift or two."
      },
      {
        name: "Fair — some backlight from the aisle-end window",
        detections: [
          { label: "person", conf: 0.91, box: [46, 22, 12, 34] },
          { label: "ladder", conf: 0.86, box: [40, 30, 20, 52] },
          { label: "no fall protection", conf: 0.58, box: [44, 20, 16, 40], alert: true },
          { label: "ladder at unsafe angle", conf: 0.44, box: [39, 40, 22, 42] },
          { label: "floor obstruction at ladder foot", conf: 0.42, box: [38, 78, 16, 12] },
          { label: "person in fall / drop zone", conf: 0.63, box: [64, 46, 12, 34], alert: true }
        ],
        matrix: { tp: 35, fp: 18, fn: 12, tn: 185 },
        alertFatigueNote: "False alerts up ~60%. Trust drops faster than the miss rate."
      },
      {
        name: "Poor — low light + motion blur (worker moving fast)",
        detections: [
          { label: "person", conf: 0.79, box: [46, 22, 12, 34] },
          { label: "ladder", conf: 0.61, box: [40, 30, 20, 52] },
          { label: "no fall protection", conf: 0.39, box: [44, 20, 16, 40] },
          { label: "pallet (false positive — it is the dropped carton)", conf: 0.52, box: [55, 80, 10, 9], falsePositive: true },
          { label: "person in fall / drop zone", conf: 0.41, box: [64, 46, 12, 34] }
        ],
        matrix: { tp: 27, fp: 29, fn: 20, tn: 174 },
        alertFatigueNote: "Recall now ~0.57 — it misses 4 in 10 real events — while flooding the desk with false ones. Worst of both."
      },
      {
        name: "Very poor — different site, racking layout not in training set",
        detections: [
          { label: "person", conf: 0.72, box: [46, 22, 12, 34] },
          { label: "racking (mislabelled as scaffold)", conf: 0.48, box: [10, 10, 80, 80], falsePositive: true },
          { label: "no fall protection", conf: 0.31, box: [44, 20, 16, 40] }
        ],
        matrix: { tp: 19, fp: 41, fn: 28, tn: 162 },
        alertFatigueNote: "The model was never validated here. This is what 'we rolled the pilot out to all sites' looks like."
      }
    ],

    validation: {
      method: "Confusion matrix on a site-specific, hand-labelled frame set. Report precision, recall and the false-alarm rate — never a single 'accuracy' number, because 'no hazard' frames vastly outnumber hazard frames.",
      independentNote: "Independent field studies of PPE-detection CV report usable precision only after a site-specific tuning pass; out-of-the-box models drop sharply on a new site.",
      humanRole: "Someone still decides what to do with each alert, and the label set has to be refreshed when the site changes."
    },
    failure: "False alarms drive alert fatigue; accuracy quietly decays ('drift') whenever lighting, layout, camera or PPE style changes. A demo reel proves nothing about your site."
  },

  /* ------------------------------------------------------------ PREDICTIVE -- */
  predictive: {
    engine: "Predictive model — logistic-regression-style risk score",
    dayMap: "Day 1 Topic 2b (predictive models) · Day 2 Topic 3 (predictive analytics)",
    target: "P(recordable fall event at this workface in the next 30 days)",

    features: [
      { name: "Near-miss reports (this aisle/shift, 30 d)", value: "4", contribution: 0.22 },
      { name: "Overdue corrective actions", value: "22%", contribution: 0.31 },
      { name: "Work-at-height permits (30 d)", value: "17", contribution: 0.09 },
      { name: "Induction completion", value: "91%", contribution: -0.11 },
      { name: "Average crew tenure", value: "6 months", contribution: 0.42 },
      { name: "Pick rate vs target", value: "108%", contribution: 0.27 },
      { name: "Housekeeping audit score", value: "2.6 / 5", contribution: 0.38 }
    ],

    /* states[0] = as reported. The others are what the demo toggles show. */
    states: [
      { name: "As reported", probability: 0.29, band: "Elevated",
        note: "Baseline. Drivers: short crew tenure, poor housekeeping, overdue actions, rate pressure." },
      { name: "If near-misses are under-reported (1 logged, 4 real)", probability: 0.19, band: "Moderate",
        note: "The score fell — but the risk did not. A model is only as honest as the reporting culture feeding it." },
      { name: "4 months after a new racking + WMS rollout (drift)", probability: 0.29, band: "Elevated (stated)",
        note: "Stated score unchanged, but observed events now run above predicted. Backtest AUC has decayed 0.74 → 0.63. It needs retraining, and nothing in the dashboard tells you that." }
    ],

    validation: {
      method: "Backtest on 18 months of THIS operator's own history: AUC 0.74. Calibration check — in the 0.25–0.35 predicted band, the observed event rate was 0.31 (roughly calibrated).",
      independentNote: "A 2021 systematic review of 1,200+ safety-prediction studies found only two that measured whether the prediction changed a real-world outcome. Treat any vendor accuracy claim as unproven on your data until you backtest it.",
      humanRole: "Read the driver bar chart, not just the number. Sense-check it against what the front line already knows, and own the retraining trigger."
    },
    failure: "Garbage in: if hazards are not reported, the score reads falsely low. Silent drift: the score keeps looking confident long after it stopped being right. Not portable between sites or contractors."
  },

  /* -------------------------------------------------------------------- NLP -- */
  nlp: {
    engine: "NLP classifier — auto-codes a free-text incident narrative",
    dayMap: "Day 1 Topic 2 (NLP) · Day 3 Topic 1 (incident & near-miss analysis)",

    narratives: {
      clean: "Picker was retrieving a carton from level 3 in aisle 14. The MEWP was in use in aisle 9, so he used a warehouse step ladder leaning against the rack. As he reached across he lost balance, grabbed the beam and dropped the carton to the floor. A colleague was walking past about 2 m away but was not struck. No injury. The foot of the ladder was standing on loose shrink-wrap.",
      poor: "Man take box level 3 aisle 14. No machine so use ladder on rack. He over-reach, slip, catch beam, box fall down. Other guy near 2 meter no hit. No hurt. Ladder on plastic wrap floor."
    },

    /* codes[i].clean vs codes[i].poor — same incident, two write-ups. */
    codes: [
      { field: "Event type",            clean: { value: "Fall to lower level — from ladder", conf: 0.88 }, poor: { value: "Fall to lower level (unspecified)", conf: 0.71 } },
      { field: "Actual vs near-miss",   clean: { value: "Near-miss — no injury", conf: 0.93 },            poor: { value: "Near-miss — no injury", conf: 0.87 } },
      { field: "Primary source",        clean: { value: "Ladder", conf: 0.90 },                            poor: { value: "Ladder", conf: 0.79 } },
      { field: "Secondary source",      clean: { value: "Floor / walking surface — debris", conf: 0.66 }, poor: { value: "Struck by falling object", conf: 0.58, miscode: true } },
      { field: "Body part",             clean: { value: "Not applicable — no injury", conf: 0.71 },       poor: { value: "Not applicable — no injury", conf: 0.55 } },
      { field: "Task at time",          clean: { value: "Manual order picking / stock retrieval", conf: 0.84 }, poor: { value: "Manual handling — general", conf: 0.62 } }
    ],
    contributingTags: ["work at height without fall protection", "access equipment unavailable", "housekeeping", "reach beyond safe limit", "time / rate pressure"],
    lowConfidenceThreshold: 0.70,

    validation: {
      method: "Per-class precision / recall against a set of narratives coded by expert humans. Route every field below the confidence threshold to a human coder.",
      independentNote: "NIOSH / BLS auto-coding of injury narratives (independent, published): agreement with expert coders rose from ~82% to ~90% as the labelled training set grew. It standardises coding at volume; it does not judge.",
      humanRole: "Code the low-confidence fields. Watch for the model over-weighting vivid words ('box fall down') over the real mechanism."
    },
    failure: "Output quality tracks input quality. Terse, translated or inconsistent narratives lose confidence and get miscoded — a fairness problem when your workforce writes in a second language."
  },

  /* ------------------------------------------------------------- GENERATIVE -- */
  generative: {
    engine: "Generative model (LLM) — drafts safety communications",
    dayMap: "Day 1 Topic 2a (how LLMs generate text) · Day 4 Topic 1 & 6 (GenAI for documentation, prompting)",

    prompt: "Draft a 5-minute toolbox talk for the DC-3 pick team based on this near-miss. Plain language, 4–6 talking points, one clear action. Do NOT cite specific regulation numbers unless they appear in the facts I gave you.",

    /* outputs[0] = low temperature / grounded. Each later output adds a planted
       defect the reviewer is supposed to catch. `issues` marks the spans. */
    outputs: [
      {
        temperature: "Low — sticks close to the facts",
        body: [
          "WHAT HAPPENED: Yesterday in aisle 14 a team-mate went up a leaning ladder to reach a carton at about 4 m because the picker was busy elsewhere. He over-reached, lost balance, caught a beam and dropped the carton. Someone was walking past underneath. Nobody was hurt — this time.",
          "WHY IT MATTERS: A fall from that height is a life-changing injury, and there was a person in the drop zone.",
          "TALKING POINT 1: If the picker is not available, we wait for it or we call a supervisor. We do not substitute a leaning ladder.",
          "TALKING POINT 2: Never reach sideways off a ladder. If you have to lean, come down and move it.",
          "TALKING POINT 3: Keep the base of any ladder on clear floor — no wrap, no strapping, no pallet debris.",
          "TALKING POINT 4: Calling 'stop' on an over-reach is doing your job, not slowing the line.",
          "ONE ACTION TODAY: Aisle 14 manual retrieval above 3.5 m is taped off until picker access is scheduled. See your team lead for the pick-around.",
          "CLOSE: This talk exists because someone reported the near-miss. Keep doing that."
        ],
        issues: []
      },
      {
        temperature: "Medium — a little more fluent, a little less faithful",
        body: [
          "WHAT HAPPENED: A colleague climbed a ladder to retrieve stock at height, lost his footing and dropped the load while a co-worker passed below. No injuries were sustained.",
          "WHY IT MATTERS: Falls from height are the leading cause of workplace fatalities, and this was a very near miss.",
          "TALKING POINT 1: Always use the correct mobile elevating work platform for work above 2 metres.",
          "TALKING POINT 2: Maintain three points of contact and keep your belt buckle within the stiles.",
          "TALKING POINT 3: Good housekeeping at the ladder base is essential.",
          "TALKING POINT 4: Report near misses so we can act on them.",
          "ONE ACTION TODAY: Supervisors to brief all pickers on safe ladder use this shift.",
          "CLOSE: Look after each other."
        ],
        issues: [
          { text: "the leading cause of workplace fatalities", tag: "Unsourced statistic", why: "Plausible, not in the facts you gave it, and not necessarily true for this operation. It sounds authoritative — that is the danger." },
          { text: "work above 2 metres", tag: "Assumed threshold", why: "A specific number the prompt never provided. May be wrong for the site's jurisdiction / standard." }
        ]
      },
      {
        temperature: "High — confident, fluent, and inventing detail",
        body: [
          "WHAT HAPPENED: During a picking operation a worker fell from a ladder after failing to follow the safe system of work, dropping a carton that narrowly missed a passing colleague.",
          "WHY IT MATTERS: In line with OSHA 1926.1053, ladders must not be used in this way, and falls from this height are fatal in roughly one in four cases.",
          "TALKING POINT 1: The picker has since been retrained and the matter has been addressed with him directly.",
          "TALKING POINT 2: Ladders have a defined blind spot and must never be used near racking.",
          "TALKING POINT 3: All work at height requires a permit signed by the site manager.",
          "TALKING POINT 4: Safety is everyone's responsibility.",
          "ONE ACTION TODAY: Sign the attached acknowledgement that you have read the updated ladder policy.",
          "CLOSE: Let's get home safe."
        ],
        issues: [
          { text: "In line with OSHA 1926.1053", tag: "Fabricated citation", why: "A real US construction standard — wrong jurisdiction for this site, and the prompt explicitly said do not cite regulation numbers. The model produced it because it 'fits the pattern' of a safety brief." },
          { text: "fatal in roughly one in four cases", tag: "Fabricated statistic", why: "No source, not in the facts. Invented to sound rigorous." },
          { text: "The picker has since been retrained and the matter has been addressed with him directly", tag: "Assumed fact / outcome", why: "The input never said this. The model has decided what happened after the event — and quietly assigned blame." },
          { text: "Ladders have a defined blind spot", tag: "Nonsense that sounds technical", why: "Borrowed from forklift guidance. Fluent, confident, meaningless." },
          { text: "requires a permit signed by the site manager", tag: "Invented procedure", why: "States a site rule that may not exist. Downstream readers may act on it." }
        ]
      }
    ],

    hallucinationRate: "Independent testing puts confident-but-wrong statements at roughly 3–5% of factual claims for mainstream content, rising to ~27% for niche or sparsely-documented topics. It does not warn you which 5%.",

    reviewChecklist: [
      "Every factual claim traces back to the input I provided.",
      "No regulation, standard or statistic is cited that I did not supply.",
      "No outcome, cause or blame is asserted that was not in the facts.",
      "Tone is instructive and non-punitive, and the one action is doable today."
    ],

    validation: {
      method: "There is no single accuracy score. Validation IS the human review checklist plus a named sign-off before the text is used. Lower the temperature and 'ground' the model by pasting source text to reduce (not remove) invention.",
      independentNote: "Systematic reviews find generative-AI safety tools are almost never evaluated on real-world outcomes — the evidence is overwhelmingly vendor demos and self-report.",
      humanRole: "Author of record. You verify every line and your name goes on it."
    },
    failure: "Fluent fabrication: invented regulations, invented statistics, assumed facts and assigned blame — all delivered in the same confident voice as the correct parts."
  },

  /* --------------------------------------------------------- SYNTHESIS ROW -- */
  /* Rendered as the bottom comparison table. Kept in the dataset so a scenario
     can tune the wording, but the structure is fixed. */
  synthesis: {
    rows: [
      ["Input",           "Pixels / video frames",                                   "Structured site metrics",                              "Free-text narrative",                                  "A prompt + the facts"],
      ["Output",          "Boxes + class + confidence",                               "One probability + a band",                             "Field codes + confidence",                             "Drafted prose"],
      ["Validate with",   "Confusion matrix, precision / recall / false-alarm rate, on a labelled set from YOUR site", "Backtest AUC + calibration on YOUR org's history", "Per-class P/R vs expert coders; review low-confidence fields", "A human review checklist — no single accuracy number"],
      ["Main failure",    "False alarms → alert fatigue; drift when the site changes", "Under-reporting reads as low risk; silent drift",      "Degrades on terse / translated / inconsistent text",    "Confident fabrication of regs, stats, outcomes"],
      ["Human's job",     "Act on or dismiss alerts; re-label after changes",         "Read the drivers; own the retrain trigger",            "Code the low-confidence fields",                        "Verify every claim; sign off as author"],
      ["Day 1 topic",     "Topic 2 — computer vision",                                "Topic 2b — predictive models",                         "Topic 2 — NLP",                                        "Topic 2a — how LLMs generate text"]
    ]
  }
};
