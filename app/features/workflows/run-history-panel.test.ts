import assert from "node:assert/strict";
import test from "node:test";
import { createRedactedReceipt, type RedactedRunTimeline } from "./run-history-panel";

test("binds an exported redacted receipt to the immutable deployment release", () => {
  const timeline: RedactedRunTimeline = {
    run: {
      id: "10000000-0000-4000-8000-000000000001",
      workflowId: "20000000-0000-4000-8000-000000000002",
      workflowVersion: 1,
      workflowChecksum: "a".repeat(64),
      mode: "production",
      status: "completed",
      requestedAt: "2026-08-24T00:00:00.000Z",
      currentStepIndex: 1,
      releaseIdentity: {
        schemaVersion: 1,
        deploymentId: "mvp-2026-08-24.1",
        environment: "pilot-production",
        backendCommit: "b".repeat(40),
        frontendCommit: "c".repeat(40),
        backendImageDigest: `sha256:${"d".repeat(64)}`,
        frontendImageDigest: `sha256:${"e".repeat(64)}`,
        extensionId: "a".repeat(32),
        extensionVersion: "0.4.0",
        extensionPackageSha256: "f".repeat(64),
        protocolSchemaSha256: "1".repeat(64),
        migrationSetSha256: "2".repeat(64),
      },
    },
    steps: [{ schemaVersion: 1, stepId: "30000000-0000-4000-8000-000000000003", status: "verified", startedAt: "2026-08-24T00:00:00.000Z", finishedAt: "2026-08-24T00:00:01.000Z" }],
    events: [{ id: "private-event", eventType: "run.completed", createdAt: "2026-08-24T00:00:01.000Z" }],
    artifacts: [{ id: "40000000-0000-4000-8000-000000000004", fileName: "report.csv", contentType: "text/csv", byteSize: 1200, checksumSha256: "3".repeat(64), createdAt: "2026-08-24T00:00:01.000Z" }],
  };

  const receipt = createRedactedReceipt(timeline);
  assert.equal(receipt.release?.deploymentId, "mvp-2026-08-24.1");
  assert.equal(receipt.release?.extensionPackageSha256, "f".repeat(64));
  assert.equal("events" in receipt, false);
  assert.doesNotMatch(JSON.stringify(receipt), /private-event|selector|observed|pageContent/);
});
