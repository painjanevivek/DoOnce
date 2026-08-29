import assert from "node:assert/strict";
import test from "node:test";
import { presentAttendedRun } from "./attended-run-presentation";

test("keeps completed runs distinct from artifact verification", () => {
  const presentation = presentAttendedRun("completed");

  assert.equal(presentation.title, "Run completed");
  assert.match(presentation.nextAction, /receipt evidence/);
  assert.doesNotMatch(presentation.nextAction, /verified download/i);
});

test("presents paused and failed runs as safe recovery states", () => {
  const paused = presentAttendedRun("paused", "manual-action-required");
  const failed = presentAttendedRun("failed", "download-contract-mismatch");

  assert.equal(paused.title, "Run paused safely");
  assert.match(paused.nextAction, /manual-action-required/);
  assert.equal(failed.tone, "error");
  assert.match(failed.nextAction, /download-contract-mismatch/);
});
