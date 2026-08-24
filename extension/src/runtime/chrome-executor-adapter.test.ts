import assert from "node:assert/strict";
import test from "node:test";
import { downloadMatchesAction, isAllowedExtensionUrl } from "./chrome-executor-adapter";

test("requires an exact approved origin before extension execution", () => {
  assert.equal(isAllowedExtensionUrl("https://reports.example.test/export", ["reports.example.test"]), true);
  assert.equal(isAllowedExtensionUrl("https://cdn.reports.example.test/export", ["reports.example.test"]), false);
  assert.equal(isAllowedExtensionUrl("http://reports.example.test/export", ["reports.example.test"]), false);
  assert.equal(isAllowedExtensionUrl("http://127.0.0.1/demo", ["127.0.0.1"]), true);
  assert.equal(isAllowedExtensionUrl("https://reports.example.test:8443/export", ["reports.example.test"], "https://reports.example.test"), false);
});

test("correlates a download with the initiating page and action window", () => {
  const startedAt = Date.parse("2026-08-24T10:00:00.000Z");
  assert.equal(downloadMatchesAction({ url: "https://reports.example.test/export.csv", finalUrl: "https://reports.example.test/export.csv", referrer: "https://reports.example.test/reports", startTime: "2026-08-24T10:00:00.100Z" }, "reports.example.test", "https://reports.example.test/reports?week=34", startedAt), true);
  assert.equal(downloadMatchesAction({ url: "https://reports.example.test/background.csv", finalUrl: "https://reports.example.test/background.csv", referrer: "https://reports.example.test/dashboard", startTime: "2026-08-24T10:00:00.100Z" }, "reports.example.test", "https://reports.example.test/reports", startedAt), false);
  assert.equal(downloadMatchesAction({ url: "https://reports.example.test/old.csv", finalUrl: "https://reports.example.test/old.csv", referrer: "https://reports.example.test/reports", startTime: "2026-08-24T09:59:55.000Z" }, "reports.example.test", "https://reports.example.test/reports", startedAt), false);
  assert.equal(downloadMatchesAction({ url: "https://other.example.test/background.csv", finalUrl: "https://other.example.test/background.csv", referrer: "https://reports.example.test/reports", startTime: "2026-08-24T10:00:00.100Z" }, "reports.example.test", "https://reports.example.test/reports", startedAt), false);
  assert.equal(downloadMatchesAction({ url: "https://reports.example.test:8443/export.csv", finalUrl: "https://reports.example.test:8443/export.csv", referrer: "https://reports.example.test/reports", startTime: "2026-08-24T10:00:00.100Z" }, "reports.example.test", "https://reports.example.test/reports", startedAt, "https://reports.example.test"), false);
});
