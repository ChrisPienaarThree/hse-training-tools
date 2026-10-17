/* ============================================================================
   S3 — scenario manifest
   Ordered list for the scenario picker. To add one: copy data/_TEMPLATE to
   data/<id>, fill it in, add a <script src> line in index.html, add a row here.
   ============================================================================ */
window.HSE_S3 = window.HSE_S3 || { scenarios: {} };
window.HSE_S3.manifest = [
  { id: "confined-space-gas-tests", label: "Confined-space atmospheric testing (standard OES-7)" },
  { id: "hot-work-fire-watch",      label: "Hot-work fire watch (procedure HW-12)" }
];
