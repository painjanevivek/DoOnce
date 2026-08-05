/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { isRecording, setRecording } = require("./recording-state.js");

test("pausing and resuming changes only the selected origin", () => {
  const initial = ["https://reports.example", "https://other.example"];
  const paused = setRecording(initial, "https://reports.example", false);
  assert.equal(isRecording(paused, "https://reports.example"), false);
  assert.equal(isRecording(paused, "https://other.example"), true);

  const resumed = setRecording(paused, "https://reports.example", true);
  assert.equal(isRecording(resumed, "https://reports.example"), true);
  assert.equal(new Set(resumed).size, resumed.length);
});
