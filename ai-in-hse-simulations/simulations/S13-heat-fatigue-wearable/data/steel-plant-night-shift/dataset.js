/* ============================================================================
   S13 dataset — "steel-plant-night-shift"
   Same wearable model, hotter task and a night-shift/consecutive-nights
   fatigue profile instead of a day shift. Authored coefficients/thresholds;
   live core-temperature curve, crossing times, lead time, fatigue curve.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S13 = window.HSE_S13 || { scenarios: {} };
window.HSE_S13.scenarios["steel-plant-night-shift"] = {
  id: "steel-plant-night-shift",
  label: "Steel plant — night shift",
  context: "A technician working an 8-hour night shift with radiant heat exposure near a furnace line, three consecutive nights in.",
  shiftMinutes: 480,

  heat: {
    ambientTemp: { min: 25, max: 45, default: 34, unit: "°C" },
    humidity: { min: 10, max: 60, default: 35, unit: "%" },
    workload: { min: 1, max: 5, default: 4 },
    heatCoef: 0.45,
    decayMin: 90,
    earlyWarningThreshold: 38.0,
    symptomThreshold: 38.5,
    medicationBiasC: 0.4
  },
  fatigue: {
    hoursAwake: { min: 4, max: 20, default: 14 },
    shiftStartHour: { min: 0, max: 23, default: 22 },
    consecutiveNights: { min: 0, max: 6, default: 3 }
  },

  callouts: {
    predictiveLead: "The wearable's predictive alert is set below the symptom-onset temperature on purpose — it is meant to trigger a rest break before anyone feels unwell, not confirm what they already feel.",
    hrLimitation: "Toggle the medication flag. A heart-rate-based wearable can under-read physiological strain for a worker on certain medications — the alert fires later, or not at all, while the true core temperature keeps climbing.",
    fatigueModel: "The fatigue curve is a simplified illustration — real biomathematical fatigue models (e.g. SAFTE/FAST) are validated tools, not a formula on a training slide.",
    interpretWithCare: "Independent fatigue statistics are population averages — they say fatigue matters, not that this specific worker will be involved in an incident tonight.",
    surveillance: "A wearable that reports physiological data to a supervisor is a surveillance tool as well as a safety one, especially overnight — worker consent and data use matter as much as the alert threshold."
  },
  notes: {
    what: "Two independent estimates run over the same shift: a heat-strain model predicting core temperature from ambient conditions and workload, and a fatigue model predicting error likelihood from shift timing against the body clock, hours awake, and consecutive night shifts.",
    heatMath: "Core temperature rises along a saturating curve toward a ceiling set by ambient temperature, humidity and workload. The wearable's predictive alert fires at a lower temperature than true symptom onset — that gap is the lead time. A medication-affected HR reading is modelled as a constant offset that delays or suppresses the wearable's alert without changing the true curve.",
    fatigueMath: "Error likelihood combines a circadian term (peaking in the pre-dawn window of circadian low), hours awake, and consecutive night shifts — a simplified illustrative model, not a validated one. Watch it climb hardest toward the end of this shift, in the pre-dawn hours of the third consecutive night.",
    real: "Authored: the slider ranges, the heat-model coefficient, both temperature thresholds, the medication bias size. Live and real: the core-temperature curve, both crossing times, the lead time, the fatigue score curve, and the risk band."
  }
};
