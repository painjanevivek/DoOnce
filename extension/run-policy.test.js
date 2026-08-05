/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { canRunDemo, isConsentableWebOrigin } = require("./run-policy.js");

test("permits only the consented local report fixture", () => {
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", ["http://localhost:3000"]), true);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports/other", ["http://localhost:3000"]), false);
  assert.equal(canRunDemo("https://reports.example/demo/reports", ["https://reports.example"]), false);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", []), false);
  assert.equal(canRunDemo("ftp://localhost/demo/reports", ["ftp://localhost"]), false);
});

test("permits consent only for HTTPS or explicit local HTTP origins", () => {
  assert.equal(isConsentableWebOrigin("https://reports.example/workspace"), true);
  assert.equal(isConsentableWebOrigin("http://localhost:3000/demo/reports"), true);
  assert.equal(isConsentableWebOrigin("http://127.0.0.1:3000/demo/reports"), true);
  assert.equal(isConsentableWebOrigin("http://reports.example/workspace"), false);
  assert.equal(isConsentableWebOrigin("ftp://localhost/demo/reports"), false);
});
