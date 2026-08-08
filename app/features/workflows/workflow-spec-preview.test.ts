import assert from "node:assert/strict";
import test from "node:test";
import type { WorkflowSpec } from "../../../contracts/protocol";
import { buildWorkflowSpecPreview } from "./workflow-spec-preview";

test("builds a generic progressive preview for a report download", () => {
  const spec: WorkflowSpec = {
    schemaVersion: 1,
    format: "doonce.workflow-spec.v1",
    title: "Download weekly report",
    description: "Retrieve the reviewed CSV report.",
    allowedDomains: ["reports.example.com"],
    inputs: [],
    steps: [{
      id: "10000000-0000-4000-8000-000000000001",
      action: "download",
      name: "Download CSV",
      expectedOutcome: "A CSV file is downloaded.",
      target: {
        domain: "reports.example.com",
        path: "/weekly",
        locator: {
          schemaVersion: 1,
          primary: { strategy: "role", value: "button:Download", confidence: 0.95 },
          fallbacks: [{ strategy: "text", value: "Download", confidence: 0.7 }],
        },
      },
    }],
  };

  const preview = buildWorkflowSpecPreview(spec);

  assert.equal(preview.summary, "1 step · schema v1");
  assert.equal(preview.steps[0]?.action, "Download file");
  assert.equal(preview.steps[0]?.target, "reports.example.com/weekly");
  assert.deepEqual(preview.steps[0]?.locatorStrategies, ["role (95%)", "text (70%)"]);
});
