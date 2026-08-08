import assert from "node:assert/strict";
import test from "node:test";
import { canRunDemo, canStartDemoRun, isConsentableWebOrigin } from "./run-eligibility";

test("permits only the approved local report fixture", () => {
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", ["http://localhost:3000"]), true);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports/other", ["http://localhost:3000"]), false);
  assert.equal(canRunDemo("https://reports.example/demo/reports", ["https://reports.example"]), false);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", []), false);
});

test("accepts HTTPS or explicit local HTTP origins", () => {
  assert.equal(isConsentableWebOrigin("https://reports.example/workspace"), true);
  assert.equal(isConsentableWebOrigin("http://localhost:3000/demo/reports"), true);
  assert.equal(isConsentableWebOrigin("http://reports.example/workspace"), false);
});

test("requires a fresh explicit approval before the local run", () => {
  const url = "http://localhost:3000/demo/reports";
  assert.equal(canStartDemoRun(url, ["http://localhost:3000"], false), false);
  assert.equal(canStartDemoRun(url, ["http://localhost:3000"], true), true);
});
