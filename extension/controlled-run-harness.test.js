/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { runControlledBatch } = require("./controlled-run-harness.js");

test("replays the shipped extension control path for the complete 50-run evidence matrix", async () => {
  const report = await runControlledBatch();
  assert.equal(report.runCount, 50);
  assert.deepEqual(report.results, {
    completed: 30,
    paused: 20,
    pauseReasons: { "changed-page": 10, "slow-network": 5, unknown: 5 },
  });
  assert.equal(report.runs.every((run) => run.workflowVersion === 1 && Date.parse(run.finishedAt) >= Date.parse(run.startedAt)), true);
});
