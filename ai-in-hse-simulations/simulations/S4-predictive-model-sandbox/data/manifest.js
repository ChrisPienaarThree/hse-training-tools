/* ============================================================================
   S4 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S4 = window.HSE_S4 || { scenarios: {} };
window.HSE_S4.manifest = [
  { id: "crew-incident-risk",      label: "Crew incident risk (next 30 days)" },
  { id: "equipment-failure-risk",  label: "Equipment failure risk (next 90 days)" }
];
