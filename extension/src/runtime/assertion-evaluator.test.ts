import assert from "node:assert/strict";
import test from "node:test";
import type { LocatorSpec, WorkflowAssertion } from "../../../contracts/protocol";
import { evaluateAssertions, type AssertionProbe } from "./assertion-evaluator";

const ids = Array.from({ length: 8 }, (_, index) => `${String(index + 1).repeat(8)}-${String(index + 1).repeat(4)}-4${String(index + 1).repeat(3)}-8${String(index + 1).repeat(3)}-${String(index + 1).repeat(12)}`);
const locator: LocatorSpec = { schemaVersion: 1, primary: { strategy: "id", value: "result", confidence: 1 }, fallbacks: [] };
const target = { domain: "example.test", path: "/reports", locator };
const assertions: WorkflowAssertion[] = [
  { id: ids[0]!, name: "Correct page", kind: "url-match", operator: "contains", expected: "/reports" },
  { id: ids[1]!, name: "Result exists", kind: "element-present", target },
  { id: ids[2]!, name: "Old banner gone", kind: "element-absent", target: { ...target, locator: { ...locator, primary: { ...locator.primary, value: "old" } } } },
  { id: ids[3]!, name: "Text matches", kind: "text-match", target, operator: "contains", expected: "Ready" },
  { id: ids[4]!, name: "Field selected", kind: "field-state", target, operator: "equals", expected: "north" },
  { id: ids[5]!, name: "CSV downloaded", kind: "file-downloaded", fileNamePattern: "report\\.csv$", contentTypes: ["text/csv"], minBytes: 10, maxBytes: 1000 },
  { id: ids[6]!, name: "Output verified", kind: "extracted-value", outputName: "total", operator: "equals", expected: "42" },
  { id: ids[7]!, name: "Rows verified", kind: "table-row-count", target, operator: "at-least", count: 3 },
];

function probe(): AssertionProbe { return { currentUrl: () => "https://example.test/reports", element: (candidate) => candidate.primary.value === "old" ? undefined : { text: "Ready for export", value: "north", rowCount: 4, evidenceRefs: ["dom:result"] }, downloads: () => [{ fileName: "weekly-report.csv", contentType: "text/csv", bytes: 120, evidenceRefs: ["download:7"] }], confirmation: () => undefined }; }

test("verifies URL, presence, absence, text, field, download, output, and row-count assertions", () => {
  const results = evaluateAssertions(assertions, probe(), { total: "42" }, new Date("2026-08-09T00:00:00.000Z"));
  assert.equal(results.length, 8);
  assert.ok(results.every((result) => result.status === "verified"));
  assert.deepEqual(results[5]?.evidenceRefs, ["download:7"]);
});

test("reports a completed click as failed when its outcome assertion does not match", () => {
  const assertion = assertions[3]!;
  assert.equal(assertion.kind, "text-match");
  if (assertion.kind !== "text-match") return;
  const [result] = evaluateAssertions([{ ...assertion, expected: "Complete" }], probe(), {});
  assert.equal(result?.status, "failed");
  assert.equal(result?.reasonCode, "assertion.text-mismatch");
});

test("requires an explicit user answer for confirmation assertions", () => {
  const confirmation: WorkflowAssertion = { id: ids[0]!, name: "Review output", kind: "user-confirmation", prompt: "Is the report correct?" };
  assert.equal(evaluateAssertions([confirmation], probe(), {})[0]?.status, "confirmation-required");
  assert.equal(evaluateAssertions([confirmation], { ...probe(), confirmation: (assertion) => assertion.prompt.includes("correct") }, {})[0]?.status, "verified");
});
