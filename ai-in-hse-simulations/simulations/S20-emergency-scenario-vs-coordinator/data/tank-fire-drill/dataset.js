/* ============================================================================
   S20 dataset — "tank-fire-drill"
   BEFORE panel: a seeded template generator. app.js picks one option from
   each authored list below with a seeded PRNG — real randomness, reproducible
   by seed, not pre-written prose.
   DURING panel: an authored, timestamped raw-feed timeline plus sparser AI
   "summary checkpoints". app.js finds the latest checkpoint at or before the
   current playback position live — the lag between the raw feed and the
   summary panel is a real, computed gap, not scripted commentary.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S20 = window.HSE_S20 || { scenarios: {} };
window.HSE_S20.scenarios["tank-fire-drill"] = {
  id: "tank-fire-drill",
  label: "Tank fire drill",
  context: "Generate a randomised drill scenario brief, then step through a live incident timeline and watch how far the AI summary panel falls behind the raw feed at the moment it matters most.",
  generator: {
    hazardTypes: ["Tank fire", "Vapour cloud release", "Confined space collapse", "Multi-vehicle collision with fuel spill", "Structural collapse during turnaround"],
    locations: ["Tank Farm Bund 2", "Unit 8 Process Area", "Main Access Road", "Warehouse loading bay", "Contractor laydown yard"],
    complicatingFactors: ["High wind gusting 40km/h", "Night-time low visibility", "Access road partially blocked", "Radio dead zone in the area", "Concurrent public event nearby"],
    casualtyCounts: ["0", "1", "2", "3", "multiple (unknown)"],
    weatherConditions: ["Clear, 22°C", "Heavy rain", "High wind", "Extreme heat, 38°C", "Fog"]
  },
  timeline: {
    events: [
      { t: 0,  text: "Control room: high-level alarm on Tank T-14, no fire confirmed yet." },
      { t: 2,  text: "Field operator: smoke visible near T-14 roof vent." },
      { t: 4,  text: "Fire confirmed at T-14 roof seal. ERT mobilised." },
      { t: 6,  text: "Wind shifting toward Tank Farm Bund 2 access road." },
      { t: 8,  text: "ERT on scene, applying foam. One contractor reports minor smoke inhalation, self-evacuated." },
      { t: 11, text: "Second contractor found unaccounted for near T-14 — muster count short by one." },
      { t: 14, text: "Missing contractor located, was in a nearby break room, safe. Muster count now complete." },
      { t: 17, text: "Fire knocked down. Hot spots being monitored." },
      { t: 20, text: "All clear declared. Incident stood down to investigation phase." }
    ],
    /* afterEventIndex: the summary panel reflects events [0..afterEventIndex] and nothing newer,
       until the next checkpoint. isAccurate:false marks a checkpoint that misstates something
       (vs a merely-stale one, which is still accurate as far as it goes). */
    checkpoints: [
      { afterEventIndex: 2, isAccurate: true, text: "Fire alarm at Tank T-14, smoke confirmed, ERT responding. No injuries reported. Wind conditions not yet assessed." },
      { afterEventIndex: 4, isAccurate: true, text: "Fire at T-14 being fought with foam by ERT. One minor injury (smoke inhalation) reported and managed. Wind shifting toward the Bund 2 access road, may affect egress." },
      { afterEventIndex: 6, isAccurate: true, text: "Fire at T-14 controlled with foam. One minor injury managed. A brief muster discrepancy was identified and resolved — all personnel now accounted for. Wind continues from the north." },
      { afterEventIndex: 8, isAccurate: true, text: "Incident stood down. Fire at T-14 extinguished, one minor injury, muster discrepancy resolved, no fatalities. Investigation phase begins." }
    ]
  },
  callouts: {
    breadth: "app.js multiplies the option-list lengths below to get the number of distinct drill briefs this generator can produce — far more variety than a training calendar built from a handful of hand-written scenarios, for a fraction of the writing effort.",
    lagMoment: "Watch the events-behind counter as you step past the missing-contractor report at t=11min. The summary panel doesn't refresh until t=14min — by then the contractor has already been found. A coordinator watching only the summary panel would never have seen the muster discrepancy while it was still live.",
    notOmniscient: "The summary panel only knows what it's been told to reflect, and only as of its last refresh. It has no way to flag that something urgent just happened in the raw feed that it hasn't caught up to yet — the gap is invisible from inside the summary panel itself.",
    stillMisses: "Every summary checkpoint here happens to be accurate as far as it goes — it's just late. A summary that's both late AND wrong is a different, worse failure mode (see the confined-space-rescue-drill scenario).",
    humanCall: "The raw feed is the primary channel during a live incident, always. A summary panel — AI-generated or otherwise — is a convenience for catching up, not a substitute for someone monitoring the feed itself in real time."
  },
  notes: {
    what: "A seeded drill-brief generator (BEFORE) and a scripted, timestamped live-incident timeline with a lagging AI summary panel (DURING).",
    math: "Generator: a seeded PRNG (mulberry32, seeded from scenario id + seed number) picks one option from each authored list — reproducible, re-rollable, not pre-written prose. Distinct combinations = product of the 5 list lengths. Timeline: at playback position `currentEventIndex`, the active summary checkpoint is the last one with `afterEventIndex <= currentEventIndex`; events-behind = currentEventIndex − activeCheckpoint.afterEventIndex; minutes-behind = current event's t − activeCheckpoint's covered event's t. Both recomputed on every step/play tick.",
    real: "Authored: the five generator option lists, the raw-feed timeline, and the summary checkpoints (including which are accurate). Live and real: which combination the generator rolls, the combinatorics count, and the events/minutes-behind gap at every playback position."
  }
};
