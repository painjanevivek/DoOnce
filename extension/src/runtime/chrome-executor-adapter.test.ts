import assert from "node:assert/strict";
import test from "node:test";
import { downloadMatchesDomain, isAllowedExtensionUrl } from "./chrome-executor-adapter";

test("requires an exact approved origin before extension execution", () => {
  assert.equal(isAllowedExtensionUrl("https://reports.example.test/export", ["reports.example.test"]), true);
  assert.equal(isAllowedExtensionUrl("https://cdn.reports.example.test/export", ["reports.example.test"]), false);
  assert.equal(isAllowedExtensionUrl("http://reports.example.test/export", ["reports.example.test"]), false);
  assert.equal(isAllowedExtensionUrl("http://127.0.0.1/demo", ["127.0.0.1"]), true);
});

test("correlates a download with the initiating action domain", () => {
  assert.equal(downloadMatchesDomain({ url: "https://reports.example.test/export.csv", finalUrl: "https://reports.example.test/export.csv", referrer: "https://reports.example.test/reports" }, "reports.example.test"), true);
  assert.equal(downloadMatchesDomain({ url: "https://other.example.test/background.csv", finalUrl: "https://other.example.test/background.csv", referrer: "https://other.example.test" }, "reports.example.test"), false);
});
