import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { WorkflowSpec } from "../../../contracts/protocol";
import { WorkflowInputEditor } from "./workflow-input-editor";
import { WorkflowStepEditor } from "./workflow-step-editor";

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
