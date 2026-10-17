/* ============================================================================
   S12 dataset — "tank-farm"
   Same anomaly-vs-setpoint pattern at a tank-farm dip-point: a slow seal leak
   raises local vapour while tank level and a background reading stay
   unrelated (decoys). Authored channel parameters; live traces, baseline
   stats, anomaly score, first-crossing times, lead time.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S12 = window.HSE_S12 || { scenarios: {} };
window.HSE_S12.scenarios["tank-farm"] = {
  id: "tank-farm",
  label: "Tank farm dip-point",
  context: "A vapour sensor near a tank-farm dip-point. Tank level and a background reading are decoys — unrelated to this failure mode.",
  channels: [
    { key: "vapour", label: "Vapour concentration (ppm)", baseline: 8, noiseSd: 0.7, rampPerMin: 0.9 },
    { key: "tankLevel", label: "Tank level (relative, decoy)", baseline: 60, noiseSd: 1.4, rampPerMin: 0 },
    { key: "background", label: "Background reading (relative, decoy)", baseline: 0, noiseSd: 0.5, rampPerMin: 0 }
  ],
  minutes: 150,
  baselineWindow: 30,
  leakStart: { min: 20, max: 120, default: 40, step: 5 },
  leakRate: { min: 0, max: 3, default: 1, step: 0.1 },
  sensitivity: { min: 1.0, max: 5.0, default: 2.5, step: 0.1 },
  setpoint: { min: 15, max: 100, default: 45, step: 5 },
  wind: { speedDefault: 6, dirDefault: 135 },

  callouts: {
    earlyWarning: "The anomaly detector doesn't wait for the vapour sensor alone to breach its limit — it asks whether the whole pattern still looks like normal operation, and can flag a developing seal leak while vapour is still well under the fixed alarm setpoint.",
    decoyChannel: "Tank level and the background reading never move during this leak. A single-sensor alarm would never watch them; the multivariate detector's baseline still benefits from knowing what 'normal' looks like across every channel.",
    needsGoodBaseline: "The anomaly score is only as good as the baseline window it was learned from. Too short, and normal variation gets mistaken for an anomaly; too long, and it can quietly absorb a slow leak into 'normal.'",
    notPhysics: "The dispersion sketch on this page is illustrative, not a validated model — real consequence modelling needs a proper dispersion tool and real weather data.",
    stillHardware: "This does not replace the fixed hardware alarm and trip. It is an earlier, softer warning that buys time to investigate before the hard limit is reached."
  },
  notes: {
    what: "Three sensors are watched at once. A fixed setpoint alarm fires the first minute vapour crosses its limit. An anomaly detector learns 'normal' from an early baseline window and fires when the combined pattern across all channels drifts far enough from it — often earlier.",
    math: "Each channel is generated as noise around a baseline, plus a ramp after the leak start (scaled by the leak-rate slider). The anomaly score at each minute is the root-mean-square of each channel's distance from its baseline mean, in standard deviations. It must clear the sensitivity threshold for two consecutive minutes to fire.",
    real: "Authored: channel baselines, noise levels, ramp rates, which channels the leak affects. Live and real: the seeded sensor traces, the baseline statistics learned from the pre-leak window, the anomaly score every minute, both detectors' first-crossing times, and the lead time between them."
  }
};
