import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { WorkflowSpec } from "../../../contracts/protocol";
import { WorkflowInputEditor } from "./workflow-input-editor";
import { WorkflowStepEditor } from "./workflow-step-editor";
import { TextAuthoringPanel } from "./text-authoring-panel";

const spec: WorkflowSpec = { schemaVersion: 1, format: "doonce.workflow-spec.v1", title: "Accessible editor", allowedDomains: ["example.com"], inputs: [{ name: "query", label: "Search query", kind: "text", required: true, secret: true }], steps: [{ id: "10000000-0000-4000-8000-000000000001", action: "type", name: "Enter query", expectedOutcome: "Query is entered", inputName: "query", target: { domain: "example.com", path: "/search", locator: { schemaVersion: 1, primary: { strategy: "label", value: "Search", confidence: .7 }, fallbacks: [] } } }] };

test("renders keyboard reorder controls and understandable locator confidence", () => {
  const html = renderToStaticMarkup(createElement(WorkflowStepEditor, { spec, issues: [], onChange() {} }));
  assert.match(html, /aria-label="Move step 1 up"/);
  assert.match(html, /aria-label="Move step 1 down"/);
  assert.match(html, /Review suggested/);
  assert.match(html, /Pick in browser/);
});

test("renders secret inputs without exposing a value", () => {
  const html = renderToStaticMarkup(createElement(WorkflowInputEditor, { spec, issues: [], onChange() {} }));
  assert.match(html, /Secret value/);
  assert.match(html, /Preview: ••••••••/);
  assert.doesNotMatch(html, /do-not-display/);
});

test("progressively discloses step and workflow verification criteria", () => {
  const target = (spec.steps[0] as Extract<WorkflowSpec["steps"][number], { target: { locator: unknown } }>).target;
  const assertionSpec: WorkflowSpec = { ...spec, steps: [{ ...spec.steps[0]!, assertions: [{ id: "20000000-0000-4000-8000-000000000002", name: "Search value entered", kind: "field-state", target, operator: "equals", expected: "${query}" }] }], successCriteria: [{ id: "30000000-0000-4000-8000-000000000003", name: "Results visible", kind: "element-present", target }] };
  const html = renderToStaticMarkup(createElement(WorkflowStepEditor, { spec: assertionSpec, issues: [], onChange() {} }));
  assert.match(html, /<details class="assertion-editor">/);
  assert.match(html, /Verify this step/);
  assert.match(html, /Verify the whole workflow/);
  assert.match(html, /Actions and verification are separate/);
});

test("renders text authoring with plain-language progressive disclosure", () => {
  const html = renderToStaticMarkup(createElement(TextAuthoringPanel, { apiBaseUrl: "http://127.0.0.1:4000", onDraftCreated() {} }));
  assert.match(html, /Create from a description/);
  assert.match(html, /What should the browser do/);
  assert.match(html, /Reusable inputs and technical details/);
  assert.match(html, /Create editable draft/);
});
