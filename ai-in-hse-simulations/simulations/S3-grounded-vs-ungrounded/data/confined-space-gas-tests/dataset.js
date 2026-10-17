/* ============================================================================
   S3 dataset — "confined-space-gas-tests"
   Same question, same (notional) model, same temperature — asked two ways:
   with NO source in the prompt, and with the standard extract pasted in.

   Everything is PRE-AUTHORED. No model runs. The claim verdicts and notes are
   the teaching content; app.js just tallies and renders them.
   Shape: ../_TEMPLATE/dataset.js
   ============================================================================ */
window.HSE_S3 = window.HSE_S3 || { scenarios: {} };
window.HSE_S3.scenarios["confined-space-gas-tests"] = {

  id: "confined-space-gas-tests",
  label: "Confined-space atmospheric testing (standard OES-7)",

  question: "Under Occupational Entry Standard OES-7, what atmospheric tests are required before entering a confined space, in what order, and how often must they be repeated during the work?",

  source: {
    title: "Occupational Entry Standard OES-7 — Atmospheric Testing for Confined Space Entry   [FICTIONAL standard, for demonstration only]",
    paragraphs: [
      "OES-7 sets minimum requirements for testing the atmosphere of a confined space before and during entry. It does not cover training, rescue or ventilation, which are dealt with in OES-8 and OES-9.",
      "2.1  Before any person enters a confined space, the atmosphere shall be tested from outside the space, in the following order: (a) oxygen concentration; (b) flammable gas and vapour; (c) toxic contaminants relevant to the space and to its previous contents.",
      "2.2  Entry is permitted only where oxygen is within 19.5 % to 23.5 % by volume, flammable gas and vapour is below 10 % of the lower explosive limit, and each toxic contaminant is below its relevant occupational exposure limit.",
      "2.3  Where reasonably practicable, the atmosphere shall be monitored continuously while the space is occupied. Where continuous monitoring is not reasonably practicable, the atmosphere shall be re-tested at intervals not exceeding those stated in the entry permit, and always after any interruption of the work.",
      "2.4  The make, type and calibration status of each instrument shall be recorded on the entry permit. The calibration procedure itself is given in Section 3 (not reproduced in this extract)."
    ],
    snippetParas: 3   /* "Snippet only" mode supplies paragraphs 1-3 to the model */
  },

  ungrounded: {
    baseRate: ["~3–5% of claims (mainstream topic)", "~10–15% of claims", "up to ~27% of claims (niche topic)"],
    variants: [
      {
        familiarity: "Common topic — model has seen a lot of confined-space material",
        claims: [
          { text: "Test in the order oxygen first, then flammable gases, then toxic gases.", cite: null, verdict: "supported",
            note: "Happens to match the standard's order — but you cannot tell that from the answer alone; there is nothing to check it against." },
          { text: "Oxygen must be between 19.5 % and 23.5 % by volume.", cite: null, verdict: "supported",
            note: "Correct here, recalled from training. On a less common variant the model gets this wrong (try the slider)." },
          { text: "Flammable gas must be below 10 % of the LEL.", cite: null, verdict: "supported",
            note: "Correct, recalled from training." },
          { text: "This is set out in Section 5.2.1 of OES-7.", cite: null, verdict: "fabricated",
            note: "Invented clause number. The relevant clauses are 2.1–2.3. The model produced a plausible-looking reference because the answer 'shape' calls for one." },
          { text: "The atmosphere must be re-tested every 20 minutes during the work.", cite: null, verdict: "unsupported",
            note: "No fixed interval exists in the standard — it is set by the entry permit, and re-testing is also required after any interruption. '20 minutes' is invented." },
          { text: "The tests must be carried out by a gas tester holding a current AGT certificate.", cite: null, verdict: "unsupported",
            note: "Invented credential. The standard does not name a certificate in this extract." }
        ]
      },
      {
        familiarity: "Less common — an unusual space / contaminant",
        claims: [
          { text: "Test the atmosphere from outside the space before entry.", cite: null, verdict: "supported",
            note: "Correct principle, recalled." },
          { text: "Check toxic gases first, then oxygen, then flammables.", cite: null, verdict: "contradicts",
            note: "Standard requires oxygen FIRST (2.1). Wrong order can miss an oxygen-deficient atmosphere." },
          { text: "Oxygen is acceptable between 20.9 % and 23 %.", cite: null, verdict: "contradicts",
            note: "Standard band is 19.5–23.5 % (2.2). This narrower band would wrongly bar a compliant entry and is not the rule." },
          { text: "OES-7 clause 4.4 makes continuous monitoring mandatory in every case.", cite: null, verdict: "contradicts",
            note: "Invented clause, and wrong: 2.3 requires continuous monitoring only where reasonably practicable." },
          { text: "Re-test every 15 minutes and after any break in the work.", cite: null, verdict: "partly",
            note: "The 'after any break' half matches 2.3; the '15 minutes' is invented — the interval comes from the permit." },
          { text: "Hydrogen sulfide must be kept below 10 ppm.", cite: null, verdict: "unsupported",
            note: "2.2 says 'below its relevant occupational exposure limit' — it gives no number. 10 ppm is supplied by the model, not the standard." }
        ]
      },
      {
        familiarity: "Niche / obscure — little specific training data",
        claims: [
          { text: "Oxygen must read exactly 20.9 % before entry is allowed.", cite: null, verdict: "contradicts",
            note: "Standard allows a 19.5–23.5 % band (2.2). 'Exactly 20.9 %' is fabricated precision and would block almost every real entry." },
          { text: "Flammable gas must be below 25 % of the LEL.", cite: null, verdict: "contradicts",
            note: "Standard limit is 10 % LEL (2.2). This is a dangerous overstatement of the acceptable level." },
          { text: "Testing order is flammables, then toxics, then oxygen.", cite: null, verdict: "contradicts",
            note: "Reverses the required order (2.1 puts oxygen first)." },
          { text: "Under OES-7 Annex C, a written toxic-gas risk assessment is not required for spaces under 2 m³.", cite: null, verdict: "fabricated",
            note: "There is no Annex C in the standard and no such size exemption. Entirely invented, stated with full confidence." },
          { text: "Re-test the atmosphere hourly.", cite: null, verdict: "unsupported",
            note: "No hourly rule exists; interval is permit-defined (2.3)." },
          { text: "A standby person with SCBA is required at every entry.", cite: null, verdict: "unsupported",
            note: "Not in OES-7 at all — rescue is covered by OES-9, which the model has conflated in." }
        ]
      }
    ]
  },

  grounded: {
    full: [
      { text: "Before entry, test the atmosphere from OUTSIDE the space.", cite: 2, verdict: "supported", note: "Directly from ¶2 (2.1)." },
      { text: "Test in order: (a) oxygen, (b) flammable gas and vapour, (c) toxic contaminants relevant to the space and its previous contents.", cite: 2, verdict: "supported", note: "The ordered list in ¶2 (2.1)." },
      { text: "Acceptance criteria: oxygen 19.5–23.5 % by volume; flammable gas below 10 % LEL; each toxic contaminant below its relevant occupational exposure limit.", cite: 3, verdict: "supported", note: "¶3 (2.2), quoted." },
      { text: "While the space is occupied, monitor continuously where reasonably practicable.", cite: 4, verdict: "supported", note: "¶4 (2.3), first sentence." },
      { text: "Where continuous monitoring is not reasonably practicable, re-test at intervals not exceeding those in the entry permit, and always after any interruption of the work.", cite: 4, verdict: "supported", note: "¶4 (2.3), second sentence." },
      { text: "The extract gives no fixed re-test interval in minutes — that number is defined by the entry permit, which is not part of this text.", cite: 4, verdict: "hedge", note: "Correctly declines to invent the interval the ungrounded answer made up." },
      { text: "Instrument calibration procedure is not covered here (Section 3 is not reproduced), and neither is standby / rescue.", cite: 5, verdict: "hedge", note: "States the boundary of the source." },
      { text: "Inference: because toxic-contaminant testing depends on the space's 'previous contents', you must establish the space history before choosing the toxic tests — the standard implies this rather than stating it.", cite: 2, verdict: "inference", note: "Reasonable, but it is the model reasoning beyond the words. A human should confirm." }
    ],
    snippet: [
      { text: "Before entry, test the atmosphere from outside the space.", cite: 2, verdict: "supported", note: "¶2 (2.1)." },
      { text: "Order: oxygen, then flammable gas and vapour, then toxic contaminants relevant to the space and its previous contents.", cite: 2, verdict: "supported", note: "¶2 (2.1)." },
      { text: "Acceptance criteria: oxygen 19.5–23.5 %; flammable gas below 10 % LEL; toxics below their relevant OEL.", cite: 3, verdict: "supported", note: "¶3 (2.2)." },
      { text: "The supplied extract stops at ¶3. It contains nothing about how often to re-test during the work, so that part of the question cannot be answered from what was provided.", cite: null, verdict: "gap", note: "Correct refusal. Grounding is only as complete as what you retrieve — here ¶4 (2.3) was not supplied." },
      { text: "Likewise, monitoring-during-occupancy and calibration are outside the provided text.", cite: null, verdict: "gap", note: "Boundary of the snippet stated plainly." }
    ]
  },

  notes: {
    grounding: "Grounding = putting the actual source text in the prompt (retrieval-augmented generation) and instructing the model to answer only from it. Same model, same question — the difference in reliability is entirely down to whether the standard was in front of it.",
    verifiableFormat: "Ask for an answer format you can check: one claim per line, each with the paragraph it comes from, and an explicit 'not in the source' where that is true. The citation chips here let a reviewer confirm each line in seconds.",
    reviewGate: "Neither answer is 'done' when the model stops. The ungrounded answer needs every claim checked against a document the model never had. The grounded answer needs only its inference lines confirmed — minutes, not tens of minutes.",
    hallucination: "Independent estimates: confidently-wrong statements run about 3–5% of factual claims on mainstream topics and up to ~27% on niche ones. These worked examples deliberately concentrate the failures so you can see the shape of them; the base rate is lower, but it is never zero and the wrong claims are never marked."
  }
};
