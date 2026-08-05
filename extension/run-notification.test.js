/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { createRunNotification, describeRunNotification } = require("./run-notification.js");

test("uses fixed, privacy-safe text for a verified local run notification", () => {
  const notification = describeRunNotification({ outcome: "completed", origin: "https://private.example", reason: "do not show" });
  assert.match(notification.title, /completed/i);
  assert.match(notification.message, /verified/i);
  assert.doesNotMatch(`${notification.title} ${notification.message}`, /private|example|do not show/i);
});

test("uses fixed pause messages and never reflects raw run errors", () => {
  const notification = describeRunNotification({ outcome: "paused", reasonCode: "changed-page", reason: "Account page for Jane Doe" });
  assert.match(notification.title, /paused safely/i);
  assert.match(notification.message, /expected page control changed/i);
  assert.doesNotMatch(`${notification.title} ${notification.message}`, /Jane|Account/i);
  assert.match(describeRunNotification({ outcome: "paused", reasonCode: "unknown" }).message, /could not be verified/i);
});

test("creates one basic notification without passing through raw run data", async () => {
  const calls = [];
  const notifications = { create: async (...args) => { calls.push(args); } };
  await createRunNotification(notifications, { outcome: "paused", reasonCode: "slow-network", reason: "Jane Doe account page" }, "chrome-extension://id/notification-icon.svg", "run-123");

  assert.deepEqual(calls[0]?.[0], "run-123");
  assert.deepEqual(calls[0]?.[1].type, "basic");
  assert.match(calls[0]?.[1].message, /did not arrive/i);
  assert.doesNotMatch(JSON.stringify(calls[0]), /Jane|account page/i);
});
