import assert from "node:assert/strict";
import test from "node:test";
import { parseCaptureImport } from "./contracts";

test("imports capture v2 actions", () => {
  const result = parseCaptureImport({
    format: "doonce.capture.v2",
    recordedAt: "2026-08-09T00:00:00.000Z",
    actions: [{ origin: "http://localhost:3000", path: "/demo/reports", eventKind: "click", selector: "#download-csv", actionHint: "download" }],
  });
  assert.equal(result?.migratedFromLegacy, false);
  assert.equal(result?.actions[0]?.path, "/demo/reports");
});

test("imports a legacy v1 capture without writing the legacy shape", () => {
  const result = parseCaptureImport({
    format: "doonce.safe-capture.v1",
    summaries: [{ origin: "http://localhost:3000", eventKind: "click", selector: "#download-csv" }],
  });
  assert.deepEqual(result, {
    format: "doonce.capture.v2",
    migratedFromLegacy: true,
    actions: [{ origin: "http://localhost:3000", path: "/", eventKind: "click", selector: "#download-csv" }],
  });
});
