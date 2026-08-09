import assert from "node:assert/strict";
import test from "node:test";
import { classifyCapturedValue, createElementEvidence, fingerprint, normalizeUrlPattern } from "./capture-evidence";

test("builds durable semantic locator evidence in confidence order", () => {
  const evidence = createElementEvidence({ role: "button", accessibleName: "Download", testId: "download-report", tagName: "BUTTON", textHint: "Download report", framePath: ["iframe[name=reports]"], viewportWidth: 1200, viewportHeight: 800, visibleArea: 200, elementArea: 200 });
  assert.equal(evidence.locator.primary.strategy, "capture-id");
  assert.equal(evidence.locator.fallbacks[0]?.strategy, "role");
  assert.equal(evidence.domFingerprint.length, 16);
  assert.equal(evidence.visibility.ratio, 1);
});

test("classifies entered data without persisting its raw value", () => {
  assert.deepEqual(classifyCapturedValue("hunter2", { inputType: "password", name: "password" }), { classification: "secret-placeholder", placeholder: "{{secret}}", length: 7 });
  assert.deepEqual(classifyCapturedValue("person@example.com", { inputType: "email", name: "contact email" }), { classification: "variable-candidate", placeholder: "{{contact_email}}", length: 18 });
  assert.equal(JSON.stringify(classifyCapturedValue("person@example.com", { inputType: "email" })).includes("person@example.com"), false);
});

test("removes transient URL values and produces stable fingerprints", () => {
  assert.equal(normalizeUrlPattern("https://example.com/reports?utm_source=mail&year=2026&token=secret"), "https://example.com/reports?year={value}");
  assert.equal(fingerprint("same"), fingerprint("same"));
  assert.notEqual(fingerprint("same"), fingerprint("different"));
});
