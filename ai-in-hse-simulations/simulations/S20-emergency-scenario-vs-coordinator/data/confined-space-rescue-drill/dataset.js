/* ============================================================================
   S20 dataset — "confined-space-rescue-drill"
   Same mechanic as tank-fire-drill (seeded generator + lagging/erring AI
   summary against a scripted raw feed), but this timeline's summary panel
   states an outright wrong casualty count for a few minutes, not just a
   stale one — a different, worse failure mode. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S20 = window.HSE_S20 || { scenarios: {} };
window.HSE_S20.scenarios["confined-space-rescue-drill"] = {
  id: "confined-space-rescue-drill",
  label: "Confined space rescue drill",
  context: "Generate a randomised drill scenario brief, then step through a live incident timeline and watch the AI summary panel state an outright wrong casualty count for several minutes before it self-corrects.",
  generator: {
    hazardTypes: ["Confined space gas exposure", "Vessel entry collapse", "Excavation entrapment", "Elevated rescue — fall arrest failure", "Multi-casualty chemical exposure"],
    locations: ["Vessel V-9", "Basement sump chamber", "Storage silo access shaft", "Trench excavation, North Yard", "Tank farm valve pit"],
    complicatingFactors: ["Limited SCBA cylinders on site", "Access hatch partially obstructed", "Radio dead zone inside the vessel", "Rescue team on a 20-minute response delay", "Concurrent contractor mobilisation nearby"],
    casualtyCounts: ["0", "1", "2", "3", "multiple (unknown)"],
    weatherConditions: ["Clear, 22°C", "Heavy rain", "High wind", "Extreme heat, 38°C", "Fog"]
  },
  timeline: {
    events: [
      { t: 0,  text: "Control room: gas alarm inside Vessel V-9, entry team on standby outside." },
      { t: 1,  text: "Entry team reports one worker down inside V-9, non-responsive." },
      { t: 3,  text: "Rescue team suiting up in SCBA, vessel isolated and purge initiated." },
      { t: 5,  text: "Entry team leader confirms ONE casualty inside, breathing but unresponsive." },
      { t: 7,  text: "Second entry team member reports feeling light-headed, exits vessel immediately, recovers in fresh air." },
      { t: 9,  text: "Rescue team enters, casualty extracted, CPR commenced at vessel mouth." },
      { t: 11, text: "Casualty regains consciousness, breathing unaided, being prepared for ambulance transfer." },
      { t: 13, text: "Ambulance on scene, casualty handed over, stable vital signs." },
      { t: 16, text: "Vessel re-isolated, entry suspended pending full investigation." }
    ],
    checkpoints: [
      { afterEventIndex: 1, isAccurate: true, text: "Gas alarm at Vessel V-9, entry team investigating. No casualties confirmed yet." },
      { afterEventIndex: 3, isAccurate: false, text: "One worker found unresponsive inside V-9. Rescue team preparing entry. TWO casualties reported inside the vessel." },
      { afterEventIndex: 5, isAccurate: true, text: "Rescue team extracted the casualty; CPR in progress. An entry team member also required assistance after feeling unwell but has recovered. One casualty confirmed inside the vessel — an earlier report of a second casualty was not correct." },
      { afterEventIndex: 8, isAccurate: true, text: "Incident resolved. One casualty extracted and stabilised, transferred to ambulance in stable condition. Vessel re-isolated pending investigation. The earlier report of a second casualty was an error, corrected once the extraction team confirmed the vessel was clear." }
    ]
  },
  callouts: {
    breadth: "app.js multiplies the option-list lengths below to get the number of distinct drill briefs this generator can produce — far more variety than a training calendar built from a handful of hand-written scenarios, for a fraction of the writing effort.",
    lagMoment: "Step to t=5min and watch the summary panel claim TWO casualties inside the vessel — the raw feed at that exact moment says ONE, clearly. The summary isn't just late here; it's wrong, and it stays wrong until t=9min, four minutes during which a commander reading only the summary would be planning a two-casualty rescue.",
    notOmniscient: "This isn't a lag — the summary invented a number the raw feed never reported. Nothing forces a summarising system's confidence to track its accuracy; it can state a wrong number just as fluently as a correct one.",
    stillMisses: "The self-correction at t=9min is the encouraging part — a real system that catches its own errors as more context arrives is better than one that doesn't. But the correction only helps the *next* reader; anyone who acted on the t=5min summary already acted on wrong information.",
    humanCall: "The raw feed is the primary channel during a live incident, always. A summary panel — AI-generated or otherwise — is a convenience for catching up, not a substitute for someone monitoring the feed itself in real time."
  },
  notes: {
    what: "A seeded drill-brief generator (BEFORE) and a scripted, timestamped live-incident timeline with an AI summary panel that states a wrong casualty count for several minutes (DURING).",
    math: "Generator: a seeded PRNG (mulberry32, seeded from scenario id + seed number) picks one option from each authored list — reproducible, re-rollable, not pre-written prose. Distinct combinations = product of the 5 list lengths. Timeline: at playback position `currentEventIndex`, the active summary checkpoint is the last one with `afterEventIndex <= currentEventIndex`; events-behind = currentEventIndex − activeCheckpoint.afterEventIndex; minutes-behind = current event's t − activeCheckpoint's covered event's t. An `isAccurate:false` checkpoint is flagged live whenever it's the active one.",
    real: "Authored: the five generator option lists, the raw-feed timeline, and the summary checkpoints (including which are accurate). Live and real: which combination the generator rolls, the combinatorics count, and the events/minutes-behind gap and accuracy flag at every playback position."
  }
};
