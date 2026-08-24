import assert from "node:assert/strict";
import test from "node:test";
import type { RunResult } from "../../../contracts/protocol";
import { redactCheckpoint, redactRunResult } from "./run-transport";

const step = {
  schemaVersion: 1 as const,
  stepId: "11111111-1111-4111-8111-111111111111",
  status: "verified" as const,
  startedAt: "2026-08-24T00:00:00.000Z",
  finishedAt: "2026-08-24T00:00:01.000Z",
  outputs: { reportName: "private page content" },
  selectedLocator: { strategy: "text" as const, value: "private selector", confidence: 0.8 },
  observedPage: { capturedAt: "2026-08-24T00:00:00.000Z", origin: "https://reports.example.test", path: "/reports", urlPattern: "https://reports.example.test/reports?secret=value", navigationId: "nav", titleHint: "Private title" },
  repairCandidates: [{ strategy: "text" as const, value: "private repair selector", confidence: 0.7 }],
};

test("redacts runtime checkpoints before transport while retaining local recovery inputs", () => {
  const redacted = redactCheckpoint({ currentStepIndex: 1, stepResults: [step], variables: { reportName: "private page content" }, observedUrl: "https://reports.example.test/reports?secret=value" });
  assert.deepEqual(redacted.variables, {});
  assert.equal(redacted.observedUrl, "https://reports.example.test/reports");
  assert.equal("outputs" in redacted.stepResults[0]!, false);
  assert.equal("selectedLocator" in redacted.stepResults[0]!, false);
  assert.equal(JSON.stringify(redacted).includes("private"), false);
});

test("redacts page content and selectors from terminal receipt evidence", () => {
  const result: RunResult = { schemaVersion: 1, format: "doonce.run-result.v1", runId: "22222222-2222-4222-8222-222222222222", workflowId: "33333333-3333-4333-8333-333333333333", workflowVersion: 1, status: "completed", stepResults: [step], startedAt: "2026-08-24T00:00:00.000Z", finishedAt: "2026-08-24T00:00:01.000Z" };
  const redacted = redactRunResult(result);
  assert.equal(JSON.stringify(redacted).includes("private"), false);
  assert.equal(redacted.stepResults[0]?.status, "verified");
});
