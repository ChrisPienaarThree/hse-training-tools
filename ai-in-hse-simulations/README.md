# Integrate AI in HSE — simulations & dashboard

Interactive teaching simulations for the course **"Integrating AI in Workplace Safety Practices"**
(HSE Methods Engineers). Each simulation demonstrates one AI capability from the research
document, shows how it is validated, and shows how it fails.

**Open `index.html` in this folder for the dashboard** — a card for every simulation, the course
coverage map (what's built vs not yet), and a suggested delivery order. Each card links straight
into its simulation.

Source material: [`AI_Workplace_Safety_Research_1.md`](AI_Workplace_Safety_Research_1.md).

---

## Layout

```
Integrate AI in HSE/
├── index.html                             ← THE DASHBOARD — open this first
├── AI_Workplace_Safety_Research_1.md      the research doc all of this is built from
├── README.md                             this file
└── simulations/
    ├── S1-four-ai-engines/               ← BUILT. Day 1 T1/T2 — four AI families, one incident
    │   ├── index.html                    open this in a browser
    │   ├── README.md                     facilitator notes for S1
    │   └── data/<scenario>/              one folder per scenario dataset
    ├── S2-token-by-token/                ← BUILT. Day 1 T2a — next-token prediction, temperature,
    │   ├── index.html                       context window, and where hallucination comes from
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S3-grounded-vs-ungrounded/        ← BUILT. Day 1 T2a (+ D3 T2, D4 T1/T6) — same question
    │   ├── index.html                       answered with vs without the source; claim-by-claim audit
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S4-predictive-model-sandbox/      ← BUILT. Day 1 T2b — same data through regression / one tree /
    │   ├── index.html                       boosted ensemble / anomaly detector; accuracy vs explainability
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S5-computer-vision-ppe/           ← BUILT. Day 2 T4 — one video pipeline, 7 detectors; degrade the
    │   ├── index.html                       image → recall down, false alarms up, supervisor stops looking
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S6-ergonomic-lifting-risk/        ← BUILT. Day 2 T4 — pose estimation → REBA + NIOSH lifting
    │   ├── index.html                       equation, every step of the score shown; camera-view uncertainty
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S7-predictive-site-risk-cockpit/  ← BUILT. Day 2 T3 (+ D3 T1) — leading indicators → 30-day risk;
    │   ├── index.html                       model drift + under-reporting bias shown as a live gap
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S8-dynamic-bowtie/                ← BUILT. Day 2 T5 — LOPA-style bowtie, barrier status live,
    │   ├── index.html                       static-vs-dynamic risk, common-cause + matrix-banding limits
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S9-hazop-copilot/                 ← BUILT. Day 2 T6 (+ T2) — AI causes/consequences/safeguards
    │   ├── index.html                       vs your team's site-specific catch; review gate + worksheet
    │   ├── README.md
    │   └── data/<scenario>/
    ├── S11-incident-investigation-assistant/  ← BUILT. Day 3 T2 — AI-drafted timeline/causes/actions +
    │   ├── index.html                            a fabricated "similar incident"; finalize gate
    │   ├── README.md
    │   └── data/<scenario>/
    └── S22-reliability-metrics-playground/    ← BUILT. Day 5 T4 — confusion matrix, ROC/AUC, accuracy
        ├── index.html                            paradox, drift/recalibration; ties every trust meter together
        ├── README.md
        └── data/<scenario>/
```

Every simulation is a **self-contained folder** under `simulations/`. Every dataset is a
**self-contained folder** under that simulation's `data/`. Open the simulation's `index.html`
directly in a browser — no server, no build step, no internet.

---

## Design rules (applied to every simulation)

1. **Nothing runs a model.** All "AI output" is pre-authored data. Controls step between authored
   states; they do not compute. The page says so, out loud, in a banner.
2. **Every demo shows a failure mode**, not just a success — hallucination, false alarms / alert
   fatigue, model drift, reporting bias, narrative-quality bias.
3. **Independent vs vendor-reported** figures are visually distinct wherever numbers from the
   literature appear.
4. **A human stays in the loop** in every panel, and the demo names who and for what.
5. **Projector-friendly:** large type, high contrast, light + dark, works offline.

---

## Simulation catalogue

| id | title | course slot | status |
|---|---|---|---|
| **S1** | Four kinds of AI, one incident | Day 1 · T1 / T2 | **built** |
| **S2** | Token-by-token generator (temperature, top-k, context window, hallucination) | Day 1 · T2a | **built** |
| **S3** | Grounded vs ungrounded — same question, claim-by-claim audit + review gate | Day 1 · T2a (+ D3 T2, D4 T1/T6) | **built** |
| **S4** | Four predictive models, one dataset — regression / tree / ensemble / anomaly; accuracy vs explainability | Day 1 · T2b | **built** |
| **S5** | Computer vision on a safety camera — 7 detectors, condition degradation, alert fatigue, site-pilot | Day 2 · T4 (+ D1 T2) | **built** |
| **S6** | Pose estimation → ergonomic lifting risk — REBA worksheet + NIOSH lifting equation, camera-view uncertainty | Day 2 · T4 | **built** |
| **S7** | Predictive site-risk cockpit — leading indicators, model drift, under-reporting bias | Day 2 · T3 (+ D3 T1) | **built** |
| **S8** | Dynamic bowtie — barrier status live, LOPA maths, common cause, matrix banding | Day 2 · T5 | **built** |
| **S9** | AI-assisted HAZOP co-pilot — AI checklist vs your team's site-specific catch, review gate | Day 2 · T6 (+ T2) | **built** |
| **S11** | AI incident-investigation assistant — draft report + a fabricated "similar incident", finalize gate | Day 3 · T2 | **built** |
| **S22** | AI reliability metrics playground — confusion matrix, ROC/AUC, accuracy paradox, drift | Day 5 · T4 | **built** |

(Full list of ~23 candidate simulations is in the conversation notes. All six of the originally
recommended first-set sims, plus S8 and S9, are now built — eleven simulations in total.)

---

## Adding to a simulation

Each simulation's `README.md` and its `data/_TEMPLATE/` explain how to extend it. In general:
copy `_TEMPLATE`, fill in the dataset, register it in `manifest.js` and `index.html`, test in a
browser.
