import assert from "node:assert/strict";
import test from "node:test";
import { isBetaSummaryResponse, isBetaWorkflowsResponse, isCompatibilityResponse } from "./beta-evidence-panel";

test("accepts bounded controlled-beta API summaries", () => {
  assert.equal(isBetaWorkflowsResponse({ workflows: [{ id: "a", workflowId: "b", productionRuns: 4, repeatUnassistedRuns: 3 }] }), true);
  assert.equal(isBetaSummaryResponse({ summary: { enrolledWorkflows: 2, workflowsWithFirstTest: 2, workflowsWithFirstProduction: 1, workflowsReadyForIndependentUse: 1, totalRepeatUnassistedRuns: 3, topFailureCategories: [] } }), true);
  assert.equal(isCompatibilityResponse({ compatibility: { reviewedAt: "2026-08-09", runtimes: [], workflowCategories: [], constraints: [] } }), true);
});

test("rejects incomplete or incorrectly typed beta evidence", () => {
  assert.equal(isBetaWorkflowsResponse({ workflows: [{ id: "a", workflowId: "b", productionRuns: "4", repeatUnassistedRuns: 3 }] }), false);
  assert.equal(isBetaSummaryResponse({ summary: { enrolledWorkflows: 2 } }), false);
  assert.equal(isCompatibilityResponse({ compatibility: { reviewedAt: "2026-08-09", runtimes: "Chrome" } }), false);
});
