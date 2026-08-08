import assert from "node:assert/strict";
import test from "node:test";
import { compileRecordedActions, workflowSpecFormat } from "./workflow-compiler";

function ids() {
  let value = 0;
  return () => `00000000-0000-4000-8000-${String(++value).padStart(12, "0")}`;
}

test("compiles explicit download hints and pauses unclassified actions for review", () => {
  const result = compileRecordedActions([
    { origin: "http://localhost:3000", path: "/demo/reports", eventKind: "input", selector: "#report-date" },
    { origin: "http://localhost:3000", path: "/demo/reports", eventKind: "click", selector: '[data-doonce-capture-id="download-report"]', actionHint: "download" },
  ], { title: "Weekly report", idFactory: ids() });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.format, workflowSpecFormat);
  assert.deepEqual(result.value.steps.map((step) => step.action), ["ask-approval", "download"]);
  assert.equal("value" in result.value.steps[0]!, false);
});

test("rejects unstable locators, mixed origins, and untrusted action hints", () => {
  const idFactory = ids();
  assert.equal(compileRecordedActions([{ origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "button:nth-child(2)" }], { idFactory }).ok, false);
  assert.equal(compileRecordedActions([
    { origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "#download" },
    { origin: "https://other.example.test", path: "/reports", eventKind: "click", selector: "#download" },
  ], { idFactory }).ok, false);
  assert.equal(compileRecordedActions([{ origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "#download", actionHint: "submit" }], { idFactory }).ok, false);
});
