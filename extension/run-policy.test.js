/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { canRunDemo } = require("./run-policy.js");

test("permits only the consented local report fixture", () => {
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", ["http://localhost:3000"]), true);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports/other", ["http://localhost:3000"]), false);
  assert.equal(canRunDemo("https://reports.example/demo/reports", ["https://reports.example"]), false);
  assert.equal(canRunDemo("http://localhost:3000/demo/reports", []), false);
});
