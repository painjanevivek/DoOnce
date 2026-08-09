import assert from "node:assert/strict";
import test from "node:test";
import type { WorkflowSpec } from "../../../contracts/protocol";
import { applyEditorChange, createEditorHistory, currentEditorSpec, describeVersionChanges, duplicateWorkflowStep, insertWorkflowStep, moveWorkflowStep, redoEditorChange, removeWorkflowStep, undoEditorChange, validateEditorSpec } from "./editor-model";

const spec: WorkflowSpec = {
  schemaVersion: 1,
  format: "doonce.workflow-spec.v1",
  title: "Download report",
  allowedDomains: ["reports.example.com"],
  inputs: [],
  steps: [{ id: "10000000-0000-4000-8000-000000000001", action: "navigate", name: "Open reports", expectedOutcome: "Reports are ready", target: { domain: "reports.example.com", path: "/reports" } }, { id: "10000000-0000-4000-8000-000000000002", action: "download", name: "Download CSV", expectedOutcome: "CSV downloads", target: { domain: "reports.example.com", path: "/reports", locator: { schemaVersion: 1, primary: { strategy: "role", value: "button", confidence: .9 }, fallbacks: [] } } }],
};

test("keeps bounded undo and redo history for visual edits", () => {
  const initial = createEditorHistory(spec);
  const edited = applyEditorChange(initial, { ...spec, title: "Edited report" });
  assert.equal(currentEditorSpec(edited).title, "Edited report");
  assert.equal(currentEditorSpec(undoEditorChange(edited)).title, "Download report");
  assert.equal(currentEditorSpec(redoEditorChange(undoEditorChange(edited))).title, "Edited report");
});

test("reorders, duplicates, and removes steps without changing stable source identifiers", () => {
  const moved = moveWorkflowStep(spec, 1, 0);
  assert.equal(moved.steps[0]?.id, spec.steps[1]?.id);
  const duplicated = duplicateWorkflowStep(spec, 0);
  assert.equal(duplicated.steps.length, 3);
  assert.notEqual(duplicated.steps[1]?.id, spec.steps[0]?.id);
  assert.equal(removeWorkflowStep(duplicated, 1).steps.length, 2);
});

test("inserts valid typed steps and creates a reusable input when needed", () => {
  const typed = insertWorkflowStep(spec, "type");
  assert.equal(typed.inputs[0]?.name, "input_value");
  assert.equal(typed.steps.at(-1)?.action, "type");
  assert.deepEqual(validateEditorSpec(typed), []);
});

test("builds a forward-only branch and rejects secret defaults", () => {
  const branched = insertWorkflowStep(spec, "branch");
  assert.equal(branched.steps[0]?.action, "branch");
  assert.deepEqual(validateEditorSpec(branched), []);
  const invalid = { ...branched, inputs: [{ ...branched.inputs[0]!, secret: true, defaultValue: "do-not-store" }] };
  assert.equal(validateEditorSpec(invalid).some((issue) => issue.code === "workflow.secret_default"), true);
});

test("summarizes publication changes in plain language", () => {
  const changes = describeVersionChanges(spec, { ...spec, title: "Monthly report", steps: [...spec.steps].reverse() });
  assert.equal(changes.some((change) => change.startsWith("Renamed")), true);
  assert.equal(changes.includes("Reordered or replaced workflow steps"), true);
});
