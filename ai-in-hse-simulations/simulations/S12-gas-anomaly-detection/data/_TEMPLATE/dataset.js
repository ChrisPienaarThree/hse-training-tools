/* ============================================================================
   S12 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   channels[0] is the one the fixed setpoint alarm watches. app.js computes,
   live: seeded traces (baseline + noise + a ramp after leakStart scaled by
   leakRate), baseline mean/sd from [0,baselineWindow), an RMS-z anomaly score
   every minute, the setpoint's first crossing on channels[0], the anomaly
   detector's first 2-consecutive-minute crossing, and the lead time between them.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S12 = window.HSE_S12 || { scenarios: {} };
window.HSE_S12.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO — one or two sentences: what these sensors watch and what fails.",
  channels: [
    { key: "primary", label: "TODO — the alarmed channel, with units", baseline: 5, noiseSd: 0.6, rampPerMin: 1.2 },
    { key: "secondary", label: "TODO — a correlated channel", baseline: 100, noiseSd: 0.8, rampPerMin: -0.5 },
    { key: "decoy", label: "TODO — a channel unaffected by this failure (decoy)", baseline: 20, noiseSd: 0.6, rampPerMin: 0 }
  ],
  minutes: 150,
  baselineWindow: 30,
  leakStart: { min: 20, max: 120, default: 50, step: 5 },
  leakRate: { min: 0, max: 3, default: 1, step: 0.1 },
  sensitivity: { min: 1.0, max: 5.0, default: 2.5, step: 0.1 },
  setpoint: { min: 20, max: 120, default: 60, step: 5 },
  wind: { speedDefault: 4, dirDefault: 225 },
  callouts: {
    earlyWarning: "TODO",
    decoyChannel: "TODO",
    needsGoodBaseline: "The anomaly score is only as good as the baseline window it was learned from. Too short, and normal variation gets mistaken for an anomaly; too long, and it can quietly absorb a slow leak into 'normal.'",
    notPhysics: "The dispersion sketch on this page is illustrative, not a validated model — real consequence modelling needs a proper dispersion tool and real weather data.",
    stillHardware: "This does not replace the fixed hardware alarm and trip. It is an earlier, softer warning that buys time to investigate before the hard limit is reached."
  },
  notes: {
    what: "TODO",
    math: "Each channel is generated as noise around a baseline, plus a ramp after the leak start (scaled by the leak-rate slider). The anomaly score is the RMS of each channel's distance from its baseline mean, in standard deviations, requiring two consecutive minutes above threshold to fire.",
    real: "Authored: channel baselines, noise levels, ramp rates, which channels the leak affects. Live and real: the seeded sensor traces, baseline statistics, the anomaly score, both detectors' first-crossing times, and the lead time between them."
  }
};
