import assert from "node:assert/strict";
import test from "node:test";
import { describePauseReason, describeReceipt, isReceipt } from "./receipt-view";

test("describes a completed local receipt without page data", () => {
  const receipt = { outcome: "completed", finishedAt: "2026-08-05T00:00:00.000Z" };
  assert.equal(isReceipt(receipt), true);
  assert.match(describeReceipt(receipt), /completed/);
  assert.doesNotMatch(describeReceipt(receipt), /origin|selector|value/i);
});

test("rejects malformed receipts and unrecognized pause reasons", () => {
  assert.equal(isReceipt({ outcome: "paused", finishedAt: "not-a-date", pauseReason: "changed page" }), false);
  assert.doesNotMatch(describeReceipt({ outcome: "paused", finishedAt: "2026-08-05T00:00:00.000Z", pauseReason: "Expected confirmation was missing." }), /Expected confirmation/);
  assert.match(describePauseReason("Expected confirmation was missing."), /could not be verified/i);
});
