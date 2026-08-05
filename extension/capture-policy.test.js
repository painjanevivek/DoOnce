/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { canObserveField, safeEventSummary, safePath } = require("./capture-policy.js");

function field(overrides = {}) {
  return { tagName: "INPUT", type: "text", name: "reportLabel", id: "", autocomplete: "", getAttribute: () => "", ...overrides };
}

test("capture policy excludes protected and hidden fields", () => {
  assert.equal(canObserveField(field({ type: "password" })), false);
  assert.equal(canObserveField(field({ autocomplete: "one-time-code" })), false);
  assert.equal(canObserveField(field({ name: "cardNumber" })), false);
  assert.equal(canObserveField(field({ type: "hidden" })), false);
  assert.equal(canObserveField(field({ type: "file" })), false);
});

test("capture policy permits only safe field metadata and value-free event summaries", () => {
  assert.equal(canObserveField(field()), true);
  assert.deepEqual(safeEventSummary("input", "#report-label"), { eventKind: "input", selector: "#report-label" });
  assert.equal(safeEventSummary("keydown", "#report-label"), undefined);
  assert.equal(safePath("/demo/reports"), "/demo/reports");
  assert.equal(safePath("//reports.example"), undefined);
  assert.equal(safePath("/reports/../secret"), undefined);
});
