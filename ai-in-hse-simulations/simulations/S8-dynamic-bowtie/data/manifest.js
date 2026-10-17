/* ============================================================================
   S8 — scenario manifest
   Ordered list for the scenario picker. Add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S8 = window.HSE_S8 || { scenarios: {} };
window.HSE_S8.manifest = [
  { id: "process-overpressure",  label: "Process — reactor overpressure / loss of containment" },
  { id: "mobile-plant-pedestrian", label: "Yard — pedestrian struck by mobile plant" }
];
