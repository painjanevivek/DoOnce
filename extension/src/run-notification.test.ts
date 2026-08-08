import assert from "node:assert/strict";
import test from "node:test";
import { createRunNotification, describeRunNotification } from "./run-notification";

test("uses fixed text for completed and paused run notifications", () => {
  const completed = describeRunNotification({ outcome: "completed" });
  const paused = describeRunNotification({ outcome: "paused", reasonCode: "changed-page", reason: "Account page for Jane Doe" });
  assert.match(completed.message, /verified/i);
  assert.match(paused.message, /expected page control changed/i);
  assert.doesNotMatch(JSON.stringify(paused), /Jane|Account/i);
});

test("creates one basic notification without raw run data", async () => {
  const calls: unknown[][] = [];
  const notifications = { create: async (...args: unknown[]) => { calls.push(args); } };
  await createRunNotification(notifications, { outcome: "paused", reasonCode: "slow-network", reason: "Jane Doe account page" }, "chrome-extension://id/notification-icon.svg", "run-123");
  assert.equal(calls[0]?.[0], "run-123");
  assert.match(JSON.stringify(calls[0]), /did not arrive/i);
  assert.doesNotMatch(JSON.stringify(calls[0]), /Jane|account page/i);
});
