/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { compileSafeCapture, workflowSpecFormat } = require("./workflow-compiler.js");

function ids() {
  let value = 0;
  return () => `00000000-0000-4000-8000-${String(++value).padStart(12, "0")}`;
}

test("compiles only explicit download hints into executable actions and keeps other captures as approval checkpoints", () => {
  const result = compileSafeCapture([
    { origin: "http://localhost:3000", path: "/demo/reports", eventKind: "input", selector: "#report-date" },
    { origin: "http://localhost:3000", path: "/demo/reports", eventKind: "click", selector: '[data-doonce-capture-id="download-report"]', actionHint: "download" },
  ], { title: "Weekly report", idFactory: ids() });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.format, workflowSpecFormat);
  assert.deepEqual(result.value.steps.map((step) => step.action), ["ask-approval", "download"]);
  assert.equal("value" in result.value.steps[0], false);
});

test("rejects unsafe, mixed-origin, and untrusted action capture data", () => {
  const idFactory = ids();
  assert.equal(compileSafeCapture([{ origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "button:nth-child(2)" }], { idFactory }).ok, false);
  assert.equal(compileSafeCapture([
    { origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "#download" },
    { origin: "https://other.example.test", path: "/reports", eventKind: "click", selector: "#download" },
  ], { idFactory }).ok, false);
  assert.equal(compileSafeCapture([{ origin: "https://reports.example.test", path: "/reports", eventKind: "click", selector: "#download", actionHint: "submit" }], { idFactory }).ok, false);
});
