/* ============================================================================
   S3 dataset — "hot-work-fire-watch"
   Same question asked with no source in the prompt vs with the procedure
   extract pasted in. Pre-authored. No model runs. Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S3 = window.HSE_S3 || { scenarios: {} };
window.HSE_S3.scenarios["hot-work-fire-watch"] = {

  id: "hot-work-fire-watch",
  label: "Hot-work fire watch (procedure HW-12)",

  question: "Per Hot Work Procedure HW-12, how long must a fire watch continue after hot work stops, who may act as the fire watch, and what happens after that period?",

  source: {
    title: "Hot Work Procedure HW-12 — Fire Watch Requirements   [FICTIONAL procedure, for demonstration only]",
    paragraphs: [
      "HW-12 sets the fire-watch requirements for permitted hot work. Permit issue, gas testing and equipment isolation are covered by HW-10 and HW-11.",
      "4.1  A fire watch shall be maintained continuously during hot work and for not less than 60 minutes after hot work has stopped.",
      "4.2  Following the fire-watch period, the work area shall be checked again by a competent person after a further 30 minutes, before the area is left unattended.",
      "4.3  The fire watch shall be a person trained in the use of the available fire-extinguishing equipment and in raising the alarm, and shall have no other duties during the watch.",
      "4.4  The fire-watch period shall be extended where the hot work involved concealed spaces or combustible construction, or where the permit issuer requires it."
    ],
    snippetParas: 3
  },

  ungrounded: {
    baseRate: ["~3–5% of claims (mainstream topic)", "~10–15% of claims", "up to ~27% of claims (niche topic)"],
    variants: [
      {
        familiarity: "Common topic — lots of generic hot-work guidance in training",
        claims: [
          { text: "A fire watch is required during the hot work and for a period afterwards.", cite: null, verdict: "supported",
            note: "Right in principle — but you cannot see which specifics below are also right." },
          { text: "Maintain the fire watch for at least 30 minutes after hot work finishes.", cite: null, verdict: "contradicts",
            note: "HW-12 says not less than 60 minutes (4.1). 30 minutes is a common figure from other regimes — wrong here." },
          { text: "This follows OSHA hot-work standard 1910.252.", cite: null, verdict: "fabricated",
            note: "Real standard, wrong reference: the question is about HW-12, and OSHA may not even apply in this jurisdiction. Cited to sound authoritative." },
          { text: "The fire watch must be a certified fire marshal.", cite: null, verdict: "unsupported",
            note: "4.3 requires a person trained in extinguisher use and raising the alarm — not a 'certified fire marshal'. Invented credential." },
          { text: "Once the watch ends, no further checks are needed.", cite: null, verdict: "contradicts",
            note: "4.2 requires a competent-person re-check 30 minutes later. This omission could leave a smouldering fire unattended." }
        ]
      },
      {
        familiarity: "Less common — unusual work / location",
        claims: [
          { text: "Keep a fire watch for 45 minutes after completion.", cite: null, verdict: "contradicts",
            note: "4.1 sets a 60-minute minimum. 45 is invented." },
          { text: "A follow-up inspection is carried out 2 hours later.", cite: null, verdict: "contradicts",
            note: "4.2 says a further 30 minutes, not 2 hours." },
          { text: "Any competent site worker can stand the fire watch.", cite: null, verdict: "partly",
            note: "'Trained' is closer than 'any worker', but 4.3 is specific (extinguisher use + raising the alarm + no other duties). The paraphrase drops the specifics." },
          { text: "The watch period is extended only for work at height.", cite: null, verdict: "contradicts",
            note: "4.4 lists concealed spaces, combustible construction, or the permit issuer's discretion — not work at height." },
          { text: "Per HW-12 clause 6, the fire watch may leave briefly to fetch equipment.", cite: null, verdict: "fabricated",
            note: "No such clause; 4.3 says the fire watch shall have NO other duties. Invented and contradictory." }
        ]
      },
      {
        familiarity: "Niche / obscure — little specific data",
        claims: [
          { text: "A 15-minute fire watch is sufficient for minor welding.", cite: null, verdict: "contradicts",
            note: "4.1 minimum is 60 minutes with no 'minor work' carve-out." },
          { text: "HW-12 clause 7.1 allows the fire watch to be waived for hot work lasting under 10 minutes.", cite: null, verdict: "fabricated",
            note: "Invented clause and invented exemption. Nothing in the procedure permits a waiver." },
          { text: "The post-watch check is done the next day by the permit issuer.", cite: null, verdict: "contradicts",
            note: "4.2: a competent person, after a further 30 minutes — not next day." },
          { text: "The fire watch can also act as the welder's assistant.", cite: null, verdict: "contradicts",
            note: "4.3: no other duties during the watch." },
          { text: "Extended watch periods are logged in the environmental register.", cite: null, verdict: "unsupported",
            note: "No such requirement in HW-12; invented administrative detail." }
        ]
      }
    ]
  },

  grounded: {
    full: [
      { text: "Maintain the fire watch continuously during the hot work and for not less than 60 minutes after it stops.", cite: 2, verdict: "supported", note: "¶2 (4.1), quoted." },
      { text: "After that 60-minute watch, a competent person re-checks the area a further 30 minutes later, before it is left unattended.", cite: 3, verdict: "supported", note: "¶3 (4.2)." },
      { text: "The fire watch must be trained in the available fire-extinguishing equipment and in raising the alarm, and must have no other duties during the watch.", cite: 4, verdict: "supported", note: "¶4 (4.3)." },
      { text: "Extend the fire-watch period for hot work involving concealed spaces or combustible construction, or where the permit issuer requires it.", cite: 5, verdict: "supported", note: "¶5 (4.4)." },
      { text: "The extract does not define 'competent person' or state what training the fire watch's role requires beyond 4.3 — that detail is outside this text.", cite: 3, verdict: "hedge", note: "States the boundary instead of inventing a credential." },
      { text: "Inference: 'no other duties during the watch' means the fire watch cannot also be the person doing the hot work or holding the permit — HW-12 implies this without saying it outright.", cite: 4, verdict: "inference", note: "Sensible reading, but a human should confirm it is how the site applies 4.3." }
    ],
    snippet: [
      { text: "Maintain the fire watch during the hot work and for not less than 60 minutes after it stops.", cite: 2, verdict: "supported", note: "¶2 (4.1)." },
      { text: "A competent person re-checks the area a further 30 minutes after the watch, before it is left unattended.", cite: 3, verdict: "supported", note: "¶3 (4.2)." },
      { text: "The supplied extract ends at ¶3. It does not contain the clauses on WHO may act as fire watch (4.3) or on EXTENDING the period (4.4), so those parts of the question cannot be answered from what was provided.", cite: null, verdict: "gap", note: "Correct refusal — the retrieval was incomplete, and the grounded model says so rather than filling the gap." }
    ]
  },

  notes: {
    grounding: "Grounding = pasting HW-12's actual text into the prompt and telling the model to answer only from it. Same model and question as the ungrounded side; only the presence of the source changes.",
    verifiableFormat: "One claim per line, each tagged with the clause it rests on, and an explicit 'not in the provided text' where that applies. That format is what makes a 30-second review possible.",
    reviewGate: "The ungrounded answer cannot be signed off without checking every line against HW-12 — the document the model never saw. The grounded answer needs only its one inference line confirmed.",
    hallucination: "Independent estimates: ~3–5% of factual claims wrong on mainstream topics, up to ~27% on niche ones. These examples concentrate the failures on purpose; real base rates are lower but never zero, and the wrong lines are never flagged by the model."
  }
};
