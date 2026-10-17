/* ============================================================================
   S20 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   BEFORE panel: app.js seeds a PRNG from (scenario id, seed number) and picks
   one option from each generator.* list, live — real randomness, not
   pre-written prose.
   DURING panel: app.js finds, at the current playback position, the latest
   checkpoint whose afterEventIndex <= currentEventIndex, and computes a real
   events-behind / minutes-behind gap against it, live.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S20 = window.HSE_S20 || { scenarios: {} };
window.HSE_S20.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO",
  generator: {
    hazardTypes: ["TODO", "TODO", "TODO", "TODO", "TODO"],
    locations: ["TODO", "TODO", "TODO", "TODO", "TODO"],
    complicatingFactors: ["TODO", "TODO", "TODO", "TODO", "TODO"],
    casualtyCounts: ["0", "1", "2", "3", "multiple (unknown)"],
    weatherConditions: ["Clear, 22°C", "Heavy rain", "High wind", "Extreme heat, 38°C", "Fog"]
    /* 5 lists, each 4-6 options */
  },
  timeline: {
    events: [
      { t: 0, text: "TODO — opening event." }
      /* 8-9 total, timestamps in minutes, roughly evenly spaced. IMPORTANT: include one clearly
         urgent/life-safety event partway through (a missing person, a wrong casualty count, a
         sudden hazard change) that the checkpoints deliberately do NOT reflect until several
         minutes later — that gap is the whole teaching point. */
    ],
    checkpoints: [
      { afterEventIndex: 1, isAccurate: true, text: "TODO — summary as of event 1." }
      /* 3-4 total, sparser than events. At least one should span across your urgent event above
         (i.e. its afterEventIndex is BEFORE the urgent event, and the NEXT checkpoint is well
         after it) so the summary panel visibly lags at the moment it matters. Optionally set
         isAccurate:false on one checkpoint to demonstrate an outright wrong claim instead of (or
         alongside) lag — see confined-space-rescue-drill for that pattern. */
    ]
  },
  callouts: {
    breadth: "app.js multiplies the option-list lengths below to get the number of distinct drill briefs this generator can produce.",
    lagMoment: "TODO — name the exact timestamp where the summary panel is behind (or wrong), and what a coordinator would have missed by trusting it alone.",
    notOmniscient: "The summary panel only knows what it's been told to reflect, and only as of its last refresh.",
    stillMisses: "TODO",
    humanCall: "The raw feed is the primary channel during a live incident, always. A summary panel is a convenience for catching up, not a substitute for monitoring the feed itself."
  },
  notes: {
    what: "TODO",
    math: "Generator: seeded PRNG picks one option per list; distinct combinations = product of list lengths. Timeline: active checkpoint = last one with afterEventIndex <= currentEventIndex; events/minutes-behind computed live.",
    real: "Authored: generator option lists, raw-feed timeline, summary checkpoints. Live and real: the generator's roll, the combinatorics count, and the lag/accuracy state at every playback position."
  }
};
