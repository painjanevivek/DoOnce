import assert from "node:assert/strict";
import test from "node:test";
import { canObserveField, createRecordedEventSummary, normalizeRecordedPath } from "./capture-eligibility";

function field(overrides: Record<string, unknown> = {}) {
  return { tagName: "INPUT", type: "text", name: "reportLabel", id: "", autocomplete: "", getAttribute: () => "", ...overrides };
}

test("capture eligibility excludes protected and hidden fields", () => {
  assert.equal(canObserveField(field({ type: "password" })), false);
  assert.equal(canObserveField(field({ autocomplete: "one-time-code" })), false);
  assert.equal(canObserveField(field({ name: "cardNumber" })), false);
  assert.equal(canObserveField(field({ type: "hidden" })), false);
  assert.equal(canObserveField(field({ type: "file" })), false);
});

test("capture eligibility permits only bounded, value-free event summaries", () => {
  assert.equal(canObserveField(field()), true);
  assert.deepEqual(createRecordedEventSummary("input", "#report-label"), { eventKind: "input", selector: "#report-label" });
  assert.equal(createRecordedEventSummary("keydown", "#report-label"), undefined);
  assert.equal(normalizeRecordedPath("/demo/reports"), "/demo/reports");
  assert.equal(normalizeRecordedPath("//reports.example"), undefined);
  assert.equal(normalizeRecordedPath("/reports/../secret"), undefined);
});
