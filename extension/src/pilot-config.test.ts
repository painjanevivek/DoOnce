import assert from "node:assert/strict";
import test from "node:test";
import { isPilotWorkflowSpec, normalizePilotAllowedOrigin } from "./pilot-config";
import type { WorkflowSpec } from "../../contracts/protocol";

test("accepts only an exact HTTPS pilot origin", () => {
  assert.equal(normalizePilotAllowedOrigin(""), undefined);
  assert.equal(normalizePilotAllowedOrigin("https://reports.example.com"), "https://reports.example.com");
  for (const value of ["http://reports.example.com", "https://reports.example.com/", "https://reports.example.com/path", "https://reports.example.com:8443"]) {
    assert.throws(() => normalizePilotAllowedOrigin(value), /exact HTTPS origin/);
  }
});

test("the unconfigured development policy does not narrow workflow fixtures", () => {
  const workflow = { schemaVersion: 1, format: "doonce.workflow-spec.v1", title: "Development", allowedDomains: ["localhost"], inputs: [], steps: [] } as WorkflowSpec;
  assert.equal(isPilotWorkflowSpec(workflow), true);
});
