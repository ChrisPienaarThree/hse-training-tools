/* ============================================================================
   S1 dataset — "forklift-pedestrian"
   Forklift / pedestrian near-miss at a warehouse-yard interface.

   Pre-authored for teaching. No model runs. Same object shape as
   ../warehouse-fall/dataset.js (see ../_TEMPLATE/dataset.js for the contract).
   ============================================================================ */
window.HSE_S1 = window.HSE_S1 || { scenarios: {} };
window.HSE_S1.scenarios["forklift-pedestrian"] = {

  id: "forklift-pedestrian",
  label: "Yard — forklift / pedestrian near-miss",

  situation: {
    headline: "A reversing counterbalance forklift came within ~1 m of a pedestrian who was crossing outside the marked walkway. No contact.",
    facts: [
      "Warehouse-to-yard interface, despatch end, 14:05.",
      "Forklift reversing out of bay 6; reversing alarm confirmed working afterwards.",
      "Pedestrian (visiting driver) was crossing the traffic lane on their phone, outside the yellow walkway.",
      "The pedestrian segregation barrier has a 4 m gap where it was struck by a trailer weeks ago and not repaired.",
      "About 35% of forklift operators on shift were agency staff.",
      "The site traffic-management plan review is 96 days overdue."
    ]
  },

  vision: {
    engine: "Computer vision — object / proximity detection on yard CCTV",
    sceneImage: "scene.svg",
    sceneCaption: "Synthetic still from a fixed yard camera (illustration, not a photo).",
    dayMap: "Day 1 Topic 2 (computer vision) · Day 2 Topic 4 (CV for hazard detection)",

    conditions: [
      {
        name: "Good — daylight, camera matches training site",
        detections: [
          { label: "forklift", conf: 0.96, box: [22, 34, 30, 40] },
          { label: "person", conf: 0.95, box: [60, 40, 9, 32] },
          { label: "person outside marked walkway", conf: 0.79, box: [58, 38, 13, 36], alert: true },
          { label: "forklift–pedestrian proximity < 2 m", conf: 0.83, box: [40, 34, 32, 42], alert: true },
          { label: "missing barrier segment", conf: 0.44, box: [46, 66, 22, 8] }
        ],
        /* Confusion matrix for the "forklift–pedestrian proximity" alert,
           500-frame labelled clip from this yard. Recall deliberately tuned
           HIGH (safety-critical) at the cost of more false alarms. */
        matrix: { tp: 61, fp: 22, fn: 7, tn: 410 },
        alertFatigueNote: "Recall 0.90 was a deliberate choice — miss as few real near-misses as possible — but it buys ~22 false alerts per clip. The desk has to be able to live with that."
      },
      {
        name: "Fair — long shadows, late afternoon",
        detections: [
          { label: "forklift", conf: 0.90, box: [22, 34, 30, 40] },
          { label: "person", conf: 0.88, box: [60, 40, 9, 32] },
          { label: "person outside marked walkway", conf: 0.63, box: [58, 38, 13, 36], alert: true },
          { label: "forklift–pedestrian proximity < 2 m", conf: 0.71, box: [40, 34, 32, 42], alert: true },
          { label: "shadow (false positive — read as a second person)", conf: 0.51, box: [70, 44, 8, 28], falsePositive: true }
        ],
        matrix: { tp: 58, fp: 34, fn: 10, tn: 398 },
        alertFatigueNote: "Shadows read as people. False alerts up ~55%."
      },
      {
        name: "Poor — dusk, backlit by yard floodlights",
        detections: [
          { label: "forklift", conf: 0.74, box: [22, 34, 30, 40] },
          { label: "person", conf: 0.66, box: [60, 40, 9, 32] },
          { label: "forklift–pedestrian proximity < 2 m", conf: 0.48, box: [40, 34, 32, 42] },
          { label: "reflective puddle (false positive — read as person)", conf: 0.55, box: [30, 78, 10, 8], falsePositive: true }
        ],
        matrix: { tp: 41, fp: 63, fn: 27, tn: 369 },
        alertFatigueNote: "Recall down to ~0.60 and false alerts nearly tripled. By now the desk has muted the channel."
      },
      {
        name: "Very poor — new despatch door, camera angle not in training set",
        detections: [
          { label: "forklift", conf: 0.61, box: [22, 34, 30, 40] },
          { label: "trailer (mislabelled as forklift)", conf: 0.47, box: [4, 20, 40, 55], falsePositive: true },
          { label: "person", conf: 0.52, box: [60, 40, 9, 32] }
        ],
        matrix: { tp: 28, fp: 78, fn: 40, tn: 354 },
        alertFatigueNote: "The layout it learned no longer exists. Nobody re-validated after the door was added."
      }
    ],

    validation: {
      method: "Confusion matrix on a site-specific labelled clip. Report precision, recall and false-alarm rate. For a safety-critical alert you usually accept lower precision to protect recall — but you must know the numbers before you deploy.",
      independentNote: "Independent evaluations of proximity-detection CV show precision falling sharply on lighting, weather and camera-angle changes the model did not see in training.",
      humanRole: "Traffic marshal / supervisor triages alerts. The label set must be redone whenever the yard layout or camera set changes."
    },
    failure: "Backlight, dust, puddles and shadows generate false alarms; a layout change silently breaks it. High recall without a plan for the false alarms just gets the channel muted."
  },

  predictive: {
    engine: "Predictive model — logistic-regression-style risk score",
    dayMap: "Day 1 Topic 2b (predictive models) · Day 2 Topic 3 (predictive analytics)",
    target: "P(pedestrian–forklift contact injury on this yard in the next 90 days)",

    features: [
      { name: "Pedestrian–forklift interactions per shift", value: "≈ 140", contribution: 0.20 },
      { name: "Segregation audit score", value: "3.1 / 5", contribution: 0.22 },
      { name: "Near-miss reports (30 d)", value: "3", contribution: 0.16 },
      { name: "Open barrier / segregation defects", value: "2", contribution: 0.40 },
      { name: "Traffic-management-plan review overdue", value: "96 days", contribution: 0.33 },
      { name: "Agency operator share this shift", value: "35%", contribution: 0.25 }
    ],

    states: [
      { name: "As reported", probability: 0.18, band: "Elevated",
        note: "Drivers: the open barrier defect, the overdue traffic-plan review, the agency-operator mix." },
      { name: "If near-misses are under-reported (1 logged, 3 real)", probability: 0.13, band: "Moderate",
        note: "Score drops; the pedestrian in the lane is still there. Under-reporting buys false comfort." },
      { name: "After a new despatch door changed traffic flow (drift)", probability: 0.18, band: "Elevated (stated)",
        note: "Interaction points moved but the model still scores the old layout. Backtest AUC has slipped 0.71 → 0.60." }
    ],

    validation: {
      method: "Backtest on this site's own 2+ years of traffic and incident data: AUC 0.71. Calibration check in the predicted band against observed contact/near-miss rate.",
      independentNote: "Same caveat as every predictive-safety claim: a large systematic review found almost none are validated against whether they changed an outcome. Backtest on your data before you trust a number.",
      humanRole: "Use the driver bar chart to prioritise: fix the barrier, close the traffic-plan review. Re-fit after any layout change."
    },
    failure: "Under-reporting reads as lower risk. Layout changes cause silent drift. The score says nothing about the specific blind corner the marshals already worry about."
  },

  nlp: {
    engine: "NLP classifier — auto-codes a free-text incident narrative",
    dayMap: "Day 1 Topic 2 (NLP) · Day 3 Topic 1 (incident & near-miss analysis)",

    narratives: {
      clean: "A counterbalance forklift was reversing out of bay 6 at the despatch end. A visiting driver was crossing the traffic lane on foot, outside the yellow walkway and looking at his phone. The forklift's reversing alarm was sounding. The operator stopped about a metre short of the pedestrian. There was no contact and no injury. The segregation barrier has a 4 m gap where it was hit by a trailer several weeks ago and has not been repaired.",
      poor: "Forklift go back from bay 6. Visitor walk in road not in yellow line, look phone. Alarm making sound. Driver stop maybe 1 meter. No touch, no hurt. Barrier got hole from trailer before, still not fix."
    },

    codes: [
      { field: "Event type",           clean: { value: "Pedestrian / mobile-plant near-miss", conf: 0.91 }, poor: { value: "Mobile-plant incident (unspecified)", conf: 0.74 } },
      { field: "Actual vs near-miss",  clean: { value: "Near-miss — no contact", conf: 0.95 },              poor: { value: "Near-miss — no contact", conf: 0.88 } },
      { field: "Primary source",       clean: { value: "Powered industrial truck — counterbalance", conf: 0.94 }, poor: { value: "Powered industrial truck", conf: 0.83 } },
      { field: "Manoeuvre",            clean: { value: "Reversing", conf: 0.86 },                            poor: { value: "Reversing", conf: 0.64 } },
      { field: "Contributing — engineering", clean: { value: "Segregation barrier defect", conf: 0.72 },   poor: { value: "Segregation barrier defect", conf: 0.61 } },
      { field: "Injury potential severity", clean: { value: "High — potential fatality", conf: 0.63 },      poor: { value: "Medium", conf: 0.44, miscode: true } }
    ],
    contributingTags: ["segregation breach", "barrier defect not repaired", "pedestrian distraction", "reversing manoeuvre", "visitor on site", "agency operator"],
    lowConfidenceThreshold: 0.70,

    validation: {
      method: "Per-class precision / recall against expert-coded narratives. Route sub-threshold fields (here: injury-potential severity, and the engineering-cause field) to a human.",
      independentNote: "NIOSH / BLS injury-narrative auto-coding (independent): ~82% → ~90% agreement with expert coders as the labelled set grew. Good at volume and consistency, not at judgement.",
      humanRole: "Set the severity field — the model under-rates 'no contact' as lower potential, when a reversing forklift at 1 m is a potential fatality."
    },
    failure: "The terse write-up loses the counterbalance detail and downgrades injury potential. Second-language and rushed narratives get systematically weaker codes."
  },

  generative: {
    engine: "Generative model (LLM) — drafts safety communications",
    dayMap: "Day 1 Topic 2a (how LLMs generate text) · Day 4 Topic 1 & 6",

    prompt: "Draft a 5-minute toolbox talk for the despatch yard team about this forklift near-miss. Plain language, 4–6 talking points, one clear action. Do NOT invent site rules or cite regulation numbers that I did not give you.",

    outputs: [
      {
        temperature: "Low — sticks close to the facts",
        body: [
          "WHAT HAPPENED: Yesterday at the despatch end a forklift reversing out of bay 6 stopped about a metre short of a visiting driver who was walking across the lane, off the walkway, looking at his phone. The reversing alarm was sounding. No contact, no injury.",
          "WHY IT MATTERS: A metre is the difference between this conversation and a fatality investigation.",
          "TALKING POINT 1: The barrier has a 4 m gap from the trailer strike. Until it's fixed, treat that whole stretch as live traffic — do not cross there.",
          "TALKING POINT 2: Pedestrians use the yellow walkway, every time, even when it's longer.",
          "TALKING POINT 3: Visitors and agency drivers may not know our routes — escort them or point them to the walkway.",
          "TALKING POINT 4: Operators: eye contact before you reverse. An alarm is not a clearance.",
          "ONE ACTION TODAY: Barrier gap is coned and flagged now; repair raised as priority. Report to your supervisor if you see the cones moved.",
          "CLOSE: Say something if you see someone in the lane. That's what stopped it being worse."
        ],
        issues: []
      },
      {
        temperature: "Medium — smoother, drifting from the facts",
        body: [
          "WHAT HAPPENED: A forklift and a pedestrian came into close proximity in the yard. The situation was resolved without injury.",
          "WHY IT MATTERS: Struck-by incidents involving forklifts are among the most common causes of workplace death.",
          "TALKING POINT 1: Maintain a minimum 3-metre exclusion zone around all moving plant.",
          "TALKING POINT 2: Pedestrians must make eye contact and receive a hand signal before crossing.",
          "TALKING POINT 3: Keep segregation barriers in good condition.",
          "TALKING POINT 4: Stay alert and off your phone in operational areas.",
          "ONE ACTION TODAY: Toolbox talk to be signed by all yard staff.",
          "CLOSE: Look out for one another."
        ],
        issues: [
          { text: "among the most common causes of workplace death", tag: "Unsourced statistic", why: "Probably broadly true, but it was not in the facts and it is stated as settled. The model reaches for authoritative-sounding framing." },
          { text: "minimum 3-metre exclusion zone", tag: "Invented number", why: "No such figure was supplied. Staff may treat it as the site standard." }
        ]
      },
      {
        temperature: "High — confident and inventing",
        body: [
          "WHAT HAPPENED: A pedestrian entered a designated forklift operating zone in breach of the site traffic rules and was nearly struck by a reversing truck whose operator failed to sound the horn.",
          "WHY IT MATTERS: Under site procedure TMS-14 and the applicable OSHA powered-industrial-truck standard, this is a reportable violation.",
          "TALKING POINT 1: The forklift operator has been suspended pending investigation.",
          "TALKING POINT 2: All forklifts have a rear blind spot of exactly 4 metres.",
          "TALKING POINT 3: Visitors are banned from the yard without a hi-vis escort at all times.",
          "TALKING POINT 4: Any repeat will result in disciplinary action.",
          "ONE ACTION TODAY: Sign the acknowledgement that you have read traffic procedure TMS-14.",
          "CLOSE: Zero tolerance keeps us safe."
        ],
        issues: [
          { text: "failed to sound the horn", tag: "Assumed fact", why: "The facts said the reversing alarm was working. The horn is never mentioned. The model invented an operator error." },
          { text: "Under site procedure TMS-14 and the applicable OSHA powered-industrial-truck standard", tag: "Fabricated citation", why: "The prompt said do not cite rules it wasn't given. 'TMS-14' does not exist; the OSHA reference is wrong jurisdiction. Pure pattern-completion." },
          { text: "The forklift operator has been suspended pending investigation", tag: "Assumed outcome / blame", why: "Not in the input. The model has decided what management did and who was at fault." },
          { text: "rear blind spot of exactly 4 metres", tag: "Fabricated precision", why: "Made-up specific number in a confident sentence." },
          { text: "Visitors are banned from the yard without a hi-vis escort at all times", tag: "Invented rule", why: "States a site policy that may not exist as written." }
        ]
      }
    ],

    hallucinationRate: "Independent testing: ~3–5% of factual claims are confidently wrong for mainstream content, up to ~27% for niche topics. The model gives no signal about which ones.",

    reviewChecklist: [
      "Every factual claim traces back to the input I provided.",
      "No regulation, procedure code or statistic is cited that I did not supply.",
      "No outcome, cause or blame is asserted that was not in the facts.",
      "Tone is instructive and non-punitive, and the one action is doable today."
    ],

    validation: {
      method: "No single accuracy score. Validation is the human review checklist plus a named sign-off. Grounding (paste the procedure text) and low temperature reduce, not remove, invention.",
      independentNote: "Generative-AI safety tools are very rarely evaluated on real outcomes in the literature — mostly vendor demonstrations.",
      humanRole: "Author of record: verify every line, your name on it."
    },
    failure: "Invents a procedure code, an operator error, a suspension and a blind-spot figure — all in the same confident register as the accurate opening line."
  },

  synthesis: {
    rows: [
      ["Input",           "Pixels / video frames",                                   "Structured yard metrics",                              "Free-text narrative",                                  "A prompt + the facts"],
      ["Output",          "Boxes + class + confidence",                               "One probability + a band",                             "Field codes + confidence",                             "Drafted prose"],
      ["Validate with",   "Confusion matrix, precision / recall / false-alarm rate, labelled clip from YOUR yard", "Backtest AUC + calibration on YOUR site's history", "Per-class P/R vs expert coders; review low-confidence fields", "A human review checklist — no single accuracy number"],
      ["Main failure",    "False alarms from light/shadow/dust → muted channel; drift after layout change", "Under-reporting reads as low risk; silent drift", "Terse / translated narratives downgraded", "Confident fabrication of rules, faults, outcomes"],
      ["Human's job",     "Triage alerts; re-label after yard changes",               "Read the drivers; fix the barrier; own the retrain",   "Set the severity / cause fields",                       "Verify every claim; sign off as author"],
      ["Day 1 topic",     "Topic 2 — computer vision",                                "Topic 2b — predictive models",                         "Topic 2 — NLP",                                        "Topic 2a — how LLMs generate text"]
    ]
  }
};
