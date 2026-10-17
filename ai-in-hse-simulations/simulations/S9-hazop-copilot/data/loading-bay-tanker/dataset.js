/* ============================================================================
   S9 dataset — "loading-bay-tanker"
   Same AI-assisted HAZOP pattern applied to a road-tanker loading bay for a
   flammable solvent, instead of a process reactor. Authored deviation
   content; live checklist, additions, review gate and worksheet.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S9 = window.HSE_S9 || { scenarios: {} };
window.HSE_S9.scenarios["loading-bay-tanker"] = {

  id: "loading-bay-tanker",
  label: "Tanker loading arm — Bay 3",
  node: "Tanker loading arm — Bay 3 (Grade A solvent, flammable, Class II)",
  nodeContext: "Road-tanker bottom-loading bay. Loading arm LA-3, flow via FCV-301, tanker bonded via earth cable EB-3, independent high-level trip LSHH-301.",

  screenedOut: [
    { gw: "Reverse", param: "Flow", reason: "A check valve in the loading arm prevents back-flow from the tanker into the site - screened out." },
    { gw: "Less", param: "Temperature", reason: "Ambient-temperature service; a temperature deviation here has no credible safety consequence - screened out." }
  ],

  deviations: [
    {
      id: "no-flow", guideWord: "No / Not", parameter: "Flow", statement: "Loading does not start, or stops unexpectedly",
      aiCauses: [
        { text: "FCV-301 fails closed" },
        { text: "Loading arm coupling not fully engaged (interlock holds)" },
        { text: "Tanker earthing not verified, so the start interlock blocks loading" }
      ],
      aiConsequences: [
        { text: "Delivery delay" },
        { text: "Driver attempts to bypass the interlock under time pressure" }
      ],
      aiSafeguards: [
        { text: "Loading interlock requires earth continuity + coupling confirmed before flow starts", status: "present-verified" },
        { text: "Dry-break coupling", status: "present-verified" }
      ],
      humanAdds: {
        causes: ["Drivers on the afternoon run have been observed clipping the earth cable to a painted, non-conductive point on some trailers — visually connected, not electrically bonded."],
        safeguards: ["The earth-continuity monitor's fail state was found wired to fail SAFE on only one of the two bays during the last electrical audit — Bay 3 was the one not yet corrected."],
        summary: "Both are field observations from this site's own audits and driver-behaviour records."
      }
    },
    {
      id: "more-level", guideWord: "More", parameter: "Level", statement: "Tanker compartment overfilled",
      aiCauses: [
        { text: "High-level trip LSHH-301 fails to actuate" },
        { text: "Loading continued after the trip via a manual override" },
        { text: "Wrong compartment capacity assumed for a non-standard tanker" }
      ],
      aiConsequences: [
        { text: "Product spill / overfill through the vent, vapour release" },
        { text: "A static-charged spill during a flammable-atmosphere event" }
      ],
      aiSafeguards: [
        { text: "High-level trip LSHH-301, independent of the flow controller", status: "present-verified" },
        { text: "Overfill alarm audible in the control room", status: "present-unverified", note: "Alarm exists; last function-test date not in this data" },
        { text: "Compartment-capacity look-up table at the loading point", status: "missing" }
      ],
      humanAdds: {
        causes: ["Two third-party haulage companies run non-standard compartment splits that don't match the site's default capacity table — the mismatch has caused a near-miss overfill once in the last year."],
        safeguards: [],
        summary: "Which hauliers run non-standard tankers is knowledge that lives with the loading-bay team, not in a generic model."
      }
    },
    {
      id: "other-than", guideWord: "Other Than", parameter: "Composition", statement: "The wrong product is loaded, or it is loaded into the wrong tanker",
      aiCauses: [
        { text: "Hose/arm misconnected to the wrong product line" },
        { text: "Tanker mis-identified against the delivery note" },
        { text: "Two similar-looking products stored adjacent in the tank farm" }
      ],
      aiConsequences: [
        { text: "Product contamination at the customer site" },
        { text: "Potential reaction if the two products are chemically incompatible" }
      ],
      aiSafeguards: [
        { text: "Colour-coded, keyed couplings per product", status: "present-verified" },
        { text: "Delivery-note cross-check by the loading operator", status: "present-unverified", note: "Procedural step; adherence not confirmed in this data" }
      ],
      humanAdds: {
        causes: ["A temporary hose extension used during a recent tank-farm modification does not carry the keyed coupling, and was still in use two weeks after the modification was meant to be reverted."],
        safeguards: [],
        summary: "Temporary modifications outliving their intended duration are a classic, site-specific process-safety trap no generic pattern library will know about."
      }
    },
    {
      id: "as-well-as", guideWord: "As Well As", parameter: "Ignition source", statement: "An ignition source is present as well as a flammable atmosphere",
      aiCauses: [
        { text: "Static discharge from splash-filling (top-loading without a dip pipe)" },
        { text: "A vehicle not switched off, or other running plant nearby" },
        { text: "Mobile-phone use in the loading bay" }
      ],
      aiConsequences: [
        { text: "Vapour-cloud ignition, fire, potential escalation to the tanker and the bay" }
      ],
      aiSafeguards: [
        { text: "Bottom-loading arm (avoids splash-filling)", status: "present-verified" },
        { text: "Bay signage + no-mobile-phone rule", status: "present-verified" },
        { text: "Vapour-return line to control the flammable atmosphere at the tanker vent", status: "missing" }
      ],
      humanAdds: {
        causes: ["Contractors working on an adjacent unit have twice been found using non-ATEX-rated tools within the bay's hazardous-area boundary during a shift changeover."],
        safeguards: [],
        summary: "Adjacent contractor activity crossing into a hazardous area is a live-site coordination issue, not a generic HAZOP cause."
      }
    },
    {
      id: "part-of", guideWord: "Part Of", parameter: "Bonding / earthing", statement: "The bonding/earthing connection is only partially made",
      aiCauses: [
        { text: "Earth clamp makes contact but continuity is marginal (corroded clamp jaws)" },
        { text: "Bonding cable damaged — partial conductor break" },
        { text: "Earth point on the tanker chassis painted over" }
      ],
      aiConsequences: [
        { text: "The continuity monitor may pass a marginal connection; static charge is not fully dissipated during loading" }
      ],
      aiSafeguards: [
        { text: "Continuity monitor with a numeric resistance readout, not just pass/fail", status: "missing", note: "The current system is pass/fail only" },
        { text: "Scheduled inspection of earth clamps", status: "present-unverified", note: "Schedule exists; completion record not in this data" }
      ],
      humanAdds: {
        causes: ["The pass/fail continuity monitor has a known dead-band where corroded clamps still read 'pass' — flagged by an electrician informally, but never raised as a modification request."],
        safeguards: [],
        summary: "Informally-flagged instrument dead-bands are exactly the kind of tribal knowledge a HAZOP co-pilot cannot access unless someone in the room says it out loud."
      }
    }
  ],

  callouts: {
    breadth: "The co-pilot pulled together plausible causes, consequences and expected safeguards for this deviation in seconds, drawn from a wide base of comparable loading-bay HAZOPs and incidents.",
    localKnowledge: "Every human addition here came from this bay's own audits, near-miss reports or what the loading-bay team has actually seen drivers and contractors do. None of it exists in a generic corpus.",
    narrowSpace: "A HAZOP deviation has a bounded set of credible causes, consequences and safeguard types — that structure keeps hallucination risk far lower than free-text generation. It is not zero: verify every suggestion, don't just accept the list.",
    verifyNotIdentify: "'Keyed couplings' and 'high-level trip' being listed does not mean they are correctly maintained today. Present still needs a status: verified, unverified, or missing.",
    stillNeedsTheRoom: "This speeds up the chair and scribe's starting checklist. It does not replace the chair, the scribe, the loading procedure in hand, or the team that actually works the bay."
  },
  notes: {
    what: "For a chosen node and deviation, the co-pilot proposes causes, consequences and the safeguards you would typically expect — the same categories a HAZOP worksheet already uses.",
    credible: "Only credible guide-word / parameter combinations are worked through here; a couple of screened-out combinations are shown for contrast.",
    gate: "A deviation cannot be marked reviewed until every safeguard has a verified/actioned status, any flagged AI suggestion has been accepted or rejected, and the team has looked at what a site team caught.",
    real: "Authored: the deviation content — causes, consequences, safeguards, the site-specific catches. Live and real: your checklist state, your own added entries, the running worksheet and tallies."
  }
};
