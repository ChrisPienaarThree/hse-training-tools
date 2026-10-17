/* ============================================================================
   S12 dataset — "compressor-house"
   Three sensors on one compressor package; a developing seal leak raises gas
   concentration and drops line pressure while ambient temperature stays flat
   (a decoy channel). A multivariate anomaly detector is compared against the
   fixed hardware alarm setpoint on gas alone.

   AUTHORED: channel baselines/noise/ramp rates, the leak-affected channels.
   LIVE AND REAL: the seeded sensor traces, the baseline statistics learned
   from the pre-leak window, the anomaly score every minute, both detectors'
   first-crossing times, and the lead time between them.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S12 = window.HSE_S12 || { scenarios: {} };
window.HSE_S12.scenarios["compressor-house"] = {
  id: "compressor-house",
  label: "Compressor house",
  context: "Three sensors on a compressor package: gas concentration (ppm), line pressure (relative) and ambient temperature (relative, unaffected by this failure mode).",
  /* convention: channels[0] is the one the fixed hardware setpoint watches */
  channels: [
    { key: "gas", label: "Gas concentration (ppm)", baseline: 5, noiseSd: 0.6, rampPerMin: 1.2 },
    { key: "pressure", label: "Line pressure (relative)", baseline: 100, noiseSd: 0.8, rampPerMin: -0.5 },
    { key: "temperature", label: "Ambient temperature (relative, decoy)", baseline: 20, noiseSd: 0.6, rampPerMin: 0 }
  ],
  minutes: 150,
  baselineWindow: 30,
  leakStart: { min: 20, max: 120, default: 50, step: 5 },
  leakRate: { min: 0, max: 3, default: 1, step: 0.1 },
  sensitivity: { min: 1.0, max: 5.0, default: 2.5, step: 0.1 },
  setpoint: { min: 20, max: 120, default: 60, step: 5 },
  wind: { speedDefault: 4, dirDefault: 225 },

  callouts: {
    earlyWarning: "The anomaly detector doesn't wait for one sensor to breach its fixed limit — it asks whether the WHOLE pattern still looks like normal operation, and can flag a developing leak while gas concentration is still well under the hardware alarm setpoint.",
    decoyChannel: "The temperature channel never moves during this leak. A single-sensor alarm would never watch it; the multivariate detector's baseline still benefits from knowing what 'normal' looks like across every channel, including the ones that don't move.",
    needsGoodBaseline: "The anomaly score is only as good as the baseline window it was learned from. Too short, and normal variation gets mistaken for an anomaly; too long, and it can quietly absorb a slow leak into 'normal.'",
    notPhysics: "The dispersion sketch on this page is illustrative, not a validated model — real consequence modelling needs a proper dispersion tool and real weather data.",
    stillHardware: "This does not replace the fixed hardware alarm and trip. It is an earlier, softer warning that buys time to investigate before the hard limit is reached."
  },
  notes: {
    what: "Three sensors are watched at once. A fixed setpoint alarm fires the first minute gas concentration crosses its limit. An anomaly detector learns 'normal' from an early baseline window and fires when the combined pattern across all channels drifts far enough from it — often earlier.",
    math: "Each channel is generated as noise around a baseline, plus a ramp after the leak start (scaled by the leak-rate slider). The anomaly score at each minute is the root-mean-square of each channel's distance from its baseline mean, in standard deviations. It must clear the sensitivity threshold for two consecutive minutes to fire, to avoid a single noise spike triggering it.",
    real: "Authored: channel baselines, noise levels, ramp rates, which channels the leak affects. Live and real: the seeded sensor traces, the baseline statistics learned from the pre-leak window, the anomaly score every minute, both detectors' first-crossing times, and the lead time between them."
  }
};
