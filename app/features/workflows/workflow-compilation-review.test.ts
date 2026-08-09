import assert from "node:assert/strict";
import test from "node:test";
import type { WorkflowCompilation } from "../../../contracts/protocol";
import { buildCompilationReview } from "./workflow-compilation-review";

test("summarizes explicit compiler uncertainty without hiding combined actions", () => {
  const review = buildCompilationReview({
    schemaVersion: 1,
    format: "doonce.workflow-compilation.v1",
    compilerVersion: "1.0.0",
    captureSessionId: "d0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b",
    sourceDigest: "a".repeat(64),
    workflow: { schemaVersion: 1, format: "doonce.workflow-spec.v1", title: "Report", allowedDomains: ["reports.example.test"], inputs: [], steps: [{ id: "c0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", action: "ask-approval", name: "Review toggle", expectedOutcome: "Intent is confirmed.", prompt: "Confirm the recorded toggle." }] },
    warnings: [{ code: "compiler.unsupported-action", severity: "warning", message: "Toggle requires review.", actionIds: ["b0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b"] }],
    provenance: [],
    coverage: [
      { actionId: "b0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", outcome: "unsupported", stepIds: ["c0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b"] },
      { actionId: "e0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", outcome: "combined", stepIds: ["c0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b"] },
    ],
    suggestions: [],
  } satisfies WorkflowCompilation);

  assert.equal(review.coverage.unsupported, 1);
  assert.equal(review.coverage.combined, 1);
  assert.equal(review.needsReview, 2);
  assert.equal(review.uncertain[0]?.code, "compiler.unsupported-action");
});
