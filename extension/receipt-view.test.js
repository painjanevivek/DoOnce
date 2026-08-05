/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { describePauseReason, describeReceipt, isReceipt } = require("./receipt-view.js");

test("describes a completed local receipt without page data", () => {
  const receipt = { outcome: "completed", finishedAt: "2026-08-05T00:00:00.000Z" };
  assert.equal(isReceipt(receipt), true);
  assert.match(describeReceipt(receipt), /completed/);
  assert.doesNotMatch(describeReceipt(receipt), /origin|selector|value/i);
});

test("rejects malformed receipts and never exposes an unrecognized pause reason", () => {
  assert.equal(isReceipt({ outcome: "paused", finishedAt: "not-a-date", pauseReason: "changed page" }), false);
  assert.equal(isReceipt({ outcome: "paused", finishedAt: "2026-08-05T00:00:00.000Z", pauseReason: "Expected confirmation was missing." }), false);
  assert.doesNotMatch(describeReceipt({ outcome: "paused", finishedAt: "2026-08-05T00:00:00.000Z", pauseReason: "Expected confirmation was missing." }), /Expected confirmation/);
  assert.match(describePauseReason("Expected confirmation was missing."), /could not be verified/i);
});

test("turns stable pause codes into a user-safe explanation", () => {
  assert.match(describeReceipt({ outcome: "paused", finishedAt: "2026-08-05T00:00:00.000Z", pauseReason: "changed-page" }), /expected page control changed/i);
  assert.match(describeReceipt({ outcome: "paused", finishedAt: "2026-08-05T00:00:00.000Z", pauseReason: "slow-network" }), /did not arrive in time/i);
});
