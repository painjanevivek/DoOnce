import assert from "node:assert/strict";
import test from "node:test";
import { isRecording, removeOriginData, setRecording } from "./recording-state";

test("pausing and resuming changes only the selected origin", () => {
  const initial = ["https://reports.example", "https://other.example"];
  const paused = setRecording(initial, "https://reports.example", false);
  assert.equal(isRecording(paused, "https://reports.example"), false);
  assert.equal(isRecording(paused, "https://other.example"), true);
  const resumed = setRecording(paused, "https://reports.example", true);
  assert.equal(isRecording(resumed, "https://reports.example"), true);
  assert.equal(new Set(resumed).size, resumed.length);
});

test("removing approval clears only local data for the selected origin", () => {
  const records = [{ origin: "https://reports.example", id: "one" }, { origin: "https://other.example", id: "two" }];
  assert.deepEqual(removeOriginData(records, "https://reports.example"), [{ origin: "https://other.example", id: "two" }]);
  assert.deepEqual(removeOriginData(undefined, "https://reports.example"), []);
});
