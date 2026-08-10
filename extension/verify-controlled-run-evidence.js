/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const extensionDirectory = __dirname;
const reportPath = path.join(extensionDirectory, "..", "docs", "reliability", "controlled-local-extension-runs.json");
const expectedSourceFiles = ["src/service-worker.ts", "src/demo-runner.ts", "src/run-eligibility.ts", "controlled-run-harness.js"];

function digest(filename) {
  const source = fs
    .readFileSync(path.join(extensionDirectory, filename), "utf8")
    .replace(/\r\n/g, "\n");
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function main() {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.equal(report.reportVersion, 2);
  assert.equal(report.execution.mode, "automated-controlled-local-extension-harness");
  assert.equal(report.execution.manual, false);
  assert.equal(report.execution.explicitApprovalRequired, true);
  assert.equal(report.workflow.version, 1);
  assert.equal(report.runCount, 50);
  assert.deepEqual(report.results, {
    completed: 30,
    paused: 20,
    pauseReasons: { "changed-page": 10, "slow-network": 5, unknown: 5 },
  });
  assert.deepEqual(Object.keys(report.provenance.sourceDigests).sort(), expectedSourceFiles.map((filename) => `extension/${filename}`).sort());
  for (const filename of expectedSourceFiles) {
    assert.equal(report.provenance.sourceDigests[`extension/${filename}`], digest(filename), `${filename} changed after the evidence batch was generated.`);
  }
  assert.equal(report.runs.length, 50);
  for (const [index, run] of report.runs.entries()) {
    const expectedOutcome = index < 30 ? "completed" : "paused";
    const expectedPauseReason = index < 30 ? undefined : index < 40 ? "changed-page" : index < 45 ? "slow-network" : "unknown";
    assert.equal(run.run, index + 1);
    assert.equal(run.workflowVersion, 1);
    assert.equal(run.outcome, expectedOutcome);
    assert.equal(run.pauseReason, expectedPauseReason);
    assert.ok(Number.isFinite(Date.parse(run.startedAt)) && Number.isFinite(Date.parse(run.finishedAt)) && Date.parse(run.finishedAt) >= Date.parse(run.startedAt));
  }
  process.stdout.write("Controlled run evidence matches the current extension source.\n");
}

main();
