/* ============================================================================
   S13 dataset — "warehouse-summer-shift"
   A wearable's predictive heat-strain warning vs the true symptom-onset
   point, plus a biomathematical fatigue estimate over the same shift.

   AUTHORED: ambient/humidity/workload ranges, the heat-model coefficient, the
   two temperature thresholds, and the medication-bias size. LIVE AND REAL:
   the core-temperature curve, both crossing times and the lead time, the
   fatigue score curve, and the current risk band. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S13 = window.HSE_S13 || { scenarios: {} };
window.HSE_S13.scenarios["warehouse-summer-shift"] = {
  id: "warehouse-summer-shift",
  label: "Warehouse — summer day shift",
  context: "A picker on an 8-hour summer day shift in a high-bay warehouse with limited airflow.",
  shiftMinutes: 480,

  heat: {
    ambientTemp: { min: 22, max: 40, default: 32, unit: "°C" },
    humidity: { min: 20, max: 80, default: 55, unit: "%" },
    workload: { min: 1, max: 5, default: 3 },
    heatCoef: 0.45,
    decayMin: 90,
    earlyWarningThreshold: 38.0,
    symptomThreshold: 38.5,
    medicationBiasC: 0.4
  },
  fatigue: {
    hoursAwake: { min: 4, max: 20, default: 8 },
    shiftStartHour: { min: 0, max: 23, default: 7 },
    consecutiveNights: { min: 0, max: 6, default: 0 }
  },

  callouts: {
    predictiveLead: "The wearable's predictive alert is set below the symptom-onset temperature on purpose — it is meant to trigger a rest break before anyone feels unwell, not confirm what they already feel.",
    hrLimitation: "Toggle the medication flag. A heart-rate-based wearable can under-read physiological strain for a worker on certain medications — the alert fires later, or not at all, while the true core temperature keeps climbing. That is a real, documented limitation of HR-based heat-strain estimates.",
    fatigueModel: "The fatigue curve is a simplified illustration — real biomathematical fatigue models (e.g. SAFTE/FAST) are validated tools, not a formula on a training slide. Treat the band as a discussion prompt, not a certified risk score.",
    interpretWithCare: "Independent fatigue statistics (e.g. NSC figures linking fatigue to a meaningful share of injuries) are population averages — they say fatigue matters, not that this specific worker will be involved in an incident today.",
    surveillance: "A wearable that reports physiological data to a supervisor is a surveillance tool as well as a safety one. Worker consent, data ownership and what happens to the data matter as much as the alert threshold."
  },
  notes: {
    what: "Two independent estimates run over the same shift: a heat-strain model predicting core temperature from ambient conditions and workload, and a fatigue model predicting error likelihood from the shift's timing against the body clock and hours awake.",
    heatMath: "Core temperature rises along a saturating curve toward a ceiling set by ambient temperature, humidity and workload. The wearable's predictive alert fires at a lower temperature than true symptom onset — by design, that's the lead time. A medication-affected HR reading is modelled as a constant offset that delays or suppresses the wearable's alert without changing the true curve.",
    fatigueMath: "Error likelihood combines a circadian term (peaking in the pre-dawn window of circadian low), hours awake, and consecutive night shifts — a simplified illustrative model, not a validated one.",
    real: "Authored: the slider ranges, the heat-model coefficient, both temperature thresholds, the medication bias size. Live and real: the core-temperature curve, both crossing times, the lead time, the fatigue score curve, and the risk band."
  }
};
