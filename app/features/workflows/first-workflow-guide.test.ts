import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { WorkflowSummary } from "./authoring-types";
import {
  deriveFirstWorkflowProgress,
  FirstWorkflowGuide,
} from "./first-workflow-guide";

const draft: WorkflowSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  title: "Download the weekly report",
  activeVersion: null,
  draftVersion: 1,
  status: "draft",
  updatedAt: "2026-08-24T09:00:00.000Z",
  lastRunAt: null,
  successRate: null,
};

test("derives the next truthful first-workflow stage from durable evidence", () => {
  assert.deepEqual(deriveFirstWorkflowProgress([]), { stage: "teach", completed: 0 });
  assert.equal(deriveFirstWorkflowProgress([draft]).stage, "review");
  assert.equal(
    deriveFirstWorkflowProgress([{ ...draft, activeVersion: 1, status: "active" }]).stage,
    "verify",
  );
  assert.equal(
    deriveFirstWorkflowProgress([
      { ...draft, activeVersion: 1, status: "active", lastRunAt: "2026-08-24T10:00:00.000Z" },
    ]).stage,
    "repeat",
  );
});

test("renders pairing as extension-confirmed and exposes one primary next action", () => {
  const html = renderToStaticMarkup(
    createElement(FirstWorkflowGuide, {
      workflows: [draft],
      onChooseRecording() {},
      onOpenWorkflow() {},
      onRun() {},
    }),
  );

  assert.match(html, /data-stage="review"/);
  assert.match(html, /Review and test draft/);
  assert.match(html, /confirmed inside the extension/);
  assert.match(html, /data-current="true"/);
  assert.doesNotMatch(html, /Get started|Learn more|Submit/);
});
