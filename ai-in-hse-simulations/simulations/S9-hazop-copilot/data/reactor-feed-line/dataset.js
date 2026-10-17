/* ============================================================================
   S9 dataset — "reactor-feed-line"
   An AI-assisted HAZOP: pick a deviation, the co-pilot proposes causes,
   consequences and expected safeguards. The team's own additions — always
   something from this site's maintenance log, audits or near-misses — are
   revealed alongside for contrast.

   AUTHORED: every deviation's causes/consequences/safeguards/site-specific
   catch. LIVE AND REAL: your verification checklist state, your own added
   entries, the review gate, and the running worksheet + tallies.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S9 = window.HSE_S9 || { scenarios: {} };
window.HSE_S9.scenarios["reactor-feed-line"] = {

  id: "reactor-feed-line",
  label: "Reactor R-101 — feed line",
  node: "Reactor R-101 — feed line from Tank T-201",
  nodeContext: "Continuous stirred-tank reactor R-101 (exothermic esterification). Feed runs T-201 -> pump P-201 -> control valve FCV-101 -> reactor. Normal feed 12 m3/h at 35C.",

  screenedOut: [
    { gw: "Reverse", param: "Flow", reason: "A check valve excludes any credible reverse-flow path from the reactor back to T-201 - screened out." },
    { gw: "More", param: "Level", reason: "This node is a line, not a vessel - level is not a meaningful parameter here (it belongs to the reactor-vessel node) - screened out." }
  ],

  deviations: [
    {
      id: "no-flow", guideWord: "No / Not", parameter: "Flow", statement: "No feed flow to the reactor",
      aiCauses: [
        { text: "Feed pump P-201 trips or fails to start" },
        { text: "Manual isolation valve V-12 left closed after maintenance" },
        { text: "Control valve FCV-101 fails closed" },
        { text: "Tank T-201 runs empty / suction strainer blocked" },
        { text: "Relief valve PSV-105 lifts", reviewFlag: true, flagNote: "PSV lifting relieves pressure — it does not stop flow. A pattern-matched but wrong fit for THIS deviation; the team should reject it." }
      ],
      aiConsequences: [
        { text: "Reactor runs feed-starved; if the step is self-heating, the temperature-control assumptions change" },
        { text: "Downstream batch delayed / product off-spec" },
        { text: "A low-flow condition can go unnoticed without a working alarm" }
      ],
      aiSafeguards: [
        { text: "Low-flow alarm on FI-101", status: "present-unverified", note: "Logged as installed; last calibration date not in this data set" },
        { text: "Reactor low-level trip (stops agitator/heating if level falls too far)", status: "present-verified" },
        { text: "Standby feed pump P-201B", status: "missing", note: "Design shows a single feed pump — no installed spare" }
      ],
      humanAdds: {
        causes: ["P-201 has a documented history of seal failures in cold weather — three trips in the last two winters, per the maintenance log."],
        safeguards: ["FI-101's low-flow alarm was found during the last audit to route to a panel that is not permanently manned on night shift — present on paper, not verified effective."],
        summary: "Neither fact lives in a generic incident corpus — both come from this site's own maintenance and audit records."
      }
    },
    {
      id: "more-flow", guideWord: "More", parameter: "Flow", statement: "Feed flow rate higher than design",
      aiCauses: [
        { text: "FCV-101 fails open / sticks open" },
        { text: "Operator sets the manual feed rate above the SOP limit" },
        { text: "Upstream pressure surge during a T-201 pump changeover" }
      ],
      aiConsequences: [
        { text: "Exotherm accelerates faster than cooling can remove heat — runaway potential" },
        { text: "Reactor level rises toward the high-level trip" },
        { text: "Off-spec product from reduced residence time" }
      ],
      aiSafeguards: [
        { text: "High-flow alarm on FI-101", status: "present-verified" },
        { text: "Reactor high-temperature trip (isolates feed, dumps to cooling)", status: "present-verified" },
        { text: "FCV-101 fail-safe close on air failure", status: "present-unverified", note: "Design intent recorded; field confirmation of the fail-safe action is not in this data" }
      ],
      humanAdds: {
        causes: ["During the last two campaign changeovers, operators have manually overridden the feed-rate ramp to catch up on schedule — a known informal practice not written into the SOP."],
        safeguards: [],
        summary: "A generic pass has no way to know about an informal workaround your own operators use under schedule pressure."
      }
    },
    {
      id: "more-temp", guideWord: "More", parameter: "Temperature", statement: "Feed temperature higher than design",
      aiCauses: [
        { text: "Upstream heater controller TIC-050 fault (overheats the feed)" },
        { text: "Heat exchanger E-201 fouled on the utility side, losing normal pre-cooling" },
        { text: "Wrong batch of pre-heated feed routed from a shared header" }
      ],
      aiConsequences: [
        { text: "Faster reaction onset — less time to respond before the exotherm accelerates" },
        { text: "Possible vapour flash in the feed line if near the boiling point" }
      ],
      aiSafeguards: [
        { text: "Feed temperature high alarm (TI-102)", status: "present-verified" },
        { text: "Reactor cooling jacket automatic ramp-up on high feed temperature", status: "missing", note: "Cooling is manually adjusted; no automatic link from feed temperature to jacket duty" }
      ],
      humanAdds: {
        causes: ["The shared pre-heat header also feeds a second reactor train — a valve line-up error on that train has twice sent hot feed to R-101 by mistake."],
        safeguards: [],
        summary: "A cross-connection between two trains is a site-specific piping reality no generic 'feed too hot' cause list would surface."
      }
    },
    {
      id: "less-pressure", guideWord: "Less", parameter: "Pressure", statement: "Feed line pressure lower than design",
      aiCauses: [
        { text: "Pump P-201 cavitation / partial loss of suction head" },
        { text: "Partially blocked suction strainer" },
        { text: "Line leak upstream of FCV-101" }
      ],
      aiConsequences: [
        { text: "Reduced / erratic feed flow — the control valve struggles to hold setpoint" },
        { text: "Possible air ingress at a leak point if the line runs sub-atmospheric" }
      ],
      aiSafeguards: [
        { text: "Suction pressure low alarm (PI-030)", status: "present-unverified", note: "Alarm exists; setpoint last-review date is not in this data" },
        { text: "Strainer differential-pressure indicator", status: "missing", note: "No DP instrument fitted across the suction strainer in the current design" }
      ],
      humanAdds: {
        causes: ["The suction strainer was found significantly fouled at the last two shutdowns, despite the design duty assuming clean feed — feed quality from T-201 has been trending worse since a supplier change."],
        safeguards: [],
        summary: "A trend across the last two shutdowns is exactly the kind of pattern a site's own maintenance history reveals that a generic model has never seen."
      }
    },
    {
      id: "as-well-as", guideWord: "As Well As", parameter: "Composition", statement: "An additional, unintended material is fed together with the normal feed",
      aiCauses: [
        { text: "Cross-connection through a shared header valve left open" },
        { text: "Contaminated tanker delivery into T-201" },
        { text: "Carryover from an upstream washing/rinse step not fully drained" }
      ],
      aiConsequences: [
        { text: "Off-spec / unstable reaction chemistry, possible unexpected exotherm" },
        { text: "Contaminant fouls downstream equipment" }
      ],
      aiSafeguards: [
        { text: "Incoming delivery sampling and certificate-of-analysis check", status: "present-verified" },
        { text: "Line-up verification (permit) before header valve operations", status: "present-unverified", note: "Procedure exists; adherence is not confirmed in this data" },
        { text: "In-line composition analyser on the feed", status: "missing" }
      ],
      humanAdds: {
        causes: ["The shared header's valve line-up card has been signed off from memory rather than a physical walk-down on at least one occasion, per a recent near-miss report."],
        safeguards: [],
        summary: "A near-miss report is local, recent and specific — entirely outside a generic model's training."
      }
    }
  ],

  callouts: {
    breadth: "The co-pilot pulled together plausible causes, consequences and expected safeguards for this deviation in seconds, drawn from a wide base of comparable process HAZOPs — coverage a team would otherwise build slowly from memory.",
    localKnowledge: "Every one of the human team's additions came from THIS site's own maintenance log, audit findings or a near-miss report. None of it exists anywhere a generic model could have learned it.",
    narrowSpace: "A HAZOP deviation has a bounded set of credible causes, consequences and safeguard types — that structure is why this kind of AI assistance carries much lower hallucination risk than free-text generation. It is not zero risk: one suggested cause here didn't actually fit the deviation.",
    verifyNotIdentify: "Listing a safeguard is not the same as confirming it works. 'Present' still needs a status — verified, unverified, or missing — and the co-pilot can only ever report the first two from what someone already logged.",
    stillNeedsTheRoom: "This is a faster starting checklist for the HAZOP chair and scribe, not a HAZOP in a box. The session still needs a chair, a scribe, the P&ID in front of the team, and the people who run the plant."
  },
  notes: {
    what: "For a chosen node and deviation, the co-pilot proposes causes, consequences and the safeguards you would typically expect — the same categories a HAZOP worksheet already uses.",
    credible: "Only credible guide-word / parameter combinations are worked through here; a couple of screened-out combinations are shown for contrast.",
    gate: "A deviation cannot be marked reviewed until every safeguard has a verified/actioned status, any flagged AI suggestion has been accepted or rejected, and the team has looked at what a site team caught.",
    real: "Authored: the deviation content — causes, consequences, safeguards, the site-specific catches. Live and real: your checklist state, your own added entries, the running worksheet and tallies."
  }
};
