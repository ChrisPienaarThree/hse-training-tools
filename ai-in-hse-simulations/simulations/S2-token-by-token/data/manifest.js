/* ============================================================================
   S2 — scenario manifest
   Lists the datasets the demo offers in its scenario picker, in order.
   To add a scenario: copy data/_TEMPLATE to data/<your-id>, fill it in,
   add a <script src> line for it in index.html, and add a row here.
   ============================================================================ */
window.HSE_S2 = window.HSE_S2 || { scenarios: {} };
window.HSE_S2.manifest = [
  { id: "exposure-limit",  label: "Exposure limit from an SDS extract" },
  { id: "permit-validity", label: "Hot-work permit validity from a procedure" }
];
