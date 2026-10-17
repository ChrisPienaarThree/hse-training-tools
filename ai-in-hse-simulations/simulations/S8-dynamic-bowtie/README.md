# S8 — Dynamic bowtie: barrier status live

**Course:** Integrating AI in Workplace Safety Practices
**Slot:** Day 2 · Topic 5 (AI in process / operational safety — digital twins and dynamic bowties)
**Run time:** 15–20 min facilitator-led, or leave open to explore.

---

## What it teaches

> A bowtie is a Layer of Protection Analysis (LOPA) drawn as a picture: threats reach a top event
> only past every prevention barrier; the top event becomes the worst consequence only past every
> mitigation barrier. Barriers in series **multiply** their probabilities of failure — which is why
> defence-in-depth works, and why removing even one layer can move the residual risk by an order of
> magnitude. The bowtie that was signed off assumed every barrier healthy on the day of the
> workshop. A **live** version — fed by the maintenance system, the permit log, instrument health —
> shows what is actually true today. The gap between the two is the whole case for a dynamic bowtie
> / digital twin.

Plus two sharp limits: the maths assumes barriers fail **independently**, which is false whenever
two barriers share a cause; and a **risk matrix has coarse bands** — a real, large change in
likelihood can still land in the same cell.

---

## How to run it

- **Open `index.html` in a browser.** No server, no internet, no install.
- No model runs. Threat frequencies and each barrier's nominal PFD / degraded / overdue behaviour
  are pre-authored (standard LOPA parameters). The PFD for the current status, the series-product
  maths, the static-vs-live comparison and the matrix placement are computed live — same honesty
  stance as S2/S4/S5/S6/S7.

---

## Controls

| Control | Effect |
|---|---|
| **Barrier status** (Healthy / Degraded / Overdue / Bypassed) — one per barrier | sets that barrier's PFD; Bypassed means no credit at all |
| **Weeks since review** | ages every barrier currently set to Overdue (their PFD grows) |
| **Reset to as-approved** | returns every barrier to Healthy and weeks to 0 |

---

## Suggested walkthrough

1. **Default state.** Read the bowtie left to right. All gates are green. The "Live residual risk"
   tile shows an enormous return period and the ratio tile reads **1.0×** — the live picture matches
   the static one exactly, because nothing has changed yet.
2. **Bypass one prevention barrier.** Watch its gate turn red, the return period fall, and the ratio
   climb. One barrier rarely dooms you — that is defence-in-depth working as designed.
3. **Bypass a second barrier (ideally the one tagged ⚠ common-cause).** Read the common-cause note.
   Point out that multiplying two barriers' PFDs assumes they fail independently — and these two
   don't. The simple maths is optimistic here.
4. **Reset. Drag "weeks since review" out to 40–50** with a couple of barriers set to **Overdue**.
   Nothing was bypassed — the site just didn't get around to the proof tests. The ratio still climbs,
   quietly, exactly like S7's model drift but for physical barrier integrity.
5. **Watch the risk matrix.** Point at a case where the ratio has grown several-fold but the live dot
   is still in the same cell as the static ring — the matrix band absorbed a real, meaningful change.
6. **Read the five callouts**, especially data quality: a bypass that was never logged is invisible
   to this dashboard and to the workforce walking past it.

---

## Discussion questions

- Which of your site's bowties/LOPAs would look different if it were fed live instead of reviewed
  every 3–5 years?
- Where do two of your barriers quietly share a cause — a power supply, a competent person, a logic
  solver? What would it take to know?
- The ratio moved 6× but the matrix cell didn't change colour. Which number should drive a decision —
  the cell or the ratio?
- What data feed would you actually trust to mark a barrier "Bypassed" or "Overdue" automatically,
  and what would you never trust it to mark "Healthy"?
- This tool tells you where to send a competent person. What decisions should it never be allowed to make on its own?

---

## Scenarios included

| id | folder | the bowtie |
|---|---|---|
| `process-overpressure` | `data/process-overpressure/` | reactor overpressure / loss of containment — SIS trip, PSV, F&G/ESD |
| `mobile-plant-pedestrian` | `data/mobile-plant-pedestrian/` | pedestrian struck by mobile plant in a yard — segregation, proximity detection, banksman (the S1 forklift pairing, from the risk-modelling side) |

Add more by copying `data/_TEMPLATE/` — see `data/_TEMPLATE/README.md`.

---

## Files

```
S8-dynamic-bowtie/
├── index.html        entry point — open this
├── app.js            barrier PFD maths + series product + bowtie/matrix render (no model, no network)
├── styles.css        projector-friendly, light + dark (shares S1–S7 tokens)
├── README.md         this file
└── data/
    ├── manifest.js
    ├── process-overpressure/dataset.js
    ├── mobile-plant-pedestrian/dataset.js
    └── _TEMPLATE/
        ├── dataset.js
        └── README.md     dataset contract + the LOPA maths app.js runs
```

## Honesty rules baked in

- Banner: no model runs; LOPA parameters authored, the arithmetic is real and hand-checkable.
- The independence assumption behind multiplying PFDs is named as an assumption, with one concrete
  common-cause pair called out per scenario.
- The risk-matrix-banding limitation is a standing callout, not a footnote.
- Framed throughout as a prioritisation tool for a competent person, never a replacement for
  physical inspection or proof testing.
