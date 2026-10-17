/* ============================================================================
   S13 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   app.js computes, live, over shiftMinutes:
     heatLoad = workload * heatCoef * (1+0.02*(ambientTemp-25)) * (1+0.01*(humidity-40))
     trueCoreTemp(t)     = 37.0 + heatLoad * (1 - exp(-t/decayMin))
     wearableCoreTemp(t) = trueCoreTemp(t) - (medication ? medicationBiasC : 0)
     t_warning = first t where wearableCoreTemp(t) >= earlyWarningThreshold
     t_symptom = first t where trueCoreTemp(t) >= symptomThreshold
     leadTime  = t_symptom - t_warning
   Fatigue (generic constants live in app.js — this dataset only supplies
   framing + slider ranges):
     circadian(hour) = 0.5+0.5*cos(2*pi*(hour-4)/24)      [peaks pre-dawn]
     awakeRisk(hoursAwake) = clamp((hoursAwake-8)/16, 0, 1)
     score(t) = clamp(0.01 + 0.06*circadian + 0.12*awakeRisk + 0.06*min(1,consecutiveNights*0.12), 0, 0.5)
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S13 = window.HSE_S13 || { scenarios: {} };
window.HSE_S13.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — who, what task, what conditions.",
  shiftMinutes: 480,
  heat: {
    ambientTemp: { min: 22, max: 40, default: 30, unit: "°C" },
    humidity: { min: 20, max: 80, default: 50, unit: "%" },
    workload: { min: 1, max: 5, default: 3 },
    heatCoef: 0.45, decayMin: 90,
    earlyWarningThreshold: 38.0, symptomThreshold: 38.5, medicationBiasC: 0.4
  },
  fatigue: {
    hoursAwake: { min: 4, max: 20, default: 8 },
    shiftStartHour: { min: 0, max: 23, default: 7 },
    consecutiveNights: { min: 0, max: 6, default: 0 }
  },
  callouts: {
    predictiveLead: "The wearable's predictive alert is set below the symptom-onset temperature on purpose — it is meant to trigger a rest break before anyone feels unwell.",
    hrLimitation: "TODO — the medication/HR-reliability point, phrased for this scenario.",
    fatigueModel: "The fatigue curve is a simplified illustration — real biomathematical fatigue models (e.g. SAFTE/FAST) are validated tools, not a formula on a training slide.",
    interpretWithCare: "Independent fatigue statistics are population averages — they say fatigue matters, not that this specific worker will be involved in an incident today.",
    surveillance: "A wearable that reports physiological data to a supervisor is a surveillance tool as well as a safety one — worker consent and data use matter as much as the alert threshold."
  },
  notes: {
    what: "TODO",
    heatMath: "Core temperature rises along a saturating curve; the wearable's predictive alert fires below true symptom onset, by design — that gap is the lead time. A medication-affected reading is modelled as a constant offset.",
    fatigueMath: "Error likelihood combines a circadian term, hours awake, and consecutive night shifts — simplified and illustrative.",
    real: "Authored: slider ranges, the heat-model coefficient, both thresholds, the medication bias size. Live and real: the core-temperature curve, both crossing times, the lead time, the fatigue curve, and the risk band."
  }
};
