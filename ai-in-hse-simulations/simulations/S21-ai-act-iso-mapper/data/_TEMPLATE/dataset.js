/* ============================================================================
   S21 dataset TEMPLATE — copy to data/<your-scenario-id>/, no model runs.
   Part A: app.js evaluates whichever questions are checked, in priority
   order prohibited > high-risk > limited-risk > minimal-risk — the first
   category with any checked question wins. Presets just pre-check boxes.
   Part B: app.js live-filters isoMapping rows against a search box.
   AFTER FILLING IN: add a <script src> line in index.html + a manifest.js row.
   ============================================================================ */
window.HSE_S21 = window.HSE_S21 || { scenarios: {} };
window.HSE_S21.scenarios["TEMPLATE-ID"] = {
  id: "TEMPLATE-ID",
  label: "TODO — scenario picker label",
  context: "TODO",
  /* Keep these 6 questions and their categories as-is unless you have a specific reason to
     change the underlying rule set — they're meant to be the same across every scenario, like
     the RNG helpers are the same across every sim's app.js. */
  questions: [
    { id: "q1", category: "prohibited", text: "Does the system use subliminal, manipulative or deceptive techniques capable of materially distorting a person's behaviour in a way likely to cause harm?" },
    { id: "q2", category: "prohibited", text: "Does the system perform real-time remote biometric identification of individuals in publicly accessible spaces for law-enforcement-style purposes?" },
    { id: "q3", category: "prohibited", text: "Does the system infer emotions, or categorise/identify individuals from biometric data, in the workplace?" },
    { id: "q4", category: "high-risk", text: "Is the system used to make or materially inform decisions about recruitment, task allocation, performance evaluation, promotion, or termination of individual workers?" },
    { id: "q5", category: "high-risk", text: "Is the system a safety component of a product already regulated under EU product-safety law (e.g. machinery, PPE), requiring third-party conformity assessment?" },
    { id: "q6", category: "limited-risk", text: "Does the system interact directly with people as a conversational agent, or generate/manipulate content that could be mistaken for human-authored, without disclosing that it is AI?" }
  ],
  presets: [
    /* Exactly 3, ideally landing in 3 different tiers so the demo shows real spread. Hand-check
       each preset's answers actually classify into the tier its `note` claims, by walking the
       priority order yourself. */
    { id: "TODO-1", label: "TODO tool name", answers: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false }, note: "TODO — why this tool answers this way." }
  ],
  /* Reuse the same isoMapping rows across every scenario in this sim — they're generic reference
     content, not scenario-specific. Copy verbatim from an existing scenario's dataset.js. */
  isoMapping: [
    { clause: "4", title45001: "TODO", title42001: "TODO", integration: "TODO" }
  ],
  tierInfo: {
    prohibited: { label: "Prohibited", obligations: "This use is banned outright under the EU AI Act.", penalty: "Up to €35,000,000 or 7% of total worldwide annual turnover, whichever is higher." },
    "high-risk": { label: "High-risk", obligations: "Conformity assessment, risk management, data governance, technical documentation, human oversight, testing, post-market monitoring, EU database registration.", penalty: "Up to €15,000,000 or 3% of total worldwide annual turnover, whichever is higher." },
    "limited-risk": { label: "Limited-risk", obligations: "Transparency obligations — disclose that people are interacting with AI or that content is AI-generated.", penalty: "Up to €7,500,000 or 1% of total worldwide annual turnover, whichever is higher." },
    "minimal-risk": { label: "Minimal-risk", obligations: "No mandatory AI Act obligations; voluntary codes encouraged. Other laws may still apply.", penalty: "No specific EU AI Act penalty exposure." }
  },
  callouts: {
    ruleEngine: "This is six yes/no questions evaluated in a fixed priority order — prohibited beats high-risk beats limited-risk beats minimal-risk, first match wins.",
    surprise: "TODO — name the preset that surprises people and why.",
    notOmniscient: "This screener only knows what you tell it — it is a first-pass triage, not a compliance sign-off.",
    stillMisses: "The classification tells you which obligations apply — it does none of the work of satisfying them.",
    humanCall: "Someone still has to decide how to answer each question honestly, especially the borderline ones."
  },
  notes: {
    what: "TODO",
    math: "Classification: evaluate checked questions in priority order prohibited > high-risk > limited-risk > minimal-risk; first matching category wins. Part B filter: live case-insensitive substring match, recomputed on every keystroke.",
    real: "Authored: questions/categories, presets, tier text, ISO mapping content. Live and real: which tier your checked answers classify into, and which mapping rows match your filter."
  }
};
