/* ============================================================================
   S22 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S22 = window.HSE_S22 || { scenarios: {} };
window.HSE_S22.manifest = [
  { id: "ppe-alert",         label: "PPE camera alert (computer vision)" },
  { id: "elevated-risk-day", label: "Elevated-risk-day flag (predictive model)" }
];
